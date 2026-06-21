export const escapeHtml = (unsafe: string) => {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

export const scrollToBottom = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
};
