'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const tumblr = require('../../packages/runtime/src');

const PUBLIC_DIR = path.join(__dirname, 'public');
const FEATURES = Object.freeze(['work-queue', 'scheduler', 'calculator', 'tumblr', 'adapter', 'cpu-worker', 'agent-workflow', 'common']);

const CONTENT_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
});

function nowMs() {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, Number(milliseconds) || 0));
  });
}

function jsonResponse(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  response.end(body);
}

function ok(result, logs = '', elapsedMs = 0) {
  return {
    ok: true,
    result,
    logs,
    elapsedMs: Number(elapsedMs.toFixed(3)),
  };
}

function fail(error, elapsedMs = 0) {
  return {
    ok: false,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    logs: '',
    elapsedMs: Number(elapsedMs.toFixed(3)),
  };
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString('utf8');
  if (!text.trim()) {
    return {};
  }
  return JSON.parse(text);
}

function serveStatic(request, response, pathname) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolved = path.resolve(PUBLIC_DIR, relativePath);
  const publicRoot = path.resolve(PUBLIC_DIR);

  if (!resolved.startsWith(publicRoot)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.readFile(resolved, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(error.code === 'ENOENT' ? 'Not found' : error.message);
      return;
    }

    const contentType = CONTENT_TYPES[path.extname(resolved)] ?? 'application/octet-stream';
    response.writeHead(200, {
      'content-type': contentType,
      'content-length': data.length,
    });
    response.end(data);
  });
}

class PlaygroundWorkItem extends tumblr.WorkItem {
  constructor(task, completed, events) {
    super();
    this.task = task;
    this.name = task.name ?? this.id;
    this.completed = completed;
    this.events = events;
  }

  async perform() {
    this.events.push({ event: 'start', name: this.name, at: new Date().toISOString() });
    await delay(this.task.durationMs ?? 10);
    if (this.task.fail) {
      throw new Error(`Task '${this.name}' failed`);
    }
    this.completed.push(this.name);
    this.events.push({ event: 'complete', name: this.name, at: new Date().toISOString() });
  }
}

async function runWorkQueue(input) {
  const completed = [];
  const events = [];
  const queue = new tumblr.WorkQueue({ concurrentLimit: Number(input.concurrentLimit ?? 2) });
  const tasks = Array.isArray(input.tasks) && input.tasks.length > 0
    ? input.tasks
    : [{ name: 'one', durationMs: 10 }, { name: 'two', durationMs: 10 }];

  for (const task of tasks) {
    queue.add(new PlaygroundWorkItem(task, completed, events));
  }

  let waitResult = null;
  if (input.waitTimeoutMs !== undefined) {
    waitResult = await queue.waitAll(Number(input.waitTimeoutMs));
    if (waitResult === false) {
      await queue.waitAll();
    }
  } else {
    await queue.waitAll();
  }

  return {
    completed,
    events,
    queue: {
      completedCount: completed.length,
      count: queue.count,
      concurrentLimit: queue.concurrentLimit,
      waitResult,
    },
  };
}

function createManualTimer(start = new Date('2026-05-01T00:00:00.000Z')) {
  let nowMs = new Date(start).getTime();
  const timers = [];

  function setTimer(callback, delayMs) {
    const normalizedDelayMs = Math.max(0, Number(delayMs) || 0);
    const timer = {
      callback,
      delayMs: normalizedDelayMs,
      dueAt: nowMs + normalizedDelayMs,
      cleared: false,
      fired: false,
    };
    timers.push(timer);
    return timer;
  }

  function clearTimer(timer) {
    if (timer) {
      timer.cleared = true;
    }
  }

  function nextTimer() {
    return timers
      .filter((timer) => !timer.cleared && !timer.fired)
      .sort((left, right) => left.dueAt - right.dueAt)[0] ?? null;
  }

  function fireNext() {
    const timer = nextTimer();
    if (!timer) {
      return false;
    }
    nowMs = Math.max(nowMs, timer.dueAt);
    timer.fired = true;
    timer.callback();
    return true;
  }

  function advanceBy(milliseconds) {
    nowMs += Math.max(0, Number(milliseconds) || 0);
  }

  function now() {
    return new Date(nowMs);
  }

  function activeTimers() {
    return timers
      .filter((timer) => !timer.cleared && !timer.fired)
      .map((timer) => ({
        delayMs: Math.max(0, timer.dueAt - nowMs),
        originalDelayMs: timer.delayMs,
        dueAt: new Date(timer.dueAt).toISOString(),
      }));
  }

  return {
    advanceBy,
    activeTimers,
    clearTimer,
    fireNext,
    nextTimer,
    now,
    setTimer,
  };
}

