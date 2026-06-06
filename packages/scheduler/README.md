# @pomelo-suite/scheduler

Dependency-free scheduler primitives for Pomelo Suite.

## Install

```sh
npm install @pomelo-suite/scheduler
```

## Usage

```js
'use strict';

const {
  PomeloScheduler,
  IntervalSchedule,
} = require('@pomelo-suite/scheduler');

const scheduler = new PomeloScheduler({ autoStart: false });
const schedule = new IntervalSchedule(
  'job-1',
  'every-minute',
  new Date('2026-05-01T00:00:00.000Z'),
  60,
);

scheduler.addSchedule(schedule);
```

For a running scheduler, stop it when the process no longer needs scheduled work:

```js
'use strict';

const {
  PomeloScheduler,
  IntervalSchedule,
} = require('@pomelo-suite/scheduler');

const scheduler = new PomeloScheduler();

scheduler.addSchedule(new IntervalSchedule(
  'job-1',
  'every-minute',
  new Date(Date.now() + 60_000),
  60,
));

scheduler.stop();
```

## Runtime

Node.js 18 or newer.

## License

MIT
