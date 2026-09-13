# Lucy -The Eternity She Wished For-
## Technical Modding Guide & `.nkpack` Engine Specification

This document provides a complete technical guide for unpacking, modifying, repacking, and building automated tools (such as visual novel editors or patchers) for the visual novel **Lucy -The Eternity She Wished For-** (루시 -그녀가 바라던 것-), developed by Modern Visual Arts Laboratory on the **NekoNovel** engine.

---

## 1. Architecture & Package Structure

The game stores its core assets inside `.nkpack` archives located in the game directory:
- `Scripts.nkpack` — Contains all story scripts, dialogue, scene transitions, and game variables.
- `BGMs.nkpack` — Background music (BGM).
- `FXs.nkpack` — Sound effects (SFX).
- `Images.nkpack` — Sprites, backgrounds, event CGs, UI graphics.
- `Voices.nkpack` — Voice acting clips (Korean / Japanese).

### Path:
Just right there: ./OriginalGame/

---

## 2. The `.nkpack` Binary Archive Specification

An `.nkpack` archive is a custom binary format using standard **zlib (deflate)** compression and bitwise NOT (`XOR 0xFFFFFFFF`) obfuscation on offsets and sizes.

### Structure Diagram:
```
+-------------------------------------------------------------+
| Header (0x113 bytes / 275 bytes)                            |
+-------------------------------------------------------------+
| Compressed File Data Stream                                 |
|   - File 1 (zlib compressed, level 6)                       |
|   - File 2 (zlib compressed, level 6)                       |
|   - ...                                                     |
|   - File N (zlib compressed, level 6)                       |
+-------------------------------------------------------------+
| File Table (Directory Index)                                |
|   - Archive Name Length (uint32 LE)                         |
|   - Archive Name String (e.g. "Scripts.nkpack")             |
|   - File Count N (uint32 LE)                                |
|   - N x File Entries:                                       |
|       * Path Length (uint32 LE)                             |
|       * Relative Path (ASCII/UTF-8, e.g. "Scripts\chap1.txt")|
|       * Offset ^ 0xFFFFFFFF (uint32 LE)                     |
|       * Uncompressed Size (uint32 LE)                       |
|       * Compressed Size ^ 0xFFFFFFFF (uint32 LE)            |
+-------------------------------------------------------------+
| Footer: Table Offset ^ 0xFFFFFFFF (uint32 LE, last 4 bytes) |
+-------------------------------------------------------------+
```

### Key Values & Endianness:
- All integers are **32-bit Little-Endian** (`<I` in Python struct).
- Inversion formula: `RealValue = StoredValue ^ 0xFFFFFFFF`.
- Header: Preserved as-is (first `0x113` bytes).

---

## 3. Extraction

### Method A: Using QuickBMS
QuickBMS can extract `.nkpack` files cleanly using the `lucy.bms` script.

#### Extraction Command:
```cmd
quickbms.exe lucy.bms "C:\Path\To\Scripts.nkpack" "C:\Path\To\extracted"
```
This extracts all files into the `extracted\Scripts\` directory.

---

### Method B: Native Python Extractor (No QuickBMS Required)
For a standalone editor/app, you do not need QuickBMS at all. You can unpack in pure Python:

```python
import os, struct, zlib

def extract_nkpack(archive_path, output_dir):
    with open(archive_path, 'rb') as f:
        data = f.read()

    # 1. Read file table offset from last 4 bytes
    table_offset = struct.unpack('<I', data[-4:])[0] ^ 0xFFFFFFFF
    
    # 2. Read archive name & file count
    pos = table_offset
    namesz = struct.unpack('<I', data[pos:pos+4])[0]; pos += 4
    arc_name = data[pos:pos+namesz].decode('utf-8', errors='ignore'); pos += namesz
    file_count = struct.unpack('<I', data[pos:pos+4])[0]; pos += 4
    
    # 3. Read directory entries and extract
    for _ in range(file_count):
        namesz = struct.unpack('<I', data[pos:pos+4])[0]; pos += 4
        rel_path = data[pos:pos+namesz].decode('utf-8', errors='ignore'); pos += namesz
        off, xsize, size = struct.unpack('<III', data[pos:pos+12]); pos += 12
        
        real_off = off ^ 0xFFFFFFFF
        real_size = size ^ 0xFFFFFFFF
        
        compressed_data = data[real_off : real_off + real_size]
        decompressed_data = zlib.decompress(compressed_data)
        
        out_path = os.path.join(output_dir, rel_path)
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, 'wb') as out_file:
            out_file.write(decompressed_data)
            
    print(f"Extracted {file_count} files successfully to {output_dir}")
