const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  BorderDirection,
  VERSION,
  SpanGridBorder,
  SpanGridControl,
  SpanGridRow,
  SpanGridCol,
  SpanGridCell,
  SpanGridFixed,
  SpanGridCanvasView,
  createDemoGrid,
  runSmokeTests,
} = require("../src/span-grid.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function pickBorder(value) {
  return {
    visible: value.visible,
    color: value.color,
    lineStyle: value.lineStyle,
    lineWidth: value.lineWidth,
    source: value.source,
  };
}

function readPackageFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", "..", "..", relativePath), "utf8");
}

function createStrokeMockContext() {
  return {
    strokeStyle: "#000000",
    lineWidth: 1,
    lineDash: [],
    currentPath: [],
    strokes: [],
    beginPath() {
      this.currentPath = [];
    },
    moveTo(x, y) {
      this.currentPath.push(["moveTo", x, y]);
    },
    lineTo(x, y) {
      this.currentPath.push(["lineTo", x, y]);
    },
    stroke() {
      this.strokes.push({
        strokeStyle: this.strokeStyle,
        lineWidth: this.lineWidth,
        lineDash: this.lineDash.slice(),
        path: this.currentPath.slice(),
      });
    },
    setLineDash(value) {
      this.lineDash = value.slice();
    },
    save() {},
    restore() {},
    fillRect() {},
    strokeRect(x, y, width, height) {
      this.strokes.push({
        strokeStyle: this.strokeStyle,
        lineWidth: this.lineWidth,
        lineDash: this.lineDash.slice(),
        path: [["strokeRect", x, y, width, height]],
      });
    },
  };
}

function createEventTargetMock(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    listeners,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      const handlers = listeners.get(type);
      if (handlers) handlers.delete(handler);
    },
    listenerCount(type) {
      if (type) return listeners.get(type)?.size || 0;
      return [...listeners.values()].reduce((sum, handlers) => sum + handlers.size, 0);
    },
  };
}

function createCanvasContextMock() {
  return {
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    fillTexts: [],
    setTransform() {},
    clearRect() {},
    fillRect() {},
    save() {},
    restore() {},
    beginPath() {},
    rect() {},
    clip() {},
    scale() {},
    translate() {},
    strokeRect() {},
    setLineDash() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fillText(...args) {
      this.fillTexts.push(args);
    },
  };
}

function createElementMock(tagName = "div", extra = {}) {
  let html = "";
  const element = createEventTargetMock({
    tagName: tagName.toUpperCase(),
    style: {},
    dataset: {},
    className: "",
    children: [],
    parentElement: null,
    textContent: "",
    ...extra,
  });
  element.appendChild = (child) => {
    element.children.push(child);
    child.parentElement = element;
  };
  element.removeChild = (child) => {
    element.children = element.children.filter((item) => item !== child);
    child.parentElement = null;
  };
  element.replaceChildren = (...children) => {
    for (const child of element.children) child.parentElement = null;
    element.children = [];
    for (const child of children) element.appendChild(child);
  };
  Object.defineProperty(element, "innerHTML", {
    get() {
      return html;
    },
    set(value) {
      html = String(value ?? "");
    },
  });
  return element;
}

test("adding rows and columns creates the matching cell matrix", () => {
  const grid = new SpanGridControl({ width: 400, height: 200 });

  const col0 = grid.addCol();
  const col1 = grid.addCol(new SpanGridCol({ width: 80 }));
  const row0 = grid.addRow();
  const row1 = grid.addRow(new SpanGridRow({ height: 40 }));

  assert.strictEqual(grid.cols.length, 2);
  assert.strictEqual(grid.rows.length, 2);
  assert.strictEqual(col0.width, SpanGridCol.CELL_WIDTH);
  assert.strictEqual(col1.width, 80);
  assert.strictEqual(row0.height, SpanGridRow.CELL_HEIGHT);
  assert.strictEqual(row1.height, 40);

  assert.ok(grid.getCell(0, 0) instanceof SpanGridCell);
  assert.strictEqual(grid.getCell(0, 0).row, row0);
  assert.strictEqual(grid.getCell(0, 1).col, col1);
  assert.strictEqual(grid.getCell(1, 1).row, row1);
});

test("layout mirrors the original cell bounds and client rectangles", () => {
  const grid = new SpanGridControl({ width: 180, height: 100, borderStyle: "Fixed3D" });
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 40 }));

  grid.layout();

  assert.deepStrictEqual(grid.clientRect, { x: 2, y: 2, width: 133, height: 69 });
  assert.deepStrictEqual(grid.viewportRect, { x: 2, y: 2, width: 176, height: 96 });
  assert.deepStrictEqual(grid.getCell(0, 0).bounds, { x: 3, y: 3, width: 50, height: 26 });
  assert.deepStrictEqual(grid.getCell(0, 1).bounds, { x: 54, y: 3, width: 80, height: 26 });
  assert.deepStrictEqual(grid.getCell(1, 0).bounds, { x: 3, y: 30, width: 50, height: 40 });
  assert.deepStrictEqual(grid.getCell(1, 1).bounds, { x: 54, y: 30, width: 80, height: 40 });
});

test("merging cells keeps the start cell visible across the merged bounds", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  grid.addCol();
  grid.addCol();
  grid.addCol();
  grid.addRow();
  grid.addRow();
  grid.addRow();

  const merged = grid.mergeCells(0, 0, 1, 1);
  merged.sCell.text = "merged";
  grid.layout();

  assert.strictEqual(merged.sCell.span, true);
  assert.strictEqual(grid.getCell(0, 1).visible, false);
  assert.strictEqual(grid.getCell(1, 0).visible, false);
  assert.strictEqual(grid.getCell(1, 1).visible, false);
  assert.deepStrictEqual(merged.sCell.bounds, { x: 3, y: 3, width: 101, height: 53 });
  assert.strictEqual(grid.hitTest(75, 40), merged.sCell);
});

test("selection notifies with row, column, and cell details", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  grid.addCol();
  grid.addCol();
  grid.addRow();
  grid.addRow();

  let event = null;
  grid.onCellClick((args) => {
    event = args;
  });

  const cell = grid.selectCell(1, 1);

  assert.strictEqual(cell, grid.getCell(1, 1));
  assert.strictEqual(grid.selectedCell, cell);
  assert.deepStrictEqual(grid.selectedObjects, [cell]);
  assert.deepStrictEqual(
    { row: event.row, col: event.col, cell: event.cell },
    { row: 1, col: 1, cell }
  );
});

