from app.scanner.scope import normalize_domain

def test_normalizes_http_url():
    assert normalize_domain("https://Example.com/") == ("example.com", True, "Domain accepted.")

def test_rejects_command_like_input():
    assert normalize_domain("example.com; whoami")[1] is False

def test_rejects_path():
    assert normalize_domain("example.com/admin")[1] is False

def test_list_scans_and_delete_api():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    res = client.post("/api/scan", json={"domain": "history-test.example.com"})
    assert res.status_code == 202
    scan_id = res.json()["scan_id"]
    list_res = client.get("/api/scans")
    assert list_res.status_code == 200
    data = list_res.json()
    assert "scans" in data
    assert any(s.get("scan_id") == scan_id for s in data["scans"])
    del_res = client.delete(f"/api/scan/{scan_id}")
    assert del_res.status_code == 200

