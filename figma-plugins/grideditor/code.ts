// ============================================================
// Xamong Grid Editor — code.ts (Figma plugin main)
// ============================================================

import { replaceSelectionWithGridFromSnapshot, setSpanGridLang } from "./spanGridFigma";

const POLL_INTERVAL = 120;

const ONBOARDING_UI_W = 300;
const ONBOARDING_UI_H = 720;

// ── i18n (minimal, for figma.notify) ──────────────────────
const NOTICES: Record<string, Record<string, string>> = {
  en: {
    onboarding_single:   'Onboarding: only 1 layer can be selected. Keeping the last one.',
    create_select_one:   'Select exactly 1 layer to press Create.',
    onboarding_deselect: 'Only 1 layer can be selected during onboarding. Please deselect others.',
    enter_failed:        'Failed to enter workspace: ',
    grid_failed:         'Failed to insert grid: ',
    img_no_data:         'No dataURL provided.',
    img_no_sel:          'Select a node, then use "Insert Grid Image".',
    img_invalid_sel:     'Invalid selection.',
    img_no_parent:       'Cannot insert node into parent.',
    img_added:           'Added {n} grid image(s).',
    img_failed_none:     'Failed to generate grid image.',
    img_failed:          'Grid image generation failed: ',
    svg_no_data:         'No SVG data provided.',
    svg_no_sel:          'Select a node, then use "Insert SVG Vector".',
    svg_added:           'Added {n} SVG vector(s).',
    svg_failed_none:     'Failed to generate SVG vector.',
    svg_failed:          'SVG vector generation failed: ',
  },
};
let _pluginLang = 'en';
function n(key: string): string {
  return (NOTICES[_pluginLang] && NOTICES[_pluginLang][key]) || (NOTICES.en[key]) || key;
}

figma.showUI(__html__, {
  visible: true,
  width: ONBOARDING_UI_W,
  height: ONBOARDING_UI_H,
});


void figma.clientStorage.getAsync('xamong_ge_settings').then((raw) => {
  const settings = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  const savedLang = typeof settings.lang === 'string' ? settings.lang : null;
  if (savedLang && NOTICES[savedLang]) {
    _pluginLang = savedLang;
    setSpanGridLang(savedLang);
    figma.ui.postMessage({ type: 'LOAD_LANG', lang: savedLang });
  }
}).catch(() => {});

let savedSelection: ReadonlyArray<SceneNode> = [...figma.currentPage.selection];


let _lastUiW = 0, _lastUiH = 0;
let _lastUiX = 0, _lastUiY = 0;
setInterval(() => {
  savedSelection = [...figma.currentPage.selection];
}, 250);

