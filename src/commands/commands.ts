/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global Office */

Office.onReady(() => {
  // If needed, Office.js is ready to be called.
});



/**
 * Executes full document conversion from the Ribbon button.
 * @param event
 */
async function convertDocGlobal(event: Office.AddinCommands.Event) {
  try {
    const { runConversion } = await import("../core/converter");
    
    // Read settings from LocalStorage
    const convertInline = localStorage.getItem("auto_latex_filter_inline") !== "false";
    const convertBlock = localStorage.getItem("auto_latex_filter_block") !== "false";
    const convertNaked = localStorage.getItem("auto_latex_filter_naked") !== "false";
    const macrosEnabled = localStorage.getItem("auto_latex_enable_macros") !== "false";
    const customMacros = localStorage.getItem("auto_latex_custom_macros") || "";

    const options = {
        convertInline,
        convertBlock,
        convertNaked,
        forceDisplay: false,
        macrosString: macrosEnabled ? customMacros : ""
    };

    await runConversion(false, undefined, options);
  } catch (error) {
    console.error("Lỗi khi chạy convertDocGlobal", error);
  } finally {
    // Show a notification message.
    if (Office.context.document) {
      // Notification for word document
      console.log("Conversion complete.");
    }
    // Indicate when the add-in command function is complete.
    event.completed();
  }
}

// Register the function with Office.

Office.actions.associate("convertDocGlobal", convertDocGlobal);