```

---

## 4. CRITICAL: Why QuickBMS Reimport (`-r -r`) FAILS

> [!CAUTION]
> **DO NOT USE `quickbms.exe -r -r` OR `quickbms.exe -r` TO REPACK `.nkpack` ARCHIVES!**

### The Bug:
`lucy.bms` relies on runtime bitwise inversion (`math OFFSET ~ OFFSET`).
When QuickBMS executes its reimport engine:
1. QuickBMS calculates file injection offsets without applying the reverse bitwise NOT logic properly during table rewrite.
2. It attempts to seek to unsigned inverted offsets (such as `0xFFFFF150`).
3. This creates a **4.2 GB corrupted sparse file** that immediately crashes the game on launch.

---

## 5. The Correct Repacking Implementation

The correct way to repack `.nkpack` is to **rebuild the archive cleanly**:
1. Keep the original `0x113` header.
2. For each file:
   - If modified: compress the new data with standard `zlib.compress(data, 6)`.
   - If unmodified: copy the raw compressed data directly from the original archive.
3. Record new data offsets.
4. Construct the file table with XOR-ed offsets and sizes.
5. Append the file table and the XOR-ed table offset pointer at the very end.

### Production Repacker Code (`repack.py`):
```python
import os, struct, zlib, shutil

def repack_nkpack(orig_pack_path, extracted_dir, output_pack_path, steam_pack_path=None):
    with open(orig_pack_path, 'rb') as f:
        orig = f.read()

    # 1. Preserve the 0x113 byte header
    header = orig[:0x113]

    # 2. Parse original table
    info_off = struct.unpack('<I', orig[-4:])[0] ^ 0xFFFFFFFF
    f_pos = info_off
    nsz = struct.unpack('<I', orig[f_pos:f_pos+4])[0]; f_pos += 4
    arc_name = orig[f_pos:f_pos+nsz]; f_pos += nsz
    files_count = struct.unpack('<I', orig[f_pos:f_pos+4])[0]; f_pos += 4

    entries = []
    for _ in range(files_count):
        nsz = struct.unpack('<I', orig[f_pos:f_pos+4])[0]; f_pos += 4
        fname_bytes = orig[f_pos:f_pos+nsz]; f_pos += nsz
        off, xsize, size = struct.unpack('<III', orig[f_pos:f_pos+12]); f_pos += 12
        entries.append((fname_bytes, off ^ 0xFFFFFFFF, xsize, size ^ 0xFFFFFFFF))

    # 3. Build new data section
    out = bytearray(header)
    new_table = []

    for fname_bytes, off, xsize, size in entries:
        rel_path = fname_bytes.decode('utf-8', errors='ignore')
        local_path = os.path.join(extracted_dir, rel_path)
        
        if os.path.exists(local_path):
            with open(local_path, 'rb') as f:
                new_data = f.read()
            new_comp = zlib.compress(new_data, 6)
            new_off = len(out)
            out.extend(new_comp)
            new_table.append((fname_bytes, new_off, len(new_data), len(new_comp)))
        else:
            file_data = orig[off : off + size]
            new_off = len(out)
            out.extend(file_data)
            new_table.append((fname_bytes, new_off, xsize, size))

    # 4. Build new table
    table_offset = len(out)
    table_data = bytearray()
    table_data.extend(struct.pack('<I', len(arc_name)))
    table_data.extend(arc_name)
    table_data.extend(struct.pack('<I', len(new_table)))

    for fname_bytes, off, xsize, size in new_table:
        table_data.extend(struct.pack('<I', len(fname_bytes)))
        table_data.extend(fname_bytes)
        table_data.extend(struct.pack('<III', off ^ 0xFFFFFFFF, xsize, size ^ 0xFFFFFFFF))

    out.extend(table_data)
    out.extend(struct.pack('<I', table_offset ^ 0xFFFFFFFF))

    # 5. Write to output
    os.makedirs(os.path.dirname(output_pack_path), exist_ok=True)
    with open(output_pack_path, 'wb') as f:
        f.write(out)

    # 6. Optional: Sync directly with Steam installation
    if steam_pack_path and os.path.exists(os.path.dirname(steam_pack_path)):
        shutil.copy2(output_pack_path, steam_pack_path)

    print(f"Repack complete: {len(out)} bytes written.")
