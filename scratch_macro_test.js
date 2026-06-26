function parseMacros(macrosStr) {
    const macros = {};
    const regex = /\\(?:newcommand|renewcommand|def)\s*(?:\{?\s*(\\[a-zA-Z]+)\s*\}?)\s*(?:\[(\d+)\])?\s*\{/g;
    let match;
    while ((match = regex.exec(macrosStr)) !== null) {
        const name = match[1];
        const args = match[2];
        const bodyStart = regex.lastIndex;
        let openBraces = 1;
        let bodyEnd = bodyStart;
        for (let i = bodyStart; i < macrosStr.length; i++) {
            if (macrosStr[i] === '\\' && i + 1 < macrosStr.length) {
                i++; // skip escaped chars
                continue;
            }
            if (macrosStr[i] === '{') openBraces++;
            if (macrosStr[i] === '}') openBraces--;
            if (openBraces === 0) {
                bodyEnd = i;
                break;
            }
        }
        const body = macrosStr.substring(bodyStart, bodyEnd);
        macros[name] = body;
        regex.lastIndex = bodyEnd + 1;
    }
    return macros;
}

console.log(parseMacros("\\newcommand{\\R}{\\mathbb{R}}\n\\newcommand{\\d}{\\mathrm{d}}\n\\newcommand{\\myvec}[1]{\\vec{#1}}"));
