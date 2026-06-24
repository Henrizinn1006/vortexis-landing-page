#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════╗
║   VORTEXIS — Dev Server                             ║
║   Servidor local para a landing page                ║
╚══════════════════════════════════════════════════════╝

Uso:
    python server.py              → porta padrão 3000
    python server.py 8080         → porta personalizada
    python server.py --no-browser → não abre o browser
    python server.py --help       → exibe ajuda
"""

import sys
import os
import time
import threading
import webbrowser
import argparse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# ─── Cores ANSI para terminal ───────────────────────────────────
class C:
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    BLUE   = "\033[34m"
    CYAN   = "\033[36m"
    GREEN  = "\033[32m"
    YELLOW = "\033[33m"
    RED    = "\033[31m"
    PURPLE = "\033[35m"
    DIM    = "\033[2m"

def colored(text, *codes):
    return "".join(codes) + text + C.RESET

def banner():
    print()
    print(colored("  ██╗   ██╗ ██████╗ ██████╗ ████████╗███████╗██╗  ██╗██╗███████╗", C.BLUE, C.BOLD))
    print(colored("  ██║   ██║██╔═══██╗██╔══██╗╚══██╔══╝██╔════╝╚██╗██╔╝██║██╔════╝", C.BLUE, C.BOLD))
    print(colored("  ██║   ██║██║   ██║██████╔╝   ██║   █████╗   ╚███╔╝ ██║███████╗", C.PURPLE, C.BOLD))
    print(colored("  ╚██╗ ██╔╝██║   ██║██╔══██╗   ██║   ██╔══╝   ██╔██╗ ██║╚════██║", C.PURPLE, C.BOLD))
    print(colored("   ╚████╔╝ ╚██████╔╝██║  ██║   ██║   ███████╗██╔╝ ██╗██║███████║", C.CYAN, C.BOLD))
    print(colored("    ╚═══╝   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝", C.CYAN, C.BOLD))
    print(colored("  Dev Server — Landing Page", C.DIM))
    print()


# ─── Handler customizado com logs coloridos ─────────────────────
class VortexisHandler(SimpleHTTPRequestHandler):

    # Extensões → Content-Type
    MIME = {
        ".html": "text/html; charset=utf-8",
        ".css":  "text/css; charset=utf-8",
        ".js":   "application/javascript; charset=utf-8",
        ".json": "application/json",
        ".png":  "image/png",
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg":  "image/svg+xml",
        ".ico":  "image/x-icon",
        ".woff": "font/woff",
        ".woff2":"font/woff2",
        ".ttf":  "font/ttf",
        ".pdf":  "application/pdf",
    }

    def guess_type(self, path):
        ext = Path(path).suffix.lower()
        return self.MIME.get(ext, "application/octet-stream")

    def log_message(self, fmt, *args):
        """Override para logs coloridos e limpos."""
        code   = args[1] if len(args) > 1 else "???"
        method_path = args[0]

        try:
            code_int = int(code)
        except (ValueError, TypeError):
            code_int = 0

        if code_int in (200, 304):
            status = colored(f" {code} ", C.GREEN, C.BOLD)
        elif code_int in (301, 302):
            status = colored(f" {code} ", C.YELLOW, C.BOLD)
        elif code_int == 404:
            status = colored(f" {code} ", C.RED, C.BOLD)
        else:
            status = colored(f" {code} ", C.DIM)

        ts = colored(time.strftime("%H:%M:%S"), C.DIM)
        print(f"  {ts}  {status}  {colored(method_path, C.DIM)}")

    def end_headers(self):
        # Permite acesso de qualquer origem (útil ao testar com outras ferramentas)
        self.send_header("Access-Control-Allow-Origin", "*")
        # Evita cache para desenvolvimento
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


# ─── Verifica se a porta está em uso ────────────────────────────
def is_port_free(port):
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", port)) != 0


# ─── Abre o browser após delay ──────────────────────────────────
def open_browser(url, delay=0.8):
    def _open():
        time.sleep(delay)
        webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()


# ─── Main ────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Vortexis Dev Server — Servidor local para a landing page",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "port",
        nargs="?",
        type=int,
        default=3000,
        help="Porta do servidor (padrão: 3000)",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Não abrir o navegador automaticamente",
    )
    args = parser.parse_args()

    PORT = args.port

    # Muda para o diretório onde o server.py está
    server_dir = Path(__file__).resolve().parent
    os.chdir(server_dir)

    banner()

    # Verifica se porta está livre
    if not is_port_free(PORT):
        print(colored(f"  ✖  Porta {PORT} já está em uso.", C.RED, C.BOLD))
        alt = PORT + 1
        while not is_port_free(alt):
            alt += 1
        print(colored(f"  →  Tentando porta {alt} ...", C.YELLOW))
        PORT = alt
        print()

    url = f"http://localhost:{PORT}"

    try:
        server = HTTPServer(("", PORT), VortexisHandler)
    except OSError as e:
        print(colored(f"  ✖  Não foi possível iniciar: {e}", C.RED, C.BOLD))
        sys.exit(1)

    # Info de inicialização
    print(colored("  ✔  Servidor iniciado com sucesso!", C.GREEN, C.BOLD))
    print()
    print(colored("  📂  Diretório  ", C.DIM) + colored(str(server_dir), C.CYAN))
    print(colored("  🌐  Local      ", C.DIM) + colored(url, C.BLUE, C.BOLD))
    print()
    print(colored("  Pressione Ctrl+C para encerrar", C.DIM))
    print()
    print(colored("  ─" * 28, C.DIM))
    print()

    if not args.no_browser:
        open_browser(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()
        print(colored("  ✖  Servidor encerrado.", C.YELLOW, C.BOLD))
        print()
        server.server_close()
        sys.exit(0)


if __name__ == "__main__":
    main()
