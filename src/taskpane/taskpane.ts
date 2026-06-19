/* global document, Office, Word */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const appBody = document.getElementById("app-body");
    if (appBody) {
        appBody.style.display = "block";
    }

    const cancelMsg = document.getElementById("cancel-msg");
    const cancelLink = document.getElementById("cancel-link");

    const handleConversion = async (btn: HTMLButtonElement, isSelection: boolean) => {
        const originalText = btn.innerText;
        const state = { isCancelled: false };
        let timeoutId: any = null;

        try {
            btn.disabled = true;
            btn.innerText = "Converting...";

            if (cancelMsg && cancelLink) {
                // Set 30s timeout to show the cancel message
                timeoutId = setTimeout(() => {
                    cancelMsg.style.display = "block";
                }, 30000);

                cancelLink.onclick = (e) => {
                    e.preventDefault();
                    state.isCancelled = true;
                    btn.innerText = "Cancelling...";
                    cancelMsg.style.display = "none";
                };
            }

            const { runConversion } = await import("../shared/converter");
            await runConversion(isSelection, state);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
            if (cancelMsg) cancelMsg.style.display = "none";
            btn.disabled = false;
            btn.innerText = originalText;
        }
    };

    const convertDocBtn = document.getElementById("convert-doc") as HTMLButtonElement;
    if (convertDocBtn) {
        convertDocBtn.onclick = () => handleConversion(convertDocBtn, false);
    }
    const convertSelBtn = document.getElementById("convert-sel") as HTMLButtonElement;
    if (convertSelBtn) {
        convertSelBtn.onclick = () => handleConversion(convertSelBtn, true);
    }
  }
});
