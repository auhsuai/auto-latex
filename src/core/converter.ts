/* global document, Office, Word */
import katex from "katex";
import { remark } from "remark";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

export interface ConversionState {
    isCancelled: boolean;
    onProgress?: (remaining: number, total: number) => void;
}

export interface ConvertOptions {
    convertInline: boolean;
    convertBlock: boolean;
    convertNaked: boolean;
    forceDisplay: boolean;
    macrosString: string;
    parsedMacros?: Record<string, string>;
}

// Edge Case 10: Balance Braces
function balanceBraces(latex: string): string {
    const unescaped = latex.replace(/\\[{}]/g, "");
    let openCount = (unescaped.match(/\{/g) || []).length;
    let closeCount = (unescaped.match(/\}/g) || []).length;
    if (openCount > closeCount) {
        latex += "}".repeat(openCount - closeCount);
    } else if (openCount < closeCount) {
        latex = "{".repeat(closeCount - openCount) + latex;
    }
    return latex;
}

// Edge Case 9: Remove trailing \ or \\ in inline math
function sanitizeTrailingSlashes(latex: string): string {
    return latex.replace(/\\+\s*$/, "").trim();
}

// Edge Case 6: Token Merging (e.g. \muF -> \mu F)
function sanitizeTokenMerge(latex: string): string {
    // Only add a space if the macro is followed by a letter/number AND is not a prefix of another valid macro (like \limits)
    let res = latex.replace(/(\\(?:mu|pi|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|nu|xi|omicron|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|exp|max|min|lim|det|sup|inf(?!ty)))([a-zA-Z0-9])/g, (match, p1, p2) => {
        if (p1 === "\\lim" && p2 === "i") return match; // protect \limits, \liminf
        if (p1 === "\\lim" && p2 === "s") return match; // protect \limsup
        if (p1 === "\\sup" && p2 === "e") return match; // protect \supset, \supseteq (starts with \sup)
        if (p1 === "\\inf" && p2 === "t") return match; // protect \infty
        if (p1 === "\\pi" && p2 === "m") return match; // protect \simeq ? no, \pi isn't a prefix
        return p1 + " " + p2;
    });
    return res;
}

// Edge Case 5: Vietnamese Characters inside text mode and protecting existing \text{} blocks
function sanitizeVietnamese(latex: string): string {
    const textBlocks: string[] = [];
    
    // 1. Trích xuất các block \text{...} đã có ra thành placeholder để bảo vệ
    let tempLatex = latex.replace(/\\(?:text|textbf|textit|textrm|mathrm|operatorname)\{[^}]*\}/g, (match) => {
        textBlocks.push(match);
        return '__TEXT_BLOCK_' + (textBlocks.length - 1) + '__';
    });

    // 2. Wrap các từ có chứa tiếng Việt
    const vnRegex = /([a-zA-Z_]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+[a-zA-Z_]*)/g;
    
    let result = "";
    let depth = 0;
    let segmentStart = 0;
    for (let i = 0; i < tempLatex.length; i++) {
        if (tempLatex[i] === '{' && (i === 0 || tempLatex[i-1] !== '\\')) {
            if (depth === 0) {
                result += tempLatex.substring(segmentStart, i).replace(vnRegex, (match) => {
                    const escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
                    return `\\text{${escapedMatch}}`;
                });
                segmentStart = i;
            }
            depth++;
        } else if (tempLatex[i] === '}' && (i === 0 || tempLatex[i-1] !== '\\')) {
            depth--;
            if (depth === 0) {
                result += tempLatex.substring(segmentStart, i + 1);
                segmentStart = i + 1;
            }
        }
    }
    result += tempLatex.substring(segmentStart).replace(vnRegex, (match) => {
        const escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
        return `\\text{${escapedMatch}}`;
    });

    // 3. Phục hồi lại các block \text{...} cũ và escape _ cho chúng luôn
    textBlocks.forEach((block, i) => {
        const escapedBlock = block.replace(/(?<!\\)_/g, '\\_');
        result = result.replace(`__TEXT_BLOCK_${i}__`, escapedBlock);
    });

    return result;
}

