"""
LucyEditor Launcher
Starts the backend API server and opens the modern desktop app window in Microsoft Edge App Mode or default browser.
"""

import os
import sys
import time
import webbrowser
import subprocess
import threading

from lucy_server import start_server, PORT


def open_desktop_window(port: int = PORT):
    time.sleep(0.8)
    url = f"http://127.0.0.1:{port}"

    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]

    edge_exe = next((p for p in edge_paths if os.path.exists(p)), None)

    if edge_exe:
        print(f"Launching LucyEditor in standalone app window via Edge...")
        subprocess.Popen([edge_exe, f"--app={url}", "--window-size=1440,900"])
    else:
        print(f"Opening LucyEditor in default browser: {url}")
        webbrowser.open(url)


def main():
    threading.Thread(target=open_desktop_window, args=(PORT,), daemon=True).start()
    server = start_server(PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping LucyEditor.")
        server.server_close()


if __name__ == "__main__":
    main()
