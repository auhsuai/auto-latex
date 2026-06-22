import { renderInlineMathPreview } from "../utils/parser";

export class QuoteManager {
    public currentQuotedText: string = "";
    public isQuoteFromWord: boolean = false;
    public quotedMsgType: 'user' | 'ai' | null = null;
    public quotedMsgId: string | null = null;
    public currentTaskpaneSelection: string = "";
    public currentTaskpaneSelectionType: 'user' | 'ai' | null = null;
    public currentTaskpaneSelectionMsgId: string | null = null;
    private taskpaneSelectionTimer: any = null;
    private debounceSelectionTimer: any = null;

    private selectionPrompt: HTMLElement | null;
    private btnQuoteSelection: HTMLElement | null;
    private quotedContext: HTMLElement | null;
    private quotedTextEl: HTMLElement | null;
    private btnRemoveQuote: HTMLElement | null;
    private btnAttachContext: HTMLElement | null;
    private chatInput: HTMLTextAreaElement | null;

    constructor() {
        this.selectionPrompt = document.getElementById("selection-prompt");
        this.btnQuoteSelection = document.getElementById("btn-quote-selection");
        this.quotedContext = document.getElementById("quoted-context");
        this.quotedTextEl = document.getElementById("quoted-text");
        this.btnRemoveQuote = document.getElementById("btn-remove-quote");
        this.btnAttachContext = document.getElementById("btn-attach-context");
        this.chatInput = document.getElementById("chat-input") as HTMLTextAreaElement;
    }

    public init() {
        document.addEventListener("selectionchange", () => {
            if (this.taskpaneSelectionTimer) clearTimeout(this.taskpaneSelectionTimer);
            this.hideSelectionPrompt(); // Hide immediately while dragging

            this.taskpaneSelectionTimer = setTimeout(() => {
                const selection = window.getSelection();
                const text = this.extractTextFromSelection(selection).trim();
                if (text && text.length > 0 && selection && selection.rangeCount > 0) {
                    this.currentTaskpaneSelection = text;
                    const rect = selection.getRangeAt(0).getBoundingClientRect();
                    
                    const targetNode = selection.anchorNode;
                    const chatMsg = targetNode?.parentElement ? targetNode.parentElement.closest('.chat-msg') : null;
                    if (chatMsg) {
                        this.currentTaskpaneSelectionType = chatMsg.classList.contains('user-msg') ? 'user' : 'ai';
                        this.currentTaskpaneSelectionMsgId = chatMsg.id || null;
                    } else {
                        this.currentTaskpaneSelectionType = null;
                        this.currentTaskpaneSelectionMsgId = null;
                    }
                    
                    this.showSelectionPrompt(rect);
                } else {
                    this.hideSelectionPrompt();
                }
            }, 300);
        });

        Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, this.onSelectionChanged.bind(this));

        // Prevent losing selection when clicking the buttons
        this.btnQuoteSelection?.addEventListener("mousedown", (e) => e.preventDefault());
        this.btnAttachContext?.addEventListener("mousedown", (e) => e.preventDefault());

        this.btnQuoteSelection?.addEventListener("click", this.applyQuote.bind(this));
        this.btnAttachContext?.addEventListener("click", this.applyQuote.bind(this));

