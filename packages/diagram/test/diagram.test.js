'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const diagram = require('../src');
const pkg = require('../package.json');

test('exports renderer and diagram data helpers without loading browser globals', () => {
  assert.equal(typeof diagram.createDiagramData, 'function');
  assert.equal(typeof diagram.normalizeDiagramData, 'function');
  assert.equal(typeof diagram.importDiagramData, 'function');
  assert.equal(typeof diagram.exportDiagramData, 'function');
  assert.equal(typeof diagram.renderDiagramToCanvas, 'function');
  assert.equal(typeof diagram.getDiagramBounds, 'function');
});

test('normalizes imports and exports stable diagram data', () => {
  const data = diagram.createDiagramData({
    nodes: [
      { id: 'start', type: 'ellipse', x: 10, y: 20, width: 80, height: 44, text: 'Start' },
      { id: 'task', x: 160, y: 20, text: 'Task' },
    ],
    links: [
      { from: 'start', to: 'task', label: 'next' },
    ],
  });

  assert.equal(data.version, 1);
  assert.deepEqual(data.nodes.map((node) => node.id), ['start', 'task']);
  assert.equal(data.nodes[1].type, 'rectangle');
  assert.equal(data.nodes[1].width, 120);
  assert.equal(data.links[0].id, 'link-1');
  assert.equal(data.links[0].from, 'start');

  const json = diagram.exportDiagramData(data);
  const imported = diagram.importDiagramData(json);
  assert.deepEqual(imported, data);
});

test('renders normalized diagram data to a canvas context', () => {
  const calls = [];
  const ctx = {
    canvas: { width: 640, height: 360 },
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    clearRect(...args) { calls.push(['clearRect', ...args]); },
    beginPath() { calls.push(['beginPath']); },
    moveTo(...args) { calls.push(['moveTo', ...args]); },
    lineTo(...args) { calls.push(['lineTo', ...args]); },
    bezierCurveTo(...args) { calls.push(['bezierCurveTo', ...args]); },
    quadraticCurveTo(...args) { calls.push(['quadraticCurveTo', ...args]); },
    closePath() { calls.push(['closePath']); },
    rect(...args) { calls.push(['rect', ...args]); },
    ellipse(...args) { calls.push(['ellipse', ...args]); },
    fill() { calls.push(['fill']); },
    stroke() { calls.push(['stroke']); },
    fillText(...args) { calls.push(['fillText', ...args]); },
    measureText(value) { return { width: String(value).length * 7 }; },
    setLineDash(value) { calls.push(['setLineDash', value]); },
  };

  const result = diagram.renderDiagramToCanvas(ctx, {
    nodes: [
      { id: 'a', x: 20, y: 30, width: 100, height: 50, text: 'Alpha' },
      { id: 'b', type: 'diamond', x: 200, y: 30, width: 90, height: 60, text: 'Beta' },
    ],
    links: [{ from: 'a', to: 'b', label: 'go' }],
  });

  assert.equal(result.nodeCount, 2);
  assert.equal(result.linkCount, 1);
  assert.deepEqual(result.bounds, { x: 20, y: 30, width: 270, height: 60 });
  assert.equal(calls.some((call) => call[0] === 'clearRect'), true);
  assert.equal(calls.some((call) => call[0] === 'fillText' && call[1] === 'Alpha'), true);
  assert.equal(calls.some((call) => call[0] === 'fillText' && call[1] === 'go'), true);
});

test('declares experimental package entrypoints', () => {
  assert.equal(pkg.name, '@pomelo-suite/diagram');
  assert.equal(pkg.main, 'src/index.js');
  assert.equal(pkg.browser, undefined);
  assert.equal(pkg.exports['.'].require, './src/index.js');
  assert.equal(pkg.exports['.'].default, './src/index.js');
  assert.equal(pkg.exports['./package.json'], './package.json');
  assert.equal(pkg.pomeloSuite.stability, 'experimental');
});

test('keeps the editor outside the npm package source', () => {
  const packageSrc = path.resolve(__dirname, '..', 'src');
  assert.equal(fs.existsSync(path.join(packageSrc, 'diagram-editor.html')), false);
  assert.equal(fs.existsSync(path.join(packageSrc, 'diagram-style.css')), false);

  const exampleRoot = path.resolve(__dirname, '..', '..', '..', 'examples', 'diagram');
  const editorHtml = fs.readFileSync(path.join(exampleRoot, 'diagram-editor.html'), 'utf8');
  const editorCore = fs.readFileSync(path.join(exampleRoot, 'diagram-core.js'), 'utf8');
  const rendererLabHtml = fs.readFileSync(path.join(exampleRoot, 'renderer-lab.html'), 'utf8');
  const rendererLabJs = fs.readFileSync(path.join(exampleRoot, 'renderer-lab.js'), 'utf8');

  assert.match(editorHtml, /Diagram Editor/);
  assert.match(editorHtml, /diagram-style\.css/);
  assert.match(editorHtml, /diagram-core\.js/);
  assert.doesNotMatch(editorHtml, /packages\/diagram\/src\/diagram-renderer\.js/);
  assert.match(editorCore, /class DiagramEditor/);
  assert.match(editorCore, /class ContainerNode/);
  assert.match(editorCore, /saveDiagram\(\)/);
  assert.match(editorCore, /loadDiagram\(\)/);
  assert.match(editorCore, /exportDiagram\(\)/);
  assert.match(editorCore, /groupSelected\(\)/);
  assert.match(editorCore, /alignNodes\(/);
  assert.match(editorCore, /distributeNodes\(/);
  assert.match(editorCore, /insertTemplate\(/);
  assert.match(editorCore, /addEventListener\('mousedown'/);
  assert.match(editorCore, /addEventListener\('mousemove'/);
  assert.match(editorCore, /addEventListener\('mouseup'/);

  assert.match(rendererLabHtml, /Renderer Lab/);
  assert.match(rendererLabHtml, /packages\/diagram\/src\/diagram-renderer\.js/);
  assert.match(rendererLabHtml, /renderer-lab\.js/);
  assert.match(rendererLabJs, /PomeloDiagram/);
  assert.match(rendererLabJs, /renderDiagramToCanvas/);
});
