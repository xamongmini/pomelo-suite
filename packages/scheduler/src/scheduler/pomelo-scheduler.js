'use strict';

const { EventEmitter } = require('node:events');
const { ScheduleType } = require('./schedule-type');

const SchedulerEventType = Object.freeze({
  CREATED: 'CREATED',
  DELETED: 'DELETED',
  INVOKING: 'INVOKING',
  INVOKED: 'INVOKED',
});

function getScheduleId(schedule) {
  return schedule?.id ?? schedule?.ID ?? null;
}

function getScheduleType(schedule) {
  return schedule?.type ?? schedule?.Type ?? null;
}

function getNextInvokeTime(schedule) {
  return schedule?.nextInvokeTime ?? schedule?.NextInvokeTime ?? schedule?.StartTime ?? null;
}

function compareSchedules(left, right) {
  if (left && typeof left.compareTo === 'function') {
    return left.compareTo(right);
  }
  const leftTime = getNextInvokeTime(left);
  const rightTime = getNextInvokeTime(right);
  return leftTime.getTime() - rightTime.getTime();
}

class PomeloScheduler extends EventEmitter {
  constructor(options = {}) {
    super();
    this._now = typeof options.now === 'function' ? options.now : () => new Date();
    this._setTimeout = options.setTimeout ?? setTimeout;
    this._clearTimeout = options.clearTimeout ?? clearTimeout;
    this._schedulesList = [];
    this._nextSchedule = null;
    this._timer = null;
    this._running = options.autoStart !== false;
  }

  count() {
    return this._schedulesList.length;
  }

  getScheduleAt(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this._schedulesList.length) {
      return null;
    }
    return this._schedulesList[index];
  }

  getSchedule(scheduleId) {
    return this._schedulesList.find((schedule) => getScheduleId(schedule) === scheduleId) ?? null;
  }

  addSchedule(schedule) {
    this._assertSchedule(schedule);
    const scheduleId = getScheduleId(schedule);
    if (this.getSchedule(scheduleId)) {
      throw new Error(`Schedule '${scheduleId}' already exists.`);
    }

    this._schedulesList.push(schedule);
    this._sortSchedules();
    this._setNextEventTime();
    this._emitSchedulerEvent(SchedulerEventType.CREATED, schedule);
    return schedule;
  }

  removeSchedule(scheduleOrId) {
    const schedule = typeof scheduleOrId === 'string'
      ? this.getSchedule(scheduleOrId)
      : scheduleOrId;
    if (!schedule) {
      return false;
    }

    const index = this._schedulesList.indexOf(schedule);
    if (index === -1) {
      return false;
    }

    this._schedulesList.splice(index, 1);
    this._setNextEventTime();
    this._emitSchedulerEvent(SchedulerEventType.DELETED, schedule);
    return true;
  }

  start() {
    if (this._running) {
      return this;
    }
    this._running = true;
    this._setNextEventTime();
    return this;
  }

  stop() {
    this._running = false;
    this._clearTimer();
    this._nextSchedule = null;
    return this;
  }

  resetNextEventTime() {
    this._sortSchedules();
    this._setNextEventTime();
    return this._nextSchedule;
  }

  completeSchedule(scheduleOrId) {
    const schedule = typeof scheduleOrId === 'string'
      ? this.getSchedule(scheduleOrId)
      : scheduleOrId;
    if (!schedule || !this._schedulesList.includes(schedule)) {
      return false;
    }
    if (getScheduleType(schedule) !== ScheduleType.INTERVAL2) {
      return false;
    }
    if (typeof schedule.recalculateNextInvokeTime !== 'function') {
      throw new TypeError('IntervalSchedule2 must implement recalculateNextInvokeTime()');
    }

    schedule.recalculateNextInvokeTime();
    this.resetNextEventTime();
    return true;
  }

  toArray() {
    return [...this._schedulesList];
  }

  _dispatchEvents() {
    const schedule = this._nextSchedule;
    this._nextSchedule = null;
    this._timer = null;

    if (!schedule || !this._schedulesList.includes(schedule)) {
      this._setNextEventTime();
      return;
    }

    this._emitSchedulerEvent(SchedulerEventType.INVOKING, schedule);
    schedule.triggerEvents();

    if (getScheduleType(schedule) === ScheduleType.ONETIME) {
      this.removeSchedule(schedule);
      return;
    }

    if (this._schedulesList.includes(schedule)) {
      this._emitSchedulerEvent(SchedulerEventType.INVOKED, schedule);
    }
    this._sortSchedules();
    this._setNextEventTime();
  }

  _setNextEventTime() {
    this._clearTimer();
    if (!this._running || this._schedulesList.length === 0) {
      this._nextSchedule = null;
      return;
    }

    this._sortSchedules();
    this._nextSchedule = this._schedulesList[0];
    const nextInvokeTime = getNextInvokeTime(this._nextSchedule);
    const delayMs = Math.max(0, nextInvokeTime.getTime() - this._now().getTime());
    this._timer = this._setTimeout(() => this._dispatchEvents(), delayMs);
  }

  _clearTimer() {
    if (this._timer !== null) {
      this._clearTimeout(this._timer);
      this._timer = null;
    }
  }

  _sortSchedules() {
    this._schedulesList.sort(compareSchedules);
  }

  _emitSchedulerEvent(type, schedule) {
    const event = {
      type,
      schedule,
      scheduleID: getScheduleId(schedule),
    };
    this.emit('schedulerEvent', event);
    this.emit(type, event);
  }

  _assertSchedule(schedule) {
    const scheduleId = getScheduleId(schedule);
    const nextInvokeTime = getNextInvokeTime(schedule);
    if (!schedule || !scheduleId) {
      throw new TypeError('schedule must have an id');
    }
    if (!(nextInvokeTime instanceof Date) || Number.isNaN(nextInvokeTime.getTime())) {
      throw new TypeError('schedule must have a valid nextInvokeTime');
    }
    if (typeof schedule.triggerEvents !== 'function') {
      throw new TypeError('schedule must implement triggerEvents()');
    }
  }
}

module.exports = {
  PomeloScheduler,
  SchedulerEventType,
};
