import importlib.util
import os
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_DIR))

# Auto-provision .env if missing
env_file = BACKEND_DIR / ".env"
env_example = BACKEND_DIR / ".env.example"
if not env_file.is_file() and env_example.is_file():
    try:
        shutil.copy(env_example, env_file)
    except Exception:
        pass


def _backend_python() -> Path | None:
    candidates = (
        PROJECT_ROOT / ".venv" / "Scripts" / "python.exe",
        PROJECT_ROOT / ".venv" / "bin" / "python",
        BACKEND_DIR / ".venv" / "Scripts" / "python.exe",
        BACKEND_DIR / ".venv" / "bin" / "python",
    )
    return next((path for path in candidates if path.is_file()), None)


if importlib.util.find_spec("fastapi") is None:
    backend_python = _backend_python()
    if backend_python and Path(sys.executable).resolve() != backend_python.resolve():
        os.execv(str(backend_python), [str(backend_python), str(PROJECT_ROOT / "main.py"), *sys.argv[1:]])
    raise SystemExit(
        "Dependencies are missing.\n"
        "To set up automatically, run:\n"
        "  Windows (CMD):        run.bat\n"
        "  Windows (PowerShell): .\\run.ps1\n"
        "  Linux / macOS:        ./run.sh\n"
        "Or manually: python -m pip install -r backend/requirements.txt"
    )

from backend.main import main


if __name__ == "__main__":
    raise SystemExit(main())

