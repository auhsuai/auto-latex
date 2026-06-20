const fs = require('fs');
const taskpanePath = 'c:\\Users\\thinkpad\\Desktop\\Antigravity\\auto-latex\\src\\taskpane\\taskpane.ts';
const logicPath = 'c:\\Users\\thinkpad\\Desktop\\Antigravity\\auto-latex\\src\\taskpane\\chat-session-logic.ts.part';

const lines = fs.readFileSync(taskpanePath, 'utf8').split('\n');
const top = lines.slice(0, 129).join('\n');
const bottom = fs.readFileSync(logicPath, 'utf8');

fs.writeFileSync(taskpanePath, top + '\n' + bottom, 'utf8');
