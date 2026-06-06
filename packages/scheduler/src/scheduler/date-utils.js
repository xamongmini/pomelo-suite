'use strict';

function cloneDate(date) {
  return new Date(date.getTime());
}

function addMilliseconds(date, milliseconds) {
  return new Date(date.getTime() + milliseconds);
}

function daysInUtcMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function addUtcMonthsClamped(date, months) {
  const day = date.getUTCDate();
  const targetMonthStart = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + months,
    1,
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  ));
  const targetDay = Math.min(
    day,
    daysInUtcMonth(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth()),
  );

  targetMonthStart.setUTCDate(targetDay);
  return targetMonthStart;
}

function withUtcTime(date, hour, minute = 0, second = 0, millisecond = 0) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    hour,
    minute,
    second,
    millisecond,
  ));
}

module.exports = {
  cloneDate,
  addMilliseconds,
  daysInUtcMonth,
  addUtcMonthsClamped,
  withUtcTime,
};
