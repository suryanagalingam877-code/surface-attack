from http.cookies import SimpleCookie


def parse_cookies(headers: dict, set_cookie_headers: list[str] | None = None) -> list[dict]:
    raw_values = list(set_cookie_headers or [])
    if not raw_values:
        raw_values = [value for key, value in headers.items() if key.lower() == "set-cookie"]
    cookies = []
    for raw in raw_values:
        parsed = SimpleCookie(); parsed.load(raw)
        for name, morsel in parsed.items():
            cookies.append({"name": name, "secure": bool(morsel["secure"]), "httponly": bool(morsel["httponly"]), "samesite": morsel["samesite"] or None, "domain": morsel["domain"] or None, "path": morsel["path"] or None, "expires": morsel["expires"] or None, "max_age": morsel["max-age"] or None})
    return cookies
