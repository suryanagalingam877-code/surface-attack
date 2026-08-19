import socket
import ssl
from datetime import datetime, timezone
from app.core.config import settings


def _name(entries: tuple) -> str | None:
    for group in entries or ():
        for key, value in group:
            if key in {"commonName", "organizationName"}: return value
    return None


def analyze_tls(domain: str) -> dict:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=settings.request_timeout) as raw:
            with context.wrap_socket(raw, server_hostname=domain) as connection:
                certificate = connection.getpeercert()
                not_before = datetime.strptime(certificate["notBefore"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                not_after = datetime.strptime(certificate["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                days_remaining = (not_after - datetime.now(timezone.utc)).days
                status = "EXPIRED" if days_remaining < 0 else "EXPIRING" if days_remaining <= 30 else "VALID"
                return {"status": status, "source": "TLS_CERTIFICATE", "subject": _name(certificate.get("subject")), "issuer": _name(certificate.get("issuer")), "serial_number": certificate.get("serialNumber"), "not_before": not_before.isoformat(), "not_after": not_after.isoformat(), "days_remaining": days_remaining, "hostname_match": True, "tls_version": connection.version()}
    except ssl.CertificateError as exc: return {"status": "HOSTNAME_MISMATCH", "hostname_match": False, "error": str(exc)}
    except Exception as exc: return {"status": "ERROR", "error": str(exc)}