        this.btnRemoveQuote?.addEventListener("click", () => {
            this.clearQuote();
        });
    }

    private showSelectionPrompt(rect?: DOMRect) {
        if (this.selectionPrompt) {
            this.selectionPrompt.style.display = "flex";
            if (rect) {
                this.selectionPrompt.style.position = "fixed";
                let topPos = rect.top - 8;
                let transformStr = "translate(-50%, -100%)";
                if (topPos < 40) {
                    topPos = rect.bottom + 8;
                    transformStr = "translate(-50%, 0)";
                }
                this.selectionPrompt.style.top = topPos + "px";
                this.selectionPrompt.style.left = (rect.left + rect.width / 2) + "px";
                this.selectionPrompt.style.transform = transformStr;
            } else {
                this.selectionPrompt.style.position = "absolute";
                this.selectionPrompt.style.top = "-46px";
                this.selectionPrompt.style.left = "50%";
                this.selectionPrompt.style.transform = "translateX(-50%)";
            }
        }
    }

    private hideSelectionPrompt() {
        if (this.selectionPrompt) {
            this.selectionPrompt.style.display = "none";
        }
    }

    private onSelectionChanged() {
        if (this.debounceSelectionTimer) clearTimeout(this.debounceSelectionTimer);
        this.hideSelectionPrompt();
        this.debounceSelectionTimer = setTimeout(() => {
            Office.context.document.getSelectedDataAsync(Office.CoercionType.Ooxml, (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const ooxmlString = result.value as string;
                    const cleanText = this.extractTextFromOoxml(ooxmlString);
                    if (cleanText && cleanText.length > 0) {
                        this.currentTaskpaneSelection = ""; 
                        this.showSelectionPrompt();
                    } else {
                        this.hideSelectionPrompt();
                    }
                } else {
                    this.hideSelectionPrompt();
                }
            });
        }, 300);
    }

    private async applyQuote() {
        try {
            let textToQuote = this.currentTaskpaneSelection;
            this.isQuoteFromWord = false;

            if (!textToQuote) {
                await Word.run(async (context) => {
                    const selection = context.document.getSelection();
                    const ooxmlData = selection.getOoxml();
                    await context.sync();
                    
                    const ooxmlString = ooxmlData.value;
                    textToQuote = this.extractTextFromOoxml(ooxmlString);
                    
                    if (textToQuote) this.isQuoteFromWord = true;
                });
            }

            if (textToQuote) {
                this.currentQuotedText = textToQuote;
                this.quotedMsgType = this.isQuoteFromWord ? null : this.currentTaskpaneSelectionType;
                this.quotedMsgId = this.isQuoteFromWord ? null : this.currentTaskpaneSelectionMsgId;
                
                if (this.quotedTextEl) {
                    const displayQuote = this.currentQuotedText.replace(/[\r\n]+/g, " ");
                    this.quotedTextEl.innerHTML = renderInlineMathPreview(displayQuote);
                }
                if (this.quotedContext) this.quotedContext.style.display = "flex";
                if (this.selectionPrompt) this.selectionPrompt.style.display = "none";
                if (this.chatInput) this.chatInput.focus();
                this.currentTaskpaneSelection = ""; // reset
            }
        } catch (error) {
            console.error(error);
        }
    }

    private extractTextFromSelection(selection: Selection | null): string {
        if (!selection || selection.rangeCount === 0) return "";
        
        let plainText = selection.toString();
        if (!plainText.trim()) return "";

        try {
            const range = selection.getRangeAt(0);
            const fragment = range.cloneContents();
            const container = document.createElement("div");
            container.appendChild(fragment);
            
            const formulas = container.querySelectorAll('.clickable-formula');
            formulas.forEach(f => {
                const latex = f.getAttribute('data-latex');
                if (latex) {
                    try {
                        const decoded = decodeURIComponent(latex);
                        f.textContent = ` $${decoded}$ `;
                    } catch (e) {}
                }
            });
            
            let isInsideFormula = false;
            let currentFormulaData = "";
            let node = selection.anchorNode;
            while (node && node !== document.body) {
                if (node.nodeType === 1 && (node as Element).classList.contains('clickable-formula')) {
                    isInsideFormula = true;
                    currentFormulaData = (node as Element).getAttribute('data-latex') || "";
                    break;
                }
                node = node.parentNode;
            }

            if (isInsideFormula && formulas.length === 0) {
                try {
                    return ` $${decodeURIComponent(currentFormulaData)}$ `;
                } catch(e) {}
            }

            let extracted = container.textContent || "";
            return extracted.trim() ? extracted : plainText;
        } catch (e) {
            console.error("Error extracting text from selection:", e);
            return plainText;
        }
    }

    private extractTextFromOoxml(rawData: string): string {
        try {
            const domParser = new DOMParser();
            const xmlDoc = domParser.parseFromString(rawData, "text/xml");
            
            const paragraphs = xmlDoc.getElementsByTagNameNS("*", "p");
            let resultText = "";

            const getFirstChild = (node: Element, localName: string): Element | null => {
                for (let i = 0; i < node.children.length; i++) {
                    if (node.children[i].localName === localName) return node.children[i];
                }
                return null;
            };

            const parseOmmlToLatex = (node: Element): string => {
                let latex = "";
                for (let i = 0; i < node.childNodes.length; i++) {
                    const child = node.childNodes[i] as Element;
                    if (child.nodeType !== 1) continue; // Only process ELEMENT_NODE

                    switch (child.localName) {
                        case "f": // Fraction
                            const num = getFirstChild(child, "num");
                            const den = getFirstChild(child, "den");
                            latex += `\\frac{${num ? parseOmmlToLatex(num) : ""}}{${den ? parseOmmlToLatex(den) : ""}}`;
                            break;
                        case "rad": // Radical / Square Root
                            const pr = getFirstChild(child, "radPr");
                            let degStr = "";
                            if (pr) {
                                const degNode = getFirstChild(pr, "deg");
                                if (degNode) degStr = parseOmmlToLatex(degNode);
                            }
                            const eNode = getFirstChild(child, "e");
                            const innerRad = eNode ? parseOmmlToLatex(eNode) : "";
                            if (degStr && degStr.trim() !== "" && degStr !== "2") {
                                latex += `\\sqrt[${degStr}]{${innerRad}}`;
                            } else {
                                latex += `\\sqrt{${innerRad}}`;
                            }
                            break;
                        case "sSup": // Superscript
                            const supBase = getFirstChild(child, "e");
                            const sup = getFirstChild(child, "sup");
                            latex += `${supBase ? parseOmmlToLatex(supBase) : ""}^{${sup ? parseOmmlToLatex(sup) : ""}}`;
                            break;
                        case "sSub": // Subscript
                            const subBase = getFirstChild(child, "e");
                            const sub = getFirstChild(child, "sub");
                            let subBaseText = subBase ? parseOmmlToLatex(subBase) : "";
                            let subBaseTrim = subBaseText.trim();
                            if (["lim", "max", "min", "sup", "inf", "det"].includes(subBaseTrim)) subBaseText = "\\" + subBaseTrim;
                            latex += `${subBaseText}_{${sub ? parseOmmlToLatex(sub) : ""}}`;
                            break;
                        case "sSubSup": // Subscript & Superscript
                            const subSupBase = getFirstChild(child, "e");
                            const sSub = getFirstChild(child, "sub");
                            const sSup = getFirstChild(child, "sup");
                            latex += `${subSupBase ? parseOmmlToLatex(subSupBase) : ""}_{${sSub ? parseOmmlToLatex(sSub) : ""}}^{${sSup ? parseOmmlToLatex(sSup) : ""}}`;
                            break;
                        case "d": // Delimiters / Brackets
                            const dPr = getFirstChild(child, "dPr");
                            let begCh = "(";
                            let endCh = ")";
                            if (dPr) {
                                const beg = getFirstChild(dPr, "begCh");
                                if (beg && beg.getAttribute("m:val")) begCh = beg.getAttribute("m:val") as string;
                                const end = getFirstChild(dPr, "endCh");
                                if (end && end.getAttribute("m:val")) endCh = end.getAttribute("m:val") as string;
                            }
                            const dE = getFirstChild(child, "e");
                            // Loại bỏ \left và \right vì trong OMML 1 thẻ d có thể bao quanh nhiều biểu thức nhỏ,
                            // việc ép dùng \left \right sẽ gây ra lỗi lệch cặp ngoặc (bracket mismatch) trong LaTeX
                            latex += `${begCh}${dE ? parseOmmlToLatex(dE) : ""}${endCh}`;
                            break;
                        case "nary": // N-ary operator (Sum, Integral, etc.)
                            const naryPr = getFirstChild(child, "naryPr");
                            let opStr = "\\int"; // Default OMML nAry is integral
                            if (naryPr) {
                                const chr = getFirstChild(naryPr, "chr");
                                if (chr && chr.getAttribute("m:val")) {
                                    const val = chr.getAttribute("m:val");
                                    if (val === "∑") opStr = "\\sum";
                                    else if (val === "∏") opStr = "\\prod";
                                    else if (val === "∪") opStr = "\\bigcup";
                                    else if (val === "∩") opStr = "\\bigcap";
                                    else if (val === "∫") opStr = "\\int";
                                    else if (val === "∬") opStr = "\\iint";
                                    else if (val === "∭") opStr = "\\iiint";
                                    else if (val === "∮") opStr = "\\oint";
                                    else if (val === "∯") opStr = "\\oiint";
                                    else if (val === "∰") opStr = "\\oiiint";
                                }
                            }
                            const nArySub = getFirstChild(child, "sub");
                            const nArySup = getFirstChild(child, "sup");
                            const nAryE = getFirstChild(child, "e");
                            
                            latex += opStr;
                            if (nArySub) latex += `_{${parseOmmlToLatex(nArySub)}}`;
                            if (nArySup) latex += `^{${parseOmmlToLatex(nArySup)}}`;
                            if (nAryE) latex += ` ${parseOmmlToLatex(nAryE)}`;
                            break;
                        case "limLow": // Limit (lower bound)
                            const limLowE = getFirstChild(child, "e");
                            const limLowLim = getFirstChild(child, "lim");
                            let baseLow = limLowE ? parseOmmlToLatex(limLowE) : "";
                            let baseLowTrim = baseLow.trim();
                            if (["lim", "max", "min", "sup", "inf", "det"].includes(baseLowTrim)) baseLow = "\\" + baseLowTrim;
                            else if (/^[a-zA-Z]+$/.test(baseLowTrim)) baseLow = `\\mathop{\\mathrm{${baseLowTrim}}}`;
                            latex += `${baseLow}_{${limLowLim ? parseOmmlToLatex(limLowLim) : ""}}`;
                            break;
                        case "limUpp": // Limit (upper bound)
                            const limUppE = getFirstChild(child, "e");
                            const limUppLim = getFirstChild(child, "lim");
                            let baseUpp = limUppE ? parseOmmlToLatex(limUppE) : "";
                            let baseUppTrim = baseUpp.trim();
                            if (/^[a-zA-Z]+$/.test(baseUppTrim)) baseUpp = `\\mathop{\\mathrm{${baseUppTrim}}}`;
                            latex += `${baseUpp}^{${limUppLim ? parseOmmlToLatex(limUppLim) : ""}}`;
                            break;
                        case "m": // Matrix
                            let rows: string[] = [];
                            for (let j = 0; j < child.childNodes.length; j++) {
                                const mr = child.childNodes[j] as Element;
                                if (mr.nodeType === 1 && mr.localName === "mr") {
                                    let cols: string[] = [];
                                    for (let k = 0; k < mr.childNodes.length; k++) {
                                        const eNode = mr.childNodes[k] as Element;
                                        if (eNode.nodeType === 1 && eNode.localName === "e") {
                                            cols.push(parseOmmlToLatex(eNode));
                                        }
                                    }
                                    rows.push(cols.join(" & "));
                                }
                            }
                            latex += `\\begin{matrix} ${rows.join(" \\\\ ")} \\end{matrix}`;
                            break;
                        case "eqArr": // Equation Array
                            let eqLines: string[] = [];
                            for (let j = 0; j < child.childNodes.length; j++) {
                                const eNode = child.childNodes[j] as Element;
                                if (eNode.nodeType === 1 && eNode.localName === "e") {
                                    eqLines.push(parseOmmlToLatex(eNode));
                                }
                            }
                            latex += `\\begin{matrix} ${eqLines.join(" \\\\ ")} \\end{matrix}`;
                            break;
                        case "acc": // Accent
                            const accPr = getFirstChild(child, "accPr");
                            let accChr = "\\hat";
                            if (accPr) {
                                const chr = getFirstChild(accPr, "chr");
                                if (chr && chr.getAttribute("m:val")) {
                                    const val = chr.getAttribute("m:val");
                                    if (val === "⃗" || val === "→" || val === "➔") accChr = "\\vec";
                                    else if (val === "̃" || val === "~") accChr = "\\tilde";
                                    else if (val === "̄" || val === "−" || val === "-") accChr = "\\bar";
                                    else if (val === "̇" || val === ".") accChr = "\\dot";
                                    else if (val === "̈" || val === "..") accChr = "\\ddot";
                                }
                            }
                            const accE = getFirstChild(child, "e");
                            latex += `${accChr}{${accE ? parseOmmlToLatex(accE) : ""}}`;
                            break;
                        case "bar": // Bar over/under
                            const barPr = getFirstChild(child, "barPr");
                            let isTop = true;
                            if (barPr) {
                                const pos = getFirstChild(barPr, "pos");
                                if (pos && pos.getAttribute("m:val") === "bot") isTop = false;
                            }
                            const barE = getFirstChild(child, "e");
                            latex += isTop ? `\\overline{${barE ? parseOmmlToLatex(barE) : ""}}` : `\\underline{${barE ? parseOmmlToLatex(barE) : ""}}`;
                            break;
                        case "groupChr": // Underbrace/Overbrace
                            const groupPr = getFirstChild(child, "groupChrPr");
                            let groupCmd = "\\underbrace";
                            if (groupPr) {
                                const chr = getFirstChild(groupPr, "chr");
                                if (chr && chr.getAttribute("m:val") === "⏞") groupCmd = "\\overbrace";
                            }
                            const groupE = getFirstChild(child, "e");
                            latex += `${groupCmd}{${groupE ? parseOmmlToLatex(groupE) : ""}}`;
                            break;
                        case "func": // Function application (sin, cos)
                            const fNameNode = getFirstChild(child, "fName");
                            const funcE = getFirstChild(child, "e");
                            let fNameText = fNameNode ? parseOmmlToLatex(fNameNode) : "";
                            fNameText = fNameText.replace(/[\u2061]/g, "").trim(); // Remove invisible function application char
                            
                            if (["sin", "cos", "tan", "csc", "sec", "cot", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "log", "ln", "exp", "det"].includes(fNameText) ||
                                /^(?:\\)?(?:lim|max|min|sup|inf)(?:$|[^a-zA-Z])/.test(fNameText)) {
                                if (!fNameText.startsWith("\\")) {
                                    fNameText = "\\" + fNameText;
                                }
                            } else if (fNameText) {
                                fNameText = `\\mathrm{${fNameText}}`;
                            }
                            latex += `${fNameText} ${funcE ? parseOmmlToLatex(funcE) : ""}`;
                            break;
                        case "t": // Plain Text inside math
                            latex += child.textContent || "";
                            break;
                        default:
                            latex += parseOmmlToLatex(child);
                            break;
                    }
                }
                return latex;
            };

            for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i];
                let paragraphContent = "";
                
                const traverseXmlTree = (currentNode: Element) => {
                    // Xử lý Công thức Toán học (OMML)
                    if (currentNode.localName === "oMath" || currentNode.localName === "oMathPara") {
                        const mathLatex = parseOmmlToLatex(currentNode);
                        if (mathLatex.trim()) {
                            // Wrap with inline math delimiters for AI to recognize
                            paragraphContent += ` $${mathLatex}$ `;
                        } else {
                            paragraphContent += "[Equation]";
                        }
                        return;
                    }
                    
                    if (currentNode.localName === "t") {
                        paragraphContent += currentNode.textContent || "";
                        return;
                    }

                    for (let k = 0; k < currentNode.children.length; k++) {
                        traverseXmlTree(currentNode.children[k]);
                    }
                };

                for (let k = 0; k < paragraph.children.length; k++) {
                    traverseXmlTree(paragraph.children[k]);
                }

                if (paragraphContent) {
                    resultText += paragraphContent + "\n";
                }
            }

            return resultText.trim();
        } catch (error) {
            console.error("Error parsing OOXML:", error);
            return "";
        }
    }

    public clearQuote() {
        this.currentQuotedText = "";
        this.isQuoteFromWord = false;
        if (this.quotedContext) this.quotedContext.style.display = "none";
    }
}
