export const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

export const scrollToBottom = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
};

export const trapFocus = (element: HTMLElement) => {
    const focusableEls = element.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (focusableEls.length === 0) return () => {};
    
    const firstFocusableEl = focusableEls[0] as HTMLElement;  
    const lastFocusableEl = focusableEls[focusableEls.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) { // shift + tab
            if (document.activeElement === firstFocusableEl) {
                lastFocusableEl.focus();
                e.preventDefault();
            }
        } else { // tab
            if (document.activeElement === lastFocusableEl) {
                firstFocusableEl.focus();
                e.preventDefault();
            }
        }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstFocusableEl.focus();

    return () => {
        element.removeEventListener('keydown', handleKeyDown);
    };
};
