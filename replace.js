const fs = require('fs');
const path = './src/taskpane/taskpane.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    `import { parseMarkdown, processSegments, generateWordHtmlFromText } from "../utils/parser";`,
    `import { parseMarkdown, processSegments, generateWordHtmlFromText } from "../utils/parser";\nimport { SessionManager } from "../core/session-manager";`
);

code = code.replace(/interface ChatSession \{[\s\S]*?\}\s*const STORAGE_KEY = "auto_latex_chat_sessions";\s*let chatSessions: ChatSession\[\] = \[\];\s*let currentSessionId: string \| null = null;/, `const sessionManager = new SessionManager();`);

code = code.replace(/const saveSessions = \(\) => localStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(chatSessions\)\);/, `
    sessionManager.onSessionsChanged = () => {
        renderSidebar();
    };
    sessionManager.onSessionSwitched = (session) => {
        if (chatTitle) {
            chatTitle.innerText = session.name;
        }
        renderCurrentChat();
    };
`);

// Sidebar updates
code = code.replace(/let filteredSessions = chatSessions;/g, `let filteredSessions = sessionManager.sessions;`);
code = code.replace(/chatSessions\.filter/g, `sessionManager.sessions.filter`);
code = code.replace(/session\.id === currentSessionId/g, `session.id === sessionManager.currentSessionId`);
code = code.replace(/switchSession\(session\.id\);/g, `sessionManager.switchSession(session.id);`);

// renderCurrentChat updates
code = code.replace(/const session = chatSessions\.find\(s => s\.id === currentSessionId\);/, `const session = sessionManager.getCurrentSession();`);

// delete switchSession, createNewSession, loadSessions, deleteCurrentSession, autoRenameSession
code = code.replace(/const switchSession = \(id: string\) => \{[\s\S]*?const toggleSidebar = \(show: boolean\) => \{/, `const toggleSidebar = (show: boolean) => {`);

// usages in setup/init
code = code.replace(/loadSessions\(\);/g, `
    const t = translations[appLanguage] || translations["en"];
    sessionManager.setDefaultChatName(t.defaultChatName);
    sessionManager.loadSessions();
`);

// updateLanguage
code = code.replace(/chatTitle\.innerText = session\.name;/, `if (session.name !== t.defaultChatName) chatTitle.innerText = session.name; else { session.name = t.defaultChatName; sessionManager.saveSessions(); chatTitle.innerText = t.defaultChatName; }`);

// other replace of chatSessions
code = code.replace(/const session = chatSessions\.find\(s => s\.id === targetSessionId\);/g, `const session = sessionManager.getSession(targetSessionId!);`);
code = code.replace(/if \(currentSessionId === session\.id\) switchSession\(session\.id\);/g, `if (sessionManager.currentSessionId === session.id) sessionManager.switchSession(session.id);`);
code = code.replace(/chatSessions = chatSessions\.filter\(s => s\.id !== targetSessionId\);[\s\S]*?saveSessions\(\);/g, `sessionManager.deleteSession(targetSessionId!);`);
code = code.replace(/chatSessions = chatSessions\.filter\(s => s\.id !== currentSessionId\);[\s\S]*?saveSessions\(\);/g, `sessionManager.deleteCurrentSession();`);
code = code.replace(/createNewSession\(\);/g, `sessionManager.createNewSession();`);

// handleSendChat
code = code.replace(/const session = chatSessions\.find\(s => s\.id === currentSessionId\)!;/g, `const session = sessionManager.getCurrentSession()!;`);
code = code.replace(/saveSessions\(\);/g, `sessionManager.saveSessions();`);
code = code.replace(/autoRenameSession\(session, prompt\);/g, `sessionManager.autoRenameSession(prompt);`);

fs.writeFileSync(path, code);
console.log('taskpane.ts updated successfully.');
