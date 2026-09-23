// Real World — pricing page cost estimator (pricing.html only).
// Vanilla JS, no dependencies, progressive enhancement: the rates table
// below the widget is the no-JS source of truth; this only re-labels math.
// Numbers MUST stay in sync with marketing/PRICING-PAGE-CONTENT.md §2 —
// they are PROPOSAL figures while <body data-pricing="provisional">.
(function () {
  "use strict";

  var root = document.getElementById("cost-calc");
  if (!root) return;

  // Canonical rates (PRICING-PAGE-CONTENT.md §2 — keep in sync).
  var CLASSES = {
    compatible: { rate: 1.5, cap: 120, label: "Compatible" },
    exclusive:  { rate: 6.0, cap: 60,  label: "Exclusive" }
  };
  var QUEUE_DISCOUNT = 0.85;   // queued = class rate −15%
  var FIRST_BONUS = 1.5;       // first pack purchase: +50% credits
  var SURGE_MIN = 1.5, SURGE_MAX = 2.5;
  var USD_PER_CR = 0.0094;     // ~1¢ blended; matches "~$0.85/hr" printed copy
  var PACKS = [
    { name: "Pocket",  credits: 100,   usd: 0.99 },
    { name: "Starter", credits: 550,   usd: 4.99 },
    { name: "Regular", credits: 1150,  usd: 9.99 },
    { name: "Plus",    credits: 2500,  usd: 19.99 },
    { name: "Pro",     credits: 6750,  usd: 49.99 },
    { name: "Mogul",   credits: 14000, usd: 99.99 }
  ];

  var elClass   = root.querySelector("#cc-class");
  var elDur     = root.querySelector("#cc-duration");
  var elDurOut  = root.querySelector("#cc-duration-out");
  var elQueued  = root.querySelector("#cc-queued");
  var elSurge   = root.querySelector("#cc-surge");
  var elFirst   = root.querySelector("#cc-first");
  var elCredits = root.querySelector("#cc-credits");
  var elUsd     = root.querySelector("#cc-usd");
  var elSurgeR  = root.querySelector("#cc-surge-range");
  var elPack    = root.querySelector("#cc-pack");
  var elNote    = root.querySelector("#cc-note");

  function fmtUsd(x) {
    return x < 1 ? (x * 100).toFixed(0) + "¢" : "$" + x.toFixed(2);
  }

  function compute() {
    var cls = CLASSES[elClass.value] || CLASSES.compatible;
    var min = Math.max(15, Math.min(cls.cap, parseInt(elDur.value, 10) || 15));
    if (parseInt(elDur.value, 10) !== min) elDur.value = min;
    elDur.max = cls.cap;
    elDurOut.textContent = min + " min";

    var rate = cls.rate * (elQueued.checked ? QUEUE_DISCOUNT : 1);
    var credits = Math.max(1, Math.floor(rate * min)); // floor → matches "~22 cr" printed copy
    var usd = credits * USD_PER_CR;

    elCredits.textContent = "~" + credits.toLocaleString("en-US") + " cr";
    elUsd.textContent = "≈ " + fmtUsd(usd) + " at ~1¢/credit";

    if (elSurge.checked) {
      var lo = Math.ceil(credits * SURGE_MIN), hi = Math.ceil(credits * SURGE_MAX);
      elSurgeR.textContent = "surge window: " + lo.toLocaleString("en-US") +
        "–" + hi.toLocaleString("en-US") + " cr (×" + SURGE_MIN + "–" + SURGE_MAX + ", shown before you pay)";
      elSurgeR.hidden = false;
    } else {
      elSurgeR.hidden = true;
    }

    var pack = null;
    for (var i = 0; i < PACKS.length; i++) {
      var eff = elFirst.checked ? Math.floor(PACKS[i].credits * FIRST_BONUS) : PACKS[i].credits;
      if (eff >= credits) { pack = PACKS[i]; break; }
    }
    elPack.textContent = pack
      ? "Covered by the " + pack.name + " pack ($" + pack.usd.toFixed(2) + ")" +
        (elFirst.checked ? " with the first-purchase +50% bonus" : "")
      : "Bigger than the Mogul pack — split into multiple sessions (caps apply)";

    elNote.textContent = elQueued.checked
      ? "Queued price (−15%). If the slot never frees, it auto-refunds."
      : cls.label + " session, " + min + " min of a " + cls.cap + "-min cap. Hard cap — control hands back when time ends.";
  }

  // Debounced analytics: what do visitors actually price out?
  var t = null;
  function ping() {
    if (!window.rw || !window.rw.track) return;
    clearTimeout(t);
    t = setTimeout(function () {
      window.rw.track("price_calc", {
        "class": elClass.value,
        minutes: parseInt(elDur.value, 10) || 0,
        queued: !!elQueued.checked,
        surge: !!elSurge.checked,
        first: !!elFirst.checked
      });
    }, 900);
  }

  [elClass, elDur, elQueued, elSurge, elFirst].forEach(function (el) {
    el.addEventListener("input", function () { compute(); ping(); });
    el.addEventListener("change", function () { compute(); ping(); });
  });

  compute();
})();

