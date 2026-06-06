/**
 * ColorPicker
 * Canvas HSV color picker.
 */
class ColorPicker {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // ─── layout settings ─────────────────────────────
        this.WHEEL_D   = 166;  // color wheel diameter
        this.SLIDER_GAP = 5;   // ↔ 
        this.SLIDER_W  = 14;   //   Width
        this.PAD       = 2;    // overall padding

        const W = this.PAD * 2 + this.WHEEL_D + this.SLIDER_GAP + this.SLIDER_W;
        const H = this.PAD * 2 + this.WHEEL_D;
        canvas.width  = W;
        canvas.height = H;

        // ─── color state ─────────────────────────────────
        this._h = 0;     // Hue  0–360
        this._s = 0;     // Sat  0–1
        this._v = 0.46;  // Val  0–1
        this._a = 1.0;   // Alpha 0–1

        // ─── interaction state ─────────────────────────────
        this._drag = null;  // null | 'wheel' | 'vslider'

        // ─── cache ──────────────────────────────────────
        this._wheelCache     = null;
        this._wheelCacheSize = -1;

        // ─── callbacks ──────────────────────────────────────
        this.onColorChanged = null;

        // ─── event registration ───────────────────────────────
        canvas.addEventListener('mousedown',  e => this._onDown(e));
        canvas.addEventListener('mousemove',  e => this._onMove(e));
        canvas.addEventListener('mouseup',    () => { this._drag = null; });
        canvas.addEventListener('mouseleave', () => { this._drag = null; });

