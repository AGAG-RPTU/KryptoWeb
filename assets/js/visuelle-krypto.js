/*
 * Visual cryptography after Naor and Shamir (1994), for the page "Visual".
 *
 * A black-and-white motif is split into two shares. Every motif pixel becomes
 * 2 × 2 subpixels, two of them black: ▚ or ▞. Share A gets one of the two by
 * coin flip; share B gets the same pattern for a white pixel and the other one
 * for a black pixel. Stacked, black pixels are fully black and white pixels
 * half black. Each share alone is uniformly random.
 *
 * Everything runs in the browser; chosen images never leave the device.
 */
(() => {
  "use strict";

  const root = document.getElementById("vk");
  if (!root) return;

  // 2 × 2 subpixels row by row, 1 = black
  const PATTERNS = [
    [1, 0, 0, 1], // ▚
    [0, 1, 1, 0], // ▞
  ];

  const BLACK = "#000";
  const WHITE = "#fff";

  const MAX_MOTIF_PX = 200; // longer side of the motif
  const SHAPE_PX = 640; // drawing resolution of the built-in shapes
  const TEXT_PX = 200; // font size of the text motif before scaling down
  const IMAGE_PX = 1600; // chosen images are first reduced to this size
  const THRESHOLD = 128; // luminance below which a pixel counts as black
  const DEFAULT_FINENESS = { smiley: 28, herz: 28, stern: 28, schloss: 28, text: 16, bild: 80 };

  const PREVIEW_W = 160; // CSS px
  const PREVIEW_H = 120;
  const PRINT_PX = 2000; // longer side of the pattern in a downloaded PNG

  const STAGE_MARGIN = 12; // CSS px around the foils
  const FOIL_GAP = 16; // CSS px between the foils when apart
  const GLIDE_MS = 600; // matches the transition in visuelle-krypto.css

  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

  const MESSAGES = {
    apart: "Zieh eine Folie mit der Maus oder dem Finger auf die andere.",
    close: "Noch nicht genau: Die Folien müssen Punkt für Punkt übereinanderliegen.",
    aligned: "Deckungsgleich – jetzt erscheint das Motiv.",
    noImage: "Wähle zuerst ein Bild aus.",
    badImage: "Dieses Bild kann der Browser nicht lesen.",
  };

  const $ = (id) => document.getElementById(id);
  const stage = $("vk-tisch");
  const statusLine = $("vk-status");
  const preview = $("vk-vorschau");
  const sizeOutput = $("vk-groesse");
  const textInput = $("vk-text");
  const fileInput = $("vk-datei");
  const fileName = $("vk-dateiname");
  const thresholdInput = $("vk-schwelle");
  const finenessInput = $("vk-feinheit");
  const invertInput = $("vk-umkehren");
  const kindInputs = root.querySelectorAll('input[name="vk-motiv"]');

  const foils = ["a", "b"].map((name) => {
    const el = $("vk-folie-" + name);
    return { name, el, canvas: el.querySelector("canvas"), share: null, x: 0, y: 0 };
  });
  const [foilA, foilB] = foils;

  const state = { kind: "smiley", image: null, w: 0, h: 0, coins: null };
  let geometry = null; // set by layout()
  let drag = null;
  let glideTimer = 0;

  // ---------------------------------------------------------------------------
  // Motifs: opaque canvases, black on white, at high resolution

  function blankCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = WHITE;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    return c;
  }

  function fillEllipse(ctx, x, y, rx, ry) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
    ctx.fill();
  }

  // drawn in the unit square
  const SHAPES = {
    smiley(ctx) {
      fillEllipse(ctx, 0.5, 0.5, 0.45, 0.45);
      ctx.fillStyle = WHITE;
      fillEllipse(ctx, 0.35, 0.37, 0.06, 0.09);
      fillEllipse(ctx, 0.65, 0.37, 0.06, 0.09);
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 0.075;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0.5, 0.5, 0.26, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    },

    herz(ctx) {
      ctx.beginPath();
      ctx.moveTo(0.5, 0.9);
      ctx.bezierCurveTo(0.12, 0.64, 0.02, 0.44, 0.1, 0.26);
      ctx.bezierCurveTo(0.2, 0.06, 0.45, 0.08, 0.5, 0.28);
      ctx.bezierCurveTo(0.55, 0.08, 0.8, 0.06, 0.9, 0.26);
      ctx.bezierCurveTo(0.98, 0.44, 0.88, 0.64, 0.5, 0.9);
      ctx.fill();
    },

    stern(ctx) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.2 : 0.48;
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx.lineTo(0.5 + r * Math.cos(angle), 0.54 + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    },

    schloss(ctx) {
      ctx.lineWidth = 0.1;
      ctx.beginPath();
      ctx.moveTo(0.3, 0.5);
      ctx.lineTo(0.3, 0.32);
      ctx.arc(0.5, 0.32, 0.2, Math.PI, 2 * Math.PI);
      ctx.lineTo(0.7, 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(0.17, 0.45, 0.66, 0.5, 0.07);
      ctx.fill();

      // keyhole
      ctx.fillStyle = WHITE;
      fillEllipse(ctx, 0.5, 0.63, 0.07, 0.07);
      ctx.beginPath();
      ctx.moveTo(0.47, 0.65);
      ctx.lineTo(0.44, 0.83);
      ctx.lineTo(0.56, 0.83);
      ctx.lineTo(0.53, 0.65);
      ctx.fill();
    },
  };

  function shapeCanvas(kind) {
    const c = blankCanvas(SHAPE_PX, SHAPE_PX);
    const ctx = c.getContext("2d");
    ctx.scale(SHAPE_PX, SHAPE_PX);
    SHAPES[kind](ctx);
    return c;
  }

  // cropped to the ink, plus a margin
  function textCanvas(text) {
    const font = `bold ${TEXT_PX}px sans-serif`;
    const probe = document.createElement("canvas").getContext("2d");
    probe.font = font;
    const m = probe.measureText(text);
    const pad = Math.round(0.15 * TEXT_PX);

    const c = blankCanvas(
      Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + 2 * pad,
      Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + 2 * pad,
    );
    const ctx = c.getContext("2d");
    ctx.font = font;
    ctx.fillText(text, pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent);
    return c;
  }

  // transparent areas become white
  function imageCanvas(img) {
    const scale = Math.min(1, IMAGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = blankCanvas(w, h);
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return c;
  }

  function sourceCanvas() {
    if (state.kind === "text") return textCanvas(textInput.value.trim());
    if (state.kind === "bild") return state.image;
    return shapeCanvas(state.kind);
  }

  // The shorter side gets `fineness` pixels, the longer one at most MAX_MOTIF_PX.
  function motifSize(aspect, fineness) {
    let w = aspect >= 1 ? fineness * aspect : fineness;
    let h = aspect >= 1 ? fineness : fineness / aspect;
    const scale = Math.min(1, MAX_MOTIF_PX / Math.max(w, h));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
    return { w, h };
  }

  // Returns w × h pixels, 1 = black.
  function rasterize(source, w, h, threshold, invert) {
    // Halve step by step: a single large reduction would skip source pixels.
    let src = source;
    while (src.width >= 2 * w && src.height >= 2 * h) {
      const half = document.createElement("canvas");
      half.width = Math.ceil(src.width / 2);
      half.height = Math.ceil(src.height / 2);
      half.getContext("2d").drawImage(src, 0, 0, half.width, half.height);
      src = half;
    }

    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const ctx = out.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, w, h);
    const rgba = ctx.getImageData(0, 0, w, h).data;

    const motif = new Uint8Array(w * h);
    for (let i = 0; i < motif.length; i++) {
      const luminance = 0.299 * rgba[4 * i] + 0.587 * rgba[4 * i + 1] + 0.114 * rgba[4 * i + 2];
      motif[i] = (luminance < threshold) !== invert ? 1 : 0;
    }
    return motif;
  }

  // ---------------------------------------------------------------------------
  // Shares

  function coinFlips(n) {
    const coins = new Uint8Array(n); // n ≤ 200 × 200, below the limit of 65536
    crypto.getRandomValues(coins);
    for (let i = 0; i < n; i++) coins[i] &= 1;
    return coins;
  }

  // One canvas pixel per subpixel: black, or transparent like a clear foil.
  function shareCanvas(motif, coins, w, h, isB) {
    const cols = 2 * w;
    const c = document.createElement("canvas");
    c.width = cols;
    c.height = 2 * h;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(cols, 2 * h);
    const rgba = img.data; // RGB stays 0, so only alpha is set

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const pattern = PATTERNS[isB ? coins[i] ^ motif[i] : coins[i]];
        const topLeft = 2 * y * cols + 2 * x;
        const cells = [topLeft, topLeft + 1, topLeft + cols, topLeft + cols + 1];
        for (let j = 0; j < 4; j++) rgba[4 * cells[j] + 3] = pattern[j] ? 255 : 0;
      }
    }

    ctx.putImageData(img, 0, 0);
    return c;
  }

  function drawPreview(motif, w, h) {
    preview.width = w;
    preview.height = h;
    const ctx = preview.getContext("2d");
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < motif.length; i++) {
      const v = motif[i] ? 0 : 255;
      img.data.set([v, v, v, 255], 4 * i);
    }
    ctx.putImageData(img, 0, 0);

    const scale = Math.min(PREVIEW_W / w, PREVIEW_H / h);
    preview.style.width = `${w * scale}px`;
    preview.style.height = `${h * scale}px`;
  }

  function rebuild(reroll) {
    const source = sourceCanvas();
    if (!source) {
      say(MESSAGES.noImage);
      return;
    }

    const { w, h } = motifSize(source.width / source.height, Number(finenessInput.value));
    const threshold = state.kind === "bild" ? Number(thresholdInput.value) : THRESHOLD;
    const motif = rasterize(source, w, h, threshold, invertInput.checked);

    const resized = w !== state.w || h !== state.h;
    if (reroll || resized) state.coins = coinFlips(w * h);
    state.w = w;
    state.h = h;

    foilA.share = shareCanvas(motif, state.coins, w, h, false);
    foilB.share = shareCanvas(motif, state.coins, w, h, true);
    drawPreview(motif, w, h);
    sizeOutput.textContent = `${w} × ${h} Pixel`;

    if (resized || !geometry) layout(true);
    else repaint();
  }

  // ---------------------------------------------------------------------------
  // Stage: two foils that can be dragged onto each other

  function boxExtra(el) {
    const s = getComputedStyle(el);
    const sum = (...names) => names.reduce((total, name) => total + parseFloat(s[name]), 0);
    return {
      x: sum("paddingLeft", "paddingRight", "borderLeftWidth", "borderRightWidth"),
      y: sum("paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"),
    };
  }

  function paint(f) {
    const { k, scale } = geometry;
    const { width: cols, height: rows } = f.share;
    f.canvas.width = cols * k;
    f.canvas.height = rows * k;
    f.canvas.style.width = `${cols * scale}px`;
    f.canvas.style.height = `${rows * scale}px`;
    const ctx = f.canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(f.share, 0, 0, f.canvas.width, f.canvas.height);
  }

  function repaint() {
    foils.forEach(paint);
  }

  function place(f) {
    f.el.style.transform = `translate(${f.x}px, ${f.y}px)`;
  }

  function isAligned() {
    return Math.abs(foilA.x - foilB.x) < 0.01 && Math.abs(foilA.y - foilB.y) < 0.01;
  }

  function overlapping() {
    return Math.abs(foilA.x - foilB.x) < geometry.fw && Math.abs(foilA.y - foilB.y) < geometry.fh;
  }

  function say(message) {
    if (statusLine.textContent !== message) statusLine.textContent = message;
  }

  function updateStatus() {
    const aligned = isAligned();
    stage.classList.toggle("vk-deckung", aligned);
    say(aligned ? MESSAGES.aligned : overlapping() ? MESSAGES.close : MESSAGES.apart);
  }

  // Sizes the foils to the stage and puts them back to their places, side by
  // side or one above the other, whichever shows them clearly larger.
  function layout(keepAligned) {
    const aligned = keepAligned && geometry && isAligned();
    const cols = foilA.share.width;
    const rows = foilA.share.height;
    const aspect = cols / rows;
    const width = stage.clientWidth;
    const box = boxExtra(foilA.el);
    const viewport = Math.min(window.innerHeight, 1000);

    const sideBySide = Math.min(
      (width - 2 * STAGE_MARGIN - FOIL_GAP) / 2 - box.x,
      (0.7 * viewport - 2 * STAGE_MARGIN - box.y) * aspect,
    );
    const stacked = Math.min(
      width - 2 * STAGE_MARGIN - box.x,
      ((0.85 * viewport - 2 * STAGE_MARGIN - FOIL_GAP) / 2 - box.y) * aspect,
    );
    const vertical = stacked > 1.25 * sideBySide;
    const target = Math.max(40, vertical ? stacked : sideBySide);

    // whole device pixels per subpixel keep the dots crisp
    const dpr = window.devicePixelRatio || 1;
    const k = Math.max(1, Math.floor((target * dpr) / cols));
    const scale = Math.min(k / dpr, target / cols); // CSS px per subpixel
    const fw = cols * scale + box.x;
    const fh = rows * scale + box.y;
    const snapToDevice = (v) => Math.round(v * dpr) / dpr;

    let home;
    let height;
    if (vertical) {
      const x = snapToDevice((width - fw) / 2);
      home = [
        { x, y: STAGE_MARGIN },
        { x, y: snapToDevice(STAGE_MARGIN + fh + FOIL_GAP) },
      ];
      height = 2 * fh + FOIL_GAP + 2 * STAGE_MARGIN;
    } else {
      const x = snapToDevice((width - 2 * fw - FOIL_GAP) / 2);
      home = [
        { x, y: STAGE_MARGIN },
        { x: snapToDevice(x + fw + FOIL_GAP), y: STAGE_MARGIN },
      ];
      height = fh + 2 * STAGE_MARGIN;
    }

    geometry = { k, scale, fw, fh, width, height, home };
    stage.style.height = `${height}px`;
    repaint();
    foils.forEach((f, i) => Object.assign(f, home[i]));
    if (aligned) Object.assign(foilB, { x: foilA.x, y: foilA.y });
    foils.forEach(place);
    updateStatus();
  }

  function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  }

  // No snapping: the motif fading in during the last subpixel is the point.
  // Whole CSS pixels of offset to the other foil keep exact alignment
  // reachable by hand and both foils on the device pixel grid.
  function moveTo(f, x, y) {
    const other = f === foilA ? foilB : foilA;
    f.x = other.x + Math.round(clamp(x, 0, geometry.width - geometry.fw) - other.x);
    f.y = other.y + Math.round(clamp(y, 0, geometry.height - geometry.fh) - other.y);
    place(f);
    updateStatus();
  }

  function raise(f) {
    for (const g of foils) g.el.style.zIndex = g === f ? 2 : 1;
  }

  function glide(move) {
    stage.classList.add("vk-gleiten");
    move();
    foils.forEach(place);
    updateStatus();
    clearTimeout(glideTimer);
    glideTimer = setTimeout(() => stage.classList.remove("vk-gleiten"), GLIDE_MS);
  }

  function attachDragging(f) {
    f.el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      stage.classList.remove("vk-gleiten");
      f.el.setPointerCapture(e.pointerId);
      drag = { pointer: e.pointerId, dx: f.x - e.clientX, dy: f.y - e.clientY };
      raise(f);
    });

    f.el.addEventListener("pointermove", (e) => {
      if (!drag || drag.pointer !== e.pointerId) return;
      moveTo(f, e.clientX + drag.dx, e.clientY + drag.dy);
    });

    const end = (e) => {
      if (drag && drag.pointer === e.pointerId) drag = null;
    };
    f.el.addEventListener("pointerup", end);
    f.el.addEventListener("pointercancel", end);

    // one CSS pixel per key press, ten with Shift
    f.el.addEventListener("keydown", (e) => {
      const d = ARROWS[e.key];
      if (!d) return;
      e.preventDefault();
      raise(f);
      const step = e.shiftKey ? 10 : 1;
      moveTo(f, f.x + d[0] * step, f.y + d[1] * step);
    });
  }

  // ---------------------------------------------------------------------------
  // Download for printing: black on white, enlarged, with registration crosses

  function drawCrosses(ctx, width, height, margin) {
    const arm = 0.3 * margin;
    ctx.lineWidth = Math.max(2, Math.round(margin / 40));
    ctx.beginPath();
    for (const x of [margin / 2, width - margin / 2]) {
      for (const y of [margin / 2, height - margin / 2]) {
        ctx.moveTo(x - arm, y);
        ctx.lineTo(x + arm, y);
        ctx.moveTo(x, y - arm);
        ctx.lineTo(x, y + arm);
      }
    }
    ctx.stroke();
  }

  function save(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function download(f) {
    const share = f.share;
    const s = Math.max(1, Math.floor(PRINT_PX / Math.max(share.width, share.height)));
    const w = share.width * s;
    const h = share.height * s;
    const margin = Math.round(0.06 * Math.max(w, h));

    const c = blankCanvas(w + 2 * margin, h + 2 * margin);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(share, margin, margin, w, h);
    drawCrosses(ctx, c.width, c.height, margin);

    // A at the left, B at the right, so the labels do not cover each other
    ctx.font = `${Math.round(0.35 * margin)}px sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = f === foilA ? "left" : "right";
    ctx.fillText(`Folie ${f.name.toUpperCase()}`, f === foilA ? margin : c.width - margin, c.height - margin / 2);

    c.toBlob((blob) => save(blob, `visuelle-krypto-folie-${f.name}.png`));
  }

  // ---------------------------------------------------------------------------
  // Controls

  function selectKind(kind) {
    state.kind = kind;
    for (const option of root.querySelectorAll(".vk-option")) {
      option.hidden = option.dataset.motiv !== kind;
    }
    finenessInput.value = DEFAULT_FINENESS[kind];
    rebuild(true);
  }

  // A data: URL, since the theme's Content-Security-Policy blocks blob: images.
  function loadImage() {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    const img = new Image();
    img.onload = () => {
      state.image = imageCanvas(img);
      fileName.textContent = file.name;
      rebuild(true);
    };
    img.onerror = () => say(MESSAGES.badImage);
    reader.onload = () => {
      img.src = reader.result;
    };
    reader.onerror = img.onerror;
    reader.readAsDataURL(file);
  }

  for (const input of kindInputs) {
    input.addEventListener("change", () => selectKind(input.value));
  }
  textInput.addEventListener("input", () => rebuild(true));
  fileInput.addEventListener("change", loadImage);
  thresholdInput.addEventListener("input", () => rebuild(false));
  finenessInput.addEventListener("input", () => rebuild(true));
  invertInput.addEventListener("change", () => rebuild(false));

  $("vk-zusammen").addEventListener("click", () => {
    raise(foilB);
    glide(() => Object.assign(foilB, { x: foilA.x, y: foilA.y }));
  });
  $("vk-auseinander").addEventListener("click", () => {
    glide(() => foils.forEach((f, i) => Object.assign(f, geometry.home[i])));
  });
  $("vk-wuerfeln").addEventListener("click", () => rebuild(true));
  $("vk-png-a").addEventListener("click", () => download(foilA));
  $("vk-png-b").addEventListener("click", () => download(foilB));

  foils.forEach(attachDragging);

  let lastWidth = stage.clientWidth;
  new ResizeObserver(() => {
    if (stage.clientWidth === lastWidth || !geometry) return;
    lastWidth = stage.clientWidth;
    layout(true);
  }).observe(stage);

  // A restored form may have "own image" checked, but the file is gone.
  const checked = root.querySelector('input[name="vk-motiv"]:checked');
  const initial = checked && checked.value !== "bild" ? checked : kindInputs[0];
  initial.checked = true;
  selectKind(initial.value);
})();
