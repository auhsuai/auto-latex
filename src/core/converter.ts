/* global document, Office, Word */
import katex from "katex";
import { remark } from "remark";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

export interface ConversionState {
    isCancelled: boolean;
    onProgress?: (remaining: number, total: number) => void;
}

// Edge Case 10: Balance Braces
function balanceBraces(latex: string): string {
    let openCount = (latex.match(/\{/g) || []).length;
    let closeCount = (latex.match(/\}/g) || []).length;
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
    return latex.replace(/(\\(?:mu|pi|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|nu|xi|omicron|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|exp|max|min|lim|det|sup|inf(?!ty)))([a-zA-Z0-9])/g, "$1 $2");
}

// Edge Case 5: Vietnamese Characters inside text mode and protecting existing \text{} blocks
function sanitizeVietnamese(latex: string): string {
    const textBlocks: string[] = [];
    
    // 1. Trích xuất các block \text{...} đã có ra thành placeholder để bảo vệ
    let tempLatex = latex.replace(/\\text\{[^}]*\}/g, (match) => {
        textBlocks.push(match);
        return '__TEXT_BLOCK_' + (textBlocks.length - 1) + '__';
    });

    // 2. Wrap các từ có chứa tiếng Việt (bao gồm cả chữ thường, gạch dưới nối liền)
    const vnRegex = /([a-zA-Z_]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+[a-zA-Z_]*)/g;
    tempLatex = tempLatex.replace(vnRegex, (match) => {
        // KaTeX không cho phép dấu _ đứng trần trong \text{}, phải escape thành \_
        const escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
        return `\\text{${escapedMatch}}`;
    });

    // 3. Phục hồi lại các block \text{...} cũ và escape _ cho chúng luôn
    textBlocks.forEach((block, i) => {
        const escapedBlock = block.replace(/(?<!\\)_/g, '\\_');
        tempLatex = tempLatex.replace(`__TEXT_BLOCK_${i}__`, escapedBlock);
    });

    return tempLatex;
}

// Edge Case 2: Environments without $$ are manually extracted, not mutated in text
function extractNakedEnvironments(text: string): string[] {
    const envRegex = /\\begin\{(cases|matrix|bmatrix|pmatrix|vmatrix|aligned|array|equation)\}[\s\S]*?\\end\{\1\}/g;
    return text.match(envRegex) || [];
}

export function sanitizeLaTeX(latex: string, isBlock: boolean): string {
    let sanitized = latex;

    // Edge Case 14: Unescaped % comment (KaTeX removes everything after it)
    sanitized = sanitized.replace(/(?<!\\)%/g, '\\%');
    
    // Edge Case 15: Non-breaking space (NBSP) causes KaTeX parse error
    sanitized = sanitized.replace(/\xA0/g, ' ');
    
    // Edge Case 16: Degree symbol
    sanitized = sanitized.replace(/°/g, '^\\circ');

    sanitized = balanceBraces(sanitized);
    if (!isBlock) {
        sanitized = sanitizeTrailingSlashes(sanitized);
    }
    sanitized = sanitizeTokenMerge(sanitized);
    sanitized = sanitizeVietnamese(sanitized);
    return sanitized;
}

export function getMathML(latex: string, isBlock: boolean): string | null {
    try {
        const html = katex.renderToString(latex, {
            displayMode: isBlock,
            output: "mathml",
            throwOnError: false,
            strict: false
        });
        
        // Edge Case 17: Auto-healing missing \right
        if (html.includes('class="katex-error"') && html.includes('\\right')) {
            const healedLatex = latex + '\\right.';
            const healedHtml = katex.renderToString(healedLatex, {
                displayMode: isBlock,
                output: "mathml",
                throwOnError: false,
                strict: false
            });
            const match = healedHtml.match(/<math[^>]*>[\s\S]*<\/math>/i);
            if (match && match[0]) {
                let mathML = match[0];
                mathML = mathML.replace(/<semantics>([\s\S]*?)<annotation[\s\S]*?<\/annotation><\/semantics>/ig, "$1");
                // Edge Case 18: Fix Word dotted box for unary minus/plus after opening parenthesis
                mathML = mathML.replace(/(<mo[^>]*>[\(\[\{]<\/mo>)\s*(<mo[^>]*>[−\+±∓]<\/mo>)/g, "$1<mi>&#x200B;</mi>$2");
                return mathML;
            }
        }
        
        const match = html.match(/<math[^>]*>[\s\S]*<\/math>/i);
        if (match && match[0]) {
            let mathML = match[0];
            mathML = mathML.replace(/<semantics>([\s\S]*?)<annotation[\s\S]*?<\/annotation><\/semantics>/ig, "$1");
            // Edge Case 18: Fix Word dotted box for unary minus/plus after opening parenthesis
            mathML = mathML.replace(/(<mo[^>]*>[\(\[\{]<\/mo>)\s*(<mo[^>]*>[−\+±∓]<\/mo>)/g, "$1<mi>&#x200B;</mi>$2");
            return mathML;
        }
        return null;
    } catch (e) {
        console.error("KaTeX Error", e);
        return null;
    }
}

export async function runConversion(onlySelection: boolean, state?: ConversionState) {
  return Word.run(async (context) => {
    const docRange = onlySelection ? context.document.getSelection() : context.document.body;
    
    docRange.load("text");
    await context.sync();

    const fullText = docRange.text;

    // DO NOT modify fullText to avoid breaking AST offsets
    // Using unified/remark pipeline to parse safely
    const processor = remark().use(remarkMath);
    const ast = processor.parse(fullText);

    const mathNodes: { type: 'inlineMath' | 'math', value: string, rawStr: string }[] = [];

    // 1. Manually add naked environments
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

    // 2. Visit AST to get parsed math
    visit(ast, (node: any) => {
        if (node.type === 'math' || node.type === 'inlineMath') {
            let exactMath = fullText.substring(node.position.start.offset, node.position.end.offset);
            
            let rawStr = "";
            // Check fullText directly to determine the actual delimiters used.
            if (fullText.includes(`**${exactMath}**`)) rawStr = `**${exactMath}**`;
            else if (fullText.includes(`*${exactMath}*`)) rawStr = `*${exactMath}*`;
            else if (fullText.includes(`_${exactMath}_`)) rawStr = `_${exactMath}_`;
            else rawStr = exactMath;
            
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
    
    const totalActualFormulas = mathNodes.length;
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
            const mathML = getMathML(latex, isBlock);
            
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
                        const fullRange = task.startResults.items[j].expandTo(task.endResults.items[j]);
                        rangesToReplace.push(fullRange);
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
                        processedActualFormulas += currentChunkCount;
                        if (processedActualFormulas > totalActualFormulas) processedActualFormulas = totalActualFormulas;
                        
                        if (state && state.onProgress) {
                            state.onProgress(totalActualFormulas - processedActualFormulas, totalActualFormulas);
                        }
                        currentChunkCount = 0;
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }

                // Final sync for remainder
                if (currentChunkCount > 0) {
                    await context.sync();
                    processedActualFormulas += currentChunkCount;
                    if (processedActualFormulas > totalActualFormulas) processedActualFormulas = totalActualFormulas;
                    
                    if (state && state.onProgress) {
                        state.onProgress(totalActualFormulas - processedActualFormulas, totalActualFormulas);
                    }
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } catch (err) {
                console.error("Lỗi khi chuẩn bị chèn công thức:", task.matchStr, err);
            }
        }
    }
  });
}
