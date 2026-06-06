"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
  var __typeError = (msg) => {
    throw TypeError(msg);
  };
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __await = function(promise, isYieldStar) {
    this[0] = promise;
    this[1] = isYieldStar;
  };
  var __yieldStar = (value) => {
    var obj = value[__knownSymbol("asyncIterator")], isAwait = false, method, it = {};
    if (obj == null) {
      obj = value[__knownSymbol("iterator")]();
      method = (k) => it[k] = (x) => obj[k](x);
    } else {
      obj = obj.call(value);
      method = (k) => it[k] = (v) => {
        if (isAwait) {
          isAwait = false;
          if (k === "throw") throw v;
          return v;
        }
        isAwait = true;
        return {
          done: false,
          value: new __await(new Promise((resolve) => {
            var x = obj[k](v);
            if (!(x instanceof Object)) __typeError("Object expected");
            resolve(x);
          }), 1)
        };
      };
    }
    return it[__knownSymbol("iterator")] = () => it, method("next"), "throw" in obj ? method("throw") : it.throw = (x) => {
      throw x;
    }, "return" in obj && method("return"), it;
  };

  // spanGridFigma.ts
  var SPAN_NOTICES = {
    en: {
      select_then_insert: 'Select a node, then click "Insert Grid".',
      invalid_selection: "Invalid selection.",
      grid_json_invalid: "Grid JSON (rows/cols) is empty or invalid.",
      cannot_insert_parent: "Cannot insert into the parent container.",
      same_parent_only: "Only nodes under the same parent can be replaced at once.",
      no_replaceable: "No replaceable selection found.",
      grid_json_empty: "Grid JSON is empty or invalid.",
      mode_fixed: "Fixed",
      grid_replaced: "[{mode}] Replaced {count} node(s) with grid.",
      grid_added: "[{mode}] Added {count} grid(s).",
      grid_create_failed: "Failed to create grid node(s)."
    }
  };
  var _spanLang = "en";
  function setSpanGridLang(lang) {
    if (SPAN_NOTICES[lang]) _spanLang = lang;
  }
  function sn(key) {
    var _a, _b, _c, _d;
    return (_d = (_c = (_a = SPAN_NOTICES[_spanLang]) == null ? void 0 : _a[key]) != null ? _c : (_b = SPAN_NOTICES["en"]) == null ? void 0 : _b[key]) != null ? _d : key;
  }
  function snf(key, vars) {
    return Object.entries(vars).reduce(
      (s, [k, v]) => s.replace(`{${k}}`, String(v)),
      sn(key)
    );
  }
  function isContainer(node) {
    if (!node) return false;
    const t = node.type;
    return t === "PAGE" || t === "FRAME" || t === "GROUP" || t === "COMPONENT" || t === "INSTANCE";
  }
  function getNodeBounds(node) {
    const x = node.x;
    const y = node.y;
    let w;
    let h;
    if ("width" in node && "height" in node) {
      w = node.width;
      h = node.height;
    } else {
      const b = node.absoluteBoundingBox;
      w = b ? b.width : 100;
      h = b ? b.height : 100;
    }
    return { x, y, w, h };
  }
  function collapseNodeTreeInLayers(root) {
    const withExp = root;
    if (typeof withExp.expanded === "boolean") {
      withExp.expanded = false;
    }
    if ("children" in root) {
      const { children } = root;
      for (const ch of children) {
        collapseNodeTreeInLayers(ch);
      }
    }
  }
  function parsePos(pos) {
    if (!pos) return { x: 0, y: 0, w: 100, h: 100 };
    const parts = pos.split(",").map(Number);
    if (parts.length >= 4) {
      return {
        x: parts[0],
        y: parts[1],
        w: Math.max(1, parts[2]),
        h: Math.max(1, parts[3])
      };
    }
    return { x: 0, y: 0, w: 100, h: 100 };
  }
  function parsePadding(padding) {
    if (!padding) return { top: 0, right: 0, bottom: 0, left: 0 };
    const parts = padding.split(",").map((s) => parseInt(s.trim(), 10));
    if (parts.length >= 4) {
      return { top: parts[0] || 0, right: parts[1] || 0, bottom: parts[2] || 0, left: parts[3] || 0 };
    }
    if (parts.length === 1 && !isNaN(parts[0])) {
      const v = parts[0];
      return { top: v, right: v, bottom: v, left: v };
    }
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  function parseColor(color) {
    var _a, _b, _c, _d;
    if (!color) return { r: 1, g: 1, b: 1, a: 1 };
    const parts = color.split(",").map(Number);
    if (parts.length >= 4) {
      return {
        r: ((_a = parts[0]) != null ? _a : 255) / 255,
        g: ((_b = parts[1]) != null ? _b : 255) / 255,
        b: ((_c = parts[2]) != null ? _c : 255) / 255,
        a: ((_d = parts[3]) != null ? _d : 255) / 255
      };
    }
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  function solidPaintFromParsed(c) {
    const opacity = Math.max(
      0,
      Math.min(1, typeof c.a === "number" && Number.isFinite(c.a) ? c.a : 1)
    );
    return { type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity };
  }
  function normalizeColorForXcon(raw) {
    if (!raw || typeof raw !== "string") return void 0;
    const s = raw.trim();
    if (s.startsWith("#")) {
      let h = s.slice(1);
      if (h.length === 3) {
        h = h.split("").map((ch) => ch + ch).join("");
      }
      if (h.length !== 6) return void 0;
      const n2 = parseInt(h, 16);
      if (Number.isNaN(n2)) return void 0;
      const r = n2 >> 16 & 255;
      const g = n2 >> 8 & 255;
      const b = n2 & 255;
      return `${r},${g},${b},255`;
    }
    const rgbaMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(s);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      const a = rgbaMatch[4] !== void 0 ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255;
      return `${r},${g},${b},${a}`;
    }
    return s;
  }
  function spanAlignmentParts(textAlign) {
    const s = (textAlign || "MiddleCenter").toString();
    const valign = s.startsWith("Top") ? "top" : s.startsWith("Bottom") ? "bottom" : "middle";
    const align = s.endsWith("Left") ? "left" : s.endsWith("Right") ? "right" : "center";
    return { valign, align };
  }
  function fontSizeFromSpanFont(font, fallback) {
    if (!font || typeof font !== "string") return Math.max(4, Math.min(400, Math.floor(fallback)));
    const m = font.match(/(\d+(\.\d+)?)(pt|px)/i);
    if (m) {
      const n2 = parseFloat(m[1]);
      if (Number.isFinite(n2)) {
        if (/pt/i.test(m[3])) return Math.max(4, Math.min(400, Math.round(n2 * 1.333)));
        return Math.max(4, Math.min(400, Math.round(n2)));
      }
    }
    return Math.max(4, Math.min(400, Math.floor(fallback)));
  }
  function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
  }
  var BG_TOP = 1;
  var BG_BOTTOM = 2;
  var BG_RIGHT = 4;
  var BG_LEFT = 8;
  function defaultSpanGridBorder() {
    return {
      topColor: "#e2e8f0",
      rightColor: "#e2e8f0",
      bottomColor: "#e2e8f0",
      leftColor: "#e2e8f0",
      borderDirection: 15,
      lineStyle: "Solid",
      lineWidth: 1
    };
  }
  function computeCellBorderXconFieldsCenter(b) {
    var _a, _b, _c, _d;
    const dir = typeof b.borderDirection === "number" && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
    const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));
    const leftW = dir & BG_LEFT ? Math.max(0, Math.min(20, Math.round(Number((_a = b.leftLineWidth) != null ? _a : baseW)))) : 0;
    const topW = dir & BG_TOP ? Math.max(0, Math.min(20, Math.round(Number((_b = b.topLineWidth) != null ? _b : baseW)))) : 0;
    const rightW = dir & BG_RIGHT ? Math.max(0, Math.min(20, Math.round(Number((_c = b.rightLineWidth) != null ? _c : baseW)))) : 0;
    const bottomW = dir & BG_BOTTOM ? Math.max(0, Math.min(20, Math.round(Number((_d = b.bottomLineWidth) != null ? _d : baseW)))) : 0;
    if (leftW + topW + rightW + bottomW === 0) return { border: "false" };
    const cStr = b.leftColor || b.topColor || b.rightColor || b.bottomColor || "#e2e8f0";
    const rgba = normalizeColorForXcon(cStr) || "226,232,240,255";
    return {
      border: "true",
      borderWidth: "-1",
      borderColor: rgba,
      borderTop: String(topW),
      borderRight: String(rightW),
      borderBottom: String(bottomW),
      borderLeft: String(leftW),
      _strokeCenter: "true"
    };
  }
  function applyBorderToFigmaFrameCenter(fr, b) {
    var _a, _b, _c, _d;
    const dir = typeof b.borderDirection === "number" && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
    const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));
    const leftW = dir & BG_LEFT ? Math.max(0, Math.min(20, Math.round(Number((_a = b.leftLineWidth) != null ? _a : baseW)))) : 0;
    const topW = dir & BG_TOP ? Math.max(0, Math.min(20, Math.round(Number((_b = b.topLineWidth) != null ? _b : baseW)))) : 0;
    const rightW = dir & BG_RIGHT ? Math.max(0, Math.min(20, Math.round(Number((_c = b.rightLineWidth) != null ? _c : baseW)))) : 0;
    const bottomW = dir & BG_BOTTOM ? Math.max(0, Math.min(20, Math.round(Number((_d = b.bottomLineWidth) != null ? _d : baseW)))) : 0;
    if (leftW + topW + rightW + bottomW === 0) {
      fr.strokes = [];
      return;
    }
    const cStr = b.leftColor || b.topColor || b.rightColor || b.bottomColor || "#e2e8f0";
    const bc = parseColor(normalizeColorForXcon(cStr) || "226,232,240,255");
    fr.strokes = [solidPaintFromParsed(bc)];
    fr.strokeAlign = "CENTER";
    fr.strokeTopWeight = topW;
    fr.strokeRightWeight = rightW;
    fr.strokeBottomWeight = bottomW;
    fr.strokeLeftWeight = leftW;
  }
  function mergeSpanGridBorders(grid, col, row, cell) {
    return __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({}, defaultSpanGridBorder()), grid || {}), col || {}), row || {}), cell || {});
  }
  function spanBorderToXconFields(b) {
    var _a, _b, _c, _d;
    const dir = typeof b.borderDirection === "number" && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
    const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));
    const topW = dir & BG_TOP ? Math.max(0, Math.min(20, Math.round(Number((_a = b.topLineWidth) != null ? _a : baseW)))) : 0;
    const bottomW = dir & BG_BOTTOM ? Math.max(0, Math.min(20, Math.round(Number((_b = b.bottomLineWidth) != null ? _b : baseW)))) : 0;
    const rightW = dir & BG_RIGHT ? Math.max(0, Math.min(20, Math.round(Number((_c = b.rightLineWidth) != null ? _c : baseW)))) : 0;
    const leftW = dir & BG_LEFT ? Math.max(0, Math.min(20, Math.round(Number((_d = b.leftLineWidth) != null ? _d : baseW)))) : 0;
    const any = topW + bottomW + leftW + rightW > 0;
    if (!any) {
      return { border: "false" };
    }
    const cStr = b.topColor || b.leftColor || b.rightColor || b.bottomColor || "#e2e8f0";
    const rgba = normalizeColorForXcon(cStr) || "226,232,240,255";
    return {
      border: "true",
      borderWidth: "-1",
      borderColor: rgba,
      borderTop: String(topW),
      borderRight: String(rightW),
      borderBottom: String(bottomW),
      borderLeft: String(leftW)
    };
  }
  function fitIntSizes(sizes, target, min = 1) {
    if (sizes.length === 0) return [];
    const t = Math.max(1, Math.floor(target));
    const tot0 = sum(sizes) || 1;
    const raw = sizes.map((s) => s * t / tot0);
    const out = raw.map((r) => Math.max(min, Math.floor(r)));
    let s0 = sum(out);
    let guard = 0;
    for (let i = 0; s0 < t && guard < 1e5; i += 1, guard += 1) {
      out[i % out.length] += 1;
      s0 += 1;
    }
    guard = 0;
    for (let i = out.length - 1; s0 > t && guard < 1e5; i = (i + out.length - 1) % out.length, guard += 1) {
      if (out[i] > min) {
        out[i] -= 1;
        s0 -= 1;
      }
    }
    return out;
  }
  function buildSpanGridTableXcon(data) {
    var _a, _b, _c;
    const cols = data.cols || [];
    const rows = data.rows || [];
    const colW = cols.map((c) => Math.max(1, Math.floor(Number(c.width) || 40)));
    const rowH = rows.map((r) => Math.max(1, Math.floor(Number(r.height) || 24)));
    const N = colW.length;
    const M = rowH.length;
    const colPrefix = [0];
    for (let i = 0; i < N; i += 1) colPrefix.push(colPrefix[i] + colW[i]);
    const rowPrefix = [0];
    for (let i = 0; i < M; i += 1) rowPrefix.push(rowPrefix[i] + rowH[i]);
    const totalW = colPrefix[N] + N + 1;
    const totalH = rowPrefix[M] + M + 1;
    const zoom = data.gridZoom != null && data.gridZoom > 0 ? data.gridZoom : 1;
    const rootW = Math.max(1, data.gridW != null ? Math.round(data.gridW / zoom) : totalW);
    const rootH = Math.max(1, data.gridH != null ? Math.round(data.gridH / zoom) : totalH);
    const rowBuckets = Array.from({ length: M }, () => []);
    const mergedAtRoot = [];
    for (const cell of data.cells || []) {
      const r = cell.row;
      const c = cell.col;
      if (r < 0 || c < 0 || r >= M || c >= N) continue;
      const mr = Math.max(0, Math.floor((_a = cell.mergeRight) != null ? _a : 0));
      const md = Math.max(0, Math.floor((_b = cell.mergeDown) != null ? _b : 0));
      const cEnd = Math.min(N - 1, c + mr);
      const rEnd = Math.min(M - 1, r + md);
      const cw = colPrefix[cEnd + 1] - colPrefix[c] + (cEnd - c);
      const ch = rowPrefix[rEnd + 1] - rowPrefix[r] + (rEnd - r);
      const align = (cell.align || "left").toLowerCase();
      const valign = (cell.valign || "middle").toLowerCase();
      const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
      const textVAlign = valign === "top" ? "top" : valign === "bottom" ? "bottom" : "middle";
      const fs = Math.max(4, Math.min(400, Math.floor(Number(cell.fs) || 12)));
      const fg = normalizeColorForXcon(cell.fg) || "30,41,59,255";
      const bg = (_c = normalizeColorForXcon(cell.bg)) != null ? _c : "255,255,255,255";
      const xInRow = 1 + colPrefix[c] + c;
      const xRoot = 1 + colPrefix[c] + c;
      const yRoot = 1 + rowPrefix[r] + r;
      const label = {
        type: "label",
        name: `cell_${r}_${c}`,
        pos: md > 0 ? `${xRoot},${yRoot},${cw},${ch}` : `${xInRow},0,${cw},${ch}`,
        text: cell.text != null && String(cell.text) !== "" ? String(cell.text) : " ",
        fontSize: String(fs),
        font: "Inter",
        fgColor: fg,
        bgColor: bg,
        textAlign,
        textVAlign
      };
      if (cell.border) {
        const bFields = computeCellBorderXconFieldsCenter(cell.border);
        Object.assign(label, bFields);
      } else {
        label.border = "false";
      }
      if (cell.bold) label.bold = true;
      if (cell.italic) label.italic = true;
      if (md > 0) {
        mergedAtRoot.push(label);
      } else {
        rowBuckets[r].push({ c, node: label });
      }
    }
    const components = {};
    for (let r = 0; r < M; r += 1) {
      rowBuckets[r].sort((a, b) => a.c - b.c);
      const rowComponents = {};
      rowBuckets[r].forEach((item, i) => {
        rowComponents[`cell_${item.c}_${i}`] = item.node;
      });
      const rh = rowH[r];
      components[`row_${r}`] = {
        type: "panel",
        name: `Row ${r + 1}`,
        pos: `0,${1 + rowPrefix[r] + r},${Math.max(1, rootW)},${rh}`,
        bgColor: "0,0,0,0",
        clipContent: "false",
        components: rowComponents
      };
    }
    if (mergedAtRoot.length > 0) {
      const mergedComponents = {};
      mergedAtRoot.forEach((node, i) => {
        mergedComponents[`merged_${i}`] = node;
      });
      components.mergedCells = {
        type: "panel",
        name: "mergedCells",
        pos: `0,0,${Math.max(1, rootW)},${Math.max(1, rootH)}`,
        bgColor: "0,0,0,0",
        clipContent: "false",
        components: mergedComponents
      };
    }
    const rootBackColor = (data.backColor ? normalizeColorForXcon(data.backColor) : void 0) || "255,255,255,255";
    const rootNode = {
      type: "panel",
      name: "xGrid",
      pos: `0,0,${Math.max(1, rootW)},${Math.max(1, rootH)}`,
      bgColor: rootBackColor,
      clipContent: "true",
      components
    };
    if (data.gridBorder) {
      const gf = spanBorderToXconFields(data.gridBorder);
      Object.assign(rootNode, gf);
    }
    return rootNode;
  }
  var globalFallbacks = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Bold" },
    { family: "Roboto", style: "Regular" }
  ];
  var fontCache = /* @__PURE__ */ new Map();
  function fontCacheKey(f) {
    return f.family + "\0" + f.style;
  }
  function cssFontWeightToFigmaStyle(weight) {
    if (weight === void 0 || weight === null) return "Regular";
    const raw = typeof weight === "number" ? String(weight) : String(weight).trim();
    if (!raw) return "Regular";
    const w = raw.toLowerCase();
    if (w === "normal" || w === "regular" || w === "400") return "Regular";
    if (w === "medium" || w === "500") return "Medium";
    if (w === "semibold" || w === "semi-bold" || w === "600" || w === "demi bold" || w === "demi") return "Semi Bold";
    if (w === "bold" || w === "700") return "Bold";
    if (w === "extrabold" || w === "extra-bold" || w === "800") return "Extra Bold";
    if (w === "black" || w === "900" || w === "heavy") return "Black";
    if (w === "light" || w === "300") return "Light";
    if (w === "thin" || w === "100") return "Thin";
    if (w === "200") return "Extra Light";
    if (/^\d+$/.test(raw)) {
      const n2 = parseInt(raw, 10);
      if (n2 <= 350) return "Light";
      if (n2 <= 450) return "Regular";
      if (n2 <= 550) return "Medium";
      if (n2 <= 650) return "Semi Bold";
      if (n2 <= 750) return "Bold";
      if (n2 <= 850) return "Extra Bold";
      return "Black";
    }
    return raw;
  }
  async function loadFontForStyle(fontFamily, fontWeight) {
    const family = fontFamily || "Inter";
    let style = "Regular";
    if (fontWeight) {
      const w = fontWeight.toLowerCase();
      if (w === "bold") style = "Bold";
      else if (w === "semi-bold" || w === "semibold") style = "Semi Bold";
      else if (w === "medium") style = "Medium";
    }
    const font = { family, style };
    const cacheKey = fontCacheKey(font);
    if (fontCache.has(cacheKey)) {
      return fontCache.get(cacheKey);
    }
    try {
      await figma.loadFontAsync(font);
      fontCache.set(cacheKey, font);
      return font;
    } catch (e) {
      fontCache.set(cacheKey, globalFallbacks[0]);
      return globalFallbacks[0];
    }
  }
  async function ensureTableFonts(_fonts) {
    for (const f of globalFallbacks) {
      await loadFontForStyle(f.family, f.style);
    }
  }
  function applyFrameStrokesFromXconData(fr, data) {
    if (data.border === "false" || !data.borderColor) {
      return;
    }
    if (data.border !== "true") {
      return;
    }
    const sa = data._strokeCenter === "true" ? "CENTER" : "INSIDE";
    const bw = parseInt(String(data.borderWidth || "0"), 10);
    const bc = parseColor(String(data.borderColor));
    if (bw === -1) {
      const d = data;
      const bl = parseInt(String(d.borderLeft || "0"), 10);
      const bt = parseInt(String(d.borderTop || "0"), 10);
      const brW = parseInt(String(d.borderRight || "0"), 10);
      const bb = parseInt(String(d.borderBottom || "0"), 10);
      fr.strokes = [solidPaintFromParsed(bc)];
      fr.strokeTopWeight = !isNaN(bt) && bt >= 0 ? bt : 0;
      fr.strokeRightWeight = !isNaN(brW) && brW >= 0 ? brW : 0;
      fr.strokeBottomWeight = !isNaN(bb) && bb >= 0 ? bb : 0;
      fr.strokeLeftWeight = !isNaN(bl) && bl >= 0 ? bl : 0;
      fr.strokeAlign = sa;
    } else if (!isNaN(bw) && bw > 0) {
      fr.strokes = [solidPaintFromParsed(bc)];
      fr.strokeWeight = bw;
      fr.strokeAlign = sa;
    }
  }
  async function loadFontForLabel(data) {
    const font = { family: data.font || "Inter", style: cssFontWeightToFigmaStyle(data.fontWeight) };
    if (data.bold) font.style = "Bold";
    if (data.italic) font.style = "Italic";
    return loadFontForStyle(font.family, font.style);
  }
  async function createNodeFromXconData(data, childKey) {
    if (data.visible === "false") return null;
    const type = (data.type || data.polymorph || "panel").toLowerCase();
    const { x, y, w, h } = parsePos(data.pos);
    const name = data.name || data.id || childKey || type;
    if (type === "panel" || type === "xform") {
      const frame = figma.createFrame();
      frame.x = x;
      frame.y = y;
      frame.resize(w, h);
      frame.name = name;
      const bg = parseColor(data.bgColor);
      frame.fills = [solidPaintFromParsed(bg)];
      const bw = parseInt(data.borderWidth || "0", 10);
      if (data.border === "true" && data.borderColor) {
        const bc = parseColor(data.borderColor || "0,0,0,255");
        if (!isNaN(bw) && bw > 0) {
          frame.strokes = [solidPaintFromParsed(bc)];
          frame.strokeWeight = bw;
          frame.strokeAlign = "INSIDE";
        }
      }
      const r = data.round;
      if (r) {
        const radius = parseInt(String(r), 10);
        if (!isNaN(radius) && radius >= 0) frame.cornerRadius = radius;
      }
      frame.clipsContent = data.clipContent === "true";
      const pad = parsePadding(data.padding);
      frame.paddingLeft = pad.left;
      frame.paddingRight = pad.right;
      frame.paddingTop = pad.top;
      frame.paddingBottom = pad.bottom;
      if (data.components && typeof data.components === "object") {
        const allKeys = Object.keys(data.components);
        const ordered = data.componentsOrder ? (() => {
          const fromOrder = data.componentsOrder.split(",").map((k) => k.trim()).filter(Boolean);
          const set = new Set(fromOrder);
          return [
            ...fromOrder.filter((k) => allKeys.includes(k)),
            ...allKeys.filter((k) => !set.has(k))
          ];
        })() : allKeys;
        for (const key of ordered) {
          const childData = data.components[key];
          if (!childData || typeof childData !== "object") continue;
          const childNode = await createNodeFromXconData(childData, key);
          if (childNode) frame.appendChild(childNode);
        }
      }
      return frame;
    }
    if (type === "label") {
      const font = await loadFontForLabel(data);
      const fg = data.fgColor ? parseColor(data.fgColor) : { r: 0, g: 0, b: 0, a: 1 };
      const fs = parseInt(data.fontSize || "12", 10);
      const fontSize = isNaN(fs) ? 12 : Math.max(4, Math.min(400, fs));
      const characters = (data.text != null ? data.text : "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      if (data.bgColor) {
        const fr = figma.createFrame();
        fr.x = x;
        fr.y = y;
        fr.resize(w, h);
        fr.name = name;
        fr.layoutMode = "HORIZONTAL";
        fr.primaryAxisSizingMode = "FIXED";
        fr.counterAxisSizingMode = "FIXED";
        const ta = data.textAlign;
        fr.primaryAxisAlignItems = ta === "center" ? "CENTER" : ta === "right" ? "MAX" : "MIN";
        fr.counterAxisAlignItems = "CENTER";
        fr.paddingLeft = 4;
        fr.paddingRight = 4;
        fr.paddingTop = 2;
        fr.paddingBottom = 2;
        fr.clipsContent = true;
        const bg2 = parseColor(data.bgColor);
        fr.fills = [solidPaintFromParsed(bg2)];
        applyFrameStrokesFromXconData(fr, data);
        const text = figma.createText();
        text.name = `${name}_text`;
        text.fontName = font;
        text.characters = characters;
        text.fontSize = fontSize;
        text.fills = [{ type: "SOLID", color: { r: fg.r, g: fg.g, b: fg.b } }];
        const tah = data.textAlign;
        text.textAlignHorizontal = tah === "center" ? "CENTER" : tah === "right" ? "RIGHT" : "LEFT";
        const tva = data.textVAlign || "";
        const vl = tva.toLowerCase();
        text.textAlignVertical = vl === "middle" || vl === "center" ? "CENTER" : vl === "bottom" ? "BOTTOM" : "TOP";
        fr.appendChild(text);
        text.layoutSizingHorizontal = "FILL";
        text.layoutSizingVertical = "FIXED";
        return fr;
      }
      const tnode = figma.createText();
      tnode.x = x;
      tnode.y = y;
      tnode.fontName = font;
      tnode.characters = characters;
      tnode.fontSize = fontSize;
      tnode.name = name;
      tnode.fills = [{ type: "SOLID", color: { r: fg.r, g: fg.g, b: fg.b } }];
      if (w >= 1 && h >= 1) tnode.resize(w, h);
      if (data.textAlign === "center") tnode.textAlignHorizontal = "CENTER";
      else if (data.textAlign === "right") tnode.textAlignHorizontal = "RIGHT";
      const tva2 = data.textVAlign || "";
      if (tva2.toLowerCase() === "middle" || tva2.toLowerCase() === "center") tnode.textAlignVertical = "CENTER";
      else if (tva2.toLowerCase() === "bottom") tnode.textAlignVertical = "BOTTOM";
      else tnode.textAlignVertical = "TOP";
      return tnode;
    }
    return null;
  }
  function asRowsCols(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return null;
    const o = snapshot;
    if (!Array.isArray(o.rows) || o.rows.length === 0) return null;
    const colArr = Array.isArray(o.cols) ? o.cols : [];
    const merges = Array.isArray(o.merges) ? o.merges : [];
    return {
      rows: o.rows,
      cols: colArr,
      merges,
      name: typeof o.name === "string" ? o.name : "SpanGrid",
      gridBorder: o.gridBorder,
      backColor: typeof o.backColor === "string" ? o.backColor : void 0,
      gridW: typeof o.width === "number" && o.width > 0 ? Math.round(o.width) : void 0,
      gridH: typeof o.height === "number" && o.height > 0 ? Math.round(o.height) : void 0,
      gridZoom: typeof o.zoom === "number" && o.zoom > 0 ? o.zoom : void 0
    };
  }
  function getCellData(rows, r, c) {
    const row = rows[r];
    const cells = row && Array.isArray(row.cells) ? row.cells : [];
    return typeof cells[c] === "object" && cells[c] != null ? cells[c] : {};
  }
  function spanGridToExportPayload(snapshot, targetW, targetH) {
    var _a, _b, _c, _d, _e, _f, _g;
    const p = asRowsCols(snapshot);
    if (!p) return null;
    const { rows, cols: colSrc, merges, name: gridName, gridBorder: gridBorderRaw } = p;
    const gridB = gridBorderRaw;
    const rowCount = rows.length;
    const cellWCount = Math.max(
      colSrc.length,
      ...rows.map((row) => {
        const c = row == null ? void 0 : row.cells;
        return Array.isArray(c) ? c.length : 0;
      })
    );
    if (rowCount === 0 || cellWCount === 0) return null;
    const colWidthsRaw = [];
    for (let c = 0; c < cellWCount; c += 1) {
      const fromCol = colSrc[c];
      const w0 = fromCol && typeof fromCol.width === "number" && fromCol.width > 0 ? fromCol.width : 80;
      colWidthsRaw.push(w0);
    }
    const rowHeightsRaw = rows.map((row) => {
      const h0 = row.height != null && row.height > 0 ? row.height : 24;
      return h0;
    });
    const totalH0 = sum(rowHeightsRaw) || 1;
    const tw = Math.max(1, targetW);
    const th = Math.max(1, targetH);
    const colW = fitIntSizes(colWidthsRaw, tw, 1);
    const rowH = fitIntSizes(rowHeightsRaw, th, 1);
    const nR = rowCount;
    const nC = colW.length;
    const skip = Array.from({ length: nR }, () => Array(nC).fill(false));
    for (const m of merges) {
      const sr0 = (_a = m.start) == null ? void 0 : _a.row;
      const sc0 = (_b = m.start) == null ? void 0 : _b.col;
      const er0 = (_c = m.end) == null ? void 0 : _c.row;
      const ec0 = (_d = m.end) == null ? void 0 : _d.col;
      if (!Number.isInteger(sr0) || !Number.isInteger(sc0) || !Number.isInteger(er0) || !Number.isInteger(ec0)) {
        continue;
      }
      const r1 = Math.max(0, Math.min(nR - 1, Math.min(sr0, er0)));
      const r2 = Math.max(0, Math.min(nR - 1, Math.max(sr0, er0)));
      const c1 = Math.max(0, Math.min(nC - 1, Math.min(sc0, ec0)));
      const c2 = Math.max(0, Math.min(nC - 1, Math.max(sc0, ec0)));
      for (let r = r1; r <= r2; r += 1) {
        for (let c = c1; c <= c2; c += 1) {
          if (r === r1 && c === c1) continue;
          skip[r][c] = true;
        }
      }
    }
    const mergeSizeAt = (r, c) => {
      var _a2, _b2, _c2, _d2;
      for (const m of merges) {
        const sr0 = (_a2 = m.start) == null ? void 0 : _a2.row;
        const sc0 = (_b2 = m.start) == null ? void 0 : _b2.col;
        const er0 = (_c2 = m.end) == null ? void 0 : _c2.row;
        const ec0 = (_d2 = m.end) == null ? void 0 : _d2.col;
        if (!Number.isInteger(sr0) || !Number.isInteger(sc0) || !Number.isInteger(er0) || !Number.isInteger(ec0)) {
          continue;
        }
        const topR = Math.min(sr0, er0);
        const topC = Math.min(sc0, ec0);
        if (r !== topR || c !== topC) continue;
        const r2 = Math.max(sr0, er0);
        const c2 = Math.max(sc0, ec0);
        return { mergeRight: c2 - topC, mergeDown: r2 - topR };
      }
      return null;
    };
    const scaleFs = 12 * (th / (totalH0 || 1));
    const cells = [];
    for (let r = 0; r < nR; r += 1) {
      for (let c = 0; c < nC; c += 1) {
        if (skip[r][c]) continue;
        const mrg = mergeSizeAt(r, c);
        const mergeRight = mrg ? mrg.mergeRight : 0;
        const mergeDown = mrg ? mrg.mergeDown : 0;
        const raw = getCellData(rows, r, c);
        const { align, valign } = spanAlignmentParts(raw.textAlign);
        const fs = fontSizeFromSpanFont(raw.font, scaleFs);
        const colEnt = colSrc[c];
        const rowEnt = rows[r];
        const merged = mergeSpanGridBorders(
          gridB,
          (_e = colEnt == null ? void 0 : colEnt.border) != null ? _e : void 0,
          (_f = rowEnt == null ? void 0 : rowEnt.border) != null ? _f : void 0,
          (_g = raw.border) != null ? _g : void 0
        );
        cells.push({
          name: raw.name != null ? String(raw.name) : "",
          row: r,
          col: c,
          text: raw.text != null ? String(raw.text) : "",
          align,
          valign,
          bg: normalizeColorForXcon(raw.backColor) || "255,255,255,255",
          fg: normalizeColorForXcon(raw.foreColor) || "30,41,59,255",
          fs,
          mergeRight,
          mergeDown,
          border: merged
        });
      }
    }
    return {
      name: gridName || "SpanGrid",
      cols: colW.map((w, i) => ({ name: `Col ${i + 1}`, width: w })),
      rows: rowH.map((h, i) => ({ name: `Row ${i + 1}`, height: h })),
      cells,
      backColor: normalizeColorForXcon(p.backColor) || void 0,
      gridBorder: gridB != null ? gridB : defaultSpanGridBorder(),
      gridW: p.gridW,
      gridH: p.gridH,
      gridZoom: p.gridZoom
    };
  }
  function spanGridToNaturalPayload(snapshot) {
    var _a;
    const p = asRowsCols(snapshot);
    if (!p) return null;
    const { rows, cols: colSrc } = p;
    const cellWCount = Math.max(
      colSrc.length,
      ...rows.map((row) => {
        const c = row == null ? void 0 : row.cells;
        return Array.isArray(c) ? c.length : 0;
      })
    );
    if (rows.length === 0 || cellWCount === 0) return null;
    const colWidthsRaw = [];
    for (let c = 0; c < cellWCount; c++) {
      const fromCol = colSrc[c];
      colWidthsRaw.push(Math.max(1, Math.round((_a = fromCol == null ? void 0 : fromCol.width) != null ? _a : 80)));
    }
    const rowHeightsRaw = rows.map(
      (row) => {
        var _a2;
        return Math.max(1, Math.round((_a2 = row.height) != null ? _a2 : 24));
      }
    );
    return spanGridToExportPayload(snapshot, sum(colWidthsRaw) || 1, sum(rowHeightsRaw) || 1);
  }
  async function buildAutoLayoutCell(cell, w, h, _r, _c, _nRows, _nCols) {
    var _a, _b;
    const fr = figma.createFrame();
    fr.name = `cell_${cell.row}_${cell.col}`;
    fr.layoutMode = "HORIZONTAL";
    fr.primaryAxisSizingMode = "FIXED";
    fr.counterAxisSizingMode = "FIXED";
    fr.resize(Math.max(1, w), Math.max(1, h));
    fr.itemSpacing = 0;
    fr.clipsContent = true;
    fr.paddingLeft = 4;
    fr.paddingRight = 4;
    fr.paddingTop = 2;
    fr.paddingBottom = 2;
    const ta = (cell.align || "left").toLowerCase();
    const va = (cell.valign || "middle").toLowerCase();
    fr.primaryAxisAlignItems = ta === "center" ? "CENTER" : ta === "right" ? "MAX" : "MIN";
    fr.counterAxisAlignItems = va === "top" ? "MIN" : va === "bottom" ? "MAX" : "CENTER";
    const bg = parseColor((_a = cell.bg) != null ? _a : "255,255,255,255");
    fr.fills = [solidPaintFromParsed(bg)];
    if (cell.border) {
      applyBorderToFigmaFrameCenter(fr, cell.border);
    } else {
      fr.strokes = [];
    }
    const fontStyle = cell.bold ? "Bold" : "Regular";
    const font = await loadFontForStyle("Inter", fontStyle);
    const characters = (cell.text != null && String(cell.text) !== "" ? String(cell.text) : " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const fs = Math.max(4, Math.min(400, Math.floor(Number(cell.fs) || 12)));
    const fg = parseColor((_b = cell.fg) != null ? _b : "30,41,59,255");
    const text = figma.createText();
    text.name = `${fr.name}_txt`;
    text.fontName = font;
    text.characters = characters;
    text.fontSize = fs;
    text.fills = [{ type: "SOLID", color: { r: fg.r, g: fg.g, b: fg.b } }];
    text.textAlignHorizontal = ta === "center" ? "CENTER" : ta === "right" ? "RIGHT" : "LEFT";
    text.textAlignVertical = va === "middle" || va === "center" ? "CENTER" : va === "bottom" ? "BOTTOM" : "TOP";
    fr.appendChild(text);
    text.layoutSizingHorizontal = "FILL";
    text.layoutSizingVertical = "FIXED";
    return fr;
  }
  async function buildAutoLayoutTableDirect(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const colW = data.cols.map((c) => Math.max(1, Math.floor(c.width || 40)));
    const rowH = data.rows.map((r) => Math.max(1, Math.floor(r.height || 24)));
    const N = colW.length;
    const M = rowH.length;
    const colPrefix = [0];
    for (const w of colW) colPrefix.push(colPrefix[colPrefix.length - 1] + w);
    const rowPrefix = [0];
    for (const h of rowH) rowPrefix.push(rowPrefix[rowPrefix.length - 1] + h);
    const totalW = Math.max(1, colPrefix[N] + N + 1);
    const totalH = Math.max(1, rowPrefix[M] + M + 1);
    const cellMap = /* @__PURE__ */ new Map();
    for (const cell of data.cells) cellMap.set(`${cell.row}_${cell.col}`, cell);
    const vertCovered = /* @__PURE__ */ new Set();
    for (const cell of data.cells) {
      const md = (_a = cell.mergeDown) != null ? _a : 0;
      const mr = (_b = cell.mergeRight) != null ? _b : 0;
      if (md > 0) {
        for (let dr = 1; dr <= md; dr++) {
          for (let dc = 0; dc <= mr; dc++) {
            vertCovered.add(`${cell.row + dr}_${cell.col + dc}`);
          }
        }
      }
    }
    const root = figma.createFrame();
    root.name = "xGrid";
    root.layoutMode = "VERTICAL";
    root.primaryAxisSizingMode = "FIXED";
    root.counterAxisSizingMode = "FIXED";
    root.itemSpacing = 1;
    root.paddingTop = 1;
    root.paddingBottom = 1;
    root.paddingLeft = 1;
    root.paddingRight = 1;
    root.clipsContent = true;
    const zoom = data.gridZoom != null && data.gridZoom > 0 ? data.gridZoom : 1;
    const rootW = Math.max(1, data.gridW != null ? Math.round(data.gridW / zoom) : totalW);
    const rootH = Math.max(1, data.gridH != null ? Math.round(data.gridH / zoom) : totalH);
    root.resize(rootW, rootH);
    const bgColor = data.backColor ? parseColor(data.backColor) : { r: 1, g: 1, b: 1, a: 1 };
    root.fills = [solidPaintFromParsed(bgColor)];
    if (data.gridBorder) {
      const gb = data.gridBorder;
      const dir = typeof gb.borderDirection === "number" && !Number.isNaN(gb.borderDirection) ? gb.borderDirection : 15;
      const baseW = Math.max(0, Math.min(20, Math.round(Number(gb.lineWidth) || 1)));
      const gTopW = dir & BG_TOP ? Math.max(0, Math.min(20, Math.round(Number((_c = gb.topLineWidth) != null ? _c : baseW)))) : 0;
      const gRightW = dir & BG_RIGHT ? Math.max(0, Math.min(20, Math.round(Number((_d = gb.rightLineWidth) != null ? _d : baseW)))) : 0;
      const gBotW = dir & BG_BOTTOM ? Math.max(0, Math.min(20, Math.round(Number((_e = gb.bottomLineWidth) != null ? _e : baseW)))) : 0;
      const gLeftW = dir & BG_LEFT ? Math.max(0, Math.min(20, Math.round(Number((_f = gb.leftLineWidth) != null ? _f : baseW)))) : 0;
      if (gTopW + gRightW + gBotW + gLeftW > 0) {
        const cStr = gb.topColor || gb.leftColor || gb.rightColor || gb.bottomColor || "#e2e8f0";
        const gbc = parseColor(normalizeColorForXcon(cStr) || "226,232,240,255");
        root.strokes = [solidPaintFromParsed(gbc)];
        root.strokeAlign = "CENTER";
        root.strokeTopWeight = gTopW;
        root.strokeRightWeight = gRightW;
        root.strokeBottomWeight = gBotW;
        root.strokeLeftWeight = gLeftW;
      } else {
        root.strokes = [];
      }
    } else {
      root.strokes = [];
    }
    for (let r = 0; r < M; r++) {
      const rh = rowH[r];
      const rowFrame = figma.createFrame();
      rowFrame.name = `Row ${r + 1}`;
      rowFrame.layoutMode = "HORIZONTAL";
      rowFrame.primaryAxisSizingMode = "FIXED";
      rowFrame.counterAxisSizingMode = "FIXED";
      rowFrame.resize(rootW, rh);
      rowFrame.itemSpacing = 1;
      rowFrame.paddingTop = 0;
      rowFrame.paddingBottom = 0;
      rowFrame.paddingLeft = 0;
      rowFrame.paddingRight = 0;
      rowFrame.fills = [];
      rowFrame.strokes = [];
      rowFrame.clipsContent = false;
      let c = 0;
      while (c < N) {
        const phW = colW[c];
        if (vertCovered.has(`${r}_${c}`)) {
          const ph = figma.createFrame();
          ph.name = `cell_${r}_${c}_ph`;
          ph.resize(phW, rh);
          ph.fills = [];
          ph.strokes = [];
          rowFrame.appendChild(ph);
          ph.layoutSizingHorizontal = "FIXED";
          ph.layoutSizingVertical = "FILL";
          c++;
          continue;
        }
        const cell = cellMap.get(`${r}_${c}`);
        if (!cell) {
          const ph = figma.createFrame();
          ph.name = `cell_${r}_${c}`;
          ph.resize(phW, rh);
          ph.fills = [];
          ph.strokes = [];
          rowFrame.appendChild(ph);
          ph.layoutSizingHorizontal = "FIXED";
          ph.layoutSizingVertical = "FILL";
          c++;
          continue;
        }
        const mr = (_g = cell.mergeRight) != null ? _g : 0;
        const md = (_h = cell.mergeDown) != null ? _h : 0;
        const cEnd = Math.min(N - 1, c + mr);
        const cellW = colPrefix[cEnd + 1] - colPrefix[c] + (cEnd - c);
        if (md > 0) {
          const ph = figma.createFrame();
          ph.name = `cell_${r}_${c}_vph`;
          ph.resize(cellW, rh);
          ph.fills = [];
          ph.strokes = [];
          rowFrame.appendChild(ph);
          ph.layoutSizingHorizontal = "FIXED";
          ph.layoutSizingVertical = "FILL";
        } else {
          const cellFrame = await buildAutoLayoutCell(cell, cellW, rh, r, c, M, N);
          rowFrame.appendChild(cellFrame);
          cellFrame.layoutSizingHorizontal = "FIXED";
          cellFrame.layoutSizingVertical = "FILL";
        }
        c += mr + 1;
      }
      root.appendChild(rowFrame);
      rowFrame.layoutSizingHorizontal = "FILL";
      rowFrame.layoutSizingVertical = "FIXED";
    }
    for (const cell of data.cells) {
      if (((_i = cell.mergeDown) != null ? _i : 0) === 0) continue;
      const mr = (_j = cell.mergeRight) != null ? _j : 0;
      const md = (_k = cell.mergeDown) != null ? _k : 0;
      const cEnd = Math.min(N - 1, cell.col + mr);
      const rEnd = Math.min(M - 1, cell.row + md);
      const cellW = colPrefix[cEnd + 1] - colPrefix[cell.col] + (cEnd - cell.col);
      const cellH = rowPrefix[rEnd + 1] - rowPrefix[cell.row] + (rEnd - cell.row);
      const cellFrame = await buildAutoLayoutCell(cell, cellW, cellH, cell.row, cell.col, M, N);
      root.appendChild(cellFrame);
      cellFrame.x = 1 + colPrefix[cell.col] + cell.col;
      cellFrame.y = 1 + rowPrefix[cell.row] + cell.row;
      cellFrame.layoutPositioning = "ABSOLUTE";
    }
    return root;
  }
  async function replaceSelectionWithGridFromSnapshot(selection, snapshot, options) {
    var _a;
    const mode = (_a = options == null ? void 0 : options.mode) != null ? _a : "fixed";
    if (selection.length === 0) {
      figma.notify(sn("select_then_insert"));
      return;
    }
    const first = selection[0];
    if (first == null ? void 0 : first.removed) {
      figma.notify(sn("invalid_selection"));
      return;
    }
    const probe = spanGridToExportPayload(snapshot, 100, 100);
    if (!probe || !probe.rows.length || !probe.cols.length) {
      figma.notify(sn("grid_json_invalid"));
      return;
    }
    await ensureTableFonts([]);
    const parent = first == null ? void 0 : first.parent;
    if (!parent || !isContainer(parent) || !("insertChild" in parent)) {
      figma.notify(sn("cannot_insert_parent"));
      return;
    }
    const cont = parent;
    const items = [];
    for (const node of selection) {
      if (node.removed) continue;
      if (node.parent !== parent) {
        figma.notify(sn("same_parent_only"));
        return;
      }
      const index = cont.children.indexOf(node);
      if (index < 0) continue;
      items.push({ node, index, bounds: getNodeBounds(node) });
    }
    if (items.length === 0) {
      figma.notify(sn("no_replaceable"));
      return;
    }
    items.sort((a, b) => b.index - a.index);
    const newNodes = [];
    const naturalPayload = spanGridToNaturalPayload(snapshot);
    if (!naturalPayload || !naturalPayload.rows.length || !naturalPayload.cols.length) {
      figma.notify(sn("grid_json_empty"));
      return;
    }
    let removeNode = false;
    for (const { node, index, bounds } of items) {
      let built = null;
      if (mode === "auto-layout") {
        built = await buildAutoLayoutTableDirect(naturalPayload);
      } else {
        const spec = buildSpanGridTableXcon(naturalPayload);
        built = await createNodeFromXconData(spec);
      }
      if (!built) continue;
      built.x = bounds.x;
      built.y = bounds.y;
      if (removeNode) {
        cont.insertChild(index, built);
        node.remove();
      } else {
        cont.insertChild(index + 1, built);
      }
      collapseNodeTreeInLayers(built);
      newNodes.push(built);
      updateNodeMeta(built, {
        type: "xGrid",
        tags: ["xGrid", ...polyprops],
        status: "polymorph"
      });
      try {
        built.setPluginData("xgrid_snapshot", JSON.stringify(snapshot));
      } catch (e) {
      }
    }
    if (newNodes.length > 0) {
      figma.currentPage.selection = newNodes;
      const modeLabel = mode === "auto-layout" ? "Auto Layout" : sn("mode_fixed");
      if (removeNode) {
        figma.notify(snf("grid_replaced", { mode: modeLabel, count: newNodes.length }));
      } else {
        figma.notify(snf("grid_added", { mode: modeLabel, count: newNodes.length }));
      }
    } else {
      figma.notify(sn("grid_create_failed"));
    }
  }
  function setNodeMeta(node, data) {
    node.setPluginData("meta", JSON.stringify(data));
  }
  function getNodeMeta(node) {
    const raw = node.getPluginData("meta");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }
  function updateNodeMeta(node, partial) {
    const current = getNodeMeta(node);
    setNodeMeta(node, __spreadProps(__spreadValues(__spreadValues({}, current), partial), { updatedAt: Date.now() }));
  }
  var polyprops = [];

  // code.ts
  var POLL_INTERVAL = 120;
  var ONBOARDING_UI_W = 300;
  var ONBOARDING_UI_H = 720;
  var NOTICES = {
    en: {
      onboarding_single: "Onboarding: only 1 layer can be selected. Keeping the last one.",
      create_select_one: "Select exactly 1 layer to press Create.",
      onboarding_deselect: "Only 1 layer can be selected during onboarding. Please deselect others.",
      enter_failed: "Failed to enter workspace: ",
      grid_failed: "Failed to insert grid: ",
      img_no_data: "No dataURL provided.",
      img_no_sel: 'Select a node, then use "Insert Grid Image".',
      img_invalid_sel: "Invalid selection.",
      img_no_parent: "Cannot insert node into parent.",
      img_added: "Added {n} grid image(s).",
      img_failed_none: "Failed to generate grid image.",
      img_failed: "Grid image generation failed: ",
      svg_no_data: "No SVG data provided.",
      svg_no_sel: 'Select a node, then use "Insert SVG Vector".',
      svg_added: "Added {n} SVG vector(s).",
      svg_failed_none: "Failed to generate SVG vector.",
      svg_failed: "SVG vector generation failed: "
    }
  };
  var _pluginLang = "en";
  function n(key) {
    return NOTICES[_pluginLang] && NOTICES[_pluginLang][key] || NOTICES.en[key] || key;
  }
  figma.showUI(__html__, {
    visible: true,
    width: ONBOARDING_UI_W,
    height: ONBOARDING_UI_H
  });
  void figma.clientStorage.getAsync("xamong_ge_settings").then((raw) => {
    const settings = raw && typeof raw === "object" ? raw : {};
    const savedLang = typeof settings.lang === "string" ? settings.lang : null;
    if (savedLang && NOTICES[savedLang]) {
      _pluginLang = savedLang;
      setSpanGridLang(savedLang);
      figma.ui.postMessage({ type: "LOAD_LANG", lang: savedLang });
    }
  }).catch(() => {
  });
  var savedSelection = [...figma.currentPage.selection];
  var _lastUiW = 0;
  var _lastUiH = 0;
  var _lastUiX = 0;
  var _lastUiY = 0;
  setInterval(() => {
    savedSelection = [...figma.currentPage.selection];
  }, 250);
  function round(n2) {
    return Math.round(n2 * 100) / 100;
  }
  function makeViewportSig() {
    const b = figma.viewport.bounds;
    const z = figma.viewport.zoom;
    return [
      round(b.x),
      round(b.y),
      round(b.width),
      round(b.height),
      round(z)
    ].join("|");
  }
  var uiWorkspaceActive = false;
  var lastCommand = "";
  function syncUiToViewport() {
    if (!uiWorkspaceActive) return;
    const b = figma.viewport.bounds;
    const z = figma.viewport.zoom;
    const newW = Math.max(200, Math.round(b.width * z));
    const newH = Math.max(120, Math.round(b.height * z));
    const newX = b.x;
    const newY = b.y;
    if (lastCommand !== "PAN_VIEWPORT" && lastCommand !== "ZOOM_VIEWPORT" && lastCommand !== "FIT_TO_GRID") {
      if (newX !== _lastUiX || newY !== _lastUiY) {
        _lastUiX = newX;
        _lastUiY = newY;
        figma.ui.reposition(newX, newY);
      }
    }
    if (newW !== _lastUiW || newH !== _lastUiH) {
      _lastUiW = newW;
      _lastUiH = newH;
      figma.ui.resize(newW, newH);
    }
  }
  var _B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  function dataURLToUint8(dataURL) {
    const b64 = dataURL.replace(/^data:[^;]+;base64,/, "");
    const n2 = b64.length;
    const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    const byteLen = Math.floor(n2 * 3 / 4) - pad;
    const bytes = new Uint8Array(byteLen);
    let idx = 0;
    for (let i = 0; i < n2; i += 4) {
      const a = _B64.indexOf(b64[i]);
      const b = _B64.indexOf(b64[i + 1]);
      const c = b64[i + 2] === "=" ? 0 : _B64.indexOf(b64[i + 2]);
      const d = b64[i + 3] === "=" ? 0 : _B64.indexOf(b64[i + 3]);
      const v = a << 18 | b << 12 | c << 6 | d;
      if (idx < byteLen) bytes[idx++] = v >> 16 & 255;
      if (idx < byteLen) bytes[idx++] = v >> 8 & 255;
      if (idx < byteLen) bytes[idx++] = v & 255;
    }
    return bytes;
  }
  function addSceneNodeSubtreeTo(root, out) {
    out.push(root);
    if ("children" in root) {
      for (const ch of root.children) {
        addSceneNodeSubtreeTo(ch, out);
      }
    }
  }
  function mapNodeData(node, bounds, zoom, frameMap, selectedIds) {
    const box = node.absoluteBoundingBox;
    let fillColor = null;
    if ("fills" in node && Array.isArray(node.fills)) {
      const fills = node.fills;
      for (let i = fills.length - 1; i >= 0; i--) {
        const f = fills[i];
        if (f.type === "SOLID" && f.visible !== false) {
          const c = f.color;
          const a = f.opacity !== void 0 ? f.opacity : 1;
          fillColor = `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
          break;
        }
      }
    }
    if (frameMap[node.id]) {
      (async () => {
        const pngData = await node.exportAsync({ format: "PNG" });
        figma.ui.postMessage({ type: "DISPLAY_IMAGE", bytes: pngData, id: node.id, tp: node.type });
      })();
    }
    let textContent = null;
    if (node.type === "TEXT" && node.characters) {
      textContent = node.characters.slice(0, 80);
    }
    const isComponent = node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE";
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      x: (box.x - bounds.x) * zoom,
      y: (box.y - bounds.y) * zoom,
      w: box.width * zoom,
      h: box.height * zoom,
      canvasX: Math.round(box.x),
      canvasY: Math.round(box.y),
      canvasW: Math.round(box.width),
      canvasH: Math.round(box.height),
      fillColor,
      textContent,
      isComponent,
      isSelected: selectedIds.indexOf(node.id) !== -1,
      depth: getDepth(node),
      visible: "visible" in node ? node.visible : true,
      locked: "locked" in node ? node.locked : false
    };
  }
  var OFFSCREEN_DEFERRED = true;
  var MAX_NODES_PER_TICK = 100;
  var OFFSCREEN_BATCH_DELAY = 100;
  var _offscreenLoadToken = 0;
  var _pendingOffscreenBatch = null;
  var _offscreenSyncDone = false;
  var _offscreenInProgress = false;
  var _wsNodeId = null;
  var _wsPageId = null;
  var _docChangePending = /* @__PURE__ */ new Set();
  var _docChangeTimer = null;
  function* iterateSubtree(root) {
    yield root;
    if ("children" in root) {
      for (const ch of root.children) {
        yield* __yieldStar(iterateSubtree(ch));
      }
    }
  }
  function sendOffscreenBatches(frames, _startIdx, bounds, zoom, selectedIds, token) {
    _offscreenInProgress = true;
    const frameMap = {};
    frames.forEach((f) => {
      if ("name" in f) frameMap[f.id] = f.name;
    });
    function* allNodes() {
      for (const frame of frames) {
        yield* __yieldStar(iterateSubtree(frame));
      }
    }
    _tickOffscreenBatch(allNodes(), frameMap, bounds, zoom, selectedIds, token);
  }
  function _tickOffscreenBatch(gen, frameMap, bounds, zoom, selectedIds, token) {
    setTimeout(() => {
      if (token !== _offscreenLoadToken) {
        _offscreenInProgress = false;
        return;
      }
      const rawNodes = [];
      let next = gen.next();
      while (!next.done && rawNodes.length < MAX_NODES_PER_TICK) {
        rawNodes.push(next.value);
        next = gen.next();
      }
      const isLast = next.done === true;
      if (rawNodes.length > 0) {
        const nodes = rawNodes.map((n2) => mapNodeData(n2, bounds, zoom, frameMap, selectedIds));
        figma.ui.postMessage({
          type: "APPEND_NODES",
          payload: { nodes, frames: frameMap, isLast }
        });
      }
      if (!isLast) {
        _tickOffscreenBatch(gen, frameMap, bounds, zoom, selectedIds, token);
      } else {
        _offscreenInProgress = false;
        _offscreenSyncDone = true;
      }
    }, OFFSCREEN_BATCH_DELAY);
  }
  function sendAll() {
    const token = ++_offscreenLoadToken;
    _offscreenSyncDone = false;
    _offscreenInProgress = false;
    try {
      const vp = figma.viewport;
      const bounds = vp.bounds;
      const zoom = vp.zoom;
      const page = figma.currentPage;
      const bgColor = { r: 0.15, g: 0.15, b: 0.15, a: 1 };
      const bg = page.backgrounds;
      if (bg && bg.length > 0 && bg[0].type === "SOLID") {
        bgColor.r = bg[0].color.r;
        bgColor.g = bg[0].color.g;
        bgColor.b = bg[0].color.b;
        bgColor.a = bg[0].opacity !== void 0 ? bg[0].opacity : 1;
      }
      const frameMap = {};
      let rawNodes = [];
      let hasMore = false;
      let searchType = figma.editorType === "slides" ? "all" : "top";
      if (searchType === "top") {
        const frames = page.children;
        const offscreenFrames = [];
        frames.forEach((frame) => {
          if (!("absoluteBoundingBox" in frame)) return;
          const box = frame.absoluteBoundingBox;
          if (!box) return;
          const inViewport = box.x < bounds.x + bounds.width && box.x + box.width > bounds.x && box.y < bounds.y + bounds.height && box.y + box.height > bounds.y;
          if (inViewport) {
            frameMap[frame.id] = frame.name;
            addSceneNodeSubtreeTo(frame, rawNodes);
          } else {
            rawNodes.push(frame);
            offscreenFrames.push(frame);
          }
        });
        if (OFFSCREEN_DEFERRED && offscreenFrames.length > 0) {
          hasMore = true;
          const vpCx = bounds.x + bounds.width / 2;
          const vpCy = bounds.y + bounds.height / 2;
          offscreenFrames.sort((a, b) => {
            const aBox = a.absoluteBoundingBox;
            const bBox = b.absoluteBoundingBox;
            const aDist = aBox ? (aBox.x + aBox.width / 2 - vpCx) ** 2 + (aBox.y + aBox.height / 2 - vpCy) ** 2 : 0;
            const bDist = bBox ? (bBox.x + bBox.width / 2 - vpCx) ** 2 + (bBox.y + bBox.height / 2 - vpCy) ** 2 : 0;
            return aDist - bDist;
          });
          _pendingOffscreenBatch = {
            frames: offscreenFrames,
            bounds,
            zoom,
            selectedIds: page.selection.map((s) => s.id),
            token
          };
        } else {
          _pendingOffscreenBatch = null;
        }
      } else {
        rawNodes = page.findAll((node) => {
          if (!("absoluteBoundingBox" in node)) return false;
          const box = node.absoluteBoundingBox;
          if (!box) return false;
          return box.x < bounds.x + bounds.width && box.x + box.width > bounds.x && box.y < bounds.y + bounds.height && box.y + box.height > bounds.y;
        });
      }
      const selectedIds = page.selection.map((s) => s.id);
      const nodes = rawNodes.map((node) => mapNodeData(node, bounds, zoom, frameMap, selectedIds));
      figma.ui.postMessage({
        type: "VIEWPORT_DATA",
        payload: {
          zoom,
          bounds,
          bgColor,
          nodes,
          frames: frameMap,
          pageId: page.id,
          pageName: page.name,
          selectedIds,
          calibration: { dx: -1, dy: -1 },
          screenW: Math.round(bounds.width * zoom),
          screenH: Math.round(bounds.height * zoom),
          hasMore
        }
      });
    } catch (e) {
      console.error("---> sendAll error: ", e);
    }
  }
  function sendSelectionData() {
    const sel = figma.currentPage.selection;
    const selectedIds = sel.map((s) => s.id);
    let xGridNodeId = null;
    let hasXGridSnapshot = false;
    if (sel.length === 1) {
      const node = sel[0];
      try {
        const metaRaw = node.getPluginData("meta");
        if (metaRaw) {
          const meta = JSON.parse(metaRaw);
          if (meta.type === "xGrid") {
            xGridNodeId = node.id;
            hasXGridSnapshot = !!node.getPluginData("xgrid_snapshot");
          }
        }
      } catch (e) {
      }
    }
    figma.ui.postMessage({
      type: "SELECTION_CHANGE",
      payload: {
        selectedIds,
        xGridNodeId,
        hasXGridSnapshot
      }
    });
  }
  function sendViewportUpdate() {
    const vp = figma.viewport;
    const page = figma.currentPage;
    const bgColor = { r: 0.15, g: 0.15, b: 0.15, a: 1 };
    const bg = page.backgrounds;
    if (bg && bg.length > 0 && bg[0].type === "SOLID") {
      bgColor.r = bg[0].color.r;
      bgColor.g = bg[0].color.g;
      bgColor.b = bg[0].color.b;
      bgColor.a = bg[0].opacity !== void 0 ? bg[0].opacity : 1;
    }
    figma.ui.postMessage({
      type: "UPDATE_VIEWPORT",
      payload: { zoom: vp.zoom, bounds: vp.bounds, bgColor }
    });
  }
  function sendPatchNodes(ids) {
    var _a;
    if (ids.length === 0) return;
    const vp = figma.viewport;
    const bounds = vp.bounds;
    const zoom = vp.zoom;
    const page = figma.currentPage;
    const selectedIds = page.selection.map((s) => s.id);
    const frameMap = {};
    const nodes = [];
    for (const id of ids) {
      let node = null;
      try {
        node = figma.getNodeById(id);
      } catch (e) {
        continue;
      }
      if (!node || !("absoluteBoundingBox" in node)) continue;
      const sn2 = node;
      if (!sn2.absoluteBoundingBox) continue;
      let cur = sn2.parent;
      while (cur && cur.type !== "PAGE") {
        if (((_a = cur.parent) == null ? void 0 : _a.type) === "PAGE") {
          frameMap[cur.id] = cur.name;
        }
        cur = cur.parent;
      }
      nodes.push(mapNodeData(sn2, bounds, zoom, frameMap, selectedIds));
    }
    if (nodes.length === 0) return;
    figma.ui.postMessage({ type: "PATCH_NODES", payload: { nodes, frames: frameMap } });
  }
  function sendDeleteNodes(ids) {
    if (ids.length === 0) return;
    figma.ui.postMessage({ type: "DELETE_NODES", payload: { ids } });
  }
  function getDepth(node) {
    let d = 0;
    let cur = node.parent;
    while (cur && cur.type !== "PAGE") {
      d++;
      cur = cur.parent;
    }
    return d;
  }
  function enforceSingleLayerWhileOnboarding() {
    if (uiWorkspaceActive) return;
    const sel = figma.currentPage.selection;
    if (sel.length <= 1) return;
    const keep = sel[sel.length - 1];
    figma.notify(n("onboarding_single"), {
      timeout: 2e3
    });
    figma.currentPage.selection = [keep];
  }
  function onDocumentChange(event) {
    if (!uiWorkspaceActive) return;
    const deletes = [];
    for (const ch of event.documentChanges) {
      if (ch.type === "DELETE") {
        deletes.push(ch.id);
        _docChangePending.delete(ch.id);
      } else if (ch.type === "CREATE" || ch.type === "PROPERTY_CHANGE") {
        if (!deletes.includes(ch.id)) {
          _docChangePending.add(ch.id);
        }
      }
    }
    if (deletes.length > 0) sendDeleteNodes(deletes);
    if (_docChangePending.size > 0) {
      if (_docChangeTimer) clearTimeout(_docChangeTimer);
      _docChangeTimer = setTimeout(() => {
        _docChangeTimer = null;
        if (_docChangePending.size === 0) return;
        const ids = [..._docChangePending];
        _docChangePending.clear();
        sendPatchNodes(ids);
      }, 50);
    }
  }
  function onSelectionChange() {
    enforceSingleLayerWhileOnboarding();
    savedSelection = [...figma.currentPage.selection];
    sendSelectionData();
  }
  function onCurrentPageChange() {
    if (uiWorkspaceActive) {
      syncUiToViewport();
      sendAll();
    } else {
      sendSelectionData();
    }
  }
  sendSelectionData();
  var prevSig = "";
  var timer = setInterval(() => {
    const sig = makeViewportSig();
    if (sig !== prevSig) {
      prevSig = sig;
      if (uiWorkspaceActive) {
        syncUiToViewport();
        sendViewportUpdate();
      }
    }
  }, POLL_INTERVAL);
  figma.on("selectionchange", onSelectionChange);
  figma.on("currentpagechange", onCurrentPageChange);
  void (async () => {
    await figma.loadAllPagesAsync();
    figma.on("documentchange", (event) => onDocumentChange(event));
  })();
  figma.ui.onmessage = (raw) => {
    var _a, _b, _c;
    try {
      const msg = raw;
      lastCommand = msg.type;
      if (msg.type === "REFRESH") {
        if (uiWorkspaceActive) {
          sendAll();
        }
      } else if (msg.type === "PAN_VIEWPORT") {
        if (uiWorkspaceActive) {
          const panMsg = msg;
          figma.viewport.center = {
            x: figma.viewport.center.x + panMsg.dx,
            y: figma.viewport.center.y + panMsg.dy
          };
          sendViewportUpdate();
        }
      } else if (msg.type === "ZOOM_VIEWPORT") {
        if (uiWorkspaceActive) {
          const zm = msg;
          const b = figma.viewport.bounds;
          const z = figma.viewport.zoom;
          const newZ = Math.max(0.02, Math.min(256, zm.newZoom));
          const ratio = z / newZ;
          const newBoundsX = zm.pivotCanvasX + (b.x - zm.pivotCanvasX) * ratio;
          const newBoundsY = zm.pivotCanvasY + (b.y - zm.pivotCanvasY) * ratio;
          const newCenterX = newBoundsX + b.width * ratio / 2;
          const newCenterY = newBoundsY + b.height * ratio / 2;
          figma.viewport.zoom = newZ;
          figma.viewport.center = { x: newCenterX, y: newCenterY };
          syncUiToViewport();
          sendViewportUpdate();
          prevSig = makeViewportSig();
        }
      } else if (msg.type === "ACK_VIEWPORT_DATA") {
        if (_pendingOffscreenBatch && _pendingOffscreenBatch.token === _offscreenLoadToken) {
          const p = _pendingOffscreenBatch;
          _pendingOffscreenBatch = null;
          sendOffscreenBatches(p.frames, 0, p.bounds, p.zoom, p.selectedIds, p.token);
        }
      } else if (msg.type === "SET_LANG") {
        const langMsg = msg;
        if (NOTICES[langMsg.lang]) {
          _pluginLang = langMsg.lang;
          setSpanGridLang(langMsg.lang);
          void figma.clientStorage.getAsync("xamong_ge_settings").then((raw2) => {
            const settings = raw2 && typeof raw2 === "object" ? __spreadValues({}, raw2) : {};
            settings.lang = langMsg.lang;
            return figma.clientStorage.setAsync("xamong_ge_settings", settings);
          }).catch(() => {
          });
        }
      } else if (msg.type === "LEAVE_WORKSPACE") {
        uiWorkspaceActive = false;
        const s = figma.currentPage.selection;
        if (s.length > 1) {
          figma.currentPage.selection = [s[s.length - 1]];
        }
        savedSelection = [...figma.currentPage.selection];
        figma.ui.resize(ONBOARDING_UI_W, ONBOARDING_UI_H);
        _lastUiW = ONBOARDING_UI_W;
        _lastUiH = ONBOARDING_UI_H;
        sendSelectionData();
        figma.ui.postMessage({ type: "ONBOARDING_READY" });
      } else if (msg.type === "SELECT_NODE") {
        const t = figma.getNodeById(msg.id);
        if (t && t.type !== "DOCUMENT" && t.type !== "PAGE")
          figma.currentPage.selection = [t];
      } else if (msg.type === "ZOOM_TO_NODE") {
        const t2 = figma.getNodeById(msg.id);
        if (t2 && "absoluteBoundingBox" in t2 && t2.absoluteBoundingBox) {
          figma.viewport.scrollAndZoomIntoView([t2]);
        }
      } else if (msg.type === "ENTER_WORKSPACE") {
        if (figma.currentPage.selection.length !== 1) {
          if (figma.currentPage.selection.length < 1) {
            figma.notify(n("create_select_one"));
          } else {
            figma.notify(n("onboarding_deselect"));
          }
          figma.ui.postMessage({ type: "WORKSPACE_ENTER_FAILED" });
          return;
        }
        const incomingPageId = figma.currentPage.id;
        const canLightweightResume = incomingPageId === _wsPageId && (_offscreenSyncDone || _offscreenInProgress || _pendingOffscreenBatch !== null && _pendingOffscreenBatch.token === _offscreenLoadToken);
        uiWorkspaceActive = true;
        _wsNodeId = (_b = (_a = figma.currentPage.selection[0]) == null ? void 0 : _a.id) != null ? _b : null;
        _wsPageId = incomingPageId;
        savedSelection = [...figma.currentPage.selection];
        prevSig = makeViewportSig();
        setTimeout(function enterWorkspaceCont() {
          if (!uiWorkspaceActive) {
            return;
          }
          try {
            syncUiToViewport();
            if (canLightweightResume) {
              sendViewportUpdate();
              sendSelectionData();
            } else {
              sendAll();
            }
            figma.ui.postMessage({ type: "WORKSPACE_READY" });
            const selNodeForSnap = figma.currentPage.selection[0];
            let nodeSnapshotSent = false;
            if (selNodeForSnap) {
              try {
                const metaRaw = selNodeForSnap.getPluginData("meta");
                if (metaRaw) {
                  const metaObj = JSON.parse(metaRaw);
                  if (metaObj.type === "xGrid") {
                    const snapRaw = selNodeForSnap.getPluginData("xgrid_snapshot");
                    if (snapRaw) {
                      const parsed = JSON.parse(snapRaw);
                      figma.ui.postMessage({ type: "RESTORE_GRID_SNAPSHOT", payload: parsed, source: "node" });
                      nodeSnapshotSent = true;
                    }
                  }
                }
              } catch (e) {
              }
            }
            if (!nodeSnapshotSent) {
              void figma.clientStorage.getAsync("spangrid_snapshot_v1").then((snapshot) => {
                figma.ui.postMessage({ type: "RESTORE_GRID_SNAPSHOT", payload: snapshot != null ? snapshot : null });
              }).catch(() => {
                figma.ui.postMessage({ type: "RESTORE_GRID_SNAPSHOT", payload: null });
              });
            }
          } catch (e) {
            const err = e && e instanceof Error ? e.message : String(e);
            figma.notify(n("enter_failed") + err);
            uiWorkspaceActive = false;
            figma.ui.postMessage({ type: "WORKSPACE_ENTER_FAILED" });
            console.error(e);
          }
        }, 0);
      } else if (msg.type === "SAVE_GRID_SNAPSHOT") {
        void figma.clientStorage.setAsync("spangrid_snapshot_v1", msg.payload).catch((e) => {
          console.error("SAVE_GRID_SNAPSHOT clientStorage.setAsync failed:", e);
        });
      } else if (msg.type === "LOAD_XGRID_NODE") {
        const loadMsg = msg;
        const targetNode = loadMsg.nodeId ? figma.getNodeById(loadMsg.nodeId) : (_c = figma.currentPage.selection[0]) != null ? _c : null;
        if (!targetNode || targetNode.type === "DOCUMENT" || targetNode.type === "PAGE") {
          figma.notify("Node not found.");
          figma.ui.postMessage({ type: "XGRID_NODE_SNAPSHOT", payload: null, error: "Node not found" });
          return;
        }
        const snapRaw = targetNode.getPluginData("xgrid_snapshot");
        if (!snapRaw) {
          figma.notify("No grid data is stored on this node.");
          figma.ui.postMessage({ type: "XGRID_NODE_SNAPSHOT", payload: null, error: "No snapshot" });
          return;
        }
        try {
          const parsed = JSON.parse(snapRaw);
          figma.ui.postMessage({ type: "XGRID_NODE_SNAPSHOT", payload: parsed });
        } catch (e) {
          figma.notify("Could not read grid data.");
          figma.ui.postMessage({ type: "XGRID_NODE_SNAPSHOT", payload: null, error: "Parse error" });
        }
      } else if (msg.type === "CREATE_GRID") {
        const list = savedSelection.length > 0 ? savedSelection : figma.currentPage.selection;
        const gridMsg = msg;
        void (async () => {
          var _a2;
          try {
            await replaceSelectionWithGridFromSnapshot(list, gridMsg.payload, { mode: (_a2 = gridMsg.mode) != null ? _a2 : "fixed" });
            figma.ui.postMessage({ type: "CREATE_GRID_DONE" });
            setTimeout(() => figma.closePlugin(), 1500);
          } catch (e) {
            const err = e && e instanceof Error ? e.message : String(e);
            figma.notify(n("grid_failed") + err);
            figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: err });
            console.error(e);
          }
        })();
      } else if (msg.type === "CREATE_GRID_IMAGE") {
        const list = savedSelection.length > 0 ? savedSelection : figma.currentPage.selection;
        const imgMsg = msg;
        void (async () => {
          try {
            if (!imgMsg.dataURL) throw new Error(n("img_no_data"));
            const bytes = dataURLToUint8(imgMsg.dataURL);
            const figmaImage = figma.createImage(bytes);
            const selection = list.length > 0 ? list : figma.currentPage.selection;
            if (selection.length === 0) {
              figma.notify(n("img_no_sel"));
              figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: n("img_no_sel") });
              return;
            }
            const first = selection[0];
            if (!first || first.removed) throw new Error(n("img_invalid_sel"));
            const parentNode = first.parent;
            if (!parentNode || !("insertChild" in parentNode)) throw new Error(n("img_no_parent"));
            const cont = parentNode;
            const newNodes = [];
            for (const node of selection) {
              if (node.removed || node.parent !== parentNode) continue;
              const idx = cont.children.indexOf(node);
              if (idx < 0) continue;
              const nodeW = Math.max(1, "width" in node ? node.width : imgMsg.width);
              const nodeH = Math.max(1, "height" in node ? node.height : imgMsg.height);
              const wrapper = figma.createFrame();
              wrapper.name = "xGrid";
              wrapper.resize(nodeW, nodeH);
              wrapper.fills = [];
              wrapper.strokes = [];
              wrapper.clipsContent = true;
              const rect = figma.createRectangle();
              rect.resize(Math.max(1, imgMsg.width), Math.max(1, imgMsg.height));
              rect.x = 0;
              rect.y = 0;
              rect.name = "Grid Image";
              rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: figmaImage.hash }];
              wrapper.appendChild(rect);
              wrapper.x = node.x;
              wrapper.y = node.y;
              cont.insertChild(idx + 1, wrapper);
              newNodes.push(wrapper);
              try {
                wrapper.setPluginData("meta", JSON.stringify({ type: "xGrid", status: "polymorph", updatedAt: Date.now() }));
                if (imgMsg.snapshot) wrapper.setPluginData("xgrid_snapshot", JSON.stringify(imgMsg.snapshot));
              } catch (e) {
              }
            }
            if (newNodes.length > 0) {
              figma.currentPage.selection = newNodes;
              figma.notify(n("img_added").replace("{n}", String(newNodes.length)));
            } else {
              figma.notify(n("img_failed_none"));
            }
            figma.ui.postMessage({ type: "CREATE_GRID_DONE" });
            setTimeout(() => figma.closePlugin(), 1500);
          } catch (e) {
            const err = e && e instanceof Error ? e.message : String(e);
            figma.notify(n("img_failed") + err);
            figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: err });
            console.error(e);
          }
        })();
      } else if (msg.type === "CREATE_GRID_SVG") {
        const list = savedSelection.length > 0 ? savedSelection : figma.currentPage.selection;
        const svgMsg = msg;
        void (async () => {
          try {
            if (!svgMsg.svgString) throw new Error(n("svg_no_data"));
            const selection = list.length > 0 ? list : figma.currentPage.selection;
            if (selection.length === 0) {
              figma.notify(n("svg_no_sel"));
              figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: n("svg_no_sel") });
              return;
            }
            const first = selection[0];
            if (!first || first.removed) throw new Error(n("img_invalid_sel"));
            const parentNode = first.parent;
            if (!parentNode || !("insertChild" in parentNode)) throw new Error(n("img_no_parent"));
            const cont = parentNode;
            const newNodes = [];
            for (const node of selection) {
              if (node.removed || node.parent !== parentNode) continue;
              const idx = cont.children.indexOf(node);
              if (idx < 0) continue;
              const vectorNode = figma.createNodeFromSvg(svgMsg.svgString);
              vectorNode.name = "Grid SVG";
              vectorNode.x = 0;
              vectorNode.y = 0;
              const nodeW = Math.max(1, "width" in node ? node.width : 100);
              const nodeH = Math.max(1, "height" in node ? node.height : 100);
              const wrapper = figma.createFrame();
              wrapper.name = "xGrid";
              wrapper.resize(nodeW, nodeH);
              wrapper.fills = [];
              wrapper.strokes = [];
              wrapper.clipsContent = true;
              wrapper.appendChild(vectorNode);
              const srcX = node.x;
              const srcY = node.y;
              wrapper.x = srcX;
              wrapper.y = srcY;
              cont.insertChild(idx + 1, wrapper);
              newNodes.push(wrapper);
              try {
                wrapper.setPluginData("meta", JSON.stringify({ type: "xGrid", status: "polymorph", updatedAt: Date.now() }));
                if (svgMsg.snapshot) wrapper.setPluginData("xgrid_snapshot", JSON.stringify(svgMsg.snapshot));
              } catch (e) {
              }
            }
            if (newNodes.length > 0) {
              figma.currentPage.selection = newNodes;
              figma.notify(n("svg_added").replace("{n}", String(newNodes.length)));
            } else {
              figma.notify(n("svg_failed_none"));
            }
            figma.ui.postMessage({ type: "CREATE_GRID_DONE" });
            setTimeout(() => figma.closePlugin(), 1500);
          } catch (e) {
            const err = e && e instanceof Error ? e.message : String(e);
            figma.notify(n("svg_failed") + err);
            figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: err });
            console.error(e);
          }
        })();
      } else if (msg.type === "FIT_TO_GRID") {
        const node = figma.currentPage.selection[0];
        if (node && "absoluteBoundingBox" in node && node.absoluteBoundingBox) {
          const box = node.absoluteBoundingBox;
          figma.viewport.center = {
            x: box.x + box.width / 2,
            y: box.y + box.height / 2
          };
        }
      }
    } catch (e) {
      console.error("---> window.onmessage error: ", e);
    }
  };
  figma.on("close", () => {
    figma.ui.postMessage({ type: "GRIDEDITOR_CLOSED" });
    clearInterval(timer);
  });
})();
