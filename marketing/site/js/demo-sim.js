// Real World — demo page request simulator (demo.html only).
// Local-only simulation of the request pipeline: nothing is filed, no
// credits move. Rates/classes mirror js/pricing.js and
// marketing/PRICING-PAGE-CONTENT.md §2 — keep the three in sync while
// <body data-pricing="provisional"> is set.
(function () {
  "use strict";

  var root = document.getElementById("request-sim");
  if (!root) return;

  // Canonical rates (PRICING-PAGE-CONTENT.md §2 — PROPOSAL figures).
  var USD_PER_CR = 0.0094;
  var ACTIONS = {
    possess: {
      label: "Possess your resident",
      cls: "compatible", rate: 1.5, cap: 120,
      blurb: "Runs alongside everyone else's compatible requests — no shared resource is locked. Control hands back to the resident's AI when time ends.",
      feed: "Possession of a hired resident — {min} min, compatible."
    },
    venue: {
      label: "Reserve a venue",
      cls: "exclusive", rate: 6.0, cap: 60,
      blurb: "Locks the venue slot while it runs — other exclusive requests on the same space queue first-come or bounce. Surge pricing is shown before you pay if the slot was recently used.",
      feed: "Venue reservation — {min} min, exclusive."
    },
    weather: {
      label: "Call the weather",
      cls: "flat", flat: 100, minutes: 120,
      blurb: "Flat price by duration block (40–100 cr), not per-minute — weather is one atomic world event. Global cooldown keeps it special; the feed credits you by name.",
      feed: "Weather request — evening fog, 2 h block."
    }
  };

  var elAction = root.querySelector("#rs-action");
  var elDur    = root.querySelector("#rs-duration");
  var elDurOut = root.querySelector("#rs-duration-out");
  var elDurFld = root.querySelector("#rs-dur-field");
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
      elDur.value = a.minutes;
      elDurOut.textContent = "2 h block";
    } else {
      elDur.disabled = false;
      elDur.max = a.cap;
      var min = Math.max(15, Math.min(a.cap, parseInt(elDur.value, 10) || 15));
      elDur.value = min;
      elDurOut.textContent = min + " min";
    }
  }

  var simClock = 18 * 60 + 50; // feed rows continue after the preview's 19:03
  function stamp() {
    simClock += 3 + Math.floor(Math.random() * 9);
    var h = Math.floor(simClock / 60) % 24, m = simClock % 60;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function file() {
    var a = ACTIONS[elAction.value];
    var min = a.cls === "flat" ? a.minutes : parseInt(elDur.value, 10) || 15;
    var credits = a.cls === "flat" ? a.flat : Math.max(1, Math.floor(a.rate * min));
    var clsLabel = a.cls === "flat" ? "flat rate" : a.cls;
    var clsTag = a.cls === "flat" ? "tag-run" : (a.cls === "compatible" ? "tag-run" : "tag-queue");

    elResult.innerHTML =
      '<div class="sim-verdict">' +
        '<span class="feed-tag ' + clsTag + '">' + clsLabel + '</span>' +
        '<strong>~' + credits.toLocaleString("en-US") + ' cr</strong>' +
        '<span class="muted">≈ ' + fmtUsd(credits * USD_PER_CR) + ' at ~1¢/credit</span>' +
      '</div>' +
      '<p>' + a.blurb + '</p>' +
      '<ol class="sim-steps">' +
        '<li>Declared upfront — action + ' + (a.cls === "flat" ? "2 h block" : min + " min") + ', credits held.</li>' +
        '<li>Screened — intent read from the request text; gray zones go to human review.</li>' +
        '<li>Runs or queues — queued requests auto-refund if the slot never opens.</li>' +
        '<li>Attributed — your name lands on the public feed when it fires.</li>' +
      '</ol>' +
      '<p class="muted" style="font-size:13px">Simulation only — the real pipeline screens, prices, and publishes at launch.</p>';

    elFeed.hidden = false;
    var row = document.createElement("div");
    row.className = "feed-row";
    row.innerHTML =
      '<span class="feed-time">' + stamp() + '</span>' +
      '<span class="feed-tag ' + clsTag + '">' + clsLabel + '</span>' +
      '<p>' + a.feed.replace("{min}", min) + ' — filed by <b>you</b> (simulated), ' + credits + ' cr.</p>';
    elRows.insertBefore(row, elRows.firstChild);
    while (elRows.children.length > 4) elRows.removeChild(elRows.lastChild);

    if (window.rw && window.rw.track) {
      window.rw.track("request_simulated", {
        action: elAction.value, "class": a.cls,
        minutes: min, credits: credits
      });
    }
  }

  elAction.addEventListener("change", sync);
  elDur.addEventListener("input", sync);
  elFile.addEventListener("click", file);
  sync();
})();
