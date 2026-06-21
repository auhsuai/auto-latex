import re

with open('src/taskpane/taskpane.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add imports at the top
imports = """import { parseMarkdown, processSegments, generateWordHtmlFromText } from "../utils/parser";
import { SessionManager } from "../core/session-manager";
import { SettingsManager } from "../ui/settings-manager";
import { ConverterUIManager } from "../ui/converter-ui";
import { translations } from "../utils/translations";"""

code = code.replace(
    'import { parseMarkdown, processSegments, generateWordHtmlFromText } from "../utils/parser";\nimport { SessionManager } from "../core/session-manager";\nimport { SettingsManager } from "../ui/settings-manager";',
    imports
)

# 2. Remove translations object
code = re.sub(
    r'const translations: Record<string, Record<string, string>> = \{[\s\S]*?\n\s*\};',
    '',
    code
)

# 3. Add ConverterUIManager init
converter_init = """    const sessionManager = new SessionManager();
    const converterUI = new ConverterUIManager(() => appLanguage);
    converterUI.init();
    const settingsManager = new SettingsManager(appLanguage);"""

code = code.replace(
    '    const sessionManager = new SessionManager();\n    const settingsManager = new SettingsManager(appLanguage);',
    converter_init
)

# 4. Remove Converter Logic block
code = re.sub(
    r'\/\/ ---- Original Converter Logic ----[\s\S]*?if \(convertSelBtn\) \{\s*convertSelBtn\.onclick = \(\) => handleConversion\(convertSelBtn, true\);\s*\}',
    '',
    code
)

with open('src/taskpane/taskpane.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Refactoring Part 5 completed correctly!")
