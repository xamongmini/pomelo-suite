# SpanGrid 0.1.1 API

This document describes the public API exposed by `src/span-grid.js`.

## Module

Browser:

```html
<script src="./src/span-grid.js"></script>
<script>
  const { SpanGridControl, SpanGridCanvasView, VERSION } = SpanGrid;
</script>
```

Node:

```js
const { SpanGridControl, SpanGridCanvasView, VERSION } = require("@pomelo-suite/spangrid");
```

Exports:

- `VERSION` - current version string, `0.1.1`
- `BorderDirection`
- `SpanGridBorder`
- `SpanGridCanvasView`
- `SpanGridCell`
- `SpanGridCol`
- `SpanGridControl`
- `SpanGridFixed`
- `SpanGridMerge`
- `SpanGridRow`
- `createDemoGrid()`
- `runSmokeTests()`

## BorderDirection

```js
BorderDirection.None
BorderDirection.Top
BorderDirection.Bottom
BorderDirection.Right
BorderDirection.Left
BorderDirection.All
```

`BorderDirection` is a bit flag. Combine multiple directions with OR:

```js
border.borderDirection = BorderDirection.Top | BorderDirection.Bottom;
```

## SpanGridControl

`SpanGridControl` manages grid data, layout, selection, scrolling, merges, fixed cells, and persistence.

```js
const grid = new SpanGridControl({
  width: 900,
  height: 480,
  borderStyle: "FixedSingle",
  backColor: "#ffffff",
  focusColor: "#d92d20",
  zoom: 1,
  scrollMode: "pixel",
});
```

Main options:

- `width`, `height` - render size
- `borderStyle` - `"None"`, `"FixedSingle"`, or `"Fixed3D"`
- `gridBorder` - default `SpanGridBorder`
- `backColor` - grid background color
- `focusColor` - selection highlight color
- `expand` - whether the grid area expands
- `autoScroll` - whether automatic scrolling is enabled
- `zoom` - clamped from `0.25` to `4`
- `scrollMode` - `"pixel"` or `"cell"`
- `scrollBarSize` - legacy pixel reserve used only when `reserveScrollbarInViewport === true`
- `reserveScrollbarInViewport` - when `true`, reserves in-canvas scrollbar space; the default `false` keeps the viewport at the configured width and height and expects external scrollbar controls

### Rows, Columns, and Cells

```js
grid.addCol(new SpanGridCol({ width: 120 }));
grid.addRow(new SpanGridRow({ height: 32 }));

const cell = grid.getCell(0, 0);
cell.text = "Hello";
cell.mode = "default";
cell.backColor = "#f8fafc";
```

Methods:

- `addRow(row?)`
- `addCol(col?)`
- `getCell(rowIndex, colIndex)`
- `cellIndex(cell)`
- `setRowHeight(rowOrIndex, height)`
- `setColWidth(colOrIndex, width)`
- `layout()`
- `ensureSize(rowCount, colCount)`

### Selection

```js
grid.selectCell(0, 0);
grid.selectCells([grid.getCell(0, 0), grid.getCell(0, 1)]);
grid.selectRow(1);
grid.selectCol(2);
grid.selectGrid();
```

Methods:

- `selectCell(rowOrCell, colIndex?)`
- `selectCells(cells)`
- `selectRow(rowOrIndex)`
- `selectCol(colOrIndex)`
- `selectGrid()`
- `selectBorderLine(type, index, side)`
- `selectCellsInViewRect(x1, y1, x2, y2)`
- `selectedCells`

Events:

```js
const off = grid.onSelectionChange((event) => {
  console.log(event.type, event.objects);
});

off();
```

- `onCellClick(handler)`
- `onSelectionChange(handler)`

### Merging and Fixed Cells

```js
grid.mergeCells(1, 1, 2, 3);
grid.splitSelectedCell();
grid.setFixedCell(grid.getCell(0, 0));
grid.clearFixed();
```

Methods:

- `mergeCells(row1, col1, row2, col2)`
- `mergeSelectedCells()`
- `splitCell(cell)`
- `splitSelectedCell()`
- `setFixedCell(cell)`
- `clearFixed()`

Merges cannot overlap an existing merge. `mergeCells()` throws a `RangeError` for overlapping ranges, while `fromJSON()` skips overlapping merge entries when restoring snapshots.

### Scrolling and Zoom

```js
grid.setZoomPercent(150);
grid.setScrollMode("cell");
grid.scrollBy(1, 1);
grid.ensureVisible(grid.getCell(10, 5));
```

Methods:

- `setZoom(zoom)`
- `setZoomPercent(percent)`
- `getZoomPercent()`
- `setScrollMode(mode)`
- `scrollTo(x, y)`
- `scrollBy(deltaX, deltaY)`
- `ensureVisible(cell)`

### Borders

```js
const border = new SpanGridBorder({
  color: "#0f766e",
  borderDirection: BorderDirection.All,
  lineStyle: "Dash",
  lineWidth: 2,
});

grid.getCell(0, 0).border = border;
```

Methods:

