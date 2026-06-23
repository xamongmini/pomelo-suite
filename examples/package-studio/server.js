'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const calculator = require('../../packages/calculator');
const scheduler = require('../../packages/scheduler');
const runtimePackage = require('../../packages/runtime');
const workqueue = require('../../packages/workqueue');

const ROOT = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PACKAGE_DIR = path.join(ROOT, 'packages');
const EXAMPLES_DIR = path.join(ROOT, 'examples');
const DEFAULT_PORT = 4183;
const WORKQUEUE_MAX_DELAY_MS = 10000;
const SCHEDULER_MAX_DELAY_MS = 10000;

const CONTENT_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
});

const WORK_ITEM_STATES = Object.keys(workqueue.WorkItemState);
const SCHEDULER_LAB_TYPES = [
  'ONETIME',
  'INTERVAL',
  'INTERVAL2',
  'MINUTELY',
  'TIMELY',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'FIXTIME',
  'FIXDAILY',
  'FIXMONTHLY',
];
const SCHEDULER_DEFAULT_START = '2026-01-31T09:30:00.000Z';

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(statusCode, {
    'content-length': Buffer.byteLength(body),
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(body);
}

function sendNdjsonHeaders(response) {
  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': 'application/x-ndjson; charset=utf-8',
    'x-content-type-options': 'nosniff',
  });
  if (typeof response.flushHeaders === 'function') {
    response.flushHeaders();
  }
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-length': Buffer.byteLength(body),
    'content-type': 'text/plain; charset=utf-8',
  });
  response.end(body);
}

function resolveInside(root, requestPath) {
  const cleaned = requestPath.replace(/^\/+/, '');
  const resolved = path.resolve(root, cleaned);
  const normalizedRoot = path.resolve(root);
  if (resolved !== normalizedRoot && !resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
    return null;
  }
  return resolved;
}

function clampInteger(value, fallback, min, max) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function parseItems(value, fallback) {
  if (!value) return fallback;
  const items = value.split(',').map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function parseDate(value, fallbackIso) {
  const parsed = new Date(value || fallbackIso);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(fallbackIso);
  }
  return parsed;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serveFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendText(response, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : error.message);
      return;
    }

    const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-length': data.length,
      'content-type': contentType,
    });
    response.end(data);
  });
}

async function runWorkQueueDemo(items = ['alpha', 'beta'], concurrentLimit = 1, options = {}) {
  const completed = [];
  const failed = [];
  const events = [];
  const stateVisits = Object.fromEntries(WORK_ITEM_STATES.map((state) => [state, 0]));
  const workItems = [];
  const delayMs = clampInteger(options.delayMs, 0, 0, WORKQUEUE_MAX_DELAY_MS);
  const failItem = String(options.failItem || '').trim();
  const onSnapshot = typeof options.onSnapshot === 'function' ? options.onSnapshot : null;

  function createPayload(ok) {
    return {
      ok,
      completed,
      failed,
      concurrentLimit,
      delayMs,
      failItem,
      items: workItems.map((item) => ({
        name: item.name,
        state: item.state,
        failed: Boolean(item.failedException),
        error: item.failedException?.message || '',
        processingTime: item.processingTime,
      })),
      stateVisits,
      events,
    };
  }

  function emitSnapshot() {
    if (onSnapshot) {
      onSnapshot(createPayload(false));
    }
  }

  class DemoWorkItem extends workqueue.WorkItem {
    constructor(name) {
      super();
      this.name = name;
    }

    async perform() {
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (this.name === failItem) {
        throw new Error(`Demo failure for ${this.name}`);
      }
      completed.push(this.name);
    }
  }

  const queue = new workqueue.WorkQueue({ concurrentLimit });
  queue.on('changedWorkItemState', ({ workItem, previousState }) => {
    stateVisits[workItem.state] += 1;
    events.push({
      type: 'state',
      item: workItem.name,
      from: previousState,
      to: workItem.state,
    });
    emitSnapshot();
  });
  queue.on('runningWorkItem', ({ workItem }) => {
    events.push({ type: 'running', item: workItem.name });
    emitSnapshot();
  });
  queue.on('failedWorkItem', ({ workItem }) => {
    failed.push(workItem.name);
    events.push({
      type: 'failed',
      item: workItem.name,
      message: workItem.failedException?.message || '',
    });
    emitSnapshot();
  });
  queue.on('completedWorkItem', ({ workItem }) => {
    events.push({
      type: 'completed',
      item: workItem.name,
      failed: Boolean(workItem.failedException),
    });
    emitSnapshot();
  });

  items.forEach((item) => {
    const workItem = new DemoWorkItem(item);
    workItems.push(workItem);
    stateVisits.Created += 1;
    queue.add(workItem);
  });
  const estimatedBatches = Math.max(1, Math.ceil(items.length / concurrentLimit));
  const waitTimeoutMs = Math.max(1000, delayMs * estimatedBatches + 1000);
  const drained = await queue.waitAll(waitTimeoutMs);

  return createPayload(drained);
}

