


interface XconNode {
  type: string;
  pos?: string;
  name?: string;
  id?: string;
  polymorph?: string;
  bgColor?: string;
  fgColor?: string;
  border?: string;
  borderWidth?: string;
  borderColor?: string;
  round?: string;
  text?: string;
  fontSize?: string;
  font?: string;
  fontWeight?: string;
  textAlign?: string;
  textVAlign?: string;
  visible?: string;
  clipContent?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  padding?: string;
  shadow?: string;
  shadowColor?: string;
  shadowOpacity?: string;
  shadowBlur?: string;
  shadowRadius?: string;
  components?: Record<string, XconNode>;
  componentsOrder?: string;
  [key: string]: unknown;
}


/** `serializeBorder` / toJSON `border` (span-grid.js) */
type SpanGridBorderJson = {
  leftColor?: string;
  rightColor?: string;
  topColor?: string;
  bottomColor?: string;
  borderDirection?: number;
  lineStyle?: string;
  lineWidth?: number;
  leftLineStyle?: string;
  rightLineStyle?: string;
  topLineStyle?: string;
  bottomLineStyle?: string;
  leftLineWidth?: number;
  rightLineWidth?: number;
  topLineWidth?: number;
  bottomLineWidth?: number;
  inheritUnspecified?: boolean;
};

type SpanGridExportCell = {
  name?: string;
  row: number;
  col: number;
  text?: string;
  align?: string;
  valign?: string;
  bg?: string;
  fg?: string;
  fs?: number;
  bold?: boolean;
  italic?: boolean;
  mergeRight?: number;
  mergeDown?: number;
  
  border?: SpanGridBorderJson;
};

type SpanGridExportPayload = {
  name?: string;
  cols: { name: string; width: number }[];
  rows: { name: string; height: number }[];
  cells: SpanGridExportCell[];
  
  backColor?: string;
  
  gridBorder?: SpanGridBorderJson;
  
  gridW?: number;
  
  gridH?: number;
  
  gridZoom?: number;
};


type SpanGridCellJson = {
  name?: string;
  text?: string;
  foreColor?: string;
  backColor?: string;
  font?: string;
  textAlign?: string;
  border?: SpanGridBorderJson | null;
};

type SpanGridMergeJson = {
  start?: { row?: number; col?: number };
  end?: { row?: number; col?: number };
};


export type GridOutputMode = 'fixed' | 'auto-layout';

// ─── i18n ────────────────────────────────────────────────────────────────
const SPAN_NOTICES: Record<string, Record<string, string>> = {
  en: {
    select_then_insert:   'Select a node, then click "Insert Grid".',
    invalid_selection:    'Invalid selection.',
    grid_json_invalid:    'Grid JSON (rows/cols) is empty or invalid.',
    cannot_insert_parent: 'Cannot insert into the parent container.',
    same_parent_only:     'Only nodes under the same parent can be replaced at once.',
    no_replaceable:       'No replaceable selection found.',
    grid_json_empty:      'Grid JSON is empty or invalid.',
    mode_fixed:           'Fixed',
    grid_replaced:        '[{mode}] Replaced {count} node(s) with grid.',
    grid_added:           '[{mode}] Added {count} grid(s).',
    grid_create_failed:   'Failed to create grid node(s).',
  },};

let _spanLang = 'en';


export function setSpanGridLang(lang: string): void {
  if (SPAN_NOTICES[lang]) _spanLang = lang;
}

function sn(key: string): string {
  return (SPAN_NOTICES[_spanLang]?.[key]) ?? (SPAN_NOTICES['en']?.[key]) ?? key;
}


function snf(key: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    sn(key)
  );
}


type ContainerNode = PageNode | FrameNode | GroupNode | ComponentNode | InstanceNode;

function isContainer(node: BaseNode | null | undefined): node is ContainerNode {
  if (!node) return false;
  const t = node.type;
  return (
    t === 'PAGE' || t === 'FRAME' || t === 'GROUP' || t === 'COMPONENT' || t === 'INSTANCE'
  );
}

function getNodeBounds(node: SceneNode): { x: number; y: number; w: number; h: number } {
  const x = node.x;
  const y = node.y;
  let w: number;
  let h: number;
  if ('width' in node && 'height' in node) {
    w = (node as LayoutMixin).width;
    h = (node as LayoutMixin).height;
  } else {
    const b = (node as SceneNode & { absoluteBoundingBox?: { width: number; height: number } | null })
      .absoluteBoundingBox;
    w = b ? b.width : 100;
    h = b ? b.height : 100;
  }
  return { x, y, w, h };
}


function collapseNodeTreeInLayers(root: SceneNode): void {
  const withExp = root as SceneNode & { expanded?: boolean };
  if (typeof withExp.expanded === 'boolean') {
    withExp.expanded = false;
  }
  if ('children' in root) {
    const { children } = root as ChildrenMixin;
    for (const ch of children) {
      collapseNodeTreeInLayers(ch);
    }
  }
}

function parsePos(pos: string | undefined): { x: number; y: number; w: number; h: number } {
  if (!pos) return { x: 0, y: 0, w: 100, h: 100 };
  const parts = pos.split(',').map(Number);
  if (parts.length >= 4) {
    return {
      x: parts[0],
      y: parts[1],
      w: Math.max(1, parts[2]),
      h: Math.max(1, parts[3]),
    };
  }
  return { x: 0, y: 0, w: 100, h: 100 };
}

function parsePadding(padding: string | undefined): { top: number; right: number; bottom: number; left: number } {
  if (!padding) return { top: 0, right: 0, bottom: 0, left: 0 };
  const parts = padding.split(',').map((s) => parseInt(s.trim(), 10));
  if (parts.length >= 4) {
    return { top: parts[0] || 0, right: parts[1] || 0, bottom: parts[2] || 0, left: parts[3] || 0 };
  }
  if (parts.length === 1 && !isNaN(parts[0]!)) {
    const v = parts[0]!;
    return { top: v, right: v, bottom: v, left: v };
  }
  return { top: 0, right: 0, bottom: 0, left: 0 };
}

function parseColor(color: string | undefined): { r: number; g: number; b: number; a: number } {
  if (!color) return { r: 1, g: 1, b: 1, a: 1 };
  const parts = color.split(',').map(Number);
  if (parts.length >= 4) {
    return {
      r: (parts[0] ?? 255) / 255,
      g: (parts[1] ?? 255) / 255,
      b: (parts[2] ?? 255) / 255,
      a: (parts[3] ?? 255) / 255,
    };
  }
  return { r: 1, g: 1, b: 1, a: 1 };
}

function solidPaintFromParsed(c: { r: number; g: number; b: number; a?: number }): SolidPaint {
  const opacity = Math.max(
    0,
    Math.min(1, typeof c.a === 'number' && Number.isFinite(c.a) ? c.a : 1)
  );
  return { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity };
}

