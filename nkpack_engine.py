"""
LucyEditor - .nkpack Binary Archive Engine
Supports high-speed native extraction, lossless repacking, backup creation, and restoration
for "Lucy -The Eternity She Wished For-" (NekoNovel Engine).
"""

import os
import sys
import json
import time
import struct
import zlib
import shutil
import subprocess
from typing import Dict, List, Tuple, Optional

HEADER_SIZE = 0x113  # 275 bytes

STEAM_GAME_DIR = r"C:\Program Files (x86)\Steam\steamapps\common\Lucy -The Eternity She Wished For-"


class NkpackEngine:
    def __init__(self, game_dir: str, extracted_dir: str, backups_dir: Optional[str] = None):
        self.game_dir = os.path.abspath(game_dir)
        self.extracted_dir = os.path.abspath(extracted_dir)
        self.backups_dir = os.path.abspath(backups_dir or os.path.join(os.path.dirname(__file__), "backups"))
        os.makedirs(self.backups_dir, exist_ok=True)

        self.scripts_pack_path = os.path.join(self.game_dir, "Scripts.nkpack")
        self.extracted_scripts_dir = os.path.join(self.extracted_dir, "Scripts")

    def get_status(self) -> Dict:
        """Returns the status of game packs, backups, and extracted files."""
        has_game = os.path.exists(self.game_dir)
        has_pack = os.path.exists(self.scripts_pack_path)
        has_extracted = os.path.exists(self.extracted_scripts_dir)

        pack_size = os.path.getsize(self.scripts_pack_path) if has_pack else 0
        extracted_count = (
            len([f for f in os.listdir(self.extracted_scripts_dir) if f.endswith(".txt")])
            if has_extracted
            else 0
        )

        steam_installed = os.path.exists(STEAM_GAME_DIR)
        backups = self.list_backups()

        return {
            "game_dir": self.game_dir,
            "extracted_dir": self.extracted_dir,
            "has_game": has_game,
            "has_pack": has_pack,
            "pack_size": pack_size,
            "steam_installed": steam_installed,
            "steam_dir": STEAM_GAME_DIR,
            "has_extracted": has_extracted,
            "extracted_count": extracted_count,
            "backups_count": len(backups),
            "lucy_exe_exists": os.path.exists(os.path.join(self.game_dir, "Lucy.exe")),
        }

    def extract_pack(self, pack_path: str, output_dir: Optional[str] = None) -> Dict:
        """Extracts all files from an .nkpack archive using native zlib decompression."""
        if not os.path.exists(pack_path):
            raise FileNotFoundError(f"Archive not found: {pack_path}")

        out_base = output_dir or self.extracted_dir

        with open(pack_path, "rb") as f:
            data = f.read()

        if len(data) < HEADER_SIZE + 8:
            raise ValueError("Invalid archive: file too small")

        # Read directory table offset from the last 4 bytes (XOR 0xFFFFFFFF)
        table_offset = struct.unpack("<I", data[-4:])[0] ^ 0xFFFFFFFF
        if table_offset >= len(data):
            raise ValueError(f"Corrupt table offset: {table_offset} >= {len(data)}")

        pos = table_offset
        name_len = struct.unpack("<I", data[pos : pos + 4])[0]
        pos += 4
        arc_name = data[pos : pos + name_len].decode("utf-8", errors="ignore")
        pos += name_len
        file_count = struct.unpack("<I", data[pos : pos + 4])[0]
        pos += 4

        extracted_files = []
        for _ in range(file_count):
            path_len = struct.unpack("<I", data[pos : pos + 4])[0]
            pos += 4
            rel_path = data[pos : pos + path_len].decode("utf-8", errors="ignore")
            pos += path_len
            off, xsize, size = struct.unpack("<III", data[pos : pos + 12])
            pos += 12

            real_off = off ^ 0xFFFFFFFF
            real_size = size ^ 0xFFFFFFFF

            comp_chunk = data[real_off : real_off + real_size]
            decomp_data = zlib.decompress(comp_chunk)

            out_path = os.path.join(out_base, rel_path)
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, "wb") as out_f:
                out_f.write(decomp_data)

            extracted_files.append(rel_path)

        return {
            "success": True,
            "archive_name": arc_name,
            "file_count": file_count,
            "extracted_files_count": len(extracted_files),
        }

    def extract_all_game_packs(self, game_dir: Optional[str] = None) -> Dict:
        """Extracts all core packs from the game folder into extracted/ directory."""
        target_dir = os.path.abspath(game_dir or self.game_dir)
        if not os.path.exists(target_dir):
            raise FileNotFoundError(f"Game directory not found: {target_dir}")

        pack_files = [
            "Scripts.nkpack",
            "Images.nkpack",
            "BGM.nkpack",
            "FX.nkpack",
            "Voice.nkpack",
        ]

        results = {}
        total_files = 0
        for pack in pack_files:
            pack_path = os.path.join(target_dir, pack)
            if os.path.exists(pack_path):
                res = self.extract_pack(pack_path, self.extracted_dir)
                results[pack] = res["file_count"]
                total_files += res["file_count"]

        return {
            "success": True,
            "total_extracted": total_files,
            "packs": results,
            "target_dir": target_dir,
        }

    def repack_pack(
        self,
        orig_pack_path: Optional[str] = None,
        extracted_dir: Optional[str] = None,
        output_pack_path: Optional[str] = None,
        sync_steam: bool = True,
    ) -> Dict:
        """
        Rebuilds the .nkpack archive cleanly.
        Overwrites the target pack and optionally syncs with Steam game installation.
        """
        orig_pack = orig_pack_path or self.scripts_pack_path
        ext_dir = extracted_dir or self.extracted_dir
        out_pack = output_pack_path or self.scripts_pack_path

        if not os.path.exists(orig_pack):
            # Try to look in Steam or backups
            if os.path.exists(os.path.join(STEAM_GAME_DIR, "Scripts.nkpack")):
                orig_pack = os.path.join(STEAM_GAME_DIR, "Scripts.nkpack")
            else:
                raise FileNotFoundError(f"Original pack not found: {orig_pack}")

        # 1. Automatic backup before repacking
        backup_res = self.create_backup(note="Auto backup before build")

        with open(orig_pack, "rb") as f:
            orig = f.read()

        # 2. Preserve header
        header = orig[:HEADER_SIZE]

        # 3. Parse original directory table
        info_off = struct.unpack("<I", orig[-4:])[0] ^ 0xFFFFFFFF
        f_pos = info_off
        nsz = struct.unpack("<I", orig[f_pos : f_pos + 4])[0]
        f_pos += 4
        arc_name = orig[f_pos : f_pos + nsz]
        f_pos += nsz
        files_count = struct.unpack("<I", orig[f_pos : f_pos + 4])[0]
        f_pos += 4

        entries = []
        for _ in range(files_count):
            nsz = struct.unpack("<I", orig[f_pos : f_pos + 4])[0]
            f_pos += 4
            fname_bytes = orig[f_pos : f_pos + nsz]
            f_pos += nsz
            off, xsize, size = struct.unpack("<III", orig[f_pos : f_pos + 12])
            f_pos += 12
            entries.append((fname_bytes, off ^ 0xFFFFFFFF, xsize, size ^ 0xFFFFFFFF))

        # 4. Build new data section
        out = bytearray(header)
        new_table = []
        modified_count = 0

        for fname_bytes, off, xsize, size in entries:
            rel_path = fname_bytes.decode("utf-8", errors="ignore")
            local_path = os.path.join(ext_dir, rel_path)

            if os.path.exists(local_path):
                with open(local_path, "rb") as lf:
                    new_data = lf.read()
                new_comp = zlib.compress(new_data, 6)
                new_off = len(out)
                out.extend(new_comp)
                new_table.append((fname_bytes, new_off, len(new_data), len(new_comp)))
                modified_count += 1
            else:
                # Keep original raw compressed stream
                file_data = orig[off : off + size]
                new_off = len(out)
                out.extend(file_data)
                new_table.append((fname_bytes, new_off, xsize, size))

        # 5. Build directory table
        table_offset = len(out)
        table_data = bytearray()
        table_data.extend(struct.pack("<I", len(arc_name)))
        table_data.extend(arc_name)
        table_data.extend(struct.pack("<I", len(new_table)))

        for fname_bytes, off, xsize, size in new_table:
            table_data.extend(struct.pack("<I", len(fname_bytes)))
            table_data.extend(fname_bytes)
            table_data.extend(
                struct.pack("<III", off ^ 0xFFFFFFFF, xsize, size ^ 0xFFFFFFFF)
            )

        out.extend(table_data)
        out.extend(struct.pack("<I", table_offset ^ 0xFFFFFFFF))

        # 6. Write directly to out_pack
        os.makedirs(os.path.dirname(out_pack), exist_ok=True)
        tmp_path = out_pack + ".tmp"
        with open(tmp_path, "wb") as f:
            f.write(out)
        if os.path.exists(out_pack):
            os.remove(out_pack)
        os.rename(tmp_path, out_pack)

        # 7. Sync with Steam installation if installed and path is different
        steam_synced = False
        if sync_steam and os.path.exists(STEAM_GAME_DIR):
            steam_pack = os.path.join(STEAM_GAME_DIR, "Scripts.nkpack")
            if os.path.abspath(steam_pack) != os.path.abspath(out_pack):
                try:
                    shutil.copy2(out_pack, steam_pack)
                    steam_synced = True
                except Exception as e:
                    print(f"Warning: could not sync to Steam: {e}")

        return {
            "success": True,
            "output_path": out_pack,
            "total_bytes": len(out),
            "files_count": len(new_table),
            "repacked_files": modified_count,
            "steam_synced": steam_synced,
            "backup_created": backup_res.get("filename"),
        }

    # Backup System
    def list_backups(self) -> List[Dict]:
        """Lists all backups from backups/ directory."""
        if not os.path.exists(self.backups_dir):
            return []

        meta_file = os.path.join(self.backups_dir, "backups.json")
        meta = {}
        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
            except Exception:
                meta = {}

        backups = []
        for fname in sorted(os.listdir(self.backups_dir), reverse=True):
            if fname.endswith(".nkpack"):
                fpath = os.path.join(self.backups_dir, fname)
                stat = os.stat(fpath)
                m = meta.get(fname, {})
                backups.append(
                    {
                        "filename": fname,
                        "note": m.get("note", "Backup"),
                        "timestamp": m.get("timestamp", stat.st_mtime),
                        "date_str": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(m.get("timestamp", stat.st_mtime))),
                        "size_kb": round(stat.st_size / 1024),
                    }
                )
        return backups

    def create_backup(self, note: Optional[str] = None) -> Dict:
        """Creates a timestamped backup of Scripts.nkpack."""
        source_pack = self.scripts_pack_path
        if not os.path.exists(source_pack):
            if os.path.exists(os.path.join(STEAM_GAME_DIR, "Scripts.nkpack")):
                source_pack = os.path.join(STEAM_GAME_DIR, "Scripts.nkpack")
            else:
                return {"success": False, "error": "No Scripts.nkpack found to backup"}

        ts = int(time.time())
        timestr = time.strftime("%Y%m%d_%H%M%S", time.localtime(ts))
        fname = f"Scripts_{timestr}.nkpack"
        target_path = os.path.join(self.backups_dir, fname)

        shutil.copy2(source_pack, target_path)

        # Update metadata
        meta_file = os.path.join(self.backups_dir, "backups.json")
        meta = {}
        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
            except Exception:
                pass

        meta[fname] = {
            "note": note or "Manual Backup",
            "timestamp": ts,
        }
        with open(meta_file, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

        return {
            "success": True,
            "filename": fname,
            "path": target_path,
            "size_kb": round(os.path.getsize(target_path) / 1024),
        }

    def restore_backup(self, filename: str) -> Dict:
        """Restores selected backup file into the game directory (and Steam if exists)."""
        safe_name = os.path.basename(filename)
        backup_path = os.path.join(self.backups_dir, safe_name)
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup not found: {safe_name}")

        # Restore to configured game directory
        shutil.copy2(backup_path, self.scripts_pack_path)

        # Also restore to Steam if exists
        steam_synced = False
        if os.path.exists(STEAM_GAME_DIR):
            steam_pack = os.path.join(STEAM_GAME_DIR, "Scripts.nkpack")
            if os.path.abspath(steam_pack) != os.path.abspath(self.scripts_pack_path):
                shutil.copy2(backup_path, steam_pack)
                steam_synced = True

        return {
            "success": True,
            "restored_from": safe_name,
            "target": self.scripts_pack_path,
            "steam_synced": steam_synced,
            "size": os.path.getsize(self.scripts_pack_path),
        }

    def delete_backup(self, filename: str) -> Dict:
        """Deletes a backup file."""
        safe_name = os.path.basename(filename)
        backup_path = os.path.join(self.backups_dir, safe_name)
        if os.path.exists(backup_path):
            os.remove(backup_path)

        meta_file = os.path.join(self.backups_dir, "backups.json")
        if os.path.exists(meta_file):
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    meta = json.load(f)
                if safe_name in meta:
                    del meta[safe_name]
                    with open(meta_file, "w", encoding="utf-8") as f:
                        json.dump(meta, f, ensure_ascii=False, indent=2)
            except Exception:
                pass

        return {"success": True, "deleted": safe_name}


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    base = os.path.dirname(os.path.abspath(__file__))
    game = os.path.join(base, "originalGame", "Lucy -The Eternity She Wished For-")
    ext = os.path.join(base, "extracted")
    engine = NkpackEngine(game, ext)

    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    try:
        if action == "status":
            res = {"success": True, "status": engine.get_status()}
        elif action == "repack":
            custom_game = sys.argv[2] if len(sys.argv) > 2 else None
            if custom_game:
                engine.game_dir = os.path.abspath(custom_game)
                engine.scripts_pack_path = os.path.join(engine.game_dir, "Scripts.nkpack")
            res = engine.repack_pack()
        elif action == "extract-all":
            custom_game = sys.argv[2] if len(sys.argv) > 2 else None
            res = engine.extract_all_game_packs(custom_game)
        elif action == "backup-create":
            note = sys.argv[2] if len(sys.argv) > 2 else None
            res = engine.create_backup(note=note)
        elif action == "backup-list":
            res = {"success": True, "backups": engine.list_backups()}
        elif action == "backup-restore":
            fname = sys.argv[2]
            res = engine.restore_backup(fname)
        elif action == "backup-delete":
            fname = sys.argv[2]
            res = engine.delete_backup(fname)
        else:
            res = {"success": False, "error": f"Unknown action: {action}"}
        print(json.dumps(res, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