function round(n: number) {
  return Math.round(n * 100) / 100;
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


let uiWorkspaceActive = false;
let lastCommand = '';

function syncUiToViewport() {
  if (!uiWorkspaceActive) return;
  const b = figma.viewport.bounds;
  const z = figma.viewport.zoom;

  const newW = Math.max(200, Math.round(b.width * z));
  const newH = Math.max(120, Math.round(b.height * z));
  const newX = b.x;
  const newY = b.y;


  if (lastCommand !== 'PAN_VIEWPORT' && lastCommand !== 'ZOOM_VIEWPORT' && lastCommand !== 'FIT_TO_GRID') {
    if (newX !== _lastUiX || newY !== _lastUiY) {
      _lastUiX = newX; _lastUiY = newY;
      figma.ui.reposition(newX, newY);
    }
  }


  if (newW !== _lastUiW || newH !== _lastUiH) {
    _lastUiW = newW; _lastUiH = newH;
    figma.ui.resize(newW, newH);
  }
}

type IncomingUiMessage =
  | { type: "REFRESH" }
  | { type: "SELECT_NODE"; id: string }
  | { type: "ZOOM_TO_NODE"; id: string }
  | { type: "CREATE_GRID"; payload: any; mode?: "fixed" | "auto-layout" }
  | { type: "CREATE_GRID_IMAGE"; dataURL: string; width: number; height: number }
  | { type: "CREATE_GRID_SVG"; svgString: string }
  | { type: "ENTER_WORKSPACE" }
  | { type: "LEAVE_WORKSPACE" }
  | { type: "SAVE_GRID_SNAPSHOT"; payload: unknown }
  | { type: "LOAD_XGRID_NODE"; nodeId?: string }
  | { type: "SET_LANG"; lang: string }
  | { type: "PAN_VIEWPORT"; dx: number; dy: number }
  | { type: "ZOOM_VIEWPORT"; newZoom: number; pivotCanvasX: number; pivotCanvasY: number }
  | { type: "FIT_TO_GRID" }
  | { type: "ACK_VIEWPORT_DATA" };

type RgbaColor = { r: number; g: number; b: number; a: number };


const _B64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function uint8ToBase64(u8: Uint8Array): string {
  const n = u8.length;
  if (n === 0) return "";
  let out = "";
  for (let i = 0; i < n; i += 3) {
    const a = u8[i] as number;
    const b = i + 1 < n ? (u8[i + 1] as number) : 0;
    const c = i + 2 < n ? (u8[i + 2] as number) : 0;
    const t = (a << 16) | (b << 8) | c;
    out += _B64[(t >> 18) & 63] + _B64[(t >> 12) & 63];
    out += (i + 1 < n ? _B64[(t >> 6) & 63] : "=") + (i + 2 < n ? _B64[t & 63] : "=");
  }
  return out;
}


function dataURLToUint8(dataURL: string): Uint8Array {
  const b64 = dataURL.replace(/^data:[^;]+;base64,/, "");
  const n = b64.length;
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  const byteLen = Math.floor(n * 3 / 4) - pad;
  const bytes = new Uint8Array(byteLen);
  let idx = 0;
  for (let i = 0; i < n; i += 4) {
    const a = _B64.indexOf(b64[i] as string);
    const b = _B64.indexOf(b64[i + 1] as string);
    const c = b64[i + 2] === "=" ? 0 : _B64.indexOf(b64[i + 2] as string);
    const d = b64[i + 3] === "=" ? 0 : _B64.indexOf(b64[i + 3] as string);
    const v = (a << 18) | (b << 12) | (c << 6) | d;
    if (idx < byteLen) bytes[idx++] = (v >> 16) & 0xff;
    if (idx < byteLen) bytes[idx++] = (v >> 8) & 0xff;
    if (idx < byteLen) bytes[idx++] = v & 0xff;
  }
  return bytes;
}

function addSceneNodeSubtreeTo(root: SceneNode, out: SceneNode[]): void {
  out.push(root);
  if ("children" in root) {
    for (const ch of (root as ChildrenMixin).children) {
      addSceneNodeSubtreeTo(ch, out);
    }
  }
}


function mapNodeData(
  node: SceneNode,
  bounds: { x: number; y: number; width: number; height: number },
  zoom: number,
  frameMap: Record<string, string>,
  selectedIds: string[]
): object {
  const box = node.absoluteBoundingBox!;

  let fillColor: string | null = null;
  if ("fills" in node && Array.isArray((node as GeometryMixin).fills)) {
    const fills = (node as GeometryMixin).fills as ReadonlyArray<Paint>;
    for (let i = fills.length - 1; i >= 0; i--) {
      const f = fills[i];
      if (f.type === "SOLID" && f.visible !== false) {
        const c = f.color;
        const a = f.opacity !== undefined ? f.opacity : 1;
        fillColor = `rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${a})`;
        break;
      }
    }
  }

  if (frameMap[node.id]) {
    (async () => {
      const pngData = await node.exportAsync({ format: 'PNG' });
      figma.ui.postMessage({ type: "DISPLAY_IMAGE", bytes: pngData, id: node.id, tp: node.type });
    })();
  }

  let textContent: string | null = null;
  if (node.type === "TEXT" && node.characters) {
    textContent = node.characters.slice(0, 80);
  }

  const isComponent =
    node.type === "COMPONENT" ||
    node.type === "COMPONENT_SET" ||
    node.type === "INSTANCE";

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
    visible: "visible" in node ? (node as SceneNode & { visible: boolean }).visible : true,
    locked: "locked" in node ? (node as SceneNode & { locked: boolean }).locked : false,
  };
}


