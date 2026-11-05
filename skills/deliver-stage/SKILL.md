---
name: deliver-stage
description: Finish a stage or change properly before calling it done — run every check, verify for real where tests are not enough, update PLAN.md/README/docs, report honestly what was and was not verified, and wait for the user to say commit. Use when a stage or feature is implemented, when the user asks "做完了吗" / "都测试了吗", or before proposing a commit.
---

# Deliver a stage

A stage is done when its acceptance criteria in `PLAN.md` pass and the user has tried it. This is the checklist for getting there. Follow the project's `AGENTS.md` where it is more specific.

## 1. Check against the plan

- Re-read the stage in `PLAN.md`. Go through each acceptance criterion and note how it is covered: unit test (name it), live run, or not yet.
- If the implementation differs from the plan, update `PLAN.md` to match (or fix the code). Details the plan left open: note the choice in README's design notes.

## 2. Run every check

Run the project's checks (typically all three):

```sh
pnpm test        # in every TZ the script covers
pnpm lint        # including the module-boundary rule and prettier
pnpm typecheck
```

All must pass. Do not weaken a test, a lint rule or a type to make them pass; if one seems wrong, say so and ask.

For a bug fix, the new test must fail before the fix and pass after it — run it both ways.

## 3. Verify for real

Unit tests are not enough when the change touches the outside world:

- External data, models or prompts: run the real thing (e.g. a dry-run command) and read the output. For prompt changes, compare several runs.
- Dependencies, `Dockerfile` or `compose.yaml` changed: `docker compose build`, `docker compose up -d`, check `docker compose logs`. Confirm the running container uses the new code.
- Startup, shutdown, locking or scheduling: start it, stop it with SIGTERM, restart it.
- Chat or UI features: the user verifies. Give them the exact commands or steps to try.

Never print secrets while doing this.

## 4. Update the docs

- `README.md`: new commands, config options, setup steps, troubleshooting.
- `config.example.*`, `data/README.md`: new settings or files.
- `docs/` (e.g. code-flow diagrams) if the flow changed.
- `AGENTS.md`: any new rule or pattern we settled on during the stage.
- Every copy of duplicated text (e.g. a prompt quoted in the plan) stays in sync.

## 5. Report

In Chinese, short:

- What changed (files or areas, one line each).
- Checks: results with numbers (e.g. "277 tests × 2 时区通过，lint、typecheck 通过").
- Verified for real: what was run and what was seen.
- **Not verified**: anything only covered by unit tests, anything the user must try, any check skipped and why. Be explicit; do not imply more than was done.
- What the user should try, as concrete steps.
- Open questions or follow-ups.

## 6. Commit only when asked

Do not commit until the user says so (e.g. "提交", "试了，可以，提交"). Then:

- `git status` first; never commit secrets, real config, `data/` contents or editor folders.
- Separate commits for separate concerns (plan changes vs code, refactors vs features).
- English commit message: a short summary line, optionally a body with what and why. No `Co-Authored-By:` trailers or other attribution lines.
- After committing, if the app runs in Docker, say whether the image and container need rebuilding — and rebuild if the user asked for it.
