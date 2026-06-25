import { getAISettings, sendChatMessage } from "../services/ai";
import { escapeHtml } from "../utils/helpers";
import { parseMarkdown, processSegments, generateWordHtmlFromText, renderInlineMathPreview } from "../utils/parser";
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
    isDialog?: boolean;
    onStreamingStateChange?: (isStreaming: boolean) => void;
}

const renderFormula = (rawLatex: string, isBlock: boolean) => {
    const latexClean = sanitizeLaTeX(rawLatex, isBlock);
    const katexHtml = getKaTeXHtml(latexClean, isBlock);
    if (!katexHtml) return `<span style="color: #d83b01;">[Lỗi hiển thị công thức LaTeX]</span>`;
    const safeLatex = encodeURIComponent(rawLatex);
    if (isBlock) {
        return `<div class="clickable-formula block-formula" data-latex="${safeLatex}" style="margin-top: 8px; margin-bottom: 8px; overflow-x: auto; max-width: 100%; padding-bottom: 4px; cursor: pointer;" title="Click to copy LaTeX">${katexHtml}</div>`;
    } else {
        return `<span class="clickable-formula" data-latex="${safeLatex}" style="display: inline-block; max-width: 100%; overflow-x: auto; vertical-align: middle; margin: 0 4px; padding-bottom: 2px; cursor: pointer;" title="Click to copy LaTeX">${katexHtml}</span>`;
    }
};

