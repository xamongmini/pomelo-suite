'use strict';

const crypto = require('node:crypto');
const { InvalidTransitionError } = require('./invalid-transition-error');
const { WorkItemState } = require('./work-item-state');

const VALID_TRANSITIONS = new Map([
  [WorkItemState.Created, new Set([WorkItemState.Scheduled, WorkItemState.Queued])],
  [WorkItemState.Queued, new Set([WorkItemState.Scheduled])],
  [WorkItemState.Scheduled, new Set([WorkItemState.Running])],
  [WorkItemState.Running, new Set([WorkItemState.Completed, WorkItemState.Failing])],
  [WorkItemState.Failing, new Set([WorkItemState.Completed])],
  [WorkItemState.Completed, new Set()],
  [WorkItemState.Deleted, new Set()],
]);

class WorkItem {
  constructor() {
    this.id = crypto.randomUUID();
    this.parent = '';
    this.createdTime = new Date();
    this.startedTime = null;
    this.completedTime = null;
    this.lastAccessTime = null;
    this.failedException = null;
    this.priority = 'Normal';
    this.tag = null;
    this.workQueue = null;
    this._state = WorkItemState.Created;
  }

  get state() {
    return this._state;
  }

  set state(nextState) {
    this.validateStateTransition(this._state, nextState);
    const previousState = this._state;
    this._state = nextState;

    if (nextState === WorkItemState.Running) {
      this.startedTime = new Date();
    }

    if (nextState === WorkItemState.Completed) {
      this.completedTime = new Date();
    }

    if (this.workQueue && typeof this.workQueue.workItemStateChanged === 'function') {
      this.workQueue.workItemStateChanged(this, previousState);
    }
  }

  get processingTime() {
    if (!this.startedTime || !this.completedTime) {
      return 0;
    }
    return this.completedTime.getTime() - this.startedTime.getTime();
  }

  validateStateTransition(currentState, nextState) {
    const allowed = VALID_TRANSITIONS.get(currentState);
    if (!allowed || !allowed.has(nextState)) {
      throw new InvalidTransitionError(this, currentState, nextState);
    }
  }

  perform() {
    throw new Error('WorkItem.perform() must be implemented by a subclass');
  }

  toString() {
    return `{${this.id}}`;
  }
}

module.exports = {
  WorkItem,
};
