# @pomelo-suite/runtime

Experimental Pomelo Suite runtime and agent workflow layer.

## Install

```sh
npm install @pomelo-suite/runtime
```

## Requirements

Node.js 18 or newer.

## CommonJS Usage

```js
const {
  TumblrRuntime,
  getAttributeWithPath,
} = require('@pomelo-suite/runtime');

const runtime = new TumblrRuntime();
const controller = runtime.loadTumbler('demo', {
  type: 'DEFAULT',
  action: {
    type: 'message',
    ProcessID: 'P1',
    msg: 'hello {@parameter.name}',
  },
}, {
  name: 'world',
});

controller.execute();

console.log(getAttributeWithPath(controller.Data, 'record.responseData.ResultMsg'));
console.log(controller.Return.process[0].name);
```

## Included Surface

- `TumblrRuntime` for loading and executing pure runtime action flows.
- `WorkQueue` and work item primitives for queued runtime work.
- Scheduler classes, including `PomeloScheduler`, interval schedules, and schedule collections.
- Calculator and script-kernel compatibility exports, including `Calculator`, `DataTypeCheck`, `ExQueue`, and `ExStack`.
- Agent workflow layer exports, including `AgentWorkflowRunner`, tool and skill registries, JSON schema validation, and `PermissionPolicy`.

## Repository Playground

The runtime playground lives in this repository under `examples/runtime`.

```sh
npm run runtime-playground
```

The same server can be started directly from the repository root:

```sh
node examples/runtime/server.js
```

The playground exercises work queues, scheduler behavior, calculator/script helpers, runtime actions, adapter boundaries, and common helpers from a browser screen.
It is intentionally kept outside the npm package payload.

Small Node snippets live under `examples/runtime/snippets` in the repository:

```sh
node examples/runtime/snippets/scheduler.js
node examples/runtime/snippets/work-queue.js
node examples/runtime/snippets/common-crypto.js
```

## Stability

This package is Experimental. Public entrypoints may change while the Pomelo Suite runtime layer is being extracted. The legacy internal source name remains `TumblrRuntime` for compatibility with the original runtime model.

## License

MIT
