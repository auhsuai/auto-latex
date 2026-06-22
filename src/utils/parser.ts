import { sanitizeLaTeX, getMathML, getKaTeXHtml } from "../core/converter";
import { escapeHtml } from "./helpers";

export const parseMarkdown = (text: string) => {
    let html = escapeHtml(text);
    html = html.replace(/^#{1,6}\s+(.*)$/gm, '<b style="display:block; margin-top:8px;">$1</b>');
    html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<b>$1</b>');
    html = html.replace(/(?<!\*)\*(?!\*)([\s\S]*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
    html = html.replace(/`([\s\S]+?)`/g, '<code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
};

export const renderInlineMathPreview = (text: string) => {
    const parts = text.split(/(<\s*block_formula\s*>[\s\S]*?<\s*\/\s*block_formula\s*>|<\s*inline_formula\s*>[\s\S]*?<\s*\/\s*inline_formula\s*>|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\$(?:(?!\n\s*\n)[^\$])+\$)/gi);
    
    let html = "";
    for (const part of parts) {
        if (!part) continue;
        const p = part.trim();
        let latex = "";
        let isMath = false;

        if (p.startsWith('<block_formula>') && p.endsWith('</block_formula>')) {
            latex = p.replace(/<\/?block_formula>/gi, "");
            isMath = true;
        } else if (p.startsWith('<inline_formula>') && p.endsWith('</inline_formula>')) {
            latex = p.replace(/<\/?inline_formula>/gi, "");
            isMath = true;
        } else if (p.startsWith('$$') && p.endsWith('$$')) {
            latex = p.substring(2, p.length - 2);
            isMath = true;
        } else if (p.startsWith('\\[') && p.endsWith('\\]')) {
            latex = p.substring(2, p.length - 2);
            isMath = true;
        } else if (p.startsWith('\\(') && p.endsWith('\\)')) {
            latex = p.substring(2, p.length - 2);
            isMath = true;
        } else if (p.startsWith('$') && p.endsWith('$')) {
            latex = p.substring(1, p.length - 1);
            isMath = true;
        }

        if (isMath && latex.trim()) {
            const clean = sanitizeLaTeX(latex, false);
            const rendered = getKaTeXHtml(clean, false);
            if (rendered) {
                html += `<span class="preview-math" style="display: inline-flex; align-items: center;">${rendered}</span>`;
            } else {
                html += escapeHtml(part);
            }
        } else {
            html += escapeHtml(part).replace(/\n/g, '<br>');
        }
    }
    return html;
};

export const processSegments = (textStr: string) => {
    // Restrict inline $ to not span across paragraphs (double newlines) to prevent runaway math blocks
    const formulaRegex = /<\s*formula\s*>([\s\S]*?)<\s*\/\s*formula\s*>|<\s*inline_formul[a-z]*\s*>([\s\S]*?)<\s*\/\s*inline_formul[a-z]*\s*>|<\s*block_formul[a-z]*\s*>([\s\S]*?)<\s*\/\s*block_formul[a-z]*\s*>|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)|\$((?:(?!\n\s*\n)[^\$])+)\$/gi;
    let match;
    let lastIndex = 0;
    const segments: any[] = [];
    while ((match = formulaRegex.exec(textStr)) !== null) {
        const textPart = textStr.substring(lastIndex, match.index);
        if (textPart) segments.push({ type: 'text', content: textPart });
        
        let content = match[1];
        let isBlock = false;
        let isExplicitInline = false;
        
        if (content !== undefined) {
            const trimmed = content.trim();
            if (trimmed.startsWith("$$") || trimmed.startsWith("\\[") || trimmed.includes("\\begin{")) {
                isBlock = true;
            } else {
                const beforeMatch = textStr.substring(0, match.index);
                const afterMatch = textStr.substring(formulaRegex.lastIndex);
                if (/(?:^|[\r\n])\s*$/.test(beforeMatch) && /^\s*(?:[\r\n]|$)/.test(afterMatch)) {
                    isBlock = true;
                }
            }
        } else if (match[2] !== undefined) {
            content = match[2];
            isBlock = false;
            isExplicitInline = true;
        } else if (match[3] !== undefined) {
            content = match[3];
            isBlock = true;
        } else if (match[4] !== undefined) {
            content = match[4];
            isBlock = true;
        } else if (match[5] !== undefined) {
            content = match[5];
            isBlock = true;
        } else if (match[6] !== undefined) {
            content = match[6];
            isBlock = false;
        } else if (match[7] !== undefined) {
            content = match[7];
            isBlock = false;
        }

        segments.push({ type: 'formula', content: content, isBlock: isBlock, isExplicitInline: isExplicitInline });
        lastIndex = formulaRegex.lastIndex;
    }
    const finalText = textStr.substring(lastIndex);
    if (finalText) segments.push({ type: 'text', content: finalText });

    for (let i = 0; i < segments.length; i++) {
        if (segments[i].type === 'formula') {
            if (!segments[i].isBlock) {
                if (i > 0 && segments[i-1].type === 'text') {
                    segments[i-1].content = segments[i-1].content.replace(/[\r\n]+\s*$/g, ' ');
                }
                if (i < segments.length - 1 && segments[i+1].type === 'text') {
                    segments[i+1].content = segments[i+1].content.replace(/^[\r\n]+\s*/g, ' ');
                    segments[i+1].content = segments[i+1].content.replace(/^\s+([,.;:!?])/g, '$1');
                }
            } else {
                if (i > 0 && segments[i-1].type === 'text') {
                    segments[i-1].content = segments[i-1].content.replace(/[\r\n]+\s*$/g, '');
                }
                if (i < segments.length - 1 && segments[i+1].type === 'text') {
                    segments[i+1].content = segments[i+1].content.replace(/^[\r\n]+\s*/g, '');
                }
            }
        }
    }

    return segments;
};

export const generateWordHtmlFromText = (textStr: string) => {
    const wSegments = processSegments(textStr);
    let cPara = "";
    let wHtml = "<html><body style='font-family: Calibri, sans-serif; font-size: 11pt;'>";
    let hasContent = false;
    for (let i = 0; i < wSegments.length; i++) {
        const segment = wSegments[i];
        if (segment.type === 'text') {
            let escaped = parseMarkdown(segment.content);
            
            if (i > 0 && wSegments[i-1].type === 'formula' && !wSegments[i-1].isBlock) {
                if (escaped.startsWith(' ')) {
                    escaped = '&nbsp;' + escaped.substring(1);
                }
            }
            if (i < wSegments.length - 1 && wSegments[i+1].type === 'formula' && !wSegments[i+1].isBlock) {
                if (escaped.endsWith(' ')) {
                    escaped = escaped.substring(0, escaped.length - 1) + '&nbsp;';
                }
            }
            
            cPara += escaped;
            if (escaped.trim() !== "") hasContent = true;
        } else if (segment.type === 'formula') {
            let rawLatex = segment.content.trim();
            if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                segment.isBlock = true;
            } else if (rawLatex.startsWith("\\[") && rawLatex.endsWith("\\]")) {
                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                segment.isBlock = true;
            } else if (rawLatex.startsWith("\\(") && rawLatex.endsWith("\\)")) {
                rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
            } else if (rawLatex.startsWith("$") && rawLatex.endsWith("$")) {
                rawLatex = rawLatex.substring(1, rawLatex.length - 1).trim();
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
                    cPara += `<span>${mathML}</span>`;
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
