/* Crafted Quarters – signature image clean-up (runs fully on the device)
 * Takes a photo/scan of a handwritten signature, removes the paper background
 * (including uneven lighting and shadows), recolours the ink, trims the edges
 * and returns a transparent PNG data URL.
 */
const SIG = (() => {
  const INKS = { navy: [12, 35, 90], black: [20, 20, 24], blue: [16, 64, 160], original: null };

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open that image. Please use a JPG or PNG photo.')); };
      img.src = url;
    });
  }

  // Box blur via integral image – estimates the local paper brightness
  function localBackground(lum, w, h, r) {
    const W1 = w + 1, integ = new Float64Array(W1 * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += lum[y * w + x];
        integ[(y + 1) * W1 + x + 1] = integ[y * W1 + x + 1] + row;
      }
    }
    const bg = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const s = integ[y1 * W1 + x1] - integ[y0 * W1 + x1] - integ[y1 * W1 + x0] + integ[y0 * W1 + x0];
        bg[y * w + x] = s / ((x1 - x0) * (y1 - y0));
      }
    }
    return bg;
  }

  /**
   * @param {HTMLImageElement|HTMLCanvasElement} src
   * @param {{sensitivity?:number, ink?:string}} opts sensitivity 1 (keep only dark ink) … 10 (keep faint strokes)
   */
  function clean(src, opts = {}) {
    const sensitivity = Math.min(10, Math.max(1, opts.sensitivity || 5));
    const ink = INKS[opts.ink || 'navy'];
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    const k = Math.min(1, 1400 / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);          // flatten any existing transparency onto white
    ctx.drawImage(src, 0, 0, w, h);
    const im = ctx.getImageData(0, 0, w, h), px = im.data;

    // 1. luminance
    const n = w * h, lum = new Float32Array(n);
    for (let i = 0; i < n; i++) lum[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];

    // 2. local paper brightness (handles shadows / uneven light). Blur twice for smoothness.
    const r = Math.max(8, Math.round(Math.max(w, h) / 30));
    let bg = localBackground(lum, w, h, r);
    // lift background towards the brighter of local mean & pixel, so thick ink doesn't darken its own background estimate
    for (let i = 0; i < n; i++) bg[i] = Math.max(bg[i], lum[i]);
    bg = localBackground(bg, w, h, Math.round(r / 2));

    // 3. ink strength = how much darker than the paper around it
    const lo = 34 - sensitivity * 2.6;   // below this: paper
    const hi = lo + 42;                  // above this: solid ink
    const alpha = new Uint8ClampedArray(n);
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let i = 0; i < n; i++) {
      const d = bg[i] - lum[i];
      let a = (d - lo) / (hi - lo);
      a = a <= 0 ? 0 : a >= 1 ? 255 : Math.round(a * 255);
      alpha[i] = a;
    }

    // 4. remove isolated specks (pixels with almost no inked neighbours)
    const clean = new Uint8ClampedArray(n);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x; if (!alpha[i]) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dy || dx) && alpha[i + dy * w + dx] > 60) nb++;
      clean[i] = nb >= 2 ? alpha[i] : 0;
    }

    // 5. write pixels (recolour ink) and find bounds
    for (let i = 0; i < n; i++) {
      const a = clean[i];
      if (a > 50) { const x = i % w, y = (i / w) | 0; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      if (ink) { px[i * 4] = ink[0]; px[i * 4 + 1] = ink[1]; px[i * 4 + 2] = ink[2]; }
      else { // original colour, deepened slightly so it prints well
        px[i * 4] = Math.max(0, px[i * 4] - 40); px[i * 4 + 1] = Math.max(0, px[i * 4 + 1] - 40); px[i * 4 + 2] = Math.max(0, px[i * 4 + 2] - 40);
      }
      px[i * 4 + 3] = a;
    }
    if (maxX < 0) throw new Error('No signature was found in that picture. Sign in dark ink on plain white paper and photograph it in good light.');
    ctx.putImageData(im, 0, 0);

    // 6. trim to the signature with a small margin
    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.04) + 4;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1, ch = maxY - minY + 1;
    const out = document.createElement('canvas');
    const k2 = Math.min(1, 900 / cw);
    out.width = Math.round(cw * k2); out.height = Math.round(ch * k2);
    const octx = out.getContext('2d');
    octx.imageSmoothingQuality = 'high';
    octx.drawImage(c, minX, minY, cw, ch, 0, 0, out.width, out.height);
    const coverage = clean.reduce((a, v) => a + (v > 50 ? 1 : 0), 0) / n;
    return { dataUrl: out.toDataURL('image/png'), width: out.width, height: out.height, coverage };
  }

  return { loadImage, clean, INKS };
})();
