import { SessionManager } from "../core/session-manager";
import { QuoteManager } from "../ui/quote-manager";
import { ChatRenderer } from "../ui/chat-renderer";
import { handleSendChat } from "../taskpane/chat-send";
import { renderSidebar } from "../ui/sidebar";
import { setupSessionOptions } from "../ui/session-options";
import { translations } from "../utils/translations";
import { SettingsManager } from "../ui/settings-manager";

if (process.env.NODE_ENV !== "development") {
    document.querySelectorAll('.dev-only').forEach(el => el.remove());
}

let sessionManager: SessionManager;
let quoteManager: QuoteManager;
let chatRenderer: ChatRenderer;
let appLanguage: string;
let isThinkingMode = false;
let searchChatQuery = "";

// Add styles specific to dialog to hide Apply buttons, since they can't be used here.
const style = document.createElement("style");
style.innerHTML = `
    .btn-apply-edit { display: none !important; }
    .btn-apply-heading { display: none !important; }
`;
document.head.appendChild(style);

Office.onReady(async (info) => {
    if (info.host === Office.HostType.Word) {
        await initDialog();
    }
});

async function initDialog() {
    appLanguage = localStorage.getItem("auto_latex_language") || "en";

    const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
    const btnSendChat = document.getElementById("btn-send-chat") as HTMLButtonElement;
    const thinkingText = document.getElementById("thinking-text");

    quoteManager = new QuoteManager();
    quoteManager.init();
    chatRenderer = new ChatRenderer("chat-messages");
    sessionManager = new SessionManager();

    // Sidebar
    const showOptionsHandler = setupSessionOptions(sessionManager, () => appLanguage);
    const updateSidebar = () => {
        renderSidebar(sessionManager, appLanguage, searchChatQuery, showOptionsHandler);
    };
    sessionManager.onSessionsChanged = updateSidebar;
    
    const applyLanguage = (lang: string) => {
        document.documentElement.lang = lang;
        const t = translations[lang] || translations["en"];
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (key && t[key as keyof typeof t]) el.innerHTML = t[key as keyof typeof t];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (key && t[key as keyof typeof t]) (el as HTMLInputElement).placeholder = t[key as keyof typeof t];
        });
        updateSidebar();
    };

    applyLanguage(appLanguage);

    const chatTitle = document.getElementById("chat-title");
    const renderCurrentChat = () => {
        chatRenderer.clear();
        const session = sessionManager.getCurrentSession();
        if (!session || session.messages.length === 0) {
            const t = translations[appLanguage] || translations["en"];
            chatRenderer.appendAIMessage(t.aiWelcomeMsg, "", "");
        } else {
            session.messages.forEach(m => {
                if (m.role === "user") chatRenderer.appendUserMessage(m.content, m.html);
                else chatRenderer.appendAIMessage(m.html || m.content, m.content, m.toolbar || "");
            });
        }
    };
    sessionManager.onSessionSwitched = (session) => {
        const t = translations[appLanguage] || translations["en"];
        if (chatTitle) {
            if (session.name !== t.defaultChatName) chatTitle.innerText = session.name; 
            else { session.name = t.defaultChatName; sessionManager.saveSessions(); chatTitle.innerText = t.defaultChatName; }
        }
        renderCurrentChat();
    };

    // Events
    const { setupChatEvents } = await import("../ui/chat-events");
    setupChatEvents(document.getElementById("chat-messages")!, () => appLanguage);

    const btnToggleThinking = document.getElementById("btn-toggle-thinking");
    import("../services/ai").then(({ getAISettings }) => {
        const settings = getAISettings();
        if (btnToggleThinking) {
            if (settings.provider === 'kira') {
                btnToggleThinking.style.display = "none";
            } else {
                btnToggleThinking.style.display = "";
            }
        }
    });

    btnToggleThinking?.addEventListener("click", () => {
        isThinkingMode = !isThinkingMode;
        if (isThinkingMode) {
            btnToggleThinking.classList.add("thinking-active");
            if (thinkingText) thinkingText.innerText = "Thinking";
        } else {
            btnToggleThinking.classList.remove("thinking-active");
            if (thinkingText) thinkingText.innerText = "Fast";
        }
    });

    btnSendChat.addEventListener("click", () => {
        handleSendChat({
            sessionManager,
            quoteManager,
            chatRenderer,
            getLanguage: () => appLanguage,
            getThinkingMode: () => isThinkingMode,
            chatInput,
            btnSendChat,
            isDialog: true,
            onStreamingStateChange: (isStreaming) => {}
        });
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            btnSendChat.click();
        }
    });

    // Sidebar Toggles
    const btnChatMenu = document.getElementById("btn-chat-menu");
    const chatSidebar = document.getElementById("chat-sidebar");
    const chatSidebarOverlay = document.getElementById("chat-sidebar-overlay");
    const btnCloseSidebar = document.getElementById("btn-close-sidebar");
    const btnNewChat = document.getElementById("btn-new-chat");
    const chatSearchInput = document.getElementById("chat-search-input") as HTMLInputElement;

    const toggleSidebar = (show: boolean) => {
        if (chatSidebar && chatSidebarOverlay) {
            if (show) {
                chatSidebarOverlay.classList.add("visible");
                chatSidebar.classList.add("visible");
            } else {
                chatSidebarOverlay.classList.remove("visible");
                chatSidebar.classList.remove("visible");
            }
        }
    };

    const settingsManager = new SettingsManager(appLanguage);
    settingsManager.onLanguageChanged = (newLang) => {
        appLanguage = newLang;
        localStorage.setItem("auto_latex_language", appLanguage);
        applyLanguage(appLanguage);
        // Also inform the parent window
        Office.context.ui.messageParent(JSON.stringify({ type: "languageChanged", lang: appLanguage }));
    };
    settingsManager.init();
    
    // Listen to changes from other windows
    window.addEventListener('storage', (e) => {
        if (e.key === "auto_latex_language" && e.newValue && e.newValue !== appLanguage) {
            appLanguage = e.newValue;
            applyLanguage(appLanguage);
            settingsManager.setAppLanguage(appLanguage);
        }
    });
    

    
    const urlParams = new URLSearchParams(window.location.search);
    const isFullscreen = urlParams.get("fullscreen") === "1";

    const btnFullscreen = document.getElementById("btn-dialog-fullscreen");
    if (btnFullscreen) {
        if (isFullscreen) {
            btnFullscreen.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;
        }
    }

    btnFullscreen?.addEventListener("click", () => {
        const currentPrompt = chatInput.value.trim();
        const currentQuote = quoteManager.currentQuotedText || "";
        const isFromWord = quoteManager.isQuoteFromWord;
        sessionManager.saveDraft(currentPrompt, currentQuote, isFromWord);
        Office.context.ui.messageParent(JSON.stringify({ type: isFullscreen ? "reopenNormal" : "reopenFullscreen" }));
    });

    const btnSettingsApi = document.getElementById("btn-settings-api");
    btnSettingsApi?.addEventListener("click", () => {
        toggleSidebar(false);
        settingsManager.openSettings();
    });

    btnChatMenu?.addEventListener("click", () => toggleSidebar(true));
    btnCloseSidebar?.addEventListener("click", () => toggleSidebar(false));
    chatSidebarOverlay?.addEventListener("click", () => toggleSidebar(false));
    
    chatSearchInput?.addEventListener("input", (e) => {
        searchChatQuery = (e.target as HTMLInputElement).value.toLowerCase();
        updateSidebar();
    });

    btnNewChat?.addEventListener("click", () => {
        sessionManager.createNewSession();
        toggleSidebar(false);
    });

    // Load Sessions and Draft
    await sessionManager.loadSessions(false); // Do not migrate in dialog
    const draft = sessionManager.loadDraft();
    if (draft.prompt) {
        chatInput.value = draft.prompt;
    }
    if (draft.quote && draft.quote.text) {
        quoteManager.setQuote(draft.quote.text, draft.quote.isFromWord);
    }
    renderCurrentChat();

    // Save draft on window close
    window.addEventListener("beforeunload", () => {
        const currentPrompt = chatInput.value.trim();
        const currentQuote = quoteManager.currentQuotedText || "";
        const isFromWord = quoteManager.isQuoteFromWord;
        
        sessionManager.saveDraft(currentPrompt, currentQuote, isFromWord);
        Office.context.ui.messageParent(JSON.stringify({ type: "dialogClosed" }));
    });
    
    setInterval(() => {
        sessionManager.saveSessions();
    }, 2000);
}
