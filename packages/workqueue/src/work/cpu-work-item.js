'use strict';

const { WorkItem } = require('./work-item');

class CpuWorkItem extends WorkItem {
  constructor({ taskType, payload = {}, workerPool, timeoutMs, transferList } = {}) {
    super();
    if (!workerPool || typeof workerPool.run !== 'function') {
      throw new TypeError('workerPool with run(taskType, payload, options) is required');
    }
    if (typeof taskType !== 'string' || taskType.length === 0) {
      throw new TypeError('taskType must be a non-empty string');
    }

    this.taskType = taskType;
    this.payload = payload;
    this.workerPool = workerPool;
    this.timeoutMs = timeoutMs;
    this.transferList = transferList;
    this.result = null;
  }

  async perform() {
    this.result = await this.workerPool.run(this.taskType, this.payload, {
      timeoutMs: this.timeoutMs,
      transferList: this.transferList,
    });
    return this.result;
  }
}

module.exports = {
  CpuWorkItem,
};
