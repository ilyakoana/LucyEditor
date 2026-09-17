/**
 * LucyEditor - Main Application Orchestrator
 * Connects Project Explorer, Multi-Tab Editor, Live Preview,
 * Settings/Unpacking, Backups Management, and Engine Operations.
 */

class LucyApp {
    constructor() {
        this.scripts = [];
        this.openTabs = []; // { name, isDirty, model }
        this.activeTabName = null;
        this.status = null;
        this.config = null;
        this.editor = null;
        this.isSaving = false;
        this.syntaxMode = localStorage.getItem("lucy_syntax_mode") || "english";
        window.app = this;
        window.lucyApp = this;
    }

    async init() {
        initI18n();
        this.renderSyntaxButton();
        this.initMonaco();
        await this.loadConfig();
        await this.checkStatus();
        await this.loadScripts();
        this.setupEventHandlers();
        this.setupKeybindings();

        previewSimulator.init();
        renderCommandPalette("cmd-palette-container");
        assetExplorer.init();

        // Big Preview IPC integration
        if (window.lucyApi) {
            if (window.lucyApi.onPreviewJump) {
                window.lucyApi.onPreviewJump((line) => {
                    if (editorInstance && line) {
                        editorInstance.setPosition({ lineNumber: line, column: 1 });
                        editorInstance.revealLineInCenter(line);
                    }
                });
            }
            if (window.lucyApi.onRequestInitialState) {
                window.lucyApi.onRequestInitialState(() => {
                    this.syncToBigPreview();
                });
            }
        }

        // Check if first-time run (no extracted scripts)
        if (!this.status || !this.status.has_extracted || this.status.extracted_count === 0) {
            this.openSetupModal();
        } else {
            // Automatically open chapter1.txt if present
            const defaultScript = this.scripts.find(s => s.name === "chapter1.txt") || this.scripts[0];
            if (defaultScript) {
                this.openScript(defaultScript.name);
            }
        }
    }

