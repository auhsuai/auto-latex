import { ChatMessage } from "../services/ai";

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
        localStorage.setItem(this.storageKey, dataStr);
        try {
            if (Office && Office.context && Office.context.document && Office.context.document.settings) {
                Office.context.document.settings.set(this.storageKey, dataStr);
                Office.context.document.settings.saveAsync();
            }
        } catch (e) {
            console.error("Failed to save to Document Settings", e);
        }
        this.onSessionsChanged();
    }

    public loadSessions() {
        let data: string | null = null;
        try {
            // Ưu tiên tải từ file Word hiện tại trước
            if (Office && Office.context && Office.context.document && Office.context.document.settings) {
                data = Office.context.document.settings.get(this.storageKey) as string;
            }
            // Nếu file Word chưa có, tải từ LocalStorage
            if (!data) {
                data = localStorage.getItem(this.storageKey);
            }
            if (data) this.sessions = JSON.parse(data);
        } catch (e) {
            console.error("Failed to load sessions");
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
}
