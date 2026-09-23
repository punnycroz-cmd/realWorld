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
      if (PACKS[i].credits >= credits) { pack = PACKS[i]; break; }
    }
    elPack.textContent = pack
      ? "Covered by the " + pack.name + " pack ($" + pack.usd.toFixed(2) + ")"
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
        surge: !!elSurge.checked
      });
    }, 900);
  }

  [elClass, elDur, elQueued, elSurge].forEach(function (el) {
    el.addEventListener("input", function () { compute(); ping(); });
    el.addEventListener("change", function () { compute(); ping(); });
  });

  compute();
})();