test("design selection APIs select grid, rows, columns, and clamp sizes", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  grid.addCol(new SpanGridCol({ width: 70 }));
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 40 }));

  grid.selectGrid();
  assert.deepStrictEqual(grid.selectedObjects, [grid]);
  assert.strictEqual(grid.selectedCell, null);
  assert.strictEqual(grid.selectedRow, null);
  assert.strictEqual(grid.selectedCol, null);

  const row = grid.selectRow(1);
  assert.strictEqual(row, grid.rows[1]);
  assert.deepStrictEqual(grid.selectedObjects, [grid.rows[1]]);
  assert.strictEqual(grid.selectedRow, grid.rows[1]);

  const col = grid.selectCol(0);
  assert.strictEqual(col, grid.cols[0]);
  assert.deepStrictEqual(grid.selectedObjects, [grid.cols[0]]);
  assert.strictEqual(grid.selectedCol, grid.cols[0]);

  assert.strictEqual(grid.setRowHeight(1, 4), SpanGridRow.MIN_HEIGHT);
  assert.strictEqual(grid.rows[1].height, SpanGridRow.MIN_HEIGHT);
  assert.strictEqual(grid.getCell(1, 0).bounds.height, SpanGridRow.MIN_HEIGHT);

  assert.strictEqual(grid.setColWidth(0, 4), SpanGridCol.MIN_WIDTH);
  assert.strictEqual(grid.cols[0].width, SpanGridCol.MIN_WIDTH);
  assert.strictEqual(grid.getCell(0, 0).bounds.width, SpanGridCol.MIN_WIDTH);
});

test("border model resolves grid row column and cell priority", () => {
  const grid = new SpanGridControl({
    width: 220,
    height: 120,
    gridBorder: new SpanGridBorder({ color: "#111111", lineStyle: "Solid", lineWidth: 1 }),
  });
  grid.addCol(new SpanGridCol({ width: 70 }));
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 40 }));

  grid.rows[0].border = new SpanGridBorder({
    color: "#aa0000",
    borderDirection: BorderDirection.Top | BorderDirection.Bottom,
    lineStyle: "Dash",
    lineWidth: 3,
  });
  grid.cols[0].border = new SpanGridBorder({
    color: "#00aa00",
    borderDirection: BorderDirection.Left | BorderDirection.Right,
    lineStyle: "Dot",
    lineWidth: 4,
  });

  const cell = grid.getCell(0, 0);
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(cell, "top")),
    { visible: true, color: "#aa0000", lineStyle: "Dash", lineWidth: 3, source: "row" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(cell, "left")),
    { visible: true, color: "#00aa00", lineStyle: "Dot", lineWidth: 4, source: "col" }
  );

  cell.border = new SpanGridBorder({
    color: "#0000aa",
    borderDirection: BorderDirection.Left,
    lineStyle: "Solid",
    lineWidth: 5,
  });
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(cell, "left")),
    { visible: true, color: "#0000aa", lineStyle: "Solid", lineWidth: 5, source: "cell" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(cell, "top")),
    { visible: false, color: null, lineStyle: "Solid", lineWidth: 0, source: "cell" }
  );
});

test("cell border rendering uses per-side color width style and direction", () => {
  const grid = new SpanGridControl({
    width: 120,
    height: 80,
    gridBorder: new SpanGridBorder({ color: "#111111", lineStyle: "Solid", lineWidth: 1 }),
  });
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  const cell = grid.getCell(0, 0);
  cell.border = new SpanGridBorder({
    leftColor: "#ff0000",
    bottomColor: "#0000ff",
    borderDirection: BorderDirection.Left | BorderDirection.Bottom,
    lineStyle: "Dot",
    lineWidth: 4,
  });
  grid.layout();

  const view = new SpanGridCanvasView(null, grid);
  const ctx = createStrokeMockContext();
  view.drawCellBorders(ctx, [cell]);

  assert.deepStrictEqual(
    ctx.strokes.map((stroke) => ({
      color: stroke.strokeStyle,
      width: stroke.lineWidth,
      dash: stroke.lineDash,
      from: stroke.path[0],
      to: stroke.path[1],
    })),
    [
      {
        color: "#ff0000",
        width: 4,
        dash: [2, 4],
        from: ["moveTo", 2.5, 2.5],
        to: ["lineTo", 2.5, 29.5],
      },
      {
        color: "#0000ff",
        width: 4,
        dash: [2, 4],
        from: ["moveTo", 2.5, 29.5],
        to: ["lineTo", 53.5, 29.5],
      },
    ]
  );
});

test("border line selection highlights only the clicked row or column line", () => {
  const grid = new SpanGridControl({ width: 220, height: 120 });
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.layout();

  grid.selectBorderLine("row", 0, "bottom");
  assert.deepStrictEqual(
    {
      type: grid.selectedBorderLine.type,
      index: grid.selectedBorderLine.index,
      side: grid.selectedBorderLine.side,
    },
    { type: "row", index: 0, side: "bottom" }
  );
  assert.strictEqual(grid.selectedRow, grid.rows[0]);
  assert.strictEqual(grid.selectedCol, null);

  const view = new SpanGridCanvasView(null, grid);
  const ctx = createStrokeMockContext();
  view.drawSelection(ctx, "body");

  assert.deepStrictEqual(ctx.strokes.map((stroke) => stroke.path), [
    [
      ["moveTo", 2.5, 29.5],
      ["lineTo", 104.5, 29.5],
    ],
  ]);
});

test("readonly view does not draw focus or border-line highlights", () => {
  const grid = new SpanGridControl({ width: 220, height: 120 });
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.layout();

  const view = new SpanGridCanvasView(null, grid, { readonly: true });

  grid.selectCell(0, 0);
  const cellCtx = createStrokeMockContext();
  view.drawSelection(cellCtx, "body");
  assert.deepStrictEqual(cellCtx.strokes, []);

  grid.selectBorderLine("row", 0, "bottom");
  const lineCtx = createStrokeMockContext();
  view.drawSelection(lineCtx, "body");
  assert.deepStrictEqual(lineCtx.strokes, []);
});

test("selected border line update affects only that line side", () => {
  const grid = new SpanGridControl({
    width: 220,
    height: 120,
    gridBorder: new SpanGridBorder({ color: "#111111", lineStyle: "Solid", lineWidth: 1 }),
  });
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addCol(new SpanGridCol({ width: 50 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 26 }));

  grid.selectBorderLine("row", 0, "bottom");
  grid.applyBorderToSelectedLine(
    new SpanGridBorder({
      color: "#ff0000",
      borderDirection: BorderDirection.Bottom,
      lineStyle: "Dash",
      lineWidth: 3,
    })
  );

  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(0, 0), "bottom")),
    { visible: true, color: "#ff0000", lineStyle: "Dash", lineWidth: 3, source: "row" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(0, 0), "top")),
    { visible: true, color: "#111111", lineStyle: "Solid", lineWidth: 1, source: "grid" }
  );
});

