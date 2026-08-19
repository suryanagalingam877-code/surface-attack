import dns.resolver
from app.core.config import settings

RECORD_TYPES = ("A", "AAAA", "CNAME", "MX", "NS", "TXT")


def query_dns(domain: str) -> dict:
    resolver = dns.resolver.Resolver()
    resolver.timeout = settings.request_timeout
    resolver.lifetime = settings.request_timeout
    records = {}
    errors = []
    for record_type in RECORD_TYPES:
        try:
            answers = resolver.resolve(domain, record_type, search=False)
            values = []
            for answer in answers:
                if record_type == "MX": values.append({"preference": answer.preference, "exchange": answer.exchange.to_text().rstrip(".")})
                elif record_type == "TXT": values.append("".join(chunk.decode("utf-8", "replace") for chunk in answer.strings))
                else: values.append(answer.to_text().rstrip("."))
            records[record_type] = values
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN): records[record_type] = []
        except Exception as exc: records[record_type] = []; errors.append({"record_type": record_type, "error": str(exc)})
    return {"status": "error" if errors and not any(records.values()) else "completed", "source": "DNS_QUERY", "records": records, "errors": errors}


def resolve_hostname(hostname: str) -> list[str]:
    try:
        return sorted({item[4][0] for item in __import__("socket").getaddrinfo(hostname, None, type=__import__("socket").SOCK_STREAM)})
    except OSError:
        return []
