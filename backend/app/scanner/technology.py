from bs4 import BeautifulSoup


def detect_technologies(headers: dict, body: str, cookies: list[dict]) -> list[dict]:
    found = []
    lower_headers = {key.lower(): value for key, value in headers.items()}
    if lower_headers.get("server"): found.append({"technology": lower_headers["server"], "category": "Web server", "evidence": "Server HTTP response header", "confidence": "observed"})
    if lower_headers.get("x-powered-by"): found.append({"technology": lower_headers["x-powered-by"], "category": "Runtime", "evidence": "X-Powered-By HTTP response header", "confidence": "observed"})
    soup = BeautifulSoup(body or "", "html.parser")
    generator = soup.find("meta", attrs={"name": lambda value: value and value.lower() == "generator"})
    if generator and generator.get("content"): found.append({"technology": generator["content"], "category": "CMS / generator", "evidence": "HTML generator meta tag", "confidence": "observed"})
    return found
