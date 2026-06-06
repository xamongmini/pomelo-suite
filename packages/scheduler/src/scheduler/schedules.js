'use strict';

const { ScheduleType } = require('./schedule-type');
const { ScheduleBase } = require('./schedule-base');
const {
  addMilliseconds,
  addUtcMonthsClamped,
  daysInUtcMonth,
  withUtcTime,
} = require('./date-utils');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function assertFixedHour(hour) {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError('fixed hour must be an integer from 0 to 23');
  }
}

function assertFixedDay(day) {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new RangeError('fixed day must be an integer from 1 to 31');
  }
}

class OneTimeSchedule extends ScheduleBase {
  constructor(id, name, startTime, options) {
    super(id, name, startTime, ScheduleType.ONETIME, options);
  }

  triggerEvents() {
    this.nextInvokeTime = new Date(8640000000000000);
    this.emit('trigger', this);
    return this.nextInvokeTime;
  }
}

class IntervalSchedule extends ScheduleBase {
  constructor(id, name, startTime, intervalSeconds, options = {}) {
    super(id, name, startTime, ScheduleType.INTERVAL, { ...options, interval: intervalSeconds });
  }

  calculateNextInvokeTime() {
    return addMilliseconds(this.nextInvokeTime, this.interval * SECOND);
  }
}

class IntervalSchedule2 extends ScheduleBase {
  constructor(id, name, startTime, intervalSeconds, options = {}) {
    super(id, name, startTime, ScheduleType.INTERVAL2, { ...options, interval: intervalSeconds });
  }

  recalculateNextInvokeTime() {
    this.nextInvokeTime = addMilliseconds(this.now(), this.interval * SECOND);
    return this.nextInvokeTime;
  }

  calculateNextInvokeTime() {
    return addUtcMonthsClamped(this.now(), 12);
  }
}

class MinutelySchedule extends ScheduleBase {
  constructor(id, name, startTime, options) {
    super(id, name, startTime, ScheduleType.MINUTELY, options);
  }

  calculateNextInvokeTime() {
    return addMilliseconds(this.nextInvokeTime, MINUTE);
  }
}

class TimelySchedule extends ScheduleBase {
  constructor(id, name, startTime, options) {
    super(id, name, startTime, ScheduleType.TIMELY, options);
  }

  calculateNextInvokeTime() {
    return addMilliseconds(this.nextInvokeTime, HOUR);
  }
}

class DailySchedule extends ScheduleBase {
  constructor(id, name, startTime, options) {
    super(id, name, startTime, ScheduleType.DAILY, options);
  }

  calculateNextInvokeTime() {
    return addMilliseconds(this.nextInvokeTime, DAY);
  }
}

class WeeklySchedule extends ScheduleBase {
  constructor(id, name, startTime, options) {
    super(id, name, startTime, ScheduleType.WEEKLY, options);
  }

  calculateNextInvokeTime() {
    return addMilliseconds(this.nextInvokeTime, 7 * DAY);
  }
}

class MonthlySchedule extends ScheduleBase {
  constructor(id, name, startTime, options) {
    super(id, name, startTime, ScheduleType.MONTHLY, options);
  }

  calculateNextInvokeTime() {
    return addUtcMonthsClamped(this.nextInvokeTime, 1);
  }
}

class FixTimeSchedule extends ScheduleBase {
  constructor(id, name, startTime, fixedHour, options = {}) {
    assertFixedHour(fixedHour);
    super(id, name, startTime, ScheduleType.FIXTIME, { ...options, interval: fixedHour });
    this.fixedHour = fixedHour;
  }

  calculateNextInvokeTime() {
    return addMilliseconds(this.nextInvokeTime, this.fixedHour * HOUR);
  }
}

class FixDaySchedule extends ScheduleBase {
  constructor(id, name, startTime, fixedHour, options = {}) {
    assertFixedHour(fixedHour);
    super(id, name, startTime, ScheduleType.FIXDAILY, options);
    this.fixedHour = fixedHour;
  }

  calculateNextInvokeTime() {
    return withUtcTime(addMilliseconds(this.nextInvokeTime, DAY), this.fixedHour);
  }
}

class FixMonthSchedule extends ScheduleBase {
  constructor(id, name, startTime, fixedDay, options = {}) {
    assertFixedDay(fixedDay);
    super(id, name, startTime, ScheduleType.FIXMONTHLY, options);
    this.fixedDay = fixedDay;
  }

  calculateNextInvokeTime() {
    const nextMonth = addUtcMonthsClamped(this.nextInvokeTime, 1);
    const targetDay = Math.min(
      this.fixedDay,
      daysInUtcMonth(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth()),
    );

    return new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), targetDay));
  }
}

module.exports = {
  OneTimeSchedule,
  IntervalSchedule,
  IntervalSchedule2,
  MinutelySchedule,
  TimelySchedule,
  DailySchedule,
  WeeklySchedule,
  MonthlySchedule,
  FixTimeSchedule,
  FixDaySchedule,
  FixMonthSchedule,
};
