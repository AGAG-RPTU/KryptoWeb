/*
 * Caesar & Vigenère (/themen/caesar-vigenere/ausprobieren/): encrypt and
 * decrypt with a turnable Caesar disc or a code word, and break a cipher text
 * as in the Kinder-Uni talk: try all 25 shifts, count letters, and split a
 * code-word cipher into teams, each of which is a plain Caesar cipher.
 *
 * Letters count from A = 0 to Z = 25; a shift by k turns x into (x + k) mod 26.
 */
(() => {
  "use strict";

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const N = ALPHABET.length;
  const E = 4;

  // per cent of letters in German texts, ß counted as SS
  const GERMAN = [
    6.51, 1.89, 3.06, 5.08, 17.4, 1.66, 3.01, 4.76, 7.55, 0.27, 1.21, 3.44, 2.53, 9.78, 2.51, 0.79, 0.02, 7.0, 7.27,
    6.15, 4.35, 0.67, 1.89, 0.03, 0.04, 1.13,
  ];

  // one per position of the code word, as on the slides of the Kinder-Uni talk
  const TEAM_COLORS = ["#1b7f86", "#8e3a99", "#a86b0c", "#2b5ea7", "#b5413a", "#4b8b3b"];
  const MAX_CARDS = 40; // letters shown as cards for the code word
  const MAX_COLORED = 150; // cipher letters shown coloured by team
  const PREVIEW_CHARS = 48; // per line in the list of all 25 shifts
  const MAX_PLAIN_CHARS = 800;
  const COPIED_MS = 1500;

  // Agenten-Blatt task 3, then two longer texts encrypted with H and with BEN
  const EXAMPLES = [
    "YWJKKUZSPY UFZXJSMTK IWJN ZMW",
    "SPLIL HNLUAPU, SPLILY HNLUA! DLY KPLZL UHJOYPJOA SLZLU RHUU, OHA KLU AYPJR TPA KLT GHLOSLU CLYZAHUKLU: PU KLBAZJOLU ALEALU PZA KHZ L KLY OHLBMPNZAL IBJOZAHIL. MPUKLA THU KHZ CLYRSLPKLAL L, RLUUA THU HBJO KLU ZJOSBLZZLS. OLYGSPJOLU NSBLJRDBUZJO, KB IPZA QLAGA LPU LJOALY JVKLRUHJRLY!",
    "UVRGJRO AVS YAT QBSKRO RNDL QFV FDLHMI NN EYUIA CVHORRO LVOXRS HRS XHSRUBPYF. FEJRT CMGUI QJI PBIFBV-FDLRJFR VRQ EEF BKROXRO-FYBXG NMG, EIAO AVS ABMPRO IVOI AFYR HIUFMZCSGTGUBJG FRGTGUMYRTWRMR. RSDNFLYF RVFQNOHRN HNWSA, TSATX VTX QBW TFLRJQAJW XFMAFW ZFLE. XIE AY FQERU OBNQG, NYFT HVF RNFGUTXR CSGTGUBJG HEAA EYMIVO IAUWPIPHFWFFPA.",
  ];

  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------------------
  // Ciphers

  function normalize(text) {
    return text.toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE");
  }

  function mod(x, n) {
    return ((x % n) + n) % n;
  }

  // keys: list of shifts used in turn; non-letters pass through and use no key
  function shift(text, keys, sign) {
    let i = 0;
    let out = "";
    for (const c of text) {
      const x = ALPHABET.indexOf(c);
      if (x < 0) {
        out += c;
        continue;
      }
      out += ALPHABET[mod(x + sign * keys[i % keys.length], N)];
      i++;
    }
    return out;
  }

  function lettersOf(text) {
    return [...text].map((c) => ALPHABET.indexOf(c)).filter((x) => x >= 0);
  }

  function keysOf(word) {
    const keys = lettersOf(normalize(word));
    return keys.length > 0 ? keys : [0];
  }

  function el(tag, attributes = {}, text = "") {
    const node = document.createElement(tag);
    for (const [key, val] of Object.entries(attributes)) node.setAttribute(key, val);
    if (text) node.textContent = text;
    return node;
  }

  // ---------------------------------------------------------------------------
  // Encrypt and decrypt

  const cv = $("cv");
  const breaker = $("ck");
  const cvState = { art: "caesar", sign: 1, key: 3 };
  let setBreakerText = null; // set below when the code breaker is on the page

  function setupCipher() {
    const SVG_NS = "http://www.w3.org/2000/svg";
    const STEP = 360 / N;
    const R_OUTER = 100;
    const R_MIDDLE = 78;
    const R_INNER = 56;

    const textInput = $("cv-text");
    const keyInput = $("cv-schluessel");
    const wordInput = $("cv-codewort");
    const disc = $("cv-scheibe");
    const result = $("cv-ergebnis");
    const artButtons = cv.querySelectorAll("[data-art]");
    const signButtons = cv.querySelectorAll("[data-richtung]");

    // ---- disc, after the paper disc of the Kopiervorlagen

    function svg(name, attributes, parent) {
      const node = document.createElementNS(SVG_NS, name);
      for (const [key, val] of Object.entries(attributes)) node.setAttribute(key, val);
      parent.append(node);
      return node;
    }

    function polar(r, degrees) {
      const t = (degrees * Math.PI) / 180;
      return [r * Math.sin(t), -r * Math.cos(t)];
    }

    function sector(r1, r2, k) {
      const a0 = (k - 0.5) * STEP;
      const a1 = (k + 0.5) * STEP;
      const [x0, y0] = polar(r2, a0);
      const [x1, y1] = polar(r2, a1);
      const [x2, y2] = polar(r1, a1);
      const [x3, y3] = polar(r1, a0);
      return `M${x0},${y0} A${r2},${r2} 0 0 1 ${x1},${y1} L${x2},${y2} A${r1},${r1} 0 0 0 ${x3},${y3} Z`;
    }

    function ring(parent, r1, r2, shapeClass, textClass) {
      const shapes = svg("g", {}, parent);
      const letters = svg("g", {}, parent);
      for (let k = 0; k < N; k++) {
        svg("path", { d: sector(r1, r2, k), class: shapeClass }, shapes);
        const t = svg("text", { x: 0, y: -(r1 + r2) / 2, transform: `rotate(${k * STEP})`, class: textClass }, letters);
        t.textContent = ALPHABET[k];
      }
      return { shapes, letters };
    }

    // layers: rings, the marked slot at the top, then the letters on top
    const outer = ring(disc, R_MIDDLE, R_OUTER, "cv-aussen", "cv-aussen-text");
    const turning = svg("g", { class: "cv-drehen" }, disc);
    const inner = ring(turning, R_INNER, R_MIDDLE, "cv-innen", "cv-innen-text");
    svg("path", { d: sector(R_INNER, R_OUTER, 0), class: "cv-markierung" }, disc);
    disc.append(outer.letters);
    const turningLetters = svg("g", { class: "cv-drehen" }, disc);
    turningLetters.append(inner.letters);
    svg("circle", { r: R_INNER, class: "cv-mitte" }, disc);
    const keyText = svg("text", { y: -6, class: "cv-mitte-schluessel" }, disc);
    svg("text", { y: 20, class: "cv-mitte-text" }, disc).textContent = "Schlüssel";

    let rotation = 0; // degrees; the inner letter at the top is the key

    function turn(degrees) {
      rotation = degrees;
      for (const g of [turning, turningLetters]) g.style.transform = `rotate(${degrees}deg)`;
    }

    // ---- drawing the code word as cards: code letter, input, shift, output

    function cards(text, keys) {
      const box = $("cv-karten");
      box.replaceChildren();
      let i = 0;
      for (const c of text) {
        if (i >= MAX_CARDS) break;
        const x = ALPHABET.indexOf(c);
        if (x < 0) {
          if (/\s/.test(c)) box.append(el("span", { class: "cv-luecke" }));
          continue;
        }
        const k = keys[i % keys.length];
        const card = el("span", { class: "cv-karte", style: `--team: ${TEAM_COLORS[(i % keys.length) % TEAM_COLORS.length]}` });
        card.append(
          el("span", { class: "cv-kw" }, ALPHABET[k]),
          el("span", { class: "cv-ein" }, c),
          el("span", { class: "cv-plus" }, `${cvState.sign > 0 ? "+" : "−"}${k}`),
          el("span", { class: "cv-aus" }, ALPHABET[mod(x + cvState.sign * k, N)]),
        );
        box.append(card);
        i++;
      }
    }

    function update() {
      const text = normalize(textInput.value);
      const caesar = cvState.art === "caesar";
      const keys = caesar ? [cvState.key] : keysOf(wordInput.value);
      result.textContent = shift(text, keys, cvState.sign);

      keyInput.value = cvState.key;
      keyText.textContent = `${cvState.sign > 0 ? "+" : "−"}${cvState.key}`;
      disc.setAttribute("aria-valuenow", cvState.key);
      if (!caesar) cards(text, keys);

      const encrypt = cvState.sign > 0;
      $("cv-text-titel").textContent = encrypt ? "Klartext" : "Geheimtext";
      $("cv-ergebnis-titel").textContent = encrypt ? "Geheimtext" : "Klartext";
      for (const part of cv.querySelectorAll(".cv-teil")) part.hidden = part.dataset.fuer !== cvState.art;
      for (const b of artButtons) b.setAttribute("aria-pressed", String(b.dataset.art === cvState.art));
      for (const b of signButtons) b.setAttribute("aria-pressed", String(Number(b.dataset.richtung) === cvState.sign));
    }

    // turns the disc the short way round to the key
    function setKey(key) {
      const next = mod(key, N);
      const target = -next * STEP;
      const current = rotation;
      const delta = mod(target - current + 180, 360) - 180;
      turn(current + delta);
      cvState.key = next;
      update();
    }

    // ---- dragging the inner disc

    let drag = null;
    const pointerAngle = (e) => {
      const box = disc.getBoundingClientRect();
      const x = e.clientX - (box.left + box.width / 2);
      const y = e.clientY - (box.top + box.height / 2);
      return (Math.atan2(x, -y) * 180) / Math.PI;
    };

    disc.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      disc.setPointerCapture(e.pointerId);
      disc.classList.add("cv-ziehen");
      drag = { pointer: e.pointerId, angle: pointerAngle(e), rotation };
    });
    disc.addEventListener("pointermove", (e) => {
      if (!drag || drag.pointer !== e.pointerId) return;
      const delta = mod(pointerAngle(e) - drag.angle + 180, 360) - 180;
      drag.angle += delta;
      turn(rotation + delta);
      const key = mod(Math.round(-rotation / STEP), N);
      if (key !== cvState.key) {
        cvState.key = key;
        update();
      }
    });
    const release = (e) => {
      if (!drag || drag.pointer !== e.pointerId) return;
      drag = null;
      disc.classList.remove("cv-ziehen");
      turn(-Math.round(-rotation / STEP) * STEP);
    };
    disc.addEventListener("pointerup", release);
    disc.addEventListener("pointercancel", release);

    disc.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      setKey(cvState.key + step);
    });

    // ---- controls

    $("cv-minus").addEventListener("click", () => setKey(cvState.key - 1));
    $("cv-plus").addEventListener("click", () => setKey(cvState.key + 1));
    keyInput.addEventListener("input", () => {
      const v = Number.parseInt(keyInput.value, 10);
      if (Number.isFinite(v)) setKey(v);
    });
    textInput.addEventListener("input", update);
    wordInput.addEventListener("input", update);
    for (const b of artButtons) {
      b.addEventListener("click", () => {
        cvState.art = b.dataset.art;
        update();
      });
    }
    for (const b of signButtons) {
      b.addEventListener("click", () => {
        cvState.sign = Number(b.dataset.richtung);
        update();
      });
    }

    const copy = $("cv-kopieren");
    copy.hidden = !navigator.clipboard;
    copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(result.textContent);
      copy.textContent = "Kopiert";
      setTimeout(() => {
        copy.textContent = "Kopieren";
      }, COPIED_MS);
    });

    const handOver = $("cv-knacken");
    handOver.hidden = !breaker;
    handOver.addEventListener("click", () => {
      setBreakerText(result.textContent);
      breaker.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    setKey(cvState.key);
  }

  // ---------------------------------------------------------------------------
  // Code breaker

  function setupBreaker() {
    const textInput = $("ck-text");
    const exampleButtons = breaker.querySelectorAll("[data-beispiel]");
    const teamButtons = breaker.querySelectorAll("[data-teams]");
    const state = { teams: 1, chosen: [] }; // chosen: cipher letter taken as E, per team

    // bar chart; marked: index of the highlighted bar, onPick: makes bars buttons
    function chart(values, { color, marked, label, onPick }) {
      const box = el("div", { class: "ck-diagramm" });
      const bars = el("div", { class: "ck-balken" });
      const names = el("div", { class: "ck-namen", "aria-hidden": "true" });
      const top = Math.max(...values, 1e-9);
      values.forEach((v, i) => {
        const column = el("div", { class: "ck-saeule" });
        if (i === marked && label) column.append(el("span", { class: "ck-marke" }, label));
        const bar = el(onPick ? "button" : "span", {
          class: "ck-balken-wert",
          style: `height: ${(100 * v) / top}%; --farbe: ${color}`,
          "aria-label": `${ALPHABET[i]}: ${v}`,
        });
        if (onPick) {
          bar.type = "button";
          bar.addEventListener("click", () => onPick(i));
        }
        if (i === marked) bar.classList.add("ck-markiert");
        column.append(bar);
        bars.append(column);
        names.append(el("span", i === marked ? { class: "ck-markiert" } : {}, ALPHABET[i]));
      });
      box.append(bars, names);
      return box;
    }

    function allShifts(text) {
      const list = $("ck-alle");
      list.replaceChildren();
      const preview = text.length > PREVIEW_CHARS ? `${text.slice(0, PREVIEW_CHARS)}…` : text;
      for (let k = 1; k < N; k++) {
        const row = el("div", { class: "ck-zeile" });
        row.append(el("span", { class: "ck-k" }, `Schlüssel ${k}`), el("span", {}, shift(preview, [k], -1)));
        list.append(row);
      }
    }

    function coloredLetters(text, teams) {
      const box = $("ck-verteilung");
      box.replaceChildren();
      let i = 0;
      for (const c of text) {
        if (i >= MAX_COLORED) {
          box.append("…");
          break;
        }
        if (ALPHABET.indexOf(c) < 0) {
          box.append(c);
          continue;
        }
        box.append(el("span", { style: `color: ${TEAM_COLORS[(i % teams) % TEAM_COLORS.length]}` }, c));
        i++;
      }
    }

    function update() {
      const text = normalize(textInput.value);
      const letters = lettersOf(text);
      const teams = state.teams;
      allShifts(text);
      coloredLetters(text, teams);

      const box = $("ck-teams");
      box.replaceChildren();
      if (letters.length === 0) {
        $("ck-codewort").textContent = "";
        $("ck-klartext").textContent = "Hier fehlt noch ein Geheimtext.";
        return;
      }
      const keys = [];
      for (let t = 0; t < teams; t++) {
        const counts = new Array(N).fill(0);
        for (let i = t; i < letters.length; i += teams) counts[letters[i]]++;
        const most = Math.max(...counts);
        const tops = counts.flatMap((c, x) => (c === most && most > 0 ? [ALPHABET[x]] : []));
        const asE = state.chosen[t] ?? counts.indexOf(most);
        const key = mod(asE - E, N);
        keys.push(key);

        const color = TEAM_COLORS[t % TEAM_COLORS.length];
        const positions = teams === 1 ? "alle Buchstaben" : `Buchstabe ${t + 1}, ${t + 1 + teams}, ${t + 1 + 2 * teams}, …`;
        const section = el("div", { class: "ck-team" });
        section.append(el("p", { class: "wz-titel", style: `color: ${color}` }, `${teams === 1 ? "Gezählt" : `Team ${t + 1}`}: ${positions}`));
        section.append(
          chart(counts, {
            color,
            marked: asE,
            label: "= E?",
            onPick: (x) => {
              state.chosen[t] = x;
              update();
            },
          }),
        );
        let line = `${ALPHABET[asE]} ist das verkleidete E → Schlüssel ${key}`;
        if (teams > 1) line += ` (Codewort-Buchstabe ${ALPHABET[key]})`;
        if (tops.length > 1) line += `. Gleich oft: ${tops.join(", ")} – probier auch die anderen.`;
        section.append(el("p", {}, line));
        box.append(section);
      }

      const word = keys.map((k) => ALPHABET[k]).join("");
      $("ck-codewort").textContent = teams === 1 ? `Vermuteter Schlüssel: ${keys[0]}` : `Vermutetes Codewort: ${word}`;
      const plain = shift(text, keys, -1);
      $("ck-klartext").textContent = plain.length > MAX_PLAIN_CHARS ? `${plain.slice(0, MAX_PLAIN_CHARS)}…` : plain;

      for (const b of teamButtons) b.setAttribute("aria-pressed", String(Number(b.dataset.teams) === teams));
      for (const b of exampleButtons) b.setAttribute("aria-pressed", String(textInput.value === EXAMPLES[b.dataset.beispiel]));
    }

    setBreakerText = (text) => {
      textInput.value = text;
      state.chosen = [];
      update();
    };

    textInput.addEventListener("input", () => {
      state.chosen = [];
      update();
    });
    for (const b of exampleButtons) b.addEventListener("click", () => setBreakerText(EXAMPLES[b.dataset.beispiel]));
    for (const b of teamButtons) {
      b.addEventListener("click", () => {
        state.teams = Number(b.dataset.teams);
        state.chosen = [];
        update();
      });
    }

    $("ck-deutsch").replaceWith(
      Object.assign(chart(GERMAN, { color: "#1f3a5f", marked: E, label: "E" }), { id: "ck-deutsch" }),
    );
    setBreakerText(EXAMPLES[0]);
  }

  if (breaker) setupBreaker();
  if (cv) setupCipher();
})();
