const fs = require('fs');
const path = './src/taskpane/taskpane.ts';
let lines = fs.readFileSync(path, 'utf8').split('\n');

const missingCode = `    let targetSessionId: string | null = null;

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
`;

// Insert at index 196 (line 197)
lines.splice(196, 0, missingCode);

fs.writeFileSync(path, lines.join('\n'));
console.log("Inserted missing code at line 197");
