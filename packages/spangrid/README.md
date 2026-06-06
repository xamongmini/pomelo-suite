# SpanGrid JavaScript v0.1.1

SpanGrid is a vanilla JavaScript and HTML Canvas grid control for web applications. It has no build step or runtime dependency and can be loaded directly with a `<script>` tag.

## Included npm Files

- `src/span-grid.js` - SpanGrid 0.1.1 library
- `README.md`
- `LICENSE`

## Installation

```powershell
npm install @pomelo-suite/spangrid
```

## Features

- Row, column, and cell model with merged cells and fixed rows/columns
- Canvas rendering, zoom, pixel scrolling, and cell snapping scroll mode
- Cell, row, column, and grid property editing
- Cell, row, column, and grid border color, direction, line style, and width
- Double-click cell editing, Enter/Tab/arrow-key navigation
- TSV copy/paste with truncate or auto-expand overflow handling
- Viewport-focused rendering for visible cells
- Per-cell `mode: "default" | "html"` rendering
- `readonly` render-only view option
- `toJSON()` / `fromJSON()` persistence
- View `destroy()` cleanup for event listeners and editor DOM

## Quick Start

```html
<canvas id="grid" style="width: 900px; height: 480px"></canvas>
<script src="./src/span-grid.js"></script>
<script>
  const { SpanGridControl, SpanGridCanvasView, SpanGridCol, SpanGridRow } = SpanGrid;

  const grid = new SpanGridControl({ width: 900, height: 480 });
  grid.addCol(new SpanGridCol({ width: 120 }));
  grid.addCol(new SpanGridCol({ width: 160 }));
  grid.addRow(new SpanGridRow({ height: 32 }));
  grid.addRow(new SpanGridRow({ height: 32 }));
  grid.setData([
    ["Name", "Status"],
    ["SpanGrid", "Ready"],
  ]);

  const view = new SpanGridCanvasView(document.getElementById("grid"), grid);
  grid.selectCell(0, 0);
  view.draw();
</script>
```

## Examples

Open `examples/spangrid/index.html` from the repository root in a browser. It is static HTML and does not require a server.

Use `examples/spangrid/showcase.html` to review richer presets and HTML cell rendering. These HTML files are repository examples and are not included in the npm package.

## Repository Docs

Detailed API and usage documents are kept in the repository under `docs/spangrid`. They are intentionally separate from the npm package payload.

## Tests

```powershell
npm test --workspace @pomelo-suite/spangrid
node --check packages/spangrid/src/span-grid.js
```

## Compatibility Notes

The library is distributed as UMD. Browser users can access `window.SpanGrid`, and Node users can `require("@pomelo-suite/spangrid")`. The `backgroundImageUrl` property is persisted, but the actual `Image` object must be reloaded by the runtime environment. The `index.html` example reconnects URL images after JSON restore.

Cells with `mode: "html"` render `cell.text` as HTML. SpanGrid applies a basic safety filter for risky tags, event attributes, unsafe URLs, and unsafe CSS, but this filter is not a security boundary. Apply an application-level sanitizer such as DOMPurify before displaying untrusted external HTML.
