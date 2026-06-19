/* global document, Office, Word */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const appBody = document.getElementById("app-body");
    if (appBody) {
        appBody.style.display = "block";
    }
    const convertDocBtn = document.getElementById("convert-doc") as HTMLButtonElement;
    if (convertDocBtn) {
        convertDocBtn.onclick = async () => {
            const originalText = convertDocBtn.innerText;
            try {
                convertDocBtn.disabled = true;
                convertDocBtn.innerText = "Converting...";
                const { runConversion } = await import("../shared/converter");
                await runConversion(false);
            } finally {
                convertDocBtn.disabled = false;
                convertDocBtn.innerText = originalText;
            }
        };
    }
    const convertSelBtn = document.getElementById("convert-sel") as HTMLButtonElement;
    if (convertSelBtn) {
        convertSelBtn.onclick = async () => {
            const originalText = convertSelBtn.innerText;
            try {
                convertSelBtn.disabled = true;
                convertSelBtn.innerText = "Converting...";
                const { runConversion } = await import("../shared/converter");
                await runConversion(true);
            } finally {
                convertSelBtn.disabled = false;
                convertSelBtn.innerText = originalText;
            }
        };
    }
  }
});