async function streamWorkQueueDemo(requestUrl, response) {
  const items = parseItems(requestUrl.searchParams.get('items'), ['alpha', 'beta', 'gamma', 'delta']);
  const concurrentLimit = clampInteger(requestUrl.searchParams.get('concurrentLimit'), 2, 1, 8);
  const delayMs = clampInteger(requestUrl.searchParams.get('delayMs'), 80, 0, WORKQUEUE_MAX_DELAY_MS);
  const failItem = requestUrl.searchParams.get('failItem') || '';
  let closed = false;

  response.on('close', () => {
    closed = true;
  });
  sendNdjsonHeaders(response);

  const writeRecord = (record) => {
    if (!closed && !response.destroyed) {
      response.write(`${JSON.stringify(record)}\n`);
    }
  };

  const payload = await runWorkQueueDemo(items, concurrentLimit, {
    delayMs,
    failItem,
    onSnapshot: (snapshot) => writeRecord({ type: 'snapshot', payload: snapshot }),
  });
  writeRecord({ type: 'result', payload });
  if (!closed && !response.destroyed) {
    response.end();
  }
}

function runSchedulerDemo(intervalSeconds = 60) {
  const schedule = new scheduler.IntervalSchedule(
    'job-1',
    `every-${intervalSeconds}-seconds`,
    new Date('2026-05-01T00:00:00.000Z'),
    intervalSeconds,
  );
  schedule.triggerEvents();

  const termScheduler = new scheduler.PomeloScheduler({ autoStart: false });
  termScheduler.addSchedule(schedule);

  return {
    ok: true,
    intervalSeconds,
    nextInvokeTime: schedule.nextInvokeTime.toISOString(),
    scheduleCount: termScheduler.count(),
  };
}

function schedulerLabelFor(type) {
  const labels = {
    ONETIME: 'One time',
    INTERVAL: 'Interval',
    INTERVAL2: 'Interval after complete',
    MINUTELY: 'Every minute',
    TIMELY: 'Every hour',
    DAILY: 'Every day',
    WEEKLY: 'Every week',
    MONTHLY: 'Every month',
    FIXTIME: 'Add fixed hours',
    FIXDAILY: 'Daily fixed hour',
    FIXMONTHLY: 'Monthly fixed day',
  };
  return labels[type] || type;
}

function createSchedulerLabSchedule(type, id, startTime, settings, options = {}) {
  const now = typeof options.now === 'function' ? options.now : () => startTime;
  switch (type) {
    case 'ONETIME':
      return new scheduler.OneTimeSchedule(id, schedulerLabelFor(type), startTime);
    case 'INTERVAL':
      return new scheduler.IntervalSchedule(id, schedulerLabelFor(type), startTime, settings.intervalSeconds);
    case 'INTERVAL2':
      return new scheduler.IntervalSchedule2(id, schedulerLabelFor(type), startTime, settings.intervalSeconds, {
        now,
      });
    case 'MINUTELY':
      return new scheduler.MinutelySchedule(id, schedulerLabelFor(type), startTime);
    case 'TIMELY':
      return new scheduler.TimelySchedule(id, schedulerLabelFor(type), startTime);
    case 'DAILY':
      return new scheduler.DailySchedule(id, schedulerLabelFor(type), startTime);
    case 'WEEKLY':
      return new scheduler.WeeklySchedule(id, schedulerLabelFor(type), startTime);
    case 'MONTHLY':
      return new scheduler.MonthlySchedule(id, schedulerLabelFor(type), startTime);
    case 'FIXTIME':
      return new scheduler.FixTimeSchedule(id, schedulerLabelFor(type), startTime, settings.fixedHour);
    case 'FIXDAILY':
      return new scheduler.FixDaySchedule(id, schedulerLabelFor(type), startTime, settings.fixedHour);
    case 'FIXMONTHLY':
      return new scheduler.FixMonthSchedule(id, schedulerLabelFor(type), startTime, settings.fixedDay);
    default:
      return new scheduler.IntervalSchedule(id, schedulerLabelFor('INTERVAL'), startTime, settings.intervalSeconds);
  }
}

