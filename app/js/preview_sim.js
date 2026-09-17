/**
 * LucyEditor - Interactive Live Visual Novel Preview Simulator
 * Powered by NekoNovelInterpreter for 100% accurate scene reconstruction:
 * - Scans from cursor line upward to accurately detect active/cleared sprites
 * - Renders multiple characters simultaneously (Lucy, Dr. Baek, etc.)
 * - Accurately processes character removal ('지우기', 'clear', 'clear_all')
 * - Real-time sync with editor cursor position
 * - Launches full 1280x720 interactive scene player
 */

class LucyPreviewSimulator {
    constructor() {
        this.currentContent = "";
        this.lines = [];
        this.steps = [];
        this.currentIndex = 0;
        this.currentLine = 1;
        this.syncWithEditor = true;

        this.bgEl = null;
        this.spritesContainerEl = null;
        this.textboxEl = null;
        this.nameBadgeEl = null;
        this.dialogueTextEl = null;
        this.stepCounterEl = null;
    }

    init() {
        this.bgEl = document.getElementById("sim-bg");
        this.spritesContainerEl = document.getElementById("sim-sprites-container");
        this.textboxEl = document.getElementById("sim-textbox");
        this.nameBadgeEl = document.getElementById("sim-speaker-name");
        this.dialogueTextEl = document.getElementById("sim-dialogue-text");
        this.stepCounterEl = document.getElementById("sim-step-counter");

        // Click on simulator screen to advance dialogue
        const screenEl = document.getElementById("sim-screen");
        if (screenEl) {
            screenEl.addEventListener("click", () => {
                this.nextStep(true);
            });
        }

        // Navigation controls
        const prevBtn = document.getElementById("btn-sim-prev");
        const nextBtn = document.getElementById("btn-sim-next");
        const syncBtn = document.getElementById("btn-sim-sync");
        const bigPreviewBtn = document.getElementById("btn-open-big-preview");

        if (prevBtn) prevBtn.addEventListener("click", () => this.prevStep(true));
        if (nextBtn) nextBtn.addEventListener("click", () => this.nextStep(true));
        if (syncBtn) {
            syncBtn.addEventListener("click", () => {
                this.syncWithEditor = !this.syncWithEditor;
                syncBtn.classList.toggle("active", this.syncWithEditor);
                const isRu = typeof currentLocale !== "undefined" && currentLocale === "ru";
                syncBtn.textContent = this.syncWithEditor 
                    ? (isRu ? "Синхрон: ВКЛ" : "Sync: ON")
                    : (isRu ? "Синхрон: ВЫКЛ" : "Sync: OFF");
            });
        }

        if (bigPreviewBtn) {
            bigPreviewBtn.addEventListener("click", () => {
                if (window.app && window.app.openBigPreview) {
                    window.app.openBigPreview();
                } else {
                    this.openBigPreview();
                }
            });
        }
    }

    /**
     * Parses the active script into timeline steps for navigation.
     */
    parseScript(content) {
        this.currentContent = content || "";
        this.lines = this.currentContent.split("\n");

        if (typeof NekoNovelInterpreter !== "undefined") {
            const lang = typeof currentLocale !== "undefined" ? currentLocale : "en";
            this.steps = NekoNovelInterpreter.parseTimelineSteps(this.lines, lang);
        } else {
            this.steps = [];
        }

        if (this.currentIndex >= this.steps.length) {
            this.currentIndex = Math.max(0, this.steps.length - 1);
        }

        // Render state at current line or active step
        if (this.steps.length > 0) {
            const step = this.steps[this.currentIndex];
            this.renderState(step);
        } else {
            this.syncToLine(this.currentLine || 1);
        }
    }

    /**
     * Synchronizes preview precisely to the editor's cursor line.
     * Analyzes all statements from line 1 up to targetLine to reconstruct scene state.
     */
    syncToLine(targetLine) {
        this.currentLine = targetLine;
        if (!this.syncWithEditor || !this.currentContent) return;

        const lang = typeof currentLocale !== "undefined" ? currentLocale : "en";
        if (typeof NekoNovelInterpreter !== "undefined") {
            const state = NekoNovelInterpreter.analyzeSceneAtLine(this.lines, targetLine, lang);
            
            // Find closest dialogue step for counter display
            let closestStepIdx = 0;
            for (let i = 0; i < this.steps.length; i++) {
                if (this.steps[i].lineNum <= targetLine) {
                    closestStepIdx = i;
                } else {
                    break;
                }
            }
            this.currentIndex = closestStepIdx;

            this.renderState(state);
        }
    }

    nextStep(jumpToCode = false) {
        if (this.steps.length === 0) return;
        if (this.currentIndex < this.steps.length - 1) {
            this.currentIndex++;
            const step = this.steps[this.currentIndex];
            this.syncToLine(step.lineNum);
            if (jumpToCode && typeof goToLine === "function") {
                goToLine(step.lineNum);
            }
        }
    }

