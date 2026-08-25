@echo off
echo ===================================================
echo  SURFACE ATTACK RECON CONSOLE - Automated Launcher
echo ===================================================
cd /d "%~dp0"

if not exist ".venv" (
    echo [*] Initializing Python virtual environment...
    py -3.11 -m venv .venv 2>nul || python -m venv .venv
)

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
    )
)

python -c "import fastapi" 2>nul
if %errorlevel% neq 0 (
    echo [*] Installing backend dependencies...
    python -m pip install -r backend\requirements.txt
)

echo [*] Launching Reconnaissance Console...
python main.py %*
if %errorlevel% neq 0 pause
