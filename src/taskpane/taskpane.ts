import { Chart, registerables } from 'chart.js';
import { SessionManager } from "../core/session-manager";
import { SettingsManager } from "../ui/settings-manager";
import { ConverterUIManager } from "../ui/converter-ui";
import { translations } from "../utils/translations";
import { QuoteManager } from "../ui/quote-manager";
import { ChatRenderer } from "../ui/chat-renderer";
import { setupChatEvents } from "../ui/chat-events";
import { renderSidebar } from "../ui/sidebar";
import { setupSessionOptions } from "../ui/session-options";
import { handleSendChat } from "./chat-send";
import { escapeHtml } from "../utils/helpers";

Chart.register(...registerables);

Office.onReady((info) => {
    if (info.host === Office.HostType.Word) {
        // Elements
        const mainView = document.getElementById("main-view");
        const chatView = document.getElementById("chat-view");
        const fabChat = document.getElementById("fab-chat");
        const appBody = document.getElementById("app-body");
        
        const btnBack = document.getElementById("btn-back");
        const btnSendChat = document.getElementById("btn-send-chat") as HTMLButtonElement;
        const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
        const chatMessages = document.getElementById("chat-messages");
        const chatTitle = document.getElementById("chat-title");
        
        const btnChatMenu = document.getElementById("btn-chat-menu");
        const chatSidebar = document.getElementById("chat-sidebar");
        const chatSidebarOverlay = document.getElementById("chat-sidebar-overlay");
        const btnCloseSidebar = document.getElementById("btn-close-sidebar");
        const btnNewChat = document.getElementById("btn-new-chat");
        const btnSettingsApi = document.getElementById("btn-settings-api");
        const chatSearchInput = document.getElementById("chat-search-input") as HTMLInputElement;

        let appLanguage: string = localStorage.getItem("auto_latex_language") || "en";
        let isThinkingMode = false;
        let searchChatQuery = "";

        if (appBody) appBody.style.display = "flex";

        // Managers
        const sessionManager = new SessionManager();
        const quoteManager = new QuoteManager();
        const chatRenderer = new ChatRenderer("chat-messages");
        
        const converterUI = new ConverterUIManager(() => appLanguage);
        const settingsManager = new SettingsManager(appLanguage);

        quoteManager.init();
        converterUI.init();

        settingsManager.onLanguageChanged = (newLang) => {
            appLanguage = newLang;
            localStorage.setItem("auto_latex_language", appLanguage);
            applyLanguage(appLanguage);
        };
        settingsManager.init();

        // Language
        const applyLanguage = (lang: string) => {
            document.documentElement.lang = lang;
            const t = translations[lang] || translations["en"];
            document.querySelectorAll("[data-i18n]").forEach(el => {
                const key = el.getAttribute("data-i18n");
                if (key && t[key]) el.innerHTML = t[key];
            });
            document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
                const key = el.getAttribute("data-i18n-placeholder");
                if (key && t[key]) (el as HTMLInputElement).placeholder = t[key];
            });
            
            const langSelect = document.getElementById("app-language") as HTMLSelectElement;
            if (langSelect) langSelect.value = lang;
            
            const msgBubble = document.querySelector(".ai-msg .msg-bubble");
            if (msgBubble && (msgBubble.innerHTML.includes(translations["en"].aiWelcomeMsg) || msgBubble?.innerHTML.includes(translations["vi"].aiWelcomeMsg))) {
                msgBubble.innerHTML = t.aiWelcomeMsg;
            }

            const btnQuickLang = document.getElementById("btn-quick-lang");
            if (btnQuickLang) btnQuickLang.innerText = lang.toUpperCase();
        };

        // Sidebar Actions
        const showOptionsHandler = setupSessionOptions(sessionManager, () => appLanguage);

        const updateSidebar = () => {
            renderSidebar(sessionManager, appLanguage, searchChatQuery, showOptionsHandler);
        };

        const renderCurrentChat = () => {
            chatRenderer.clear();
            const session = sessionManager.getCurrentSession();
            if (!session || session.messages.length === 0) {
                const t = translations[appLanguage] || translations["en"];
                chatRenderer.appendAIMessage(t.aiWelcomeMsg, "", "");
            } else {
                session.messages.forEach(m => {
                    if (m.role === "user") chatRenderer.appendUserMessage(m.content, m.html);
                    else chatRenderer.appendAIMessage(m.html || escapeHtml(m.content), m.content, m.toolbar || "");
                });
            }
        };

        sessionManager.onSessionsChanged = updateSidebar;
        sessionManager.onSessionSwitched = (session) => {
            const t = translations[appLanguage] || translations["en"];
            if (chatTitle) {
                if (session.name !== t.defaultChatName) chatTitle.innerText = session.name; 
                else { session.name = t.defaultChatName; sessionManager.saveSessions(); chatTitle.innerText = t.defaultChatName; }
            }
            renderCurrentChat();
        };

        const toggleSidebar = (show: boolean) => {
            if (chatSidebar && chatSidebarOverlay) {
                if (show) {
                    chatSidebarOverlay.classList.add("visible");
                    chatSidebar.classList.add("visible");
                    document.body.classList.add("modal-open");
                } else {
                    chatSidebarOverlay.classList.remove("visible");
                    chatSidebar.classList.remove("visible");
                    document.body.classList.remove("modal-open");
                }
            }
        };

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

        // Global Shortcut: Alt + N to create new chat
        window.addEventListener("keyup", (e) => {
            if (e.altKey && (e.key.toLowerCase() === "n" || e.code === "KeyN")) {
                e.preventDefault();
                sessionManager.createNewSession();
                toggleSidebar(false);
                if (chatInput) chatInput.focus();
            }
        });

        btnSettingsApi?.addEventListener("click", () => {
            toggleSidebar(false);
            settingsManager.openSettings();
        });

        const btnQuickLang = document.getElementById("btn-quick-lang");
        btnQuickLang?.addEventListener("click", () => {
            const newLang = appLanguage === "en" ? "vi" : "en";
            appLanguage = newLang;
            localStorage.setItem("auto_latex_language", appLanguage);
            applyLanguage(appLanguage);
            settingsManager.setAppLanguage(appLanguage);
        });

        // Chat Events (click formula, copy, apply edits)
        setupChatEvents(chatMessages, () => appLanguage);

        const btnToggleThinking = document.getElementById("btn-toggle-thinking");
        const thinkingText = document.getElementById("thinking-text");

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

        // View Toggles
        fabChat?.addEventListener("click", () => {
            if (mainView) {
                mainView.classList.remove("view-visible");
                mainView.classList.add("view-hidden");
            }
            if (fabChat) {
                fabChat.classList.remove("fab-visible");
                fabChat.classList.add("fab-hidden");
            }
            if (chatView) {
                chatView.classList.remove("view-hidden");
                chatView.classList.add("view-visible");
            }
            const container = chatRenderer.container;
            if (container) container.scrollTop = container.scrollHeight;
        });

        btnBack?.addEventListener("click", () => {
            if (chatView) {
                chatView.classList.remove("view-visible");
                chatView.classList.add("view-hidden");
            }
            if (mainView) {
                mainView.classList.remove("view-hidden");
                mainView.classList.add("view-visible");
            }
            if (fabChat) {
                fabChat.classList.remove("fab-hidden");
                fabChat.classList.add("fab-visible");
            }
        });

        // Custom Select dismiss global listener
        document.addEventListener("click", () => {
            document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
            document.querySelectorAll(".custom-select").forEach(el => el.classList.remove("active"));
        });

        // Draft Persistence
        const draftKey = "auto_latex_chat_draft";
        
        // Send Chat action
        const onSendChat = () => {
            if (btnSendChat.disabled) return;
            handleSendChat({
                sessionManager,
                quoteManager,
                chatRenderer,
                getLanguage: () => appLanguage,
                getThinkingMode: () => isThinkingMode,
                chatInput,
                btnSendChat
            });
            localStorage.removeItem(draftKey);
        };

        btnSendChat?.addEventListener("click", onSendChat);
        chatInput?.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSendChat();
            }
        });

        // Init Language and Sessions
        applyLanguage(appLanguage);
        const t = translations[appLanguage] || translations["en"];
        sessionManager.setDefaultChatName(t.defaultChatName);
        sessionManager.loadSessions();

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft && chatInput) {
            chatInput.value = savedDraft;
        }
        chatInput?.addEventListener("input", (e) => {
            localStorage.setItem(draftKey, (e.target as HTMLTextAreaElement).value);
        });
    }
});