```

---

## 6. NekoNovel Script Format & Syntax Rules

All script files inside `Scripts\` (`chapter1.txt` to `chapter20.txt`, etc.) follow the NekoNovel scripting grammar.

### Encoding:
- **UTF-8** with **CRLF (`\r\n`)** line breaks.

### Engine Commands Reference:
| Command | Parameter Example | Description |
| :--- | :--- | :--- |
| `대사 [Текст]` | `대사 Привет, Люси.` | Displays text in the active dialogue box. |
| `대기` | *(no params)* | Pauses execution until the player clicks or presses Space/Enter. **Mandatory after every dialogue line.** |
| `대사잇기 [Текст]` | `대사잇기  Как дела?` | Appends text to the current line without clearing the box. |
| `대사새줄` | *(no params)* | Inserts a line break inside the dialogue box. |
| `대사크기 [N]` | `대사크기 50` | Sets font size (default is 35). |
| `스크립트 이름.txt [Name]` | `스크립트 이름.txt 루시` | Sets speaker name tag (`주인공`, `루시`, `가게주인`, `이름지우기` to clear). |
| `북마크 [Label]` | `북마크 선택지_1` | Defines a label target for jumps and branching. |
| `점프 [File.txt] [Label]` | `점프 chapter2.txt 첫줄` | Jumps to a specific label in a script file. |
| `변수 [var] = [val]` | `변수 루시 = "l01"` | Sets a script variable. |
| `조건 [var] == [val] [action]` | `조건 $trophy = 1 여기 next` | Conditional branch execution. |
| `CG [id] [filename]` | `CG ev02_1 ev{{$skin}}02_1.jpg` | Loads a background or event illustration. |
| `페이드인 [id] [ms]` | `페이드인 ev02_1 1000` | Smooth fade-in of an image. |
| `페이드아웃 [id] [ms]` | `페이드아웃 ev02_1 500` | Fade-out of an image. |
| `효과음 [id] [file.mp3]` | `효과음 thud1 thud1.mp3` | Plays a one-shot sound effect. |
| `배경음악 반복 [file.mp3]` | `배경음악 반복 free0257.mp3` | Loops background music. |
| `딜레이 [ms]` | `딜레이 1000` | Pauses execution for specified milliseconds. |

### Critical Scripting Rules:
1. **No Cyrillic Typos in Korean Commands**: Never write `скрипт` instead of `스크립트`, or `имя` instead of `이름`.
2. **Every `대사` requires a `대기`**: Missing `대기` causes dialogue to skip instantly without stopping for player input.
3. **Voice Lines (`보이스 ...`)**: If modifying dialogue, avoid adding new `보이스` lines unless you are providing matching `.mp3` files in `Voice.nkpack`.
4. **Preserve Bookmarks & Jumps**: Choice buttons (`시스템버튼`) jump to specific bookmarks. If a bookmark name is altered or deleted, the game will crash or softlock.

---

## 7. Blueprint for Building a Windows App Editor

### Recommended Technology Stack:
- **Compression**: Native `System.IO.Compression.ZLibStream` (.NET) or `zlib` (Python).
- **Encoding**: Strict UTF-8 with CRLF.
- **UI**: Make it beautiful and very comfortable to use. In the end this editor will be used for modding lucy, the eternity she wished for.