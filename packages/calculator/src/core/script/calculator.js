'use strict';

const { evaluateExpression } = require('../formula/expression-evaluator');
const { DataTypeCheck } = require('./data-type-check');
const { ExQueue } = require('./ex-queue');

const ParseState = Object.freeze({
  Parse_State_Operand: 'Parse_State_Operand',
  Parse_State_Operator: 'Parse_State_Operator',
  Parse_State_Quote: 'Parse_State_Quote',
  Parse_State_OperandFunction: 'Parse_State_OperandFunction',
  Parse_State_Comment: 'Parse_State_Comment',
});

const IIFShortCircuitState = Object.freeze({
  ShortCircuit_Condition: 'ShortCircuit_Condition',
  ShortCircuit_True: 'ShortCircuit_True',
  ShortCircuit_False: 'ShortCircuit_False',
});

const TokenType = Object.freeze({
  Token_Operand: 'Token_Operand',
  Token_Operand_Function_Start: 'Token_Operand_Function_Start',
  Token_Open_Parenthesis: 'Token_Open_Parenthesis',
  Token_Close_Parenthesis: 'Token_Close_Parenthesis',
  Token_Operand_Function_Stop: 'Token_Operand_Function_Stop',
  Token_Operand_Function_Delimiter: 'Token_Operand_Function_Delimiter',
  Token_Operator: 'Token_Operator',
  Token_Assignemt_Start: 'Token_Assignemt_Start',
  Token_Assignment_Stop: 'Token_Assignment_Stop',
});

const TokenDataType = Object.freeze({
  Token_DataType_None: 'Token_DataType_None',
  Token_DataType_Variable: 'Token_DataType_Variable',
  Token_DataType_Int: 'Token_DataType_Int',
  Token_DataType_Date: 'Token_DataType_Date',
  Token_DataType_Double: 'Token_DataType_Double',
  Token_DataType_String: 'Token_DataType_String',
  Token_DataType_Boolean: 'Token_DataType_Boolean',
  Token_DataType_NULL: 'Token_DataType_NULL',
});

function isOperatorText(value) {
  return DataTypeCheck.isOperator(value) || ['==', '!='].includes(String(value).trim());
}

function getPrecedence(value) {
  switch (String(value).trim().toLowerCase()) {
    case '^':
      return 1;
    case '*':
    case '/':
    case '%':
      return 2;
    case '+':
    case '-':
      return 3;
    case '<':
    case '<=':
    case '>':
    case '>=':
    case '<>':
    case '!=':
    case '==':
    case '=':
      return 4;
    case 'and':
      return 5;
    case 'or':
      return 6;
    case ':=':
      return 7;
    default:
      return 1000;
  }
}

function classifyDataType(value) {
  const text = String(value);
  if (DataTypeCheck.isInteger(text)) {
    return TokenDataType.Token_DataType_Int;
  }
  if (DataTypeCheck.isDouble(text)) {
    return TokenDataType.Token_DataType_Double;
  }
  if (DataTypeCheck.isDate(text)) {
    return TokenDataType.Token_DataType_Date;
  }
  if (DataTypeCheck.isBoolean(text)) {
    return TokenDataType.Token_DataType_Boolean;
  }
  if (DataTypeCheck.isNull(text)) {
    return TokenDataType.Token_DataType_NULL;
  }
  if (DataTypeCheck.isText(text)) {
    return TokenDataType.Token_DataType_String;
  }
  return TokenDataType.Token_DataType_Variable;
}

function valueForExpression(value) {
  if (value == null) {
    return '';
  }
  if (value instanceof TokenItem) {
    return value.TokenName;
  }
  return String(value);
}

function queueToExpression(queue) {
  if (!queue) {
    return '';
  }
  return [...queue].map(valueForExpression).join(' ').trim();
}

