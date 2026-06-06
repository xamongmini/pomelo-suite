(function initDiagramEditor() {
  'use strict';

  const sourceInput = document.getElementById('sourceInput');
  const statusOutput = document.getElementById('statusOutput');
  const metricsLabel = document.getElementById('metricsLabel');
  const selectedLabel = document.getElementById('selectedLabel');
  const canvas = document.getElementById('diagramCanvas');
  const renderer = window.PomeloDiagram;
  const ctx = canvas.getContext('2d');

  let diagram;
  let selectedNodeId = '';
  let dragState = null;

  const sampleDiagram = {
    nodes: [
      { id: 'start', type: 'ellipse', x: 80, y: 90, width: 110, height: 58, text: 'Start', fillColor: '#e8fff2', lineColor: '#159957' },
      { id: 'load', x: 290, y: 80, width: 150, height: 76, text: 'Load data', fillColor: '#eff6ff', lineColor: '#2563eb' },
      { id: 'decide', type: 'diamond', x: 540, y: 70, width: 130, height: 96, text: 'Valid?', fillColor: '#fff7ed', lineColor: '#f97316' },
      { id: 'render', x: 760, y: 80, width: 150, height: 76, text: 'Render', fillColor: '#f8fafc', lineColor: '#475569' },
    ],
    links: [
      { from: 'start', to: 'load', label: 'begin' },
      { from: 'load', to: 'decide', label: 'input' },
      { from: 'decide', to: 'render', label: 'yes' },
    ],
  };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width));
    canvas.height = Math.max(240, Math.floor(rect.height));
  }

  function getSourceData() {
    return renderer.importDiagramData(sourceInput.value);
  }

  function setSourceData(data) {
    sourceInput.value = renderer.exportDiagramData(data);
  }

  function render() {
    try {
      resizeCanvas();
      diagram = renderer.importDiagramData(sourceInput.value);
      if (selectedNodeId && !findNodeById(selectedNodeId)) {
        selectedNodeId = '';
      }

      const result = renderer.renderDiagramToCanvas(ctx, diagram, {
        backgroundColor: '#ffffff',
      });
      drawSelection();
      metricsLabel.textContent = `${result.nodeCount} nodes, ${result.linkCount} links`;
      updateStatus();
    } catch (error) {
      metricsLabel.textContent = 'Invalid source';
      statusOutput.textContent = error.message;
    }
  }

  function addNode() {
    diagram = getSourceData();
    const id = `node-${diagram.nodes.length + 1}`;
    diagram.nodes.push({
      id,
      x: 90 + diagram.nodes.length * 36,
      y: 230 + diagram.nodes.length * 18,
      width: 130,
      height: 64,
      text: id,
      fillColor: '#ffffff',
      lineColor: '#334155',
    });
    selectNode(id);
    commitDiagram();
  }

  function addLink() {
    diagram = getSourceData();
    if (diagram.nodes.length < 2) return;

    const from = findNodeById(selectedNodeId) || diagram.nodes[diagram.nodes.length - 2];
    const to = diagram.nodes.find((node) => node.id !== from.id) || diagram.nodes[diagram.nodes.length - 1];
    diagram.links.push({
      from: from.id,
      to: to.id,
      label: `link ${diagram.links.length + 1}`,
    });
    commitDiagram();
  }

  function deleteSelected() {
    if (!selectedNodeId) return;
    diagram = getSourceData();
    diagram.nodes = diagram.nodes.filter((node) => node.id !== selectedNodeId);
    diagram.links = diagram.links.filter((link) => link.from !== selectedNodeId && link.to !== selectedNodeId);
    selectedNodeId = '';
    commitDiagram();
  }

  function reset() {
    selectedNodeId = '';
    dragState = null;
    setSourceData(sampleDiagram);
    render();
  }

  function exportSource() {
    const data = getSourceData();
    setSourceData(data);
    render();
  }

  function commitDiagram() {
    setSourceData(diagram);
    render();
  }

  function updateStatus() {
    const selectedNode = findNodeById(selectedNodeId);
    if (selectedNode) {
      selectedLabel.textContent = `Selected: ${selectedNode.id}`;
      statusOutput.textContent = `Selected node\nid: ${selectedNode.id}\nx: ${Math.round(selectedNode.x)}\ny: ${Math.round(selectedNode.y)}\n\n${renderer.exportDiagramData(diagram, { space: 2 })}`;
    } else {
      selectedLabel.textContent = 'No selection';
      statusOutput.textContent = renderer.exportDiagramData(diagram, { space: 2 });
    }
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function hitTestNode(point) {
    if (!diagram) return null;

    for (let index = diagram.nodes.length - 1; index >= 0; index -= 1) {
      const node = diagram.nodes[index];
      if (isPointInNode(point, node)) {
        return node;
      }
    }
    return null;
  }

  function isPointInNode(point, node) {
    if (node.type === 'ellipse') {
      const rx = node.width / 2;
      const ry = node.height / 2;
      const cx = node.x + rx;
      const cy = node.y + ry;
      return ((point.x - cx) ** 2) / (rx ** 2) + ((point.y - cy) ** 2) / (ry ** 2) <= 1;
    }

    return point.x >= node.x &&
      point.x <= node.x + node.width &&
      point.y >= node.y &&
      point.y <= node.y + node.height;
  }

  function selectNode(nodeId) {
    selectedNodeId = nodeId || '';
  }

  function dragSelectedNode(point) {
    if (!dragState) return;
    const node = findNodeById(dragState.nodeId);
    if (!node) return;

    node.x = Math.max(0, point.x - dragState.offsetX);
    node.y = Math.max(0, point.y - dragState.offsetY);
    setSourceData(diagram);
    render();
  }

  function drawSelection() {
    const node = findNodeById(selectedNodeId);
    if (!node) return;

    ctx.save();
    ctx.strokeStyle = '#1f6feb';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(node.x - 5, node.y - 5, node.width + 10, node.height + 10);
    ctx.setLineDash([]);
    drawHandle(node.x - 5, node.y - 5);
    drawHandle(node.x + node.width + 5, node.y - 5);
    drawHandle(node.x - 5, node.y + node.height + 5);
    drawHandle(node.x + node.width + 5, node.y + node.height + 5);
    ctx.restore();
  }

  function drawHandle(x, y) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1f6feb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x - 4, y - 4, 8, 8);
    ctx.fill();
    ctx.stroke();
  }

  function findNodeById(nodeId) {
    if (!diagram || !nodeId) return null;
    return diagram.nodes.find((node) => node.id === nodeId) || null;
  }

  function onCanvasMouseDown(event) {
    diagram = getSourceData();
    const point = getCanvasPoint(event);
    const node = hitTestNode(point);

    if (!node) {
      selectNode('');
      render();
      return;
    }

    selectNode(node.id);
    dragState = {
      nodeId: node.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    };
    canvas.classList.add('dragging');
    render();
  }

  function onCanvasMouseMove(event) {
    const point = getCanvasPoint(event);
    const hoveredNode = hitTestNode(point);
    canvas.classList.toggle('can-drag', Boolean(hoveredNode));

    if (dragState) {
      dragSelectedNode(point);
    }
  }

  function onCanvasMouseUp() {
    dragState = null;
    canvas.classList.remove('dragging');
  }

  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('addNodeBtn').addEventListener('click', addNode);
  document.getElementById('addLinkBtn').addEventListener('click', addLink);
  document.getElementById('deleteBtn').addEventListener('click', deleteSelected);
  document.getElementById('renderBtn').addEventListener('click', render);
  document.getElementById('exportBtn').addEventListener('click', exportSource);
  canvas.addEventListener('mousedown', onCanvasMouseDown);
  canvas.addEventListener('mousemove', onCanvasMouseMove);
  canvas.addEventListener('mouseup', onCanvasMouseUp);
  canvas.addEventListener('mouseleave', onCanvasMouseUp);
  window.addEventListener('resize', render);

  reset();
})();
