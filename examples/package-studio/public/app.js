'use strict';

const packages = [
  ['@pomelo-suite/input', 'Canvas extended input control', 'stable'],
  ['@pomelo-suite/color-picker', 'Canvas HSV color picker', 'stable'],
  ['@pomelo-suite/spangrid', 'Advanced data grid with span support', 'stable'],
  ['@pomelo-suite/timeline', 'Canvas timeline editor', 'stable'],
  ['@pomelo-suite/scheduler', 'Node scheduler primitives', 'stable'],
  ['@pomelo-suite/workqueue', 'Node work queue and worker helpers', 'stable'],
  ['@pomelo-suite/calculator', 'Expression and legacy script calculator', 'stable'],
  ['@pomelo-suite/diagram', 'Browser diagram editor', 'experimental'],
  ['@pomelo-suite/runtime', 'Runtime and agent workflow layer', 'experimental'],
];

let inputControl = null;
let colorPicker = null;
let gridView = null;
let timeline = null;
let schedulerAbortController = null;
let workQueueAbortController = null;

const SCHEDULER_MAX_DELAY_MS = 10000;
const workQueueCountIds = [
  'workqueue-count-created',
  'workqueue-count-queued',
  'workqueue-count-scheduled',
  'workqueue-count-running',
  'workqueue-count-failing',
  'workqueue-count-completed',
];
const WORKQUEUE_MAX_DELAY_MS = 10000;

const playgroundState = {
  input: {
    value: 42,
    min: 0,
    max: 100,
    step: 1,
    format: '0.0',
    width: 340,
    height: 44,
    fillColor: '#3c78c8',
    mathMode: false,
    wheeling: true,
  },
  color: {
    hex: '000075',
    alpha: 1,
    presets: ['000075', '1f7a8c', 'd94f45', '2f855a', '7c3aed', 'f5a623'],
  },
  timeline: {
    preset: 'editorial',
    frameWidth: 16,
    frameCount: 600,
    snapGrid: 16,
  },
  spangrid: {
    preset: 'kpi',
    renderMode: 'html',
    scrollMode: 'pixel',
    readonly: false,
    zoom: 100,
  },
  node: {
    activeFeature: 'calculator',
  },
  scheduler: {
    delayMs: 1000,
    fixedDay: 31,
    fixedHour: 6,
    intervalSeconds: 60,
    start: '2026-01-31T09:30',
    triggerCount: 3,
    type: 'MONTHLY',
  },
  workqueue: {
    concurrentLimit: 2,
    delayMs: 80,
    failItem: 'gamma',
    items: 'alpha,beta,gamma,delta',
  },
};

const nodeFeatures = {
  calculator: {
    label: 'Expression',
    summary: '@pomelo-suite/calculator evaluates formula expressions.',
    defaultInput: '1+2*3',
    toUrl: (input) => `/api/calculator?expression=${encodeURIComponent(input)}`,
  },
  scheduler: {
    label: 'Interval seconds',
    summary: '@pomelo-suite/scheduler calculates deterministic next invocation times.',
    defaultInput: '60',
    toUrl: (input) => `/api/scheduler?intervalSeconds=${encodeURIComponent(input)}`,
  },
  workqueue: {
    label: 'Queue items',
    summary: '@pomelo-suite/workqueue drains WorkItem instances with a concurrency limit.',
    defaultInput: 'alpha,beta',
    toUrl: (input) => `/api/workqueue?items=${encodeURIComponent(input)}&concurrentLimit=1`,
  },
  runtime: {
    label: 'Runtime name',
    summary: '@pomelo-suite/runtime executes a TumblrRuntime message action.',
    defaultInput: 'Pomelo',
    toUrl: (input) => `/api/runtime?name=${encodeURIComponent(input)}&message=${encodeURIComponent('hello {@parameter.name}')}`,
  },
};

const spanGridPresets = [
  {
    id: 'kpi',
    title: 'Executive KPI Board',
    summary: 'Leadership metrics with owners and progress',
    rows: [
      ['North Star', 'Current', 'Delta', 'Owner', 'Progress'],
      ['ARR', '$4.8M', '+18%', 'Sales', 78],
      ['Net retention', '114%', '+6%', 'Success', 64],
      ['Pipeline risk', '$320K', '-12%', 'Ops', 42],
      ['Activation', '71%', '+9%', 'Product', 71],
    ],
  },
  {
    id: 'catalog',
    title: 'Product Catalog',
    summary: 'Inventory, ratings, pricing, and status',
    rows: [
      ['Product', 'Category', 'Stock', 'Rating', 'Price', 'Status'],
      ['Pomelo Desk', 'Workspace', '82%', '★★★★★', '$420', 'Hot'],
      ['Canvas Arm', 'Hardware', '35%', '★★★★☆', '$96', 'Restock'],
      ['Grid Kit', 'Software', '91%', '★★★★★', '$129', 'Ready'],
    ],
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    summary: 'Quarterly initiative plan by owner',
    rows: [
      ['Initiative', 'Q1', 'Q2', 'Q3', 'Q4', 'Owner'],
      ['Package split', 'Done', 'Ship', 'Support', 'Measure', 'Core'],
      ['Playground', 'Design', 'Build', 'Publish', 'Iterate', 'DX'],
      ['Docs', 'Draft', 'Beta', 'Launch', 'Maintain', 'Docs'],
    ],
  },
  {
    id: 'capacity',
    title: 'Team Capacity',
    summary: 'Workload and regional availability',
    rows: [
      ['Person', 'Role', 'Focus', 'Load', 'Region', 'Status'],
      ['Mina Park', 'Design', 'Playground', '76%', 'KR', 'Available'],
      ['Joon Lee', 'Engineering', 'Runtime', '88%', 'KR', 'Testing'],
      ['Alex Kim', 'Docs', 'Guides', '52%', 'US', 'Available'],
    ],
  },
  {
    id: 'invoice',
    title: 'Invoice',
    summary: 'Commercial line items and totals',
    rows: [
      ['Item', 'Qty', 'Unit', 'Discount', 'Total', 'Term'],
      ['SpanGrid commercial license', '1', '$2,400', '0%', '$2,400', 'Annual'],
      ['Implementation support', '12', '$180', '10%', '$1,944', 'One-time'],
      ['Training workshop', '4', '$320', '0%', '$1,280', 'One-time'],
      ['Subtotal', '', '', '', '$5,624', 'Ready'],
    ],
  },
  {
    id: 'release',
    title: 'Release Status',
    summary: 'Package readiness and risk overview',
    rows: [
      ['Area', 'Build', 'Tests', 'Docs', 'Owner', 'Risk'],
      ['Input', 'Ready', 'Pass', 'Ready', 'UI', 'Low'],
      ['Timeline', 'Ready', 'Pass', 'Draft', 'Media', 'Medium'],
      ['Runtime', 'Beta', 'Pass', 'Draft', 'Core', 'Medium'],
    ],
  },
];

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function setTextIfPresent(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function setFill(id, ratio) {
  const element = document.getElementById(id);
  if (element) {
    element.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  }
}

function replaceElement(id, includeChildren = false) {
  const element = document.getElementById(id);
  const clone = element.cloneNode(includeChildren);
  element.replaceWith(clone);
  return clone;
}

function activatePanel(targetId) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.target === targetId);
  });
  document.querySelectorAll('.package-screen').forEach((panel) => {
    panel.classList.toggle('active', panel.id === targetId);
  });
}

