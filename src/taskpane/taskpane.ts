/* global document, Office, Word */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const appBody = document.getElementById("app-body");
    if (appBody) {
        appBody.style.display = "block";
    }
    const convertDocBtn = document.getElementById("convert-doc");
    if (convertDocBtn) {
        convertDocBtn.onclick = async () => {
            const { runConversion } = await import("../shared/converter");
            runConversion(false);
        };
    }
    const convertSelBtn = document.getElementById("convert-sel");
    if (convertSelBtn) {
        convertSelBtn.onclick = async () => {
            const { runConversion } = await import("../shared/converter");
            runConversion(true);
        };
    }
  }
});
