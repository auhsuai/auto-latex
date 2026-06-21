const fs = require('fs');
const path = './src/taskpane/taskpane.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove translations block
code = code.replace(
    /const translations: Record<string, Record<string, string>> = \{[\s\S]*?\n\s*\};/,
    `import { translations } from "../utils/translations";`
);

// 2. Remove Converter logic block
code = code.replace(
    /\/\/ ---- Original Converter Logic ----[\s\S]*?if \(convertSelBtn\) \{\s*convertSelBtn\.onclick = \(\) => handleConversion\(convertSelBtn, true\);\s*\}/,
    ``
);

// 3. Import and initialize ConverterUIManager
code = code.replace(
    `const sessionManager = new SessionManager();`,
    `import { ConverterUIManager } from "../ui/converter-ui";\n    const sessionManager = new SessionManager();\n    const converterUI = new ConverterUIManager(() => appLanguage);\n    converterUI.init();`
);

// 4. Also remove the old converter elements definitions since they are now in ConverterUI
code = code.replace(
    /\/\/ Converter UI elements[\s\S]*?const convertSelBtn = document\.getElementById\("convert-sel"\) as HTMLButtonElement;/,
    ``
);

// 5. Remove cancelMsg, cancelLink, progressText definitions if they exist globally
code = code.replace(
    /const cancelMsg = document\.getElementById\("cancel-msg"\);[\s\S]*?const progressText = document\.getElementById\("progress-text"\);/,
    ``
);

fs.writeFileSync(path, code);
console.log('Converter UI and translations removed from taskpane.ts');
