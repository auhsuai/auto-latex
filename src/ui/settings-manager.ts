import { getAISettings, saveAISettings, getAIUsageStats, AIProvider } from "../services/ai";
import { renderUsageCharts } from "./usage-chart";
import { trapFocus } from "../utils/helpers";

export class SettingsManager {
    private tempSelectedProvider: string;
    private tempSelectedLanguage: string;
    private tempApiKeys: Record<string, string> = {};
    private selectedStatsProvider: string = 'all';
    private cleanupFocus: () => void = () => {};

    public onLanguageChanged: (newLang: string) => void = () => {};

    constructor(private currentAppLanguage: string) {
        this.tempSelectedLanguage = currentAppLanguage;
        this.tempSelectedProvider = getAISettings().provider;
    }

    public setAppLanguage(lang: string) {
        this.currentAppLanguage = lang;
        this.tempSelectedLanguage = lang;
    }

    public openSettings() {
        this.loadSettingsToUI();
        const settingsModal = document.getElementById("settings-modal");
        if (settingsModal) {
            settingsModal.style.display = "flex";
            document.body.classList.add("modal-open");
            this.cleanupFocus = trapFocus(settingsModal);
        }
    }

    public openConverterSettings() {
        const converterSettingsModal = document.getElementById("converter-settings-modal");
        if (converterSettingsModal) {
            converterSettingsModal.style.display = "flex";
            document.body.classList.add("modal-open");
            this.cleanupFocus = trapFocus(converterSettingsModal);
        }
    }

    public init() {
        const btnSettings = document.getElementById("btn-settings");
        const btnCloseSettings = document.getElementById("btn-close-settings");
        const settingsModal = document.getElementById("settings-modal");

        btnSettings?.addEventListener("click", () => {
            this.loadSettingsToUI();
            if (settingsModal) {
                settingsModal.style.display = "flex";
                document.body.classList.add("modal-open");
                this.cleanupFocus = trapFocus(settingsModal);
            }
        });

        btnCloseSettings?.addEventListener("click", () => {
            // Unfocus input to trigger any pending blurs
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            if (settingsModal) {
                this.cleanupFocus();
                settingsModal.classList.add("closing");
                settingsModal.addEventListener("animationend", () => {
                    settingsModal.classList.remove("closing");
                    settingsModal.style.display = "none";
                    document.body.classList.remove("modal-open");
                }, { once: true });
            }
        });

        if (settingsModal) {
            settingsModal.addEventListener("click", (e) => {
                if (e.target === settingsModal) {
                    btnCloseSettings?.click();
                }
            });
        }

        const btnCloseConverterSettings = document.getElementById("btn-close-converter-settings");
        const converterSettingsModal = document.getElementById("converter-settings-modal");

        btnCloseConverterSettings?.addEventListener("click", () => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            if (converterSettingsModal) {
                this.cleanupFocus();
                converterSettingsModal.classList.add("closing");
                converterSettingsModal.addEventListener("animationend", () => {
                    converterSettingsModal.classList.remove("closing");
                    converterSettingsModal.style.display = "none";
                    document.body.classList.remove("modal-open");
                }, { once: true });
            }
        });

        if (converterSettingsModal) {
            converterSettingsModal.addEventListener("click", (e) => {
                if (e.target === converterSettingsModal) {
                    btnCloseConverterSettings?.click();
                }
            });
        }

        this.initCustomSelect("lang-select-wrapper", (val) => {
            this.tempSelectedLanguage = val;
            this.saveSettings();
        });
        this.initCustomSelect("provider-select-wrapper", (val) => {
            const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
            if (apiKeyInput) {
                this.tempApiKeys[this.tempSelectedProvider] = apiKeyInput.value.trim();
                this.tempSelectedProvider = val;
                apiKeyInput.value = this.tempApiKeys[val] || '';
                this.saveSettings();
            } else {
                this.tempSelectedProvider = val;
                this.saveSettings();
            }
        });

