const fs = require('fs');
const path = './src/taskpane/taskpane.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    `import { Chart, registerables } from 'chart.js';\nChart.register(...registerables);`,
    `import { SettingsManager } from "../ui/settings-manager";`
);

code = code.replace(
    `let tempSelectedProvider = "gemini";\n    let tempSelectedLanguage = appLanguage;`,
    ``
);

// Initialize SettingsManager inside Office.onReady
code = code.replace(
    `const sessionManager = new SessionManager();`,
    `const sessionManager = new SessionManager();\n    const settingsManager = new SettingsManager(appLanguage);\n    settingsManager.onLanguageChanged = (newLang) => {\n        appLanguage = newLang;\n        localStorage.setItem("auto_latex_language", appLanguage);\n        applyLanguage(appLanguage);\n    };\n    settingsManager.init();`
);

// Remove initCustomSelect and updateCustomSelect
code = code.replace(
    /const updateCustomSelect = \(wrapperId: string, value: string\) => \{[\s\S]*?initCustomSelect\("provider-select-wrapper", \(val\) => tempSelectedProvider = val\);/,
    ``
);

// Remove settings modal UI elements declarations since they are now in SettingsManager
code = code.replace(
    /const settingsModal = document\.getElementById\("settings-modal"\);[\s\S]*?const apiKeyInput = document\.getElementById\("ai-api-key"\) as HTMLInputElement;/,
    ``
);

// Remove the huge ---- Settings Logic ---- block
// We will use a regex to match from `// ---- Settings Logic ----` to `// ---- Original Converter Logic ----`
code = code.replace(
    /\/\/ ---- Settings Logic ----[\s\S]*?\/\/ ---- Original Converter Logic ----/,
    `// ---- Original Converter Logic ----`
);

fs.writeFileSync(path, code);
console.log('Settings logic removed from taskpane.ts');
