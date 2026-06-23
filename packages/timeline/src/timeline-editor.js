const EventArgs = { empty: Object.freeze({}) };

class TimelineEditor {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.container = canvas.parentElement;
        
        // Initialize properties
        this.tracks = [];
        this.frameCount = 600;
        this.frameWidth = 16;
        this.minFrameWidth = 8;
        this.maxFrameWidth = 64;
        this.timelineHeight = 22;
        this.trackHeaderWidth = 90;
        this.scrollX = 0;
        this.currentFrame = 0;
        
        // Mouse state
        this.isMouseDown = false;
        this.draggingClip = false;
        this.dragClip = null;
        this.dragTrack = null;
        this.dragStartFrameOffset = 0;
        this.dragStartMouse = { x: 0, y: 0 };
        this.dragStartClipFrame = 0;
        this.dragClipTrackIndex = -1;
        this.dragOriginTrackIndex = -1;
        this.dragHoverTrack = -1;
        
        // Clip resize
        this.resizingClip = false;
        this.resizeClip = null;
        this.resizeTrack = null;
        this.resizingLeft = false;
        this.resizeOriginStart = 0;
        this.resizeOriginLength = 0;
        this.resizeStartMouse = { x: 0, y: 0 };
        
        // Track UI
        this.addTrackButtonRect = { x: 0, y: 0, width: 0, height: 0 };
        this.hoveredTrackIndex = -1;
        this.hoveredTrackBounds = { x: 0, y: 0, width: 0, height: 0 };
        
        // Editing
        this.editBox = options.editBoxElement || document.getElementById(options.editBoxId || 'editBox');
        this.editingTrackIndex = -1;
        this.editingClipTrackIndex = -1;
        this.editingClipIndex = -1;
        
        // Selection
        this.selectedTrackIndex = 0;
        this.selectedClipTrack = 0;
        this.selectedClipIndex = 0;
        this.selectedTrack = null;
        this.selectedClip = null;
        
        // Vertical scroll
        this.verticalScroll = 0;
        this.maxVerticalScroll = 0;
        this.verticalScrollBarRect = { x: 0, y: 0, width: 0, height: 0 };
        this.draggingVScroll = false;
        this.dragVScrollOffsetY = 0;
        
        // Header resize
        this.resizingHeader = false;
        this.resizeHeaderStartX = 0;
        this.resizeHeaderOriginWidth = 0;
        this.minTrackHeaderWidth = 40;
        this.maxTrackHeaderWidth = 300;
        this.headerResizeMargin = 4;
        
        // Track height resize
        this.resizingTrackHeight = false;
        this.resizeTrackIndex = -1;
        this.resizeTrackStartY = 0;
        this.resizeTrackOriginHeight = 0;
        this.minTrackHeight = 20;
        this.maxTrackHeight = 120;
        this.trackHeightResizeMargin = 3;
        
        // Header drag
        this.draggingTrack = false;
        this.dragHeaderTrackIndex = -1;
        this.dragTrackOffsetY = 0;
        this.dragOverTrackIndex = -1;
        
        // Drag delay
        this.dragDelayTimer = null;
        this.dragDelayMousePos = { x: 0, y: 0 };
        this.dragDelayTrackIndex = -1;
        this.dragDelayTime = 300;
        
        // Snap grid
        this.snapGrid = 16;
        this.snapThreshold = 4;
        this.tickUnit = 1;
        this.beatUnit = 4;
        this.barUnit = 16;
        this.rulerMode = options.rulerMode || 'bars';
        this.msPerFrame = Math.max(1, Number(options.msPerFrame || 100));
        this.majorTickMs = Math.max(this.msPerFrame, Number(options.majorTickMs || 1000));
        this.minorTickMs = Math.max(this.msPerFrame, Number(options.minorTickMs || 250));
        
        // Colors
        this.backgroundColor = '#242424';
        this.barColor = 'rgba(100, 200, 255, 0.8)';
        this.beatColor = 'rgba(160, 200, 200, 0.55)';
        this.tickColor = 'rgba(110, 110, 110, 0.27)';
        
        // Context menu
        this.contextMenu = options.contextMenuElement || document.getElementById(options.contextMenuId || 'contextMenu');
        
        // History
        this.undoStack = [];
        this.redoStack = [];
        this.internalHistoryChange = false;
        
        // Events
        this.trackSelectedHandlers = [];
        this.clipSelectedHandlers = [];
        this.selectedTrackChangedHandlers = [];
        this.selectedClipChangedHandlers = [];
        this.clipMoveEndHandlers = [];
        this.clipResizeEndHandlers = [];
        this.clipChangedHandlers = [];
        this.timelineChangedHandlers = [];
        
