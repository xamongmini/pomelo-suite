# @pomelo-suite/color-picker

Canvas HSV color picker for Pomelo Suite.

## Install

```bash
npm install @pomelo-suite/color-picker
```

## Usage

```js
const { ColorPicker } = require('@pomelo-suite/color-picker');

const picker = new ColorPicker(document.getElementById('colorCanvas'));
picker.onColorChanged = (color) => {
  console.log(color.hex);
};
```

## Runtime

Browser-first canvas component. CommonJS export is provided for tests and bundlers.

## License

MIT