function buildSchedule(input, options = {}) {
  const startTime = new Date(input.startTime ?? '2026-05-01T00:00:00.000Z');
  const type = String(input.type ?? 'interval').toLowerCase();
  const id = input.id ?? 'S1';
  const name = input.name ?? type;

  switch (type) {
    case 'onetime':
      return new tumblr.OneTimeSchedule(id, name, startTime, options);
    case 'interval2':
      return new tumblr.IntervalSchedule2(id, name, startTime, Number(input.intervalSeconds ?? 30), options);
    case 'minutely':
      return new tumblr.MinutelySchedule(id, name, startTime, options);
    case 'timely':
      return new tumblr.TimelySchedule(id, name, startTime, options);
    case 'daily':
      return new tumblr.DailySchedule(id, name, startTime, options);
    case 'weekly':
      return new tumblr.WeeklySchedule(id, name, startTime, options);
    case 'monthly':
      return new tumblr.MonthlySchedule(id, name, startTime, options);
    case 'fixtime':
      return new tumblr.FixTimeSchedule(id, name, startTime, Number(input.fixedHour ?? 1), options);
    case 'fixdaily':
      return new tumblr.FixDaySchedule(id, name, startTime, Number(input.fixedHour ?? 9), options);
    case 'fixmonthly':
      return new tumblr.FixMonthSchedule(id, name, startTime, Number(input.fixedDay ?? 15), options);
    case 'interval':
    default:
      return new tumblr.IntervalSchedule(id, name, startTime, Number(input.intervalSeconds ?? 30), options);
  }
}