function parseSchedulerLabOptions(requestUrl) {
  const startTime = parseDate(requestUrl.searchParams.get('start'), SCHEDULER_DEFAULT_START);
  const requestedType = String(requestUrl.searchParams.get('type') || 'INTERVAL').toUpperCase();
  const type = SCHEDULER_LAB_TYPES.includes(requestedType) ? requestedType : 'INTERVAL';
  const settings = {
    intervalSeconds: clampInteger(requestUrl.searchParams.get('intervalSeconds'), 60, 1, 86400),
    fixedHour: clampInteger(requestUrl.searchParams.get('fixedHour'), 6, 0, 23),
    fixedDay: clampInteger(requestUrl.searchParams.get('fixedDay'), 31, 1, 31),
  };
  return {
    delayMs: clampInteger(requestUrl.searchParams.get('delayMs'), 0, 0, SCHEDULER_MAX_DELAY_MS),
    settings,
    startTime,
    triggerCount: clampInteger(requestUrl.searchParams.get('triggerCount'), 3, 1, 12),
    type,
  };
}

function schedulerIdFor(type) {
  return `${String(type).toLowerCase()}-lab`;
}

function describeSchedulerType(type, settings) {
  const descriptions = {
    ONETIME: 'fires once and is removed by PomeloScheduler',
    INTERVAL: `adds ${settings.intervalSeconds} seconds to the previous nextInvokeTime`,
    INTERVAL2: `completeSchedule recalculates from now + ${settings.intervalSeconds} seconds`,
    MINUTELY: 'adds exactly one minute',
    TIMELY: 'adds exactly one hour',
    DAILY: 'adds exactly one day',
    WEEKLY: 'adds seven days',
    MONTHLY: 'adds one UTC month and clamps month-end dates',
    FIXTIME: `adds ${settings.fixedHour} hours`,
    FIXDAILY: `moves to the next day at ${settings.fixedHour}:00 UTC`,
    FIXMONTHLY: `moves to day ${settings.fixedDay}, clamped to the next month length`,
  };
  return descriptions[type] || descriptions.INTERVAL;
}

function schedulerSnapshot(schedule) {
  return {
    id: schedule.id ?? schedule.ID,
    name: schedule.name ?? schedule.Name,
    type: schedule.type ?? schedule.Type,
    nextInvokeTime: (schedule.nextInvokeTime ?? schedule.NextInvokeTime ?? schedule.StartTime).toISOString(),
  };
}

function runSchedulerTypeOnce(type, startTime, settings) {
  const schedule = createSchedulerLabSchedule(type, schedulerIdFor(type), startTime, settings);
  const before = schedule.nextInvokeTime.toISOString();
  const after = schedule.triggerEvents().toISOString();
  const result = {
    ...schedulerSnapshot(schedule),
    label: schedulerLabelFor(type),
    description: describeSchedulerType(type, settings),
    before,
    after,
  };

  if (type === 'INTERVAL2') {
    schedule.recalculateNextInvokeTime();
    result.completeAfter = schedule.nextInvokeTime.toISOString();
  }
  return result;
}

function runSchedulerLab(requestUrl) {
  const {
    settings,
    startTime,
    triggerCount,
    type,
  } = parseSchedulerLabOptions(requestUrl);
  const selected = createSchedulerLabSchedule(type, schedulerIdFor(type), startTime, settings);
  const selectedRuns = [];

  for (let step = 1; step <= triggerCount; step += 1) {
    const before = selected.nextInvokeTime.toISOString();
    const after = selected.triggerEvents().toISOString();
    selectedRuns.push({ step, before, after });
  }

  const events = [];
  const timers = [];
  const eventSchedule = createSchedulerLabSchedule(type, schedulerIdFor(type), startTime, settings);
  const termScheduler = new scheduler.PomeloScheduler({
    now: () => startTime,
    setTimeout: (callback, delay) => {
      timers.push({ callback, delay });
      return timers.length - 1;
    },
    clearTimeout: () => {},
  });

  termScheduler.on('schedulerEvent', (event) => {
    events.push({
      type: event.type,
      scheduleID: event.scheduleID,
      nextInvokeTime: (event.schedule.nextInvokeTime ?? event.schedule.NextInvokeTime ?? event.schedule.StartTime).toISOString(),
    });
  });
  termScheduler.addSchedule(eventSchedule);
  const firstTimer = timers.shift();
  if (firstTimer) {
    events.push({ type: 'TIMER', scheduleID: eventSchedule.id, delayMs: firstTimer.delay });
    firstTimer.callback();
  }

  return {
    ok: true,
    type,
    startTime: startTime.toISOString(),
    triggerCount,
    settings,
    selected: {
      ...schedulerSnapshot(selected),
      label: schedulerLabelFor(type),
      description: describeSchedulerType(type, settings),
      runs: selectedRuns,
    },
    catalog: SCHEDULER_LAB_TYPES.map((scheduleType) => runSchedulerTypeOnce(scheduleType, startTime, settings)),
    events,
    schedulerOrder: termScheduler.toArray().map(schedulerSnapshot),
  };
}

