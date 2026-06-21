import re

with open('src/taskpane/taskpane.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('../shared/ai-service', '../services/ai-service')
code = code.replace('../shared/document-editor', '../core/document-editor')
code = code.replace('../shared/converter', '../core/converter')

with open('src/taskpane/taskpane.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated shared imports")
