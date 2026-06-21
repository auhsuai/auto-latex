import { sanitizeLaTeX, getMathML } from "../core/converter";
import { escapeHtml } from "./helpers";

export const parseMarkdown = (text: string) => {
    let html = escapeHtml(text);
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/(?<!\*)\*(?!\*)([\s\S]*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
    html = html.replace(/`([\s\S]+?)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
};

export const processSegments = (textStr: string) => {
    const formulaRegex = /<\s*formula\s*>([\s\S]*?)<\s*\/\s*formula\s*>|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)/gi;
    let match;
    let lastIndex = 0;
    const segments: any[] = [];
    while ((match = formulaRegex.exec(textStr)) !== null) {
        const textPart = textStr.substring(lastIndex, match.index);
        if (textPart) segments.push({ type: 'text', content: textPart });
        
        let content = match[1];
        let isBlock = false;
        if (content !== undefined) {
            const trimmed = content.trim();
            if (trimmed.startsWith("$$") || trimmed.startsWith("\\[") || trimmed.includes("\\begin{")) isBlock = true;
        } else if (match[2] !== undefined) {
            content = match[2];
            isBlock = true;
        } else if (match[3] !== undefined) {
            content = match[3];
            isBlock = true;
        } else if (match[4] !== undefined) {
            content = match[4];
        }

        segments.push({ type: 'formula', content: content, isBlock: isBlock });
        lastIndex = formulaRegex.lastIndex;
    }
    const finalText = textStr.substring(lastIndex);
    if (finalText) segments.push({ type: 'text', content: finalText });
    return segments;
};

export const generateWordHtmlFromText = (textStr: string) => {
    const wSegments = processSegments(textStr);
    let cPara = "";
    let wHtml = "<html><body style='font-family: Calibri, sans-serif; font-size: 11pt;'>";
    let hasContent = false;
    for (const segment of wSegments) {
        if (segment.type === 'text') {
            const escaped = parseMarkdown(segment.content);
            cPara += escaped;
            if (escaped.trim() !== "") hasContent = true;
        } else if (segment.type === 'formula') {
            let rawLatex = segment.content.trim();
            if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                segment.isBlock = true;
            }
            if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                segment.isBlock = true;
            }
            if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
            }
            const isBlock = segment.isBlock || rawLatex.includes("\\begin{");
            const latexClean = sanitizeLaTeX(rawLatex, isBlock);
            const mathML = getMathML(latexClean, isBlock);
            if (mathML) {
                if (isBlock) {
                    if (cPara.trim() !== "") {
                        wHtml += `<p style="margin-bottom: 8px;">${cPara}</p>`;
                        cPara = "";
                    }
                    wHtml += `<p style="margin-bottom: 8px;">${mathML}</p>`;
                } else {
                    cPara += `<span style="margin: 0 4px;">${mathML}</span>`;
                }
                hasContent = true;
            }
        }
    }
    if (cPara.trim() !== "") {
        wHtml += `<p style="margin-bottom: 8px;">${cPara}</p>`;
    }
    wHtml += "</body></html>";
    return { html: wHtml, hasContent };
};
