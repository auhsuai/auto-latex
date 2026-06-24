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

if (process.env.NODE_ENV !== "development") {
    document.querySelectorAll('.dev-only').forEach(el => el.remove());
}

Chart.register(...registerables);

Office.onReady(async (info) => {
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
        let activeDialog: Office.Dialog | null = null;
        let isStreamingChat = false;
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

        window.addEventListener('storage', (e) => {
            if (e.key === "auto_latex_language" && e.newValue && e.newValue !== appLanguage) {
                appLanguage = e.newValue;
                applyLanguage(appLanguage);
                settingsManager.setAppLanguage(appLanguage);
            }
        });

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

        // Global Shortcuts
        window.addEventListener("keyup", (e) => {
            // Escape to close modals and sidebars
            if (e.key === "Escape") {
                const settingsModal = document.getElementById("settings-modal");
                const renameModal = document.getElementById("rename-modal");
                const deleteModal = document.getElementById("delete-modal");
                
                if (settingsModal && settingsModal.style.display !== "none") {
                    document.getElementById("btn-close-settings")?.click();
                    return;
                }
                if (renameModal && renameModal.style.display !== "none") {
                    document.getElementById("btn-cancel-rename")?.click();
                    return;
                }
                if (deleteModal && deleteModal.style.display !== "none") {
                    document.getElementById("btn-cancel-delete")?.click();
                    return;
                }
                if (chatSidebar && chatSidebar.classList.contains("visible")) {
                    toggleSidebar(false);
                    return;
                }
                if (chatView && chatView.classList.contains("view-visible")) {
                    btnBack?.click();
                    return;
                }
                return;
            }

            if (e.altKey) {
                const key = e.key.toLowerCase();
                
                // Alt + N: New Chat
                if (key === "n" || e.code === "KeyN") {
                    e.preventDefault();
                    sessionManager.createNewSession();
                    toggleSidebar(false);
                    if (chatInput) chatInput.focus();
                }
                // Alt + S: Open Settings
                else if (key === "s" || e.code === "KeyS") {
                    e.preventDefault();
                    toggleSidebar(false);
                    settingsManager.openSettings();
                }
                // Alt + M: Toggle Menu (Sidebar)
                else if (key === "m" || e.code === "KeyM") {
                    e.preventDefault();
                    const isVisible = chatSidebar?.classList.contains("visible");
                    toggleSidebar(!isVisible);
                }
                // Alt + T: Toggle Thinking Mode
                else if (key === "t" || e.code === "KeyT") {
                    e.preventDefault();
                    const btnToggleThinking = document.getElementById("btn-toggle-thinking");
                    if (btnToggleThinking && btnToggleThinking.style.display !== "none") {
                        btnToggleThinking.click();
                    }
                }
                // Alt + L: Toggle Language
                else if (key === "l" || e.code === "KeyL") {
                    e.preventDefault();
                    const btnQuickLang = document.getElementById("btn-quick-lang");
                    btnQuickLang?.click();
                }
                // Alt + /: Focus chat input
                else if (key === "/") {
                    e.preventDefault();
                    // If not in chat view, switch to it
                    if (chatView && !chatView.classList.contains("view-visible")) {
                        fabChat?.click();
                    }
                    setTimeout(() => {
                        if (chatInput) chatInput.focus();
                    }, 50);
                }
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
        
        // Show thinking toggle unless provider is Kira (no deep thinking support)
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

        // View Toggles
        fabChat?.addEventListener("click", async () => {
            if (activeDialog) {
                activeDialog.close();
                activeDialog = null;
            }
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

            // Refresh sessions and load draft
            await sessionManager.loadSessions(true);
            updateSidebar();
            renderCurrentChat();
            
            const draft = sessionManager.loadDraft();
            if (draft.prompt) chatInput.value = draft.prompt;
            if (draft.quote && draft.quote.text) quoteManager.setQuote(draft.quote.text, draft.quote.isFromWord);
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

        const btnExpandDialog = document.getElementById("btn-expand-dialog") as HTMLButtonElement;
        if (btnExpandDialog) {
            btnExpandDialog.addEventListener("click", () => {
                if (isStreamingChat) return; // Prevent switching if streaming
                
                // Save draft
                const currentPrompt = chatInput.value.trim();
                const currentQuote = quoteManager.currentQuotedText || "";
                const isFromWord = quoteManager.isQuoteFromWord;
                sessionManager.saveDraft(currentPrompt, currentQuote, isFromWord);
                
                // Switch to main view locally
                btnBack?.click();
                
                // Open Dialog
                const dialogUrl = new URL("dialog.html", window.location.href).href;
                Office.context.ui.displayDialogAsync(dialogUrl, { height: 75, width: 65, promptBeforeOpen: false }, (result) => {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        activeDialog = result.value;
                        const msgHandler = async (arg: any) => {
                            const msg = JSON.parse(arg.message);
                            if (msg.type === "dialogClosed" || msg.type === "reopenFullscreen") {
                                activeDialog?.close();
                                activeDialog = null;
                                if (msg.type === "reopenFullscreen") {
                                    setTimeout(() => {
                                        Office.context.ui.displayDialogAsync(dialogUrl, { height: 100, width: 100, promptBeforeOpen: false }, (res) => {
                                            if (res.status === Office.AsyncResultStatus.Succeeded) {
                                                activeDialog = res.value;
                                                activeDialog.addEventHandler(Office.EventType.DialogMessageReceived, msgHandler);
                                            }
                                        });
                                    }, 500);
                                } else {
                                    await sessionManager.loadSessions(true);
                                    updateSidebar();
                                    renderCurrentChat();
                                    const draft = sessionManager.loadDraft();
                                    if (draft.prompt) chatInput.value = draft.prompt;
                                    if (draft.quote && draft.quote.text) quoteManager.setQuote(draft.quote.text, draft.quote.isFromWord);
                                }
                            }
                        };
                        activeDialog.addEventHandler(Office.EventType.DialogMessageReceived, msgHandler);
                        activeDialog.addEventHandler(Office.EventType.DialogEventReceived, async (arg: any) => {
                            if (arg.error === 12006) {
                                activeDialog = null;
                                await sessionManager.loadSessions(true);
                                updateSidebar();
                                renderCurrentChat();
                                const draft = sessionManager.loadDraft();
                                if (draft.prompt) chatInput.value = draft.prompt;
                                if (draft.quote && draft.quote.text) quoteManager.setQuote(draft.quote.text, draft.quote.isFromWord);
                            }
                        });
                    }
                });
            });
        }

        // Custom Select dismiss global listener
        document.addEventListener("click", () => {
            document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
            document.querySelectorAll(".custom-select").forEach(el => el.classList.remove("active"));
        });

        // Draft Persistence
        const draftKey = "auto_latex_chat_draft";
        
        // Send Chat action
        const onSendChat = () => {
            handleSendChat({
                sessionManager,
                quoteManager,
                chatRenderer,
                getLanguage: () => appLanguage,
                getThinkingMode: () => isThinkingMode,
                chatInput,
                btnSendChat,
                onStreamingStateChange: (isStreaming) => {
                    isStreamingChat = isStreaming;
                    if (btnExpandDialog) {
                        btnExpandDialog.style.opacity = isStreaming ? "0.5" : "1";
                        btnExpandDialog.style.pointerEvents = isStreaming ? "none" : "auto";
                    }
                }
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
        await sessionManager.loadSessions(true);

        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft && chatInput) {
            chatInput.value = savedDraft;
        }
        chatInput?.addEventListener("input", (e) => {
            localStorage.setItem(draftKey, (e.target as HTMLTextAreaElement).value);
        });
    }
});
