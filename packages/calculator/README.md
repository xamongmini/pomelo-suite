# @pomelo-suite/calculator

Dependency-free expression evaluator and legacy script calculator utilities for Pomelo Suite.

## Install

```sh
npm install @pomelo-suite/calculator
```

## Usage

```js
'use strict';

const {
  Calculator,
  evaluateExpression,
} = require('@pomelo-suite/calculator');

console.log(evaluateExpression('1 + 2 * 3'));

const calculator = new Calculator();
```

## Runtime

Node.js 18 or newer.

## Safety

Expression evaluation is intended for trusted Pomelo Suite/Tumblr formula syntax. Validate or sandbox untrusted expressions before exposing them to users.

## License

MIT