function getPackageTargetFromHash() {
  const targetId = window.location.hash.replace(/^#\/?/, '') || 'input';
  return document.getElementById(targetId)?.classList.contains('package-screen')
    ? targetId
    : 'input';
}

function routeFromHash() {
  activatePanel(getPackageTargetFromHash());
}

function navigateToPanel(targetId) {
  if (window.location.hash.replace(/^#\/?/, '') === targetId) {
    activatePanel(targetId);
  } else {
    window.location.hash = targetId;
  }
}

function mountInput() {
  const host = document.getElementById('input-host');
  const state = playgroundState.input;
  host.replaceChildren();
  inputControl = new TextInputPro(host, {
    animation: false,
    contextMenuId: 'inputContextMenu',
    fillColor: state.fillColor,
    format: state.format,
    height: state.height,
    mathMode: state.mathMode,
    max: state.max,
    min: state.min,
    onValueChanged: (value) => {
      playgroundState.input.value = value;
      setText('input-output', `value: ${value}`);
      const valueControl = document.getElementById('input-value-control');
      if (document.activeElement !== valueControl) {
        valueControl.value = String(value);
      }
    },
    step: state.step,
    value: state.value,
    wheeling: state.wheeling,
    width: state.width,
  });
  inputControl.value = state.value;
  syncInputControls();
}

function parseFiniteNumberControl(id) {
  const rawValue = document.getElementById(id).value.trim();
  if (rawValue === '') return null;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function syncInputControls() {
  const state = playgroundState.input;
  document.getElementById('input-value-control').value = String(state.value);
  document.getElementById('input-min-control').value = String(state.min);
  document.getElementById('input-max-control').value = String(state.max);
  document.getElementById('input-step-control').value = String(state.step);
  document.getElementById('input-format-control').value = state.format;
  document.getElementById('input-width-control').value = String(state.width);
  document.getElementById('input-height-control').value = String(state.height);
  document.getElementById('input-fill-control').value = state.fillColor;
  document.getElementById('input-math-mode-control').checked = state.mathMode;
  document.getElementById('input-wheeling-control').checked = state.wheeling;
}

function applyInputStateToControl() {
  if (!inputControl) return;
  const host = document.getElementById('input-host');
  const state = playgroundState.input;
  const width = state.width;

  inputControl.width = width;
  inputControl.height = state.height;
  inputControl.canvas.width = width;
  inputControl.canvas.height = state.height;
  host.style.width = `${width}px`;
  host.style.height = `${state.height}px`;
  inputControl._min = state.min;
  inputControl._max = state.max;
  inputControl._step = state.step;
  inputControl._format = state.format;
  inputControl._fillColor = state.fillColor;
  inputControl.mathMode = state.mathMode;
  inputControl.wheeling = state.wheeling;

  if (Number.isFinite(state.value)) {
    inputControl.value = state.value;
  } else if (typeof inputControl.render === 'function') {
    inputControl.render();
  }
}

function updateInputFromControls() {
  const nextState = {
    value: parseFiniteNumberControl('input-value-control'),
    min: parseFiniteNumberControl('input-min-control'),
    max: parseFiniteNumberControl('input-max-control'),
    step: parseFiniteNumberControl('input-step-control'),
    width: parseFiniteNumberControl('input-width-control'),
    height: parseFiniteNumberControl('input-height-control'),
  };

  if (Object.values(nextState).some((value) => value === null)) return;

  const state = playgroundState.input;
  state.value = nextState.value;
  state.min = nextState.min;
  state.max = nextState.max;
  state.step = nextState.step;
  state.width = nextState.width;
  state.height = nextState.height;
  state.format = document.getElementById('input-format-control').value;
  state.fillColor = document.getElementById('input-fill-control').value;
  state.mathMode = document.getElementById('input-math-mode-control').checked;
  state.wheeling = document.getElementById('input-wheeling-control').checked;
  applyInputStateToControl();
}

function syncColorPickerUI(color) {
  playgroundState.color.hex = color.hex;
  playgroundState.color.alpha = color.alpha;
  setText('hText', (color.h / 360).toFixed(3));
  setText('sText', color.s.toFixed(3));
  setText('vText', color.v.toFixed(3));
  setText('aText', color.alpha.toFixed(3));
  setText('rText', String(color.r));
  setText('gText', String(color.g));
  setText('bText', String(color.b));
  setText('hexText', color.hex);

  setFill('hFill', color.h / 360);
  setFill('sFill', color.s);
  setFill('vFill', color.v);
  setFill('aFill', color.alpha);
  setFill('rFill', color.r / 255);
  setFill('gFill', color.g / 255);
  setFill('bFill', color.b / 255);

  document.getElementById('colorPreview').style.background =
    `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`;
  document.getElementById('color-alpha-control').value = String(color.alpha);
  document.getElementById('color-hex-control').value = color.hex;
  setText('color-output', pretty({
    hex: color.hex,
    rgba: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.alpha})`,
    hsv: { h: color.h, s: color.s, v: color.v },
  }));
}

function mountColorPicker() {
  const canvas = replaceElement('color-canvas');
  const { hex, alpha } = playgroundState.color;
  colorPicker = new ColorPicker(canvas);
  applyColorToPicker(hex, { sync: false });
  colorPicker.setAlpha(alpha);
  colorPicker.onColorChanged = syncColorPickerUI;
  syncColorPickerUI(colorPicker.color);
}

function renderColorPresets() {
  const list = document.getElementById('color-preset-list');
  list.replaceChildren(...playgroundState.color.presets.map((hex) => {
    const button = document.createElement('button');
    button.className = 'swatch-button';
    button.type = 'button';
    button.style.background = `#${hex}`;
    button.textContent = `#${hex}`;
    button.addEventListener('click', () => applyColorPreset(hex));
    return button;
  }));
}

function applyColorPreset(hex) {
  applyColorToPicker(hex);
}

function applyColorToPicker(hex, { sync = true } = {}) {
  if (!colorPicker) return;
  const clean = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return;
  const onColorChanged = colorPicker.onColorChanged;
  if (!sync) colorPicker.onColorChanged = null;
  colorPicker.setRGB(
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  );
  if (!sync) colorPicker.onColorChanged = onColorChanged;
  if (sync) syncColorPickerUI(colorPicker.color);
}

function clampStep(value, min, max, step) {
  const stepped = Math.round(value / step) * step;
  return Math.max(min, Math.min(max, stepped));
}

function getColorPickerChannelValue(channel) {
  if (!colorPicker) return 0;
  const color = colorPicker.color;
  switch (channel) {
    case 'h':
      return color.h / 360;
    case 's':
      return color.s;
    case 'v':
      return color.v;
    case 'a':
      return color.alpha;
    case 'r':
      return color.r;
    case 'g':
      return color.g;
    case 'b':
      return color.b;
    default:
      return 0;
  }
}

function applyColorPickerChannelValue(channel, value) {
  if (!colorPicker) return;
  const color = colorPicker.color;
  switch (channel) {
    case 'h':
      colorPicker.setHSV(value * 360, color.s, color.v);
      break;
    case 's':
      colorPicker.setHSV(color.h, value, color.v);
      break;
    case 'v':
      colorPicker.setHSV(color.h, color.s, value);
      break;
    case 'a':
      colorPicker.setAlpha(value);
      break;
    case 'r':
      colorPicker.setRGB(Math.round(value), color.g, color.b);
      break;
    case 'g':
      colorPicker.setRGB(color.r, Math.round(value), color.b);
      break;
    case 'b':
      colorPicker.setRGB(color.r, color.g, Math.round(value));
      break;
  }
  syncColorPickerUI(colorPicker.color);
}

function setupColorPickerField(fieldEl) {
  const channel = fieldEl.dataset.channel;
  const min = parseFloat(fieldEl.dataset.min ?? '0');
  const max = parseFloat(fieldEl.dataset.max ?? '1');
  const step = parseFloat(fieldEl.dataset.step ?? '0.001');
  const textEl = fieldEl.querySelector('.bcp-field-text');
  const inputEl = fieldEl.querySelector('.bcp-field-input');

  if (!channel || !textEl || !inputEl) return;

  let startX = 0;
  let startValue = 0;
  let dragging = false;

  fieldEl.addEventListener('mousedown', (event) => {
    if (event.target === inputEl || inputEl.style.display === 'block') return;
    startX = event.clientX;
    startValue = getColorPickerChannelValue(channel);
    dragging = false;

    function onMove(moveEvent) {
      const dx = moveEvent.clientX - startX;
      if (Math.abs(dx) > 2) dragging = true;
      if (!dragging) return;

      const sensitivity = (max - min) / 200;
      const nextValue = clampStep(startValue + dx * sensitivity, min, max, step);
      applyColorPickerChannelValue(channel, nextValue);
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    event.preventDefault();
  });

  fieldEl.addEventListener('dblclick', () => {
    textEl.style.display = 'none';
    inputEl.style.display = 'block';
    inputEl.value = getColorPickerChannelValue(channel).toFixed(step < 1 ? 3 : 0);
    inputEl.focus();
    inputEl.select();
  });

  function commitInput() {
    const value = parseFloat(inputEl.value);
    if (!Number.isNaN(value)) {
      applyColorPickerChannelValue(channel, clampStep(value, min, max, step));
    }
    inputEl.style.display = 'none';
    textEl.style.display = '';
  }

  function cancelInput() {
    inputEl.style.display = 'none';
    textEl.style.display = '';
  }

  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commitInput();
      event.preventDefault();
    } else if (event.key === 'Escape') {
      cancelInput();
      event.preventDefault();
    }
  });

  inputEl.addEventListener('blur', commitInput);
}

