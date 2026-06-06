'use strict';

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toAttributeList(value) {
  if (value instanceof AttributeList) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toAttributeList(item));
  }

  if (isPlainObject(value)) {
    return new AttributeList(value);
  }

  return value;
}

class AttributeList {
  constructor(values = {}) {
    if (values === null) {
      values = {};
    }

    for (const [key, value] of Object.entries(values)) {
      this.set(key, value);
    }
  }

  get count() {
    return Object.keys(this).length;
  }

  get Count() {
    return this.count;
  }

  contains(key) {
    return Object.prototype.hasOwnProperty.call(this, key);
  }

  get(key) {
    return this[key];
  }

  set(key, value) {
    this[key] = toAttributeList(value);
    return this;
  }

  add(key, value) {
    return this.set(key, value);
  }

  clear() {
    for (const key of Object.keys(this)) {
      delete this[key];
    }
  }

  entries() {
    return Object.entries(this);
  }

  keys() {
    return Object.keys(this);
  }

  values() {
    return Object.values(this);
  }

  toJSON() {
    const output = {};
    for (const [key, value] of this.entries()) {
      output[key] = value;
    }
    return output;
  }

  [Symbol.iterator]() {
    return this.entries()[Symbol.iterator]();
  }
}

function parseItemSegment(segment) {
  const match = /^_items\(([-+]?\d+)\)$/.exec(segment);
  if (!match) {
    return null;
  }
  return Number.parseInt(match[1], 10);
}

function readProperty(value, key) {
  if (value == null) {
    return null;
  }
  if (value instanceof AttributeList || isPlainObject(value)) {
    return Object.prototype.hasOwnProperty.call(value, key) ? value[key] : null;
  }
  return null;
}

function getAttributeWithPath(root, path) {
  if (!root || !path) {
    return null;
  }

  const segments = String(path).split('.').filter((segment) => segment.length > 0);
  let current = root;

  for (const segment of segments) {
    const itemIndex = parseItemSegment(segment);
    if (itemIndex !== null) {
      if (!Array.isArray(current) || itemIndex < 0 || itemIndex >= current.length) {
        return null;
      }
      current = current[itemIndex];
      continue;
    }

    current = readProperty(current, segment);
    if (current == null) {
      return null;
    }
  }

  return current;
}

function ensureObjectContainer(parent, key, nextSegment) {
  const shouldBeArray = parseItemSegment(nextSegment) !== null;
  let value = readProperty(parent, key);

  if (value == null) {
    value = shouldBeArray ? [] : new AttributeList();
    if (parent instanceof AttributeList) {
      parent.set(key, value);
    } else {
      parent[key] = value;
    }
  }

  return value;
}

function setProperty(parent, key, value) {
  if (parent instanceof AttributeList) {
    parent.set(key, value);
  } else if (isPlainObject(parent)) {
    parent[key] = toAttributeList(value);
  } else {
    throw new TypeError(`Cannot assign '${key}' on non-object path segment`);
  }
}

function setAttributeWithPath(root, path, value) {
  if (!root || !path) {
    throw new TypeError('root and path are required');
  }

  const segments = String(path).split('.').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    throw new TypeError('path is required');
  }

  let current = root;

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const isLast = index === segments.length - 1;
    const itemIndex = parseItemSegment(segment);

    if (itemIndex !== null) {
      if (!Array.isArray(current)) {
        throw new TypeError(`Cannot select '${segment}' on non-array path segment`);
      }
      if (itemIndex < 0) {
        throw new RangeError(`Invalid item index ${itemIndex}`);
      }
      if (current[itemIndex] == null) {
        current[itemIndex] = new AttributeList();
      }
      if (isLast) {
        current[itemIndex] = toAttributeList(value);
      } else {
        current = current[itemIndex];
      }
      continue;
    }

    if (isLast) {
      setProperty(current, segment, value);
    } else {
      current = ensureObjectContainer(current, segment, segments[index + 1]);
    }
  }

  return root;
}

function appendPrintable(lines, key, value, indent) {
  const prefix = ' '.repeat(indent);

  if (value instanceof AttributeList || isPlainObject(value)) {
    lines.push(`${prefix}${key}:`);
    for (const [childKey, childValue] of Object.entries(value)) {
      appendPrintable(lines, childKey, childValue, indent + 2);
    }
    return;
  }

  if (Array.isArray(value)) {
    lines.push(`${prefix}${key}:`);
    value.forEach((item, index) => {
      appendPrintable(lines, `[${index}]`, item, indent + 2);
    });
    return;
  }

  lines.push(`${prefix}${key}: ${value}`);
}

function printAttributeList(name, value) {
  const lines = [];
  appendPrintable(lines, name || 'AttributeList', toAttributeList(value), 0);
  return lines.join('\n');
}

module.exports = {
  AttributeList,
  getAttributeWithPath,
  printAttributeList,
  setAttributeWithPath,
  toAttributeList,
};
