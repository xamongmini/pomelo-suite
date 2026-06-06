'use strict';

const RESERVED_WORDS = Object.freeze([
  'int', 'long', 'float', 'decimal', 'currency', 'date', 'value', 'while', 'for',
  'do', 'break', 'continue', 'foreach', 'next', 'else', 'end', 'endif', 'string',
  'text', 'char', 'list', 'rule', 'expression', 'function', 'macro', 'express',
  'int', 'integer', 'list', 'sub', 'set', ':=',
]);

const OPERAND_FUNCTIONS = Object.freeze([
  'avg', 'abs', 'iif', 'lcase', 'left', 'len', 'mid', 'right', 'round', 'sqrt',
  'ucase', 'isnullorempty', 'istrueornull', 'isfalseornull', 'trim', 'rtrim',
  'ltrim', 'dateadd', 'concat', 'date', 'rpad', 'lpad', 'join', 'searchstring',
  'day', 'month', 'year', 'substring', 'numericmax', 'numericmin', 'datemax',
  'datemin', 'stringmax', 'stringmin', 'contains', 'between', 'indexof', 'now',
  'replace', 'eval', 'remove', 'quote', 'pcase', 'sin', 'cos', 'not',
  'isalldigits', 'params', 'param', 'property', 'effect', 'move', 'visible',
  'batch', 'custom', 'manager', 'makehome', 'if', 'call', 'transition', 'toggle',
  'alert', 'alertbutton', 'switch', 'case', 'goback', 'activity', 'start', 'stop',
  'saveparameteras', 'saveparametertodb', 'setobjectvalues', 'systemdb',
]);

const ARITH_OPERATORS = Object.freeze(['^', '*', '/', '%', '+', '-']);
const LOGICAL_OPERATORS = Object.freeze(['and', 'or']);
const COMPARISON_OPERATORS = Object.freeze(['<', '<=', '>', '>=', '<>', '=']);
const ASSIGNMENT_OPERATORS = Object.freeze([':=']);

function clean(value) {
  return value == null ? '' : String(value).trim();
}

function isAllDigits(value) {
  const text = clean(value);
  return text.length > 0 && [...text].every((char) => /\d/.test(char));
}

function decimalCount(value) {
  return [...clean(value)].filter((char) => char === '.').length;
}

function isText(value) {
  const text = clean(value);
  return text.length > 1 && text.startsWith('"') && text.endsWith('"');
}

function isInteger(value) {
  const text = clean(value);
  return text.length > 0 && /^-?\d+$/.test(text);
}

function isDate(value) {
  const text = clean(value);
  return text.length > 0 && !Number.isNaN(Date.parse(text));
}

function isDouble(value) {
  const text = clean(value);
  return text.length > 0 && /^-?(?:\d+\.?\d*|\.\d+)$/.test(text) && decimalCount(text) <= 1;
}

function isReservedWord(value) {
  return RESERVED_WORDS.includes(clean(value).toLowerCase());
}

function anyPunctuation(value) {
  const text = value == null ? '' : String(value);
  for (const char of text) {
    if (/[!"#$%&'()*+,./:;<=>?@[\\\]^_`{|}~-]/.test(char)) {
      return { found: true, mark: char };
    }
  }
  return { found: false, mark: ' ' };
}

function isOperandFunction(value) {
  return OPERAND_FUNCTIONS.includes(clean(value).toLowerCase());
}

function isOperator(value) {
  const text = clean(value).toLowerCase();
  return [
    ...ARITH_OPERATORS,
    ...LOGICAL_OPERATORS,
    ...COMPARISON_OPERATORS,
    ...ASSIGNMENT_OPERATORS,
  ].includes(text);
}

function isBoolean(value) {
  const text = clean(value).toLowerCase();
  return text === 'true' || text === 'false';
}

function removeTextQuotes(value) {
  const text = value == null ? '' : String(value);
  return isText(text) ? clean(text).slice(1, -1) : text;
}

function isNull(value) {
  return clean(value).toLowerCase() === 'null';
}

function containsOperator(value) {
  const text = clean(value);
  if (!text) {
    return { found: false, operand: '', operator: '' };
  }

  const operators = [...ARITH_OPERATORS, ...COMPARISON_OPERATORS].sort((a, b) => b.length - a.length);
  for (const operator of operators) {
    if (text.endsWith(operator)) {
      return {
        found: true,
        operand: text.slice(0, -operator.length),
        operator,
      };
    }
  }

  return { found: false, operand: '', operator: '' };
}

const DataTypeCheck = {
  ReservedWords: RESERVED_WORDS,
  OperandFunctions: OPERAND_FUNCTIONS,
  ArithOperators: ARITH_OPERATORS,
  LogicalOperators: LOGICAL_OPERATORS,
  ComparisonOperators: COMPARISON_OPERATORS,
  AssignmentOperators: ASSIGNMENT_OPERATORS,
  reservedWords: RESERVED_WORDS,
  operandFunctions: OPERAND_FUNCTIONS,
  arithOperators: ARITH_OPERATORS,
  logicalOperators: LOGICAL_OPERATORS,
  comparisonOperators: COMPARISON_OPERATORS,
  assignmentOperators: ASSIGNMENT_OPERATORS,
  isAllDigits,
  decimalCount,
  isText,
  isInteger,
  isDate,
  isDouble,
  isReservedWord,
  anyPunctuation,
  isOperandFunction,
  isOperator,
  isBoolean,
  removeTextQuotes,
  isNull,
  containsOperator,
};

Object.assign(DataTypeCheck, {
  IsAllDigits: isAllDigits,
  DecimalCount: decimalCount,
  IsText: isText,
  IsInteger: isInteger,
  IsDate: isDate,
  IsDouble: isDouble,
  IsReservedWord: isReservedWord,
  AnyPuncuation: anyPunctuation,
  AnyPunctuation: anyPunctuation,
  IsOperandFunction: isOperandFunction,
  IsOperator: isOperator,
  IsBoolean: isBoolean,
  RemoveTextQuotes: removeTextQuotes,
  IsNULL: isNull,
  IsNull: isNull,
  ContainsOperator: containsOperator,
});

module.exports = {
  DataTypeCheck,
};