    prevStep(jumpToCode = false) {
        if (this.steps.length === 0) return;
        if (this.currentIndex > 0) {
            this.currentIndex--;
            const step = this.steps[this.currentIndex];
            this.syncToLine(step.lineNum);
            if (jumpToCode && typeof goToLine === "function") {
                goToLine(step.lineNum);
            }
        }
    }

    /**
     * Renders a calculated scene state into the preview DOM elements.
     */
    renderState(state) {
        if (!state) return;

        function getAssetUrl(type, name) {
            if (window.lucyApi) {
                return `lucy-asset://${type.toLowerCase()}/${encodeURIComponent(name)}`;
            }
            return `/api/assets/file?type=${type}&name=${encodeURIComponent(name)}`;
        }

        // 1. Background image
        if (this.bgEl) {
            if (state.background) {
                this.bgEl.src = getAssetUrl("Images", state.background);
                this.bgEl.style.display = "block";
            } else {
                this.bgEl.src = getAssetUrl("Images", "bg_room01_day.jpg");
                this.bgEl.style.display = "block";
            }
        }

        // Dim overlay (black_background_40)
        const dimEl = document.getElementById("sim-dim");
        if (dimEl) {
            dimEl.classList.toggle("active", !!state.dimOverlay);
        }

        // 2. Character sprites (Full 1280x720 overlays with smooth 1.0s transitions)
        if (this.spritesContainerEl) {
            const charList = state.charList || Object.values(state.characters || {});
            const targetIds = new Set(charList.map(c => c.id));

            // Smoothly fade out deleted sprites
            const existing = Array.from(this.spritesContainerEl.querySelectorAll(".sim-char-sprite"));
            for (const el of existing) {
                const cid = el.getAttribute("data-char-id");
                if (!targetIds.has(cid)) {
                    el.style.opacity = "0";
                    setTimeout(() => {
                        if (el.parentNode && el.style.opacity === "0") el.remove();
                    }, 1000);
                }
            }

            // Add or update sprites
            for (const char of charList) {
                let el = this.spritesContainerEl.querySelector(`[data-char-id="${char.id}"]`);
                const src = getAssetUrl("Images", char.sprite);
                if (!el) {
                    el = document.createElement("img");
                    el.className = "sim-char-sprite";
                    el.setAttribute("data-char-id", char.id);
                    el.src = src;
                    el.alt = char.id;
                    el.style.opacity = "0";
                    el.style.transition = "opacity 1.0s ease-in-out";
                    this.spritesContainerEl.appendChild(el);
                    void el.offsetWidth;
                    el.style.opacity = "1";
                } else {
                    el.style.opacity = "1";
                    if (el.getAttribute("src") !== src) {
                        el.src = src;
                    }
                }
            }
        }

        // 3. Textbox visibility
        if (this.textboxEl) {
            this.textboxEl.style.display = state.textboxVisible ? "block" : "none";
        }

        // 4. Speaker name badge
        if (this.nameBadgeEl) {
            if (state.speaker) {
                this.nameBadgeEl.textContent = state.speaker;
                this.nameBadgeEl.style.display = "inline-block";
            } else {
                this.nameBadgeEl.style.display = "none";
            }
        }

        // 5. Dialogue text
        if (this.dialogueTextEl) {
            if (state.dialogueText) {
                this.dialogueTextEl.innerHTML = state.dialogueText.replace(/\n/g, "<br>");
            } else {
                const isRu = typeof currentLocale !== "undefined" && currentLocale === "ru";
                this.dialogueTextEl.innerHTML = `<i>${isRu ? "..." : "..."}</i>`;
            }
        }

        // 6. Step counter badge
        if (this.stepCounterEl) {
            const isRu = typeof currentLocale !== "undefined" && currentLocale === "ru";
            if (this.steps.length > 0) {
                this.stepCounterEl.textContent = isRu 
                    ? `Реплика ${this.currentIndex + 1} из ${this.steps.length} (стр ${state.lineNum})`
                    : `Line ${this.currentIndex + 1} of ${this.steps.length} (line ${state.lineNum})`;
            } else {
                this.stepCounterEl.textContent = isRu
                    ? `Стр ${state.lineNum}`
                    : `Line ${state.lineNum}`;
            }
        }
    }

    /**
     * Launches the full 1280x720 interactive scene player window.
     */
    async openBigPreview() {
        if (window.lucyApi && window.lucyApi.openBigPreview) {
            await window.lucyApi.openBigPreview();
            
            // Send current script content and cursor line immediately
            if (window.lucyApi.sendSyncPreview) {
                window.lucyApi.sendSyncPreview({
                    scriptName: window.lucyApp ? window.lucyApp.activeTabName : "script.txt",
                    content: this.currentContent,
                    line: this.currentLine || 1
                });
            }
        } else {
            if (typeof showToast === "function") {
                showToast("Big Preview is supported in LucyEditor Electron desktop app.", "info");
            }
        }
    }
}

const previewSimulator = new LucyPreviewSimulator();
