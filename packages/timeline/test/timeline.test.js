'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const pkg = require('../package.json');
const { TimelineEditor } = require('../src');

function createCanvasContext() {
  return new Proxy({}, {
    get(target, property) {
      if (property === 'measureText') return () => ({ width: 0 });
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

function createCanvas(rect = { left: 0, top: 0, right: 0, bottom: 0, width: 300, height: 160 }) {
  return {
    width: rect.width,
    height: rect.height,
    style: {},
    parentElement: createElement(),
    getContext() {
      return createCanvasContext();
    },
    addEventListener() {},
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
