'use strict';

class ExStack {
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

  reverse() {
    this.items.reverse();
  }

  Reverse() {
    this.reverse();
  }

  swap() {
    if (this.count < 2) {
      return;
    }
    const item1 = this.pop();
    const item2 = this.pop();
    this.push(item1);
    this.push(item2);
  }

  Swap() {
    this.swap();
  }

  push(item) {
    if (item instanceof ExStack) {
      const values = item.peekAll().reverse();
      values.forEach((value) => this.push(value));
      return;
    }
    if (Array.isArray(item)) {
      item.forEach((value) => this.push(value));
      return;
    }
    this.items.push(item);
  }

  Push(item) {
    this.push(item);
  }

  pop(count = null) {
    if (count == null) {
      return this.count === 0 ? undefined : this.items.pop();
    }
    if (this.count === 0) {
      return null;
    }
    const output = [];
    const popCount = Math.min(Number(count), this.count);
    for (let index = 0; index < popCount; index += 1) {
      output.push(this.pop());
    }
    return output;
  }

  Pop(count = null) {
    return this.pop(count);
  }

  popAll() {
    return this.pop(this.count);
  }

  PopAll() {
    return this.popAll();
  }

  popStack(count) {
    const stack = new ExStack(count);
    const values = this.pop(count) ?? [];
    values.reverse().forEach((value) => stack.push(value));
    return stack;
  }

  PopStack(count) {
    return this.popStack(count);
  }

  peek(count = null) {
    if (count == null) {
      return this.count === 0 ? undefined : this.items[this.count - 1];
    }
    if (this.count === 0) {
      return null;
    }
    const peekCount = Math.min(Number(count), this.count);
    const output = [];
    for (let index = 0; index < peekCount; index += 1) {
      output.push(this.items[this.count - 1 - index]);
    }
    return output;
  }

  Peek(count = null) {
    return this.peek(count);
  }

  peekAll() {
    return this.peek(this.count);
  }

  PeekAll() {
    return this.peekAll();
  }

  search(item) {
    for (let index = this.count - 1, pops = 1; index >= 0; index -= 1, pops += 1) {
      if (this.items[index] === item || String(this.items[index]) === String(item)) {
        return pops;
      }
    }
    return 0;
  }

  Search(item) {
    return this.search(item);
  }

  removeItem(index) {
    if (index >= 0 && index < this.count) {
      this.items.splice(index, 1);
    }
  }

  RemoveItem(index) {
    this.removeItem(index);
  }

  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
}

module.exports = {
  ExStack,
};
