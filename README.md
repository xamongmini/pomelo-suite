# Pomelo Suite

Pomelo Suite is an npm workspace for browser and Node.js packages that are being prepared for public GitHub and npm releases.

## Version Status

- Root workspace: `0.1.0`
- `@pomelo-suite/spangrid`: `0.1.1` (patch release)
- `@pomelo-suite/timeline`: `0.1.1` (patch release)
- Other public packages: `0.1.0`

Initial public packages:

- `@pomelo-suite/calculator`
- `@pomelo-suite/color-picker`
- `@pomelo-suite/diagram`
- `@pomelo-suite/input`
- `@pomelo-suite/runtime`
- `@pomelo-suite/scheduler`
- `@pomelo-suite/timeline`
- `@pomelo-suite/workqueue`

## Public Packages

| Package | Path | Purpose |
|---|---|---|
| `@pomelo-suite/spangrid` | `packages/spangrid` | Canvas data grid with cell span support |
| `@pomelo-suite/calculator` | `packages/calculator` | Expression evaluator and script utilities |
| `@pomelo-suite/scheduler` | `packages/scheduler` | Scheduler primitives |
| `@pomelo-suite/workqueue` | `packages/workqueue` | Queue and worker-thread utilities |
| `@pomelo-suite/runtime` | `packages/runtime` | Runtime and agent workflow primitives |
| `@pomelo-suite/color-picker` | `packages/color-picker` | Canvas HSV color picker |
| `@pomelo-suite/input` | `packages/input` | Canvas text input control |
| `@pomelo-suite/timeline` | `packages/timeline` | Canvas timeline editor |
| `@pomelo-suite/diagram` | `packages/diagram` | Diagram data and rendering utilities |

Each package publishes only its library payload:

- `src`
- `README.md`
- `LICENSE`
- `package.json`

Examples, repository docs, tests, drafts, logs, and development artifacts are kept outside npm package payloads.

## Examples

Public examples are kept under `examples`.

- `examples/spangrid`: SpanGrid demos, including query analyzer, meta management, and spreadsheet-style samples.
- `examples/diagram`: Diagram renderer and editor samples.
- `examples/runtime`: Runtime playground and Node snippets.
- `examples/package-studio`: Multi-package browser playground.

## Release Docs

Release and publish procedures are documented in:

- [docs/release.md](docs/release.md)
- [docs/release-notes.md](docs/release-notes.md)

## Workspace Commands

```bash
npm run check
npm run pack:dry-run
npm run package-studio
npm run runtime-playground
```

## Ecosystem

Pomelo Suite is the foundational layer of a three-project open-source stack:

| Layer | Project | Role |
|-------|---------|------|
| **Primitives** | **Pomelo Suite** (this repo) | Canvas UI components and Node.js runtime utilities |
| Format + Engine | [XCON Viewer](https://github.com/xamongmini/xcon-viewer) | Document format, safe renderer, CLI, and framework adapters that use Pomelo Suite internally |
| Product | XV Desk | Electron developer workbench — multi-terminal, MCP bridge, XCON live preview |

You do not need XCON Viewer to use Pomelo Suite packages.
SpanGrid, scheduler, workqueue, and the other packages work independently
in any browser or Node.js project.

If you want to see how Pomelo Suite components are used to render rich visual
documents from LLM output, see
[XCON Viewer — docs/ecosystem.md](https://github.com/xamongmini/xcon-viewer/blob/main/docs/ecosystem.md).

## License

MIT
