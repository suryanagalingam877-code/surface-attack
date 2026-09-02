# Security checklist (Grok-aware)

- [ ] No secrets in git (use env vars / Secret Storage).
- [ ] Dependencies from trusted registries only.
- [ ] Input validation on all external data.
- [ ] Least privilege for file/shell tools.
- [ ] HTTPS / TLS for network clients.
- [ ] Avoid logging PII or tokens.
- [ ] Review generated code for injection (SQL, XSS, command).

Grok must refuse to hardcode credentials or disable security checks for convenience.