test("multi-cell border update applies only to the selected outer rectangle", () => {
  const grid = new SpanGridControl({
    width: 240,
    height: 160,
    gridBorder: new SpanGridBorder({ color: "#111111", lineStyle: "Solid", lineWidth: 1 }),
  });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  grid.selectCells([grid.getCell(0, 0), grid.getCell(0, 1), grid.getCell(1, 0), grid.getCell(1, 1)]);

  grid.applyBorderToSelectedCells(
    new SpanGridBorder({
      color: "#00aaee",
      borderDirection: BorderDirection.All,
      lineStyle: "Dot",
      lineWidth: 4,
    })
  );

  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(0, 0), "top")),
    { visible: true, color: "#00aaee", lineStyle: "Dot", lineWidth: 4, source: "cell" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(0, 0), "left")),
    { visible: true, color: "#00aaee", lineStyle: "Dot", lineWidth: 4, source: "cell" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(0, 0), "right")),
    { visible: true, color: "#111111", lineStyle: "Solid", lineWidth: 1, source: "grid" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(1, 1), "bottom")),
    { visible: true, color: "#00aaee", lineStyle: "Dot", lineWidth: 4, source: "cell" }
  );
  assert.deepStrictEqual(
    pickBorder(grid.resolveCellBorder(grid.getCell(1, 1), "right")),
    { visible: true, color: "#00aaee", lineStyle: "Dot", lineWidth: 4, source: "cell" }
  );
});

test("multi-cell property updates apply to every selected cell", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  const selected = [grid.getCell(0, 0), grid.getCell(0, 1), grid.getCell(1, 0)];
  grid.selectCells(selected);

  const count = grid.applyPropertiesToSelectedCells({
    backColor: "#123456",
    foreColor: "#abcdef",
    font: "bold 14px serif",
    textAlign: "BottomRight",
  });

  assert.strictEqual(count, 3);
  for (const cell of selected) {
    assert.strictEqual(cell.backColor, "#123456");
    assert.strictEqual(cell.foreColor, "#abcdef");
    assert.strictEqual(cell.font, "bold 14px serif");
    assert.strictEqual(cell.textAlign, "BottomRight");
  }
  assert.notStrictEqual(grid.getCell(2, 2).backColor, "#123456");
});

test("keyboard navigation moves by enter tab and arrows", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));

  assert.strictEqual(grid.nextCellFrom(grid.getCell(0, 0), "enter"), grid.getCell(1, 0));
  assert.strictEqual(grid.nextCellFrom(grid.getCell(2, 0), "enter"), grid.getCell(0, 1));
  assert.strictEqual(grid.nextCellFrom(grid.getCell(0, 0), "tab"), grid.getCell(0, 1));
  assert.strictEqual(grid.nextCellFrom(grid.getCell(0, 2), "tab"), grid.getCell(1, 0));
  assert.strictEqual(grid.nextCellFrom(grid.getCell(2, 2), "tab"), grid.getCell(2, 2));
  assert.strictEqual(grid.nextCellFrom(grid.getCell(1, 1), "arrow-left"), grid.getCell(1, 0));

  grid.selectCell(2, 0);
  assert.strictEqual(grid.selectNextCell("enter"), grid.getCell(0, 1));
});

test("copy selection serializes rectangular tsv text", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  grid.getCell(0, 0).text = "A";
  grid.getCell(0, 1).text = "B";
  grid.getCell(1, 0).text = "C";
  grid.getCell(1, 1).text = "D";
  grid.selectCells([grid.getCell(1, 1), grid.getCell(0, 0), grid.getCell(1, 0), grid.getCell(0, 1)]);

  assert.strictEqual(grid.copySelectionToTsv(), "A\tB\nC\tD");

  grid.selectCell(0, 0);
  assert.strictEqual(grid.copySelectionToTsv(), "A");
});

test("paste tsv can truncate or expand overflow data", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  for (let index = 0; index < 2; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 2; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));

  grid.selectCell(1, 1);
  const truncated = grid.pasteTsv("A\tB\nC\tD", { overflow: "truncate" });
  assert.deepStrictEqual(truncated, { rows: 1, cols: 1, cells: 1, expandedRows: 0, expandedCols: 0 });
  assert.strictEqual(grid.rows.length, 2);
  assert.strictEqual(grid.cols.length, 2);
  assert.strictEqual(grid.getCell(1, 1).text, "A");

  grid.selectCell(1, 1);
  const expanded = grid.pasteTsv("A\tB\nC\tD", { overflow: "expand" });
  assert.deepStrictEqual(expanded, { rows: 2, cols: 2, cells: 4, expandedRows: 1, expandedCols: 1 });
  assert.strictEqual(grid.rows.length, 3);
  assert.strictEqual(grid.cols.length, 3);
  assert.strictEqual(grid.getCell(1, 1).text, "A");
  assert.strictEqual(grid.getCell(1, 2).text, "B");
  assert.strictEqual(grid.getCell(2, 1).text, "C");
  assert.strictEqual(grid.getCell(2, 2).text, "D");
});

test("reserveScrollbarInViewport: model A keeps full canvas viewport (scroll UI outside layout)", () => {
  const w = 200;
  const h = 200;
  const reserved = new SpanGridControl({ width: w, height: h, borderStyle: "Fixed3D", reserveScrollbarInViewport: true });
  const modelA = new SpanGridControl({ width: w, height: h, borderStyle: "Fixed3D" });
  for (let i = 0; i < 8; i += 1) {
    reserved.addCol(new SpanGridCol({ width: 80 }));
    modelA.addCol(new SpanGridCol({ width: 80 }));
  }
  reserved.addRow(new SpanGridRow({ height: 200 }));
  modelA.addRow(new SpanGridRow({ height: 200 }));
  reserved.layout();
  modelA.layout();
  assert.ok(modelA.viewportRect.width > reserved.viewportRect.width);
  assert.ok(modelA.viewportRect.height > reserved.viewportRect.height);
  assert.strictEqual(reserved.reserveScrollbarInViewport, true);
  assert.strictEqual(modelA.reserveScrollbarInViewport, false);
});