async function runScheduler(input) {
  const manualTimer = createManualTimer(new Date(input.now ?? input.startTime ?? '2026-05-01T00:00:00.000Z'));
  const schedule = buildSchedule(input, { now: () => manualTimer.now() });
  const before = schedule.nextInvokeTime.toISOString();
  const scheduler = new tumblr.PomeloScheduler({
    now: () => manualTimer.now(),
    setTimeout: (callback, delayMs) => manualTimer.setTimer(callback, delayMs),
    clearTimeout: (timer) => manualTimer.clearTimer(timer),
  });
  const runtimeEvents = [];
  scheduler.on('schedulerEvent', (event) => {
    runtimeEvents.push({
      type: event.type,
      scheduleID: event.scheduleID,
    });
  });

  let queueResult = null;
  if (input.enqueueWork) {
    const completed = [];
    const events = [];
    const queue = new tumblr.WorkQueue({ concurrentLimit: Number(input.concurrentLimit ?? 1) });
    schedule.on('trigger', () => {
      queue.add(new PlaygroundWorkItem({
        name: schedule.id,
        durationMs: Number(input.workDurationMs ?? 1),
      }, completed, events));
    });
    queueResult = { completed, events, queue };
  }

  scheduler.addSchedule(schedule);
  const initialTimer = manualTimer.nextTimer();
  const initialDelayMs = initialTimer ? initialTimer.delayMs : null;
  const ticks = [];
  const dispatchCount = input.dispatch === false
    ? 0
    : Math.max(1, Number(input.dispatchCount ?? 1));
  const completionDelayMs = Math.max(0, Number(input.completionDelayMs ?? (input.enqueueWork ? input.workDurationMs ?? 0 : 0)));

  for (let index = 0; index < dispatchCount; index += 1) {
    if (!manualTimer.nextTimer()) {
      break;
    }
    const eventStartIndex = runtimeEvents.length;
    const tickBefore = schedule.nextInvokeTime.toISOString();
    if (!manualTimer.fireNext()) {
      break;
    }
    const firedAt = manualTimer.now().toISOString();

    if (queueResult) {
      const waitResult = await queueResult.queue.waitAll(Number(input.waitTimeoutMs ?? 1000));
      if (waitResult === false) {
        await queueResult.queue.waitAll();
      }
      queueResult.waitResult = waitResult;
    }

    if (completionDelayMs > 0) {
      manualTimer.advanceBy(completionDelayMs);
    }
    const completionAt = manualTimer.now().toISOString();
    const completedInterval2 = scheduler.completeSchedule(schedule);
    const nextTimer = manualTimer.nextTimer();

    ticks.push({
      index: index + 1,
      before: tickBefore,
      firedAt,
      completionAt,
      after: schedule.nextInvokeTime.toISOString(),
      nextDelayMs: nextTimer ? Math.max(0, nextTimer.dueAt - manualTimer.now().getTime()) : null,
      completedInterval2,
      events: runtimeEvents.slice(eventStartIndex),
    });

    if (!scheduler.getSchedule(schedule.id)) {
      break;
    }
  }

  const after = schedule.nextInvokeTime.toISOString();
  const collection = new tumblr.ScheduleCollection([
    new tumblr.Schedule({ ID: schedule.id, Name: schedule.name, Type: schedule.type, StartTime: schedule.startTime }),
  ]);

  return {
    schedule: {
      id: schedule.id,
      name: schedule.name,
      type: schedule.type,
      before,
      after,
    },
    runtime: {
      events: runtimeEvents,
      ticks,
      initialDelayMs,
      activeTimers: manualTimer.activeTimers(),
      countAfterDispatch: scheduler.count(),
      nextScheduleID: scheduler.getScheduleAt(0)?.id ?? null,
    },
    queue: queueResult ? {
      completed: queueResult.completed,
      events: queueResult.events,
      waitResult: queueResult.waitResult,
    } : null,
    collection: {
      count: collection.Count,
      names: collection.toArray().map((item) => item.Name),
    },
  };
}

function runCalculator(input) {
  const token = new tumblr.Token(input.expression ?? '1 + 2');
  const variables = input.variables ?? {};
  for (const [name, value] of Object.entries(variables)) {
    token.Variables.Add(name).VariableValue = value;
  }

  const calculator = new tumblr.Calculator(token);
  const value = calculator.Calculate();

  return {
    value,
    token: {
      ruleSyntax: token.RuleSyntax,
      tokenItems: [...token.TokenItems].map((item) => ({
        name: item.TokenName,
        type: item.TokenType,
        dataType: item.TokenDataType,
      })),
      variables: [...token.Variables].map((variable) => ({
        name: variable.VariableName,
        value: variable.VariableValue,
      })),
      lastEvaluationResult: token.LastEvaluationResult,
      lineIndexes: token.LineIndexes,
    },
  };
}

async function runTumblr(input) {
  const runtime = new tumblr.TumblrRuntime({
    adapters: input.adapters ?? {},
    sleep: () => Promise.resolve(),
  });
  const controller = runtime.loadTumbler(input.name ?? 'playground', input.bean ?? {
    type: 'DEFAULT',
    action: {
      type: 'message',
      ProcessID: 'P1',
      msg: 'hello playground',
    },
  }, input.parameter ?? null, input.xtype ?? '');

  await controller.execute();

  return {
    result: {
      name: controller.Name,
      type: controller.Dict?.type,
      data: controller.Data,
      processes: controller.Return.process,
      lastError: controller.lastError ? controller.lastError.message : null,
    },
    logs: runtime.out.toString(),
  };
}

