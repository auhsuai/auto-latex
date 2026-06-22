import json

transcript_path = r'C:\Users\thinkpad\.gemini\antigravity-ide\brain\0a940039-8715-42cb-9f5b-24f4ce4c4dd2\.system_generated\logs\transcript.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

replacements = []
for line in lines:
    data = json.loads(line)
    if 'tool_calls' in data:
        for tc in data['tool_calls']:
            if tc['name'] == 'replace_file_content' or tc['name'] == 'multi_replace_file_content':
                args = tc['args']
                if 'TargetFile' in args and 'taskpane.ts' in args['TargetFile']:
                    if data.get('step_index') <= 640:
                        replacements.append(args)

with open('src/taskpane/taskpane.ts', 'r', encoding='utf-8') as f:
    content = f.read()

for args in replacements:
    if 'ReplacementChunks' in args:
        chunks = json.loads(args['ReplacementChunks']) if isinstance(args['ReplacementChunks'], str) else args['ReplacementChunks']
        for chunk in chunks:
            if 'TargetContent' in chunk:
                target = chunk['TargetContent']
                replacement = chunk['ReplacementContent']
                content = content.replace(target, replacement)
    elif 'TargetContent' in args:
        target = args['TargetContent']
        replacement = args['ReplacementContent']
        content = content.replace(target, replacement)

with open('src/taskpane/taskpane.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
