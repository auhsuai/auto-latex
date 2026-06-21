import { translations } from "../utils/translations";

export class ConverterUIManager {
    private cancelMsg: HTMLElement | null;
    private cancelLink: HTMLElement | null;
    private progressSpan: HTMLElement | null;
    
    constructor(private getCurrentLanguage: () => string) {
        this.cancelMsg = document.getElementById("cancel-msg");
        this.cancelLink = document.getElementById("cancel-link");
        this.progressSpan = document.getElementById("progress-text");
    }

    public init() {
        const convertDocBtn = document.getElementById("convert-doc") as HTMLButtonElement;
        const convertSelBtn = document.getElementById("convert-sel") as HTMLButtonElement;

        if (convertDocBtn) {
            convertDocBtn.onclick = () => this.handleConversion(convertDocBtn, false);
        }
        if (convertSelBtn) {
            convertSelBtn.onclick = () => this.handleConversion(convertSelBtn, true);
        }
    }

    private async handleConversion(btn: HTMLButtonElement, isSelection: boolean) {
        const originalText = btn.innerText;
        let timeoutId: any = null;
        const appLanguage = this.getCurrentLanguage();

        const state = { 
            isCancelled: false,
            onProgress: (remaining: number, total: number) => {
                if (this.cancelMsg && this.progressSpan) {
                    const t = translations[appLanguage] || translations["en"];
                    if (total > 0 && remaining > 0) {
                        btn.innerText = t.convertingLeft.replace("{0}", remaining.toString());
                        this.progressSpan.innerText = t.soLong;
                    } else if (remaining === 0) {
                        this.cancelMsg.style.display = "none";
                        btn.innerText = t.finishing;
                    }
                }
            }
        };

        try {
            const t = translations[appLanguage] || translations["en"];
            btn.disabled = true;
            btn.innerText = t.converting;

            if (this.cancelMsg && this.cancelLink) {
                timeoutId = setTimeout(() => {
                    if (!state.isCancelled && (btn.innerText === t.converting || btn.innerText.includes("{0}") || btn.innerText.includes("Converting") || btn.innerText.includes("Đang chuyển"))) {
                        this.cancelMsg!.style.display = "block";
                    }
                }, 5000);

                this.cancelLink.onclick = (e) => {
                    e.preventDefault();
                    state.isCancelled = true;
                    btn.innerText = t.cancelling;
                    this.cancelMsg!.style.display = "none";
                };
            }

            const { runConversion } = await import("../core/converter");
            await runConversion(isSelection, state);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (this.cancelMsg) this.cancelMsg.style.display = "none";
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}
