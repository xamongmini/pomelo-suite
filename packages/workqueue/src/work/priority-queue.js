'use strict';

class PriorityQueue {
  constructor(values = []) {
    this._items = Array.from(values);
    this._head = 0;
    this.tag = null;
  }

  get count() {
    return this._items.length - this._head;
  }

  enqueue(value) {
    this._items.push(value);
  }

  dequeue() {
    if (this.count === 0) {
      throw new Error('InvalidOperation_EmptyQueue');
    }
    const value = this._items[this._head];
    this._items[this._head] = undefined;
    this._head += 1;
    this._compactIfNeeded();
    return value;
  }

  peek() {
    if (this.count === 0) {
      throw new Error('InvalidOperation_EmptyQueue');
    }
    return this._items[this._head];
  }

  contains(value) {
    for (let index = this._head; index < this._items.length; index += 1) {
      if (this._items[index] === value) {
        return true;
      }
    }
    return false;
  }

  bringToFront(value) {
    this._compact();
    const index = this._items.indexOf(value);
    if (this.count === 0) {
      throw new Error('InvalidOperation_EmptyQueue');
    }
    if (index === -1) {
      throw new Error('InvalidOperation_NotContains');
    }
    this._items.splice(index, 1);
    this._items.unshift(value);
  }

  remove(value) {
    this._compact();
    const index = this._items.indexOf(value);
    if (this.count === 0) {
      throw new Error('InvalidOperation_EmptyQueue');
    }
    if (index === -1) {
      throw new Error('InvalidOperation_NotContains');
    }
    this._items.splice(index, 1);
  }

  clear() {
    this._items.length = 0;
    this._head = 0;
  }

  toArray() {
    return this._items.slice(this._head);
  }

  [Symbol.iterator]() {
    return this.toArray()[Symbol.iterator]();
  }

  _compact() {
    if (this._head === 0) {
      return;
    }
    this._items = this._items.slice(this._head);
    this._head = 0;
  }

  _compactIfNeeded() {
    if (this._head > 64 && this._head * 2 >= this._items.length) {
      this._compact();
    }
  }
}

module.exports = {
  PriorityQueue,
};