test("version and persistence APIs round-trip grid state", () => {
  const pkg = JSON.parse(fs.readFileSync(require.resolve("../package.json"), "utf8"));
  assert.strictEqual(VERSION, pkg.version);

  const grid = new SpanGridControl({
    width: 320,
    height: 180,
    backColor: "#fdfdfd",
    focusColor: "#123456",
    zoom: 1.25,
    scrollMode: "cell",
    gridBorder: new SpanGridBorder({
      color: "#111111",
      borderDirection: BorderDirection.All,
      lineStyle: "Dash",
      lineWidth: 2,
    }),
  });
  grid.addCol(new SpanGridCol({ width: 70 }));
  grid.addCol(new SpanGridCol({ width: 90 }));
  grid.addRow(new SpanGridRow({ height: 28 }));
  grid.addRow(new SpanGridRow({ height: 36 }));
  grid.setData([
    ["A", "B"],
    ["C", "D"],
  ]);
  grid.fixed = new SpanGridFixed(grid.rows[0], grid.cols[0]);
  grid.rows[1].border = new SpanGridBorder({ color: "#ff0000", borderDirection: BorderDirection.Bottom, lineStyle: "Dot", lineWidth: 3 });
  grid.cols[1].border = new SpanGridBorder({ color: "#00ff00", borderDirection: BorderDirection.Right, lineStyle: "Solid", lineWidth: 4 });
  grid.getCell(1, 1).backColor = "#eeeeff";
  grid.getCell(1, 1).foreColor = "#101010";
  grid.getCell(1, 1).font = "bold 14px serif";
  grid.getCell(1, 1).textAlign = "BottomRight";
  grid.getCell(1, 1).backgroundImageUrl = "about.jpg";
  grid.getCell(1, 1).backgroundImageLayout = "Zoom";
  grid.getCell(1, 1).backgroundImageAlign = "BottomRight";
  grid.getCell(1, 1).mode = "html";
  grid.getCell(1, 1).text = '<span class="badge">Done</span>';
  grid.getCell(1, 1).border = new SpanGridBorder({
    leftColor: "#111111",
    rightColor: "#222222",
    topColor: "#333333",
    bottomColor: "#444444",
    borderDirection: BorderDirection.Left | BorderDirection.Bottom,
    lineStyle: "Solid",
    lineWidth: 1,
    leftLineStyle: "Dash",
    bottomLineWidth: 5,
    inheritUnspecified: true,
  });
  grid.mergeCells(0, 0, 0, 1);

  const expanded = new SpanGridControl();
  expanded.setData(
    [
      ["R0C0", "R0C1", "R0C2"],
      ["R1C0", "R1C1", "R1C2"],
    ],
    { expand: true }
  );
  assert.deepStrictEqual(expanded.getData(), [
    ["R0C0", "R0C1", "R0C2"],
    ["R1C0", "R1C1", "R1C2"],
  ]);

  const restored = SpanGridControl.fromJSON(grid.toJSON());
  assert.strictEqual(restored.width, 320);
  assert.strictEqual(restored.height, 180);
  assert.strictEqual(restored.zoom, 1.25);
  assert.strictEqual(restored.scrollMode, "cell");
  assert.strictEqual(restored.cols[1].width, 90);
  assert.strictEqual(restored.rows[1].height, 36);
  assert.strictEqual(restored.fixed.row, restored.rows[0]);
  assert.strictEqual(restored.fixed.col, restored.cols[0]);
  assert.strictEqual(restored.merges.length, 1);
  assert.deepStrictEqual(restored.getData(), [
    ["A", "B"],
    ["C", '<span class="badge">Done</span>'],
  ]);
  assert.strictEqual(restored.gridBorder.lineStyle, "Dash");
  assert.strictEqual(restored.rows[1].border.lineStyle, "Dot");
  assert.strictEqual(restored.cols[1].border.lineWidth, 4);
  assert.strictEqual(restored.getCell(1, 1).backColor, "#eeeeff");
  assert.strictEqual(restored.getCell(1, 1).textAlign, "BottomRight");
  assert.strictEqual(restored.getCell(1, 1).mode, "html");
  assert.strictEqual(restored.getCell(1, 1).backgroundImageUrl, "about.jpg");
  assert.strictEqual(restored.getCell(1, 1).border.leftLineStyle, "Dash");
  assert.strictEqual(restored.getCell(1, 1).border.bottomLineWidth, 5);
  assert.strictEqual(restored.reserveScrollbarInViewport, false);
  assert.strictEqual(SpanGridControl.fromJSON({ width: 60, height: 40, rows: [], cols: [] }).reserveScrollbarInViewport, false);
});

test("repository docs and demos use the package version", () => {
  const pkg = JSON.parse(fs.readFileSync(require.resolve("../package.json"), "utf8"));
  const readme = readPackageFile("README.md");
  const api = readRepoFile("docs/spangrid/API.md");
  const usage = readRepoFile("docs/spangrid/USAGE.md");
  const index = readRepoFile("examples/spangrid/index.html");
  const showcase = readRepoFile("examples/spangrid/showcase.html");

  assert.ok(readme.includes(`SpanGrid JavaScript v${pkg.version}`));
  assert.ok(readme.includes(`SpanGrid ${pkg.version} library`));
  assert.ok(api.includes(`current version string, \`${pkg.version}\``));
  assert.ok(usage.includes(`SpanGrid ${pkg.version} Usage Examples`));
  assert.ok(index.includes(`v${pkg.version}`));
  assert.ok(showcase.includes(`v${pkg.version}`));
});

test("cell mode defaults normalizes and clones", () => {
  const defaultCell = new SpanGridCell();
  const htmlCell = new SpanGridCell({ mode: "html", text: "<strong>HTML</strong>" });
  const invalidCell = new SpanGridCell({ mode: "script" });

  assert.strictEqual(defaultCell.mode, "default");
  assert.strictEqual(htmlCell.mode, "html");
  assert.strictEqual(invalidCell.mode, "default");
  assert.strictEqual(htmlCell.clone().mode, "html");
});

test("fromJSON tolerates empty and partial snapshots", () => {
  const empty = SpanGridControl.fromJSON(null);
  assert.strictEqual(empty.rows.length, 0);
  assert.strictEqual(empty.cols.length, 0);

  const partial = SpanGridControl.fromJSON({
    rows: [
      null,
      {
        height: 44,
        cells: [{ text: "A" }, null, { text: "C" }],
      },
    ],
    merges: [null, { start: { row: 0, col: 0 }, end: { row: 50, col: 50 } }],
  });

  assert.strictEqual(partial.rows.length, 2);
  assert.strictEqual(partial.cols.length, 3);
  assert.strictEqual(partial.rows[1].height, 44);
  assert.deepStrictEqual(partial.getData(), [
    ["", "", ""],
    ["A", "", "C"],
  ]);
  assert.strictEqual(partial.merges.length, 0);
});