function commitHex() {
  const hexText = document.getElementById('hexText');
  const hexInput = document.getElementById('hexInput');
  if (!colorPicker || !hexText || !hexInput) return;

  const hex = hexInput.value.replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    colorPicker.setRGB(r, g, b);
    syncColorPickerUI(colorPicker.color);
  }
  hexInput.style.display = 'none';
  hexText.style.display = '';
}

function cancelHex() {
  const hexText = document.getElementById('hexText');
  const hexInput = document.getElementById('hexInput');
  if (!hexText || !hexInput) return;
  hexInput.style.display = 'none';
  hexText.style.display = '';
}

function setupColorPickerHexField() {
  const hexField = document.getElementById('hexField');
  const hexText = document.getElementById('hexText');
  const hexInput = document.getElementById('hexInput');
  if (!hexField || !hexText || !hexInput) return;

  hexField.addEventListener('dblclick', () => {
    hexText.style.display = 'none';
    hexInput.style.display = 'block';
    hexInput.value = hexText.textContent;
    hexInput.focus();
    hexInput.select();
  });

  hexInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      commitHex();
      event.preventDefault();
    } else if (event.key === 'Escape') {
      cancelHex();
      event.preventDefault();
    }
  });

  hexInput.addEventListener('blur', commitHex);
}

function setupEyeDropper() {
  const eyeBtn = document.getElementById('eyedropperBtn');
  if (!eyeBtn) return;

  if (window.EyeDropper) {
    eyeBtn.addEventListener('click', async () => {
      try {
        const dropper = new EyeDropper();
        const result = await dropper.open();
        const hex = result.sRGBHex.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        colorPicker.setRGB(r, g, b);
        syncColorPickerUI(colorPicker.color);
      } catch (_) {
        // User cancelled the browser picker.
      }
    });
  } else {
    eyeBtn.style.opacity = '0.3';
    eyeBtn.title = 'EyeDropper API unsupported';
  }
}

function escapeSpanGridHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function spanGridPillTone(value) {
  const clean = String(value ?? '').toLowerCase();
  if (['available', 'ready', 'done', 'pass', 'low', 'hot'].includes(clean)) return 'good';
  if (['testing', 'medium', 'draft', 'beta', 'restock'].includes(clean)) return 'warn';
  return 'neutral';
}

function formatSpanGridHtmlCell(preset, rowIndex, colIndex, value) {
  const header = String(preset.rows[0][colIndex] ?? '');
  const text = escapeSpanGridHtml(value);
  if (rowIndex === 0) {
    return `<strong class="spangrid-html-header">${text}</strong>`;
  }

  if (header === 'Progress') {
    const percent = Math.max(0, Math.min(100, Number(value) || 0));
    return [
      '<span class="spangrid-progress">',
      `<span class="spangrid-progress-track"><span class="spangrid-progress-fill" style="width:${percent}%"></span></span>`,
      `<span class="spangrid-progress-value">${percent}%</span>`,
      '</span>',
    ].join('');
  }

  if (['Owner', 'Status', 'Risk'].includes(header)) {
    return `<span class="spangrid-pill spangrid-pill-${spanGridPillTone(value)}">${text}</span>`;
  }

  return `<span class="spangrid-html-text">${text}</span>`;
}

function applySpanGridRenderMode(grid, preset) {
  if (playgroundState.spangrid.renderMode !== 'html') return;
  preset.rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = grid.getCell(rowIndex, colIndex);
      if (!cell || !cell.visible) return;
      cell.mode = 'html';
      cell.text = formatSpanGridHtmlCell(preset, rowIndex, colIndex, value);
    });
  });
}

function buildSpanGridPreset(preset) {
  const {
    SpanGridCol,
    SpanGridControl,
    SpanGridRow,
  } = SpanGrid;

  const grid = new SpanGridControl({ borderStyle: 'None', height: 620, width: 1100 });
  preset.rows[0].forEach((_, index) => {
    grid.addCol(new SpanGridCol({ width: index === 0 ? 240 : 150 }));
  });
  preset.rows.forEach((_, index) => {
    grid.addRow(new SpanGridRow({ height: index === 0 ? 40 : 58 }));
  });
  if (typeof grid.setScrollMode === 'function') {
    grid.setScrollMode(playgroundState.spangrid.scrollMode);
  }
  grid.setData(preset.rows);
  applySpanGridRenderMode(grid, preset);
  grid.selectCell(1, 0);
  return grid;
}

function renderSpanGridPresetButtons() {
  const list = document.getElementById('spangrid-preset-list');
  if (!list) return;
  list.replaceChildren(...spanGridPresets.map((preset) => {
    const button = document.createElement('button');
    button.className = `preset-button${preset.id === playgroundState.spangrid.preset ? ' active' : ''}`;
    button.type = 'button';
    button.textContent = `${preset.title} - ${preset.summary}`;
    button.addEventListener('click', () => {
      playgroundState.spangrid.preset = preset.id;
      mountGrid();
    });
    return button;
  }));
}

function syncSpanGridControls() {
  document.getElementById('spangrid-render-mode').value = playgroundState.spangrid.renderMode;
  document.getElementById('spangrid-scroll-mode').value = playgroundState.spangrid.scrollMode;
  document.getElementById('spangrid-readonly').checked = playgroundState.spangrid.readonly;
  document.getElementById('spangrid-zoom').value = String(playgroundState.spangrid.zoom);
}

function mountGrid() {
  if (gridView && typeof gridView.destroy === 'function') {
    gridView.destroy();
  }
  const canvas = replaceElement('grid-canvas');
  const preset = spanGridPresets.find((item) => item.id === playgroundState.spangrid.preset)
    || spanGridPresets[0];
  playgroundState.spangrid.preset = preset.id;

  const grid = buildSpanGridPreset(preset);
  if (typeof grid.setZoom === 'function') {
    grid.setZoom(playgroundState.spangrid.zoom / 100);
  }

  gridView = new SpanGrid.SpanGridCanvasView(canvas, grid, {
    hScroll: document.getElementById('spangrid-h-scroll'),
    readonly: playgroundState.spangrid.readonly,
    statusElement: document.getElementById('spangrid-status'),
    vScroll: document.getElementById('spangrid-v-scroll'),
  });
  gridView.draw();
  renderSpanGridPresetButtons();
  syncSpanGridControls();
  document.getElementById('spangrid-json-output').value =
    pretty(grid.toJSON ? grid.toJSON() : { preset: preset.id });
}

