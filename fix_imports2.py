import re

with open('src/taskpane/taskpane.ts', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('../services/ai-service', '../services/ai')

with open('src/taskpane/taskpane.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated ai import")
