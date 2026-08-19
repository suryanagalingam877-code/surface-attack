import xml.etree.ElementTree as ET
from app.scanner.http import request_url


def analyze_sitemap(domain: str) -> dict:
    for location in (f"https://{domain}/sitemap.xml", f"http://{domain}/sitemap.xml"):
        response = request_url(location)
        if response.get("status") != "completed": continue
        if response.get("status_code") != 200: continue
        try:
            root = ET.fromstring(response.get("body", ""))
            urls = [element.text for element in root.iter() if element.tag.lower().endswith("}loc") and element.text]
            return {"exists": True, "status": response["status_code"], "urls": urls, "location": location}
        except ET.ParseError as exc: return {"exists": False, "status": response["status_code"], "urls": [], "error": str(exc)}
    return {"exists": False, "status": "not_found", "urls": []}
