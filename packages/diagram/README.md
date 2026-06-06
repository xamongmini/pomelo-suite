# @pomelo-suite/diagram

Experimental diagram data and canvas rendering utilities for Pomelo Suite.

## Install

```sh
npm install @pomelo-suite/diagram
```

## Usage

```js
const {
  createDiagramData,
  exportDiagramData,
  importDiagramData,
  renderDiagramToCanvas,
} = require('@pomelo-suite/diagram');

const diagram = createDiagramData({
  nodes: [
    { id: 'start', type: 'ellipse', x: 40, y: 40, text: 'Start' },
    { id: 'task', x: 220, y: 40, text: 'Task' },
  ],
  links: [{ from: 'start', to: 'task', label: 'next' }],
});

const json = exportDiagramData(diagram);
const imported = importDiagramData(json);
renderDiagramToCanvas(canvas, imported);
```

## Runtime

This package provides a small CommonJS/browser-compatible renderer. The editor UI lives in the repository examples and is not part of the npm package payload.

Browser examples can load `src/diagram-renderer.js` directly. It exposes `window.PomeloDiagram`.

## Stability

Experimental.

## License

MIT.
