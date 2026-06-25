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

        // Global keyboard shortcut for the Convert interface
        document.addEventListener('keydown', (e) => {
            // Check if we are in the main (Convert) view by checking if it's visible
            const mainView = document.getElementById("main-view");
            if (!mainView || mainView.classList.contains("view-hidden") || mainView.style.display === "none") {
                return; // Do nothing if in Chat or other views
            }

            // Ignore if typing in an input (just in case)
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Alt + C triggers Convert All
            if (e.altKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (convertDocBtn && !convertDocBtn.disabled) convertDocBtn.click();
            }
        });
    }

    private async handleConversion(btn: HTMLButtonElement, isSelection: boolean) {
        const originalHTML = btn.innerHTML;
        const otherBtnId = btn.id === "convert-doc" ? "convert-sel" : "convert-doc";
        const otherBtn = document.getElementById(otherBtnId) as HTMLButtonElement | null;
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
            if (otherBtn) otherBtn.disabled = true;
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

            // Success State (Button Checkmark Micro-interaction)
            if (!state.isCancelled) {
                const doneText = appLanguage === "vi" ? "Hoàn tất" : "Done";
                btn.innerHTML = `<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg><span>${doneText}</span>`;
                // Wait 1s before restoring
                await new Promise(r => setTimeout(r, 1000));
            }
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (this.cancelMsg) this.cancelMsg.style.display = "none";
            btn.disabled = false;
            if (otherBtn) otherBtn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
}