async function runAdapter(input) {
  const type = input.type ?? 'ping';
  const adapterCalls = [];
  const adapter = (payload) => {
    adapterCalls.push({
      type: payload.type,
      fields: payload.fields,
    });
    return {
      state: 'SUCCESS',
      code: 'T',
      message: `mock ${payload.type} ok`,
      data: {
        echo: payload.fields,
      },
    };
  };

  const runtime = new tumblr.TumblrRuntime({
    adapters: {
      networkAdapter: adapter,
      dataAdapter: adapter,
      terminalAdapter: adapter,
      sshAdapter: adapter,
      templateAdapter: adapter,
      serviceAdapter: adapter,
    },
  });

  const controller = runtime.loadTumbler('adapter', {
    type: 'DEFAULT',
    action: {
      type,
      ProcessID: 'ADAPTER',
      ...(input.fields ?? {}),
    },
  });

  await controller.execute();

  return {
    processes: controller.Return.process,
    adapterCalls,
    data: controller.Data,
    logs: runtime.out.toString(),
  };
}

async function runCpuWorker(input) {
  const workerCount = Number(input.workerCount ?? 2);
  const concurrentLimit = Number(input.concurrentLimit ?? workerCount);
  const pool = new tumblr.WorkerThreadPool({ workerCount });
  const queue = new tumblr.WorkQueue({ concurrentLimit });
  const taskInputs = Array.isArray(input.tasks) && input.tasks.length > 0
    ? input.tasks
    : [
      { taskType: 'blockFor', payload: { milliseconds: 20 } },
      { taskType: 'fibonacci', payload: { n: 20 } },
    ];
  const items = taskInputs.map((task) => new tumblr.CpuWorkItem({
    taskType: task.taskType ?? 'fibonacci',
    payload: task.payload ?? {},
    workerPool: pool,
    timeoutMs: Number(task.timeoutMs ?? input.timeoutMs ?? 1000),
  }));

  try {
    for (const item of items) {
      queue.add(item);
    }

    const waitResult = await queue.waitAll(Number(input.waitTimeoutMs ?? 5000));
    if (waitResult === false) {
      await queue.waitAll();
    }

    return {
      results: items.map((item) => item.result),
      failures: items
        .filter((item) => item.failedException)
        .map((item) => ({
          taskType: item.taskType,
          message: item.failedException.message,
        })),
      queue: {
        completedCount: items.filter((item) => item.completedTime).length,
        concurrentLimit: queue.concurrentLimit,
        count: queue.count,
        waitResult,
      },
      worker: {
        workerCount: pool.workerCount,
      },
    };
  } finally {
    await pool.destroy();
  }
}

async function runAgentWorkflow(input) {
  const runtime = new tumblr.TumblrRuntime({
    permissionPolicy: new tumblr.PermissionPolicy({
      allowedPermissions: ['agent:demo'],
    }),
    tools: [{
      name: 'demo.echo',
      description: 'Echo text through a registered demo tool.',
      permissions: ['agent:demo'],
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string' },
        },
      },
      handler: async ({ input: toolInput }) => ({
        echoed: toolInput.text,
      }),
    }],
    skills: [{
      name: 'demo.upper',
      description: 'Uppercase text through a registered demo skill.',
      inputSchema: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string' },
        },
      },
      handler: async ({ input: skillInput }) => ({
        upper: String(skillInput.text).toUpperCase(),
      }),
    }],
  });
  const workflowBean = {
    type: 'DEFAULT',
    action: {
      type: 'batch',
      actions: [
        {
          type: 'tool.call',
          ProcessID: 'TOOL',
          tool: 'demo.echo',
          input: {
            text: '{@parameter.text}',
          },
        },
        {
          type: 'skill.run',
          ProcessID: 'SKILL',
          skill: 'demo.upper',
          input: {
            text: '{@parameter.text}',
          },
        },
      ],
    },
  };
  const manualTimer = createManualTimer();
  const scheduler = new tumblr.PomeloScheduler({
    now: () => new Date(input.startTime ?? '2026-05-01T00:00:00.000Z'),
    setTimeout: (callback, delayMs) => manualTimer.setTimer(callback, delayMs),
    clearTimeout: (timer) => manualTimer.clearTimer(timer),
  });
  const schedulerEvents = [];
  scheduler.on('schedulerEvent', (event) => {
    schedulerEvents.push({
      type: event.type,
      scheduleID: event.scheduleID,
    });
  });

  const queue = new tumblr.WorkQueue({ concurrentLimit: Number(input.concurrentLimit ?? 1) });
  const runner = new tumblr.AgentWorkflowRunner({ runtime, scheduler, workQueue: queue });
  runner.registerWorkflow('demo.agentWorkflow', workflowBean);

  if (input.scheduled !== false) {
    runner.scheduleWorkflow(
      new tumblr.OneTimeSchedule('agent-workflow', 'agent-workflow', new Date(input.startTime ?? '2026-05-01T00:00:00.000Z')),
      'demo.agentWorkflow',
      { text: input.text ?? 'agent' }
    );
    manualTimer.fireNext();
  } else {
    runner.enqueueWorkflow('demo.agentWorkflow', { text: input.text ?? 'agent' });
  }

  const waitResult = await queue.waitAll(Number(input.waitTimeoutMs ?? 1000));
  const run = runner.completedRuns[0];

  return {
    workflowName: run?.workflowName ?? 'demo.agentWorkflow',
    processes: run?.processes ?? [],
    queue: {
      completedCount: runner.completedRuns.length,
      count: queue.count,
      waitResult,
    },
    scheduler: {
      events: schedulerEvents,
      count: scheduler.count(),
    },
    registry: {
      tools: runtime.toolRegistry.list().map((descriptor) => descriptor.name),
      skills: runtime.skillRegistry.list().map((descriptor) => descriptor.name),
    },
  };
}

