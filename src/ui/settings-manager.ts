import { getAISettings, saveAISettings, getAIUsageStats, AIProvider } from "../services/ai";
import { renderUsageCharts } from "./usage-chart";

export class SettingsManager {
    private tempSelectedProvider: string;
    private tempSelectedLanguage: string;

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
        this.initCustomSelect("provider-select-wrapper", (val) => this.tempSelectedProvider = val);

        this.setupToggles();
        this.setupExportStats();
    }

    private loadSettingsToUI() {
        const settings = getAISettings();
        this.tempSelectedProvider = settings.provider;
        // Note: we don't reset tempSelectedLanguage here so it keeps user selection unless they saved it.
        // Actually, we should sync it with currentAppLanguage when opening
        this.tempSelectedLanguage = this.currentAppLanguage;
        
        const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
        if (apiKeyInput) apiKeyInput.value = settings.apiKey;
        
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        if (autoApplyToggle) autoApplyToggle.checked = settings.autoApplyEdits;
        
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        if (insertAtCursorToggle) insertAtCursorToggle.checked = settings.insertAtCursor;
        
        this.updateCustomSelect("provider-select-wrapper", this.tempSelectedProvider);
        this.updateCustomSelect("lang-select-wrapper", this.tempSelectedLanguage);

        const stats = getAIUsageStats();
        renderUsageCharts(stats);
    }

    private saveSettings() {
        const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        
        saveAISettings({
            provider: this.tempSelectedProvider as AIProvider,
            apiKey: apiKey,
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
                        container.classList.remove("expanded");
                        chevron.style.transform = "rotate(-90deg)";
                    } else {
                        container.classList.add("expanded");
                        chevron.style.transform = "rotate(0deg)";
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
            
            const tableData: string[][] = [
                ["Date", "API Calls", "Prompt Tokens", "Cache Hit Tokens", "Cache Miss Tokens", "Completion Tokens", "Total Tokens"]
            ];
            
            dates.forEach(date => {
                const d = stats.daily[date];
                tableData.push([
                    date,
                    d.apiCalls.toString(),
                    d.promptTokens.toString(),
                    d.cacheHitTokens.toString(),
                    d.cacheMissTokens.toString(),
                    d.completionTokens.toString(),
                    d.totalTokens.toString()
                ]);
            });
            
            tableData.push([
                "Total",
                stats.total.apiCalls.toString(),
                stats.total.promptTokens.toString(),
                stats.total.cacheHitTokens.toString(),
                stats.total.cacheMissTokens.toString(),
                stats.total.completionTokens.toString(),
                stats.total.totalTokens.toString()
            ]);
            
            Word.run(async (context) => {
                const body = context.document.body;
                
                // Insert a paragraph before the table
                body.insertParagraph("AI Usage Statistics", Word.InsertLocation.end).style = "Heading 2";
                
                // Insert the table at the end
                const table = body.insertTable(tableData.length, tableData[0].length, Word.InsertLocation.end, tableData);
                
                // Format the table
                table.style = "Grid Table 4 - Accent 1";
                table.autoFitWindow();
                
                await context.sync();
                
                // UI Feedback
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
