import re
from urllib.parse import urlsplit

DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$", re.IGNORECASE)


def normalize_domain(value: str) -> tuple[str | None, bool, str]:
    raw = value.strip()
    if not raw or any(char in raw for char in ("\r", "\n", ";", "|", "&", "`", "$", "\\")):
        return None, False, "Only a domain name is accepted."
    candidate = raw
    if "://" in candidate:
        parsed = urlsplit(candidate)
        if parsed.scheme.lower() not in {"http", "https"} or parsed.username or parsed.password or parsed.query or parsed.fragment:
            return None, False, "Only an HTTP or HTTPS domain URL may be normalized."
        candidate = parsed.hostname or ""
        if parsed.path not in {"", "/"}:
            return None, False, "A target path is not accepted; provide a domain only."
    else:
        if "/" in candidate or "?" in candidate or "#" in candidate:
            return None, False, "A target path is not accepted; provide a domain only."
    candidate = candidate.rstrip(".").lower()
    if not DOMAIN_RE.fullmatch(candidate):
        return None, False, "Malformed domain name."
    return candidate, True, "Domain accepted."