const OFFSCREEN_DEFERRED    = true;
const MAX_NODES_PER_TICK    = 100;
const OFFSCREEN_BATCH_DELAY = 100;
let _offscreenLoadToken = 0;


let _pendingOffscreenBatch: {
  frames: SceneNode[];
  bounds: { x: number; y: number; width: number; height: number };
  zoom: number;
  selectedIds: string[];
  token: number;
} | null = null;


let _offscreenSyncDone = false;

let _offscreenInProgress = false;

let _wsNodeId: string | null = null;

let _wsPageId: string | null = null;

const _docChangePending = new Set<string>();

let _docChangeTimer: ReturnType<typeof setTimeout> | null = null;


function* iterateSubtree(root: SceneNode): Generator<SceneNode> {
  yield root;
  if ("children" in root) {
    for (const ch of (root as ChildrenMixin).children) {
      yield* iterateSubtree(ch);
    }
  }
}


function sendOffscreenBatches(
  frames: SceneNode[],
  _startIdx: number,
  bounds: { x: number; y: number; width: number; height: number },
  zoom: number,
  selectedIds: string[],
  token: number
): void {
  _offscreenInProgress = true;

  const frameMap: Record<string, string> = {};
  frames.forEach(f => {
    if ("name" in f) frameMap[f.id] = (f as FrameNode).name;
  });


  function* allNodes(): Generator<SceneNode> {
    for (const frame of frames) {
      yield* iterateSubtree(frame);
    }
  }

  _tickOffscreenBatch(allNodes(), frameMap, bounds, zoom, selectedIds, token);
}


