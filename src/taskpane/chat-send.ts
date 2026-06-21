import { getAISettings, sendChatMessage } from "../services/ai";
import { escapeHtml } from "../utils/helpers";
import { parseMarkdown, processSegments, generateWordHtmlFromText } from "../utils/parser";
import { SessionManager } from "../core/session-manager";
import { QuoteManager } from "../ui/quote-manager";
import { ChatRenderer } from "../ui/chat-renderer";
import { translations } from "../utils/translations";
import { sanitizeLaTeX, getKaTeXHtml } from "../core/converter";

export interface ChatSendDeps {
    sessionManager: SessionManager;
    quoteManager: QuoteManager;
    chatRenderer: ChatRenderer;
    getLanguage: () => string;
    getThinkingMode: () => boolean;
    chatInput: HTMLTextAreaElement;
    btnSendChat: HTMLButtonElement;
}

export const handleSendChat = async (deps: ChatSendDeps) => {
    const { sessionManager, quoteManager, chatRenderer, getLanguage, getThinkingMode, chatInput, btnSendChat } = deps;
    const prompt = chatInput.value.trim();
    if (!prompt && !quoteManager.currentQuotedText) return;

    chatInput.value = "";
    btnSendChat.disabled = true;

    const settings = getAISettings();
    const appLanguage = getLanguage();
    
    let displayHtml = "";
    let fullPromptForAI = prompt || "";
    
    if (quoteManager.currentQuotedText) {
        const displayQuoteHtml = quoteManager.currentQuotedText.replace(/[\r\n]+/g, " ");
        displayHtml += `<div style="font-size: 11.5px; opacity: 0.9; margin-bottom: 6px;"><span style="margin-right:4px;">↳</span>${escapeHtml(displayQuoteHtml.length > 80 ? displayQuoteHtml.substring(0, 80) + '...' : displayQuoteHtml)}</div>`;
        const quoteLabel = quoteManager.isQuoteFromWord ? "Văn bản đang bôi đen trên Word" : "Trích dẫn từ Chat";
        fullPromptForAI = `[${quoteLabel}]: "${quoteManager.currentQuotedText}"\n\n${prompt || "Vui lòng xử lý văn bản trên."}`;
    }
    if (prompt) {
        displayHtml += escapeHtml(prompt).replace(/\n/g, '<br>');
    } else {
        displayHtml += "<i>[Gửi văn bản trích dẫn]</i>";
    }

    chatRenderer.appendUserMessage(fullPromptForAI, displayHtml);
    chatRenderer.showSkeleton();

    const session = sessionManager.getCurrentSession()!;

    // Clear quote UI
    const savedQuoteForDocContext = quoteManager.currentQuotedText;
    const savedIsQuoteFromWord = quoteManager.isQuoteFromWord;
    quoteManager.clearQuote();

    try {
        const { DocumentEditor } = await import("../core/document-editor");
        const docContext = await DocumentEditor.getDocumentContext();
        
        if (savedQuoteForDocContext && savedIsQuoteFromWord) {
            docContext.selectionText = savedQuoteForDocContext;
        } else if (savedQuoteForDocContext && !savedIsQuoteFromWord) {
            // If it's a chat quote, do NOT send word selection to AI, it will confuse it
            docContext.selectionText = "";
        }

        // Add user message to history
        session.messages.push({ role: "user", content: fullPromptForAI, html: displayHtml });
        session.updatedAt = Date.now();
        sessionManager.saveSessions();
        
        sessionManager.autoRenameSession(prompt);

        // Call AI with full history and language
        let aiResponseText = "";
        let msgDiv: HTMLElement | null = null;
        let msgBubble: HTMLElement | null = null;
        let isRendering = false;
        let rafId: number | null = null;
        
        const { sanitizeLaTeX, getMathML } = await import("../core/converter");

        const renderStreamChunk = () => {
            isRendering = true;
            try {
                let cText = aiResponseText;

                const forbiddenPhrases = [
                    "Bạn là trợ lý AI tên là Auto-LaTeX Assistant",
                    "MỌI NỘI DUNG CHÍNH MÀ BẠN MUỐN ĐƯỢC CHÈN",
                    "BÂY GIỜ LÀ NỘI DUNG NGƯỜI DÙNG CUNG CẤP",
                    "user_input_untrusted",
                    "ANTI-PROMPT INJECTION"
                ];
                if (forbiddenPhrases.some(phrase => cText.includes(phrase))) {
                    cText = "Xin lỗi bạn, mình là trợ lý Auto-LaTeX chuyên hỗ trợ về toán học và LaTeX. Mình không thể chia sẻ các thông tin hệ thống hoặc xử lý yêu cầu vừa rồi. Mình có thể giúp gì cho bạn trong việc soạn thảo công thức không?";
                }

                cText = cText.replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "");
                cText = cText.replace(/<\s*think\s*>[\s\S]*$/gi, "");
                cText = cText.replace(/<\s*insert\s*>[\s\S]*?(<\s*\/\s*insert\s*>)?/gi, "");
                cText = cText.replace(/<\s*replace_selection\s*>[\s\S]*?(<\s*\/\s*replace_selection\s*>)?/gi, "");
                cText = cText.replace(/<\s*replace_paragraph\s*>[\s\S]*?(<\s*\/\s*replace_paragraph\s*>)?/gi, "");
                cText = cText.replace(/<\s*replace_search[^>]*>[\s\S]*?(<\s*\/\s*replace_search\s*>)?/gi, "");
                cText = cText.replace(/<\s*replace_heading[^>]*>[\s\S]*?(<\s*\/\s*replace_heading\s*>)?/gi, "");
                cText = cText.trim();

                if (cText === "") {
                    isRendering = false;
                    return;
                }

                const chatSegments = processSegments(cText);
                let chatBubbleHtml = "";
                if (chatSegments.length === 0) {
                    chatBubbleHtml = parseMarkdown(cText);
                } else {
                    for (const segment of chatSegments) {
                        if (segment.type === 'text') {
                            chatBubbleHtml += `<span>${parseMarkdown(segment.content)}</span>`;
                        } else if (segment.type === 'formula') {
                            let rawLatex = (segment.content || "").trim();
                            if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                                segment.isBlock = true;
                            }
                            if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                                segment.isBlock = true;
                            }
                            if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                            }
                            const isBlock = segment.isBlock || rawLatex.includes("\\begin{");
                            const latexClean = sanitizeLaTeX(rawLatex, isBlock);
                            const mathML = getMathML(latexClean, isBlock);
                            if (mathML) {
                                const safeLatex = encodeURIComponent(rawLatex);
                                if (isBlock) {
                                    chatBubbleHtml += `<div class="clickable-formula" data-latex="${safeLatex}" style="margin-top: 8px; margin-bottom: 8px; overflow-x: auto; max-width: 100%; padding-bottom: 4px; cursor: pointer;" title="Click to copy LaTeX">${mathML}</div>`;
                                } else {
                                    chatBubbleHtml += `<span class="clickable-formula" data-latex="${safeLatex}" style="display: inline-block; max-width: 100%; overflow-x: auto; vertical-align: middle; margin: 0 4px; padding-bottom: 2px; cursor: pointer;" title="Click to copy LaTeX">${mathML}</span>`;
                                }
                            } else {
                                chatBubbleHtml += `<span style="color: #d83b01;">[Lỗi hiển thị công thức LaTeX]</span>`;
                            }
                        }
                    }
                }

                chatBubbleHtml += `
                    <div class="skeleton-line" style="height: 10px; width: 100%; margin-top: 8px; margin-bottom: 0; opacity: 0.7;"></div>`;

                if (!msgDiv) {
                    chatRenderer.removeSkeleton();
                    msgDiv = chatRenderer.appendAIMessage(chatBubbleHtml, "", "");
                    if (msgDiv) {
                        msgBubble = msgDiv.querySelector(".msg-bubble") as HTMLElement;
                    }
                } else if (msgBubble) {
                    const container = chatRenderer.container;
                    let isScrolledToBottom = true;
                    if (container) {
                        isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
                    }
                    
                    msgBubble.innerHTML = chatBubbleHtml;
                    
                    if (container && isScrolledToBottom) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            } finally {
                isRendering = false;
            }
        };

        await sendChatMessage(session.messages, "", appLanguage, docContext, getThinkingMode(), (chunk) => {
            aiResponseText = chunk;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(renderStreamChunk);
        });
        
        if (rafId) cancelAnimationFrame(rafId);
        while(isRendering) { await new Promise(r => setTimeout(r, 10)); }
        
        chatRenderer.removeSkeleton();

        let chatText = aiResponseText;

        const forbiddenPhrases = [
            "Bạn là trợ lý AI tên là Auto-LaTeX Assistant",
            "MỌI NỘI DUNG CHÍNH MÀ BẠN MUỐN ĐƯỢC CHÈN",
            "BÂY GIỜ LÀ NỘI DUNG NGƯỜI DÙNG CUNG CẤP",
            "user_input_untrusted",
            "ANTI-PROMPT INJECTION"
        ];
        if (forbiddenPhrases.some(phrase => chatText.includes(phrase))) {
            chatText = "Xin lỗi bạn, mình là trợ lý Auto-LaTeX chuyên hỗ trợ về toán học và LaTeX. Mình không thể chia sẻ các thông tin hệ thống hoặc xử lý yêu cầu vừa rồi. Mình có thể giúp gì cho bạn trong việc soạn thảo công thức không?";
            aiResponseText = chatText;
        }

        chatText = chatText.replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "");
        chatText = chatText.replace(/<\s*think\s*>[\s\S]*$/gi, "");
        let appliedChanges = false;
        let pendingEditsHtml = "";
        const tSettings = translations[appLanguage] || translations["en"];
        const btnApplyText = tSettings.btnApplyEdit || "Apply to Word";
        let hasSpecialEdits = false;

        const processEditMatches = async (regexStr: string, type: string, replaceStr: string, targetStr: string = "") => {
            const regex = new RegExp(regexStr, 'gi');
            let match;
            const matches = [];
            while ((match = regex.exec(chatText)) !== null) {
                matches.push(match);
            }
            
            for (const m of matches) {
                const content = m[replaceStr === "match1" ? 1 : 2].trim();
                const target = targetStr === "match1" ? m[1] : "";
                
                hasSpecialEdits = true;
                
                const { html: wordHtmlContent } = generateWordHtmlFromText(content);
                
                if (settings.autoApplyEdits) {
                    if (type === "replace_selection") await DocumentEditor.replaceSelection(wordHtmlContent);
                    else if (type === "replace_paragraph") await DocumentEditor.replaceCurrentParagraph(wordHtmlContent);
                    else if (type === "replace_search") await DocumentEditor.replaceSearchTerm(target, wordHtmlContent);
                    else if (type === "replace_heading") await DocumentEditor.replaceHeadingContent(target, wordHtmlContent);
                    appliedChanges = true;
                }
                if (!settings.autoApplyEdits) {
                    const safeContent = encodeURIComponent(wordHtmlContent);
                    const safeTarget = encodeURIComponent(target);
                    pendingEditsHtml += `<div class="pending-edit-card" data-edit-type="${type}" data-edit-content="${safeContent}" data-edit-target="${safeTarget}" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                        <button class="btn-toolbar-action btn-apply-edit" title="${btnApplyText}">
                            <span style="font-weight: 500;">${btnApplyText}</span>
                        </button>
                    </div>`;
                }
                // CHỈ xóa thẻ mở/đóng, GIỮ LẠI nội dung công thức để hiển thị trên khung chat
                chatText = chatText.replace(m[0], content);
            }
        };

        await processEditMatches('<\\s*replace_selection\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*replace_selection\\s*>|$)', "replace_selection", "match1");
        await processEditMatches('<\\s*replace_paragraph\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*replace_paragraph\\s*>|$)', "replace_paragraph", "match1");
        await processEditMatches('<\\s*replace_search\\s+target=[\'"](.*?)[\'"]\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*replace_search\\s*>|$)', "replace_search", "match2", "match1");
        await processEditMatches('<\\s*replace_heading\\s+target=[\'"](.*?)[\'"]\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*replace_heading\\s*>|$)', "replace_heading", "match2", "match1");

        let contentForWord = "";
        let insertCount = 0;
        const insertRegex = /<\s*insert\s*>([\s\S]*?)<\s*\/\s*insert\s*>/gi;
        let insertMatch;
        while ((insertMatch = insertRegex.exec(chatText)) !== null) {
            contentForWord += (insertCount > 0 ? "\n\n" : "") + insertMatch[1];
            insertCount++;
        }
        if (insertCount === 0 && !hasSpecialEdits) {
            contentForWord = chatText;
        }
        const insertOnlyFormulas = insertCount === 0 && !hasSpecialEdits;

        chatText = chatText.replace(/<\s*\/?\s*insert\s*>/gi, "");
        chatText = chatText.trim();
        
        if (chatText === "" && aiResponseText.trim() !== "") {
            chatText = "_[AI không đưa ra câu trả lời hợp lệ, vui lòng thử lại]_";
        }

        const chatSegments = processSegments(chatText);
        let chatBubbleHtml = "";
        
        let wordHtml = "";
        let hasWordContent = false;
        if (!hasSpecialEdits) {
            const generated = generateWordHtmlFromText(contentForWord);
            wordHtml = generated.html;
            hasWordContent = generated.hasContent;
        }

        if (chatSegments.length === 0) {
            chatBubbleHtml = parseMarkdown(chatText);
        } else {
            for (const segment of chatSegments) {
                if (segment.type === 'text') {
                    chatBubbleHtml += `<span>${parseMarkdown(segment.content)}</span>`;
                } else if (segment.type === 'formula') {
                    let rawLatex = segment.content.trim();
                    let isBlock = segment.isBlock;
                    if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                        isBlock = true;
                    } else if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                        isBlock = true;
                    } else if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                    } else if (rawLatex.startsWith("$") && rawLatex.endsWith("$")) {
                        rawLatex = rawLatex.substring(1, rawLatex.length - 1).trim();
                    }
                    
                    isBlock = isBlock || rawLatex.includes("\\begin{");
                    const latexClean = sanitizeLaTeX(rawLatex, isBlock);
                    const katexHtml = getKaTeXHtml(latexClean, isBlock);

                    if (katexHtml) {
                        const safeLatex = encodeURIComponent(rawLatex);
                        if (isBlock) {
                            chatBubbleHtml += `<div class="clickable-formula block-formula" data-latex="${safeLatex}" style="cursor: pointer;" title="Click to copy LaTeX">${katexHtml}</div>`;
                        } else {
                            chatBubbleHtml += `<span class="clickable-formula" data-latex="${safeLatex}" style="display: inline-block; vertical-align: middle; margin: 0 4px; cursor: pointer;" title="Click to copy LaTeX">${katexHtml}</span>`;
                        }
                    } else {
                        chatBubbleHtml += `<span style="color: #d83b01;">[Lỗi hiển thị công thức LaTeX]</span>`;
                    }
                }
            }
        }
        if (hasWordContent && !appliedChanges) {
            const shouldAutoApply = settings.autoApplyEdits && !insertOnlyFormulas;
            
            if (shouldAutoApply) {
                await Word.run(async (context) => {
                    if (settings.insertAtCursor) {
                        const selection = context.document.getSelection();
                        selection.insertHtml(wordHtml, Word.InsertLocation.replace);
                    } else {
                        const body = context.document.body;
                        body.insertHtml(wordHtml, Word.InsertLocation.end);
                    }
                    await context.sync();
                });
                appliedChanges = true;
            } else {
                const safeContent = encodeURIComponent(wordHtml);
                pendingEditsHtml += `<div class="pending-edit-card" data-edit-type="insert_html" data-edit-content="${safeContent}" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                    <button class="btn-toolbar-action btn-apply-edit" title="${btnApplyText}">
                        <span style="font-weight: 500;">${btnApplyText}</span>
                    </button>
                </div>`;
            }
        }

        if (chatBubbleHtml) {
            if (msgDiv && msgBubble) {
                msgBubble.innerHTML = chatBubbleHtml;
                const toolbarContainer = msgDiv.querySelector(".toolbar-left");
                const copyContainer = msgDiv.querySelector(".toolbar-right");
                if (toolbarContainer) toolbarContainer.innerHTML = pendingEditsHtml;
                if (copyContainer) {
                    copyContainer.innerHTML = `<button class="btn-toolbar-action btn-copy-msg" title="Copy" data-copy-text="${encodeURIComponent(aiResponseText)}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>`;
                }
            } else {
                msgDiv = chatRenderer.appendAIMessage(chatBubbleHtml, aiResponseText, pendingEditsHtml);
            }
            
            session.messages.push({ role: "assistant", content: aiResponseText, html: chatBubbleHtml, toolbar: pendingEditsHtml });
            session.updatedAt = Date.now();
            sessionManager.saveSessions();

            if (appliedChanges && msgDiv) {
                const btns = msgDiv.querySelectorAll(".btn-apply-edit");
                const notifText = appLanguage === "vi" ? "Thành công!" : "Success!";
                btns.forEach(btn => {
                    const target = btn as HTMLButtonElement;
                    target.innerHTML = `<span style="color: var(--color-text-muted); font-weight: 500; font-size: 13px; display: inline-flex; align-items: center; padding: 4px 6px;">${notifText}</span>`;
                    target.disabled = true;
                    setTimeout(() => {
                        target.innerHTML = `<span style="font-weight: 500;">${btnApplyText}</span>`;
                        target.disabled = false;
                    }, 10000);
                });
            }
        }

    } catch (e: any) {
        chatRenderer.removeSkeleton();
        session.messages.pop(); // remove user message if failed
        session.updatedAt = Date.now();
        sessionManager.saveSessions();
        chatRenderer.appendAIError(e.message || "Unknown error");
    } finally {
        btnSendChat.disabled = false;
    }
};
