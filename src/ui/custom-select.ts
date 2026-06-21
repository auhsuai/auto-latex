export const updateCustomSelect = (wrapperId: string, value: string) => {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    const textSpan = wrapper.querySelector(".custom-select span");
    const options = wrapper.querySelectorAll(".custom-select-option");
    options.forEach(opt => {
        if (opt.getAttribute("data-val") === value) {
            opt.classList.add("selected");
            if (textSpan) textSpan.innerHTML = opt.innerHTML;
        } else {
            opt.classList.remove("selected");
        }
    });
};

export const initCustomSelect = (wrapperId: string, onChange: (val: string) => void) => {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    const display = wrapper.querySelector(".custom-select") as HTMLElement;
    const optionsDiv = wrapper.querySelector(".custom-select-options") as HTMLElement;
    const options = wrapper.querySelectorAll(".custom-select-option");

    display.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = optionsDiv.style.display === "block";
        document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
        document.querySelectorAll(".custom-select").forEach(el => el.classList.remove("active"));
        if (!isOpen) {
            optionsDiv.style.display = "block";
            display.classList.add("active");
        }
    });

    options.forEach(opt => {
        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            const val = opt.getAttribute("data-val");
            if (val) onChange(val);
            optionsDiv.style.display = "none";
            display.classList.remove("active");
            updateCustomSelect(wrapperId, val!);
        });
    });
};

export const setupCustomSelectDocumentClick = () => {
    document.addEventListener("click", () => {
        document.querySelectorAll(".custom-select-options").forEach(el => (el as HTMLElement).style.display = "none");
        document.querySelectorAll(".custom-select").forEach(el => el.classList.remove("active"));
    });
};