class TokenItem {
  constructor(...args) {
    let tokenName;
    let tokenType;
    let tokenDataType = TokenDataType.Token_DataType_None;
    let inOperandFunction = false;
    let position = -1;

    if (typeof args[0] === 'number') {
      const lastPosition = args[0];
      tokenName = args[1];
      tokenType = args[2];
      if (args.length === 5) {
        tokenDataType = args[3];
        inOperandFunction = Boolean(args[4]);
      } else {
        inOperandFunction = Boolean(args[3]);
      }
      position = lastPosition - String(tokenName ?? '').length;
    } else {
      tokenName = args[0];
      tokenType = args[1];
      if (args.length === 4) {
        tokenDataType = args[2];
        inOperandFunction = Boolean(args[3]);
      } else {
        inOperandFunction = Boolean(args[2]);
      }
    }

    this.tokenName = tokenName ?? '';
    this.tokenType = tokenType ?? TokenType.Token_Operand;
    this.tokenDataType = tokenDataType ?? TokenDataType.Token_DataType_None;
    this.inOperandFunction = inOperandFunction;
    this.position = position;
    this.willBeAssigned = false;
    this.canShortCircuit = String(this.tokenName).toLowerCase() === 'iif[';
    this.shortCircuit = null;
    this.parent = null;
  }

  get value() {
    return this.tokenName;
  }

  set value(value) {
    this.tokenName = value ?? '';
  }

  get Value() {
    return this.value;
  }

  set Value(value) {
    this.value = value;
  }

  get TokenName() {
    return this.tokenName;
  }

  get TokenType() {
    return this.tokenType;
  }

  get TokenDataType() {
    return this.tokenDataType;
  }

  get InOperandFunction() {
    return this.inOperandFunction;
  }

  set InOperandFunction(value) {
    this.inOperandFunction = Boolean(value);
  }

  get Position() {
    return this.position;
  }

  get Length() {
    return String(this.tokenName ?? '').length;
  }

  get WillBeAssigned() {
    return this.willBeAssigned;
  }

  set WillBeAssigned(value) {
    this.willBeAssigned = Boolean(value);
  }

  get CanShortCircuit() {
    return this.canShortCircuit;
  }

  set CanShortCircuit(value) {
    this.canShortCircuit = Boolean(value);
  }

  get ShortCircuit() {
    if (!this.shortCircuit) {
      this.shortCircuit = new IIFShortCircuit(this);
    }
    return this.shortCircuit;
  }

  get Parent() {
    return this.parent;
  }

