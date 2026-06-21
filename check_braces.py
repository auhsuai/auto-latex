import sys

with open('src/taskpane/taskpane.ts', 'r', encoding='utf-8') as f:
    text = f.read()

brace_count = 0
for i, char in enumerate(text):
    if char == '{':
        brace_count += 1
    elif char == '}':
        brace_count -= 1
    if brace_count < 0:
        print(f"Negative brace count at index {i}")

print(f"Final brace count: {brace_count}")
