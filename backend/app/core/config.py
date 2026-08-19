from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    database_url: str = f"sqlite:///{(BASE_DIR / 'recon.db').as_posix()}"
    request_timeout: float = 10.0
    max_concurrency: int = 8
    request_delay: float = 0.15
    user_agent: str = "ReconConsole/0.1 (authorized educational reconnaissance)"
    max_redirects: int = 5
    max_response_size: int = 2_000_000
    subdomain_wordlist: str = str(BASE_DIR / "wordlists" / "subdomains.txt")
    report_directory: str = str(BASE_DIR / "reports")
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