        // Initialize
        this.setupEventListeners();
        this.render();
    }
    
    // Track class
    createTrack(name, height = 36, color = '#3c3c3c') {
        return {
            name: name,
            clips: [],
            height: height,
            trackColor: color,
            tag: null
        };
    }
    
    // Clip class
    createClip(name, start, length, color = '#486eb4') {
        return {
            name: name,
            start: start,
            length: length,
            color: color,
            textColor: 'white',
            selected: false,
            tag: null
        };
    }
    
    // History management
    captureState() {
        return {
            tracks: JSON.parse(JSON.stringify(this.tracks)),
            frameCount: this.frameCount,
            frameWidth: this.frameWidth,
            minFrameWidth: this.minFrameWidth,
            maxFrameWidth: this.maxFrameWidth,
            timelineHeight: this.timelineHeight,
            trackHeaderWidth: this.trackHeaderWidth,
            scrollX: this.scrollX,
            verticalScroll: this.verticalScroll,
            currentFrame: this.currentFrame,
            rulerMode: this.rulerMode,
            msPerFrame: this.msPerFrame,
            majorTickMs: this.majorTickMs,
            minorTickMs: this.minorTickMs
        };
    }
    
    restoreState(state) {
        this.internalHistoryChange = true;
        this.tracks = JSON.parse(JSON.stringify(state.tracks));
        this.frameCount = state.frameCount;
        this.frameWidth = state.frameWidth;
        this.minFrameWidth = state.minFrameWidth;
        this.maxFrameWidth = state.maxFrameWidth;
        this.timelineHeight = state.timelineHeight;
        this.trackHeaderWidth = state.trackHeaderWidth;
        this.scrollX = state.scrollX;
        this.verticalScroll = state.verticalScroll;
        this.currentFrame = state.currentFrame;
        this.rulerMode = state.rulerMode || this.rulerMode;
        this.msPerFrame = Math.max(1, Number(state.msPerFrame || this.msPerFrame));
        this.majorTickMs = Math.max(this.msPerFrame, Number(state.majorTickMs || this.majorTickMs));
        this.minorTickMs = Math.max(this.msPerFrame, Number(state.minorTickMs || this.minorTickMs));
        this.internalHistoryChange = false;
        this.render();
    }
    
    pushUndo() {
        if (this.internalHistoryChange) return;
        this.undoStack.push(this.captureState());
        this.redoStack = [];
    }
    
    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.captureState());
            const prev = this.undoStack.pop();
            this.restoreState(prev);
        }
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.captureState());
            const next = this.redoStack.pop();
            this.restoreState(next);
        }
    }
    
    // Helper methods
    getVisibleTracksInfo() {
        const availableHeight = this.canvas.height - this.timelineHeight;
        let totalVisibleHeight = 0;
        let firstVisible = this.verticalScroll;
        let lastVisible = this.verticalScroll;
        
        for (let i = this.verticalScroll; i < this.tracks.length; i++) {
            if (totalVisibleHeight + this.tracks[i].height > availableHeight) break;
            totalVisibleHeight += this.tracks[i].height;
            lastVisible = i;
        }
        
        return { firstVisible, lastVisible, totalVisibleHeight };
    }
    
    getTrackY(trackIndex) {
        let y = this.timelineHeight;
        for (let i = this.verticalScroll; i < trackIndex && i < this.tracks.length; i++) {
            y += this.tracks[i].height;
        }
        return y;
    }
    
    getTrackIndexFromY(y) {
        if (y < this.timelineHeight) return -1;
        
        let currentY = this.timelineHeight;
        for (let i = this.verticalScroll; i < this.tracks.length; i++) {
            if (y >= currentY && y < currentY + this.tracks[i].height) return i;
            currentY += this.tracks[i].height;
            if (currentY > this.canvas.height) break;
        }
        return -1;
    }
    
    getTrackBorderIndex(y) {
        let currentY = this.timelineHeight;
        for (let i = this.verticalScroll; i < this.tracks.length; i++) {
            currentY += this.tracks[i].height;
            if (Math.abs(y - currentY) <= this.trackHeightResizeMargin) return i;
            if (currentY > this.canvas.height) break;
        }
        return -1;
    }

    getOverlayParentRect(element) {
        const parent = element && (element.offsetParent || element.parentElement);
        if (parent && typeof parent.getBoundingClientRect === 'function') {
            return parent.getBoundingClientRect();
        }
        return { left: 0, top: 0 };
    }
    
    // Event setup
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));
        this.canvas.addEventListener('click', (e) => this.onMouseClick(e));
        this.canvas.addEventListener('dblclick', (e) => this.onMouseDoubleClick(e));
        this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
        
        // Context menu
        if (this.contextMenu) {
            this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    if (action === 'insert') {
                        if (this.hoveredTrackIndex >= 0 && this.hoveredTrackIndex <= this.tracks.length) {
                            this.pushUndo();
                            const insertIndex = this.hoveredTrackIndex;
                            this.tracks.splice(insertIndex, 0, this.createTrack(`Track ${this.tracks.length + 1}`));
                            this.render();
                        }
                    } else if (action === 'delete') {
                        if (this.hoveredTrackIndex >= 0 && this.hoveredTrackIndex < this.tracks.length) {
                            this.pushUndo();
                            this.tracks.splice(this.hoveredTrackIndex, 1);
                            this.hoveredTrackIndex = -1;
                            this.render();
                        }
                    }
                    this.hideContextMenu();
                });
            });
            
            // Hide context menu on click outside
            document.addEventListener('click', (e) => {
                if (!this.contextMenu.contains(e.target)) {
                    this.hideContextMenu();
                }
            });
        }
        
        // Edit box events
        if (this.editBox) {
            this.editBox.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.endEditing(true);
                    e.preventDefault();
                } else if (e.key === 'Escape') {
                    this.endEditing(false);
                    e.preventDefault();
                }
            });
            
            this.editBox.addEventListener('blur', () => {
                this.endEditing(true);
            });
        }
    }
    
    // Mouse events
    onMouseDown(e) {
        this.isMouseDown = true;
        this.canvas.focus();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Header width resize
        if (Math.abs(x - this.trackHeaderWidth) <= this.headerResizeMargin && y >= this.timelineHeight) {
            this.resizingHeader = true;
            this.resizeHeaderStartX = x;
            this.resizeHeaderOriginWidth = this.trackHeaderWidth;
            this.canvas.style.cursor = 'ew-resize';
            return;
        }
        
        // Track height resize
        const borderTrack = this.getTrackBorderIndex(y);
        if (borderTrack >= 0 && x < this.trackHeaderWidth) {
            this.resizingTrackHeight = true;
            this.resizeTrackIndex = borderTrack;
            this.resizeTrackStartY = y;
            this.resizeTrackOriginHeight = this.tracks[borderTrack].height;
            this.canvas.style.cursor = 'ns-resize';
            return;
        }
        
        // Add track button
        if (this.isPointInRect(x, y, this.addTrackButtonRect)) {
            this.pushUndo();
            this.tracks.push(this.createTrack(`Track ${this.tracks.length + 1}`));
            this.render();
            return;
        }
        
        // Vertical scrollbar
        if (this.isPointInRect(x, y, this.verticalScrollBarRect)) {
            this.draggingVScroll = true;
            this.dragVScrollOffsetY = y - this.verticalScrollBarRect.y;
            return;
        }
        
        // Track header click
        const trackIndex = this.getTrackIndexFromY(y);
        if (trackIndex >= 0 && x < this.trackHeaderWidth) {
            this.hoveredTrackIndex = trackIndex;
            
            if (e.button === 0) { // Left click
                // Start drag delay timer
                this.dragDelayTrackIndex = trackIndex;
                this.dragDelayMousePos = { x, y };
                this.dragDelayTimer = setTimeout(() => {
                    if (this.dragDelayTrackIndex >= 0 && this.dragDelayTrackIndex < this.tracks.length) {
                        this.draggingTrack = true;
                        this.dragHeaderTrackIndex = this.dragDelayTrackIndex;
                        this.dragTrackOffsetY = this.dragDelayMousePos.y - this.getTrackY(this.dragDelayTrackIndex);
                        this.dragOverTrackIndex = this.dragDelayTrackIndex;
                        this.render();
                    }
                }, this.dragDelayTime);
                
                this.selectedTrackIndex = trackIndex;
                this.selectedClipTrack = -1;
                this.selectedClipIndex = -1;
                this.render();
                
                // Fire events
                const oldTrack = this.selectedTrack;
                this.selectedTrack = this.tracks[trackIndex];
                this.fireEvent('trackSelected');
                if (oldTrack !== this.selectedTrack) {
                    this.fireEvent('selectedTrackChanged');
                }
                return;
            }
            
            if (e.button === 2) { // Right click
                this.selectedTrackIndex = trackIndex;
                this.selectedClipTrack = -1;
                this.selectedClipIndex = -1;
                this.showContextMenu(e.clientX, e.clientY);
                return;
            }
        }
        
        // Clip interaction
        let clipY = this.timelineHeight;
        for (let t = this.verticalScroll; t < this.tracks.length && clipY < this.canvas.height; t++) {
            const track = this.tracks[t];
            for (let c = 0; c < track.clips.length; c++) {
                const clip = track.clips[c];
                const clipX = this.trackHeaderWidth + (clip.start - this.scrollX) * this.frameWidth;
                const clipW = clip.length * this.frameWidth;
                const clipRect = { x: clipX, y: clipY + 4, width: clipW, height: track.height - 8 };
                
                const leftHandle = { x: clipRect.x, y: clipRect.y, width: 7, height: clipRect.height };
                const rightHandle = { x: clipRect.x + clipRect.width - 7, y: clipRect.y, width: 7, height: clipRect.height };
                
                // Check resize handles
                if (this.isPointInRect(x, y, leftHandle) && clip.length > 2) {
                    this.pushUndo();
                    this.resizingClip = true;
                    this.resizingLeft = true;
                    this.resizeClip = clip;
                    this.resizeTrack = track;
                    this.resizeOriginStart = clip.start;
                    this.resizeOriginLength = clip.length;
                    this.resizeStartMouse = { x, y };
                    this.render();
                    return;
                }
                
                if (this.isPointInRect(x, y, rightHandle) && clip.length > 2) {
                    this.pushUndo();
                    this.resizingClip = true;
                    this.resizingLeft = false;
                    this.resizeClip = clip;
                    this.resizeTrack = track;
                    this.resizeOriginStart = clip.start;
                    this.resizeOriginLength = clip.length;
                    this.resizeStartMouse = { x, y };
                    this.render();
                    return;
                }
                
                // Check clip body
                if (this.isPointInRect(x, y, clipRect)) {
                    this.pushUndo();
                    this.dragClip = clip;
                    this.dragTrack = track;
                    this.dragClipTrackIndex = t;
                    this.dragStartFrameOffset = Math.floor((x - clipX) / this.frameWidth);
                    this.dragStartMouse = { x, y };
                    this.dragStartClipFrame = clip.start;
                    this.draggingClip = true;
                    this.dragHoverTrack = t;
                    this.dragOriginTrackIndex = t;
                    this.selectedClipTrack = t;
                    this.selectedClipIndex = c;
                    this.selectedTrackIndex = t;
                    
                    // Clear all selections and select this clip
                    this.tracks.forEach(tr => tr.clips.forEach(cc => cc.selected = false));
                    clip.selected = true;
                    
                    const oldClip = this.selectedClip;
                    this.selectedClip = clip;
                    this.fireEvent('clipSelected');
                    if (oldClip !== this.selectedClip) {
                        this.fireEvent('selectedClipChanged');
                    }
                    
                    this.render();
                    return;
                }
            }
            clipY += track.height;
        }
        
        // Timeline area click - move playhead
        if (y < this.timelineHeight && x > this.trackHeaderWidth) {
            this.currentFrame = this.scrollX + Math.floor((x - this.trackHeaderWidth) / this.frameWidth);
            this.render();
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Cancel drag delay if mouse moved too much
        if (this.dragDelayTimer && this.dragDelayTrackIndex >= 0) {
            const distance = Math.abs(x - this.dragDelayMousePos.x) + Math.abs(y - this.dragDelayMousePos.y);
            if (distance > 5) {
                clearTimeout(this.dragDelayTimer);
                this.dragDelayTimer = null;
                this.dragDelayTrackIndex = -1;
            }
        }
        
        // Track dragging
        if (this.draggingTrack && this.dragHeaderTrackIndex !== -1) {
            const newIndex = this.getTrackIndexFromY(y);
            if (newIndex >= 0) {
                this.dragOverTrackIndex = newIndex;
            } else {
                if (y < this.timelineHeight) {
                    this.dragOverTrackIndex = this.verticalScroll;
                } else {
                    this.dragOverTrackIndex = Math.min(this.tracks.length, 
                        this.verticalScroll + Math.floor((this.canvas.height - this.timelineHeight) / 36));
                }
            }
            this.render();
            return;
        }
        
        // Header resize cursor
        if (!this.resizingHeader && !this.resizingTrackHeight) {
            const onHeaderBorder = Math.abs(x - this.trackHeaderWidth) <= this.headerResizeMargin && y >= this.timelineHeight;
            const onTrackBorder = this.getTrackBorderIndex(y) >= 0 && x < this.trackHeaderWidth;
            
            if (onHeaderBorder) {
                this.canvas.style.cursor = 'ew-resize';
            } else if (onTrackBorder) {
                this.canvas.style.cursor = 'ns-resize';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
        
        // Header resizing
        if (this.resizingHeader) {
            const dx = x - this.resizeHeaderStartX;
            const newWidth = Math.max(this.minTrackHeaderWidth, 
                Math.min(this.maxTrackHeaderWidth, this.resizeHeaderOriginWidth + dx));
            if (this.trackHeaderWidth !== newWidth) {
                this.trackHeaderWidth = newWidth;
                this.render();
            }
            return;
        }
        
        // Track height resizing
        if (this.resizingTrackHeight) {
            const dy = y - this.resizeTrackStartY;
            const newHeight = Math.max(this.minTrackHeight, 
                Math.min(this.maxTrackHeight, this.resizeTrackOriginHeight + dy));
            if (this.tracks[this.resizeTrackIndex].height !== newHeight) {
                this.tracks[this.resizeTrackIndex].height = newHeight;
                this.render();
            }
            return;
        }
        
        // Vertical scrollbar dragging
        if (this.draggingVScroll && this.maxVerticalScroll > 0) {
            const sbHeight = this.verticalScrollBarRect.height;
            const trackArea = this.canvas.height - this.timelineHeight - sbHeight;
            const newY = Math.min(Math.max(y - this.dragVScrollOffsetY - this.timelineHeight, 0), trackArea);
            const ratio = newY / trackArea;
            this.verticalScroll = Math.min(this.maxVerticalScroll, Math.floor(ratio * this.maxVerticalScroll));
            this.render();
            return;
        }
        
        // Resize handle cursor
        if (!this.resizingTrackHeight && !this.resizingClip) {
            this.canvas.style.cursor = 'default';
            let clipY = this.timelineHeight;
            for (let t = this.verticalScroll; t < this.tracks.length && clipY < this.canvas.height; t++) {
                const track = this.tracks[t];
                for (const clip of track.clips) {
                    const clipX = this.trackHeaderWidth + (clip.start - this.scrollX) * this.frameWidth;
                    const clipW = clip.length * this.frameWidth;
                    const clipRect = { x: clipX, y: clipY + 4, width: clipW, height: track.height - 8 };
                    
                    const leftHandle = { x: clipRect.x, y: clipRect.y, width: 7, height: clipRect.height };
                    const rightHandle = { x: clipRect.x + clipRect.width - 7, y: clipRect.y, width: 7, height: clipRect.height };
                    
                    if (this.isPointInRect(x, y, leftHandle) || this.isPointInRect(x, y, rightHandle)) {
                        this.canvas.style.cursor = 'ew-resize';
                        break;
                    }
                }
                clipY += track.height;
            }
        }
        
        // Clip resizing
        if (this.resizingClip && this.resizeClip) {
            const deltaFrames = Math.floor((x - this.resizeStartMouse.x) / this.frameWidth);
            if (this.resizingLeft) {
                const newStart = Math.max(0, this.resizeOriginStart + deltaFrames);
                const newLength = Math.max(2, this.resizeOriginLength - (newStart - this.resizeOriginStart));
                if (newLength > 2 && newStart < this.resizeClip.start + this.resizeOriginLength - 2) {
                    this.resizeClip.start = newStart;
                    this.resizeClip.length = newLength;
                }
            } else {
                const newLength = Math.max(2, this.resizeOriginLength + deltaFrames);
                this.resizeClip.length = newLength;
            }
            this.render();
        }
        
        // Clip dragging
        if (this.draggingClip && this.dragClip && this.dragTrack) {
            const frameDelta = Math.floor((x - this.dragStartMouse.x) / this.frameWidth);
            let newStart = this.dragStartClipFrame + frameDelta;
            newStart = Math.max(0, newStart);
            
            // Snap to grid
            if (this.snapGrid > 1) {
                const nearestGrid = Math.round(newStart / this.snapGrid) * this.snapGrid;
                if (Math.abs(nearestGrid - newStart) <= this.snapThreshold) {
                    newStart = nearestGrid;
                }
            }
            
            const newTrackIndex = this.getTrackIndexFromY(y);
            if (newTrackIndex >= 0) {
                this.dragHoverTrack = newTrackIndex;
            }
            
            // Track change
            if (newTrackIndex !== -1 && newTrackIndex !== this.dragClipTrackIndex) {
                const clipIndex = this.dragTrack.clips.indexOf(this.dragClip);
                if (clipIndex !== -1) {
                    this.dragTrack.clips.splice(clipIndex, 1);
                }
                
                // Check overlap
                const overlap = this.tracks[newTrackIndex].clips.some(c => 
                    newStart < c.start + c.length && newStart + this.dragClip.length > c.start
                );
                
                if (!overlap) {
                    this.dragClip.start = newStart;
                    this.tracks[newTrackIndex].clips.push(this.dragClip);
                    this.dragTrack = this.tracks[newTrackIndex];
                    this.dragClipTrackIndex = newTrackIndex;
                    this.selectedClipTrack = this.dragClipTrackIndex;
                    this.selectedClipIndex = this.dragTrack.clips.indexOf(this.dragClip);
                } else {
                    this.dragTrack.clips.push(this.dragClip);
                }
            } else if (newTrackIndex === this.dragClipTrackIndex) {
                // Check overlap in same track
                const overlap = this.dragTrack.clips.some(c => 
                    c !== this.dragClip && newStart < c.start + c.length && newStart + this.dragClip.length > c.start
                );
                
                if (!overlap) {
                    this.dragClip.start = newStart;
                }
            }
            
            this.render();
        }
    }
    
    onMouseUp(e) {
        this.isMouseDown = false;
        
        if (this.draggingClip) {
            this.render();
        }
        
        // Clear drag delay timer
        if (this.dragDelayTimer) {
            clearTimeout(this.dragDelayTimer);
            this.dragDelayTimer = null;
            this.dragDelayTrackIndex = -1;
        }
        
        // Track dragging
        if (this.draggingTrack && this.dragHeaderTrackIndex !== -1 && this.dragOverTrackIndex !== -1) {
            if (this.dragOverTrackIndex !== this.dragHeaderTrackIndex && 
                this.dragHeaderTrackIndex >= 0 && this.dragHeaderTrackIndex < this.tracks.length) {
                this.pushUndo();
                const moving = this.tracks[this.dragHeaderTrackIndex];
                this.tracks.splice(this.dragHeaderTrackIndex, 1);
                let insertAt = this.dragOverTrackIndex;
                if (insertAt > this.dragHeaderTrackIndex) insertAt--;
                insertAt = Math.max(0, Math.min(insertAt, this.tracks.length));
                this.tracks.splice(insertAt, 0, moving);
            }
            this.draggingTrack = false;
            this.dragHeaderTrackIndex = -1;
            this.dragOverTrackIndex = -1;
            this.render();
            return;
        }
        
        // Clear states
        if (this.resizingHeader) {
            this.resizingHeader = false;
            this.canvas.style.cursor = 'default';
            return;
        }
        
        if (this.resizingTrackHeight) {
            this.pushUndo();
            this.resizingTrackHeight = false;
            this.resizeTrackIndex = -1;
            this.canvas.style.cursor = 'default';
            return;
        }
        
        if (this.draggingVScroll) {
            this.draggingVScroll = false;
            this.render();
            return;
        }
        
        if (this.draggingClip) {
            const clip = this.dragClip;
            const track = this.dragTrack;
            const trackIndex = this.dragClipTrackIndex;
            const oldTrackIndex = this.dragOriginTrackIndex;
            const moved = clip && (
                clip.start !== this.dragStartClipFrame ||
                trackIndex !== oldTrackIndex
            );
            if (moved) {
                const args = this.createClipEventArgs({
                    clip,
                    track,
                    trackIndex,
                    oldTrackIndex,
                    oldStart: this.dragStartClipFrame,
                    reason: 'move'
                });
                this.fireEvent('clipMoveEnd', args);
                this.fireEvent('clipChanged', args);
                this.fireEvent('timelineChanged', { ...args, reason: 'clip:move' });
            }
            this.draggingClip = false;
            this.dragClip = null;
            this.dragTrack = null;
            this.dragClipTrackIndex = -1;
            this.dragOriginTrackIndex = -1;
        }
        
        if (this.resizingClip && this.resizeClip) {
            const resized = this.resizeClip.start !== this.resizeOriginStart ||
                this.resizeClip.length !== this.resizeOriginLength;
            if (resized) {
                const trackIndex = this.tracks.indexOf(this.resizeTrack);
                const args = this.createClipEventArgs({
                    clip: this.resizeClip,
                    track: this.resizeTrack,
                    trackIndex,
                    oldStart: this.resizeOriginStart,
                    oldLength: this.resizeOriginLength,
                    reason: 'resize'
                });
                this.fireEvent('clipResizeEnd', args);
                this.fireEvent('clipChanged', args);
                this.fireEvent('timelineChanged', { ...args, reason: 'clip:resize' });
            }
        }
        this.resizingClip = false;
        this.resizeClip = null;
        this.resizeTrack = null;
    }
    
    onMouseWheel(e) {
        e.preventDefault();
        
        if (e.ctrlKey) {
            // Zoom
            if (e.deltaY < 0 && this.frameWidth < this.maxFrameWidth) {
                this.frameWidth += 2;
            } else if (e.deltaY > 0 && this.frameWidth > this.minFrameWidth) {
                this.frameWidth -= 2;
            }
        } else if (this.maxVerticalScroll > 0 && Math.abs(e.deltaY) > 0) {
            if (e.shiftKey) {
                // Horizontal scroll
                this.scrollX -= Math.sign(e.deltaY) * 5;
                this.scrollX = Math.max(0, this.scrollX);
            } else {
                // Vertical scroll
                if (e.deltaY > 0 && this.verticalScroll < this.maxVerticalScroll) {
                    this.verticalScroll++;
                } else if (e.deltaY < 0 && this.verticalScroll > 0) {
                    this.verticalScroll--;
                }
            }
        } else {
            // Horizontal scroll
            this.scrollX -= Math.sign(e.deltaY) * 5;
            this.scrollX = Math.max(0, this.scrollX);
        }
        
        this.render();
    }
    
    onMouseClick(e) {
        // Handled in mousedown
    }
    
    onMouseDoubleClick(e) {
        this.endEditing(true);
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Track name double click
        const trackIndex = this.getTrackIndexFromY(y);
        if (trackIndex >= 0 && x < this.trackHeaderWidth) {
            this.editingTrackIndex = trackIndex;
            this.editingClipTrackIndex = -1;
            this.editingClipIndex = -1;
            
            const trackY = this.getTrackY(trackIndex);
            const editRect = {
                x: 4,
                y: trackY + (this.tracks[trackIndex].height - 20) / 2,
                width: this.trackHeaderWidth - 8,
                height: 20
            };
            this.showEditBox(editRect, this.tracks[trackIndex].name);
            return;
        }
        
        // Clip name double click
        let clipY = this.timelineHeight;
        for (let t = this.verticalScroll; t < this.tracks.length && clipY < this.canvas.height; t++) {
            const track = this.tracks[t];
            for (let c = 0; c < track.clips.length; c++) {
                const clip = track.clips[c];
                const clipX = this.trackHeaderWidth + (clip.start - this.scrollX) * this.frameWidth;
                const clipW = clip.length * this.frameWidth;
                const clipRect = { x: clipX, y: clipY + 4, width: clipW, height: track.height - 8 };
                
                if (this.isPointInRect(x, y, clipRect)) {
                    this.editingTrackIndex = -1;
                    this.editingClipTrackIndex = t;
                    this.editingClipIndex = c;
                    const editRect = {
                        x: clipRect.x + 2,
                        y: clipRect.y + (clipRect.height - 20) / 2,
                        width: clipRect.width - 4,
                        height: 20
                    };
                    this.showEditBox(editRect, clip.name);
                    return;
                }
            }
            clipY += track.height;
        }
    }
    
    onKeyDown(e) {
        if (this.editBox && this.editBox.style.display === 'block') return;
        
        // Undo/Redo
        if (e.ctrlKey && e.key === 'z') {
            this.undo();
            e.preventDefault();
            return;
        }
        if (e.ctrlKey && e.key === 'y') {
            this.redo();
            e.preventDefault();
            return;
        }
        
        // Navigation
        if (e.key === 'Home') {
            this.scrollX = 0;
            this.render();
            e.preventDefault();
            return;
        } else if (e.key === 'End') {
            const frameInView = Math.floor((this.canvas.width - this.trackHeaderWidth) / this.frameWidth);
            this.scrollX = Math.max(0, this.frameCount - frameInView);
            this.render();
            e.preventDefault();
            return;
        } else if (e.key === 'PageUp') {
            const frameInView = Math.floor((this.canvas.width - this.trackHeaderWidth) / this.frameWidth);
            this.scrollX = Math.max(0, this.scrollX - frameInView);
            this.render();
            e.preventDefault();
            return;
        } else if (e.key === 'PageDown') {
            const frameInView = Math.floor((this.canvas.width - this.trackHeaderWidth) / this.frameWidth);
            this.scrollX = Math.min(Math.max(0, this.frameCount - frameInView), this.scrollX + frameInView);
            this.render();
            e.preventDefault();
            return;
        }
        
        // Clip selection keyboard controls
        if (this.selectedClipTrack >= 0 && this.selectedClipTrack < this.tracks.length &&
            this.selectedClipIndex >= 0 && this.selectedClipIndex < this.tracks[this.selectedClipTrack].clips.length) {
            const clip = this.tracks[this.selectedClipTrack].clips[this.selectedClipIndex];
            const track = this.tracks[this.selectedClipTrack];
            
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.pushUndo();
                const move = e.ctrlKey ? 1 : this.snapGrid;
                if (e.key === 'ArrowLeft') {
                    if (clip.start - move >= 0) {
                        const overlap = track.clips.some(c => c !== clip &&
                            clip.start - move < c.start + c.length &&
                            clip.start - move + clip.length > c.start);
                        if (!overlap) clip.start -= move;
                    }
                } else {
                    const overlap = track.clips.some(c => c !== clip &&
                        clip.start + move < c.start + c.length &&
                        clip.start + move + clip.length > c.start);
                    if (!overlap) clip.start += move;
                }
                this.render();
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                if (this.selectedClipTrack > 0) {
                    this.pushUndo();
                    const destTrack = this.tracks[this.selectedClipTrack - 1];
                    const overlap = destTrack.clips.some(c =>
                        clip.start < c.start + c.length &&
                        clip.start + clip.length > c.start);
                    if (!overlap) {
                        track.clips.splice(this.selectedClipIndex, 1);
                        destTrack.clips.push(clip);
                        this.selectedClipTrack--;
                        this.selectedClipIndex = destTrack.clips.indexOf(clip);
                        this.render();
                    }
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (this.selectedClipTrack < this.tracks.length - 1) {
                    this.pushUndo();
                    const destTrack = this.tracks[this.selectedClipTrack + 1];
                    const overlap = destTrack.clips.some(c =>
                        clip.start < c.start + c.length &&
                        clip.start + clip.length > c.start);
                    if (!overlap) {
                        track.clips.splice(this.selectedClipIndex, 1);
                        destTrack.clips.push(clip);
                        this.selectedClipTrack++;
                        this.selectedClipIndex = destTrack.clips.indexOf(clip);
                        this.render();
                    }
                }
                e.preventDefault();
            } else if (e.key === 'Delete') {
                this.pushUndo();
                track.clips.splice(this.selectedClipIndex, 1);
                if (this.selectedClipIndex > 0) this.selectedClipIndex--;
                this.render();
                e.preventDefault();
            } else if (e.key === 'Enter') {
                this.editingTrackIndex = -1;
                this.editingClipTrackIndex = this.selectedClipTrack;
                this.editingClipIndex = this.selectedClipIndex;
                
                const clipY = this.getTrackY(this.selectedClipTrack);
                const clipX = this.trackHeaderWidth + (clip.start - this.scrollX) * this.frameWidth;
                const clipW = clip.length * this.frameWidth;
                const editRect = {
                    x: clipX + 2,
                    y: clipY + 4 + (this.tracks[this.selectedClipTrack].height - 8 - 20) / 2,
                    width: clipW - 4,
                    height: 20
                };
                this.showEditBox(editRect, clip.name);
                e.preventDefault();
            }
        } else if (this.selectedTrackIndex >= 0 && this.selectedTrackIndex < this.tracks.length) {
            // Track selection keyboard controls
            if (e.key === 'Delete') {
                this.pushUndo();
                this.tracks.splice(this.selectedTrackIndex, 1);
                if (this.selectedTrackIndex > 0) this.selectedTrackIndex--;
                this.render();
                e.preventDefault();
            } else if (e.key === 'ArrowUp') {
                if (this.selectedTrackIndex > 0) {
                    this.selectedTrackIndex--;
                    if (this.selectedTrackIndex < this.verticalScroll) {
                        this.verticalScroll = this.selectedTrackIndex;
                    }
                    this.render();
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                if (this.selectedTrackIndex < this.tracks.length - 1) {
                    this.selectedTrackIndex++;
                    const { lastVisible } = this.getVisibleTracksInfo();
                    if (this.selectedTrackIndex > lastVisible) {
                        this.verticalScroll = Math.min(this.selectedTrackIndex, this.maxVerticalScroll);
                    }
                    this.render();
                }
                e.preventDefault();
            } else if (e.key === 'Enter') {
                this.editingTrackIndex = this.selectedTrackIndex;
                this.editingClipTrackIndex = -1;
                this.editingClipIndex = -1;
                
                const trackY = this.getTrackY(this.selectedTrackIndex);
                const editRect = {
                    x: 4,
                    y: trackY + (this.tracks[this.selectedTrackIndex].height - 20) / 2,
                    width: this.trackHeaderWidth - 8,
                    height: 20
                };
                this.showEditBox(editRect, this.tracks[this.selectedTrackIndex].name);
                e.preventDefault();
            }
        } else if (e.key === 'Escape') {
            this.endEditing(false);
            e.preventDefault();
        }
    }
    
    // Context menu
    showContextMenu(x, y) {
        if (!this.contextMenu) return;
        const parentRect = this.getOverlayParentRect(this.contextMenu);
        this.contextMenu.style.left = (x - parentRect.left) + 'px';
        this.contextMenu.style.top = (y - parentRect.top) + 'px';
        this.contextMenu.style.display = 'block';
    }
    
    hideContextMenu() {
        if (!this.contextMenu) return;
        this.contextMenu.style.display = 'none';
    }
    
    // Edit box
    showEditBox(rect, text) {
        if (!this.editBox) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const parentRect = this.getOverlayParentRect(this.editBox);
        this.editBox.style.left = (canvasRect.left - parentRect.left + rect.x) + 'px';
        this.editBox.style.top = (canvasRect.top - parentRect.top + rect.y) + 'px';
        this.editBox.style.width = rect.width + 'px';
        this.editBox.style.height = rect.height + 'px';
        this.editBox.value = text;
        this.editBox.style.display = 'block';
        this.editBox.focus();
        this.editBox.select();
    }
    
    endEditing(save) {
        if (!this.editBox || this.editBox.style.display === 'none') return;
        
        const value = this.editBox.value.trim();
        this.editBox.style.display = 'none';
        
        if (save) {
            this.pushUndo();
            if (this.editingTrackIndex >= 0 && this.editingTrackIndex < this.tracks.length) {
                this.tracks[this.editingTrackIndex].name = value;
            } else if (this.editingClipTrackIndex >= 0 && this.editingClipTrackIndex < this.tracks.length &&
                       this.editingClipIndex >= 0 && this.editingClipIndex < this.tracks[this.editingClipTrackIndex].clips.length) {
                this.tracks[this.editingClipTrackIndex].clips[this.editingClipIndex].name = value;
            }
        }
        
        this.editingTrackIndex = -1;
        this.editingClipTrackIndex = -1;
        this.editingClipIndex = -1;
        this.render();
    }
    
    // Utility
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    // Events
    createClipEventArgs(detail = {}) {
        const clip = detail.clip || null;
        const track = detail.track || null;
        const trackIndex = Number.isInteger(detail.trackIndex)
            ? detail.trackIndex
            : this.tracks.indexOf(track);
        const clipIndex = track && clip ? track.clips.indexOf(clip) : -1;
        return {
            reason: detail.reason || '',
            clip,
            track,
            trackIndex,
            clipIndex,
            start: clip ? clip.start : undefined,
            length: clip ? clip.length : undefined,
            oldStart: detail.oldStart,
            oldLength: detail.oldLength,
            oldTrackIndex: detail.oldTrackIndex
        };
    }

    fireEvent(eventName, args = EventArgs.empty) {
        const handlers = this[eventName + 'Handlers'];
        if (handlers) {
            handlers.forEach(handler => handler(this, args));
        }
    }
    
    addEventListener(eventName, handler) {
        const handlers = this[eventName + 'Handlers'];
        if (handlers) {
            handlers.push(handler);
        }
    }
    
    // Rendering
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);
        
        // Draw timeline
        this.drawTimeline(ctx);
        
        // Calculate visible tracks
        const { firstVisible, lastVisible } = this.getVisibleTracksInfo();
        
        // Calculate max scroll
        const totalTracksHeight = this.tracks.reduce((sum, t) => sum + t.height, 0);
        const availableHeight = height - this.timelineHeight;
        this.maxVerticalScroll = Math.max(0, this.tracks.length - 1);
        
        if (totalTracksHeight > availableHeight) {
            let accHeight = 0;
            for (let i = this.tracks.length - 1; i >= 0; i--) {
                accHeight += this.tracks[i].height;
                if (accHeight >= availableHeight) {
                    this.maxVerticalScroll = i + 1;
                    break;
                }
            }
        } else {
            this.maxVerticalScroll = 0;
        }
        
        // Draw tracks
        let y = this.timelineHeight;
        for (let t = firstVisible; t <= lastVisible && t < this.tracks.length; t++) {
            const track = this.tracks[t];
            
            // Track background
            ctx.fillStyle = track.trackColor;
            ctx.fillRect(0, y, width, track.height);
            
            // Draw clips
            for (let c = 0; c < track.clips.length; c++) {
                const clip = track.clips[c];
                const clipX = this.trackHeaderWidth + (clip.start - this.scrollX) * this.frameWidth;
                const clipW = clip.length * this.frameWidth;
                const clipRect = { x: clipX, y: y + 4, width: clipW, height: track.height - 8 };
                
                // Clip background
                if (this.draggingClip && clip === this.dragClip) {
                    ctx.fillStyle = `rgba(${parseInt(clip.color.slice(1,3),16)}, ${parseInt(clip.color.slice(3,5),16)}, ${parseInt(clip.color.slice(5,7),16)}, 0.3)`;
                } else {
                    ctx.fillStyle = clip.color;
                }
                ctx.fillRect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
                
                // Clip border
                const isSelected = (this.selectedClipTrack === t && this.selectedClipIndex === c && (!this.editBox || this.editBox.style.display === 'none'));
                ctx.strokeStyle = (clip.selected || isSelected) ? '#ff8800' : '#b4b4b4';
                ctx.lineWidth = (clip.selected || isSelected) ? 2 : 1;
                ctx.strokeRect(clipRect.x, clipRect.y, clipRect.width, clipRect.height);
                
                // Clip text
                ctx.save();
                ctx.fillStyle = clip.textColor;
                ctx.font = '13px Segoe UI';
                ctx.textBaseline = 'middle';
                ctx.textAlign = 'left';
                
                // Clip text area
                ctx.beginPath();
                ctx.rect(clipRect.x + 4, clipRect.y, clipRect.width - 8, clipRect.height);
                ctx.clip();
                ctx.fillText(clip.name, clipRect.x + 4, clipRect.y + clipRect.height / 2);
                ctx.restore();
                
                // Resize handles
                if (clipW > 12) {
                    ctx.fillStyle = '#dcdcdc';
                    ctx.fillRect(clipRect.x, clipRect.y + 2, 5, clipRect.height - 4);
                    ctx.fillRect(clipRect.x + clipRect.width - 5, clipRect.y + 2, 5, clipRect.height - 4);
                }
            }
            
            y += track.height;
        }
        
        // Clip drag preview
        if (this.isMouseDown && this.draggingClip && this.dragClip && this.dragHoverTrack >= 0 && this.dragHoverTrack < this.tracks.length) {
            const previewY = this.getTrackY(this.dragHoverTrack);
            const previewClipX = this.trackHeaderWidth + (this.dragClip.start - this.scrollX) * this.frameWidth;
            const previewClipW = this.dragClip.length * this.frameWidth;
            const previewRect = {
                x: previewClipX,
                y: previewY + 4,
                width: previewClipW,
                height: this.tracks[this.dragHoverTrack].height - 8
            };
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
            ctx.fillRect(previewRect.x + 3, previewRect.y + 3, previewRect.width, previewRect.height);
            
            // Preview
            ctx.fillStyle = `rgba(${parseInt(this.dragClip.color.slice(1,3),16)}, ${parseInt(this.dragClip.color.slice(3,5),16)}, ${parseInt(this.dragClip.color.slice(5,7),16)}, 0.63)`;
            ctx.fillRect(previewRect.x, previewRect.y, previewRect.width, previewRect.height);
            
            // Check overlap
            let overlap = false;
            if (this.dragHoverTrack >= 0) {
                const tr = this.tracks[this.dragHoverTrack];
                overlap = tr.clips.some(c => c !== this.dragClip &&
                    this.dragClip.start < c.start + c.length &&
                    this.dragClip.start + this.dragClip.length > c.start);
            }
            
            ctx.strokeStyle = overlap ? '#ff0000' : '#00bfff';
            ctx.lineWidth = 2;
            ctx.strokeRect(previewRect.x, previewRect.y, previewRect.width, previewRect.height);
        }
        
        // Track headers
        y = this.timelineHeight;
        for (let t = firstVisible; t <= lastVisible && t < this.tracks.length; t++) {
            const track = this.tracks[t];
            
            // Header background
            ctx.fillStyle = '#323232';
            ctx.fillRect(0, y, this.trackHeaderWidth, track.height);
            
            // Selection highlight
            if (t === this.selectedTrackIndex && (!this.editBox || this.editBox.style.display === 'none')) {
                ctx.strokeStyle = '#1e90ff';
                ctx.lineWidth = 2;
                ctx.strokeRect(2, y + 2, this.trackHeaderWidth - 5, track.height - 5);
            }
            
            // Track name
            ctx.fillStyle = 'white';
            ctx.font = '13px Segoe UI';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(track.name, 4, y + track.height / 2);
            
            // Hover highlight
            if (t === this.hoveredTrackIndex) {
                this.hoveredTrackBounds = {
                    x: 1,
                    y: y + 1,
                    width: this.trackHeaderWidth - 3,
                    height: track.height - 3
                };
                ctx.strokeStyle = '#ff8800';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.hoveredTrackBounds.x, this.hoveredTrackBounds.y, 
                             this.hoveredTrackBounds.width, this.hoveredTrackBounds.height);
            }
            
            y += track.height;
        }
        
        // Snap guideline
        if (this.draggingClip && this.dragClip && this.snapGrid > 1) {
            const snapFrame = this.dragClip.start;
            const snapX = this.trackHeaderWidth + (snapFrame - this.scrollX) * this.frameWidth;
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(snapX, this.timelineHeight);
            ctx.lineTo(snapX, height);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Vertical scrollbar
        if (this.maxVerticalScroll > 0) {
            const sbWidth = 12;
            const sbHeight = Math.max(24, Math.floor(availableHeight / totalTracksHeight * availableHeight));
            const sbMaxY = height - this.timelineHeight - sbHeight;
            const sbY = this.timelineHeight + Math.floor(this.verticalScroll / this.maxVerticalScroll * sbMaxY);
            
            this.verticalScrollBarRect = {
                x: width - sbWidth,
                y: sbY,
                width: sbWidth,
                height: sbHeight
            };
            
            // Scrollbar background
            ctx.fillStyle = '#3c3c3c';
            ctx.fillRect(width - sbWidth, this.timelineHeight, sbWidth, height - this.timelineHeight);
            
            // Scrollbar thumb
            ctx.fillStyle = '#78b4dc';
            ctx.fillRect(this.verticalScrollBarRect.x, this.verticalScrollBarRect.y, 
                        this.verticalScrollBarRect.width, this.verticalScrollBarRect.height);
        } else {
            this.verticalScrollBarRect = { x: 0, y: 0, width: 0, height: 0 };
        }
        
        // Track drag guideline
        if (this.draggingTrack && this.dragHeaderTrackIndex !== -1 && this.dragOverTrackIndex !== -1) {
            const guideY = this.getTrackY(this.dragOverTrackIndex);
            ctx.strokeStyle = '#00bfff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, guideY);
            ctx.lineTo(width, guideY);
            ctx.stroke();
        }
        
        // Playhead
        const scrubX = this.trackHeaderWidth + (this.currentFrame - this.scrollX) * this.frameWidth;
        if (scrubX >= this.trackHeaderWidth && scrubX < width) {
            ctx.strokeStyle = '#ffc800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(scrubX, this.timelineHeight);
            ctx.lineTo(scrubX, height);
            ctx.stroke();
        }
        
        // Track borders
        y = this.timelineHeight;
        for (let t = firstVisible; t <= lastVisible && t < this.tracks.length; t++) {
            y += this.tracks[t].height;
            ctx.strokeStyle = '#505050';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, y - 1);
            ctx.lineTo(this.trackHeaderWidth, y - 1);
            ctx.stroke();
        }
        
        // Top border
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, this.timelineHeight);
        ctx.lineTo(width, this.timelineHeight);
        ctx.stroke();
        
        // Add track button
        if (this.tracks.length === 0 || lastVisible === this.tracks.length - 1) {
            const btnY = this.getTrackY(this.tracks.length) + 8;
            if (btnY < height - 24) {
                this.addTrackButtonRect = {
                    x: 4,
                    y: btnY,
                    width: this.trackHeaderWidth - 8,
                    height: 24
                };
                
                // Button background
                ctx.fillStyle = '#268cee';
                ctx.fillRect(this.addTrackButtonRect.x, this.addTrackButtonRect.y, 
                           this.addTrackButtonRect.width, this.addTrackButtonRect.height);
                
                // Button text
                ctx.fillStyle = 'white';
                ctx.font = '13px Segoe UI';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('+ Add track', 
                           this.addTrackButtonRect.x + this.addTrackButtonRect.width / 2,
                           this.addTrackButtonRect.y + this.addTrackButtonRect.height / 2);
                
                // Button border
                ctx.strokeStyle = '#5a5a5a';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.addTrackButtonRect.x, this.addTrackButtonRect.y, 
                             this.addTrackButtonRect.width, this.addTrackButtonRect.height);
            }
        }
    }
    
    drawTimeline(ctx) {
        const width = this.canvas.width;

        if (this.rulerMode === 'time') {
            this.drawTimeTimeline(ctx, width);
            return;
        }
        
        if (this.snapGrid > 0) {
            // Timeline background
            ctx.fillStyle = '#303030';
            ctx.fillRect(0, 0, width, this.timelineHeight);
            
            const visibleFrames = Math.floor((width - this.trackHeaderWidth) / this.frameWidth) + 2;
            const frameStart = this.scrollX;
            const frameEnd = this.scrollX + visibleFrames;
            
            // Grid lines
            for (let f = frameStart; f < frameEnd; f++) {
                const x = this.trackHeaderWidth + (f - this.scrollX) * this.frameWidth;
                
                if (f % this.barUnit === 0) {
                    // Bar line
                    ctx.strokeStyle = this.barColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, this.timelineHeight);
                    ctx.stroke();
                    
                    // Bar number
                    ctx.fillStyle = this.barColor;
                    ctx.font = '11px Segoe UI';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText((f / this.barUnit + 1).toString(), x + 2, 1);
                } else if (f % this.beatUnit === 0) {
                    // Beat line
                    ctx.strokeStyle = this.beatColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, this.timelineHeight);
                    ctx.stroke();
                } else {
                    // Tick line
                    ctx.strokeStyle = this.tickColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, this.timelineHeight - 8);
                    ctx.lineTo(x, this.timelineHeight);
                    ctx.stroke();
                }
            }
        } else {
            // Standard timeline
            ctx.fillStyle = '#303030';
            ctx.fillRect(0, 0, width, this.timelineHeight);
            
            const visibleFrames = Math.floor((width - this.trackHeaderWidth) / this.frameWidth) + 2;
            for (let i = 0; i < visibleFrames; i++) {
                const frame = i + this.scrollX;
                const x = this.trackHeaderWidth + i * this.frameWidth;
                
                if (frame % 10 === 0) {
                    ctx.strokeStyle = '#505050';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, this.timelineHeight);
                    ctx.stroke();
                    
                    ctx.fillStyle = '#d3d3d3';
                    ctx.font = '11px Segoe UI';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(frame.toString(), x + 2, 1);
                } else {
                    ctx.strokeStyle = '#464646';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, this.timelineHeight - 8);
                    ctx.lineTo(x, this.timelineHeight);
                    ctx.stroke();
                }
            }
        }
    }

    drawTimeTimeline(ctx, width) {
        ctx.fillStyle = '#303030';
        ctx.fillRect(0, 0, width, this.timelineHeight);

        const visibleFrames = Math.floor((width - this.trackHeaderWidth) / this.frameWidth) + 2;
        const visibleStartMs = this.scrollX * this.msPerFrame;
        const visibleEndMs = (this.scrollX + visibleFrames) * this.msPerFrame;
        const minorTickMs = Math.max(this.msPerFrame, Number(this.minorTickMs || this.msPerFrame));
        const majorTickMs = Math.max(minorTickMs, Number(this.majorTickMs || minorTickMs));
        const firstTickMs = Math.floor(visibleStartMs / minorTickMs) * minorTickMs;

        for (let ms = firstTickMs; ms <= visibleEndMs; ms += minorTickMs) {
            const frame = ms / this.msPerFrame;
            const x = this.trackHeaderWidth + (frame - this.scrollX) * this.frameWidth;
            if (x < this.trackHeaderWidth - this.frameWidth || x > width + this.frameWidth) continue;

            const isMajor = Math.abs(ms % majorTickMs) < 0.0001;
            if (isMajor) {
                ctx.strokeStyle = this.barColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.timelineHeight);
                ctx.stroke();

                ctx.fillStyle = this.barColor;
                ctx.font = '11px Segoe UI';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(this.formatTimeRulerLabel(ms), x + 2, 1);
            } else {
                ctx.strokeStyle = this.beatColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, this.timelineHeight - 12);
                ctx.lineTo(x, this.timelineHeight);
                ctx.stroke();
            }
        }
    }

    formatTimeRulerLabel(ms) {
        const totalMs = Math.max(0, Number(ms || 0));
        if (totalMs < 10000) {
            return `${(totalMs / 1000).toFixed(1)}s`;
        }
        const seconds = Math.floor(totalMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainSeconds = seconds % 60;
        return `${minutes}:${remainSeconds.toString().padStart(2, '0')}`;
    }
    
    // Public methods
    setSnapGrid(snap) {
        this.snapGrid = snap;
        this.render();
    }
    
    setSnapThreshold(threshold) {
        this.snapThreshold = threshold;
    }
    
    addTrack(name) {
        const track = this.createTrack(name || `Track ${this.tracks.length + 1}`);
        this.tracks.push(track);
        this.render();
        return track;
    }
    
    removeTrack(index) {
        if (index >= 0 && index < this.tracks.length) {
            this.tracks.splice(index, 1);
            this.render();
        }
    }
    
    addClip(trackIndex, name, start, length, color) {
        if (trackIndex >= 0 && trackIndex < this.tracks.length) {
            const clip = this.createClip(name, start, length, color);
            this.tracks[trackIndex].clips.push(clip);
            this.render();
            return clip;
        }
        return null;
    }
    
    removeClip(trackIndex, clipIndex) {
        if (trackIndex >= 0 && trackIndex < this.tracks.length) {
            const track = this.tracks[trackIndex];
            if (clipIndex >= 0 && clipIndex < track.clips.length) {
                track.clips.splice(clipIndex, 1);
                this.render();
            }
        }
    }
    
    getSelectedTrack() {
        return this.selectedTrack;
    }
    
    getSelectedClip() {
        return this.selectedClip;
    }
    
    setSelectedClip(clip) {
        if (this.selectedClip !== clip) {
            // Find the clip in tracks
            for (let t = 0; t < this.tracks.length; t++) {
                const track = this.tracks[t];
                for (let c = 0; c < track.clips.length; c++) {
                    if (track.clips[c] === clip) {
                        this.selectedClipTrack = t;
                        this.selectedClipIndex = c;
                        this.selectedTrackIndex = t;
                        
                        // Clear all selections
                        this.tracks.forEach(tr => tr.clips.forEach(cc => cc.selected = false));
                        clip.selected = true;
                        
                        this.selectedClip = clip;
                        this.fireEvent('clipSelected');
                        this.fireEvent('selectedClipChanged');
                        
                        this.render();
                        return;
                    }
                }
            }
        }
    }
}

if (typeof module === 'object' && module.exports) {
  module.exports = { TimelineEditor };
} else if (typeof globalThis !== 'undefined') {
  globalThis.TimelineEditor = TimelineEditor;
}