// Edge Case 2: Environments without $$ are manually extracted, not mutated in text
function extractNakedEnvironments(text: string): string[] {
    const results: string[] = [];
    const envNames = '(?:cases|matrix|bmatrix|pmatrix|vmatrix|aligned|array|equation)';
    const beginRegex = new RegExp(`\\\\begin\\{(${envNames})\\}`, 'g');
    let match;
    while ((match = beginRegex.exec(text)) !== null) {
        const envName = match[1];
        let depth = 1;
        let pos = match.index + match[0].length;
        while (depth > 0 && pos < text.length) {
            const nextBegin = text.indexOf(`\\begin{${envName}}`, pos);
            const nextEnd = text.indexOf(`\\end{${envName}}`, pos);
            if (nextEnd === -1) break;
            if (nextBegin !== -1 && nextBegin < nextEnd) {
                depth++;
                pos = nextBegin + `\\begin{${envName}}`.length;
            } else {
                depth--;
                if (depth === 0) {
                    results.push(text.substring(match.index, nextEnd + `\\end{${envName}}`.length));
                }
                pos = nextEnd + `\\end{${envName}}`.length;
            }
        }
    }
    return results;
}

export function sanitizeLaTeX(latex: string, isBlock: boolean): string {
    let sanitized = latex;

    // Edge Case 14: Unescaped % comment (KaTeX removes everything after it)
    sanitized = sanitized.replace(/(?<!\\)%/g, '\\%');
    
    // Edge Case 15: Non-breaking space (NBSP) causes KaTeX parse error
    sanitized = sanitized.replace(/\xA0/g, ' ');
    
    // Edge Case 16: Degree symbol
    sanitized = sanitized.replace(/°/g, '^\\circ');
    
    // Auto-convert common ASCII and Unicode arrows to LaTeX commands
    sanitized = sanitized.replace(/(?<!\\)->/g, '\\to ');
    sanitized = sanitized.replace(/(?<!\\)=>/g, '\\Rightarrow ');
    sanitized = sanitized.replace(/(?<!\\)<-/g, '\\gets ');
    sanitized = sanitized.replace(/→/g, '\\to ');
    sanitized = sanitized.replace(/⇒/g, '\\Rightarrow ');
    sanitized = sanitized.replace(/←/g, '\\gets ');
    
    // Fix an edge case where \lim was wrapped in \mathrm by the OMML parser
    sanitized = sanitized.replace(/\\mathrm\{\s*\\?lim\s*\}/g, '\\lim');
    sanitized = sanitized.replace(/\\mathrm\{\s*\\?max\s*\}/g, '\\max');
    sanitized = sanitized.replace(/\\mathrm\{\s*\\?min\s*\}/g, '\\min');
    
    // Merge "\lim_{x} \to 0" into "\lim\limits_{x \to 0}" (Word's sSub might contain \_x)
    sanitized = sanitized.replace(/(?:\\+)?\blim_\{([^}]+)\}\s*\\to\s*([^\s\\]+)/g, (match, p1, p2) => {
        const cleanP1 = p1.replace(/^\\_/, '').trim();
        return `\\lim\\limits_{${cleanP1} \\to ${p2}}`;
    });
    
    // Auto-correct poorly typed limits like "lim _x \to 0" or "\lim _x \to 0" to "\lim\limits_{x \to 0}"
    sanitized = sanitized.replace(/(?:\\+)?\blim\s*(?:\\)?_\s*([^\s\\]+)\s*\\to\s*([^\s\\]+)/g, '\\lim\\limits_{$1 \\to $2}');
    
    // Edge Case 18: Word OMML groups subsequent terms into the subscript if there's no space.
    // e.g., \lim_{\left(x \to \infty\right)1/x} -> \lim\limits_{\left(x \to \infty\right)} 1/x
    sanitized = sanitized.replace(/(?:\\+)?\blim_\{\s*((?:\\left)?\([^)]+\)(?:\\right)?)([^}]+)\}/g, '\\lim\\limits_{$1} $2');

    // Force \lim_{...} to use \limits so it renders underneath instead of inline
    sanitized = sanitized.replace(/(?:\\+)?\blim_\{/g, '\\lim\\limits_{');
    sanitized = sanitized.replace(/(?:\\+)?\blim _\{/g, '\\lim\\limits_{');

    if (!isBlock) {
        sanitized = sanitizeTrailingSlashes(sanitized);
    }
    sanitized = sanitizeTokenMerge(sanitized);
    sanitized = sanitizeVietnamese(sanitized);
    sanitized = balanceBraces(sanitized);
    return sanitized;
}

export function parseMacros(macrosStr: string): Record<string, string> {
    const macros: Record<string, string> = {};
    if (!macrosStr) return macros;
    const regex = /\\(?:newcommand|renewcommand|def)\s*(?:\{?\s*(\\[a-zA-Z]+)\s*\}?)\s*(?:\[(\d+)\])?\s*\{/g;
    let match;
    while ((match = regex.exec(macrosStr)) !== null) {
        const name = match[1];
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

export function getKaTeXHtml(latex: string, isBlock: boolean, macros?: Record<string, string>): string {
    try {
        return katex.renderToString(latex, {
            displayMode: isBlock,
            output: "htmlAndMathml",
            throwOnError: false,
            strict: false,
            macros: macros || {}
        });
    } catch (e) {
        return "";
    }
}

function extractAndCleanMathML(html: string, isBlock: boolean): string | null {
    const match = html.match(/<math[^>]*>[\s\S]*<\/math>/i);
    if (match && match[0]) {
        let mathML = match[0];
        mathML = mathML.replace(/<semantics>([\s\S]*?)<annotation[\s\S]*?<\/annotation><\/semantics>/ig, "$1");
        if (!isBlock) {
            mathML = mathML.replace(/<math/, '<math display="inline"');
        }
        mathML = mathML.replace(/(<mo[^>]*>[\(\[\{]<\/mo>)\s*(<mo[^>]*>[−\+±∓]<\/mo>)/g, "$1<mi>&#x200B;</mi>$2");
        return mathML;
    }
    return null;
}

export function getMathML(latex: string, isBlock: boolean, macros?: Record<string, string>): string | null {
    try {
        const html = katex.renderToString(latex, {
            displayMode: isBlock,
            output: "mathml",
            throwOnError: false,
            strict: false,
            macros: macros || {}
        });
        
        // Edge Case 17: Auto-healing missing \right
        if (html.includes('class="katex-error"')) {
            const leftCount = (latex.match(/\\left[\(\[\{\.\\|]/g) || []).length;
            const rightCount = (latex.match(/\\right[\)\]\}\.\\|]/g) || []).length;
            if (leftCount > rightCount) {
                const healedLatex = latex + '\\right.'.repeat(leftCount - rightCount);
                const healedHtml = katex.renderToString(healedLatex, {
                    displayMode: isBlock,
                    output: "mathml",
                    throwOnError: false,
                    strict: false,
                    macros: macros || {}
                });
                const mathML = extractAndCleanMathML(healedHtml, isBlock);
                if (mathML) return mathML;
            }
        }
        
        return extractAndCleanMathML(html, isBlock);
    } catch (e) {
        console.error("KaTeX Error", e);
        return null;
    }
}

export async function runConversion(onlySelection: boolean, state?: ConversionState, options?: ConvertOptions) {
  return Word.run(async (context) => {
    try {
    const docRange = onlySelection ? context.document.getSelection() : context.document.body;
    
    if (options && options.macrosString) {
        options.parsedMacros = parseMacros(options.macrosString);
    }

    docRange.load("text");
    await context.sync();

    const fullText = docRange.text;

    // DO NOT modify fullText to avoid breaking AST offsets
    // Using unified/remark pipeline to parse safely
    const processor = remark().use(remarkMath);
    const ast = processor.parse(fullText);

    const mathNodes: { type: 'inlineMath' | 'math', value: string, rawStr: string }[] = [];

    // 1. Manually add naked environments
    if (!options || options.convertNaked !== false) {
        const nakedEnvs = extractNakedEnvironments(fullText);
        for (const envStr of nakedEnvs) {
            let isDuplicate = false;
            visit(ast, (n: any) => {
                if ((n.type === 'math' || n.type === 'inlineMath') && n.value.includes(envStr)) {
                    isDuplicate = true;
                }
            });
            if (!isDuplicate) {
                mathNodes.push({
                    type: 'math',
                    value: envStr,
                    rawStr: envStr
                });
            }
        }
    }

    // 2. Visit AST to get parsed math
    visit(ast, (node: any) => {
        if (node.type === 'math' || node.type === 'inlineMath') {
            const isBlockNode = node.type === 'math';
            if (options) {
                if (isBlockNode && options.convertBlock === false) return;
                if (!isBlockNode && options.convertInline === false) return;
            }
            
            let exactMath = fullText.substring(node.position.start.offset, node.position.end.offset);
            
            let rawStr = exactMath;
            const startOffset = node.position.start.offset;
            const endOffset = node.position.end.offset;
            
            if (startOffset >= 3 && endOffset + 3 <= fullText.length && 
                fullText.substring(startOffset - 3, startOffset) === '***' &&
                fullText.substring(endOffset, endOffset + 3) === '***') {
                rawStr = `***${exactMath}***`;
            } else if (startOffset >= 2 && endOffset + 2 <= fullText.length && 
                fullText.substring(startOffset - 2, startOffset) === '**' &&
                fullText.substring(endOffset, endOffset + 2) === '**') {
                rawStr = `**${exactMath}**`;
            } else if (startOffset >= 1 && endOffset + 1 <= fullText.length && 
                fullText.substring(startOffset - 1, startOffset) === '*' &&
                fullText.substring(endOffset, endOffset + 1) === '*') {
                rawStr = `*${exactMath}*`;
            } else if (startOffset >= 1 && endOffset + 1 <= fullText.length && 
                fullText.substring(startOffset - 1, startOffset) === '_' &&
                fullText.substring(endOffset, endOffset + 1) === '_') {
                rawStr = `_${exactMath}_`;
            }
            
            mathNodes.push({
                type: node.type,
                value: node.value,
                rawStr: rawStr
            });
        }
    });

    const uniqueNodes = Array.from(new Set(mathNodes.map(n => n.rawStr))).map(rawStr => {
        return mathNodes.find(n => n.rawStr === rawStr)!;
    });

    // Chunking to support low-end machines and avoid Memory Bloat
    const BATCH_SIZE = 1; // Xử lý từng pattern một để có thể chunk quá trình chèn, giúp UI cập nhật mượt và Cancel ngay lập tức
    
    const totalActualFormulas = uniqueNodes.length;
    let processedActualFormulas = 0;

    if (state && state.onProgress) {
        state.onProgress(totalActualFormulas, totalActualFormulas);
    }

    for (let i = 0; i < uniqueNodes.length; i += BATCH_SIZE) {
        if (state && state.isCancelled) {
            console.log("Conversion cancelled by user.");
            break;
        }

        const chunkNodes = uniqueNodes.slice(i, i + BATCH_SIZE);
        const searchTasks: any[] = [];

        // Phase 1: Search Queue
        for (const node of chunkNodes) {
            if (state && state.isCancelled) break;

            const matchStr = node.rawStr;

            // If the formula was wrapped in $$ or bold/italic $$, user expects a block equation
            const isBlock = matchStr.includes('$$');
            
            let cleanValue = node.value.trim();
            if (cleanValue.startsWith('$') && cleanValue.endsWith('$')) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1).trim();
            }

            const latex = sanitizeLaTeX(cleanValue, isBlock);
            const macros = options ? options.parsedMacros : undefined;
            const mathML = getMathML(latex, isBlock, macros);
            
            if (!mathML) continue;
            
            try {
                if (matchStr.length <= 250) {
                    const safeSearchStr = matchStr.replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                    const searchResults = docRange.search(safeSearchStr, { matchWildcards: false, matchCase: true });
                    searchResults.load("items");
                    searchTasks.push({ matchStr, mathML, type: 'short', results: searchResults });
                } else {
                    // Edge Case 11: Long Formula > 255 chars workaround using expandTo
                    const startStr = matchStr.substring(0, 50).replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                    const endStr = matchStr.substring(matchStr.length - 50).replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                    
                    const startResults = docRange.search(startStr, { matchWildcards: false, matchCase: true });
                    const endResults = docRange.search(endStr, { matchWildcards: false, matchCase: true });
                    
                    startResults.load("items");
                    endResults.load("items");
                    searchTasks.push({ matchStr, mathML, type: 'long', startResults, endResults });
                }
            } catch (err) {
                console.error("Lỗi khi tìm kiếm công thức:", matchStr, err);
            }
        }
        
        if (searchTasks.length === 0) continue;

        // Phase 2: Bulk Sync 1 (Load all search items for this chunk)
        await context.sync();

        // Phase 3: Insert Queue with Inner Chunking
        for (const task of searchTasks) {
            if (state && state.isCancelled) break;

            try {
                let rangesToReplace: any[] = [];
                if (task.type === 'short') {
                    for (let j = 0; j < task.results.items.length; j++) {
                        rangesToReplace.push(task.results.items[j]);
                    }
                } else {
                    const minLength = Math.min(task.startResults.items.length, task.endResults.items.length);
                    for (let j = 0; j < minLength; j++) {
                        try {
                            const fullRange = task.startResults.items[j].expandTo(task.endResults.items[j]);
                            fullRange.load("text");
                            await context.sync();
                            // Protect against massive expanded ranges from mismatched start/end items
                            if (fullRange.text.length > task.matchStr.length * 2 + 100) {
                                console.warn("Skipping mismatched expanded range");
                                continue;
                            }
                            if (fullRange.text.trim() === task.matchStr.trim()) {
                                rangesToReplace.push(fullRange);
                            }
                        } catch (e) {
                            console.warn("Failed to process long formula range", e);
                        }
                    }
                }
                
                // Loop backwards and chunk insertions
                const INSERT_CHUNK_SIZE = 10;
                let currentChunkCount = 0;

                for (let j = rangesToReplace.length - 1; j >= 0; j--) {
                    if (state && state.isCancelled) break;

                    const wrappedMathML = `<html><body>${task.mathML}</body></html>`;
                    rangesToReplace[j].insertHtml(wrappedMathML, Word.InsertLocation.replace);
                    currentChunkCount++;

                    if (currentChunkCount >= INSERT_CHUNK_SIZE) {
                        await context.sync();
                        currentChunkCount = 0;
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }

                // Final sync for remainder
                if (currentChunkCount > 0) {
                    await context.sync();
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } catch (err) {
                console.error("Lỗi khi chuẩn bị chèn công thức:", task.matchStr, err);
            }
        }

        processedActualFormulas += chunkNodes.length;
        if (state && state.onProgress) {
            state.onProgress(totalActualFormulas - processedActualFormulas, totalActualFormulas);
        }
    }
    } catch (error) {
        console.error("Conversion failed:", error);
    }
  });
}