function mountTimeline() {
  const canvas = replaceElement('timeline-canvas');
  replaceElement('timelineEditBox');
  replaceElement('timelineContextMenu', true);
  timeline = new TimelineEditor(canvas, {
    editBoxId: 'timelineEditBox',
    contextMenuId: 'timelineContextMenu',
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  applyTimelineStateToEditor({ refreshPreset: true });
  syncTimelineControls();
}

function populateTimelinePreset() {
  if (!timeline) return;
  timeline.tracks = [];
  timeline.selectedTrackIndex = 0;
  timeline.selectedClipTrack = 0;
  timeline.selectedClipIndex = 0;
  timeline.selectedTrack = null;
  timeline.selectedClip = null;
  timeline.scrollX = 0;
  timeline.verticalScroll = 0;
  timeline.currentFrame = 0;

  if (playgroundState.timeline.preset === 'launch') {
    timeline.addTrack('Planning');
    timeline.addTrack('Design');
    timeline.addTrack('Engineering');
    timeline.addClip(0, 'Kickoff', 0, 24, '#4a90e2');
    timeline.addClip(1, 'Prototype', 24, 48, '#bd10e0');
    timeline.addClip(2, 'Build', 72, 96, '#50e3c2');
  } else {
    timeline.addTrack('Audio 1');
    timeline.addTrack('Audio 2');
    timeline.addTrack('Video 1');
    timeline.addClip(0, 'Intro', 10, 50, '#4a90e2');
    timeline.addClip(0, 'Main', 80, 100, '#7ed321');
    timeline.addClip(1, 'BGM', 0, 200, '#f5a623');
    timeline.addClip(2, 'Title', 20, 40, '#bd10e0');
    timeline.addClip(2, 'Content', 70, 150, '#50e3c2');
  }
}

function applyTimelineStateToEditor({ refreshPreset = false } = {}) {
  if (!timeline) return;
  timeline.frameWidth = playgroundState.timeline.frameWidth;
  timeline.frameCount = playgroundState.timeline.frameCount;
  timeline.snapGrid = playgroundState.timeline.snapGrid;
  if (refreshPreset) populateTimelinePreset();
  timeline.render();
}

function syncTimelineControls() {
  document.getElementById('timeline-preset-control').value = playgroundState.timeline.preset;
  document.getElementById('timeline-frame-width-control').value = String(playgroundState.timeline.frameWidth);
  document.getElementById('timeline-frame-count-control').value = String(playgroundState.timeline.frameCount);
  document.getElementById('timeline-snap-control').value = String(playgroundState.timeline.snapGrid);
}

function updateTimelineFromControls() {
  const preset = document.getElementById('timeline-preset-control').value;
  const frameWidth = parseFiniteNumberControl('timeline-frame-width-control');
  const frameCount = parseFiniteNumberControl('timeline-frame-count-control');
  const snapGrid = parseFiniteNumberControl('timeline-snap-control');

  if ([frameWidth, frameCount, snapGrid].some((value) => value === null)) return;

  const refreshPreset = preset !== playgroundState.timeline.preset;
  playgroundState.timeline.preset = preset;
  playgroundState.timeline.frameWidth = frameWidth;
  playgroundState.timeline.frameCount = frameCount;
  playgroundState.timeline.snapGrid = snapGrid;
  applyTimelineStateToEditor({ refreshPreset });
}

function selectTimelineTrack(trackIndex) {
  if (!timeline || trackIndex < 0 || trackIndex >= timeline.tracks.length) return;
  timeline.selectedTrackIndex = trackIndex;
  timeline.selectedTrack = timeline.tracks[trackIndex];
  timeline.selectedClipTrack = -1;
  timeline.selectedClipIndex = -1;
  timeline.selectedClip = null;
  timeline.render();
}

function addTimelineTrackFromControls() {
  if (!timeline) return;
  if (typeof timeline.pushUndo === 'function') {
    timeline.pushUndo();
  }
  const track = timeline.addTrack(`Track ${timeline.tracks.length + 1}`);
  const trackIndex = timeline.tracks.indexOf(track);
  selectTimelineTrack(trackIndex);
}

function addTimelineClipFromControls() {
  if (!timeline) return;
  if (timeline.tracks.length === 0) {
    addTimelineTrackFromControls();
  }

  const trackIndex = Math.max(0, Math.min(
    timeline.selectedTrackIndex,
    timeline.tracks.length - 1,
  ));
  const track = timeline.tracks[trackIndex];
  const lastEnd = track.clips.reduce((max, clip) => Math.max(max, clip.start + clip.length), 0);
  const gap = Math.max(1, playgroundState.timeline.snapGrid);
  const start = Math.min(lastEnd + gap, Math.max(0, playgroundState.timeline.frameCount - 24));
  const length = Math.min(48, Math.max(8, playgroundState.timeline.frameCount - start));
  const palette = ['#4a90e2', '#f5a623', '#bd10e0', '#50e3c2', '#7ed321'];

  if (typeof timeline.pushUndo === 'function') {
    timeline.pushUndo();
  }
  const clip = timeline.addClip(
    trackIndex,
    `Clip ${track.clips.length + 1}`,
    start,
    length,
    palette[track.clips.length % palette.length],
  );
  if (clip && typeof timeline.setSelectedClip === 'function') {
    timeline.setSelectedClip(clip);
  } else {
    timeline.render();
  }
}

function mountBrowserDemos() {
  mountInput();
  mountColorPicker();
  mountGrid();
  mountTimeline();
}

function refreshBrowserDemos() {
  applyInputStateToControl();
  mountColorPicker();
  mountGrid();
  applyTimelineStateToEditor({ refreshPreset: true });
}

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path}: ${response.status}`);
  }
  return response.json();
}

function schedulerStartToIso(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '2026-01-31T09:30:00.000Z';
  if (trimmed.endsWith('Z')) return trimmed;
  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  return `${withSeconds}.000Z`;
}

function schedulerLabUrl(path = '/api/scheduler/lab') {
  const state = playgroundState.scheduler;
  const params = new URLSearchParams({
    delayMs: String(state.delayMs),
    fixedDay: String(state.fixedDay),
    fixedHour: String(state.fixedHour),
    intervalSeconds: String(state.intervalSeconds),
    start: schedulerStartToIso(state.start),
    triggerCount: String(state.triggerCount),
    type: state.type,
  });
  return `${path}?${params.toString()}`;
}

function formatSchedulerTime(value) {
  return String(value || '').replace('T', ' ').replace('.000Z', 'Z');
}

function resetSchedulerDisplay(summary = 'ready') {
  setTextIfPresent('scheduler-summary', summary);
  document.getElementById('scheduler-timeline')?.replaceChildren();
  document.getElementById('scheduler-type-grid')?.replaceChildren();
  document.getElementById('scheduler-event-log')?.replaceChildren();
}

function setSchedulerRunning(isRunning) {
  const runButton = document.getElementById('scheduler-run');
  if (runButton) runButton.disabled = isRunning;
}

function abortSchedulerRun() {
  if (schedulerAbortController) {
    schedulerAbortController.abort();
    schedulerAbortController = null;
  }
}

function formatSchedulerEvent(event) {
  if (event.type === 'RUNNING') {
    return `${event.type}: ${event.scheduleID} #${event.step} for ${event.delayMs}ms`;
  }
  if (event.type === 'INVOKED') {
    return `${event.type}: ${event.scheduleID} #${event.step} next ${formatSchedulerTime(event.after)}`;
  }
  if (event.step) {
    return `${event.type}: ${event.scheduleID} #${event.step} @ ${formatSchedulerTime(event.nextInvokeTime || event.before)}`;
  }
  return `${event.type}: ${event.scheduleID} @ ${formatSchedulerTime(event.nextInvokeTime)}`;
}

