'use strict';

const { ScheduleType } = require('./schedule-type');

class Schedule {
  constructor(values = {}) {
    values = values ?? {};

    this.ID = values.ID ?? '';
    this.Name = values.Name ?? '';
    this.Type = values.Type ?? ScheduleType.ONETIME;
    this.StartTime = values.StartTime ?? new Date();
    this.UseDB = values.UseDB ?? false;
    this.Interval = values.Interval ?? 0;
    this.AssemblyName = values.AssemblyName ?? '';
    this.TypeName = values.TypeName ?? '';
    this.Tag = values.Tag ?? null;
  }
}

class ScheduleCollection {
  constructor(schedules = []) {
    this.schedules = [...schedules];
    this._syncIndexes();
  }

  add(schedule) {
    const index = this.schedules.push(schedule) - 1;
    this._syncIndexes();
    return index;
  }

  get length() {
    return this.schedules.length;
  }

  get count() {
    return this.schedules.length;
  }

  get Count() {
    return this.schedules.length;
  }

  at(index) {
    return this.schedules[index];
  }

  findSchedule(name) {
    return this.schedules.find((schedule) => schedule.Name === name) || null;
  }

  sortByName() {
    this.schedules.sort((left, right) => String(left.Name).localeCompare(String(right.Name)));
    this._syncIndexes();
    return this;
  }

  toArray() {
    return [...this.schedules];
  }

  [Symbol.iterator]() {
    return this.schedules[Symbol.iterator]();
  }

  _syncIndexes() {
    const indexedLength = this._indexedLength ?? 0;

    for (let index = 0; index < indexedLength; index += 1) {
      delete this[index];
    }

    for (let index = 0; index < this.schedules.length; index += 1) {
      Object.defineProperty(this, index, {
        configurable: true,
        enumerable: false,
        value: this.schedules[index],
      });
    }

    this._indexedLength = this.schedules.length;
  }
}

module.exports = { Schedule, ScheduleCollection };
