from app.scanner.http import request_url


def analyze_robots(domain: str) -> dict:
    response = request_url(f"https://{domain}/robots.txt")
    if response.get("status") != "completed": response = request_url(f"http://{domain}/robots.txt")
    if response.get("status") != "completed": return {"exists": False, "status": response.get("status"), "error": response.get("error")}
    content = response.get("body", "")
    exists = response.get("status_code") == 200 and "user-agent" in content.lower()
    paths = [line.split(":", 1)[1].strip() for line in content.splitlines() if line.lower().startswith(("disallow:", "allow:")) and ":" in line and line.split(":", 1)[1].strip()]
    return {"exists": exists, "status": response.get("status_code"), "content": content, "discovered_paths": paths}
