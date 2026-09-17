/**
 * LucyEditor - NekoNovel Script Scene Interpreter
 * Parses script lines up to any cursor position to calculate the exact scene state:
 * - Active background image (excluding overlays like black_background_40)
 * - Dim overlay (black_background_40)
 * - Credits overlay (credit_start_X)
 * - Full-screen transparent character sprites (Lucy, Dr. Baek, Shopkeeper, Father, Andrew, Young Man)
 * - Character removal / erasure via '지우기' / 'clear' / 'clear_all' / 'fadeout'
 * - Dialogue window visibility (fadein/fadeout textbox)
 * - Current speaker name badge and dialogue text
 * - Audio (BGM loop, point-in-time SFX triggers)
 * - Point-in-time screen shake triggers
 */

const NekoNovelInterpreter = (() => {
    // Character definition mappings: script name patterns to sprite prefix & character ID
    const CHARACTERS = [
        { id: "lucy", prefix: "l", names: ["루시", "lucy", "lucy1", "루시1", "люси"] },
        { id: "dr_baek", prefix: "f", names: ["기박사", "dr_baek", "doctor", "박사", "dr_baek1", "доктор", "доктор_пэк", "пэк"] },
        { id: "shopkeeper", prefix: "s", names: ["가게주인", "shopkeeper", "хозяин_магазина", "магазин"] },
        { id: "father", prefix: "d", names: ["아버지", "father", "отец"] },
        { id: "andrew", prefix: "a", names: ["앤드류", "andrew", "эндрю"] },
        { id: "young_man", prefix: "z", names: ["청년", "young_man", "молодой_человек"] },
        { id: "pim023", prefix: "l", names: ["pim023", "PIM023"] }
    ];

    /**
     * Translates speaker tags to human-readable names.
     */
    function resolveSpeakerName(rawTag, lang = "en") {
        if (!rawTag) return "";
        const tag = rawTag.toLowerCase().trim();
        const isRu = lang === "ru";

        if (tag === "주인공" || tag === "protagonist" || tag === "protagonist1") {
            return isRu ? "Главный герой" : "Protagonist";
        } else if (tag === "루시" || tag === "lucy" || tag === "lucy1") {
            return isRu ? "Люси" : "Lucy";
        } else if (tag === "기박사" || tag === "dr_baek" || tag === "doctor" || tag === "dr_baek1" || tag === "박사" || tag === "박사1") {
            return isRu ? "Доктор Пэк" : "Dr. Baek";
        } else if (tag === "가게주인" || tag === "shopkeeper") {
            return isRu ? "Хозяин магазина" : "Shopkeeper";
        } else if (tag.startsWith("안드로이드") || tag.startsWith("android")) {
            return isRu ? "Андроид" : "Android";
        } else if (tag === "아버지" || tag === "father") {
            return isRu ? "Отец" : "Father";
        } else if (tag === "앤드류" || tag === "andrew") {
            return isRu ? "Эндрю" : "Andrew";
        } else if (tag === "청년" || tag === "young_man") {
            return isRu ? "Молодой человек" : "Young Man";
        } else if (tag === "목소리" || tag === "voice_speaker") {
            return isRu ? "Голос" : "Voice";
        } else if (tag === "여자목소리" || tag === "female_voice") {
            return isRu ? "Женский голос" : "Female Voice";
        } else if (tag === "경비로봇" || tag === "guard_robot") {
            return isRu ? "Робот-охранник" : "Security Robot";
        } else if (
            tag.startsWith("이름지우기") || tag.startsWith("clear_name") || tag.startsWith("hide_name") ||
            tag.startsWith("이름없음") || tag === "none" || tag === "없음"
        ) {
            return "";
        }
        return rawTag;
    }

    /**
     * Analyzes script up to targetLine (1-indexed inclusive) to determine the exact scene state.
     * @param {string|string[]} content Script content or lines array
     * @param {number} targetLine Line number (1-based)
     * @param {string} lang 'en' or 'ru'
     * @returns {Object} Full scene state
     */
    function analyzeSceneAtLine(content, targetLine = Infinity, lang = "en") {
        const lines = Array.isArray(content) ? content : (content || "").split("\n");
        const maxLine = Math.min(lines.length, targetLine);

        let background = null; // persistent background image (e.g. "bg_room01_day.jpg")
        let dimOverlay = false; // black_background_40 dim overlay
        let creditOverlay = null; // credit_start_X overlay
        let creditVisible = false;
        let characters = {};   // { [id]: { id, sprite: 'l09.png' } }
        let namedCgs = {};     // { [name]: { name, file, x, y } }
        let speaker = "";
        let textboxVisible = true;
        let dialogueText = "";
        let textSize = 35;     // default dialogue text size (text_size / 대사크기)
        let bgm = null;        // persistent { file: 'kyoumei.mp3', loop: true }
        let triggerSfx = null; // point-in-time SFX triggered strictly AT targetLine
        let triggerShake = false; // point-in-time screen shake triggered strictly AT targetLine
        let triggerVoice = null; // point-in-time voice line triggered strictly AT targetLine
        let lastActionLine = 1;
        const variables = { "$언어": "jp", "언어": "jp" };

        for (let i = 0; i < maxLine; i++) {
            const raw = lines[i];
            let line = raw.trim();
            const lineNum = i + 1;

            if (!line || line.startsWith("//")) continue;

            // Track variables
            let vm = line.match(/^(?:변수|var)\s+([^\s=]+)\s*=\s*["']?([^"'\s]+)["']?/i);
            if (vm) {
                variables[vm[1]] = vm[2];
            }

            // Substitute variables and skin tags
            line = line.replace(/\{\{\$skin\}\}/g, "");
            line = line.replace(/\{\{([^}]+)\}\}/g, (match, varName) => variables[varName] || (varName.includes("언어") ? "jp" : match));

            // 1. Background commands (배경, bg)
            let m = line.match(/^(?:배경|bg)\s+([^\s]+)(?:\s+([^\s]+))?/i);
            if (m) {
                const bgFile = m[2] || m[1];
                if (bgFile && !bgFile.toLowerCase().endsWith(".txt")) {
                    background = bgFile;
                    lastActionLine = lineNum;
                }
            } 
            // 2. CG commands: can be background, dim overlay, credits, named CG, or character sprite
            else if ((m = line.match(/^CG\s+([^\s]+)(?:\s+([^\s]+))?(?:\s+([^\s]+))?(?:\s+([^\s]+))?/i))) {
                const cgName = m[1];
                let cgFile = m[2];
                const cgX = m[3] !== undefined ? parseInt(m[3], 10) : 0;
                const cgY = m[4] !== undefined ? parseInt(m[4], 10) : 0;

                // If only 1 argument (CG <name>): removes / hides that CG
                if (!cgFile) {
                    delete namedCgs[cgName.toLowerCase()];
                    if (creditOverlay && creditOverlay.toLowerCase().includes(cgName.toLowerCase())) {
                        creditVisible = false;
                        creditOverlay = null;
                    }
                } else {
                    if (!cgFile.toLowerCase().endsWith(".png") && !cgFile.toLowerCase().endsWith(".jpg")) {
                        cgFile += ".png";
                    }
                    const lower = cgFile.toLowerCase();
                    const nameLower = cgName.toLowerCase();

                    // Dim overlay
                    if (lower.startsWith("black_background")) {
                        dimOverlay = true;
                    }
                    // Credit overlay
                    else if (lower.startsWith("credit")) {
                        creditOverlay = cgFile;
                        creditVisible = true;
                        namedCgs[nameLower] = { name: cgName, file: cgFile, x: cgX, y: cgY };
                    }
                    // Character sprite (s12.png, l01.png, d01.png, f01.png, a01.png, z01.png)
                    else if (/^[lsdfaz]\d/i.test(lower)) {
                        const prefix = lower[0];
                        let charId = "lucy";
                        if (prefix === "s") charId = "shopkeeper";
                        else if (prefix === "d") charId = "father";
                        else if (prefix === "f") charId = "dr_baek";
                        else if (prefix === "a") charId = "andrew";
                        else if (prefix === "z") charId = "young_man";

                        characters[charId] = { id: charId, sprite: cgFile };
                        lastActionLine = lineNum;
                    }
                    // Room Background or Event CG (if explicitly full-screen bg and no coordinates specified)
                    else if ((lower.startsWith("bg_") || lower.startsWith("ev") || lower.startsWith("title_")) && m[3] === undefined && m[4] === undefined && !nameLower.includes("big")) {
                        background = cgFile;
                        lastActionLine = lineNum;
                    }
                    // Named positioned CG (bg_dump01big, loading_glitch_XX, etc.)
                    else {
                        namedCgs[nameLower] = { name: cgName, file: cgFile, x: cgX, y: cgY };
                        lastActionLine = lineNum;
                    }
                }
            }

            // 3. Fadein commands
            if ((m = line.match(/^(?:fadein|페이드인)\s+([^\s]+)/i))) {
                const target = m[1].toLowerCase().replace(/\{\{|\}\}/g, "");
                if (target.startsWith("black_background")) {
                    dimOverlay = true;
                } else if (target.startsWith("credit")) {
                    creditVisible = true;
                } else if (target === "대사창" || target === "textbox") {
                    textboxVisible = true;
                } else if (target.startsWith("bg_") || target.startsWith("ev") || target.startsWith("title_")) {
                    let bgFile = m[1].replace(/\{\{|\}\}/g, "");
                    if (!bgFile.toLowerCase().endsWith(".jpg") && !bgFile.toLowerCase().endsWith(".png")) {
                        bgFile += ".jpg";
                    }
                    background = bgFile;
                    lastActionLine = lineNum;
                }
            }

            // 4. Fadeout commands
            if ((m = line.match(/^(?:fadeout|페이드아웃)\s+([^\s]+)/i))) {
                const target = m[1].toLowerCase().replace(/\{\{|\}\}/g, "");
                if (target.startsWith("black_background")) {
                    dimOverlay = false;
                } else if (target.startsWith("credit")) {
                    creditVisible = false;
                    creditOverlay = null;
                } else if (target === "루시" || target === "lucy" || target.startsWith("l")) {
                    delete characters["lucy"];
                } else if (target === "가게주인" || target === "shopkeeper" || target.startsWith("s")) {
                    delete characters["shopkeeper"];
                } else if (target === "기박사" || target === "dr_baek" || target.startsWith("f")) {
                    delete characters["dr_baek"];
                } else if (target === "아버지" || target === "father" || target.startsWith("d")) {
                    delete characters["father"];
                } else if (target === "앤드류" || target === "andrew" || target.startsWith("a")) {
                    delete characters["andrew"];
                } else if (target === "청년" || target === "young_man" || target.startsWith("z")) {
                    delete characters["young_man"];
                } else if (target === "대사창" || target === "textbox") {
                    textboxVisible = false;
                } else if (target === "배경음악" || target === "bgm") {
                    bgm = null;
                }

                // Fadeout named CG
                if (namedCgs[target]) {
                    delete namedCgs[target];
                }

                // Fadeout background (fadeout bg_krobotics_evening 2000)
                // ONLY fadeout if target actually matches the current active background!
                if (background) {
                    const currentBgBase = background.toLowerCase().replace(/\.[^/.]+$/, "");
                    if (target === currentBgBase || target === background.toLowerCase() || (target.startsWith("bg_") && currentBgBase === target)) {
                        background = null;
                    }
                }
                lastActionLine = lineNum;
            }

            // 5. Character Script Calls (스크립트 루시..., call lucy...)
            m = line.match(/^(?:스크립트|call|script)\s+([^\s]+)\s+(.+)$/i);
            if (m) {
                const targetScript = m[1].toLowerCase();
                const rest = m[2].trim();
                const restParts = rest.split(/\s+/);
                const action = restParts[0];

                // Check speaker name tags (이름.txt)
                if (targetScript.includes("이름") || targetScript.includes("name")) {
                    speaker = resolveSpeakerName(action, lang);
                    if (action.includes("대사창") || action.includes("box")) {
                        textboxVisible = false;
                    }
                    if (action.includes("캐릭터함께") || action.includes("and_char")) {
                        characters = {};
                    }
                    lastActionLine = lineNum;
                }
                // Check dialogue box functions (대화창함수.txt)
                else if (targetScript.includes("대화창") || targetScript.includes("textbox")) {
                    if (action.includes("페이드아웃") || action.includes("fadeout") || action.includes("감추기")) {
                        textboxVisible = false;
                    } else if (action.includes("페이드인") || action.includes("fadein") || action.includes("보이기")) {
                        textboxVisible = true;
                    }
                    lastActionLine = lineNum;
                }
                // Check Character scripts
                else {
                    for (const charDef of CHARACTERS) {
                        const matchesChar = charDef.names.some(n => targetScript.startsWith(n.toLowerCase()));
                        if (matchesChar) {
                            // Check ERASE / CLEAR action
                            const isClear = /^(?:지우기|clear|지우기1000|지우기1500|clear_1000|clear_1500|지우기2000)$/i.test(action);
                            if (isClear) {
                                delete characters[charDef.id];
                            } else {
                                // Sprite index
                                const numMatch = action.match(/^(\d+)/);
                                if (numMatch) {
                                    const rawNum = numMatch[1];
                                    const padded = rawNum.length === 1 ? "0" + rawNum : rawNum;
                                    const spriteFileName = `${charDef.prefix}${padded}.png`;
                                    const keepOthers = restParts.length > 1 && restParts[1] === "1";

                                    if (!keepOthers) {
                                        const newChars = {};
                                        newChars[charDef.id] = { id: charDef.id, sprite: spriteFileName };
                                        characters = newChars;
                                    } else {
                                        characters[charDef.id] = { id: charDef.id, sprite: spriteFileName };
                                    }
                                }
                            }
                            lastActionLine = lineNum;
                            break;
                        }
                    }
                }
            }

            // 6. Screen wipe commands (모두지우기, clear_all)
            if (/^(?:모두지우기|clear_all)$/i.test(line)) {
                characters = {};
                namedCgs = {};
                background = null;
                dimOverlay = false;
                creditOverlay = null;
                speaker = "";
                lastActionLine = lineNum;
            }

            // 7. Dialogue box visibility commands
            if (/^(?:대사창감추기|hide_textbox)$/i.test(line)) {
                textboxVisible = false;
                lastActionLine = lineNum;
            } else if (/^(?:대사창보이기|show_textbox)$/i.test(line)) {
                textboxVisible = true;
                lastActionLine = lineNum;
            }

            // 8. Text size command (text_size 50 / 대사크기 50)
            const tsm = line.match(/^(?:대사크기|text_size)\s+(\d+)/i);
            if (tsm) {
                textSize = parseInt(tsm[1], 10);
            }

            // 9. Dialogue line (대사, dialogue, say)
            const diaMatch = line.match(/^(?:대사|dialogue|say)[ \t](.*)$/i);
            const contMatch = line.match(/^(?:대사잇기|continue)[ \t](.*)$/i);
            if (diaMatch) {
                let text = diaMatch[1];
                let trimmed = text.trim();
                if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('“') && trimmed.endsWith('”'))) {
                    text = trimmed.slice(1, -1);
                }
                dialogueText = text;
                textboxVisible = true;
                lastActionLine = lineNum;
            } else if (contMatch) {
                let text = contMatch[1].trim();
                if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
                    text = text.slice(1, -1).trim();
                }
                // Appends directly without adding newline. If dialogue has text and neither has space, add single space.
                if (dialogueText && !dialogueText.endsWith(" ") && !text.startsWith(" ")) {
                    dialogueText += " ";
                }
                dialogueText += text;
                textboxVisible = true;
                lastActionLine = lineNum;
            } else if (/^(?:대사새줄|newline)$/i.test(line)) {
                // Ensure space between phrases without breaking line
                if (dialogueText && !dialogueText.endsWith(" ")) {
                    dialogueText += " ";
                }
                lastActionLine = lineNum;
            } else if (/^(?:대사지우기|clear_dialogue)$/i.test(line)) {
                dialogueText = "";
                lastActionLine = lineNum;
            }

            // 10. Audio - BGM is persistent
            if ((m = line.match(/^(?:배경음악|bgm)\s+(?:반복\s+|loop\s+)?([^\s]+)/i))) {
                bgm = { file: m[1], loop: true };
            }

            // 11. Point-in-time triggers: SFX, Shake & Voice ONLY execute if declared on the EXACT targetLine
            if (lineNum === maxLine) {
                if ((m = line.match(/^(?:효과음|sfx)\s+([^\s]+)(?:\s+([^\s]+))?/i))) {
                    triggerSfx = m[2] || m[1];
                }
                if (/^(?:진동|shake|화면흔들기)/i.test(line)) {
                    triggerShake = true;
                }
                if ((m = line.match(/^(?:보이스|voice)\s+([^\s]+)/i))) {
                    triggerVoice = m[1].replace(/\{\{\$?언어\}\}/g, variables["$언어"] || "jp");
                }
            }
        }

        // If cursor is on a dialogue line, look backwards for the voice statement attached to it
        const currentTargetRaw = lines[maxLine - 1] ? lines[maxLine - 1].trim() : "";
        if (!triggerVoice && /^(?:대사|dialogue|say)[ \t]/i.test(currentTargetRaw)) {
            for (let j = maxLine - 2; j >= Math.max(0, maxLine - 8); j--) {
                const prev = lines[j] ? lines[j].trim() : "";
                if (!prev || prev.startsWith("//")) continue;
                if (/^(?:대기|wait|대사|dialogue|say)[ \t]?/i.test(prev)) {
                    break;
                }
                const vm = prev.match(/^(?:보이스|voice)\s+([^\s]+)/i);
                if (vm) {
                    triggerVoice = vm[1].replace(/\{\{\$?언어\}\}/g, variables["$언어"] || "jp");
                    break;
                }
            }
        }

        const charList = Object.values(characters);

        return {
            lineNum: maxLine,
            lastActionLine,
            background,
            dimOverlay,
            creditOverlay: creditVisible ? creditOverlay : null,
            characters,
            charList,
            namedCgs: Object.values(namedCgs),
            speaker,
            textboxVisible,
            dialogueText,
            textSize,
            bgm,
            triggerSfx,
            triggerShake,
            triggerVoice
        };
    }

    /**
     * Parses the whole script into a timeline of interactive dialogue steps for navigation.
     * Lightweight O(N) line indexer to ensure 0ms input latency in editor.
     */
    function parseTimelineSteps(content, lang = "en") {
        const lines = Array.isArray(content) ? content : (content || "").split("\n");
        const steps = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^(?:대사|dialogue|say)[ \t]/i.test(line)) {
                steps.push({
                    stepIndex: steps.length,
                    lineNum: i + 1
                });
            }
        }

        return steps;
    }

    return {
        analyzeSceneAtLine,
        parseTimelineSteps,
        resolveSpeakerName,
        CHARACTERS
    };
})();

// Export for browser and Node.js
if (typeof window !== "undefined") {
    window.NekoNovelInterpreter = NekoNovelInterpreter;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = NekoNovelInterpreter;
}
