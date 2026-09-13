/**
 * LucyEditor - Interactive Live Visual Novel Preview Simulator
 * Parses NekoNovel script flow and renders backgrounds, Lucy sprites, and dialogue boxes
 * with step-by-step playback and real-time synchronization with Monaco editor lines.
 */

class LucyPreviewSimulator {
    constructor() {
        this.steps = [];
        this.currentIndex = 0;
        this.syncWithEditor = true;

        this.bgEl = null;
        this.spriteEl = null;
        this.nameBadgeEl = null;
        this.dialogueTextEl = null;
        this.indicatorEl = null;
        this.stepCounterEl = null;
    }

    init() {
        this.bgEl = document.getElementById("sim-bg");
        this.spriteEl = document.getElementById("sim-sprite");
        this.nameBadgeEl = document.getElementById("sim-speaker-name");
        this.dialogueTextEl = document.getElementById("sim-dialogue-text");
        this.stepCounterEl = document.getElementById("sim-step-counter");

        // Click to advance
        const screenEl = document.getElementById("sim-screen");
        if (screenEl) {
            screenEl.addEventListener("click", () => {
                this.nextStep(true);
            });
        }

        // Attach buttons
        const prevBtn = document.getElementById("btn-sim-prev");
        const nextBtn = document.getElementById("btn-sim-next");
        const syncBtn = document.getElementById("btn-sim-sync");

        if (prevBtn) prevBtn.addEventListener("click", () => this.prevStep(true));
        if (nextBtn) nextBtn.addEventListener("click", () => this.nextStep(true));
        if (syncBtn) {
            syncBtn.addEventListener("click", () => {
                this.syncWithEditor = !this.syncWithEditor;
                syncBtn.classList.toggle("active", this.syncWithEditor);
                syncBtn.textContent = this.syncWithEditor ? "Синхрон: ВКЛ" : "Синхрон: ВЫКЛ";
            });
        }
    }

