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
    batchSize: number;       // số formula xử lý mỗi context.sync()
    insertDelay: number;     // ms delay giữa các batch insert
    insertChunkSize: number; // số range insert giữa các sync
}

// Edge Case 10: Balance Braces
function balanceBraces(latex: string): string {
    const unescaped = latex.replace(/\\[{}]/g, "");
    let openCount = (unescaped.match(/\{/g) || []).length;
    let closeCount = (unescaped.match(/\}/g) || []).length;
    if (openCount > closeCount) {
        latex += "}".repeat(openCount - closeCount);
    }
    // Do not prepend '{' if closeCount > openCount because it destroys the formula's semantic structure
    return latex;
}

// Edge Case 9: Remove trailing \ or \\ in inline math
function sanitizeTrailingSlashes(latex: string): string {
    return latex.replace(/\\+\s*$/, "").trim();
}

const VALID_MACROS = [
    "varepsilon","varsigma","vartheta","epsilon","omicron","upsilon","Upsilon",
    "arcsin","arccos","arctan","varphi","varrho","lambda","Lambda","alpha",
    "gamma","delta","theta","kappa","sigma","omega","Gamma","Delta","Theta",
    "Sigma","Omega","beta","zeta","iota","sinh","cosh","tanh","coth","eta",
    "tau","phi","chi","psi","sin","cos","tan","cot","sec","csc","log","exp",
    "max","min","lim","det","sup","inf","deg","arg","dim","hom","ker","Phi",
    "Psi","mu","nu","xi","pi","rho","Pr","ln","Xi","Pi",
    "limits","liminf","limsup","supset","supseteq","infty"
].sort((a, b) => b.length - a.length);

// Edge Case 6: Token Merging (e.g. \muF -> \mu F)
function sanitizeTokenMerge(latex: string): string {
    let res = latex.replace(/\\([a-zA-Z]+)([0-9]?)/g, (match, p1, p2) => {
        for (const m of VALID_MACROS) {
            if (p1.startsWith(m)) {
                const remainder = p1.substring(m.length);
                if (remainder.length > 0) {
                    return "\\" + m + " " + remainder + p2;
                } else {
                    if (p2) return "\\" + m + " " + p2;
                    return match;
                }
            }
        }
        return match;
    });
    return res;
}

