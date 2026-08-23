from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from backend.main import main


if __name__ == "__main__":
    raise SystemExit(main())
