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

            if (e.altKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                if (convertDocBtn && !convertDocBtn.disabled) convertDocBtn.click();
            }
        });

        // Initialize Custom Macros from LocalStorage
        const customMacrosInput = document.getElementById("custom-macros-input") as HTMLTextAreaElement;
        const enableMacrosToggle = document.getElementById("enable-macros") as HTMLInputElement;

        if (customMacrosInput) {
            const savedMacros = localStorage.getItem("auto_latex_custom_macros");
            if (savedMacros !== null) {
                customMacrosInput.value = savedMacros;
            }
            if (enableMacrosToggle) {
                const savedEnable = localStorage.getItem("auto_latex_enable_macros");
                if (savedEnable !== null) {
                    enableMacrosToggle.checked = savedEnable === "true";
                }
                enableMacrosToggle.addEventListener("change", () => {
                    localStorage.setItem("auto_latex_enable_macros", enableMacrosToggle.checked.toString());
                });
            }
            
            // Handle Filter Toggles
            const filterInline = document.getElementById("filter-inline") as HTMLInputElement;
            const filterBlock = document.getElementById("filter-block") as HTMLInputElement;
            const filterNaked = document.getElementById("filter-naked") as HTMLInputElement;

            const setupFilterToggle = (el: HTMLInputElement | null, key: string) => {
                if (!el) return;
                const saved = localStorage.getItem(key);
                if (saved !== null) {
                    el.checked = saved === "true";
                }
                el.addEventListener("change", () => {
                    localStorage.setItem(key, el.checked.toString());
                });
            };

            setupFilterToggle(filterInline, "auto_latex_filter_inline");
            setupFilterToggle(filterBlock, "auto_latex_filter_block");
            setupFilterToggle(filterNaked, "auto_latex_filter_naked");

            const autoResize = () => {
                if (customMacrosInput.offsetWidth === 0) return; // Skip if hidden
                customMacrosInput.style.height = 'auto';
                customMacrosInput.style.height = customMacrosInput.scrollHeight + 'px';
            };
            customMacrosInput.addEventListener("input", () => {
                localStorage.setItem("auto_latex_custom_macros", customMacrosInput.value);
                autoResize();
            });
            
            const observer = new ResizeObserver(() => {
                window.requestAnimationFrame(() => {
                    autoResize();
                });
            });
            observer.observe(customMacrosInput);
            
            // Handle Copy Macros
            const btnCopyMacros = document.getElementById("btn-copy-macros");
            if (btnCopyMacros) {
                btnCopyMacros.addEventListener("click", () => {
                    if (customMacrosInput.value) {
                        navigator.clipboard.writeText(customMacrosInput.value).then(() => {
                            const originalSvg = btnCopyMacros.innerHTML;
                            // Checkmark SVG with app primary color
                            btnCopyMacros.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                            setTimeout(() => {
                                btnCopyMacros.innerHTML = originalSvg;
                            }, 2000);
                        });
                    }
                });
            }
            
            // Set initial height
            setTimeout(autoResize, 0);
        }
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

            const filterInline = document.getElementById("filter-inline") as HTMLInputElement;
            const filterBlock = document.getElementById("filter-block") as HTMLInputElement;
            const filterNaked = document.getElementById("filter-naked") as HTMLInputElement;
            const customMacrosInput = document.getElementById("custom-macros-input") as HTMLTextAreaElement;
            const enableMacrosToggle = document.getElementById("enable-macros") as HTMLInputElement;

            const macrosEnabled = enableMacrosToggle ? enableMacrosToggle.checked : true;

            const options = {
                convertInline: filterInline ? filterInline.checked : true,
                convertBlock: filterBlock ? filterBlock.checked : true,
                convertNaked: filterNaked ? filterNaked.checked : true,
                forceDisplay: false,
                macrosString: (macrosEnabled && customMacrosInput) ? customMacrosInput.value : ""
            };

            const { runConversion } = await import("../core/converter");
            await runConversion(isSelection, state, options);

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
