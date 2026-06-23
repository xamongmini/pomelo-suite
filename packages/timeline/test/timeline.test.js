'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const pkg = require('../package.json');
const { TimelineEditor } = require('../src');

function createCanvasContext(recording = null) {
  return new Proxy({}, {
    get(target, property) {
      if (property === 'measureText') return () => ({ width: 0 });
      if (property === 'fillText' && recording) {
        return (text, x, y) => {
          recording.fillText.push({ text: String(text), x, y });
        };
      }
      if ((property === 'moveTo' || property === 'lineTo') && recording) {
        return (x, y) => {
          recording[property].push({ x, y });
        };
      }
      if (!(property in target)) target[property] = () => {};
      return target[property];
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
  });
}

function createElement(options = {}) {
  const listeners = new Map();
  const element = {
    style: {},
    children: options.children || [],
    dataset: options.dataset || {},
    className: options.className || '',
    parentElement: options.parentElement || null,
    offsetParent: options.offsetParent || null,
    value: '',
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    querySelectorAll(selector) {
      if (selector !== '.context-menu-item') return [];
      return this.children.filter((child) => child.className === 'context-menu-item');
    },
    contains(target) {
      return target === this || this.children.some((child) => child === target || child.contains?.(target));
    },
    focus() {
      this.focused = true;
    },
    select() {
      this.selected = true;
    },
    getBoundingClientRect() {
      return options.rect || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
  };

  return element;
}

function createCanvas(
  rect = { left: 0, top: 0, right: 0, bottom: 0, width: 300, height: 160 },
  recording = null,
) {
  const listeners = new Map();
  return {
    width: rect.width,
    height: rect.height,
    style: {},
    parentElement: createElement(),
    getContext() {
      return createCanvasContext(recording);
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    dispatch(type, event = {}) {
      for (const handler of listeners.get(type) || []) {
        handler({
          button: 0,
          clientX: 0,
          clientY: 0,
          preventDefault() {},
          ...event,
        });
      }
    },
    focus() {
      this.focused = true;
    },
    getBoundingClientRect() {
      return rect;
    },
  };
}

function withMockDocument(elementsById, callback) {
  const previousDocument = globalThis.document;
  const document = {
    lookups: [],
    createElement,
    getElementById(id) {
      this.lookups.push(id);
      return elementsById[id] || null;
    },
    addEventListener() {},
    removeEventListener() {},
  };

  globalThis.document = document;

  try {
    return callback(document);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

test('exports TimelineEditor', () => {
  assert.equal(typeof TimelineEditor, 'function');
  assert.equal(['Blen', 'derTimelineEditor'].join('') in require('../src'), false);
});

test('defines package exports map', () => {
  assert.deepEqual(pkg.exports, {
    '.': {
      browser: './src/timeline-editor.js',
      require: './src/index.js',
      default: './src/index.js',
    },
    './package.json': './package.json',
  });
});

test('resolves edit and context overlays by configured element ids', () => {
  const menuParent = createElement({ rect: { left: 40, top: 50, width: 320, height: 200 } });
  const editParent = createElement({ rect: { left: 25, top: 75, width: 320, height: 200 } });
  const contextMenu = createElement({ offsetParent: menuParent });
  const editBox = createElement({ offsetParent: editParent });
  const canvas = createCanvas({ left: 100, top: 200, right: 400, bottom: 360, width: 300, height: 160 });

  withMockDocument({ timelineMenu: contextMenu, timelineEdit: editBox }, () => {
    const editor = new TimelineEditor(canvas, {
      contextMenuId: 'timelineMenu',
      editBoxId: 'timelineEdit',
    });

    editor.showContextMenu(150, 260);
    assert.equal(contextMenu.style.display, 'block');
    assert.equal(contextMenu.style.left, '110px');
    assert.equal(contextMenu.style.top, '210px');

    editor.showEditBox({ x: 10, y: 20, width: 80, height: 18 }, 'Clip name');
    assert.equal(editBox.style.display, 'block');
    assert.equal(editBox.style.left, '85px');
    assert.equal(editBox.style.top, '145px');
    assert.equal(editBox.style.width, '80px');
    assert.equal(editBox.style.height, '18px');
    assert.equal(editBox.value, 'Clip name');
    assert.equal(editBox.focused, true);
    assert.equal(editBox.selected, true);
  });
});

test('supports direct overlay elements and missing overlays', () => {
  const contextMenu = createElement();
  const editBox = createElement();
  const canvas = createCanvas();

  withMockDocument({}, (document) => {
    const editor = new TimelineEditor(canvas, {
      contextMenuElement: contextMenu,
      editBoxElement: editBox,
    });

    editor.showContextMenu(12, 18);
    editor.showEditBox({ x: 2, y: 3, width: 40, height: 12 }, 'Direct');

    assert.equal(contextMenu.style.display, 'block');
    assert.equal(editBox.value, 'Direct');
    assert.deepEqual(document.lookups, []);
  });

  withMockDocument({}, () => {
    const editor = new TimelineEditor(canvas);

    assert.doesNotThrow(() => {
      editor.showContextMenu(12, 18);
      editor.hideContextMenu();
      editor.showEditBox({ x: 2, y: 3, width: 40, height: 12 }, 'Missing');
      editor.endEditing(true);
    });
  });
});

test('fires selection events without requiring external EventArgs globals', () => {
  const canvas = createCanvas();

  withMockDocument({}, () => {
    const editor = new TimelineEditor(canvas);
    const clip = editor.addClip(editor.tracks.push(editor.createTrack('Actions')) - 1, 'render', 0, 4, '#22c55e');
    let called = 0;

    editor.addEventListener('clipSelected', (sender, args) => {
      called += 1;
      assert.equal(sender, editor);
      assert.deepEqual(args, {});
    });

    assert.doesNotThrow(() => editor.setSelectedClip(clip));
    assert.equal(called, 1);
  });
});

test('fires explicit change events when clip resize ends', () => {
  const canvas = createCanvas({ left: 0, top: 0, right: 600, bottom: 180, width: 600, height: 180 });

  withMockDocument({}, () => {
    const editor = new TimelineEditor(canvas);
    editor.setSnapGrid(1);
    const track = editor.addTrack('Actions');
    const clip = editor.addClip(0, 'render', 0, 10, '#22c55e');
    const events = [];

    editor.addEventListener('clipResizeEnd', (sender, args) => events.push(['resize', sender, args]));
    editor.addEventListener('clipChanged', (sender, args) => events.push(['changed', sender, args]));
    editor.addEventListener('timelineChanged', (sender, args) => events.push(['timeline', sender, args]));

    const y = editor.timelineHeight + 10;
    const rightHandleX = editor.trackHeaderWidth + clip.length * editor.frameWidth - 3;
    canvas.dispatch('mousedown', { clientX: rightHandleX, clientY: y });
    canvas.dispatch('mousemove', { clientX: rightHandleX + editor.frameWidth, clientY: y });
    canvas.dispatch('mouseup', { clientX: rightHandleX + editor.frameWidth, clientY: y });

    assert.equal(clip.length, 11);
    assert.equal(events.length, 3);
    assert.equal(events[0][0], 'resize');
    assert.equal(events[0][1], editor);
    assert.equal(events[0][2].clip, clip);
    assert.equal(events[0][2].track, track);
    assert.equal(events[0][2].oldLength, 10);
    assert.equal(events[0][2].length, 11);
    assert.equal(events[1][2].reason, 'resize');
    assert.equal(events[2][2].reason, 'clip:resize');
  });
});

test('fires explicit change events when clip move ends', () => {
  const canvas = createCanvas({ left: 0, top: 0, right: 600, bottom: 180, width: 600, height: 180 });

  withMockDocument({}, () => {
    const editor = new TimelineEditor(canvas);
    editor.setSnapGrid(1);
    const track = editor.addTrack('Actions');
    const clip = editor.addClip(0, 'stream', 0, 8, '#ec4899');
    const events = [];

    editor.addEventListener('clipMoveEnd', (sender, args) => events.push(['move', sender, args]));
    editor.addEventListener('clipChanged', (sender, args) => events.push(['changed', sender, args]));
    editor.addEventListener('timelineChanged', (sender, args) => events.push(['timeline', sender, args]));

    const y = editor.timelineHeight + 10;
    const clipBodyX = editor.trackHeaderWidth + 20;
    canvas.dispatch('mousedown', { clientX: clipBodyX, clientY: y });
    canvas.dispatch('mousemove', { clientX: clipBodyX + editor.frameWidth * 2, clientY: y });
    canvas.dispatch('mouseup', { clientX: clipBodyX + editor.frameWidth * 2, clientY: y });

    assert.equal(clip.start, 2);
    assert.equal(events.length, 3);
    assert.equal(events[0][0], 'move');
    assert.equal(events[0][1], editor);
    assert.equal(events[0][2].clip, clip);
    assert.equal(events[0][2].track, track);
    assert.equal(events[0][2].oldStart, 0);
    assert.equal(events[0][2].start, 2);
    assert.equal(events[1][2].reason, 'move');
    assert.equal(events[2][2].reason, 'clip:move');
  });
});

test('renders timeline ruler labels as elapsed time when rulerMode is time', () => {
  const recording = { fillText: [], moveTo: [], lineTo: [] };
  const canvas = createCanvas(
    { left: 0, top: 0, right: 520, bottom: 160, width: 520, height: 160 },
    recording,
  );

  withMockDocument({}, () => {
    const editor = new TimelineEditor(canvas, {
      rulerMode: 'time',
      msPerFrame: 100,
      majorTickMs: 1000,
      minorTickMs: 250,
    });
    editor.trackHeaderWidth = 100;
    editor.frameWidth = 10;
    editor.frameCount = 40;
    editor.render();

    const labels = recording.fillText.map((item) => item.text);
    assert(labels.includes('0.0s'));
    assert(labels.includes('1.0s'));
    assert(labels.includes('2.0s'));
    assert(!labels.includes('1'));
    assert(!labels.includes('2'));
  });
});
