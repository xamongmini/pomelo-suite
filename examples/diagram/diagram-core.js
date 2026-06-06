// Line Container  
class ContainerNode {
    constructor(id, x, y, width, height) {
        this.id = id;
        this.type = 'container';
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.minWidth = 150;
        this.minHeight = 100;
        this.fillColor = '#f8f9fa';
        this.lineColor = '#6c757d';
        this.lineWidth = 2;
        this.title = 'Container';
        this.titleHeight = 30;
        this.children = [];
        this.collapsed = false;
        this.padding = 10;
        this.isDirty = true;
        this.layout = 'free';
        
        // Container  
        this.parentContainerId = null;
        this.depth = 0;
        
        // Child node Circle  Save (  Circle)
        this.childrenOriginalBounds = new Map();
        
        // Container   Child node   
        this.resizeChildren = false;
        
        //    
        this.isDropTarget = false;
    }
    
    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    getTitleBarBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.titleHeight
        };
    }
    
    getContentBounds() {
        return {
            x: this.x + this.padding,
            y: this.y + this.titleHeight + this.padding,
            width: this.width - this.padding * 2,
            height: this.height - this.titleHeight - this.padding * 2
        };
    }
    
    getCollapseButtonBounds() {
        const size = 16;
        return {
            x: this.x + this.width - size - 8,
            y: this.y + (this.titleHeight - size) / 2,
            width: size,
            height: size
        };
    }
    
    //   Container   
    toRelativeCoords(absoluteX, absoluteY) {
        const contentBounds = this.getContentBounds();
        return {
            x: absoluteX - contentBounds.x,
            y: absoluteY - contentBounds.y
        };
    }
    
    // Container     
    toAbsoluteCoords(relativeX, relativeY) {
        const contentBounds = this.getContentBounds();
        return {
            x: contentBounds.x + relativeX,
            y: contentBounds.y + relativeY
        };
    }
    
    // Child node Container    
    isChildWithinBounds(child) {
        const contentBounds = this.getContentBounds();
        return child.containerOffsetX >= 0 &&
               child.containerOffsetY >= 0 &&
               child.containerOffsetX + child.width <= contentBounds.width &&
               child.containerOffsetY + child.height <= contentBounds.height;
    }
    
    // Child node position Container   
    constrainChildPosition(child) {
        const contentBounds = this.getContentBounds();
        
        child.containerOffsetX = Math.max(0, 
            Math.min(child.containerOffsetX, contentBounds.width - child.width));
        child.containerOffsetY = Math.max(0, 
            Math.min(child.containerOffsetY, contentBounds.height - child.height));
    }
    
    // Container / 
    toggleCollapse() {
        this.collapsed = !this.collapsed;
        
        if (this.collapsed) {
            //   Circle  Save
            this.collapsedHeight = this.height;
            this.height = this.titleHeight + 40; //  Height
        } else {
            //   Circle  Circle
            if (this.collapsedHeight) {
                this.height = this.collapsedHeight;
            }
        }
        
        this.markDirty();
    }
    
    // Child node 
    addChild(nodeId) {
        if (!this.children.includes(nodeId)) {
            this.children.push(nodeId);
            this.markDirty();
        }
    }
    
    // Child node 
    removeChild(nodeId) {
        const index = this.children.indexOf(nodeId);
        if (index > -1) {
            this.children.splice(index, 1);
            this.childrenOriginalBounds.delete(nodeId);
            this.markDirty();
        }
    }
    
    //  Child node 
    clearChildren() {
        this.children = [];
        this.childrenOriginalBounds.clear();
        this.markDirty();
    }
    
    // Child node   
    hasChild(nodeId) {
        return this.children.includes(nodeId);
    }
    
    // Container    (Child node )
    autoResize(nodes, padding = 20) {
        if (this.collapsed || this.children.length === 0) return;
        
        const children = this.children
            .map(id => nodes.find(n => n.id === id))
            .filter(n => n);
        
        if (children.length === 0) return;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        children.forEach(child => {
            minX = Math.min(minX, child.containerOffsetX || 0);
            minY = Math.min(minY, child.containerOffsetY || 0);
            maxX = Math.max(maxX, (child.containerOffsetX || 0) + child.width);
            maxY = Math.max(maxY, (child.containerOffsetY || 0) + child.height);
        });
        
        //   
        const newWidth = Math.max(this.minWidth, maxX + padding * 2);
        const newHeight = Math.max(this.minHeight, maxY + this.titleHeight + padding * 2);
        
        //  
        this.width = newWidth;
        this.height = newHeight;
        
        this.markDirty();
    }
    
    // Child node    
    arrangeChildren(nodes) {
        const children = this.children
            .map(id => nodes.find(n => n.id === id))
            .filter(n => n);
        
        if (children.length === 0) return;
        
        const contentBounds = this.getContentBounds();
        
        switch (this.layout) {
            case 'grid':
                this.arrangeGrid(children, contentBounds);
                break;
            case 'flow':
                this.arrangeFlow(children, contentBounds);
                break;
            case 'vertical':
                this.arrangeVertical(children, contentBounds);
                break;
            case 'horizontal':
                this.arrangeHorizontal(children, contentBounds);
                break;
            default:
                // 'free'   
                break;
        }
        
        this.markDirty();
    }
    
    //  
    arrangeGrid(children, contentBounds) {
        const cols = Math.ceil(Math.sqrt(children.length));
        const rows = Math.ceil(children.length / cols);
        const cellWidth = contentBounds.width / cols;
        const cellHeight = contentBounds.height / rows;
        
        children.forEach((child, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            child.containerOffsetX = col * cellWidth + (cellWidth - child.width) / 2;
            child.containerOffsetY = row * cellHeight + (cellHeight - child.height) / 2;
            
            this.constrainChildPosition(child);
        });
    }
    
    //  
    arrangeFlow(children, contentBounds) {
        const spacing = 10;
        let currentX = spacing;
        let currentY = spacing;
        let rowHeight = 0;
        
        children.forEach(child => {
            if (currentX + child.width + spacing > contentBounds.width) {
                currentX = spacing;
                currentY += rowHeight + spacing;
                rowHeight = 0;
            }
            
            child.containerOffsetX = currentX;
            child.containerOffsetY = currentY;
            
            currentX += child.width + spacing;
            rowHeight = Math.max(rowHeight, child.height);
        });
    }
    
    //  
    arrangeVertical(children, contentBounds) {
        const spacing = 10;
        const totalHeight = children.reduce((sum, child) => sum + child.height, 0) + 
                          spacing * (children.length - 1);
        let currentY = Math.max(spacing, (contentBounds.height - totalHeight) / 2);
        
        children.forEach(child => {
            child.containerOffsetX = (contentBounds.width - child.width) / 2;
            child.containerOffsetY = currentY;
            currentY += child.height + spacing;
        });
    }
    
    //  
    arrangeHorizontal(children, contentBounds) {
        const spacing = 10;
        const totalWidth = children.reduce((sum, child) => sum + child.width, 0) + 
                          spacing * (children.length - 1);
        let currentX = Math.max(spacing, (contentBounds.width - totalWidth) / 2);
        
        children.forEach(child => {
            child.containerOffsetX = currentX;
            child.containerOffsetY = (contentBounds.height - child.height) / 2;
            currentX += child.width + spacing;
        });
    }
    
    markDirty() {
        this.isDirty = true;
    }
    
    //  (Save)
    serialize() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            minWidth: this.minWidth,
            minHeight: this.minHeight,
            fillColor: this.fillColor,
            lineColor: this.lineColor,
            lineWidth: this.lineWidth,
            title: this.title,
            titleHeight: this.titleHeight,
            children: this.children,
            collapsed: this.collapsed,
            padding: this.padding,
            layout: this.layout,
            parentContainerId: this.parentContainerId,
            depth: this.depth,
            resizeChildren: this.resizeChildren
        };
    }
    
    //  (Load)
    static deserialize(data) {
        const container = new ContainerNode(data.id, data.x, data.y, data.width, data.height);
        Object.assign(container, data);
        return container;
    }
}

// Diagram Editor  
class DiagramEditor {
    constructor() {
        this.canvas = document.getElementById('diagramCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.rulerH = document.getElementById('rulerH');
        this.rulerV = document.getElementById('rulerV');
        this.rulerHCtx = this.rulerH.getContext('2d');
        this.rulerVCtx = this.rulerV.getContext('2d');
        
        this.nodes = [];
        this.links = [];
        this.groups = [];
        this.selectedNodes = [];
        this.selectedLinks = [];
        this.currentTool = 'select';
        this.isDrawing = false;
        this.isDragging = false;
        this.isPanning = false;
        this.dragStart = null;
        this.dragOffset = null;
        this.tempRect = null;
        this.linkStart = null;
        this.clipboard = null;
        this.clipboardLinks = null;
        this.history = [];
        this.historyIndex = -1;
        this.zoom = 1.0;
        this.pan = { x: 0, y: 0 };
        this.nodeIdCounter = 0;
        this.linkIdCounter = 0;
        this.groupIdCounter = 0;

        // Line Container  Properties
        this.containers = [];
        this.containerIdCounter = 0;
        this.containerHierarchy = new Map(); // Container   
        this.dragTargetContainer = null; //    Container
        
        this.isEditingLine = false;
        this.lineEditHandle = null;

        this.focusedNodeIndex = -1;
        this.announcer = null;
        this.setupAccessibility();

        this.animationFrameId = null;
        this.startAnimation();

        //   
        this.isResizing = false;
        this.resizeHandle = null;
        this.resizeOriginal = null;
        
        //  Select  
        this.dragOffsets = null;
        
        // Line  
        this.tempLine = null;
        
        //  position Save
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Paste 
        this.pasteCount = 0;
        
        //  Tools Save
        this.previousTool = 'select';
        
        // Page Settings
        this.pageSettings = {
            width: 1200,
            height: 800,
            bgColor: '#ffffff',
            showGrid: true,
            gridSize: 20,
            gridColor: '#e0e0e0',
            showRulers: true,
            snapToGrid: false,
            showPageBounds: true,
            showSmartGuides: true,
            smartGuideColor: '#FF00FF',
            snapDistance: 8,
            showCenterGuides: true,
            constrainToPage: false
        };
        
        // Smart Guide
        this.smartGuides = {
            vertical: [],
            horizontal: [],
            active: false
        };
        
        //    
        this.drawCache = {
            needsRedraw: true,
            offscreenCanvas: null,
            offscreenCtx: null
        };
        
        this.init();
    }

    init() {
        this.setupEventHandlers();
        this.setupToolButtons();
        this.resizeCanvas();
        this.setupOffscreenCanvas();
        this.addTestNodes();
        this.saveState();
        this.draw();
        this.drawRulers();
        this.updateStatus('Diagram Editor Ready.');
        this.updateHistoryButtons();
    }

    setupOffscreenCanvas() {
        this.drawCache.offscreenCanvas = document.createElement('canvas');
        this.drawCache.offscreenCtx = this.drawCache.offscreenCanvas.getContext('2d');
    }

    setupEventHandlers() {
        //  
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDblClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });
        
        //    ()
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        //  
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        //   
        window.addEventListener('resize', () => this.resizeCanvas());

        // Text  
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });
    }

    setupAccessibility() {
        //     
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('role', 'status');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.style.position = 'absolute';
        this.announcer.style.left = '-10000px';
        this.announcer.style.width = '1px';
        this.announcer.style.height = '1px';
        this.announcer.style.overflow = 'hidden';
        document.body.appendChild(this.announcer);
        
        //   Properties 
        this.canvas.setAttribute('role', 'application');
        this.canvas.setAttribute('aria-label', 'Diagram Editor ');
        this.canvas.setAttribute('tabindex', '0');
    }
    
    announce(message) {
        if (this.announcer) {
            this.announcer.textContent = message;
            //    (  )
            setTimeout(() => {
                this.announcer.textContent = '';
            }, 100);
        }
    }

    //   
    startAnimation() {
        const animate = () => {
            if (this.tempRect || this.tempLine || (this.isDrawing && this.linkStart)) {
                this.draw();
            }
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            const toolName = btn.querySelector('.label').textContent;
            btn.setAttribute('role', 'button');
            btn.setAttribute('aria-label', `${toolName} Tools`);
            
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool);
            });
        });
    }

    selectTool(tool) {
        //    Cancel
        if (this.isDrawing || this.isDragging || this.isResizing) {
            this.cancelOperation();
        }
        
        if (tool === 'template') {
            this.showTemplateModal();
            return;
        }
        
        if (tool === 'image') {
            this.insertImage();
            return;
        }
        
        this.previousTool = this.currentTool;
        this.currentTool = tool;
        
        // Tools    
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
        
        //  
        if (tool === 'select') {
            this.canvas.style.cursor = 'default';
        } else {
            this.canvas.style.cursor = 'crosshair';
        }
        
        this.updateStatus(`${this.getToolName(tool)} Tools Select.`);
    }

    getToolName(tool) {
        const names = {
            'select': 'Select',
            'rectangle': 'Rectangle',
            'ellipse': 'Circle',
            'line': 'Line',
            'text': 'Text',
            'link': 'Link',
            'image': 'Image',
            'template': 'Template',
            'container': 'Container'
        };
        return names[tool] || tool;
    }

    addTestNodes() {
        //   
        this.nodes.push({
            id: this.nodeIdCounter++,
            type: 'rectangle',
            x: 50,
            y: 50,
            width: 100,
            height: 80,
            fillColor: '#FFCCCC',
            lineColor: '#000000',
            lineWidth: 2,
            text: 'Rectangle 1'
        });

        this.nodes.push({
            id: this.nodeIdCounter++,
            type: 'ellipse',
            x: 200,
            y: 50,
            width: 100,
            height: 80,
            fillColor: '#CCFFCC',
            lineColor: '#000000',
            lineWidth: 2,
            text: 'Ellipse 1'
        });

        this.nodes.push({
            id: this.nodeIdCounter++,
            type: 'rectangle',
            x: 50,
            y: 200,
            width: 100,
            height: 80,
            fillColor: '#CCCCFF',
            lineColor: '#000000',
            lineWidth: 2,
            text: 'Rectangle 2'
        });

        //  Link 
        this.links.push({
            id: this.linkIdCounter++,
            source: this.nodes[0],
            target: this.nodes[1],
            color: '#FF5722',
            width: 2,
            style: 'straight',
            arrowType: 'arrow'
        });

        this.saveState();
    }

    // Container   
    updateContainerHierarchy() {
        this.containerHierarchy.clear();
        
        //  Container   
        this.containers.forEach(container => {
            container.depth = 0;
            container.parentContainerId = null;
        });
        
        //  Container   
        this.containers.forEach(container => {
            const parent = this.findParentContainer(container);
            if (parent) {
                container.parentContainerId = parent.id;
                container.depth = parent.depth + 1;
                
                if (!this.containerHierarchy.has(parent.id)) {
                    this.containerHierarchy.set(parent.id, []);
                }
                this.containerHierarchy.get(parent.id).push(container.id);
            }
        });
    }

    //   Container 
    findParentContainer(node) {
        //    Container 
        const sortedContainers = [...this.containers]
            .filter(c => c !== node)
            .sort((a, b) => b.depth - a.depth);
        
        for (const container of sortedContainers) {
            const contentBounds = container.getContentBounds();
            if (node.x >= contentBounds.x && 
                node.y >= contentBounds.y &&
                node.x + node.width <= contentBounds.x + contentBounds.width &&
                node.y + node.height <= contentBounds.y + contentBounds.height) {
                return container;
            }
        }
        
        return null;
    }

    // Container  Container    
    canContainerContain(parent, child) {
        //    
        if (parent === child) return false;
        
        //   
        return !this.wouldCreateCycle(child, parent);
    }

    //   
    wouldCreateCycle(childContainer, parentContainer) {
        if (childContainer === parentContainer) return true;
        
        // childContainer   
        const checkDescendants = (container) => {
            if (container === parentContainer) return true;
            
            const children = this.containerHierarchy.get(container.id) || [];
            for (const childId of children) {
                const child = this.containers.find(c => c.id === childId);
                if (child && checkDescendants(child)) return true;
            }
            
            return false;
        };
        
        return checkDescendants(childContainer);
    }

onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.pan.x) / this.zoom;
        const y = (e.clientY - rect.top - this.pan.y) / this.zoom;

        //    
        if (e.button === 1) {
            this.isPanning = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (this.currentTool === 'select') {
            // Container  (  )
            const containers = this.getContainersAtPoint(x, y);
            const container = containers[containers.length - 1]; //   Container
            
            if (container) {
                // /  
                const collapseBounds = container.getCollapseButtonBounds();
                if (x >= collapseBounds.x && x <= collapseBounds.x + collapseBounds.width &&
                    y >= collapseBounds.y && y <= collapseBounds.y + collapseBounds.height) {
                    container.toggleCollapse();
                    this.updateContainerChildren(container);
                    this.drawCache.needsRedraw = true;
                    this.draw();
                    this.announceContainerState(container);
                    return;
                }
                
                //    (Container  Select)
                const titleBounds = container.getTitleBarBounds();
                if (x >= titleBounds.x && x <= titleBounds.x + titleBounds.width &&
                    y >= titleBounds.y && y <= titleBounds.y + titleBounds.height) {
                    if (!e.ctrlKey && !e.metaKey) {
                        this.selectedNodes = [container];
                        this.selectedLinks = [];
                    } else if (!this.selectedNodes.includes(container)) {
                        this.selectedNodes.push(container);
                    }
                    
                    this.isDragging = true;
                    this.dragStart = { x, y };
                    this.prepareDragOffsets(x, y);
                    
                    this.drawCache.needsRedraw = true;
                    this.draw();
                    this.updatePropertiesPanel();
                    return;
                }
            }

            // Link Select 
            const link = this.getLinkAt(x, y);
            if (link) {
                if (!e.ctrlKey && !e.metaKey) {
                    this.selectedNodes = [];
                    this.selectedLinks = [link];
                } else if (!this.selectedLinks.includes(link)) {
                    this.selectedLinks.push(link);
                }
                this.drawCache.needsRedraw = true;
                this.draw();
                this.drawRulers();
                this.updatePropertiesPanel();
                return;
            }
            
            //    
            const handle = this.getHandleAt(x, y);
            if (handle) {
                this.isResizing = true;
                this.resizeHandle = handle;
                this.dragStart = { x, y };
                this.resizeOriginal = {
                    x: handle.node.x,
                    y: handle.node.y,
                    width: handle.node.width,
                    height: handle.node.height
                };
            } else {
                //  Select
                const node = this.getNodeAt(x, y);
                if (node) {
                    // Container   
                    const parentContainer = this.getContainerForNode(node);
                    if (parentContainer && !parentContainer.collapsed) {
                        // Container   Select
                        if (!e.ctrlKey && !e.metaKey) {
                            this.selectedNodes = [node];
                            this.selectedLinks = [];
                        } else if (!this.selectedNodes.includes(node)) {
                            this.selectedNodes.push(node);
                        }
                    } else if (!parentContainer) {
                        //   Select
                        this.handleNodeSelection(node, e);
                    }
                    
                    this.isDragging = true;
                    this.dragStart = { x, y };
                    this.prepareDragOffsets(x, y);
                } else {
                    // Select  
                    if (!e.ctrlKey && !e.metaKey) {
                        this.selectedNodes = [];
                        this.selectedLinks = [];
                    }
                    this.isDrawing = true;
                    this.dragStart = { x, y };
                    this.tempRect = { x, y, width: 0, height: 0 };
                }
            }

            // Line   
            if (this.selectedNodes.length === 1 && this.selectedNodes[0].type === 'line') {
                const lineHandle = this.getLineHandle(x, y);
                if (lineHandle) {
                    this.isEditingLine = true;
                    this.lineEditHandle = lineHandle;
                    this.dragStart = { x, y };
                    return;
                }
            }
        } else if (this.currentTool === 'rectangle' || this.currentTool === 'ellipse') {
            //   
            this.isDrawing = true;
            this.dragStart = { x, y };
            let startX = x, startY = y;
            
            // Snap to grid
            if (this.pageSettings.snapToGrid) {
                const gridSize = this.pageSettings.gridSize;
                startX = Math.round(x / gridSize) * gridSize;
                startY = Math.round(y / gridSize) * gridSize;
            }
            
            this.tempRect = { x: startX, y: startY, width: 0, height: 0 };
        } else if (this.currentTool === 'line') {
            // Line  
            this.isDrawing = true;
            this.dragStart = { x, y };
            let startX = x, startY = y;
            
            // Snap to grid
            if (this.pageSettings.snapToGrid) {
                const gridSize = this.pageSettings.gridSize;
                startX = Math.round(x / gridSize) * gridSize;
                startY = Math.round(y / gridSize) * gridSize;
            }
            
            this.tempLine = { x1: startX, y1: startY, x2: startX, y2: startY };
        } else if (this.currentTool === 'text') {
            // Text  
            const newNode = {
                id: this.nodeIdCounter++,
                type: 'text',
                x: x - 50,
                y: y - 20,
                width: 100,
                height: 40,
                fillColor: 'transparent',
                lineColor: '#cccccc',
                lineWidth: 1,
                text: 'Text',
                fontSize: 16,
                fontFamily: 'Arial',
                textColor: '#000000'
            };
            this.nodes.push(newNode);
            this.selectedNodes = [newNode];
            this.selectedLinks = [];
            this.saveState();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            
            // Text   
            setTimeout(() => {
                this.editTextNode(newNode);
            }, 100);
        } else if (this.currentTool === 'link') {
            // Link 
            const node = this.getNodeAt(x, y);
            if (node) {
                this.linkStart = node;
                this.isDrawing = true;
                this.dragStart = { x, y };
            }
        } else if (this.currentTool === 'container') {
            // Container 
            this.isDrawing = true;
            this.dragStart = { x, y };
            let startX = x, startY = y;
            
            if (this.pageSettings.snapToGrid) {
                const gridSize = this.pageSettings.gridSize;
                startX = Math.round(x / gridSize) * gridSize;
                startY = Math.round(y / gridSize) * gridSize;
            }
            
            this.tempRect = { x: startX, y: startY, width: 0, height: 0, type: 'container' };
        }

        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.updatePropertiesPanel();
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        const x = (this.mouseX - this.pan.x) / this.zoom;
        const y = (this.mouseY - this.pan.y) / this.zoom;

        //  position 
        document.getElementById('mousePos').textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;

        //  
        if (this.isPanning) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            this.pan.x += dx;
            this.pan.y += dy;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            return;
        }

        //   Container 
        if (this.isDragging && this.selectedNodes.length > 0) {
            this.updateDragTargetContainer(x, y);
        }

        if (this.isResizing && this.resizeHandle) {
            //  
            this.handleResize(x, y);
        } else if (this.isEditingLine && this.lineEditHandle) {
            // Line 
            this.handleLineEdit(x, y);
        } else if (this.isDragging && this.selectedNodes.length > 0) {
            //  
            this.handleNodeDrag(x, y);
        } else if (this.isDrawing && this.tempRect) {
            // Select    
            this.tempRect.width = x - this.tempRect.x;
            this.tempRect.height = y - this.tempRect.y;
            this.draw();
            this.drawRulers();
        } else if (this.isDrawing && this.tempLine) {
            // Line 
            let endX = x, endY = y;
            
            //  
            if (this.pageSettings.snapToGrid) {
                const gridSize = this.pageSettings.gridSize;
                endX = Math.round(x / gridSize) * gridSize;
                endY = Math.round(y / gridSize) * gridSize;
            }
            
            this.tempLine.x2 = endX;
            this.tempLine.y2 = endY;
            this.draw();
            this.drawRulers();
        } else if (this.isDrawing && this.linkStart) {
            // Link 
            this.draw();
            this.drawRulers();
        } else {
            //  
            this.updateCursor(x, y);
        }
    }

    onMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.pan.x) / this.zoom;
        const y = (e.clientY - rect.top - this.pan.y) / this.zoom;

        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = this.currentTool === 'select' ? 'default' : 'crosshair';
        }

        if (this.isDrawing && this.tempRect) {
            if (this.currentTool === 'select') {
                // Select   Select
                this.selectNodesInArea();
            } else if (this.currentTool === 'container') {
                // Container 
                this.createContainerFromRect();
            } else if (this.currentTool === 'rectangle' || this.currentTool === 'ellipse') {
                //  
                this.createShapeFromRect();
            }
        } else if (this.isDrawing && this.tempLine) {
            // Line 
            this.createLine();
        } else if (this.isDrawing && this.linkStart) {
            // Link 
            this.createLink(x, y);
        }

        if (this.isDragging && this.selectedNodes.length > 0) {
            //  
            this.handleDrop(x, y);
        }

        //  Tools  
        if (this.currentTool !== 'select' && this.currentTool !== 'link') {
            this.selectTool('select');
        }

        //  
        this.resetDragState();
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.updatePropertiesPanel();
    }

    onDblClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.pan.x) / this.zoom;
        const y = (e.clientY - rect.top - this.pan.y) / this.zoom;
        
        const node = this.getNodeAt(x, y);
        if (node && (node.type === 'text' || node.type === 'rectangle' || node.type === 'ellipse')) {
            this.editTextNode(node);
        } else if (node && node.type === 'container') {
            // Container    
            this.editContainerTitle(node);
        }
    }

    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + : 
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(Math.max(this.zoom * delta, 0.1), 5);
            
            //  position  
            const worldX = (x - this.pan.x) / this.zoom;
            const worldY = (y - this.pan.y) / this.zoom;
            
            this.zoom = newZoom;
            
            this.pan.x = x - worldX * this.zoom;
            this.pan.y = y - worldY * this.zoom;
            
            this.updateZoomLevel();
            this.drawCache.needsRedraw = true;
        } else {
            //  : 
            this.pan.x -= e.deltaX;
            this.pan.y -= e.deltaY;
            this.drawCache.needsRedraw = true;
        }
        
        this.draw();
        this.drawRulers();
    }

//  position  Container  (  )
    getContainersAtPoint(x, y) {
        return this.containers
            .filter(container => container.containsPoint(x, y))
            .sort((a, b) => a.depth - b.depth);
    }

    //   Container 
    getContainerForNode(node) {
        return this.containers.find(container => 
            container.hasChild(node.id)
        );
    }

    // Container /  Child node 
    updateContainerChildren(container) {
        const children = container.children
            .map(id => this.nodes.find(n => n.id === id))
            .filter(n => n);
        
        if (container.collapsed) {
            //   Child node  
            children.forEach(child => {
                child.hidden = true;
            });
        } else {
            //   Child node 
            children.forEach(child => {
                child.hidden = false;
                this.updateNodePositionInContainer(child, container);
            });
        }
    }

    // Container   ()
    announceContainerState(container) {
        const state = container.collapsed ? '' : '';
        const childCount = container.children.length;
        this.announce(`${container.title} Container, ${state}, ${childCount}  `);
    }

    //   Ready
    prepareDragOffsets(x, y) {
        this.dragOffsets = this.selectedNodes.map(n => ({
            node: n,
            offsetX: n.x - x,
            offsetY: n.y - y
        }));
    }

    //  Select 
    handleNodeSelection(node, event) {
        //    
        const group = this.groups.find(g => g.nodes.includes(node.id));
        
        if (group) {
            //     Select
            const groupNodes = group.nodes.map(id => this.nodes.find(n => n.id === id)).filter(n => n);
            
            if (!event.ctrlKey && !event.metaKey) {
                this.selectedNodes = [...groupNodes];
                this.selectedLinks = [];
            } else {
                // Ctrl+   /
                const isGroupSelected = groupNodes.every(n => this.selectedNodes.includes(n));
                if (isGroupSelected) {
                    //   
                    groupNodes.forEach(n => {
                        const index = this.selectedNodes.indexOf(n);
                        if (index > -1) this.selectedNodes.splice(index, 1);
                    });
                } else {
                    //   
                    groupNodes.forEach(n => {
                        if (!this.selectedNodes.includes(n)) {
                            this.selectedNodes.push(n);
                        }
                    });
                }
            }
        } else {
            //      Select
            if (!event.ctrlKey && !event.metaKey) {
                if (!this.selectedNodes.includes(node)) {
                    this.selectedNodes = [node];
                    this.selectedLinks = [];
                }
            } else if (!this.selectedNodes.includes(node)) {
                this.selectedNodes.push(node);
            } else {
                // Ctrl+ Select 
                const index = this.selectedNodes.indexOf(node);
                this.selectedNodes.splice(index, 1);
            }
        }
    }

    //    Container 
    updateDragTargetContainer(x, y) {
        //    
        if (this.dragTargetContainer) {
            this.dragTargetContainer.isDropTarget = false;
            this.dragTargetContainer = null;
        }
        
        // Select   Container   
        const draggingNonContainers = this.selectedNodes.filter(n => n.type !== 'container');
        if (draggingNonContainers.length === 0) return;
        
        //  position Container 
        const containers = this.getContainersAtPoint(x, y);
        for (let i = containers.length - 1; i >= 0; i--) {
            const container = containers[i];
            
            // Select     Container
            if (!this.selectedNodes.includes(container) && 
                !container.collapsed &&
                this.canDropIntoContainer(container, draggingNonContainers)) {
                container.isDropTarget = true;
                this.dragTargetContainer = container;
                break;
            }
        }
    }

    // Container   
    canDropIntoContainer(container, nodes) {
        // Container    
        if (container.collapsed) return false;
        
        //     
        return nodes.every(node => {
            //   Container  
            if (container.hasChild(node.id)) return false;
            
            // Container    
            if (node.type === 'container') {
                return this.canContainerContain(container, node);
            }
            
            return true;
        });
    }

    //   
    handleResize(x, y) {
        const dx = x - this.dragStart.x;
        const dy = y - this.dragStart.y;
        const node = this.resizeHandle.node;
        const handle = this.resizeHandle.position;

        let newX = this.resizeOriginal.x;
        let newY = this.resizeOriginal.y;
        let newWidth = this.resizeOriginal.width;
        let newHeight = this.resizeOriginal.height;

        switch (handle) {
            case 'nw':
                newX = this.resizeOriginal.x + dx;
                newY = this.resizeOriginal.y + dy;
                newWidth = this.resizeOriginal.width - dx;
                newHeight = this.resizeOriginal.height - dy;
                break;
            case 'n':
                newY = this.resizeOriginal.y + dy;
                newHeight = this.resizeOriginal.height - dy;
                break;
            case 'ne':
                newY = this.resizeOriginal.y + dy;
                newWidth = this.resizeOriginal.width + dx;
                newHeight = this.resizeOriginal.height - dy;
                break;
            case 'e':
                newWidth = this.resizeOriginal.width + dx;
                break;
            case 'se':
                newWidth = this.resizeOriginal.width + dx;
                newHeight = this.resizeOriginal.height + dy;
                break;
            case 's':
                newHeight = this.resizeOriginal.height + dy;
                break;
            case 'sw':
                newX = this.resizeOriginal.x + dx;
                newWidth = this.resizeOriginal.width - dx;
                newHeight = this.resizeOriginal.height + dy;
                break;
            case 'w':
                newX = this.resizeOriginal.x + dx;
                newWidth = this.resizeOriginal.width - dx;
                break;
        }

        //   
        const minWidth = node.type === 'container' ? node.minWidth : 20;
        const minHeight = node.type === 'container' ? node.minHeight : 20;
        
        if (newWidth < minWidth) {
            if (handle.includes('w')) {
                newX = this.resizeOriginal.x + this.resizeOriginal.width - minWidth;
            }
            newWidth = minWidth;
        }
        if (newHeight < minHeight) {
            if (handle.includes('n')) {
                newY = this.resizeOriginal.y + this.resizeOriginal.height - minHeight;
            }
            newHeight = minHeight;
        }

        //  
        if (this.pageSettings.snapToGrid) {
            const gridSize = this.pageSettings.gridSize;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
            newWidth = Math.round(newWidth / gridSize) * gridSize;
            newHeight = Math.round(newHeight / gridSize) * gridSize;
        }

        node.x = newX;
        node.y = newY;
        node.width = newWidth;
        node.height = newHeight;

        // Container  Child node 
        if (node.type === 'container') {
            this.handleContainerResize(node);
        }

        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
    }

    // Container   Child node 
    handleContainerResize(container) {
        const children = container.children
            .map(id => this.nodes.find(n => n.id === id))
            .filter(n => n);
        
        if (container.resizeChildren) {
            // Child node    
            const scaleX = container.width / this.resizeOriginal.width;
            const scaleY = container.height / this.resizeOriginal.height;
            
            children.forEach(child => {
                const originalBounds = container.childrenOriginalBounds.get(child.id);
                if (originalBounds) {
                    child.width = originalBounds.width * scaleX;
                    child.height = originalBounds.height * scaleY;
                    child.containerOffsetX = originalBounds.x * scaleX;
                    child.containerOffsetY = originalBounds.y * scaleY;
                }
            });
        }
        
        // Child node position    
        children.forEach(child => {
            container.constrainChildPosition(child);
            this.updateNodePositionInContainer(child, container);
        });
    }

    // Line  
    handleLineEdit(x, y) {
        const node = this.lineEditHandle.node;
        const dx = x - node.x;
        const dy = y - node.y;
        
        if (this.lineEditHandle.point === 'start') {
            node.lineData.x1 = dx;
            node.lineData.y1 = dy;
        } else {
            node.lineData.x2 = dx;
            node.lineData.y2 = dy;
        }
        
        //   
        const minX = Math.min(node.lineData.x1, node.lineData.x2);
        const minY = Math.min(node.lineData.y1, node.lineData.y2);
        const maxX = Math.max(node.lineData.x1, node.lineData.x2);
        const maxY = Math.max(node.lineData.y1, node.lineData.y2);
        
        node.x = node.x + minX;
        node.y = node.y + minY;
        node.width = maxX - minX || 1;
        node.height = maxY - minY || 1;
        node.lineData.x1 -= minX;
        node.lineData.y1 -= minY;
        node.lineData.x2 -= minX;
        node.lineData.y2 -= minY;
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
    }

    //   
    handleNodeDrag(x, y) {
        if (!this.dragOffsets) return;
        
        // Smart Guide 
        this.smartGuides.vertical = [];
        this.smartGuides.horizontal = [];
        this.smartGuides.active = false;
        
        //   Select    
        const primaryNode = this.dragOffsets[0].node;
        let baseX = x + this.dragOffsets[0].offsetX;
        let baseY = y + this.dragOffsets[0].offsetY;
        
        // Container   
        const parentContainer = this.getContainerForNode(primaryNode);
        if (parentContainer && !this.selectedNodes.includes(parentContainer)) {
            // Container   
            const contentBounds = parentContainer.getContentBounds();
            baseX = Math.max(contentBounds.x, 
                Math.min(baseX, contentBounds.x + contentBounds.width - primaryNode.width));
            baseY = Math.max(contentBounds.y, 
                Math.min(baseY, contentBounds.y + contentBounds.height - primaryNode.height));
        } else if (this.pageSettings.constrainToPage && !parentContainer) {
            //    (Container )
            baseX = Math.max(0, Math.min(baseX, this.pageSettings.width - primaryNode.width));
            baseY = Math.max(0, Math.min(baseY, this.pageSettings.height - primaryNode.height));
        }
        
        // Smart Guide Apply
        if (this.pageSettings.showSmartGuides && !this.pageSettings.snapToGrid) {
            const snapResult = this.calculateSmartGuides(primaryNode, baseX, baseY);
            if (snapResult.snapped) {
                baseX = snapResult.x;
                baseY = snapResult.y;
                this.smartGuides.active = true;
            }
        }
        
        //   Apply
        if (this.pageSettings.snapToGrid) {
            const gridSize = this.pageSettings.gridSize;
            baseX = Math.round(baseX / gridSize) * gridSize;
            baseY = Math.round(baseY / gridSize) * gridSize;
        }
        
        //  Select  
        const deltaX = baseX - this.dragOffsets[0].node.x;
        const deltaY = baseY - this.dragOffsets[0].node.y;
        
        this.dragOffsets.forEach(offset => {
            const node = offset.node;
            const newX = node.x + deltaX;
            const newY = node.y + deltaY;
            
            // Container 
            if (node.type === 'container') {
                node.x = newX;
                node.y = newY;
                // Child node  
                this.updateContainerChildrenPositions(node);
            } else {
                //  
                const nodeContainer = this.getContainerForNode(node);
                if (nodeContainer && !this.selectedNodes.includes(nodeContainer)) {
                    // Container  
                    const contentBounds = nodeContainer.getContentBounds();
                    node.containerOffsetX = newX - contentBounds.x;
                    node.containerOffsetY = newY - contentBounds.y;
                    nodeContainer.constrainChildPosition(node);
                    this.updateNodePositionInContainer(node, nodeContainer);
                } else {
                    //  
                    node.x = newX;
                    node.y = newY;
                }
            }
        });
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
    }

    // Container Child node position 
    updateContainerChildrenPositions(container) {
        const children = container.children
            .map(id => this.nodes.find(n => n.id === id))
            .filter(n => n);
        
        children.forEach(child => {
            this.updateNodePositionInContainer(child, container);
        });
    }

    //  position Container  
    updateNodePositionInContainer(node, container) {
        const contentBounds = container.getContentBounds();
        node.x = contentBounds.x + (node.containerOffsetX || 0);
        node.y = contentBounds.y + (node.containerOffsetY || 0);
    }

    //  
    updateCursor(x, y) {
        if (this.currentTool === 'select') {
            const handle = this.getHandleAt(x, y);
            if (handle) {
                //   
                const cursors = {
                    'nw': 'nw-resize',
                    'n': 'n-resize',
                    'ne': 'ne-resize',
                    'e': 'e-resize',
                    'se': 'se-resize',
                    's': 's-resize',
                    'sw': 'sw-resize',
                    'w': 'w-resize'
                };
                this.canvas.style.cursor = cursors[handle.position];
            } else {
                const node = this.getNodeAt(x, y);
                const link = this.getLinkAt(x, y);
                const container = this.getContainersAtPoint(x, y).pop();
                
                if (container) {
                    const collapseBounds = container.getCollapseButtonBounds();
                    if (x >= collapseBounds.x && x <= collapseBounds.x + collapseBounds.width &&
                        y >= collapseBounds.y && y <= collapseBounds.y + collapseBounds.height) {
                        this.canvas.style.cursor = 'pointer';
                    } else {
                        this.canvas.style.cursor = 'move';
                    }
                } else {
                    this.canvas.style.cursor = (node || link) ? 'move' : 'default';
                }
            }
        }
    }

    // Select   Select
    selectNodesInArea() {
        const selRect = this.normalizeRect(this.tempRect);
        const nodesToSelect = this.selectNodesInRect(selRect);
        
        nodesToSelect.forEach(node => {
            if (!this.selectedNodes.includes(node)) {
                this.selectedNodes.push(node);
            }
        });
        
        // Link Select
        this.links.forEach(link => {
            const linkBounds = this.getLinkBounds(link);
            if (this.rectIntersects(linkBounds, selRect)) {
                if (!this.selectedLinks.includes(link)) {
                    this.selectedLinks.push(link);
                }
            }
        });
    }

    //   
    resetDragState() {
        this.isEditingLine = false;
        this.lineEditHandle = null;
        this.isDrawing = false;
        this.isDragging = false;
        this.isResizing = false;
        this.tempRect = null;
        this.tempLine = null;
        this.linkStart = null;
        this.resizeHandle = null;
        this.dragOffsets = null;
        
        //   Container 
        if (this.dragTargetContainer) {
            this.dragTargetContainer.isDropTarget = false;
            this.dragTargetContainer = null;
        }
        
        // Smart Guide 
        this.smartGuides.active = false;
        this.smartGuides.vertical = [];
        this.smartGuides.horizontal = [];
    }