// Helper to protect text environments using a depth parser (Fix Bug 4 & 5)
function protectTextBlocks(latex: string): { sanitized: string, textBlocks: string[] } {
    const textBlocks: string[] = [];
    let cleanLatex = '';
    
    const startRegex = /\\(text|textbf|textit|textrm|textsf|texttt|mbox)\s*\{/g;
    let lastIndex = 0;
    let match;
    
    while ((match = startRegex.exec(latex)) !== null) {
        cleanLatex += latex.substring(lastIndex, match.index);
        let depth = 1;
        let i = startRegex.lastIndex;
        while (i < latex.length && depth > 0) {
            if (latex[i] === '{') depth++;
            else if (latex[i] === '}') depth--;
            i++;
        }
        const block = latex.substring(match.index, i);
        textBlocks.push(block);
        cleanLatex += `__TEXT_BLOCK_${textBlocks.length - 1}__`;
        lastIndex = i;
        startRegex.lastIndex = i;
    }
    
    cleanLatex += latex.substring(lastIndex);
    return { sanitized: cleanLatex, textBlocks };
}

function restoreTextBlocks(latex: string, textBlocks: string[]): string {
    return latex.replace(/__TEXT_BLOCK_(\d+)__/g, (match, indexStr) => {
        const i = parseInt(indexStr, 10);
        if (textBlocks[i] !== undefined) {
            return textBlocks[i].replace(/(?<!\\)_/g, '\\_');
        }
        return match;
    });
}

// Edge Case 5: Vietnamese Characters inside text mode
function sanitizeVietnamese(latex: string): string {
    const vnChars = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";
    const vnWord = `[a-zA-Z_]*[${vnChars}]+[a-zA-Z_]*`;
    const vnRegex = new RegExp(`([ \\t]*${vnWord}(?:[ \\t]+${vnWord})*[ \\t]*)`, 'g');
    
    let result = "";
    let depth = 0;
    let segmentStart = 0;

    const isUnescaped = (str: string, index: number) => {
        let slashes = 0;
        for (let j = index - 1; j >= 0 && str[j] === '\\'; j--) {
            slashes++;
        }
        return slashes % 2 === 0;
    };

    for (let i = 0; i < latex.length; i++) {
        if (latex[i] === '{' && isUnescaped(latex, i)) {
            if (depth === 0) {
                result += latex.substring(segmentStart, i).replace(vnRegex, (match) => {
                    const escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
                    return `\\text{${escapedMatch}}`;
                });
                segmentStart = i;
            }
            depth++;
        } else if (latex[i] === '}' && isUnescaped(latex, i)) {
            depth--;
            if (depth === 0) {
                result += latex.substring(segmentStart, i + 1);
                segmentStart = i + 1;
            }
        }
    }
    result += latex.substring(segmentStart).replace(vnRegex, (match) => {
        const escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
        return `\\text{${escapedMatch}}`;
    });

    return result;
}

// Edge Case 2: Environments without $$ are manually extracted, not mutated in text
function extractNakedEnvironments(text: string): string[] {
    const results: string[] = [];
    const beginRegex = new RegExp(`\\\\begin\\{([a-zA-Z*]+)\\}`, 'g');
    let match;
    while ((match = beginRegex.exec(text)) !== null) {
        const envName = match[1];
        let depth = 1;
        let pos = match.index + match[0].length;
        while (depth > 0 && pos < text.length) {
            const nextBegin = text.indexOf(`\\begin{${envName}}`, pos);
            const nextEnd = text.indexOf(`\\end{${envName}}`, pos);
            if (nextEnd === -1) {
                beginRegex.lastIndex = match.index + match[0].length;
                break;
            }
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
        beginRegex.lastIndex = pos;
    }
    return results;
}

export function sanitizeLaTeX(latex: string, isBlock: boolean): string {
    let { sanitized, textBlocks } = protectTextBlocks(latex);

    // Edge Case 14: Unescaped % comment (KaTeX removes everything after it)
    sanitized = sanitized.replace(/(?<!\\)%/g, '\\%');
    
    // Edge Case 15: Non-breaking space (NBSP) causes KaTeX parse error
    sanitized = sanitized.replace(/\xA0/g, ' ');
    
    // Edge Case 16: Degree symbol
    sanitized = sanitized.replace(/°/g, '^\\circ');
    
    // Auto-convert common ASCII and Unicode arrows to LaTeX commands
    sanitized = sanitized.replace(/(?<!\\)->|→/g, '\\to ');
    sanitized = sanitized.replace(/(?<!\\)=>|⇒/g, '\\Rightarrow ');
    sanitized = sanitized.replace(/(?<!\\)<-|←/g, '\\gets ');
    
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
    
    sanitized = restoreTextBlocks(sanitized, textBlocks);
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
        
        // Edge Case 19: Word OMML splits <mi>sinh</mi> into "sin" and "h".
        // To prevent this, we split it into individual upright characters in MathML.
        mathML = mathML.replace(/<mi>sinh<\/mi>/g, '<mi mathvariant="normal">s</mi><mi mathvariant="normal">i</mi><mi mathvariant="normal">n</mi><mi mathvariant="normal">h</mi>');
        mathML = mathML.replace(/<mi>cosh<\/mi>/g, '<mi mathvariant="normal">c</mi><mi mathvariant="normal">o</mi><mi mathvariant="normal">s</mi><mi mathvariant="normal">h</mi>');
        mathML = mathML.replace(/<mi>tanh<\/mi>/g, '<mi mathvariant="normal">t</mi><mi mathvariant="normal">a</mi><mi mathvariant="normal">n</mi><mi mathvariant="normal">h</mi>');
        mathML = mathML.replace(/<mi>coth<\/mi>/g, '<mi mathvariant="normal">c</mi><mi mathvariant="normal">o</mi><mi mathvariant="normal">t</mi><mi mathvariant="normal">h</mi>');
        
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
            const leftCount = (latex.match(/\\left[\(\[\{\.\|]/g) || []).length;
            const rightCount = (latex.match(/\\right[\)\]\}\.\|]/g) || []).length;
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
    const BATCH_SIZE = options?.batchSize || 20; // Tăng lên 20 để giảm số lần context.sync() (Bug 4)
    
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
        let aborted = false;

        // Phase 1: Search Queue
        for (const node of chunkNodes) {
            if (state && state.isCancelled) {
                aborted = true;
                break;
            }

            const matchStr = node.rawStr;

            // Determine block equation based on AST type
            const isBlock = node.type === 'math';
            
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
                    // Dùng 240 kí tự thay vì 50 để đảm bảo tính duy nhất, tránh bùng nổ O(n*m) (Bug 5)
                    const startStr = matchStr.substring(0, 240).replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                    const endStr = matchStr.substring(matchStr.length - 80).replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                    
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
        
        if (aborted) break;
        if (searchTasks.length === 0) continue;

        // Phase 2: Bulk Sync 1 (Load all search items for this chunk)
        await context.sync();

        // Phase 3: Insert Queue with Inner Chunking
        for (const task of searchTasks) {
            if (state && state.isCancelled) {
                aborted = true;
                break;
            }

            try {
                let rangesToReplace: any[] = [];
                if (task.type === 'short') {
                    for (let j = 0; j < task.results.items.length; j++) {
                        rangesToReplace.push(task.results.items[j]);
                    }
                } else {
                    const candidates: any[] = [];
                    for (let j = 0; j < task.startResults.items.length; j++) {
                        for (let k = 0; k < task.endResults.items.length; k++) {
                            try {
                                const fullRange = task.startResults.items[j].expandTo(task.endResults.items[k]);
                                fullRange.load("text");
                                candidates.push(fullRange);
                            } catch (e) {
                                // Word API may throw if endItem is before startItem
                            }
                        }
                    }

                    if (candidates.length > 0) {
                        await context.sync();
                    }

                    for (let c = 0; c < candidates.length; c++) {
                        try {
                            const fullRange = candidates[c];
                            if (fullRange.text.length >= task.matchStr.length && fullRange.text.length <= task.matchStr.length + 100) {
                                if (fullRange.text.trim() === task.matchStr.trim()) {
                                    rangesToReplace.push(fullRange);
                                    // Bỏ qua các candidate còn lại cho cùng startItem để tránh đè (Bug 5)
                                    break;
                                }
                            }
                        } catch (e) {
                            console.warn("Failed to validate long formula candidate", e);
                        }
                    }
                }
                
                // Deduplicate ranges to prevent multiple insertions at the exact same place
                const uniqueRanges = [];
                for (const range of rangesToReplace) {
                    if (!uniqueRanges.includes(range)) uniqueRanges.push(range);
                }
                rangesToReplace = uniqueRanges;

                // Loop backwards and chunk insertions
                const INSERT_CHUNK_SIZE = options?.insertChunkSize || 10;
                let currentChunkCount = 0;

                for (let j = rangesToReplace.length - 1; j >= 0; j--) {
                    if (state && state.isCancelled) {
                        aborted = true;
                        break;
                    }

                    const wrappedMathML = `<html><body>${task.mathML}</body></html>`;
                    rangesToReplace[j].insertHtml(wrappedMathML, Word.InsertLocation.replace);
                    currentChunkCount++;

                    if (currentChunkCount >= INSERT_CHUNK_SIZE) {
                        await context.sync();
                        currentChunkCount = 0;
                        await new Promise(resolve => setTimeout(resolve, options?.insertDelay ?? 10));
                    }
                }

                // Final sync for remainder
                if (currentChunkCount > 0) {
                    await context.sync();
                    await new Promise(resolve => setTimeout(resolve, options?.insertDelay ?? 10));
                }
            } catch (err) {
                console.error("Lỗi khi chuẩn bị chèn công thức:", task.matchStr, err);
            }
            if (aborted) break;
        }

        if (aborted) break;

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
