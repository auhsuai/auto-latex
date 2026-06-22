import { SessionManager } from "../core/session-manager";
import { translations } from "../utils/translations";

export const renderSidebar = (
    sessionManager: SessionManager,
    appLanguage: string,
    searchQuery: string,
    onShowOptions: (id: string, btnOpts: HTMLElement) => void
) => {
    const historyChatsList = document.getElementById("history-chats-list");
    if (!historyChatsList) return;
    
    const t = translations[appLanguage] || translations["en"];
    historyChatsList.innerHTML = "";

    let filteredSessions = sessionManager.sessions;
    if (searchQuery) {
        filteredSessions = sessionManager.sessions.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Clone and sort to not mutate original array order
    const sorted = [...filteredSessions].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt - a.updatedAt;
    });

    sorted.forEach(session => {
        const li = document.createElement("li");
        li.className = `chat-list-item ${session.id === sessionManager.currentSessionId ? "active" : ""}`;
        
        const pinIconHtml = session.isPinned ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; color: var(--color-primary); flex-shrink: 0;"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.6V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.6a2 2 0 0 1-1.11 1.95l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>` : '';
        
        li.innerHTML = `
            ${pinIconHtml}
            <span class="chat-name">${session.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>
            <button class="btn-item-opts" aria-label="Options">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
        `;
        li.onclick = () => {
            sessionManager.switchSession(session.id);
            const chatSidebarOverlay = document.getElementById("chat-sidebar-overlay");
            const chatSidebar = document.getElementById("chat-sidebar");
            if (chatSidebarOverlay) chatSidebarOverlay.classList.remove("visible");
            if (chatSidebar) chatSidebar.classList.remove("visible");
            document.body.classList.remove("modal-open");
        };
        
        const btnOpts = li.querySelector('.btn-item-opts') as HTMLElement;
        if (btnOpts) {
            btnOpts.onclick = (e) => {
                e.stopPropagation();
                onShowOptions(session.id, btnOpts);
            };
        }
        
        historyChatsList.appendChild(li);
    });
};
