#!/usr/bin/env bash
set -e
echo "==================================================="
echo " SURFACE ATTACK RECON CONSOLE - Automated Launcher"
echo "==================================================="
cd "$(dirname "$0")"

if [ ! -d ".venv" ]; then
    echo "[*] Initializing virtual environment..."
    python3 -m venv .venv || python -m venv .venv
fi

if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi

if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
    cp backend/.env.example backend/.env
fi

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "[*] Installing dependencies..."
    python3 -m pip install -r backend/requirements.txt
fi

echo "[*] Starting Recon Console..."
python3 main.py "$@"