function normalizeColorForXcon(raw: string | undefined): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  const s = raw.trim();


  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3) {
      h = h.split('').map((ch) => ch + ch).join('');
    }
    if (h.length !== 6) return undefined;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return undefined;
    const r = (n >> 16) & 255;
    const g = (n >> 8)  & 255;
    const b = n & 255;
    return `${r},${g},${b},255`;
  }


  const rgbaMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(s);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = rgbaMatch[4] !== undefined ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255;
    return `${r},${g},${b},${a}`;
  }


  return s;
}

// SpanGrid `textAlign` e.g. MiddleCenter → { valign, align }
function spanAlignmentParts(textAlign: string | undefined): { valign: string; align: string } {
  const s = (textAlign || 'MiddleCenter').toString();
  const valign = s.startsWith('Top') ? 'top' : s.startsWith('Bottom') ? 'bottom' : 'middle';
  const align = s.endsWith('Left') ? 'left' : s.endsWith('Right') ? 'right' : 'center';
  return { valign, align };
}

function fontSizeFromSpanFont(font: string | undefined, fallback: number): number {
  if (!font || typeof font !== 'string') return Math.max(4, Math.min(400, Math.floor(fallback)));
  const m = font.match(/(\d+(\.\d+)?)(pt|px)/i);
  if (m) {
    const n = parseFloat(m[1]!);
    if (Number.isFinite(n)) {
      if (/pt/i.test(m[3]!)) return Math.max(4, Math.min(400, Math.round(n * 1.333)));
      return Math.max(4, Math.min(400, Math.round(n)));
    }
  }
  return Math.max(4, Math.min(400, Math.floor(fallback)));
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

/** span-grid BorderDirection: Top=1, Bottom=2, Right=4, Left=8, All=15 */
const BG_TOP = 1;
const BG_BOTTOM = 2;
const BG_RIGHT = 4;
const BG_LEFT = 8;

function defaultSpanGridBorder(): SpanGridBorderJson {
  return {
    topColor: '#e2e8f0',
    rightColor: '#e2e8f0',
    bottomColor: '#e2e8f0',
    leftColor: '#e2e8f0',
    borderDirection: 15,
    lineStyle: 'Solid',
    lineWidth: 1,
  };
}


function extractGridLineColor(cells: SpanGridExportCell[]): string {
  for (const cell of cells) {
    if (!cell.border) continue;
    const b = cell.border;
    const raw = b.topColor || b.leftColor || b.rightColor || b.bottomColor;
    if (raw) {
      const c = normalizeColorForXcon(raw);
      if (c) return c;
    }
  }
  return '226,232,240,255';
}


function computeCellBorderXconFields(
  b: SpanGridBorderJson,
  r: number,
  c: number,
  nRows: number,
  nCols: number,
): Record<string, string> {
  const dir = typeof b.borderDirection === 'number' && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
  const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));

  const leftW   = (c === 0       && (dir & BG_LEFT))   ? Math.max(0, Math.min(20, Math.round(Number(b.leftLineWidth   ?? baseW)))) : 0;
  const topW    = (r === 0       && (dir & BG_TOP))    ? Math.max(0, Math.min(20, Math.round(Number(b.topLineWidth    ?? baseW)))) : 0;

  const rightW  = (c < nCols - 1 && (dir & BG_RIGHT))  ? Math.max(0, Math.min(20, Math.round(Number(b.rightLineWidth  ?? baseW)))) : 0;
  const bottomW = (r < nRows - 1 && (dir & BG_BOTTOM)) ? Math.max(0, Math.min(20, Math.round(Number(b.bottomLineWidth ?? baseW)))) : 0;

  if (leftW + topW + rightW + bottomW === 0) return { border: 'false' };

  const cStr = b.rightColor || b.bottomColor || b.leftColor || b.topColor || '#e2e8f0';
  const rgba  = normalizeColorForXcon(cStr) || '226,232,240,255';

  return {
    border: 'true',
    borderWidth: '-1',
    borderColor: rgba,
    borderTop:    String(topW),
    borderRight:  String(rightW),
    borderBottom: String(bottomW),
    borderLeft:   String(leftW),
  };
}


function applyBorderToFigmaFrame(
  fr: FrameNode,
  b: SpanGridBorderJson,
  r: number,
  c: number,
  nRows: number,
  nCols: number,
): void {
  const dir = typeof b.borderDirection === 'number' && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
  const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));

  const leftW   = (c === 0       && (dir & BG_LEFT))   ? Math.max(0, Math.min(20, Math.round(Number(b.leftLineWidth   ?? baseW)))) : 0;
  const topW    = (r === 0       && (dir & BG_TOP))    ? Math.max(0, Math.min(20, Math.round(Number(b.topLineWidth    ?? baseW)))) : 0;
  const rightW  = (c < nCols - 1 && (dir & BG_RIGHT))  ? Math.max(0, Math.min(20, Math.round(Number(b.rightLineWidth  ?? baseW)))) : 0;
  const bottomW = (r < nRows - 1 && (dir & BG_BOTTOM)) ? Math.max(0, Math.min(20, Math.round(Number(b.bottomLineWidth ?? baseW)))) : 0;

  if (leftW + topW + rightW + bottomW === 0) { fr.strokes = []; return; }

  const cStr = b.rightColor || b.bottomColor || b.leftColor || b.topColor || '#e2e8f0';
  const bc   = parseColor(normalizeColorForXcon(cStr) || '226,232,240,255');
  fr.strokes = [solidPaintFromParsed(bc)];
  fr.strokeAlign = 'INSIDE';
  fr.strokeTopWeight    = topW;
  fr.strokeRightWeight  = rightW;
  fr.strokeBottomWeight = bottomW;
  fr.strokeLeftWeight   = leftW;
}


function computeCellBorderXconFieldsCenter(b: SpanGridBorderJson): Record<string, string> {
  const dir = typeof b.borderDirection === 'number' && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
  const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));
  const leftW   = (dir & BG_LEFT)   ? Math.max(0, Math.min(20, Math.round(Number(b.leftLineWidth   ?? baseW)))) : 0;
  const topW    = (dir & BG_TOP)    ? Math.max(0, Math.min(20, Math.round(Number(b.topLineWidth    ?? baseW)))) : 0;
  const rightW  = (dir & BG_RIGHT)  ? Math.max(0, Math.min(20, Math.round(Number(b.rightLineWidth  ?? baseW)))) : 0;
  const bottomW = (dir & BG_BOTTOM) ? Math.max(0, Math.min(20, Math.round(Number(b.bottomLineWidth ?? baseW)))) : 0;
  if (leftW + topW + rightW + bottomW === 0) return { border: 'false' };
  const cStr = b.leftColor || b.topColor || b.rightColor || b.bottomColor || '#e2e8f0';
  const rgba = normalizeColorForXcon(cStr) || '226,232,240,255';
  return {
    border: 'true',
    borderWidth: '-1',
    borderColor: rgba,
    borderTop:    String(topW),
    borderRight:  String(rightW),
    borderBottom: String(bottomW),
    borderLeft:   String(leftW),
    _strokeCenter: 'true',
  };
}


