'use strict';

class ExQueue {
  constructor(capacity = 0) {
    this.items = [];
    if (capacity > 0) {
      this.items.length = 0;
    }
  }

  get count() {
    return this.items.length;
  }

  get Count() {
    return this.count;
  }

  get isEmpty() {
    return this.count === 0;
  }

  get IsEmpty() {
    return this.isEmpty;
  }

  add(item) {
    this.items.push(item);
  }

  Add(item) {
    this.add(item);
  }

  enqueue(item) {
    this.add(item);
  }

  Enqueue(item) {
    this.enqueue(item);
  }

  clear() {
    this.items.length = 0;
  }

  Clear() {
    this.clear();
  }

  dequeue() {
    return this.items.length === 0 ? undefined : this.items.shift();
  }

  Dequeue() {
    return this.dequeue();
  }

  get(index) {
    return this.items[index];
  }

  Get(index) {
    return this.get(index);
  }

  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
}

module.exports = {
  ExQueue,
};
