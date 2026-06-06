(function attachDiagramRenderer(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PomeloDiagram = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDiagramRenderer() {
  'use strict';

  const DEFAULT_NODE = Object.freeze({
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 120,
    height: 64,
    text: '',
    fillColor: '#ffffff',
    lineColor: '#334155',
    lineWidth: 2,
    textColor: '#0f172a',
  });

  const DEFAULT_LINK = Object.freeze({
    lineColor: '#475569',
    lineWidth: 2,
    label: '',
  });

  function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clonePlain(value) {
    if (value == null) return {};
    return JSON.parse(JSON.stringify(value));
  }

  function createDiagramData(input) {
    return normalizeDiagramData(input);
  }

  function normalizeDiagramData(input) {
    const source = clonePlain(input);
    const nodes = Array.isArray(source.nodes) ? source.nodes : [];
    const links = Array.isArray(source.links) ? source.links : [];

    return {
      version: numberOr(source.version, 1),
      nodes: nodes.map((node, index) => normalizeNode(node, index)),
      links: links.map((link, index) => normalizeLink(link, index)),
    };
  }

  function normalizeNode(node, index) {
    const id = node.id == null || node.id === '' ? `node-${index + 1}` : String(node.id);
    return {
      id,
      type: node.type || DEFAULT_NODE.type,
      x: numberOr(node.x, DEFAULT_NODE.x),
      y: numberOr(node.y, DEFAULT_NODE.y),
      width: Math.max(1, numberOr(node.width, DEFAULT_NODE.width)),
      height: Math.max(1, numberOr(node.height, DEFAULT_NODE.height)),
      text: node.text == null ? DEFAULT_NODE.text : String(node.text),
      fillColor: node.fillColor || DEFAULT_NODE.fillColor,
      lineColor: node.lineColor || DEFAULT_NODE.lineColor,
      lineWidth: Math.max(0, numberOr(node.lineWidth, DEFAULT_NODE.lineWidth)),
      textColor: node.textColor || DEFAULT_NODE.textColor,
    };
  }

  function normalizeLink(link, index) {
    return {
      id: link.id == null || link.id === '' ? `link-${index + 1}` : String(link.id),
      from: link.from == null ? '' : String(link.from),
      to: link.to == null ? '' : String(link.to),
      label: link.label == null ? DEFAULT_LINK.label : String(link.label),
      lineColor: link.lineColor || DEFAULT_LINK.lineColor,
      lineWidth: Math.max(0, numberOr(link.lineWidth, DEFAULT_LINK.lineWidth)),
      points: Array.isArray(link.points)
        ? link.points.map((point) => ({
            x: numberOr(point.x, 0),
            y: numberOr(point.y, 0),
          }))
        : [],
    };
  }

  function importDiagramData(source) {
    const parsed = typeof source === 'string' ? JSON.parse(source) : source;
    return normalizeDiagramData(parsed);
  }

  function exportDiagramData(data, options) {
    const normalized = normalizeDiagramData(data);
    const space = options && Object.prototype.hasOwnProperty.call(options, 'space') ? options.space : 2;
    return JSON.stringify(normalized, null, space);
  }

  function getDiagramBounds(data) {
    const diagram = normalizeDiagramData(data);
    if (diagram.nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of diagram.nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function renderDiagramToCanvas(target, data, options) {
    const ctx = resolveContext(target);
    const diagram = normalizeDiagramData(data);
    const settings = Object.assign({
      clear: true,
      backgroundColor: '',
      padding: 0,
      font: '13px Segoe UI, Arial, sans-serif',
    }, options || {});

    if (settings.clear && ctx.canvas) {
      ctx.clearRect(0, 0, ctx.canvas.width || 0, ctx.canvas.height || 0);
    }

    if (settings.backgroundColor && ctx.canvas) {
      ctx.save();
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, ctx.canvas.width || 0, ctx.canvas.height || 0);
      ctx.restore();
    }

    ctx.save();
    ctx.font = settings.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const nodeById = new Map(diagram.nodes.map((node) => [node.id, node]));
    for (const link of diagram.links) {
      drawLink(ctx, link, nodeById);
    }
    for (const node of diagram.nodes) {
      drawNode(ctx, node);
    }

    ctx.restore();

    return {
      nodeCount: diagram.nodes.length,
      linkCount: diagram.links.length,
      bounds: getDiagramBounds(diagram),
    };
  }

  function resolveContext(target) {
    if (!target) {
      throw new TypeError('A canvas or 2D canvas context is required.');
    }
    if (typeof target.getContext === 'function') {
      const ctx = target.getContext('2d');
      if (!ctx) throw new TypeError('The canvas does not expose a 2D context.');
      return ctx;
    }
    return target;
  }

  function drawLink(ctx, link, nodeById) {
    const fromNode = nodeById.get(link.from);
    const toNode = nodeById.get(link.to);
    const points = link.points.length > 0 ? link.points : defaultLinkPoints(fromNode, toNode);
    if (points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = link.lineColor;
    ctx.lineWidth = link.lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }
    ctx.stroke();
    drawArrow(ctx, points[points.length - 2], points[points.length - 1], link.lineColor);

    if (link.label) {
      const mid = points[Math.floor(points.length / 2)];
      ctx.fillStyle = '#0f172a';
      ctx.fillText(link.label, mid.x, mid.y - 10);
    }
    ctx.restore();
  }

  function defaultLinkPoints(fromNode, toNode) {
    if (!fromNode || !toNode) return [];
    return [
      centerOf(fromNode),
      centerOf(toNode),
    ];
  }

  function centerOf(node) {
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    };
  }

  function drawArrow(ctx, from, to, color) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = 9;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawNode(ctx, node) {
    ctx.save();
    ctx.fillStyle = node.fillColor;
    ctx.strokeStyle = node.lineColor;
    ctx.lineWidth = node.lineWidth;

    if (node.type === 'ellipse') {
      drawEllipse(ctx, node);
    } else if (node.type === 'diamond') {
      drawDiamond(ctx, node);
    } else {
      drawRectangle(ctx, node);
    }

    ctx.fill();
    ctx.stroke();
    if (node.text) {
      ctx.fillStyle = node.textColor;
      ctx.fillText(node.text, node.x + node.width / 2, node.y + node.height / 2);
    }
    ctx.restore();
  }

  function drawRectangle(ctx, node) {
    const radius = Math.min(8, node.width / 4, node.height / 4);
    const right = node.x + node.width;
    const bottom = node.y + node.height;

    ctx.beginPath();
    ctx.moveTo(node.x + radius, node.y);
    ctx.lineTo(right - radius, node.y);
    ctx.quadraticCurveTo(right, node.y, right, node.y + radius);
    ctx.lineTo(right, bottom - radius);
    ctx.quadraticCurveTo(right, bottom, right - radius, bottom);
    ctx.lineTo(node.x + radius, bottom);
    ctx.quadraticCurveTo(node.x, bottom, node.x, bottom - radius);
    ctx.lineTo(node.x, node.y + radius);
    ctx.quadraticCurveTo(node.x, node.y, node.x + radius, node.y);
    ctx.closePath();
  }

  function drawEllipse(ctx, node) {
    ctx.beginPath();
    if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(
        node.x + node.width / 2,
        node.y + node.height / 2,
        node.width / 2,
        node.height / 2,
        0,
        0,
        Math.PI * 2
      );
    } else {
      ctx.rect(node.x, node.y, node.width, node.height);
    }
    ctx.closePath();
  }

  function drawDiamond(ctx, node) {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    ctx.beginPath();
    ctx.moveTo(cx, node.y);
    ctx.lineTo(node.x + node.width, cy);
    ctx.lineTo(cx, node.y + node.height);
    ctx.lineTo(node.x, cy);
    ctx.closePath();
  }

  return {
    createDiagramData,
    normalizeDiagramData,
    importDiagramData,
    exportDiagramData,
    renderDiagramToCanvas,
    getDiagramBounds,
  };
});
