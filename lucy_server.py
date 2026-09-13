"""
LucyEditor - Local Backend API Server
Provides REST endpoints for script editing, .nkpack repacking/extracting,
asset streaming (CG, BGM, FX), launching Lucy.exe, and serving the frontend UI.
"""

import os
import sys
import json
import urllib.parse
import subprocess
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from typing import Dict, Any

from nkpack_engine import NkpackEngine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
GAME_DIR = os.path.join(BASE_DIR, "originalGame", "Lucy -The Eternity She Wished For-")
EXTRACTED_DIR = os.path.join(BASE_DIR, "extracted")
APP_DIR = os.path.join(BASE_DIR, "app")
PORT = 5678

engine = NkpackEngine(GAME_DIR, EXTRACTED_DIR)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


class LucyApiHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Concise logging
        if "/api/assets/file" in args[0]:
            return
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} {args[1]}\n")

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data: Any, status: int = 200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, message: str, status: int = 400):
        self._send_json({"success": False, "error": message}, status=status)

    def _read_body_json(self) -> Dict:
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        body = self.rfile.read(content_length).decode("utf-8")
        return json.loads(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        try:
            if path == "/api/status":
                self.handle_get_status()
            elif path == "/api/scripts":
                self.handle_get_scripts()
            elif path == "/api/script/content":
                name = query.get("name", [""])[0]
                self.handle_get_script_content(name)
            elif path == "/api/assets/list":
                self.handle_get_assets_list()
            elif path == "/api/assets/file":
                asset_type = query.get("type", ["Images"])[0]
                asset_name = query.get("name", [""])[0]
                self.handle_get_asset_file(asset_type, asset_name)
            else:
                self.handle_serve_static(path)
        except Exception as e:
            self._send_error(f"Internal error: {str(e)}", status=500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            if path == "/api/script/save":
                body = self._read_body_json()
                self.handle_save_script(body)
            elif path == "/api/script/create":
                body = self._read_body_json()
                self.handle_create_script(body)
            elif path == "/api/script/delete":
                body = self._read_body_json()
                self.handle_delete_script(body)
            elif path == "/api/repack":
                self.handle_repack()
            elif path == "/api/extract":
                self.handle_extract()
            elif path == "/api/restore-backup":
                self.handle_restore_backup()
            elif path == "/api/run-game":
                self.handle_run_game()
            elif path == "/api/open-folder":
                body = self._read_body_json()
                self.handle_open_folder(body)
            else:
                self._send_error("Endpoint not found", status=404)
        except Exception as e:
            self._send_error(f"Execution error: {str(e)}", status=500)

    # Handlers
    def handle_get_status(self):
        status = engine.get_status()
        self._send_json({"success": True, "status": status})

    def handle_get_scripts(self):
        scripts_dir = os.path.join(EXTRACTED_DIR, "Scripts")
        if not os.path.exists(scripts_dir):
            self._send_json({"success": True, "scripts": []})
            return

        items = []
        for fname in sorted(os.listdir(scripts_dir)):
            full_path = os.path.join(scripts_dir, fname)
            if not os.path.isfile(full_path):
                continue

            stat = os.stat(full_path)
            size = stat.st_size
            mtime = stat.st_mtime

            # Categorization
            lower = fname.lower()
            if lower.startswith("chapter") or lower in ("20년.txt", "초로의기억.txt", "초로의기억스킵질문.txt"):
                category = "chapters"
            elif any(
                k in lower
                for k in (
                    "루시",
                    "기박사",
                    "가게주인",
                    "아버지",
                    "앤드류",
                    "청년",
                    "박사",
                    "이름",
                )
            ):
                category = "characters"
            elif (
                lower.startswith("시스템_")
                or "대화창" in lower
                or "스킵" in lower
                or "기본셋팅" in lower
                or "타이틀" in lower
                or "menu" in lower
                or "도움말" in lower
                or "자동넘기기" in lower
                or "회상" in lower
            ):
                category = "system"
            else:
                category = "other"

            # Count lines quickly
            line_count = 0
            try:
                with open(full_path, "rb") as f:
                    line_count = sum(1 for _ in f)
            except Exception:
                pass

            items.append(
                {
                    "name": fname,
                    "category": category,
                    "size": size,
                    "lines": line_count,
                    "mtime": mtime,
                }
            )

        self._send_json({"success": True, "scripts": items})

    def handle_get_script_content(self, name: str):
        if not name:
            return self._send_error("Parameter 'name' is required")

        # Security check against path traversal
        safe_name = os.path.basename(name)
        file_path = os.path.join(EXTRACTED_DIR, "Scripts", safe_name)

        if not os.path.exists(file_path):
            return self._send_error(f"Script file '{safe_name}' not found", status=404)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(file_path, "r", encoding="cp949", errors="replace") as f:
                content = f.read()

        stat = os.stat(file_path)
        self._send_json(
            {
                "success": True,
                "name": safe_name,
                "content": content,
                "size": stat.st_size,
                "lines": len(content.splitlines()),
                "mtime": stat.st_mtime,
            }
        )

    def handle_save_script(self, body: Dict):
        name = body.get("name")
        content = body.get("content")

        if not name or content is None:
            return self._send_error("Both 'name' and 'content' are required")

        safe_name = os.path.basename(name)
        file_path = os.path.join(EXTRACTED_DIR, "Scripts", safe_name)

        # Ensure normalized CRLF line endings required by NekoNovel
        normalized_content = "\r\n".join(content.splitlines())
        if content.endswith("\n"):
            normalized_content += "\r\n"

        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8", newline="") as f:
            f.write(normalized_content)

        stat = os.stat(file_path)
        self._send_json(
            {
                "success": True,
                "name": safe_name,
                "size": stat.st_size,
                "mtime": stat.st_mtime,
                "lines": len(normalized_content.splitlines()),
            }
        )

    def handle_create_script(self, body: Dict):
        name = body.get("name", "").strip()
        if not name:
            return self._send_error("File name is required")

        if not name.endswith(".txt"):
            name += ".txt"

        safe_name = os.path.basename(name)
        file_path = os.path.join(EXTRACTED_DIR, "Scripts", safe_name)

        if os.path.exists(file_path):
            return self._send_error(f"File '{safe_name}' already exists")

        initial_content = body.get("content", "// LucyEditor Mod Script\r\n\r\n")
        with open(file_path, "w", encoding="utf-8", newline="") as f:
            f.write(initial_content)

        self._send_json({"success": True, "name": safe_name})

    def handle_delete_script(self, body: Dict):
        name = body.get("name", "").strip()
        if not name:
            return self._send_error("File name is required")

        safe_name = os.path.basename(name)
        file_path = os.path.join(EXTRACTED_DIR, "Scripts", safe_name)

        if not os.path.exists(file_path):
            return self._send_error(f"File '{safe_name}' not found", status=404)

        os.remove(file_path)
        self._send_json({"success": True, "name": safe_name})

    def handle_repack(self):
        result = engine.repack_pack(auto_backup=True)
        self._send_json(result)

    def handle_extract(self):
        result = engine.extract_pack()
        self._send_json(result)

    def handle_restore_backup(self):
        result = engine.restore_backup()
        self._send_json(result)

    def handle_run_game(self):
        lucy_exe = os.path.join(GAME_DIR, "Lucy.exe")
        if not os.path.exists(lucy_exe):
            return self._send_error(f"Lucy.exe not found in {GAME_DIR}")

        try:
            proc = subprocess.Popen([lucy_exe], cwd=GAME_DIR)
            self._send_json({"success": True, "pid": proc.pid})
        except Exception as e:
            self._send_error(f"Failed to start Lucy.exe: {str(e)}")

    def handle_open_folder(self, body: Dict):
        target = body.get("folder", "game")
        folder_map = {
            "game": GAME_DIR,
            "scripts": os.path.join(EXTRACTED_DIR, "Scripts"),
            "extracted": EXTRACTED_DIR,
            "root": BASE_DIR,
        }
        target_path = folder_map.get(target, BASE_DIR)
        if not os.path.exists(target_path):
            return self._send_error(f"Folder not found: {target_path}")

        try:
            if sys.platform == "win32":
                os.startfile(target_path)
            else:
                subprocess.Popen(["xdg-open", target_path])
            self._send_json({"success": True, "path": target_path})
        except Exception as e:
            self._send_error(f"Failed to open folder: {str(e)}")

    def handle_get_assets_list(self):
        images_dir = os.path.join(EXTRACTED_DIR, "Images")
        bgms_dir = os.path.join(EXTRACTED_DIR, "BGMs")
        fxs_dir = os.path.join(EXTRACTED_DIR, "FXs")

        images = []
        if os.path.exists(images_dir):
            for f in sorted(os.listdir(images_dir)):
                if f.lower().endswith((".jpg", ".jpeg", ".png")):
                    kind = "other"
                    l = f.lower()
                    if l.startswith("bg_"):
                        kind = "background"
                    elif l.startswith("ev") or "cg" in l:
                        kind = "cg"
                    elif l.startswith("l") and l[1:3].isdigit():
                        kind = "lucy_sprite"
                    elif l.startswith("f") and l[1:3].isdigit():
                        kind = "character_sprite"
                    elif l.startswith("thumb_"):
                        kind = "thumbnail"
                    images.append({"name": f, "type": kind})

        bgms = []
        if os.path.exists(bgms_dir):
            for f in sorted(os.listdir(bgms_dir)):
                if f.lower().endswith((".mp3", ".ogg", ".wav")):
                    bgms.append(
                        {
                            "name": f,
                            "size": os.path.getsize(os.path.join(bgms_dir, f)),
                        }
                    )

        fxs = []
        if os.path.exists(fxs_dir):
            for f in sorted(os.listdir(fxs_dir)):
                if f.lower().endswith((".mp3", ".ogg", ".wav")):
                    fxs.append(
                        {
                            "name": f,
                            "size": os.path.getsize(os.path.join(fxs_dir, f)),
                        }
                    )

        self._send_json(
            {
                "success": True,
                "images": images,
                "bgms": bgms,
                "fxs": fxs,
                "total_images": len(images),
                "total_bgms": len(bgms),
                "total_fxs": len(fxs),
            }
        )

    def handle_get_asset_file(self, asset_type: str, asset_name: str):
        if not asset_name:
            return self._send_error("Asset name required")

        type_folder_map = {
            "Images": os.path.join(EXTRACTED_DIR, "Images"),
            "BGMs": os.path.join(EXTRACTED_DIR, "BGMs"),
            "FXs": os.path.join(EXTRACTED_DIR, "FXs"),
        }

        folder = type_folder_map.get(asset_type)
        if not folder:
            return self._send_error(f"Invalid asset type: {asset_type}")

        safe_name = os.path.basename(asset_name)
        file_path = os.path.join(folder, safe_name)

        if not os.path.exists(file_path):
            return self._send_error(f"Asset '{safe_name}' not found", status=404)

        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "application/octet-stream"

        file_size = os.path.getsize(file_path)

        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Cache-Control", "public, max-age=3600")
        self._send_cors_headers()
        self.end_headers()

        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                self.wfile.write(chunk)

    def handle_serve_static(self, path: str):
        if path in ("", "/"):
            path = "/index.html"

        # Sanitize path
        rel_path = path.lstrip("/\\")
        file_path = os.path.join(APP_DIR, rel_path)

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            file_path = os.path.join(APP_DIR, "index.html")

        if not os.path.exists(file_path):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "text/plain"
        if file_path.endswith(".css"):
            mime_type = "text/css"
        elif file_path.endswith(".js"):
            mime_type = "application/javascript"

        stat = os.stat(file_path)
        self.send_response(200)
        self.send_header("Content-Type", f"{mime_type}; charset=utf-8" if "text" in mime_type or "javascript" in mime_type else mime_type)
        self.send_header("Content-Length", str(stat.st_size))
        self.send_header("Cache-Control", "no-cache")
        self._send_cors_headers()
        self.end_headers()

        with open(file_path, "rb") as f:
            while chunk := f.read(65536):
                self.wfile.write(chunk)


def start_server(port: int = PORT):
    server = ThreadedHTTPServer(("127.0.0.1", port), LucyApiHandler)
    print(f"==================================================")
    print(f"  LucyEditor Engine Server started on port {port}")
    print(f"  Web Interface: http://127.0.0.1:{port}")
    print(f"==================================================")
    return server


if __name__ == "__main__":
    server = start_server()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        server.server_close()
