from pathlib import Path
import importlib.util
import os
import sys


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))


def _backend_python() -> Path | None:
    candidates = (
        BACKEND_DIR / ".venv" / "Scripts" / "python.exe",
        BACKEND_DIR / ".venv" / "bin" / "python",
    )
    return next((path for path in candidates if path.is_file()), None)


if importlib.util.find_spec("fastapi") is None:
    backend_python = _backend_python()
    if backend_python and Path(sys.executable).resolve() != backend_python.resolve():
        os.execv(str(backend_python), [str(backend_python), str(BACKEND_DIR / "main.py"), *sys.argv[1:]])
    raise SystemExit("Dependencies are missing. Run: python -m pip install -r backend\\requirements.txt")

from backend.main import main


if __name__ == "__main__":
    raise SystemExit(main())
