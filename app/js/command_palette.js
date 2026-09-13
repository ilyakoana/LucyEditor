/**
 * LucyEditor - Redesigned Visual Command Palette
 * Features prominent Quick Insert hero cards at top, instant filter search,
 * and clean collapsible category accordions with bilingual EN/RU support.
 */

const QUICK_HERO_COMMANDS = [
    {
        icon: "💬",
        title_en: "Dialogue Line",
        title_ru: "Реплика диалога",
        badge: "대사 + 대기",
        code: '대사 "Your dialogue line here."\n대기'
    },
    {
        icon: "👤",
        title_en: "Name: Protagonist",
        title_ru: "Имя: Главный герой",
        badge: "주인공",
        code: "스크립트 이름.txt 주인공"
    },
    {
        icon: "🎀",
        title_en: "Name: Lucy",
        title_ru: "Имя: Люси",
        badge: "루시",
        code: "스크립트 이름.txt 루시"
    },
    {
        icon: "🖼️",
        title_en: "Change Background",
        title_ru: "Смена фона + Fade",
        badge: "배경 + 페이드인",
        code: "배경 bg_room01_day bg_room01_day.jpg\n페이드인 bg_room01_day 1500"
    },
    {
        icon: "🎵",
        title_en: "Play BGM (Loop)",
        title_ru: "Включить музыку",
        badge: "배경음악 반복",
        code: "배경음악 반복 kyoumei.mp3"
    },
    {
        icon: "⏱️",
        title_en: "Delay (1 sec)",
        title_ru: "Пауза (1 сек)",
        badge: "딜레이 1000",
        code: "딜레이 1000"
    }
];

