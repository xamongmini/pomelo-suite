'use strict';

const { DataTypeCheck } = require('../script/data-type-check');

function isNumeric(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }
  return typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value));
}

function toNumber(value) {
  return Number(value.value);
}

function toStringValue(value) {
  if (value.value == null) {
    return '';
  }
  return String(value.value);
}

function toBoolean(value) {
  if (typeof value.value === 'boolean') {
    return value.value;
  }
  if (isNumeric(value.value)) {
    return Number(value.value) !== 0;
  }
  const text = String(value.value).toLowerCase();
  return text === 'true' || text === 'yes' || text === 'y' || text === 't';
}

function inferValue(raw) {
  if (raw && typeof raw === 'object' && Object.prototype.hasOwnProperty.call(raw, 'type')) {
    return raw;
  }
  if (typeof raw === 'boolean') {
    return { type: 'boolean', value: raw };
  }
  if (typeof raw === 'number') {
    return { type: 'number', value: raw };
  }
  if (raw == null) {
    return { type: 'string', value: '' };
  }
  const text = String(raw);
  if (/^(true|false)$/i.test(text)) {
    return { type: 'boolean', value: text.toLowerCase() === 'true' };
  }
  if (isNumeric(text)) {
    return { type: 'number', value: Number(text) };
  }
  return { type: 'string', value: text };
}

function formatValue(value) {
  if (value.type === 'string') {
    return JSON.stringify(String(value.value));
  }
  if (value.type === 'boolean') {
    return value.value ? 'true' : 'false';
  }
  if (value.type === 'number') {
    return Number.isInteger(value.value) ? String(value.value) : String(Number(value.value));
  }
  return String(value.value ?? '');
}

function tokenize(expression) {
  const tokens = [];
  const input = String(expression);
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '"') {
      let value = '';
      index += 1;
      while (index < input.length) {
        const current = input[index];
        if (current === '\\' && index + 1 < input.length) {
          value += input[index + 1];
          index += 2;
          continue;
        }
        if (current === '"') {
          index += 1;
          break;
        }
        value += current;
        index += 1;
      }
      tokens.push({ type: 'string', value });
      continue;
    }

    const twoChar = input.slice(index, index + 2);
    if (['<=', '>=', '!=', '<>', '==', ':='].includes(twoChar)) {
      tokens.push({ type: 'operator', value: twoChar });
      index += 2;
      continue;
    }

    if ('+-*/%^=<>()[],' .includes(char)) {
      const type = '+-*/%^=<>'.includes(char) ? 'operator' : 'punctuation';
      tokens.push({ type, value: char });
      index += 1;
      continue;
    }

    if (/\d/.test(char) || (char === '.' && /\d/.test(input[index + 1]))) {
      let value = char;
      index += 1;
      while (index < input.length && /[\d.]/.test(input[index])) {
        value += input[index];
        index += 1;
      }
      tokens.push({ type: 'number', value: Number(value) });
      continue;
    }

    let value = '';
    while (
      index < input.length &&
      !/\s/.test(input[index]) &&
      !'+-*/%^=<>()[],' .includes(input[index])
    ) {
      value += input[index];
      index += 1;
    }
    if (/^(and|or)$/i.test(value)) {
      tokens.push({ type: 'operator', value: value.toLowerCase() });
    } else {
      tokens.push({ type: 'identifier', value });
    }
  }

  return tokens;
}

const PRECEDENCE = new Map([
  [':=', 0],
  ['or', 1],
  ['and', 2],
  ['=', 3],
  ['==', 3],
  ['!=', 3],
  ['<>', 3],
  ['<', 3],
  ['>', 3],
  ['<=', 3],
  ['>=', 3],
  ['+', 4],
  ['-', 4],
  ['*', 5],
  ['/', 5],
  ['%', 5],
  ['^', 6],
]);

class ExpressionParser {
  constructor(expression, options = {}) {
    this.tokens = tokenize(expression);
    this.index = 0;
    this.variables = options.variables ?? {};
    this.resolveVariable = options.resolveVariable;
  }

  parse() {
    const value = this.parseExpression(0);
    if (this.peek()) {
      throw new SyntaxError(`Unexpected token '${this.peek().value}'`);
    }
    return value;
  }

