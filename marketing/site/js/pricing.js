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
  var elShare  = root.querySelector("#sc-share");
  var elShareN = root.querySelector("#sc-share-note");
  var shareMsg = elShareN ? elShareN.textContent : "";

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

  // Shareable scene links — state rides in the URL hash as
  // "#scene=<item>:<qty>,...|<q><s>" so a priced scene survives being sent.
  // The hash carries ingredient picks only — never amounts, never identity.
  function serialize() {
    var items = [];
    Object.keys(ITEMS).forEach(function (k) { if (qty[k]) items.push(k + ":" + qty[k]); });
    if (!items.length) return "";
    var flags = (elQueued.checked ? "q" : "") + (elSurge.checked ? "s" : "");
    return "#scene=" + encodeURIComponent(items.join(",") + "|" + flags);
  }

  function restore() {
    var h = location.hash || "";
    if (h.indexOf("#scene=") !== 0) return false;
    var parts = decodeURIComponent(h.slice(7)).split("|");
    var ok = false;
    (parts[0] || "").split(",").forEach(function (pair) {
      var kv = pair.split(":");
      var k = kv[0], n = parseInt(kv[1], 10);
      if (ITEMS[k] && n > 0) { qty[k] = Math.min(ITEMS[k].max, n); ok = true; }
    });
    var f = parts[1] || "";
    elQueued.checked = f.indexOf("q") !== -1;
    elSurge.checked  = f.indexOf("s") !== -1;
    if (ok) lastPreset = "link";
    return ok;
  }

  function shareNote(text, copied) {
    if (!elShareN) return;
    elShareN.textContent = text;
    elShareN.classList.toggle("copied", !!copied);
  }

  if (elShare) {
    elShare.addEventListener("click", function () {
      var frag = serialize();
      if (!frag) { shareNote("Add ingredients first — then the link writes itself.", false); return; }
      var url = location.origin + location.pathname + frag;
      var method = "manual";
      function done() {
        window.rw && window.rw.track && window.rw.track("share_click", { method: method, surface: "scene" });
      }
      function fallback() {
        method = "manual";
        try { history.replaceState(null, "", frag); } catch (e) {}
        shareNote("Link is in the address bar — copy it from there.", false);
        done();
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          method = "clipboard";
          shareNote("Copied — the link reloads this exact scene.", true);
          done();
        }, fallback);
      } else {
        fallback();
      }
      setTimeout(function () { shareNote(shareMsg, false); }, 6000);
    });
  }

  restore();
  render();
})();

