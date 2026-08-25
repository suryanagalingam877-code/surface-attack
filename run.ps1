Write-Host "===================================================" -ForegroundColor Cyan
Write-Host " SURFACE ATTACK RECON CONSOLE - Automated Launcher" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

if (-not (Test-Path ".venv")) {
    Write-Host "[*] Initializing Python virtual environment..." -ForegroundColor Yellow
    try { py -3.11 -m venv .venv } catch { python -m venv .venv }
}

if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    & ".\.venv\Scripts\Activate.ps1"
}

if (-not (Test-Path "backend\.env") -and (Test-Path "backend\.env.example")) {
    Copy-Item "backend\.env.example" "backend\.env"
}

try {
    python -c "import fastapi" 2>$null
    if ($LASTEXITCODE -ne 0) { throw "missing" }
} catch {
    Write-Host "[*] Installing backend dependencies..." -ForegroundColor Yellow
    python -m pip install -r backend\requirements.txt
}

Write-Host "[*] Launching Recon Console..." -ForegroundColor Green
python main.py $args
