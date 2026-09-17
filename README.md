# LucyEditor 🌸
> **A Modern Visual Novel Modding Studio & Script IDE for *"Lucy -The Eternity She Wished For-"* (루시 -그녀가 바라던 것-)**

[![GitHub release](https://img.shields.io/badge/release-v1.0.1-blue.svg?style=for-the-badge)](https://github.com/ilyakoana/lucyeditor)
[![Electron](https://img.shields.io/badge/Electron-44.3.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://microsoft.com/windows)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Engine: NekoNovel 1.50](https://img.shields.io/badge/Engine-NekoNovel%201.50-ff69b4?style=for-the-badge)](https://store.steampowered.com/app/430960/)

---

## 📖 Overview

**LucyEditor** is an all-in-one desktop integrated development environment (IDE) built specifically for creating, editing, and testing mods for the acclaimed visual novel **Lucy -The Eternity She Wished For-**. 

In the original game, dialogue, branching logic, character expressions, CGs, and music are stored inside compressed binary `.nkpack` archives (`Scripts.nkpack`, `Images.nkpack`, `BGM.nkpack`, etc.) and scripted using the Korean **NekoNovel 1.50** command language. Modding previously required complex command-line hex/QuickBMS workflows, manual folder structures, and decoding raw Korean scripting commands without error checking or live visual feedback.

**LucyEditor** solves all of this by providing a complete, modern development studio:
- **No manual QuickBMS or terminal commands needed** — pack, unpack, and launch the game with single clicks.
- **Monaco Code Editor** (the engine powering VS Code) with custom syntax highlighting, auto-completion, hover docs, and real-time script linting.
- **Dual Visual Syntax Engine**: Write scripts in intuitive **Visual English** or authentic **Raw Korean**; LucyEditor translates bi-directionally on the fly without breaking original script files!
- **Real-Time Visual Novel Simulator**: Watch your dialogue, character sprites, and backgrounds advance interactively as you write and edit code.
- **Asset Explorer & Media Player**: Browse images, CGs, and listen to BGM/SFX with one-click code generation.
- **Automated Safety & Backup System**: Timestamped backups are created automatically before every build to ensure your game files are always safe.
- **Steam Auto-Sync**: Seamlessly updates your Steam installation and launches `Lucy.exe` directly from the toolbar.

---

## 📸 Interface Layout

![description](https://i.imgur.com/mmLghO4.png)

---

## ✨ Key Features

### 💻 1. Professional Monaco Code Editor
- **Full NekoNovel Language Support**: Highlighting for dialogues, character names, CG/backgrounds, transitions, sound effects, BGM loops, variables, conditional jumps, labels, and threads.
- **Autocomplete & IntelliSense**: Suggestions with parameter descriptions and usage examples as you type.
- **Real-Time Script Diagnostics**: Detects missing click waits (`대기` / `wait`), unclosed dialogue quotes, unknown commands, and broken jump destinations.
- **Multi-Tab Workspace**: Open and edit multiple chapter and system files simultaneously with dirty-state indicator (`*`).

### 🔤 2. Bi-Directional Visual Syntax Translation
Don't speak or write Korean? No problem! With one toggle in the header:
- **Visual English Mode**: View and write code using intuitive English tokens (`dialogue`, `wait`, `call`, `bg`, `fadein`, `voice`, `bgm`, `choice`, `jump`, `bookmark`).
- **Raw Korean Mode**: Switch back anytime to inspect authentic NekoNovel commands (`대사`, `대기`, `스크립트`, `배경`, `페이드인`, `보이스`, `배경음악`, `점프`, `북마크`).
- **Lossless Engine Compatibility**: Scripts are always saved and repacked with 100% genuine Korean syntax required by the game engine, preserving all comments and unicode dialogue.

### 👁️ 3. Live Visual Novel Preview Simulator
- **True-to-Game Rendering**: Dialogue box, protagonist/character nameplate, and character sprite layer overlaid over backgrounds.
- **Interactive Stepping**: Click the preview screen or use `[◀ Prev]` / `[Next ▶]` buttons to step through scenes line-by-line.
- **Cursor Sync**: Moving your cursor or clicking lines in Monaco automatically jumps the simulator to that exact scene.

### ⚡ 4. One-Click Command Palette & Snippets
- Instant insertion hero cards for common actions:
  - Add standard dialogue line (`대사` + `대기`)
  - Set speaker name (Protagonist, Lucy, Dr. Baek, Father, etc.)
  - Change background + fade transition
  - Play looping BGM or trigger sound effect
  - Add timed delay
- Categorized accordions for:
  - **Dialogue & Text**: Multi-line speech, font sizes, text shadows, speech bubbles, fade text
  - **Character Names**: Instant call templates for all Lucy characters
  - **CGs & Backgrounds**: Image display, zoom, shake effect (`화면흔들기`), flash, fade in/out
  - **Audio & Voice**: Multilingual voice playback `{{$언어}}`, volume fading, SFX
  - **Logic & Flow**: Labels, bookmarks, branching jumps, variables, condition checks, background threads

### 🎨 5. Asset Explorer & Audio Player
- **Visual Gallery**: Live grid of all game CGs, backgrounds, event illustrations, and character sprites (`Images/`).
- **Media Player**: Integrated audio player to listen to game music (`BGMs/`) and sound effects (`FXs/`) before using them.
- **One-Click Insert**: Click any asset to instantly insert its exact playback or display command into the active script.
- **Custom Asset Import**: Import your own `.png`, `.jpg`, `.mp3`, `.ogg`, or `.wav` files into the mod with automatic folder placement.

### 📦 6. Native `.nkpack` Engine & 1-Click Builder
- **Fast Lossless Repacker**: Custom Python archive engine (`nkpack_engine.py`) reads and reconstructs `.nkpack` binary archives cleanly with native zlib compression.
- **Steam Automatic Synchronization**: Automatically detects your Steam game directory and synchronizes your built `Scripts.nkpack` so you can test instantly.
- **Run Game from Toolbar**: Click `[🎮 Run Game]` to launch `Lucy.exe` immediately without leaving the editor.

### 🛡️ 7. Automated Backups & Safety System
- **Pre-Build Auto-Backup**: Creates a timestamped `.bak` copy of `Scripts.nkpack` before every build.
- **Backups Manager Dialog**: View all backups, restore any previous revision with a single click, or clean up obsolete backups.

### 🌐 8. Multilingual Interface (EN / RU)
- Fully localized in **English** and **Russian**.
- Switch UI languages on the fly using the `[🌐 EN / RU]` toggle button in the top navigation bar.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your system:
- **Windows 10 or 11** (64-bit)
- **Node.js** (v18.0.0 or higher) → [Download Node.js](https://nodejs.org/)
- **Python** (v3.8 or higher) with standard library → [Download Python](https://www.python.org/)
- A licensed copy of **Lucy -The Eternity She Wished For-** installed via Steam or DRM-free.

---

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/ilyakoana/lucyeditor.git
   cd LucyEditor
   ```

2. **Install Node Dependencies:**
   ```bash
   npm install
   ```

3. **Launch the Application:**
   - **Method A (Recommended - Desktop Electron App):**
     Double-click `LucyEditor.bat` or run:
     ```bash
     npm start
     ```
   - **Method B (Lightweight Web / Edge App Mode):**
     Run the standalone Python launcher:
     ```bash
     python launch.py
     ```

---

### First-Time Modding Walkthrough

1. **Open LucyEditor**: The editor will automatically check for your Steam installation at:
   `C:\Program Files (x86)\Steam\steamapps\common\Lucy -The Eternity She Wished For-`
   *(If your game is installed in a custom location, click `⚙️ Settings` and select your game directory).*
2. **Unpack Archives**:
   - In the `⚙️ Settings` modal, click **"Unpack All"**.
   - LucyEditor will extract all scripts (`Scripts.nkpack`) and media into the local `extracted/` workspace.
3. **Edit a Script**:
   - Select `chapter01.txt` from the **Project Scripts** sidebar.
   - Edit dialogue, add new text, or use the **Commands** palette to insert events.
   - Use the **Live Preview** tab on the right to see your changes rendered in real time.
4. **Build & Test**:
   - Click **`[📦 Build Mod]`** in the top bar. LucyEditor automatically creates a backup, compresses your modified scripts into `Scripts.nkpack`, and syncs it with your game folder.
   - Click **`[🎮 Run Game]`** to launch Lucy and see your mod in action!

---

## 📜 NekoNovel Scripting Reference

Scripts in *Lucy -The Eternity She Wished For-* use Korean command keywords. LucyEditor supports both native Korean keywords and translated Visual English syntax:

### 1. Dialogue & Flow

| Korean Command | Visual English | Description | Example |
| :--- | :--- | :--- | :--- |
| `대사 <text>` | `dialogue <text>` | Display line of dialogue | `대사 Hello, Lucy.` |
| `대기` | `wait` | Wait for user click | `대기` |
| `대사새줄` | `newline` | Add line break in textbox | `대사새줄` |
| `대사잇기 <text>` | `continue <text>` | Append text to current line | `대사잇기 Nice to meet you.` |
| `대사지우기` | `clear_dialogue` | Clear dialogue box | `대사지우기` |
| `대사크기 <size>` | `text_size <size>` | Change font size (default ~32) | `대사크기 40` |
| `딜레이 <ms>` | `delay <ms>` | Pause execution for milliseconds | `딜레이 1000` |

### 2. Character Nameplates

| Korean Command | Visual English | Character Shown |
| :--- | :--- | :--- |
| `스크립트 이름.txt 주인공` | `call 이름.txt protagonist` | **Protagonist** (주인공) |
| `스크립트 이름.txt 루시` | `call 이름.txt lucy` | **Lucy** (루시) |
| `스크립트 이름.txt 기박사` | `call 이름.txt dr_baek` | **Dr. Baek** (기박사) |
| `스크립트 이름.txt 아버지` | `call 이름.txt father` | **Father** (아버지) |
| `스크립트 이름.txt 이름지우기` | `call 이름.txt clear_name` | *Clear / Hide Nameplate* |

### 3. Graphics & Backgrounds

| Korean Command | Visual English | Description |
| :--- | :--- | :--- |
| `배경 <alias> <file>` | `bg <alias> <file>` | Load background image |
| `CG <alias> <file>` | `cg <alias> <file>` | Load event illustration or sprite |
| `페이드인 <alias> <ms>` | `fadein <alias> <ms>` | Fade image in over milliseconds |
| `페이드아웃 <alias> <ms>` | `fadeout <alias> <ms>` | Fade image out |
| `화면흔들기 <count> <pow>` | `shake_screen <count> <pow>` | Shake screen effect |
| `모두지우기` | `clear_all` | Clear all images and sprites |

### 4. Audio & Voice

| Korean Command | Visual English | Description |
| :--- | :--- | :--- |
| `보이스 <file>` | `voice <file>` | Play voice file (`lucy0001_{{$언어}}.mp3`) |
| `배경음악 반복 <file>` | `bgm loop <file>` | Play looping background music |
| `배경음악 정지 <ms>` | `bgm stop <ms>` | Fade out and stop BGM |
| `효과음 <file>` | `sfx <file>` | Play one-shot sound effect |

### 5. Branching & Variables

| Korean Command | Visual English | Description |
| :--- | :--- | :--- |
| `북마크 <label>` | `bookmark <label>` | Set a jump label / destination |
| `점프 <label>` | `jump <label>` | Jump unconditionally to label |
| `변수 <name> = <val>` | `var <name> = <val>` | Set numeric or boolean variable |
| `조건 <condition>` | `if <condition>` | Conditional branching statement |

---

## 🛠️ Project Structure

```
LucyEditor/
├── app/
│   ├── assets/              # App icons, visual assets, fonts
│   ├── css/
│   │   └── app.css          # Sleek modern dark-mode stylesheet
│   ├── js/
│   │   ├── app.js           # Core renderer UI controller & tab manager
│   │   ├── asset_explorer.js# Gallery browser & audio player
│   │   ├── command_palette.js# Snippets & Quick Insert command cards
│   │   ├── i18n.js          # Bilingual localization (English / Russian)
│   │   ├── monaco_setup.js  # Monaco editor bootstrap & linter rules
│   │   ├── nekonovel_lang.js# NekoNovel Monarch tokenizer & keywords
│   │   ├── preview_sim.js   # Real-time visual novel preview simulator
│   │   └── syntax_translator.js # Visual English ↔ Korean syntax engine
│   └── index.html           # Main studio window markup
├── extracted/               # Working directory for unpacked scripts & media
│   ├── Scripts/             # Active .txt script files
│   ├── Images/              # Backgrounds, CGs, and sprites
│   ├── BGMs/                # Background music (.mp3)
│   └── FXs/                 # Sound effects (.mp3)
├── backups/                 # Automatic timestamped backups of Scripts.nkpack
├── LucyEditor.bat           # 1-Click desktop launcher for Windows
├── main.js                  # Electron main process & IPC handlers
├── preload.js               # Secure context-isolated Electron bridge
├── nkpack_engine.py         # Native binary .nkpack unpacker & repacker
├── lucy_server.py           # Standalone Python HTTP API server
├── launch.py                # Standalone Python launcher (Edge/Browser mode)
├── lucy.bms                 # Original QuickBMS specification script
├── NekoNovel Engine Commands.md # Exhaustive scripting documentation
├── package.json             # NPM package specification & scripts
└── README.md                # Project documentation
```

---

## 🔬 Under The Hood: The `.nkpack` Architecture

The `.nkpack` archive format used by NekoNovel 1.50 uses a structured binary container:
1. **Header (0x113 bytes / 275 bytes)**: Reserved magic signature and game engine verification block.
2. **Data Stream**: Sequentially stored raw `zlib` compressed file streams.
3. **Directory Table**: Stored near the end of the file. Contains the archive name string, file count, and an array of entries containing:
   - File relative path string (e.g. `Scripts\chapter01.txt`)
   - File offset (XORed with `0xFFFFFFFF`)
   - Uncompressed size
   - Compressed stream size (XORed with `0xFFFFFFFF`)
4. **Directory Offset Pointer (Last 4 bytes)**: Little-endian integer pointing to the beginning of the directory table (XORed with `0xFFFFFFFF`).

`nkpack_engine.py` parses and generates these binary structures natively in Python at high speeds, avoiding external binary dependencies while remaining 100% compatible with QuickBMS.

---

## ❓ FAQ & Troubleshooting

### Q: LucyEditor says "Game directory not found".
> Click **`⚙️ Settings`** in the top-right header and click **"Browse..."** to locate your game directory containing `Lucy.exe` and `Scripts.nkpack`.

### Q: Why aren't my script changes appearing when I start the game?
> Make sure you clicked **`[💾 Save All]`** and then **`[📦 Build Mod]`**. If you are playing on Steam, verify that the **"Automatically sync repacked mod to Steam directory"** checkbox is enabled in Settings.

### Q: How do I revert back to the original game?
> Open **`🔄 Backups`** in the top bar. You will find backups with timestamps from before your builds. Click **`Restore`** on the clean or original backup to restore the original `Scripts.nkpack`. Alternatively, use Steam's *"Verify integrity of game files"* feature.

### Q: Can I add my own music, voices, or CGs?
> Yes! Switch to the **Assets** tab on the right sidebar, click the **Import** button, and select your `.png`, `.jpg`, or `.mp3` files. LucyEditor places them into the correct asset folder for immediate use in your scripts.

---

## 🤝 Contributing

Contributions from the visual novel modding community are warmly welcomed!
- **Found a bug or missing engine command?** Open an [Issue](https://github.com/ilyakoana/lucyeditor/issues).
- **Want to add features or improvements?** Fork the repository, make your changes on a branch, and submit a Pull Request.

---

## ⚖️ License & Disclaimer

- **License**: This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
- **Disclaimer**: *LucyEditor* is an independent, non-commercial fan-made modding tool. It is not officially affiliated with, endorsed by, or associated with **Modern Visual Arts Laboratory**, **D-techno**, or **Wished**. All game assets, characters, audio, and intellectual property of *"Lucy -The Eternity She Wished For-"* belong to their respective copyright holders.
