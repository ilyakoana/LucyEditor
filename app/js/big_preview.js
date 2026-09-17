/**
 * LucyEditor - Big Scene Preview Player Engine (1280x720)
 * Authentic NekoNovel Visual Novel Sequencer:
 * - Executes lines in sequential order with delays, fades, and rule transitions
 * - Renders full 1280x720 sprites natively without clipping or shrinking
 * - One-time SFX and Shake triggers (no repeating on clicks)
 * - Dim overlay (black_background_40) and Credits overlay (credit_start_X)
 * - Bi-directional cursor synchronization with Monaco Editor
 */

class BigPreviewPlayer {
    constructor() {
        this.scriptName = "";
        this.scriptContent = "";
        this.scriptLines = [];
        this.currentLine = 1;
        this.timeline = [];
        this.timelineIndex = 0;
        this.variables = { "$언어": "jp", "언어": "jp" };
        this.appLang = "ru";

        // Sequencer states
        this.isPlaying = false;
        this.isExecuting = false;
        this.isWaitingForClick = false;
        this.isTypewriting = false;
        this.isDelayed = false;
        this.syncWithCursor = true;

        // Timers
        this.delayTimer = null;
        this.typewriterTimer = null;
        this.typewriterSpeed = 25; // ms per character

        // Prevent repeated audio / effects on every click
        this.lastPlayedSfxLine = -1;
        this.lastShakenLine = -1;
        this.lastPlayedVoiceLine = -1;

        // Visual state cache
        this.currentBg = null;
        this.activeBgLayer = "front";
        this.currentBgmFile = null;
        this.currentChars = {};
        this.fullDialogueText = "";
        this.masterVolume = 0.75;
        this.bgmFadeTimer = null;

        // Audio Elements
        this.audioBgm = document.getElementById("audio-bgm");
        this.audioSfx = document.getElementById("audio-sfx");
        this.audioVoice = document.getElementById("audio-voice");

        // DOM Layers
        this.stage = document.getElementById("game-stage");
        this.bgBack = document.getElementById("layer-bg-back");
        this.bgFront = document.getElementById("layer-bg-front");
        this.dimLayer = document.getElementById("layer-dim");
        this.creditsLayer = document.getElementById("layer-credits");
        this.transitionLayer = document.getElementById("layer-transition");
        this.spritesLayer = document.getElementById("layer-sprites");
        this.effectsLayer = document.getElementById("layer-effects");
        this.textboxLayer = document.getElementById("layer-textbox");
        this.speakerContainer = document.getElementById("speaker-container");
        this.speakerGraphic = document.getElementById("speaker-graphic");
        this.speakerText = document.getElementById("speaker-text");
        this.dialogueTextEl = document.getElementById("dialogue-text");
        this.dialogueCursorEl = document.getElementById("dialogue-cursor");
        this.clickCatcher = document.getElementById("stage-click-catcher");
        this.cgContainer = document.getElementById("layer-cg-container");
        this.modalDisclaimer = document.getElementById("modal-disclaimer");
        this.btnCloseDisclaimer = document.getElementById("btn-close-disclaimer");
        this.checkDontShowDisclaimer = document.getElementById("check-dont-show-disclaimer");
        this.currentTextSize = 35;

        // HUD Elements
        this.hudScriptName = document.getElementById("hud-script-name");
        this.hudLineNum = document.getElementById("hud-line-num");
        this.btnPlay = document.getElementById("btn-play");
        this.btnPrev = document.getElementById("btn-prev");
        this.btnNext = document.getElementById("btn-next");
        this.btnRestart = document.getElementById("btn-restart");
        this.checkSync = document.getElementById("check-sync-cursor");
        this.volumeSlider = document.getElementById("volume-slider");
    }

    init() {
        this.fetchConfigAndApplyLang();
        this.checkFirstTimeDisclaimer();
        this.setupAudio();
        this.setupEventListeners();
        this.setupIpc();

        // Request initial content from main window
        if (window.lucyApi && window.lucyApi.requestInitialState) {
            window.lucyApi.requestInitialState();
        }
    }

    async fetchConfigAndApplyLang() {
        try {
            const urlLang = new URLSearchParams(window.location.search).get("lang");
            if (urlLang) {
                this.appLang = urlLang;
                this.applyLanguage(urlLang);
                return;
            }
            if (window.lucyApi && window.lucyApi.getConfig) {
                const cfg = await window.lucyApi.getConfig();
                if (cfg && cfg.language) {
                    this.appLang = cfg.language;
                    this.applyLanguage(this.appLang);
                }
            }
        } catch (e) {}
    }

    applyLanguage(lang) {
        const isRu = lang === "ru";
        // Disclaimer localization
        const titleEl = document.getElementById("disclaimer-title");
        if (titleEl) titleEl.textContent = isRu ? "Режим предварительного просмотра сцены" : "Scene Preview Mode";

        const desc1El = document.getElementById("disclaimer-desc1");
        if (desc1El) desc1El.textContent = isRu 
            ? "Обратите внимание: данный плеер является встроенной эмуляцией движка NekoNovel (1280×720)."
            : "Please note: this player is a built-in emulation of the NekoNovel engine (1280×720).";

        const desc2El = document.getElementById("disclaimer-desc2");
        if (desc2El) desc2El.textContent = isRu
            ? "В сложных сценах (параллельные потоки анимаций, скриптовые условия или системные вызовы) отображение может значительно отличаться от оригинальной игры."
            : "In complex scenes (parallel animation threads, script conditions, or system calls), visual output may significantly differ from the original game.";

        const tipEl = document.getElementById("disclaimer-tip");
        if (tipEl) tipEl.innerHTML = isRu
            ? "💡 <strong>Для полноценной проверки мода:</strong> соберите мод кнопкой <em>«Собрать Мод»</em> и запустите оригинальную игру кнопкой <em>«Запустить Игру» (F5)</em>."
            : "💡 <strong>To fully test your mod:</strong> build the mod using <em>“Build Mod”</em> and launch the original game using <em>“Launch Game” (F5)</em>.";

        const dontShowEl = document.getElementById("disclaimer-dont-show");
        if (dontShowEl) dontShowEl.textContent = isRu ? "Больше не показывать это окно" : "Do not show this again";

        const btnCloseEl = document.getElementById("btn-close-disclaimer");
        if (btnCloseEl) btnCloseEl.textContent = isRu ? "Понятно" : "Got it";

        // HUD Tooltips and labels
        if (this.btnPrev) this.btnPrev.title = isRu ? "Предыдущая реплика (←)" : "Previous line (←)";
        if (this.btnPlay) {
            this.btnPlay.title = isRu ? "Воспроизведение (Space)" : "Play (Space)";
            this.btnPlay.innerHTML = this.isPlaying ? (isRu ? "⏸ Пауза" : "⏸ Pause") : (isRu ? "▶ Старт" : "▶ Play");
        }
        if (this.btnNext) this.btnNext.title = isRu ? "Следующая реплика (→)" : "Next line (→)";
        if (this.btnRestart) this.btnRestart.title = isRu ? "В начало сцены (Home)" : "To start of scene (Home)";

        const syncLabel = document.querySelector(".hud-toggle-label");
        if (syncLabel) syncLabel.textContent = isRu ? "Следить за курсором" : "Sync cursor";

        const lineIndicator = document.querySelector(".hud-line-indicator span");
        if (lineIndicator) lineIndicator.textContent = isRu ? "Строка:" : "Line:";

        if (this.volumeSlider) this.volumeSlider.title = isRu ? "Громкость звука и музыки" : "Master volume";
        if (this.clickCatcher) this.clickCatcher.title = isRu ? "Кликните для перехода к следующей реплике" : "Click to advance dialogue";
    }

