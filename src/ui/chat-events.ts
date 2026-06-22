import { getAISettings } from "../services/ai";
import { translations } from "../utils/translations";

export const setupChatEvents = (
    chatMessages: HTMLElement | null,
    getLanguage: () => string
) => {
    if (!chatMessages) return;

    chatMessages.addEventListener("wheel", (e: WheelEvent) => {
        const target = e.target as HTMLElement;
        const scrollableContainer = target.closest(".clickable-formula, .katex-display") as HTMLElement;
        if (scrollableContainer && scrollableContainer.scrollWidth > scrollableContainer.clientWidth) {
            // Ngăn chặn cuộn dọc trang
            e.preventDefault();
            // Chuyển hướng cuộn dọc (deltaY) thành cuộn ngang
            scrollableContainer.scrollLeft += e.deltaY;
        }
    }, { passive: false });

    chatMessages.addEventListener("mousedown", (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const quotedBlock = target.closest(".quoted-message-block");
        if (quotedBlock) {
            // Ngăn chặn MỌI hành động bôi đen chữ từ khối này
            e.preventDefault();
        }
    });

    chatMessages.addEventListener("click", async (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const btnApply = target.closest(".btn-apply-edit") as HTMLButtonElement;
        
        // Tránh trigger click khi user đang bôi đen (copy text)
        const currentSelection = window.getSelection();
        if (currentSelection && currentSelection.toString().trim().length > 0) {
            return;
        }
        
        if (btnApply) {
            const card = btnApply.closest(".pending-edit-card") as HTMLElement;
            if (!card) return;
            
            const type = card.getAttribute("data-edit-type");
            const content = decodeURIComponent(card.getAttribute("data-edit-content") || "");
            const targetStr = decodeURIComponent(card.getAttribute("data-edit-target") || "");

            btnApply.innerText = "Applying...";
            btnApply.disabled = true;

            const settings = getAISettings();
            const appLanguage = getLanguage();

            try {
                const { DocumentEditor } = await import("../core/document-editor");
                if (type === "replace_selection") await DocumentEditor.replaceSelection(content);
                else if (type === "replace_paragraph") await DocumentEditor.replaceCurrentParagraph(content);
                else if (type === "replace_search") await DocumentEditor.replaceSearchTerm(targetStr, content);
                else if (type === "replace_heading") await DocumentEditor.replaceHeadingContent(targetStr, content);
                else if (type === "insert_html") {
                    await Word.run(async (context) => {
                        if (settings.insertAtCursor) {
                            const selection = context.document.getSelection();
                            selection.insertHtml(content, Word.InsertLocation.replace);
                        } else {
                            const body = context.document.body;
                            body.insertHtml(content, Word.InsertLocation.end);
                        }
                        await context.sync();
                    });
                }
                
                const notifText = appLanguage === "vi" ? "Thành công!" : "Success!";
                const tSettings = translations[appLanguage] || translations["en"];
                const btnApplyText = tSettings.btnApplyEdit || "Apply";

                btnApply.innerHTML = `<span style="color: var(--color-success, #107c41); font-weight: 500;">${notifText}</span>`;
                setTimeout(() => {
                    btnApply.innerHTML = `<span style="font-weight: 500;">${btnApplyText}</span>`;
                    btnApply.disabled = false;
                }, 10000);
            } catch(err) {
                btnApply.innerText = "Error!";
                btnApply.disabled = false;
            }
        } else if (target.closest(".btn-copy-msg")) {
            const btn = target.closest(".btn-copy-msg") as HTMLElement;
            const textToCopy = decodeURIComponent(btn.getAttribute("data-copy-text") || "");
            if (textToCopy) {
                try {
                    const chatMsg = btn.closest(".chat-msg") as HTMLElement;
                    let htmlText = "";
                    if (chatMsg) {
                        const msgBubble = chatMsg.querySelector(".msg-bubble");
                        if (msgBubble) {
                            htmlText = msgBubble.innerHTML;
                        }
                    }
                    
                    if (htmlText && typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
                        const htmlBlob = new Blob([htmlText], { type: "text/html" });
                        const plainBlob = new Blob([textToCopy], { type: "text/plain" });
                        const clipboardItem = new ClipboardItem({
                            "text/html": htmlBlob,
                            "text/plain": plainBlob
                        });
                        await navigator.clipboard.write([clipboardItem]);
                    } else {
                        await navigator.clipboard.writeText(textToCopy);
                    }

                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-success);"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy text: ', err);
                }
            }
        }

        const formulaEl = target.closest('.clickable-formula') as HTMLElement;
        if (formulaEl) {
            const rawLatex = decodeURIComponent(formulaEl.getAttribute('data-latex') || "");
            if (rawLatex) {
                try {
                    const mathML = formulaEl.innerHTML;
                    
                    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
                        const htmlBlob = new Blob([mathML], { type: "text/html" });
                        const plainBlob = new Blob([rawLatex], { type: "text/plain" });
                        const clipboardItem = new ClipboardItem({
                            "text/html": htmlBlob,
                            "text/plain": plainBlob
                        });
                        await navigator.clipboard.write([clipboardItem]);
                    } else {
                        await navigator.clipboard.writeText(rawLatex);
                    }
                    
                    const originalTitle = formulaEl.getAttribute('title');
                    if (originalTitle) formulaEl.removeAttribute('title');
                    
                    const tooltip = document.createElement("div");
                    tooltip.innerText = "Copied!";
                    tooltip.style.position = "fixed";
                    tooltip.style.left = `${e.clientX + 10}px`;
                    tooltip.style.top = `${e.clientY + 10}px`;
                    tooltip.style.background = "var(--color-primary)";
                    tooltip.style.color = "#ffffff";
                    tooltip.style.border = "none";
                    tooltip.style.padding = "4px 10px";
                    tooltip.style.borderRadius = "6px";
                    tooltip.style.fontSize = "12px";
                    tooltip.style.fontWeight = "500";
                    tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    tooltip.style.zIndex = "10000";
                    tooltip.style.pointerEvents = "none";
                    document.body.appendChild(tooltip);
                    
                    setTimeout(() => {
                        if (originalTitle) formulaEl.setAttribute('title', originalTitle);
                        document.body.removeChild(tooltip);
                    }, 1500);
                } catch (err) {
                    console.error('Failed to copy latex: ', err);
                }
            }
        }
        
        const quotedBlock = target.closest('.quoted-message-block') as HTMLElement;
        if (quotedBlock) {
            const isFromWord = quotedBlock.getAttribute('data-from-word') === "true";
            const originalQuote = decodeURIComponent(quotedBlock.getAttribute('data-original-quote') || "");
            
            if (isFromWord && originalQuote) {
                Word.run(async (context) => {
                    const searchResults = context.document.body.search(originalQuote, { matchCase: false, matchWholeWord: false });
                    searchResults.load("items");
                    await context.sync();
                    
                    if (searchResults.items.length > 0) {
                        const range = searchResults.items[0];
                        range.select();
                        await context.sync();
                    } else {
                        const appLang = getLanguage();
                        const notifText = appLang === "vi" ? "Không tìm thấy đoạn văn bản này!" : "Text not found!";
                        const tooltip = document.createElement("div");
                        tooltip.innerText = notifText;
                        tooltip.style.position = "fixed";
                        tooltip.style.left = `${e.clientX + 10}px`;
                        tooltip.style.top = `${e.clientY + 10}px`;
                        tooltip.style.background = "var(--color-surface, #ffffff)";
                        tooltip.style.color = "var(--color-text, #323130)";
                        tooltip.style.border = "1px solid var(--color-border, #edebe9)";
                        tooltip.style.padding = "6px 12px";
                        tooltip.style.borderRadius = "8px";
                        tooltip.style.fontSize = "13px";
                        tooltip.style.fontWeight = "500";
                        tooltip.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                        tooltip.style.zIndex = "10000";
                        tooltip.style.pointerEvents = "none";
                        tooltip.style.animation = "popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                        document.body.appendChild(tooltip);
                        
                        setTimeout(() => {
                            if (document.body.contains(tooltip)) document.body.removeChild(tooltip);
                        }, 2000);
                    }
                }).catch(err => {
                    console.error("Error searching in Word", err);
                });
            } else if (!isFromWord && originalQuote) {
                // Tìm tin nhắn trong khung chat chứa đoạn quote này
                const msgType = quotedBlock.getAttribute('data-msg-type');
                const msgId = quotedBlock.getAttribute('data-msg-id');
                let foundMsg: HTMLElement | null = null;
                
                // Nếu có ID cụ thể, tìm chính xác tin nhắn đó luôn
                if (msgId) {
                    const exactMsg = document.getElementById(msgId);
                    if (exactMsg && exactMsg.classList.contains('chat-msg')) {
                        foundMsg = exactMsg.querySelector('.msg-bubble') as HTMLElement || exactMsg;
                    }
                }
                
                // Nếu không tìm thấy qua ID (ví dụ: tin nhắn cũ chưa có ID), dùng text search
                if (!foundMsg) {
                    let msgs = Array.from(chatMessages.querySelectorAll('.chat-msg'));
                    
                    // Nếu biết chính xác loại tin nhắn gốc, chỉ tìm trong loại đó
                    if (msgType === 'user') {
                        msgs = Array.from(chatMessages.querySelectorAll('.user-msg'));
                    } else if (msgType === 'ai') {
                        msgs = Array.from(chatMessages.querySelectorAll('.ai-msg'));
                    }
                    
                    // Chuẩn hóa text để so sánh dễ hơn (bỏ khoảng trắng thừa)
                    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();
                    const searchStr = normalize(originalQuote);
                    
                    for (let i = msgs.length - 1; i >= 0; i--) {
                        const msgBubble = msgs[i].querySelector('.msg-bubble');
                        if (msgBubble) {
                            // Clone the node to remove quoted blocks before getting text
                            const clone = msgBubble.cloneNode(true) as HTMLElement;
                            const quotes = clone.querySelectorAll('.quoted-message-block');
                            quotes.forEach(q => q.remove());
                            
                            const bubbleText = normalize(clone.innerText || clone.textContent || "");
                            if (bubbleText && bubbleText.includes(searchStr)) {
                                foundMsg = msgBubble as HTMLElement;
                                break;
                            }
                        }
                    }
                }
                
                if (foundMsg) {
                    foundMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    foundMsg.classList.remove('blink-focus');
                    // Force reflow
                    void foundMsg.offsetWidth;
                    foundMsg.classList.add('blink-focus');
                    
                    setTimeout(() => {
                        if (foundMsg) foundMsg.classList.remove('blink-focus');
                    }, 1500);
                } else {
                    const appLang = getLanguage();
                    const notifText = appLang === "vi" ? "Không tìm thấy tin nhắn này!" : "Message not found!";
                    const tooltip = document.createElement("div");
                    tooltip.innerText = notifText;
                    tooltip.style.position = "fixed";
                    tooltip.style.left = `${e.clientX + 10}px`;
                    tooltip.style.top = `${e.clientY + 10}px`;
                    tooltip.style.background = "var(--color-surface, #ffffff)";
                    tooltip.style.color = "var(--color-text, #323130)";
                    tooltip.style.border = "1px solid var(--color-border, #edebe9)";
                    tooltip.style.padding = "6px 12px";
                    tooltip.style.borderRadius = "8px";
                    tooltip.style.fontSize = "13px";
                    tooltip.style.fontWeight = "500";
                    tooltip.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
                    tooltip.style.zIndex = "10000";
                    tooltip.style.pointerEvents = "none";
                    tooltip.style.animation = "popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
                    document.body.appendChild(tooltip);
                    
                    setTimeout(() => {
                        if (document.body.contains(tooltip)) document.body.removeChild(tooltip);
                    }, 2000);
                }
            }
        }
    });

    document.addEventListener('copy', (e: ClipboardEvent) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        if (!chatMessages.contains(selection.anchorNode)) return;

        const range = selection.getRangeAt(0);
        const clonedSelection = range.cloneContents();
        const div = document.createElement('div');
        div.appendChild(clonedSelection);

        const htmlText = div.innerHTML;

        const formulas = div.querySelectorAll('.clickable-formula');
        formulas.forEach(f => {
            const rawLatex = decodeURIComponent(f.getAttribute('data-latex') || "");
            if (rawLatex) {
                const isBlock = f.tagName.toLowerCase() === 'div';
                const delimiterLatex = isBlock ? `\\[ ${rawLatex} \\]` : `\\( ${rawLatex} \\)`;
                const textNode = document.createTextNode(delimiterLatex);
                f.parentNode?.replaceChild(textNode, f);
            }
        });
        
        const skeletons = div.querySelectorAll('.skeleton-line');
        skeletons.forEach(s => s.remove());

        // We append div temporarily to body to compute innerText correctly
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        document.body.appendChild(div);
        const plainText = div.innerText;
        document.body.removeChild(div);

        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', plainText);
            e.clipboardData.setData('text/html', htmlText);
            e.preventDefault();
        }
    });
};
