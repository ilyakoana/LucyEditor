/**
 * LucyEditor - Electron Main Process
 * Supports configurable game paths, Steam auto-sync, asset importing,
 * multi-script saving, backups system, and full extraction setup.
 */

const { app, BrowserWindow, ipcMain, shell, protocol, net, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { pathToFileURL } = require("url");

const BASE_DIR = __dirname;
const CONFIG_FILE = path.join(BASE_DIR, "config.json");
const STEAM_DEFAULT_DIR = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Lucy -The Eternity She Wished For-";
const LOCAL_GAME_DIR = path.join(BASE_DIR, "originalGame", "Lucy -The Eternity She Wished For-");
const EXTRACTED_DIR = path.join(BASE_DIR, "extracted");
const SCRIPTS_DIR = path.join(EXTRACTED_DIR, "Scripts");

let mainWindow = null;

function loadConfig() {
    let cfg = {
        gameDir: fs.existsSync(STEAM_DEFAULT_DIR) ? STEAM_DEFAULT_DIR : LOCAL_GAME_DIR,
        steamSync: true,
        language: "en"
    };
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
            cfg = { ...cfg, ...data };
        } catch (e) {}
    }
    return cfg;
}

function saveConfig(cfg) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
    } catch (e) {}
}

let currentConfig = loadConfig();

// Register custom protocol for local asset streaming
protocol.registerSchemesAsPrivileged([
    {
        scheme: "lucy-asset",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true
        }
    }
]);

