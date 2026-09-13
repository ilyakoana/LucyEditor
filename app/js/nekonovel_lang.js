/**
 * LucyEditor - NekoNovel Language Definition for Monaco Editor
 * Provides Monarch Tokenizer, Autocomplete IntelliSense, Hover tooltips, and Snippets.
 */

const NEKONOVEL_COMMANDS = [
    // Dialogue & Text
    {
        name: "대사",
        korean: "대사",
        trans: "Диалог (Dialogue)",
        desc: "Выводит текст в диалоговое окно. После каждой реплики обязательно должна идти команда 대기.",
        snippet: "대사 ${1:Текст диалога...}\n대기",
        doc: "대사 [Текст]\nПример: 대사 Привет, Люси.\n대기",
        category: "dialogue"
    },
    {
        name: "대기",
        korean: "대기",
        trans: "Ожидание клика (Wait for input)",
        desc: "Приостанавливает выполнение скрипта до клика мышью или нажатия Пробела/Enter.",
        snippet: "대기",
        doc: "대기\nОбязательно после каждой реплики 대사, иначе текст промелькнет без остановки.",
        category: "dialogue"
    },
    {
        name: "대사새줄",
        korean: "대사새줄",
        trans: "Новая строка в диалоге (New Line)",
        desc: "Переносит строку внутри диалогового окна без очистки уже выведенного текста.",
        snippet: "대사새줄",
        doc: "대사새줄\nИспользуется вместе с 대사잇기 для многострочного текста.",
        category: "dialogue"
    },
    {
        name: "대사잇기",
        korean: "대사잇기",
        trans: "Продолжение текста (Continue Line)",
        desc: "Добавляет текст к текущему диалогу без очистки поля вывода.",
        snippet: "대사잇기 ${1:продолжение фразы...}\n대기",
        doc: "대사잇기 [Текст]\nПример: 대사새줄\n대사잇기 Вторая строка реплики.\n대기",
        category: "dialogue"
    },
    {
        name: "대사지우기",
        korean: "대사지우기",
        trans: "Очистить текст (Clear Text)",
        desc: "Очищает текущий текст в окне диалога.",
        snippet: "대사지우기",
        doc: "대사지우기\nСтирает текст в диалоговом окне.",
        category: "dialogue"
    },
    {
        name: "대사크기",
        korean: "대사크기",
        trans: "Размер шрифта диалога (Font Size)",
        desc: "Устанавливает размер шрифта текста диалога (по умолчанию 35).",
        snippet: "대사크기 ${1:35}",
        doc: "대사크기 [Размер]\nПример: 대사크기 50 (крупный) или 대사크기 35 (стандартный).",
        category: "dialogue"
    },
    {
        name: "대사창감추기",
        korean: "대사창감추기",
        trans: "Скрыть диалоговое окно (Hide Window)",
        desc: "Мгновенно скрывает диалоговое окно.",
        snippet: "대사창감추기",
        doc: "대사창감추기",
        category: "dialogue"
    },
    {
        name: "보이스",
        korean: "보이스",
        trans: "Озвучка реплики (Voice Clip)",
        desc: "Проигрывает аудиофайл озвучки для текущей реплики.",
        snippet: "보이스 ${1:lucy0001}.mp3",
        doc: "보이스 [файл.mp3]\nПример: 보이스 lucy0001_{{$언어}}.mp3",
        category: "audio"
    },

    // Character Names
    {
        name: "스크립트 이름.txt 주인공",
        korean: "스크립트 이름.txt 주인공",
        trans: "Имя: Главный герой",
        desc: "Устанавливает плашку имени говорящего: Главный герой.",
        snippet: "스크립트 이름.txt 주인공",
        doc: "스크립트 이름.txt 주인공\nОтображает имя главного героя в плашке.",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 루시",
        korean: "스크립트 이름.txt 루시",
        trans: "Имя: Люси (Lucy)",
        desc: "Устанавливает плашку имени говорящего: Люси.",
        snippet: "스크립트 이름.txt 루시",
        doc: "스크립트 이름.txt 루시\nОтображает имя «Люси».",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 안드로이드",
        korean: "스크립트 이름.txt 안드로이드",
        trans: "Имя: Андроид",
        desc: "Устанавливает плашку имени говорящего: Андроид.",
        snippet: "스크립트 이름.txt 안드로이드",
        doc: "스크립트 이름.txt 안드로이드",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 기박사",
        korean: "스크립트 이름.txt 기박사",
        trans: "Имя: Доктор Пэк (Dr. Baek)",
        desc: "Устанавливает плашку имени говорящего: Доктор Пэк.",
        snippet: "스크립트 이름.txt 기박사",
        doc: "스크립트 이름.txt 기박사",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 가게주인",
        korean: "스크립트 이름.txt 가게주인",
        trans: "Имя: Хозяин магазина",
        desc: "Устанавливает плашку имени говорящего: Хозяин магазина.",
        snippet: "스크립트 이름.txt 가게주인",
        doc: "스크립트 이름.txt 가게주인",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 아버지",
        korean: "스크립트 이름.txt 아버지",
        trans: "Имя: Отец",
        desc: "Устанавливает плашку имени: Отец.",
        snippet: "스크립트 이름.txt 아버지",
        doc: "스크립트 이름.txt 아버지",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 앤드류",
        korean: "스크립트 이름.txt 앤드류",
        trans: "Имя: Эндрю",
        desc: "Устанавливает плашку имени: Эндрю.",
        snippet: "스크립트 이름.txt 앤드류",
        doc: "스크립트 이름.txt 앤드류",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 청년",
        korean: "스크립트 이름.txt 청년",
        trans: "Имя: Молодой человек",
        desc: "Устанавливает плашку имени: Молодой человек.",
        snippet: "스크립트 이름.txt 청년",
        doc: "스크립트 이름.txt 청년",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 이름지우기",
        korean: "스크립트 이름.txt 이름지우기",
        trans: "Скрыть имя говорящего",
        desc: "Очищает плашку имени говорящего (для описаний/мыслей).",
        snippet: "스크립트 이름.txt 이름지우기",
        doc: "스크립트 이름.txt 이름지우기\nСкрывает плашку имени.",
        category: "names"
    },
    {
        name: "스크립트 이름.txt 이름지우기대사창",
        korean: "스크립트 이름.txt 이름지우기대사창",
        trans: "Скрыть имя и диалоговое окно",
        desc: "Одновременно скрывает имя и диалоговое окно.",
        snippet: "스크립트 이름.txt 이름지우기대사창",
        doc: "스크립트 이름.txt 이름지우기대사창",
        category: "names"
    },

    // Graphics & Visuals
    {
        name: "CG",
        korean: "CG",
        trans: "Показать изображение / CG / Спрайт",
        desc: "Загружает и отображает изображение или иллюстрацию на указанный слой.",
        snippet: "CG ${1:cg_id} ${2:filename.jpg}",
        doc: "CG [id] [файл] [x y transparent layer]\nПример: CG bg_neon01 bg_neon01.jpg",
        category: "visuals"
    },
    {
        name: "페이드인",
        korean: "페이드인",
        trans: "Плавное появление (Fade In)",
        desc: "Плавное появление объекта (CG, фона или звука) за указанное число миллисекунд.",
        snippet: "페이드인 ${1:cg_id} ${2:1500}",
        doc: "페이드인 [id] [миллисекунды]\nПример: 페이드인 bg_neon01 2000",
        category: "visuals"
    },
    {
        name: "페이드아웃",
        korean: "페이드아웃",
        trans: "Плавное исчезновение (Fade Out)",
        desc: "Плавное исчезновение объекта за указанное число миллисекунд.",
        snippet: "페이드아웃 ${1:cg_id} ${2:1500}",
        doc: "페이드아웃 [id] [миллисекунды]\nПример: 페이드아웃 bg_neon01 2000",
        category: "visuals"
    },
    {
        name: "배경",
        korean: "배경",
        trans: "Установить фон (Background)",
        desc: "Устанавливает фоновое изображение сцены.",
        snippet: "배경 ${1:bg_id} ${2:filename.jpg}",
        doc: "배경 [id] [файл.jpg]\nПример: 배경 bg_room01_day bg_room01_day.jpg",
        category: "visuals"
    },
    {
        name: "배경룰페이드인",
        korean: "배경룰페이드인",
        trans: "Переход с маской (Rule Transition Fade In)",
        desc: "Плавное появление фона с использованием графической маски/перехода (правила).",
        snippet: "배경룰페이드인 룰_${1:47}.png ${2:500}",
        doc: "배경룰페이드인 [файл_маски.png] [время_мс]\nПример: 배경룰페이드인 룰_47.png 500",
        category: "visuals"
    },
    {
        name: "배경룰페이드아웃",
        korean: "배경룰페이드아웃",
        trans: "Переход с маской (Rule Transition Fade Out)",
        desc: "Плавное затухание фона с использованием маски переходов.",
        snippet: "배경룰페이드아웃 룰_${1:20}.png ${2:500}",
        doc: "배경룰페이드아웃 [файл_маски.png] [время_мс]",
        category: "visuals"
    },
    {
        name: "크기",
        korean: "크기",
        trans: "Масштабирование (Scale)",
        desc: "Изменяет размер/масштаб графического объекта.",
        snippet: "크기 ${1:cg_id} ${2:1} ${3:1}",
        doc: "크기 [id] [scaleX] [scaleY] [время_мс]",
        category: "visuals"
    },
    {
        name: "이동",
        korean: "이동",
        trans: "Перемещение объекта (Move)",
        desc: "Плавно перемещает графический объект в заданные координаты.",
        snippet: "이동 ${1:cg_id} ${2:0} ${3:0} ${4:1000} ${5:0}",
        doc: "이동 [id] [x] [y] [время_мс] [layer]",
        category: "visuals"
    },
    {
        name: "진동",
        korean: "진동",
        trans: "Вибрация / Тряска (Shake)",
        desc: "Эффект тряски экрана или конкретного объекта.",
        snippet: "진동 ${1:{{루시}}} ${2:3} ${3:1} ${4:1500} ${5:800}",
        doc: "진동 [id] [силаX] [силаY] [время_мс] [скорость]",
        category: "visuals"
    },

    // Audio
    {
        name: "배경음악",
        korean: "배경음악",
        trans: "Фоновая музыка (BGM)",
        desc: "Воспроизводит фоновую музыку (обычно с флагом '반복' для зацикливания).",
        snippet: "배경음악 반복 ${1:kyoumei}.mp3",
        doc: "배경음악 반복 [файл.mp3]\nПример: 배경음악 반복 free0257.mp3",
        category: "audio"
    },
    {
        name: "효과음",
        korean: "효과음",
        trans: "Звуковой эффект (SFX)",
        desc: "Проигрывает одиночный звуковой эффект.",
        snippet: "효과음 ${1:sfx_id} ${2:sound}.mp3",
        doc: "효과음 [id] [файл.mp3] [반복]\nПример: 효과음 crowd crowd.mp3 반복",
        category: "audio"
    },
    {
        name: "페이드아웃 배경음악",
        korean: "페이드아웃 배경음악",
        trans: "Затухание музыки (Fade Out BGM)",
        desc: "Плавно глушит фоновую музыку за указанное число миллисекунд.",
        snippet: "페이드아웃 배경음악 ${1:2000}",
        doc: "페이드아웃 배경음악 [миллисекунды]\nПример: 페이드아웃 배경음악 2000",
        category: "audio"
    },
    {
        name: "페이드인 배경음악",
        korean: "페이드인 배경음악",
        trans: "Плавное нарастание музыки (Fade In BGM)",
        desc: "Плавно начинает играть музыку.",
        snippet: "페이드인 배경음악 ${1:1500}",
        doc: "페이드인 배경음악 [миллисекунды]",
        category: "audio"
    },

    // Flow & Logic
    {
        name: "딜레이",
        korean: "딜레이",
        trans: "Задержка / Пауза (Delay)",
        desc: "Приостанавливает выполнение скрипта на указанное количество миллисекунд.",
        snippet: "딜레이 ${1:1000}",
        doc: "딜레이 [миллисекунды]\nПример: 딜레이 1500 (пауза 1.5 секунды)",
        category: "flow"
    },
    {
        name: "북마크",
        korean: "북마크",
        trans: "Метка / Закладка (Bookmark / Label)",
        desc: "Создает метку перехода для команд '점프' и выборов.",
        snippet: "북마크 ${1:метка}",
        doc: "북마크 [имя_метки]\nПример: 북마크 выбор_1",
        category: "flow"
    },
    {
        name: "점프",
        korean: "점프",
        trans: "Переход (Jump)",
        desc: "Переходит к указанной метке в текущем файле или другом скрипте.",
        snippet: "점프 ${1:файл.txt} ${2:метка}",
        doc: "점프 [файл.txt] [метка] или 점프 [метка]\nПример: 점프 chapter2.txt 첫줄",
        category: "flow"
    },
    {
        name: "변수",
        korean: "변수",
        trans: "Переменная (Variable)",
        desc: "Задает значение переменной скрипта.",
        snippet: "변수 ${1:имя} = ${2:значение}",
        doc: "변수 [имя] = [значение]\nПример: 변수 chapter = 01 или 변수 $버려진로봇트로피 = 1",
        category: "flow"
    },
    {
        name: "조건",
        korean: "조건",
        trans: "Условие (If Condition)",
        desc: "Условный переход или выполнение действия при совпадении условий.",
        snippet: "조건 ${1:$переменная} = ${2:1} 여기 ${3:метка}",
        doc: "조건 [переменная] = [значение] 여기 [метка]\nПример: 조건 $trophy = 1 여기 next_scene",
        category: "flow"
    },

    // Threads
    {
        name: "쓰레드",
        korean: "쓰레드",
        trans: "Поток / Параллельное действие (Thread)",
        desc: "Объявляет параллельное действие (например, одновременное движение и фейд). Завершается еще одной командой 쓰레드.",
        snippet: "쓰레드 ${1:thread_name}\n${2:// команды внутри потока}\n쓰레드",
        doc: "쓰레드 [имя]\n...\n쓰레드\n쓰레드시작",
        category: "threads"
    },
    {
        name: "쓰레드시작",
        korean: "쓰레드시작",
        trans: "Запуск параллельных потоков (Start Threads)",
        desc: "Запускает выполнение всех ранее объявленных потоков.",
        snippet: "쓰레드시작",
        doc: "쓰레드시작",
        category: "threads"
    },

    // System
    {
        name: "스크립트",
        korean: "스크립트",
        trans: "Вызов скрипта / функции (Call Script)",
        desc: "Выполняет другой скрипт как подпрограмму.",
        snippet: "스크립트 ${1:대화창함수.txt}",
        doc: "스크립트 [файл.txt] [аргументы]\nПример: 스크립트 대화창함수.txt 페이드인 대사창 500",
        category: "system"
    },
    {
        name: "모두지우기",
        korean: "모두지우기",
        trans: "Очистить всё на экране (Clear All)",
        desc: "Удаляет все графические элементы, фон и текст со сцены.",
        snippet: "모두지우기",
        doc: "모두지우기",
        category: "system"
    },
    {
        name: "게임상태",
        korean: "게임상태",
        trans: "Сохранить игровое состояние",
        desc: "Обновляет контрольную точку сохранения игрового состояния.",
        snippet: "게임상태",
        doc: "게임상태",
        category: "system"
    }
];

