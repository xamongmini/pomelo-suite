# @pomelo-suite/input

Canvas extended input control for Pomelo Suite.

## Install

```bash
npm install @pomelo-suite/input
```

## Usage

```js
const { TextInputPro } = require('@pomelo-suite/input');

const input = new TextInputPro(document.getElementById('host'), {
  value: 10,
  min: 0,
  max: 100,
  step: 1,
});
```

## Runtime

Browser-first canvas component. CommonJS export is provided for tests and bundlers.

## Safety

Math mode evaluates trusted expressions internally. Do not pass untrusted user expressions to math mode without a separate expression sandbox.

## License

MIT