        const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
        if (apiKeyInput) {
            apiKeyInput.addEventListener("blur", () => {
                this.tempApiKeys[this.tempSelectedProvider] = apiKeyInput.value.trim();
                this.saveSettings();
            });
        }

        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        if (autoApplyToggle) {
            autoApplyToggle.addEventListener("change", () => this.saveSettings());
        }

        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        if (insertAtCursorToggle) {
            insertAtCursorToggle.addEventListener("change", () => this.saveSettings());
        }

        this.initCustomSelect("stats-filter-wrapper", (val) => {
            this.selectedStatsProvider = val;
            const stats = getAIUsageStats();
            renderUsageCharts(stats, this.selectedStatsProvider);
        });

        this.setupToggles();
        this.setupApiKeyToggle();
        this.setupExportStats();
    }

    private setupApiKeyToggle() {
        const toggleBtn = document.getElementById("toggle-api-key-btn");
        const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
        const iconShow = document.getElementById("eye-icon-show");
        const iconHide = document.getElementById("eye-icon-hide");

        if (toggleBtn && apiKeyInput && iconShow && iconHide) {
            toggleBtn.addEventListener("click", () => {
                const isPassword = apiKeyInput.type === "password";
                apiKeyInput.type = isPassword ? "text" : "password";
                
                if (isPassword) {
                    iconShow.style.display = "none";
                    iconHide.style.display = "block";
                    toggleBtn.setAttribute("aria-label", "Hide API Key");
                } else {
                    iconShow.style.display = "block";
                    iconHide.style.display = "none";
                    toggleBtn.setAttribute("aria-label", "Show API Key");
                }
            });
        }
    }

    private loadSettingsToUI() {
        const settings = getAISettings();
        this.tempSelectedProvider = settings.provider;
        // Note: we don't reset tempSelectedLanguage here so it keeps user selection unless they saved it.
        // Actually, we should sync it with currentAppLanguage when opening
        this.tempSelectedLanguage = this.currentAppLanguage;
        this.tempApiKeys = { ...settings.apiKeys };
        
        const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
        if (apiKeyInput) apiKeyInput.value = this.tempApiKeys[settings.provider] || '';
        
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        if (autoApplyToggle) autoApplyToggle.checked = settings.autoApplyEdits;
        
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        if (insertAtCursorToggle) insertAtCursorToggle.checked = settings.insertAtCursor;
        
        this.updateCustomSelect("provider-select-wrapper", this.tempSelectedProvider);
        this.updateCustomSelect("lang-select-wrapper", this.tempSelectedLanguage);
        this.updateCustomSelect("stats-filter-wrapper", this.selectedStatsProvider);

        const stats = getAIUsageStats();
        renderUsageCharts(stats, this.selectedStatsProvider);
    }

    private saveSettings() {
        const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
        if (apiKeyInput) {
            this.tempApiKeys[this.tempSelectedProvider] = apiKeyInput.value.trim();
        }
        
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        
        saveAISettings({
            provider: this.tempSelectedProvider as AIProvider,
            apiKeys: this.tempApiKeys,
            autoApplyEdits: autoApplyToggle ? autoApplyToggle.checked : false,
            insertAtCursor: insertAtCursorToggle ? insertAtCursorToggle.checked : true
        });

        const btnToggleThinking = document.getElementById("btn-toggle-thinking");
        const shortcutRow = document.getElementById("shortcut-thinking-row");
        if (btnToggleThinking) {
            if (this.tempSelectedProvider === 'kira') {
                btnToggleThinking.style.display = "none";
                if (shortcutRow) shortcutRow.style.display = "none";
            } else {
                btnToggleThinking.style.display = "";
                if (shortcutRow) shortcutRow.style.display = "";
            }
        }

        if (this.tempSelectedLanguage !== this.currentAppLanguage) {
            this.currentAppLanguage = this.tempSelectedLanguage;
            this.onLanguageChanged(this.currentAppLanguage);
        }
    }

    private setupToggles() {
        const setupToggle = (toggleId: string, containerId: string, chevronId: string) => {
            const toggle = document.getElementById(toggleId);
            const container = document.getElementById(containerId);
            const chevron = document.getElementById(chevronId);
            
            if (container) {
                container.classList.add("accordion-content");
                if (container.style.display === "none") {
                    container.style.display = ""; 
                    container.style.maxHeight = "0px";
                    toggle?.setAttribute("aria-expanded", "false");
                } else {
                    container.classList.add("expanded");
                    container.style.maxHeight = "none";
                    container.style.overflow = "visible";
                    toggle?.setAttribute("aria-expanded", "true");
                    if (chevron) chevron.style.transform = "rotate(0deg)";
                }
            }

            toggle?.addEventListener("click", () => {
                if (container && chevron) {
                    const isExpanded = container.classList.contains("expanded");
                    if (isExpanded) {
                        container.style.maxHeight = container.scrollHeight + "px";
                        // trigger reflow
                        void container.offsetHeight;
                        
                        container.style.overflow = "hidden";
                        container.style.maxHeight = "0px";
                        container.classList.remove("expanded");
                        toggle.setAttribute("aria-expanded", "false");
                        chevron.style.transform = "rotate(-90deg)";
                    } else {
                        container.classList.add("expanded");
                        container.style.maxHeight = container.scrollHeight + "px";
                        toggle.setAttribute("aria-expanded", "true");
                        chevron.style.transform = "rotate(0deg)";
                        setTimeout(() => {
                            if (container.classList.contains("expanded")) {
                                container.style.maxHeight = "none";
                                container.style.overflow = "visible";
                            }
                        }, 250);
                    }
                }
            });
            
            toggle?.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle.click();
                }
            });
        };

        setupToggle("perf-settings-toggle", "perf-settings-container", "perf-settings-chevron");
        setupToggle("filter-settings-toggle", "filter-settings-container", "filter-settings-chevron");
        setupToggle("macro-settings-toggle", "macro-settings-container", "macro-settings-chevron");
        setupToggle("ai-settings-toggle", "ai-settings-container", "ai-settings-chevron");
        setupToggle("editor-settings-toggle", "editor-settings-container", "editor-settings-chevron");
        setupToggle("key-bindings-toggle", "key-bindings-container", "key-bindings-chevron");
        setupToggle("usage-stats-toggle", "usage-stats-container", "usage-stats-chevron");
    }

    private setupExportStats() {
        const btnExportStats = document.getElementById("btn-export-stats");
        btnExportStats?.addEventListener("click", () => {
            const stats = getAIUsageStats();
            const dates = Object.keys(stats.daily).sort();
            
            const overallTableData: string[][] = [
                ["Date", "API Calls", "Prompt Tokens", "Cache Hit", "Cache Miss", "Completion", "Total Tokens"]
            ];
            
            dates.forEach(date => {
                const d = stats.daily[date];
                overallTableData.push([
                    date,
                    d.apiCalls.toString(),
                    d.promptTokens.toString(),
                    d.cacheHitTokens.toString(),
                    d.cacheMissTokens.toString(),
                    d.completionTokens.toString(),
                    d.totalTokens.toString()
                ]);
            });
            
            overallTableData.push([
                "Overall Total",
                stats.total.apiCalls.toString(),
                stats.total.promptTokens.toString(),
                stats.total.cacheHitTokens.toString(),
                stats.total.cacheMissTokens.toString(),
                stats.total.completionTokens.toString(),
                stats.total.totalTokens.toString()
            ]);

            const detailsTableData: string[][] = [
                ["Provider", "Date", "API Calls", "Prompt Tokens", "Cache Hit", "Cache Miss", "Completion", "Total Tokens"]
            ];

            const providerMap: Record<string, string> = {
                'gemini': 'Google Gemini',
                'openai': 'OpenAI',
                'deepseek': 'DeepSeek',
                'kira': 'Kira AI'
            };

            const providers = Object.keys(stats.providersTotal);
            providers.forEach(provider => {
                const providerName = providerMap[provider] || provider;
                dates.forEach(date => {
                    if (stats.daily[date].providers && stats.daily[date].providers[provider]) {
                        const d = stats.daily[date].providers[provider];
                        if (d.totalTokens > 0 || d.apiCalls > 0) {
                            detailsTableData.push([
                                providerName,
                                date,
                                d.apiCalls.toString(),
                                d.promptTokens.toString(),
                                d.cacheHitTokens.toString(),
                                d.cacheMissTokens.toString(),
                                d.completionTokens.toString(),
                                d.totalTokens.toString()
                            ]);
                        }
                    }
                });

                const t = stats.providersTotal[provider];
                if (t.totalTokens > 0 || t.apiCalls > 0) {
                    detailsTableData.push([
                        `${providerName} Total`,
                        "-",
                        t.apiCalls.toString(),
                        t.promptTokens.toString(),
                        t.cacheHitTokens.toString(),
                        t.cacheMissTokens.toString(),
                        t.completionTokens.toString(),
                        t.totalTokens.toString()
                    ]);
                }
            });

            // If no details, just provide a dummy row
            if (detailsTableData.length === 1) {
                detailsTableData.push(["-", "-", "-", "-", "-", "-", "-", "-"]);
            }
            
            Word.run(async (context) => {
                const body = context.document.body;
                
                body.insertParagraph("AI Usage Statistics - Overall", Word.InsertLocation.end).style = "Heading 2";
                const table1 = body.insertTable(overallTableData.length, overallTableData[0].length, Word.InsertLocation.end, overallTableData);
                table1.style = "Grid Table 4 - Accent 1";
                table1.autoFitWindow();
                
                body.insertParagraph("", Word.InsertLocation.end);
                
                body.insertParagraph("AI Usage Statistics - By Provider", Word.InsertLocation.end).style = "Heading 3";
                const table2 = body.insertTable(detailsTableData.length, detailsTableData[0].length, Word.InsertLocation.end, detailsTableData);
                table2.style = "Grid Table 4 - Accent 1";
                table2.autoFitWindow();

                await context.sync();
                
                if (btnExportStats) {
                    const originalText = btnExportStats.innerText;
                    btnExportStats.innerText = "Exported to Word!";
                    setTimeout(() => {
                        btnExportStats.innerText = originalText;
                    }, 2000);
                }
            }).catch(error => {
                console.error("Error inserting stats table: ", error);
            });
        });
    }

    private updateCustomSelect(wrapperId: string, value: string) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const textSpan = wrapper.querySelector(".custom-select span");
        const options = wrapper.querySelectorAll(".custom-select-option");
        options.forEach(opt => {
            if (opt.getAttribute("data-val") === value) {
                opt.classList.add("selected");
                opt.setAttribute("aria-selected", "true");
                if (textSpan) textSpan.innerHTML = opt.innerHTML;
            } else {
                opt.classList.remove("selected");
                opt.setAttribute("aria-selected", "false");
            }
        });
    }

    private initCustomSelect(wrapperId: string, onChange: (val: string) => void) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const display = wrapper.querySelector(".custom-select") as HTMLElement;
        const optionsDiv = wrapper.querySelector(".custom-select-options") as HTMLElement;
        const options = wrapper.querySelectorAll(".custom-select-option") as NodeListOf<HTMLElement>;

        const toggleDropdown = (open: boolean) => {
            if (open) {
                optionsDiv.style.display = "block";
                display.classList.add("active");
                display.setAttribute("aria-expanded", "true");
                // Focus selected option or first option
                const selected = Array.from(options).find(opt => opt.classList.contains("selected")) || options[0];
                if (selected) selected.focus();
            } else {
                optionsDiv.style.display = "none";
                display.classList.remove("active");
                display.setAttribute("aria-expanded", "false");
            }
        };

        display.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = optionsDiv.style.display === "block";
            document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
            document.querySelectorAll(".custom-select").forEach(el => {
                el.classList.remove("active");
                el.setAttribute("aria-expanded", "false");
            });
            toggleDropdown(!isOpen);
        });

        display.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                display.click();
            } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                toggleDropdown(true);
            }
        });

        options.forEach((opt, index) => {
            opt.setAttribute("tabindex", "-1");
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const val = opt.getAttribute("data-val");
                if (val) onChange(val);
                toggleDropdown(false);
                this.updateCustomSelect(wrapperId, val!);
                display.focus();
            });

            opt.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    opt.click();
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = options[index + 1];
                    if (next) next.focus();
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const prev = options[index - 1];
                    if (prev) prev.focus();
                } else if (e.key === "Escape") {
                    e.preventDefault();
                    toggleDropdown(false);
                    display.focus();
                }
            });
        });
    }
}
