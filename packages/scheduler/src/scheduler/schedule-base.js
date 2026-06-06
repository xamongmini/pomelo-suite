'use strict';

const { EventEmitter } = require('node:events');
const { cloneDate } = require('./date-utils');

class ScheduleBase extends EventEmitter {
  constructor(id, name, startTime, type, options = {}) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.now = typeof options.now === 'function' ? options.now : () => new Date();
    this.startTime = cloneDate(startTime);
    this.nextInvokeTime = cloneDate(startTime);
    this.interval = options.interval;
  }

  triggerEvents() {
    this.nextInvokeTime = this.calculateNextInvokeTime();
    this.emit('trigger', this);
    return this.nextInvokeTime;
  }

  calculateNextInvokeTime() {
    throw new Error('calculateNextInvokeTime() must be implemented by a subclass');
  }

  compareTo(other) {
    return this.nextInvokeTime.getTime() - other.nextInvokeTime.getTime();
  }
}

module.exports = { ScheduleBase };
