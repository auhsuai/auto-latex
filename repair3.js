const fs = require('fs');
const path = './src/taskpane/taskpane.ts';
let code = fs.readFileSync(path, 'utf8');

const oldCode = `        const langSelect = document.getElementById("app-language") as HTMLSelectElement;\n        if (langSelect) langSelect.value = lang;\n\n            btnQuickLang.innerText = lang.toUpperCase();\n        }\n    };`;

const newCode = `        const langSelect = document.getElementById("app-language") as HTMLSelectElement;\n        if (langSelect) langSelect.value = lang;\n\n        // Update welcome message if currently rendered\n        const msgBubble = document.querySelector(".ai-msg .msg-bubble");\n        if (msgBubble && msgBubble.innerHTML.includes(translations["en"].aiWelcomeMsg) || msgBubble?.innerHTML.includes(translations["vi"].aiWelcomeMsg)) {\n            msgBubble.innerHTML = t.aiWelcomeMsg;\n        }\n\n        // Update Quick Lang Button\n        const btnQuickLang = document.getElementById("btn-quick-lang");\n        if (btnQuickLang) {\n            btnQuickLang.innerText = lang.toUpperCase();\n        }\n    };`;

code = code.replace(oldCode, newCode);
fs.writeFileSync(path, code);
console.log("Fixed msgBubble reference error");
