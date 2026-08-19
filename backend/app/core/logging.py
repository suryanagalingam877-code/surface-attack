import logging


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s scan=%(scan_id)s module=%(module)s event=%(message)s",
        defaults={"scan_id": "-", "module": "system"},
    ))
    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(logging.INFO)


def scan_logger(scan_id: str, module: str) -> logging.LoggerAdapter:
    return logging.LoggerAdapter(logging.getLogger("recon"), {"scan_id": scan_id, "module": module})
