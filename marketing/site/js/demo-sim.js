// Real World — demo page request simulator (demo.html only).
// Local-only simulation of the request pipeline: nothing is filed, no
// credits move. Rates/classes mirror js/pricing.js and
// marketing/PRICING-PAGE-CONTENT.md §2 — keep the three in sync while
// <body data-pricing="provisional"> is set.
//
// The text screen below is a TOY: it pattern-matches a few phrases onto the
// real reason-code taxonomy (world/moderation.json) so visitors can feel the
// pipeline shape. The shipped screen reads intent, not keywords, and every
// exclusive request is human-reviewed — the sim says so on the card.
(function () {
  "use strict";

  var root = document.getElementById("request-sim");
  if (!root) return;

  // Canonical rates (PRICING-PAGE-CONTENT.md §2 — PROPOSAL figures).
  var USD_PER_CR = 0.0094;
  var QUEUE_DISCOUNT = 0.85;      // queued = class rate −15%
  var SURGE_MIN = 1.5, SURGE_MAX = 2.5;
  var ACTIONS = {
    possess: {
      label: "Possess your resident",
      cls: "compatible", rate: 1.5, cap: 120,
      blurb: "Runs alongside everyone else's compatible requests — no shared resource is locked. Control hands back to the resident's AI when time ends.",
      feed: "possess — own resident, {min} min"
    },
    venue: {
      label: "Reserve a venue",
      cls: "exclusive", rate: 6.0, cap: 60, surgeable: true,
      blurb: "Locks the venue slot while it runs — other exclusive requests on the same space queue first-come or bounce. Every exclusive request is human-reviewed before it fires.",
      feed: "venue — The 600 Club back room, {min} min"
    },
    weather: {
      label: "Call the weather",
      cls: "flat", flat: 100, minutes: 120, durLabel: "2 h block",
      blurb: "Flat price by duration block (40–100 cr), not per-minute — weather is one atomic world event. Global cooldown keeps it special; the feed credits you by name.",
      feed: "weather — evening fog, 2 h block"
    },
    event: {
      label: "Trigger an event",
      cls: "flat", lo: 150, hi: 300, durLabel: "one-shot",
      blurb: "One-shot action, quoted 150–300 cr before you pay — a public event like the park cleanup lands on the feed with your name on it.",
      feed: "event — park cleanup at Dolores Park"
    }
  };

  // Toy intent screen — a few phrases mapped onto the real deny/review
  // reason codes. The shipped classifier reads intent, not keywords.
  var SCREEN = [
    { re: /\b(kill|hurt|fight|attack|beat|ruin|punish|harass)\b/i,
      code: "harm-targeting", tier: "deny",
      msg: "Request not approved. Requests that target a resident — real harm, humiliation, staged fights — are denied outright and refunded in full." },
    { re: /\b(secret|what is .{0,20}hiding|confess|diary|dossier)\b/i,
      code: "secret-extraction", tier: "deny",
      msg: "Request not approved. Nobody can ask a resident to reveal a secret — secrets are absent from every player-facing schema, not just filtered." },
    { re: /\b(evict|rent|lease|landlord|raise the rent)\b/i,
      code: "admin-domain", tier: "deny",
      msg: "Request not approved. Rent, leases, and evictions are admin-only powers — no request can touch another resident's tenancy." },
    { re: /\b(starbucks|chipotle|whole foods|walgreens)\b/i,
      code: "real-business", tier: "deny",
      msg: "Request not approved — but close. The block only has parody businesses; the real screen suggests the right name (try Mudhaus)." },
    { re: /\b(marriage|husband|wife|break ?up|divorce|flirt|seduce|date)\b/i,
      code: "surface-relationship", tier: "review",
      msg: "In review. Requests that touch a main resident's job, marriage, or friendships always get human eyes first — no promised review time." },
    { re: /\b(park|alley|venue|block party|street)\b.*\b(lock|reserve|close|take over)\b/i,
      code: "venue-lock", tier: "review",
      msg: "In review. Locking a story-adjacent space goes to a human reviewer before it can fire." }
  ];

  var elAction = root.querySelector("#rs-action");
  var elDur    = root.querySelector("#rs-duration");
  var elDurOut = root.querySelector("#rs-duration-out");
  var elDurFld = root.querySelector("#rs-dur-field");
  var elText   = root.querySelector("#rs-text");
  var elQueued = root.querySelector("#rs-queued");
  var elQField = root.querySelector("#rs-queued-field");
  var elSurge  = root.querySelector("#rs-surge");
  var elSField = root.querySelector("#rs-surge-field");
  var elFile   = root.querySelector("#rs-file");
  var elResult = root.querySelector("#rs-result");
  var elFeed   = root.querySelector("#rs-feed");
  var elRows   = root.querySelector("#rs-feed-rows");

  function fmtUsd(x) {
    return x < 1 ? (x * 100).toFixed(0) + "¢" : "$" + x.toFixed(2);
  }

  function sync() {
    var a = ACTIONS[elAction.value];
    if (a.cls === "flat") {
      elDur.disabled = true;
      elDurFld.style.opacity = "0.45";
      elDurOut.textContent = a.durLabel;
    } else {
      elDur.disabled = false;
      elDurFld.style.opacity = "";
      elDur.max = a.cap;
      var min = Math.max(15, Math.min(a.cap, parseInt(elDur.value, 10) || 15));
      elDur.value = min;
      elDurOut.textContent = min + " min";
    }
    elSField.hidden = !a.surgeable;
    if (!a.surgeable) elSurge.checked = false;
  }

  var simClock = 18 * 60 + 50; // feed rows continue after the preview's last
  function stamp() {
    simClock += 3 + Math.floor(Math.random() * 9);
    var h = Math.floor(simClock / 60) % 24, m = simClock % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function screenText() {
    var t = (elText.value || "").trim();
    if (!t) return null;
    for (var i = 0; i < SCREEN.length; i++) {
      if (SCREEN[i].re.test(t)) return SCREEN[i];
    }
    return null;
  }

  function file() {
    var a = ACTIONS[elAction.value];
    var hit = screenText();
    var denied = hit && hit.tier === "deny";
    var review = (hit && hit.tier === "review") || a.cls === "exclusive";

    var min = a.cls === "flat" ? (a.minutes || 0) : parseInt(elDur.value, 10) || 15;
    var credits, quote;
    if (a.lo) {
      credits = a.lo; quote = a.lo + "–" + a.hi + " cr";
    } else {
      var rate = a.cls === "flat" ? 0
        : a.rate * (elQueued.checked ? QUEUE_DISCOUNT : 1);
      credits = a.cls === "flat" ? a.flat
        : Math.max(1, Math.floor(rate * min));
      quote = "~" + credits.toLocaleString("en-US") + " cr";
    }
    var surgeNote = "";
    if (a.surgeable && elSurge.checked) {
      surgeNote = ' <span class="muted">surge window ' +
        Math.ceil(credits * SURGE_MIN).toLocaleString("en-US") + "–" +
        Math.ceil(credits * SURGE_MAX).toLocaleString("en-US") +
        " cr shown before you pay</span>";
    }

    var status, clsTag, step3;
    if (denied) {
      status = "request · not approved"; clsTag = "tag-refund";
      step3 = "Denied — nothing runs, nothing bills. Credits returned in full.";
    } else if (review) {
      status = "request · in_review"; clsTag = "tag-queue";
      step3 = "Human review first — the code class is public, the screened text never is. No review time is promised; expirations auto-refund.";
    } else if (elQueued.checked && a.cls !== "flat") {
      status = "request · queued"; clsTag = "tag-queue";
      step3 = "Queued first-come at −15% — if the slot never opens, it auto-refunds.";
    } else {
      status = "request · approved"; clsTag = "tag-run";
      step3 = "Runs — injected as an opportunity, never mind-control. The resident's AI renders the how.";
    }

    elResult.innerHTML =
      '<div class="sim-verdict">' +
        '<span class="feed-tag ' + clsTag + '">' + status + '</span>' +
        '<strong>' + quote + '</strong>' +
        '<span class="muted">≈ ' + fmtUsd(credits * USD_PER_CR) + ' at ~1¢/credit</span>' +
        surgeNote +
      '</div>' +
      (hit ? '<p><b>Screen: <code>' + hit.code + '</code>.</b> ' + hit.msg + '</p>' : '<p>' + a.blurb + '</p>') +
      '<ol class="sim-steps">' +
        '<li>Declared upfront — action + ' + (a.durLabel || min + " min") + ', credits held.</li>' +
        '<li>Screened — intent read from the request text' + (hit ? ' (<code>' + hit.code + '</code>)' : ' — clean') + '.</li>' +
        '<li>' + step3 + '</li>' +
        '<li>Attributed — your name lands on the public feed, whatever the outcome.</li>' +
      '</ol>' +
      '<p class="muted" style="font-size:13px">Simulation only — the real pipeline screens, prices, and publishes at launch. The toy screen keyword-matches; the shipped one reads intent.</p>';

    elFeed.hidden = false;
    var row = document.createElement("div");
    row.className = "feed-row";
    row.innerHTML =
      '<span class="feed-time">' + stamp() + '</span>' +
      '<span class="feed-tag ' + clsTag + '">' + status + '</span>' +
      '<p>' + a.feed.replace("{min}", min) + ' — filed by <b>you</b> (simulated), ' + quote + '.</p>';
    elRows.insertBefore(row, elRows.firstChild);
    while (elRows.children.length > 4) elRows.removeChild(elRows.lastChild);

    if (window.rw && window.rw.track) {
      window.rw.track("request_simulated", {
        action: elAction.value, "class": a.cls,
        minutes: min, credits: credits,
        queued: !!elQueued.checked, surge: !!(a.surgeable && elSurge.checked),
        screened: hit ? hit.code : "clean"
      });
    }
  }

  elAction.addEventListener("change", sync);
  elDur.addEventListener("input", sync);
  elFile.addEventListener("click", file);
  sync();
})();
