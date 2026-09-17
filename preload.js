/**
 * LucyEditor - Electron Preload Script
 * Safely exposes native backend capabilities to the renderer window.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("lucyApi", {
    // Config & Game Setup
    getConfig: () => ipcRenderer.invoke("api:getConfig"),
    saveConfig: (cfg) => ipcRenderer.invoke("api:saveConfig", cfg),
    selectGameFolder: () => ipcRenderer.invoke("api:selectGameFolder"),
    extractAllPacks: (gameDir) => ipcRenderer.invoke("api:extractAllPacks", gameDir),

    // Status & Scripts
    getStatus: () => ipcRenderer.invoke("api:getStatus"),
    getScripts: () => ipcRenderer.invoke("api:getScripts"),
    getScriptContent: (name) => ipcRenderer.invoke("api:getScriptContent", name),
    saveScript: (name, content) => ipcRenderer.invoke("api:saveScript", { name, content }),
    createScript: (name, content) => ipcRenderer.invoke("api:createScript", { name, content }),
    deleteScript: (name) => ipcRenderer.invoke("api:deleteScript", { name }),

    // Engine & Modding
    repack: () => ipcRenderer.invoke("api:repack"),
    runGame: () => ipcRenderer.invoke("api:runGame"),
    openFolder: (folder) => ipcRenderer.invoke("api:openFolder", { folder }),

    // Backups System
    listBackups: () => ipcRenderer.invoke("api:listBackups"),
    createBackup: (note) => ipcRenderer.invoke("api:createBackup", note),
    renameBackup: (filename, newNote) => ipcRenderer.invoke("api:renameBackup", { filename, newNote }),
    restoreBackup: (filename) => ipcRenderer.invoke("api:restoreBackup", filename),
    deleteBackup: (filename) => ipcRenderer.invoke("api:deleteBackup", filename),

    // Assets & Import
    getAssetsList: () => ipcRenderer.invoke("api:getAssetsList"),
    importAsset: (type) => ipcRenderer.invoke("api:importAsset", type),

    // Big Preview System
    openBigPreview: () => ipcRenderer.invoke("api:openBigPreview"),
    sendSyncPreview: (data) => ipcRenderer.send("preview:syncFromEditor", data),
    onSyncPreview: (callback) => ipcRenderer.on("preview:syncToPlayer", (e, d) => callback(d)),
    sendPreviewJump: (line) => ipcRenderer.send("preview:jumpToLine", line),
    onPreviewJump: (callback) => ipcRenderer.on("preview:jumpInEditor", (e, line) => callback(line)),
    requestInitialState: () => ipcRenderer.send("preview:requestInitialState"),
    onRequestInitialState: (callback) => ipcRenderer.on("preview:requestStateForPlayer", (e) => callback())
});