function renderSchedulerLab(payload) {
  const selected = payload.selected || {};
  const current = payload.current || {};
  const stateText = current.state ? ` | ${current.state.toLowerCase()}` : '';
  setTextIfPresent(
    'scheduler-summary',
    `${selected.type} | start ${formatSchedulerTime(payload.startTime)} | ${payload.triggerCount} trigger(s) | delay ${payload.delayMs || 0}ms${stateText}`,
  );

  const timeline = document.getElementById('scheduler-timeline');
  if (timeline) {
    const runs = [...(selected.runs || [])];
    if (current.step && !runs.some((run) => run.step === current.step)) {
      runs.push({
        after: current.after || current.nextInvokeTime || '',
        before: current.before || current.nextInvokeTime || '',
        delayMs: current.delayMs,
        state: current.state,
        step: current.step,
      });
    }
    timeline.replaceChildren(...runs.map((run) => {
      const item = document.createElement('article');
      item.className = `scheduler-step ${String(run.state || '').toLowerCase()}`;
      item.innerHTML = `
        <strong>#${run.step}</strong>
        <span>${formatSchedulerTime(run.before)}</span>
        <span>${run.after ? formatSchedulerTime(run.after) : String(run.state || '').toLowerCase()}</span>
        <span>${run.delayMs || 0}ms job</span>
      `;
      return item;
    }));
  }

  const grid = document.getElementById('scheduler-type-grid');
  if (grid) {
    grid.replaceChildren(...(payload.catalog || []).map((item) => {
      const card = document.createElement('article');
      card.className = `scheduler-type-card${item.type === selected.type ? ' active' : ''}`;
      const title = document.createElement('strong');
      title.textContent = item.type;
      const label = document.createElement('span');
      label.textContent = item.label;
      const before = document.createElement('small');
      before.textContent = `from ${formatSchedulerTime(item.before)}`;
      const after = document.createElement('small');
      after.textContent = `next ${formatSchedulerTime(item.after)}`;
      const description = document.createElement('p');
      description.textContent = item.description;
      card.append(title, label, before, after, description);
      return card;
    }));
  }

  const log = document.getElementById('scheduler-event-log');
  if (log) {
    log.replaceChildren(...(payload.events || []).map((event) => {
      const item = document.createElement('li');
      item.textContent = event.type === 'TIMER'
        ? `${event.type}: ${event.scheduleID} after ${event.delayMs}ms`
        : formatSchedulerEvent(event);
      return item;
    }));
  }
}

async function readSchedulerEventStream(url, signal, onEvent) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    text.trim().split('\n').filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
    if (done) break;
  }
  if (buffer.trim()) {
    onEvent(JSON.parse(buffer));
  }
}

async function runSchedulerLab() {
  abortSchedulerRun();
  resetSchedulerDisplay('running');
  const controller = new AbortController();
  schedulerAbortController = controller;
  setSchedulerRunning(true);

  try {
    await readSchedulerEventStream(schedulerLabUrl('/api/scheduler/lab/events'), controller.signal, (event) => {
      if (event.type === 'snapshot' || event.type === 'result') {
        renderSchedulerLab(event.payload);
      }
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      throw error;
    }
  } finally {
    if (schedulerAbortController === controller) {
      schedulerAbortController = null;
      setSchedulerRunning(false);
    }
  }
}

function syncSchedulerControls() {
  const state = playgroundState.scheduler;
  document.getElementById('scheduler-type-control').value = state.type;
  document.getElementById('scheduler-start-control').value = state.start;
  document.getElementById('scheduler-interval-control').value = String(state.intervalSeconds);
  document.getElementById('scheduler-delay-ms').value = String(state.delayMs);
  document.getElementById('scheduler-fixed-hour-control').value = String(state.fixedHour);
  document.getElementById('scheduler-fixed-day-control').value = String(state.fixedDay);
  document.getElementById('scheduler-trigger-count-control').value = String(state.triggerCount);
}

function updateSchedulerStateFromControls() {
  const intervalSeconds = parseFiniteNumberControl('scheduler-interval-control');
  const delayMs = parseFiniteNumberControl('scheduler-delay-ms');
  const fixedHour = parseFiniteNumberControl('scheduler-fixed-hour-control');
  const fixedDay = parseFiniteNumberControl('scheduler-fixed-day-control');
  const triggerCount = parseFiniteNumberControl('scheduler-trigger-count-control');
  if ([intervalSeconds, delayMs, fixedHour, fixedDay, triggerCount].some((value) => value === null)) return;

  playgroundState.scheduler.type = document.getElementById('scheduler-type-control').value;
  playgroundState.scheduler.start = document.getElementById('scheduler-start-control').value;
  playgroundState.scheduler.intervalSeconds = Math.max(1, Math.min(86400, Math.round(intervalSeconds)));
  playgroundState.scheduler.delayMs = Math.max(0, Math.min(SCHEDULER_MAX_DELAY_MS, Math.round(delayMs)));
  playgroundState.scheduler.fixedHour = Math.max(0, Math.min(23, Math.round(fixedHour)));
  playgroundState.scheduler.fixedDay = Math.max(1, Math.min(31, Math.round(fixedDay)));
  playgroundState.scheduler.triggerCount = Math.max(1, Math.min(12, Math.round(triggerCount)));
  syncSchedulerControls();
}

function resetSchedulerLab() {
  abortSchedulerRun();
  Object.assign(playgroundState.scheduler, {
    delayMs: 1000,
    fixedDay: 31,
    fixedHour: 6,
    intervalSeconds: 60,
    start: '2026-01-31T09:30',
    triggerCount: 3,
    type: 'MONTHLY',
  });
  syncSchedulerControls();
  setSchedulerRunning(false);
  resetSchedulerDisplay();
}

function workQueueLabUrl(path = '/api/workqueue/lab') {
  const state = playgroundState.workqueue;
  const params = new URLSearchParams({
    concurrentLimit: String(state.concurrentLimit),
    delayMs: String(state.delayMs),
    failItem: state.failItem,
    items: state.items,
  });
  return `${path}?${params.toString()}`;
}

function setWorkQueueCount(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value || 0);
}

function setWorkQueueRunning(isRunning) {
  const runButton = document.getElementById('workqueue-run');
  if (runButton) runButton.disabled = isRunning;
}