// Subscription breakeven (#sub-calc) — prices the visitor's imagined month
// three ways (packs / Resident stipend / Director stipend) and names the
// cheapest, even when the answer is "don't subscribe". Same constants as
// above; camera is priced as a printed assumption (~2 hrs/mo = 40 cr) and is
// free inside the Director tier (unlocked).
(function () {
  "use strict";

  var root = document.getElementById("sub-calc");
  if (!root) return;

  var COMP_RATE = 1.5, EXCL_RATE = 6.0;
  var CAM_CR = 40;              // printed assumption: ~2 hrs/mo × 10 cr/30 min
  var USD_PER_CR = 0.0094;      // blended fallback when no pack covers
  var SUBS = {
    resident: { usd: 4.99,  cr: 600 },
    director: { usd: 11.99, cr: 1500 }
  };
  var PACKS = [
    { name: "Pocket",  credits: 100,   usd: 0.99 },
    { name: "Starter", credits: 550,   usd: 4.99 },
    { name: "Regular", credits: 1150,  usd: 9.99 },
    { name: "Plus",    credits: 2500,  usd: 19.99 },
    { name: "Pro",     credits: 6750,  usd: 49.99 },
    { name: "Mogul",   credits: 14000, usd: 99.99 }
  ];
  var TIE = 0.25;               // verdicts within 25¢ are called a tie

  var elComp   = root.querySelector("#sc2-comp");
  var elCompO  = root.querySelector("#sc2-comp-out");
  var elExcl   = root.querySelector("#sc2-excl");
  var elExclO  = root.querySelector("#sc2-excl-out");
  var elCam    = root.querySelector("#sc2-cam");
  var elNeed   = root.querySelector("#sc2-need");
  var elPacks  = root.querySelector("#sv-packs-line");
  var elRes    = root.querySelector("#sv-resident-line");
  var elDir    = root.querySelector("#sv-director-line");
  var elVerd   = root.querySelector("#sc2-verdict");
  var lastVerdict = "none";
  var rows     = { packs: root.querySelector("#sv-packs"),
                   resident: root.querySelector("#sv-resident"),
                   director: root.querySelector("#sv-director") };

  function packFor(cr) {
    for (var i = 0; i < PACKS.length; i++) {
      if (PACKS[i].credits >= cr) return PACKS[i];
    }
    return null;
  }
  function money(x) { return "$" + x.toFixed(2); }

  // Cost of a tier = price + smallest pack covering the stipend remainder.
  function tierCost(sub, need) {
    var over = Math.max(0, need - sub.cr);
    if (!over) return { usd: sub.usd, over: 0, pack: null };
    var p = packFor(over);
    return { usd: sub.usd + (p ? p.usd : over * USD_PER_CR), over: over, pack: p };
  }

  function render() {
    var comp = parseInt(elComp.value, 10) || 0;
    var excl = parseInt(elExcl.value, 10) || 0;
    elCompO.textContent = comp + " min";
    elExclO.textContent = excl + " min";

    var need = Math.floor(COMP_RATE * comp) + Math.floor(EXCL_RATE * excl)
             + (elCam.checked ? CAM_CR : 0);
    var needDir = need - (elCam.checked ? CAM_CR : 0); // camera is inside Director
    elNeed.textContent = need ? "~" + need.toLocaleString("en-US") + " cr / mo" : "0 cr";

    Object.keys(rows).forEach(function (k) { rows[k].classList.remove("sv-best"); });

    if (!need) {
      elPacks.textContent = "nothing to buy — watching is free";
      elRes.textContent = "the stipend would sit unused — save the $4.99";
      elDir.textContent = "same, bigger — save the $11.99";
      elVerd.textContent = "Verdict: none. At zero minutes a month the best plan is the free one — the spectator game is the whole product.";
      lastVerdict = "none";
      return;
    }

    var pk = packFor(need);
    var packsUsd = pk ? pk.usd : need * USD_PER_CR;
    var res = tierCost(SUBS.resident, need);
    var dir = tierCost(SUBS.director, needDir);

    elPacks.textContent = pk
      ? pk.name + " pack — " + money(pk.usd) + " covers it"
      : "≈ " + money(packsUsd) + " — bigger than a Mogul; split across packs";

    elRes.textContent = res.over
      ? "$4.99 + " + (res.pack ? res.pack.name + " " + money(res.pack.usd) : "≈" + money(res.over * USD_PER_CR)) +
        " top-up ≈ " + money(res.usd) + " — plus 2nd slot, digest, tie-break"
      : "600-cr stipend covers it — " + money(res.usd) + " all-in, plus 2nd slot + digest" +
        (need <= 400 ? " (" + (600 - need) + " cr headroom)" : "");

    elDir.textContent = dir.over
      ? "$11.99 + " + (dir.pack ? dir.pack.name + " " + money(dir.pack.usd) : "≈" + money(dir.over * USD_PER_CR)) +
        " top-up ≈ " + money(dir.usd) + " — plus 3rd slot, camera mode, cosmetics"
      : "1,500-cr stipend covers it — " + money(dir.usd) + " all-in" +
        (elCam.checked ? ", camera mode unlocked" : "") +
        (needDir <= 1100 ? " (" + (1500 - needDir) + " cr headroom)" : "");

    var opts = [ ["packs", packsUsd], ["resident", res.usd], ["director", dir.usd] ];
    opts.sort(function (a, b) { return a[1] - b[1]; });
    var win = opts[0], second = opts[1];
    var tied = second[1] - win[1] < TIE;

    rows[win[0]].classList.add("sv-best");
    if (tied) rows[second[0]].classList.add("sv-best");

    var names = { packs: "à-la-carte packs", resident: "Resident", director: "Director" };
    var v;
    if (win[0] === "packs" && !tied) {
      v = "Verdict: packs — " + names[win[0]] + " at ≈" + money(win[1]) + "/mo beat both subscriptions " +
          "(next: " + names[second[0]] + " ≈" + money(second[1]) + "). No subscription earns its keep at this pace.";
    } else if (tied) {
      v = "Verdict: a tie — " + names[win[0]] + " and " + names[second[0]] + " both land ≈" + money(win[1]) +
          "/mo. If it's Resident or Director in the tie, the extras (slot, digest, camera) are free on top of the same money.";
    } else {
      v = "Verdict: " + names[win[0]] + " — ≈" + money(win[1]) + "/mo, " + money(second[1] - win[1]) +
          " under " + names[second[0]] + ".";
      if (win[0] === "resident") v += " Second slot + weekly digest ride along free.";
      if (win[0] === "director") v += " Third slot, camera mode, and the monthly cosmetic ride along free.";
    }
    elVerd.textContent = v;
    lastVerdict = tied ? "tie" : win[0];
  }

  var t = null;
  function ping() {
    if (!window.rw || !window.rw.track) return;
    clearTimeout(t);
    t = setTimeout(function () {
      window.rw.track("sub_calc", {
        comp_min: parseInt(elComp.value, 10) || 0,
        excl_min: parseInt(elExcl.value, 10) || 0,
        camera: !!elCam.checked,
        verdict: lastVerdict
      });
    }, 900);
  }

  [elComp, elExcl, elCam].forEach(function (el) {
    el.addEventListener("input", function () { render(); ping(); });
    el.addEventListener("change", function () { render(); ping(); });
  });

  render();
})();

// Print support: an honest price list should print clean. Open every closed
// <details> before printing so the full tables and answers reach the page;
// restore the prior state afterwards.
(function () {
  "use strict";
  var opened = [];
  window.addEventListener("beforeprint", function () {
    opened = [];
    document.querySelectorAll("details:not([open])").forEach(function (d) {
      d.open = true;
      opened.push(d);
    });
  });
  window.addEventListener("afterprint", function () {
    opened.forEach(function (d) { d.open = false; });
    opened = [];
  });
})();