test("divider hit testing finds row and column borders in visual coordinates", () => {
  const grid = new SpanGridControl({ width: 260, height: 160 });
  grid.addCol(new SpanGridCol({ width: 70 }));
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 40 }));
  grid.layout();

  const view = new SpanGridCanvasView(null, grid);
  const firstCell = grid.getCell(0, 0);
  const colDivider = view.hitDivider(
    firstCell.bounds.x + firstCell.bounds.width + 1,
    firstCell.bounds.y + 8
  );
  const rowDivider = view.hitDivider(
    firstCell.bounds.x + 8,
    firstCell.bounds.y + firstCell.bounds.height + 1
  );

  assert.deepStrictEqual(
    { type: colDivider.type, index: colDivider.index, item: colDivider.item },
    { type: "col", index: 0, item: grid.cols[0] }
  );
  assert.deepStrictEqual(
    { type: rowDivider.type, index: rowDivider.index, item: rowDivider.item },
    { type: "row", index: 0, item: grid.rows[0] }
  );
});

test("divider resize dragging updates row height and column width", () => {
  const grid = new SpanGridControl({ width: 260, height: 160 });
  grid.addCol(new SpanGridCol({ width: 70 }));
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addRow(new SpanGridRow({ height: 26 }));
  grid.addRow(new SpanGridRow({ height: 40 }));
  grid.layout();

  const view = new SpanGridCanvasView(null, grid);
  const firstCell = grid.getCell(0, 0);
  const colPoint = {
    x: firstCell.bounds.x + firstCell.bounds.width,
    y: firstCell.bounds.y + 8,
  };
  view.beginDividerResize(view.hitDivider(colPoint.x, colPoint.y), colPoint);
  view.resizeDividerTo({ x: colPoint.x + 25, y: colPoint.y });
  assert.strictEqual(grid.cols[0].width, 95);

  const rowPoint = {
    x: firstCell.bounds.x + 8,
    y: firstCell.bounds.y + firstCell.bounds.height,
  };
  view.beginDividerResize(view.hitDivider(rowPoint.x, rowPoint.y), rowPoint);
  view.resizeDividerTo({ x: rowPoint.x, y: rowPoint.y - 40 });
  assert.strictEqual(grid.rows[0].height, SpanGridRow.MIN_HEIGHT);
});

test("fixed regions and ensureVisible update scroll state", () => {
  const grid = new SpanGridControl({ width: 100, height: 70 });
  for (let index = 0; index < 4; index += 1) grid.addCol();
  for (let index = 0; index < 5; index += 1) grid.addRow();
  grid.fixed = new SpanGridFixed(grid.rows[0], grid.cols[0]);
  grid.layout();

  assert.strictEqual(grid.hScrollVisible, true);
  assert.strictEqual(grid.vScrollVisible, true);
  assert.strictEqual(grid.fixedWidth, 51);
  assert.strictEqual(grid.fixedHeight, 27);

  grid.ensureVisible(grid.getCell(4, 3));

  assert.ok(grid.scrollX > 0);
  assert.ok(grid.scrollY > 0);
  assert.strictEqual(grid.hitTest(4, 4), grid.getCell(0, 0));
});