function abortWorkQueueRun() {
  if (workQueueAbortController) {
    workQueueAbortController.abort();
    workQueueAbortController = null;
  }
}

function formatWorkQueueEvent(event) {
  if (event.type === 'state') {
    return `${event.item}: ${event.from} -> ${event.to}`;
  }
  if (event.type === 'failed') {
    return `${event.item}: failed (${event.message})`;
  }
  if (event.type === 'completed') {
    return `${event.item}: completed${event.failed ? ' with failure record' : ''}`;
  }
  return `${event.item}: ${event.type}`;
}

function resetWorkQueueDisplay(summary = 'ready') {
  workQueueCountIds.forEach((id) => setWorkQueueCount(id, 0));
  setTextIfPresent('workqueue-summary', summary);
  document.getElementById('workqueue-item-list')?.replaceChildren();
  document.getElementById('workqueue-event-log')?.replaceChildren();
}

function renderWorkQueueResult(payload, options = {}) {
  const visits = payload.stateVisits || {};
  setWorkQueueCount('workqueue-count-created', visits.Created);
  setWorkQueueCount('workqueue-count-queued', visits.Queued);
  setWorkQueueCount('workqueue-count-scheduled', visits.Scheduled);
  setWorkQueueCount('workqueue-count-running', visits.Running);
  setWorkQueueCount('workqueue-count-failing', visits.Failing);
  setWorkQueueCount('workqueue-count-completed', visits.Completed);

  const items = payload.items || [];
  const failed = payload.failed || [];
  const status = options.running ? 'running' : 'finished';
  setTextIfPresent(
    'workqueue-summary',
    `${status} | ${items.length} items | concurrent ${payload.concurrentLimit} | completed ${payload.completed?.length || 0} | failed ${failed.length}`,
  );

  const list = document.getElementById('workqueue-item-list');
  if (list) {
    list.replaceChildren(...items.map((item) => {
      const card = document.createElement('article');
      const stateClass = String(item.state || '').toLowerCase();
      card.className = `workqueue-item ${stateClass}${item.failed ? ' failed' : ''}`;
      const title = document.createElement('strong');
      title.textContent = item.name;
      const meta = document.createElement('span');
      meta.textContent = item.failed
        ? `${item.state} | ${item.error}`
        : `${item.state} | ${item.processingTime}ms`;
      card.append(title, meta);
      return card;
    }));
  }

  const log = document.getElementById('workqueue-event-log');
  if (log) {
    log.replaceChildren(...(payload.events || []).map((event) => {
      const item = document.createElement('li');
      item.textContent = formatWorkQueueEvent(event);
      return item;
    }));
  }
}

