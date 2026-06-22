import { getAISettings, saveAISettings, AIProvider, getAIUsageStats } from "../services/ai";
import { renderUsageCharts } from "./charts";
import { STORAGE_KEY_LANGUAGE } from "../config/constants";

export function initSettings(appLanguage: string, getTempSelectedLanguage: () => string, getTempSelectedProvider: () => string, applyLanguage: (lang: string) => void) {
    const settingsModal = document.getElementById("settings-modal");
    const btnCloseSettings = document.getElementById("btn-close-settings");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const apiKeyInput = document.getElementById("ai-api-key") as HTMLInputElement;

    const aiSettingsToggle = document.getElementById("ai-settings-toggle");
    const aiSettingsContainer = document.getElementById("ai-settings-container");
    const aiSettingsChevron = document.getElementById("ai-settings-chevron");
    
    aiSettingsToggle?.addEventListener("click", () => {
        if (aiSettingsContainer && aiSettingsChevron) {
            const isHidden = aiSettingsContainer.style.display === "none";
            aiSettingsContainer.style.display = isHidden ? "block" : "none";
            aiSettingsChevron.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
        }
    });

    const editorSettingsToggle = document.getElementById("editor-settings-toggle");
    const editorSettingsContainer = document.getElementById("editor-settings-container");
    const editorSettingsChevron = document.getElementById("editor-settings-chevron");

    editorSettingsToggle?.addEventListener("click", () => {
        if (editorSettingsContainer && editorSettingsChevron) {
            const isHidden = editorSettingsContainer.style.display === "none";
            editorSettingsContainer.style.display = isHidden ? "block" : "none";
            editorSettingsChevron.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
        }
    });

    const usageStatsToggle = document.getElementById("usage-stats-toggle");
    const usageStatsContainer = document.getElementById("usage-stats-container");
    const usageStatsChevron = document.getElementById("usage-stats-chevron");

    usageStatsToggle?.addEventListener("click", () => {
        if (usageStatsContainer && usageStatsChevron) {
            const isHidden = usageStatsContainer.style.display === "none";
            usageStatsContainer.style.display = isHidden ? "block" : "none";
            usageStatsChevron.style.transform = isHidden ? "rotate(0deg)" : "rotate(-90deg)";
        }
    });

    const loadSettingsToUI = () => {
        const settings = getAISettings();
        if (apiKeyInput) apiKeyInput.value = settings.apiKeys[settings.provider] || "";
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        if (autoApplyToggle) autoApplyToggle.checked = settings.autoApplyEdits;
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        if (insertAtCursorToggle) insertAtCursorToggle.checked = settings.insertAtCursor;
        
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
        updateCustomSelect("provider-select-wrapper", settings.provider);
        updateCustomSelect("lang-select-wrapper", appLanguage);

        const stats = getAIUsageStats();
        renderUsageCharts(stats);
    };

    const btnSettingsApi = document.getElementById("btn-settings-api");
    btnSettingsApi?.addEventListener("click", () => {
        const chatSidebar = document.getElementById("chat-sidebar");
        const chatSidebarOverlay = document.getElementById("chat-sidebar-overlay");
        if (chatSidebar && chatSidebarOverlay) {
            chatSidebarOverlay.style.display = "none";
            chatSidebar.style.transform = "translateX(100%)";
        }
        loadSettingsToUI();
        if (settingsModal) settingsModal.style.display = "flex";
    });

    const btnExportStats = document.getElementById("btn-export-stats");
    btnExportStats?.addEventListener("click", () => {
        const stats = getAIUsageStats();
        const dates = Object.keys(stats.daily).sort();
        let csv = "Date,API Calls,Prompt Tokens,Cache Hit Tokens,Cache Miss Tokens,Completion Tokens,Total Tokens\n";
        dates.forEach(date => {
            const d = stats.daily[date];
            csv += `${date},${d.apiCalls},${d.promptTokens},${d.cacheHitTokens},${d.cacheMissTokens},${d.completionTokens},${d.totalTokens}\n`;
        });
        csv += `\nTotal,${stats.total.apiCalls},${stats.total.promptTokens},${stats.total.cacheHitTokens},${stats.total.cacheMissTokens},${stats.total.completionTokens},${stats.total.totalTokens}\n`;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `auto-latex-usage-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (settingsModal) settingsModal.style.display = "none";
    });

    btnCloseSettings?.addEventListener("click", () => {
        if (settingsModal) settingsModal.style.display = "none";
    });

    btnSaveSettings?.addEventListener("click", () => {
        const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";
        const autoApplyToggle = document.getElementById("auto-apply-edits") as HTMLInputElement;
        const insertAtCursorToggle = document.getElementById("insert-at-cursor") as HTMLInputElement;
        
        const currentSettings = getAISettings();
        const provider = getTempSelectedProvider() as AIProvider;
        const newApiKeys = { ...currentSettings.apiKeys };
        if (apiKey) {
            newApiKeys[provider] = apiKey;
        } else {
            delete newApiKeys[provider];
        }

        saveAISettings({
            provider: provider,
            apiKeys: newApiKeys,
            autoApplyEdits: autoApplyToggle ? autoApplyToggle.checked : false,
            insertAtCursor: insertAtCursorToggle ? insertAtCursorToggle.checked : true
        });

        const newLang = getTempSelectedLanguage();
        if (newLang !== appLanguage) {
            appLanguage = newLang;
            localStorage.setItem(STORAGE_KEY_LANGUAGE, appLanguage);
            applyLanguage(appLanguage);
        }

        if (settingsModal) settingsModal.style.display = "none";
    });
}
