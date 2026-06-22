"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeLaTeX = sanitizeLaTeX;
exports.getKaTeXHtml = getKaTeXHtml;
exports.getMathML = getMathML;
exports.runConversion = runConversion;
/* global document, Office, Word */
var katex_1 = require("katex");
var remark_1 = require("remark");
var remark_math_1 = require("remark-math");
var unist_util_visit_1 = require("unist-util-visit");
// Edge Case 10: Balance Braces
function balanceBraces(latex) {
    var unescaped = latex.replace(/\\[{}]/g, "");
    var openCount = (unescaped.match(/\{/g) || []).length;
    var closeCount = (unescaped.match(/\}/g) || []).length;
    if (openCount > closeCount) {
        latex += "}".repeat(openCount - closeCount);
    }
    else if (openCount < closeCount) {
        latex = "{".repeat(closeCount - openCount) + latex;
    }
    return latex;
}
// Edge Case 9: Remove trailing \ or \\ in inline math
function sanitizeTrailingSlashes(latex) {
    return latex.replace(/\\+\s*$/, "").trim();
}
// Edge Case 6: Token Merging (e.g. \muF -> \mu F)
function sanitizeTokenMerge(latex) {
    // Only add a space if the macro is followed by a letter/number AND is not a prefix of another valid macro (like \limits)
    var res = latex.replace(/(\\(?:mu|pi|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|nu|xi|omicron|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|log|ln|exp|max|min|lim|det|sup|inf(?!ty)))([a-zA-Z0-9])/g, function (match, p1, p2) {
        if (p1 === "\\lim" && p2 === "i")
            return match; // protect \limits, \liminf
        if (p1 === "\\lim" && p2 === "s")
            return match; // protect \limsup
        if (p1 === "\\sup" && p2 === "e")
            return match; // protect \supset, \supseteq (starts with \sup)
        if (p1 === "\\inf" && p2 === "t")
            return match; // protect \infty
        if (p1 === "\\pi" && p2 === "m")
            return match; // protect \simeq ? no, \pi isn't a prefix
        return p1 + " " + p2;
    });
    return res;
}
// Edge Case 5: Vietnamese Characters inside text mode and protecting existing \text{} blocks
function sanitizeVietnamese(latex) {
    var textBlocks = [];
    // 1. Trích xuất các block \text{...} đã có ra thành placeholder để bảo vệ
    var tempLatex = latex.replace(/\\(?:text|textbf|textit|textrm|mathrm|operatorname)\{[^}]*\}/g, function (match) {
        textBlocks.push(match);
        return '__TEXT_BLOCK_' + (textBlocks.length - 1) + '__';
    });
    // 2. Wrap các từ có chứa tiếng Việt
    var vnRegex = /([a-zA-Z_]*[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+[a-zA-Z_]*)/g;
    var result = "";
    var depth = 0;
    var segmentStart = 0;
    for (var i = 0; i < tempLatex.length; i++) {
        if (tempLatex[i] === '{' && (i === 0 || tempLatex[i - 1] !== '\\')) {
            if (depth === 0) {
                result += tempLatex.substring(segmentStart, i).replace(vnRegex, function (match) {
                    var escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
                    return "\\text{".concat(escapedMatch, "}");
                });
                segmentStart = i;
            }
            depth++;
        }
        else if (tempLatex[i] === '}' && (i === 0 || tempLatex[i - 1] !== '\\')) {
            depth--;
            if (depth === 0) {
                result += tempLatex.substring(segmentStart, i + 1);
                segmentStart = i + 1;
            }
        }
    }
    result += tempLatex.substring(segmentStart).replace(vnRegex, function (match) {
        var escapedMatch = match.replace(/(?<!\\)_/g, '\\_');
        return "\\text{".concat(escapedMatch, "}");
    });
    // 3. Phục hồi lại các block \text{...} cũ và escape _ cho chúng luôn
    textBlocks.forEach(function (block, i) {
        var escapedBlock = block.replace(/(?<!\\)_/g, '\\_');
        result = result.replace("__TEXT_BLOCK_".concat(i, "__"), escapedBlock);
    });
    return result;
}
// Edge Case 2: Environments without $$ are manually extracted, not mutated in text
function extractNakedEnvironments(text) {
    var results = [];
    var envNames = '(?:cases|matrix|bmatrix|pmatrix|vmatrix|aligned|array|equation)';
    var beginRegex = new RegExp("\\\\begin\\{(".concat(envNames, ")\\}"), 'g');
    var match;
    while ((match = beginRegex.exec(text)) !== null) {
        var envName = match[1];
        var depth = 1;
        var pos = match.index + match[0].length;
        while (depth > 0 && pos < text.length) {
            var nextBegin = text.indexOf("\\begin{".concat(envName, "}"), pos);
            var nextEnd = text.indexOf("\\end{".concat(envName, "}"), pos);
            if (nextEnd === -1)
                break;
            if (nextBegin !== -1 && nextBegin < nextEnd) {
                depth++;
                pos = nextBegin + "\\begin{".concat(envName, "}").length;
            }
            else {
                depth--;
                if (depth === 0) {
                    results.push(text.substring(match.index, nextEnd + "\\end{".concat(envName, "}").length));
                }
                pos = nextEnd + "\\end{".concat(envName, "}").length;
            }
        }
    }
    return results;
}
function sanitizeLaTeX(latex, isBlock) {
    var sanitized = latex;
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
    sanitized = sanitized.replace(/(?:\\+)?\blim_\{([^}]+)\}\s*\\to\s*([^\s\\]+)/g, function (match, p1, p2) {
        var cleanP1 = p1.replace(/^\\_/, '').trim();
        return "\\lim\\limits_{".concat(cleanP1, " \\to ").concat(p2, "}");
    });
    // Auto-correct poorly typed limits like "lim _x \to 0" or "\lim _x \to 0" to "\lim\limits_{x \to 0}"
    sanitized = sanitized.replace(/(?:\\+)?\blim\s*(?:\\)?_\s*([^\s\\]+)\s*\\to\s*([^\s\\]+)/g, '\\lim\\limits_{$1 \\to $2}');
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
function getKaTeXHtml(latex, isBlock) {
    try {
        return katex_1.default.renderToString(latex, {
            displayMode: isBlock,
            output: "htmlAndMathml",
            throwOnError: false,
            strict: false
        });
    }
    catch (e) {
        return "";
    }
}
function extractAndCleanMathML(html, isBlock) {
    var match = html.match(/<math[^>]*>[\s\S]*<\/math>/i);
    if (match && match[0]) {
        var mathML = match[0];
        mathML = mathML.replace(/<semantics>([\s\S]*?)<annotation[\s\S]*?<\/annotation><\/semantics>/ig, "$1");
        if (!isBlock) {
            mathML = mathML.replace(/<math/, '<math display="inline"');
        }
        mathML = mathML.replace(/(<mo[^>]*>[\(\[\{]<\/mo>)\s*(<mo[^>]*>[−\+±∓]<\/mo>)/g, "$1<mi>&#x200B;</mi>$2");
        return mathML;
    }
    return null;
}
function getMathML(latex, isBlock) {
    try {
        var html = katex_1.default.renderToString(latex, {
            displayMode: isBlock,
            output: "mathml",
            throwOnError: false,
            strict: false
        });
        // Edge Case 17: Auto-healing missing \right
        if (html.includes('class="katex-error"')) {
            var leftCount = (latex.match(/\\left[\(\[\{\.\\|]/g) || []).length;
            var rightCount = (latex.match(/\\right[\)\]\}\.\\|]/g) || []).length;
            if (leftCount > rightCount) {
                var healedLatex = latex + '\\right.'.repeat(leftCount - rightCount);
                var healedHtml = katex_1.default.renderToString(healedLatex, {
                    displayMode: isBlock,
                    output: "mathml",
                    throwOnError: false,
                    strict: false
                });
                var mathML = extractAndCleanMathML(healedHtml, isBlock);
                if (mathML)
                    return mathML;
            }
        }
        return extractAndCleanMathML(html, isBlock);
    }
    catch (e) {
        console.error("KaTeX Error", e);
        return null;
    }
}
function runConversion(onlySelection, state) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, Word.run(function (context) { return __awaiter(_this, void 0, void 0, function () {
                    var docRange, fullText, processor, ast, mathNodes, nakedEnvs, _loop_1, _i, nakedEnvs_1, envStr, uniqueNodes, BATCH_SIZE, totalActualFormulas, processedActualFormulas, i, chunkNodes, searchTasks, _a, chunkNodes_1, node, matchStr, isBlock, cleanValue, latex, mathML, safeSearchStr, searchResults, startStr, endStr, startResults, endResults, _b, searchTasks_1, task, rangesToReplace, j, minLength, j, fullRange, INSERT_CHUNK_SIZE, currentChunkCount, j, wrappedMathML, err_1;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                docRange = onlySelection ? context.document.getSelection() : context.document.body;
                                docRange.load("text");
                                return [4 /*yield*/, context.sync()];
                            case 1:
                                _c.sent();
                                fullText = docRange.text;
                                processor = (0, remark_1.remark)().use(remark_math_1.default);
                                ast = processor.parse(fullText);
                                mathNodes = [];
                                nakedEnvs = extractNakedEnvironments(fullText);
                                _loop_1 = function (envStr) {
                                    var isDuplicate = false;
                                    (0, unist_util_visit_1.visit)(ast, function (n) {
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
                                };
                                for (_i = 0, nakedEnvs_1 = nakedEnvs; _i < nakedEnvs_1.length; _i++) {
                                    envStr = nakedEnvs_1[_i];
                                    _loop_1(envStr);
                                }
                                // 2. Visit AST to get parsed math
                                (0, unist_util_visit_1.visit)(ast, function (node) {
                                    if (node.type === 'math' || node.type === 'inlineMath') {
                                        var exactMath = fullText.substring(node.position.start.offset, node.position.end.offset);
                                        var rawStr = exactMath;
                                        var startOffset = node.position.start.offset;
                                        var endOffset = node.position.end.offset;
                                        if (startOffset >= 3 && endOffset + 3 <= fullText.length &&
                                            fullText.substring(startOffset - 3, startOffset) === '***' &&
                                            fullText.substring(endOffset, endOffset + 3) === '***') {
                                            rawStr = "***".concat(exactMath, "***");
                                        }
                                        else if (startOffset >= 2 && endOffset + 2 <= fullText.length &&
                                            fullText.substring(startOffset - 2, startOffset) === '**' &&
                                            fullText.substring(endOffset, endOffset + 2) === '**') {
                                            rawStr = "**".concat(exactMath, "**");
                                        }
                                        else if (startOffset >= 1 && endOffset + 1 <= fullText.length &&
                                            fullText.substring(startOffset - 1, startOffset) === '*' &&
                                            fullText.substring(endOffset, endOffset + 1) === '*') {
                                            rawStr = "*".concat(exactMath, "*");
                                        }
                                        else if (startOffset >= 1 && endOffset + 1 <= fullText.length &&
                                            fullText.substring(startOffset - 1, startOffset) === '_' &&
                                            fullText.substring(endOffset, endOffset + 1) === '_') {
                                            rawStr = "_".concat(exactMath, "_");
                                        }
                                        mathNodes.push({
                                            type: node.type,
                                            value: node.value,
                                            rawStr: rawStr
                                        });
                                    }
                                });
                                uniqueNodes = Array.from(new Set(mathNodes.map(function (n) { return n.rawStr; }))).map(function (rawStr) {
                                    return mathNodes.find(function (n) { return n.rawStr === rawStr; });
                                });
                                BATCH_SIZE = 1;
                                totalActualFormulas = uniqueNodes.length;
                                processedActualFormulas = 0;
                                if (state && state.onProgress) {
                                    state.onProgress(totalActualFormulas, totalActualFormulas);
                                }
                                i = 0;
                                _c.label = 2;
                            case 2:
                                if (!(i < uniqueNodes.length)) return [3 /*break*/, 23];
                                if (state && state.isCancelled) {
                                    console.log("Conversion cancelled by user.");
                                    return [3 /*break*/, 23];
                                }
                                chunkNodes = uniqueNodes.slice(i, i + BATCH_SIZE);
                                searchTasks = [];
                                // Phase 1: Search Queue
                                for (_a = 0, chunkNodes_1 = chunkNodes; _a < chunkNodes_1.length; _a++) {
                                    node = chunkNodes_1[_a];
                                    if (state && state.isCancelled)
                                        break;
                                    matchStr = node.rawStr;
                                    isBlock = matchStr.includes('$$');
                                    cleanValue = node.value.trim();
                                    if (cleanValue.startsWith('$') && cleanValue.endsWith('$')) {
                                        cleanValue = cleanValue.substring(1, cleanValue.length - 1).trim();
                                    }
                                    latex = sanitizeLaTeX(cleanValue, isBlock);
                                    mathML = getMathML(latex, isBlock);
                                    if (!mathML)
                                        continue;
                                    try {
                                        if (matchStr.length <= 250) {
                                            safeSearchStr = matchStr.replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                                            searchResults = docRange.search(safeSearchStr, { matchWildcards: false, matchCase: true });
                                            searchResults.load("items");
                                            searchTasks.push({ matchStr: matchStr, mathML: mathML, type: 'short', results: searchResults });
                                        }
                                        else {
                                            startStr = matchStr.substring(0, 50).replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                                            endStr = matchStr.substring(matchStr.length - 50).replace(/\^/g, "^^").replace(/\r\n|\r|\n/g, "^p").replace(/\x0B/g, "^l");
                                            startResults = docRange.search(startStr, { matchWildcards: false, matchCase: true });
                                            endResults = docRange.search(endStr, { matchWildcards: false, matchCase: true });
                                            startResults.load("items");
                                            endResults.load("items");
                                            searchTasks.push({ matchStr: matchStr, mathML: mathML, type: 'long', startResults: startResults, endResults: endResults });
                                        }
                                    }
                                    catch (err) {
                                        console.error("Lỗi khi tìm kiếm công thức:", matchStr, err);
                                    }
                                }
                                if (searchTasks.length === 0)
                                    return [3 /*break*/, 22];
                                // Phase 2: Bulk Sync 1 (Load all search items for this chunk)
                                return [4 /*yield*/, context.sync()];
                            case 3:
                                // Phase 2: Bulk Sync 1 (Load all search items for this chunk)
                                _c.sent();
                                _b = 0, searchTasks_1 = searchTasks;
                                _c.label = 4;
                            case 4:
                                if (!(_b < searchTasks_1.length)) return [3 /*break*/, 21];
                                task = searchTasks_1[_b];
                                if (state && state.isCancelled)
                                    return [3 /*break*/, 21];
                                _c.label = 5;
                            case 5:
                                _c.trys.push([5, 19, , 20]);
                                rangesToReplace = [];
                                if (!(task.type === 'short')) return [3 /*break*/, 6];
                                for (j = 0; j < task.results.items.length; j++) {
                                    rangesToReplace.push(task.results.items[j]);
                                }
                                return [3 /*break*/, 10];
                            case 6:
                                minLength = Math.min(task.startResults.items.length, task.endResults.items.length);
                                j = 0;
                                _c.label = 7;
                            case 7:
                                if (!(j < minLength)) return [3 /*break*/, 10];
                                fullRange = task.startResults.items[j].expandTo(task.endResults.items[j]);
                                fullRange.load("text");
                                return [4 /*yield*/, context.sync()];
                            case 8:
                                _c.sent();
                                if (fullRange.text.trim() === task.matchStr.trim()) {
                                    rangesToReplace.push(fullRange);
                                }
                                _c.label = 9;
                            case 9:
                                j++;
                                return [3 /*break*/, 7];
                            case 10:
                                INSERT_CHUNK_SIZE = 10;
                                currentChunkCount = 0;
                                j = rangesToReplace.length - 1;
                                _c.label = 11;
                            case 11:
                                if (!(j >= 0)) return [3 /*break*/, 15];
                                if (state && state.isCancelled)
                                    return [3 /*break*/, 15];
                                wrappedMathML = "<html><body>".concat(task.mathML, "</body></html>");
                                rangesToReplace[j].insertHtml(wrappedMathML, Word.InsertLocation.replace);
                                currentChunkCount++;
                                if (!(currentChunkCount >= INSERT_CHUNK_SIZE)) return [3 /*break*/, 14];
                                return [4 /*yield*/, context.sync()];
                            case 12:
                                _c.sent();
                                currentChunkCount = 0;
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10); })];
                            case 13:
                                _c.sent();
                                _c.label = 14;
                            case 14:
                                j--;
                                return [3 /*break*/, 11];
                            case 15:
                                if (!(currentChunkCount > 0)) return [3 /*break*/, 18];
                                return [4 /*yield*/, context.sync()];
                            case 16:
                                _c.sent();
                                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 10); })];
                            case 17:
                                _c.sent();
                                _c.label = 18;
                            case 18: return [3 /*break*/, 20];
                            case 19:
                                err_1 = _c.sent();
                                console.error("Lỗi khi chuẩn bị chèn công thức:", task.matchStr, err_1);
                                return [3 /*break*/, 20];
                            case 20:
                                _b++;
                                return [3 /*break*/, 4];
                            case 21:
                                processedActualFormulas += chunkNodes.length;
                                if (state && state.onProgress) {
                                    state.onProgress(totalActualFormulas - processedActualFormulas, totalActualFormulas);
                                }
                                _c.label = 22;
                            case 22:
                                i += BATCH_SIZE;
                                return [3 /*break*/, 2];
                            case 23: return [2 /*return*/];
                        }
                    });
                }); })];
        });
    });
}
