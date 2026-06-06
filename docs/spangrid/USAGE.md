# SpanGrid 0.1.1 Usage Examples

## 1. Basic Grid Rendering

```html
<canvas id="grid" style="width: 900px; height: 480px"></canvas>
<script src="./src/span-grid.js"></script>
<script>
  const { SpanGridControl, SpanGridCanvasView, SpanGridCol, SpanGridRow } = SpanGrid;

  const grid = new SpanGridControl({ width: 900, height: 480 });
  [120, 160, 120].forEach((width) => grid.addCol(new SpanGridCol({ width })));
  [32, 32, 32].forEach((height) => grid.addRow(new SpanGridRow({ height })));

  grid.setData([
    ["Name", "Owner", "Status"],
    ["SpanGrid", "Design", "Ready"],
    ["Export", "Core", "Done"],
  ]);

  const view = new SpanGridCanvasView(document.getElementById("grid"), grid);
  grid.selectCell(0, 0);
  view.draw();
</script>
```

## 2. Zoom and Scroll Mode

```js
grid.setZoomPercent(125);
grid.setScrollMode("cell");
grid.scrollBy(1, 1);
view.draw();
```

`"pixel"` mode follows pointer and wheel deltas. `"cell"` mode snaps movement to row and column boundaries.

## 3. Cell Editing and Keyboard Navigation

```js
grid.selectCell(1, 0);
view.startCellEdit();
```

The browser examples support these interactions:

- Double-click - start cell editing
- Enter - move down, then wrap to the first row of the next column
- Tab - move right, then wrap to the first column of the next row
- Shift+Enter / Shift+Tab - move in the opposite direction
- F2 - edit the selected cell
- Ctrl+C / Ctrl+V - copy and paste TSV text

## 4. Paste Overflow Handling

```js
grid.selectCell(1, 1);

grid.pasteTsv("A\tB\nC\tD", {
  overflow: "truncate",
});

grid.pasteTsv("A\tB\nC\tD", {
  overflow: "expand",
});
```

`"truncate"` drops values outside the current grid bounds. `"expand"` adds rows and columns as needed.

## 5. Border Styling

```js
const { BorderDirection, SpanGridBorder } = SpanGrid;

const border = new SpanGridBorder({
  color: "#0f766e",
  borderDirection: BorderDirection.All,
  lineStyle: "Solid",
  lineWidth: 1,
});

border.setSide("bottom", {
  color: "#d92d20",
  lineStyle: "Dash",
  lineWidth: 3,
  visible: true,
});

grid.getCell(1, 1).border = border;
view.draw();
```

Assign row and column borders through `row.border` and `col.border`. Assign the default grid border through `grid.gridBorder`.

## 6. Multi-Selection Property Updates

```js
const cells = [
  grid.getCell(1, 1),
  grid.getCell(1, 2),
  grid.getCell(2, 1),
  grid.getCell(2, 2),
];

grid.selectCells(cells);
grid.applyPropertiesToSelectedCells({
  backColor: "#eef6ff",
  foreColor: "#17202f",
  textAlign: "MiddleCenter",
});
view.draw();
```

Multi-cell borders apply to the outer rectangle of the selected cells.

```js
grid.applyBorderToSelectedCells(new SpanGridBorder({
  color: "#175cd3",
  borderDirection: BorderDirection.All,
  lineStyle: "Dash",
  lineWidth: 2,
}));
view.draw();
```

## 7. Merge and Fixed Cells

```js
grid.mergeCells(1, 1, 2, 2);
grid.setFixedCell(grid.getCell(0, 0));
view.draw();
```

Fixed regions draw above the scrolling body. Body selection fills and borders are clipped below fixed cells.

## 8. HTML Cell Rendering

```js
const cell = grid.getCell(1, 1);
cell.mode = "html";
cell.text = '<span class="badge">Ready</span>';
cell.backColor = "#ffffff";
cell.textAlign = "MiddleCenter";
view.draw();
```

HTML cells render `cell.text` into a DOM overlay. Canvas still owns the background, image, border, selection, and fixed-region rendering.

```css
.span-grid-html-cell .badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0 8px;
  color: #0f766e;
  background: #ccfbf1;
  font-weight: 700;
}
```

SpanGrid applies a basic safety filter for risky tags, event attributes, unsafe URLs, and unsafe CSS. Apply a dedicated sanitizer such as DOMPurify before displaying user-provided HTML.

## 9. Save and Restore

```js
const snapshot = grid.toJSON();
localStorage.setItem("span-grid", JSON.stringify(snapshot));

const restored = SpanGridControl.fromJSON(
  JSON.parse(localStorage.getItem("span-grid"))
);

view.grid = restored;
restored.selectCell(0, 0);
view.draw();
```

`toJSON()` stores row and column sizes, cell text and styles, cell `mode`, merges, fixed regions, grid properties, and border properties. `backgroundImageUrl` is stored, but the runtime environment must reload the actual `Image` object after restore.

## 10. Large Data Loading

```js
const rows = Array.from({ length: 1000 }, (_, row) => {
  return Array.from({ length: 20 }, (_, col) => `R${row} C${col}`);
});

grid.setData(rows, { expand: true });
view.draw();
```

The renderer filters drawing to cells that intersect the visible viewport. HTML cells also keep DOM nodes only for visible cells. The model still stores all cells, so for large updates prefer calling `setData()` and then one `draw()`.

## 11. Showcase

Open `examples/spangrid/showcase.html` from the repository root to switch between KPI, product catalog, roadmap, team roster, quote, and status-board presets while comparing HTML cells with default cells.

## 12. Render-Only View

```js
const view = new SpanGridCanvasView(canvas, grid, {
  readonly: true,
});

view.draw();
```

With `readonly: true`, the view does not bind canvas mouse, keyboard, editing, clipboard, or wheel events. This is useful for display-only grids restored from JSON. External buttons or application code can still call `grid.scrollTo()`, `grid.setZoomPercent()`, and `view.draw()`.

## 13. Cleanup

```js
view.destroy();
```

Call `destroy()` before removing the canvas in single-page apps or tabbed interfaces. It removes canvas, scrollbar, window resize, and cell editor event handlers.