    async loadConfig() {
        try {
            if (window.lucyApi) {
                this.config = await window.lucyApi.getConfig();
                if (this.config && this.config.language) {
                    setLanguage(this.config.language);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    initMonaco() {
        this.editor = initMonacoEditor(
            "editor-container",
            "// LucyEditor - Ready\r\n",
            (line, col) => {
                if (this.cursorSyncTimer) clearTimeout(this.cursorSyncTimer);
                this.cursorSyncTimer = setTimeout(() => {
                    previewSimulator.syncToLine(line);
                    this.syncToBigPreview(line);
                }, 50);
            },
            () => {
                if (this.activeTabName) {
                    const tab = this.openTabs.find(t => t.name === this.activeTabName);
                    if (tab) {
                        if (!tab.isDirty) {
                            tab.isDirty = true;
                            this.renderTabs();
                        }
                        if (this.previewSyncTimer) clearTimeout(this.previewSyncTimer);
                        this.previewSyncTimer = setTimeout(() => {
                            if (editorInstance) {
                                previewSimulator.parseScript(editorInstance.getValue());
                                this.syncToBigPreview();
                            }
                        }, 300);
                    }
                }
            }
        );
    }

    async checkStatus() {
        try {
            let data;
            if (window.lucyApi) {
                data = await window.lucyApi.getStatus();
            } else {
                const res = await fetch("/api/status");
                data = await res.json();
            }
            if (data && data.success) {
                this.status = data.status;
                this.renderStatus();
            }
        } catch (e) {
            console.error("Status check failed:", e);
        }
    }

    renderStatus() {
        const packSizeEl = document.getElementById("status-pack-size");

        if (this.status && packSizeEl) {
            const kb = (this.status.pack_size / 1024).toFixed(0);
            packSizeEl.textContent = t("status.pack", { size: kb });
        }
    }

    async loadScripts() {
        try {
            let data;
            if (window.lucyApi) {
                data = await window.lucyApi.getScripts();
            } else {
                const res = await fetch("/api/scripts");
                data = await res.json();
            }
            if (data && data.success) {
                this.scripts = data.scripts;
                this.renderScriptTree();
            }
        } catch (e) {
            console.error("Failed to load scripts:", e);
        }
    }

    renderScriptTree() {
        const container = document.getElementById("script-tree-container");
        const searchInput = document.getElementById("script-search");
        const filter = searchInput ? searchInput.value.toLowerCase().trim() : "";

        if (!container) return;

        const categories = {
            chapters: { title: t("category.chapters"), items: [] },
            characters: { title: t("category.characters"), items: [] },
            system: { title: t("category.system"), items: [] },
            other: { title: t("category.other"), items: [] }
        };

        for (const s of this.scripts) {
            const displayName = typeof SyntaxTranslator !== "undefined"
                ? SyntaxTranslator.getScriptDisplayName(s.name, currentLocale)
                : s.name;

            if (filter) {
                const matchesOriginal = s.name.toLowerCase().includes(filter);
                const matchesDisplay = displayName.toLowerCase().includes(filter);
                if (!matchesOriginal && !matchesDisplay) continue;
            }
            const cat = categories[s.category] || categories.other;
            cat.items.push(s);
        }

        let html = "";
        for (const [key, group] of Object.entries(categories)) {
            if (group.items.length === 0) continue;

            html += `
                <div class="tree-category">
                    <div class="tree-category-header">
                        <span>${group.title}</span>
                        <span class="category-count">${group.items.length}</span>
                    </div>
                    <div class="tree-category-items">
            `;

            for (const item of group.items) {
                const isActive = item.name === this.activeTabName;
                const tab = this.openTabs.find(t => t.name === item.name);
                const isDirty = tab && tab.isDirty;
                const displayName = typeof SyntaxTranslator !== "undefined"
                    ? SyntaxTranslator.getScriptDisplayName(item.name, currentLocale)
                    : item.name;
                const tooltip = typeof SyntaxTranslator !== "undefined"
                    ? SyntaxTranslator.getScriptTooltip(item.name, currentLocale)
                    : item.name;

                html += `
                    <div class="tree-item ${isActive ? 'active' : ''} ${isDirty ? 'dirty' : ''}" data-name="${item.name}" title="${tooltip}">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${displayName}</span>
                        ${isDirty ? '<span class="dirty-indicator" title="Unsaved">●</span>' : ''}
                        <span class="file-lines">${item.lines} l</span>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        container.querySelectorAll(".tree-item").forEach(el => {
            el.addEventListener("click", () => {
                const name = el.getAttribute("data-name");
                this.openScript(name);
            });
        });
    }

    async openScript(name) {
        if (this.activeTabName === name) return;

        let tab = this.openTabs.find(t => t.name === name);
        if (!tab) {
            try {
                showGlobalSpinner(true);
                let data;
                if (window.lucyApi) {
                    data = await window.lucyApi.getScriptContent(name);
                } else {
                    const res = await fetch(`/api/script/content?name=${encodeURIComponent(name)}`);
                    data = await res.json();
                }
                showGlobalSpinner(false);

                if (!data || !data.success) {
                    showToast(`Error opening ${name}: ${data ? data.error : 'Unknown'}`, "error");
                    return;
                }

                let displayContent = data.content;
                if (this.syntaxMode === "english" && typeof SyntaxTranslator !== "undefined") {
                    displayContent = SyntaxTranslator.koreanToVisual(data.content);
                }

                const model = monaco.editor.createModel(displayContent, "nekonovel");
                tab = {
                    name: name,
                    isDirty: false,
                    model: model
                };
                this.openTabs.push(tab);
            } catch (e) {
                showGlobalSpinner(false);
                showToast(`Failed to read ${name}`, "error");
                return;
            }
        }

        this.activeTabName = name;
        editorInstance.setModel(tab.model);
        editorInstance.focus();

        this.renderTabs();
        this.renderScriptTree();

        previewSimulator.parseScript(tab.model.getValue());
        this.syncToBigPreview();
        runScriptDiagnostics();
    }

    closeTab(name, e) {
        if (e) e.stopPropagation();

        const tabIdx = this.openTabs.findIndex(t => t.name === name);
        if (tabIdx === -1) return;

        const tab = this.openTabs[tabIdx];
        if (tab.isDirty) {
            const isRu = typeof currentLocale !== "undefined" && currentLocale === "ru";
            const disp = typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.getScriptDisplayName(name, currentLocale) : name;
            const promptMsg = isRu
                ? `В скрипте '${disp}' есть несохранённые изменения. Закрыть вкладку без сохранения?`
                : `'${disp}' has unsaved changes. Close tab without saving?`;
            if (!confirm(promptMsg)) {
                return;
            }
        }

        tab.model.dispose();
        this.openTabs.splice(tabIdx, 1);

        if (this.activeTabName === name) {
            if (this.openTabs.length > 0) {
                const nextTab = this.openTabs[Math.max(0, tabIdx - 1)];
                this.openScript(nextTab.name);
            } else {
                this.activeTabName = null;
                editorInstance.setModel(monaco.editor.createModel("// No open files", "nekonovel"));
                previewSimulator.parseScript("");
            }
        }

        this.renderTabs();
        this.renderScriptTree();
    }

    renderTabs() {
        const container = document.getElementById("tabs-container");
        if (!container) return;

        let html = "";
        for (const tab of this.openTabs) {
            const isActive = tab.name === this.activeTabName;
            const displayName = typeof SyntaxTranslator !== "undefined"
                ? SyntaxTranslator.getScriptDisplayName(tab.name, currentLocale)
                : tab.name;
            const tooltip = typeof SyntaxTranslator !== "undefined"
                ? SyntaxTranslator.getScriptTooltip(tab.name, currentLocale)
                : tab.name;

            html += `
                <div class="editor-tab ${isActive ? 'active' : ''} ${tab.isDirty ? 'dirty' : ''}" data-name="${tab.name}" title="${tooltip}">
                    <span class="tab-title">${displayName}</span>
                    <span class="tab-dirty-dot">●</span>
                    <button class="tab-close-btn" title="${typeof t === 'function' ? t('tab.close') : 'Close'}">&times;</button>
                </div>
            `;
        }
        container.innerHTML = html;

        container.querySelectorAll(".editor-tab").forEach(el => {
            el.addEventListener("click", () => {
                const name = el.getAttribute("data-name");
                this.openScript(name);
            });

            const closeBtn = el.querySelector(".tab-close-btn");
            if (closeBtn) {
                closeBtn.addEventListener("click", e => {
                    const name = el.getAttribute("data-name");
                    this.closeTab(name, e);
                });
            }
        });
    }

    /**
     * Requirement 7: Saves ALL currently opened dirty scripts.
     */
    async saveAllScripts() {
        if (this.isSaving) return;
        this.isSaving = true;

        let savedCount = 0;
        try {
            for (const tab of this.openTabs) {
                // Sync active editor value if tab is active
                const content = tab.name === this.activeTabName ? editorInstance.getValue() : tab.model.getValue();

                if (tab.isDirty || tab.name === this.activeTabName) {
                    const contentToSave = this.syntaxMode === "english" && typeof SyntaxTranslator !== "undefined"
                        ? SyntaxTranslator.visualToKorean(content)
                        : content;

                    if (window.lucyApi) {
                        await window.lucyApi.saveScript(tab.name, contentToSave);
                    } else {
                        await fetch("/api/script/save", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: tab.name, content: contentToSave })
                        });
                    }
                    tab.isDirty = false;
                    savedCount++;
                }
            }

            this.renderTabs();
            this.renderScriptTree();

            if (savedCount > 0) {
                showToast(t("toast.saved_all", { count: savedCount }), "success");
            } else {
                showToast("All files are already up to date.", "info");
            }
        } catch (e) {
            showToast(`Save failed: ${e}`, "error");
        } finally {
            this.isSaving = false;
        }
    }

    /**
     * Requirement 4: Rebuilds mod and overwrites game directory Scripts.nkpack
     */
    async repackMod() {
        showGlobalSpinner(true, "Building mod: repacking Scripts.nkpack...");
        try {
            // 1. Auto-save all open scripts first!
            await this.saveAllScripts();

            // 2. Repack
            let data;
            if (window.lucyApi) {
                data = await window.lucyApi.repack();
            } else {
                const res = await fetch("/api/repack", { method: "POST" });
                data = await res.json();
            }
            showGlobalSpinner(false);

            if (data && data.success) {
                const kb = (data.total_bytes / 1024).toFixed(0);
                showToast(t("toast.mod_built", { files: data.files_count, size: kb }), "success", 6000);
                this.checkStatus();
            } else {
                showToast(`Build failed: ${data ? data.error : 'Unknown error'}`, "error", 6000);
            }
        } catch (e) {
            showGlobalSpinner(false);
            showToast(`Repacker error: ${e}`, "error");
        }
    }

    async runGame() {
        try {
            showToast("Launching Lucy.exe...", "info");
            let data;
            if (window.lucyApi) {
                data = await window.lucyApi.runGame();
            } else {
                const res = await fetch("/api/run-game", { method: "POST" });
                data = await res.json();
            }
            if (data && data.success) {
                showToast(t("toast.game_launched"), "success");
            } else {
                showToast(`Failed to run game: ${data ? data.error : 'Error'}`, "error");
            }
        } catch (e) {
            showToast(`Failed to launch game: ${e}`, "error");
        }
    }

    async openFolder(folder) {
        try {
            if (window.lucyApi) {
                await window.lucyApi.openFolder(folder);
            } else {
                await fetch("/api/open-folder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ folder: folder })
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    showPrompt({ title, message, placeholder = "", defaultValue = "", confirmText = null, cancelText = null }) {
        return new Promise((resolve) => {
            const modal = document.getElementById("modal-prompt");
            const titleEl = document.getElementById("prompt-modal-title");
            const descEl = document.getElementById("prompt-modal-desc");
            const inputEl = document.getElementById("prompt-modal-input");
            const errorEl = document.getElementById("prompt-modal-error");
            const btnConfirm = document.getElementById("btn-prompt-confirm");
            const btnCancel = document.getElementById("btn-prompt-cancel");
            const btnClose = document.getElementById("btn-prompt-close");

            if (!modal || !inputEl) {
                resolve(null);
                return;
            }

            if (titleEl) titleEl.textContent = title || "Prompt";
            if (descEl) descEl.textContent = message || "";
            inputEl.placeholder = placeholder || "";
            inputEl.value = defaultValue || "";
            if (errorEl) {
                errorEl.style.display = "none";
                errorEl.textContent = "";
            }
            if (btnConfirm) btnConfirm.textContent = confirmText || (typeof t === "function" ? t("modal.prompt_ok") : "OK") || "OK";
            if (btnCancel) btnCancel.textContent = cancelText || (typeof t === "function" ? t("modal.prompt_cancel") : "Cancel") || "Cancel";

            modal.style.display = "flex";
            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 50);

            let isDone = false;
            const cleanup = () => {
                if (isDone) return;
                isDone = true;
                modal.style.display = "none";
                btnConfirm?.removeEventListener("click", onConfirm);
                btnCancel?.removeEventListener("click", onCancel);
                btnClose?.removeEventListener("click", onCancel);
                modal.removeEventListener("click", onBackdropClick);
                inputEl.removeEventListener("keydown", onKeyDown);
                document.removeEventListener("keydown", onDocKeyDown);
            };

            const onConfirm = () => {
                const val = inputEl.value;
                cleanup();
                resolve(val);
            };

            const onCancel = () => {
                cleanup();
                resolve(null);
            };

            const onBackdropClick = (e) => {
                if (e.target === modal) {
                    onCancel();
                }
            };

            const onKeyDown = (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onConfirm();
                }
            };

            const onDocKeyDown = (e) => {
                if (e.key === "Escape" && modal.style.display !== "none") {
                    e.preventDefault();
                    onCancel();
                }
            };

            btnConfirm?.addEventListener("click", onConfirm);
            btnCancel?.addEventListener("click", onCancel);
            btnClose?.addEventListener("click", onCancel);
            modal.addEventListener("click", onBackdropClick);
            inputEl.addEventListener("keydown", onKeyDown);
            document.addEventListener("keydown", onDocKeyDown);
        });
    }

    async createNewScript() {
        const name = await this.showPrompt({
            title: t("modal.new_script_title"),
            message: t("modal.new_script_prompt"),
            placeholder: t("modal.new_script_placeholder"),
            defaultValue: "",
            confirmText: t("modal.prompt_ok")
        });
        if (name === null) return;
        const trimmed = name.trim();
        if (!trimmed) return;

        let fileName = trimmed;
        if (!fileName.endsWith(".txt")) {
            fileName += ".txt";
        }

        try {
            let data;
            if (window.lucyApi) {
                data = await window.lucyApi.createScript(fileName, "// LucyEditor Mod Script\r\n\r\n");
            } else {
                const res = await fetch("/api/script/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: fileName })
                });
                data = await res.json();
            }
            if (data && data.success) {
                showToast(t("toast.script_created", { name: data.name }), "success");
                await this.loadScripts();
                await this.openScript(data.name);
            } else {
                showToast(`Error: ${data ? data.error : 'Failed'}`, "error");
            }
        } catch (e) {
            showToast(`Create script failed: ${e}`, "error");
        }
    }

    // =========================================================================
    // Backups Modal (Requirement 6)
    // =========================================================================
    async openBackupsModal() {
        const modal = document.getElementById("modal-backups");
        if (!modal) return;

        modal.style.display = "flex";
        await this.refreshBackupsList();
    }

    closeBackupsModal() {
        const modal = document.getElementById("modal-backups");
        if (modal) modal.style.display = "none";
    }

    async refreshBackupsList() {
        const listEl = document.getElementById("backups-list-container");
        if (!listEl) return;

        try {
            let res;
            if (window.lucyApi) {
                res = await window.lucyApi.listBackups();
            } else {
                res = { success: true, backups: [] };
            }

            if (!res.success || res.backups.length === 0) {
                listEl.innerHTML = `<div class="empty-hint">${t("modal.no_backups")}</div>`;
                return;
            }

            this.currentBackups = res.backups;

            let html = "";
            for (const b of res.backups) {
                html += `
                    <div class="backup-card">
                        <div class="backup-info">
                            <div class="backup-note">${escapeHtml(b.note)}</div>
                            <div class="backup-meta">${b.date_str} • ${b.size_kb} KB • <code>${b.filename}</code></div>
                        </div>
                        <div class="backup-actions">
                            <button class="btn btn-secondary btn-micro" onclick="app.renameBackupPrompt('${b.filename}')">${t("modal.rename")}</button>
                            <button class="btn btn-primary btn-micro" onclick="app.restoreBackupItem('${b.filename}')">${t("modal.restore")}</button>
                            <button class="btn btn-danger btn-micro" onclick="app.deleteBackupItem('${b.filename}')">${t("modal.delete")}</button>
                        </div>
                    </div>
                `;
            }
            listEl.innerHTML = html;
        } catch (e) {
            listEl.innerHTML = `<div class="empty-hint">Error: ${e}</div>`;
        }
    }

    async renameBackupPrompt(filename) {
        const item = (this.currentBackups || []).find(b => b.filename === filename);
        const currentNote = item ? item.note : "Backup";

        const newNote = await this.showPrompt({
            title: t("modal.rename_backup_title"),
            message: t("modal.rename_backup_prompt"),
            placeholder: "e.g. Before Chapter 2 rewrite",
            defaultValue: currentNote,
            confirmText: t("modal.rename")
        });

        if (newNote === null) return;
        const trimmed = newNote.trim();
        if (!trimmed) return;

        showGlobalSpinner(true, "Renaming backup...");
        try {
            if (window.lucyApi) {
                const res = await window.lucyApi.renameBackup(filename, trimmed);
                showGlobalSpinner(false);
                if (res.success) {
                    showToast(t("toast.backup_renamed"), "success");
                    await this.refreshBackupsList();
                } else {
                    showToast(`Rename error: ${res.error}`, "error");
                }
            }
        } catch (e) {
            showGlobalSpinner(false);
            showToast(`Rename failed: ${e}`, "error");
        }
    }

    async createBackupPrompt() {
        const note = await this.showPrompt({
            title: t("modal.create_backup"),
            message: t("modal.backup_note_prompt"),
            placeholder: "e.g. Before Chapter 2 rewrite",
            defaultValue: "",
            confirmText: t("modal.prompt_ok")
        });
        if (note === null) return;

        const trimmedNote = note.trim() || "Manual Backup";

        showGlobalSpinner(true, "Creating backup snapshot...");
        try {
            if (window.lucyApi) {
                const res = await window.lucyApi.createBackup(trimmedNote);
                showGlobalSpinner(false);
                if (res.success) {
                    showToast(t("toast.backup_created", { name: res.filename }), "success");
                    await this.refreshBackupsList();
                    this.checkStatus();
                } else {
                    showToast(`Backup error: ${res.error}`, "error");
                }
            }
        } catch (e) {
            showGlobalSpinner(false);
            showToast(`Backup failed: ${e}`, "error");
        }
    }

    async restoreBackupItem(filename) {
        if (!confirm(`Restore '${filename}'? This will overwrite the game's Scripts.nkpack archive.`)) {
            return;
        }

        showGlobalSpinner(true, "Restoring backup snapshot...");
        try {
            if (window.lucyApi) {
                const res = await window.lucyApi.restoreBackup(filename);
                showGlobalSpinner(false);
                if (res.success) {
                    showToast(t("toast.backup_restored"), "success");
                    this.checkStatus();
                    this.closeBackupsModal();
                } else {
                    showToast(`Restore error: ${res.error}`, "error");
                }
            }
        } catch (e) {
            showGlobalSpinner(false);
            showToast(`Restore failed: ${e}`, "error");
        }
    }

    async deleteBackupItem(filename) {
        if (!confirm(`Delete backup '${filename}'?`)) return;

        try {
            if (window.lucyApi) {
                await window.lucyApi.deleteBackup(filename);
                await this.refreshBackupsList();
            }
        } catch (e) {
            console.error(e);
        }
    }

    hasUnsavedChanges() {
        return this.openTabs.some(t => t.isDirty);
    }

    getUnsavedScripts() {
        return this.openTabs.filter(t => t.isDirty).map(t => t.name);
    }

    // =========================================================================
    // Setup / Settings Modal (Requirement 5)
    // =========================================================================
    openSetupModal() {
        const modal = document.getElementById("modal-setup");
        if (!modal) return;

        const pathInput = document.getElementById("setup-game-path");
        const steamSyncCheck = document.getElementById("setup-steam-sync");

        if (pathInput && this.config) {
            pathInput.value = this.config.gameDir || "";
        }
        if (steamSyncCheck && this.config) {
            steamSyncCheck.checked = !!this.config.steamSync;
        }

        this.updateSettingsPills();
        modal.style.display = "flex";
    }

    updateSettingsPills() {
        const isEnLang = typeof currentLocale !== "undefined" ? currentLocale === "en" : true;
        const btnLangEn = document.getElementById("btn-setting-lang-en");
        const btnLangRu = document.getElementById("btn-setting-lang-ru");
        if (btnLangEn && btnLangRu) {
            btnLangEn.classList.toggle("active", isEnLang);
            btnLangRu.classList.toggle("active", !isEnLang);
        }

        const isEnSyntax = this.syntaxMode === "english";
        const btnSyntaxEn = document.getElementById("btn-setting-syntax-en");
        const btnSyntaxKo = document.getElementById("btn-setting-syntax-ko");
        if (btnSyntaxEn && btnSyntaxKo) {
            btnSyntaxEn.classList.toggle("active", isEnSyntax);
            btnSyntaxKo.classList.toggle("active", !isEnSyntax);
        }
    }

    closeSetupModal() {
        const modal = document.getElementById("modal-setup");
        if (modal) modal.style.display = "none";
    }

    async browseGameFolder() {
        if (!window.lucyApi) return;
        const res = await window.lucyApi.selectGameFolder();
        if (res && res.success) {
            const pathInput = document.getElementById("setup-game-path");
            if (pathInput) pathInput.value = res.path;
        }
    }

    async saveSettingsAndUnpack() {
        const pathInput = document.getElementById("setup-game-path");
        const steamSyncCheck = document.getElementById("setup-steam-sync");

        const newPath = pathInput ? pathInput.value.trim() : "";
        const steamSync = steamSyncCheck ? steamSyncCheck.checked : true;

        if (window.lucyApi) {
            await window.lucyApi.saveConfig({
                gameDir: newPath,
                steamSync: steamSync
            });
            await this.loadConfig();
        }

        showGlobalSpinner(true, "Unpacking all game archives (.nkpack)...");
        try {
            let res;
            if (window.lucyApi) {
                res = await window.lucyApi.extractAllPacks(newPath);
            }
            showGlobalSpinner(false);

            if (res && res.success) {
                showToast(`Extracted ${res.total_extracted} game files!`, "success");
                await this.loadScripts();
                await assetExplorer.loadAssets();
                this.checkStatus();
                this.closeSetupModal();
            } else {
                showToast(`Unpack warning: ${res ? res.error : 'Done'}`, "info");
                this.closeSetupModal();
            }
        } catch (e) {
            showGlobalSpinner(false);
            showToast(`Unpack failed: ${e}`, "error");
        }
    }

    renderSyntaxButton() {
        const btn = document.getElementById("btn-syntax-toggle");
        if (!btn) return;
        const isEn = this.syntaxMode === "english";
        btn.textContent = isEn ? (typeof t === "function" ? t("btn.syntax_en") : "🔤 Syntax: EN") : (typeof t === "function" ? t("btn.syntax_ko") : "🇰🇷 Syntax: KO");
        btn.classList.toggle("korean-mode", !isEn);
        btn.title = typeof t === "function" ? t("btn.syntax_tooltip") : "Toggle Visual Syntax (Visual English ↔ Raw Korean)";
    }

    setSyntaxMode(newMode) {
        if (this.syntaxMode === newMode) return;
        this.syntaxMode = newMode;
        localStorage.setItem("lucy_syntax_mode", this.syntaxMode);
        this.renderSyntaxButton();
        this.updateSettingsPills();

        // Convert all open models on the fly
        for (const tab of this.openTabs) {
            const curVal = tab.name === this.activeTabName ? editorInstance.getValue() : tab.model.getValue();
            let newVal = curVal;
            if (this.syntaxMode === "english") {
                newVal = typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.koreanToVisual(curVal) : curVal;
            } else {
                newVal = typeof SyntaxTranslator !== "undefined" ? SyntaxTranslator.visualToKorean(curVal) : curVal;
            }
            if (newVal !== curVal) {
                tab.model.setValue(newVal);
            }
        }

        if (this.syntaxMode === "english") {
            showToast(typeof t === "function" ? t("toast.syntax_switched_en") : "Visual Syntax: English enabled!", "info", 4000);
        } else {
            showToast(typeof t === "function" ? t("toast.syntax_switched_ko") : "Visual Syntax: Korean enabled!", "info", 4000);
        }

        // Re-render command palette to update badges & run diagnostics
        if (typeof renderCommandPalette === "function") {
            renderCommandPalette("cmd-palette-container");
        }
        if (typeof runScriptDiagnostics === "function") {
            runScriptDiagnostics();
        }
    }

    toggleSyntaxMode() {
        this.setSyntaxMode(this.syntaxMode === "english" ? "korean" : "english");
    }

    setupEventHandlers() {
        // Toolbar
        document.getElementById("btn-save")?.addEventListener("click", () => this.saveAllScripts());
        document.getElementById("btn-pack")?.addEventListener("click", () => this.repackMod());
        document.getElementById("btn-run-game")?.addEventListener("click", () => this.runGame());
        document.getElementById("btn-game-folder")?.addEventListener("click", () => this.openFolder("game"));
        document.getElementById("btn-backups")?.addEventListener("click", () => this.openBackupsModal());
        document.getElementById("btn-settings")?.addEventListener("click", () => this.openSetupModal());
        document.getElementById("btn-syntax-toggle")?.addEventListener("click", () => this.toggleSyntaxMode());
        document.getElementById("btn-lang-toggle")?.addEventListener("click", () => {
            toggleLanguage();
            this.renderSyntaxButton();
            if (window.lucyApi) {
                window.lucyApi.saveConfig({ language: currentLocale });
            }
        });

        // Script Tree
        document.getElementById("btn-new-script")?.addEventListener("click", () => this.createNewScript());
        document.getElementById("script-search")?.addEventListener("input", () => this.renderScriptTree());

        // Right sidebar tab switching
        const sidebarTabs = document.querySelectorAll(".sidebar-tab-btn");
        sidebarTabs.forEach(btn => {
            btn.addEventListener("click", () => {
                sidebarTabs.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                const targetTab = btn.getAttribute("data-tab");
                document.querySelectorAll(".sidebar-panel").forEach(p => p.classList.remove("active"));
                document.getElementById(`panel-${targetTab}`)?.classList.add("active");
            });
        });

        // Backups Modal handlers
        document.getElementById("btn-close-backups")?.addEventListener("click", () => this.closeBackupsModal());
        document.getElementById("btn-create-backup")?.addEventListener("click", () => this.createBackupPrompt());

        // Setup Modal handlers
        document.getElementById("btn-close-setup")?.addEventListener("click", () => this.closeSetupModal());
        document.getElementById("btn-browse-game")?.addEventListener("click", () => this.browseGameFolder());
        document.getElementById("btn-unpack-all")?.addEventListener("click", () => this.saveSettingsAndUnpack());

        // Settings Modal Language & Syntax Pills
        document.getElementById("btn-setting-lang-en")?.addEventListener("click", () => {
            setLanguage("en");
            this.updateSettingsPills();
            this.renderSyntaxButton();
            this.renderScriptTree();
            this.renderTabs();
            if (typeof renderCommandPalette === "function") {
                renderCommandPalette("cmd-palette-container");
            }
            if (window.lucyApi) {
                window.lucyApi.saveConfig({ language: "en" });
            }
        });

        document.getElementById("btn-setting-lang-ru")?.addEventListener("click", () => {
            setLanguage("ru");
            this.updateSettingsPills();
            this.renderSyntaxButton();
            this.renderScriptTree();
            this.renderTabs();
            if (typeof renderCommandPalette === "function") {
                renderCommandPalette("cmd-palette-container");
            }
            if (window.lucyApi) {
                window.lucyApi.saveConfig({ language: "ru" });
            }
        });

        document.getElementById("btn-setting-syntax-en")?.addEventListener("click", () => {
            this.setSyntaxMode("english");
        });

        document.getElementById("btn-setting-syntax-ko")?.addEventListener("click", () => {
            this.setSyntaxMode("korean");
        });
    }

    openBigPreview() {
        if (window.lucyApi && window.lucyApi.openBigPreview) {
            window.lucyApi.openBigPreview();
            setTimeout(() => {
                this.syncToBigPreview();
            }, 300);
        }
    }

    syncToBigPreview(line = null) {
        if (!window.lucyApi || !window.lucyApi.sendSyncPreview) return;
        if (!editorInstance) return;

        const pos = editorInstance.getPosition();
        const currentLine = line !== null ? line : (pos ? pos.lineNumber : 1);
        const content = editorInstance.getValue();

        window.lucyApi.sendSyncPreview({
            scriptName: this.activeTabName || "",
            content: content,
            line: currentLine,
            syntaxMode: this.syntaxMode
        });
    }

    setupKeybindings() {
        window.addEventListener("keydown", e => {
            // Ctrl+S or Ctrl+Shift+S -> Save All
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                this.saveAllScripts();
            }

            // Ctrl+Shift+B or F7 -> Build Mod
            if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "b") || e.key === "F7") {
                e.preventDefault();
                this.repackMod();
            }

            // F5 -> Run Game
            if (e.key === "F5") {
                e.preventDefault();
                this.runGame();
            }
        });
    }
}

// Global utilities
function showToast(message, type = "info", duration = 3500) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ"}</span>
        <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

function showGlobalSpinner(show, text = "Operation in progress...") {
    const overlay = document.getElementById("global-spinner-overlay");
    const textEl = document.getElementById("spinner-text");
    if (!overlay) return;

    if (show) {
        if (textEl) textEl.textContent = text;
        overlay.style.display = "flex";
    } else {
        overlay.style.display = "none";
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const app = new LucyApp();
window.addEventListener("DOMContentLoaded", () => {
    require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs" } });
    require(["vs/editor/editor.main"], () => {
        app.init();
    });
});
