# AGENTS.md — Grok Chat rules for this project

> Auto-generated for **Grok Chat** (xGrok). Keep this file updated so the agent stays efficient.

## Project
- **Name / stack:** Python app · Python 3.11+
- **Primary language:** Python
- **Architecture:** Strictly **Web-based** (FastAPI backend + Browser UI) & **Terminal-based** (Python CLI) only. Never convert to native desktop/mobile apps.
- **Run Web:** `python main.py` or `./run.sh` / `.\run.ps1`
- **Run CLI:** `python main.py <domain> --cli`
- **Test:** `pytest`


## How Grok should work here
1. Prefer **read_file / write_file** over shell for source changes.
2. Write **complete files** (no partial patches unless asked).
3. Stay inside the workspace; never invent secrets or API keys.
4. After tools, give a short summary: what changed + paths.
5. Match existing style (format, naming, folder layout).
6. Do not open editor tabs for the user — files are saved on disk by tools.

## Layout
- `src/` — package
- `tests/` — pytest
- `pyproject.toml` — deps

## Quality bar
- Clear names, small functions, typed public APIs when the language supports it.
- Handle errors explicitly; no silent swallows.
- Keep configs (tsconfig, eslint, go.mod, etc.) consistent with the stack.

## Security (non-negotiable)
- Never commit secrets, tokens, or `.env` with real credentials.
- Validate untrusted input at boundaries (HTTP, CLI, file upload).
- Prefer dependency lockfiles; avoid `eval` / dynamic code execution.
- Path access only under project root (no `../` escapes).

## Context efficiency
- Read only files needed for the task.
- Avoid dumping entire `node_modules` / build dirs.
- Prefer focused edits over drive-by refactors.

## Commands Grok may use
- Build/test/package via allowlisted terminal tools only.
- Prefer project scripts over ad-hoc one-liners.

See also: `.xgrok/BEST_PRACTICES.md`, `.xgrok/SECURITY.md`.