function createWindow() {
    app.setName("LucyEditor");

    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1100,
        minHeight: 700,
        backgroundColor: "#07090e",
        title: "LucyEditor",
        icon: path.join(__dirname, "app", "assets", "icon.ico"),
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: "#0f1420",
            symbolColor: "#38bdf8",
            height: 38
        },
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, "app", "index.html"));

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    // Protocol handler for lucy-asset://
    protocol.handle("lucy-asset", (request) => {
        const urlObj = new URL(request.url);
        const type = urlObj.host.toLowerCase();
        const fname = decodeURIComponent(urlObj.pathname.replace(/^\//, ""));

        let folder = path.join(EXTRACTED_DIR, "Images");
        if (type === "bgms") {
            folder = path.join(EXTRACTED_DIR, "BGMs");
        } else if (type === "fxs") {
            folder = path.join(EXTRACTED_DIR, "FXs");
        }

        const filePath = path.join(folder, path.basename(fname));
        if (fs.existsSync(filePath)) {
            return net.fetch(pathToFileURL(filePath).toString());
        }
        return new Response("Not Found", { status: 404 });
    });

    setupIpcHandlers();
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// Helper to run Python engine commands
function runEngine(args) {
    return new Promise((resolve) => {
        const py = spawn("python", [path.join(BASE_DIR, "nkpack_engine.py"), ...args], {
            cwd: BASE_DIR
        });
        let stdout = "";
        let stderr = "";

        py.stdout.on("data", (d) => {
            stdout += d.toString("utf-8");
        });
        py.stderr.on("data", (d) => {
            stderr += d.toString("utf-8");
        });

        py.on("close", (code) => {
            if (code === 0 && stdout.trim()) {
                try {
                    const parsed = JSON.parse(stdout.trim());
                    resolve(parsed);
                } catch (e) {
                    resolve({ success: false, error: `Invalid JSON: ${stdout}` });
                }
            } else {
                resolve({ success: false, error: stderr || `Exited with code ${code}` });
            }
        });
    });
}

function setupIpcHandlers() {
    // 1. Config & Status
    ipcMain.handle("api:getConfig", async () => {
        return currentConfig;
    });

    ipcMain.handle("api:saveConfig", async (event, newCfg) => {
        currentConfig = { ...currentConfig, ...newCfg };
        saveConfig(currentConfig);
        return currentConfig;
    });

    ipcMain.handle("api:selectGameFolder", async () => {
        const res = await dialog.showOpenDialog(mainWindow, {
            title: "Select Lucy Game Directory / Выберите папку с игрой Lucy",
            defaultPath: currentConfig.gameDir || "C:\\Program Files (x86)\\Steam\\steamapps\\common",
            properties: ["openDirectory"]
        });
        if (!res.canceled && res.filePaths.length > 0) {
            const chosen = res.filePaths[0];
            const hasLucy = fs.existsSync(path.join(chosen, "Lucy.exe")) || fs.existsSync(path.join(chosen, "Scripts.nkpack"));
            return { success: true, path: chosen, hasLucy };
        }
        return { success: false, canceled: true };
    });

    ipcMain.handle("api:getStatus", async () => {
        const hasExtracted = fs.existsSync(SCRIPTS_DIR) && fs.readdirSync(SCRIPTS_DIR).length > 0;
        const gameDir = currentConfig.gameDir;
        const hasGame = fs.existsSync(gameDir);
        const packPath = path.join(gameDir, "Scripts.nkpack");
        const hasPack = fs.existsSync(packPath);
        const packSize = hasPack ? fs.statSync(packPath).size : 0;
        const lucyExe = fs.existsSync(path.join(gameDir, "Lucy.exe"));

        return {
            success: true,
            status: {
                game_dir: gameDir,
                has_game: hasGame,
                has_pack: hasPack,
                pack_size: packSize,
                has_extracted: hasExtracted,
                extracted_count: hasExtracted ? fs.readdirSync(SCRIPTS_DIR).length : 0,
                lucy_exe_exists: lucyExe,
                steam_dir: STEAM_DEFAULT_DIR,
                steam_installed: fs.existsSync(STEAM_DEFAULT_DIR),
                steam_sync: currentConfig.steamSync,
                language: currentConfig.language
            }
        };
    });

    // 2. Scripts List & File Ops
    ipcMain.handle("api:getScripts", async () => {
        if (!fs.existsSync(SCRIPTS_DIR)) {
            return { success: true, scripts: [] };
        }

        const files = fs.readdirSync(SCRIPTS_DIR);
        const scripts = [];

        for (const fname of files) {
            const fullPath = path.join(SCRIPTS_DIR, fname);
            if (!fs.statSync(fullPath).isFile()) continue;

            const stat = fs.statSync(fullPath);
            const lower = fname.toLowerCase();

            let category = "other";
            if (lower.startsWith("chapter") || lower === "20년.txt" || lower.startsWith("초로의기억")) {
                category = "chapters";
            } else if (
                ["루시", "기박사", "가게주인", "아버지", "앤드류", "청년", "박사", "이름"].some((k) =>
                    lower.includes(k)
                )
            ) {
                category = "characters";
            } else if (
                lower.startsWith("시스템_") ||
                lower.includes("대화창") ||
                lower.includes("스킵") ||
                lower.includes("기본셋팅") ||
                lower.includes("타이틀") ||
                lower.includes("menu") ||
                lower.includes("도움말") ||
                lower.includes("자동넘기기") ||
                lower.includes("회상")
            ) {
                category = "system";
            }

            let lineCount = 0;
            try {
                const text = fs.readFileSync(fullPath, "utf-8");
                lineCount = text.split("\n").length;
            } catch (e) {}

            scripts.push({
                name: fname,
                category: category,
                size: stat.size,
                lines: lineCount,
                mtime: stat.mtimeMs
            });
        }

        return { success: true, scripts };
    });

    ipcMain.handle("api:getScriptContent", async (event, name) => {
        const safeName = path.basename(name);
        const filePath = path.join(SCRIPTS_DIR, safeName);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: `File not found: ${safeName}` };
        }
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const stat = fs.statSync(filePath);
            return {
                success: true,
                name: safeName,
                content: content,
                size: stat.size,
                lines: content.split("\n").length
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("api:saveScript", async (event, { name, content }) => {
        const safeName = path.basename(name);
        const filePath = path.join(SCRIPTS_DIR, safeName);
        try {
            let normalized = content.replace(/\r?\n/g, "\r\n");
            if (!normalized.endsWith("\r\n")) normalized += "\r\n";
            fs.writeFileSync(filePath, normalized, "utf-8");
            const stat = fs.statSync(filePath);
            return {
                success: true,
                name: safeName,
                size: stat.size,
                lines: normalized.split("\r\n").length
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    ipcMain.handle("api:createScript", async (event, { name, content }) => {
        let safeName = path.basename(name.trim());
        if (!safeName.endsWith(".txt")) safeName += ".txt";
        const filePath = path.join(SCRIPTS_DIR, safeName);
        if (fs.existsSync(filePath)) {
            return { success: false, error: "File already exists" };
        }
        const initialContent = content || "// LucyEditor Mod Script\r\n\r\n";
        fs.writeFileSync(filePath, initialContent, "utf-8");
        return { success: true, name: safeName };
    });

    ipcMain.handle("api:deleteScript", async (event, { name }) => {
        const safeName = path.basename(name);
        const filePath = path.join(SCRIPTS_DIR, safeName);
        if (!fs.existsSync(filePath)) {
            return { success: false, error: "File not found" };
        }
        fs.unlinkSync(filePath);
        return { success: true, name: safeName };
    });

    // 3. Repack & Unpack All
    ipcMain.handle("api:repack", async () => {
        const res = await runEngine(["repack", currentConfig.gameDir]);
        return res;
    });

    ipcMain.handle("api:extractAllPacks", async (event, customGameDir) => {
        const target = customGameDir || currentConfig.gameDir;
        const res = await runEngine(["extract-all", target]);
        return res;
    });

    // 4. Backups System
    ipcMain.handle("api:listBackups", async () => {
        return await runEngine(["backup-list"]);
    });

    ipcMain.handle("api:createBackup", async (event, note) => {
        return await runEngine(["backup-create", note || "Manual Backup"]);
    });

    ipcMain.handle("api:restoreBackup", async (event, filename) => {
        return await runEngine(["backup-restore", filename]);
    });

    ipcMain.handle("api:deleteBackup", async (event, filename) => {
        return await runEngine(["backup-delete", filename]);
    });

    // 5. Import Asset
    ipcMain.handle("api:importAsset", async (event, type) => {
        const typeFolderMap = {
            Images: path.join(EXTRACTED_DIR, "Images"),
            BGMs: path.join(EXTRACTED_DIR, "BGMs"),
            FXs: path.join(EXTRACTED_DIR, "FXs")
        };
        const destFolder = typeFolderMap[type];
        if (!destFolder) return { success: false, error: "Invalid type" };

        let filters = [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }];
        if (type === "BGMs" || type === "FXs") {
            filters = [{ name: "Audio", extensions: ["mp3", "ogg", "wav"] }];
        }

        const res = await dialog.showOpenDialog(mainWindow, {
            title: `Import ${type} Assets`,
            filters: filters,
            properties: ["openFile", "multiSelections"]
        });

        if (!res.canceled && res.filePaths.length > 0) {
            os_ensure_dir(destFolder);
            const imported = [];
            for (const src of res.filePaths) {
                const fname = path.basename(src);
                const dest = path.join(destFolder, fname);
                fs.copyFileSync(src, dest);
                imported.push(fname);
            }
            return { success: true, importedCount: imported.length, files: imported };
        }
        return { success: false, canceled: true };
    });

    // 6. Run Lucy.exe
    ipcMain.handle("api:runGame", async () => {
        const gameDir = currentConfig.gameDir;
        const exePath = path.join(gameDir, "Lucy.exe");
        if (!fs.existsSync(exePath)) {
            // Check Steam fallback
            if (fs.existsSync(path.join(STEAM_DEFAULT_DIR, "Lucy.exe"))) {
                const proc = spawn(path.join(STEAM_DEFAULT_DIR, "Lucy.exe"), [], {
                    cwd: STEAM_DEFAULT_DIR,
                    detached: true,
                    stdio: "ignore"
                });
                proc.unref();
                return { success: true, pid: proc.pid, path: STEAM_DEFAULT_DIR };
            }
            return { success: false, error: `Lucy.exe not found in ${gameDir}` };
        }

        try {
            const proc = spawn(exePath, [], {
                cwd: gameDir,
                detached: true,
                stdio: "ignore"
            });
            proc.unref();
            return { success: true, pid: proc.pid, path: gameDir };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    // 7. Open Folder
    ipcMain.handle("api:openFolder", async (event, { folder }) => {
        const folderMap = {
            game: currentConfig.gameDir,
            scripts: SCRIPTS_DIR,
            extracted: EXTRACTED_DIR,
            backups: path.join(BASE_DIR, "backups"),
            root: BASE_DIR
        };
        const target = folderMap[folder] || BASE_DIR;
        if (fs.existsSync(target)) {
            await shell.openPath(target);
            return { success: true };
        }
        return { success: false, error: "Folder not found" };
    });

    // 8. Asset List
    ipcMain.handle("api:getAssetsList", async () => {
        const imagesDir = path.join(EXTRACTED_DIR, "Images");
        const bgmsDir = path.join(EXTRACTED_DIR, "BGMs");
        const fxsDir = path.join(EXTRACTED_DIR, "FXs");

        const images = [];
        if (fs.existsSync(imagesDir)) {
            for (const f of fs.readdirSync(imagesDir)) {
                const lower = f.toLowerCase();
                if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) {
                    let type = "other";
                    if (lower.startsWith("bg_")) type = "background";
                    else if (lower.startsWith("ev") || lower.includes("cg")) type = "cg";
                    else if (lower.startsWith("l") && /^\d/.test(lower.slice(1, 3))) type = "lucy_sprite";
                    else if (lower.startsWith("f") && /^\d/.test(lower.slice(1, 3))) type = "character_sprite";
                    else if (lower.startsWith("thumb_")) type = "thumbnail";
                    images.push({ name: f, type });
                }
            }
        }

        const bgms = [];
        if (fs.existsSync(bgmsDir)) {
            for (const f of fs.readdirSync(bgmsDir)) {
                if (f.toLowerCase().endsWith(".mp3")) {
                    const stat = fs.statSync(path.join(bgmsDir, f));
                    bgms.push({ name: f, size: stat.size });
                }
            }
        }

        const fxs = [];
        if (fs.existsSync(fxsDir)) {
            for (const f of fs.readdirSync(fxsDir)) {
                if (f.toLowerCase().endsWith(".mp3")) {
                    const stat = fs.statSync(path.join(fxsDir, f));
                    fxs.push({ name: f, size: stat.size });
                }
            }
        }

        return {
            success: true,
            images,
            bgms,
            fxs,
            total_images: images.length,
            total_bgms: bgms.length,
            total_fxs: fxs.length
        };
    });
}

function os_ensure_dir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}
