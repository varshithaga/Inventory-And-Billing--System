#!/usr/bin/env python3
"""Regenerate docs/screenshots/*.jpg + docs/walkthrough.mp4 from the running app.

Prerequisites (see ../README.md):
  * Django backend running on http://localhost:8000  (python manage.py runserver 8000)
  * frontend running on http://localhost:5173         (npm run dev)
  * demo data loaded                                  (python manage.py seed_demo_data)
  * Node.js on PATH, and Chrome or Edge installed

This installs two npm packages (puppeteer-core, ffmpeg-static) into docs/ on the
first run, then hands off to _capture.js.

Auth: _capture.js logs in through the API as CAPTURE_USER / CAPTURE_PASS
(default "demo_admin" / "DemoPass!2026"). This script creates that throwaway
admin user first (via manage.py) and deletes it afterwards. Point it at an
existing admin instead by setting CAPTURE_USER / CAPTURE_PASS and passing
--no-temp-user.
"""
import argparse
import os
import shutil
import subprocess
import sys

DOCS = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.normpath(os.path.join(DOCS, "..", "backend"))
DEPS = ("puppeteer-core", "ffmpeg-static")
USER = os.environ.get("CAPTURE_USER", "demo_admin")
PASS = os.environ.get("CAPTURE_PASS", "DemoPass!2026")

MK = (
    "from django.contrib.auth import get_user_model\n"
    "U = get_user_model()\n"
    "U.objects.filter(username={u!r}).delete()\n"
    "x = U.objects.create_user({u!r}, 'cap@example.com', {p!r})\n"
    "x.is_staff = x.is_superuser = True\n"
    "hasattr(x, 'role') and setattr(x, 'role', 'admin')\n"
    "x.save()\n"
)
RM = (
    "from django.contrib.auth import get_user_model\n"
    "get_user_model().objects.filter(username={u!r}).delete()\n"
)


def py():
    for c in (os.path.join(BACKEND, ".venv", "Scripts", "python.exe"),
              os.path.join(BACKEND, ".venv", "bin", "python"),
              sys.executable):
        if os.path.exists(c):
            return c
    return sys.executable


def manage(code):
    subprocess.check_call([py(), "manage.py", "shell", "-c", code], cwd=BACKEND)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-temp-user", action="store_true",
                    help="don't create/delete demo_admin; use an existing admin")
    args = ap.parse_args()

    npm, node = shutil.which("npm"), shutil.which("node")
    if not npm or not node:
        sys.exit("Node.js + npm are required and were not found on PATH.")

    if not os.path.isdir(os.path.join(DOCS, "node_modules", "puppeteer-core")):
        subprocess.check_call([npm, "install", "--no-save", *DEPS], cwd=DOCS)

    made = False
    try:
        if not args.no_temp_user:
            print(f"+ creating temp admin {USER}")
            manage(MK.format(u=USER, p=PASS))
            made = True
        subprocess.check_call([node, "_capture.js"], cwd=DOCS)
    finally:
        if made:
            print(f"+ removing temp admin {USER}")
            manage(RM.format(u=USER))


if __name__ == "__main__":
    main()
