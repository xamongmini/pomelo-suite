# @pomelo-suite/workqueue

Work queue and worker-thread helpers for Node.js.

## Install

```sh
npm install @pomelo-suite/workqueue
```

## Usage

```js
'use strict';

const { WorkItem, WorkQueue } = require('@pomelo-suite/workqueue');

class SendEmailWorkItem extends WorkItem {
  async perform() {
    await sendEmail();
  }
}

const queue = new WorkQueue({ concurrentLimit: 2 });
queue.add(new SendEmailWorkItem());

await queue.waitAll();
```

`WorkerThreadPool` default CPU tasks are included in the package and run in Node worker threads.

## Runtime

Node.js 18 or newer.

## License

MIT