function applyBorderToFigmaFrameCenter(fr: FrameNode, b: SpanGridBorderJson): void {
  const dir = typeof b.borderDirection === 'number' && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
  const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));
  const leftW   = (dir & BG_LEFT)   ? Math.max(0, Math.min(20, Math.round(Number(b.leftLineWidth   ?? baseW)))) : 0;
  const topW    = (dir & BG_TOP)    ? Math.max(0, Math.min(20, Math.round(Number(b.topLineWidth    ?? baseW)))) : 0;
  const rightW  = (dir & BG_RIGHT)  ? Math.max(0, Math.min(20, Math.round(Number(b.rightLineWidth  ?? baseW)))) : 0;
  const bottomW = (dir & BG_BOTTOM) ? Math.max(0, Math.min(20, Math.round(Number(b.bottomLineWidth ?? baseW)))) : 0;
  if (leftW + topW + rightW + bottomW === 0) { fr.strokes = []; return; }
  const cStr = b.leftColor || b.topColor || b.rightColor || b.bottomColor || '#e2e8f0';
  const bc = parseColor(normalizeColorForXcon(cStr) || '226,232,240,255');
  fr.strokes = [solidPaintFromParsed(bc)];
  fr.strokeAlign = 'CENTER';
  fr.strokeTopWeight    = topW;
  fr.strokeRightWeight  = rightW;
  fr.strokeBottomWeight = bottomW;
  fr.strokeLeftWeight   = leftW;
}

function mergeSpanGridBorders(
  grid: SpanGridBorderJson | null | undefined,
  col: SpanGridBorderJson | null | undefined,
  row: SpanGridBorderJson | null | undefined,
  cell: SpanGridBorderJson | null | undefined
): SpanGridBorderJson {
  return {
    ...defaultSpanGridBorder(),
    ...(grid || {}),
    ...(col || {}),
    ...(row || {}),
    ...(cell || {}),
  };
}


function spanBorderToXconFields(b: SpanGridBorderJson): Record<string, string> {
  const dir = typeof b.borderDirection === 'number' && !Number.isNaN(b.borderDirection) ? b.borderDirection : 15;
  const baseW = Math.max(0, Math.min(20, Math.round(Number(b.lineWidth) || 1)));
  const topW = (dir & BG_TOP) ? Math.max(0, Math.min(20, Math.round(Number(b.topLineWidth ?? baseW)))) : 0;
  const bottomW = (dir & BG_BOTTOM) ? Math.max(0, Math.min(20, Math.round(Number(b.bottomLineWidth ?? baseW)))) : 0;
  const rightW = (dir & BG_RIGHT) ? Math.max(0, Math.min(20, Math.round(Number(b.rightLineWidth ?? baseW)))) : 0;
  const leftW = (dir & BG_LEFT) ? Math.max(0, Math.min(20, Math.round(Number(b.leftLineWidth ?? baseW)))) : 0;
  const any = topW + bottomW + leftW + rightW > 0;
  if (!any) {
    return { border: 'false' };
  }
  const cStr = b.topColor || b.leftColor || b.rightColor || b.bottomColor || '#e2e8f0';
  const rgba = normalizeColorForXcon(cStr) || '226,232,240,255';
  return {
    border: 'true',
    borderWidth: '-1',
    borderColor: rgba,
    borderTop: String(topW),
    borderRight: String(rightW),
    borderBottom: String(bottomW),
    borderLeft: String(leftW),
  };
}

type FontName = { family: string; style: string };


function fitIntSizes(sizes: number[], target: number, min: number = 1): number[] {
  if (sizes.length === 0) return [];
  const t = Math.max(1, Math.floor(target));
  const tot0 = sum(sizes) || 1;
  const raw = sizes.map((s) => (s * t) / tot0);
  const out = raw.map((r) => Math.max(min, Math.floor(r)));
  let s0 = sum(out);
  let guard = 0;
  for (let i = 0; s0 < t && guard < 1e5; i += 1, guard += 1) {
    out[i % out.length]! += 1;
    s0 += 1;
  }
  guard = 0;
  for (let i = out.length - 1; s0 > t && guard < 1e5; i = (i + out.length - 1) % out.length, guard += 1) {
    if (out[i]! > min) {
      out[i]! -= 1;
      s0 -= 1;
    }
  }
  return out;
}


function buildSpanGridTableXcon(data: SpanGridExportPayload): XconNode {
  //console.log('buildSpanGridTableXcon', data);
  const cols = data.cols || [];
  const rows = data.rows || [];
  const colW = cols.map((c) => Math.max(1, Math.floor(Number(c.width) || 40)));
  const rowH = rows.map((r) => Math.max(1, Math.floor(Number(r.height) || 24)));
  const N = colW.length;
  const M = rowH.length;


  const colPrefix: number[] = [0];
  for (let i = 0; i < N; i += 1) colPrefix.push(colPrefix[i]! + colW[i]!);
  const rowPrefix: number[] = [0];
  for (let i = 0; i < M; i += 1) rowPrefix.push(rowPrefix[i]! + rowH[i]!);


  //   totalH = rowPrefix[M] + M + 1
  const totalW = colPrefix[N]! + N + 1;
  const totalH = rowPrefix[M]! + M + 1;
  const zoom = (data.gridZoom != null && data.gridZoom > 0) ? data.gridZoom : 1;
  const rootW = Math.max(1, data.gridW != null ? Math.round(data.gridW / zoom) : totalW);
  const rootH = Math.max(1, data.gridH != null ? Math.round(data.gridH / zoom) : totalH);

  const rowBuckets: { c: number; node: XconNode }[][] = Array.from({ length: M }, () => []);
  const mergedAtRoot: XconNode[] = [];

  for (const cell of data.cells || []) {
    const r = cell.row;
    const c = cell.col;
    if (r < 0 || c < 0 || r >= M || c >= N) continue;
    const mr = Math.max(0, Math.floor(cell.mergeRight ?? 0));
    const md = Math.max(0, Math.floor(cell.mergeDown ?? 0));
    const cEnd = Math.min(N - 1, c + mr);
    const rEnd = Math.min(M - 1, r + md);


    const cw = colPrefix[cEnd + 1]! - colPrefix[c]! + (cEnd - c);

    const ch = rowPrefix[rEnd + 1]! - rowPrefix[r]! + (rEnd - r);

    const align   = (cell.align  || 'left').toLowerCase();
    const valign  = (cell.valign || 'middle').toLowerCase();
    const textAlign  = align  === 'center' ? 'center' : align  === 'right'  ? 'right'  : 'left';
    const textVAlign = valign === 'top'    ? 'top'    : valign === 'bottom' ? 'bottom' : 'middle';
    const fs = Math.max(4, Math.min(400, Math.floor(Number(cell.fs) || 12)));
    const fg = normalizeColorForXcon(cell.fg) || '30,41,59,255';
    const bg = normalizeColorForXcon(cell.bg) ?? '255,255,255,255';


    const xInRow = 1 + colPrefix[c]! + c;
    const xRoot  = 1 + colPrefix[c]! + c;
    const yRoot  = 1 + rowPrefix[r]! + r;

    const label: XconNode = {
      type: 'label',
      name: `cell_${r}_${c}`,
      pos: md > 0 ? `${xRoot},${yRoot},${cw},${ch}` : `${xInRow},0,${cw},${ch}`,
      text: cell.text != null && String(cell.text) !== '' ? String(cell.text) : ' ',
      fontSize: String(fs),
      font: 'Inter',
      fgColor: fg,
      bgColor: bg,
      textAlign,
      textVAlign,
    };

    if (cell.border) {
      
      const bFields = computeCellBorderXconFieldsCenter(cell.border);
      Object.assign(label, bFields);
    } else {
      label.border = 'false';
    }

    if (cell.bold)   label.bold   = true;
    if (cell.italic) label.italic = true;

    if (md > 0) {
      mergedAtRoot.push(label);
    } else {
      rowBuckets[r]!.push({ c, node: label });
    }
  }

  const components: Record<string, XconNode> = {};

  for (let r = 0; r < M; r += 1) {
    rowBuckets[r]!.sort((a, b) => a.c - b.c);
    const rowComponents: Record<string, XconNode> = {};
    rowBuckets[r]!.forEach((item, i) => {
      rowComponents[`cell_${item.c}_${i}`] = item.node;
    });

    const rh = rowH[r]!;
    components[`row_${r}`] = {
      type: 'panel',
      name: `Row ${r + 1}`,
      pos: `0,${1 + rowPrefix[r]! + r},${Math.max(1, rootW)},${rh}`,
      bgColor: '0,0,0,0',
      clipContent: 'false',
      components: rowComponents,
    };
  }

  if (mergedAtRoot.length > 0) {
    const mergedComponents: Record<string, XconNode> = {};
    mergedAtRoot.forEach((node, i) => {
      mergedComponents[`merged_${i}`] = node;
    });
    components.mergedCells = {
      type: 'panel',
      name: 'mergedCells',
      pos: `0,0,${Math.max(1, rootW)},${Math.max(1, rootH)}`,
      bgColor: '0,0,0,0',
      clipContent: 'false',
      components: mergedComponents,
    };
  }

  const rootBackColor = (data.backColor ? normalizeColorForXcon(data.backColor) : undefined) || '255,255,255,255';
  const rootNode: XconNode = {
    type: 'panel',
    name: 'xGrid',
    pos: `0,0,${Math.max(1, rootW)},${Math.max(1, rootH)}`,
    bgColor: rootBackColor,
    clipContent: 'true',
    components,
  };

  if (data.gridBorder) {
    const gf = spanBorderToXconFields(data.gridBorder);
    Object.assign(rootNode, gf);
  }

  return rootNode;
}


