/*
 * Diffie-Hellman (/themen/rsa-primzahlen/diffie-hellman/), as in the
 * Frankenthal talk: Alia and Ben agree publicly on a prime p and a number g,
 * pick secret a and b, publish A = g^a mod p and B = g^b mod p, and both
 * arrive at the same key g^(a·b) mod p. The eavesdropper knows p, g, A and B
 * and can only try exponents one by one.
 *
 * p stays below 10^12, so the checks work on plain numbers; powers use BigInt.
 */
(() => {
  "use strict";

  const root = document.getElementById("dh");
  if (!root) return;

  const STEPS = 5;
  const MIN_P = 5;
  const MAX_P = 1e12; // p − 1 is factored by trial division
  const MIN_SECRET_DIGITS = 3; // width of the fields for a and b
  const MAX_WRITTEN_DIGITS = 15; // g^a is written out up to this length
  const MAX_TRIES_LISTED = 30;
  const TRIES_PER_CHUNK = 100000; // between two updates of the progress line
  const POWERS_SHOWN = 12; // in the explanations of "Erzeuger" and of gᵃ mod p

  const $ = (id) => document.getElementById(id);
  const inputs = { p: $("dh-p"), g: $("dh-g"), a: $("dh-a"), b: $("dh-b") };
  const presets = root.querySelectorAll("[data-p]");
  const nextButtons = root.querySelectorAll("[data-weiter]");

  const state = { step: 1, p: 29, g: 2, a: 5, b: 8 };
  let search = 0; // timer of the eavesdropper's search

  // ---------------------------------------------------------------------------
  // Arithmetic

  function powMod(base, exp, m) {
    let result = 1n;
    let b = BigInt(base) % BigInt(m);
    let e = BigInt(exp);
    const mm = BigInt(m);
    while (e > 0n) {
      if (e & 1n) result = (result * b) % mm;
      b = (b * b) % mm;
      e >>= 1n;
    }
    return Number(result);
  }

  function smallestFactor(n) {
    if (n % 2 === 0) return 2;
    for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return d;
    return n;
  }

  const factorCache = new Map();

  function primeFactors(n) {
    if (factorCache.has(n)) return factorCache.get(n);
    const original = n;
    const factors = [];
    while (n > 1) {
      const q = smallestFactor(n);
      factors.push(q);
      while (n % q === 0) n /= q;
    }
    factorCache.set(original, factors);
    return factors;
  }

  // how many different numbers the powers of g reach
  function order(g, p) {
    let k = p - 1;
    for (const q of primeFactors(p - 1)) {
      while (k % q === 0 && powMod(g, k / q, p) === 1) k /= q;
    }
    return k;
  }

  function smallestGenerator(p) {
    for (let g = 2; g < p; g++) if (order(g, p) === p - 1) return g;
    return null;
  }

  // ---------------------------------------------------------------------------
  // Text

  const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (n) => String(n).replace(/\d/g, (d) => SUPERSCRIPT[d]);
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // "2⁵ mod 29 = 32 mod 29 = 3", without the middle part for long powers
  function power(base, exp, p) {
    const result = fmt(powMod(base, exp, p));
    if (exp * Math.log10(Math.max(base, 2)) >= MAX_WRITTEN_DIGITS) return `${fmt(base)}${sup(exp)} mod ${fmt(p)} = ${result}`;
    return `${fmt(base)}${sup(exp)} mod ${fmt(p)} = ${fmt(BigInt(base) ** BigInt(exp))} mod ${fmt(p)} = ${result}`;
  }

  function parse(input) {
    const digits = input.value.replace(/[\s. ]/g, "");
    return /^\d+$/.test(digits) ? Number(digits) : NaN;
  }

  // ---------------------------------------------------------------------------
  // Checks and display

  // message about p and g, or null when the numbers do not work
  function check() {
    const { p, g, a, b } = state;
    if (!Number.isSafeInteger(p) || p < MIN_P || p > MAX_P) {
      return { ok: false, text: `Bitte eine Primzahl zwischen ${MIN_P} und ${fmt(MAX_P)} eingeben.` };
    }
    const d = smallestFactor(p);
    if (d !== p) return { ok: false, text: `${fmt(p)} ist keine Primzahl: ${fmt(p)} = ${fmt(d)} · ${fmt(p / d)}.` };
    if (!Number.isSafeInteger(g) || g < 2 || g > p - 2) return { ok: false, text: `g muss zwischen 2 und ${fmt(p - 2)} liegen.` };
    for (const [name, v] of [["a", a], ["b", b]]) {
      if (!Number.isSafeInteger(v) || v < 2 || v > p - 2) {
        return { ok: false, text: `Die geheime Zahl ${name} muss zwischen 2 und ${fmt(p - 2)} liegen.` };
      }
    }

    const reach = order(g, p);
    if (reach === p - 1) {
      return { ok: true, reach, text: `${fmt(p)} ist eine Primzahl, und g = ${fmt(g)} ist ein Erzeuger: Die Potenzen von ${fmt(g)} treffen alle Zahlen von 1 bis ${fmt(p - 1)}.` };
    }
    const better = smallestGenerator(p);
    return {
      ok: true,
      reach,
      text: `Die Potenzen von g = ${fmt(g)} treffen nur ${fmt(reach)} der ${fmt(p - 1)} Zahlen von 1 bis ${fmt(p - 1)}. Das macht es dem Lauscher leichter; ein Erzeuger wäre zum Beispiel g = ${fmt(better)}.`,
    };
  }

  // g¹, g², … mod p up to POWERS_SHOWN, and when 1 comes back
  function generatorExample(result) {
    const { p, g } = state;
    if (!result.ok) return "Gib zuerst eine Primzahl p und eine Zahl g ein.";
    const powers = [];
    for (let k = 1; k <= Math.min(result.reach, POWERS_SHOWN); k++) powers.push(fmt(powMod(g, k, p)));
    const list = `${powers.join(", ")}${result.reach > POWERS_SHOWN ? ", …" : ""}`;
    const start = `Bei p = ${fmt(p)} und g = ${fmt(g)}: ${list}`;
    if (result.reach === p - 1) {
      return `${start} Erst ${fmt(g)}${sup(p - 1)} ist wieder 1, und bis dahin kam jede Zahl von 1 bis ${fmt(p - 1)} genau einmal heraus.`;
    }
    return `${start} Schon ${fmt(g)}${sup(result.reach)} ist wieder 1: Die Potenzen treffen nur ${fmt(result.reach)} der ${fmt(p - 1)} Zahlen, g = ${fmt(g)} ist also kein Erzeuger.`;
  }

  // gᵃ mod p by multiplying with g again and again, keeping only the remainder
  function howTo(result) {
    const box = $("dh-wie");
    box.replaceChildren();
    if (!result.ok) return;
    const { p, g, a } = state;
    const P = BigInt(p);
    const G = BigInt(g);
    const intro = document.createElement("p");
    intro.textContent = `Alia nimmt ${fmt(g)} immer wieder mal ${fmt(g)}, bis sie ${fmt(g)}${sup(a)} hat, und behält nach jedem Mal nur den Rest modulo ${fmt(p)}. So bleiben die Zahlen klein:`;
    const list = document.createElement("ol");
    list.className = "wz-mono";
    let current = G % P;
    const item = (text) => list.append(Object.assign(document.createElement("li"), { textContent: text }));
    item(`${fmt(g)}¹ = ${fmt(current)}`);
    for (let k = 2; k <= Math.min(a, POWERS_SHOWN); k++) {
      const product = current * G;
      current = product % P;
      item(`${fmt(g)}${sup(k)}: ${fmt(product / G)} · ${fmt(g)} = ${fmt(product)}${product >= P ? ` → Rest ${fmt(current)}` : ""}`);
    }
    const end = document.createElement("p");
    end.textContent =
      a <= POWERS_SHOWN
        ? `Also ist A = ${fmt(current)}. Ben rechnet genauso mit b.`
        : `… und so weiter bis ${fmt(g)}${sup(a)} mod ${fmt(p)} = ${fmt(powMod(g, a, p))}: ${fmt(a - 1)}-mal malnehmen. Für große Zahlen gibt es einen viel schnelleren Weg, bei dem man immer wieder quadriert.`;
    box.append(intro, list, end);
  }

  // Baby-Step-Giant-Step needs about 2·√p steps instead of up to p − 2
  function betterAttacks() {
    const { p } = state;
    const known = Number.isSafeInteger(p) && p >= MIN_P;
    const steps = known ? `etwa ${fmt(2 * Math.ceil(Math.sqrt(p - 1)))} Rechenschritten statt mit bis zu ${fmt(p - 2)}` : "viel weniger Rechenschritten";
    return `Ausprobieren ist der einfachste Angriff, aber nicht der schnellste. Mit dem Verfahren „Baby-Step-Giant-Step“ käme der Lauscher hier mit ${steps} aus, und es gibt noch schnellere. Deshalb nimmt man im Internet Primzahlen mit über 600 Stellen: Dann hilft auch das beste bekannte Verfahren nicht.`;
  }

  function update() {
    stopSearch();
    $("dh-versuche").replaceChildren();
    $("dh-lauscher").textContent = "";

    const result = check();
    $("dh-pruefung").textContent = result.text;
    $("dh-pruefung").className = result.ok ? "wz-klein" : "wz-klein wz-falsch";
    $("dh-erzeuger-beispiel").textContent = generatorExample(result);
    howTo(result);
    $("dh-besser").textContent = betterAttacks();
    for (const button of presets) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.p) === state.p && Number(button.dataset.g) === state.g));
    }

    const { p, g, a, b } = state;
    const pKnown = Number.isSafeInteger(p) && p >= MIN_P;
    for (const range of root.querySelectorAll(".dh-bereich")) range.textContent = `2 bis ${pKnown ? fmt(p - 2) : "p − 2"}`;
    for (const key of ["a", "b"]) {
      if (!pKnown) {
        inputs[key].removeAttribute("max");
        continue;
      }
      inputs[key].max = p - 2;
      // digits of the largest secret, plus room for padding and the spin buttons
      inputs[key].style.width = `calc(${Math.max(MIN_SECRET_DIGITS, String(p - 2).length)}ch + 2.8em)`;
    }

    const A = result.ok ? powMod(g, a, p) : null;
    const B = result.ok ? powMod(g, b, p) : null;
    const show = (v) => (v === null ? "?" : fmt(v));

    $("dh-A").textContent = show(A);
    $("dh-B").textContent = show(B);
    $("dh-alia-rechnet").textContent = result.ok ? `A = ${power(g, a, p)}` : "";
    $("dh-ben-rechnet").textContent = result.ok ? `B = ${power(g, b, p)}` : "";
    $("dh-alia-schluessel").textContent = result.ok ? `Bᵃ mod p = ${power(B, a, p)}` : "";
    $("dh-ben-schluessel").textContent = result.ok ? `Aᵇ mod p = ${power(A, b, p)}` : "";
    $("dh-k").textContent = result.ok ? fmt(powMod(A, b, p)) : "?";
    for (const [id, v] of [["dh-l-p", p], ["dh-l-g", g], ["dh-l-A", A], ["dh-l-B", B]]) $(id).textContent = show(v);
    $("dh-lauschen").disabled = !result.ok;
    state.A = A;
    state.B = B;
  }

  // Layers not reached yet keep their space, so the page has the same height
  // in every step; so does the "Weiter" of a layer once it was used.
  function showStep() {
    for (const layer of root.querySelectorAll("[data-schritt]")) {
      const visible = Number(layer.dataset.schritt) <= state.step;
      if (visible && layer.classList.contains("dh-spaeter")) layer.classList.add("dh-neu");
      layer.classList.toggle("dh-spaeter", !visible);
    }
    for (const button of nextButtons) button.parentElement.classList.toggle("dh-spaeter", Number(button.dataset.weiter) <= state.step);
    $("dh-alles").disabled = state.step === STEPS;
    $("dh-von-vorn").disabled = state.step === 1;
  }

  function goTo(step) {
    state.step = step;
    showStep();
    const layer = root.querySelector(`[data-schritt="${step}"]`);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    layer.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
    layer.querySelector("h3").focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------------------
  // The eavesdropper tries g¹, g², … until A comes out

  function stopSearch() {
    clearTimeout(search);
    search = 0;
    $("dh-anhalten").hidden = true;
  }

  function eavesdrop() {
    stopSearch();
    const { p, g, A, B } = state;
    const list = $("dh-versuche");
    const status = $("dh-lauscher");
    list.replaceChildren();
    $("dh-anhalten").hidden = false;

    const P = BigInt(p);
    const G = BigInt(g);
    const target = BigInt(A);
    let x = 0;
    let current = 1n;
    const started = performance.now();

    const run = () => {
      const end = x + TRIES_PER_CHUNK;
      while (x < end && x < p - 1) {
        x++;
        current = (current * G) % P;
        const hit = current === target;
        if (x <= MAX_TRIES_LISTED) {
          const item = document.createElement("li");
          item.textContent = `${fmt(g)}${sup(x)} mod ${fmt(p)} = ${fmt(current)}${hit ? " ✓" : ""}`;
          list.append(item);
        }
        if (hit) {
          stopSearch();
          status.textContent = `Gefunden nach ${fmt(x)} Versuchen: g${sup(x)} mod p = A. Jetzt rechnet der Lauscher B${sup(x)} mod p = ${fmt(powMod(B, x, p))} und kennt den Schlüssel. Bei kleinen Primzahlen ist das schnell gemacht.`;
          return;
        }
      }
      if (x >= p - 1) {
        stopSearch();
        status.textContent = "Kein Exponent passt – das kann nicht sein.";
        return;
      }
      const seconds = (performance.now() - started) / 1000;
      const rate = x / seconds;
      const minutes = Math.round((p - 1) / rate / 60);
      status.textContent = `Schon ${fmt(x)} Versuche, etwa ${fmt(Math.round(rate))} pro Sekunde. Im schlimmsten Fall braucht der Lauscher ${fmt(p - 2)} Versuche, bei diesem Tempo rund ${fmt(minutes)} Minuten.`;
      if (x > MAX_TRIES_LISTED && list.lastElementChild?.textContent !== "…") {
        const more = document.createElement("li");
        more.textContent = "…";
        list.append(more);
      }
      search = setTimeout(run, 0);
    };
    run();
  }

  // ---------------------------------------------------------------------------
  // Controls

  function readInputs() {
    for (const key of ["p", "g", "a", "b"]) state[key] = parse(inputs[key]);
  }

  function writeInputs() {
    for (const key of ["p", "g", "a", "b"]) inputs[key].value = state[key];
  }

  function randomSecret() {
    return 2 + Math.floor(Math.random() * (state.p - 3));
  }

  for (const input of Object.values(inputs)) {
    input.addEventListener("input", () => {
      readInputs();
      update();
    });
  }

  for (const button of presets) {
    button.addEventListener("click", () => {
      state.p = Number(button.dataset.p);
      state.g = Number(button.dataset.g);
      if (state.p === 29) Object.assign(state, { a: 5, b: 8 });
      else Object.assign(state, { a: randomSecret(), b: randomSecret() });
      writeInputs();
      update();
    });
  }

  for (const name of ["a", "b"]) {
    $(`dh-${name}-zufall`).addEventListener("click", () => {
      if (!(state.p >= MIN_P)) return;
      state[name] = randomSecret();
      writeInputs();
      update();
    });
  }

  for (const button of nextButtons) button.addEventListener("click", () => goTo(Number(button.dataset.weiter)));
  $("dh-alles").addEventListener("click", () => {
    state.step = STEPS;
    showStep();
  });
  $("dh-von-vorn").addEventListener("click", () => goTo(1));

  // the word "Erzeuger" opens and closes its explanation
  const term = root.querySelector(".dh-begriff");
  term.addEventListener("click", () => {
    const open = term.getAttribute("aria-expanded") !== "true";
    term.setAttribute("aria-expanded", String(open));
    $("dh-erzeuger").hidden = !open;
  });
  $("dh-lauschen").addEventListener("click", eavesdrop);
  $("dh-anhalten").addEventListener("click", () => {
    stopSearch();
    $("dh-lauscher").textContent += " Angehalten.";
  });

  root.addEventListener("animationend", (e) => e.target.classList.remove("dh-neu"));

  for (const heading of root.querySelectorAll(".dh-schicht h3")) heading.tabIndex = -1;
  writeInputs();
  update();
  showStep();
})();