async function runSchedulerLiveLab(requestUrl, options = {}) {
  const {
    delayMs,
    settings,
    startTime,
    triggerCount,
    type,
  } = parseSchedulerLabOptions(requestUrl);
  const onSnapshot = typeof options.onSnapshot === 'function' ? options.onSnapshot : null;
  const isClosed = typeof options.isClosed === 'function' ? options.isClosed : () => false;
  const scheduleID = schedulerIdFor(type);
  let virtualNow = new Date(startTime);
  const selected = createSchedulerLabSchedule(type, scheduleID, startTime, settings, {
    now: () => virtualNow,
  });
  const runs = [];
  const events = [{
    type: 'CREATED',
    scheduleID,
    nextInvokeTime: selected.nextInvokeTime.toISOString(),
  }];
  let current = {
    state: 'CREATED',
    scheduleID,
    nextInvokeTime: selected.nextInvokeTime.toISOString(),
  };

  function createPayload(ok) {
    return {
      ok,
      type,
      startTime: startTime.toISOString(),
      triggerCount,
      delayMs,
      settings,
      current,
      selected: {
        ...schedulerSnapshot(selected),
        label: schedulerLabelFor(type),
        description: describeSchedulerType(type, settings),
        runs,
      },
      catalog: SCHEDULER_LAB_TYPES.map((scheduleType) => runSchedulerTypeOnce(scheduleType, startTime, settings)),
      events,
    };
  }

  function record(event) {
    events.push(event);
    current = {
      state: event.type,
      scheduleID: event.scheduleID,
      step: event.step,
      before: event.before,
      after: event.after,
      completedAt: event.completedAt,
      delayMs,
      nextInvokeTime: event.nextInvokeTime,
    };
    if (onSnapshot && !isClosed()) {
      onSnapshot(createPayload(false));
    }
  }

  if (onSnapshot && !isClosed()) {
    onSnapshot(createPayload(false));
  }

  for (let step = 1; step <= triggerCount; step += 1) {
    if (isClosed()) break;

    const before = selected.nextInvokeTime.toISOString();
    record({
      type: 'SCHEDULED',
      scheduleID,
      step,
      nextInvokeTime: before,
    });
    record({
      type: 'INVOKING',
      scheduleID,
      step,
      before,
      nextInvokeTime: before,
    });
    record({
      type: 'RUNNING',
      scheduleID,
      step,
      before,
      delayMs,
      nextInvokeTime: before,
    });

    if (delayMs > 0) {
      await sleep(delayMs);
    }
    if (isClosed()) break;

    const completedAt = new Date(new Date(before).getTime() + delayMs).toISOString();
    virtualNow = new Date(completedAt);
    const after = type === 'INTERVAL2'
      ? selected.recalculateNextInvokeTime().toISOString()
      : selected.triggerEvents().toISOString();
    const run = {
      after,
      before,
      completedAt,
      delayMs,
      step,
    };
    runs.push(run);
    record({
      type: 'INVOKED',
      scheduleID,
      step,
      before,
      after,
      completedAt,
      nextInvokeTime: after,
    });

    if (type === 'ONETIME') {
      record({
        type: 'DELETED',
        scheduleID,
        step,
        before,
        after,
        completedAt,
        nextInvokeTime: after,
      });
      break;
    }
  }

  current = {
    state: 'COMPLETED',
    scheduleID,
    nextInvokeTime: selected.nextInvokeTime.toISOString(),
  };
  return createPayload(true);
}

