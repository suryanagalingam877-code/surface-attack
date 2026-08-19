from app.scanner.scope import normalize_domain

def test_normalizes_http_url():
    assert normalize_domain("https://Example.com/") == ("example.com", True, "Domain accepted.")

def test_rejects_command_like_input():
    assert normalize_domain("example.com; whoami")[1] is False

def test_rejects_path():
    assert normalize_domain("example.com/admin")[1] is False