const globalFallbacks: FontName[] = [
  { family: 'Inter', style: 'Regular' },
  { family: 'Inter', style: 'Medium' },
  { family: 'Inter', style: 'Bold' },
  { family: 'Roboto', style: 'Regular' },
];

const fontCache = new Map<string, FontName>();
function fontCacheKey(f: FontName): string {
  return f.family + '\0' + f.style;
}

function cssFontWeightToFigmaStyle(weight: string | number | undefined): string {
  if (weight === undefined || weight === null) return 'Regular';
  const raw = typeof weight === 'number' ? String(weight) : String(weight).trim();
  if (!raw) return 'Regular';
  const w = raw.toLowerCase();
  if (w === 'normal' || w === 'regular' || w === '400') return 'Regular';
  if (w === 'medium' || w === '500') return 'Medium';
  if (w === 'semibold' || w === 'semi-bold' || w === '600' || w === 'demi bold' || w === 'demi') return 'Semi Bold';
  if (w === 'bold' || w === '700') return 'Bold';
  if (w === 'extrabold' || w === 'extra-bold' || w === '800') return 'Extra Bold';
  if (w === 'black' || w === '900' || w === 'heavy') return 'Black';
  if (w === 'light' || w === '300') return 'Light';
  if (w === 'thin' || w === '100') return 'Thin';
  if (w === '200') return 'Extra Light';
  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    if (n <= 350) return 'Light';
    if (n <= 450) return 'Regular';
    if (n <= 550) return 'Medium';
    if (n <= 650) return 'Semi Bold';
    if (n <= 750) return 'Bold';
    if (n <= 850) return 'Extra Bold';
    return 'Black';
  }
  return raw;
}

async function loadFontForStyle(fontFamily: string, fontWeight: string): Promise<FontName> {
  const family = fontFamily || 'Inter';
  let style = 'Regular';
  if (fontWeight) {
    const w = fontWeight.toLowerCase();
    if (w === 'bold') style = 'Bold';
    else if (w === 'semi-bold' || w === 'semibold') style = 'Semi Bold';
    else if (w === 'medium') style = 'Medium';
  }
  const font: FontName = { family, style };
  const cacheKey = fontCacheKey(font);
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }
  try {
    await figma.loadFontAsync(font);
    fontCache.set(cacheKey, font);
    return font;
  } catch {
    fontCache.set(cacheKey, globalFallbacks[0]!);
    return globalFallbacks[0]!;
  }
}

async function ensureTableFonts(
  _fonts: { fontFamily: string; fontWeight: number; bold: boolean; italic: boolean; underline: boolean; strikethrough: boolean }[]
): Promise<void> {
  for (const f of globalFallbacks) {
    await loadFontForStyle(f.family, f.style);
  }
}


