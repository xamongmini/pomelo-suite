'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const pkg = require('../package.json');
const { TextInputPro } = require('../src');

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

function createElement(tagName = 'div') {
  const listeners = new Map();
  let innerHTML = '';
  const element = {
    tagName: tagName.toUpperCase(),
    style: {},
    children: [],
    className: '',
    textContent: '',
    value: '',
    appendChild(child) {
      this.children.push(child);
      child.parentElement = this;
      return child;
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) || [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    removeEventListener(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter((item) => item !== handler));
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
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    },
    getContext() {
      return createCanvasContext();
    },
  };

  Object.defineProperty(element, 'innerHTML', {
    get() {
      return innerHTML;
    },
    set(value) {
      innerHTML = String(value);
      if (innerHTML === '') element.children = [];
    },
  });

  return element;
}

function withMockDocument(elementsById, callback) {
  const previousDocument = globalThis.document;
  const previousSetTimeout = globalThis.setTimeout;
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
  globalThis.setTimeout = (handler) => {
    handler();
    return 0;
  };

  try {
    return callback(document);
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    globalThis.setTimeout = previousSetTimeout;
  }
}

test('exports TextInputPro', () => {
  assert.equal(typeof TextInputPro, 'function');
  assert.equal(['Blen', 'derTextInputPro'].join('') in require('../src'), false);
});

test('defines package exports map', () => {
  assert.deepEqual(pkg.exports, {
    '.': {
      browser: './src/text-input-pro.js',
      require: './src/index.js',
      default: './src/index.js',
    },
    './package.json': './package.json',
  });
});

test('renders context menu into the configured menu id', () => {
  const defaultMenu = createElement();
  const scopedMenu = createElement();
  const container = createElement();
  let actionOwner = null;

  withMockDocument({ contextMenu: defaultMenu, inputMenu: scopedMenu }, () => {
    const control = new TextInputPro(container, {
      contextMenuId: 'inputMenu',
      contextMenu: [
        { label: 'Apply', action() { actionOwner = this; } },
      ],
    });

    control.showContextMenu(24, 48);

    assert.equal(defaultMenu.children.length, 0);
    assert.equal(scopedMenu.style.display, 'block');
    assert.equal(scopedMenu.style.left, '24px');
    assert.equal(scopedMenu.style.top, '48px');
    assert.equal(scopedMenu.children.length, 1);
    assert.equal(scopedMenu.children[0].textContent, 'Apply');

    scopedMenu.children[0].onclick();
    assert.equal(actionOwner, control);
    assert.equal(scopedMenu.style.display, 'none');
  });
});

test('prefers an explicit context menu element over document lookup', () => {
  const scopedMenu = createElement();
  const container = createElement();

  withMockDocument({}, (document) => {
    const control = new TextInputPro(container, {
      contextMenuElement: scopedMenu,
      contextMenu: [
        { label: 'Scoped', action() {} },
      ],
    });

    control.showContextMenu(8, 16);

    assert.deepEqual(document.lookups, []);
    assert.equal(scopedMenu.style.display, 'block');
    assert.equal(scopedMenu.children[0].textContent, 'Scoped');
  });
});
