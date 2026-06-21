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

    chatMessages.addEventListener("click", async (e) => {
        const target = e.target as HTMLElement;
        const btnApply = target.closest(".btn-apply-edit") as HTMLButtonElement;
        
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
