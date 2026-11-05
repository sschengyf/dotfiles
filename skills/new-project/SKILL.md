---
name: new-project
description: "Scaffold a new TypeScript/Node project the way I like it — pnpm with exact pins, strict ESM, domain modules with an eslint-enforced layering rule and #/ subpath imports, tests beside the code, Docker, a gitignored data/ folder, and PLAN.md/AGENTS.md. Use when starting a new project or repo, or when asked to set up a project skeleton."
---

# New project

Sets up a project skeleton that follows `~/dotfiles/CODING-AGENTS.md`. Templates are in `templates/` next to this file.

## 0. Ask first

Before creating anything, confirm with the user (one AskUserQuestion round, with recommendations):

- Project name and folder.
- What it does, in a sentence or two, and whether it is a long-running service, a CLI or a library (a library skips Docker and `data/`).
- Rough modules, lowest layer first (e.g. `infra → domain → app`). Fine to start with `infra` and `app` only.
- Whether it should run in Docker from the start (default yes for services).

Do not scaffold over an existing non-empty folder without asking.

## 1. Plan before code

Write `PLAN.md` first and let the user review it before writing code:

1. Goal and non-goals.
2. Architecture: modules and their layer order, data flow.
3. Code structure and rules (point to `AGENTS.md`).
4. Data and config: what lives in `data/`, what in config, which secrets come from environment variables.
5. Stages, each with concrete acceptance criteria. Split into batches: core first, enhancements second.
6. How it will scale or move later (cloud, more users, more instances), and which seams the first version leaves for that.
7. Backlog.

Then write the project's `AGENTS.md`: language rules (reply in Chinese; code, comments and commits in English), the checks to run, the code layout rules below, and project-specific rules as they come up. Add `CLAUDE.md` containing only `@AGENTS.md`.

## 2. Tooling

```sh
git init
pnpm init
```

`package.json`:

- `"private": true`, `"type": "module"`, `"packageManager": "pnpm@<current>"` (from `pnpm --version`), `"engines": { "node": ">=<major>" }`.
- `"imports": { "#/*": "./src/*" }` — Node subpath imports; works at runtime with tsx and in tsc without a build step. Do not use tsconfig `paths`.
- Scripts:
  ```json
  "start": "tsx src/index.ts",
  "test": "TZ=UTC vitest run && TZ=<user's zone, e.g. Pacific/Auckland> vitest run",
  "lint": "eslint . && prettier --check .",
  "format": "prettier --write .",
  "typecheck": "tsc --noEmit"
  ```

Copy from `templates/`: `pnpm-workspace.yaml` (saveExact, allowBuilds), `tsconfig.json` (strict, NodeNext, noUncheckedIndexedAccess, verbatimModuleSyntax, noEmit), `.prettierrc.json`, `vitest.config.ts`, `eslint.config.js`, `gitignore` → `.gitignore`.

Install the current versions (they get pinned exactly by `saveExact`):

```sh
pnpm add tsx zod
pnpm add -D typescript @types/node vitest eslint @eslint/js typescript-eslint eslint-config-prettier prettier
```

`tsx` is a runtime dependency when the app runs from source in Docker. Add other dependencies only when a stage needs them; prefer few.

## 3. Layout

```
src/
  index.ts            entry point: parse args, start app
  infra/              lowest layer: config, logger, fs helpers
    index.ts          the module's public API
  app/                top layer: wiring and lifecycle
    index.ts
test/                 shared helpers and fixtures only
data/README.md        what the app writes here; contents gitignored
config.example.toml   or .env.example; the real one is gitignored
```

- Set `LAYERS` in `eslint.config.js` to the agreed modules, lowest first. The rule enforces: imports into another module only via its `index.ts`, `#/` for cross-module imports, relative imports inside a module, dependencies only downward. `*.test.ts` may reach into internal files.
- `src/infra/logger.ts` is the only file allowed to use `console` (the eslint config already exempts it); it redacts registered secrets.
- `src/infra/fs.ts` provides `writeFileAtomic` (temp file in the same directory, fsync, rename); all runtime writes go through it into the configurable `data_dir`.
- Config is validated with zod at startup; environment variables override secrets.
- Kebab-case file names. Tests beside the code: `foo.ts` → `foo.test.ts`.
- Write a first test for something real in `infra` so `pnpm test` has something to run.

## 4. Docker (services only)

Copy `templates/Dockerfile`, `templates/compose.yaml` and `templates/dockerignore` → `.dockerignore`. Replace `__NODE_VERSION__` with an exact current Node version and `__SERVICE__` with the project name. The app must handle SIGTERM: stop accepting work, finish what is in progress (bounded wait), then exit.

## 5. Verify and hand over

```sh
pnpm install --frozen-lockfile
pnpm test && pnpm lint && pnpm typecheck
docker compose build && docker compose up -d && docker compose logs   # services only
```

Also check that the boundary rule really fires: add a temporary file with a deep cross-module import, confirm `pnpm lint` reports it, delete the file.

Report what was created and what was verified. Do not commit until the user asks; the first commit should not contain `data/` contents, real config or secrets.