const ACCORDION_CATEGORIES = [
    {
        id: "dialogue",
        name_en: "💬 Dialogue & Text",
        name_ru: "💬 Диалоги и Текст",
        items: [
            {
                title_en: "Standard Dialogue Line",
                title_ru: "Обычная реплика с кликом",
                desc_en: "Displays text and waits for player click",
                desc_ru: "Выводит текст и ждёт клика игрока",
                code: '대사 "Dialogue text here."\n대기'
            },
            {
                title_en: "Multi-line Dialogue",
                title_ru: "Многострочный диалог",
                desc_en: "Two lines with new line break",
                desc_ru: "Две реплики подряд с переносом строки",
                code: "대사 First sentence.\n대기\n대사새줄\n대사잇기 Second sentence on new line.\n대기"
            },
            {
                title_en: "Internal Thought (No Name)",
                title_ru: "Мысли героя (без имени)",
                desc_en: "Protagonist thought without name tag",
                desc_ru: "Мысли главного героя без плашки имени",
                code: "스크립트 이름.txt 이름지우기\n대사 (I thought about that for a second...)\n대기"
            },
            {
                title_en: "Clear Dialogue Box",
                title_ru: "Очистить диалоговое окно",
                desc_en: "Clears current text in box",
                desc_ru: "Удаляет текущий текст из окна",
                code: "대사지우기"
            },
            {
                title_en: "Large Font Emphasis",
                title_ru: "Крупный шрифт (акцент)",
                desc_en: "Enlarges font size to 50px",
                desc_ru: "Увеличивает шрифт до 50px",
                code: "대사크기 50\n대사 Look out!\n대기\n대사크기 35"
            }
        ]
    },
    {
        id: "names",
        name_en: "👤 Character Name Tags",
        name_ru: "👤 Имена персонажей",
        items: [
            { title_en: "Protagonist", title_ru: "Главный герой", desc_en: "Sets speaker: Protagonist", desc_ru: "Плашка имени: Главный герой", code: "스크립트 이름.txt 주인공" },
            { title_en: "Lucy", title_ru: "Люси", desc_en: "Sets speaker: Lucy", desc_ru: "Плашка имени: Люси", code: "스크립트 이름.txt 루시" },
            { title_en: "Dr. Baek", title_ru: "Доктор Пэк", desc_en: "Sets speaker: Dr. Baek", desc_ru: "Плашка имени: Доктор Пэк", code: "스크립트 이름.txt 기박사" },
            { title_en: "Shopkeeper", title_ru: "Хозяин магазина", desc_en: "Sets speaker: Shopkeeper", desc_ru: "Плашка имени: Хозяин магазина", code: "스크립트 이름.txt 가게주인" },
            { title_en: "Android", title_ru: "Андроид", desc_en: "Sets speaker: Android", desc_ru: "Плашка имени: Андроид", code: "스크립트 이름.txt 안드로이드" },
            { title_en: "Clear Name Tag", title_ru: "Скрыть имя говорящего", desc_en: "Clears speaker badge", desc_ru: "Очищает плашку имени", code: "스크립트 이름.txt 이름지우기" },
            { title_en: "Hide Name & Box", title_ru: "Скрыть имя и окно", desc_en: "Hides both name badge and textbox", desc_ru: "Убирает имя и сворачивает диалоговое окно", code: "스크립트 이름.txt 이름지우기대사창" }
        ]
    },
    {
        id: "visuals",
        name_en: "🖼️ Visuals, CG & Backgrounds",
        name_ru: "🖼️ Изображения и CG",
        items: [
            {
                title_en: "Change Background + Fade",
                title_ru: "Смена фона + Fade-in",
                desc_en: "Loads background and smoothly fades in",
                desc_ru: "Устанавливает фоновую картинку с плавным появлением",
                code: "배경 bg_room01_day bg_room01_day.jpg\n페이드인 bg_room01_day 1500"
            },
            {
                title_en: "Show Event CG Illustration",
                title_ru: "Показать иллюстрацию CG",
                desc_en: "Loads CG illustration on event layer",
                desc_ru: "Загружает сюжетную иллюстрацию на экран",
                code: "CG ev01_1 ev01_1.jpg 0 0 아니 -198\n페이드인 ev01_1 2000"
            },
            {
                title_en: "Fade Out Object",
                title_ru: "Скрыть объект (Fade-out)",
                desc_en: "Fades out an image over 1.5 seconds",
                desc_ru: "Плавное затухание объекта за 1.5 секунды",
                code: "페이드아웃 image_id 1500"
            },
            {
                title_en: "Rule Mask Transition",
                title_ru: "Переход с графической маской",
                desc_en: "Transition using a rule mask image",
                desc_ru: "Художественный переход смены кадра шторкой",
                code: "배경룰페이드인 룰_47.png 500"
            },
            {
                title_en: "Screen Shake / Vibrate",
                title_ru: "Тряска экрана / Вибрация",
                desc_en: "Shake effect for impacts/shock",
                desc_ru: "Эффект удара или потрясения",
                code: "진동 {{루시}} 3 1 1500 800"
            },
            {
                title_en: "Full Scene Transition",
                title_ru: "Полный переход сцены",
                desc_en: "Fade out box, change BG, and fade in box",
                desc_ru: "Скрытие окна, смена фона и возвращение окна",
                code: "스크립트 대화창함수.txt 페이드아웃 대사창 500\n페이드아웃 bg_current 1500\n딜레이 500\n배경 bg_neon01 bg_neon01.jpg\n페이드인 bg_neon01 2000\n스크립트 대화창함수.txt 페이드인 대사창 500"
            }
        ]
    },
    {
        id: "audio",
        name_en: "🎵 Music & Sound Effects",
        name_ru: "🎵 Музыка и Звуки",
        items: [
            {
                title_en: "Play Looped BGM",
                title_ru: "Включить музыку (Loop)",
                desc_en: "Plays background music on loop",
                desc_ru: "Зацикленное воспроизведение BGM",
                code: "배경음악 반복 kyoumei.mp3"
            },
            {
                title_en: "Fade Out BGM",
                title_ru: "Плавное затухание музыки",
                desc_en: "Fades out music over 2 seconds",
                desc_ru: "Глушит музыку за 2 секунды",
                code: "페이드아웃 배경음악 2000"
            },
            {
                title_en: "Play Sound Effect (SFX)",
                title_ru: "Звуковой эффект (SFX)",
                desc_en: "Plays one-shot sound clip",
                desc_ru: "Однократный звук (стук, щелчок, шум)",
                code: "효과음 confirm UISCI-FIConfirmWet.mp3"
            },
            {
                title_en: "Ambient Crowd SFX (Loop)",
                title_ru: "Зацикленный шум окружения",
                desc_en: "Looped ambient sound effect",
                desc_ru: "Например, шум толпы на улице",
                code: "효과음 crowd crowd.mp3 반복"
            }
        ]
    },
    {
        id: "flow",
        name_en: "⏱️ Logic, Branches & Bookmarks",
        name_ru: "⏱️ Логика, Паузы и Ветвление",
        items: [
            {
                title_en: "Pause / Delay (1.5 sec)",
                title_ru: "Задержка / Пауза (1.5 сек)",
                desc_en: "Pauses execution for 1500 ms",
                desc_ru: "Приостанавливает выполнение на 1500 мс",
                code: "딜레이 1500"
            },
            {
                title_en: "Create Bookmark / Label",
                title_ru: "Создать метку / Закладку",
                desc_en: "Target label for jumps and branching",
                desc_ru: "Точка перехода для команд 점프 и выборов",
                code: "북마크 choice_branch_1"
            },
            {
                title_en: "Jump to Label",
                title_ru: "Переход к метке (Jump)",
                desc_en: "Jumps to bookmark in same file",
                desc_ru: "Мгновенный переход к указанной метке",
                code: "점프 choice_branch_1"
            },
            {
                title_en: "Jump to Another Script",
                title_ru: "Переход в другой скрипт",
                desc_en: "Opens script file and jumps to label",
                desc_ru: "Открывает другой файл и начинает с указанной метки",
                code: "점프 chapter2.txt 첫줄"
            },
            {
                title_en: "Set Variable",
                title_ru: "Установить переменную",
                desc_en: "Sets value of script variable",
                desc_ru: "Задает значение флага или переменной",
                code: "변수 $met_lucy = 1"
            },
            {
                title_en: "Conditional Jump (If)",
                title_ru: "Условный переход (If)",
                desc_en: "Jumps to label if variable matches condition",
                desc_ru: "Переход к метке при истинности условия",
                code: "조건 $met_lucy = 1 여기 choice_branch_1"
            },
            {
                title_en: "Unlock Achievement Trophy",
                title_ru: "Разблокировать трофей",
                desc_en: "Unlocks Steam achievement variable",
                desc_ru: "Выдает ачивку игроку",
                code: "변수 $버려진로봇트로피 = 1"
            }
        ]
    },
    {
        id: "threads",
        name_en: "⚡ Parallel Threads",
        name_ru: "⚡ Параллельные потоки",
        items: [
            {
                title_en: "Thread Block",
                title_ru: "Параллельный блок (Thread)",
                desc_en: "Executes animations in parallel with dialogue",
                desc_ru: "Выполняет анимацию параллельно с текстом",
                code: "쓰레드 anim_fade\n페이드아웃 current_cg 1000\n딜레이 500\n페이드인 new_cg 1000\n쓰레드\n쓰레드시작"
            }
        ]
    },
    {
        id: "system",
        name_en: "🪟 Dialogue Window & UI",
        name_ru: "🪟 Окно диалога и Экран",
        items: [
            {
                title_en: "Fade In Dialogue Box",
                title_ru: "Плавно показать окно диалога",
                desc_en: "Smoothly shows textbox",
                desc_ru: "Вызывает анимацию появления окна диалога",
                code: "스크립트 대화창함수.txt 페이드인 대사창 500"
            },
            {
                title_en: "Fade Out Dialogue Box",
                title_ru: "Плавно скрыть окно диалога",
                desc_en: "Smoothly hides textbox",
                desc_ru: "Вызывает анимацию исчезновения окна диалога",
                code: "스크립트 대화창함수.txt 페이드아웃 대사창 500"
            },
            {
                title_en: "Clear Entire Screen",
                title_ru: "Очистить всё на экране",
                desc_en: "Removes all CGs, backgrounds, and text",
                desc_ru: "Удаляет все спрайты, фоны и текст",
                code: "모두지우기"
            },
            {
                title_en: "Save Game State",
                title_ru: "Сохранить игровое состояние",
                desc_en: "Updates game checkpoint",
                desc_ru: "Контрольная точка сохранения",
                code: "게임상태"
            }
        ]
    }
];

