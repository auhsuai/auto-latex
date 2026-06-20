import { getAISettings, saveAISettings, sendChatMessage, AIProvider, ChatMessage } from "../shared/ai-service";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    // ---- Elements Setup ----
    const mainView = document.getElementById("main-view");
    const chatView = document.getElementById("chat-view");
    const fabChat = document.getElementById("fab-chat");
    const appBody = document.getElementById("app-body");

    // Converter UI elements
    const convertDocBtn = document.getElementById("convert-doc") as HTMLButtonElement;
    const convertSelBtn = document.getElementById("convert-sel") as HTMLButtonElement;
    const cancelMsg = document.getElementById("cancel-msg");
    const cancelLink = document.getElementById("cancel-link");

    // Chat UI elements
    const btnBack = document.getElementById("btn-back");
    const btnSettings = document.getElementById("btn-settings");
    const btnSendChat = document.getElementById("btn-send-chat") as HTMLButtonElement;
    const chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
    const chatMessages = document.getElementById("chat-messages");

    // Settings UI elements
    const settingsModal = document.getElementById("settings-modal");
    const btnCloseSettings = document.getElementById("btn-close-settings");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;

    // Custom Select logic
    let tempSelectedProvider = "gemini";
    let tempSelectedLanguage = appLanguage;

    const updateCustomSelect = (wrapperId: string, value: string) => {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const textSpan = wrapper.querySelector(".custom-select span");
        const options = wrapper.querySelectorAll(".custom-select-option");
        options.forEach(opt => {
            if (opt.getAttribute("data-val") === value) {
                opt.classList.add("selected");
                if (textSpan) textSpan.innerHTML = opt.innerHTML;
            } else {
                opt.classList.remove("selected");
            }
        });
    };

    const initCustomSelect = (wrapperId: string, onChange: (val: string) => void) => {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const display = wrapper.querySelector(".custom-select") as HTMLElement;
        const optionsDiv = wrapper.querySelector(".custom-select-options") as HTMLElement;
        const options = wrapper.querySelectorAll(".custom-select-option");

        display.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = optionsDiv.style.display === "block";
            document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
            document.querySelectorAll(".custom-select").forEach(el => el.classList.remove("active"));
            if (!isOpen) {
                optionsDiv.style.display = "block";
                display.classList.add("active");
            }
        });

        options.forEach(opt => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const val = opt.getAttribute("data-val");
                if (val) onChange(val);
                optionsDiv.style.display = "none";
                display.classList.remove("active");
                updateCustomSelect(wrapperId, val!);
            });
        });
    };

    initCustomSelect("lang-select-wrapper", (val) => tempSelectedLanguage = val);
    initCustomSelect("provider-select-wrapper", (val) => tempSelectedProvider = val);

    document.addEventListener("click", () => {
        document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
        document.querySelectorAll(".custom-select").forEach(el => el.classList.remove("active"));
    });

    if (appBody) {
        appBody.style.display = "flex";
    }

    // ---- View Toggles ----
    fabChat?.addEventListener("click", () => {
        if (mainView) mainView.style.display = "none";
        if (fabChat) fabChat.style.display = "none";
        if (chatView) {
            chatView.style.display = "flex";
            scrollToBottom();
        }
    });

    btnBack?.addEventListener("click", () => {
        if (chatView) chatView.style.display = "none";
        if (mainView) mainView.style.display = "flex";
        if (fabChat) fabChat.style.display = "flex";
    });

    // ---- Settings Logic ----
    const loadSettingsToUI = () => {
        const settings = getAISettings();
        tempSelectedProvider = settings.provider;
        tempSelectedLanguage = appLanguage;
        if (apiKeyInput) apiKeyInput.value = settings.apiKey;
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        if (autoApplyToggle) autoApplyToggle.checked = settings.autoApplyEdits;
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        if (insertAtCursorToggle) insertAtCursorToggle.checked = settings.insertAtCursor;
        updateCustomSelect("provider-select-wrapper", tempSelectedProvider);
        updateCustomSelect("lang-select-wrapper", tempSelectedLanguage);
    };

    const btnQuickLang = document.getElementById("btn-quick-lang");
    btnQuickLang?.addEventListener("click", () => {
        appLanguage = appLanguage === "en" ? "vi" : "en";
        localStorage.setItem("auto_latex_language", appLanguage);
        applyLanguage(appLanguage);
    });

    btnSettings?.addEventListener("click", () => {
        loadSettingsToUI();
        if (settingsModal) settingsModal.style.display = "flex";
    });

    btnCloseSettings?.addEventListener("click", () => {
        if (settingsModal) settingsModal.style.display = "none";
    });

    btnSaveSettings?.addEventListener("click", () => {
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        
        saveAISettings({
            provider: tempSelectedProvider as AIProvider,
            apiKey: apiKey,
            autoApplyEdits: autoApplyToggle ? autoApplyToggle.checked : false,
            insertAtCursor: insertAtCursorToggle ? insertAtCursorToggle.checked : true
        });

        if (tempSelectedLanguage !== appLanguage) {
            appLanguage = tempSelectedLanguage;
            localStorage.setItem("auto_latex_language", appLanguage);
            applyLanguage(appLanguage);
        }

        if (settingsModal) settingsModal.style.display = "none";
    });

    // ---- Original Converter Logic ----
    const handleConversion = async (btn: HTMLButtonElement, isSelection: boolean) => {
        const originalText = btn.innerText;
        const progressSpan = document.getElementById("progress-text");
        let timeoutId: any = null;

        const state = { 
            isCancelled: false,
            onProgress: (remaining: number, total: number) => {
                if (cancelMsg && progressSpan) {
                    const t = translations[appLanguage] || translations["en"];
                    if (total > 0 && remaining > 0) {
                        btn.innerText = t.convertingLeft.replace("{0}", remaining.toString());
                        progressSpan.innerText = t.soLong;
                    } else if (remaining === 0) {
                        cancelMsg.style.display = "none";
                        btn.innerText = t.finishing;
                    }
                }
            }
        };

        try {
            const t = translations[appLanguage] || translations["en"];
            btn.disabled = true;
            btn.innerText = t.converting;

            if (cancelMsg && cancelLink) {
                timeoutId = setTimeout(() => {
                    if (!state.isCancelled && (btn.innerText === t.converting || btn.innerText.includes("{0}") || btn.innerText.includes("Converting") || btn.innerText.includes("Đang chuyển"))) {
                        cancelMsg.style.display = "block";
                    }
                }, 5000);

                cancelLink.onclick = (e) => {
                    e.preventDefault();
                    state.isCancelled = true;
                    btn.innerText = t.cancelling;
                    cancelMsg.style.display = "none";
                };
            }

            const { runConversion } = await import("../shared/converter");
            await runConversion(isSelection, state);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (cancelMsg) cancelMsg.style.display = "none";
            btn.disabled = false;
            btn.innerText = originalText;
        }
    };

    if (convertDocBtn) {
        convertDocBtn.onclick = () => handleConversion(convertDocBtn, false);
    }
    if (convertSelBtn) {
        convertSelBtn.onclick = () => handleConversion(convertSelBtn, true);
    }

    // ---- Multi-Session Chat Logic ----
    let currentQuotedText = "";
    let isQuoteFromWord = false;
    let debounceSelectionTimer: any = null;
    let currentTaskpaneSelection = "";

    const selectionPrompt = document.getElementById("selection-prompt");
    const btnQuoteSelection = document.getElementById("btn-quote-selection");
    const quotedContext = document.getElementById("quoted-context");
    const quotedTextEl = document.getElementById("quoted-text");
    const btnRemoveQuote = document.getElementById("btn-remove-quote");
    const btnAttachContext = document.getElementById("btn-attach-context");

    const showSelectionPrompt = (rect?: DOMRect) => {
        if (selectionPrompt) {
            selectionPrompt.style.display = "flex";
            if (rect) {
                selectionPrompt.style.position = "fixed";
                let topPos = rect.top - 8;
                let transformStr = "translate(-50%, -100%)";
                if (topPos < 40) {
                    topPos = rect.bottom + 8;
                    transformStr = "translate(-50%, 0)";
                }
                selectionPrompt.style.top = topPos + "px";
                selectionPrompt.style.left = (rect.left + rect.width / 2) + "px";
                selectionPrompt.style.transform = transformStr;
            } else {
                selectionPrompt.style.position = "absolute";
                selectionPrompt.style.top = "-46px";
                selectionPrompt.style.left = "50%";
                selectionPrompt.style.transform = "translateX(-50%)";
            }
        }
    };

    const hideSelectionPrompt = () => {
        if (selectionPrompt) {
            selectionPrompt.style.display = "none";
        }
    };

    let taskpaneSelectionTimer: any = null;
    document.addEventListener("selectionchange", () => {
        if (taskpaneSelectionTimer) clearTimeout(taskpaneSelectionTimer);
        hideSelectionPrompt(); // Hide immediately while dragging

        taskpaneSelectionTimer = setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (text && text.length > 0 && selection && selection.rangeCount > 0) {
                currentTaskpaneSelection = text;
                const rect = selection.getRangeAt(0).getBoundingClientRect();
                showSelectionPrompt(rect);
            } else {
                hideSelectionPrompt();
            }
        }, 300);
    });

    const onSelectionChanged = () => {
        if (debounceSelectionTimer) clearTimeout(debounceSelectionTimer);
        hideSelectionPrompt();
        debounceSelectionTimer = setTimeout(() => {
            Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const text = (result.value as string).trim();
                    if (text && text.length > 0) {
                        currentTaskpaneSelection = ""; // clear taskpane selection if word is selected
                        showSelectionPrompt();
                    } else {
                        hideSelectionPrompt();
                    }
                } else {
                    hideSelectionPrompt();
                }
            });
        }, 300);
    };

    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, onSelectionChanged);

    const applyQuote = async () => {
        try {
            let textToQuote = currentTaskpaneSelection;
            isQuoteFromWord = false;

            if (!textToQuote) {
                await Word.run(async (context) => {
                    const selection = context.document.getSelection();
                    context.load(selection, "text");
                    await context.sync();
                    textToQuote = selection.text.trim();
                    if (textToQuote) isQuoteFromWord = true;
                });
            }

            if (textToQuote) {
                currentQuotedText = textToQuote;
                if (quotedTextEl) {
                    quotedTextEl.innerText = currentQuotedText.length > 50 ? currentQuotedText.substring(0, 50) + "..." : currentQuotedText;
                }
                if (quotedContext) quotedContext.style.display = "flex";
                if (selectionPrompt) selectionPrompt.style.display = "none";
                if (chatInput) chatInput.focus();
                currentTaskpaneSelection = ""; // reset
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Prevent losing selection when clicking the buttons
    btnQuoteSelection?.addEventListener("mousedown", (e) => e.preventDefault());
    btnAttachContext?.addEventListener("mousedown", (e) => e.preventDefault());

    btnQuoteSelection?.addEventListener("click", applyQuote);
    btnAttachContext?.addEventListener("click", applyQuote);

    btnRemoveQuote?.addEventListener("click", () => {
        currentQuotedText = "";
        if (quotedContext) quotedContext.style.display = "none";
    });

    interface ChatSession {
        id: string;
        name: string;
        isPinned: boolean;
        messages: ChatMessage[];
        updatedAt: number;
    }

    const STORAGE_KEY = "auto_latex_chat_sessions";
    let chatSessions: ChatSession[] = [];
    let currentSessionId: string | null = null;
    let targetSessionId: string | null = null;
    let appLanguage: string = localStorage.getItem("auto_latex_language") || "en";

    // Translations
    const translations: Record<string, Record<string, string>> = {
        en: {
            menuTitle: "Menu",
            chatHistory: "Chat History",
            newChat: "New Chat",
            apiSettings: "Settings",
            chatPlaceholder: "Ask AI...",
            chatHint: "Automatically inserts result into document",
            optRename: "Rename",
            optPin: "Pin",
            optUnpin: "Unpin",
            optDelete: "Delete",
            settingsTitle: "Settings",
            languageLabel: "Language / Ngôn ngữ",
            providerLabel: "AI Provider",
            apiKeyLabel: "API Key",
            apiKeyPlaceholder: "Paste your API key here...",
            autoApplyLabel: "Auto-apply AI Edits",
            insertAtCursorLabel: "Insert new formula at cursor",
            btnApplyEdit: "Apply",
            btnCancel: "Cancel",
            btnSave: "Save",
            renameTitle: "Rename Chat",
            renamePlaceholder: "Enter new name...",
            deleteTitle: "Delete Chat",
            deleteConfirm: "Are you sure you want to delete this chat? This action cannot be undone.",
            aiWelcomeMsg: "Hello! I am your AI Math Assistant. Highlight text/formulas in Word or type below to generate LaTeX code.",
            defaultChatName: "New Chat",
            promptRename: "Enter new chat name:",
            confirmDelete: "Are you sure you want to delete this chat?",
            converting: "Converting...",
            convertingLeft: "Converting, {0} left...",
            finishing: "Finishing...",
            cancelling: "Cancelling...",
            soLong: "So long? ",
            appDescription: "Accurate and high-performance Math formula converter for Microsoft Word.",
            convertAll: "Convert All",
            convertSelection: "Convert Selection",
            cancelHere: "Cancel here",
            createdBy: "Created by",
            textSelected: "Text selected",
            askAI: "Ask AI"
        },
        vi: {
            menuTitle: "Menu",
            chatHistory: "Lịch sử chat",
            newChat: "Cuộc trò chuyện mới",
            apiSettings: "Cài đặt",
            chatPlaceholder: "Yêu cầu AI...",
            chatHint: "Tự động chèn kết quả vào tài liệu",
            optRename: "Đổi tên",
            optPin: "Ghim",
            optUnpin: "Bỏ ghim",
            optDelete: "Xóa",
            settingsTitle: "Cài đặt",
            languageLabel: "Language / Ngôn ngữ",
            providerLabel: "Nhà cung cấp AI",
            apiKeyLabel: "API Key",
            apiKeyPlaceholder: "Dán mã API của bạn vào đây...",
            autoApplyLabel: "Tự động áp dụng chỉnh sửa",
            insertAtCursorLabel: "Chèn công thức mới vào vị trí con trỏ",
            btnApplyEdit: "Áp dụng",
            btnCancel: "Hủy",
            btnSave: "Lưu",
            renameTitle: "Đổi tên đoạn chat",
            renamePlaceholder: "Nhập tên mới...",
            deleteTitle: "Xóa đoạn chat",
            deleteConfirm: "Bạn có chắc chắn muốn xóa đoạn chat này không? Hành động này không thể hoàn tác.",
            aiWelcomeMsg: "Xin chào! Tôi là AI Math Assistant. Bôi đen văn bản/công thức trên Word hoặc gõ yêu cầu ở dưới để tôi tạo mã LaTeX cho bạn nhé.",
            defaultChatName: "Tin nhắn mới",
            promptRename: "Nhập tên đoạn chat mới:",
            confirmDelete: "Bạn có chắc chắn muốn xóa đoạn chat này không?",
            converting: "Đang chuyển đổi...",
            convertingLeft: "Đang chuyển, còn {0}...",
            finishing: "Đang hoàn tất...",
            cancelling: "Đang hủy...",
            soLong: "Lâu quá à? ",
            appDescription: "Công cụ chuyển đổi công thức Toán học chính xác và hiệu suất cao cho Microsoft Word.",
            convertAll: "Chuyển đổi Toàn bộ",
            convertSelection: "Chuyển đổi Vùng chọn",
            cancelHere: "Hủy tại đây",
            createdBy: "Được phát triển bởi",
            textSelected: "Đã chọn văn bản",
            askAI: "Ask AI"
        }
    };

    const applyLanguage = (lang: string) => {
        const t = translations[lang] || translations["en"];
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (key && t[key]) {
                el.innerHTML = t[key];
            }
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
            const key = el.getAttribute("data-i18n-placeholder");
            if (key && t[key]) {
                (el as HTMLInputElement).placeholder = t[key];
            }
        });
        
        const langSelect = document.getElementById("app-language") as HTMLSelectElement;
        if (langSelect) langSelect.value = lang;
        
        // Update welcome message if currently rendered
        const msgBubble = document.querySelector(".ai-msg .msg-bubble");
        if (msgBubble && msgBubble.innerHTML.includes(translations["en"].aiWelcomeMsg) || msgBubble?.innerHTML.includes(translations["vi"].aiWelcomeMsg)) {
            msgBubble.innerHTML = t.aiWelcomeMsg;
        }

        // Update Quick Lang Button
        const btnQuickLang = document.getElementById("btn-quick-lang");
        if (btnQuickLang) {
            btnQuickLang.innerText = lang.toUpperCase();
        }
    };

    // Elements
    const btnChatMenu = document.getElementById("btn-chat-menu");
    const chatSidebar = document.getElementById("chat-sidebar");
    const chatSidebarOverlay = document.getElementById("chat-sidebar-overlay");
    const btnCloseSidebar = document.getElementById("btn-close-sidebar");
    const btnBackMain = document.getElementById("btn-back-main");
    const btnNewChat = document.getElementById("btn-new-chat");
    const historyChatsList = document.getElementById("history-chats-list");
    const btnSettingsApi = document.getElementById("btn-settings-api");
    const chatTitle = document.getElementById("chat-title");
    
    // Options
    const btnChatOptions = document.getElementById("btn-chat-options");
    const chatOptionsDropdown = document.getElementById("chat-options-dropdown");
    const optRename = document.getElementById("opt-rename");
    const optPin = document.getElementById("opt-pin");
    const optDelete = document.getElementById("opt-delete");

    // Modals
    const renameModal = document.getElementById("rename-modal");
    const renameInput = document.getElementById("rename-input") as HTMLInputElement;
    const btnCancelRename = document.getElementById("btn-cancel-rename");
    const btnSaveRename = document.getElementById("btn-save-rename");
    
    const deleteModal = document.getElementById("delete-modal");
    const btnCancelDelete = document.getElementById("btn-cancel-delete");
    const btnConfirmDelete = document.getElementById("btn-confirm-delete");

    const saveSessions = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(chatSessions));

    const escapeHtml = (unsafe: string) => {
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    const scrollToBottom = () => {
        if (!chatMessages) return;
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    };

    const appendUserMessage = (text: string, htmlContent?: string) => {
        if (!chatMessages) return;
        const div = document.createElement("div");
        div.className = "chat-msg user-msg";
        div.innerHTML = `<div class="msg-bubble" style="display: flex; flex-direction: column;">${htmlContent || escapeHtml(text)}</div>`;
        chatMessages.appendChild(div);
        scrollToBottom();
    };

    const appendAIMessage = (htmlContent: string, rawContent: string = "", toolbarHtml: string = "") => {
        if (!chatMessages) return;
        const div = document.createElement("div");
        div.className = "chat-msg ai-msg";
        
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
        chatMessages.appendChild(div);
        scrollToBottom();
        return div;
    };

    const appendAIError = (errorStr: string) => {
        if (!chatMessages) return;
        const div = document.createElement("div");
        div.className = "chat-msg ai-msg";
        div.innerHTML = `<div class="msg-bubble" style="color: #d83b01;">Error: ${escapeHtml(errorStr)}</div>`;
        chatMessages.appendChild(div);
        scrollToBottom();
    };

    let skeletonEl: HTMLElement | null = null;
    const showSkeleton = () => {
        if (!chatMessages) return;
        skeletonEl = document.createElement("div");
        skeletonEl.className = "chat-msg ai-msg";
        skeletonEl.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>`;
        chatMessages.appendChild(skeletonEl);
        scrollToBottom();
    };

    const removeSkeleton = () => {
        if (skeletonEl && skeletonEl.parentNode) {
            skeletonEl.parentNode.removeChild(skeletonEl);
        }
        skeletonEl = null;
    };

    const renderSidebar = () => {
        const historyChatsList = document.getElementById("history-chats-list");
        if (!historyChatsList) return;
        historyChatsList.innerHTML = "";
        
        // Clone and sort to not mutate original array order
        const sorted = [...chatSessions].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.updatedAt - a.updatedAt;
        });

        sorted.forEach(session => {
            const li = document.createElement("li");
            li.className = `chat-list-item ${session.id === currentSessionId ? "active" : ""}`;
            
            const pinIconHtml = session.isPinned ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; color: var(--color-primary); flex-shrink: 0;"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.6V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.6a2 2 0 0 1-1.11 1.95l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>` : '';
            
            li.innerHTML = `
                ${pinIconHtml}
                <span class="chat-name">${escapeHtml(session.name)}</span>
                <button class="btn-item-opts" aria-label="Options">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>
            `;
            li.onclick = () => {
                switchSession(session.id);
                closeSidebar();
            };
            
            const btnOpts = li.querySelector('.btn-item-opts') as HTMLElement;
            btnOpts.onclick = (e) => {
                e.stopPropagation();
                targetSessionId = session.id;
                const dropdown = document.getElementById("item-options-dropdown");
                if (dropdown) {
                    const t = translations[appLanguage] || translations["en"];
                    dropdown.style.display = "block";
                    const rect = btnOpts.getBoundingClientRect();
                    dropdown.style.top = (rect.bottom + 4) + "px";
                    dropdown.style.left = (rect.right - 160) + "px";
                    const optPin = document.getElementById("opt-pin");
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
            
            historyChatsList.appendChild(li);
        });
    };

    const renderCurrentChat = () => {
        if (!chatMessages) return;
        const session = chatSessions.find(s => s.id === currentSessionId);
        chatMessages.innerHTML = '';
        if (!session || session.messages.length === 0) {
            const t = translations[appLanguage] || translations["en"];
            chatMessages.innerHTML = `
            <div class="chat-msg ai-msg">
                <div class="msg-bubble">
                    ${t.aiWelcomeMsg}
                </div>
            </div>`;
        } else {
            session.messages.forEach(m => {
                if (m.role === "user") {
                    appendUserMessage(m.content, m.html);
                } else if (m.html) {
                    appendAIMessage(m.html, m.content, m.toolbar || "");
                } else {
                    // Fallback for old messages without html
                    appendAIMessage(escapeHtml(m.content), m.content);
                }
            });
        }
        scrollToBottom();
    };

    const switchSession = (id: string) => {
        currentSessionId = id;
        const session = chatSessions.find(s => s.id === id);
        if (session && chatTitle) {
            chatTitle.innerText = session.name;
        }
        renderSidebar();
        renderCurrentChat();
    };

    const createNewSession = () => {
        const t = translations[appLanguage] || translations["en"];
        const newSession: ChatSession = {
            id: Date.now().toString(),
            name: t.defaultChatName,
            isPinned: false,
            messages: [],
            updatedAt: Date.now()
        };
        chatSessions.unshift(newSession);
        switchSession(newSession.id);
        saveSessions();
    };

    const loadSessions = () => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) chatSessions = JSON.parse(data);
        } catch (e) {
            console.error("Failed to load sessions");
        }
        if (chatSessions.length === 0) createNewSession();
        else {
            chatSessions.sort((a, b) => b.updatedAt - a.updatedAt);
            switchSession(chatSessions[0].id);
        }
    };

    const deleteCurrentSession = () => {
        chatSessions = chatSessions.filter(s => s.id !== currentSessionId);
        if (chatSessions.length === 0) createNewSession();
        else {
            chatSessions.sort((a, b) => b.updatedAt - a.updatedAt);
            switchSession(chatSessions[0].id);
        }
        saveSessions();
    };

    const autoRenameSession = (session: ChatSession, firstMsg: string) => {
        if (session.name !== "New Chat") return;
        let newName = firstMsg.trim();
        if (newName.length > 25) {
            newName = newName.substring(0, 25) + "...";
        }
        session.name = newName;
        if (chatTitle && session.id === currentSessionId) chatTitle.innerText = newName;
        saveSessions();
        renderSidebar();
    };

    const toggleSidebar = (show: boolean) => {
        if (chatSidebar && chatSidebarOverlay) {
            if (show) {
                chatSidebarOverlay.style.display = "block";
                chatSidebar.style.transform = "translateX(0)";
            } else {
                chatSidebarOverlay.style.display = "none";
                chatSidebar.style.transform = "translateX(100%)";
            }
        }
    };
    const closeSidebar = () => toggleSidebar(false);

    btnChatMenu?.addEventListener("click", () => toggleSidebar(true));
    btnCloseSidebar?.addEventListener("click", closeSidebar);
    chatSidebarOverlay?.addEventListener("click", closeSidebar);
    
    btnNewChat?.addEventListener("click", () => {
        createNewSession();
        closeSidebar();
    });
    btnSettingsApi?.addEventListener("click", () => {
        closeSidebar();
        loadSettingsToUI();
        if (settingsModal) settingsModal.style.display = "flex";
    });

    const btnToggleThinking = document.getElementById("btn-toggle-thinking");
    const thinkingText = document.getElementById("thinking-text");
    let isThinkingMode = false;

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

    chatMessages?.addEventListener("click", async (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("btn-apply-edit")) {
            const card = target.closest(".pending-edit-card") as HTMLElement;
            if (!card) return;
            
            const type = card.getAttribute("data-edit-type");
            const content = decodeURIComponent(card.getAttribute("data-edit-content") || "");
            const targetStr = decodeURIComponent(card.getAttribute("data-edit-target") || "");

            target.innerText = "Applying...";
            target.disabled = true;

            const settings = getAISettings();

            try {
                const { DocumentEditor } = await import("../shared/document-editor");
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

                target.innerHTML = `<span style="color: var(--color-text-muted); font-weight: 500; font-size: 13px; display: inline-flex; align-items: center; padding: 4px 6px;">${notifText}</span>`;
                setTimeout(() => {
                    target.innerHTML = `<span style="font-weight: 500;">${btnApplyText}</span>`;
                    target.disabled = false;
                }, 10000);
            } catch(err) {
                target.innerText = "Error!";
                target.disabled = false;
            }
        } else if (target.closest(".btn-copy-msg")) {
            const btn = target.closest(".btn-copy-msg") as HTMLElement;
            const textToCopy = decodeURIComponent(btn.getAttribute("data-copy-text") || "");
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#107c41" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                    }, 2000);
                });
            }
        }
    });

    document.addEventListener("click", () => {
        const dropdown = document.getElementById("item-options-dropdown");
        if (dropdown) dropdown.style.display = "none";
    });

    optRename?.addEventListener("click", () => {
        if (!targetSessionId) return;
        const session = chatSessions.find(s => s.id === targetSessionId);
        if (session) {
            if (renameInput) renameInput.value = session.name === "New Chat" ? "" : session.name;
            if (renameModal) renameModal.style.display = "flex";
            setTimeout(() => renameInput?.focus(), 100);
        }
    });

    btnCancelRename?.addEventListener("click", () => {
        if (renameModal) renameModal.style.display = "none";
    });

    btnSaveRename?.addEventListener("click", () => {
        if (!targetSessionId || !renameInput) return;
        const session = chatSessions.find(s => s.id === targetSessionId);
        if (session) {
            const newName = renameInput.value;
            if (newName && newName.trim()) {
                session.name = newName.trim();
                saveSessions();
                if (currentSessionId === session.id) switchSession(session.id);
                else renderSidebar();
            }
        }
        if (renameModal) renameModal.style.display = "none";
    });
    
    renameInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnSaveRename?.click();
    });
    optPin?.addEventListener("click", () => {
        if (!targetSessionId) return;
        const session = chatSessions.find(s => s.id === targetSessionId);
        if (session) {
            session.isPinned = !session.isPinned;
            session.updatedAt = Date.now();
            saveSessions();
            renderSidebar();
            if (currentSessionId === session.id) switchSession(session.id);
        }
    });
    optDelete?.addEventListener("click", () => {
        if (!targetSessionId) return;
        if (deleteModal) deleteModal.style.display = "flex";
    });

    btnCancelDelete?.addEventListener("click", () => {
        if (deleteModal) deleteModal.style.display = "none";
    });

    btnConfirmDelete?.addEventListener("click", () => {
        if (!targetSessionId) return;
        chatSessions = chatSessions.filter(s => s.id !== targetSessionId);
        if (chatSessions.length === 0) createNewSession();
        else if (currentSessionId === targetSessionId) switchSession(chatSessions[0].id);
        else renderSidebar();
        saveSessions();
        if (deleteModal) deleteModal.style.display = "none";
    });

    // Chat sending logic
    const handleSendChat = async () => {
        const prompt = chatInput?.value.trim();
        if (!prompt && !currentQuotedText) return;

        if (chatInput) chatInput.value = "";
        btnSendChat.disabled = true;

        const settings = getAISettings();
        
        let displayHtml = "";
        let fullPromptForAI = prompt || "";
        
        if (currentQuotedText) {
            displayHtml += `<div style="font-size: 11.5px; opacity: 0.9; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2);"><span style="margin-right:4px;">↳</span>${escapeHtml(currentQuotedText.length > 80 ? currentQuotedText.substring(0, 80) + '...' : currentQuotedText)}</div>`;
            const quoteLabel = isQuoteFromWord ? "Văn bản đang bôi đen trên Word" : "Trích dẫn từ Chat";
            fullPromptForAI = `[${quoteLabel}]: "${currentQuotedText}"\n\n${prompt || "Vui lòng xử lý văn bản trên."}`;
        }
        if (prompt) {
            displayHtml += escapeHtml(prompt).replace(/\n/g, '<br>');
        } else {
            displayHtml += "<i>[Gửi văn bản trích dẫn]</i>";
        }

        appendUserMessage(fullPromptForAI, displayHtml);
        showSkeleton();

        const session = chatSessions.find(s => s.id === currentSessionId)!;

        // Clear quote UI
        const savedQuoteForDocContext = currentQuotedText;
        const savedIsQuoteFromWord = isQuoteFromWord;
        currentQuotedText = "";
        isQuoteFromWord = false;
        if (quotedContext) quotedContext.style.display = "none";

        try {
            const { DocumentEditor } = await import("../shared/document-editor");
            const docContext = await DocumentEditor.getDocumentContext();
            
            if (savedQuoteForDocContext && savedIsQuoteFromWord) {
                docContext.selectionText = savedQuoteForDocContext;
            } else if (savedQuoteForDocContext && !savedIsQuoteFromWord) {
                // If it's a chat quote, do NOT send word selection to AI, it will confuse it
                docContext.selectionText = "";
            }

            // Add user message to history
            session.messages.push({ role: "user", content: fullPromptForAI, html: displayHtml });
            session.updatedAt = Date.now();
            saveSessions();
            
            autoRenameSession(session, prompt);

            // Call AI with full history and language
            let aiResponseText = "";
            let msgDiv: HTMLElement | null = null;
            let msgBubble: HTMLElement | null = null;
            let isRendering = false;
            let rafId: number | null = null;
            
            const { sanitizeLaTeX, getMathML } = await import("../shared/converter");

            const parseMarkdownStream = (text: string) => {
                let html = escapeHtml(text);
                html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
                html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
                html = html.replace(/\n/g, '<br>');
                return html;
            };

            const processSegmentsStream = (textStr: string) => {
                const formulaRegex = /<\s*formula\s*>([\s\S]*?)<\s*\/\s*formula\s*>|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)/gi;
                let match;
                let lastIndex = 0;
                const segments: any[] = [];
                while ((match = formulaRegex.exec(textStr)) !== null) {
                    const textPart = textStr.substring(lastIndex, match.index).trim();
                    if (textPart) segments.push({ type: 'text', content: textPart });
                    
                    let content = match[1];
                    let isBlock = false;
                    if (content !== undefined) {
                        const trimmed = content.trim();
                        if (trimmed.startsWith("$$") || trimmed.startsWith("\\[") || trimmed.includes("\\begin{")) isBlock = true;
                    } else if (match[2] !== undefined) {
                        content = match[2];
                        isBlock = true;
                    } else if (match[3] !== undefined) {
                        content = match[3];
                        isBlock = true;
                    } else if (match[4] !== undefined) {
                        content = match[4];
                    }
                    segments.push({ type: 'formula', content: content, isBlock: isBlock });
                    lastIndex = formulaRegex.lastIndex;
                }
                const finalText = textStr.substring(lastIndex).trim();
                if (finalText) segments.push({ type: 'text', content: finalText });
                return segments;
            };

            const renderStreamChunk = () => {
                isRendering = true;
                try {
                    let cText = aiResponseText;
                    cText = cText.replace(/<\s*insert\s*>[\s\S]*?(<\s*\/\s*insert\s*>)?/gi, "");
                    cText = cText.replace(/<\s*replace_selection\s*>[\s\S]*?(<\s*\/\s*replace_selection\s*>)?/gi, "");
                    cText = cText.replace(/<\s*replace_paragraph\s*>[\s\S]*?(<\s*\/\s*replace_paragraph\s*>)?/gi, "");
                    cText = cText.replace(/<\s*replace_search[^>]*>[\s\S]*?(<\s*\/\s*replace_search\s*>)?/gi, "");
                    cText = cText.replace(/<\s*replace_heading[^>]*>[\s\S]*?(<\s*\/\s*replace_heading\s*>)?/gi, "");

                    const chatSegments = processSegmentsStream(cText);
                    let chatBubbleHtml = "";
                    if (chatSegments.length === 0) {
                        chatBubbleHtml = parseMarkdownStream(cText);
                    } else {
                        for (const segment of chatSegments) {
                            if (segment.type === 'text') {
                                chatBubbleHtml += `<div style="margin-bottom: 8px;">${parseMarkdownStream(segment.content)}</div>`;
                            } else if (segment.type === 'formula') {
                                let rawLatex = (segment.content || "").trim();
                                if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                                    rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                                    segment.isBlock = true;
                                }
                                if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                                    rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                                    segment.isBlock = true;
                                }
                                if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                                    rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                                }
                                const isBlock = segment.isBlock || rawLatex.includes("\\begin{");
                                const latexClean = sanitizeLaTeX(rawLatex, isBlock);
                                const mathML = getMathML(latexClean, isBlock);
                                if (mathML) {
                                    chatBubbleHtml += `<div style="margin-bottom: 8px; overflow-x: auto; max-width: 100%; padding-bottom: 4px;">${mathML}</div>`;
                                } else {
                                    chatBubbleHtml += `<div style="color: #d83b01; margin-bottom: 8px;">[Lỗi hiển thị công thức LaTeX]</div>`;
                                }
                            }
                        }
                    }

                    // Thêm skeleton loader vào cuối bong bóng chat đang được render
                    chatBubbleHtml += `
                        <div class="skeleton-line" style="height: 10px; width: 100%; margin-top: 8px; margin-bottom: 0; opacity: 0.7;"></div>`;

                    if (!msgDiv) {
                        removeSkeleton(); // Xóa khung skeleton độc lập ban đầu
                        msgDiv = appendAIMessage(chatBubbleHtml, "", "");
                        if (msgDiv) {
                            msgBubble = msgDiv.querySelector(".msg-bubble") as HTMLElement;
                        }
                    } else if (msgBubble) {
                        msgBubble.innerHTML = chatBubbleHtml;
                        scrollToBottom();
                    }
                } finally {
                    isRendering = false;
                }
            };

            await sendChatMessage(session.messages, "", appLanguage, docContext, isThinkingMode, (chunk) => {
                aiResponseText = chunk;
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(renderStreamChunk);
            });
            
            if (rafId) cancelAnimationFrame(rafId);
            while(isRendering) { await new Promise(r => setTimeout(r, 10)); }
            
            removeSkeleton();

            let chatText = aiResponseText;
            let appliedChanges = false;
            let pendingEditsHtml = "";
            const tSettings = translations[appLanguage] || translations["en"];
            const btnApplyText = tSettings.btnApplyEdit || "Apply to Word";

            const processEditMatch = async (match: RegExpExecArray | null, type: string, replaceStr: string, targetStr: string = "") => {
                if (!match) return;
                const content = match[replaceStr === "match1" ? 1 : 2].trim();
                const target = targetStr === "match1" ? match[1] : "";
                
                if (settings.autoApplyEdits) {
                    if (type === "replace_selection") await DocumentEditor.replaceSelection(content);
                    else if (type === "replace_paragraph") await DocumentEditor.replaceCurrentParagraph(content);
                    else if (type === "replace_search") await DocumentEditor.replaceSearchTerm(target, content);
                    else if (type === "replace_heading") await DocumentEditor.replaceHeadingContent(target, content);
                    appliedChanges = true;
                }
                const safeContent = encodeURIComponent(content);
                const safeTarget = encodeURIComponent(target);
                pendingEditsHtml += `<div class="pending-edit-card" data-edit-type="${type}" data-edit-content="${safeContent}" data-edit-target="${safeTarget}" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                    <button class="btn-toolbar-action btn-apply-edit" title="${btnApplyText}">
                        <span style="font-weight: 500;">${btnApplyText}</span>
                    </button>
                </div>`;
                chatText = chatText.replace(match[0], "");
            };

            // Process new document editor tags
            await processEditMatch(/<\s*replace_selection\s*>([\s\S]*?)<\s*\/\s*replace_selection\s*>/i.exec(chatText), "replace_selection", "match1");
            await processEditMatch(/<\s*replace_paragraph\s*>([\s\S]*?)<\s*\/\s*replace_paragraph\s*>/i.exec(chatText), "replace_paragraph", "match1");
            await processEditMatch(/<\s*replace_search\s+target="([^"]+)"\s*>([\s\S]*?)<\s*\/\s*replace_search\s*>/i.exec(chatText), "replace_search", "match2", "match1");
            await processEditMatch(/<\s*replace_heading\s+target="([^"]+)"\s*>([\s\S]*?)<\s*\/\s*replace_heading\s*>/i.exec(chatText), "replace_heading", "match2", "match1");

            // Extract <insert> block for Word
            const insertMatch = /<\s*insert\s*>([\s\S]*?)<\s*\/\s*insert\s*>/i.exec(chatText);
            const contentForWord = insertMatch ? insertMatch[1] : chatText;
            const insertOnlyFormulas = !insertMatch;

            // Prepare text for Chat (remove <insert> tags)
            chatText = chatText.replace(/<\s*\/?\s*insert\s*>/gi, "");



            const processSegments = (textStr: string) => {
                const formulaRegex = /<\s*formula\s*>([\s\S]*?)<\s*\/\s*formula\s*>|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)/gi;
                let match;
                let lastIndex = 0;
                const segments: any[] = [];
                while ((match = formulaRegex.exec(textStr)) !== null) {
                    const textPart = textStr.substring(lastIndex, match.index).trim();
                    if (textPart) segments.push({ type: 'text', content: textPart });
                    
                    let content = match[1];
                    let isBlock = false;
                    if (content !== undefined) {
                        const trimmed = content.trim();
                        if (trimmed.startsWith("$$") || trimmed.startsWith("\\[") || trimmed.includes("\\begin{")) isBlock = true;
                    } else if (match[2] !== undefined) {
                        content = match[2];
                        isBlock = true;
                    } else if (match[3] !== undefined) {
                        content = match[3];
                        isBlock = true;
                    } else if (match[4] !== undefined) {
                        content = match[4];
                    }

                    segments.push({ type: 'formula', content: content, isBlock: isBlock });
                    lastIndex = formulaRegex.lastIndex;
                }
                const finalText = textStr.substring(lastIndex).trim();
                if (finalText) segments.push({ type: 'text', content: finalText });
                return segments;
            };

            const chatSegments = processSegments(chatText);
            let chatBubbleHtml = "";
            let wordHtml = "<html><body>";
            let hasWordContent = false;

            const parseMarkdown = (text: string) => {
                let html = escapeHtml(text);
                // Bold
                html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                // Italic (match * but not ** by using negative lookbehinds if possible, or just standard regex)
                // A simpler approach:
                html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
                // Code
                html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
                // Line breaks
                html = html.replace(/\n/g, '<br>');
                return html;
            };

            // Render Chat Bubble
            if (chatSegments.length === 0) {
                chatBubbleHtml = parseMarkdown(chatText);
            } else {
                for (const segment of chatSegments) {
                    if (segment.type === 'text') {
                        chatBubbleHtml += `<div style="margin-bottom: 8px;">${parseMarkdown(segment.content)}</div>`;
                    } else if (segment.type === 'formula') {
                        let rawLatex = segment.content.trim();
                        if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                            rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                            segment.isBlock = true;
                        }
                        if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                            rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                            segment.isBlock = true;
                        }
                        if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                            rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                        }
                        
                        const isBlock = segment.isBlock || rawLatex.includes("\\begin{");
                        const latexClean = sanitizeLaTeX(rawLatex, isBlock);
                        const mathML = getMathML(latexClean, isBlock);

                        if (mathML) {
                            chatBubbleHtml += `<div style="margin-bottom: 8px; overflow-x: auto; max-width: 100%; padding-bottom: 4px;">${mathML}</div>`;
                        } else {
                            chatBubbleHtml += `<div style="color: #d83b01; margin-bottom: 8px;">[Lỗi hiển thị công thức LaTeX]</div>`;
                        }
                    }
                }
            }
            
            // Render Word Insertion
            const wordSegments = processSegments(contentForWord);
            for (const segment of wordSegments) {
                if (segment.type === 'text' && !insertOnlyFormulas) {
                    const escaped = escapeHtml(segment.content).replace(/\n/g, '<br>');
                    wordHtml += `<p style="margin-bottom: 8px;">${escaped}</p>`;
                    hasWordContent = true;
                } else if (segment.type === 'formula') {
                    let rawLatex = segment.content.trim();
                    if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                        segment.isBlock = true;
                    }
                    if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                        segment.isBlock = true;
                    }
                    if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                    }
                    const isBlock = segment.isBlock || rawLatex.includes("\\begin{");
                    const latexClean = sanitizeLaTeX(rawLatex, isBlock);
                    const mathML = getMathML(latexClean, isBlock);
                    if (mathML) {
                        wordHtml += `<p style="margin-bottom: 8px;">${mathML}</p>`;
                        hasWordContent = true;
                    }
                }
            }

            if (hasWordContent && !appliedChanges) {
                wordHtml += "</body></html>";
                if (settings.autoApplyEdits) {
                    await Word.run(async (context) => {
                        if (settings.insertAtCursor) {
                            const selection = context.document.getSelection();
                            selection.insertHtml(wordHtml, Word.InsertLocation.replace);
                        } else {
                            const body = context.document.body;
                            body.insertHtml(wordHtml, Word.InsertLocation.end);
                        }
                        await context.sync();
                    });
                    appliedChanges = true;
                }
                const safeContent = encodeURIComponent(wordHtml);
                pendingEditsHtml += `<div class="pending-edit-card" data-edit-type="insert_html" data-edit-content="${safeContent}" style="margin-top: 4px; margin-left: -4px; display: flex; justify-content: flex-start;">
                    <button class="btn-toolbar-action btn-apply-edit" title="${btnApplyText}">
                        <span style="font-weight: 500;">${btnApplyText}</span>
                    </button>
                </div>`;
            }

            if (chatBubbleHtml) {
                if (msgDiv && msgBubble) {
                    msgBubble.innerHTML = chatBubbleHtml;
                    const toolbarContainer = msgDiv.querySelector(".toolbar-left");
                    const copyContainer = msgDiv.querySelector(".toolbar-right");
                    if (toolbarContainer) toolbarContainer.innerHTML = pendingEditsHtml;
                    if (copyContainer) {
                        copyContainer.innerHTML = `<button class="btn-toolbar-action btn-copy-msg" title="Copy" data-copy-text="${encodeURIComponent(aiResponseText)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>`;
                    }
                } else {
                    msgDiv = appendAIMessage(chatBubbleHtml, aiResponseText, pendingEditsHtml);
                }
                
                session.messages.push({ role: "assistant", content: aiResponseText, html: chatBubbleHtml, toolbar: pendingEditsHtml });
                session.updatedAt = Date.now();
                saveSessions();

                if (appliedChanges && msgDiv) {
                    const btns = msgDiv.querySelectorAll(".btn-apply-edit");
                    const notifText = appLanguage === "vi" ? "Thành công!" : "Success!";
                    btns.forEach(btn => {
                        const target = btn as HTMLButtonElement;
                        target.innerHTML = `<span style="color: var(--color-text-muted); font-weight: 500; font-size: 13px; display: inline-flex; align-items: center; padding: 4px 6px;">${notifText}</span>`;
                        target.disabled = true;
                        setTimeout(() => {
                            target.innerHTML = `<span style="font-weight: 500;">${btnApplyText}</span>`;
                            target.disabled = false;
                        }, 10000);
                    });
                }
            }

        } catch (e: any) {
            removeSkeleton();
            session.messages.pop(); // remove user message if failed
            session.updatedAt = Date.now();
            saveSessions();
            appendAIError(e.message || "Unknown error");
        } finally {
            btnSendChat.disabled = false;
        }
    };

    btnSendChat?.addEventListener("click", handleSendChat);
    chatInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendChat();
        }
    });

    // Load sessions and language on init
    applyLanguage(appLanguage);
    loadSessions();

  }
});