function runCommon(input) {
  const text = input.text ?? 'server-password-123';
  const encrypted = tumblr.encrypt(text);
  return {
    text,
    encrypted,
    decrypted: tumblr.decrypt(encrypted),
    unixTimestamp: tumblr.getUnixTimestamp(new Date(input.date ?? '2026-05-01T00:00:00.000Z')),
    javaDate: tumblr.javaTimeStampToDateTime(input.javaTimestamp ?? 1777593601500).toISOString(),
  };
}

async function dispatchApi(pathname, input) {
  switch (pathname) {
    case '/api/health':
      return { features: FEATURES };
    case '/api/run/work-queue':
      return runWorkQueue(input);
    case '/api/run/scheduler':
      return runScheduler(input);
    case '/api/run/calculator':
      return runCalculator(input);
    case '/api/run/tumblr': {
      const { result, logs } = await runTumblr(input);
      return { result, logs };
    }
    case '/api/run/adapter':
      return runAdapter(input);
    case '/api/run/cpu-worker':
      return runCpuWorker(input);
    case '/api/run/agent-workflow':
      return runAgentWorkflow(input);
    case '/api/run/common':
      return runCommon(input);
    default:
      return null;
  }
}

function createPlaygroundServer() {
  return http.createServer(async (request, response) => {
    const parsedUrl = new URL(request.url, 'http://localhost');

    if (!parsedUrl.pathname.startsWith('/api/')) {
      serveStatic(request, response, parsedUrl.pathname);
      return;
    }

    const started = nowMs();

    try {
      const input = request.method === 'GET' ? {} : await readJsonBody(request);
      const dispatched = await dispatchApi(parsedUrl.pathname, input);

      if (dispatched == null) {
        jsonResponse(response, 404, fail(new Error(`Unknown API route '${parsedUrl.pathname}'`), nowMs() - started));
        return;
      }

      const result = dispatched.result !== undefined ? dispatched.result : dispatched;
      const logs = dispatched.logs ?? '';
      jsonResponse(response, 200, ok(result, logs, nowMs() - started));
    } catch (error) {
      jsonResponse(response, 500, fail(error, nowMs() - started));
    }
  });
}

function main() {
  const port = Number(process.env.PORT || process.argv[2] || 4173);
  const host = process.env.HOST || '127.0.0.1';
  const server = createPlaygroundServer();
  server.listen(port, host, () => {
    console.log(`Pomelo Suite Runtime playground listening at http://${host}:${port}`);
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  createPlaygroundServer,
  runAdapter,
  runAgentWorkflow,
  runCalculator,
  runCommon,
  runCpuWorker,
  runScheduler,
  runTumblr,
  runWorkQueue,
};
