'use strict';

const FEATURES = {
  'work-queue': {
    title: 'Work Queue',
    summary: 'Run queued work with bounded async concurrency and wait timeout checks.',
    endpoint: '/api/run/work-queue',
    sample: {
      concurrentLimit: 2,
      waitTimeoutMs: 1000,
      tasks: [
        { name: 'one', durationMs: 40 },
        { name: 'two', durationMs: 20 },
        { name: 'three', durationMs: 10 },
      ],
    },
  },
  scheduler: {
    title: 'Scheduler',
    summary: 'Dispatch fixed-rate interval and completion-delay interval2 schedules through PomeloScheduler.',
    endpoint: '/api/run/scheduler',
    sample: {
      type: 'interval2',
      id: 'S1',
      name: 'after-completion-delay',
      startTime: '2026-05-01T00:00:00.000Z',
      intervalSeconds: 1,
      dispatchCount: 3,
      completionDelayMs: 250,
      dispatch: true,
      enqueueWork: true,
      workDurationMs: 5,
    },
  },
  calculator: {
    title: 'Calculator / Script',
    summary: 'Evaluate Kernel Script expressions with Token and Calculator wrappers.',
    endpoint: '/api/run/calculator',
    sample: {
      expression: 'score >= limit and flag = true',
      variables: {
        score: '5',
        limit: '3',
        flag: 'true',
      },
    },
  },
  tumblr: {
    title: 'Tumblr Engine',
    summary: 'Load an in-memory bean and execute the ported Tumblr runtime.',
    endpoint: '/api/run/tumblr',
    sample: {
      name: 'demo',
      bean: {
        type: 'DEFAULT',
        data: {
          values: ['A', 'B'],
        },
        action: {
          type: 'batch',
          actions: [
            {
              type: 'message',
              ProcessID: 'HELLO',
              msg: 'hello {@parameter.name}',
            },
            {
              type: 'loop',
              iterator: '{@values}',
              SUCCESS: {
                type: 'message',
                ProcessID: 'ITEM',
                msg: 'item {$sequence}: {$value}',
              },
            },
          ],
        },
      },
      parameter: {
        name: 'world',
      },
    },
  },
  adapter: {
    title: 'Adapter Actions',
    summary: 'Exercise external action routing with mock adapters.',
    endpoint: '/api/run/adapter',
    sample: {
      type: 'ping',
      fields: {
        address: '127.0.0.1',
      },
    },
  },
  'cpu-worker': {
    title: 'CPU Workers',
    summary: 'Run serializable CPU tasks on real Node worker threads through WorkQueue.',
    endpoint: '/api/run/cpu-worker',
    sample: {
      workerCount: 2,
      concurrentLimit: 2,
      timeoutMs: 1000,
      tasks: [
        { taskType: 'blockFor', payload: { milliseconds: 25 } },
        { taskType: 'fibonacci', payload: { n: 20 } },
        {
          taskType: 'calculateExpression',
          payload: {
            expression: 'score * 2 + bonus',
            variables: {
              score: '7',
              bonus: '3',
            },
          },
        },
      ],
    },
  },
  'agent-workflow': {
    title: 'Agent Workflow',
    summary: 'Run a registered tool and skill workflow through Scheduler and WorkQueue.',
    endpoint: '/api/run/agent-workflow',
    sample: {
      text: 'agent',
      scheduled: true,
      concurrentLimit: 1,
      waitTimeoutMs: 1000,
    },
  },
  common: {
    title: 'Common / Crypto',
    summary: 'Run common timestamp and legacy AES helper functions.',
    endpoint: '/api/run/common',
    sample: {
      text: 'server-password-123',
      date: '2026-05-01T00:00:00.000Z',
      javaTimestamp: 1777593601500,
    },
  },
};

const elements = {
  tabs: document.querySelectorAll('.tab'),
  title: document.querySelector('#feature-title'),
  summary: document.querySelector('#feature-summary'),
  endpoint: document.querySelector('#endpoint-label'),
  input: document.querySelector('#input'),
  result: document.querySelector('#result'),
  logs: document.querySelector('#logs'),
  processes: document.querySelector('#processes'),
  elapsed: document.querySelector('#elapsed'),
  run: document.querySelector('#run-button'),
  sample: document.querySelector('#sample-button'),
  health: document.querySelector('#health'),
};

let currentFeature = 'work-queue';

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function setFeature(feature) {
  currentFeature = feature;
  const config = FEATURES[feature];

  elements.tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.feature === feature);
  });

  elements.title.textContent = config.title;
  elements.summary.textContent = config.summary;
  elements.endpoint.textContent = config.endpoint;
  elements.input.value = pretty(config.sample);
  elements.result.textContent = '';
  elements.logs.textContent = '';
  elements.processes.textContent = '';
  elements.elapsed.textContent = '-';
}

function setBusy(busy) {
  elements.run.disabled = busy;
  elements.sample.disabled = busy;
  elements.run.textContent = busy ? 'Running' : 'Run';
}

function renderPayload(payload) {
  elements.result.classList.toggle('is-error', !payload.ok);
  elements.result.textContent = pretty(payload.ok ? payload.result : payload.error);
  elements.logs.textContent = payload.logs || '';
  elements.elapsed.textContent = `${payload.elapsedMs ?? 0} ms`;

  const result = payload.result || {};
  const processes = result.processes
    || result.token?.tokenItems
    || result.events
    || result.adapterCalls
    || result.collection
    || '';
  elements.processes.textContent = processes ? pretty(processes) : '';
}

async function runCurrent() {
  const config = FEATURES[currentFeature];
  let body;

  try {
    body = JSON.parse(elements.input.value);
  } catch (error) {
    renderPayload({
      ok: false,
      error: { message: `Invalid JSON: ${error.message}` },
      elapsedMs: 0,
    });
    return;
  }

  setBusy(true);
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    renderPayload(await response.json());
  } catch (error) {
    renderPayload({
      ok: false,
      error: { message: error.message },
      elapsedMs: 0,
    });
  } finally {
    setBusy(false);
  }
}

async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const payload = await response.json();
    elements.health.textContent = payload.ok ? `${payload.result.features.length} groups ready` : 'error';
  } catch (_error) {
    elements.health.textContent = 'offline';
  }
}

elements.tabs.forEach((tab) => {
  tab.addEventListener('click', () => setFeature(tab.dataset.feature));
});
elements.sample.addEventListener('click', () => setFeature(currentFeature));
elements.run.addEventListener('click', runCurrent);

setFeature(currentFeature);
checkHealth();
