export class WordSelectionTracker {
    public currentTaskpaneSelection: string = "";
    private debounceSelectionTimer: any = null;
    private taskpaneSelectionTimer: any = null;

    constructor(
        private showSelectionPrompt: (rect?: DOMRect) => void,
        private hideSelectionPrompt: () => void
    ) {}

    public init() {
        document.addEventListener("selectionchange", () => {
            if (this.taskpaneSelectionTimer) clearTimeout(this.taskpaneSelectionTimer);
            this.hideSelectionPrompt();

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

        Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, this.onWordSelectionChanged.bind(this));
    }

    private onWordSelectionChanged() {
        if (this.debounceSelectionTimer) clearTimeout(this.debounceSelectionTimer);
        this.hideSelectionPrompt();
        this.debounceSelectionTimer = setTimeout(() => {
            Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (result) => {
                if (result.status === Office.AsyncResultStatus.Succeeded) {
                    const text = (result.value as string).trim();
                    if (text && text.length > 0) {
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
}
