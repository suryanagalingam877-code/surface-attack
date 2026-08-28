import re
from urllib.parse import urlsplit

DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$", re.IGNORECASE)


def normalize_domain(value: str) -> tuple[str | None, bool, str]:
    if not value or not isinstance(value, str):
        return None, False, "Please enter a domain or website name."
    raw = value.strip()
    if not raw or any(char in raw for char in ("\r", "\n", ";", "|", "&", "`", "$", "\\")):
        return None, False, "Only a valid domain name or website URL is accepted."

    candidate = raw
    # If scheme not present but has slashes or path, normalize with dummy scheme for urlsplit
    if "://" not in candidate:
        candidate = f"https://{candidate}"

    try:
        parsed = urlsplit(candidate)
        hostname = parsed.hostname or parsed.path.split("/")[0]
    except Exception:
        hostname = raw.split("/")[0].split("?")[0].split("#")[0]

    # Strip port if present
    if hostname and ":" in hostname:
        hostname = hostname.split(":")[0]

    hostname = (hostname or "").strip().rstrip(".").lower()

    # If user entered just a website brand/name without a dot (e.g. "railfeast" or "google"), auto-append .com
    if hostname and "." not in hostname and re.match(r"^[a-z0-9-]+$", hostname):
        hostname = f"{hostname}.com"

    if not hostname or not DOMAIN_RE.fullmatch(hostname):
        return None, False, "Enter a valid domain name (e.g., example.com or https://example.com)."

    return hostname, True, "Domain accepted."

