'use strict';

const { EventEmitter } = require('node:events');
const { PriorityQueue } = require('./priority-queue');
const { WorkItem } = require('./work-item');
const { WorkItemState } = require('./work-item-state');

class WorkQueue extends EventEmitter {
  constructor({ concurrentLimit = 2 } = {}) {
    super();
    if (!Number.isInteger(concurrentLimit) || concurrentLimit <= 0) {
      throw new RangeError('concurrentLimit must be a positive integer');
    }
    this.queue = new PriorityQueue();
    this.concurrentLimit = concurrentLimit;
    this.pausing = false;
    this.runningItems = 0;
    this._waiters = [];
    this._internalException = null;
  }

  get count() {
    return this.runningItems + this.queue.count;
  }

  add(workItem) {
    if (!workItem) {
      throw new TypeError('workItem is required');
    }
    if (!(workItem instanceof WorkItem)) {
      throw new TypeError('workItem must be a WorkItem');
    }
    if (this._internalException) {
      throw this._internalException;
    }
    if (workItem.workQueue && workItem.workQueue !== this) {
      throw new Error(`'${workItem}' is assigned to another WorkQueue '${workItem.workQueue}'.`);
    }

    const targetState = !this.pausing && this.runningItems < this.concurrentLimit
      ? WorkItemState.Scheduled
      : WorkItemState.Queued;
    workItem.validateStateTransition(workItem.state, targetState);
    workItem.workQueue = this;

    if (targetState === WorkItemState.Scheduled) {
      workItem.state = targetState;
    } else {
      workItem.state = targetState;
      this.queue.enqueue(workItem);
    }
  }

  pause() {
    this.pausing = true;
  }

  resume() {
    if (!this.pausing) {
      return;
    }
    this.pausing = false;
    this._drain();
  }

  clear() {
    this.queue.clear();
    this._resolveWaitersIfDone();
  }

  waitAll(timeoutMs) {
    if (this._internalException) {
      return Promise.reject(this._internalException);
    }
    if (this.pausing && this.count > 0) {
      return Promise.reject(new Error('The queue is paused, no work will be performed.'));
    }
    const hasTimeout = timeoutMs !== undefined;
    if (hasTimeout && (!Number.isFinite(timeoutMs) || timeoutMs < 0)) {
      return Promise.reject(new RangeError('timeoutMs must be a non-negative finite number'));
    }
    if (this.count === 0) {
      return Promise.resolve(hasTimeout ? true : undefined);
    }
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, hasTimeout, timer: null };
      if (hasTimeout) {
        waiter.timer = setTimeout(() => {
          const index = this._waiters.indexOf(waiter);
          if (index !== -1) {
            this._waiters.splice(index, 1);
          }
          resolve(false);
        }, timeoutMs);
      }
      this._waiters.push(waiter);
    });
  }

  workItemStateChanged(workItem, previousState) {
    this.emit('changedWorkItemState', { workItem, previousState });

    if (workItem.state === WorkItemState.Scheduled) {
      this.runningItems += 1;
      queueMicrotask(() => this._run(workItem));
      return;
    }

    if (workItem.state === WorkItemState.Running) {
      this.emit('runningWorkItem', { workItem });
      return;
    }

    if (workItem.state === WorkItemState.Failing) {
      this.emit('failedWorkItem', { workItem });
      return;
    }

    if (workItem.state === WorkItemState.Completed) {
      this.runningItems -= 1;
      this.emit('completedWorkItem', { workItem });
      if (this.count === 0) {
        this.emit('allWorkCompleted');
      }
      this._drain();
      this._resolveWaitersIfDone();
    }
  }

  async _run(workItem) {
    try {
      workItem.state = WorkItemState.Running;
      try {
        await workItem.perform();
      } catch (error) {
        workItem.failedException = error;
        workItem.state = WorkItemState.Failing;
      }
      workItem.state = WorkItemState.Completed;
    } catch (error) {
      this._internalException = error;
      this.pause();
      this.emit('workerException', { workItem, error });
      this._rejectWaiters(error);
    }
  }

  _drain() {
    while (!this.pausing && this.runningItems < this.concurrentLimit && this.queue.count > 0) {
      const workItem = this.queue.dequeue();
      workItem.state = WorkItemState.Scheduled;
    }
  }

  _resolveWaitersIfDone() {
    if (this.count !== 0) {
      return;
    }
    const waiters = this._waiters.splice(0);
    for (const waiter of waiters) {
      if (waiter.timer) {
        clearTimeout(waiter.timer);
      }
      waiter.resolve(waiter.hasTimeout ? true : undefined);
    }
  }

  _rejectWaiters(error) {
    const waiters = this._waiters.splice(0);
    for (const waiter of waiters) {
      if (waiter.timer) {
        clearTimeout(waiter.timer);
      }
      waiter.reject(error);
    }
  }
}

module.exports = {
  WorkQueue,
};
