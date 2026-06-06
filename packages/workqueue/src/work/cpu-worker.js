'use strict';

const { parentPort, workerData } = require('node:worker_threads');

function serializeError(error) {
  return {
    message: error?.message ?? String(error),
    name: error?.name ?? 'Error',
    stack: error?.stack,
    code: error?.code,
  };
}

const taskModule = require(workerData.taskModule);
const runTask = typeof taskModule === 'function' ? taskModule : taskModule.runTask;

if (typeof runTask !== 'function') {
  throw new TypeError('CPU worker task module must export runTask(taskType, payload)');
}

parentPort.on('message', async (message) => {
  const { id, taskType, payload } = message;
  try {
    const result = await runTask(taskType, payload);
    parentPort.postMessage({ id, ok: true, result });
  } catch (error) {
    parentPort.postMessage({ id, ok: false, error: serializeError(error) });
  }
});