export const handleSendChat = async (deps: ChatSendDeps) => {
    const { sessionManager, quoteManager, chatRenderer, getLanguage, getThinkingMode, chatInput, btnSendChat, isDialog, onStreamingStateChange } = deps;
    if (btnSendChat.disabled) return;
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
        const fromWordStr = quoteManager.isQuoteFromWord ? "true" : "false";
        const msgTypeStr = quoteManager.quotedMsgType || "";
        const msgIdStr = quoteManager.quotedMsgId || "";
        const safeOriginalQuote = encodeURIComponent(quoteManager.currentQuotedText);
        const renderedQuoteHtml = renderInlineMathPreview(displayQuoteHtml);
        displayHtml += `<div class="quoted-message-block" data-from-word="${fromWordStr}" data-msg-type="${msgTypeStr}" data-msg-id="${msgIdStr}" data-original-quote="${safeOriginalQuote}" title="Click to view context"><span style="margin-right:4px;">↳</span>${renderedQuoteHtml}</div>`;
        const quoteLabel = quoteManager.isQuoteFromWord ? "Văn bản đang bôi đen trên Word" : "Trích dẫn từ Chat";
        fullPromptForAI = `[${quoteLabel}]: "${quoteManager.currentQuotedText}"\n\n${prompt || "Vui lòng xử lý văn bản trên."}`;
    }
    if (prompt) {
        displayHtml += escapeHtml(prompt).replace(/\n/g, '<br>');
    } else {
        displayHtml += "<i>[Gửi văn bản trích dẫn]</i>";
    }

    chatRenderer.appendUserMessage(fullPromptForAI, displayHtml);

    const session = sessionManager.getCurrentSession();
    if (!session) {
        btnSendChat.disabled = false;
        return;
    }

    const savedQuoteForDocContext = quoteManager.currentQuotedText;
    const savedIsQuoteFromWord = quoteManager.isQuoteFromWord;
    
    let throttleTimer: any = null;

    try {
        if (onStreamingStateChange) onStreamingStateChange(true);
        
        let docContext = { selectionText: "", paragraphText: "" };
        if (!isDialog) {
            const { DocumentEditor } = await import("../core/document-editor");
            docContext = await DocumentEditor.getDocumentContext();
        }
        
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
        
        quoteManager.clearQuote();
        
        const renameText = prompt || (savedQuoteForDocContext ? savedQuoteForDocContext.substring(0, 50) : "");
        if (renameText) sessionManager.autoRenameSession(renameText);

        chatRenderer.showSkeleton();

        // Call AI with full history and language
        let aiResponseText = "";
        let msgDiv: HTMLElement | null = null;
        let msgBubble: HTMLElement | null = null;
        let isRendering = false;
        let lastRenderTime = 0;

        const maskIncompleteMathAndTags = (text: string) => {
            let masked = text;
            
            const lastOpenBracket = masked.lastIndexOf("<");
            if (lastOpenBracket !== -1) {
                const closeBracket = masked.indexOf(">", lastOpenBracket);
                if (closeBracket === -1) {
                    if (/<\/?(?:[a-zA-Z_]+)(?:\s+[^>]*)?$/.test(masked.substring(lastOpenBracket))) {
                         masked = masked.substring(0, lastOpenBracket);
                    }
                }
            }
            
            const doubleSegments = masked.split("$$");
            if (doubleSegments.length % 2 === 0) {
                masked = doubleSegments.slice(0, -1).join("$$");
            }
            
            const textWithoutDouble = masked.replace(/\$\$[\s\S]*?\$\$/g, "");
            const singleSegments = textWithoutDouble.split("$");
            if (singleSegments.length % 2 === 0) {
                let lastSingleDollar = -1;
                for (let i = masked.length - 1; i >= 0; i--) {
                    if (masked[i] === '$') {
                        const isPartOfDouble = 
                            (i > 0 && masked[i - 1] === '$') || 
                            (i < masked.length - 1 && masked[i + 1] === '$');
                        if (!isPartOfDouble) {
                            lastSingleDollar = i;
                            break;
                        }
                    }
                }
                if (lastSingleDollar !== -1) {
                    masked = masked.substring(0, lastSingleDollar);
                }
            }
            
            const lastOpenBlock = masked.lastIndexOf("\\[");
            if (lastOpenBlock !== -1) {
                const closeBlock = masked.indexOf("\\]", lastOpenBlock);
                if (closeBlock === -1) masked = masked.substring(0, lastOpenBlock);
            }
            
            const lastOpenInline = masked.lastIndexOf("\\(");
            if (lastOpenInline !== -1) {
                const closeInline = masked.indexOf("\\)", lastOpenInline);
                if (closeInline === -1) masked = masked.substring(0, lastOpenInline);
            }
            
            return masked;
        };

        const renderStreamChunk = () => {
            if (isRendering) return;
            isRendering = true;
            try {
                let cText = aiResponseText;

                cText = cText.replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "");
                cText = cText.replace(/<\s*think\s*>[\s\S]*$/gi, "");
                cText = cText.replace(/<\s*\/?\s*insert\s*>/gi, "");
                cText = cText.replace(/<\s*\/?\s*replace_selection\s*>/gi, "");
                cText = cText.replace(/<\s*\/?\s*replace_paragraph\s*>/gi, "");
                cText = cText.replace(/<\s*\/?\s*replace_search[^>]*>/gi, "");
                cText = cText.replace(/<\s*\/?\s*replace_heading[^>]*>/gi, "");
                cText = cText.replace(/<\s*\/?\s*target\s*>/gi, "");
                cText = cText.replace(/<\s*\/?\s*content\s*>/gi, "");
                
                cText = cText.replace(/<\/?italic[^>]*>/gi, "");
                cText = cText.replace(/<\/?(?:inline_formula|block_formula|formula)[^>]*>/gi, "");
                
                cText = maskIncompleteMathAndTags(cText);

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
                            chatBubbleHtml += renderFormula(rawLatex, isBlock);
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
            const now = Date.now();
            if (now - lastRenderTime > 80) {
                if (throttleTimer) clearTimeout(throttleTimer);
                lastRenderTime = now;
                renderStreamChunk();
            } else if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    throttleTimer = null;
                    lastRenderTime = Date.now();
                    renderStreamChunk();
                }, 80);
            }
        });
        
        if (throttleTimer) clearTimeout(throttleTimer);
        renderStreamChunk();
        
        chatRenderer.removeSkeleton();

        let chatText = aiResponseText;

        chatText = chatText.replace(/<\s*think\s*>[\s\S]*?<\s*\/\s*think\s*>/gi, "");
        chatText = chatText.replace(/<\s*think\s*>[\s\S]*$/gi, "");
        let appliedChanges = false;
        let pendingEditsHtml = "";
        const tSettings = translations[appLanguage] || translations["en"];
        const btnApplyText = tSettings.btnApplyEdit || "Apply to Word";
        let hasSpecialEdits = false;

        const processEditMatches = async (regexStr: string, type: string, contentGroup: number, targetGroup: number = 0) => {
            const regex = new RegExp(regexStr, 'gi');
            let match;
            const matches = [];
            while ((match = regex.exec(chatText)) !== null) {
                matches.push(match);
            }
            
            for (let i = matches.length - 1; i >= 0; i--) {
                const m = matches[i];
                const content = m[contentGroup].trim();
                const target = targetGroup > 0 ? (m[targetGroup] || "") : "";
                
                hasSpecialEdits = true;
                
                const { html: wordHtmlContent } = generateWordHtmlFromText(content);
                
                if (!isDialog && settings.autoApplyEdits) {
                    const { DocumentEditor } = await import("../core/document-editor");
                    if (type === "replace_selection") await DocumentEditor.replaceSelection(wordHtmlContent);
                    else if (type === "replace_paragraph") await DocumentEditor.replaceCurrentParagraph(wordHtmlContent);
                    else if (type === "replace_search") await DocumentEditor.replaceSearchTerm(target, wordHtmlContent);
                    else if (type === "replace_heading") await DocumentEditor.replaceHeadingContent(target, wordHtmlContent);
                    appliedChanges = true;
                    
                    const successText = appLanguage === "vi" ? "Đã tự động áp dụng" : "Auto-applied";
                    pendingEditsHtml += `<div class="pending-edit-card" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                        <button class="btn-toolbar-action btn-apply-edit" disabled>
                            <span style="color: var(--color-primary); font-weight: 500;">${successText}</span>
                        </button>
                    </div>`;
                } else if (!appliedChanges) {
                    const safeContent = encodeURIComponent(wordHtmlContent);
                    const safeTarget = encodeURIComponent(target);
                    pendingEditsHtml += `<div class="pending-edit-card" data-edit-type="${type}" data-edit-content="${safeContent}" data-edit-target="${safeTarget}" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                        <button class="btn-toolbar-action btn-apply-edit" title="${btnApplyText}">
                            <span style="font-weight: 500;">${btnApplyText}</span>
                        </button>
                    </div>`;
                }
                chatText = chatText.substring(0, m.index) + content + chatText.substring(m.index + m[0].length);
            }
        };

        await processEditMatches('<\\s*replace_selection\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*replace_selection\\s*>|$)', "replace_selection", 1);
        await processEditMatches('<\\s*replace_paragraph\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*replace_paragraph\\s*>|$)', "replace_paragraph", 1);
        await processEditMatches('<\\s*replace_search\\s*>\\s*<\\s*target\\s*>([\\s\\S]*?)<\\s*\\/\\s*target\\s*>\\s*<\\s*content\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*content\\s*>|<\\s*\\/\\s*replace_search\\s*>|$)', "replace_search", 2, 1);
        await processEditMatches('<\\s*replace_heading\\s*>\\s*<\\s*target\\s*>([\\s\\S]*?)<\\s*\\/\\s*target\\s*>\\s*<\\s*content\\s*>([\\s\\S]*?)(?:<\\s*\\/\\s*content\\s*>|<\\s*\\/\\s*replace_heading\\s*>|$)', "replace_heading", 2, 1);

        let contentForWord = "";
        let insertCount = 0;
        const insertRegex = /<\s*insert\s*>([\s\S]*?)(?:<\s*\/\s*insert\s*>|$)/gi;
        let insertMatch;
        while ((insertMatch = insertRegex.exec(chatText)) !== null) {
            contentForWord += (insertCount > 0 ? "\n\n" : "") + insertMatch[1];
            insertCount++;
        }
        if (insertCount === 0 && !hasSpecialEdits) {
            contentForWord = chatText;
        }
        const isPlainResponse = insertCount === 0 && !hasSpecialEdits;

        chatText = chatText.replace(/<\s*\/?\s*insert\s*>/gi, "");
        chatText = chatText.trim();
        
        if (chatText === "" && aiResponseText.trim() !== "") {
            chatText = "_[AI không đưa ra câu trả lời hợp lệ, vui lòng thử lại]_";
        }

        const chatSegments = processSegments(chatText);
        let chatBubbleHtml = "";
        
        let wordHtml = "";
        let hasWordContent = false;
        if (contentForWord.trim() !== "") {
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
                    chatBubbleHtml += renderFormula(rawLatex, isBlock);
                }
            }
        }
        if (hasWordContent) {
            const shouldAutoApply = !isDialog && settings.autoApplyEdits && !isPlainResponse;
            
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
                
                const successText = appLanguage === "vi" ? "Đã tự động áp dụng" : "Auto-applied";
                pendingEditsHtml += `<div class="pending-edit-card" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                    <button class="btn-toolbar-action btn-apply-edit" disabled>
                        <span style="color: var(--color-primary); font-weight: 500;">${successText}</span>
                    </button>
                </div>`;
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
                // Since we already render the auto-applied button above, we don't strictly need this,
                // but we keep it to ensure any other existing buttons are disabled.
                const btns = msgDiv.querySelectorAll(".btn-apply-edit:not([disabled])");
                const notifText = appLanguage === "vi" ? "Thành công!" : "Success!";
                btns.forEach(btn => {
                    const target = btn as HTMLButtonElement;
                    target.innerHTML = `<span style="color: var(--color-text-muted); font-weight: 500; font-size: 13px; display: inline-flex; align-items: center; padding: 4px 6px;">${notifText}</span>`;
                    target.disabled = true;
                });
            }
        }

    } catch (e: any) {
        if (throttleTimer) clearTimeout(throttleTimer);
        chatRenderer.removeSkeleton();
        let userMsgIndex = -1;
        for (let i = session.messages.length - 1; i >= 0; i--) {
            if (session.messages[i].role === "user" && session.messages[i].content === fullPromptForAI) {
                userMsgIndex = i;
                break;
            }
        }
        if (userMsgIndex !== -1) {
            session.messages.splice(userMsgIndex, 1);
        }
        session.updatedAt = Date.now();
        sessionManager.saveSessions();
        chatRenderer.appendAIError(e.message || "Unknown error");
    } finally {
        if (onStreamingStateChange) onStreamingStateChange(false);
        btnSendChat.disabled = false;
    }
};
