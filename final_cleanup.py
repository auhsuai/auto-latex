import re
import os

with open('src/taskpane/taskpane.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Remove all imports from the body
code = re.sub(r'\s*import \{ ConverterUIManager \} from "\.\./ui/converter-ui";', '', code)
code = re.sub(r'\s*import \{ translations \} from "\.\./utils/translations";', '', code)
code = re.sub(r'\s*import \{ SessionManager \} from "\.\./core/session-manager";', '', code)
code = re.sub(r'\s*import \{ SettingsManager \} from "\.\./ui/settings-manager";', '', code)
code = re.sub(r'\s*import \{ parseMarkdown, processSegments, generateWordHtmlFromText \} from "\.\./utils/parser";', '', code)

# 2. Add imports at the top
top_imports = """import { getAISettings, saveAISettings, sendChatMessage, AIProvider, ChatMessage, getAIUsageStats } from "../services/ai";
import { Chart, registerables } from 'chart.js';
import { parseMarkdown, processSegments, generateWordHtmlFromText } from "../utils/parser";
import { SessionManager } from "../core/session-manager";
import { SettingsManager } from "../ui/settings-manager";
import { ConverterUIManager } from "../ui/converter-ui";
import { translations } from "../utils/translations";
"""

# Replace top imports
code = re.sub(r'import \{ getAISettings.*\nimport \{ Chart.*\n', top_imports, code)

# 3. Update paths for shared
code = code.replace('../shared/ai-service', '../services/ai')
code = code.replace('../shared/document-editor', '../core/document-editor')
code = code.replace('../shared/converter', '../core/converter')

with open('src/taskpane/taskpane.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Final cleanup complete")