  get TokenName_Int() {
    const parsed = Number.parseInt(this.tokenName, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  get TokenName_Boolean() {
    return String(this.tokenName ?? '').trim().toLowerCase() === 'true';
  }

  get TokenName_Double() {
    const parsed = Number.parseFloat(this.tokenName);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  get TokenName_DateTime() {
    const date = new Date(this.tokenName);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  get OrderOfOperationPrecedence() {
    return getPrecedence(this.tokenName);
  }

  toString() {
    return String(this.tokenName);
  }
}

class TokenItems {
  constructor(parent = null) {
    this.parent = parent;
    this.items = [];
  }

  get Parent() {
    return this.parent;
  }

  get Count() {
    return this.items.length;
  }

  get count() {
    return this.Count;
  }

  add(item) {
    this.items.push(item);
    item.parent = this;
  }

  Add(item) {
    this.add(item);
  }

  addToFront(item) {
    this.items.unshift(item);
    item.parent = this;
  }

  AddToFront(item) {
    this.addToFront(item);
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

class Variable {
  constructor(name = '', value = '') {
    this.variableName = String(name);
    this.variableValue = value ?? '';
    this.tokenItems = [];
  }

  get name() {
    return this.variableName;
  }

  set name(value) {
    this.variableName = String(value);
  }

  get value() {
    return this.variableValue;
  }

  set value(value) {
    this.variableValue = value ?? '';
  }

  get Name() {
    return this.variableName;
  }

  set Name(value) {
    this.variableName = String(value);
  }

  get Value() {
    return this.variableValue;
  }

  set Value(value) {
    this.variableValue = value ?? '';
  }

  get VariableName() {
    return this.variableName;
  }

  get VariableValue() {
    return this.variableValue;
  }

  set VariableValue(value) {
    this.variableValue = value ?? '';
  }

  get CollectionKey() {
    return this.variableName.trim().toLowerCase();
  }

  get TokenItems() {
    return this.tokenItems;
  }

  clone() {
    return new Variable(this.variableName, this.variableValue);
  }

  Clone() {
    return this.clone();
  }
}

class Variables {
  constructor(values = {}) {
    this.items = new Map();
    for (const [key, value] of Object.entries(values)) {
      this.add(key).VariableValue = value;
    }
  }

  get Count() {
    return this.items.size;
  }

  get count() {
    return this.Count;
  }

  add(name) {
    const trimmed = String(name).trim();
    const key = trimmed.toLowerCase();
    if (this.items.has(key)) {
      return this.items.get(key);
    }
    const variable = new Variable(trimmed);
    this.items.set(key, variable);
    return variable;
  }

  Add(name) {
    return this.add(name);
  }

  set(name, value) {
    this.add(name).VariableValue = value;
  }

  Set(name, value) {
    this.set(name, value);
  }

  variableExists(name) {
    return this.items.has(String(name).trim().toLowerCase());
  }

  VariableExists(name) {
    return this.variableExists(name);
  }

  clear() {
    this.items.clear();
  }

  Clear() {
    this.clear();
  }

  get(nameOrIndex) {
    if (typeof nameOrIndex === 'number') {
      return Array.from(this.items.keys()).sort().map((key) => this.items.get(key))[nameOrIndex];
    }
    return this.items.get(String(nameOrIndex).trim().toLowerCase());
  }

  Get(nameOrIndex) {
    return this.get(nameOrIndex);
  }

  toObject() {
    const output = {};
    for (const variable of this) {
      output[variable.VariableName] = variable.VariableValue;
    }
    return output;
  }

  [Symbol.iterator]() {
    return Array.from(this.items.keys()).sort().map((key) => this.items.get(key))[Symbol.iterator]();
  }
}

class Tokens {
  constructor(group = null) {
    this.items = [];
    this.tokenGroup = group;
  }

  get Count() {
    return this.items.length;
  }

  get count() {
    return this.Count;
  }

  add(token) {
    this.items.push(token);
    token.TokenGroup = this.tokenGroup;
    this.tokenGroup?.UpdateVariables(token);
    return true;
  }

  Add(token) {
    return this.add(token);
  }

  clear() {
    this.items.length = 0;
  }

  Clear() {
    this.clear();
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

class TokenGroup {
  constructor() {
    this.tokens = new Tokens(this);
    this.variables = new Variables();
  }

  get Tokens() {
    return this.tokens;
  }

  get Variables() {
    return this.variables;
  }

  updateVariables(token) {
    for (const variable of token.Variables) {
      if (!this.variables.VariableExists(variable.VariableName)) {
        this.variables.Add(variable.VariableName);
      }
    }
  }

  UpdateVariables(token) {
    this.updateVariables(token);
  }

  evaluateGroup() {
    let anyFailures = false;

    for (const token of this.tokens) {
      for (const variable of token.Variables) {
        if (this.variables.VariableExists(variable.VariableName)) {
          variable.VariableValue = this.variables.get(variable.VariableName).VariableValue;
        }
      }

      try {
        token.LastErrorMessage = '';
        new Calculator(token).Calculate();
      } catch (error) {
        token.LastErrorMessage = error.message;
        anyFailures = true;
      }
    }

    return anyFailures;
  }

  EvaluateGroup() {
    return this.evaluateGroup();
  }
}

function scanExpression(expression) {
  const tokens = [];
  const input = String(expression ?? '');
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (char === '"') {
      let value = '"';
      index += 1;
      while (index < input.length) {
        const current = input[index];
        value += current;
        index += 1;
        if (current === '\\' && index < input.length) {
          value += input[index];
          index += 1;
          continue;
        }
        if (current === '"') {
          break;
        }
      }
      tokens.push({ text: value, kind: 'operand' });
      continue;
    }

    const twoChar = input.slice(index, index + 2);
    if (['<=', '>=', '<>', '!=', '==', ':='].includes(twoChar)) {
      tokens.push({ text: twoChar, kind: 'operator' });
      index += 2;
      continue;
    }

    if ('+-*/%^=<>()[],' .includes(char)) {
      let kind = 'operator';
      if (char === '(') {
        kind = 'open';
      } else if (char === ')') {
        kind = 'close';
      } else if (char === '[') {
        kind = 'functionStart';
      } else if (char === ']') {
        kind = 'functionStop';
      } else if (char === ',') {
        kind = 'delimiter';
      }
      tokens.push({ text: char, kind });
      index += 1;
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

    const lower = value.toLowerCase();
    if (lower === 'and' || lower === 'or') {
      tokens.push({ text: lower, kind: 'operator' });
    } else {
      tokens.push({ text: value, kind: 'operand' });
    }
  }

  return tokens;
}

function makeTokenItem(raw, nextRaw = null, position = -1) {
  if (raw.kind === 'functionStart') {
    return null;
  }

  if (raw.kind === 'operand' && nextRaw?.kind === 'functionStart' && DataTypeCheck.isOperandFunction(raw.text)) {
    const item = new TokenItem(position + raw.text.length + 1, `${raw.text}[`, TokenType.Token_Operand_Function_Start, false);
    item.CanShortCircuit = raw.text.toLowerCase() === 'iif' || raw.text.toLowerCase() === 'if';
    return item;
  }

  switch (raw.kind) {
    case 'operand': {
      const dataType = classifyDataType(raw.text);
      return new TokenItem(position + raw.text.length, raw.text, TokenType.Token_Operand, dataType, false);
    }
    case 'operator':
      return new TokenItem(position + raw.text.length, raw.text, raw.text === ':=' ? TokenType.Token_Assignemt_Start : TokenType.Token_Operator, false);
    case 'open':
      return new TokenItem(position + 1, raw.text, TokenType.Token_Open_Parenthesis, false);
    case 'close':
      return new TokenItem(position + 1, raw.text, TokenType.Token_Close_Parenthesis, false);
    case 'functionStop':
      return new TokenItem(position + 1, raw.text, TokenType.Token_Operand_Function_Stop, false);
    case 'delimiter':
      return new TokenItem(position + 1, raw.text, TokenType.Token_Operand_Function_Delimiter, false);
    default:
      return new TokenItem(position + raw.text.length, raw.text, TokenType.Token_Operand, false);
  }
}

function addVariablesFromItems(token) {
  for (const item of token.TokenItems) {
    if (item.TokenType !== TokenType.Token_Operand) {
      continue;
    }
    if (item.TokenDataType !== TokenDataType.Token_DataType_Variable) {
      continue;
    }
    if (DataTypeCheck.isReservedWord(item.TokenName) || DataTypeCheck.isOperandFunction(item.TokenName)) {
      continue;
    }
    token.Variables.Add(item.TokenName);
  }
}

class Token {
  constructor(ruleSyntax = '') {
    this.tokenItems = new TokenItems(this);
    this.variables = new Variables();
    this.rpnQueue = new ExQueue();
    this.ruleSyntax = String(ruleSyntax ?? '').trim();
    this.lastErrorMessage = '';
    this.tokenParseTime = 0;
    this.lastEvaluationTime = 0;
    this.charIndex = 0;
    this.lineIndexes = [];
    this.lastEvaluationResult = '';
    this.tokenGroup = null;
    this.anyAssignments = false;
    this.parse();
  }

  get value() {
    return this.ruleSyntax;
  }

  get Value() {
    return this.value;
  }

  get RuleSyntax() {
    return this.ruleSyntax;
  }

  get LastErrorMessage() {
    return this.lastErrorMessage;
  }

  set LastErrorMessage(value) {
    this.lastErrorMessage = value ?? '';
  }

  get AnyErrors() {
    return this.lastErrorMessage !== '';
  }

  get TokenItems() {
    return this.tokenItems;
  }

  get RPNQueue() {
    return this.rpnQueue;
  }

  get TokenParseTime() {
    return this.tokenParseTime;
  }

  get Variables() {
    return this.variables;
  }

  get CharIndex() {
    return this.charIndex;
  }

  get LineIndexes() {
    return this.lineIndexes;
  }

  get LastEvaluationResult() {
    return this.lastEvaluationResult;
  }

  set LastEvaluationResult(value) {
    this.lastEvaluationResult = value ?? '';
  }

  get LastEvaluationTime() {
    return this.lastEvaluationTime;
  }

  set LastEvaluationTime(value) {
    this.lastEvaluationTime = Number(value) || 0;
  }

  get TokenGroup() {
    return this.tokenGroup;
  }

  set TokenGroup(value) {
    this.tokenGroup = value;
  }

  get AnyAssignments() {
    return this.anyAssignments;
  }

  parse() {
    const started = performance.now();
    this.tokenItems = new TokenItems(this);
    this.variables = new Variables();
    this.rpnQueue = new ExQueue();
    this.lineIndexes = [];

    for (let index = 0; index < this.ruleSyntax.length; index += 1) {
      if (this.ruleSyntax[index] === '\n') {
        this.lineIndexes.push(index + 1);
      }
    }

    const rawTokens = scanExpression(this.ruleSyntax);
    let searchStart = 0;
    for (let index = 0; index < rawTokens.length; index += 1) {
      const raw = rawTokens[index];
      const position = this.ruleSyntax.indexOf(raw.text, searchStart);
      searchStart = position === -1 ? searchStart : position + raw.text.length;
      const item = makeTokenItem(raw, rawTokens[index + 1], position === -1 ? this.ruleSyntax.length : position);
      if (!item) {
        continue;
      }
      if (item.TokenName === ':=') {
        this.anyAssignments = true;
      }
      this.tokenItems.Add(item);
      this.rpnQueue.Enqueue(item);
    }

    addVariablesFromItems(this);
    this.charIndex = this.ruleSyntax.length;
    this.tokenParseTime = performance.now() - started;
  }

  evaluate(variables = undefined) {
    return new Calculator(this).Calculate(undefined, variables);
  }

  Evaluate(variables = undefined) {
    return this.evaluate(variables);
  }

  save() {
    return `${this.ruleSyntax}\n\n;Variables;\n${[...this.variables].map((variable) => `${variable.VariableName}=${variable.VariableValue}`).join('\n')}`;
  }

  Save() {
    return this.save();
  }
}

function variablesToObject(variables) {
  if (variables instanceof Variables) {
    return variables.toObject();
  }
  if (variables && typeof variables === 'object') {
    return variables;
  }
  return {};
}

function tokenVariablesToObject(token) {
  const output = {};
  for (const variable of token.Variables) {
    output[variable.VariableName] = variable.VariableValue;
  }
  return output;
}

class Calculator {
  constructor(input = null, options = {}) {
    if (input instanceof Token) {
      this.token = input;
      this.options = options;
    } else {
      this.token = null;
      this.options = input && typeof input === 'object' && !Array.isArray(input) ? input : options;
    }
  }

  calculate(expression = undefined, variables = undefined) {
    let actualExpression = expression;
    let actualVariables = variables;

    if (actualExpression instanceof ExQueue) {
      actualExpression = queueToExpression(actualExpression);
    } else if (actualExpression instanceof Token) {
      this.token = actualExpression;
      actualExpression = actualExpression.RuleSyntax;
    } else if (actualExpression == null && this.token) {
      actualExpression = this.token.RuleSyntax;
      actualVariables = actualVariables ?? tokenVariablesToObject(this.token);
    } else if (actualExpression == null) {
      actualExpression = '';
    }

    if (actualVariables instanceof Variables) {
      actualVariables = actualVariables.toObject();
    }

    const started = performance.now();
    const result = evaluateExpression(actualExpression, {
      ...this.options,
      variables: actualVariables ?? variablesToObject(this.options.variables),
    });

    if (this.token) {
      this.token.LastEvaluationResult = result;
      this.token.LastEvaluationTime = performance.now() - started;
    }

    return result;
  }

  Calculate(expression = undefined, variables = undefined) {
    return this.calculate(expression, variables);
  }
}

class IIFShortCircuit {
  constructor(parent) {
    this.parent = parent;
    this.rpnCondition = new ExQueue();
    this.rpnTrue = new ExQueue();
    this.rpnFalse = new ExQueue();
  }

  get Parent() {
    return this.parent;
  }

  get RPNCondition() {
    return this.rpnCondition;
  }

  set RPNCondition(value) {
    this.rpnCondition = value;
  }

  get RPNTrue() {
    return this.rpnTrue;
  }

  set RPNTrue(value) {
    this.rpnTrue = value;
  }

  get RPNFalse() {
    return this.rpnFalse;
  }

  set RPNFalse(value) {
    this.rpnFalse = value;
  }

  evaluate() {
    const calculator = new Calculator();
    const condition = calculator.Calculate(this.rpnCondition);
    const selected = String(condition).trim().toLowerCase() === 'true' ? this.rpnTrue : this.rpnFalse;
    const result = calculator.Calculate(selected);
    const tokenName = result.startsWith('"') && result.endsWith('"') ? JSON.parse(result) : result;
    return new TokenItem(tokenName, TokenType.Token_Operand, TokenDataType.Token_DataType_String, false);
  }

  Evaluate() {
    return this.evaluate();
  }
}

module.exports = {
  Calculator,
  IIFShortCircuit,
  IIFShortCircuitState,
  ParseState,
  Token,
  TokenDataType,
  TokenGroup,
  TokenItem,
  TokenItems,
  TokenType,
  Tokens,
  Variable,
  Variables,
};
