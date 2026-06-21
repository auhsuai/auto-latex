import { getAISettings, saveAISettings, getAIUsageStats, AIProvider } from "../services/ai";
import { renderUsageCharts } from "./usage-chart";

export class SettingsManager {
    private tempSelectedProvider: string;
    private tempSelectedLanguage: string;
    private tempApiKeys: Record<string, string> = {};
    private selectedStatsProvider: string = 'all';

    public onLanguageChanged: (newLang: string) => void = () => {};

    constructor(private currentAppLanguage: string) {
        this.tempSelectedLanguage = currentAppLanguage;
        this.tempSelectedProvider = getAISettings().provider;
    }

    public openSettings() {
        this.loadSettingsToUI();
        const settingsModal = document.getElementById("settings-modal");
        if (settingsModal) {
            settingsModal.style.display = "flex";
            document.body.classList.add("modal-open");
        }
    }

    public init() {
        const btnSettings = document.getElementById("btn-settings");
        const btnCloseSettings = document.getElementById("btn-close-settings");
        const btnSaveSettings = document.getElementById("btn-save-settings");
        const settingsModal = document.getElementById("settings-modal");

        btnSettings?.addEventListener("click", () => {
            this.loadSettingsToUI();
            if (settingsModal) {
                settingsModal.style.display = "flex";
                document.body.classList.add("modal-open");
            }
        });

        btnCloseSettings?.addEventListener("click", () => {
            if (settingsModal) {
                settingsModal.classList.add("closing");
                settingsModal.addEventListener("animationend", () => {
                    settingsModal.classList.remove("closing");
                    settingsModal.style.display = "none";
                    document.body.classList.remove("modal-open");
                }, { once: true });
            }
        });

        btnSaveSettings?.addEventListener("click", () => {
            this.saveSettings();
            if (settingsModal) {
                settingsModal.classList.add("closing");
                settingsModal.addEventListener("animationend", () => {
                    settingsModal.classList.remove("closing");
                    settingsModal.style.display = "none";
                    document.body.classList.remove("modal-open");
                }, { once: true });
            }
        });

        this.initCustomSelect("lang-select-wrapper", (val) => this.tempSelectedLanguage = val);
        this.initCustomSelect("provider-select-wrapper", (val) => {
            const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
            if (apiKeyInput) {
                this.tempApiKeys[this.tempSelectedProvider] = apiKeyInput.value.trim();
                this.tempSelectedProvider = val;
                apiKeyInput.value = this.tempApiKeys[val] || '';
            } else {
                this.tempSelectedProvider = val;
            }
        });

        this.initCustomSelect("stats-filter-wrapper", (val) => {
            this.selectedStatsProvider = val;
            const stats = getAIUsageStats();
            renderUsageCharts(stats, this.selectedStatsProvider);
        });

        this.setupToggles();
        this.setupExportStats();
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
                // Reset initial state depending on how you want it
                if (container.style.display === "none") {
                    container.style.display = ""; // clear inline style
                } else {
                    container.classList.add("expanded");
                    if (chevron) chevron.style.transform = "rotate(0deg)";
                }
            }

            toggle?.addEventListener("click", () => {
                if (container && chevron) {
                    const isExpanded = container.classList.contains("expanded");
                    if (isExpanded) {
                        container.style.overflow = "hidden";
                        container.classList.remove("expanded");
                        chevron.style.transform = "rotate(-90deg)";
                    } else {
                        container.classList.add("expanded");
                        chevron.style.transform = "rotate(0deg)";
                        setTimeout(() => {
                            if (container.classList.contains("expanded")) {
                                container.style.overflow = "visible";
                            }
                        }, 250);
                    }
                }
            });
        };

        setupToggle("ai-settings-toggle", "ai-settings-container", "ai-settings-chevron");
        setupToggle("editor-settings-toggle", "editor-settings-container", "editor-settings-chevron");
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
                'openai': 'OpenAI (GPT)',
                'deepseek': 'DeepSeek',
                'minimax': 'MiniMax'
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
                if (textSpan) textSpan.innerHTML = opt.innerHTML;
            } else {
                opt.classList.remove("selected");
            }
        });
    }

    private initCustomSelect(wrapperId: string, onChange: (val: string) => void) {
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
                this.updateCustomSelect(wrapperId, val!);
            });
        });
    }
}