    checkFirstTimeDisclaimer() {
        const dismissed = localStorage.getItem("lucy_preview_disclaimer_dismissed");
        if (!dismissed || dismissed !== "true") {
            if (this.modalDisclaimer) {
                this.modalDisclaimer.style.display = "flex";
            }
        }

        this.btnCloseDisclaimer?.addEventListener("click", () => {
            if (this.checkDontShowDisclaimer && this.checkDontShowDisclaimer.checked) {
                localStorage.setItem("lucy_preview_disclaimer_dismissed", "true");
            }
            if (this.modalDisclaimer) {
                this.modalDisclaimer.style.display = "none";
            }
        });
    }

    setupAudio() {
        if (this.volumeSlider) {
            this.masterVolume = parseInt(this.volumeSlider.value, 10) / 100;
        }
        this.updateAudioVolumes();
    }

    updateAudioVolumes() {
        if (this.audioBgm) this.audioBgm.volume = Math.max(0, Math.min(1, this.masterVolume * 0.8));
        if (this.audioSfx) this.audioSfx.volume = Math.max(0, Math.min(1, this.masterVolume));
        if (this.audioVoice) this.audioVoice.volume = Math.max(0, Math.min(1, this.masterVolume));
    }

    setupEventListeners() {
        this.btnPlay?.addEventListener("click", () => this.togglePlayback());
        this.btnPrev?.addEventListener("click", () => this.jumpDialogueStep(-1));
        this.btnNext?.addEventListener("click", () => this.jumpDialogueStep(1));
        this.btnRestart?.addEventListener("click", () => this.restartScene());

        this.checkSync?.addEventListener("change", (e) => {
            this.syncWithCursor = e.target.checked;
            if (this.syncWithCursor) {
                this.pausePlayback();
                this.syncToLine(this.currentLine);
            }
        });

        this.volumeSlider?.addEventListener("input", (e) => {
            this.masterVolume = parseInt(e.target.value, 10) / 100;
            this.updateAudioVolumes();
        });

        // Click catcher for visual novel interaction
        this.clickCatcher?.addEventListener("click", () => this.handleUserAdvance());

        // Keyboard navigation
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                this.handleUserAdvance();
            } else if (e.code === "ArrowRight") {
                e.preventDefault();
                this.jumpDialogueStep(1);
            } else if (e.code === "ArrowLeft") {
                e.preventDefault();
                this.jumpDialogueStep(-1);
            } else if (e.code === "Home") {
                e.preventDefault();
                this.restartScene();
            }
        });
    }

    setupIpc() {
        if (!window.lucyApi) return;

        window.lucyApi.onSyncPreview((data) => {
            if (!data) return;

            const scriptChanged = Boolean(data.scriptName && data.scriptName !== this.scriptName);
            const contentChanged = data.content !== this.scriptContent;
            this.scriptName = data.scriptName || this.scriptName;
            this.scriptContent = data.content || "";
            this.scriptLines = this.scriptContent.split("\n");

            if (scriptChanged) {
                this.stopAllAudio();
            }

            if (this.hudScriptName) {
                this.hudScriptName.textContent = this.scriptName || "Untitled";
            }

            if (contentChanged || this.timeline.length === 0) {
                this.rebuildTimeline();
            }

            const newLine = typeof data.line === "number" ? data.line : this.currentLine;

            // When user navigates in editor and sync is ON, jump scene to that line
            if (this.syncWithCursor && !this.isPlaying) {
                this.stopSequencer();
                this.syncToLine(newLine);
            }
        });
    }

    rebuildTimeline() {
        if (typeof NekoNovelInterpreter !== "undefined") {
            this.timeline = NekoNovelInterpreter.parseTimelineSteps(this.scriptLines, "ru");
        }
    }

    // =========================================================================
    // Visual Novel Sequencer Engine
    // =========================================================================

    /**
     * User clicks on the screen or presses Space/Enter to advance.
     */
    handleUserAdvance() {
        // 1. If typewriter is active -> finish instantly
        if (this.isTypewriting) {
            this.finishTypewriterInstantly();
            return;
        }

        // 2. If a delay is running -> skip delay immediately
        if (this.isDelayed) {
            if (this.delayTimer) {
                clearTimeout(this.delayTimer);
                this.delayTimer = null;
            }
            this.isDelayed = false;
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 3. If waiting for user click at 'wait' / '대기' -> proceed
        if (this.isWaitingForClick) {
            this.isWaitingForClick = false;
            if (this.dialogueCursorEl) {
                this.dialogueCursorEl.classList.remove("waiting");
            }
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 4. In normal manual navigation, step sequence
        if (!this.isExecuting) {
            this.stepSequence();
        }
    }

    stopSequencer() {
        if (this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        if (this.bgmFadeTimer) {
            clearInterval(this.bgmFadeTimer);
            this.bgmFadeTimer = null;
        }
        this.isDelayed = false;
        this.isTypewriting = false;
        this.isExecuting = false;
        this.isWaitingForClick = false;
    }

    /**
     * Executes lines sequentially, respecting delays, transitions, and wait points.
     */
    stepSequence() {
        this.isExecuting = true;

        if (this.currentLine > this.scriptLines.length) {
            this.isExecuting = false;
            this.pausePlayback();
            return;
        }

        const rawLine = this.scriptLines[this.currentLine - 1] || "";
        let line = rawLine.trim();

        // Broadcast to Monaco editor
        if (window.lucyApi && window.lucyApi.sendPreviewJump) {
            window.lucyApi.sendPreviewJump(this.currentLine);
        }
        if (this.hudLineNum) {
            this.hudLineNum.textContent = this.currentLine;
        }

        // Empty line or comment -> advance immediately
        if (!line || line.startsWith("//")) {
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // Variable assignment: var <name> = "<val>" / 변수 <name> = "<val>"
        let vm = line.match(/^(?:변수|var)\s+([^\s=]+)\s*=\s*["']?([^"'\s]+)["']?/i);
        if (vm) {
            this.variables[vm[1]] = vm[2];
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // Substitute variables and skin tags
        line = line.replace(/\{\{\$skin\}\}/g, "");
        line = line.replace(/\{\{([^}]+)\}\}/g, (match, varName) => this.variables[varName] || (varName.includes("언어") ? (this.variables["$언어"] || "jp") : match));

        // 1. WAIT / 대기 - Stop and wait for user's manual click
        if (/^(?:대기|wait)$/i.test(line)) {
            this.isExecuting = false;
            this.isWaitingForClick = true;
            if (this.dialogueCursorEl) {
                this.dialogueCursorEl.classList.add("waiting");
            }
            return;
        }

        // 2. DELAY / 딜레이 <ms>
        const delayMatch = line.match(/^(?:delay|딜레이)\s+(\d+)/i);
        if (delayMatch) {
            const ms = parseInt(delayMatch[1], 10);
            this.isDelayed = true;
            this.delayTimer = setTimeout(() => {
                this.isDelayed = false;
                this.currentLine++;
                this.stepSequence();
            }, ms);
            return;
        }

        // 3. RULE TRANSITIONS
        // rule_fadeout 룰_20.png 500 / 배경룰페이드아웃 룰_20.png 500
        const ruleFadeoutMatch = line.match(/^(?:rule_fadeout|배경룰페이드아웃|룰_페이드아웃|룰페이드아웃)\s+([^\s]+)(?:\s+(\d+))?/i);
        if (ruleFadeoutMatch) {
            const duration = parseInt(ruleFadeoutMatch[2] || "500", 10);
            this.performRuleTransition("fadeout", duration, () => {
                this.currentLine++;
                this.stepSequence();
            });
            return;
        }

        // rule_fadein 룰_25.png 500 / 배경룰페이드인 룰_25.png 500
        const ruleFadeinMatch = line.match(/^(?:rule_fadein|배경룰페이드인|룰_페이드인|룰페이드인)\s+([^\s]+)(?:\s+(\d+))?/i);
        if (ruleFadeinMatch) {
            const duration = parseInt(ruleFadeinMatch[2] || "500", 10);
            this.performRuleTransition("fadein", duration, () => {
                this.currentLine++;
                this.stepSequence();
            });
            return;
        }

        // 4. DIALOGUE / 대사
        const diaMatch = line.match(/^(?:대사|dialogue|say)[ \t](.*)$/i);
        if (diaMatch) {
            let text = diaMatch[1];
            let trimmed = text.trim();
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('“') && trimmed.endsWith('”'))) {
                text = trimmed.slice(1, -1);
            }
            if (this.textboxLayer) this.textboxLayer.classList.add("visible");
            this.renderDialogue(text, true, () => {
                this.currentLine++;
                this.stepSequence();
            });
            return;
        }

        // 5. CONTINUE DIALOGUE / 대사잇기 (appends directly without enter)
        const contMatch = line.match(/^(?:대사잇기|continue)[ \t](.*)$/i);
        if (contMatch) {
            let text = contMatch[1].trim();
            if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
                text = text.slice(1, -1).trim();
            }
            if (this.fullDialogueText && !this.fullDialogueText.endsWith(" ") && !text.startsWith(" ")) {
                text = " " + text;
            }
            this.appendDialogue(text, () => {
                this.currentLine++;
                this.stepSequence();
            });
            return;
        }

        // 6. NEWLINE DIALOGUE / 대사새줄 (does not force newline, ensures space separator if needed)
        if (/^(?:대사새줄|newline)$/i.test(line)) {
            if (this.fullDialogueText && !this.fullDialogueText.endsWith(" ")) {
                this.appendDialogue(" ", () => {
                    this.currentLine++;
                    this.stepSequence();
                });
            } else {
                this.currentLine++;
                this.stepSequence();
            }
            return;
        }

        // 7. CLEAR DIALOGUE / 대사지우기
        if (/^(?:대사지우기|clear_dialogue)$/i.test(line)) {
            this.renderDialogue("", false);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 8. TEXT SIZE / 대사크기 (text_size 50 / text_size 35)
        const textSizeMatch = line.match(/^(?:text_size|대사크기)\s+(\d+)/i);
        if (textSizeMatch) {
            const sz = parseInt(textSizeMatch[1], 10);
            this.setTextSize(sz);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 9. BACKGROUND / 배경 / bg
        const bgMatch = line.match(/^(?:배경|bg)\s+([^\s]+)(?:\s+([^\s]+))?/i);
        if (bgMatch) {
            const bgFile = bgMatch[2] || bgMatch[1];
            if (bgFile && !bgFile.toLowerCase().endsWith(".txt")) {
                this.renderBackground(bgFile);
            }
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 10. SCALE / 크기 (크기 bg_dump01big 2 2 0)
        const scaleMatch = line.match(/^(?:크기|scale)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(?:\s+(\d+))?/i);
        if (scaleMatch) {
            const name = scaleMatch[1];
            const sx = parseFloat(scaleMatch[2]);
            const sy = parseFloat(scaleMatch[3]);
            const dur = parseInt(scaleMatch[4] || "0", 10);
            this.scaleCgElement(name, sx, sy, dur);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 11. MOVE / 이동 (이동 bg_dump01big 0 -150 20 0)
        const moveMatch = line.match(/^(?:이동|move)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)(?:\s+(\d+))?/i);
        if (moveMatch) {
            const name = moveMatch[1];
            const nx = parseInt(moveMatch[2], 10);
            const ny = parseInt(moveMatch[3], 10);
            let dur = parseInt(moveMatch[4] || "0", 10);
            if (dur > 0 && dur <= 50) {
                dur = dur * 100; // deciseconds to ms (e.g. 20 -> 2000ms)
            }
            this.moveCgElement(name, nx, ny, dur);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 12. CG commands: named CGs, glitch frames, backgrounds, or character sprites
        const cgMatch = line.match(/^CG\s+([^\s]+)(?:\s+([^\s]+))?(?:\s+([^\s]+))?(?:\s+([^\s]+))?(?:\s+([^\s]+))?(?:\s+.*)?$/i);
        if (cgMatch) {
            this.handleCgCommand(cgMatch[1], cgMatch[2], cgMatch[3], cgMatch[4], cgMatch[5]);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 13. FADEIN / FADEOUT
        const fadeinMatch = line.match(/^(?:fadein|페이드인)\s+([^\s]+)(?:\s+(\d+))?/i);
        if (fadeinMatch) {
            this.handleFadein(fadeinMatch[1], parseInt(fadeinMatch[2] || "500", 10));
            this.currentLine++;
            this.stepSequence();
            return;
        }

        const fadeoutMatch = line.match(/^(?:fadeout|페이드아웃)\s+([^\s]+)(?:\s+(\d+))?/i);
        if (fadeoutMatch) {
            this.handleFadeout(fadeoutMatch[1], parseInt(fadeoutMatch[2] || "500", 10));
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 14. SFX / 효과음 (only plays once)
        const sfxMatch = line.match(/^(?:효과음|sfx)\s+([^\s]+)(?:\s+([^\s]+))?/i);
        if (sfxMatch) {
            const sfxFile = sfxMatch[2] || sfxMatch[1];
            this.playSfx(sfxFile);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 15. BGM / 배경음악
        const bgmMatch = line.match(/^(?:배경음악|bgm)\s+(?:반복\s+|loop\s+)?([^\s]+)/i);
        if (bgmMatch) {
            this.playBgm(bgmMatch[1]);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 16. SHAKE / 화면흔들기 / 진동 (only shakes once)
        if (/^(?:진동|shake|화면흔들기)/i.test(line)) {
            this.triggerShake();
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 17. VOICE / 보이스 / voice
        const voiceMatch = line.match(/^(?:보이스|voice)\s+([^\s]+)/i);
        if (voiceMatch) {
            this.playVoice(voiceMatch[1]);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // 17. SCRIPT CALLS
        const callMatch = line.match(/^(?:스크립트|call|script)\s+([^\s]+)\s+(.+)$/i);
        if (callMatch) {
            this.handleScriptCall(callMatch[1], callMatch[2]);
            this.currentLine++;
            this.stepSequence();
            return;
        }

        // Default: continue to next statement
        this.currentLine++;
        this.stepSequence();
    }

    performRuleTransition(type, duration, callback) {
        if (!this.transitionLayer) {
            callback();
            return;
        }

        this.transitionLayer.style.transition = `opacity ${duration / 1000}s ease-in-out`;
        if (type === "fadeout") {
            // Screen fades to black
            this.transitionLayer.style.opacity = "1";
        } else {
            // Screen reveals from black
            this.transitionLayer.style.opacity = "0";
        }

        setTimeout(() => {
            callback();
        }, duration);
    }

    handleCgCommand(name, file, xRaw = 0, yRaw = 0, extra = null) {
        // Single argument: CG <name> -> frees/removes the element
        if (!file) {
            const key = name.toLowerCase();
            const existing = this.cgContainer?.querySelector(`[data-cg-name="${key}"]`);
            if (existing) {
                existing.remove();
                return;
            }
            if (name.toLowerCase().endsWith(".png") || name.toLowerCase().endsWith(".jpg")) {
                file = name;
            } else {
                return;
            }
        }

        let cgFile = file;
        if (!cgFile.toLowerCase().endsWith(".png") && !cgFile.toLowerCase().endsWith(".jpg")) {
            cgFile += ".png";
        }
        const lower = cgFile.toLowerCase();
        const nameLower = name.toLowerCase();
        const x = xRaw !== undefined ? parseInt(xRaw, 10) : 0;
        const y = yRaw !== undefined ? parseInt(yRaw, 10) : 0;

        // 1. Dim overlay
        if (lower.startsWith("black_background")) {
            this.setDimOverlay(true);
            return;
        }

        // 2. Character sprite: [lsdfaz]\d
        if (/^[lsdfaz]\d/i.test(lower)) {
            const prefix = lower[0];
            let charId = "lucy";
            if (prefix === "s") charId = "shopkeeper";
            else if (prefix === "d") charId = "father";
            else if (prefix === "f") charId = "dr_baek";
            else if (prefix === "a") charId = "andrew";
            else if (prefix === "z") charId = "young_man";

            this.currentChars[charId] = { id: charId, sprite: cgFile };
            this.renderSprites(Object.values(this.currentChars));
            return;
        }

        // 3. Room background or Event CG without coordinates and not a special big effect
        if ((lower.startsWith("bg_") || lower.startsWith("ev") || lower.startsWith("title_")) && x === 0 && y === 0 && !nameLower.includes("big")) {
            this.renderBackground(cgFile);
            return;
        }

        // 4. Named positioned CG (bg_dump01big, loading_glitch_XX, credit_start_X, etc.)
        let zIndex = 6;
        if (extra) {
            const num = parseInt(extra, 10);
            if (!isNaN(num)) zIndex = num;
        }
        this.createOrUpdateCgElement(name, cgFile, x, y, zIndex);
    }

    createOrUpdateCgElement(name, file, x = 0, y = 0, zIndex = 6) {
        if (!this.cgContainer) return null;
        const key = name.toLowerCase();
        let el = this.cgContainer.querySelector(`[data-cg-name="${key}"]`);
        const imgSrc = `lucy-asset://images/${encodeURIComponent(file)}`;

        if (!el) {
            el = document.createElement("img");
            el.className = "cg-element";
            el.setAttribute("data-cg-name", key);
            el.src = imgSrc;
            el.alt = name;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            if (zIndex) el.style.zIndex = zIndex;

            // Credits overlay full-screen scale
            if (key.startsWith("credit")) {
                el.style.width = "1280px";
                el.style.height = "720px";
                el.style.objectFit = "contain";
            }

            el.style.opacity = "1";
            this.cgContainer.appendChild(el);
        } else {
            el.src = imgSrc;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.opacity = "1";
        }
        return el;
    }

    removeCgElement(name) {
        if (!this.cgContainer) return;
        const key = name.toLowerCase();
        const el = this.cgContainer.querySelector(`[data-cg-name="${key}"]`);
        if (el) el.remove();
    }

    fadeinCgElement(name, duration = 1000) {
        if (!this.cgContainer) return;
        const key = name.toLowerCase();
        const el = this.cgContainer.querySelector(`[data-cg-name="${key}"]`);
        if (el) {
            const durSec = Math.max(0.05, duration / 1000);
            el.style.transition = "none";
            el.style.opacity = "0";
            void el.offsetWidth;
            el.style.transition = `opacity ${durSec}s ease-in-out`;
            el.style.opacity = "1";
        }
    }

    fadeoutCgElement(name, duration = 1000) {
        if (!this.cgContainer) return;
        const key = name.toLowerCase();
        const el = this.cgContainer.querySelector(`[data-cg-name="${key}"]`);
        if (el) {
            const durSec = Math.max(0.05, duration / 1000);
            el.style.transition = `opacity ${durSec}s ease-in-out`;
            el.style.opacity = "0";
            setTimeout(() => {
                if (el && el.parentNode && el.style.opacity === "0") {
                    el.remove();
                }
            }, duration);
        }
    }

    scaleCgElement(name, sx, sy, duration = 0) {
        if (!this.cgContainer) return;
        const key = name.toLowerCase();
        const el = this.cgContainer.querySelector(`[data-cg-name="${key}"]`);
        if (el) {
            if (duration > 0) {
                el.style.transition = `transform ${duration / 1000}s ease-out, opacity 1s ease-in-out`;
            }
            el.style.transform = `scale(${sx}, ${sy})`;
        }
    }

    moveCgElement(name, x, y, duration = 0) {
        if (!this.cgContainer) return;
        const key = name.toLowerCase();
        const el = this.cgContainer.querySelector(`[data-cg-name="${key}"]`);
        if (el) {
            if (duration > 0) {
                el.style.transition = `left ${duration / 1000}s ease-in-out, top ${duration / 1000}s ease-in-out, transform 0.5s ease-out, opacity 1.0s ease-in-out`;
            }
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
        }
    }

    clearAllNamedCgs() {
        if (!this.cgContainer) return;
        this.cgContainer.innerHTML = "";
    }

    setTextSize(size) {
        this.currentTextSize = size || 35;
        if (this.dialogueTextEl) {
            this.dialogueTextEl.style.fontSize = `${this.currentTextSize}px`;
        }
    }

    fadeoutBackground(duration = 2000) {
        const durSec = Math.max(0.1, duration / 1000);
        if (this.bgFront) {
            this.bgFront.style.transition = `opacity ${durSec}s ease-in-out`;
            this.bgFront.style.opacity = "0";
        }
        if (this.bgBack) {
            this.bgBack.style.transition = `opacity ${durSec}s ease-in-out`;
            this.bgBack.style.opacity = "0";
        }
        this.currentBg = null;
    }

    handleFadein(targetRaw, duration = 500) {
        const target = targetRaw.toLowerCase().replace(/\{\{|\}\}/g, "");
        if (target.startsWith("black_background")) {
            this.setDimOverlay(true);
        } else if (target === "대사창" || target === "textbox") {
            if (this.textboxLayer) this.textboxLayer.classList.add("visible");
        } else if (target === "배경음악" || target === "bgm") {
            this.fadeinBgm(duration);
        } else if (target.startsWith("bg_") || target.startsWith("ev") || target.startsWith("title_")) {
            const bgFile = target.includes(".") ? target : `${target}.jpg`;
            this.renderBackground(bgFile);
        }

        // Check named CG in #layer-cg-container
        if (this.cgContainer && this.cgContainer.querySelector(`[data-cg-name="${target}"]`)) {
            this.fadeinCgElement(target, duration);
        }
    }

    handleFadeout(targetRaw, duration = 500) {
        const target = targetRaw.toLowerCase().replace(/\{\{|\}\}/g, "");
        if (target.startsWith("black_background")) {
            this.setDimOverlay(false);
        } else if (target === "루시" || target === "lucy" || target.startsWith("l")) {
            delete this.currentChars["lucy"];
            this.renderSprites(Object.values(this.currentChars));
        } else if (target === "가게주인" || target === "shopkeeper" || target.startsWith("s")) {
            delete this.currentChars["shopkeeper"];
            this.renderSprites(Object.values(this.currentChars));
        } else if (target === "기박사" || target === "dr_baek" || target.startsWith("f")) {
            delete this.currentChars["dr_baek"];
            this.renderSprites(Object.values(this.currentChars));
        } else if (target === "아버지" || target === "father" || target.startsWith("d")) {
            delete this.currentChars["father"];
            this.renderSprites(Object.values(this.currentChars));
        } else if (target === "앤드류" || target === "andrew" || target.startsWith("a")) {
            delete this.currentChars["andrew"];
            this.renderSprites(Object.values(this.currentChars));
        } else if (target === "청년" || target === "young_man" || target.startsWith("z")) {
            delete this.currentChars["young_man"];
            this.renderSprites(Object.values(this.currentChars));
        } else if (target === "대사창" || target === "textbox") {
            if (this.textboxLayer) this.textboxLayer.classList.remove("visible");
        } else if (target === "배경음악" || target === "bgm") {
            this.fadeoutBgm(duration);
        }

        // Check named CG in #layer-cg-container
        if (this.cgContainer && this.cgContainer.querySelector(`[data-cg-name="${target}"]`)) {
            this.fadeoutCgElement(target, duration);
        }

        // Background fadeout: ONLY fadeout if target actually matches the currently active background!
        // Prevents black screen when fading out previous background (e.g. `fadein bg_neon02` followed by `fadeout bg_neon01`)
        if (this.currentBg) {
            const currentBgBase = this.currentBg.toLowerCase().replace(/\.[^/.]+$/, "").split(/[/\\]/).pop();
            const targetClean = target.replace(/\.[^/.]+$/, "").split(/[/\\]/).pop();
            if (targetClean === currentBgBase || targetClean.includes(currentBgBase) || currentBgBase.includes(targetClean)) {
                this.fadeoutBackground(duration);
            }
        }
    }

    handleScriptCall(targetScriptRaw, rest) {
        const targetScript = targetScriptRaw.toLowerCase();
        const restParts = rest.trim().split(/\s+/);
        const action = restParts[0];

        // Speaker tags (이름.txt)
        if (targetScript.includes("이름") || targetScript.includes("name")) {
            const speakerName = NekoNovelInterpreter.resolveSpeakerName(action, this.appLang || "ru");
            this.renderSpeaker(speakerName);
            if (action.includes("대사창") || action.includes("box")) {
                if (this.textboxLayer) this.textboxLayer.classList.remove("visible");
            }
            if (action.includes("캐릭터함께") || action.includes("and_char")) {
                this.currentChars = {};
                this.renderSprites([]);
            }
        }
        // Textbox functions (대화창함수.txt)
        else if (targetScript.includes("대화창") || targetScript.includes("textbox")) {
            if (action.includes("페이드아웃") || action.includes("fadeout") || action.includes("감추기")) {
                if (this.textboxLayer) this.textboxLayer.classList.remove("visible");
            } else if (action.includes("페이드인") || action.includes("fadein") || action.includes("보이기")) {
                if (this.textboxLayer) this.textboxLayer.classList.add("visible");
            }
        }
        // Character scripts (루시.txt, 가게주인.txt, etc.)
        else {
            for (const charDef of NekoNovelInterpreter.CHARACTERS) {
                if (charDef.names.some(n => targetScript.startsWith(n.toLowerCase()))) {
                    const isClear = /^(?:지우기|clear|지우기1000|지우기1500|clear_1000|clear_1500|지우기2000)$/i.test(action);
                    if (isClear) {
                        delete this.currentChars[charDef.id];
                    } else {
                        const numMatch = action.match(/^(\d+)/);
                        if (numMatch) {
                            const rawNum = numMatch[1];
                            const padded = rawNum.length === 1 ? "0" + rawNum : rawNum;
                            const spriteFileName = `${charDef.prefix}${padded}.png`;
                            const keepOthers = restParts.length > 1 && restParts[1] === "1";

                            if (!keepOthers) {
                                this.currentChars = {};
                            }
                            this.currentChars[charDef.id] = { id: charDef.id, sprite: spriteFileName };
                        }
                    }
                    this.renderSprites(Object.values(this.currentChars));
                    break;
                }
            }
        }
    }

    setDimOverlay(active) {
        if (!this.dimLayer) return;
        this.dimLayer.classList.toggle("active", active);
    }

    setCreditOverlay(file, visible) {
        if (!this.creditsLayer) return;
        if (visible && file) {
            this.creditsLayer.style.backgroundImage = `url("lucy-asset://images/${encodeURIComponent(file)}")`;
            this.creditsLayer.classList.add("active");
        } else {
            this.creditsLayer.classList.remove("active");
        }
    }

    // =========================================================================
    // Instant Line Sync (Used by Monaco Editor cursor)
    // =========================================================================

    syncToLine(targetLine) {
        this.stopSequencer();
        this.currentLine = Math.max(1, Math.min(this.scriptLines.length || 1, targetLine));

        if (this.hudLineNum) {
            this.hudLineNum.textContent = this.currentLine;
        }

        if (typeof NekoNovelInterpreter === "undefined") return;

        const state = NekoNovelInterpreter.analyzeSceneAtLine(this.scriptLines, this.currentLine, "ru");
        this.applySceneState(state, false);

        // Update timeline index
        for (let i = this.timeline.length - 1; i >= 0; i--) {
            if (this.timeline[i].lineNum <= this.currentLine) {
                this.timelineIndex = i;
                break;
            }
        }
    }

    applySceneState(state, animateTypewriter = false) {
        if (!state) return;

        // Background
        if (state.background) {
            this.renderBackground(state.background);
        } else {
            this.fadeoutBackground(100);
        }

        // Dim overlay (black_background_40)
        this.setDimOverlay(!!state.dimOverlay);

        // Named CGs
        this.clearAllNamedCgs();
        if (state.namedCgs && Array.isArray(state.namedCgs)) {
            for (const cg of state.namedCgs) {
                this.createOrUpdateCgElement(cg.name, cg.file, cg.x || 0, cg.y || 0);
            }
        }

        // Credits overlay (credit_start_X)
        if (state.creditOverlay) {
            this.setCreditOverlay(state.creditOverlay, true);
        } else {
            this.setCreditOverlay(null, false);
        }

        // Full 1280x720 Character Sprites
        this.renderSprites(state.charList || []);
        this.currentChars = { ...(state.characters || {}) };

        // Textbox visibility
        if (this.textboxLayer) {
            this.textboxLayer.classList.toggle("visible", !!state.textboxVisible);
        }

        // Text Size
        this.setTextSize(state.textSize || 35);

        // Speaker Name
        this.renderSpeaker(state.speaker);

        // Dialogue text
        this.renderDialogue(state.dialogueText, animateTypewriter);

        // BGM (persistent)
        if (state.bgm && state.bgm.file) {
            this.playBgm(state.bgm.file);
        }

        // SFX strictly on the target line, and only once!
        if (state.triggerSfx && this.lastPlayedSfxLine !== state.lineNum) {
            this.lastPlayedSfxLine = state.lineNum;
            this.playSfx(state.triggerSfx);
        }

        // Shake strictly on the target line, and only once!
        if (state.triggerShake && this.lastShakenLine !== state.lineNum) {
            this.lastShakenLine = state.lineNum;
            this.triggerShake();
        }

        // Voice strictly on the target line, and only once!
        if (state.triggerVoice && this.lastPlayedVoiceLine !== state.lineNum) {
            this.lastPlayedVoiceLine = state.lineNum;
            this.playVoice(state.triggerVoice);
        }
    }

    renderBackground(bgFile) {
        if (this.currentBg === bgFile) return;
        this.currentBg = bgFile;

        if (!bgFile) {
            if (this.bgFront) this.bgFront.style.opacity = "0";
            if (this.bgBack) this.bgBack.style.opacity = "0";
            return;
        }

        const bgUrl = `url("lucy-asset://images/${encodeURIComponent(bgFile)}")`;

        if (!this.activeBgLayer) this.activeBgLayer = "front";

        // Ping-pong 1.0s crossfade between bgFront and bgBack
        if (this.activeBgLayer === "front") {
            if (this.bgBack && this.bgFront) {
                this.bgBack.style.backgroundImage = bgUrl;
                this.bgBack.style.zIndex = "2";
                this.bgFront.style.zIndex = "1";
                this.bgBack.style.opacity = "0";
                void this.bgBack.offsetWidth;
                this.bgBack.style.opacity = "1";

                setTimeout(() => {
                    if (this.activeBgLayer === "back" && this.bgFront) {
                        this.bgFront.style.opacity = "0";
                    }
                }, 1000);
                this.activeBgLayer = "back";
            }
        } else {
            if (this.bgBack && this.bgFront) {
                this.bgFront.style.backgroundImage = bgUrl;
                this.bgFront.style.zIndex = "2";
                this.bgBack.style.zIndex = "1";
                this.bgFront.style.opacity = "0";
                void this.bgFront.offsetWidth;
                this.bgFront.style.opacity = "1";

                setTimeout(() => {
                    if (this.activeBgLayer === "front" && this.bgBack) {
                        this.bgBack.style.opacity = "0";
                    }
                }, 1000);
                this.activeBgLayer = "front";
            }
        }
    }

    /**
     * Renders character sprites as full 1280x720 overlays.
     * All characters smoothly fade in and fade out over 1.0s!
     */
    renderSprites(charList) {
        if (!this.spritesLayer) return;

        const targetChars = charList || [];
        const targetIds = new Set(targetChars.map(c => c.id));

        // 1. Smoothly fade out and remove sprites that are no longer in targetChars
        const existingSlots = Array.from(this.spritesLayer.querySelectorAll(".char-slot"));
        for (const slotEl of existingSlots) {
            const charId = slotEl.getAttribute("data-char-id");
            if (!targetIds.has(charId)) {
                slotEl.classList.remove("active");
                slotEl.classList.add("fading-out");
                setTimeout(() => {
                    if (slotEl.parentNode && slotEl.classList.contains("fading-out")) {
                        slotEl.remove();
                    }
                }, 1000);
            }
        }

        // 2. Add or update sprites
        for (const char of targetChars) {
            if (!char || !char.sprite) continue;

            let slotEl = this.spritesLayer.querySelector(`[data-char-id="${char.id}"]`);
            if (!slotEl) {
                slotEl = document.createElement("div");
                slotEl.className = "char-slot";
                slotEl.setAttribute("data-char-id", char.id);
                slotEl.id = `sprite-slot-${char.id}`;

                const img = document.createElement("img");
                img.className = "char-sprite-img";
                img.src = `lucy-asset://images/${encodeURIComponent(char.sprite)}`;
                img.alt = char.id;
                img.onerror = () => { img.style.display = "none"; };

                slotEl.appendChild(img);
                this.spritesLayer.appendChild(slotEl);

                // 1.0s smooth fade in
                void slotEl.offsetWidth;
                slotEl.classList.add("active");
            } else {
                slotEl.classList.remove("fading-out");
                slotEl.classList.add("active");
                const img = slotEl.querySelector(".char-sprite-img");
                const newSrc = `lucy-asset://images/${encodeURIComponent(char.sprite)}`;
                if (img && img.getAttribute("src") !== newSrc) {
                    img.src = newSrc;
                }
            }
        }
    }

    renderSpeaker(speaker) {
        if (!this.speakerContainer) return;

        if (!speaker) {
            this.speakerContainer.style.opacity = "0";
            return;
        }

        this.speakerContainer.style.opacity = "1";

        const graphicMap = {
            "Люси": "name_lucy_ru.png",
            "Lucy": "name_lucy_ru.png",
            "Доктор Пэк": "name_doctor_ru.png",
            "Dr. Baek": "name_doctor_ru.png",
            "Доктор": "name_doctor_ru.png",
            "Doctor": "name_doctor_ru.png",
            "Главный герой": "name_you_ru.png",
            "Protagonist": "name_you_ru.png",
            "Я": "name_you_ru.png",
            "You": "name_you_ru.png",
            "Отец": "name_father_ru.png",
            "Father": "name_father_ru.png",
            "Эндрю": "name_andrew_ru.png",
            "Andrew": "name_andrew_ru.png",
            "Андроид": "name_android_ru.png",
            "Android": "name_android_ru.png",
            "Мастер": "name_repairman_ru.png",
            "Repairman": "name_repairman_ru.png",
            "Голос": "name_voice_ru.png",
            "Voice": "name_voice_ru.png",
            "Женский голос": "name_femalevoice_ru.png",
            "Female Voice": "name_femalevoice_ru.png",
            "Робот-охранник": "name_guardrobot_ru.png",
            "Security Robot": "name_guardrobot_ru.png",
            "Мужчина": "name_man_ru.png",
            "Man": "name_man_ru.png",
            "Женщина": "name_woman_ru.png",
            "Woman": "name_woman_ru.png"
        };

        const graphicFile = graphicMap[speaker];
        if (graphicFile && this.speakerGraphic) {
            this.speakerGraphic.src = `lucy-asset://images/${graphicFile}`;
            this.speakerGraphic.style.display = "block";
            if (this.speakerText) this.speakerText.style.display = "none";
        } else {
            if (this.speakerGraphic) this.speakerGraphic.style.display = "none";
            if (this.speakerText) {
                this.speakerText.style.display = "block";
                this.speakerText.textContent = speaker;
            }
        }
    }

    renderDialogue(text, animate = false, onComplete = null) {
        if (!this.dialogueTextEl) return;

        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        this.fullDialogueText = text || "";

        if (!animate || !text) {
            this.isTypewriting = false;
            this.dialogueTextEl.textContent = this.fullDialogueText;
            if (onComplete) onComplete();
            return;
        }

        this.isTypewriting = true;
        this.dialogueTextEl.textContent = "";
        if (this.dialogueCursorEl) {
            this.dialogueCursorEl.classList.remove("waiting");
        }

        let charIdx = 0;
        const totalChars = this.fullDialogueText.length;

        this.typewriterTimer = setInterval(() => {
            charIdx++;
            this.dialogueTextEl.textContent = this.fullDialogueText.slice(0, charIdx);

            if (charIdx >= totalChars) {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = null;
                this.isTypewriting = false;
                if (onComplete) onComplete();
            }
        }, this.typewriterSpeed);
    }

    appendDialogue(text, onComplete = null) {
        if (!this.dialogueTextEl) return;
        this.fullDialogueText += text;
        this.dialogueTextEl.textContent = this.fullDialogueText;
        if (onComplete) onComplete();
    }

    finishTypewriterInstantly() {
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }
        this.isTypewriting = false;
        if (this.dialogueTextEl) {
            this.dialogueTextEl.textContent = this.fullDialogueText;
        }
        // Advance to next statement (e.g. wait)
        this.currentLine++;
        this.stepSequence();
    }

    fadeoutBgm(duration = 2000) {
        if (!this.audioBgm || !this.currentBgmFile) return;
        if (this.bgmFadeTimer) {
            clearInterval(this.bgmFadeTimer);
            this.bgmFadeTimer = null;
        }

        const startVol = this.audioBgm.volume;
        if (startVol <= 0) {
            this.playBgm(null);
            return;
        }

        const stepInterval = 40;
        const totalSteps = Math.max(1, Math.floor(duration / stepInterval));
        const volStep = startVol / totalSteps;
        let currentStep = 0;

        this.bgmFadeTimer = setInterval(() => {
            currentStep++;
            const newVol = Math.max(0, startVol - (volStep * currentStep));
            if (this.audioBgm) this.audioBgm.volume = newVol;

            if (currentStep >= totalSteps || newVol <= 0) {
                clearInterval(this.bgmFadeTimer);
                this.bgmFadeTimer = null;
                this.playBgm(null);
            }
        }, stepInterval);
    }

    fadeinBgm(duration = 1000) {
        if (!this.audioBgm) return;
        if (this.bgmFadeTimer) {
            clearInterval(this.bgmFadeTimer);
            this.bgmFadeTimer = null;
        }

        const targetVol = Math.max(0, Math.min(1, this.masterVolume * 0.8));
        this.audioBgm.volume = 0;
        if (this.audioBgm.paused && this.currentBgmFile) {
            this.audioBgm.play().catch(() => {});
        }

        const stepInterval = 40;
        const totalSteps = Math.max(1, Math.floor(duration / stepInterval));
        const volStep = targetVol / totalSteps;
        let currentStep = 0;

        this.bgmFadeTimer = setInterval(() => {
            currentStep++;
            const newVol = Math.min(targetVol, volStep * currentStep);
            if (this.audioBgm) this.audioBgm.volume = newVol;

            if (currentStep >= totalSteps || newVol >= targetVol) {
                clearInterval(this.bgmFadeTimer);
                this.bgmFadeTimer = null;
                if (this.audioBgm) this.audioBgm.volume = targetVol;
            }
        }, stepInterval);
    }

    playBgm(file) {
        if (this.bgmFadeTimer) {
            clearInterval(this.bgmFadeTimer);
            this.bgmFadeTimer = null;
        }

        if (!file) {
            this.currentBgmFile = null;
            if (this.audioBgm) {
                this.audioBgm.pause();
                this.audioBgm.currentTime = 0;
            }
            return;
        }

        if (this.currentBgmFile !== file) {
            this.currentBgmFile = file;
            if (this.audioBgm) {
                this.audioBgm.volume = Math.max(0, Math.min(1, this.masterVolume * 0.8));
                this.audioBgm.src = `lucy-asset://bgms/${encodeURIComponent(file)}`;
                this.audioBgm.play().catch(() => {});
            }
        }
    }

    playSfx(file) {
        if (!file || !this.audioSfx) return;
        this.audioSfx.src = `lucy-asset://fxs/${encodeURIComponent(file)}`;
        this.audioSfx.currentTime = 0;
        this.audioSfx.play().catch(() => {});
    }

    stopAllAudio() {
        if (this.bgmFadeTimer) {
            clearInterval(this.bgmFadeTimer);
            this.bgmFadeTimer = null;
        }
        this.currentBgmFile = null;
        if (this.audioBgm) {
            this.audioBgm.pause();
            this.audioBgm.currentTime = 0;
        }
        if (this.audioSfx) {
            this.audioSfx.pause();
            this.audioSfx.currentTime = 0;
        }
        if (this.audioVoice) {
            this.audioVoice.pause();
            this.audioVoice.currentTime = 0;
        }
        this.lastPlayedSfxLine = -1;
        this.lastShakenLine = -1;
        this.lastPlayedVoiceLine = -1;
    }

    playVoice(file) {
        if (!file) return;
        if (!this.audioVoice) {
            this.audioVoice = document.getElementById("audio-voice");
        }
        if (!this.audioVoice) return;

        const cleanFile = file.replace(/\{\{\$?언어\}\}/g, this.variables["$언어"] || "jp");
        this.audioVoice.volume = Math.max(0, Math.min(1, this.masterVolume));
        this.audioVoice.src = `lucy-asset://voices/${encodeURIComponent(cleanFile)}`;
        this.audioVoice.currentTime = 0;
        this.audioVoice.play().catch((e) => {
            console.warn("Could not play voice line:", cleanFile, e);
        });
    }

    triggerShake() {
        if (!this.stage) return;
        this.stage.classList.remove("shaking");
        void this.stage.offsetWidth;
        this.stage.classList.add("shaking");
        setTimeout(() => {
            this.stage?.classList.remove("shaking");
        }, 500);
    }

    // =========================================================================
    // Controls: Play, Jump, Restart
    // =========================================================================

    togglePlayback() {
        if (this.isPlaying) {
            this.pausePlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        this.isPlaying = true;
        if (this.btnPlay) {
            const isRu = this.appLang === "ru";
            this.btnPlay.innerHTML = isRu ? "⏸ Пауза" : "⏸ Pause";
            this.btnPlay.classList.add("playing");
        }
        if (this.isWaitingForClick) {
            this.handleUserAdvance();
        } else {
            this.stepSequence();
        }
    }

    pausePlayback() {
        this.isPlaying = false;
        if (this.btnPlay) {
            const isRu = this.appLang === "ru";
            this.btnPlay.innerHTML = isRu ? "▶ Старт" : "▶ Play";
            this.btnPlay.classList.remove("playing");
        }
    }

    jumpDialogueStep(direction) {
        this.stopSequencer();
        if (this.timeline.length === 0) {
            this.rebuildTimeline();
        }
        if (this.timeline.length === 0) return;

        const currentLine = this.currentLine || 1;
        let targetStep = null;

        if (direction > 0) {
            // Find first dialogue step strictly after currentLine
            targetStep = this.timeline.find(step => step.lineNum > currentLine);
            if (!targetStep) {
                targetStep = this.timeline[this.timeline.length - 1];
            }
        } else {
            // Find last dialogue step strictly before currentLine
            for (let i = this.timeline.length - 1; i >= 0; i--) {
                if (this.timeline[i].lineNum < currentLine) {
                    targetStep = this.timeline[i];
                    break;
                }
            }
            if (!targetStep) {
                targetStep = this.timeline[0];
            }
        }

        if (targetStep) {
            this.syncToLine(targetStep.lineNum);
            if (window.lucyApi && window.lucyApi.sendPreviewJump) {
                window.lucyApi.sendPreviewJump(targetStep.lineNum);
            }
        }
    }

    restartScene() {
        this.stopSequencer();
        this.stopAllAudio();
        this.pausePlayback();
        this.timelineIndex = 0;
        this.syncToLine(1);
        if (window.lucyApi && window.lucyApi.sendPreviewJump) {
            window.lucyApi.sendPreviewJump(1);
        }
    }
}

// Initialize player when DOM loads
window.addEventListener("DOMContentLoaded", () => {
    window.previewPlayer = new BigPreviewPlayer();
    window.previewPlayer.init();
});