/**
 * Registers NekoNovel language support into Monaco.
 */
function registerNekoNovelLanguage(monaco) {
    // 1. Register language ID
    monaco.languages.register({ id: "nekonovel" });

    // 2. Set Monarch syntax tokens
    monaco.languages.setMonarchTokensProvider("nekonovel", {
        defaultToken: "text",
        dialogueKeywords: ["대사", "대기", "대사새줄", "대사잇기", "대사지우기", "대사크기", "대사창감추기", "대사창영역", "대사출력영역", "dialogue", "say", "wait", "newline", "continue", "clear_dialogue", "text_size", "hide_textbox", "dialogue_text_rect", "dialogue_box_rect"],
        visualKeywords: ["CG", "배경", "페이드인", "페이드아웃", "배경룰페이드인", "배경룰페이드아웃", "배경페이드인", "배경페이드아웃", "크기", "이동", "진동", "회전", "출력순서", "스프라이트", "GIF스프라이트", "cg", "bg", "fadein", "fadeout", "rule_fadein", "rule_fadeout", "bg_fadein", "bg_fadeout", "scale", "move", "shake", "rotate", "layer_order"],
        audioKeywords: ["배경음악", "효과음", "보이스", "재생", "일시정지", "정지", "bgm", "sfx", "voice", "play", "pause", "stop"],
        flowKeywords: ["딜레이", "점프", "북마크", "변수", "정변수", "조건", "타이머", "시작위치", "종료", "delay", "jump", "label", "bookmark", "var", "global_var", "if", "timer"],
        threadKeywords: ["쓰레드", "쓰레드시작", "쓰레드대기", "thread", "thread_start", "thread_wait", "end_thread"],
        systemKeywords: ["스크립트", "모두지우기", "시스템버튼", "시스템버튼제거", "버튼", "버튼대기", "버튼제거", "라벨", "라벨속성", "키처리", "게임상태", "회상초기화", "회상첫설정", "회상설정", "call", "script", "save_state", "clear_all", "memory_reset", "memory_init", "memory_set", "key_event", "system_button", "remove_system_button", "wait_button", "remove_button"],

        tokenizer: {
            root: [
                // Comments
                [/\/\/.*$/, "comment"],

                // Variables like {{$skin}} or {{캐릭명}}
                [/\{\{[^\}]+\}\}/, "variable.special"],
                [/\$[a-zA-Z0-9_\uAC00-\uD7A3]+/, "variable.predefined"],

                // File references (ending in .txt, .jpg, .png, .mp3, etc.)
                [/[a-zA-Z0-9_\-\uAC00-\uD7A3]+\.(txt|jpg|jpeg|png|mp3|ogg|xml)/, "string.file"],

                // Quotes
                [/"[^"]*"/, "string.quoted"],
                [/“[^”]*”/, "string.dialogue"],
                [/'[^']*'/, "string.quoted"],

                // Numbers and timing (e.g. 1500, -130)
                [/-?\b\d+\b/, "number"],

                // Operators
                [/(=|==|!=|<|>|<=|>=)/, "operator"],

                // Keywords matching (Korean + English Visual keywords)
                [/대사잇기|대사새줄|대사지우기|대사크기|대사창감추기|대사|대기|\b(dialogue|say|wait|newline|continue|clear_dialogue|text_size|hide_textbox)\b/, "keyword.dialogue"],
                [/배경룰페이드인|배경룰페이드아웃|배경페이드인|배경페이드아웃|페이드인|페이드아웃|배경|CG|스프라이트|크기|이동|진동|\b(rule_fadein|rule_fadeout|bg_fadein|bg_fadeout|fadein|fadeout|bg|cg|scale|move|shake|rotate|layer_order)\b/, "keyword.visual"],
                [/배경음악|효과음|보이스|재생|일시정지|정지|\b(bgm|sfx|voice|play|pause|stop)\b/, "keyword.audio"],
                [/딜레이|점프|북마크|변수|정변수|조건|타이머|종료|\b(delay|jump|label|bookmark|var|global_var|if|timer)\b/, "keyword.flow"],
                [/쓰레드시작|쓰레드대기|쓰레드|\b(thread_start|thread_wait|thread|end_thread)\b/, "keyword.thread"],
                [/스크립트|모두지우기|시스템버튼|버튼|키처리|게임상태|\b(call|script|clear_all|save_state|memory_reset|memory_init|memory_set|key_event|system_button|remove_system_button|wait_button|remove_button)\b/, "keyword.system"],

                // Common parameters (e.g. 주인공, 루시, 아니, 반복, 첫줄 and English tokens)
                [/주인공|루시|기박사|가게주인|안드로이드|아버지|앤드류|청년|이름지우기|이름지우기대사창|반복|아니|첫줄|여기|\b(protagonist|protagonist1|lucy|lucy1|dr_baek|shopkeeper|android|father|andrew|young_man|clear_name|hide_name_and_box|clear_name_and_char|start|loop|goto)\b/, "type.identifier"]
            ]
        }
    });

    // 3. Define language configuration (comments, brackets)
    monaco.languages.setLanguageConfiguration("nekonovel", {
        comments: {
            lineComment: "//"
        },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"]
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: '“', close: '”' },
            { open: "'", close: "'" }
        ]
    });

    // 4. Register Autocomplete (IntelliSense)
    monaco.languages.registerCompletionItemProvider("nekonovel", {
        provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const isEnglishSyntax = typeof window !== "undefined" && window.lucyApp ? window.lucyApp.syntaxMode === "english" : true;

            const suggestions = [];

            for (const cmd of NEKONOVEL_COMMANDS) {
                const visualSnippet = typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(cmd.snippet) : cmd.snippet;
                const visualName = typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(cmd.name).split(/\s+/)[0] : cmd.name;

                if (isEnglishSyntax && visualName) {
                    suggestions.push({
                        label: visualName,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        detail: `(Visual) ${cmd.trans} [${cmd.korean}]`,
                        documentation: {
                            value: `**${visualName}** (Korean: \`${cmd.korean}\`)\n\n${cmd.desc}\n\n\`\`\`nekonovel\n${typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(cmd.doc) : cmd.doc}\n\`\`\``
                        },
                        insertText: visualSnippet,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range
                    });
                }

                // Always allow typing Korean too
                suggestions.push({
                    label: cmd.korean,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    detail: `${cmd.trans} — ${cmd.name}`,
                    documentation: {
                        value: `**${cmd.name}**\n\n${cmd.desc}\n\n\`\`\`nekonovel\n${cmd.doc}\n\`\`\``
                    },
                    insertText: isEnglishSyntax ? visualSnippet : cmd.snippet,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range
                });
            }

            // Common snippets
            if (isEnglishSyntax) {
                suggestions.push({
                    label: "dialogue_block",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: "Dialogue Block (with speaker and wait)",
                    documentation: "Inserts a dialogue line with speaker tag and required wait.",
                    insertText: 'call 이름.txt ${1|protagonist,lucy,dr_baek,clear_name|}\ndialogue "${2:Hello world!}"\nwait',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range
                });

                suggestions.push({
                    label: "scene_transition",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: "Scene Transition",
                    documentation: "Fades out textbox, changes background, and fades back in.",
                    insertText: "call 대화창함수.txt fadeout_textbox 500\nfadeout ${1:bg_current} 1500\ndelay 500\nbg ${2:bg_new} ${3:bg_new.jpg}\nfadein ${2:bg_new} 1500\ncall 대화창함수.txt fadein_textbox 500",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range
                });
            } else {
                suggestions.push({
                    label: "dialogue_block",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: "Блок диалога с именем (Dialogue Block)",
                    documentation: "Вставляет реплику с указанием говорящего и обязательным 대기.",
                    insertText: '스크립트 이름.txt ${1|주인공,루시,기박사,이름지우기|}\n대사 "${2:Привет, мир!}"\n대기',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range
                });

                suggestions.push({
                    label: "scene_transition",
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    detail: "Плавный переход между сценами (Scene Transition)",
                    documentation: "Затухание старого фона, установка нового фона и появление.",
                    insertText: "스크립트 대화창함수.txt 페이드아웃 대사창 500\n페이드아웃 ${1:bg_current} 1500\n딜레이 500\n배경 ${2:bg_new} ${3:bg_new.jpg}\n페이드인 ${2:bg_new} 1500\n스크립트 대화창함수.txt 페이드인 대사창 500",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: range
                });
            }

            return { suggestions };
        }
    });

    // 5. Register Hover tooltips
    monaco.languages.registerHoverProvider("nekonovel", {
        provideHover: (model, position) => {
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const wordLower = word.word.toLowerCase();
            const cmd = NEKONOVEL_COMMANDS.find(c => {
                if (c.korean.includes(word.word) || c.name.includes(word.word)) return true;
                if (typeof SyntaxTranslator !== "undefined") {
                    const vis = SyntaxTranslator.koreanToVisual(c.korean);
                    if (vis.toLowerCase().includes(wordLower)) return true;
                }
                return false;
            });

            if (cmd) {
                const isEnglishSyntax = typeof window !== "undefined" && window.lucyApp ? window.lucyApp.syntaxMode === "english" : true;
                const docText = isEnglishSyntax && typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(cmd.doc) : cmd.doc;
                const displayName = isEnglishSyntax && typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(cmd.name) : cmd.name;

                return {
                    range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                    contents: [
                        { value: `**${displayName}** (${cmd.korean}) — *${cmd.trans}*` },
                        { value: cmd.desc },
                        { value: `\`\`\`nekonovel\n${docText}\n\`\`\`` }
                    ]
                };
            }
            return null;
        }
    });

    // 6. Define Custom Cyberpunk Theme for NekoNovel
    monaco.editor.defineTheme("lucyCyberDark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "64748b", fontStyle: "italic" },
            { token: "keyword.dialogue", foreground: "38bdf8", fontStyle: "bold" },
            { token: "keyword.visual", foreground: "c084fc", fontStyle: "bold" },
            { token: "keyword.audio", foreground: "34d399", fontStyle: "bold" },
            { token: "keyword.flow", foreground: "f59e0b", fontStyle: "bold" },
            { token: "keyword.thread", foreground: "f43f5e", fontStyle: "bold" },
            { token: "keyword.system", foreground: "818cf8" },
            { token: "variable.special", foreground: "fbbf24", fontStyle: "bold" },
            { token: "variable.predefined", foreground: "f97316" },
            { token: "string.file", foreground: "67e8f9" },
            { token: "string.dialogue", foreground: "f1f5f9" },
            { token: "string.quoted", foreground: "a7f3d0" },
            { token: "number", foreground: "f472b6" },
            { token: "type.identifier", foreground: "93c5fd" }
        ],
        colors: {
            "editor.background": "#0b0f19",
            "editor.foreground": "#e2e8f0",
            "editor.lineHighlightBackground": "#1e293b55",
            "editorLineNumber.foreground": "#475569",
            "editorLineNumber.activeForeground": "#38bdf8",
            "editorCursor.foreground": "#38bdf8",
            "editor.selectionBackground": "#38bdf833",
            "editor.inactiveSelectionBackground": "#38bdf81a"
        }
    });
}
