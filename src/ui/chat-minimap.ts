export class ChatMinimapManager {
    private minimapContainer: HTMLElement | null = null;
    private observer: IntersectionObserver | null = null;
    private visibleElements = new Set<Element>();
    private tooltipEl: HTMLElement | null = null;
    private tooltipTimeout: number | null = null;

    private initTooltip() {
        if (this.tooltipEl) return;
        this.tooltipEl = document.createElement("div");
        this.tooltipEl.className = "minimap-custom-tooltip";
        this.tooltipEl.style.pointerEvents = "none"; // Ép buộc không chặn sự kiện
        document.body.appendChild(this.tooltipEl);
        
        // Ẩn tooltip ngay lập tức khi người dùng cuộn chuột (giống native tooltip)
        const hideTooltip = () => {
            if (this.tooltipEl) this.tooltipEl.classList.remove("visible");
        };
        window.addEventListener("wheel", hideTooltip, { passive: true });
        window.addEventListener("touchmove", hideTooltip, { passive: true });
    }

    constructor(
        private chatMessagesContainerId: string,
        private minimapContainerId: string
    ) {
        this.minimapContainer = document.getElementById(this.minimapContainerId);
        this.setupObserver();
        this.setupScrollObserver();
    }

    private setupScrollObserver() {
        if (!this.minimapContainer) return;
        
        const updateFades = () => {
            const el = this.minimapContainer!;
            const hasOverflow = el.scrollHeight > el.clientHeight;
            
            if (hasOverflow) {
                const canScrollUp = el.scrollTop > 0;
                // Thêm sai số 2px để tránh lỗi làm tròn
                const canScrollDown = Math.ceil(el.scrollTop + el.clientHeight) < el.scrollHeight - 2;
                el.style.setProperty('--mask-top', canScrollUp ? '0' : '1');
                el.style.setProperty('--mask-bottom', canScrollDown ? '0' : '1');
            } else {
                el.style.setProperty('--mask-top', '1');
                el.style.setProperty('--mask-bottom', '1');
            }
        };

        this.minimapContainer.addEventListener('scroll', updateFades);
        // Lắng nghe thêm sự kiện resize nếu cần
        window.addEventListener('resize', updateFades);
    }

    private setupObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.visibleElements.add(entry.target);
                } else {
                    this.visibleElements.delete(entry.target);
                }
            });

            // Find the most prominent turn (closest to center of viewport)
            const container = document.getElementById(this.chatMessagesContainerId);
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.top + containerRect.height / 2;

            let closestTurnId: string | null = null;
            let minDistance = Infinity;

            this.visibleElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const elCenter = rect.top + rect.height / 2;
                const distance = Math.abs(containerCenter - elCenter);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestTurnId = el.getAttribute('data-turn-id');
                }
            });

            document.querySelectorAll('.minimap-dash').forEach(dash => {
                if (closestTurnId && dash.getAttribute('data-turn-id') === closestTurnId) {
                    dash.classList.add("active");
                } else {
                    dash.classList.remove("active");
                }
            });
        }, {
            root: document.getElementById(this.chatMessagesContainerId),
            threshold: 0.05 // trigger even if only a small part of a long message is visible
        });
    }

    public update() {
        if (!this.minimapContainer) {
            this.minimapContainer = document.getElementById(this.minimapContainerId);
        }
        if (!this.minimapContainer) return;

        const chatContainer = document.getElementById(this.chatMessagesContainerId);
        if (!chatContainer) return;

        // Reset state
        this.minimapContainer.innerHTML = "";
        this.visibleElements.clear();
        
        if (this.observer) {
            this.observer.disconnect();
        }

        const allMessages = Array.from(chatContainer.querySelectorAll(".chat-msg"));
        let currentTurnId = "";
        let turnHasUser = false;

        allMessages.forEach((msg) => {
            if (msg.classList.contains("user-msg")) {
                currentTurnId = "turn-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
                turnHasUser = true;
                msg.setAttribute("data-turn-id", currentTurnId);

                // Create dash
                const dash = document.createElement("div");
                dash.className = "minimap-dash";
                dash.setAttribute("data-turn-id", currentTurnId);
                
                // Get user message text for tooltip
                let msgText = msg.textContent || "";
                msgText = msgText.trim();
                if (msgText.length > 30) {
                    msgText = msgText.substring(0, 27) + "...";
                }
                const displayMsgText = msgText || "Jump to this conversation part";

                dash.addEventListener("mouseenter", (e: MouseEvent) => {
                    this.tooltipTimeout = window.setTimeout(() => {
                        this.initTooltip();
                        this.tooltipEl!.textContent = displayMsgText;
                        
                        // Cần reset right trước khi lấy kích thước
                        this.tooltipEl!.style.right = 'auto';
                        
                        const tooltipHeight = this.tooltipEl!.offsetHeight;
                        const tooltipWidth = this.tooltipEl!.offsetWidth;
                        
                        let top = e.clientY + 15;
                        let left = e.clientX - tooltipWidth / 2;
                        
                        // Chống tràn lề phải
                        if (left + tooltipWidth > window.innerWidth) {
                            left = window.innerWidth - tooltipWidth - 10;
                        }
                        // Chống tràn lề trái
                        if (left < 10) {
                            left = 10;
                        }
                        // Chống tràn đáy
                        if (top + tooltipHeight > window.innerHeight) {
                            top = e.clientY - tooltipHeight - 15;
                        }
                        
                        this.tooltipEl!.style.top = `${top}px`;
                        this.tooltipEl!.style.left = `${left}px`;
                        
                        this.tooltipEl!.classList.add("visible");
                    }, 400);
                });

                dash.addEventListener("mouseleave", () => {
                    if (this.tooltipTimeout) window.clearTimeout(this.tooltipTimeout);
                    if (this.tooltipEl) {
                        this.tooltipEl.classList.remove("visible");
                    }
                });

                // Clear tooltip on click as well
                dash.addEventListener("click", () => {
                    if (this.tooltipTimeout) window.clearTimeout(this.tooltipTimeout);
                    if (this.tooltipEl) this.tooltipEl.classList.remove("visible");
                    msg.scrollIntoView({ behavior: "smooth", block: "start" });
                });

                this.minimapContainer!.appendChild(dash);

                if (this.observer) {
                    this.observer.observe(msg);
                }
            } else if (msg.classList.contains("ai-msg")) {
                // Only group AI messages that appear after a user message (ignore initial greeting)
                if (turnHasUser) {
                    msg.setAttribute("data-turn-id", currentTurnId);
                    if (this.observer) {
                        this.observer.observe(msg);
                    }
                }
            }
        });

        // Trigger scroll event to update fades
        setTimeout(() => {
            if (this.minimapContainer) {
                this.minimapContainer.dispatchEvent(new Event('scroll'));
            }
        }, 10);
    }
}