function _tickOffscreenBatch(
  gen: Generator<SceneNode>,
  frameMap: Record<string, string>,
  bounds: { x: number; y: number; width: number; height: number },
  zoom: number,
  selectedIds: string[],
  token: number
): void {
  setTimeout(() => {
    if (token !== _offscreenLoadToken) {
      _offscreenInProgress = false;
      return;
    }

    const rawNodes: SceneNode[] = [];
    let next = gen.next();
    while (!next.done && rawNodes.length < MAX_NODES_PER_TICK) {
      rawNodes.push(next.value);
      next = gen.next();
    }

    const isLast = next.done === true;

    if (rawNodes.length > 0) {
      const nodes = rawNodes.map(n => mapNodeData(n, bounds, zoom, frameMap, selectedIds));
      figma.ui.postMessage({
        type: "APPEND_NODES",
        payload: { nodes, frames: frameMap, isLast },
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

function sendAll(): void {

  const token = ++_offscreenLoadToken;
  _offscreenSyncDone = false;
  _offscreenInProgress = false;
  try {
  const vp = figma.viewport;
  const bounds = vp.bounds;
  const zoom = vp.zoom;
  const page = figma.currentPage;

  const bgColor: RgbaColor = { r: 0.15, g: 0.15, b: 0.15, a: 1 };
  const bg = page.backgrounds;
 
  if (bg && bg.length > 0 && bg[0].type === "SOLID") {
    bgColor.r = bg[0].color.r;
    bgColor.g = bg[0].color.g;
    bgColor.b = bg[0].color.b;
    bgColor.a = bg[0].opacity !== undefined ? bg[0].opacity : 1;
  }

  const frameMap = {} as Record<string, string>;
  let rawNodes = [] as SceneNode[];
  let hasMore = false;
  
  let searchType = figma.editorType === "slides" ? "all" : "top"; // "top" or "all"
  if (searchType === "top") {

    const frames = page.children as SceneNode[];
    const offscreenFrames: SceneNode[] = [];

    frames.forEach((frame) => {
      if (!("absoluteBoundingBox" in frame)) return;
      const box = (frame as SceneNode).absoluteBoundingBox;
      if (!box) return;
      const inViewport =
        box.x < bounds.x + bounds.width &&
        box.x + box.width > bounds.x &&
        box.y < bounds.y + bounds.height &&
        box.y + box.height > bounds.y;
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
        const aDist = aBox
          ? (aBox.x + aBox.width  / 2 - vpCx) ** 2
          + (aBox.y + aBox.height / 2 - vpCy) ** 2
          : 0;
        const bDist = bBox
          ? (bBox.x + bBox.width  / 2 - vpCx) ** 2
          + (bBox.y + bBox.height / 2 - vpCy) ** 2
          : 0;
        return aDist - bDist;
      });


      _pendingOffscreenBatch = {
        frames: offscreenFrames,
        bounds,
        zoom,
        selectedIds: page.selection.map(s => s.id),
        token,
      };
    } else {
      _pendingOffscreenBatch = null;
    }

  } else {

    rawNodes = page.findAll((node) => {
      if (!("absoluteBoundingBox" in node)) return false;
      const box = (node as SceneNode).absoluteBoundingBox;
      if (!box) return false;
      return (
        box.x < bounds.x + bounds.width &&
        box.x + box.width > bounds.x &&
        box.y < bounds.y + bounds.height &&
        box.y + box.height > bounds.y
      );
    });
  }

  const selectedIds = page.selection.map((s) => s.id);

  const nodes = rawNodes.map((node) => mapNodeData(node as SceneNode, bounds, zoom, frameMap, selectedIds));

  figma.ui.postMessage({
    type: "VIEWPORT_DATA",
    payload: {
      zoom: zoom,
      bounds: bounds,
      bgColor: bgColor,
      nodes: nodes,
      frames: frameMap,
      pageId: page.id,
      pageName: page.name,
      selectedIds: selectedIds,
      calibration: { dx: -1, dy: -1 },
      screenW: Math.round(bounds.width * zoom),
      screenH: Math.round(bounds.height * zoom),
      hasMore: hasMore,
    },
  });
} catch (e) {
  console.error('---> sendAll error: ', e);
}
}


function sendSelectionData(): void {
  const sel = figma.currentPage.selection;
  const selectedIds = sel.map((s) => s.id);


  let xGridNodeId: string | null = null;
  let hasXGridSnapshot = false;
  if (sel.length === 1) {
    const node = sel[0]!;
    try {
      const metaRaw = node.getPluginData('meta');
      if (metaRaw) {
        const meta = JSON.parse(metaRaw) as { type?: string };
        if (meta.type === 'xGrid') {
          xGridNodeId = node.id;
          hasXGridSnapshot = !!node.getPluginData('xgrid_snapshot');
        }
      }
    } catch { /* ignore */ }
  }

  figma.ui.postMessage({
    type: "SELECTION_CHANGE",
    payload: {
      selectedIds,
      xGridNodeId,
      hasXGridSnapshot,
    },
  });
}


function sendViewportUpdate(): void {
  const vp = figma.viewport;
  const page = figma.currentPage;
  const bgColor: RgbaColor = { r: 0.15, g: 0.15, b: 0.15, a: 1 };
  const bg = page.backgrounds;
  if (bg && bg.length > 0 && bg[0].type === "SOLID") {
    bgColor.r = bg[0].color.r;
    bgColor.g = bg[0].color.g;
    bgColor.b = bg[0].color.b;
    bgColor.a = bg[0].opacity !== undefined ? bg[0].opacity : 1;
  }
  figma.ui.postMessage({
    type: "UPDATE_VIEWPORT",
    payload: { zoom: vp.zoom, bounds: vp.bounds, bgColor },
  });
}


function sendPatchNodes(ids: string[]): void {
  if (ids.length === 0) return;
  const vp = figma.viewport;
  const bounds = vp.bounds;
  const zoom = vp.zoom;
  const page = figma.currentPage;
  const selectedIds = page.selection.map((s) => s.id);
  const frameMap: Record<string, string> = {};
  const nodes: object[] = [];

  for (const id of ids) {
    let node: BaseNode | null = null;
    try { node = figma.getNodeById(id); } catch { continue; }
    if (!node || !("absoluteBoundingBox" in node)) continue;
    const sn = node as SceneNode;
    if (!sn.absoluteBoundingBox) continue;


    let cur: BaseNode | null = sn.parent;
    while (cur && cur.type !== "PAGE") {
      if (cur.parent?.type === "PAGE") {
        frameMap[cur.id] = cur.name;
      }
      cur = cur.parent;
    }
    nodes.push(mapNodeData(sn, bounds, zoom, frameMap, selectedIds));
  }

  if (nodes.length === 0) return;
  figma.ui.postMessage({ type: "PATCH_NODES", payload: { nodes, frames: frameMap } });
}


function sendDeleteNodes(ids: string[]): void {
  if (ids.length === 0) return;
  figma.ui.postMessage({ type: "DELETE_NODES", payload: { ids } });
}


function getDepth(node: SceneNode): number {
  let d = 0;
  let cur: BaseNode | null = node.parent;
  while (cur && cur.type !== "PAGE") {
    d++;
    cur = cur.parent;
  }
  return d;
}


function enforceSingleLayerWhileOnboarding(): void {
  if (uiWorkspaceActive) return;
  const sel = figma.currentPage.selection;
  if (sel.length <= 1) return;
  const keep = sel[sel.length - 1] as SceneNode;
  figma.notify(n('onboarding_single'), {
    timeout: 2000,
  });
  figma.currentPage.selection = [keep];
}


function onDocumentChange(event: { documentChanges: readonly { type: string; id: string }[] }): void {
  if (!uiWorkspaceActive) return;

  const deletes: string[] = [];
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

function onSelectionChange(): void {
  enforceSingleLayerWhileOnboarding();
  savedSelection = [...figma.currentPage.selection];


  sendSelectionData();
}

function onCurrentPageChange(): void {
  if (uiWorkspaceActive) {
    syncUiToViewport();
    sendAll();
  } else {
    sendSelectionData();
  }
}


sendSelectionData();

let prevSig = "";


const timer = setInterval(() => {
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
  figma.on("documentchange", (event: { documentChanges: readonly { type: string; id: string }[] }) => onDocumentChange(event));
})();

figma.ui.onmessage = (raw: unknown) => {
  try {
  const msg = raw as IncomingUiMessage;
  lastCommand = msg.type;
  if (msg.type === "REFRESH") {
    if (uiWorkspaceActive) {
      sendAll();
    }
  } else if (msg.type === "PAN_VIEWPORT") {


    if (uiWorkspaceActive) {
      const panMsg = msg as { type: "PAN_VIEWPORT"; dx: number; dy: number };
      figma.viewport.center = {
        x: figma.viewport.center.x + panMsg.dx,
        y: figma.viewport.center.y + panMsg.dy,
      };

      

      //


      sendViewportUpdate();
     
      //


      //


      //


      //syncUiToViewport();

    }
  } else if (msg.type === "ZOOM_VIEWPORT") {

    if (uiWorkspaceActive) {
      const zm = msg as { type: "ZOOM_VIEWPORT"; newZoom: number; pivotCanvasX: number; pivotCanvasY: number };
      const b  = figma.viewport.bounds;
      const z  = figma.viewport.zoom;
      const newZ = Math.max(0.02, Math.min(256, zm.newZoom));


      //   before: screen_x = (pivot - bounds.x) * z
      //   after:  new_bounds.x = pivot - screen_x / newZ
      //         = pivot + (bounds.x - pivot) * (z / newZ)
      const ratio = z / newZ;
      const newBoundsX = zm.pivotCanvasX + (b.x - zm.pivotCanvasX) * ratio;
      const newBoundsY = zm.pivotCanvasY + (b.y - zm.pivotCanvasY) * ratio;

      const newCenterX = newBoundsX + b.width  * ratio / 2;
      const newCenterY = newBoundsY + b.height * ratio / 2;

      figma.viewport.zoom   = newZ;
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
    const langMsg = msg as { type: "SET_LANG"; lang: string };
    if (NOTICES[langMsg.lang]) {
      _pluginLang = langMsg.lang;
      setSpanGridLang(langMsg.lang);
      void figma.clientStorage.getAsync('xamong_ge_settings').then((raw) => {
        const settings = (raw && typeof raw === 'object') ? { ...(raw as Record<string, unknown>) } : {};
        settings.lang = langMsg.lang;
        return figma.clientStorage.setAsync('xamong_ge_settings', settings);
      }).catch(() => {});
    }
  } else if (msg.type === "LEAVE_WORKSPACE") {
    uiWorkspaceActive = false;
    const s = figma.currentPage.selection;
    if (s.length > 1) {
      figma.currentPage.selection = [s[s.length - 1] as SceneNode];
    }
    savedSelection = [...figma.currentPage.selection];
    figma.ui.resize(ONBOARDING_UI_W, ONBOARDING_UI_H);

    _lastUiW = ONBOARDING_UI_W; _lastUiH = ONBOARDING_UI_H;
    sendSelectionData();
    figma.ui.postMessage({ type: "ONBOARDING_READY" });
  } else if (msg.type === "SELECT_NODE") {
    const t = figma.getNodeById(msg.id);
    if (t && t.type !== "DOCUMENT" && t.type !== "PAGE")
      figma.currentPage.selection = [t as SceneNode];
  } else if (msg.type === "ZOOM_TO_NODE") {
    const t2 = figma.getNodeById(msg.id);
    if (
      t2 &&
      "absoluteBoundingBox" in t2 &&
      (t2 as SceneNode).absoluteBoundingBox
    ) {
      figma.viewport.scrollAndZoomIntoView([t2 as SceneNode]);
    }
  } else if (msg.type === "ENTER_WORKSPACE") {
    if (figma.currentPage.selection.length !== 1) {
      if (figma.currentPage.selection.length < 1) {
        figma.notify(n('create_select_one'));
      } else {
        figma.notify(n('onboarding_deselect'));
      }
      figma.ui.postMessage({ type: "WORKSPACE_ENTER_FAILED" });
      return;
    }
    const incomingPageId = figma.currentPage.id;


    const canLightweightResume =
      incomingPageId === _wsPageId &&
      (
        _offscreenSyncDone ||
        _offscreenInProgress ||
        (_pendingOffscreenBatch !== null && _pendingOffscreenBatch.token === _offscreenLoadToken)
      );

    uiWorkspaceActive = true;
    _wsNodeId = figma.currentPage.selection[0]?.id ?? null;
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
            const metaRaw = selNodeForSnap.getPluginData('meta');
            if (metaRaw) {
              const metaObj = JSON.parse(metaRaw) as { type?: string };
              if (metaObj.type === 'xGrid') {
                const snapRaw = selNodeForSnap.getPluginData('xgrid_snapshot');
                if (snapRaw) {
                  const parsed = JSON.parse(snapRaw) as unknown;
                  figma.ui.postMessage({ type: 'RESTORE_GRID_SNAPSHOT', payload: parsed, source: 'node' });
                  nodeSnapshotSent = true;
                }
              }
            }
          } catch { /* ignore */ }
        }
        if (!nodeSnapshotSent) {

          void figma.clientStorage.getAsync('spangrid_snapshot_v1').then((snapshot) => {
            figma.ui.postMessage({ type: "RESTORE_GRID_SNAPSHOT", payload: snapshot ?? null });
          }).catch(() => {
            figma.ui.postMessage({ type: "RESTORE_GRID_SNAPSHOT", payload: null });
          });
        }
      } catch (e) {
        const err = e && e instanceof Error ? e.message : String(e);
        figma.notify(n('enter_failed') + err);
        uiWorkspaceActive = false;
        figma.ui.postMessage({ type: "WORKSPACE_ENTER_FAILED" });
        console.error(e);
      }
    }, 0);
  } else if (msg.type === "SAVE_GRID_SNAPSHOT") {
    void figma.clientStorage.setAsync('spangrid_snapshot_v1', (msg as { type: "SAVE_GRID_SNAPSHOT"; payload: unknown }).payload).catch((e) => {
      console.error('SAVE_GRID_SNAPSHOT clientStorage.setAsync failed:', e);
    });
  } else if (msg.type === "LOAD_XGRID_NODE") {

    const loadMsg = msg as { type: "LOAD_XGRID_NODE"; nodeId?: string };
    const targetNode = loadMsg.nodeId
      ? figma.getNodeById(loadMsg.nodeId)
      : (figma.currentPage.selection[0] ?? null);

    if (!targetNode || targetNode.type === 'DOCUMENT' || targetNode.type === 'PAGE') {
      figma.notify('Node not found.');
      figma.ui.postMessage({ type: 'XGRID_NODE_SNAPSHOT', payload: null, error: 'Node not found' });
      return;
    }
    const snapRaw = (targetNode as SceneNode).getPluginData('xgrid_snapshot');
    if (!snapRaw) {
      figma.notify('No grid data is stored on this node.');
      figma.ui.postMessage({ type: 'XGRID_NODE_SNAPSHOT', payload: null, error: 'No snapshot' });
      return;
    }
    try {
      const parsed = JSON.parse(snapRaw) as unknown;
      figma.ui.postMessage({ type: 'XGRID_NODE_SNAPSHOT', payload: parsed });
    } catch {
      figma.notify('Could not read grid data.');
      figma.ui.postMessage({ type: 'XGRID_NODE_SNAPSHOT', payload: null, error: 'Parse error' });
    }
  } else if (msg.type === "CREATE_GRID") {
    const list = savedSelection.length > 0 ? savedSelection : figma.currentPage.selection;
    const gridMsg = msg as { type: "CREATE_GRID"; payload: unknown; mode?: "fixed" | "auto-layout" };
    void (async () => {
      try {
        await replaceSelectionWithGridFromSnapshot(list, gridMsg.payload, { mode: gridMsg.mode ?? 'fixed' });
        figma.ui.postMessage({ type: "CREATE_GRID_DONE" });

        setTimeout(() => figma.closePlugin(), 1500);
      } catch (e) {
        const err = e && e instanceof Error ? e.message : String(e);
        figma.notify(n('grid_failed') + err);
        figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: err });
        console.error(e);
      }
    })();
  } else if (msg.type === "CREATE_GRID_IMAGE") {
    const list = savedSelection.length > 0 ? savedSelection : figma.currentPage.selection;
    const imgMsg = msg as { type: "CREATE_GRID_IMAGE"; dataURL: string; width: number; height: number; snapshot?: unknown };
    void (async () => {
      try {
        if (!imgMsg.dataURL) throw new Error(n('img_no_data'));
        const bytes = dataURLToUint8(imgMsg.dataURL);
        const figmaImage = figma.createImage(bytes);

        const selection = list.length > 0 ? list : figma.currentPage.selection;
        if (selection.length === 0) {
          figma.notify(n('img_no_sel'));
          figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: n('img_no_sel') });
          return;
        }
        const first = selection[0];
        if (!first || first.removed) throw new Error(n('img_invalid_sel'));
        const parentNode = first.parent;
        if (!parentNode || !("insertChild" in parentNode)) throw new Error(n('img_no_parent'));

        const cont = parentNode as ChildrenMixin;
        const newNodes: SceneNode[] = [];
        for (const node of selection) {
          if ((node as SceneNode).removed || node.parent !== parentNode) continue;
          const idx = cont.children.indexOf(node as SceneNode);
          if (idx < 0) continue;

          
          
          const nodeW = Math.max(1, 'width'  in node ? (node as LayoutMixin).width  : imgMsg.width);
          const nodeH = Math.max(1, 'height' in node ? (node as LayoutMixin).height : imgMsg.height);
          const wrapper = figma.createFrame();
          wrapper.name = 'xGrid';
          wrapper.resize(nodeW, nodeH);
          wrapper.fills = [];
          wrapper.strokes = [];
          wrapper.clipsContent = true;

          
          const rect = figma.createRectangle();
          rect.resize(Math.max(1, imgMsg.width), Math.max(1, imgMsg.height));
          rect.x = 0;
          rect.y = 0;
          rect.name = 'Grid Image';
          rect.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: figmaImage.hash }];
          wrapper.appendChild(rect);

          
          wrapper.x = (node as SceneNode & { x: number }).x;
          wrapper.y = (node as SceneNode & { y: number }).y;
          cont.insertChild(idx + 1, wrapper);
          newNodes.push(wrapper);

          
          try {
            wrapper.setPluginData('meta', JSON.stringify({ type: 'xGrid', status: 'polymorph', updatedAt: Date.now() }));
            if (imgMsg.snapshot) wrapper.setPluginData('xgrid_snapshot', JSON.stringify(imgMsg.snapshot));
          } catch {  }
        }

        if (newNodes.length > 0) {
          figma.currentPage.selection = newNodes;
          figma.notify(n('img_added').replace('{n}', String(newNodes.length)));
        } else {
          figma.notify(n('img_failed_none'));
        }
        figma.ui.postMessage({ type: "CREATE_GRID_DONE" });
        setTimeout(() => figma.closePlugin(), 1500);
      } catch (e) {
        const err = e && e instanceof Error ? e.message : String(e);
        figma.notify(n('img_failed') + err);
        figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: err });
        console.error(e);
      }
    })();
  } else if (msg.type === "CREATE_GRID_SVG") {
    const list = savedSelection.length > 0 ? savedSelection : figma.currentPage.selection;
    const svgMsg = msg as { type: "CREATE_GRID_SVG"; svgString: string; snapshot?: unknown };
    void (async () => {
      try {
        if (!svgMsg.svgString) throw new Error(n('svg_no_data'));

        const selection = list.length > 0 ? list : figma.currentPage.selection;
        if (selection.length === 0) {
          figma.notify(n('svg_no_sel'));
          figma.ui.postMessage({ type: "CREATE_GRID_ERROR", message: n('svg_no_sel') });
          return;
        }
        const first = selection[0];
        if (!first || first.removed) throw new Error(n('img_invalid_sel'));
        const parentNode = first.parent;
        if (!parentNode || !("insertChild" in parentNode)) throw new Error(n('img_no_parent'));

        const cont = parentNode as ChildrenMixin;
        const newNodes: SceneNode[] = [];
        for (const node of selection) {
          if ((node as SceneNode).removed || node.parent !== parentNode) continue;
          const idx = cont.children.indexOf(node as SceneNode);
          if (idx < 0) continue;

          
          const vectorNode = figma.createNodeFromSvg(svgMsg.svgString);
          vectorNode.name = 'Grid SVG';
          vectorNode.x = 0;
          vectorNode.y = 0;

          
          
          const nodeW = Math.max(1, 'width'  in node ? (node as LayoutMixin).width  : 100);
          const nodeH = Math.max(1, 'height' in node ? (node as LayoutMixin).height : 100);
          const wrapper = figma.createFrame();
          wrapper.name = 'xGrid';
          wrapper.resize(nodeW, nodeH);
          wrapper.fills = [];
          wrapper.strokes = [];
          wrapper.clipsContent = true;
          wrapper.appendChild(vectorNode);

          
          const srcX = (node as SceneNode & { x: number }).x;
          const srcY = (node as SceneNode & { y: number }).y;
          wrapper.x = srcX;
          wrapper.y = srcY;
          cont.insertChild(idx + 1, wrapper);
          newNodes.push(wrapper);

          
          try {
            wrapper.setPluginData('meta', JSON.stringify({ type: 'xGrid', status: 'polymorph', updatedAt: Date.now() }));
            if (svgMsg.snapshot) wrapper.setPluginData('xgrid_snapshot', JSON.stringify(svgMsg.snapshot));
          } catch {  }
        }

        if (newNodes.length > 0) {
          figma.currentPage.selection = newNodes;
          figma.notify(n('svg_added').replace('{n}', String(newNodes.length)));
        } else {
          figma.notify(n('svg_failed_none'));
        }
        figma.ui.postMessage({ type: "CREATE_GRID_DONE" });
        setTimeout(() => figma.closePlugin(), 1500);
      } catch (e) {
        const err = e && e instanceof Error ? e.message : String(e);
        figma.notify(n('svg_failed') + err);
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
        y: box.y + box.height / 2,
      };
    }
  }
  } catch (e) {
    console.error('---> window.onmessage error: ', e);
  }
};

figma.on("close", () => {
  figma.ui.postMessage({ type: "GRIDEDITOR_CLOSED" });
  clearInterval(timer);
});
