import { escapeHtml, scrollToBottom } from "../utils/helpers";
import { ChatMinimapManager } from "./chat-minimap";

export class ChatRenderer {
    private minimapManager: ChatMinimapManager;
    constructor(private chatMessagesContainerId: string) {
        // Hỗ trợ cuộn ngang công thức dài bằng con lăn chuột thông thường
        document.addEventListener('wheel', (e: WheelEvent) => {
            const target = e.target as HTMLElement;
            const mathContainer = target.closest('.katex-display, .katex, .clickable-formula.block-formula') as HTMLElement;
            
            if (mathContainer && mathContainer.scrollWidth > mathContainer.clientWidth) {
                // Nếu người dùng lăn chuột dọc (deltaY)
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    e.preventDefault();
                    mathContainer.scrollLeft += e.deltaY;
                }
            }
        }, { passive: false });

        this.minimapManager = new ChatMinimapManager(this.chatMessagesContainerId, "chat-minimap");
    }

    public get container(): HTMLElement | null {
        return document.getElementById(this.chatMessagesContainerId);
    }

    public clear() {
        if (this.container) {
            this.container.innerHTML = "";
            this.minimapManager.update();
        }
    }

    public appendUserMessage(text: string, htmlContent?: string) {
        if (!this.container) return;
        const div = document.createElement("div");
        div.className = "chat-msg user-msg";
        div.id = "chat-msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        div.innerHTML = `<div class="msg-bubble" style="display: flex; flex-direction: column;">${htmlContent || escapeHtml(text)}</div>`;
        this.container.appendChild(div);
        scrollToBottom(this.chatMessagesContainerId);
        this.minimapManager.update();
    }

    public appendAIMessage(htmlContent: string, rawContent: string = "", toolbarHtml: string = ""): HTMLElement | null {
        if (!this.container) return null;
        const div = document.createElement("div");
        div.className = "chat-msg ai-msg";
        div.id = "chat-msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
        
        const copyBtnHtml = rawContent ? `<button class="btn-toolbar-action btn-copy-msg" title="Copy" data-copy-text="${encodeURIComponent(rawContent)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>` : "";
        
        div.innerHTML = `
            <div class="msg-bubble">${htmlContent}</div>
            <div class="msg-toolbar" style="margin-top: 2px; display: flex; justify-content: space-between; align-items: center;">
                <div class="toolbar-left" style="display: flex; gap: 8px;">${toolbarHtml}</div>
                <div class="toolbar-right">${copyBtnHtml}</div>
            </div>
        `;
        this.container.appendChild(div);
        scrollToBottom(this.chatMessagesContainerId);
        this.minimapManager.update();
        return div;
    }

    public appendAIError(errorStr: string) {
        if (!this.container) return;
        const div = document.createElement("div");
        div.className = "chat-msg ai-msg";
        div.innerHTML = `<div class="msg-bubble" style="color: #d83b01;">Error: ${escapeHtml(errorStr)}</div>`;
        this.container.appendChild(div);
        scrollToBottom(this.chatMessagesContainerId);
        this.minimapManager.update();
    }

    public showSkeleton() {
        if (!this.container) return;
        const skeletonEl = document.createElement("div");
        skeletonEl.className = "chat-msg ai-msg";
        skeletonEl.id = "ai-skeleton";
        skeletonEl.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>`;
        this.container.appendChild(skeletonEl);
        scrollToBottom(this.chatMessagesContainerId);
    }

    public removeSkeleton() {
        const skeleton = document.getElementById("ai-skeleton");
        if (skeleton) skeleton.remove();
    }
}
