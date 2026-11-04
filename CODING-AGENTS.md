# Coding preferences

How I like to build software, in any project. A project's own `AGENTS.md` / `CLAUDE.md` overrides this where they conflict.

## Working with me

- I write in Chinese; reply in Chinese. Code, comments, commit messages and identifiers are in English.
- **Plan before code.** For anything beyond a small fix, write or update a plan document (`PLAN.md`) first: stages, design decisions, acceptance criteria. Expect several review rounds before implementing. When the design changes later, update the plan before the code.
- Decisions that are mine to make (naming, user-facing behaviour, scope, trade-offs): ask, with a recommendation. Details the plan leaves open: pick the simplest testable option and note it.
- **One stage at a time.** A stage is done when its acceptance criteria pass and I have tried it myself.
- **Commit only when I ask.** Keep commits focused: plan changes and code changes go in separate commits.
- Report honestly what was verified: unit tests, a live run, or nothing. Say so when something was skipped.
- Fix bugs when they are found rather than leaving them for later, but ask before expanding scope.
- Help me understand the code: when asked, explain flows with diagrams (Mermaid) in `docs/`.
- Write down the rules and patterns we settle on (in the project's `AGENTS.md`), and enforce them with tooling (lint rules, tests) where possible.

## Design

- **Design for where the project is going, not just the proof of concept.** State how the design would extend to cloud deployment, more users or more instances. Leave seams for that (per-instance state, config and secrets from the environment, interfaces at the edges), but do not build it before it is needed.
- **Ship in batches.** Core features first, enhancements second, ideas in a backlog with what was learned when they were researched.
- **Explicit over magic.** Prefer a clear manual action the user controls over automatic behaviour that guesses (e.g. the user sets their timezone; nothing auto-detects it). Settings that change often should be changeable at runtime, including adding and removing entries.
- AI features assist under the user's control: the user states preferences, the model applies them, and the user approves anything that writes.
- **Simple storage first.** Plain files (JSON, Markdown) before a database, until there is a real need. Keep only what is valuable (key facts, not full raw copies).
- All runtime data lives in one configurable data directory: the directory is in the repo, its contents are gitignored, and it is the volume a container mounts. Write files atomically.
- **Fail soft.** One failing input (a feed, an API) degrades its part of the output; it never takes down the whole run.
- **Secure by default.** Secrets never appear in logs, prompts or chat; redact centrally. Treat external content and model output as untrusted.
- Never depend on the host's environment implicitly: no system timezone, no hard-coded paths, no OS-specific tricks in the main flow.

## Code

- **SOLID.**
  - One responsibility per module and per file.
  - Depend on interfaces at the boundaries (model clients, chat platforms, storage) so a new implementation is added without changing callers.
  - Pass functions only what they use (`Pick<Config, ...>`, not the whole config).
  - Each module exposes a small public API (`index.ts`); nothing reaches into another module's files.
- **Functional by default.**
  - Pure functions for logic; side effects (network, files, clock, randomness) at the edges. Pass `now` in rather than reading the clock inside logic.
  - Errors that are expected are values (`{ ok, ... }` results), not exceptions.
  - Do not mutate inputs: copy before sorting, prefer `map`/`filter`/`flatMap` over mutable loops.
  - Compose small functions; avoid inheritance. Keep mutable state in a few clearly named places.
- **Structure by domain.** Top-level folders are modules (`sources/`, `llm/`, `chat/`), not a flat `src/`. Dependencies between modules point one way; enforce the layering with a lint rule.
- Cross-module imports use a path alias (Node subpath imports `#/*`, which work at runtime without a build step); imports inside a module stay relative.
- File and folder names are kebab-case. Choose names carefully; ask when unsure.
- Unit tests sit next to the code (`foo.ts` → `foo.test.ts`); shared fixtures in `test/`. Time-dependent code is tested under more than one `TZ`.
- Small functions, comments only where the reason is not obvious, formatter-enforced style.

## Tooling and delivery

- TypeScript strict, ESM. pnpm, with the version pinned in `packageManager`.
- Dependencies pinned to exact versions; install with the lockfile frozen. Prefer few dependencies, and no framework or database without a reason.
- Every change passes tests, lint (including the module-boundary rule) and typecheck before it is called done.
- Run in Docker rather than OS-specific service managers: config mounted read-only, data directory as a volume, secrets from environment variables, graceful shutdown on SIGTERM, logs to stdout.
- When dependencies or the Dockerfile change, rebuild the image and check the container starts.

## Git commits

- Do not add `Co-Authored-By:` trailers to commit messages.
- Do not add "Generated with …" or similar attribution lines to commits or PR descriptions.
- Commit messages should contain only the summary line and an optional body describing the change.
