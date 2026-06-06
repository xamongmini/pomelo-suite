'use strict';

const {
  getAttributeWithPath,
  toAttributeList,
} = require('./attribute-list');

const ATTRIBUTE_PATTERN = /\{@([^{}]*)\}/g;
const FETCHED_PATTERN = /\{\$([^{}]*)\}/g;
const ITEM_PATTERN = /_items\(([^)]*)\)/g;

function normalizeFormulaInput(input) {
  let output = String(input);
  if (output.startsWith('@')) {
    output = `{${output}}`;
  } else if (output.startsWith('$')) {
    output = `{@${output.substring(1)}}`;
  } else if (output.startsWith('{$') && output.endsWith('}')) {
    output = `{@${output.substring(2, output.length - 1)}}`;
  }
  return output;
}

function getDateString(now) {
  const date = now();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getTimeString(now) {
  const date = now();
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

class FormulaService {
  constructor({ pomeloService = null, now = () => new Date(), userName = process.env.USERNAME || process.env.USER || '' } = {}) {
    this.pomeloService = pomeloService;
    this.now = now;
    this.userName = userName;
  }

  parse(owner, input) {
    if (input == null || input === '') {
      return input;
    }

    let output = normalizeFormulaInput(input);

    for (let count = 0; count < 10; count += 1) {
      let changed = false;
      output = output.replace(ATTRIBUTE_PATTERN, (token, propertyName) => {
        const value = this.parseAndCompute(owner, propertyName);
        changed = true;
        if (value && typeof value === 'object') {
          return '(object)';
        }
        return value == null ? '' : String(value).replace(/{/g, '![').replace(/}/g, ']!');
      });

      if (!changed || !output.includes('{@')) {
        break;
      }
    }

    return output;
  }

  parseObject(owner, input) {
    if (input == null || input === '') {
      return null;
    }

    const normalized = normalizeFormulaInput(input);
    const match = ATTRIBUTE_PATTERN.exec(normalized);
    ATTRIBUTE_PATTERN.lastIndex = 0;
    if (!match) {
      return null;
    }

    return this.resolvePath(owner, match[1]);
  }

  parseMacro(owner, input, index = 0) {
    if (input == null || input === '' || !owner || !owner.FetchedData) {
      return input;
    }

    return String(input).replace(FETCHED_PATTERN, (_token, propertyName) => {
      const source = owner.FetchedData.length > 0 ? owner.FetchedData[index] : toAttributeList({});
      const value = this.getAttributeWithPath(source, propertyName);
      return value == null ? '' : String(value);
    });
  }

  parseSequence(owner, input) {
    if (input == null || input === '') {
      return input;
    }

    let output = String(input).replace(ITEM_PATTERN, (_token, propertyName) => {
      const indexText = propertyName.startsWith('{@') ? this.parse(owner, propertyName) : propertyName;
      return `_items(${indexText})`;
    });

    if (output.startsWith('@')) {
      output = output.substring(1);
    }

    const value = this.getAttributeWithPath(owner?.Data, output);
    if (value == null || typeof value === 'object') {
      return value == null ? '' : '(object)';
    }
    return String(value);
  }

  parseAndCompute(owner, propertyName) {
    const value = this.resolvePath(owner, propertyName);
    if (value == null) {
      return this.applyFilter('', this.splitFilter(propertyName).filter);
    }
    if (typeof value === 'object') {
      return value;
    }
    return this.applyFilter(String(value), this.splitFilter(propertyName).filter);
  }

  resolvePath(owner, rawPropertyName) {
    const { path } = this.splitFilter(rawPropertyName);
    const upperPath = path.toUpperCase();

    if (upperPath === 'USER') {
      return this.userName;
    }
    if (upperPath === 'DATE') {
      return getDateString(this.now);
    }
    if (upperPath === 'TIME') {
      return getTimeString(this.now);
    }

    if (!owner) {
      return null;
    }

    let data = owner.Data;
    let resolvedPath = path;

    if (path.startsWith('global.')) {
      data = owner.Root?.Data;
    } else if (path.startsWith('extra.parameter.')) {
      data = owner.Parameter;
    } else if (path.startsWith('self.')) {
      resolvedPath = path.substring('self.'.length);
    }

    return this.getAttributeWithPath(data, resolvedPath);
  }

  splitFilter(propertyName) {
    const text = String(propertyName);
    const index = text.indexOf(':');
    if (index === -1) {
      return { path: text, filter: '' };
    }
    return {
      path: text.substring(0, index),
      filter: text.substring(index + 1),
    };
  }

  applyFilter(value, filter) {
    if (!filter) {
      return value;
    }

    if (this.pomeloService && typeof this.pomeloService.getFilterString === 'function') {
      return this.pomeloService.getFilterString(value, filter);
    }

    if (filter.startsWith('default=')) {
      return value === '' ? filter.substring('default='.length) : value;
    }

    if (filter.startsWith('?')) {
      const [expected, truthy, falsy] = filter.substring(1).split('|');
      return value === expected ? truthy : falsy;
    }

    if (filter === 'format=base64') {
      return Buffer.from(value, 'utf8').toString('base64');
    }

    return value;
  }

  getAttributeWithPath(root, path) {
    if (this.pomeloService && typeof this.pomeloService.getAttributeWithPath === 'function') {
      return this.pomeloService.getAttributeWithPath(root, path);
    }
    return getAttributeWithPath(root, path);
  }
}

module.exports = {
  FormulaService,
};