test("status identifies selected fixed cells rows and columns", () => {
  const grid = new SpanGridControl({ width: 220, height: 140 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  grid.fixed = new SpanGridFixed(grid.rows[0], grid.cols[0]);
  grid.layout();

  const statusElement = { textContent: "" };
  const view = new SpanGridCanvasView(null, grid, { statusElement });

  grid.selectCell(0, 0);
  view.updateStatus();
  assert.strictEqual(statusElement.textContent, "Cell (0, 0) · Fixed Row/Col");

  grid.selectCell(0, 2);
  view.updateStatus();
  assert.strictEqual(statusElement.textContent, "Cell (0, 2) · Fixed Row");

  grid.selectCell(2, 0);
  view.updateStatus();
  assert.strictEqual(statusElement.textContent, "Cell (2, 0) · Fixed Col");

  grid.selectCell(2, 2);
  view.updateStatus();
  assert.strictEqual(statusElement.textContent, "Cell (2, 2)");

  grid.selectRow(0);
  view.updateStatus();
  assert.strictEqual(statusElement.textContent, "Row 0 · Fixed Row");

  grid.selectCol(0);
  view.updateStatus();
  assert.strictEqual(statusElement.textContent, "Col 0 · Fixed Col");
});

test("zoom changes visual hit testing and scroll range", () => {
  const grid = new SpanGridControl({ width: 100, height: 70 });
  for (let index = 0; index < 4; index += 1) grid.addCol();
  for (let index = 0; index < 4; index += 1) grid.addRow();
  grid.layout();

  const scrollMaxAt100 = grid.scrollMaxX;
  assert.strictEqual(grid.zoom, 1);
  assert.strictEqual(grid.hitTest(55, 5), grid.getCell(0, 1));

  grid.setZoomPercent(200);
  grid.layout();

  assert.strictEqual(grid.zoom, 2);
  assert.ok(grid.scrollMaxX > scrollMaxAt100);
  assert.strictEqual(grid.hitTest(110, 8), grid.getCell(0, 1));

  grid.setZoom(0.5);
  grid.layout();

  assert.strictEqual(grid.zoom, 0.5);
  assert.ok(grid.scrollMaxX < scrollMaxAt100);
  assert.strictEqual(grid.hitTest(27, 2), grid.getCell(0, 1));
});

test("scroll mode switches between pixel deltas and cell-sized snapping", () => {
  const grid = new SpanGridControl({ width: 100, height: 70, reserveScrollbarInViewport: true });
  [50, 80, 60].forEach((width) => grid.addCol(new SpanGridCol({ width })));
  [26, 40, 30].forEach((height) => grid.addRow(new SpanGridRow({ height })));
  grid.layout();

  assert.strictEqual(grid.scrollMode, "pixel");
  grid.scrollBy(23, 35);
  assert.deepStrictEqual({ x: grid.scrollX, y: grid.scrollY }, { x: 23, y: 35 });

  grid.setScrollMode("cell");
  grid.scrollTo(23, 35);
  assert.deepStrictEqual({ x: grid.scrollX, y: grid.scrollY }, { x: 0, y: 27 });

  grid.scrollTo(0, 0);
  grid.scrollBy(1, 1);
  assert.deepStrictEqual({ x: grid.scrollX, y: grid.scrollY }, { x: 51, y: 27 });

  grid.scrollBy(-1, -1);
  assert.deepStrictEqual({ x: grid.scrollX, y: grid.scrollY }, { x: 0, y: 0 });
});

test("fixed drawing regions exclude scrolling body cells", () => {
  const grid = new SpanGridControl({ width: 180, height: 120 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  grid.fixed = new SpanGridFixed(grid.rows[0], grid.cols[0]);
  grid.setScrollMode("cell");
  grid.scrollBy(1, 1);

  const view = new SpanGridCanvasView(null, grid);

  assert.deepStrictEqual(view.cellsForRegion("corner"), [grid.getCell(0, 0)]);
  assert.deepStrictEqual(view.cellsForRegion("header"), [grid.getCell(0, 1), grid.getCell(0, 2)]);
  assert.deepStrictEqual(view.cellsForRegion("left"), [grid.getCell(1, 0), grid.getCell(2, 0)]);
  assert.deepStrictEqual(view.cellsForRegion("body"), [
    grid.getCell(1, 1),
    grid.getCell(1, 2),
    grid.getCell(2, 1),
    grid.getCell(2, 2),
  ]);
});

test("drawing regions filter out cells outside the visible viewport", () => {
  const grid = new SpanGridControl({ width: 120, height: 90 });
  for (let index = 0; index < 20; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 20; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  grid.mergeCells(10, 10, 11, 11);
  grid.scrollTo(510, 270);

  const view = new SpanGridCanvasView(null, grid);
  const bodyCells = view.cellsForRegion("body");

  assert.ok(bodyCells.length < 40, `expected visible subset, got ${bodyCells.length} cells`);
  assert.ok(bodyCells.includes(grid.getCell(10, 10)));
  assert.ok(bodyCells.includes(grid.getCell(12, 11)));
  assert.strictEqual(bodyCells.includes(grid.getCell(0, 0)), false);
  assert.strictEqual(bodyCells.includes(grid.getCell(19, 19)), false);
});

test("canvas view destroy removes registered event listeners and editor", () => {
  const previousWindow = global.window;
  const fakeWindow = createEventTargetMock({ devicePixelRatio: 1 });
  global.window = fakeWindow;

  const parent = {
    children: [],
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
    },
    removeChild(child) {
      this.children = this.children.filter((item) => item !== child);
      child.parentElement = null;
    },
  };
  const canvas = createEventTargetMock({
    width: 120,
    height: 80,
    clientWidth: 120,
    clientHeight: 80,
    offsetLeft: 0,
    offsetTop: 0,
    style: {},
    parentElement: parent,
    tabIndex: 0,
    hasAttribute(name) {
      return name === "tabindex";
    },
    getContext() {
      return createCanvasContextMock();
    },
    getBoundingClientRect() {
      return { left: 0, top: 0 };
    },
    focus() {},
  });
  const hScroll = createEventTargetMock({});
  const vScroll = createEventTargetMock({});
  const editor = createEventTargetMock({
    style: {},
    focus() {},
    select() {},
  });
  const previousDocument = global.document;
  global.document = {
    createElement() {
      return editor;
    },
  };

  try {
    const grid = new SpanGridControl({ width: 120, height: 80 });
    grid.addCol();
    grid.addRow();
    grid.selectCell(0, 0);
    const view = new SpanGridCanvasView(canvas, grid, { hScroll, vScroll });
    view.startCellEdit();

    assert.ok(canvas.listenerCount() > 0);
    assert.strictEqual(hScroll.listenerCount("input"), 1);
    assert.strictEqual(vScroll.listenerCount("input"), 1);
    assert.strictEqual(fakeWindow.listenerCount("resize"), 1);
    assert.strictEqual(editor.listenerCount("keydown"), 1);
    assert.strictEqual(editor.listenerCount("blur"), 1);

    view.destroy();

    assert.strictEqual(canvas.listenerCount(), 0);
    assert.strictEqual(hScroll.listenerCount(), 0);
    assert.strictEqual(vScroll.listenerCount(), 0);
    assert.strictEqual(fakeWindow.listenerCount(), 0);
    assert.strictEqual(editor.listenerCount(), 0);
    assert.strictEqual(parent.children.length, 0);
  } finally {
    global.window = previousWindow;
    global.document = previousDocument;
  }
});

test("readonly canvas view renders without interactive canvas handlers", () => {
  const previousWindow = global.window;
  const fakeWindow = createEventTargetMock({ devicePixelRatio: 1 });
  global.window = fakeWindow;

  const parent = createElementMock("div");
  const canvas = createEventTargetMock({
    width: 120,
    height: 80,
    clientWidth: 120,
    clientHeight: 80,
    offsetLeft: 0,
    offsetTop: 0,
    style: {},
    parentElement: parent,
    tabIndex: 0,
    hasAttribute(name) {
      return name === "tabindex";
    },
    getContext() {
      return createCanvasContextMock();
    },
    getBoundingClientRect() {
      return { left: 0, top: 0 };
    },
    focus() {},
  });
  const hScroll = createEventTargetMock({});
  const vScroll = createEventTargetMock({});

  try {
    const grid = new SpanGridControl({ width: 120, height: 80 });
    grid.addCol();
    grid.addRow();
    const view = new SpanGridCanvasView(canvas, grid, { hScroll, vScroll, readonly: true });

    assert.strictEqual(view.readonly, true);
    assert.strictEqual(canvas.listenerCount("mousedown"), 0);
    assert.strictEqual(canvas.listenerCount("keydown"), 0);
    assert.strictEqual(canvas.listenerCount("paste"), 0);
    assert.strictEqual(canvas.listenerCount("wheel"), 0);
    assert.strictEqual(hScroll.listenerCount("input"), 1);
    assert.strictEqual(vScroll.listenerCount("input"), 1);
    assert.strictEqual(fakeWindow.listenerCount("resize"), 1);
    assert.strictEqual(view.startCellEdit(grid.getCell(0, 0)), false);

    view.destroy();
    assert.strictEqual(hScroll.listenerCount("input"), 0);
    assert.strictEqual(vScroll.listenerCount("input"), 0);
  } finally {
    global.window = previousWindow;
  }
});

test("html mode skips canvas text and sanitizes unsafe markup", () => {
  const grid = new SpanGridControl();
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addCol(new SpanGridCol({ width: 80 }));
  grid.addRow(new SpanGridRow({ height: 30 }));
  grid.getCell(0, 0).text = "Default";
  grid.getCell(0, 1).text = '<b onclick="bad()">HTML</b><script>alert(1)</script><img src="javascript:bad()">';
  grid.getCell(0, 1).mode = "html";
  grid.layout();

  const view = new SpanGridCanvasView(null, grid);
  const ctx = createCanvasContextMock();
  view.drawCell(ctx, grid.getCell(0, 0));
  view.drawCell(ctx, grid.getCell(0, 1));

  assert.strictEqual(ctx.fillTexts.length, 1);
  assert.strictEqual(ctx.fillTexts[0][0], "Default");

  const sanitized = view.sanitizeCellHtml(grid.getCell(0, 1).text);
  assert.ok(sanitized.includes("<b>HTML</b>"));
  assert.strictEqual(sanitized.includes("onclick"), false);
  assert.strictEqual(sanitized.includes("script"), false);
  assert.strictEqual(sanitized.includes("javascript:"), false);
});

test("html sanitizer removes whitespace-obfuscated protocols and unsafe css", () => {
  const view = new SpanGridCanvasView(null, new SpanGridControl());

  const sanitizedLink = view.sanitizeCellHtml('<a href=" javaScript:alert(1)">space</a>');
  assert.strictEqual(sanitizedLink.includes("href"), false);
  assert.strictEqual(sanitizedLink.includes("javaScript"), false);

  const sanitizedStyle = view.sanitizeCellHtml('<div style="background:url(javascript:alert(1))">x</div>');
  assert.strictEqual(sanitizedStyle.includes("style="), false);
  assert.strictEqual(sanitizedStyle.includes("javascript:"), false);

  const safeStyle = view.sanitizeCellHtml('<span class="bar"><i style="width:50%"></i></span>');
  assert.ok(safeStyle.includes('class="bar"'));
  assert.ok(safeStyle.includes('style="width:50%"'));

  const svg = view.sanitizeCellHtml('<svg><animate onbegin=alert(1) attributeName=x /></svg><span>ok</span>');
  assert.strictEqual(svg.includes("<svg"), false);
  assert.strictEqual(svg.includes("<animate"), false);
  assert.strictEqual(svg.includes("onbegin"), false);
  assert.ok(svg.includes("<span>ok</span>"));
});

test("html sanitizer removes entity-obfuscated unsafe urls", () => {
  const view = new SpanGridCanvasView(null, new SpanGridControl());

  const encodedAlpha = view.sanitizeCellHtml('<a href="jav&#x61;script:alert(1)">x</a>');
  const encodedLeading = view.sanitizeCellHtml('<a href="&#106;avascript:alert(1)">x</a>');
  const encodedColon = view.sanitizeCellHtml('<a href="javascript&#x3a;alert(1)">x</a>');

  assert.strictEqual(encodedAlpha.includes("href"), false);
  assert.strictEqual(encodedLeading.includes("href"), false);
  assert.strictEqual(encodedColon.includes("href"), false);
  assert.doesNotThrow(() => view.sanitizeCellHtml('<a href="&#999999999999999999999999;">x</a>'));
});

test("html overlay renders visible html cells only", () => {
  const previousWindow = global.window;
  const previousDocument = global.document;
  global.window = createEventTargetMock({ devicePixelRatio: 1 });
  global.document = {
    createElement(tagName) {
      return createElementMock(tagName);
    },
  };

  const parent = createElementMock("div");
  const ctx = createCanvasContextMock();
  const canvas = createEventTargetMock({
    width: 120,
    height: 80,
    clientWidth: 120,
    clientHeight: 80,
    offsetLeft: 0,
    offsetTop: 0,
    style: {},
    parentElement: parent,
    tabIndex: 0,
    hasAttribute(name) {
      return name === "tabindex";
    },
    getContext() {
      return ctx;
    },
    getBoundingClientRect() {
      return { left: 0, top: 0 };
    },
    focus() {},
  });

  try {
    const grid = new SpanGridControl({ width: 120, height: 80 });
    for (let index = 0; index < 10; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
    for (let index = 0; index < 10; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
    grid.getCell(0, 0).mode = "html";
    grid.getCell(0, 0).text = '<span class="pill">Visible</span>';
    grid.getCell(9, 9).mode = "html";
    grid.getCell(9, 9).text = '<span class="pill">Hidden</span>';

    const view = new SpanGridCanvasView(canvas, grid);
    view.draw();

    assert.ok(view.htmlLayer);
    assert.strictEqual(view.htmlCellNodes.size, 1);
    const node = view.htmlCellNodes.get("0:0");
    assert.ok(node);
    assert.ok(node.innerHTML.includes("Visible"));
    assert.strictEqual(view.htmlCellNodes.has("9:9"), false);

    view.destroy();
    assert.strictEqual(parent.children.length, 0);
  } finally {
    global.window = previousWindow;
    global.document = previousDocument;
  }
});

test("showcase can hand the current grid snapshot to the editor", () => {
  const showcase = readRepoFile("examples/spangrid/showcase.html");
  const editor = readRepoFile("examples/spangrid/index.html");

  assert.ok(showcase.includes("SPAN_GRID_SHOWCASE_EDIT_KEY"));
  assert.ok(showcase.includes("sessionStorage.setItem"));
  assert.ok(showcase.includes("index.html?source=showcase"));
  assert.ok(editor.includes("readShowcaseEditSnapshot"));
  assert.ok(editor.includes("SpanGridControl.fromJSON(snapshot.grid"));
});

test("showcase exposes readonly rendering mode", () => {
  const showcase = readRepoFile("examples/spangrid/showcase.html");

  assert.ok(showcase.includes('id="readonly"'));
  assert.ok(showcase.includes("view.readonly"));
  assert.ok(showcase.includes("readonly.checked"));
});

test("repository browser examples load the workspace source path", () => {
  const index = readRepoFile("examples/spangrid/index.html");
  const showcase = readRepoFile("examples/spangrid/showcase.html");

  for (const html of [index, showcase]) {
    assert.ok(!html.includes('src="./span-grid.js"'));
    assert.ok(!html.includes('src="./src/span-grid.js"'));
    assert.ok(html.includes('src="../../packages/spangrid/src/span-grid.js"'));
  }
});

test("divider hit testing uses row and column geometry instead of merged cell bounds", () => {
  const grid = new SpanGridControl({ width: 220, height: 140 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));
  grid.mergeCells(0, 0, 1, 0);
  grid.mergeCells(0, 1, 0, 2);

  const view = new SpanGridCanvasView(null, grid);
  const firstRowBottom = grid.getCell(0, 1).bounds.y + grid.rows[0].height;
  const firstColRight = grid.getCell(1, 0).bounds.x + grid.cols[0].width;

  assert.strictEqual(view.rowDividerAt({ x: 10, y: firstRowBottom }, 4).index, 0);
  assert.strictEqual(view.colDividerAt({ x: firstColRight, y: 10 }, 4).index, 0);
});

test("mergeCells rejects overlapping merges and fromJSON skips invalid overlaps", () => {
  const grid = new SpanGridControl({ width: 240, height: 160 });
  for (let index = 0; index < 3; index += 1) grid.addCol(new SpanGridCol({ width: 50 }));
  for (let index = 0; index < 3; index += 1) grid.addRow(new SpanGridRow({ height: 26 }));

  grid.mergeCells(0, 0, 1, 1);
  assert.throws(() => grid.mergeCells(1, 1, 2, 2), /overlap/i);
  assert.strictEqual(grid.merges.length, 1);

  const restored = SpanGridControl.fromJSON({
    cols: [{ width: 50 }, { width: 50 }, { width: 50 }],
    rows: [{ height: 26 }, { height: 26 }, { height: 26 }],
    merges: [
      { start: { row: 0, col: 0 }, end: { row: 1, col: 1 } },
      { start: { row: 1, col: 1 }, end: { row: 2, col: 2 } },
    ],
  });
  assert.strictEqual(restored.merges.length, 1);
});

test("vector export helpers return SVG strings and are documented", () => {
  const grid = new SpanGridControl({ width: 160, height: 100 });
  grid.addCol(new SpanGridCol({ width: 70 }));
  grid.addRow(new SpanGridRow({ height: 30 }));
  grid.getCell(0, 0).text = "<Export & Check>";
  grid.selectCell(0, 0);

  const svg = grid.toSVG();
  const vector = grid.toVector();

  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes("&lt;Export &amp; Check&gt;"));
  assert.ok(vector.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(vector.includes("&lt;Export &amp; Check&gt;"));
  assert.strictEqual(grid.selectedCell, grid.getCell(0, 0));

  const api = readRepoFile("docs/spangrid/API.md");
  assert.ok(api.includes("toImage()"));
  assert.ok(api.includes("toSVG()"));
  assert.ok(api.includes("toVector()"));
});

test("repository docs describe package paths and npm entrypoints", () => {
  const readme = readPackageFile("README.md");
  const api = readRepoFile("docs/spangrid/API.md");
  const usage = readRepoFile("docs/spangrid/USAGE.md");

  for (const doc of [readme, api, usage]) {
    assert.ok(!doc.includes('src="./span-grid.js"'));
  }
  assert.ok(readme.includes('src="./src/span-grid.js"'));
  assert.ok(api.includes('src="./src/span-grid.js"'));
  assert.ok(usage.includes('src="./src/span-grid.js"'));
  assert.ok(api.includes('require("@pomelo-suite/spangrid")'));
  assert.ok(readme.includes('require("@pomelo-suite/spangrid")'));
  assert.ok(!readme.includes("- `span-grid.js`"));
  assert.ok(!readme.includes("- `index.html`"));
  assert.ok(!readme.includes("- `showcase.html`"));
  assert.ok(!readme.includes("- `span-grid.test.js`"));
});

test("background image layout honors align and stretch properties", () => {
  const grid = new SpanGridControl();
  const view = new SpanGridCanvasView(null, grid);
  const cell = new SpanGridCell({
    backgroundImage: { complete: true, width: 20, height: 10 },
    backgroundImageLayout: "None",
    backgroundImageAlign: "BottomRight",
  });
  cell.bounds = { x: 10, y: 20, width: 100, height: 50 };
  const calls = [];
  const ctx = {
    drawImage: (...args) => calls.push(args),
    createPattern: () => null,
    fillRect: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    rect: () => {},
    clip: () => {},
  };

  view.drawBackgroundImage(ctx, cell);
  assert.deepStrictEqual(calls[0], [cell.backgroundImage, 90, 60]);

  calls.length = 0;
  cell.backgroundImageLayout = "Stretch";
  view.drawBackgroundImage(ctx, cell);
  assert.deepStrictEqual(calls[0], [cell.backgroundImage, 10, 20, 100, 50]);
});

test("browser helpers expose a demo grid and smoke checks", () => {
  assert.strictEqual(typeof SpanGridCanvasView, "function");

  const grid = createDemoGrid();
  assert.ok(grid.rows.length >= 4);
  assert.ok(grid.cols.length >= 4);
  assert.ok(grid.merges.length >= 1);
  assert.strictEqual(grid.getCell(0, 0).text, "Header");

  const result = runSmokeTests();
  assert.strictEqual(result.ok, true);
  assert.ok(result.messages.includes("merge"));
  assert.ok(result.messages.includes("hit-test"));
  assert.ok(result.messages.includes("zoom"));
  assert.ok(result.messages.includes("scroll-mode"));
});

test("package metadata exposes source through modern export map", () => {
  const pkg = JSON.parse(fs.readFileSync(require.resolve("../package.json"), "utf8"));

  assert.strictEqual(pkg.name, "@pomelo-suite/spangrid");
  assert.strictEqual(pkg.version, "0.1.1");
  assert.strictEqual(pkg.license, "MIT");
  assert.strictEqual(pkg.author, "xamongmini");
  assert.strictEqual(pkg.private, false);
  assert.strictEqual(pkg.type, "commonjs");
  assert.deepStrictEqual(pkg.repository, {
    type: "git",
    url: "git+https://github.com/xamongmini/pomelo-suite.git",
    directory: "packages/spangrid",
  });
  assert.deepStrictEqual(pkg.bugs, {
    url: "https://github.com/xamongmini/pomelo-suite/issues",
  });
  assert.strictEqual(pkg.homepage, "https://github.com/xamongmini/pomelo-suite/tree/main/packages/spangrid#readme");
  assert.strictEqual(pkg.main, "src/span-grid.js");
  assert.strictEqual(pkg.browser, "src/span-grid.js");
  assert.deepStrictEqual(pkg.files, ["src", "README.md", "LICENSE"]);
  assert.deepStrictEqual(pkg.exports["."], {
    browser: "./src/span-grid.js",
    require: "./src/span-grid.js",
    default: "./src/span-grid.js",
  });
  assert.strictEqual(pkg.exports["./package.json"], "./package.json");
  assert.deepStrictEqual(pkg.pomeloSuite, { stability: "stable" });
});