function renderCommandPalette(containerId, filterQuery = "") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isRu = typeof currentLocale !== "undefined" && currentLocale === "ru";
    const q = filterQuery.toLowerCase().trim();

    let html = `
        <!-- Hero Quick Actions -->
        <div class="cmd-quick-section">
            <div class="cmd-quick-header">
                <span>⚡</span>
                <span>${isRu ? "Быстрые действия" : "Quick Insert"}</span>
            </div>
            <div class="cmd-quick-grid">
    `;

    const isEnglishSyntax = typeof window !== "undefined" && window.lucyApp ? window.lucyApp.syntaxMode === "english" : true;

    for (const h of QUICK_HERO_COMMANDS) {
        const title = isRu ? h.title_ru : h.title_en;
        const badge = isEnglishSyntax && typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(h.badge) : h.badge;
        html += `
            <button class="cmd-hero-card" data-code="${encodeURIComponent(h.code)}">
                <span class="cmd-hero-icon">${h.icon}</span>
                <div class="cmd-hero-info">
                    <span class="cmd-hero-title">${title}</span>
                    <span class="cmd-hero-badge">${badge}</span>
                </div>
            </button>
        `;
    }

    html += `
            </div>
        </div>

        <!-- Filter Search Bar -->
        <div class="cmd-filter-bar">
            <input type="text" id="cmd-filter-input" class="search-input" value="${filterQuery}" placeholder="${isRu ? 'Поиск по всем командам...' : 'Filter all commands...'}" />
        </div>

        <!-- Collapsible Categories -->
        <div class="cmd-accordion-container">
    `;

    for (const cat of ACCORDION_CATEGORIES) {
        const catName = isRu ? cat.name_ru : cat.name_en;
        const matchingItems = cat.items.filter(item => {
            if (!q) return true;
            const tEn = item.title_en.toLowerCase();
            const tRu = item.title_ru.toLowerCase();
            const dEn = item.desc_en.toLowerCase();
            const dRu = item.desc_ru.toLowerCase();
            const c = item.code.toLowerCase();
            return tEn.includes(q) || tRu.includes(q) || dEn.includes(q) || dRu.includes(q) || c.includes(q);
        });

        if (q && matchingItems.length === 0) continue;

        const isExpanded = !!q; // auto expand if searching

        html += `
            <div class="cmd-accordion-group ${isExpanded ? 'open' : ''}">
                <button class="cmd-accordion-header">
                    <span>${catName}</span>
                    <span class="cmd-accordion-badge">${matchingItems.length}</span>
                </button>
                <div class="cmd-accordion-body" style="${isExpanded ? 'display: block;' : ''}">
        `;

        for (const item of matchingItems) {
            const title = isRu ? item.title_ru : item.title_en;
            const desc = isRu ? item.desc_ru : item.desc_en;

            html += `
                <button class="cmd-btn" data-code="${encodeURIComponent(item.code)}">
                    <div class="cmd-btn-title">${title}</div>
                    <div class="cmd-btn-desc">${desc}</div>
                </button>
            `;
        }

        html += `
                </div>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Attach listeners
    container.querySelectorAll(".cmd-hero-card, .cmd-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const code = decodeURIComponent(btn.getAttribute("data-code"));
            insertSnippetAtCursor(code);
            showToast(isRu ? "Команда вставлена в скрипт!" : "Command inserted into script!", "success");
        });
    });

    // Accordion toggle
    container.querySelectorAll(".cmd-accordion-header").forEach(hdr => {
        hdr.addEventListener("click", () => {
            const group = hdr.parentElement;
            group.classList.toggle("open");
            const body = group.querySelector(".cmd-accordion-body");
            if (body) {
                body.style.display = group.classList.contains("open") ? "block" : "none";
            }
        });
    });

    // Filter input
    const filterInput = document.getElementById("cmd-filter-input");
    if (filterInput) {
        filterInput.addEventListener("input", (e) => {
            renderCommandPalette(containerId, e.target.value);
            // restore focus & cursor
            const restored = document.getElementById("cmd-filter-input");
            if (restored) {
                restored.focus();
                restored.selectionStart = restored.selectionEnd = restored.value.length;
            }
        });
    }
}
