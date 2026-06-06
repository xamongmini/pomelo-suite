# Pomelo Suite Runtime Playground

From the Pomelo Suite repository root, run:

```powershell
npm run runtime-playground
```

The same server can be started directly:

```powershell
node examples/runtime/server.js
```

Open the printed URL, normally `http://127.0.0.1:4173`.

The playground uses the real `@pomelo-suite/runtime` package exports through a local Node server. It covers:

- Work queue with bounded concurrency and wait timeout checks
- Scheduler runtime dispatch with optional WorkQueue handoff
- Calculator and script parser wrappers
- `TumblrRuntime` legacy runtime engine
- Adapter-backed action routing with mock adapters
- CPU worker-thread tasks through WorkQueue
- Registered agent tool and skill workflow through Scheduler and WorkQueue
- Common crypto and timestamp helpers

External actions use mock adapters here. The playground does not run real shell, SSH, SQL, terminal, or network side effects.

## Node Snippets

Small focused snippets live under `examples/runtime/snippets`:

```powershell
node examples/runtime/snippets/scheduler.js
node examples/runtime/snippets/work-queue.js
node examples/runtime/snippets/common-crypto.js
```

These snippets use the local workspace source and are not included in the npm package payload.
