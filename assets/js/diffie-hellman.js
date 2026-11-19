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
  const MAX_WRITTEN_DIGITS = 15; // g^a is written out up to this length
  const MAX_TRIES_LISTED = 30;
  const TRIES_PER_CHUNK = 100000; // between two updates of the progress line

  const NARRATION = [
    "Alia und Ben einigen sich vor der ganzen Klasse auf eine Primzahl p und eine Zahl g.",
    "Jeder wählt eine geheime Zahl und verrät sie niemandem: Alia wählt a, Ben wählt b.",
    "Alia rechnet A = gᵃ mod p, Ben rechnet B = gᵇ mod p. Beide rufen ihr Ergebnis laut in die Klasse.",
    "Alia rechnet Bᵃ mod p, Ben rechnet Aᵇ mod p. Beide kommen auf dieselbe Zahl: ihren gemeinsamen Schlüssel.",
    "Der Lauscher hat alles mitgehört. Für den Schlüssel bräuchte er a oder b. Findet er sie heraus?",
  ];

  const $ = (id) => document.getElementById(id);
  const inputs = { p: $("dh-p"), g: $("dh-g"), a: $("dh-a"), b: $("dh-b") };
  const presets = root.querySelectorAll("[data-p]");

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
      return { ok: true, text: `${fmt(p)} ist eine Primzahl, und g = ${fmt(g)} ist ein Erzeuger: Die Potenzen von ${fmt(g)} treffen alle Zahlen von 1 bis ${fmt(p - 1)}.` };
    }
    const better = smallestGenerator(p);
    return {
      ok: true,
      text: `Die Potenzen von g = ${fmt(g)} treffen nur ${fmt(reach)} der ${fmt(p - 1)} Zahlen von 1 bis ${fmt(p - 1)}. Das macht es dem Lauscher leichter; ein Erzeuger wäre zum Beispiel g = ${fmt(better)}.`,
    };
  }

  function update() {
    stopSearch();
    $("dh-versuche").replaceChildren();
    $("dh-lauscher").textContent = "";

    const result = check();
    $("dh-pruefung").textContent = result.text;
    $("dh-pruefung").className = result.ok ? "wz-klein" : "wz-klein wz-falsch";
    for (const button of presets) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.p) === state.p && Number(button.dataset.g) === state.g));
    }

    const { p, g, a, b } = state;
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

  function showStep() {
    for (const part of root.querySelectorAll("[data-schritt]")) {
      const visible = Number(part.dataset.schritt) <= state.step;
      if (visible && part.hidden) part.classList.add("dh-neu");
      part.hidden = !visible;
    }
    $("dh-schritt").textContent = `Schritt ${state.step} von ${STEPS}`;
    $("dh-ansage").textContent = NARRATION[state.step - 1];
    $("dh-zurueck").disabled = state.step === 1;
    $("dh-weiter").disabled = state.step === STEPS;
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
          status.textContent = `Gefunden nach ${fmt(x)} Versuchen: g${sup(x)} mod p = A. Jetzt rechnet der Lauscher B${sup(x)} mod p = ${fmt(powMod(B, x, p))} und kennt den Schlüssel. Bei kleinen Primzahlen ist das schnell gemacht – deshalb nimmt man im Internet Primzahlen mit über 600 Stellen. Dann dauert Ausprobieren länger, als das Weltall alt ist, und auch die besten bekannten Rechenverfahren schaffen es nicht.`;
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
    $(`dh-${name}-wuerfeln`).addEventListener("click", () => {
      if (!(state.p >= MIN_P)) return;
      state[name] = randomSecret();
      writeInputs();
      update();
    });
  }

  $("dh-weiter").addEventListener("click", () => {
    state.step = Math.min(STEPS, state.step + 1);
    showStep();
  });
  $("dh-zurueck").addEventListener("click", () => {
    state.step = Math.max(1, state.step - 1);
    showStep();
  });
  $("dh-alles").addEventListener("click", () => {
    state.step = STEPS;
    showStep();
  });
  $("dh-lauschen").addEventListener("click", eavesdrop);
  $("dh-anhalten").addEventListener("click", () => {
    stopSearch();
    $("dh-lauscher").textContent += " Angehalten.";
  });

  root.addEventListener("animationend", (e) => e.target.classList.remove("dh-neu"));

  writeInputs();
  update();
  showStep();
})();