function applyFrameStrokesFromXconData(fr: FrameNode, data: XconNode): void {
  if (data.border === 'false' || !data.borderColor) {
    return;
  }
  if (data.border !== 'true') {
    return;
  }
  
  const sa: 'INSIDE' | 'CENTER' =
    (data as { _strokeCenter?: string })._strokeCenter === 'true' ? 'CENTER' : 'INSIDE';
  const bw = parseInt(String(data.borderWidth || '0'), 10);
  const bc = parseColor(String(data.borderColor));
  if (bw === -1) {
    const d = data as XconNode & {
      borderLeft?: string;
      borderTop?: string;
      borderRight?: string;
      borderBottom?: string;
    };
    const bl = parseInt(String(d.borderLeft || '0'), 10);
    const bt = parseInt(String(d.borderTop || '0'), 10);
    const brW = parseInt(String(d.borderRight || '0'), 10);
    const bb = parseInt(String(d.borderBottom || '0'), 10);
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

async function loadFontForLabel(data: XconNode): Promise<FontName> {
  const font: FontName = { family: (data.font as string) || 'Inter', style: cssFontWeightToFigmaStyle(data.fontWeight as string | number | undefined) };
  if (data.bold) font.style = 'Bold';
  if (data.italic) font.style = 'Italic';
  return loadFontForStyle(font.family, font.style);
}

async function createNodeFromXconData(data: XconNode, childKey?: string): Promise<SceneNode | null> {
  if (data.visible === 'false') return null;

  const type = (data.type || (data as { polymorph?: string }).polymorph || 'panel').toLowerCase();
  const { x, y, w, h } = parsePos(data.pos);
  const name = data.name || (data as { id?: string }).id || childKey || type;

  if (type === 'panel' || type === 'xform') {
    const frame = figma.createFrame();
    frame.x = x;
    frame.y = y;
    frame.resize(w, h);
    frame.name = name;
    const bg = parseColor(data.bgColor);
    frame.fills = [solidPaintFromParsed(bg)];
    const bw = parseInt((data.borderWidth as string) || '0', 10);
    if (data.border === 'true' && data.borderColor) {
      const bc = parseColor((data.borderColor as string) || '0,0,0,255');
      if (!isNaN(bw) && bw > 0) {
        frame.strokes = [solidPaintFromParsed(bc)];
        frame.strokeWeight = bw;
        frame.strokeAlign = 'INSIDE';
      }
    }
    const r = data.round;
    if (r) {
      const radius = parseInt(String(r), 10);
      if (!isNaN(radius) && radius >= 0) frame.cornerRadius = radius;
    }
    frame.clipsContent = data.clipContent === 'true';
    const pad = parsePadding((data as { padding?: string }).padding);
    frame.paddingLeft = pad.left;
    frame.paddingRight = pad.right;
    frame.paddingTop = pad.top;
    frame.paddingBottom = pad.bottom;

    if (data.components && typeof data.components === 'object') {
      const allKeys = Object.keys(data.components);
      const ordered = (data as { componentsOrder?: string }).componentsOrder
        ? (() => {
            const fromOrder = (data as { componentsOrder: string }).componentsOrder
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean);
            const set = new Set(fromOrder);
            return [
              ...fromOrder.filter((k) => allKeys.includes(k)),
              ...allKeys.filter((k) => !set.has(k)),
            ];
          })()
        : allKeys;
      for (const key of ordered) {
        const childData = (data.components as Record<string, XconNode>)[key]!;
        if (!childData || typeof childData !== 'object') continue;
        const childNode = await createNodeFromXconData(childData, key);
        if (childNode) frame.appendChild(childNode);
      }
    }
    return frame;
  }

  if (type === 'label') {
    const font = await loadFontForLabel(data);
    const fg = (data as { fgColor?: string }).fgColor ? parseColor((data as { fgColor: string }).fgColor) : { r: 0, g: 0, b: 0, a: 1 };
    const fs = parseInt((data as { fontSize?: string }).fontSize || '12', 10);
    const fontSize = isNaN(fs) ? 12 : Math.max(4, Math.min(400, fs));
    const characters = (data.text != null ? (data as { text: string }).text : '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    if (data.bgColor) {
      const fr = figma.createFrame();
      fr.x = x;
      fr.y = y;
      fr.resize(w, h);
      fr.name = name;
      fr.layoutMode = 'HORIZONTAL';
      fr.primaryAxisSizingMode = 'FIXED';
      fr.counterAxisSizingMode = 'FIXED';
      const ta = (data as { textAlign?: string }).textAlign;
      fr.primaryAxisAlignItems = ta === 'center' ? 'CENTER' : ta === 'right' ? 'MAX' : 'MIN';
      fr.counterAxisAlignItems = 'CENTER';
      fr.paddingLeft = 4;
      fr.paddingRight = 4;
      fr.paddingTop = 2;
      fr.paddingBottom = 2;
      fr.clipsContent = true;
      const bg2 = parseColor((data as { bgColor: string }).bgColor);
      fr.fills = [solidPaintFromParsed(bg2)];
      applyFrameStrokesFromXconData(fr, data as XconNode);
      const text = figma.createText();
      text.name = `${name}_text`;
      text.fontName = font;
      text.characters = characters;
      text.fontSize = fontSize;
      text.fills = [{ type: 'SOLID', color: { r: fg.r, g: fg.g, b: fg.b } }];
      const tah = (data as { textAlign?: string }).textAlign;
      text.textAlignHorizontal = tah === 'center' ? 'CENTER' : tah === 'right' ? 'RIGHT' : 'LEFT';
      const tva = (data as { textVAlign?: string }).textVAlign || '';
      const vl = tva.toLowerCase();
      text.textAlignVertical =
        vl === 'middle' || vl === 'center' ? 'CENTER' : vl === 'bottom' ? 'BOTTOM' : 'TOP';
      fr.appendChild(text);
      text.layoutSizingHorizontal = 'FILL';
      text.layoutSizingVertical = 'FIXED';
      return fr;
    }

    const tnode = figma.createText();
    tnode.x = x;
    tnode.y = y;
    tnode.fontName = font;
    tnode.characters = characters;
    tnode.fontSize = fontSize;
    tnode.name = name;
    tnode.fills = [{ type: 'SOLID', color: { r: fg.r, g: fg.g, b: fg.b } }];
    if (w >= 1 && h >= 1) tnode.resize(w, h);
    if ((data as { textAlign?: string }).textAlign === 'center') tnode.textAlignHorizontal = 'CENTER';
    else if ((data as { textAlign?: string }).textAlign === 'right') tnode.textAlignHorizontal = 'RIGHT';
    const tva2 = (data as { textVAlign?: string }).textVAlign || '';
    if (tva2.toLowerCase() === 'middle' || tva2.toLowerCase() === 'center') tnode.textAlignVertical = 'CENTER';
    else if (tva2.toLowerCase() === 'bottom') tnode.textAlignVertical = 'BOTTOM';
    else tnode.textAlignVertical = 'TOP';
    return tnode;
  }

  return null;
}

function asRowsCols(snapshot: unknown): {
  rows: unknown[];
  cols: unknown[];
  merges: SpanGridMergeJson[];
  name: string;
  gridBorder: unknown;
  backColor: string | undefined;
  gridW: number | undefined;
  gridH: number | undefined;
  gridZoom: number | undefined;
} | null {
  if (!snapshot || typeof snapshot !== 'object') return null;
  const o = snapshot as { rows?: unknown; cols?: unknown; merges?: unknown; name?: unknown; gridBorder?: unknown; backColor?: unknown; width?: unknown; height?: unknown; zoom?: unknown };
  if (!Array.isArray(o.rows) || o.rows.length === 0) return null;
  const colArr = Array.isArray(o.cols) ? o.cols : [];
  const merges: SpanGridMergeJson[] = Array.isArray(o.merges) ? (o.merges as SpanGridMergeJson[]) : [];
  return {
    rows: o.rows,
    cols: colArr,
    merges,
    name: typeof o.name === 'string' ? o.name : 'SpanGrid',
    gridBorder: o.gridBorder,
    backColor: typeof o.backColor === 'string' ? o.backColor : undefined,
    gridW: typeof o.width === 'number' && o.width > 0 ? Math.round(o.width) : undefined,
    gridH: typeof o.height === 'number' && o.height > 0 ? Math.round(o.height) : undefined,
    gridZoom: typeof o.zoom === 'number' && o.zoom > 0 ? o.zoom : undefined,
  };
}

function getCellData(rows: unknown[], r: number, c: number): SpanGridCellJson {
  const row = rows[r] as { cells?: unknown } | undefined;
  const cells = row && Array.isArray((row as { cells?: unknown[] }).cells) ? (row as { cells: unknown[] }).cells! : [];
  return (typeof cells[c] === 'object' && cells[c] != null
    ? (cells[c] as SpanGridCellJson)
    : {}) as SpanGridCellJson;
}

function spanGridToExportPayload(
  snapshot: unknown,
  targetW: number,
  targetH: number
): SpanGridExportPayload | null {
  const p = asRowsCols(snapshot);
  if (!p) return null;
  const { rows, cols: colSrc, merges, name: gridName, gridBorder: gridBorderRaw } = p;
  const gridB = gridBorderRaw as SpanGridBorderJson | undefined;
  const rowCount = rows.length;
  const cellWCount = Math.max(
    colSrc.length,
    ...rows.map((row) => {
      const c = (row as { cells?: unknown[] })?.cells;
      return Array.isArray(c) ? c.length : 0;
    })
  );
  if (rowCount === 0 || cellWCount === 0) return null;

  const colWidthsRaw: number[] = [];
  for (let c = 0; c < cellWCount; c += 1) {
    const fromCol = colSrc[c] as { width?: number } | undefined;
    const w0 = fromCol && typeof fromCol.width === 'number' && fromCol.width > 0 ? fromCol.width : 80;
    colWidthsRaw.push(w0);
  }
  const rowHeightsRaw = rows.map((row) => {
    const h0 =
      (row as { height?: number }).height != null && (row as { height: number }).height > 0
        ? (row as { height: number }).height
        : 24;
    return h0;
  });

  const totalH0 = sum(rowHeightsRaw) || 1;
  const tw = Math.max(1, targetW);
  const th = Math.max(1, targetH);
  const colW = fitIntSizes(colWidthsRaw, tw, 1);
  const rowH = fitIntSizes(rowHeightsRaw, th, 1);

  const nR = rowCount;
  const nC = colW.length;
  const skip: boolean[][] = Array.from({ length: nR }, () => Array(nC).fill(false));

  for (const m of merges) {
    const sr0 = m.start?.row;
    const sc0 = m.start?.col;
    const er0 = m.end?.row;
    const ec0 = m.end?.col;
    if (
      !Number.isInteger(sr0) ||
      !Number.isInteger(sc0) ||
      !Number.isInteger(er0) ||
      !Number.isInteger(ec0)
    ) {
      continue;
    }
    const r1 = Math.max(0, Math.min(nR - 1, Math.min(sr0 as number, er0 as number)));
    const r2 = Math.max(0, Math.min(nR - 1, Math.max(sr0 as number, er0 as number)));
    const c1 = Math.max(0, Math.min(nC - 1, Math.min(sc0 as number, ec0 as number)));
    const c2 = Math.max(0, Math.min(nC - 1, Math.max(sc0 as number, ec0 as number)));
    for (let r = r1; r <= r2; r += 1) {
      for (let c = c1; c <= c2; c += 1) {
        if (r === r1 && c === c1) continue;
        (skip[r]!)[c] = true;
      }
    }
  }

  const mergeSizeAt = (r: number, c: number): { mergeRight: number; mergeDown: number } | null => {
    for (const m of merges) {
      const sr0 = m.start?.row;
      const sc0 = m.start?.col;
      const er0 = m.end?.row;
      const ec0 = m.end?.col;
      if (
        !Number.isInteger(sr0) ||
        !Number.isInteger(sc0) ||
        !Number.isInteger(er0) ||
        !Number.isInteger(ec0)
      ) {
        continue;
      }
      const topR = Math.min(sr0 as number, er0 as number);
      const topC = Math.min(sc0 as number, ec0 as number);
      if (r !== topR || c !== topC) continue;
      const r2 = Math.max(sr0 as number, er0 as number);
      const c2 = Math.max(sc0 as number, ec0 as number);
      return { mergeRight: c2 - topC, mergeDown: r2 - topR };
    }
    return null;
  };

  const scaleFs = 12 * (th / (totalH0 || 1));

  const cells: SpanGridExportCell[] = [];
  for (let r = 0; r < nR; r += 1) {
    for (let c = 0; c < nC; c += 1) {
      if (skip[r]![c]) continue;
      const mrg = mergeSizeAt(r, c);
      const mergeRight = mrg ? mrg.mergeRight : 0;
      const mergeDown = mrg ? mrg.mergeDown : 0;
      const raw = getCellData(rows, r, c);
      const { align, valign } = spanAlignmentParts(raw.textAlign);
      const fs = fontSizeFromSpanFont(raw.font, scaleFs);
      const colEnt = colSrc[c] as { width?: number; border?: SpanGridBorderJson | null } | undefined;
      const rowEnt = rows[r] as { height?: number; border?: SpanGridBorderJson | null; cells?: unknown[] } | undefined;
      const merged = mergeSpanGridBorders(
        gridB,
        colEnt?.border ?? undefined,
        rowEnt?.border ?? undefined,
        raw.border ?? undefined
      );
      cells.push({
        name: raw.name != null ? String(raw.name) : '',
        row: r,
        col: c,
        text: raw.text != null ? String(raw.text) : '',
        align,
        valign,
        bg: normalizeColorForXcon(raw.backColor) || '255,255,255,255',
        fg: normalizeColorForXcon(raw.foreColor) || '30,41,59,255',
        fs,
        mergeRight,
        mergeDown,
        border: merged,
      });
    }
  }

  return {
    name: gridName || 'SpanGrid',
    cols: colW.map((w, i) => ({ name: `Col ${i + 1}`, width: w })),
    rows: rowH.map((h, i) => ({ name: `Row ${i + 1}`, height: h })),
    cells,
    backColor: normalizeColorForXcon(p.backColor) || undefined,
    gridBorder: gridB ?? defaultSpanGridBorder(),
    gridW: p.gridW,
    gridH: p.gridH,
    gridZoom: p.gridZoom,
  };
}


function spanGridToNaturalPayload(snapshot: unknown): SpanGridExportPayload | null {
  const p = asRowsCols(snapshot);
  if (!p) return null;
  const { rows, cols: colSrc } = p;
  const cellWCount = Math.max(
    colSrc.length,
    ...rows.map((row) => {
      const c = (row as { cells?: unknown[] })?.cells;
      return Array.isArray(c) ? c.length : 0;
    })
  );
  if (rows.length === 0 || cellWCount === 0) return null;

  const colWidthsRaw: number[] = [];
  for (let c = 0; c < cellWCount; c++) {
    const fromCol = colSrc[c] as { width?: number } | undefined;
    colWidthsRaw.push(Math.max(1, Math.round(fromCol?.width ?? 80)));
  }
  const rowHeightsRaw = rows.map((row) =>
    Math.max(1, Math.round((row as { height?: number }).height ?? 24))
  );

  return spanGridToExportPayload(snapshot, sum(colWidthsRaw) || 1, sum(rowHeightsRaw) || 1);
}


async function buildAutoLayoutCell(
  cell: SpanGridExportCell,
  w: number,
  h: number,
  _r: number,
  _c: number,
  _nRows: number,
  _nCols: number,
): Promise<FrameNode> {
  const fr = figma.createFrame();
  fr.name = `cell_${cell.row}_${cell.col}`;
  fr.layoutMode = 'HORIZONTAL';
  fr.primaryAxisSizingMode = 'FIXED';
  fr.counterAxisSizingMode = 'FIXED';
  fr.resize(Math.max(1, w), Math.max(1, h));
  fr.itemSpacing = 0;
  fr.clipsContent = true;
  fr.paddingLeft = 4;
  fr.paddingRight = 4;
  fr.paddingTop = 2;
  fr.paddingBottom = 2;

  const ta = (cell.align || 'left').toLowerCase();
  const va = (cell.valign || 'middle').toLowerCase();
  fr.primaryAxisAlignItems = ta === 'center' ? 'CENTER' : ta === 'right' ? 'MAX' : 'MIN';
  fr.counterAxisAlignItems = va === 'top' ? 'MIN' : va === 'bottom' ? 'MAX' : 'CENTER';

  const bg = parseColor(cell.bg ?? '255,255,255,255');
  fr.fills = [solidPaintFromParsed(bg)];


  if (cell.border) {
    applyBorderToFigmaFrameCenter(fr, cell.border);
  } else {
    fr.strokes = [];
  }

  const fontStyle = cell.bold ? 'Bold' : 'Regular';
  const font = await loadFontForStyle('Inter', fontStyle);
  const characters = (cell.text != null && String(cell.text) !== '' ? String(cell.text) : ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const fs = Math.max(4, Math.min(400, Math.floor(Number(cell.fs) || 12)));
  const fg = parseColor(cell.fg ?? '30,41,59,255');

  const text = figma.createText();
  text.name = `${fr.name}_txt`;
  text.fontName = font;
  text.characters = characters;
  text.fontSize = fs;
  text.fills = [{ type: 'SOLID', color: { r: fg.r, g: fg.g, b: fg.b } }];
  text.textAlignHorizontal = ta === 'center' ? 'CENTER' : ta === 'right' ? 'RIGHT' : 'LEFT';
  text.textAlignVertical =
    va === 'middle' || va === 'center' ? 'CENTER' : va === 'bottom' ? 'BOTTOM' : 'TOP';
  fr.appendChild(text);
  text.layoutSizingHorizontal = 'FILL';
  text.layoutSizingVertical = 'FIXED';

  return fr;
}


async function buildAutoLayoutTableDirect(
  data: SpanGridExportPayload
): Promise<FrameNode> {
  //console.log('buildAutoLayoutTableDirect', data);
  const colW = data.cols.map((c) => Math.max(1, Math.floor(c.width || 40)));
  const rowH = data.rows.map((r) => Math.max(1, Math.floor(r.height || 24)));
  const N = colW.length;
  const M = rowH.length;


  const colPrefix: number[] = [0];
  for (const w of colW) colPrefix.push(colPrefix[colPrefix.length - 1]! + w);
  const rowPrefix: number[] = [0];
  for (const h of rowH) rowPrefix.push(rowPrefix[rowPrefix.length - 1]! + h);


  // totalH = rowPrefix[M] + M + 1
  const totalW = Math.max(1, colPrefix[N]! + N + 1);
  const totalH = Math.max(1, rowPrefix[M]! + M + 1);


  const cellMap = new Map<string, SpanGridExportCell>();
  for (const cell of data.cells) cellMap.set(`${cell.row}_${cell.col}`, cell);


  const vertCovered = new Set<string>();
  for (const cell of data.cells) {
    const md = cell.mergeDown ?? 0;
    const mr = cell.mergeRight ?? 0;
    if (md > 0) {
      for (let dr = 1; dr <= md; dr++) {
        for (let dc = 0; dc <= mr; dc++) {
          vertCovered.add(`${cell.row + dr}_${cell.col + dc}`);
        }
      }
    }
  }

  // ── Root frame (xGrid) ────────────────────────────────────────────────
  const root = figma.createFrame();
  root.name = 'xGrid';
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'FIXED';
  root.counterAxisSizingMode = 'FIXED';
  root.itemSpacing = 1;
  root.paddingTop = 1; root.paddingBottom = 1;
  root.paddingLeft = 1; root.paddingRight = 1;
  root.clipsContent = true;

  const zoom = (data.gridZoom != null && data.gridZoom > 0) ? data.gridZoom : 1;
  const rootW = Math.max(1, data.gridW != null ? Math.round(data.gridW / zoom) : totalW);
  const rootH = Math.max(1, data.gridH != null ? Math.round(data.gridH / zoom) : totalH);
  root.resize(rootW, rootH);

  const bgColor = data.backColor ? parseColor(data.backColor) : { r: 1, g: 1, b: 1, a: 1 };
  root.fills = [solidPaintFromParsed(bgColor)];


  if (data.gridBorder) {
    const gb = data.gridBorder;
    const dir = typeof gb.borderDirection === 'number' && !Number.isNaN(gb.borderDirection) ? gb.borderDirection : 15;
    const baseW = Math.max(0, Math.min(20, Math.round(Number(gb.lineWidth) || 1)));
    const gTopW   = (dir & BG_TOP)    ? Math.max(0, Math.min(20, Math.round(Number(gb.topLineWidth    ?? baseW)))) : 0;
    const gRightW = (dir & BG_RIGHT)  ? Math.max(0, Math.min(20, Math.round(Number(gb.rightLineWidth  ?? baseW)))) : 0;
    const gBotW   = (dir & BG_BOTTOM) ? Math.max(0, Math.min(20, Math.round(Number(gb.bottomLineWidth ?? baseW)))) : 0;
    const gLeftW  = (dir & BG_LEFT)   ? Math.max(0, Math.min(20, Math.round(Number(gb.leftLineWidth   ?? baseW)))) : 0;
    if (gTopW + gRightW + gBotW + gLeftW > 0) {
      const cStr = gb.topColor || gb.leftColor || gb.rightColor || gb.bottomColor || '#e2e8f0';
      const gbc  = parseColor(normalizeColorForXcon(cStr) || '226,232,240,255');
      root.strokes = [solidPaintFromParsed(gbc)];
      root.strokeAlign = 'CENTER';
      root.strokeTopWeight    = gTopW;
      root.strokeRightWeight  = gRightW;
      root.strokeBottomWeight = gBotW;
      root.strokeLeftWeight   = gLeftW;
    } else { root.strokes = []; }
  } else { root.strokes = []; }


  for (let r = 0; r < M; r++) {

    const rh = rowH[r]!;
    const rowFrame = figma.createFrame();
    rowFrame.name = `Row ${r + 1}`;
    rowFrame.layoutMode = 'HORIZONTAL';
    rowFrame.primaryAxisSizingMode = 'FIXED';
    rowFrame.counterAxisSizingMode = 'FIXED';
    rowFrame.resize(rootW, rh);
    rowFrame.itemSpacing = 1;
    rowFrame.paddingTop = 0; rowFrame.paddingBottom = 0;
    rowFrame.paddingLeft = 0; rowFrame.paddingRight = 0;
    rowFrame.fills = [];
    rowFrame.strokes = [];
    rowFrame.clipsContent = false;

    let c = 0;
    while (c < N) {

      const phW = colW[c]!;

      if (vertCovered.has(`${r}_${c}`)) {
        const ph = figma.createFrame();
        ph.name = `cell_${r}_${c}_ph`;
        ph.resize(phW, rh);
        ph.fills = []; ph.strokes = [];
        rowFrame.appendChild(ph);
        ph.layoutSizingHorizontal = 'FIXED';
        ph.layoutSizingVertical = 'FILL';
        c++;
        continue;
      }

      const cell = cellMap.get(`${r}_${c}`);
      if (!cell) {
        const ph = figma.createFrame();
        ph.name = `cell_${r}_${c}`;
        ph.resize(phW, rh);
        ph.fills = []; ph.strokes = [];
        rowFrame.appendChild(ph);
        ph.layoutSizingHorizontal = 'FIXED';
        ph.layoutSizingVertical = 'FILL';
        c++;
        continue;
      }

      const mr = cell.mergeRight ?? 0;
      const md = cell.mergeDown ?? 0;
      const cEnd = Math.min(N - 1, c + mr);

      const cellW = colPrefix[cEnd + 1]! - colPrefix[c]! + (cEnd - c);

      if (md > 0) {
        const ph = figma.createFrame();
        ph.name = `cell_${r}_${c}_vph`;
        ph.resize(cellW, rh);
        ph.fills = []; ph.strokes = [];
        rowFrame.appendChild(ph);
        ph.layoutSizingHorizontal = 'FIXED';
        ph.layoutSizingVertical = 'FILL';
      } else {
        const cellFrame = await buildAutoLayoutCell(cell, cellW, rh, r, c, M, N);
        rowFrame.appendChild(cellFrame);
        cellFrame.layoutSizingHorizontal = 'FIXED';
        cellFrame.layoutSizingVertical = 'FILL';
      }
      c += mr + 1;
    }

    root.appendChild(rowFrame);
    rowFrame.layoutSizingHorizontal = 'FILL';
    rowFrame.layoutSizingVertical = 'FIXED';
  }


  for (const cell of data.cells) {
    if ((cell.mergeDown ?? 0) === 0) continue;
    const mr = cell.mergeRight ?? 0;
    const md = cell.mergeDown ?? 0;
    const cEnd = Math.min(N - 1, cell.col + mr);
    const rEnd = Math.min(M - 1, cell.row + md);

    const cellW = colPrefix[cEnd + 1]! - colPrefix[cell.col]! + (cEnd - cell.col);
    const cellH = rowPrefix[rEnd + 1]! - rowPrefix[cell.row]! + (rEnd - cell.row);

    const cellFrame = await buildAutoLayoutCell(cell, cellW, cellH, cell.row, cell.col, M, N);
    root.appendChild(cellFrame);

    cellFrame.x = 1 + colPrefix[cell.col]! + cell.col;
    cellFrame.y = 1 + rowPrefix[cell.row]! + cell.row;
    cellFrame.layoutPositioning = 'ABSOLUTE';
  }

  return root;
}

export async function replaceSelectionWithGridFromSnapshot(
  selection: ReadonlyArray<SceneNode>,
  snapshot: unknown,
  options?: { mode?: GridOutputMode }
): Promise<void> {
  //console.log('replaceSelectionWithGridFromSnapshot', selection, snapshot, options);
  const mode: GridOutputMode = options?.mode ?? 'fixed';
  if (selection.length === 0) {
    figma.notify(sn('select_then_insert'));
    return;
  }
  const first = selection[0];
  if (first?.removed) {
    figma.notify(sn('invalid_selection'));
    return;
  }
  const probe = spanGridToExportPayload(snapshot, 100, 100);
  if (!probe || !probe.rows.length || !probe.cols.length) {
    figma.notify(sn('grid_json_invalid'));
    return;
  }

  await ensureTableFonts([]);

  const parent = first?.parent;
  if (!parent || !isContainer(parent) || !('insertChild' in parent)) {
    figma.notify(sn('cannot_insert_parent'));
    return;
  }

  const cont = parent as ChildrenMixin;
  const items: { node: SceneNode; index: number; bounds: { x: number; y: number; w: number; h: number } }[] = [];
  for (const node of selection) {
    if (node.removed) continue;
    if (node.parent !== parent) {
      figma.notify(sn('same_parent_only'));
      return;
    }
    const index = cont.children.indexOf(node);
    if (index < 0) continue;
    items.push({ node, index, bounds: getNodeBounds(node) });
  }
  if (items.length === 0) {
    figma.notify(sn('no_replaceable'));
    return;
  }
  items.sort((a, b) => b.index - a.index);
  const newNodes: SceneNode[] = [];


  const naturalPayload = spanGridToNaturalPayload(snapshot);
  if (!naturalPayload || !naturalPayload.rows.length || !naturalPayload.cols.length) {
    figma.notify(sn('grid_json_empty'));
    return;
  }

  let removeNode = false;
  for (const { node, index, bounds } of items) {
    let built: SceneNode | null = null;

    if (mode === 'auto-layout') {

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
      type: 'xGrid',
      tags: ['xGrid', ...polyprops],
      status: 'polymorph',
    });

    try {
      built.setPluginData('xgrid_snapshot', JSON.stringify(snapshot));
    } catch {  }
  }
  if (newNodes.length > 0) {
    figma.currentPage.selection = newNodes;
    const modeLabel = mode === 'auto-layout' ? 'Auto Layout' : sn('mode_fixed');
    if (removeNode) {
      figma.notify(snf('grid_replaced', { mode: modeLabel, count: newNodes.length }));
    } else {
      figma.notify(snf('grid_added', { mode: modeLabel, count: newNodes.length }));
    }
  } else {
    figma.notify(sn('grid_create_failed'));
  }
}


// ---------------------------------------------------------------------------------------------------------------------
// ----- Node Meta -----
// ---------------------------------------------------------------------------------------------------------------------

interface NodeMeta {
  type?: string;
  tags?: string[];
  status?: 'polymorph' | 'polyprops' | 'draft' | 'review' | 'approved';
  comment?: string;
  updatedAt?: number;
  
  xamongAction?: unknown;
}


function setNodeMeta(node: SceneNode, data: NodeMeta) {
  node.setPluginData('meta', JSON.stringify(data));
}


function getNodeMeta(node: SceneNode): NodeMeta {
  const raw = node.getPluginData('meta');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}


function deleteNodeMeta(node: SceneNode) {
  node.setPluginData('meta', '');
}


function updateNodeMeta(node: SceneNode, partial: Partial<NodeMeta>) {
  const current = getNodeMeta(node);
  setNodeMeta(node, { ...current, ...partial, updatedAt: Date.now() });
}

let polyprops: string[] = [];
function assignNodePropertyMeta(node: SceneNode): void {
  if (!node) return;
  updateNodeMeta(node, { type: node.name, status: 'polyprops' });
  polyprops.push(node.name);
}