async function readWorkQueueEventStream(url, signal, onEvent) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`${url}: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    text.trim().split('\n').filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line)));
    if (done) break;
  }
  if (buffer.trim()) {
    onEvent(JSON.parse(buffer));
  }
}

async function runWorkQueueLab() {
  abortWorkQueueRun();
  resetWorkQueueDisplay('running');
  const controller = new AbortController();
  workQueueAbortController = controller;
  setWorkQueueRunning(true);

  try {
    await readWorkQueueEventStream(workQueueLabUrl('/api/workqueue/lab/events'), controller.signal, (event) => {
      if (event.type === 'snapshot') {
        renderWorkQueueResult(event.payload, { running: true });
      } else if (event.type === 'result') {
        renderWorkQueueResult(event.payload);
      }
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      throw error;
    }
  } finally {
    if (workQueueAbortController === controller) {
      workQueueAbortController = null;
      setWorkQueueRunning(false);
    }
  }
}

function syncWorkQueueControls() {
  const state = playgroundState.workqueue;
  document.getElementById('workqueue-concurrent-limit').value = String(state.concurrentLimit);
  document.getElementById('workqueue-items').value = state.items;
  document.getElementById('workqueue-fail-item').value = state.failItem;
  document.getElementById('workqueue-delay-ms').value = String(state.delayMs);
}

function updateWorkQueueStateFromControls() {
  const concurrentLimit = parseFiniteNumberControl('workqueue-concurrent-limit');
  const delayMs = parseFiniteNumberControl('workqueue-delay-ms');
  if (concurrentLimit === null || delayMs === null) return;

  playgroundState.workqueue.concurrentLimit = Math.max(1, Math.min(8, Math.round(concurrentLimit)));
  playgroundState.workqueue.delayMs = Math.max(0, Math.min(WORKQUEUE_MAX_DELAY_MS, Math.round(delayMs)));
  playgroundState.workqueue.failItem = document.getElementById('workqueue-fail-item').value.trim();
  playgroundState.workqueue.items = document.getElementById('workqueue-items').value.trim();
  syncWorkQueueControls();
}

function resetWorkQueueLab() {
  abortWorkQueueRun();
  Object.assign(playgroundState.workqueue, {
    concurrentLimit: 2,
    delayMs: 80,
    failItem: 'gamma',
    items: 'alpha,beta,gamma,delta',
  });
  syncWorkQueueControls();
  setWorkQueueRunning(false);
  resetWorkQueueDisplay();
}

function activateNodeFeature(featureName) {
  const feature = nodeFeatures[featureName] || nodeFeatures.calculator;
  playgroundState.node.activeFeature = nodeFeatures[featureName] ? featureName : 'calculator';

  document.querySelectorAll('[data-node-feature]').forEach((button) => {
    button.classList.toggle('active', button.dataset.nodeFeature === playgroundState.node.activeFeature);
  });
  setTextIfPresent('node-feature-summary', feature.summary);
  setTextIfPresent('node-input-label', feature.label);

  const input = document.getElementById('node-feature-input');
  if (input) input.value = feature.defaultInput;
  setTextIfPresent('node-feature-output', 'ready');
}

async function runActiveNodeFeature() {
  const feature = nodeFeatures[playgroundState.node.activeFeature] || nodeFeatures.calculator;
  const input = document.getElementById('node-feature-input')?.value ?? feature.defaultInput;
  const payload = await getJson(feature.toUrl(input));
  setTextIfPresent('node-feature-output', pretty(payload));
}

async function checkNodeApis() {
  await Promise.all([
    getJson('/api/calculator?expression=1%2B2*3'),
    getJson('/api/scheduler'),
    getJson('/api/workqueue'),
    getJson('/api/runtime'),
  ]);
}

function mountCatalog() {
  const grid = document.getElementById('catalog-grid');
  grid.replaceChildren(...packages.map(([name, purpose, stability]) => {
    const card = document.createElement('article');
    card.className = 'catalog-card';
    card.innerHTML = `<h3>${name}</h3><p>${purpose}</p><p>${stability}</p>`;
    return card;
  }));
}

function bindEvents() {
  document.querySelectorAll('.bcp-field[data-channel]').forEach(setupColorPickerField);
  setupColorPickerHexField();
  setupEyeDropper();
  renderColorPresets();

  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => navigateToPanel(button.dataset.target));
  });
  [
    'input-value-control',
    'input-min-control',
    'input-max-control',
    'input-step-control',
    'input-format-control',
    'input-width-control',
    'input-height-control',
    'input-fill-control',
    'input-math-mode-control',
    'input-wheeling-control',
  ].forEach((id) => document.getElementById(id).addEventListener('input', updateInputFromControls));

  document.getElementById('input-reset').addEventListener('click', () => {
    Object.assign(playgroundState.input, {
      value: 42,
      min: 0,
      max: 100,
      step: 1,
      format: '0.0',
      width: 340,
      height: 44,
      fillColor: '#3c78c8',
      mathMode: false,
      wheeling: true,
    });
    syncInputControls();
    applyInputStateToControl();
  });

  document.getElementById('color-alpha-control').addEventListener('input', (event) => {
    if (colorPicker) colorPicker.setAlpha(Number(event.target.value));
  });
  document.getElementById('color-apply-hex').addEventListener('click', () => {
    applyColorPreset(document.getElementById('color-hex-control').value);
  });

  [
    'timeline-preset-control',
    'timeline-frame-width-control',
    'timeline-frame-count-control',
    'timeline-snap-control',
  ].forEach((id) => document.getElementById(id).addEventListener('input', updateTimelineFromControls));
  document.getElementById('timeline-reset').addEventListener('click', () => {
    Object.assign(playgroundState.timeline, {
      preset: 'editorial',
      frameWidth: 16,
      frameCount: 600,
      snapGrid: 16,
    });
    syncTimelineControls();
    applyTimelineStateToEditor({ refreshPreset: true });
  });
  document.getElementById('timeline-add-track').addEventListener('click', addTimelineTrackFromControls);
  document.getElementById('timeline-add-clip').addEventListener('click', addTimelineClipFromControls);

  document.getElementById('spangrid-render-mode').addEventListener('input', (event) => {
    playgroundState.spangrid.renderMode = event.target.value;
    mountGrid();
  });
  document.getElementById('spangrid-scroll-mode').addEventListener('input', (event) => {
    playgroundState.spangrid.scrollMode = event.target.value;
    mountGrid();
  });
  document.getElementById('spangrid-readonly').addEventListener('input', (event) => {
    playgroundState.spangrid.readonly = event.target.checked;
    mountGrid();
  });
  document.getElementById('spangrid-zoom').addEventListener('input', (event) => {
    playgroundState.spangrid.zoom = Number(event.target.value);
    mountGrid();
  });
  document.getElementById('spangrid-export').addEventListener('click', () => {
    const output = document.getElementById('spangrid-json-output');
    if (gridView?.grid?.toJSON) {
      output.value = pretty(gridView.grid.toJSON());
    }
  });

  document.querySelectorAll('.bcp-tab').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      document.querySelectorAll('.bcp-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
      });
      document.querySelectorAll('.bcp-hsv-row').forEach((row) => {
        row.classList.toggle('bcp-hidden', mode !== 'hsv');
      });
      document.querySelectorAll('.bcp-rgb-row').forEach((row) => {
        row.classList.toggle('bcp-hidden', mode !== 'rgb');
      });
      document.querySelector('.bcp-hex-row').classList.toggle('bcp-hidden', mode !== 'hex');
    });
  });
  const rerenderBrowser = document.getElementById('rerender-browser');
  if (rerenderBrowser) {
    rerenderBrowser.addEventListener('click', refreshBrowserDemos);
  }
  document.querySelectorAll('[data-node-feature]').forEach((button) => {
    button.addEventListener('click', () => activateNodeFeature(button.dataset.nodeFeature));
  });
  const runNodeFeatureButton = document.getElementById('node-run-feature');
  if (runNodeFeatureButton) {
    runNodeFeatureButton.addEventListener('click', () => {
      runActiveNodeFeature().catch((error) => {
        setTextIfPresent('node-feature-output', error.stack || error.message);
      });
    });
  }

  [
    'scheduler-type-control',
    'scheduler-start-control',
    'scheduler-interval-control',
    'scheduler-delay-ms',
    'scheduler-fixed-hour-control',
    'scheduler-fixed-day-control',
    'scheduler-trigger-count-control',
  ].forEach((id) => document.getElementById(id).addEventListener('input', updateSchedulerStateFromControls));
  document.getElementById('scheduler-run').addEventListener('click', () => {
    updateSchedulerStateFromControls();
    runSchedulerLab().catch((error) => setTextIfPresent('scheduler-summary', error.message));
  });
  document.getElementById('scheduler-reset').addEventListener('click', resetSchedulerLab);

  [
    'workqueue-concurrent-limit',
    'workqueue-items',
    'workqueue-fail-item',
    'workqueue-delay-ms',
  ].forEach((id) => document.getElementById(id).addEventListener('input', updateWorkQueueStateFromControls));
  document.getElementById('workqueue-run').addEventListener('click', () => {
    updateWorkQueueStateFromControls();
    runWorkQueueLab().catch((error) => setTextIfPresent('workqueue-summary', error.message));
  });
  document.getElementById('workqueue-reset').addEventListener('click', resetWorkQueueLab);
}

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  mountCatalog();
  mountBrowserDemos();
  syncSchedulerControls();
  resetSchedulerDisplay();
  syncWorkQueueControls();
  resetWorkQueueDisplay();
  activateNodeFeature('calculator');
  routeFromHash();
  window.addEventListener('hashchange', routeFromHash);
  checkNodeApis()
    .then(() => setText('server-status', 'server ready'))
    .catch((error) => setText('server-status', error.message));
});