// Rectangle Container 
    createContainerFromRect() {
        const normalRect = this.normalizeRect(this.tempRect);
        if (normalRect.width > 50 && normalRect.height > 50) {
            const newContainer = new ContainerNode(
                this.containerIdCounter++,
                normalRect.x,
                normalRect.y,
                Math.max(normalRect.width, 150),
                Math.max(normalRect.height, 100)
            );
            
            //  position    
            const containedNodes = this.nodes.filter(node => 
                node.type !== 'container' &&
                this.rectContainsNode(normalRect, node)
            );
            
            containedNodes.forEach(node => {
                this.addNodeToContainer(node, newContainer);
            });
            
            this.containers.push(newContainer);
            this.nodes.push(newContainer);
            this.selectedNodes = [newContainer];
            this.selectedLinks = [];
            
            this.updateContainerHierarchy();
            this.saveState();
            this.updateStatus(` Container . contains ${containedNodes.length} nodes.`);
        }
    }

    // Rectangle  
    createShapeFromRect() {
        const normalRect = this.normalizeRect(this.tempRect);
        if (normalRect.width > 5 && normalRect.height > 5) {
            const newNode = {
                id: this.nodeIdCounter++,
                type: this.currentTool,
                x: normalRect.x,
                y: normalRect.y,
                width: normalRect.width,
                height: normalRect.height,
                fillColor: this.currentTool === 'rectangle' ? '#E3F2FD' : '#F3E5F5',
                lineColor: this.currentTool === 'rectangle' ? '#2196F3' : '#9C27B0',
                lineWidth: 2,
                text: ''
            };
            
            //  position Container 
            const targetContainer = this.getContainersAtPoint(
                normalRect.x + normalRect.width / 2,
                normalRect.y + normalRect.height / 2
            ).pop();
            
            this.nodes.push(newNode);
            
            if (targetContainer && !targetContainer.collapsed) {
                this.addNodeToContainer(newNode, targetContainer);
            }
            
            this.selectedNodes = [newNode];
            this.selectedLinks = [];
            this.saveState();
        }
    }

    // Line 
    createLine() {
        const line = {
            id: this.nodeIdCounter++,
            type: 'line',
            x1: this.tempLine.x1,
            y1: this.tempLine.y1,
            x2: this.tempLine.x2,
            y2: this.tempLine.y2,
            lineColor: '#FF5722',
            lineWidth: 2
        };
        
        // Line  
        const minX = Math.min(line.x1, line.x2);
        const minY = Math.min(line.y1, line.y2);
        const maxX = Math.max(line.x1, line.x2);
        const maxY = Math.max(line.y1, line.y2);
        
        const lineNode = {
            id: line.id,
            type: 'line',
            x: minX,
            y: minY,
            width: maxX - minX || 1,
            height: maxY - minY || 1,
            lineColor: line.lineColor,
            lineWidth: line.lineWidth,
            lineData: {
                x1: line.x1 - minX,
                y1: line.y1 - minY,
                x2: line.x2 - minX,
                y2: line.y2 - minY
            }
        };
        
        this.nodes.push(lineNode);
        this.selectedNodes = [lineNode];
        this.selectedLinks = [];
        this.saveState();
    }

    // Link 
    createLink(x, y) {
        const targetNode = this.getNodeAt(x, y);
        if (targetNode && targetNode !== this.linkStart) {
            const newLink = {
                id: this.linkIdCounter++,
                source: this.linkStart,
                target: targetNode,
                color: '#FF5722',
                width: 2,
                style: 'straight',
                arrowType: 'arrow'
            };
            this.links.push(newLink);
            this.saveState();
        }
    }

    //  
    handleDrop(x, y) {
        if (this.dragTargetContainer) {
            // Container 
            const droppedNodes = this.selectedNodes.filter(node => 
                node.type !== 'container' && 
                !this.dragTargetContainer.hasChild(node.id)
            );
            
            droppedNodes.forEach(node => {
                //  Container 
                const oldContainer = this.getContainerForNode(node);
                if (oldContainer) {
                    this.removeNodeFromContainer(node, oldContainer);
                }
                
                //  Container 
                this.addNodeToContainer(node, this.dragTargetContainer);
            });
            
            // Container   
            if (droppedNodes.length > 0) {
                this.dragTargetContainer.autoResize(this.nodes);
            }
            
            this.updateStatus(`${droppedNodes.length}  ${this.dragTargetContainer.title} .`);
        } else {
            // Container  
            this.selectedNodes.forEach(node => {
                if (node.type !== 'container') {
                    const container = this.getContainerForNode(node);
                    if (container) {
                        this.removeNodeFromContainer(node, container);
                    }
                }
            });
        }
        
        this.saveState();
    }

    //  Container 
    addNodeToContainer(node, container) {
        //   
        if (node.type === 'container' && !this.canContainerContain(container, node)) {
            this.updateStatus('Container    Container   .');
            return;
        }
        
        //  Container 
        const oldContainer = this.getContainerForNode(node);
        if (oldContainer) {
            oldContainer.removeChild(node.id);
        }
        
        //  Container 
        container.addChild(node.id);
        
        //  position Container   
        const relativePos = container.toRelativeCoords(node.x, node.y);
        node.containerOffsetX = relativePos.x;
        node.containerOffsetY = relativePos.y;
        
        //   
        container.constrainChildPosition(node);
        this.updateNodePositionInContainer(node, container);
        
        // Container    
        if (node.type === 'container') {
            this.updateContainerHierarchy();
        }
    }

    //  Container 
    removeNodeFromContainer(node, container) {
        container.removeChild(node.id);
        delete node.containerOffsetX;
        delete node.containerOffsetY;
        
        // Container    
        if (node.type === 'container') {
            this.updateContainerHierarchy();
        }
    }

    // Rectangle   
    rectContainsNode(rect, node) {
        return node.x >= rect.x && 
               node.y >= rect.y &&
               node.x + node.width <= rect.x + rect.width &&
               node.y + node.height <= rect.y + rect.height;
    }

    // Container  
    editContainerTitle(container) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = container.title;
        input.style.position = 'absolute';
        
        const rect = this.canvas.getBoundingClientRect();
        const titleBounds = container.getTitleBarBounds();
        const x = (titleBounds.x * this.zoom + this.pan.x) + rect.left;
        const y = (titleBounds.y * this.zoom + this.pan.y) + rect.top;
        
        input.style.left = (x + 10) + 'px';
        input.style.top = (y + 5) + 'px';
        input.style.width = ((titleBounds.width - 40) * this.zoom) + 'px';
        input.style.height = '20px';
        input.style.fontSize = '14px';
        input.style.fontWeight = 'bold';
        input.style.border = '2px solid #3498db';
        input.style.outline = 'none';
        input.style.backgroundColor = 'white';
        input.style.color = '#2c3e50';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            container.title = input.value || 'Container';
            document.body.removeChild(input);
            this.drawCache.needsRedraw = true;
            this.draw();
            this.saveState();
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
                this.drawCache.needsRedraw = true;
                this.draw();
            }
        });
    }

    // Select  Container 
    createContainerFromSelection() {
        if (this.selectedNodes.length > 0) {
            const bounds = this.getGroupBounds(this.selectedNodes);
            const container = new ContainerNode(
                this.containerIdCounter++,
                bounds.x - 20,
                bounds.y - 50,
                bounds.width + 40,
                bounds.height + 70
            );
            
            // Select  Container 
            const addedNodes = [];
            this.selectedNodes.forEach(node => {
                if (node.type !== 'container') {
                    this.addNodeToContainer(node, container);
                    addedNodes.push(node);
                }
            });
            
            this.containers.push(container);
            this.nodes.push(container);
            this.selectedNodes = [container];
            this.selectedLinks = [];
            
            this.updateContainerHierarchy();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.saveState();
            this.updatePropertiesPanel();
            this.updateStatus(` Container . ${addedNodes.length} nodes included.`);
            this.announce(`Container . ${addedNodes.length}  .`);
        }
    }

    // Container 
    dissolveContainer() {
        if (this.selectedNodes.length === 1 && this.selectedNodes[0].type === 'container') {
            const container = this.selectedNodes[0];
            const children = container.children.map(id => this.nodes.find(n => n.id === id)).filter(n => n);
            
            // Child node Container  
            children.forEach(child => {
                this.removeNodeFromContainer(child, container);
            });
            
            // Container 
            const containerIndex = this.containers.indexOf(container);
            if (containerIndex > -1) {
                this.containers.splice(containerIndex, 1);
            }
            
            const nodeIndex = this.nodes.indexOf(container);
            if (nodeIndex > -1) {
                this.nodes.splice(nodeIndex, 1);
            }
            
            // Child node Select
            this.selectedNodes = children;
            this.selectedLinks = [];
            
            this.updateContainerHierarchy();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.saveState();
            this.updatePropertiesPanel();
            this.updateStatus('Container .');
            this.announce('Container . ' + children.length + '  Select.');
        }
    }

    // Container Properties 
    updateContainerProperty(property, value) {
        if (this.selectedNodes.length === 1 && this.selectedNodes[0].type === 'container') {
            const container = this.selectedNodes[0];
            container[property] = value;
            
            if (property === 'layout') {
                container.arrangeChildren(this.nodes);
            }
            
            container.markDirty();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.saveState();
        }
    }

    // Container Auto arrange
    autoArrangeContainer() {
        if (this.selectedNodes.length === 1 && this.selectedNodes[0].type === 'container') {
            const container = this.selectedNodes[0];
            container.arrangeChildren(this.nodes);
            
            // Child node position 
            container.children.forEach(childId => {
                const child = this.nodes.find(n => n.id === childId);
                if (child) {
                    this.updateNodePositionInContainer(child, container);
                }
            });
            
            container.markDirty();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.saveState();
            this.updateStatus('Container  Auto arrange.');
        }
    }

