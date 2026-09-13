/**
 * LucyEditor - Asset Explorer & Audio Player
 * Browse extracted images (CGs, backgrounds, sprites) and audio (BGMs, SFX)
 * with instant preview, one-click code generation, and native asset importing.
 */

class LucyAssetExplorer {
    constructor() {
        this.assets = { images: [], bgms: [], fxs: [] };
        this.activeTab = "images";
        this.audioPlayer = new Audio();
        this.currentPlayingName = null;
    }

    async loadAssets() {
        try {
            let data;
            if (window.lucyApi) {
                data = await window.lucyApi.getAssetsList();
            } else {
                const res = await fetch("/api/assets/list");
                data = await res.json();
            }
            if (data && data.success) {
                this.assets = data;
                this.render();
            }
        } catch (e) {
            console.error("Failed to load assets:", e);
        }
    }

    init() {
        this.loadAssets();

        // Filter search input
        const searchInput = document.getElementById("asset-search");
        if (searchInput) {
            searchInput.addEventListener("input", () => this.render());
        }

        // Subtabs
        const tabBtns = document.querySelectorAll(".asset-subtab");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                tabBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                this.activeTab = btn.getAttribute("data-tab");
                this.render();
            });
        });

        // Audio player event listeners
        this.audioPlayer.addEventListener("ended", () => {
            this.currentPlayingName = null;
            this.updateAudioButtons();
        });
    }

    async importCurrentAssetType() {
        if (!window.lucyApi) {
            alert("Asset import is available in the desktop app.");
            return;
        }

        const typeMap = {
            images: "Images",
            bgms: "BGMs",
            fxs: "FXs"
        };
        const targetType = typeMap[this.activeTab] || "Images";

        try {
            const res = await window.lucyApi.importAsset(targetType);
            if (res && res.success) {
                showToast(t("toast.imported", { count: res.importedCount }), "success");
                await this.loadAssets();
            }
        } catch (e) {
            showToast(`Import failed: ${e}`, "error");
        }
    }

    render() {
        const container = document.getElementById("asset-list-container");
        const searchInput = document.getElementById("asset-search");
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

        if (!container) return;

        if (this.activeTab === "images") {
            this.renderImages(container, query);
        } else if (this.activeTab === "bgms") {
            this.renderAudio(container, query, "BGMs", this.assets.bgms);
        } else if (this.activeTab === "fxs") {
            this.renderAudio(container, query, "FXs", this.assets.fxs);
        }
    }

    renderImages(container, query) {
        const filtered = this.assets.images.filter(img => img.name.toLowerCase().includes(query));

        let html = `
            <div class="asset-tab-actions">
                <button class="btn btn-primary btn-import" onclick="assetExplorer.importCurrentAssetType()">
                    <span>📁</span>
                    <span>${t("assets.import_images")}</span>
                </button>
                <span class="asset-count-badge">${filtered.length} items</span>
            </div>
        `;

        if (filtered.length === 0) {
            html += `<div class="empty-hint">${t("assets.empty")}</div>`;
            container.innerHTML = html;
            return;
        }

        html += `<div class="image-asset-grid">`;
        for (const img of filtered) {
            const isBg = img.type === "background";
            const isCg = img.type === "cg";
            const isSprite = img.type.includes("sprite");
            const badgeClass = isBg ? "badge-blue" : isCg ? "badge-purple" : "badge-gray";
            const badgeText = isBg ? "BG" : isCg ? "CG" : isSprite ? "Sprite" : "Asset";

            const imgUrl = window.lucyApi
                ? `lucy-asset://images/${encodeURIComponent(img.name)}`
                : `/api/assets/file?type=Images&name=${encodeURIComponent(img.name)}`;

            html += `
                <div class="image-asset-card" data-name="${img.name}">
                    <div class="image-thumb-wrapper">
                        <img src="${imgUrl}" loading="lazy" alt="${img.name}" />
                        <span class="image-type-badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="image-info">
                        <div class="image-filename" title="${img.name}">${img.name}</div>
                        <div class="image-actions">
                            <button class="btn-micro" onclick="LucyAssetExplorer.insertImageCode('${img.name}', 'bg')">${t("assets.insert_bg")}</button>
                            <button class="btn-micro" onclick="LucyAssetExplorer.insertImageCode('${img.name}', 'cg')">${t("assets.insert_cg")}</button>
                        </div>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        container.innerHTML = html;
    }

    renderAudio(container, query, type, list) {
        const filtered = list.filter(item => item.name.toLowerCase().includes(query));
        const importBtnLabel = type === "BGMs" ? t("assets.import_bgms") : t("assets.import_fxs");

        let html = `
            <div class="asset-tab-actions">
                <button class="btn btn-primary btn-import" onclick="assetExplorer.importCurrentAssetType()">
                    <span>🎵</span>
                    <span>${importBtnLabel}</span>
                </button>
                <span class="asset-count-badge">${filtered.length} files</span>
            </div>
        `;

        if (filtered.length === 0) {
            html += `<div class="empty-hint">${t("assets.empty")}</div>`;
            container.innerHTML = html;
            return;
        }

        html += `<div class="audio-asset-list">`;
        for (const item of filtered) {
            const isPlaying = this.currentPlayingName === item.name;
            const sizeMb = (item.size / (1024 * 1024)).toFixed(1);

            html += `
                <div class="audio-asset-row ${isPlaying ? 'playing' : ''}">
                    <button class="audio-play-btn" onclick="assetExplorer.togglePlayAudio('${type}', '${item.name}')">
                        ${isPlaying ? '⏸' : '▶'}
                    </button>
                    <div class="audio-title" title="${item.name}">${item.name}</div>
                    <div class="audio-size">${sizeMb} MB</div>
                    <div class="audio-actions">
                        <button class="btn-micro" onclick="LucyAssetExplorer.insertAudioCode('${item.name}', '${type}')">
                            ${t("assets.insert_code")}
                        </button>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        container.innerHTML = html;
    }

    togglePlayAudio(type, filename) {
        if (this.currentPlayingName === filename) {
            this.audioPlayer.pause();
            this.currentPlayingName = null;
        } else {
            this.currentPlayingName = filename;
            const audioUrl = window.lucyApi
                ? `lucy-asset://${type.toLowerCase()}/${encodeURIComponent(filename)}`
                : `/api/assets/file?type=${type}&name=${encodeURIComponent(filename)}`;
            this.audioPlayer.src = audioUrl;
            this.audioPlayer.play().catch(e => console.error(e));
        }
        this.render();
    }

    updateAudioButtons() {
        this.render();
    }

    static insertImageCode(filename, mode) {
        const baseName = filename.replace(/\.[^/.]+$/, "");
        if (mode === "bg") {
            const code = `배경 ${baseName} ${filename}\n페이드인 ${baseName} 1500`;
            insertSnippetAtCursor(code);
        } else {
            const code = `CG ${baseName} ${filename} 0 0 아니 -198\n페이드인 ${baseName} 1500`;
            insertSnippetAtCursor(code);
        }
        showToast(`'${filename}' inserted!`, "success");
    }

    static insertAudioCode(filename, type) {
        if (type === "BGMs") {
            const code = `배경음악 반복 ${filename}`;
            insertSnippetAtCursor(code);
        } else {
            const baseId = filename.replace(/\.[^/.]+$/, "");
            const code = `효과음 ${baseId} ${filename}`;
            insertSnippetAtCursor(code);
        }
        showToast(`'${filename}' inserted!`, "success");
    }
}

const assetExplorer = new LucyAssetExplorer();
