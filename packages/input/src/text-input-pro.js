        // Advanced TextInput Pro Class
        class TextInputPro {
            constructor(container, options = {}) {
                // Core elements
                this.container = container;
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.input = document.createElement('input');
                
                // Dimensions
                this.width = options.width || 120;
                this.height = options.height || 26;
                this.canvas.width = this.width;
                this.canvas.height = this.height;
                
                // Core state
                this._text = options.text || "0";
                this._value = parseFloat(this._text) || 0;
                this._hovered = false;
                this._editing = false;
                this._isNumeric = options.isNumeric !== undefined ? options.isNumeric : true;
                this._step = options.step || 1;
                this._min = options.min !== undefined ? options.min : 0;
                this._max = options.max !== undefined ? options.max : 100;
                this._unit = options.unit || "";
                this._format = options.format || "0.##";
                this._fillColor = options.fillColor || 'rgba(60, 120, 200, 0.5)';
                
                // Advanced features
                this.mathMode = options.mathMode || false;
                this.units = options.units || null;
                this.currentUnitIndex = 0;
                this.history = [];
                this.historyIndex = -1;
                this.maxHistory = options.maxHistory || 50;
                this.presets = options.presets || [];
                this.bookmarks = options.bookmarks || {};
                this.linkedInputs = [];
                this.linkMode = options.linkMode || 'relative';
                this.dynamicStep = options.dynamicStep || false;
                this.stepRules = options.stepRules || [];
                this.sparkline = options.sparkline || false;
                this.sparklineData = [];
                this.heatmap = options.heatmap || false;
                this.showDelta = options.showDelta || false;
                this.dragMode = options.dragMode || 'linear';
                this.multiValue = options.multiValue || false;
                this.colorMode = options.colorMode || false;
                this.validation = options.validation || null;
                this.formatter = options.formatter || null;
                this.contextMenuItems = options.contextMenu || this.getDefaultContextMenu();
                this.contextMenuElement = options.contextMenuElement || null;
                this.contextMenuId = options.contextMenuId || 'contextMenu';
                this.animationDuration = options.animationDuration || 300;
                this.hapticFeedback = options.hapticFeedback || false;
                this.audioFeedback = options.audioFeedback || false;

                // ──   (Bug Fix) ─────────────────────────────
                this.wheeling         = options.wheeling !== undefined ? options.wheeling : true;
                this.clampMode        = options.clampMode || 'hard';
                this.softClampFactor  = options.softClampFactor !== undefined ? options.softClampFactor : 0.1;
                this.dragSensitivity  = options.dragSensitivity  !== undefined ? options.dragSensitivity  : 1;
                this.dragAcceleration = options.dragAcceleration || false;
                
                // Animation state
                this._animatedValue = this._value;
                this._targetValue = this._value;
                this._animationStartTime = null;
                this._animationStartValue = null;
                this._animationLoopRunning = false;
                
                // Drag state
                this.dragging = false;
                this.dragStartX = 0;
                this.dragStartY = 0;
                this.dragStartValue = 0;
                this.dragAccumulator = 0;
                this.altDragging = false;
                this.rightClickDragging = false;
                this.linkedDragging = false;
                this.prevClientX = 0;      //    
                this.prevClientY = 0;
                this.hasDragged = false;   //     (click )
                
                // UI state
                this.hoverAlpha = 1;
                this.arrowAlpha = 0;
                this.animationTimer = null;
                this.leftArrow = { x: 0, y: 0, w: 0, h: 0 };
                this.rightArrow = { x: 0, y: 0, w: 0, h: 0 };
                
                // Event callbacks
                this.onValueChanged = options.onValueChanged || null;
                this.onUnitChanged = options.onUnitChanged || null;
                
                // Math constants and functions
                this.mathConstants = {
                    'pi': Math.PI,
                    'e': Math.E,
                    'phi': 1.618033988749895, // Golden ratio
                    'sqrt2': Math.SQRT2,
                    'sqrt3': Math.sqrt(3)
                };
                
                this.mathFunctions = {
                    'sin': Math.sin,
                    'cos': Math.cos,
                    'tan': Math.tan,
                    'asin': Math.asin,
                    'acos': Math.acos,
                    'atan': Math.atan,
                    'sqrt': Math.sqrt,
                    'pow': Math.pow,
                    'exp': Math.exp,
                    'log': Math.log,
                    'log10': Math.log10,
                    'abs': Math.abs,
                    'round': Math.round,
                    'floor': Math.floor,
                    'ceil': Math.ceil,
                    'min': Math.min,
                    'max': Math.max
                };
                
                // Initialize
                this.setupDOM();
                this.bindEvents();
                this.render();
                
                // Start animation loop if needed
                if (this.sparkline || this._targetValue !== this._animatedValue) {
                    this.startAnimationLoop();
                }
                
                // Record initial value in history
                this.addToHistory(this._text);
            }
            
            setupDOM() {
                this.container.appendChild(this.canvas);
                this.container.appendChild(this.input);
                this.input.type = 'text';
                
                // Create sparkline canvas if needed
                if (this.sparkline) {
                    this.sparklineCanvas = document.createElement('canvas');
                    this.sparklineCanvas.className = 'sparkline';
                    this.sparklineCanvas.width = this.width;
                    this.sparklineCanvas.height = this.height;
                    this.sparklineCtx = this.sparklineCanvas.getContext('2d');
                    this.container.appendChild(this.sparklineCanvas);
                }
            }
            
            bindEvents() {
                // Mouse events - bind directly without arrow functions for proper 'this' context
                this.canvas.addEventListener('mouseenter', this.onMouseEnter.bind(this));
                this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
                this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
                
                // Global mouse events for drag
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
                document.addEventListener('mouseup', this.onMouseUp.bind(this));
                
                this.canvas.addEventListener('click', this.onClick.bind(this));
                this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
                this.canvas.addEventListener('wheel', this.onWheel.bind(this));
                this.canvas.addEventListener('contextmenu', this.onContextMenu.bind(this));
                // onContextMenu  e.preventDefault()  —   
                
                // Touch events
                this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
                this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
                this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
                
                // Input events
                this.input.addEventListener('blur', this.endEdit.bind(this));
                this.input.addEventListener('keydown', this.onInputKeyDown.bind(this));
                this.input.addEventListener('input', this.onInputChange.bind(this));
                
                // Global events
                document.addEventListener('keydown', this.onGlobalKeyDown.bind(this));
            }
            
            // Core value management
            get value() {
                if (this.multiValue && Array.isArray(this._value)) {
                    return this._value;
                }
                return this._value;
            }
            
            set value(val) {
                // Ensure val is a valid number or array
                if (this.multiValue && Array.isArray(val)) {
                    this._value = val.map(v => parseFloat(v) || 0);
                    this._text = val.join(', ');
                } else {
                    if (this._isNumeric) {
                        const numericValue = parseFloat(val);
                        if (isNaN(numericValue)) {
                            console.warn('Invalid numeric value:', val);
                            this._text = val;
                            return;
                        }
                        this._value = this.clampValue(numericValue);
                        this._text = this.formatValue(this._value);
                    } else {
                        this._value = val;
                        this._text = val;
                    }
                }
                
                //      Apply
                if (this.dragging) {
                    this._animatedValue = this._value;
                    this._targetValue = this._value;
                } else {
                    //    Apply
                    this.animateToValue(this._value);
                }
                
                this.addToHistory(this._text);
                this.updateSparkline();
                this.render();
                
                if (this.onValueChanged) {
                    this.onValueChanged(this._value, this._text);
                }
            }
            
            animateToValue(targetValue, duration = null) {
                const numericTarget = parseFloat(targetValue);
                if (isNaN(numericTarget)) {
                    console.warn('Invalid target value for animation:', targetValue);
                    return;
                }
                
                this._targetValue = this.clampValue(numericTarget);
                this._animationStartTime = performance.now();
                this._animationStartValue = this._animatedValue || this._value || 0;
                this._animationDuration = duration || this.animationDuration;
                
                if (!this.animationTimer) {
                    this.startAnimationLoop();
                }
            }
            
            // Expression evaluation
            evaluateExpression(expr) {
                if (!this.mathMode) return parseFloat(expr);
                
                try {
                    // Replace constants
                    let processedExpr = expr.toLowerCase();
                    for (const [name, value] of Object.entries(this.mathConstants)) {
                        processedExpr = processedExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), value);
                    }
                    
                    // Replace $prev with current value
                    processedExpr = processedExpr.replace(/\$prev/g, this._value);
                    
                    // Replace functions
                    for (const [name, func] of Object.entries(this.mathFunctions)) {
                        processedExpr = processedExpr.replace(
                            new RegExp(`${name}\\s*\\(`, 'g'),
                            `this.mathFunctions.${name}(`
                        );
                    }
                    
                    // Evaluate
                    const result = new Function('return ' + processedExpr).call(this);
                    return isNaN(result) ? this._value : result;
                } catch (e) {
                    console.error('Expression evaluation error:', e);
                    return this._value;
                }
            }
            
            // Unit conversion
            convertUnit(value, fromUnit, toUnit) {
                if (!this.units || fromUnit === toUnit) return value;
                
                // Example conversions for CSS units
                const conversions = {
                    'px_to_em': (val) => val / 16,
                    'em_to_px': (val) => val * 16,
                    'px_to_rem': (val) => val / 16,
                    'rem_to_px': (val) => val * 16,
                    'px_to_%': (val) => (val / this.width) * 100,
                    '%_to_px': (val) => (val / 100) * this.width,
                    'px_to_vw': (val) => (val / window.innerWidth) * 100,
                    'vw_to_px': (val) => (val / 100) * window.innerWidth
                };
                
                const key = `${fromUnit}_to_${toUnit}`;
                if (conversions[key]) {
                    return conversions[key](value);
                }
                
                // Try indirect conversion through px
                const throughPx = `${fromUnit}_to_px`;
                const fromPx = `px_to_${toUnit}`;
                if (conversions[throughPx] && conversions[fromPx]) {
                    return conversions[fromPx](conversions[throughPx](value));
                }
                
                return value;
            }
            
            // History management
            addToHistory(value) {
                if (this.history.length === 0 || this.history[this.historyIndex] !== value) {
                    this.history = this.history.slice(0, this.historyIndex + 1);
                    this.history.push(value);
                    if (this.history.length > this.maxHistory) {
                        this.history.shift();
                    } else {
                        this.historyIndex++;
                    }
                }
            }
            
            undo() {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this._text = this.history[this.historyIndex];
                    this._value = this.parseValue(this._text);
                    this.render();
                    if (this.onValueChanged) {
                        this.onValueChanged(this._value, this._text);
                    }
                }
            }
            
            redo() {
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this._text = this.history[this.historyIndex];
                    this._value = this.parseValue(this._text);
                    this.render();
                    if (this.onValueChanged) {
                        this.onValueChanged(this._value, this._text);
                    }
                }
            }
            
            // Dynamic step calculation
            getDynamicStep(value) {
                if (!this.dynamicStep || this.stepRules.length === 0) {
                    return this._step;
                }
                
                for (const rule of this.stepRules) {
                    if (value >= rule.range[0] && value < rule.range[1]) {
                        return rule.step;
                    }
                }
                
                return this._step;
            }
            
            // Sparkline
            updateSparkline() {
                if (!this.sparkline) return;
                
                const numericValue = parseFloat(this._value) || 0;
                if (!isNaN(numericValue)) {
                    this.sparklineData.push(numericValue);
                    if (this.sparklineData.length > 50) {
                        this.sparklineData.shift();
                    }
                }
            }
            
            drawSparkline() {
                if (!this.sparkline || this.sparklineData.length < 2) return;
                
                const ctx = this.sparklineCtx;
                ctx.clearRect(0, 0, this.width, this.height);
                
                const min = Math.min(...this.sparklineData);
                const max = Math.max(...this.sparklineData);
                const range = max - min || 1;
                
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                this.sparklineData.forEach((val, i) => {
                    const x = (i / (this.sparklineData.length - 1)) * this.width;
                    const y = this.height - ((val - min) / range) * this.height;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                });
                
                ctx.stroke();
            }
            
            // Value formatting and parsing
            formatValue(value) {
                if (this.formatter && this.formatter.display) {
                    return this.formatter.display(value);
                }
                
                if (this.multiValue && Array.isArray(value)) {
                    return value.map(v => this.formatSingleValue(v)).join(', ');
                }
                
                return this.formatSingleValue(value);
            }
            
            formatSingleValue(value) {
                const decimals = this._format.includes('.') ? 
                    (this._format.split('.')[1] || '').length : 0;
                return value.toFixed(decimals);
            }
            
            parseValue(text) {
                if (this.formatter && this.formatter.parse) {
                    return this.formatter.parse(text);
                }
                
                if (this.multiValue) {
                    const parts = text.split(',').map(s => s.trim());
                    return parts.map(p => this.parseSingleValue(p));
                }
                
                return this.parseSingleValue(text);
            }
            
            parseSingleValue(text) {
                if (this.mathMode) {
                    return this.evaluateExpression(text);
                }
                
                if (this.colorMode) {
                    return this.parseColor(text);
                }
                
                return parseFloat(text) || 0;
            }
            
            parseColor(text) {
                // Simple color parsing
                if (text.startsWith('#')) {
                    return text;
                } else if (text.startsWith('rgb')) {
                    return text;
                } else if (text.startsWith('hsl')) {
                    return text;
                }
                return text;
            }
            
            clampValue(value) {
                if (this.multiValue && Array.isArray(value)) {
                    return value.map(v => this.clampSingleValue(v));
                }
                return this.clampSingleValue(value);
            }
            
            clampSingleValue(value) {
                //  : switch case  const Line  {}  SyntaxError 
                switch (this.clampMode) {
                    case 'soft': {
                        const range = this._max - this._min;
                        const factor = this.softClampFactor || 0.1;
                        if (value < this._min) {
                            const excess = this._min - value;
                            const resistance = 1 - Math.exp(-excess / (range * factor));
                            return this._min - range * factor * resistance;
                        } else if (value > this._max) {
                            const excess = value - this._max;
                            const resistance = 1 - Math.exp(-excess / (range * factor));
                            return this._max + range * factor * resistance;
                        }
                        return value;
                    }
                    case 'wrap': {
                        const wrapRange = this._max - this._min;
                        if (wrapRange <= 0) return value;
                        if (value < this._min) {
                            return this._max - ((this._min - value) % wrapRange);
                        } else if (value > this._max) {
                            return this._min + ((value - this._max) % wrapRange);
                        }
                        return value;
                    }
                    case 'bounce': {
                        let bounceValue = value;
                        let iter = 0;
                        while ((bounceValue < this._min || bounceValue > this._max) && iter++ < 20) {
                            if (bounceValue < this._min) {
                                bounceValue = this._min + (this._min - bounceValue);
                            } else if (bounceValue > this._max) {
                                bounceValue = this._max - (bounceValue - this._max);
                            }
                        }
                        return bounceValue;
                    }
                    case 'hard':
                    default:
                        return Math.max(this._min, Math.min(this._max, value));
                }
            }
            
            // Event handlers
            onMouseEnter(e) {
                this._hovered = true;
                this.startAnimation();
            }
            
            onMouseLeave(e) {
                this._hovered = false;
                // dragging document  mouseup End —    
                this.startAnimation();
            }
            
            onMouseDown(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Check if clicking on arrows
                if (this.pointInRect(x, y, this.leftArrow) || 
                    this.pointInRect(x, y, this.rightArrow)) {
                    return;
                }
                
                if (this._isNumeric && !this._editing) {
                    this.dragging        = true;
                    this.dragStartX      = e.clientX;
                    this.dragStartY      = e.clientY;
                    this.prevClientX     = e.clientX;   //   
                    this.prevClientY     = e.clientY;
                    this.dragStartValue  = this._value; // parseFloat(_text)    
                    this.dragAccumulator = 0;
                    this.hasDragged      = false;       //  vs   
                    this.dragStartTime   = performance.now();
                    this.dragLastTime    = this.dragStartTime;
                    this.dragVelocity    = 0;
                    this.altDragging         = e.altKey;
                    this.rightClickDragging  = e.button === 2;
                    this.linkedDragging      = e.altKey && this.linkedInputs.length > 0;

                    //  Start      
                    this._animatedValue = this._value;
                    this._targetValue   = this._value;

                    if (this.linkedDragging) {
                        this.linkedInputs.forEach(input => {
                            input.dragStartValue  = input._value;
                            input._animatedValue  = input._value;
                            input._targetValue    = input._value;
                        });
                    }

                    this.canvas.style.cursor = this.altDragging ? 'ns-resize' : 'ew-resize';

                    if (this.hapticFeedback && navigator.vibrate) {
                        navigator.vibrate(10);
                    }
                }
            }
            
            onMouseMove(e) {
                if (!this.dragging || !this._isNumeric) return;

                // ──    (  ) ───────────────────
                //  :          
                const incrX = e.clientX - this.prevClientX;
                const incrY = e.clientY - this.prevClientY;
                this.prevClientX = e.clientX;
                this.prevClientY = e.clientY;

                const delta = this.altDragging ? -incrY : incrX;

                //     (2px   )
                if (Math.abs(incrX) > 2 || Math.abs(incrY) > 2) {
                    this.hasDragged = true;
                }

                //   ( )
                const now      = performance.now();
                const timeDelta = now - this.dragLastTime;
                if (timeDelta > 0) {
                    this.dragVelocity = Math.abs(delta) / timeDelta;
                }
                this.dragLastTime = now;

                //  
                let step = this.getDynamicStep(this._value);
                if (this.rightClickDragging) step *= 10;
                step *= (this.dragSensitivity || 1);

                if (this.dragAcceleration && this.dragVelocity > 0) {
                    const accel = Math.min(this.dragVelocity * 2, 5);
                    step *= (1 + accel);
                }

                if (e.shiftKey) step *= 0.1;
                if (e.ctrlKey)  step *= 0.01;

                // ──      ──────────────────────────
                let newValue = this._value;

                switch (this.dragMode) {
                    case 'linear': {
                        //   : 3px = 1 step 
                        this.dragAccumulator += delta;
                        const pixelsPerStep = 3;
                        const steps = Math.trunc(this.dragAccumulator / pixelsPerStep);
                        if (steps !== 0) {
                            this.dragAccumulator -= steps * pixelsPerStep;
                            newValue = this._value + steps * step;
                        }
                        break;
                    }
                    case 'exponential': {
                        //   :   
                        const totalDelta = this.altDragging
                            ? -(e.clientY - this.dragStartY)
                            :  (e.clientX - this.dragStartX);
                        newValue = this.dragStartValue
                            + Math.sign(totalDelta)
                            * Math.pow(Math.abs(totalDelta) * 0.05, 1.5)
                            * step;
                        break;
                    }
                    case 'logarithmic': {
                        //   :    
                        const totalDelta = this.altDragging
                            ? -(e.clientY - this.dragStartY)
                            :  (e.clientX - this.dragStartX);
                        newValue = this.dragStartValue
                            + Math.sign(totalDelta)
                            * Math.log(Math.abs(totalDelta) + 1)
                            * step * 0.5;
                        break;
                    }
                }

                if (newValue !== this._value) {
                    const oldValue = this._value;

                    //   setter  — /   
                    this._value         = this.clampValue(newValue);
                    this._text          = this.formatValue(this._value);
                    this._animatedValue = this._value;
                    this._targetValue   = this._value;
                    this.updateSparkline();
                    this.render();
                    if (this.onValueChanged) this.onValueChanged(this._value, this._text);

                    //     
                    if (this.linkedDragging && this.linkedInputs.length > 0) {
                        const actualChange = this._value - oldValue;
                        this.linkedInputs.forEach(input => {
                            input._value         = input.clampValue(input._value + actualChange);
                            input._text          = input.formatValue(input._value);
                            input._animatedValue = input._value;
                            input._targetValue   = input._value;
                            input.render();
                            if (input.onValueChanged) input.onValueChanged(input._value, input._text);
                        });
                    }
                }
            }
            
            onMouseUp(e) {
                const wasDragging = this.dragging;
                this.dragging = false;
                this.canvas.style.cursor = 'pointer';
                this.dragLastTime = performance.now();

                //        
                if (wasDragging && this.hasDragged) {
                    this.addToHistory(this._text);
                }

                if (this._animatedValue !== this._targetValue) {
                    this.startAnimationLoop();
                }
            }
            
            onClick(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                if (this._hovered && !this._editing) {
                    // Arrow   
                    if (this._isNumeric) {
                        if (this.pointInRect(x, y, this.leftArrow)) {
                            this.value = this._value - this.getDynamicStep(this._value);
                            return;
                        } else if (this.pointInRect(x, y, this.rightArrow)) {
                            this.value = this._value + this.getDynamicStep(this._value);
                            return;
                        }
                    }

                    //       
                    //  :  timeSinceDragEnd   200ms   
                    if (!this.hasDragged) {
                        this.beginEdit();
                    }
                }
            }
            
            onDoubleClick(e) {
                this.beginEdit();
            }
            
            onWheel(e) {
                e.preventDefault();
                if (!this._isNumeric || !this.wheeling) return;
                
                const currentValue = parseFloat(this._text) || 0;
                let step = this.getDynamicStep(currentValue);
                
                // Apply modifier keys for precision
                if (e.shiftKey) step *= 0.1;   // Fine adjustment
                if (e.ctrlKey) step *= 0.01;   // Ultra-fine adjustment
                if (e.altKey) step *= 10;      // Coarse adjustment
                
                const delta = Math.sign(e.deltaY) * -step;
                this.value = currentValue + delta; // set value  onValueChanged 

                if (this.audioFeedback) {
                    this.playTickSound();
                }
                //  : set value  onValueChanged + render  —  
            }
            
            onContextMenu(e) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
            
            onTouchStart(e) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                // Simulate mouse events
                this.onMouseDown({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    button: 0,
                    altKey: e.altKey
                });
            }
            
            onTouchMove(e) {
                e.preventDefault();
                const touch = e.touches[0];
                
                this.onMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
            
            onTouchEnd(e) {
                this.onMouseUp({});
            }
            
            onGlobalKeyDown(e) {
                if (!this._hovered && !this._editing) return;
                
                // History shortcuts
                if (e.ctrlKey && e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.ctrlKey && e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
                
                // Preset shortcuts
                if (e.key === ' ' && this.presets.length > 0) {
                    e.preventDefault();
                    this.showPresetPopup();
                }
                
                // Arrow key shortcuts
                if (!this._editing) {
                    switch (e.key) {
                        case 'ArrowUp':
                            e.preventDefault();
                            this.value = this._value + this.getDynamicStep(this._value);
                            break;
                        case 'ArrowDown':
                            e.preventDefault();
                            this.value = this._value - this.getDynamicStep(this._value);
                            break;
                        case 'PageUp':
                            e.preventDefault();
                            this.value = this._value + this.getDynamicStep(this._value) * 10;
                            break;
                        case 'PageDown':
                            e.preventDefault();
                            this.value = this._value - this.getDynamicStep(this._value) * 10;
                            break;
                        case 'Home':
                            e.preventDefault();
                            this.value = this._min;
                            break;
                        case 'End':
                            e.preventDefault();
                            this.value = this._max;
                            break;
                    }
                }
            }
            
            // Remove the onGlobalMouseUp method entirely since we're handling mouseup differently now
            
            onInputKeyDown(e) {
                if (e.key === 'Enter') {
                    this.endEdit(true);
                } else if (e.key === 'Escape') {
                    this.endEdit(false);
                }
            }
            
            onInputChange(e) {
                if (this.validation) {
                    if (!this.validation.test(this.input.value)) {
                        this.input.style.color = '#ff6666';
                    } else {
                        this.input.style.color = 'white';
                    }
                }
            }
            
            // UI Methods
            beginEdit() {
                this._editing = true;
                this.input.value = this._text;
                this.input.style.display = 'block';
                this.input.style.left = '4px';
                this.input.style.top = '4px';
                this.input.style.width = (this.width - 8) + 'px';
                this.input.style.height = (this.height - 8) + 'px';
                this.input.focus();
                this.input.select();
                this.render();
            }
            
            endEdit(apply = true) {
                this._editing = false;
                
                if (apply && this.input.value !== this._text) {
                    this._text = this.input.value;
                    this._value = this.parseValue(this._text);
                    this.animateToValue(this._value);
                    this.addToHistory(this._text);
                    
                    if (this.onValueChanged) {
                        this.onValueChanged(this._value, this._text);
                    }
                }
                
                this.input.style.display = 'none';
                this.render();
            }
            
            showContextMenu(x, y) {
                const menu = this.contextMenuElement || document.getElementById(this.contextMenuId);
                if (!menu) return;
                menu.innerHTML = '';
                
                this.contextMenuItems.forEach(item => {
                    if (item.type === 'separator') {
                        const separator = document.createElement('div');
                        separator.className = 'context-menu-separator';
                        menu.appendChild(separator);
                    } else {
                        const menuItem = document.createElement('div');
                        menuItem.className = 'context-menu-item';
                        menuItem.textContent = item.label;
                        menuItem.onclick = () => {
                            item.action.call(this);
                            menu.style.display = 'none';
                        };
                        menu.appendChild(menuItem);
                    }
                });
                
                menu.style.display = 'block';
                menu.style.left = x + 'px';
                menu.style.top = y + 'px';
                
                // Hide on click outside
                const hideMenu = (e) => {
                    if (!menu.contains(e.target)) {
                        menu.style.display = 'none';
                        document.removeEventListener('click', hideMenu);
                    }
                };
                setTimeout(() => document.addEventListener('click', hideMenu), 0);
            }
            
            showPresetPopup() {
                const popup = document.getElementById('presetPopup');
                popup.innerHTML = '';
                
                this.presets.forEach(preset => {
                    const item = document.createElement('div');
                    item.className = 'preset-item';
                    item.textContent = preset;
                    item.onclick = () => {
                        this.value = preset;
                        popup.style.display = 'none';
                    };
                    popup.appendChild(item);
                });
                
                const rect = this.canvas.getBoundingClientRect();
                popup.style.display = 'block';
                popup.style.left = rect.left + 'px';
                popup.style.top = (rect.bottom + 5) + 'px';
                
                // Hide on click outside
                const hidePopup = (e) => {
                    if (!popup.contains(e.target)) {
                        popup.style.display = 'none';
                        document.removeEventListener('click', hidePopup);
                    }
                };
                setTimeout(() => document.addEventListener('click', hidePopup), 0);
            }
            
            showTooltip(text, x, y) {
                const tooltip = document.getElementById('tooltip');
                tooltip.textContent = text;
                tooltip.style.display = 'block';
                tooltip.style.left = x + 'px';
                tooltip.style.top = (y - 30) + 'px';
            }
            
            hideTooltip() {
                document.getElementById('tooltip').style.display = 'none';
            }
            
            // Animation
            startAnimation() {
                if (this.animationTimer) return;
                
                this.animationTimer = setInterval(() => {
                    this.animate();
                }, 30);
            }
            
            startAnimationLoop() {
                if (this._animationLoopRunning) return;
                this._animationLoopRunning = true;
                
                const animate = () => {
                    this.updateAnimatedValue();
                    this.render();
                    
                    if (this.sparkline) {
                        this.drawSparkline();
                    }
                    
                    //  Completed  
                    if (Math.abs(this._animatedValue - this._targetValue) < 0.001) {
                        this._animationLoopRunning = false;
                        return;
                    }
                    
                    requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }
            
            updateAnimatedValue() {
                if (this._animatedValue === this._targetValue) return;
                
                const now = performance.now();
                const elapsed = now - this._animationStartTime;
                const progress = Math.min(elapsed / this._animationDuration, 1);
                
                // Easing function (ease-out-cubic)
                const eased = 1 - Math.pow(1 - progress, 3);
                
                this._animatedValue = this._animationStartValue + 
                    (this._targetValue - this._animationStartValue) * eased;
                
                if (progress >= 1) {
                    this._animatedValue = this._targetValue;
                }
            }
            
            animate() {
                let needInvalidate = false;
                
                const targetAlpha = this._hovered ? 0.5 : 1;
                if (Math.abs(this.hoverAlpha - targetAlpha) > 0.05) {
                    this.hoverAlpha += (this._hovered ? -0.1 : 0.1);
                    this.hoverAlpha = Math.max(0, Math.min(1, this.hoverAlpha));
                    needInvalidate = true;
                }
                
                const targetArrowAlpha = this._hovered ? 1 : 0;
                if (Math.abs(this.arrowAlpha - targetArrowAlpha) > 0.05) {
                    this.arrowAlpha += (this._hovered ? 0.1 : -0.1);
                    this.arrowAlpha = Math.max(0, Math.min(1, this.arrowAlpha));
                    needInvalidate = true;
                }
                
                if (needInvalidate) {
                    this.render();
                } else {
                    clearInterval(this.animationTimer);
                    this.animationTimer = null;
                }
            }
            
            // Rendering
            render() {
                const ctx = this.ctx;
                const width = this.width;
                const height = this.height;
                
                // Clear
                ctx.clearRect(0, 0, width, height);
                
                // Background
                const baseColor = [40, 40, 40];
                const hoverColor = [60, 60, 60];
                const bgColor = this.blendColors(baseColor, hoverColor, this.hoverAlpha);
                ctx.fillStyle = `rgb(${Math.round(bgColor[0])}, ${Math.round(bgColor[1])}, ${Math.round(bgColor[2])})`;
                ctx.fillRect(0, 0, width, height);
                
                // Fill bar (with heatmap color if enabled)
                let percent = 0;
                if (this._isNumeric && !this.multiValue) {
                    //  : formatter   parseFloat(this._text)   
                    // this._value   
                    const displayValue = this.dragging
                        ? this._value
                        : (this._animatedValue !== undefined && !isNaN(this._animatedValue))
                            ? this._animatedValue
                            : this._value;
                    
                    if (this._max > this._min) {
                        percent = Math.max(0, Math.min(1, 
                            (displayValue - this._min) / (this._max - this._min)));
                    }
                }
                
                const fillWidth = width * percent;
                if (fillWidth > 0) {
                    if (this.heatmap) {
                        const hue = (1 - percent) * 240; // Blue to red
                        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.5)`;
                    } else {
                        ctx.fillStyle = this._fillColor;
                    }
                    ctx.fillRect(0, 0, fillWidth, height);
                }
                
                // Text
                if (!this._editing) {
                    ctx.fillStyle = 'white';
                    ctx.font = '14px Segoe UI, Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    let displayText = this._text;
                    
                    // Show delta if enabled
                    if (this.showDelta && this.dragging && this._isNumeric) {
                        const currentVal = parseFloat(this._value) || 0;
                        const startVal = parseFloat(this.dragStartValue) || 0;
                        const delta = currentVal - startVal;
                        if (!isNaN(delta)) {
                            const sign = delta >= 0 ? '+' : '';
                            displayText += ` (${sign}${delta.toFixed(2)})`;
                        }
                    }
                    
                    // Add unit
                    if (this._unit) {
                        displayText += ' ' + this._unit;
                    }
                    
                    // Color preview
                    if (this.colorMode && this._text.match(/^#[0-9a-f]{6}$/i)) {
                        ctx.fillStyle = this._text;
                        ctx.fillRect(width - 20, 4, 16, height - 8);
                        ctx.fillStyle = 'white';
                    }
                    
                    ctx.fillText(displayText, width / 2, height / 2);
                }
                
                // Arrows
                if (this._isNumeric && this.arrowAlpha > 0 && !this._editing) {
                    this.leftArrow = { x: 2, y: 2, w: 20, h: height - 4 };
                    this.rightArrow = { x: width - 22, y: 2, w: 20, h: height - 4 };
                    
                    this.drawArrow(this.leftArrow, 'left', this.arrowAlpha);
                    this.drawArrow(this.rightArrow, 'right', this.arrowAlpha);
                }
                
                // Border
                ctx.strokeStyle = 'rgb(80, 80, 80)';
                ctx.lineWidth = 1;
                ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
            }
            
            drawArrow(rect, direction, alpha) {
                const ctx = this.ctx;
                const cx = rect.x + rect.w / 2;
                const cy = rect.y + rect.h / 2;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                
                if (direction === 'left') {
                    ctx.moveTo(cx + 4, cy - 5);
                    ctx.lineTo(cx - 2, cy);
                    ctx.lineTo(cx + 4, cy + 5);
                } else {
                    ctx.moveTo(cx - 4, cy - 5);
                    ctx.lineTo(cx + 2, cy);
                    ctx.lineTo(cx - 4, cy + 5);
                }
                
                ctx.closePath();
                ctx.fill();
            }
            
            // Utility methods
            blendColors(base, hover, alpha) {
                return [
                    base[0] + (hover[0] - base[0]) * alpha,
                    base[1] + (hover[1] - base[1]) * alpha,
                    base[2] + (hover[2] - base[2]) * alpha
                ];
            }
            
            pointInRect(x, y, rect) {
                return x >= rect.x && x <= rect.x + rect.w &&
                       y >= rect.y && y <= rect.y + rect.h;
            }
            
            playTickSound() {
                // Simple audio feedback
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.05);
            }
            
            getDefaultContextMenu() {
                return [
                    { label: 'Reset', action: () => this.value = (this._max + this._min) / 2 },
                    { label: 'Copy', action: () => navigator.clipboard.writeText(this._text) },
                    { label: 'Paste', action: async () => {
                        const text = await navigator.clipboard.readText();
                        this._text = text;
                        this.value = this.parseValue(text);
                    }},
                    { type: 'separator' },
                    { label: 'Undo (Ctrl+Z)', action: () => this.undo() },
                    { label: 'Redo (Ctrl+Y)', action: () => this.redo() },
                    { type: 'separator' },
                    { label: 'Min Value', action: () => this.value = this._min },
                    { label: 'Max Value', action: () => this.value = this._max }
                ];
            }
            
            // Linking support
            linkTo(otherInput) {
                if (!this.linkedInputs.includes(otherInput)) {
                    this.linkedInputs.push(otherInput);
                    otherInput.linkedInputs.push(this);
                }
            }
            
            unlinkFrom(otherInput) {
                const index = this.linkedInputs.indexOf(otherInput);
                if (index > -1) {
                    this.linkedInputs.splice(index, 1);
                    const otherIndex = otherInput.linkedInputs.indexOf(this);
                    if (otherIndex > -1) {
                        otherInput.linkedInputs.splice(otherIndex, 1);
                    }
                }
            }
        }

if (typeof module === 'object' && module.exports) {
  module.exports = { TextInputPro };
} else if (typeof globalThis !== 'undefined') {
  globalThis.TextInputPro = TextInputPro;
}