- `resolveCellBorder(cell, side)`
- `applyBorderToSelectedLine(template)`
- `applyBorderToSelectedCells(template)`
- `applyPropertiesToSelectedCells(properties)`

`side` is one of `"left"`, `"right"`, `"top"`, or `"bottom"`.

### Editing, Copy, and Paste

```js
grid.selectCell(0, 0);
grid.pasteTsv("A\tB\nC\tD", { overflow: "expand" });
const text = grid.copySelectionToTsv();
```

Methods:

- `nextCellFrom(cell, action)`
- `selectNextCell(action)`
- `copySelectionToTsv(cells?)`
- `pasteTsv(text, { overflow })`
- `parseTsv(text)`

`overflow` is `"truncate"` or `"expand"`.

### HTML Cell Rendering

```js
const cell = grid.getCell(1, 1);
cell.mode = "html";
cell.text = '<span class="badge">Ready</span>';
view.draw();
```

Cell modes:

- `"default"` - Canvas text rendering
- `"html"` - render `cell.text` as a positioned DOM overlay

HTML cells create DOM nodes only for cells that are currently visible. Canvas still handles backgrounds, images, borders, selection highlights, scrolling, and fixed regions.

SpanGrid applies a basic safety filter for risky tags, event attributes, unsafe URLs, and unsafe CSS before rendering. This filter is not a security boundary. Apply a dedicated sanitizer such as DOMPurify before displaying untrusted external HTML.

### Data and Persistence

```js
grid.setData([
  ["Name", "Status"],
  ["SpanGrid", "Ready"],
]);

const matrix = grid.getData();
const json = grid.toJSON();
const restored = SpanGridControl.fromJSON(json);
```

Methods:

- `getData()` - returns all cell text as a two-dimensional array
- `setData(data, { expand = true }?)` - applies a two-dimensional array to cell text
- `toJSON()` - returns a plain object with grid structure and styles
- `SpanGridControl.fromJSON(snapshot)` - creates a new grid from a `toJSON()` snapshot

### Export Helpers

```js
const image = await grid.toImage();
const svg = grid.toSVG();
const vector = grid.toVector();
```

Methods:

- `toImage()` - returns a promise for `{ dataURL, width, height }` in browser-like environments, or `null` when canvas image export is unavailable
- `toSVG()` - returns an SVG string rendered from the grid model
- `toVector()` - returns an SVG string captured through the internal vector context

HTML cell text is not converted into vector text. Export helpers render Canvas-owned backgrounds, text, borders, and layout state.

## SpanGridCanvasView

`SpanGridCanvasView` connects a canvas to a `SpanGridControl`.

```js
const view = new SpanGridCanvasView(canvas, grid, {
  hScroll: document.getElementById("hScroll"),
  vScroll: document.getElementById("vScroll"),
  statusElement: document.getElementById("status"),
  pasteOverflow: "truncate",
  readonly: false,
});
```

Options:

- `hScroll`, `vScroll` - range input scrollbars
- `statusElement` - element that receives selection status text
- `pasteOverflow` - paste overflow handling mode
- `readonly` - when `true`, the view renders only and does not bind interactive canvas, editing, clipboard, or wheel events

Main methods:

- `bind()`
- `destroy()`
- `resize()`
- `draw()`
- `cellsForRegion(region)`
- `visibleGridRectForRegion(region)`
- `syncHtmlOverlay()`
- `sanitizeCellHtml(html)`
- `startCellEdit(cell?, initialValue?)`
- `commitCellEdit(moveAction?)`
- `cancelCellEdit()`
- `hitDivider(x, y, tolerance?)`

Call `destroy()` before removing the view to clean up event listeners and editor DOM.

## Data Classes

### SpanGridCell

Main properties:

- `text`
- `mode` - `"default"` or `"html"`
- `name`
- `backColor`
- `foreColor`
- `font`
- `textAlign`
- `backgroundImage`
- `backgroundImageUrl`
- `backgroundImageLayout`
- `backgroundImageAlign`
- `border`

### SpanGridRow

```js
new SpanGridRow({ height: 34, border });
```

Static values:

- `SpanGridRow.CELL_HEIGHT`
- `SpanGridRow.MIN_HEIGHT`

### SpanGridCol

```js
new SpanGridCol({ width: 120, border });
```

Static values:

- `SpanGridCol.CELL_WIDTH`
- `SpanGridCol.MIN_WIDTH`

### SpanGridBorder

```js
const border = new SpanGridBorder({
  color: "#a0a0a0",
  borderDirection: BorderDirection.All,
  lineStyle: "Solid",
  lineWidth: 1,
  inheritUnspecified: false,
});

border.setSide("bottom", {
  color: "#d92d20",
  lineStyle: "Dash",
  lineWidth: 3,
  visible: true,
});
```

Methods:

- `clone()`
- `setColor(color)`
- `setLineStyle(lineStyle)`
- `setLineWidth(lineWidth)`
- `setSide(side, options)`

### SpanGridFixed

```js
grid.fixed = new SpanGridFixed(grid.rows[0], grid.cols[0]);
grid.layout();
```

### SpanGridMerge

Use `grid.mergeCells()` instead of creating merge objects directly.