        this.render();
    }

    // ════════════════════════════════════════════════════
    // layout helpers
    // ════════════════════════════════════════════════════

    _wheelRect() {
        const r = this.WHEEL_D / 2;
        const cx = this.PAD + r;
        const cy = this.PAD + r;
        return { x: this.PAD, y: this.PAD, w: this.WHEEL_D, h: this.WHEEL_D, r, cx, cy };
    }

    _sliderRect() {
        return {
            x: this.PAD + this.WHEEL_D + this.SLIDER_GAP,
            y: this.PAD,
            w: this.SLIDER_W,
            h: this.WHEEL_D
        };
    }

    // ════════════════════════════════════════════════════
    // rendering
    // ════════════════════════════════════════════════════

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this._drawWheel();
        this._drawMarker();
        this._drawVSlider();
        this._drawVHandle();
    }

    _drawWheel() {
        const ctx = this.ctx;
        const wr = this._wheelRect();
        const d  = this.WHEEL_D;
        const r  = wr.r;

        //   (Hue/Sat, Val=1) cache
        if (this._wheelCacheSize !== d) {
            const off    = document.createElement('canvas');
            off.width    = d;
            off.height   = d;
            const oCtx   = off.getContext('2d');
            const img    = oCtx.createImageData(d, d);
            const px     = img.data;

            for (let y = 0; y < d; y++) {
                for (let x = 0; x < d; x++) {
                    const dx   = x - r;
                    const dy   = y - r;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > r) continue;

                    const s = dist / r;
                    let   h = Math.atan2(dy, dx) * 180 / Math.PI;
                    if (h < 0) h += 360;

                    const c   = this._hsv2rgb(h, s, 1.0);
                    const idx = (y * d + x) * 4;
                    px[idx]     = c.r;
                    px[idx + 1] = c.g;
                    px[idx + 2] = c.b;
                    px[idx + 3] = 255;
                }
            }

            oCtx.putImageData(img, 0, 0);
            this._wheelCache     = off;
            this._wheelCacheSize = d;
        }

        // Circle    
        ctx.save();
        ctx.beginPath();
        ctx.arc(wr.cx, wr.cy, r, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(this._wheelCache, wr.x, wr.y);

        //  (V)   
        if (this._v < 1.0) {
            ctx.fillStyle = `rgba(0,0,0,${1 - this._v})`;
            ctx.fillRect(wr.x, wr.y, wr.w, wr.h);
        }

        ctx.restore();

        //  
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(wr.cx, wr.cy, r - 0.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawMarker() {
        const ctx  = this.ctx;
        const wr   = this._wheelRect();
        const angle = this._h * Math.PI / 180;
        const dist  = this._s * wr.r;
        const mx    = wr.cx + Math.cos(angle) * dist;
        const my    = wr.cy + Math.sin(angle) * dist;

        //  Circle ()
        ctx.strokeStyle = 'white';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.arc(mx, my, 5, 0, Math.PI * 2);
        ctx.stroke();

        //  Circle (, )
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.arc(mx, my, 5.5, 0, Math.PI * 2);
        ctx.stroke();
    }

    _drawVSlider() {
        const ctx = this.ctx;
        const sr  = this._sliderRect();

        // →:     → 
        const topC = this._hsv2rgb(this._h, this._s, 1.0);
        const grad = ctx.createLinearGradient(0, sr.y, 0, sr.y + sr.h);
        grad.addColorStop(0, `rgb(${topC.r},${topC.g},${topC.b})`);
        grad.addColorStop(1, 'rgb(0,0,0)');

        ctx.fillStyle = grad;
        this._roundRect(ctx, sr.x, sr.y, sr.w, sr.h, 3);
        ctx.fill();

        //  
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth   = 1;
        this._roundRect(ctx, sr.x, sr.y, sr.w, sr.h, 3);
        ctx.stroke();
    }

    _drawVHandle() {
        const ctx = this.ctx;
        const sr  = this._sliderRect();
        // val=1 → (y=sr.y), val=0 → (y=sr.y+sr.h)
        const y   = sr.y + (1 - this._v) * sr.h;

        //  Line
        ctx.strokeStyle = 'white';
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(sr.x,          y);
        ctx.lineTo(sr.x + sr.w,   y);
        ctx.stroke();

        //   
        ctx.fillStyle = 'white';
        const ts = 4; // triangle size

        //  
        ctx.beginPath();
        ctx.moveTo(sr.x - 1,      y);
        ctx.lineTo(sr.x - 1 + ts, y - ts + 1);
        ctx.lineTo(sr.x - 1 + ts, y + ts - 1);
        ctx.closePath();
        ctx.fill();

        //  
        ctx.beginPath();
        ctx.moveTo(sr.x + sr.w + 1,      y);
        ctx.lineTo(sr.x + sr.w + 1 - ts, y - ts + 1);
        ctx.lineTo(sr.x + sr.w + 1 - ts, y + ts - 1);
        ctx.closePath();
        ctx.fill();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    // ════════════════════════════════════════════════════
    //  
    // ════════════════════════════════════════════════════

    _hsv2rgb(h, s, v) {
        const hi = Math.floor(h / 60) % 6;
        const f  = h / 60 - Math.floor(h / 60);
        const vv = Math.round(v * 255);
        const p  = Math.round(v * (1 - s) * 255);
        const q  = Math.round(v * (1 - f * s) * 255);
        const t  = Math.round(v * (1 - (1 - f) * s) * 255);
        switch (hi) {
            case 0: return { r: vv, g: t,  b: p  };
            case 1: return { r: q,  g: vv, b: p  };
            case 2: return { r: p,  g: vv, b: t  };
            case 3: return { r: p,  g: q,  b: vv };
            case 4: return { r: t,  g: p,  b: vv };
            default:return { r: vv, g: p,  b: q  };
        }
    }

    _rgb2hsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d   = max - min;
        let   h   = 0;
        const s   = max === 0 ? 0 : d / max;
        const v   = max;
        if (d !== 0) {
            if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
            else if (max === g) h = ((b - r) / d + 2) * 60;
            else                h = ((r - g) / d + 4) * 60;
        }
        return { h, s, v };
    }

    _rgbToHex(r, g, b) {
        return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    _hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const n = parseInt(hex, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    // ════════════════════════════════════════════════════
    // public API
    // ════════════════════════════════════════════════════

    get color() {
        const c = this._hsv2rgb(this._h, this._s, this._v);
        return {
            r: c.r, g: c.g, b: c.b,
            h: this._h, s: this._s, v: this._v,
            a: Math.round(this._a * 255),
            alpha: this._a,
            hex: this._rgbToHex(c.r, c.g, c.b)
        };
    }

    get selectedColor() { return this.color; }

    set selectedColor(c) {
        if (c.r !== undefined) {
            const hsv = this._rgb2hsv(c.r, c.g, c.b);
            this._h = hsv.h; this._s = hsv.s; this._v = hsv.v;
        }
        if (c.h !== undefined) this._h = c.h;
        if (c.s !== undefined) this._s = c.s;
        if (c.v !== undefined) this._v = c.v;
        if (c.a !== undefined) this._a = c.a / 255;
        if (c.alpha !== undefined) this._a = c.alpha;
        this._clamp();
        this.render();
        this._fire();
    }

    setHSV(h, s, v) {
        if (h !== undefined) this._h = h;
        if (s !== undefined) this._s = s;
        if (v !== undefined) this._v = v;
        this._clamp();
        this.render();
        this._fire();
    }

    setRGB(r, g, b) {
        const hsv = this._rgb2hsv(r, g, b);
        this._h = hsv.h; this._s = hsv.s; this._v = hsv.v;
        this._clamp();
        this.render();
        this._fire();
    }

    setAlpha(a) {
        this._a = a;
        this._clamp();
        this.render();
        this._fire();
    }

    _clamp() {
        this._h = Math.max(0, Math.min(360, this._h));
        this._s = Math.max(0, Math.min(1,   this._s));
        this._v = Math.max(0, Math.min(1,   this._v));
        this._a = Math.max(0, Math.min(1,   this._a));
    }

    _fire() {
        if (this.onColorChanged) this.onColorChanged(this.color);
    }

    // ════════════════════════════════════════════════════
    // mouse handling
    // ════════════════════════════════════════════════════

    _pt(e) {
        const b = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - b.left) * this.canvas.width  / b.width,
            y: (e.clientY - b.top)  * this.canvas.height / b.height
        };
    }

    _onDown(e) {
        const pt = this._pt(e);
        const wr = this._wheelRect();
        const sr = this._sliderRect();
        const dx = pt.x - wr.cx;
        const dy = pt.y - wr.cy;

        if (dx * dx + dy * dy <= wr.r * wr.r) {
            this._drag = 'wheel';
            this._applyWheel(pt);
        } else if (pt.x >= sr.x && pt.x <= sr.x + sr.w &&
                   pt.y >= sr.y && pt.y <= sr.y + sr.h) {
            this._drag = 'vslider';
            this._applyVSlider(pt);
        }
    }

    _onMove(e) {
        if (!this._drag) return;
        const pt = this._pt(e);
        if (this._drag === 'wheel')   this._applyWheel(pt);
        else                          this._applyVSlider(pt);
    }

    _applyWheel(pt) {
        const wr   = this._wheelRect();
        const dx   = pt.x - wr.cx;
        const dy   = pt.y - wr.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this._s    = Math.min(1, dist / wr.r);
        let h      = Math.atan2(dy, dx) * 180 / Math.PI;
        if (h < 0) h += 360;
        this._h = h;
        this.render();
        this._fire();
    }

    _applyVSlider(pt) {
        const sr = this._sliderRect();
        const t  = Math.max(0, Math.min(1, (pt.y - sr.y) / sr.h));
        this._v  = 1 - t;
        this.render();
        this._fire();
    }
}

if (typeof module === 'object' && module.exports) {
  module.exports = { ColorPicker };
} else if (typeof globalThis !== 'undefined') {
  globalThis.ColorPicker = ColorPicker;
}
