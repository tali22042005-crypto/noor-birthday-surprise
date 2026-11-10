/* A Rose Written in Every Language
   Canvas port of rose.py (Python/Tkinter): same petal/leaf/stem geometry, same
   scanline text-packing, same colours, same word-by-word bloom + shimmer. */
(() => {
  const host = document.getElementById("loveRoseArt");
  if (!host) return;

  // ---- settings (from rose.py) -------------------------------------------
  const DURATION = 10, TICK = 16, ANIM = 38, LIFT = 32, GAP = 3, SEED = 17;
  const BG = "#060208";
  // Visible crop of the original 800x800 canvas (the rose lives in x 177-623, y 90-773)
  const OX = 165, OY = 80, W = 470, H = 700;
  const STACK = 'Georgia, "Times New Roman", "Segoe UI", "Nirmala UI", "Leelawadee UI", "Malgun Gothic", "Yu Gothic UI", "Microsoft YaHei", "Noto Sans", "Arial Unicode MS", Arial, sans-serif';

  const PHRASES = ["I LOVE YOU","I love you","Te amo","Ti amo","Je t'aime","Ich liebe dich","Eu te amo","Seni seviyorum","Я тебя люблю","사랑해","愛してる","我爱你","मैं तुमसे प्यार करती हूँ","मैं तुमसे प्यार करता हूँ","Σ' αγαπώ","Ik hou van jou","Jag älskar dig","Kocham cię","ฉันรักคุณ","Anh yêu em","Aku cinta kamu","Mahal kita","אני אוהבת אותך","أحبك","నేను నిన్ను ప్రేమిస్తున్నాను","நான் உன்னை காதலிக்கிறேன்","আমি তোমাকে ভালোবাসি","Volim te","Te iubesc","Ljubim te","Nakupenda","Я тебе кохаю","Miluji tě","Szeretlek","Rakastan sinua","Jeg elsker dig"];
  const ACCENTS = ["LOVE","TE AMO","AMOUR","TI AMO","I LOVE YOU","AMOR","愛してる","사랑해","我爱你","LOVE YOU","JE T'AIME","SZERETLEK","NAKUPENDA"];
  const SHORT_PHRASES = ["Te amo","Ti amo","AMOR","LOVE","愛してる","사랑해","我爱你","Amour","I love you","Mahal kita","Te iubesc","Volim te","Szeretlek","Miluji tě","Nakupenda"];
  const HEAD_WORDS = PHRASES.concat(["LOVE","LOVE","LOVE YOU","AMOR","AMOR","AMOUR","AMOUR","AMORE","LIEBE","TE AMO","TE AMO","TI AMO","TI AMO","TE QUIERO","TE QUIERO","JE T'AIME","I LOVE YOU","I LOVE YOU","愛","愛してる","愛してる","사랑","사랑해","사랑해","我爱你","Mahal kita","รักคุณ","ANH YÊU EM","तुमसे प्यार है","నిన్ను ప్రేమిస్తున్నా","உன்னை காதலிக்கிறேன்","ভালোবাসি","أحبك","LOVE","AMOR","AMOUR","Nakupenda","Szeretlek"]);
  const HEAD_SIZES = [7,8,9,10,11,12,13,14];
  const HEAD_WEIGHTS = [2,4,5,5,4,2,1,0.5];

  // ---- seeded RNG (Python's random.Random replacement) --------------------
  let rng;
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const uniform = (a, b) => a + (b - a) * rng();
  const choice = arr => arr[Math.floor(rng() * arr.length)];
  const choices = (arr, weights) => { const tot = weights.reduce((s, w) => s + w, 0); let x = rng() * tot;
    for (let i = 0; i < arr.length; i++) { x -= weights[i]; if (x < 0) return arr[i]; } return arr[arr.length - 1]; };
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } };

  // ---- geometry ------------------------------------------------------------
  const ellipse = (cx, cy, rx, ry, n = 160) =>
    Array.from({ length: n }, (_, i) => [cx + rx * Math.cos(2 * Math.PI * i / n), cy + ry * Math.sin(2 * Math.PI * i / n)]);
  const HEAD_SHAPES = [
    ellipse(400,180,145,90), ellipse(330,180,120,83), ellipse(470,180,120,83),
    ellipse(275,260,98,112), ellipse(525,260,98,112),
    ellipse(338,325,118,126), ellipse(462,325,118,126),
    [[230,330],[290,365],[348,414],[400,532],[452,414],[510,365],[570,330],[522,452],[400,542],[278,452]],
  ];
  const STEM = [[378,493],[422,493],[427,752],[408,772],[390,760],[374,600]];
  const LEFT_LEAF = [[395,594],[359,554],[304,535],[244,541],[215,562],[253,609],[321,631],[374,617]];
  const RIGHT_LEAF = [[406,619],[442,581],[491,561],[553,578],[578,600],[535,640],[476,660],[425,649]];

  function polygonSpans(poly, y) {
    const xs = [];
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) if (y2 !== y1) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    const out = []; for (let i = 0; i + 1 < xs.length; i += 2) out.push([xs[i], xs[i + 1]]); return out;
  }
  function mergeSpans(spans) {
    if (!spans.length) return [];
    spans = spans.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged = [spans[0].slice()];
    for (const [lo, hi] of spans.slice(1)) {
      const last = merged[merged.length - 1];
      if (lo <= last[1] + 1) last[1] = Math.max(last[1], hi); else merged.push([lo, hi]);
    }
    return merged;
  }
  const shapeSpans = (polys, y) => mergeSpans(polys.flatMap(p => polygonSpans(p, y)));
  function intersectSpans(a, b, minimum = 15) {
    const out = [];
    for (const s of a) for (const t of b) { const lo = Math.max(s[0], t[0]), hi = Math.min(s[1], t[1]); if (hi - lo >= minimum) out.push([lo, hi]); }
    return mergeSpans(out);
  }

  // ---- colour helpers --------------------------------------------------------
  const clamp = v => Math.max(0, Math.min(1, v));
  const mix = (a, b, k) => a.map((x, i) => x + (b[i] - x) * k);
  const scale = (c, k) => c.map(v => v * k);
  const toRGB = h => { h = h.replace("#", ""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); };
  const hx = c => "#" + c.map(v => Math.floor(clamp(v) * 255).toString(16).padStart(2, "0")).join("");
  const BGC = toRGB(BG);
  const FLASH = [1.0, 0.83, 0.88];

  function roseColor(x, y, size, edge) {
    const dx = (x - 400) / 210, dy = (y - 300) / 220, rad = Math.sqrt(dx * dx + dy * dy);
    let pal;
    if (rad > 0.82) pal = ["#8f0b2b","#ae1238","#c41d48","#d52b53"];
    else if (rad > 0.48) pal = ["#b9143d","#d21e49","#e33b60","#f04e73"];
    else pal = ["#c51b49","#e83c68","#f16b8b","#ff91a9"];
    if (edge) pal = pal.concat(["#f5a0b3","#ef6488"]);
    if (size >= 14) pal = pal.concat(["#ff9ab1","#ffd0dc"]);
    return toRGB(choice(pal));
  }
  function greenColor(x, y, size) {
    let pal = ["#3e8034","#559c3c","#72b84b","#91cf62","#b1e184"];
    if (size >= 9) pal = pal.concat(["#a7d486","#c0e19a"]);
    return toRGB(choice(pal));
  }

  // ---- text measuring & packing ---------------------------------------------
  const mctx = document.createElement("canvas").getContext("2d");
  const fontStr = size => `700 ${size * 4 / 3}px ${STACK}`;   // Tk point sizes -> px
  const widthCache = new Map();
  function measure(text, size) {
    const k = size + "|" + text; let w = widthCache.get(k);
    if (w === undefined) { mctx.font = fontStr(size); w = mctx.measureText(text).width; widthCache.set(k, w); }
    return w;
  }
  function lineSpace(size) {
    mctx.font = fontStr(size); const m = mctx.measureText("Hgj");
    return (m.fontBoundingBoxAscent !== undefined) ? m.fontBoundingBoxAscent + m.fontBoundingBoxDescent : size * 4 / 3 * 1.2;
  }

  let phraseCycles;
  function phraseFromPool(poolName, size) {
    const pool = size >= 14 ? ACCENTS : (poolName !== "head" ? SHORT_PHRASES : HEAD_WORDS);
    const key = poolName + "|" + (size >= 14 ? "accent" : "normal");
    if (!phraseCycles[key] || !phraseCycles[key].items.length) { const items = pool.slice(); shuffle(items); phraseCycles[key] = { items, index: 0 }; }
    const st = phraseCycles[key], phrase = st.items[st.index++];
    if (st.index >= st.items.length) st.items = [];
    return phrase;
  }
  const sizeFor = pool => pool === "head" ? choices(HEAD_SIZES, HEAD_WEIGHTS) : choice(pool === "stem" ? [6,7,8] : [7,8,9,10]);

  function buildRegion(polys, yStart, yEnd, rowH, kind) {
    const placed = [], half = rowH / 2; let y = yStart + half;
    while (y < yEnd - half) {
      const top = shapeSpans(polys, y - half + 1), bottom = shapeSpans(polys, y + half - 1);
      const row = intersectSpans(top, bottom, kind === "head" ? 19 : 16);
      for (let [lo, hi] of row) {
        const margin = kind === "head" ? 3 : 1; lo += margin; hi -= margin;
        const available = hi - lo; if (available < 18) continue;
        const line = []; let cur = lo + uniform(0, Math.min(3, Math.max(1, available * 0.02)));
        while (cur < hi - 15) {
          const remaining = hi - cur, candidates = [];
          const target = Math.min(74, Math.max(19, remaining * 0.22));
          const tries = kind === "head" ? 45 : 55;
          for (let t = 0; t < tries; t++) {
            const size = sizeFor(kind), text = phraseFromPool(kind, size), width = measure(text, size);
            if (width <= remaining && width >= Math.min(18, remaining * 0.20))
              candidates.push([Math.abs(width - target) + uniform(0, 13), text, size, width]);
          }
          if (!candidates.length) break;
          candidates.sort((a, b) => a[0] - b[0]);
          const [, text, size, width] = choice(candidates.slice(0, Math.min(4, candidates.length)));
          line.push({ x: cur + width / 2, y, text, size, width, kind });
          cur += width + (kind === "head" ? GAP : 1);
        }
        if (!line.length) continue;
        const gap = kind === "head" ? GAP : 1;
        const used = line.reduce((s, it) => s + it.width, 0) + Math.max(0, line.length - 1) * gap;
        const slack = Math.max(0, available - used), extra = line.length > 1 ? slack / (line.length - 1) : 0;
        line.forEach((it, i) => {
          it.x += extra * i; it.edge = (i === 0 || i === line.length - 1);
          it.color = kind === "head" ? roseColor(it.x, it.y, it.size, it.edge) : greenColor(it.x, it.y, it.size);
          placed.push(it);
        });
      }
      y += rowH;
    }
    return placed;
  }

  let ORDER = null;
  function layout() {
    rng = mulberry32(SEED); phraseCycles = {}; widthCache.clear();
    const headH = Math.max(...[9,10,11].map(lineSpace)) + 1;
    const leafH = Math.max(...[7,8,9].map(lineSpace)) + 1;
    const stemH = Math.max(...[6,7,8].map(lineSpace)) + 1;
    const placed = [].concat(
      buildRegion(HEAD_SHAPES, 88, 540, headH, "head"),
      buildRegion([LEFT_LEAF], 543, 618, leafH, "leaf"),
      buildRegion([RIGHT_LEAF], 575, 651, leafH, "leaf"),
      buildRegion([STEM], 492, 773, stemH, "stem"));
    const outer = placed.filter(p => p.edge), inner = placed.filter(p => !p.edge);
    const ang = p => ((Math.atan2(p.y - 300, p.x - 400) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    outer.sort((a, b) => ang(a) - ang(b));
    shuffle(inner);
    ORDER = outer.concat(inner);
  }

  // ---- canvases -------------------------------------------------------------
  const K = Math.min(3, Math.max(1.5, (window.devicePixelRatio || 1) * 1.4));
  const canvas = document.createElement("canvas"); canvas.width = Math.round(W * K); canvas.height = Math.round(H * K);
  canvas.setAttribute("aria-hidden", "true"); host.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const settled = document.createElement("canvas"); settled.width = canvas.width; settled.height = canvas.height;
  const sctx = settled.getContext("2d");
  const setup = c => { c.setTransform(K, 0, 0, K, -OX * K, -OY * K); c.textAlign = "center"; c.textBaseline = "middle"; };

  function drawWord(c, p, x, y, color) { c.font = fontStr(p.size); c.fillStyle = color; c.fillText(p.text, x, y); }

  // ---- animation --------------------------------------------------------------
  let raf = 0, startTimer = 0, running = false;
  let items, rate, acc, spawning, active, done, shimmers, simTime, nextShimmer, last, lag;

  function reset() {
    items = 0; rate = ORDER.length / Math.max(1, DURATION * 1000 / TICK); acc = 0; spawning = true;
    active = []; done = []; shimmers = []; simTime = 0; nextShimmer = 0; lag = 0;
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, settled.width, settled.height); setup(sctx);
  }

  function animate(a) {
    a.frame++;
    const p = a.p, u = clamp(a.frame / ANIM), e = 1 - Math.pow(1 - u, 3), col = p.color;
    a.px = p.x + a.dx * (1 - e); a.py = p.y - LIFT * (1 - e);
    a.shadow = hx(mix(BGC, scale(col, 0.23), e));
    a.halo = hx(mix(BGC, scale(col, 0.30), e * e));
    const flash = 0.55 * Math.sin(Math.PI * clamp((u - 0.58) / 0.42));
    a.main = hx(mix(mix(BGC, col, Math.pow(e, 1.35)), FLASH, flash));
    if (u >= 1) {   // word has landed: bake it into the static layer
      drawWord(sctx, p, p.x + 1, p.y + 2, hx(scale(col, 0.23)));
      drawWord(sctx, p, p.x, p.y, hx(col));
      done.push(p); return false;
    }
    return true;
  }

  function step() {
    simTime += TICK;
    if (spawning) {
      acc += rate;
      while (acc >= 1) {
        acc -= 1;
        if (items >= ORDER.length) { spawning = false; break; }
        active.push({ p: ORDER[items++], frame: 0, dx: uniform(-6, 6) });
      }
    }
    active = active.filter(animate);
    if (!spawning && !active.length && simTime >= nextShimmer && done.length) {   // endless gentle shimmer
      shimmers.push({ p: choice(done), until: simTime + 210 }); nextShimmer = simTime + 145;
    }
    shimmers = shimmers.filter(s => s.until > simTime);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = BG; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(settled, 0, 0); setup(ctx);
    for (const a of active) {
      drawWord(ctx, a.p, a.px + 1, a.py + 2, a.shadow);
      drawWord(ctx, a.p, a.px, a.py, a.halo);
      drawWord(ctx, a.p, a.px, a.py, a.main);
    }
    for (const s of shimmers) drawWord(ctx, s.p, s.p.x, s.p.y, hx(mix(s.p.color, FLASH, 0.55)));
  }

  function frame(now) {
    if (!running) return;
    lag += Math.min(100, now - last); last = now;
    while (lag >= TICK) { step(); lag -= TICK; }
    render(); raf = requestAnimationFrame(frame);
  }

  function start() {
    stop(); if (!ORDER) layout(); reset(); running = true;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion: show the finished rose straight away
      for (const p of ORDER) { drawWord(sctx, p, p.x + 1, p.y + 2, hx(scale(p.color, 0.23))); drawWord(sctx, p, p.x, p.y, hx(p.color)); }
      spawning = false; render(); running = false; return;
    }
    render();
    startTimer = setTimeout(() => { last = performance.now(); raf = requestAnimationFrame(frame); }, 450);
  }
  function stop() { running = false; clearTimeout(startTimer); cancelAnimationFrame(raf); }

  window.LoveRose = { start, stop };
})();
