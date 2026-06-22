import { SessionManager } from "../core/session-manager";
import { trapFocus } from "../utils/helpers";
import { translations } from "../utils/translations";

export const setupSessionOptions = (
    sessionManager: SessionManager,
    getLanguage: () => string
) => {
    let targetSessionId: string | null = null;

    const optRename = document.getElementById("opt-rename");
    const optPin = document.getElementById("opt-pin");
    const optDelete = document.getElementById("opt-delete");

    const renameModal = document.getElementById("rename-modal");
    const renameInput = document.getElementById("rename-input") as HTMLInputElement;
    const btnCancelRename = document.getElementById("btn-cancel-rename");
    const btnSaveRename = document.getElementById("btn-save-rename");
    
    const deleteModal = document.getElementById("delete-modal");
    const btnCancelDelete = document.getElementById("btn-cancel-delete");
    const btnConfirmDelete = document.getElementById("btn-confirm-delete");

    let cleanupRenameFocus: () => void = () => {};
    let cleanupDeleteFocus: () => void = () => {};

    const hideModal = (modal: HTMLElement | null, cleanup?: () => void) => {
        if (modal && modal.style.display !== "none") {
            modal.classList.add("closing");
            if (cleanup) cleanup();
            modal.addEventListener("animationend", () => {
                modal.classList.remove("closing");
                modal.style.display = "none";
                document.body.classList.remove("modal-open");
            }, { once: true });
        }
    };

    document.addEventListener("click", () => {
        const dropdown = document.getElementById("item-options-dropdown");
        if (dropdown) dropdown.style.display = "none";
    });

    optRename?.addEventListener("click", () => {
        if (!targetSessionId) return;
        const session = sessionManager.getSession(targetSessionId!);
        if (session) {
            if (renameInput) renameInput.value = session.name === "New Chat" ? "" : session.name;
            if (renameModal) {
                renameModal.style.display = "flex";
                document.body.classList.add("modal-open");
                setTimeout(() => {
                    cleanupRenameFocus = trapFocus(renameModal);
                    renameInput?.focus();
                }, 10);
            }
        }
    });

    btnCancelRename?.addEventListener("click", () => {
        hideModal(renameModal, cleanupRenameFocus);
    });

    btnSaveRename?.addEventListener("click", () => {
        if (!targetSessionId || !renameInput) return;
        const session = sessionManager.getSession(targetSessionId!);
        if (session) {
            const newName = renameInput.value;
            if (newName && newName.trim()) {
                session.name = newName.trim();
                sessionManager.saveSessions();
                if (sessionManager.currentSessionId === session.id) sessionManager.switchSession(session.id);
            }
        }
        hideModal(renameModal, cleanupRenameFocus);
    });
    
    renameInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnSaveRename?.click();
    });

    optPin?.addEventListener("click", () => {
        if (!targetSessionId) return;
        const session = sessionManager.getSession(targetSessionId!);
        if (session) {
            session.isPinned = !session.isPinned;
            session.updatedAt = Date.now();
            sessionManager.saveSessions();
            if (sessionManager.currentSessionId === session.id) sessionManager.switchSession(session.id);
        }
    });

    optDelete?.addEventListener("click", () => {
        if (!targetSessionId) return;
        if (deleteModal) {
            deleteModal.style.display = "flex";
            document.body.classList.add("modal-open");
            cleanupDeleteFocus = trapFocus(deleteModal);
        }
    });

    btnCancelDelete?.addEventListener("click", () => {
        hideModal(deleteModal, cleanupDeleteFocus);
    });

    btnConfirmDelete?.addEventListener("click", () => {
        if (!targetSessionId) return;
        sessionManager.deleteSession(targetSessionId);
        hideModal(deleteModal, cleanupDeleteFocus);
    });

    // Hàm public được truyền ra ngoài để sidebar gọi
    return (id: string, btnOpts: HTMLElement) => {
        targetSessionId = id;
        const dropdown = document.getElementById("item-options-dropdown");
        const session = sessionManager.getSession(id);
        if (dropdown && session) {
            const t = translations[getLanguage()] || translations["en"];
            dropdown.style.display = "block";
            const rect = btnOpts.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 4) + "px";
            dropdown.style.left = (rect.right - 160) + "px";
            if (optPin) {
                if (session.isPinned) {
                    optPin.style.color = "";
                    optPin.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; color: var(--color-primary);"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.6V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.6a2 2 0 0 1-1.11 1.95l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                        <span id="opt-pin-text" data-i18n="optUnpin">${t.optUnpin || "Bỏ ghim"}</span>
                    `;
                } else {
                    optPin.style.color = "";
                    optPin.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.6V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.6a2 2 0 0 1-1.11 1.95l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
                        <span id="opt-pin-text" data-i18n="optPin">${t.optPin || "Ghim"}</span>
                    `;
                }
            }
        }
    };
};