async function streamSchedulerLab(requestUrl, response) {
  let closed = false;

  response.on('close', () => {
    closed = true;
  });
  sendNdjsonHeaders(response);

  const writeRecord = (record) => {
    if (!closed && !response.destroyed) {
      response.write(`${JSON.stringify(record)}\n`);
    }
  };

  const payload = await runSchedulerLiveLab(requestUrl, {
    isClosed: () => closed,
    onSnapshot: (snapshot) => writeRecord({ type: 'snapshot', payload: snapshot }),
  });
  writeRecord({ type: 'result', payload });
  if (!closed && !response.destroyed) {
    response.end();
  }
}

function parseSchedulerRegistryEntries(requestUrl) {
  const rawSchedules = requestUrl.searchParams.get('schedules');
  let parsed = [];
  if (rawSchedules) {
    try {
      parsed = JSON.parse(rawSchedules);
    } catch (_) {
      parsed = [];
    }
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    const options = parseSchedulerLabOptions(requestUrl);
    parsed = [{
      delayMs: options.delayMs,
      fixedDay: options.settings.fixedDay,
      fixedHour: options.settings.fixedHour,
      id: schedulerIdFor(options.type),
      intervalSeconds: options.settings.intervalSeconds,
      name: schedulerLabelFor(options.type),
      start: options.startTime.toISOString(),
      triggerCount: options.triggerCount,
      type: options.type,
    }];
  }

  return parsed.slice(0, 20).map((entry, index) => {
    const requestedType = String(entry.type || 'INTERVAL').toUpperCase();
    const type = SCHEDULER_LAB_TYPES.includes(requestedType) ? requestedType : 'INTERVAL';
    return {
      delayMs: clampInteger(entry.delayMs, 0, 0, SCHEDULER_MAX_DELAY_MS),
      endTime: entry.noEnd ? null : parseDate(entry.end, '2099-12-31T23:59:59.000Z'),
      fixedDay: clampInteger(entry.fixedDay, 31, 1, 31),
      fixedHour: clampInteger(entry.fixedHour, 6, 0, 23),
      id: String(entry.id || `SCH-${String(index + 1).padStart(3, '0')}`),
      intervalSeconds: clampInteger(entry.intervalSeconds, 60, 1, 86400),
      name: String(entry.name || schedulerLabelFor(type)),
      noEnd: Boolean(entry.noEnd),
      startTime: parseDate(entry.start, SCHEDULER_DEFAULT_START),
      triggerCount: clampInteger(entry.triggerCount, 3, 1, 12),
      type,
      weekdays: Array.isArray(entry.weekdays) ? entry.weekdays : [],
    };
  });
}

function createSchedulerRegistryRecord(entry) {
  let virtualNow = new Date(entry.startTime);
  const schedule = createSchedulerLabSchedule(entry.type, entry.id, entry.startTime, entry, {
    now: () => virtualNow,
  });

  function snapshot(state = 'READY') {
    return {
      delayMs: entry.delayMs,
      end: entry.endTime ? entry.endTime.toISOString() : '',
      fixedDay: entry.fixedDay,
      fixedHour: entry.fixedHour,
      id: entry.id,
      intervalSeconds: entry.intervalSeconds,
      name: entry.name,
      nextInvokeTime: schedule.nextInvokeTime.toISOString(),
      noEnd: entry.noEnd,
      runs: 0,
      start: entry.startTime.toISOString(),
      state,
      triggerCount: entry.triggerCount,
      type: entry.type,
      weekdays: entry.weekdays,
    };
  }

  return {
    active: true,
    entry,
    runs: 0,
    schedule,
    snapshot: snapshot(),
    setVirtualNow(value) {
      virtualNow = new Date(value);
    },
  };
}

function schedulerRegistryPayload(records, events, ok = false) {
  return {
    ok,
    events,
    schedules: records.map((record) => record.snapshot),
  };
}

async function waitForSchedulerDueTime(record, events, emit, isClosed) {
  const { entry, schedule } = record;
  const step = record.runs + 1;
  const nextInvokeTime = schedule.nextInvokeTime.toISOString();
  let announced = false;

  while (!isClosed()) {
    const remainingMs = Math.max(0, schedule.nextInvokeTime.getTime() - Date.now());
    record.snapshot = {
      ...record.snapshot,
      nextInvokeTime,
      remainingMs,
      state: 'SCHEDULED',
    };

    if (!announced) {
      events.push({
        type: 'SCHEDULED',
        scheduleID: entry.id,
        step,
        delayMs: entry.delayMs,
        nextInvokeTime,
        remainingMs,
      });
      announced = true;
    }
    emit(false);

    if (remainingMs <= 0) {
      return true;
    }
    await sleep(Math.min(remainingMs, 1000));
  }

  return false;
}