  peek(offset = 0) {
    return this.tokens[this.index + offset] ?? null;
  }

  consume(expectedValue) {
    const token = this.peek();
    if (!token || (expectedValue !== undefined && token.value !== expectedValue)) {
      throw new SyntaxError(`Expected '${expectedValue}'`);
    }
    this.index += 1;
    return token;
  }

  parseExpression(minPrecedence) {
    let left = this.parsePrimary();

    while (this.peek() && this.peek().type === 'operator') {
      const operator = this.peek().value;
      const precedence = PRECEDENCE.get(operator);
      if (precedence === undefined || precedence < minPrecedence) {
        break;
      }

      this.consume();
      const right = this.parseExpression(precedence + 1);
      left = applyOperator(operator, left, right);
    }

    return left;
  }

  parsePrimary() {
    const token = this.consume();

    if (token.type === 'number') {
      return { type: 'number', value: token.value };
    }

    if (token.type === 'string') {
      return { type: 'string', value: token.value };
    }

    if (token.value === '(') {
      const value = this.parseExpression(0);
      this.consume(')');
      return value;
    }

    if (token.value === '-') {
      const value = this.parsePrimary();
      return { type: 'number', value: -toNumber(value) };
    }

    if (token.type === 'identifier') {
      if (this.peek() && this.peek().value === '[') {
        return this.parseFunction(token.value);
      }

      if (/^(true|false)$/i.test(token.value)) {
        return { type: 'boolean', value: token.value.toLowerCase() === 'true' };
      }

      return this.resolveIdentifier(token.value);
    }

    throw new SyntaxError(`Unexpected token '${token.value}'`);
  }

  parseFunction(name) {
    this.consume('[');
    const args = [];

    if (this.peek() && this.peek().value !== ']') {
      while (true) {
        args.push(this.parseExpression(0));
        if (!this.peek() || this.peek().value !== ',') {
          break;
        }
        this.consume(',');
      }
    }

    this.consume(']');
    return applyFunction(name, args, this);
  }

  resolveIdentifier(name) {
    let value;
    if (typeof this.resolveVariable === 'function') {
      value = this.resolveVariable(name);
    } else {
      value = this.variables[name];
    }
    return inferValue(value);
  }
}

function compareValues(left, right) {
  if (isNumeric(left.value) && isNumeric(right.value)) {
    const leftNumber = Number(left.value);
    const rightNumber = Number(right.value);
    return leftNumber === rightNumber ? 0 : (leftNumber > rightNumber ? 1 : -1);
  }

  return String(left.value).localeCompare(String(right.value));
}

