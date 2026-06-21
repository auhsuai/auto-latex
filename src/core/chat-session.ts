import { ChatMessage } from "../services/ai";
import { STORAGE_KEY_CHAT_SESSIONS, DEFAULT_LANGUAGE } from "../config/constants";
import { translations } from "../config/translations";

export interface ChatSession {
    id: string;
    name: string;
    isPinned: boolean;
    messages: ChatMessage[];
    updatedAt: number;
}

export class ChatSessionManager {
    public sessions: ChatSession[] = [];
    public currentSessionId: string | null = null;
    public targetSessionId: string | null = null;

    constructor(private appLanguage: string, private onSessionSwitch: (id: string) => void) {}

    public updateLanguage(lang: string) {
        this.appLanguage = lang;
    }

    public saveSessions() {
        localStorage.setItem(STORAGE_KEY_CHAT_SESSIONS, JSON.stringify(this.sessions));
    }

    public createNewSession() {
        const t = translations[this.appLanguage] || translations[DEFAULT_LANGUAGE];
        const newSession: ChatSession = {
            id: Date.now().toString(),
            name: t.defaultChatName || "New Chat",
            isPinned: false,
            messages: [],
            updatedAt: Date.now()
        };
        this.sessions.unshift(newSession);
        this.switchSession(newSession.id);
        this.saveSessions();
    }

    public loadSessions() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_CHAT_SESSIONS);
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

    public switchSession(id: string) {
        this.currentSessionId = id;
        this.onSessionSwitch(id);
    }

    public deleteSession(id: string) {
        this.sessions = this.sessions.filter(s => s.id !== id);
        if (this.sessions.length === 0) {
            this.createNewSession();
        } else if (this.currentSessionId === id) {
            this.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
            this.switchSession(this.sessions[0].id);
        }
        this.saveSessions();
    }

    public autoRenameSession(session: ChatSession, firstMsg: string, onChange: () => void) {
        const tEN = translations["en"].defaultChatName;
        const tVI = translations["vi"].defaultChatName;
        if (session.name !== tEN && session.name !== tVI) return;
        
        let newName = firstMsg.trim();
        if (newName.length > 25) {
            newName = newName.substring(0, 25) + "...";
        }
        session.name = newName;
        this.saveSessions();
        onChange();
    }

    public get currentSession(): ChatSession | undefined {
        return this.sessions.find(s => s.id === this.currentSessionId);
    }
}
