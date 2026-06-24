import { ChatMessage } from "../services/ai";
import { setIDBItem, getIDBItem } from "../utils/idb";

export interface ChatSession {
    id: string;
    name: string;
    isPinned: boolean;
    messages: ChatMessage[];
    updatedAt: number;
}

export class SessionManager {
    private storageKey: string;
    public sessions: ChatSession[] = [];
    public currentSessionId: string | null = null;
    private defaultChatName: string = "New Chat";
    private saveQueue: Promise<void> = Promise.resolve();

    public onSessionsChanged: () => void = () => {};
    public onSessionSwitched: (session: ChatSession) => void = () => {};

    constructor(storageKey: string = "auto_latex_chat_sessions") {
        this.storageKey = storageKey;
    }

    public setDefaultChatName(name: string) {
        this.defaultChatName = name;
    }

    public saveSessions() {
        const dataStr = JSON.stringify(this.sessions);
        
        // Áp dụng Save Queue để tránh lỗi Race Condition khi thao tác dồn dập
        this.saveQueue = this.saveQueue.then(async () => {
            try {
                await setIDBItem(this.storageKey, dataStr);
                
                if (Office && Office.context && Office.context.document && Office.context.document.settings) {
                    Office.context.document.settings.set(this.storageKey, dataStr);
                    Office.context.document.settings.saveAsync();
                }
            } catch (e) {
                console.error("[Storage] Failed to save sessions to IndexedDB", e);
            }
        }).catch(err => {
            console.error("[Storage] Queue error", err);
        });

        this.onSessionsChanged();
    }

    public async loadSessions(canMigrate: boolean = false) {
        let dataStr: string | null = null;
        try {
            // Ưu tiên 1: Tải từ file Word hiện tại
            if (Office && Office.context && Office.context.document && Office.context.document.settings) {
                dataStr = Office.context.document.settings.get(this.storageKey) as string;
            }
            
            // Ưu tiên 2: Tải từ IndexedDB
            if (!dataStr) {
                dataStr = await getIDBItem(this.storageKey);
            }
            
            // Ưu tiên 3: Migration từ LocalStorage an toàn
            if (!dataStr) {
                const lsData = localStorage.getItem(this.storageKey);
                if (lsData) {
                    if (canMigrate) {
                        try {
                            await setIDBItem(this.storageKey, lsData);
                            // Chỉ xóa khi đã ghi IndexedDB thành công 100%
                            localStorage.removeItem(this.storageKey);
                            console.log("[Storage] Successfully migrated data from LocalStorage to IndexedDB.");
                        } catch (e) {
                            console.error("[Storage] Migration failed. Keeping LocalStorage data.", e);
                        }
                    }
                    dataStr = lsData;
                }
            }
            
            if (dataStr) this.sessions = JSON.parse(dataStr);
        } catch (e) {
            console.error("Failed to load sessions", e);
        }
        
        if (this.sessions.length === 0) {
            this.createNewSession();
        } else {
            this.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
            this.switchSession(this.sessions[0].id);
        }
    }

    public createNewSession() {
        // Kiểm tra xem đã có session nào trống (chưa có tin nhắn) chưa, nếu có thì chuyển qua dùng luôn
        const existingEmptySession = this.sessions.find(s => s.messages.length === 0);
        if (existingEmptySession) {
            this.switchSession(existingEmptySession.id);
            return;
        }

        const newSession: ChatSession = {
            id: Date.now().toString(),
            name: this.defaultChatName,
            isPinned: false,
            messages: [],
            updatedAt: Date.now()
        };
        this.sessions.unshift(newSession);
        this.switchSession(newSession.id);
        this.saveSessions();
    }

    public switchSession(id: string) {
        this.currentSessionId = id;
        const session = this.getCurrentSession();
        if (session) {
            this.onSessionSwitched(session);
        }
        this.onSessionsChanged();
    }

    public deleteSession(id: string) {
        this.sessions = this.sessions.filter(s => s.id !== id);
        if (this.sessions.length === 0) {
            this.createNewSession();
        } else {
            this.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
            if (this.currentSessionId === id) {
                this.switchSession(this.sessions[0].id);
            } else {
                this.saveSessions();
            }
        }
    }

    public deleteCurrentSession() {
        if (this.currentSessionId) {
            this.deleteSession(this.currentSessionId);
        }
    }

    public getSession(id: string): ChatSession | undefined {
        return this.sessions.find(s => s.id === id);
    }

    public getCurrentSession(): ChatSession | undefined {
        if (!this.currentSessionId) return undefined;
        return this.getSession(this.currentSessionId);
    }

    public autoRenameSession(firstMsg: string) {
        const session = this.getCurrentSession();
        if (!session) return;
        if (session.name !== this.defaultChatName) return;
        let newName = firstMsg.trim();
        if (!newName) return;
        if (newName.length > 25) {
            newName = newName.substring(0, 25) + "...";
        }
        session.name = newName;
        this.saveSessions();
        this.onSessionSwitched(session);
    }

    public saveDraft(prompt: string, quoteText: string, isFromWord: boolean) {
        localStorage.setItem('auto_latex_draft_prompt', prompt);
        localStorage.setItem('auto_latex_draft_quote', JSON.stringify({text: quoteText, isFromWord}));
    }

    public loadDraft() {
        const prompt = localStorage.getItem('auto_latex_draft_prompt') || '';
        let quote = { text: '', isFromWord: false };
        try {
            const quoteStr = localStorage.getItem('auto_latex_draft_quote');
            if (quoteStr) quote = JSON.parse(quoteStr);
        } catch(e) {}
        
        // Chỉ đọc 1 lần (pop)
        localStorage.removeItem('auto_latex_draft_prompt');
        localStorage.removeItem('auto_latex_draft_quote');
        
        return { prompt, quote };
    }
}
