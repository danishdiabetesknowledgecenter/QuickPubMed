# Copilot Instructions

This repository must be handled with a security-first workflow. Keep changes small, reuse existing code, and avoid changing existing behavior unless explicitly requested.

## Terminal and Inspection Policy

- Do not use terminal commands for routine code inspection. Prefer editor-native file reads, code search, glob search, semantic search, and other read-only tools.
- Do not run PowerShell, cmd, bash, or other shell wrappers for broad keyword scans unless the user explicitly approves the exact command after a clear explanation.
- Do not run commands that resemble download-and-execute behavior, including combinations of `curl`, `wget`, `Invoke-WebRequest`, `iwr`, `irm`, `Invoke-Expression`, `iex`, `Start-Process`, encoded commands, or temporary script execution.
- Do not use obfuscated commands, base64 command payloads, hidden windows, scheduled tasks, registry edits, service changes, Defender/AMSI changes, firewall changes, or execution-policy changes.
- Before any security-sensitive terminal command, show the exact command, explain why it is needed, and ask for approval.

## Code Security Policy

- Do not introduce PHP shell execution functions such as `exec`, `shell_exec`, `system`, `passthru`, `proc_open`, `popen`, or backtick execution unless the user explicitly requests it and a security review is included.
- Do not disable TLS or certificate verification, including `verify_peer => false`, `verify_peer_name => false`, `CURLOPT_SSL_VERIFYPEER => false`, `CURLOPT_SSL_VERIFYHOST => 0`, or equivalent settings.
- Do not add broad CORS rules such as `Access-Control-Allow-Origin: *` for authenticated or production endpoints.
- Do not reflect arbitrary origins. Use explicit allowlists for trusted domains.
- Do not add code that downloads remote content and executes it.
- Do not expose secrets, credentials, tokens, extracted article text, diagnostic metadata, or internal paths in API responses or logs.

## Dependency and Build Policy

- Do not run forceful dependency updates such as `npm audit fix --force` without explicit approval.
- Avoid major version upgrades unless the user asks for them or a reviewed migration plan exists.
- Prefer removing unused dependencies and using existing project utilities before adding new packages.
- After code changes, run the smallest relevant verification step, such as syntax checks, targeted linting, or a build, when appropriate.

## Implementation Policy

- Make the smallest safe change that solves the requested problem.
- Reuse existing helpers, patterns, and configuration structures.
- Do not refactor unrelated code.
- Do not change public API behavior, persisted data formats, authentication, authorization, CORS, or deployment behavior unless the task specifically requires it.
- If a requested action could trigger security tooling or weaken production security, pause and ask the user for confirmation.