    /**
     * Parses the active script text into timeline steps.
     */
    parseScript(content) {
        const lines = content.split("\n");
        const steps = [];

        let currentBg = null;
        let currentSprite = null;
        let currentSpeaker = "";
        let accumulatedText = "";

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const line = rawLine.trim();
            const lineNum = i + 1;

            if (line.startsWith("//") || line.length === 0) continue;

            // Background change (Korean: 배경/CG, Visual: bg/cg)
            if (line.startsWith("배경 ") || /^bg\s+/i.test(line)) {
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    currentBg = parts[2];
                } else if (parts.length >= 2) {
                    currentBg = parts[1];
                }
            } else if (line.startsWith("CG ") || /^cg\s+/i.test(line)) {
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    const fname = parts[2];
                    if (fname.startsWith("bg_") || fname.startsWith("ev")) {
                        currentBg = fname;
                    } else if (fname.startsWith("l") || fname.startsWith("f") || fname.startsWith("d")) {
                        currentSprite = fname;
                    }
                }
            }

            // Character speaker name tag (Korean: 스크립트 이름.txt, Visual: call 이름.txt)
            if (line.startsWith("스크립트 이름.txt") || /^(?:call|script)\s+(?:이름\.txt|name\.txt)/i.test(line)) {
                const parts = line.split(/\s+/);
                if (parts.length >= 3) {
                    const tag = parts[2].toLowerCase();
                    const isRu = typeof currentLocale !== "undefined" && currentLocale === "ru";

                    if (tag === "주인공" || tag === "protagonist" || tag === "protagonist1") {
                        currentSpeaker = isRu ? "Главный герой" : "Protagonist";
                    } else if (tag === "루시" || tag === "lucy" || tag === "lucy1") {
                        currentSpeaker = isRu ? "Люси" : "Lucy";
                    } else if (tag === "기박사" || tag === "dr_baek" || tag === "doctor" || tag === "dr_baek1") {
                        currentSpeaker = isRu ? "Доктор Пэк" : "Dr. Baek";
                    } else if (tag === "가게주인" || tag === "shopkeeper") {
                        currentSpeaker = isRu ? "Хозяин магазина" : "Shopkeeper";
                    } else if (tag.startsWith("안드로이드") || tag.startsWith("android")) {
                        currentSpeaker = isRu ? "Андроид" : "Android";
                    } else if (tag === "아버지" || tag === "father") {
                        currentSpeaker = isRu ? "Отец" : "Father";
                    } else if (tag === "앤드류" || tag === "andrew") {
                        currentSpeaker = isRu ? "Эндрю" : "Andrew";
                    } else if (tag === "청년" || tag === "young_man") {
                        currentSpeaker = isRu ? "Молодой человек" : "Young Man";
                    } else if (tag === "이름지우기" || tag === "이름지우기대사창" || tag === "clear_name" || tag === "hide_name_and_box") {
                        currentSpeaker = "";
                    } else {
                        currentSpeaker = parts[2];
                    }
                }
            }

            // Dialogue line (Korean: 대사, Visual: dialogue / say)
            const diaMatch = line.match(/^(?:대사|dialogue|say)\s+(.*)$/i);
            const contMatch = line.match(/^(?:대사잇기|continue)\s+(.*)$/i);

            if (diaMatch) {
                let text = diaMatch[1].trim();
                // Strip surrounding quotes if present for cleaner preview
                if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
                    text = text.slice(1, -1);
                }
                accumulatedText = text;

                steps.push({
                    lineNum,
                    speaker: currentSpeaker,
                    text: accumulatedText,
                    bg: currentBg,
                    sprite: currentSprite
                });
            } else if (contMatch) {
                let text = contMatch[1].trim();
                if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
                    text = text.slice(1, -1);
                }
                accumulatedText += (accumulatedText ? "\n" : "") + text;

                steps.push({
                    lineNum,
                    speaker: currentSpeaker,
                    text: accumulatedText,
                    bg: currentBg,
                    sprite: currentSprite
                });
            } else if (line === "대사지우기" || /^clear_dialogue$/i.test(line)) {
                accumulatedText = "";
            }
        }

        this.steps = steps;
        if (this.currentIndex >= this.steps.length) {
            this.currentIndex = Math.max(0, this.steps.length - 1);
        }
        this.renderCurrentStep();
    }

    /**
     * Finds the closest step corresponding to the editor line number.
     */
    syncToLine(targetLine) {
        if (!this.syncWithEditor || this.steps.length === 0) return;

        let closestIdx = 0;
        for (let i = 0; i < this.steps.length; i++) {
            if (this.steps[i].lineNum <= targetLine) {
                closestIdx = i;
            } else {
                break;
            }
        }

        if (closestIdx !== this.currentIndex) {
            this.currentIndex = closestIdx;
            this.renderCurrentStep();
        }
    }

    nextStep(jumpToCode = false) {
        if (this.currentIndex < this.steps.length - 1) {
            this.currentIndex++;
            this.renderCurrentStep();
            if (jumpToCode && this.steps[this.currentIndex]) {
                goToLine(this.steps[this.currentIndex].lineNum);
            }
        }
    }

    prevStep(jumpToCode = false) {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentStep();
            if (jumpToCode && this.steps[this.currentIndex]) {
                goToLine(this.steps[this.currentIndex].lineNum);
            }
        }
    }

    renderCurrentStep() {
        if (this.steps.length === 0) {
            if (this.dialogueTextEl) this.dialogueTextEl.textContent = "Нет диалоговых реплик в текущем скрипте.";
            if (this.nameBadgeEl) this.nameBadgeEl.style.display = "none";
            if (this.stepCounterEl) this.stepCounterEl.textContent = "Реплик: 0";
            return;
        }

        const step = this.steps[this.currentIndex];

        // 1. Speaker name badge
        if (this.nameBadgeEl) {
            if (step.speaker) {
                this.nameBadgeEl.textContent = step.speaker;
                this.nameBadgeEl.style.display = "inline-block";
            } else {
                this.nameBadgeEl.style.display = "none";
            }
        }

        // 2. Dialogue text
        if (this.dialogueTextEl) {
            this.dialogueTextEl.innerHTML = step.text.replace(/\n/g, "<br>");
        }

        function getAssetUrl(type, name) {
            if (window.lucyApi) {
                return `lucy-asset://${type.toLowerCase()}/${encodeURIComponent(name)}`;
            }
            return `/api/assets/file?type=${type}&name=${encodeURIComponent(name)}`;
        }

        // 3. Background image
        if (this.bgEl) {
            if (step.bg) {
                let cleanBg = step.bg.replace(/\{\{\$skin\}\}/g, "");
                this.bgEl.src = getAssetUrl("Images", cleanBg);
                this.bgEl.style.display = "block";
            } else {
                this.bgEl.src = getAssetUrl("Images", "bg_room01_day.jpg");
                this.bgEl.style.display = "block";
            }
        }

        // 4. Character sprite
        if (this.spriteEl) {
            if (step.sprite) {
                let cleanSprite = step.sprite.replace(/\{\{\$skin\}\}/g, "");
                this.spriteEl.src = getAssetUrl("Images", cleanSprite);
                this.spriteEl.style.display = "block";
            } else {
                this.spriteEl.style.display = "none";
            }
        }

        // 5. Counter badge
        if (this.stepCounterEl) {
            this.stepCounterEl.textContent = `Реплика ${this.currentIndex + 1} из ${this.steps.length} (стр ${step.lineNum})`;
        }
    }
}

const previewSimulator = new LucyPreviewSimulator();
