/*
 * "Rechnen im Kreis" (/themen/rsa-primzahlen/modulo/): N places on a circle.
 * The number line is wound onto a spiral: the number p sits at place p mod N,
 * one ring further inside for every N it is away from 0. Adding walks from a
 * forward, subtracting backward, multiplying jumps from 0, and "Rest" walks
 * from 0 to x. The rings show the quotient, the landing place the remainder.
 */
(() => {
  "use strict";

  const root = document.getElementById("mod");
  if (!root) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const RADIUS = 95; // circle of places, in viewBox units
  const TRACK_GAP = 7; // between the places and the outermost ring of the walk
  const RING_GAP = 8; // each further round is drawn this much further inside
  const INNERMOST = 42; // the spiral does not shrink beyond this radius
  const MIN_N = 2;
  const MAX_N = 60;
  const MAX_INPUT = 999;
  const MAX_DRAWN_STEPS = 5000; // longer walks are not drawn, only their end
  const POINTS_BUDGET = 3000; // polyline points for a whole walk
  const MS_PER_STEP = 150;
  const MIN_MS = 600;
  const MAX_MS = 3000;
  const LABEL_ALL = 30; // with more places, only every LABEL_EVERY-th is labelled
  const LABEL_EVERY = 5;
  const ALPHABET = 26;
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const SIGNS = { plus: "+", minus: "−", mal: "·", rest: "" };
  const QUIZ_MODULI = [12, 26, 7, 10];
  const QUIZ_OPS = ["plus", "plus", "minus", "mal"];

  const $ = (id) => document.getElementById(id);
  const svg = $("mod-kreis");
  const nInput = $("mod-n");
  const aInput = $("mod-a");
  const bInput = $("mod-b");
  const nButtons = root.querySelectorAll("[data-n]");
  const opButtons = root.querySelectorAll("[data-op]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = { n: 12, op: "plus", a: 7, b: 8 };
  let parts = null; // SVG elements, rebuilt when N changes
  let walk = null;
  let animation = 0;

  // The mini quiz of the Frankenthal talk comes first.
  let task = { n: 26, op: "plus", a: 18, b: 13 };

  // ---------------------------------------------------------------------------
  // Arithmetic and wording

  function mod(x, n) {
    return ((x % n) + n) % n;
  }

  function clamp(v, lo, hi) {
    return Math.min(Math.max(v, lo), hi);
  }

  // proper minus sign; negative numbers in parentheses where they follow an operator
  function fmt(x, bracket = false) {
    if (x >= 0) return String(x);
    return bracket ? `(−${-x})` : `−${-x}`;
  }

  function value({ op, a, b }) {
    if (op === "plus") return a + b;
    if (op === "minus") return a - b;
    if (op === "mal") return a * b;
    return a;
  }

  function term({ op, a, b, n }) {
    if (op === "rest") return `${fmt(a)} mod ${n}`;
    return `(${fmt(a)} ${SIGNS[op]} ${fmt(b, true)}) mod ${n}`;
  }

  function times(q) {
    return q === 1 ? "einmal" : q === 2 ? "zweimal" : `${q}-mal`;
  }

  // v = q · n + r, in words
  function explanation(v, n) {
    const r = mod(v, n);
    const q = Math.floor(v / n);
    const equation = `${fmt(v)} = ${fmt(q)} · ${n} + ${r}`;
    if (v < 0) return `${equation}: Von 0 aus ${-v} Schritte rückwärts landet man bei ${r}.`;
    if (q === 0) return `${v} ist kleiner als ${n}: Man kommt nicht ganz herum, der Rest ist ${v} selbst.`;
    if (r === 0) return `${equation}: genau ${times(q)} ganz herum, der Rest ist 0.`;
    return `${equation}: ${times(q)} ganz herum, dann bleiben noch ${r} Schritte.`;
  }

  // ---------------------------------------------------------------------------
  // The walk

  function bubbleRadius(n) {
    return Math.min(9, (0.42 * 2 * Math.PI * RADIUS) / n);
  }

  function point(place, radius, n) {
    const t = -Math.PI / 2 + (2 * Math.PI * place) / n;
    return [radius * Math.cos(t), radius * Math.sin(t)];
  }

  // The walk runs from `from` to `to`; plus and minus first come from 0 to a.
  function route({ op, a, b }) {
    if (op === "plus") return { from: a, to: a + b, jump: 0 };
    if (op === "minus") return { from: a, to: a - b, jump: 0 };
    if (op === "mal") return { from: 0, to: a * b, jump: Math.abs(a) };
    return { from: 0, to: a, jump: 0 };
  }

  function planWalk() {
    const { n } = state;
    const r = route(state);
    const steps = Math.abs(r.to - r.from);
    const farthest = Math.max(Math.abs(r.from), Math.abs(r.to));
    const track = RADIUS - bubbleRadius(n) - TRACK_GAP;
    const gap = Math.min(RING_GAP, (track - INNERMOST) / Math.max(1, farthest / n));
    const at = (p) => point(p, track - (gap * Math.abs(p)) / n, n);
    const drawn = steps + Math.abs(r.from) <= MAX_DRAWN_STEPS;
    const perStep = clamp(Math.floor(POINTS_BUDGET / Math.max(1, steps + Math.abs(r.from))), 1, 12);

    const line = (from, to) => {
      const count = Math.abs(to - from) * perStep;
      const dir = Math.sign(to - from);
      return Array.from({ length: count + 1 }, (_, i) => at(from + (dir * i) / perStep));
    };

    // ends of the jumps when multiplying
    const jumps = [];
    if (drawn && r.jump > 0) {
      const dir = Math.sign(r.to);
      for (let j = 1; j * r.jump <= steps; j++) jumps.push(at(dir * j * r.jump));
    }

    return {
      ...r,
      steps,
      drawn,
      jumps,
      approach: drawn && r.from !== 0 ? line(0, r.from) : [],
      points: drawn ? line(r.from, r.to) : [],
      start: mod(r.from, n),
      end: mod(r.to, n),
      endPoint: at(drawn ? r.to : 0),
    };
  }

  // ---------------------------------------------------------------------------
  // Drawing

  function el(name, attributes = {}, parent = null) {
    const node = document.createElementNS(SVG_NS, name);
    for (const [key, val] of Object.entries(attributes)) node.setAttribute(key, val);
    if (parent) parent.append(node);
    return node;
  }

  function build() {
    const { n } = state;
    svg.replaceChildren();
    const bubble = bubbleRadius(n);
    const places = [];

    for (let k = 0; k < n; k++) {
      const [x, y] = point(k, RADIUS, n);
      const g = el("g", { class: "mod-platz", "data-k": k }, svg);
      el("circle", { cx: x, cy: y, r: bubble }, g);
      const label = n === ALPHABET ? LETTERS[k] : String(k);
      const text = el("text", { x, y, "font-size": bubble * 1.05 }, g);
      text.textContent = n <= LABEL_ALL || k % LABEL_EVERY === 0 ? label : "";
      if (n === ALPHABET) {
        const [nx, ny] = point(k, RADIUS + 15, n);
        el("text", { x: nx, y: ny, "font-size": 6.5 }, svg).textContent = String(k);
      }
      g.addEventListener("click", () => {
        state.a = k;
        aInput.value = k;
        update(true);
      });
      places.push(g);
    }

    const approach = el("polyline", { class: "mod-anlauf", points: "" }, svg);
    const path = el("polyline", { class: "mod-weg", points: "" }, svg);
    const jumps = el("g", {}, svg);
    const token = el("circle", { class: "mod-figur", r: 4.5 }, svg);
    const big = el("text", { class: "mod-mitte", x: 0, y: -4, "font-size": 34 }, svg);
    const small = el("text", { class: "mod-mitte", x: 0, y: 22, "font-size": 9 }, svg);
    parts = { places, approach, path, jumps, token, big, small };
  }

  // f: fraction of the walk shown, from 0 to 1
  function draw(f) {
    const { n } = state;
    const done = f >= 1;
    const shown = walk.drawn ? Math.max(1, Math.ceil(f * (walk.points.length - 1)) + 1) : 0;
    const visible = walk.points.slice(0, shown);
    const svgPoints = (list) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    parts.approach.setAttribute("points", svgPoints(walk.approach));
    parts.path.setAttribute("points", svgPoints(visible));

    const [tx, ty] = done || !walk.drawn ? walk.endPoint : visible[visible.length - 1];
    parts.token.setAttribute("cx", tx);
    parts.token.setAttribute("cy", ty);

    parts.jumps.replaceChildren();
    const stepsSoFar = Math.round(f * walk.steps);
    walk.jumps.forEach(([x, y], i) => {
      if ((i + 1) * walk.jump <= stepsSoFar) el("circle", { cx: x, cy: y, r: 2.2, class: "mod-figur" }, parts.jumps);
    });

    parts.places.forEach((g, k) => {
      g.classList.toggle("mod-start", k === walk.start && walk.approach.length > 0);
      g.classList.toggle("mod-ziel", done && k === walk.end);
    });

    const result = mod(value(state), n);
    parts.big.textContent = done ? String(result) : String(stepsSoFar);
    parts.small.textContent = done ? (n === ALPHABET ? `Rest · ${LETTERS[result]}` : "Rest") : "Schritte";
  }

  function animate() {
    cancelAnimationFrame(animation);
    if (reduceMotion.matches || !walk.drawn || walk.steps === 0) {
      draw(1);
      return;
    }
    const duration = clamp(walk.steps * MS_PER_STEP, MIN_MS, MAX_MS);
    const t0 = performance.now();
    const frame = (now) => {
      const f = Math.min(1, (now - t0) / duration);
      draw(f);
      if (f < 1) animation = requestAnimationFrame(frame);
    };
    animation = requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------------------
  // Text

  function describe() {
    const { n, op, a, b } = state;
    const v = value(state);
    const r = mod(v, n);
    const head = op === "rest" ? `${fmt(a)} mod ${n} = ${r}` : `${term(state)} = ${fmt(v)} mod ${n} = ${r}`;
    $("mod-rechnung").textContent = head;

    const lines = [explanation(v, n)];
    if (op === "mal") lines.push(`Gerechnet als ${Math.abs(b)} Sprünge zu je ${Math.abs(a)} Plätzen, von 0 aus.`);
    if (!walk.drawn) lines.push("Der Weg ist zu lang zum Zeichnen, das Ergebnis stimmt trotzdem.");

    // Caesar: letters as numbers, A = 0
    if (n === ALPHABET && (op === "plus" || op === "minus") && a >= 0 && a < ALPHABET && b >= 0 && b < ALPHABET) {
      const verb = op === "plus" ? "verschlüsselt" : "entschlüsselt";
      lines.push(`Als Buchstaben: ${LETTERS[a]} ${SIGNS[op]} ${b} → ${LETTERS[r]}. So ${verb} Caesar mit dem Schlüssel ${b}.`);
    }
    $("mod-erklaerung").textContent = lines.join(" ");
  }

  // ---------------------------------------------------------------------------
  // Controls

  function readInputs() {
    const int = (input, lo, hi, fallback) => {
      const v = Number.parseInt(input.value, 10);
      return Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
    };
    state.n = int(nInput, MIN_N, MAX_N, state.n);
    state.a = int(aInput, -MAX_INPUT, MAX_INPUT, state.a);
    state.b = int(bInput, -MAX_INPUT, MAX_INPUT, state.b);
  }

  function syncControls() {
    nInput.value = state.n;
    aInput.value = state.a;
    bInput.value = state.b;
    $("mod-n-text").textContent = state.n;
    $("mod-zeichen").textContent = SIGNS[state.op];
    const rest = state.op === "rest";
    bInput.hidden = rest;
    $("mod-klammer-auf").hidden = rest;
    $("mod-klammer-zu").firstChild.textContent = rest ? " mod " : ") mod ";
    for (const b of nButtons) b.setAttribute("aria-pressed", String(Number(b.dataset.n) === state.n));
    for (const b of opButtons) b.setAttribute("aria-pressed", String(b.dataset.op === state.op));
  }

  function update(play) {
    const rebuilt = !parts || parts.places.length !== state.n;
    if (rebuilt) build();
    syncControls();
    walk = planWalk();
    describe();
    if (play) animate();
    else {
      cancelAnimationFrame(animation);
      draw(1);
    }
  }

  for (const button of nButtons) {
    button.addEventListener("click", () => {
      state.n = Number(button.dataset.n);
      update(true);
    });
  }
  for (const button of opButtons) {
    button.addEventListener("click", () => {
      state.op = button.dataset.op;
      update(true);
    });
  }
  for (const input of [nInput, aInput, bInput]) {
    input.addEventListener("input", () => {
      readInputs();
      update(false);
    });
  }
  $("mod-los").addEventListener("click", () => update(true));

  // ---------------------------------------------------------------------------
  // Quiz

  function randomInt(lo, hi) {
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  // results that wrap around at least once
  function newTask() {
    const n = pick(QUIZ_MODULI);
    const op = pick(QUIZ_OPS);
    if (op === "plus") {
      const a = randomInt(1, n - 1);
      return { n, op, a, b: randomInt(n - a, n - 1) };
    }
    if (op === "minus") {
      const a = randomInt(0, n - 2);
      return { n, op, a, b: randomInt(a + 1, n - 1) };
    }
    const a = randomInt(2, n - 1);
    const fewest = Math.max(2, Math.ceil(n / a));
    return { n, op, a, b: randomInt(fewest, fewest + 4) };
  }

  function showTask() {
    $("mod-q-aufgabe").textContent = term(task);
    $("mod-q-antwort").value = "";
    $("mod-q-rueckmeldung").textContent = "";
    $("mod-q-zeigen").hidden = true;
  }

  function check() {
    const answer = Number.parseInt($("mod-q-antwort").value, 10);
    if (!Number.isFinite(answer)) return;

    const v = value(task);
    const r = mod(v, task.n);
    const feedback = $("mod-q-rueckmeldung");
    if (answer === r) {
      feedback.className = "wz-richtig";
      feedback.textContent = `Richtig! ${explanation(v, task.n)}`;
    } else {
      const hint = v < 0 ? `zähl ${task.n} dazu` : `zieh ${task.n} ab`;
      feedback.className = "wz-falsch";
      feedback.textContent = `Noch nicht. Tipp: Rechne erst ${fmt(task.a)} ${SIGNS[task.op]} ${task.b} = ${fmt(v)} und ${hint}, bis die Zahl zwischen 0 und ${task.n - 1} liegt.`;
    }
    $("mod-q-zeigen").hidden = false;
  }

  $("mod-q-pruefen").addEventListener("click", check);
  $("mod-q-antwort").addEventListener("keydown", (e) => {
    if (e.key === "Enter") check();
  });
  $("mod-q-neu").addEventListener("click", () => {
    task = newTask();
    showTask();
  });
  $("mod-q-zeigen").addEventListener("click", () => {
    Object.assign(state, task);
    update(true);
    svg.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
  });

  showTask();
  update(false);
})();
