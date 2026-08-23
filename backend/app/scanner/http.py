import time
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings

def parse_hsts(value: str | None) -> dict:
    parts = {part.strip().lower() for part in value.split(";")} if value else set()
    return {"present": bool(value), "raw_value": value, "max_age": next((part.split("=", 1)[1] for part in parts if part.startswith("max-age=") and "=" in part), None), "include_subdomains": "includesubdomains" in parts, "preload": "preload" in parts, "source": "HTTP_RESPONSE_HEADER"}

def detect_mixed_content(body: str) -> list[dict]:
    soup = BeautifulSoup(body or "", "html.parser")
    return [{"url": value, "element": tag.name, "attribute": attribute, "source": "HTML_SOURCE"} for tag in soup.find_all(["script", "img", "iframe", "link", "form"]) for attribute in ("src", "href", "action") if (value := tag.get(attribute)) and value.lower().startswith("http://")]


def request_url(url: str) -> dict:
    started = time.perf_counter()
    try:
        with httpx.Client(follow_redirects=True, max_redirects=settings.max_redirects, timeout=settings.request_timeout, verify=True, headers={"User-Agent": settings.user_agent}) as client:
            response = client.get(url)
            content = response.content[: settings.max_response_size]
            return {"status": "completed", "source": "HTTP_RESPONSE", "status_code": response.status_code, "final_url": str(response.url), "redirect_chain": [str(item.url) for item in response.history] + [str(response.url)], "redirect_details": [{"status_code": item.status_code, "location": item.headers.get("location"), "url": str(item.url)} for item in response.history], "headers": dict(response.headers), "set_cookie_headers": response.headers.get_list("set-cookie"), "content_type": response.headers.get("content-type"), "server": response.headers.get("server"), "response_time": round(time.perf_counter() - started, 3), "body": content.decode(response.encoding or "utf-8", "replace"), "https_available": response.url.scheme == "https"}
    except Exception as exc:
        return {"status": "error", "error": str(exc), "response_time": round(time.perf_counter() - started, 3), "https_available": url.startswith("https://")}


def recon_domain(domain: str) -> dict:
    https = request_url(f"https://{domain}")
    http = request_url(f"http://{domain}")
    selected = https if https.get("status") == "completed" else http
    http_final = http.get("final_url") or ""
    https_final = https.get("final_url") or ""
    redirect_to_https = http.get("status") == "completed" and http_final.startswith("https://")
    mixed_content = detect_mixed_content(https.get("body", "")) if https.get("status") == "completed" else []
    hsts = https.get("headers", {}).get("strict-transport-security")
    return {"https": {key: value for key, value in https.items() if key != "body"}, "http": {key: value for key, value in http.items() if key != "body"}, "status": selected.get("status"), "status_code": selected.get("status_code"), "final_url": selected.get("final_url"), "redirect_chain": selected.get("redirect_chain", []), "redirect_details": http.get("redirect_details", []), "http_to_https": {"state": "ENFORCED" if redirect_to_https else "NOT_ENFORCED" if http.get("status") == "completed" else "UNKNOWN", "original_url": f"http://{domain}", "final_url": http_final, "location": next((item.get("location") for item in http.get("redirect_details", []) if item.get("location")), None), "evidence": "HTTP request ended on HTTPS." if redirect_to_https else "HTTP request did not end on HTTPS." if http.get("status") == "completed" else "HTTP response unavailable."}, "hsts": parse_hsts(hsts), "mixed_content": mixed_content, "headers": selected.get("headers", {}), "set_cookie_headers": selected.get("set_cookie_headers", []), "content_type": selected.get("content_type"), "server": selected.get("server"), "response_time": selected.get("response_time"), "https_available": https.get("status") == "completed", "body": selected.get("body", "")}
