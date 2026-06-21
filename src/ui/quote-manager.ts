export class QuoteManager {
    public currentQuotedText: string = "";
    public isQuoteFromWord: boolean = false;
    public currentTaskpaneSelection: string = "";
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
                const text = selection?.toString().trim();
                if (text && text.length > 0 && selection && selection.rangeCount > 0) {
                    this.currentTaskpaneSelection = text;
                    const rect = selection.getRangeAt(0).getBoundingClientRect();
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
            Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const text = (result.value as string).trim();
                    if (text && text.length > 0) {
                        this.currentTaskpaneSelection = ""; // clear taskpane selection if word is selected
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
                    context.load(selection, "text");
                    await context.sync();
                    textToQuote = selection.text.trim();
                    if (textToQuote) this.isQuoteFromWord = true;
                });
            }

            if (textToQuote) {
                this.currentQuotedText = textToQuote;
                if (this.quotedTextEl) {
                    const displayQuote = this.currentQuotedText.replace(/[\r\n]+/g, " ");
                    this.quotedTextEl.innerText = displayQuote.length > 50 ? displayQuote.substring(0, 50) + "..." : displayQuote;
                }
                if (this.quotedContext) this.quotedContext.style.display = "flex";
                if (this.selectionPrompt) this.selectionPrompt.style.display = "none";
                if (this.chatInput) this.chatInput.focus();
                this.currentTaskpaneSelection = ""; // reset
            }
        } catch (e) {
            console.error(e);
        }
    }

    public clearQuote() {
        this.currentQuotedText = "";
        this.isQuoteFromWord = false;
        if (this.quotedContext) this.quotedContext.style.display = "none";
    }
}
