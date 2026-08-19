HEADER_RULES = {"Content-Security-Policy": "CSP", "Strict-Transport-Security": "HSTS", "X-Content-Type-Options": "Content type sniffing protection", "X-Frame-Options": "Clickjacking protection", "Referrer-Policy": "Referrer policy", "Permissions-Policy": "Permissions policy"}


def analyze_headers(headers: dict, url: str | None) -> list[dict]:
    normalized = {key.lower(): value for key, value in headers.items()}
    output = []
    for header, description in HEADER_RULES.items():
        value = normalized.get(header.lower())
        output.append({"header": header, "present": value is not None, "value": value, "classification": "Present" if value is not None else "Missing", "evidence": f"{header} observed in HTTP response." if value is not None else f"{header} was not observed in HTTP response.", "source": "HTTP_RESPONSE_HEADER", "affected_url": url})
    return output