// Scene builder (#scene-calc) — bundles any mix of priced items into one
// honest total. Same constants as the estimator above; range-priced items
// contribute a low–high range, the total is never more than the top.
(function () {
  "use strict";

  var root = document.getElementById("scene-calc");
  if (!root) return;

  var USD_PER_CR = 0.0094;   // ~1¢ blended — same as the estimator
  var QUEUE = 0.85;
  var SURGE_MIN = 1.5, SURGE_MAX = 2.5;
  var FIRST_BONUS = 1.5;
  var PACKS = [
    { name: "Pocket",  credits: 100,   usd: 0.99 },
    { name: "Starter", credits: 550,   usd: 4.99 },
    { name: "Regular", credits: 1150,  usd: 9.99 },
    { name: "Plus",    credits: 2500,  usd: 19.99 },
    { name: "Pro",     credits: 6750,  usd: 49.99 },
    { name: "Mogul",   credits: 14000, usd: 99.99 }
  ];

  // unit = cr per stepper unit at the printed low–high range; per-15-min
  // session units are floored exactly like the estimator's floor().
  var ITEMS = {
    compatible: { max: 8, lo: 22,  hi: 22,   qlo: 19,  qhi: 19,  sess: true,  unit: "15 min" },
    exclusive:  { max: 4, lo: 90,  hi: 90,   qlo: 76,  qhi: 76,  sess: true,  surge: true, unit: "15 min" },
    weather:    { max: 3, lo: 40,  hi: 100 },
    nudge:      { max: 4, lo: 30,  hi: 60  },
    event:      { max: 2, lo: 150, hi: 300 },
    camera:     { max: 4, lo: 10,  hi: 10,   unit: "30 min" },
    slot:       { max: 3, lo: 500, hi: 500 }
  };

  var PRESETS = {
    fog:    { weather: 1 },
    hour:   { compatible: 4 },
    party:  { event: 1, exclusive: 2 },
    movein: { slot: 1, compatible: 2 },
    reset:  {}
  };

  var qty = {};
  Object.keys(ITEMS).forEach(function (k) { qty[k] = 0; });
  var lastPreset = "none";

  var elQueued = root.querySelector("#sc-queued");
  var elSurge  = root.querySelector("#sc-surge");
  var elCr     = root.querySelector("#sc-credits");
  var elUsd    = root.querySelector("#sc-usd");
  var elPack   = root.querySelector("#sc-pack");
  var elNote   = root.querySelector("#sc-note");

  function fmtUsd(x) {
    return x < 1 ? (x * 100).toFixed(0) + "¢" : "$" + x.toFixed(2);
  }

  function coveringPack(credits, bonus) {
    for (var i = 0; i < PACKS.length; i++) {
      var eff = bonus ? Math.floor(PACKS[i].credits * bonus) : PACKS[i].credits;
      if (eff >= credits) return PACKS[i];
    }
    return null;
  }

  function totals() {
    var lo = 0, hi = 0, ranged = false, any = false;
    Object.keys(ITEMS).forEach(function (k) {
      var it = ITEMS[k], n = qty[k];
      if (!n) return;
      any = true;
      var ilo = (elQueued.checked && it.sess) ? it.qlo : it.lo;
      var ihi = (elQueued.checked && it.sess) ? it.qhi : it.hi;
      var blo = ilo * n, bhi = ihi * n;
      if (it.surge && elSurge.checked) {
        blo = Math.ceil(blo * SURGE_MIN);
        bhi = Math.ceil(bhi * SURGE_MAX);
      }
      lo += blo; hi += bhi;
      if (bhi > blo) ranged = true;
    });
    return { lo: lo, hi: hi, ranged: ranged, any: any };
  }

  function render() {
    Object.keys(ITEMS).forEach(function (k) {
      var out = root.querySelector("#sc-q-" + k);
      if (!out) return;
      out.textContent = ITEMS[k].unit
        ? qty[k] + " × " + ITEMS[k].unit
        : String(qty[k]);
    });

    var t = totals();
    if (!t.any) {
      elCr.textContent = "0 cr";
      elUsd.textContent = "add ingredients to price a scene";
      elPack.textContent = "";
      elNote.textContent = "";
      return;
    }

    elCr.textContent = t.ranged
      ? t.lo.toLocaleString("en-US") + "–" + t.hi.toLocaleString("en-US") + " cr"
      : "~" + t.lo.toLocaleString("en-US") + " cr";
    elUsd.textContent = t.ranged
      ? "≈ " + fmtUsd(t.lo * USD_PER_CR) + "–" + fmtUsd(t.hi * USD_PER_CR) + " at ~1¢/credit"
      : "≈ " + fmtUsd(t.lo * USD_PER_CR) + " at ~1¢/credit";

    var pack = coveringPack(t.hi, 0);
    var first = coveringPack(t.hi, FIRST_BONUS);
    if (!pack) {
      elPack.textContent = "Bigger than the Mogul pack — split the scene across sessions (caps apply)";
    } else {
      elPack.textContent = "Covered by the " + pack.name + " pack ($" + pack.usd.toFixed(2) + ")" +
        (first && first !== pack ? " — or " + first.name + " ($" + first.usd.toFixed(2) + ") with the first-purchase +50% bonus" : "");
    }

    var bits = [];
    if (t.ranged) bits.push("range-priced ingredients show their range — the checkout pins each number before you pay");
    if (elQueued.checked) bits.push("sessions queued at −15%; a slot that never frees auto-refunds");
    if (elSurge.checked && qty.exclusive) bits.push("exclusive minutes at ×" + SURGE_MIN + "–" + SURGE_MAX + " surge");
    if (qty.nudge) bits.push("declined nudges return 50% — you buy the ask, not the outcome");
    elNote.textContent = bits.join(" · ");
  }

  // Debounced analytics: which scenes visitors price out — never amounts.
  var t = null;
  function ping(preset) {
    if (!window.rw || !window.rw.track) return;
    clearTimeout(t);
    t = setTimeout(function () {
      var items = [];
      Object.keys(ITEMS).forEach(function (k) { if (qty[k]) items.push(k + ":" + qty[k]); });
      window.rw.track("scene_calc", {
        items: items.join(",") || "empty",
        queued: !!elQueued.checked,
        surge: !!elSurge.checked,
        preset: preset || lastPreset
      });
    }, 900);
  }

  root.querySelectorAll(".srow").forEach(function (row) {
    var k = row.getAttribute("data-item");
    row.querySelectorAll("button[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = qty[k] + parseInt(btn.getAttribute("data-step"), 10);
        qty[k] = Math.max(0, Math.min(ITEMS[k].max, n));
        lastPreset = "none";
        render(); ping();
      });
    });
  });

  root.querySelectorAll("[data-scene]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = PRESETS[btn.getAttribute("data-scene")] || {};
      Object.keys(ITEMS).forEach(function (k) { qty[k] = p[k] || 0; });
      lastPreset = btn.getAttribute("data-scene");
      render(); ping(lastPreset);
    });
  });

  [elQueued, elSurge].forEach(function (el) {
    el.addEventListener("change", function () { render(); ping(); });
  });

  render();
})();