//   
    onKeyDown(e) {
        //    
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.focusNextNode();
            return;
        } else if (e.key === 'Tab' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            this.focusPreviousNode();
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'k': // Ctrl+K:  Container 
                    e.preventDefault();
                    this.createContainerFromSelection();
                    break;
                case 'shift+k': // Ctrl+Shift+K: Container 
                    e.preventDefault();
                    this.dissolveContainer();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'c':
                    e.preventDefault();
                    this.copySelected();
                    break;
                case 'x':
                    e.preventDefault();
                    this.cutSelected();
                    break;
                case 'v':
                    e.preventDefault();
                    this.pasteSelected();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateSelected();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveDiagram();
                    break;
                case 'o':
                    e.preventDefault();
                    this.loadDiagram();
                    break;
                case 'g':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.ungroupSelected();
                    } else {
                        this.groupSelected();
                    }
                    break;
            }
        } else {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelected();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.cancelOperation();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.moveSelected(0, e.shiftKey ? -10 : -1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveSelected(0, e.shiftKey ? 10 : 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.moveSelected(e.shiftKey ? -10 : -1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.moveSelected(e.shiftKey ? 10 : 1, 0);
                    break;
                // Tools 
                case 'v':
                case 'V':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.selectTool('select');
                    }
                    break;
                case 'r':
                case 'R':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.selectTool('rectangle');
                    }
                    break;
                case 'e':
                case 'E':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.selectTool('ellipse');
                    }
                    break;
                case 'l':
                case 'L':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.selectTool('line');
                    }
                    break;
                case 't':
                case 'T':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.selectTool('text');
                    }
                    break;
                case 'k':
                case 'K':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        this.selectTool('container');
                    }
                    break;
            }
        }
    }

    //  
    draw() {
        if (!this.drawCache.needsRedraw && !this.isDrawing && !this.isDragging && !this.isResizing && !this.isEditingLine) {
            return;
        }
    
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        this.ctx.translate(this.pan.x / this.zoom, this.pan.y / this.zoom);
    
        //   
        const viewport = this.getViewport();
    
        if (this.pageSettings.showPageBounds) {
            this.drawPageBounds();
        }
    
        this.drawGrid();
        this.drawGroups();
    
        // Container  ( )
        const sortedContainers = [...this.containers].sort((a, b) => a.depth - b.depth);
        sortedContainers.forEach(container => {
            if (this.isNodeInViewport(container, viewport)) {
                this.drawContainer(container);
            }
        });

        // Link 
        this.links.forEach(link => {
            if (this.isLinkInViewport(link, viewport)) {
                this.drawLink(link);
            }
        });
    
        //   (Container  )
        this.nodes.forEach(node => {
            if (node.type !== 'container' && 
                !node.hidden && 
                this.isNodeInViewport(node, viewport)) {
                this.drawNode(node);
            }
        });

        // Select  
        this.selectedNodes.forEach(node => {
            this.drawSelectionHandles(node);
        });
    
        this.selectedLinks.forEach(link => {
            this.drawLinkSelection(link);
        });
    
        if (this.pageSettings.showSmartGuides && this.smartGuides.active) {
            this.drawSmartGuides();
        }
    
        //   
        if (this.tempRect) {
            this.drawTempRect();
        }
    
        if (this.tempLine) {
            this.drawTempLine();
        }
    
        if (this.isDrawing && this.linkStart) {
            this.drawTempLink();
        }
    
        this.ctx.restore();
        this.drawCache.needsRedraw = false;
    }

    // Container 
    drawContainer(container) {
        this.ctx.save();
        
        //   
        if (container.isDropTarget) {
            this.ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
            this.ctx.shadowBlur = 20;
        }
        
        // Container 
        this.ctx.fillStyle = container.fillColor;
        this.ctx.strokeStyle = container.lineColor;
        this.ctx.lineWidth = container.lineWidth;
        
        //  Rectangle
        this.ctx.fillRect(container.x, container.y, container.width, container.height);
        
        //  
        this.ctx.shadowBlur = 0;
        
        // 
        if (container.isDropTarget) {
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
        }
        
        this.ctx.strokeRect(container.x, container.y, container.width, container.height);
        this.ctx.setLineDash([]);
        
        //  
        const gradient = this.ctx.createLinearGradient(
            container.x, container.y,
            container.x, container.y + container.titleHeight
        );
        gradient.addColorStop(0, container.lineColor);
        gradient.addColorStop(1, this.adjustColor(container.lineColor, -20));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(container.x, container.y, container.width, container.titleHeight);
        
        //  Text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            container.title,
            container.x + 10,
            container.y + container.titleHeight / 2
        );
        
        // / 
        const collapseBounds = container.getCollapseButtonBounds();
        
        //  
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.beginPath();
        this.ctx.roundRect(
            collapseBounds.x,
            collapseBounds.y,
            collapseBounds.width,
            collapseBounds.height,
            3
        );
        this.ctx.fill();
        
        //  
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        if (container.collapsed) {
            // + 
            this.ctx.moveTo(collapseBounds.x + 4, collapseBounds.y + collapseBounds.height / 2);
            this.ctx.lineTo(collapseBounds.x + collapseBounds.width - 4, collapseBounds.y + collapseBounds.height / 2);
            this.ctx.moveTo(collapseBounds.x + collapseBounds.width / 2, collapseBounds.y + 4);
            this.ctx.lineTo(collapseBounds.x + collapseBounds.width / 2, collapseBounds.y + collapseBounds.height - 4);
        } else {
            // - 
            this.ctx.moveTo(collapseBounds.x + 4, collapseBounds.y + collapseBounds.height / 2);
            this.ctx.lineTo(collapseBounds.x + collapseBounds.width - 4, collapseBounds.y + collapseBounds.height / 2);
        }
        this.ctx.stroke();
        
        //     
        if (container.collapsed && container.children.length > 0) {
            this.ctx.fillStyle = container.lineColor;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `${container.children.length} `,
                container.x + container.width / 2,
                container.y + container.titleHeight + 20
            );
        }
        
        // Select    
        if (this.selectedNodes.includes(container)) {
            this.drawSelectionHandles(container);
        }
        
        this.ctx.restore();
    }

    //   
    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount));
        const b = Math.max(0, Math.min(255, (num & 255) + amount));
        return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    //  Rectangle 
    drawTempRect() {
        this.ctx.save();
        const r = this.normalizeRect(this.tempRect);
        
        if (this.currentTool === 'container') {
            // Container 
            this.ctx.fillStyle = 'rgba(248, 249, 250, 0.7)';
            this.ctx.strokeStyle = '#6c757d';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            this.ctx.fillRect(r.x, r.y, r.width, r.height);
            this.ctx.strokeRect(r.x, r.y, r.width, r.height);
            
            //   
            this.ctx.fillStyle = 'rgba(108, 117, 125, 0.7)';
            this.ctx.fillRect(r.x, r.y, r.width, 30);
        } else {
            // Select    
            const gradient = this.ctx.createLinearGradient(r.x, r.y, r.x + r.width, r.y + r.height);
            gradient.addColorStop(0, 'rgba(52, 152, 219, 0.05)');
            gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.1)');
            gradient.addColorStop(1, 'rgba(52, 152, 219, 0.05)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(r.x, r.y, r.width, r.height);
            
            const time = Date.now() / 1000;
            const dashOffset = (time * 50) % 20;
            
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([8, 4]);
            this.ctx.lineDashOffset = dashOffset;
            this.ctx.strokeRect(r.x, r.y, r.width, r.height);
        }
        
        //   
        if (r.width > 50 && r.height > 30) {
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.textAlign = 'center';
            this.ctx.setLineDash([]);
            
            const text = `${Math.round(r.width)} × ${Math.round(r.height)}`;
            const textX = r.x + r.width / 2;
            const textY = r.y + r.height + 20;
            
            // Text 
            const metrics = this.ctx.measureText(text);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(
                textX - metrics.width / 2 - 5,
                textY - 10,
                metrics.width + 10,
                20
            );
            
            this.ctx.fillStyle = '#2c3e50';
            this.ctx.fillText(text, textX, textY);
        }
        
        this.ctx.restore();
    }

    //  Line 
    drawTempLine() {
        this.ctx.save();
        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.tempLine.x1, this.tempLine.y1);
        this.ctx.lineTo(this.tempLine.x2, this.tempLine.y2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    //  Link 
    drawTempLink() {
        this.ctx.save();
        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        const startCenter = this.getNodeCenter(this.linkStart);
        const mouseX = (this.mouseX - this.pan.x) / this.zoom;
        const mouseY = (this.mouseY - this.pan.y) / this.zoom;
        this.ctx.moveTo(startCenter.x, startCenter.y);
        this.ctx.lineTo(mouseX, mouseY);
        this.ctx.stroke();
        this.ctx.restore();
    }

    //   
    getViewport() {
        const padding = 50;
        return {
            left: (-this.pan.x / this.zoom) - padding,
            top: (-this.pan.y / this.zoom) - padding,
            right: (this.canvas.width - this.pan.x) / this.zoom + padding,
            bottom: (this.canvas.height - this.pan.y) / this.zoom + padding
        };
    }
    
    isNodeInViewport(node, viewport) {
        return !(node.x + node.width < viewport.left ||
                 node.x > viewport.right ||
                 node.y + node.height < viewport.top ||
                 node.y > viewport.bottom);
    }
    
    isLinkInViewport(link, viewport) {
        const start = this.getNodeCenter(link.source);
        const end = this.getNodeCenter(link.target);
        
        const linkBounds = {
            left: Math.min(start.x, end.x),
            top: Math.min(start.y, end.y),
            right: Math.max(start.x, end.x),
            bottom: Math.max(start.y, end.y)
        };
        
        return !(linkBounds.right < viewport.left ||
                 linkBounds.left > viewport.right ||
                 linkBounds.bottom < viewport.top ||
                 linkBounds.top > viewport.bottom);
    }

    drawPageBounds() {
        this.ctx.save();
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(0, 0, this.pageSettings.width, this.pageSettings.height);
        this.ctx.restore();
    }

    drawGrid() {
        if (!this.pageSettings.showGrid) return;
        
        const gridSize = this.pageSettings.gridSize;
        
        this.ctx.save();
        this.ctx.strokeStyle = this.pageSettings.gridColor;
        this.ctx.lineWidth = 0.5;
        
        if (this.pageSettings.showPageBounds) {
            //    Show grid
            const viewLeft = Math.max(0, -this.pan.x / this.zoom - 100);
            const viewTop = Math.max(0, -this.pan.y / this.zoom - 100);
            const viewRight = Math.min(this.pageSettings.width, (this.canvas.width - this.pan.x) / this.zoom + 100);
            const viewBottom = Math.min(this.pageSettings.height, (this.canvas.height - this.pan.y) / this.zoom + 100);
            
            const startX = Math.floor(viewLeft / gridSize) * gridSize;
            const endX = Math.ceil(viewRight / gridSize) * gridSize;
            const startY = Math.floor(viewTop / gridSize) * gridSize;
            const endY = Math.ceil(viewBottom / gridSize) * gridSize;

            // Line
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, viewTop);
                this.ctx.lineTo(x, viewBottom);
                this.ctx.stroke();
            }

            // Line
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(viewLeft, y);
                this.ctx.lineTo(viewRight, y);
                this.ctx.stroke();
            }
        } else {
            // Show page bounds     Show grid
            const viewLeft = -this.pan.x / this.zoom - 1000;
            const viewTop = -this.pan.y / this.zoom - 1000;
            const viewRight = (this.canvas.width - this.pan.x) / this.zoom + 1000;
            const viewBottom = (this.canvas.height - this.pan.y) / this.zoom + 1000;
            
            const startX = Math.floor(viewLeft / gridSize) * gridSize;
            const endX = Math.ceil(viewRight / gridSize) * gridSize;
            const startY = Math.floor(viewTop / gridSize) * gridSize;
            const endY = Math.ceil(viewBottom / gridSize) * gridSize;

            // Line
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, viewTop);
                this.ctx.lineTo(x, viewBottom);
                this.ctx.stroke();
            }

            // Line
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(viewLeft, y);
                this.ctx.lineTo(viewRight, y);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawGroups() {
        this.ctx.save();
        this.ctx.strokeStyle = '#9E9E9E';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.fillStyle = 'rgba(158, 158, 158, 0.05)';
        
        this.groups.forEach(group => {
            const groupNodes = group.nodes.map(id => this.nodes.find(n => n.id === id)).filter(n => n);
            if (groupNodes.length > 0) {
                const bounds = this.getGroupBounds(groupNodes);
                const padding = 10;
                
                //  
                this.ctx.fillRect(
                    bounds.x - padding,
                    bounds.y - padding,
                    bounds.width + padding * 2,
                    bounds.height + padding * 2
                );
                
                //  
                this.ctx.strokeRect(
                    bounds.x - padding,
                    bounds.y - padding,
                    bounds.width + padding * 2,
                    bounds.height + padding * 2
                );
                
                //  
                this.ctx.save();
                this.ctx.font = '12px Arial';
                this.ctx.fillStyle = '#666';
                this.ctx.textAlign = 'left';
                this.ctx.setLineDash([]);
                this.ctx.fillText(`Group ${group.id}`, bounds.x - padding + 5, bounds.y - padding - 5);
                this.ctx.restore();
            }
        });
        
        this.ctx.restore();
    }

    //   
    getNodeAt(x, y) {
        //   (   Line)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (node.hidden) continue;
            
            if (node.type === 'line') {
                // Line  Line   
                const lineX1 = node.x + node.lineData.x1;
                const lineY1 = node.y + node.lineData.y1;
                const lineX2 = node.x + node.lineData.x2;
                const lineY2 = node.y + node.lineData.y2;
                
                const dist = this.pointToLineDistance(x, y, lineX1, lineY1, lineX2, lineY2);
                if (dist < 5) {
                    return node;
                }
            } else {
                if (x >= node.x && x <= node.x + node.width &&
                    y >= node.y && y <= node.y + node.height) {
                    return node;
                }
            }
        }
        return null;
    }

    //     ...
    drawNode(node) {
        //  drawNode  
        this.ctx.save();
        
        if (node.type === 'line') {
            this.ctx.strokeStyle = node.lineColor;
            this.ctx.lineWidth = node.lineWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(node.x + node.lineData.x1, node.y + node.lineData.y1);
            this.ctx.lineTo(node.x + node.lineData.x2, node.y + node.lineData.y2);
            this.ctx.stroke();
        } else if (node.type === 'text') {
            if (node.fillColor !== 'transparent') {
                this.ctx.fillStyle = node.fillColor;
                this.ctx.fillRect(node.x, node.y, node.width, node.height);
            }
            
            if (node.lineColor !== 'transparent') {
                this.ctx.strokeStyle = node.lineColor;
                this.ctx.lineWidth = node.lineWidth;
                this.ctx.strokeRect(node.x, node.y, node.width, node.height);
            }
            
            if (node.text) {
                this.ctx.fillStyle = node.textColor || '#000000';
                this.ctx.font = `${node.fontSize || 16}px ${node.fontFamily || 'Arial'}`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const maxWidth = node.width - 10;
                const lines = this.wrapText(this.ctx, node.text, maxWidth);
                const lineHeight = (node.fontSize || 16) * 1.2;
                const startY = node.y + node.height / 2 - (lines.length - 1) * lineHeight / 2;
                
                lines.forEach((line, index) => {
                    this.ctx.fillText(
                        line,
                        node.x + node.width / 2,
                        startY + index * lineHeight
                    );
                });
            }
        } else if (node.type === 'image') {
            if (node.image && node.image.complete) {
                this.ctx.drawImage(node.image, node.x, node.y, node.width, node.height);
            } else {
                this.ctx.fillStyle = '#f0f0f0';
                this.ctx.fillRect(node.x, node.y, node.width, node.height);
                this.ctx.strokeStyle = '#ccc';
                this.ctx.strokeRect(node.x, node.y, node.width, node.height);
                this.ctx.fillStyle = '#999';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('Loading...', node.x + node.width / 2, node.y + node.height / 2);
            }
            
            if (node.lineWidth > 0) {
                this.ctx.strokeStyle = node.lineColor;
                this.ctx.lineWidth = node.lineWidth;
                this.ctx.strokeRect(node.x, node.y, node.width, node.height);
            }
        } else {
            //  
            this.ctx.fillStyle = node.fillColor;
            this.ctx.strokeStyle = node.lineColor;
            this.ctx.lineWidth = node.lineWidth;
    
            //   
            if (node.subType === 'document') {
                //   (  )
                this.ctx.beginPath();
                this.ctx.moveTo(node.x, node.y);
                this.ctx.lineTo(node.x + node.width, node.y);
                this.ctx.lineTo(node.x + node.width, node.y + node.height * 0.8);
                this.ctx.quadraticCurveTo(
                    node.x + node.width * 0.75, node.y + node.height * 0.9,
                    node.x + node.width * 0.5, node.y + node.height * 0.8
                );
                this.ctx.quadraticCurveTo(
                    node.x + node.width * 0.25, node.y + node.height * 0.7,
                    node.x, node.y + node.height * 0.8
                );
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else if (node.subType === 'database') {
                //   (Circle)
                const ellipseHeight = node.height * 0.2;
                
                //  Circle
                this.ctx.beginPath();
                this.ctx.ellipse(
                    node.x + node.width / 2,
                    node.y + ellipseHeight / 2,
                    node.width / 2,
                    ellipseHeight / 2,
                    0, 0, 2 * Math.PI
                );
                this.ctx.fill();
                this.ctx.stroke();
                
                // 
                this.ctx.beginPath();
                this.ctx.moveTo(node.x, node.y + ellipseHeight / 2);
                this.ctx.lineTo(node.x, node.y + node.height - ellipseHeight / 2);
                this.ctx.ellipse(
                    node.x + node.width / 2,
                    node.y + node.height - ellipseHeight / 2,
                    node.width / 2,
                    ellipseHeight / 2,
                    0, Math.PI, 0
                );
                this.ctx.lineTo(node.x + node.width, node.y + ellipseHeight / 2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else if (node.subType === 'data') {
                //   ()
                const skew = node.width * 0.15;
                this.ctx.beginPath();
                this.ctx.moveTo(node.x + skew, node.y);
                this.ctx.lineTo(node.x + node.width, node.y);
                this.ctx.lineTo(node.x + node.width - skew, node.y + node.height);
                this.ctx.lineTo(node.x, node.y + node.height);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            } else if (node.type === 'rectangle') {
                this.ctx.fillRect(node.x, node.y, node.width, node.height);
                this.ctx.strokeRect(node.x, node.y, node.width, node.height);
            } else if (node.type === 'ellipse') {
                this.ctx.beginPath();
                this.ctx.ellipse(
                    node.x + node.width / 2,
                    node.y + node.height / 2,
                    node.width / 2,
                    node.height / 2,
                    0, 0, 2 * Math.PI
                );
                this.ctx.fill();
                this.ctx.stroke();
            } else if (node.type === 'diamond') {
                this.ctx.beginPath();
                this.ctx.moveTo(node.x + node.width / 2, node.y);
                this.ctx.lineTo(node.x + node.width, node.y + node.height / 2);
                this.ctx.lineTo(node.x + node.width / 2, node.y + node.height);
                this.ctx.lineTo(node.x, node.y + node.height / 2);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
    
            // Text 
            if (node.text) {
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const maxWidth = node.width - 10;
                const lines = this.wrapText(this.ctx, node.text, maxWidth);
                const lineHeight = 16 * 1.2;
                const startY = node.y + node.height / 2 - (lines.length - 1) * lineHeight / 2;
                
                lines.forEach((line, index) => {
                    this.ctx.fillText(
                        line,
                        node.x + node.width / 2,
                        startY + index * lineHeight
                    );
                });
            }
        }
    
        this.ctx.restore();
    }

    //   
    drawLink(link) {
        //   
        const start = this.getNodeCenter(link.source);
        const end = this.getNodeCenter(link.target);

        this.ctx.save();
        this.ctx.strokeStyle = link.color;
        this.ctx.lineWidth = link.width;

        if (link.style === 'curved') {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const cx = start.x + dx / 2;
            const cy = start.y + dy / 2 - Math.abs(dx) * 0.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.quadraticCurveTo(cx, cy, end.x, end.y);
            this.ctx.stroke();
            
            const t = 0.95;
            const x = 2 * (1 - t) * (cx - end.x) + end.x;
            const y = 2 * (1 - t) * (cy - end.y) + end.y;
            const angle = Math.atan2(end.y - y, end.x - x);
            this.drawArrow(end.x, end.y, angle, link.arrowType);
        } else if (link.style === 'orthogonal') {
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            
            const midX = (start.x + end.x) / 2;
            this.ctx.lineTo(midX, start.y);
            this.ctx.lineTo(midX, end.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            const angle = end.x > midX ? 0 : Math.PI;
            this.drawArrow(end.x, end.y, angle, link.arrowType);
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            this.drawArrow(end.x, end.y, angle, link.arrowType);
        }

        this.ctx.restore();
    }

    drawArrow(x, y, angle, type) {
        if (type === 'none') return;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        if (type === 'arrow') {
            const arrowSize = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-arrowSize, -arrowSize / 2);
            this.ctx.lineTo(-arrowSize, arrowSize / 2);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (type === 'circle') {
            this.ctx.beginPath();
            this.ctx.arc(-5, 0, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        } else if (type === 'diamond') {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(-8, -4);
            this.ctx.lineTo(-16, 0);
            this.ctx.lineTo(-8, 4);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    //  
    normalizeRect(rect) {
        return {
            x: rect.width < 0 ? rect.x + rect.width : rect.x,
            y: rect.height < 0 ? rect.y + rect.height : rect.y,
            width: Math.abs(rect.width),
            height: Math.abs(rect.height)
        };
    }

    getNodeCenter(node) {
        return {
            x: node.x + node.width / 2,
            y: node.y + node.height / 2
        };
    }

    getGroupBounds(nodes) {
        if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    //    ...
//  
    drawRulers() {
        if (!this.pageSettings.showRulers) return;
        
        //  
        const hWidth = this.canvas.width;
        const hHeight = 30;
        this.rulerH.width = hWidth;
        this.rulerH.height = hHeight;
        
        this.rulerHCtx.clearRect(0, 0, hWidth, hHeight);
        this.rulerHCtx.fillStyle = '#f8f8f8';
        this.rulerHCtx.fillRect(0, 0, hWidth, hHeight);
        
        this.rulerHCtx.strokeStyle = '#999';
        this.rulerHCtx.fillStyle = '#666';
        this.rulerHCtx.font = '10px Arial';
        this.rulerHCtx.textAlign = 'center';
        
        const startX = -this.pan.x / this.zoom;
        const endX = (hWidth - this.pan.x) / this.zoom;
        const step = this.getGridStep();
        
        //   
        for (let x = Math.floor(startX / step) * step; x <= endX; x += step) {
            const px = x * this.zoom + this.pan.x;
            if (px >= 0 && px <= hWidth) {
                this.rulerHCtx.beginPath();
                this.rulerHCtx.moveTo(px, hHeight - 5);
                this.rulerHCtx.lineTo(px, hHeight);
                this.rulerHCtx.stroke();
                
                if (x % (step * 5) === 0) {
                    this.rulerHCtx.fillText(x.toString(), px, hHeight - 10);
                }
            }
        }
        
        //  
        const vWidth = 30;
        const vHeight = this.canvas.height;
        this.rulerV.width = vWidth;
        this.rulerV.height = vHeight;
        
        this.rulerVCtx.clearRect(0, 0, vWidth, vHeight);
        this.rulerVCtx.fillStyle = '#f8f8f8';
        this.rulerVCtx.fillRect(0, 0, vWidth, vHeight);
        
        this.rulerVCtx.strokeStyle = '#999';
        this.rulerVCtx.fillStyle = '#666';
        this.rulerVCtx.font = '10px Arial';
        this.rulerVCtx.textAlign = 'center';
        
        const startY = -this.pan.y / this.zoom;
        const endY = (vHeight - this.pan.y) / this.zoom;
        
        //   
        for (let y = Math.floor(startY / step) * step; y <= endY; y += step) {
            const py = y * this.zoom + this.pan.y;
            if (py >= 0 && py <= vHeight) {
                this.rulerVCtx.save();
                this.rulerVCtx.translate(vWidth / 2, py);
                this.rulerVCtx.rotate(-Math.PI / 2);
                
                this.rulerVCtx.beginPath();
                this.rulerVCtx.moveTo(-5, 0);
                this.rulerVCtx.lineTo(0, 0);
                this.rulerVCtx.stroke();
                
                if (y % (step * 5) === 0) {
                    this.rulerVCtx.fillText(y.toString(), 0, -10);
                }
                
                this.rulerVCtx.restore();
            }
        }
        
        // Select  position 
        if (this.selectedNodes.length > 0) {
            this.drawNodePositionOnRulers();
        }
    }

    drawNodePositionOnRulers() {
        // Select   
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.selectedNodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + node.width);
            maxY = Math.max(maxY, node.y + node.height);
        });
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        //   
        this.rulerHCtx.save();
        this.rulerHCtx.fillStyle = '#e74c3c';
        this.rulerHCtx.strokeStyle = '#e74c3c';
        this.rulerHCtx.lineWidth = 2;
        
        //  
        const leftPx = minX * this.zoom + this.pan.x;
        if (leftPx >= 0 && leftPx <= this.canvas.width) {
            this.drawRulerMarker(this.rulerHCtx, leftPx, 30, 'vertical', Math.round(minX));
        }
        
        //  
        const centerPx = centerX * this.zoom + this.pan.x;
        if (centerPx >= 0 && centerPx <= this.canvas.width) {
            this.rulerHCtx.strokeStyle = '#3498db';
            this.rulerHCtx.fillStyle = '#3498db';
            this.drawRulerMarker(this.rulerHCtx, centerPx, 30, 'vertical', Math.round(centerX), true);
        }
        
        //  
        const rightPx = maxX * this.zoom + this.pan.x;
        if (rightPx >= 0 && rightPx <= this.canvas.width) {
            this.rulerHCtx.strokeStyle = '#e74c3c';
            this.rulerHCtx.fillStyle = '#e74c3c';
            this.drawRulerMarker(this.rulerHCtx, rightPx, 30, 'vertical', Math.round(maxX));
        }
        
        this.rulerHCtx.restore();
        
        //   
        this.rulerVCtx.save();
        this.rulerVCtx.fillStyle = '#e74c3c';
        this.rulerVCtx.strokeStyle = '#e74c3c';
        this.rulerVCtx.lineWidth = 2;
        
        //  
        const topPy = minY * this.zoom + this.pan.y;
        if (topPy >= 0 && topPy <= this.canvas.height) {
            this.drawRulerMarker(this.rulerVCtx, topPy, 30, 'horizontal', Math.round(minY));
        }
        
        //  
        const centerPy = centerY * this.zoom + this.pan.y;
        if (centerPy >= 0 && centerPy <= this.canvas.height) {
            this.rulerVCtx.strokeStyle = '#3498db';
            this.rulerVCtx.fillStyle = '#3498db';
            this.drawRulerMarker(this.rulerVCtx, centerPy, 30, 'horizontal', Math.round(centerY), true);
        }
        
        //  
        const bottomPy = maxY * this.zoom + this.pan.y;
        if (bottomPy >= 0 && bottomPy <= this.canvas.height) {
            this.rulerVCtx.strokeStyle = '#e74c3c';
            this.rulerVCtx.fillStyle = '#e74c3c';
            this.drawRulerMarker(this.rulerVCtx, bottomPy, 30, 'horizontal', Math.round(maxY));
        }
        
        this.rulerVCtx.restore();
    }

    drawRulerMarker(ctx, position, rulerSize, orientation, value, isCenter = false) {
        ctx.save();
        
        if (orientation === 'vertical') {
            //    (Line)
            ctx.beginPath();
            ctx.moveTo(position, 0);
            ctx.lineTo(position, rulerSize);
            ctx.stroke();
            
            //  
            ctx.beginPath();
            ctx.moveTo(position, 0);
            ctx.lineTo(position - 4, 8);
            ctx.lineTo(position + 4, 8);
            ctx.closePath();
            ctx.fill();
            
            //   
            const text = value.toString();
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = isCenter ? 'rgba(52, 152, 219, 0.9)' : 'rgba(231, 76, 60, 0.9)';
            ctx.fillRect(position - textWidth / 2 - 4, rulerSize - 20, textWidth + 8, 14);
            
            //  
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(text, position, rulerSize - 9);
        } else {
            //    (Line)
            ctx.translate(rulerSize / 2, position);
            ctx.rotate(-Math.PI / 2);
            
            ctx.beginPath();
            ctx.moveTo(0, -rulerSize / 2);
            ctx.lineTo(0, rulerSize / 2);
            ctx.stroke();
            
            //  
            ctx.beginPath();
            ctx.moveTo(0, -rulerSize / 2);
            ctx.lineTo(-4, -rulerSize / 2 + 8);
            ctx.lineTo(4, -rulerSize / 2 + 8);
            ctx.closePath();
            ctx.fill();
            
            //   
            const text = value.toString();
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = isCenter ? 'rgba(52, 152, 219, 0.9)' : 'rgba(231, 76, 60, 0.9)';
            ctx.fillRect(-textWidth / 2 - 4, rulerSize / 2 - 20, textWidth + 8, 14);
            
            //  
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(text, 0, rulerSize / 2 - 9);
        }
        
        ctx.restore();
    }

    getGridStep() {
        const baseGrid = this.pageSettings.gridSize;
        if (this.zoom < 0.5) return baseGrid * 5;
        if (this.zoom < 1) return baseGrid * 2;
        if (this.zoom > 2) return baseGrid / 2;
        return baseGrid;
    }

    //   
    resizeCanvas() {
        const container = document.querySelector('.canvas-wrapper');
        const rect = container.getBoundingClientRect();
        
        //     
        const rulerSize = this.pageSettings.showRulers ? 30 : 0;
        this.canvas.width = rect.width - rulerSize;
        this.canvas.height = rect.height - rulerSize;
        
        //    
        if (this.drawCache.offscreenCanvas) {
            this.drawCache.offscreenCanvas.width = this.canvas.width;
            this.drawCache.offscreenCanvas.height = this.canvas.height;
        }
        
        this.drawCache.needsRedraw = true;
        this.draw();
        if (this.pageSettings.showRulers) {
            this.drawRulers();
        }
    }

    // Select  
    drawSelectionHandles(node) {
        if (node.type === 'line') {
            // Line   
            const handleSize = 8;
            const handles = [
                { x: node.x + node.lineData.x1 - handleSize / 2, y: node.y + node.lineData.y1 - handleSize / 2 },
                { x: node.x + node.lineData.x2 - handleSize / 2, y: node.y + node.lineData.y2 - handleSize / 2 }
            ];
            
            this.ctx.save();
            handles.forEach((handle, index) => {
                //  
                this.ctx.beginPath();
                this.ctx.arc(handle.x + handleSize / 2, handle.y + handleSize / 2, handleSize / 2 + 2, 0, 2 * Math.PI);
                this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                //  Circle
                this.ctx.beginPath();
                this.ctx.arc(handle.x + handleSize / 2, handle.y + handleSize / 2, handleSize / 2, 0, 2 * Math.PI);
                this.ctx.fillStyle = '#fff';
                this.ctx.fill();
                this.ctx.strokeStyle = '#3498db';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            });
            this.ctx.restore();
            return;
        }
        
        //   
        const handleSize = 8;
        const handles = [
            { x: node.x - handleSize / 2, y: node.y - handleSize / 2, cursor: 'nw-resize' },
            { x: node.x + node.width / 2 - handleSize / 2, y: node.y - handleSize / 2, cursor: 'n-resize' },
            { x: node.x + node.width - handleSize / 2, y: node.y - handleSize / 2, cursor: 'ne-resize' },
            { x: node.x + node.width - handleSize / 2, y: node.y + node.height / 2 - handleSize / 2, cursor: 'e-resize' },
            { x: node.x + node.width - handleSize / 2, y: node.y + node.height - handleSize / 2, cursor: 'se-resize' },
            { x: node.x + node.width / 2 - handleSize / 2, y: node.y + node.height - handleSize / 2, cursor: 's-resize' },
            { x: node.x - handleSize / 2, y: node.y + node.height - handleSize / 2, cursor: 'sw-resize' },
            { x: node.x - handleSize / 2, y: node.y + node.height / 2 - handleSize / 2, cursor: 'w-resize' }
        ];
    
        this.ctx.save();
        
        // Select 
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(node.x - 2, node.y - 2, node.width + 4, node.height + 4);
        
        //  
        this.ctx.setLineDash([]);
        handles.forEach(handle => {
            // 
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 2;
            this.ctx.shadowOffsetX = 1;
            this.ctx.shadowOffsetY = 1;
            
            //  
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            
            //  
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#3498db';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
        });
    
        this.ctx.restore();
    }

    drawLinkSelection(link) {
        const start = this.getNodeCenter(link.source);
        const end = this.getNodeCenter(link.target);
        
        this.ctx.save();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = link.width + 4;
        this.ctx.globalAlpha = 0.3;
        
        if (link.style === 'curved') {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const cx = start.x + dx / 2;
            const cy = start.y + dy / 2 - Math.abs(dx) * 0.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.quadraticCurveTo(cx, cy, end.x, end.y);
            this.ctx.stroke();
        } else if (link.style === 'orthogonal') {
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            const midX = (start.x + end.x) / 2;
            this.ctx.lineTo(midX, start.y);
            this.ctx.lineTo(midX, end.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    // Smart Guide 
    drawSmartGuides() {
        this.ctx.save();
        this.ctx.strokeStyle = this.pageSettings.smartGuideColor;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);
        
        //   
        this.smartGuides.vertical.forEach(guide => {
            // Line  Line
            if (guide.isCenter) {
                this.ctx.setLineDash([5, 5]);
            } else {
                this.ctx.setLineDash([]);
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(guide.x, guide.y1);
            this.ctx.lineTo(guide.x, guide.y2);
            this.ctx.stroke();
            
            //     
            if (guide.spacing) {
                this.ctx.save();
                this.ctx.fillStyle = this.pageSettings.smartGuideColor;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(Math.round(guide.gap) + 'px', guide.x, (guide.y1 + guide.y2) / 2);
                this.ctx.restore();
            }
        });
        
        //   
        this.smartGuides.horizontal.forEach(guide => {
            // Line  Line
            if (guide.isCenter) {
                this.ctx.setLineDash([5, 5]);
            } else {
                this.ctx.setLineDash([]);
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(guide.x1, guide.y);
            this.ctx.lineTo(guide.x2, guide.y);
            this.ctx.stroke();
            
            //     
            if (guide.spacing) {
                this.ctx.save();
                this.ctx.fillStyle = this.pageSettings.smartGuideColor;
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(Math.round(guide.gap) + 'px', (guide.x1 + guide.x2) / 2, guide.y - 5);
                this.ctx.restore();
            }
        });
        
        this.ctx.restore();
    }

    // Smart Guide 
    calculateSmartGuides(movingNode, proposedX, proposedY) {
        const snapDistance = this.pageSettings.snapDistance;
        let snappedX = proposedX;
        let snappedY = proposedY;
        let hasSnapped = false;
        
        //   
        const verticalGuides = [];
        const horizontalGuides = [];
        
        //    
        if (this.pageSettings.showPageBounds) {
            //  //
            verticalGuides.push({ x: 0, y1: 0, y2: this.pageSettings.height });
            verticalGuides.push({ x: this.pageSettings.width, y1: 0, y2: this.pageSettings.height });
            verticalGuides.push({ x: this.pageSettings.width / 2, y1: 0, y2: this.pageSettings.height });
            
            //  //
            horizontalGuides.push({ y: 0, x1: 0, x2: this.pageSettings.width });
            horizontalGuides.push({ y: this.pageSettings.height, x1: 0, x2: this.pageSettings.width });
            horizontalGuides.push({ y: this.pageSettings.height / 2, x1: 0, x2: this.pageSettings.width });
        }
        
        //    
        this.nodes.forEach(node => {
            //   Select  
            if (node === movingNode || this.selectedNodes.includes(node)) return;
            
            //   (, , )
            verticalGuides.push({ 
                x: node.x, 
                y1: Math.min(node.y, proposedY), 
                y2: Math.max(node.y + node.height, proposedY + movingNode.height),
                sourceNode: node
            });
            
            if (this.pageSettings.showCenterGuides) {
                verticalGuides.push({ 
                    x: node.x + node.width / 2, 
                    y1: Math.min(node.y, proposedY), 
                    y2: Math.max(node.y + node.height, proposedY + movingNode.height),
                    sourceNode: node,
                    isCenter: true
                });
            }
            
            verticalGuides.push({ 
                x: node.x + node.width, 
                y1: Math.min(node.y, proposedY), 
                y2: Math.max(node.y + node.height, proposedY + movingNode.height),
                sourceNode: node
            });
            
            //   (, , )
            horizontalGuides.push({ 
                y: node.y, 
                x1: Math.min(node.x, proposedX), 
                x2: Math.max(node.x + node.width, proposedX + movingNode.width),
                sourceNode: node
            });
            
            if (this.pageSettings.showCenterGuides) {
                horizontalGuides.push({ 
                    y: node.y + node.height / 2, 
                    x1: Math.min(node.x, proposedX), 
                    x2: Math.max(node.x + node.width, proposedX + movingNode.width),
                    sourceNode: node,
                    isCenter: true
                });
            }
            
            horizontalGuides.push({ 
                y: node.y + node.height, 
                x1: Math.min(node.x, proposedX), 
                x2: Math.max(node.x + node.width, proposedX + movingNode.width),
                sourceNode: node
            });
        });
        
        //     
        const movingPoints = [
            { x: proposedX, y: proposedY, type: 'left-top' },
            { x: proposedX + movingNode.width / 2, y: proposedY + movingNode.height / 2, type: 'center' },
            { x: proposedX + movingNode.width, y: proposedY + movingNode.height, type: 'right-bottom' },
            { x: proposedX + movingNode.width, y: proposedY, type: 'right-top' },
            { x: proposedX, y: proposedY + movingNode.height, type: 'left-bottom' }
        ];
        
        //   
        let minVerticalDistance = snapDistance;
        let snapVertical = null;
        
        movingPoints.forEach(point => {
            verticalGuides.forEach(guide => {
                const distance = Math.abs(point.x - guide.x);
                if (distance < minVerticalDistance) {
                    minVerticalDistance = distance;
                    snapVertical = {
                        guide: guide,
                        offset: guide.x - point.x,
                        type: point.type
                    };
                }
            });
        });
        
        if (snapVertical) {
            snappedX = proposedX + snapVertical.offset;
            this.smartGuides.vertical = [snapVertical.guide];
            hasSnapped = true;
        }
        
        //   
        let minHorizontalDistance = snapDistance;
        let snapHorizontal = null;
        
        movingPoints.forEach(point => {
            horizontalGuides.forEach(guide => {
                const distance = Math.abs(point.y - guide.y);
                if (distance < minHorizontalDistance) {
                    minHorizontalDistance = distance;
                    snapHorizontal = {
                        guide: guide,
                        offset: guide.y - point.y,
                        type: point.type
                    };
                }
            });
        });
        
        if (snapHorizontal) {
            snappedY = proposedY + snapHorizontal.offset;
            this.smartGuides.horizontal = [snapHorizontal.guide];
            hasSnapped = true;
        }
        
        return {
            x: snappedX,
            y: snappedY,
            snapped: hasSnapped
        };
    }

    //   
    getHandleAt(x, y) {
        if (this.selectedNodes.length !== 1) return null;
        
        const node = this.selectedNodes[0];
        if (node.type === 'line') return null;
        
        const handleSize = 8;
        const handles = [
            { x: node.x - handleSize / 2, y: node.y - handleSize / 2, position: 'nw' },
            { x: node.x + node.width / 2 - handleSize / 2, y: node.y - handleSize / 2, position: 'n' },
            { x: node.x + node.width - handleSize / 2, y: node.y - handleSize / 2, position: 'ne' },
            { x: node.x + node.width - handleSize / 2, y: node.y + node.height / 2 - handleSize / 2, position: 'e' },
            { x: node.x + node.width - handleSize / 2, y: node.y + node.height - handleSize / 2, position: 'se' },
            { x: node.x + node.width / 2 - handleSize / 2, y: node.y + node.height - handleSize / 2, position: 's' },
            { x: node.x - handleSize / 2, y: node.y + node.height - handleSize / 2, position: 'sw' },
            { x: node.x - handleSize / 2, y: node.y + node.height / 2 - handleSize / 2, position: 'w' }
        ];

        for (const handle of handles) {
            if (x >= handle.x && x <= handle.x + handleSize &&
                y >= handle.y && y <= handle.y + handleSize) {
                return { node, position: handle.position };
            }
        }

        return null;
    }

    getLineHandle(x, y) {
        if (this.selectedNodes.length !== 1 || this.selectedNodes[0].type !== 'line') {
            return null;
        }
        
        const node = this.selectedNodes[0];
        const handleSize = 8;
        
        const handles = [
            {
                x: node.x + node.lineData.x1 - handleSize / 2,
                y: node.y + node.lineData.y1 - handleSize / 2,
                point: 'start'
            },
            {
                x: node.x + node.lineData.x2 - handleSize / 2,
                y: node.y + node.lineData.y2 - handleSize / 2,
                point: 'end'
            }
        ];
        
        for (const handle of handles) {
            if (x >= handle.x && x <= handle.x + handleSize &&
                y >= handle.y && y <= handle.y + handleSize) {
                return { node, point: handle.point };
            }
        }
        
        return null;
    }

    getLinkAt(x, y) {
        //  
        for (let i = this.links.length - 1; i >= 0; i--) {
            const link = this.links[i];
            const start = this.getNodeCenter(link.source);
            const end = this.getNodeCenter(link.target);
            
            let dist;
            if (link.style === 'curved') {
                // Line   
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const cx = start.x + dx / 2;
                const cy = start.y + dy / 2 - Math.abs(dx) * 0.2;
                
                // 3  
                const dist1 = this.pointToLineDistance(x, y, start.x, start.y, cx, cy);
                const dist2 = this.pointToLineDistance(x, y, cx, cy, end.x, end.y);
                dist = Math.min(dist1, dist2);
            } else if (link.style === 'orthogonal') {
                const midX = (start.x + end.x) / 2;
                const dist1 = this.pointToLineDistance(x, y, start.x, start.y, midX, start.y);
                const dist2 = this.pointToLineDistance(x, y, midX, start.y, midX, end.y);
                const dist3 = this.pointToLineDistance(x, y, midX, end.y, end.x, end.y);
                dist = Math.min(dist1, dist2, dist3);
            } else {
                dist = this.pointToLineDistance(x, y, start.x, start.y, end.x, end.y);
            }
            
            if (dist < 5) {
                return link;
            }
        }
        return null;
    }

    getLinkBounds(link) {
        const start = this.getNodeCenter(link.source);
        const end = this.getNodeCenter(link.target);
        
        return {
            x: Math.min(start.x, end.x) - 5,
            y: Math.min(start.y, end.y) - 5,
            width: Math.abs(end.x - start.x) + 10,
            height: Math.abs(end.y - start.y) + 10
        };
    }

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    rectIntersects(node, rect) {
        return !(node.x + node.width < rect.x || 
                rect.x + rect.width < node.x || 
                node.y + node.height < rect.y || 
                rect.y + rect.height < node.y);
    }

    selectNodesInRect(rect) {
        const selectedNodeIds = new Set();
        
        this.nodes.forEach(node => {
            if (this.rectIntersects(node, rect)) {
                selectedNodeIds.add(node.id);
                
                //      Select
                const group = this.groups.find(g => g.nodes.includes(node.id));
                if (group) {
                    group.nodes.forEach(id => selectedNodeIds.add(id));
                }
            }
        });
        
        return Array.from(selectedNodeIds).map(id => this.nodes.find(n => n.id === id)).filter(n => n);
    }

//  Save/Circle (Undo/Redo)
    saveState() {
        const state = {
            nodes: JSON.parse(JSON.stringify(this.nodes)),
            links: this.links.map(link => ({
                id: link.id,
                sourceId: link.source.id,
                targetId: link.target.id,
                color: link.color,
                width: link.width,
                style: link.style,
                arrowType: link.arrowType
            })),
            groups: JSON.parse(JSON.stringify(this.groups)),
            containers: this.containers.map(c => c.serialize())
        };
        
        //  position   
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        //   
        this.history.push(state);
        this.historyIndex++;
        
        //   
        const maxHistory = 50;
        if (this.history.length > maxHistory) {
            this.history = this.history.slice(-maxHistory);
            this.historyIndex = this.history.length - 1;
        }
        
        this.pasteCount = 0;
        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.updateStatus('Undo.');
            this.updateHistoryButtons();
        } else {
            this.updateStatus('  Undo  .');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.updateStatus('Redo.');
            this.updateHistoryButtons();
        } else {
            this.updateStatus('  Redo  .');
        }
    }

    restoreState(state) {
        //  Circle
        this.nodes = JSON.parse(JSON.stringify(state.nodes));
        
        // Image   Image  
        this.nodes.forEach(node => {
            if (node.type === 'image' && node.imageData) {
                const img = new Image();
                img.onload = () => {
                    node.image = img;
                    this.drawCache.needsRedraw = true;
                    this.draw();
                    this.drawRulers();
                };
                img.src = node.imageData;
            }
        });
        
        // Container Circle
        this.containers = state.containers.map(data => ContainerNode.deserialize(data));
        
        // Container nodes  
        this.containers.forEach(container => {
            const existingIndex = this.nodes.findIndex(n => n.id === container.id && n.type === 'container');
            if (existingIndex === -1) {
                this.nodes.push(container);
            } else {
                this.nodes[existingIndex] = container;
            }
        });
        
        // Link Circle ( )
        this.links = state.links.map(linkData => {
            const source = this.nodes.find(n => n.id === linkData.sourceId);
            const target = this.nodes.find(n => n.id === linkData.targetId);
            
            if (source && target) {
                return {
                    id: linkData.id,
                    source: source,
                    target: target,
                    color: linkData.color,
                    width: linkData.width,
                    style: linkData.style,
                    arrowType: linkData.arrowType
                };
            }
            return null;
        }).filter(link => link !== null);
        
        //  Circle
        this.groups = JSON.parse(JSON.stringify(state.groups));
        
        // Select 
        this.selectedNodes = [];
        this.selectedLinks = [];
        
        this.updateContainerHierarchy();
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.updatePropertiesPanel();
    }

    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    // Copy/Paste
    copySelected() {
        if (this.selectedNodes.length > 0 || this.selectedLinks.length > 0) {
            this.clipboard = this.selectedNodes.map(node => {
                const nodeCopy = { ...node };
                
                if (node.type === 'container') {
                    // Container Child node  Copy
                    nodeCopy.childrenData = node.children.map(childId => {
                        const child = this.nodes.find(n => n.id === childId);
                        if (child && !this.selectedNodes.includes(child)) {
                            return { ...child };
                        }
                        return null;
                    }).filter(Boolean);
                }
                
                return nodeCopy;
            });
            
            this.clipboardLinks = this.selectedLinks.map(link => ({
                ...link,
                sourceId: link.source.id,
                targetId: link.target.id
            }));
            
            this.updateStatus(`${this.selectedNodes.length} , ${this.selectedLinks.length} Link Copy.`);
        }
    }

    cutSelected() {
        this.copySelected();
        this.deleteSelected();
    }

    pasteSelected() {
        if (this.clipboard && this.clipboard.length > 0) {
            this.selectedNodes = [];
            this.selectedLinks = [];
            const pasteOffset = 20 * (this.pasteCount + 1);
            const idMap = new Map();
            const containerMap = new Map();
            
            //     (Container )
            this.clipboard.forEach(nodeData => {
                const oldId = nodeData.id;
                
                if (nodeData.type === 'container') {
                    const newContainer = new ContainerNode(
                        this.containerIdCounter++,
                        nodeData.x + pasteOffset,
                        nodeData.y + pasteOffset,
                        nodeData.width,
                        nodeData.height
                    );
                    
                    // Properties Copy
                    Object.assign(newContainer, {
                        fillColor: nodeData.fillColor,
                        lineColor: nodeData.lineColor,
                        lineWidth: nodeData.lineWidth,
                        title: nodeData.title,
                        collapsed: nodeData.collapsed,
                        padding: nodeData.padding,
                        layout: nodeData.layout
                    });
                    
                    this.containers.push(newContainer);
                    this.nodes.push(newContainer);
                    this.selectedNodes.push(newContainer);
                    idMap.set(oldId, newContainer.id);
                    containerMap.set(oldId, newContainer);
                    
                    // Child node 
                    if (nodeData.childrenData) {
                        nodeData.childrenData.forEach(childData => {
                            const childNode = {
                                ...childData,
                                id: this.nodeIdCounter++,
                                x: childData.x + pasteOffset,
                                y: childData.y + pasteOffset
                            };
                            
                            this.nodes.push(childNode);
                            idMap.set(childData.id, childNode.id);
                            
                            // Container 
                            this.addNodeToContainer(childNode, newContainer);
                        });
                    }
                } else {
                    //  
                    const newNode = {
                        ...nodeData,
                        id: this.nodeIdCounter++,
                        x: nodeData.x + pasteOffset,
                        y: nodeData.y + pasteOffset
                    };
                    
                    if (newNode.type === 'image' && newNode.imageData) {
                        const img = new Image();
                        img.onload = () => {
                            newNode.image = img;
                            this.drawCache.needsRedraw = true;
                            this.draw();
                            this.drawRulers();
                        };
                        img.src = newNode.imageData;
                    }
                    
                    idMap.set(oldId, newNode.id);
                    this.nodes.push(newNode);
                    this.selectedNodes.push(newNode);
                }
            });
            
            // Link Paste
            if (this.clipboardLinks) {
                this.clipboardLinks.forEach(linkData => {
                    const sourceId = idMap.get(linkData.sourceId);
                    const targetId = idMap.get(linkData.targetId);
                    
                    if (sourceId !== undefined && targetId !== undefined) {
                        const source = this.nodes.find(n => n.id === sourceId);
                        const target = this.nodes.find(n => n.id === targetId);
                        
                        if (source && target) {
                            const newLink = {
                                id: this.linkIdCounter++,
                                source: source,
                                target: target,
                                color: linkData.color,
                                width: linkData.width,
                                style: linkData.style,
                                arrowType: linkData.arrowType
                            };
                            this.links.push(newLink);
                            this.selectedLinks.push(newLink);
                        }
                    }
                });
            }
            
            this.pasteCount++;
            this.updateContainerHierarchy();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.saveState();
            this.updatePropertiesPanel();
            this.updateStatus(`${this.selectedNodes.length} , ${this.selectedLinks.length} Link Paste.`);
        }
    }

    duplicateSelected() {
        if (this.selectedNodes.length > 0) {
            this.copySelected();
            this.pasteSelected();
        }
    }

    // Delete
    deleteSelected() {
        if (this.selectedNodes.length > 0 || this.selectedLinks.length > 0) {
            const deleteNodeCount = this.selectedNodes.length;
            const deleteLinkCount = this.selectedLinks.length;
            
            // Select  Delete
            this.selectedNodes.forEach(node => {
                // Container 
                if (node.type === 'container') {
                    const index = this.containers.indexOf(node);
                    if (index > -1) {
                        this.containers.splice(index, 1);
                    }
                }
                
                //  
                const nodeIndex = this.nodes.indexOf(node);
                if (nodeIndex > -1) {
                    this.nodes.splice(nodeIndex, 1);
                }
                
                //  Link Delete
                this.links = this.links.filter(link => 
                    link.source !== node && link.target !== node
                );
                
                //  
                this.groups.forEach(group => {
                    const idx = group.nodes.indexOf(node.id);
                    if (idx > -1) {
                        group.nodes.splice(idx, 1);
                    }
                });
                
                // Container 
                this.containers.forEach(container => {
                    container.removeChild(node.id);
                });
            });
            
            //   
            this.groups = this.groups.filter(group => group.nodes.length > 0);
            
            // Select Link Delete
            this.selectedLinks.forEach(link => {
                const index = this.links.indexOf(link);
                if (index > -1) {
                    this.links.splice(index, 1);
                }
            });
            
            this.selectedNodes = [];
            this.selectedLinks = [];
            this.updateContainerHierarchy();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.saveState();
            this.updatePropertiesPanel();
            this.updateStatus(`${deleteNodeCount} , ${deleteLinkCount} Link Delete.`);
        }
    }

    //  Select
    selectAll() {
        this.selectedNodes = [...this.nodes];
        this.selectedLinks = [...this.links];
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.updatePropertiesPanel();
        this.updateStatus(`${this.nodes.length} , ${this.links.length} Link  Select.`);
    }

    // Properties  
    updatePropertiesPanel() {
        const content = document.getElementById('propertiesContent');
        
        if (this.selectedNodes.length === 0 && this.selectedLinks.length === 0) {
            content.innerHTML = '<p style="color: #999; text-align: center; margin-top: 20px;"> Select Properties .</p>';
            return;
        }

        if (this.selectedNodes.length === 1 && this.selectedNodes[0].type === 'container') {
            const container = this.selectedNodes[0];
            content.innerHTML = `
                <div class="property-group">
                    <label>:</label>
                    <input type="text" value="${container.title}" onchange="editor.updateContainerProperty('title', this.value)">
                </div>
                <div class="property-group">
                    <label>Background color:</label>
                    <input type="color" class="color-input" value="${container.fillColor}" onchange="editor.updateContainerProperty('fillColor', this.value)">
                </div>
                <div class="property-group">
                    <label>Border color:</label>
                    <input type="color" class="color-input" value="${container.lineColor}" onchange="editor.updateContainerProperty('lineColor', this.value)">
                </div>
                <div class="property-group">
                    <label>:</label>
                    <select onchange="editor.updateContainerProperty('layout', this.value)">
                        <option value="free" ${container.layout === 'free' ? 'selected' : ''}> </option>
                        <option value="grid" ${container.layout === 'grid' ? 'selected' : ''}></option>
                        <option value="flow" ${container.layout === 'flow' ? 'selected' : ''}></option>
                        <option value="vertical" ${container.layout === 'vertical' ? 'selected' : ''}></option>
                        <option value="horizontal" ${container.layout === 'horizontal' ? 'selected' : ''}></option>
                    </select>
                </div>
                <div class="property-group">
                    <label>:</label>
                    <input type="number" value="${container.padding}" min="0" max="50" 
                           onchange="editor.updateContainerProperty('padding', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>    :</label>
                    <input type="checkbox" ${container.resizeChildren ? 'checked' : ''} 
                           onchange="editor.updateContainerProperty('resizeChildren', this.checked)">
                </div>
                <div class="property-group">
                    <label> :</label>
                    <p>${container.children.length}</p>
                </div>
                <div class="property-group">
                    <button class="btn btn-secondary" style="width: 100%" onclick="editor.autoArrangeContainer()">
                        Auto arrange
                    </button>
                </div>
            `;
            return;
        }

        if (this.selectedLinks.length === 1 && this.selectedNodes.length === 0) {
            const link = this.selectedLinks[0];
            content.innerHTML = `
                <div class="property-group">
                    <label>Link :</label>
                    <input type="color" class="color-input" value="${link.color}" onchange="editor.updateLinkProperty('color', this.value)">
                </div>
                <div class="property-group">
                    <label>Link :</label>
                    <input type="number" min="1" max="10" value="${link.width}" onchange="editor.updateLinkProperty('width', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>Link :</label>
                    <select onchange="editor.updateLinkProperty('style', this.value)">
                        <option value="straight" ${link.style === 'straight' ? 'selected' : ''}>Line</option>
                        <option value="curved" ${link.style === 'curved' ? 'selected' : ''}>Line</option>
                        <option value="orthogonal" ${link.style === 'orthogonal' ? 'selected' : ''}>Orthogonal</option>
                    </select>
                </div>
                <div class="property-group">
                    <label>Arrow style:</label>
                    <select onchange="editor.updateLinkProperty('arrowType', this.value)">
                        <option value="arrow" ${link.arrowType === 'arrow' ? 'selected' : ''}>Arrow</option>
                        <option value="none" ${link.arrowType === 'none' ? 'selected' : ''}>None</option>
                        <option value="circle" ${link.arrowType === 'circle' ? 'selected' : ''}>Circle</option>
                        <option value="diamond" ${link.arrowType === 'diamond' ? 'selected' : ''}>Diamond</option>
                    </select>
                </div>
            `;
        } else if (this.selectedNodes.length === 1) {
            const node = this.selectedNodes[0];
            content.innerHTML = `
                <div class="property-group">
                    <label>Text:</label>
                    <input type="text" value="${node.text || ''}" onchange="editor.updateNodeProperty('text', this.value)">
                </div>
                <div class="property-group">
                    <label>X position:</label>
                    <input type="number" value="${Math.round(node.x)}" onchange="editor.updateNodeProperty('x', parseFloat(this.value))">
                </div>
                <div class="property-group">
                    <label>Y position:</label>
                    <input type="number" value="${Math.round(node.y)}" onchange="editor.updateNodeProperty('y', parseFloat(this.value))">
                </div>
                <div class="property-group">
                    <label>Width:</label>
                    <input type="number" value="${Math.round(node.width)}" onchange="editor.updateNodeProperty('width', parseFloat(this.value))">
                </div>
                <div class="property-group">
                    <label>Height:</label>
                    <input type="number" value="${Math.round(node.height)}" onchange="editor.updateNodeProperty('height', parseFloat(this.value))">
                </div>
                ${node.type !== 'line' && node.type !== 'image' ? `
                <div class="property-group">
                    <label>Background color:</label>
                    <input type="color" class="color-input" value="${node.fillColor === 'transparent' ? '#ffffff' : node.fillColor}" onchange="editor.updateNodeProperty('fillColor', this.value)">
                </div>
                ` : ''}
                ${node.type !== 'image' ? `
                <div class="property-group">
                    <label>${node.type === 'line' ? 'Line ' : 'Border color'}:</label>
                    <input type="color" class="color-input" value="${node.lineColor === 'transparent' ? '#000000' : node.lineColor}" onchange="editor.updateNodeProperty('lineColor', this.value)">
                </div>
                <div class="property-group">
                    <label>${node.type === 'line' ? 'Line ' : 'Border width'}:</label>
                    <input type="number" min="0" max="10" value="${node.lineWidth}" onchange="editor.updateNodeProperty('lineWidth', parseInt(this.value))">
                </div>
                ` : ''}
                ${node.type === 'text' ? `
                <div class="property-group">
                    <label> :</label>
                    <input type="number" min="8" max="72" value="${node.fontSize || 16}" onchange="editor.updateNodeProperty('fontSize', parseInt(this.value))">
                </div>
                <div class="property-group">
                    <label>:</label>
                    <input type="color" class="color-input" value="${node.textColor || '#000000'}" onchange="editor.updateNodeProperty('textColor', this.value)">
                </div>
                ` : ''}
            `;
        } else {
            const nodeCount = this.selectedNodes.length;
            const linkCount = this.selectedLinks.length;
            content.innerHTML = `<p style="color: #666; text-align: center; margin-top: 20px;">${nodeCount} , ${linkCount} Link Select.</p>`;
        }
    }

    updateNodeProperty(property, value) {
        if (this.selectedNodes.length === 1) {
            this.selectedNodes[0][property] = value;
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.saveState();
        }
    }

    updateLinkProperty(property, value) {
        if (this.selectedLinks.length === 1) {
            this.selectedLinks[0][property] = value;
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.saveState();
        }
    }

    //  Save/Load
    saveDiagram() {
        const data = {
            version: '1.1',
            nodes: this.nodes.filter(n => n.type !== 'container'),
            containers: this.containers.map(c => c.serialize()),
            links: this.links.map(link => ({
                id: link.id,
                sourceId: link.source.id,
                targetId: link.target.id,
                color: link.color,
                width: link.width,
                style: link.style,
                arrowType: link.arrowType
            })),
            groups: this.groups,
            pageSettings: this.pageSettings,
            zoom: this.zoom,
            pan: this.pan
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `diagram_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        
        this.updateStatus(' Save.');
    }

    loadDiagram() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        this.nodes = data.nodes || [];
                        
                        // Image  Circle
                        this.nodes.forEach(node => {
                            if (node.type === 'image' && node.imageData) {
                                const img = new Image();
                                img.onload = () => {
                                    node.image = img;
                                    this.drawCache.needsRedraw = true;
                                    this.draw();
                                    this.drawRulers();
                                };
                                img.src = node.imageData;
                            }
                        });
                        
                        // Container Circle
                        if (data.containers) {
                            this.containers = data.containers.map(containerData => 
                                ContainerNode.deserialize(containerData)
                            );
                            
                            // Container nodes  
                            this.containers.forEach(container => {
                                this.nodes.push(container);
                            });
                            
                            this.containerIdCounter = Math.max(...this.containers.map(c => c.id), 0) + 1;
                        }
                        
                        // Link Circle
                        this.links = data.links.map(link => ({
                            id: link.id || this.linkIdCounter++,
                            source: this.nodes.find(n => n.id === link.sourceId),
                            target: this.nodes.find(n => n.id === link.targetId),
                            color: link.color,
                            width: link.width,
                            style: link.style || 'straight',
                            arrowType: link.arrowType || 'arrow'
                        })).filter(link => link.source && link.target);
                        
                        this.groups = data.groups || [];
                        
                        if (data.pageSettings) {
                            Object.assign(this.pageSettings, data.pageSettings);
                        }
                        
                        if (data.zoom) this.zoom = data.zoom;
                        if (data.pan) this.pan = data.pan;
                        
                        this.nodeIdCounter = Math.max(...this.nodes.map(n => n.id), 0) + 1;
                        this.linkIdCounter = Math.max(...this.links.map(l => l.id || 0), 0) + 1;
                        this.groupIdCounter = Math.max(...this.groups.map(g => g.id), 0) + 1;
                        
                        this.selectedNodes = [];
                        this.selectedLinks = [];
                        this.history = [];
                        this.historyIndex = -1;
                        
                        this.updateContainerHierarchy();
                        this.saveState();
                        this.drawCache.needsRedraw = true;
                        this.draw();
                        this.drawRulers();
                        this.updateZoomLevel();
                        this.updatePropertiesPanel();
                        this.updateStatus('Diagram loaded.');
                    } catch (error) {
                        alert('    .');
                        console.error(error);
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }

    // New Diagram
    newDiagram() {
        if (confirm('New Diagram    . ?')) {
            this.nodes = [];
            this.links = [];
            this.groups = [];
            this.containers = [];
            this.selectedNodes = [];
            this.selectedLinks = [];
            this.history = [];
            this.historyIndex = -1;
            this.nodeIdCounter = 0;
            this.linkIdCounter = 0;
            this.groupIdCounter = 0;
            this.containerIdCounter = 0;
            this.zoom = 1.0;
            this.pan = { x: 0, y: 0 };
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.updatePropertiesPanel();
            this.updateStatus('New Diagram .');
            this.updateHistoryButtons();
        }
    }

    // Export
    exportDiagram() {
        // PNG Export
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Page Size  
        tempCanvas.width = this.pageSettings.width;
        tempCanvas.height = this.pageSettings.height;
        
        // Background color
        tempCtx.fillStyle = this.pageSettings.bgColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        //   (Select)
        if (this.pageSettings.showGrid) {
            const gridSize = this.pageSettings.gridSize;
            tempCtx.strokeStyle = this.pageSettings.gridColor;
            tempCtx.lineWidth = 0.5;
            
            for (let x = 0; x <= tempCanvas.width; x += gridSize) {
                tempCtx.beginPath();
                tempCtx.moveTo(x, 0);
                tempCtx.lineTo(x, tempCanvas.height);
                tempCtx.stroke();
            }
            
            for (let y = 0; y <= tempCanvas.height; y += gridSize) {
                tempCtx.beginPath();
                tempCtx.moveTo(0, y);
                tempCtx.lineTo(tempCanvas.width, y);
                tempCtx.stroke();
            }
        }
        
        //  Text Save
        const originalCtx = this.ctx;
        this.ctx = tempCtx;
        
        // Container 
        const sortedContainers = [...this.containers].sort((a, b) => a.depth - b.depth);
        sortedContainers.forEach(container => {
            this.drawContainer(container);
        });
        
        // Link 
        this.links.forEach(link => this.drawLink(link));
        
        //  
        this.nodes.forEach(node => {
            if (node.type !== 'container' && !node.hidden) {
                this.drawNode(node);
            }
        });
        
        // Text Circle
        this.ctx = originalCtx;
        
        // 
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagram_${new Date().toISOString().slice(0,10)}.png`;
            link.click();
            URL.revokeObjectURL(url);
        });
        
        this.updateStatus('Diagram exported as PNG.');
    }

    // Group
    groupSelected() {
        if (this.selectedNodes.length > 1) {
            const group = {
                id: this.groupIdCounter++,
                nodes: this.selectedNodes.map(n => n.id)
            };
            this.groups.push(group);
            this.updateStatus(`${this.selectedNodes.length}  Group.`);
            this.saveState();
        }
    }

    ungroupSelected() {
        if (this.selectedNodes.length > 0) {
            const nodeIds = this.selectedNodes.map(n => n.id);
            let ungrouped = 0;
            
            this.groups = this.groups.filter(group => {
                const hasSelectedNode = group.nodes.some(id => nodeIds.includes(id));
                if (hasSelectedNode) {
                    ungrouped++;
                    return false;
                }
                return true;
            });
            
            if (ungrouped > 0) {
                this.updateStatus(`${ungrouped} groups ungrouped.`);
                this.saveState();
            }
        }
    }

    //  
    alignNodes(alignment) {
        if (this.selectedNodes.length < 2) return;
        
        let reference;
        switch (alignment) {
            case 'left':
                reference = Math.min(...this.selectedNodes.map(n => n.x));
                this.selectedNodes.forEach(node => node.x = reference);
                break;
            case 'center':
                reference = this.selectedNodes.reduce((sum, n) => sum + n.x + n.width / 2, 0) / this.selectedNodes.length;
                this.selectedNodes.forEach(node => node.x = reference - node.width / 2);
                break;
            case 'right':
                reference = Math.max(...this.selectedNodes.map(n => n.x + n.width));
                this.selectedNodes.forEach(node => node.x = reference - node.width);
                break;
            case 'top':
                reference = Math.min(...this.selectedNodes.map(n => n.y));
                this.selectedNodes.forEach(node => node.y = reference);
                break;
            case 'middle':
                reference = this.selectedNodes.reduce((sum, n) => sum + n.y + n.height / 2, 0) / this.selectedNodes.length;
                this.selectedNodes.forEach(node => node.y = reference - node.height / 2);
                break;
            case 'bottom':
                reference = Math.max(...this.selectedNodes.map(n => n.y + n.height));
                this.selectedNodes.forEach(node => node.y = reference - node.height);
                break;
        }
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.saveState();
        this.updateStatus(`${this.selectedNodes.length} nodes aligned.`);
    }

    distributeNodes(direction) {
        if (this.selectedNodes.length < 3) return;
        
        if (direction === 'horizontal') {
            // X  
            const sorted = [...this.selectedNodes].sort((a, b) => a.x - b.x);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const totalWidth = sorted.reduce((sum, n) => sum + n.width, 0);
            const totalGap = (last.x + last.width) - first.x - totalWidth;
            const gap = totalGap / (sorted.length - 1);
            
            let currentX = first.x + first.width;
            for (let i = 1; i < sorted.length - 1; i++) {
                sorted[i].x = currentX + gap;
                currentX = sorted[i].x + sorted[i].width;
            }
        } else {
            // Y  
            const sorted = [...this.selectedNodes].sort((a, b) => a.y - b.y);
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const totalHeight = sorted.reduce((sum, n) => sum + n.height, 0);
            const totalGap = (last.y + last.height) - first.y - totalHeight;
            const gap = totalGap / (sorted.length - 1);
            
            let currentY = first.y + first.height;
            for (let i = 1; i < sorted.length - 1; i++) {
                sorted[i].y = currentY + gap;
                currentY = sorted[i].y + sorted[i].height;
            }
        }
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.saveState();
        this.updateStatus(`${this.selectedNodes.length}   .`);
    }

    //  
    moveSelected(dx, dy) {
        if (this.selectedNodes.length > 0) {
            this.selectedNodes.forEach(node => {
                node.x += dx;
                node.y += dy;
                
                if (node.type === 'container') {
                    this.updateContainerChildrenPositions(node);
                }
            });
            
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.saveState();
        }
    }

    //  
    bringToFront() {
        if (this.selectedNodes.length === 1) {
            const node = this.selectedNodes[0];
            const index = this.nodes.indexOf(node);
            if (index > -1) {
                this.nodes.splice(index, 1);
                this.nodes.push(node);
                
                if (node.type === 'container') {
                    const containerIndex = this.containers.indexOf(node);
                    if (containerIndex > -1) {
                        this.containers.splice(containerIndex, 1);
                        this.containers.push(node);
                    }
                }
                
                this.drawCache.needsRedraw = true;
                this.draw();
                this.saveState();
                this.updateStatus('Bring to front .');
            }
        }
    }

    sendToBack() {
        if (this.selectedNodes.length === 1) {
            const node = this.selectedNodes[0];
            const index = this.nodes.indexOf(node);
            if (index > -1) {
                this.nodes.splice(index, 1);
                this.nodes.unshift(node);
                
                if (node.type === 'container') {
                    const containerIndex = this.containers.indexOf(node);
                    if (containerIndex > -1) {
                        this.containers.splice(containerIndex, 1);
                        this.containers.unshift(node);
                    }
                }
                
                this.drawCache.needsRedraw = true;
                this.draw();
                this.saveState();
                this.updateStatus('Send to back .');
            }
        }
    }

    //  
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5.0);
        this.updateZoomLevel();
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.updateZoomLevel();
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
    }

    resetZoom() {
        this.zoom = 1.0;
        this.pan = { x: 0, y: 0 };
        this.updateZoomLevel();
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
    }

    updateZoomLevel() {
        document.getElementById('zoomLevel').textContent = Math.round(this.zoom * 100) + '%';
    }

    //  UI 
    showContextMenu(x, y) {
        const menu = document.getElementById('contextMenu');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';
    }

    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
        this.announce(message);
    }

    cancelOperation() {
        if (this.isDrawing || this.isDragging || this.isResizing) {
            this.resetDragState();
            this.updateStatus(' Cancel.');
        } else {
            // ESC Select 
            this.selectedNodes = [];
            this.selectedLinks = [];
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers();
            this.updatePropertiesPanel();
            this.selectTool('select');
        }
    }

    // Text 
    editTextNode(node) {
        const input = document.createElement('textarea');
        input.value = node.text || '';
        input.style.position = 'absolute';
        
        const rect = this.canvas.getBoundingClientRect();
        const nodeX = (node.x * this.zoom + this.pan.x) + rect.left;
        const nodeY = (node.y * this.zoom + this.pan.y) + rect.top;
        
        input.style.left = nodeX + 'px';
        input.style.top = nodeY + 'px';
        input.style.width = (node.width * this.zoom) + 'px';
        input.style.height = (node.height * this.zoom) + 'px';
        input.style.fontSize = ((node.fontSize || 14) * this.zoom) + 'px';
        input.style.fontFamily = node.fontFamily || 'Arial';
        input.style.textAlign = 'center';
        input.style.border = '2px solid #3498db';
        input.style.outline = 'none';
        input.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        input.style.resize = 'none';
        input.style.padding = '5px';
        
        document.body.appendChild(input);
        input.focus();
        input.select();
        
        const finishEdit = () => {
            node.text = input.value;
            document.body.removeChild(input);
            this.drawCache.needsRedraw = true;
            this.draw();
            this.saveState();
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEdit();
            } else if (e.key === 'Escape') {
                document.body.removeChild(input);
                this.drawCache.needsRedraw = true;
                this.draw();
            }
        });
    }

    // Page Settings
    showPageSettings() {
        const modal = document.getElementById('pageSettingsModal');
        
        //     
        document.getElementById('pageWidth').value = this.pageSettings.width;
        document.getElementById('pageHeight').value = this.pageSettings.height;
        document.getElementById('bgColor').value = this.pageSettings.bgColor;
        document.getElementById('showGrid').checked = this.pageSettings.showGrid;
        document.getElementById('gridSize').value = this.pageSettings.gridSize;
        document.getElementById('gridColor').value = this.pageSettings.gridColor;
        document.getElementById('showRulers').checked = this.pageSettings.showRulers;
        document.getElementById('snapToGrid').checked = this.pageSettings.snapToGrid;
        document.getElementById('showPageBounds').checked = this.pageSettings.showPageBounds;
        document.getElementById('constrainToPage').checked = this.pageSettings.constrainToPage;
        
        modal.style.display = 'block';
    }

    closePageSettings() {
        document.getElementById('pageSettingsModal').style.display = 'none';
    }

    applyPageSettings() {
        //   
        this.pageSettings.width = parseInt(document.getElementById('pageWidth').value);
        this.pageSettings.height = parseInt(document.getElementById('pageHeight').value);
        this.pageSettings.bgColor = document.getElementById('bgColor').value;
        this.pageSettings.showGrid = document.getElementById('showGrid').checked;
        this.pageSettings.gridSize = parseInt(document.getElementById('gridSize').value);
        this.pageSettings.gridColor = document.getElementById('gridColor').value;
        this.pageSettings.showRulers = document.getElementById('showRulers').checked;
        this.pageSettings.snapToGrid = document.getElementById('snapToGrid').checked;
        this.pageSettings.showPageBounds = document.getElementById('showPageBounds').checked;
        this.pageSettings.constrainToPage = document.getElementById('constrainToPage').checked;
        
        //  /
        const rulerElements = document.querySelectorAll('.ruler-corner, .ruler-horizontal, .ruler-vertical');
        rulerElements.forEach(el => {
            el.style.display = this.pageSettings.showRulers ? 'block' : 'none';
        });
        
        //  position 
        if (this.pageSettings.showRulers) {
            this.canvas.style.top = '30px';
            this.canvas.style.left = '30px';
        } else {
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
        }
        
        this.resizeCanvas();
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.closePageSettings();
        this.updateStatus('Page Settings Apply.');
    }

    applyPagePreset(preset) {
        const presets = {
            'a4': { width: 794, height: 1123 },
            'a3': { width: 1123, height: 1587 },
            'letter': { width: 816, height: 1056 },
            '1920x1080': { width: 1920, height: 1080 },
            '1280x720': { width: 1280, height: 720 }
        };
        
        if (presets[preset]) {
            document.getElementById('pageWidth').value = presets[preset].width;
            document.getElementById('pageHeight').value = presets[preset].height;
        }
    }

    updateSmartGuideSettings() {
        this.pageSettings.showSmartGuides = document.getElementById('showSmartGuides').checked;
        this.pageSettings.smartGuideColor = document.getElementById('smartGuideColor').value;
        this.pageSettings.snapDistance = parseInt(document.getElementById('snapDistance').value);
        this.pageSettings.showCenterGuides = document.getElementById('showCenterGuides').checked;
    }

    // Template 
    showTemplateModal() {
        document.getElementById('templateModal').style.display = 'block';
    }

    closeTemplateModal() {
        document.getElementById('templateModal').style.display = 'none';
    }

    insertTemplate(type) {
        let newNode;
        const x = 100 + Math.random() * 200;
        const y = 100 + Math.random() * 200;
        
        switch (type) {
            case 'process':
                newNode = {
                    id: this.nodeIdCounter++,
                    type: 'rectangle',
                    x: x,
                    y: y,
                    width: 120,
                    height: 60,
                    fillColor: '#E3F2FD',
                    lineColor: '#2196F3',
                    lineWidth: 2,
                    text: ''
                };
                break;
            case 'decision':
                newNode = {
                    id: this.nodeIdCounter++,
                    type: 'diamond',
                    x: x,
                    y: y,
                    width: 100,
                    height: 100,
                    fillColor: '#FFF3E0',
                    lineColor: '#FF9800',
                    lineWidth: 2,
                    text: ''
                };
                break;
            case 'data':
                newNode = {
                    id: this.nodeIdCounter++,
                    type: 'rectangle',
                    subType: 'data',
                    x: x,
                    y: y,
                    width: 120,
                    height: 60,
                    fillColor: '#F3E5F5',
                    lineColor: '#9C27B0',
                    lineWidth: 2,
                    text: ''
                };
                break;
            case 'start':
                newNode = {
                    id: this.nodeIdCounter++,
                    type: 'ellipse',
                    x: x,
                    y: y,
                    width: 80,
                    height: 80,
                    fillColor: '#E8F5E9',
                    lineColor: '#4CAF50',
                    lineWidth: 2,
                    text: ''
                };
                break;
            case 'document':
                newNode = {
                    id: this.nodeIdCounter++,
                    type: 'rectangle',
                    subType: 'document',
                    x: x,
                    y: y,
                    width: 120,
                    height: 80,
                    fillColor: '#FCE4EC',
                    lineColor: '#E91E63',
                    lineWidth: 2,
                    text: ''
                };
                break;
            case 'database':
                newNode = {
                    id: this.nodeIdCounter++,
                    type: 'rectangle',
                    subType: 'database',
                    x: x,
                    y: y,
                    width: 100,
                    height: 120,
                    fillColor: '#E0F2F1',
                    lineColor: '#009688',
                    lineWidth: 2,
                    text: 'DB'
                };
                break;
        }
        
        if (newNode) {
            this.nodes.push(newNode);
            this.selectedNodes = [newNode];
            this.selectedLinks = [];
            this.saveState();
            this.drawCache.needsRedraw = true;
            this.draw();
            this.drawRulers(); //  
            this.updatePropertiesPanel();
            this.closeTemplateModal();
            this.selectTool('select');
        }
    }


    // Image 
    insertImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const newNode = {
                            id: this.nodeIdCounter++,
                            type: 'image',
                            x: 100,
                            y: 100,
                            width: Math.min(img.width, 300),
                            height: Math.min(img.height, 300),
                            image: img,
                            imageData: e.target.result,
                            lineColor: 'transparent',
                            lineWidth: 0
                        };
                        
                        //  
                        const ratio = img.width / img.height;
                        if (newNode.width / newNode.height !== ratio) {
                            if (ratio > 1) {
                                newNode.height = newNode.width / ratio;
                            } else {
                                newNode.width = newNode.height * ratio;
                            }
                        }
                        
                        this.nodes.push(newNode);
                        this.selectedNodes = [newNode];
                        this.selectedLinks = [];
                        this.saveState();
                        this.drawCache.needsRedraw = true;
                        this.draw();
                        this.drawRulers();
                        this.updatePropertiesPanel();
                        this.updateStatus('Image .');
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    }

    //  
    focusNextNode() {
        if (this.nodes.length === 0) return;
        
        this.focusedNodeIndex = (this.focusedNodeIndex + 1) % this.nodes.length;
        const node = this.nodes[this.focusedNodeIndex];
        
        this.selectedNodes = [node];
        this.selectedLinks = [];
        
        //   
        this.ensureNodeVisible(node);
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.updatePropertiesPanel();
        
        //   
        const nodeType = this.getNodeTypeKorean(node.type);
        const text = node.text ? `, Text: ${node.text}` : '';
        this.announce(`${nodeType} Select${text}. position: X ${Math.round(node.x)}, Y ${Math.round(node.y)}`);
    }
    
    focusPreviousNode() {
        if (this.nodes.length === 0) return;
        
        this.focusedNodeIndex--;
        if (this.focusedNodeIndex < 0) {
            this.focusedNodeIndex = this.nodes.length - 1;
        }
        
        const node = this.nodes[this.focusedNodeIndex];
        
        this.selectedNodes = [node];
        this.selectedLinks = [];
        
        this.ensureNodeVisible(node);
        
        this.drawCache.needsRedraw = true;
        this.draw();
        this.drawRulers();
        this.updatePropertiesPanel();
        
        const nodeType = this.getNodeTypeKorean(node.type);
        const text = node.text ? `, Text: ${node.text}` : '';
        this.announce(`${nodeType} Select${text}. position: X ${Math.round(node.x)}, Y ${Math.round(node.y)}`);
    }
    
    ensureNodeVisible(node) {
        const padding = 50;
        const nodeLeft = node.x * this.zoom + this.pan.x;
        const nodeTop = node.y * this.zoom + this.pan.y;
        const nodeRight = (node.x + node.width) * this.zoom + this.pan.x;
        const nodeBottom = (node.y + node.height) * this.zoom + this.pan.y;
        
        if (nodeLeft < padding) {
            this.pan.x = padding - node.x * this.zoom;
        } else if (nodeRight > this.canvas.width - padding) {
            this.pan.x = this.canvas.width - padding - (node.x + node.width) * this.zoom;
        }
        
        if (nodeTop < padding) {
            this.pan.y = padding - node.y * this.zoom;
        } else if (nodeBottom > this.canvas.height - padding) {
            this.pan.y = this.canvas.height - padding - (node.y + node.height) * this.zoom;
        }
    }
    
    getNodeTypeKorean(type) {
        const types = {
            'rectangle': 'Rectangle',
            'ellipse': 'Circle',
            'diamond': 'Diamond',
            'line': 'Line',
            'text': 'Text',
            'image': 'Image',
            'container': 'Container'
        };
        return types[type] || type;
    }

    // Properties  
    editProperties() {
        if (this.selectedNodes.length === 1 || this.selectedLinks.length === 1) {
            this.showPropertiesModal();
        }
    }

    showPropertiesModal() {
        //   ...
        const modal = document.getElementById('propertiesModal');
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('propertiesModal').style.display = 'none';
    }

    applyProperties() {
        //   ...
        this.closeModal();
    }

    // 
    destroy() {
        //  
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        //   
        this.canvas.removeEventListener('mousedown', this.onMouseDown);
        this.canvas.removeEventListener('mousemove', this.onMouseMove);
        this.canvas.removeEventListener('mouseup', this.onMouseUp);
        this.canvas.removeEventListener('dblclick', this.onDblClick);
        this.canvas.removeEventListener('contextmenu', this.onContextMenu);
        this.canvas.removeEventListener('wheel', this.onWheel);
        document.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('resize', this.resizeCanvas);
        
        // Image  
        this.nodes.forEach(node => {
            if (node.type === 'image' && node.image) {
                node.image.src = '';
                node.image = null;
            }
        });
        
        //  
        this.ctx = null;
        this.rulerHCtx = null;
        this.rulerVCtx = null;
        
        //   
        if (this.drawCache.offscreenCanvas) {
            this.drawCache.offscreenCtx = null;
            this.drawCache.offscreenCanvas = null;
        }
    }
}

//  
let editor;
document.addEventListener('DOMContentLoaded', () => {
    editor = new DiagramEditor();
});

// roundRect 
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        this.beginPath();
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y, radius);
        this.arcTo(x, y, x + width, y, radius);
        this.closePath();
        return this;
    };
}
