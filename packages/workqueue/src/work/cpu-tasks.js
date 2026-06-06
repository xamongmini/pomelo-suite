'use strict';

const { threadId } = require('node:worker_threads');
function loadCalculator() {
  try {
    return require('@pomelo-suite/calculator');
  } catch (error) {
    if (error && error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
    return require('../../../calculator/src');
  }
}

const { Calculator, Token } = loadCalculator();

function assertInteger(value, name) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${name} must be an integer`);
  }
}

function fibonacci(payload = {}) {
  const n = Number(payload.n ?? 0);
  assertInteger(n, 'n');
  if (n < 0 || n > 78) {
    throw new RangeError('n must be an integer from 0 to 78');
  }

  let previous = 0;
  let current = 1;
  for (let index = 0; index < n; index += 1) {
    const next = previous + current;
    previous = current;
    current = next;
  }

  return {
    n,
    value: previous,
    threadId,
  };
}

function sumRange(payload = {}) {
  const start = Number(payload.start ?? 0);
  const end = Number(payload.end ?? 0);
  assertInteger(start, 'start');
  assertInteger(end, 'end');
  if (end < start) {
    throw new RangeError('end must be greater than or equal to start');
  }

  let sum = 0;
  for (let value = start; value <= end; value += 1) {
    sum += value;
  }

  return {
    start,
    end,
    sum,
    threadId,
  };
}

function blockFor(payload = {}) {
  const milliseconds = Number(payload.milliseconds ?? 1);
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError('milliseconds must be a non-negative finite number');
  }

  const stopAt = Date.now() + milliseconds;
  let iterations = 0;
  while (Date.now() < stopAt) {
    iterations += 1;
  }

  return {
    milliseconds,
    iterations,
    threadId,
  };
}

function calculateExpression(payload = {}) {
  const expression = String(payload.expression ?? '');
  const token = new Token(expression);
  const variables = payload.variables ?? {};

  for (const [name, value] of Object.entries(variables)) {
    token.Variables.Add(name).VariableValue = value;
  }

  const value = new Calculator(token).Calculate();
  return {
    expression,
    value,
    threadId,
  };
}

const tasks = Object.freeze({
  blockFor,
  calculateExpression,
  fibonacci,
  sumRange,
});

async function runTask(taskType, payload) {
  const task = tasks[taskType];
  if (!task) {
    throw new Error(`Unknown CPU task '${taskType}'`);
  }
  return task(payload);
}

module.exports = {
  runTask,
  tasks,
};
