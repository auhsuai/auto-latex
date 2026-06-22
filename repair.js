const fs = require('fs');
const path = './src/taskpane/taskpane.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    `        applyLanguage(appLanguage);\n    };\n            }\n        });`,
    `        applyLanguage(appLanguage);\n    };\n    settingsManager.init();\n    let targetSessionId: string | null = null;\n\n    const applyLanguage = (lang: string) => {\n        const t = translations[lang] || translations["en"];\n        document.querySelectorAll("[data-i18n]").forEach(el => {\n            const key = el.getAttribute("data-i18n");\n            if (key && t[key]) {\n                el.innerHTML = t[key];\n            }\n        });\n        document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {\n            const key = el.getAttribute("data-i18n-placeholder");\n            if (key && t[key]) {\n                (el as HTMLInputElement).placeholder = t[key];\n            }\n        });`
);

fs.writeFileSync(path, code);
console.log("Repaired taskpane.ts");