async function runSchedulerRegistryLiveLab(requestUrl, options = {}) {
  const entries = parseSchedulerRegistryEntries(requestUrl);
  const records = entries.map(createSchedulerRegistryRecord);
  const events = records.map((record) => ({
    type: 'CREATED',
    scheduleID: record.entry.id,
    nextInvokeTime: record.snapshot.nextInvokeTime,
  }));
  const onSnapshot = typeof options.onSnapshot === 'function' ? options.onSnapshot : null;
  const isClosed = typeof options.isClosed === 'function' ? options.isClosed : () => false;

  function emit(ok = false) {
    if (onSnapshot && !isClosed()) {
      onSnapshot(schedulerRegistryPayload(records, events, ok));
    }
  }

  emit(false);
  const maxSteps = records.reduce((sum, record) => sum + record.entry.triggerCount, 0);
  for (let stepIndex = 0; stepIndex < maxSteps; stepIndex += 1) {
    if (isClosed()) break;
    const activeRecords = records.filter((record) => record.active && record.runs < record.entry.triggerCount);
    if (activeRecords.length === 0) break;
    activeRecords.sort((left, right) => left.schedule.compareTo(right.schedule));
    const record = activeRecords[0];
    const { entry, schedule } = record;
    const before = schedule.nextInvokeTime.toISOString();
    const step = record.runs + 1;

    if (!await waitForSchedulerDueTime(record, events, emit, isClosed)) {
      break;
    }

    for (const type of ['INVOKING', 'RUNNING']) {
      record.snapshot = { ...record.snapshot, state: type, nextInvokeTime: before };
      events.push({
        type,
        scheduleID: entry.id,
        step,
        delayMs: entry.delayMs,
        nextInvokeTime: before,
      });
      emit(false);
    }

    if (entry.delayMs > 0) {
      await sleep(entry.delayMs);
    }
    if (isClosed()) break;

    const completedAt = new Date(new Date(before).getTime() + entry.delayMs).toISOString();
    record.setVirtualNow(completedAt);
    const after = entry.type === 'INTERVAL2'
      ? schedule.recalculateNextInvokeTime().toISOString()
      : schedule.triggerEvents().toISOString();
    record.runs += 1;

    let state = 'INVOKED';
    if (entry.type === 'ONETIME') {
      state = 'DELETED';
      record.active = false;
    } else if (entry.endTime && new Date(after).getTime() > entry.endTime.getTime()) {
      state = 'DONE';
      record.active = false;
    }

    record.snapshot = {
      ...record.snapshot,
      nextInvokeTime: after,
      runs: record.runs,
      state,
    };
    events.push({
      type: state,
      scheduleID: entry.id,
      step,
      before,
      after,
      completedAt,
      nextInvokeTime: after,
    });
    emit(false);
  }

  return schedulerRegistryPayload(records, events, true);
}

async function streamSchedulerRegistry(requestUrl, response) {
  let closed = false;

  response.on('close', () => {
    closed = true;
  });
  sendNdjsonHeaders(response);

  const writeRecord = (record) => {
    if (!closed && !response.destroyed) {
      response.write(`${JSON.stringify(record)}\n`);
    }
  };

  const payload = await runSchedulerRegistryLiveLab(requestUrl, {
    isClosed: () => closed,
    onSnapshot: (snapshot) => writeRecord({ type: 'snapshot', payload: snapshot }),
  });
  writeRecord({ type: 'result', payload });
  if (!closed && !response.destroyed) {
    response.end();
  }
}

function runRuntimeDemo(name = 'Pomelo', message = 'hello {@parameter.name}') {
  const runtime = new runtimePackage.TumblrRuntime();
  const controller = runtime.loadTumbler('demo', {
    action: {
      ProcessID: 'P1',
      msg: message,
      type: 'message',
    },
    type: 'DEFAULT',
  }, {
    name,
  });

  controller.execute();

  return {
    ok: true,
    logs: runtime.out.toString(),
    message,
    name,
  };
}

