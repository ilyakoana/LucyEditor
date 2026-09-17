/**
 * LucyEditor - Bidirectional Syntax Translator
 * Translates between NekoNovel Korean engine script syntax and clean visual English/Russian syntax.
 * 
 * Rules:
 * - Visually in Monaco Editor: displays intuitive English commands (dialogue, wait, delay, bg, fadein, fadeout, call, var, if, jump, etc.)
 * - On-disk in files & .nkpack: preserves 100% authentic Korean NekoNovel commands so the game engine never breaks.
 * - Dialogue text string contents and comments (//) are strictly preserved.
 */

const SyntaxTranslator = (() => {
    // Character names mapping for "call 이름.txt <name>"
    const NAME_MAP_KO_TO_EN = {
        "주인공": "protagonist",
        "주인공1": "protagonist1",
        "루시": "lucy",
        "루시1": "lucy1",
        "기박사": "dr_baek",
        "기박사1": "dr_baek1",
        "가게주인": "shopkeeper",
        "가게주인1": "shopkeeper1",
        "아버지": "father",
        "아버지1": "father1",
        "박사": "doctor",
        "박사1": "doctor1",
        "안드로이드": "android",
        "안드로이드1": "android1",
        "청년": "young_man",
        "청년1": "young_man1",
        "앤드류": "andrew",
        "앤드류1": "andrew1",
        "여성1": "female1",
        "목소리": "voice_speaker",
        "여자목소리": "female_voice",
        "경비로봇": "guard_robot",
        "이름지우기": "clear_name",
        "이름지우기대사창": "hide_name_and_box",
        "이름지우기캐릭터함께": "clear_name_and_char"
    };

    const NAME_MAP_EN_TO_KO = {};
    for (const [ko, en] of Object.entries(NAME_MAP_KO_TO_EN)) {
        NAME_MAP_EN_TO_KO[en.toLowerCase()] = ko;
    }

    /**
     * Converts genuine Korean script text to Visual English representation for Monaco Editor.
     * @param {string} text 
     * @returns {string} Visual text
     */
    function koreanToVisual(text) {
        if (!text) return text;
        const lines = text.split("\n");
        const out = [];

        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i];
            const hasCr = raw.endsWith("\r");
            const cleanRaw = hasCr ? raw.slice(0, -1) : raw;

            const indentMatch = cleanRaw.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : "";
            const content = cleanRaw.substring(indent.length);

            // Preserve empty lines and comments
            if (!content || content.startsWith("//")) {
                out.push(raw);
                continue;
            }

            let translated = null;

            // 1. Dialogue & Text
            let m = content.match(/^대사(\s+)(.*)$/);
            if (m) {
                translated = `dialogue${m[1]}${m[2]}`;
            } else if (content === "대기") {
                translated = "wait";
            } else if (content === "대사새줄") {
                translated = "newline";
            } else if ((m = content.match(/^대사잇기(\s+)(.*)$/))) {
                translated = `continue${m[1]}${m[2]}`;
            } else if (content === "대사지우기") {
                translated = "clear_dialogue";
            } else if ((m = content.match(/^대사크기(\s+)(.*)$/))) {
                translated = `text_size${m[1]}${m[2]}`;
            } else if (content === "대사창감추기") {
                translated = "hide_textbox";
            } else if ((m = content.match(/^대사출력영역(\s+)(.*)$/))) {
                translated = `dialogue_text_rect${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사창영역(\s+)(.*)$/))) {
                translated = `dialogue_box_rect${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사속도(\s+)(.*)$/))) {
                translated = `text_speed${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사그림자(\s+)(.*)$/))) {
                translated = `text_shadow${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사줄간격(\s+)(.*)$/))) {
                translated = `text_line_spacing${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사굵게(\s+)(.*)$/))) {
                translated = `text_bold${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사페이드(\s+)(.*)$/))) {
                translated = `text_fade${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사정렬(\s+)(.*)$/))) {
                translated = `text_align${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사그림자색깔(\s+)(.*)$/))) {
                translated = `text_shadow_color${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사색깔(\s+)(.*)$/))) {
                translated = `text_color${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사폰트(\s+)(.*)$/))) {
                translated = `text_font${m[1]}${m[2]}`;
            } else if ((m = content.match(/^대사창스킨(\s+)(.*)$/))) {
                translated = `textbox_skin${m[1]}${m[2]}`;
            } else if ((m = content.match(/^카메라무시(\s+)(.*)$/))) {
                translated = `ignore_camera${m[1]}${m[2]}`;
            }

            // 2. System & Memory
            else if (content === "게임상태") {
                translated = "save_state";
            } else if (content === "모두지우기") {
                translated = "clear_all";
            } else if (content === "회상초기화") {
                translated = "memory_reset";
            } else if ((m = content.match(/^회상첫설정(\s+)(.*)$/))) {
                translated = `memory_init${m[1]}${m[2]}`;
            } else if ((m = content.match(/^회상설정(\s+)(.*)$/))) {
                translated = `memory_set${m[1]}${m[2]}`;
            }

            // 3. Flow & Logic
            else if ((m = content.match(/^딜레이(\s+)(.*)$/))) {
                translated = `delay${m[1]}${m[2]}`;
            } else if ((m = content.match(/^변수(\s+)(.*)$/))) {
                translated = `var${m[1]}${m[2]}`;
            } else if ((m = content.match(/^정변수(\s+)(.*)$/))) {
                translated = `global_var${m[1]}${m[2]}`;
            } else if ((m = content.match(/^북마크(\s+)(.*)$/))) {
                translated = `label${m[1]}${m[2]}`;
            } else if ((m = content.match(/^점프(\s+)(.*)$/))) {
                const rest = m[2];
                if (rest.endsWith(" 첫줄")) {
                    translated = `jump${m[1]}${rest.slice(0, -3)} start`;
                } else if (rest === "첫줄") {
                    translated = `jump${m[1]}start`;
                } else {
                    translated = `jump${m[1]}${rest}`;
                }
            } else if ((m = content.match(/^조건(\s+)(.*)$/))) {
                const rest = m[2].replace(" 여기 ", " goto ");
                translated = `if${m[1]}${rest}`;
            }

            // 4. Threads
            else if (content === "쓰레드시작") {
                translated = "thread_start";
            } else if (content === "쓰레드대기") {
                translated = "thread_wait";
            } else if (content === "쓰레드") {
                translated = "thread";
            } else if ((m = content.match(/^쓰레드(\s+)(.*)$/))) {
                const sub = m[2];
                if (sub === "배경음악페이드아웃") {
                    translated = `thread${m[1]}bgm_fadeout`;
                } else if (sub === "배경음악페이드인") {
                    translated = `thread${m[1]}bgm_fadein`;
                } else {
                    translated = `thread${m[1]}${sub}`;
                }
            }

            // 5. Visuals & Graphics
            else if ((m = content.match(/^배경(\s+)(.*)$/))) {
                translated = `bg${m[1]}${m[2]}`;
            } else if ((m = content.match(/^CG(\s+)(.*)$/))) {
                translated = `cg${m[1]}${m[2]}`;
            } else if ((m = content.match(/^배경룰페이드인(\s+)(.*)$/))) {
                translated = `rule_fadein${m[1]}${m[2]}`;
            } else if ((m = content.match(/^배경룰페이드아웃(\s+)(.*)$/))) {
                translated = `rule_fadeout${m[1]}${m[2]}`;
            } else if ((m = content.match(/^배경페이드인(\s+)(.*)$/))) {
                translated = `bg_fadein${m[1]}${m[2]}`;
            } else if ((m = content.match(/^배경페이드아웃(\s+)(.*)$/))) {
                translated = `bg_fadeout${m[1]}${m[2]}`;
            } else if ((m = content.match(/^크기(\s+)(.*)$/))) {
                translated = `scale${m[1]}${m[2]}`;
            } else if ((m = content.match(/^이동(\s+)(.*)$/))) {
                translated = `move${m[1]}${m[2]}`;
            } else if ((m = content.match(/^진동(\s+)(.*)$/))) {
                translated = `shake${m[1]}${m[2]}`;
            } else if ((m = content.match(/^회전(\s+)(.*)$/))) {
                translated = `rotate${m[1]}${m[2]}`;
            } else if ((m = content.match(/^출력순서(\s+)(.*)$/))) {
                translated = `layer_order${m[1]}${m[2]}`;
            }

            // 6. Fade in / Fade out
            else if ((m = content.match(/^페이드아웃(\s+)(.*)$/))) {
                const sub = m[2];
                if (sub.startsWith("배경음악 ")) {
                    translated = `fadeout${m[1]}bgm ${sub.substring(5)}`;
                } else if (sub === "배경음악") {
                    translated = `fadeout${m[1]}bgm`;
                } else {
                    translated = `fadeout${m[1]}${sub}`;
                }
            } else if ((m = content.match(/^페이드인(\s+)(.*)$/))) {
                const sub = m[2];
                if (sub.startsWith("배경음악 ")) {
                    translated = `fadein${m[1]}bgm ${sub.substring(5)}`;
                } else if (sub === "배경음악") {
                    translated = `fadein${m[1]}bgm`;
                } else {
                    translated = `fadein${m[1]}${sub}`;
                }
            }

            // 7. Audio & Music
            else if ((m = content.match(/^배경음악(\s+)(.*)$/))) {
                const sub = m[2];
                if (sub.startsWith("반복 ")) {
                    translated = `bgm${m[1]}loop ${sub.substring(3)}`;
                } else {
                    translated = `bgm${m[1]}${sub}`;
                }
            } else if ((m = content.match(/^효과음(\s+)(.*)$/))) {
                const sub = m[2];
                if (sub.endsWith(" 반복")) {
                    translated = `sfx${m[1]}${sub.slice(0, -3)} loop`;
                } else {
                    translated = `sfx${m[1]}${sub}`;
                }
            } else if ((m = content.match(/^보이스(\s+)(.*)$/))) {
                translated = `voice${m[1]}${m[2]}`;
            }

            // 8. Script Calls & Special Helpers
            else if ((m = content.match(/^스크립트(\s+)(.*)$/))) {
                const sub = m[2];
                if (sub.startsWith("대화창함수.txt 페이드아웃 대사창")) {
                    translated = `call${m[1]}대화창함수.txt fadeout_textbox${sub.substring("대화창함수.txt 페이드아웃 대사창".length)}`;
                } else if (sub.startsWith("대화창함수.txt 페이드인 대사창")) {
                    translated = `call${m[1]}대화창함수.txt fadein_textbox${sub.substring("대화창함수.txt 페이드인 대사창".length)}`;
                } else if (sub.startsWith("이름.txt ")) {
                    const tag = sub.substring(7);
                    if (NAME_MAP_KO_TO_EN[tag]) {
                        translated = `call${m[1]}이름.txt ${NAME_MAP_KO_TO_EN[tag]}`;
                    } else {
                        translated = `call${m[1]}${sub}`;
                    }
                } else if (sub.includes("지우기1000")) {
                    translated = `call${m[1]}${sub.replace("지우기1000", "clear_1000")}`;
                } else {
                    translated = `call${m[1]}${sub}`;
                }
            }

            // 9. UI & Buttons
            else if ((m = content.match(/^키처리(\s+)(.*)$/))) {
                translated = `key_event${m[1]}${m[2]}`;
            } else if ((m = content.match(/^시스템버튼(\s+)(.*)$/))) {
                translated = `system_button${m[1]}${m[2]}`;
            } else if (content === "시스템버튼제거") {
                translated = "remove_system_button";
            } else if (content === "버튼대기") {
                translated = "wait_button";
            } else if (content === "버튼제거") {
                translated = "remove_button";
            } else if ((m = content.match(/^버튼(\s+)(.*)$/))) {
                translated = `button${m[1]}${m[2]}`;
            }

            if (translated !== null) {
                out.push(indent + translated + (hasCr ? "\r" : ""));
            } else {
                out.push(raw);
            }
        }

        return out.join("\n");
    }

    /**
     * Converts Visual English/Russian text from Monaco back to 100% genuine NekoNovel Korean script.
     * @param {string} text 
     * @returns {string} Genuine Korean script text
     */
    function visualToKorean(text) {
        if (!text) return text;
        const lines = text.split("\n");
        const out = [];

        for (let i = 0; i < lines.length; i++) {
            const raw = lines[i];
            const hasCr = raw.endsWith("\r");
            const cleanRaw = hasCr ? raw.slice(0, -1) : raw;

            const indentMatch = cleanRaw.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : "";
            const content = cleanRaw.substring(indent.length);

            // Preserve empty lines and comments
            if (!content || content.startsWith("//")) {
                out.push(raw);
                continue;
            }

            let converted = null;

            // 1. Dialogue & Text
            let m = content.match(/^(?:dialogue|say|диалог)(\s+)(.*)$/i);
            if (m) {
                converted = `대사${m[1]}${m[2]}`;
            } else if (/^(?:wait|ждать)$/i.test(content)) {
                converted = "대기";
            } else if (/^(?:newline|dialogue_newline|новая_строка)$/i.test(content)) {
                converted = "대사새줄";
            } else if ((m = content.match(/^(?:continue|dialogue_continue|продолжить)(\s+)(.*)$/i))) {
                converted = `대사잇기${m[1]}${m[2]}`;
            } else if (/^(?:clear_dialogue|очистить_текст)$/i.test(content)) {
                converted = "대사지우기";
            } else if ((m = content.match(/^(?:text_size|font_size|размер_текста)(\s+)(.*)$/i))) {
                converted = `대사크기${m[1]}${m[2]}`;
            } else if (/^(?:hide_textbox|скрыть_окно)$/i.test(content)) {
                converted = "대사창감추기";
            } else if ((m = content.match(/^(?:dialogue_text_rect)(\s+)(.*)$/i))) {
                converted = `대사출력영역${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:dialogue_box_rect)(\s+)(.*)$/i))) {
                converted = `대사창영역${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_speed)(\s+)(.*)$/i))) {
                converted = `대사속도${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_shadow)(\s+)(.*)$/i))) {
                converted = `대사그림자${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_line_spacing)(\s+)(.*)$/i))) {
                converted = `대사줄간격${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_bold)(\s+)(.*)$/i))) {
                converted = `대사굵게${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_fade)(\s+)(.*)$/i))) {
                converted = `대사페이드${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_align)(\s+)(.*)$/i))) {
                converted = `대사정렬${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_shadow_color)(\s+)(.*)$/i))) {
                converted = `대사그림자색깔${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_color)(\s+)(.*)$/i))) {
                converted = `대사색깔${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:text_font)(\s+)(.*)$/i))) {
                converted = `대사폰트${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:textbox_skin)(\s+)(.*)$/i))) {
                converted = `대사창스킨${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:ignore_camera)(\s+)(.*)$/i))) {
                converted = `카메라무시${m[1]}${m[2]}`;
            }

            // 2. System & Memory
            else if (/^(?:save_state|game_state|сохранить_состояние)$/i.test(content)) {
                converted = "게임상태";
            } else if (/^(?:clear_all|очистить_все)$/i.test(content)) {
                converted = "모두지우기";
            } else if (/^(?:memory_reset|сброс_воспоминаний)$/i.test(content)) {
                converted = "회상초기화";
            } else if ((m = content.match(/^(?:memory_init)(\s+)(.*)$/i))) {
                converted = `회상첫설정${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:memory_set)(\s+)(.*)$/i))) {
                converted = `회상설정${m[1]}${m[2]}`;
            }

            // 3. Flow & Logic
            else if ((m = content.match(/^(?:delay|пауза|задержка)(\s+)(.*)$/i))) {
                converted = `딜레이${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:var|переменная)(\s+)(.*)$/i))) {
                converted = `변수${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:global_var)(\s+)(.*)$/i))) {
                converted = `정변수${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:label|bookmark|метка)(\s+)(.*)$/i))) {
                converted = `북마크${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:jump|прыжок|переход)(\s+)(.*)$/i))) {
                const rest = m[2];
                if (rest.endsWith(" start")) {
                    converted = `점프${m[1]}${rest.slice(0, -6)} 첫줄`;
                } else if (rest === "start") {
                    converted = `점프${m[1]}첫줄`;
                } else {
                    converted = `점프${m[1]}${rest}`;
                }
            } else if ((m = content.match(/^(?:if|если)(\s+)(.*)$/i))) {
                const rest = m[2].replace(/\s+goto\s+/i, " 여기 ");
                converted = `조건${m[1]}${rest}`;
            }

            // 4. Threads
            else if (/^(?:thread_start|запуск_потоков)$/i.test(content)) {
                converted = "쓰레드시작";
            } else if (/^(?:thread_wait|ожидание_потоков)$/i.test(content)) {
                converted = "쓰레드대기";
            } else if (/^(?:thread|end_thread|поток)$/i.test(content)) {
                converted = "쓰레드";
            } else if ((m = content.match(/^(?:thread|поток)(\s+)(.*)$/i))) {
                const sub = m[2];
                if (sub === "bgm_fadeout") {
                    converted = `쓰레드${m[1]}배경음악페이드아웃`;
                } else if (sub === "bgm_fadein") {
                    converted = `쓰레드${m[1]}배경음악페이드인`;
                } else {
                    converted = `쓰레드${m[1]}${sub}`;
                }
            }

            // 5. Visuals & Graphics
            else if ((m = content.match(/^(?:bg|фон)(\s+)(.*)$/i))) {
                converted = `배경${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:cg)(\s+)(.*)$/i))) {
                converted = `CG${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:rule_fadein)(\s+)(.*)$/i))) {
                converted = `배경룰페이드인${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:rule_fadeout)(\s+)(.*)$/i))) {
                converted = `배경룰페이드아웃${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:bg_fadein)(\s+)(.*)$/i))) {
                converted = `배경페이드인${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:bg_fadeout)(\s+)(.*)$/i))) {
                converted = `배경페이드아웃${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:scale|масштаб)(\s+)(.*)$/i))) {
                converted = `크기${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:move|движение)(\s+)(.*)$/i))) {
                converted = `이동${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:shake|тряска)(\s+)(.*)$/i))) {
                converted = `진동${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:rotate|поворот)(\s+)(.*)$/i))) {
                converted = `회전${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:layer_order)(\s+)(.*)$/i))) {
                converted = `출력순서${m[1]}${m[2]}`;
            }

            // 6. Fade in / Fade out
            else if ((m = content.match(/^(?:fadeout|затухание)(\s+)(.*)$/i))) {
                const sub = m[2];
                if (sub.startsWith("bgm ")) {
                    converted = `페이드아웃${m[1]}배경음악 ${sub.substring(4)}`;
                } else if (sub === "bgm") {
                    converted = `페이드아웃${m[1]}배경음악`;
                } else {
                    converted = `페이드아웃${m[1]}${sub}`;
                }
            } else if ((m = content.match(/^(?:fadein|появление)(\s+)(.*)$/i))) {
                const sub = m[2];
                if (sub.startsWith("bgm ")) {
                    converted = `페이드인${m[1]}배경음악 ${sub.substring(4)}`;
                } else if (sub === "bgm") {
                    converted = `페이드인${m[1]}배경음악`;
                } else {
                    converted = `페이드인${m[1]}${sub}`;
                }
            }

            // 7. Audio & Music
            else if ((m = content.match(/^(?:bgm|музыка)(\s+)(.*)$/i))) {
                const sub = m[2];
                if (sub.startsWith("loop ")) {
                    converted = `배경음악${m[1]}반복 ${sub.substring(5)}`;
                } else {
                    converted = `배경음악${m[1]}${sub}`;
                }
            } else if ((m = content.match(/^(?:sfx|звук)(\s+)(.*)$/i))) {
                const sub = m[2];
                if (sub.endsWith(" loop")) {
                    converted = `효과음${m[1]}${sub.slice(0, -5)} 반복`;
                } else {
                    converted = `효과음${m[1]}${sub}`;
                }
            } else if ((m = content.match(/^(?:voice|голос|озвучка)(\s+)(.*)$/i))) {
                converted = `보이스${m[1]}${m[2]}`;
            }

            // 8. Script Calls
            else if ((m = content.match(/^(?:call|script|скрипт|вызов)(\s+)(.*)$/i))) {
                const sub = m[2];
                if (sub.startsWith("대화창함수.txt fadeout_textbox")) {
                    converted = `스크립트${m[1]}대화창함수.txt 페이드아웃 대사창${sub.substring("대화창함수.txt fadeout_textbox".length)}`;
                } else if (sub.startsWith("대화창함수.txt fadein_textbox")) {
                    converted = `스크립트${m[1]}대화창함수.txt 페이드인 대사창${sub.substring("대화창함수.txt fadein_textbox".length)}`;
                } else if (sub.startsWith("이름.txt ")) {
                    const tag = sub.substring(7).toLowerCase();
                    if (NAME_MAP_EN_TO_KO[tag]) {
                        converted = `스크립트${m[1]}이름.txt ${NAME_MAP_EN_TO_KO[tag]}`;
                    } else {
                        converted = `스크립트${m[1]}${sub}`;
                    }
                } else if (sub.includes("clear_1000")) {
                    converted = `스크립트${m[1]}${sub.replace("clear_1000", "지우기1000")}`;
                } else {
                    converted = `스크립트${m[1]}${sub}`;
                }
            }

            // 9. UI & Buttons
            else if ((m = content.match(/^(?:key_event)(\s+)(.*)$/i))) {
                converted = `키처리${m[1]}${m[2]}`;
            } else if ((m = content.match(/^(?:system_button)(\s+)(.*)$/i))) {
                converted = `시스템버튼${m[1]}${m[2]}`;
            } else if (/^(?:remove_system_button)$/i.test(content)) {
                converted = "시스템버튼제거";
            } else if (/^(?:wait_button)$/i.test(content)) {
                converted = "버튼대기";
            } else if (/^(?:remove_button)$/i.test(content)) {
                converted = "버튼제거";
            } else if ((m = content.match(/^(?:button)(\s+)(.*)$/i))) {
                converted = `버튼${m[1]}${m[2]}`;
            }

            if (converted !== null) {
                out.push(indent + converted + (hasCr ? "\r" : ""));
            } else {
                out.push(raw);
            }
        }

        return out.join("\n");
    }

    // Translated display names for script files (shown in tree & tabs)
    const SCRIPT_NAME_MAP = {
        // Characters
        "루시.txt": { en: "Lucy.txt", ru: "Люси.txt" },
        "기박사.txt": { en: "Dr_Baek.txt", ru: "Доктор_Пэк.txt" },
        "박사1.txt": { en: "Dr_Baek_1.txt", ru: "Доктор_Пэк_1.txt" },
        "박사2.txt": { en: "Dr_Baek_2.txt", ru: "Доктор_Пэк_2.txt" },
        "박사3.txt": { en: "Dr_Baek_3.txt", ru: "Доктор_Пэк_3.txt" },
        "박사4.txt": { en: "Dr_Baek_4.txt", ru: "Доктор_Пэк_4.txt" },
        "박사5.txt": { en: "Dr_Baek_5.txt", ru: "Доктор_Пэк_5.txt" },
        "가게주인.txt": { en: "Shopkeeper.txt", ru: "Хозяин_магазина.txt" },
        "아버지.txt": { en: "Father.txt", ru: "Отец.txt" },
        "앤드류.txt": { en: "Andrew.txt", ru: "Эндрю.txt" },
        "청년.txt": { en: "Young_Man.txt", ru: "Молодой_человек.txt" },
        "이름.txt": { en: "Name_Tags.txt", ru: "Имена_персонажей.txt" },

        // System & Engine
        "기본셋팅.txt": { en: "Default_Settings.txt", ru: "Базовые_настройки.txt" },
        "대화창함수.txt": { en: "Textbox_Functions.txt", ru: "Функции_диалогового_окна.txt" },
        "도움말.txt": { en: "Help_Guide.txt", ru: "Справка_Помощь.txt" },
        "리셋질문.txt": { en: "Reset_Prompt.txt", ru: "Вопрос_о_сбросе.txt" },
        "빠른스킵.txt": { en: "Fast_Skip.txt", ru: "Быстрый_пропуск.txt" },
        "빠른스킵단축키.txt": { en: "Fast_Skip_Hotkey.txt", ru: "Горячая_клавиша_пропуска.txt" },
        "스킵멈춤.txt": { en: "Skip_Stop.txt", ru: "Остановка_пропуска.txt" },
        "스킵메뉴창.txt": { en: "Skip_Menu_Window.txt", ru: "Окно_меню_пропуска.txt" },
        "자동넘기기.txt": { en: "Auto_Forward.txt", ru: "Авточтение.txt" },
        "자동넘기기단축키.txt": { en: "Auto_Forward_Hotkey.txt", ru: "Горячая_клавиша_авточтения.txt" },
        "날짜.txt": { en: "Date_Display.txt", ru: "Отображение_даты.txt" },
        "앨범출력.txt": { en: "Album_Display.txt", ru: "Отображение_альбома.txt" },
        "우회용.txt": { en: "Bypass.txt", ru: "Обходной_путь.txt" },
        "텅빈.txt": { en: "Empty.txt", ru: "Пустой_скрипт.txt" },
        "타이틀.txt": { en: "Title_Menu.txt", ru: "Главное_меню.txt" },
        "크레딧.txt": { en: "Credits.txt", ru: "Титры.txt" },
        "코멘트.txt": { en: "Developer_Commentary.txt", ru: "Комментарии_разработчиков.txt" },

        // System UI & Menus
        "시스템_CG갤러리.txt": { en: "System_CG_Gallery.txt", ru: "Система_CG_Галерея.txt" },
        "시스템_CG갤러리_2.txt": { en: "System_CG_Gallery_2.txt", ru: "Система_CG_Галерея_2.txt" },
        "시스템_글리치질문.txt": { en: "System_Glitch_Prompt.txt", ru: "Система_Вопрос_о_глюке.txt" },
        "시스템_메세지박스.txt": { en: "System_Message_Box.txt", ru: "Система_Окно_сообщений.txt" },
        "시스템_불러오기.txt": { en: "System_Load_Menu.txt", ru: "Система_Загрузка.txt" },
        "시스템_업적.txt": { en: "System_Achievements.txt", ru: "Система_Достижения.txt" },
        "시스템_엑스트라.txt": { en: "System_Extras.txt", ru: "Система_Экстра.txt" },
        "시스템_옵션.txt": { en: "System_Options.txt", ru: "Система_Настройки.txt" },
        "시스템_저장하기.txt": { en: "System_Save_Menu.txt", ru: "Система_Сохранение.txt" },
        "시스템_키처리.txt": { en: "System_Key_Handling.txt", ru: "Система_Обработка_клавиш.txt" },
        "시스템_타이틀로.txt": { en: "System_To_Title.txt", ru: "Система_В_главное_меню.txt" },
        "시스템_회상.txt": { en: "System_Memories.txt", ru: "Система_Воспоминания.txt" },

        // Story & Extras
        "20년.txt": { en: "20_Years.txt", ru: "20_Лет.txt" },
        "로봇3원칙.txt": { en: "Three_Laws_Robotics.txt", ru: "Три_закона_робототехники.txt" },
        "시크릿.txt": { en: "Secret.txt", ru: "Секрет.txt" },
        "열쇠.txt": { en: "Key.txt", ru: "Ключ.txt" },
        "일기.txt": { en: "Diary.txt", ru: "Дневник.txt" },
        "지나가는빛.txt": { en: "Passing_Light.txt", ru: "Проходящий_свет.txt" },
        "지나가는빛트루엔딩.txt": { en: "Passing_Light_True_Ending.txt", ru: "Проходящий_свет_Истинный_финал.txt" },
        "초로의기억.txt": { en: "Memories_of_Old_Man.txt", ru: "Память_старика.txt" },
        "초로의기억스킵질문.txt": { en: "Old_Man_Skip_Prompt.txt", ru: "Пропуск_памяти_старика.txt" },

        // Menus
        "load_menu.txt": { en: "Load_Menu.txt", ru: "Меню_загрузки.txt" },
        "save_menu.txt": { en: "Save_Menu.txt", ru: "Меню_сохранения.txt" },
        "room_examine.txt": { en: "Room_Examine.txt", ru: "Осмотр_комнаты.txt" },
        "default.txt": { en: "Default.txt", ru: "По_умолчанию.txt" }
    };

    /**
     * Resolves human-friendly translated display name for a script file.
     * @param {string} realName 
     * @param {string} lang 'en' or 'ru'
     * @returns {string} Translated name or original
     */
    function getScriptDisplayName(realName, lang = "en") {
        if (!realName) return "";
        const entry = SCRIPT_NAME_MAP[realName];
        if (entry) {
            return (lang === "ru" ? entry.ru : entry.en) || entry.en || realName;
        }
        const chapMatch = realName.match(/^chapter(\d+)\.txt$/i);
        if (chapMatch) {
            return lang === "ru" ? `Глава_${chapMatch[1]}.txt` : `Chapter_${chapMatch[1]}.txt`;
        }
        return realName;
    }

    /**
     * Tooltip text showing original Korean filename on mouse hover.
     * @param {string} realName 
     * @param {string} lang 'en' or 'ru'
     * @returns {string} Tooltip string
     */
    function getScriptTooltip(realName, lang = "en") {
        if (!realName) return "";
        const isRu = lang === "ru";
        const entry = SCRIPT_NAME_MAP[realName];
        const chapMatch = realName.match(/^chapter(\d+)\.txt$/i);
        if (entry || chapMatch || /[\u3131-\uD79D]/.test(realName)) {
            return isRu ? `Оригинальный файл игры: ${realName}` : `Original game file: ${realName}`;
        }
        return realName;
    }

    return {
        koreanToVisual,
        visualToKorean,
        NAME_MAP_KO_TO_EN,
        NAME_MAP_EN_TO_KO,
        SCRIPT_NAME_MAP,
        getScriptDisplayName,
        getScriptTooltip
    };
})();

// Export for browser window and Node.js testing
if (typeof window !== "undefined") {
    window.SyntaxTranslator = SyntaxTranslator;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = SyntaxTranslator;
}
