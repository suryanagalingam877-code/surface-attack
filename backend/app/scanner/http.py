import time
import httpx
from app.core.config import settings


def request_url(url: str) -> dict:
    started = time.perf_counter()
    try:
        with httpx.Client(follow_redirects=True, max_redirects=settings.max_redirects, timeout=settings.request_timeout, verify=True, headers={"User-Agent": settings.user_agent}) as client:
            response = client.get(url)
            content = response.content[: settings.max_response_size]
            return {"status": "completed", "source": "HTTP_RESPONSE", "status_code": response.status_code, "final_url": str(response.url), "redirect_chain": [str(item.url) for item in response.history] + [str(response.url)], "headers": dict(response.headers), "set_cookie_headers": response.headers.get_list("set-cookie"), "content_type": response.headers.get("content-type"), "server": response.headers.get("server"), "response_time": round(time.perf_counter() - started, 3), "body": content.decode(response.encoding or "utf-8", "replace"), "https_available": response.url.scheme == "https"}
    except Exception as exc:
        return {"status": "error", "error": str(exc), "response_time": round(time.perf_counter() - started, 3), "https_available": url.startswith("https://")}


def recon_domain(domain: str) -> dict:
    https = request_url(f"https://{domain}")
    http = request_url(f"http://{domain}")
    selected = https if https.get("status") == "completed" else http
    return {"https": {key: value for key, value in https.items() if key != "body"}, "http": {key: value for key, value in http.items() if key != "body"}, "status": selected.get("status"), "status_code": selected.get("status_code"), "final_url": selected.get("final_url"), "redirect_chain": selected.get("redirect_chain", []), "headers": selected.get("headers", {}), "set_cookie_headers": selected.get("set_cookie_headers", []), "content_type": selected.get("content_type"), "server": selected.get("server"), "response_time": selected.get("response_time"), "https_available": https.get("status") == "completed", "body": selected.get("body", "")}