async function handleApi(requestUrl, response) {
  try {
    if (requestUrl.pathname === '/api/calculator') {
      const expression = requestUrl.searchParams.get('expression') || '1+2*3';
      sendJson(response, 200, {
        ok: true,
        expression,
        value: calculator.evaluateExpression(expression),
      });
      return true;
    }

    if (requestUrl.pathname === '/api/scheduler') {
      const intervalSeconds = Number(requestUrl.searchParams.get('intervalSeconds') || 60);
      sendJson(response, 200, runSchedulerDemo(intervalSeconds));
      return true;
    }

    if (requestUrl.pathname === '/api/scheduler/lab') {
      sendJson(response, 200, runSchedulerLab(requestUrl));
      return true;
    }

    if (requestUrl.pathname === '/api/scheduler/lab/events') {
      await streamSchedulerLab(requestUrl, response);
      return true;
    }

    if (requestUrl.pathname === '/api/scheduler/registry') {
      sendJson(response, 200, await runSchedulerRegistryLiveLab(requestUrl));
      return true;
    }

    if (requestUrl.pathname === '/api/scheduler/registry/events') {
      await streamSchedulerRegistry(requestUrl, response);
      return true;
    }

    if (requestUrl.pathname === '/api/workqueue') {
      const items = parseItems(requestUrl.searchParams.get('items'), undefined);
      const concurrentLimit = clampInteger(requestUrl.searchParams.get('concurrentLimit'), 1, 1, 8);
      sendJson(response, 200, await runWorkQueueDemo(items, concurrentLimit));
      return true;
    }

    if (requestUrl.pathname === '/api/workqueue/lab/events') {
      await streamWorkQueueDemo(requestUrl, response);
      return true;
    }

    if (requestUrl.pathname === '/api/workqueue/lab') {
      const items = parseItems(requestUrl.searchParams.get('items'), ['alpha', 'beta', 'gamma', 'delta']);
      const concurrentLimit = clampInteger(requestUrl.searchParams.get('concurrentLimit'), 2, 1, 8);
      const delayMs = clampInteger(requestUrl.searchParams.get('delayMs'), 80, 0, WORKQUEUE_MAX_DELAY_MS);
      const failItem = requestUrl.searchParams.get('failItem') || '';
      sendJson(response, 200, await runWorkQueueDemo(items, concurrentLimit, { delayMs, failItem }));
      return true;
    }

    if (requestUrl.pathname === '/api/runtime') {
      const name = requestUrl.searchParams.get('name') || 'Pomelo';
      const message = requestUrl.searchParams.get('message') || 'hello {@parameter.name}';
      sendJson(response, 200, runRuntimeDemo(name, message));
      return true;
    }
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      error: {
        message: error.message,
        name: error.name,
      },
    });
    return true;
  }

  return false;
}

function createDemoServer() {
  return http.createServer(async (request, response) => {
    if (!request.url || request.method !== 'GET') {
      sendText(response, 405, 'Method not allowed');
      return;
    }

    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (await handleApi(requestUrl, response)) {
      return;
    }

    if (requestUrl.pathname.startsWith('/packages/')) {
      const packagePath = requestUrl.pathname.slice('/packages/'.length);
      const resolved = resolveInside(PACKAGE_DIR, packagePath);
      if (!resolved) {
        sendText(response, 403, 'Forbidden');
        return;
      }
      serveFile(response, resolved);
      return;
    }

    if (requestUrl.pathname.startsWith('/examples/')) {
      const examplePath = requestUrl.pathname.slice('/examples/'.length);
      const resolved = resolveInside(EXAMPLES_DIR, examplePath);
      if (!resolved) {
        sendText(response, 403, 'Forbidden');
        return;
      }
      serveFile(response, resolved);
      return;
    }

    const publicPath = requestUrl.pathname === '/' ? 'index.html' : requestUrl.pathname;
    const resolved = resolveInside(PUBLIC_DIR, publicPath);
    if (!resolved) {
      sendText(response, 403, 'Forbidden');
      return;
    }
    serveFile(response, resolved);
  });
}

function startServer(port = Number(process.env.PORT || DEFAULT_PORT)) {
  const server = createDemoServer();
  server.listen(port, '127.0.0.1', () => {
    const address = server.address();
    console.log(`Pomelo Suite Package Lab: http://127.0.0.1:${address.port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createDemoServer,
  DEFAULT_PORT,
  startServer,
};
