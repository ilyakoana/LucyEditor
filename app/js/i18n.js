/**
 * LucyEditor - Internationalization (i18n) Engine
 * Full English & Russian localization support with instant runtime switching.
 */

const I18N_DATA = {
    en: {
        // Header
        "app.title": "LucyEditor",
        "app.subtitle": "Visual Novel Modding Studio for Lucy -The Eternity She Wished For-",
        "btn.save_all": "Save All",
        "btn.save_all_tooltip": "Save all open modified scripts (Ctrl+S / Ctrl+Shift+S)",
        "btn.build_mod": "Build Mod",
        "btn.build_mod_tooltip": "Rebuild Scripts.nkpack and overwrite game archive (Ctrl+Shift+B)",
        "btn.run_game": "Run Game",
        "btn.run_game_tooltip": "Launch Lucy.exe (F5)",
        "btn.game_folder": "Game Folder",
        "btn.game_folder_tooltip": "Open active game directory in Windows Explorer",
        "btn.backups": "Backups",
        "btn.backups_tooltip": "Manage game backups and restore points",
        "btn.settings": "Settings",
        "btn.settings_tooltip": "Game directory & language settings",
        "btn.syntax_en": "🔤 Syntax: EN",
        "btn.syntax_ko": "🇰🇷 Syntax: KO",
        "btn.syntax_tooltip": "Toggle Visual Syntax (Visual English ↔ Raw Korean)",

        // Sidebar Left
        "sidebar.scripts_title": "Project Scripts",
        "sidebar.new_file": "+ File",
        "sidebar.search_placeholder": "Search scripts...",
        "category.chapters": "📖 Story Chapters",
        "category.characters": "👤 Characters",
        "category.system": "⚙️ System Scripts",
        "category.other": "📄 Other Files",

        // Sidebar Right Tabs
        "tab.preview": "Live Preview",
        "tab.commands": "Commands",
        "tab.assets": "Assets",

        // Preview Simulator
        "sim.prev": "◀ Prev",
        "sim.next": "Next ▶",
        "sim.sync_on": "Sync: ON",
        "sim.sync_off": "Sync: OFF",
        "sim.no_lines": "No dialogue lines found in current script.",
        "sim.speaker_default": "Protagonist",
        "sim.step_info": "Line {current} of {total} (line {line})",
        "sim.open_big_preview": "Full Scene Preview (1280×720)",

        // Commands Panel
        "cmd.quick_title": "⚡ Quick Insert",
        "cmd.search_placeholder": "Filter commands...",
        "cmd.dialogue": "💬 Dialogue & Text",
        "cmd.names": "👤 Character Names",
        "cmd.visuals": "🖼️ Visuals & CG",
        "cmd.audio": "🎵 Music & SFX",
        "cmd.flow": "⏱️ Logic & Timing",
        "cmd.threads": "⚡ Threads (Parallel)",
        "cmd.system": "🪟 UI & Window",

        // Assets Panel
        "assets.search_placeholder": "Search images or audio...",
        "assets.tab_images": "Images / CG",
        "assets.tab_bgms": "Music (BGM)",
        "assets.tab_fxs": "Sounds (SFX)",
        "assets.import_images": "+ Import Images",
        "assets.import_bgms": "+ Import BGM",
        "assets.import_fxs": "+ Import SFX",
        "assets.insert_bg": "Insert as BG",
        "assets.insert_cg": "Insert as CG",
        "assets.insert_code": "Insert in Code",
        "assets.empty": "No assets found.",

        // Status Bar
        "status.game_found": "Game Found",
        "status.game_missing": "Game Not Found",
        "status.pack": "Scripts.nkpack: {size} KB",
        "status.pos": "Line {line}, Col {col}",

        // Backups Modal
        "modal.backups_title": "Game Backups Manager",
        "modal.backups_desc": "Save and restore clean copies of your Scripts.nkpack archive before making big edits.",
        "modal.create_backup": "+ Create New Backup",
        "modal.backup_note_prompt": "Enter a note for this backup (e.g., 'Before Chapter 2 rewrite'):",
        "modal.rename": "Rename",
        "modal.rename_backup_title": "Rename Backup",
        "modal.rename_backup_prompt": "Enter a new note or description for this backup:",
        "modal.restore": "Restore",
        "modal.delete": "Delete",
        "modal.no_backups": "No backups created yet. Click 'Create New Backup' above.",
        "modal.new_script_title": "Create New Script",
        "modal.new_script_prompt": "Enter new script file name (e.g., custom_story.txt):",
        "modal.new_script_placeholder": "custom_story.txt",
        "modal.prompt_ok": "OK",
        "modal.prompt_cancel": "Cancel",

        // Settings / Setup Modal
        "modal.setup_title": "Game Configuration & Setup",
        "modal.setup_desc": "Configure the location of your installed Lucy game and unpack game assets.",
        "settings.language_label": "Application Language:",
        "settings.syntax_label": "Editor Script Syntax Mode:",
        "settings.syntax_desc": "Visual English displays clean commands (dialogue, wait, delay, bg, fadein...). Files are always saved in 100% authentic Korean for the game engine.",
        "modal.game_path_label": "Active Game Directory:",
        "modal.browse": "Browse...",
        "modal.steam_detected": "Steam installation auto-detected!",
        "modal.steam_sync_label": "Automatically sync repacked mod to Steam directory",
        "modal.unpack_btn": "Unpack All Game Archives (.nkpack)",
        "modal.unpack_desc": "Extracts Scripts, Images, BGM, and SFX into the workspace 'extracted/' directory.",
        "modal.save_settings": "Save Settings",

        // Prompts & Toasts
        "toast.saved_all": "Saved all {count} open scripts!",
        "toast.mod_built": "Mod successfully compiled! ({files} files, {size} KB). Game updated.",
        "toast.game_launched": "Lucy.exe launched!",
        "toast.backup_created": "Backup '{name}' created successfully!",
        "toast.backup_renamed": "Backup note updated!",
        "toast.backup_restored": "Backup restored! Game files reset.",
        "toast.script_created": "Created '{name}'!",
        "toast.imported": "Imported {count} asset(s) successfully!",
        "toast.syntax_switched_en": "Visual Syntax: English enabled! Commands are displayed in English, saved as genuine Korean.",
        "toast.syntax_switched_ko": "Visual Syntax: Korean enabled! Showing raw engine commands."
    },

    ru: {
        // Header
        "app.title": "LucyEditor",
        "app.subtitle": "Студия создания модов для Lucy -The Eternity She Wished For-",
        "btn.save_all": "Сохранить всё",
        "btn.save_all_tooltip": "Сохранить все открытые измененные скрипты (Ctrl+S / Ctrl+Shift+S)",
        "btn.build_mod": "Собрать мод",
        "btn.build_mod_tooltip": "Пересобрать архив Scripts.nkpack и обновить игру (Ctrl+Shift+B)",
        "btn.run_game": "Запустить игру",
        "btn.run_game_tooltip": "Запустить Lucy.exe (F5)",
        "btn.game_folder": "Папка игры",
        "btn.game_folder_tooltip": "Открыть активную папку игры в проводнике Windows",
        "btn.backups": "Бэкапы",
        "btn.backups_tooltip": "Управление резервными копиями и точками восстановления",
        "btn.settings": "Настройки",
        "btn.settings_tooltip": "Настройки папки игры и языка",
        "btn.syntax_en": "🔤 Синтаксис: EN",
        "btn.syntax_ko": "🇰🇷 Синтаксис: KO",
        "btn.syntax_tooltip": "Переключить синтаксис (Английский visual ↔ Корейский оригинал)",

        // Sidebar Left
        "sidebar.scripts_title": "Скрипты проекта",
        "sidebar.new_file": "+ Файл",
        "sidebar.search_placeholder": "Поиск скрипта...",
        "category.chapters": "📖 Главы сюжета",
        "category.characters": "👤 Персонажи",
        "category.system": "⚙️ Системные скрипты",
        "category.other": "📄 Прочие файлы",

        // Sidebar Right Tabs
        "tab.preview": "Live Preview",
        "tab.commands": "Команды",
        "tab.assets": "Ассеты",

        // Preview Simulator
        "sim.prev": "◀ Назад",
        "sim.next": "Вперед ▶",
        "sim.sync_on": "Синхрон: ВКЛ",
        "sim.sync_off": "Синхрон: ВЫКЛ",
        "sim.no_lines": "Нет диалоговых реплик в текущем скрипте.",
        "sim.speaker_default": "Главный герой",
        "sim.step_info": "Реплика {current} из {total} (стр {line})",
        "sim.open_big_preview": "Большой Preview (1280×720)",

        // Commands Panel
        "cmd.quick_title": "⚡ Быстрые действия",
        "cmd.search_placeholder": "Поиск команд...",
        "cmd.dialogue": "💬 Диалоги и Текст",
        "cmd.names": "👤 Имена персонажей",
        "cmd.visuals": "🖼️ Изображения и CG",
        "cmd.audio": "🎵 Музыка и SFX",
        "cmd.flow": "⏱️ Логика и Паузы",
        "cmd.threads": "⚡ Потоки (Threads)",
        "cmd.system": "🪟 Окно диалога и Экран",

        // Assets Panel
        "assets.search_placeholder": "Поиск картинок или звуков...",
        "assets.tab_images": "Изображения / CG",
        "assets.tab_bgms": "Музыка (BGM)",
        "assets.tab_fxs": "Звуки (SFX)",
        "assets.import_images": "+ Импорт картинок",
        "assets.import_bgms": "+ Импорт музыки",
        "assets.import_fxs": "+ Импорт звуков",
        "assets.insert_bg": "Вставить как Фон",
        "assets.insert_cg": "Вставить как CG",
        "assets.insert_code": "Вставить в код",
        "assets.empty": "Файлы не найдены.",

        // Status Bar
        "status.game_found": "Игра найдена",
        "status.game_missing": "Игра не найдена",
        "status.pack": "Scripts.nkpack: {size} КБ",
        "status.pos": "Стр {line}, Кол {col}",

        // Backups Modal
        "modal.backups_title": "Резервные копии и сейвы игры",
        "modal.backups_desc": "Сохраняйте и восстанавливайте чистые копии Scripts.nkpack перед крупными изменениями сюжета.",
        "modal.create_backup": "+ Создать бэкап",
        "modal.backup_note_prompt": "Введите описание для бэкапа (например: 'Оригинал' или 'Перед правками 2 главы'):",
        "modal.rename": "Переименовать",
        "modal.rename_backup_title": "Переименование бэкапа",
        "modal.rename_backup_prompt": "Введите новое название или описание для бэкапа:",
        "modal.restore": "Восстановить",
        "modal.delete": "Удалить",
        "modal.no_backups": "Бэкапов пока нет. Нажмите '+ Создать бэкап' выше.",
        "modal.new_script_title": "Создать новый скрипт",
        "modal.new_script_prompt": "Введите имя файла нового скрипта (например, custom_story.txt):",
        "modal.new_script_placeholder": "custom_story.txt",
        "modal.prompt_ok": "ОК",
        "modal.prompt_cancel": "Отмена",

        // Settings / Setup Modal
        "modal.setup_title": "Настройки программы и игры",
        "modal.setup_desc": "Укажите язык, режим синтаксиса и путь к установленной игре Lucy.",
        "settings.language_label": "Язык интерфейса программы:",
        "settings.syntax_label": "Режим синтаксиса скриптов в редакторе:",
        "settings.syntax_desc": "В режиме Visual English команды отображаются как dialogue, wait, delay, bg, fadein... но на диск сохраняются в 100% оригинальном корейском формате для движка игры.",
        "modal.game_path_label": "Путь к папке с игрой:",
        "modal.browse": "Обзор...",
        "modal.steam_detected": "Steam-версия игры обнаружена автоматически!",
        "modal.steam_sync_label": "Автоматически синхронизировать мод с папкой Steam",
        "modal.unpack_btn": "Распаковать все архивы игры (.nkpack)",
        "modal.unpack_desc": "Извлекает скрипты, графику, музыку и звуки в рабочую папку 'extracted/'.",
        "modal.save_settings": "Сохранить настройки",

        // Prompts & Toasts
        "toast.saved_all": "Сохранено открытых скриптов: {count}!",
        "toast.mod_built": "Мод успешно собран! ({files} файлов, {size} КБ). Файлы игры обновлены.",
        "toast.game_launched": "Lucy.exe запущена!",
        "toast.backup_created": "Бэкап '{name}' успешно создан!",
        "toast.backup_renamed": "Описание бэкапа обновлено!",
        "toast.backup_restored": "Бэкап восстановлен! Файлы игры возвращены к точке сохранения.",
        "toast.script_created": "Скрипт '{name}' успешно создан!",
        "toast.imported": "Успешно импортировано файлов: {count}!",
        "toast.syntax_switched_en": "Визуальный синтаксис: Английский включен! Команды отображаются на английском, сохраняются на корейском.",
        "toast.syntax_switched_ko": "Визуальный синтаксис: Корейский оригинал включен! Отображаются прямые команды движка."
    }
};

