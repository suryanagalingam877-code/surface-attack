# Best practices — Python

## Development
- One clear responsibility per module/file.
- Prefer composition over deep inheritance.
- Name things for the domain, not the implementation.
- Keep PRs / changes small and reviewable.

## For AI agents (Grok)
- State assumptions; verify with read_file before large rewrites.
- Do not regenerate unrelated files.
- Preserve comments that encode business rules.
- When adding deps, explain why and pin versions when possible.

## Testing
- Unit-test pure logic; integration-test boundaries.
- Deterministic tests (no flaky network without mocks).

## Docs
- Update README / AGENTS.md when commands or layout change.
