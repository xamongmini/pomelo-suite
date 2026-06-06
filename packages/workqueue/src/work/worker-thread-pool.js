'use strict';

const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

class WorkerTaskError extends Error {
  constructor(details) {
    super(details.message);
    this.name = details.name || 'WorkerTaskError';
    this.code = details.code;
    this.stack = details.stack || this.stack;
  }
}

class WorkerThreadPool {
  constructor(options = {}) {
    const defaultWorkerCount = Math.max(1, (os.availableParallelism?.() ?? os.cpus().length) - 1);
    const workerCount = options.workerCount ?? defaultWorkerCount;
    if (!Number.isInteger(workerCount) || workerCount <= 0) {
      throw new RangeError('workerCount must be a positive integer');
    }

    this.workerCount = workerCount;
    this.workerScript = path.resolve(options.workerScript ?? path.join(__dirname, 'cpu-worker.js'));
    this.taskModule = path.resolve(options.taskModule ?? path.join(__dirname, 'cpu-tasks.js'));
    this._queue = [];
    this._workers = [];
    this._nextId = 1;
    this._destroying = false;

    for (let index = 0; index < this.workerCount; index += 1) {
      this._createWorker();
    }
  }

  get pendingCount() {
    return this._queue.length;
  }

  get activeCount() {
    return this._workers.filter((state) => state.current).length;
  }

  run(taskType, payload = {}, options = {}) {
    if (this._destroying) {
      return Promise.reject(new Error('WorkerThreadPool has been destroyed'));
    }
    if (typeof taskType !== 'string' || taskType.length === 0) {
      return Promise.reject(new TypeError('taskType must be a non-empty string'));
    }
    if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs < 0)) {
      return Promise.reject(new RangeError('timeoutMs must be a non-negative finite number'));
    }

    return new Promise((resolve, reject) => {
      this._queue.push({
        id: this._nextId,
        payload,
        reject,
        resolve,
        taskType,
        timeoutMs: options.timeoutMs,
        timer: null,
        transferList: options.transferList,
      });
      this._nextId += 1;
      this._dispatch();
    });
  }

  async destroy() {
    if (this._destroying) {
      return;
    }
    this._destroying = true;

    const error = new Error('WorkerThreadPool has been destroyed');
    const pending = this._queue.splice(0);
    for (const job of pending) {
      job.reject(error);
    }

    const terminations = [];
    for (const state of this._workers.splice(0)) {
      if (state.current) {
        this._clearJobTimer(state.current);
        state.current.reject(error);
        state.current = null;
      }
      terminations.push(state.worker.terminate());
    }

    await Promise.allSettled(terminations);
  }

  _createWorker() {
    const state = {
      current: null,
      failed: false,
      worker: new Worker(this.workerScript, {
        workerData: {
          taskModule: this.taskModule,
        },
      }),
    };

    state.worker.on('message', (message) => this._handleMessage(state, message));
    state.worker.on('error', (error) => this._handleWorkerFailure(state, error));
    state.worker.on('exit', (code) => {
      if (!this._destroying && code !== 0) {
        this._handleWorkerFailure(state, new Error(`Worker exited with code ${code}`));
      }
    });

    this._workers.push(state);
    this._dispatch();
    return state;
  }

  _dispatch() {
    if (this._destroying) {
      return;
    }

    for (const state of this._workers) {
      if (this._queue.length === 0) {
        return;
      }
      if (state.current || state.failed) {
        continue;
      }

      const job = this._queue.shift();
      state.current = job;
      if (job.timeoutMs !== undefined) {
        job.timer = setTimeout(() => this._handleTimeout(state, job), job.timeoutMs);
      }
      state.worker.postMessage({
        id: job.id,
        payload: job.payload,
        taskType: job.taskType,
      }, job.transferList);
    }
  }

  _handleMessage(state, message) {
    const job = state.current;
    if (!job || job.id !== message.id) {
      return;
    }

    state.current = null;
    this._clearJobTimer(job);

    if (message.ok) {
      job.resolve(message.result);
    } else {
      job.reject(new WorkerTaskError(message.error ?? { message: 'Worker task failed' }));
    }

    this._dispatch();
  }

  _handleTimeout(state, job) {
    if (state.current !== job) {
      return;
    }

    state.failed = true;
    state.current = null;
    this._clearJobTimer(job);
    job.reject(new Error(`CPU task '${job.taskType}' timed out after ${job.timeoutMs}ms`));
    this._replaceWorker(state);
  }

  _handleWorkerFailure(state, error) {
    if (state.failed) {
      return;
    }
    state.failed = true;

    if (state.current) {
      this._clearJobTimer(state.current);
      state.current.reject(error);
      state.current = null;
    }

    this._replaceWorker(state);
  }

  _replaceWorker(state) {
    const index = this._workers.indexOf(state);
    if (index !== -1) {
      this._workers.splice(index, 1);
    }

    state.worker.terminate().catch(() => {});

    if (!this._destroying) {
      this._createWorker();
    }
  }

  _clearJobTimer(job) {
    if (job.timer) {
      clearTimeout(job.timer);
      job.timer = null;
    }
  }
}

module.exports = {
  WorkerTaskError,
  WorkerThreadPool,
};