let currentLocale = "en";

function initI18n(preferredLang = null) {
    if (preferredLang) {
        currentLocale = preferredLang;
    } else {
        const saved = localStorage.getItem("lucy_lang");
        if (saved && (saved === "en" || saved === "ru")) {
            currentLocale = saved;
        } else {
            // Auto detect from system
            const sysLang = (navigator.language || "").toLowerCase();
            currentLocale = sysLang.startsWith("ru") ? "ru" : "en";
        }
    }
    applyI18n();
}

function setLanguage(lang) {
    if (lang !== "en" && lang !== "ru") return;
    currentLocale = lang;
    localStorage.setItem("lucy_lang", lang);
    applyI18n();
}

function toggleLanguage() {
    setLanguage(currentLocale === "en" ? "ru" : "en");
}

function t(key, params = {}) {
    const dict = I18N_DATA[currentLocale] || I18N_DATA.en;
    let text = dict[key] || I18N_DATA.en[key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
    return text;
}

function applyI18n() {
    // Translate all elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });

    // Translate all elements with data-i18n-title
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        const key = el.getAttribute("data-i18n-title");
        el.title = t(key);
    });

    // Translate all elements with data-i18n-placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.placeholder = t(key);
    });

    // Update language toggle button indicator
    const langBtn = document.getElementById("btn-lang-toggle");
    if (langBtn) {
        langBtn.textContent = currentLocale === "en" ? "English" : "Russian";
    }

    // Refresh dynamic sections
    const appInst = window.app || window.lucyApp;
    if (appInst) {
        if (appInst.renderScriptTree) appInst.renderScriptTree();
        if (appInst.renderTabs) appInst.renderTabs();
        if (appInst.renderStatus) appInst.renderStatus();
        if (appInst.updateSettingsPills) appInst.updateSettingsPills();
    }
    if (window.renderCommandPalette) {
        window.renderCommandPalette("cmd-palette-container");
    }
}