function parseDateValue(value) {
  const text = toStringValue(value);
  const dateOnly = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (dateOnly) {
    return new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])));
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date) {
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function formatDateTime(date) {
  return `${formatDate(date)} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
}

function addDatePart(date, part, amount) {
  const output = new Date(date.getTime());
  switch (String(part).toLowerCase()) {
    case 'year':
    case 'yyyy':
    case 'yy':
      output.setUTCFullYear(output.getUTCFullYear() + amount);
      break;
    case 'month':
    case 'mm':
    case 'm':
      output.setUTCMonth(output.getUTCMonth() + amount);
      break;
    case 'hour':
    case 'hh':
      output.setUTCHours(output.getUTCHours() + amount);
      break;
    case 'minute':
    case 'mi':
    case 'n':
      output.setUTCMinutes(output.getUTCMinutes() + amount);
      break;
    case 'second':
    case 'ss':
    case 's':
      output.setUTCSeconds(output.getUTCSeconds() + amount);
      break;
    case 'day':
    case 'dd':
    case 'd':
    default:
      output.setUTCDate(output.getUTCDate() + amount);
      break;
  }
  return output;
}

function properCase(text) {
  return String(text).toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function padText(text, length, pad, direction) {
  const padValue = pad === '' ? ' ' : pad;
  let output = String(text);
  while (output.length < length) {
    output = direction === 'left' ? `${padValue}${output}` : `${output}${padValue}`;
  }
  return direction === 'left' ? output.slice(-length) : output.slice(0, length);
}

function isNullOrEmpty(value) {
  return value == null || value.value == null || String(value.value) === '';
}

function applyOperator(operator, left, right) {
  switch (operator) {
    case '+':
      return { type: 'number', value: toNumber(left) + toNumber(right) };
    case '-':
      return { type: 'number', value: toNumber(left) - toNumber(right) };
    case '*':
      return { type: 'number', value: toNumber(left) * toNumber(right) };
    case '/':
      return { type: 'number', value: toNumber(left) / toNumber(right) };
    case '%':
      return { type: 'number', value: toNumber(left) % toNumber(right) };
    case '^':
      return { type: 'number', value: toNumber(left) ** toNumber(right) };
    case 'and':
      return { type: 'boolean', value: toBoolean(left) && toBoolean(right) };
    case 'or':
      return { type: 'boolean', value: toBoolean(left) || toBoolean(right) };
    case ':=':
      return right;
    case '=':
    case '==':
      return { type: 'boolean', value: compareValues(left, right) === 0 };
    case '!=':
    case '<>':
      return { type: 'boolean', value: compareValues(left, right) !== 0 };
    case '<':
      return { type: 'boolean', value: compareValues(left, right) < 0 };
    case '>':
      return { type: 'boolean', value: compareValues(left, right) > 0 };
    case '<=':
      return { type: 'boolean', value: compareValues(left, right) <= 0 };
    case '>=':
      return { type: 'boolean', value: compareValues(left, right) >= 0 };
    default:
      throw new SyntaxError(`Unsupported operator '${operator}'`);
  }
}

function applyFunction(rawName, args, context = null) {
  const name = rawName.toLowerCase();

  switch (name) {
    case 'if':
    case 'iif':
      return toBoolean(args[0]) ? args[1] : args[2];
    case 'concat':
      return { type: 'string', value: args.map(toStringValue).join('') };
    case 'join': {
      const separator = toStringValue(args[0]);
      return { type: 'string', value: args.slice(1).map(toStringValue).join(separator) };
    }
    case 'len':
    case 'length':
      return { type: 'number', value: toStringValue(args[0]).length };
    case 'trim':
      return { type: 'string', value: toStringValue(args[0]).trim() };
    case 'ltrim':
      return { type: 'string', value: toStringValue(args[0]).trimStart() };
    case 'rtrim':
      return { type: 'string', value: toStringValue(args[0]).trimEnd() };
    case 'ucase':
      return { type: 'string', value: toStringValue(args[0]).toUpperCase() };
    case 'lcase':
      return { type: 'string', value: toStringValue(args[0]).toLowerCase() };
    case 'pcase':
      return { type: 'string', value: properCase(toStringValue(args[0])) };
    case 'left':
      return { type: 'string', value: toStringValue(args[0]).slice(0, Number(args[1].value)) };
    case 'right': {
      const text = toStringValue(args[0]);
      return { type: 'string', value: text.slice(Math.max(0, text.length - Number(args[1].value))) };
    }
    case 'mid':
    case 'substring':
      return {
        type: 'string',
        value: toStringValue(args[0]).substring(Number(args[1].value), Number(args[1].value) + Number(args[2].value)),
      };
    case 'contains': {
      const needle = toStringValue(args[0]);
      return { type: 'boolean', value: args.slice(1).some((arg) => toStringValue(arg) === needle) };
    }
    case 'indexof': {
      const needle = toStringValue(args[0]);
      return { type: 'number', value: args.slice(1).findIndex((arg) => toStringValue(arg) === needle) };
    }
    case 'between': {
      const value = Number(args[0].value);
      return { type: 'boolean', value: value >= Number(args[1].value) && value <= Number(args[2].value) };
    }
    case 'replace':
      return {
        type: 'string',
        value: toStringValue(args[0]).split(toStringValue(args[1])).join(toStringValue(args[2])),
      };
    case 'remove':
      return { type: 'string', value: toStringValue(args[0]).split(toStringValue(args[1])).join('') };
    case 'abs':
      return { type: 'number', value: Math.abs(Number(args[0].value)) };
    case 'avg':
      return { type: 'number', value: args.reduce((sum, arg) => sum + Number(arg.value), 0) / args.length };
    case 'round':
      return { type: 'number', value: Number(Number(args[0].value).toFixed(Number(args[1]?.value ?? 0))) };
    case 'sqrt':
      return { type: 'number', value: Math.sqrt(Number(args[0].value)) };
    case 'sin':
      return { type: 'number', value: Math.sin(Number(args[0].value)) };
    case 'cos':
      return { type: 'number', value: Math.cos(Number(args[0].value)) };
    case 'numericmax':
      return { type: 'number', value: Math.max(...args.map((arg) => Number(arg.value))) };
    case 'numericmin':
      return { type: 'number', value: Math.min(...args.map((arg) => Number(arg.value))) };
    case 'stringmax':
      return { type: 'string', value: args.map(toStringValue).sort().at(-1) ?? '' };
    case 'stringmin':
      return { type: 'string', value: args.map(toStringValue).sort()[0] ?? '' };
    case 'datemax': {
      const dates = args.map(parseDateValue).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
      return { type: 'string', value: dates.length === 0 ? '' : formatDate(dates.at(-1)) };
    }
    case 'datemin': {
      const dates = args.map(parseDateValue).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
      return { type: 'string', value: dates.length === 0 ? '' : formatDate(dates[0]) };
    }
    case 'not':
      return { type: 'boolean', value: !toBoolean(args[0]) };
    case 'isalldigits':
      return { type: 'boolean', value: DataTypeCheck.isAllDigits(toStringValue(args[0])) };
    case 'isnullorempty':
      return { type: 'boolean', value: isNullOrEmpty(args[0]) };
    case 'istrueornull':
      return { type: 'boolean', value: isNullOrEmpty(args[0]) || toBoolean(args[0]) };
    case 'isfalseornull':
      return { type: 'boolean', value: isNullOrEmpty(args[0]) || !toBoolean(args[0]) };
    case 'date': {
      const date = args.length === 0 ? new Date() : parseDateValue(args[0]);
      return { type: 'string', value: date ? formatDate(date) : '' };
    }
    case 'now':
      return { type: 'string', value: formatDateTime(new Date()) };
    case 'dateadd': {
      const part = toStringValue(args[0]);
      const amount = Number(args[1].value);
      const date = parseDateValue(args[2]);
      return { type: 'string', value: date ? formatDate(addDatePart(date, part, amount)) : '' };
    }
    case 'day': {
      const date = parseDateValue(args[0]);
      return { type: 'number', value: date ? date.getUTCDate() : 0 };
    }
    case 'month': {
      const date = parseDateValue(args[0]);
      return { type: 'number', value: date ? date.getUTCMonth() + 1 : 0 };
    }
    case 'year': {
      const date = parseDateValue(args[0]);
      return { type: 'number', value: date ? date.getUTCFullYear() : 0 };
    }
    case 'quote':
      return { type: 'string', value: `"${toStringValue(args[0])}"` };
    case 'rpad':
      return { type: 'string', value: padText(toStringValue(args[0]), Number(args[1].value), toStringValue(args[2] ?? { value: ' ' }), 'right') };
    case 'lpad':
      return { type: 'string', value: padText(toStringValue(args[0]), Number(args[1].value), toStringValue(args[2] ?? { value: ' ' }), 'left') };
    case 'searchstring': {
      const match = new RegExp(toStringValue(args[1])).exec(toStringValue(args[0]));
      return { type: 'string', value: match ? match[0] : '' };
    }
    case 'regexmatch':
      return { type: 'boolean', value: new RegExp(toStringValue(args[1])).test(toStringValue(args[0])) };
    case 'property':
      return context ? context.resolveIdentifier(toStringValue(args[0])) : { type: 'string', value: '' };
    case 'eval':
      return inferValue(evaluateExpression(toStringValue(args[0])));
    default:
      throw new SyntaxError(`Unsupported function '${rawName}'`);
  }
}

function evaluateExpression(expression, options = {}) {
  const parser = new ExpressionParser(expression, options);
  return formatValue(parser.parse());
}

module.exports = {
  evaluateExpression,
};
