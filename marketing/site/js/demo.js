// Real World — demo page spectator-view loader.
// Vanilla JS, no dependencies. See marketing/DEMO-PAGE.md for the spec.
//
// Embed resolution order (first non-empty wins):
//   1. ?embed=<url> query param (staging/testing only — must be same-origin
//      or an https: URL; anything else is ignored and the fallback shows)
//   2. data-demo-src attribute on #demo-stage (the launch switch — set it
//      when the spectator build ships)
//   Empty result → the pre-launch fallback stays visible. Nothing is
//   requested, nothing breaks.
(function () {
  "use strict";

  var stage = document.getElementById("demo-stage");
  if (!stage) return;

  function embedUrl() {
    try {
      var q = new URLSearchParams(location.search).get("embed");
      if (q) {
        var u = new URL(q, location.href);
        var sameOrigin = u.origin === location.origin;
        var isFileDev = location.protocol === "file:" && u.protocol === "file:";
        if (sameOrigin || u.protocol === "https:" || isFileDev) return u.href;
        return null; // rejected scheme — show fallback
      }
    } catch (e) { /* fall through to attribute */ }
    var src = stage.getAttribute("data-demo-src");
    return src && src.trim() ? src.trim() : null;
  }

  var url = embedUrl();

  function live() {
    if (window.rw && window.rw.track) {
      window.rw.track("watch_start", { source: "demo-page", mode: "live" });
    }
  }

  if (url) {
    var frame = document.createElement("iframe");
    frame.className = "demo-frame";
    frame.src = url;
    frame.title = "Real World spectator view — live neighborhood";
    frame.setAttribute("loading", "lazy");
    frame.setAttribute("allow", "autoplay; fullscreen");
    frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-pointer-lock");
    frame.addEventListener("load", live);
    stage.textContent = "";
    stage.appendChild(frame);
    stage.classList.add("is-live");
  } else {
    if (window.rw && window.rw.track) {
      window.rw.track("watch_start", { source: "demo-page", mode: "fallback" });
    }
  }

  // Share button — navigator.share where available, clipboard otherwise.
  var btn = document.getElementById("demo-share");
  var status = document.getElementById("demo-share-status");
  if (btn) {
    btn.addEventListener("click", function () {
      var shareUrl = location.origin === "null" || location.protocol === "file:"
        ? "https://realworld-game.example/demo.html" // placeholder until launch domain
        : location.href.split("#")[0] +
          (typeof idx === "number" && idx > 0 ? "#shot=" + (idx + 1) : "");
      var done = function (msg) {
        if (status) { status.textContent = msg; setTimeout(function () { status.textContent = ""; }, 4000); }
      };
      var t = function (method) {
        if (window.rw && window.rw.track) window.rw.track("share_click", { method: method, surface: "demo" });
      };
      if (navigator.share) {
        navigator.share({
          title: document.title,
          text: "Watch a live AI neighborhood on a real SF block — free.",
          url: shareUrl
        }).then(function () { t("web-share"); done(""); }, function () { /* user cancelled */ });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(
          function () { t("clipboard"); done("Link copied."); },
          function () { done("Copy failed — grab the URL from the address bar."); }
        );
      } else {
        t("manual");
        done("Copy the URL from your address bar to share.");
      }
    });
  }

  // Theater mode — fullscreen the stage (works for fallback and live embed).
  var fsBtn = document.getElementById("demo-fs");
  if (fsBtn && stage.requestFullscreen) {
    fsBtn.addEventListener("click", function () {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        stage.requestFullscreen();
      }
    });
    document.addEventListener("fullscreenchange", function () {
      fsBtn.textContent = document.fullscreenElement ? "Exit theater" : "Theater mode";
    });
  } else if (fsBtn) {
    fsBtn.hidden = true;
  }

  // Block clock — the world runs on Pacific time; this chip shows the real
  // clock and names the daypart the block is in. Honest: it's just the time.
  var clock = document.getElementById("demo-clock");
  if (clock) {
    var DAYPARTS = [
      [300, "fog-first hours"],      // 05:00
      [540, "midday on the block"],  // 09:00
      [870, "golden-hour run-up"],   // 14:30
      [1110, "evening service"],     // 18:30
      [1320, "windows-dark hours"]   // 22:00
    ];
    var part = function (mins) {
      var label = "windows-dark hours";
      for (var i = 0; i < DAYPARTS.length; i++) {
        if (mins >= DAYPARTS[i][0]) label = DAYPARTS[i][1];
      }
      return label;
    };
    var fmt = null;
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles", hour12: false,
        hour: "2-digit", minute: "2-digit"
      });
    } catch (e) { fmt = null; }
    var tick = function () {
      if (!fmt) { clock.textContent = ""; return; }
      try {
        var p = fmt.formatToParts(new Date());
        var hh = 0, mm = 0;
        for (var i = 0; i < p.length; i++) {
          if (p[i].type === "hour") hh = parseInt(p[i].value, 10) % 24;
          if (p[i].type === "minute") mm = parseInt(p[i].value, 10);
        }
        clock.textContent = "On the block: " + (hh < 10 ? "0" : "") + hh + ":" +
          (mm < 10 ? "0" : "") + mm + " PT — " + part(hh * 60 + mm);
      } catch (e) { clock.textContent = ""; }
    };
    tick();
    setInterval(tick, 30000);
  }

  // Viewing-guide highlight — mark which "day on the block" card matches the
  // current Pacific daypart. Same clock the world runs on; honest by build.
  var strip = document.getElementById("day-strip");
  if (strip) {
    var ptNow = function () {
      try {
        var f = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Los_Angeles", hour12: false,
          hour: "2-digit", minute: "2-digit"
        });
        var p = f.formatToParts(new Date()), h = 0, m = 0;
        for (var i = 0; i < p.length; i++) {
          if (p[i].type === "hour") h = parseInt(p[i].value, 10) % 24;
          if (p[i].type === "minute") m = parseInt(p[i].value, 10);
        }
        return h + m / 60;
      } catch (e) { return null; }
    };
    var markNow = function () {
      var now = ptNow();
      if (now === null) return;
      var cards = strip.querySelectorAll("[data-from]");
      for (var i = 0; i < cards.length; i++) {
        var from = parseFloat(cards[i].getAttribute("data-from"));
        var to = parseFloat(cards[i].getAttribute("data-to"));
        var inWin = from < to ? (now >= from && now < to) : (now >= from || now < to);
        cards[i].classList.toggle("is-now", inWin);
        var chip = cards[i].querySelector(".watch-now");
        if (chip) chip.hidden = !inWin;
      }
    };
    markNow();
    setInterval(markNow, 60000);
  }

  // Routine-aware cast chips — same PT windows on "who you might see".
  // Honest by construction: the highlight follows the published routine,
  // not anyone's live position.
  var castStrip = document.getElementById("cast-strip");
  if (castStrip) {
    var markCast = function () {
      var now = ptNow && ptNow();
      if (now === null || now === undefined) return;
      var chips = castStrip.querySelectorAll(".cast-chip[data-from]");
      for (var i = 0; i < chips.length; i++) {
        var from = parseFloat(chips[i].getAttribute("data-from"));
        var to = parseFloat(chips[i].getAttribute("data-to"));
        var inWin = from < to ? (now >= from && now < to) : (now >= from || now < to);
        chips[i].classList.toggle("is-now", inWin);
        var w = chips[i].querySelector(".watch-now");
        if (w) w.hidden = !inWin;
      }
    };
    if (ptNow) { markCast(); setInterval(markCast, 60000); }
  }

  // Fallback capture deck — while the live embed is unwired, cycle the
  // published development captures. Always captioned "Development capture" —
  // it never pretends to be live. Auto-cycles unless reduced-motion is set;
  // ←/→ always flip manually; the guided watch borrows the same deck.
  if (!url) {
    var SHOTS = [
      ["shots/v53-A", "the block from overhead — Jules selected, needs and mood readable"],
      ["shots/v53-B", "street level — names over heads, leaves in the air"],
      ["shots/v53-C", "Dolores Park — blankets on the lawns, Karl's fog edging in"],
      ["shots/v53-D", "director mode — the neighborhood reads like a set"]
    ];
    // Deep link: #shot=1..4 pins the deck (and its cam chip) on load, so a
    // shared "this view" link lands on the same capture. The live embed
    // ignores the hash — live cameras live inside the frame.
    var hashShot = (function () {
      var m = /[#&]shot=(\d)/.exec(location.hash || "");
      if (!m) return -1;
      var n = parseInt(m[1], 10) - 1;
      return (n >= 0 && n < SHOTS.length) ? n : -1;
    })();
    var screen = stage.querySelector(".demo-fallback-screen");
    var img = screen && screen.querySelector("img");
    var srcEl = screen && screen.querySelector("source");
    var cap = document.getElementById("demo-cap");
    var note = document.getElementById("demo-note");
    var noteStep = document.getElementById("demo-note-step");
    var noteText = document.getElementById("demo-note-text");
    var tourBtn = document.getElementById("demo-tour");
    var keysHint = document.getElementById("demo-keys");
    var camBar = document.getElementById("cam-bar");
    var camChips = camBar ? camBar.querySelectorAll(".cam-chip") : [];
    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var idx = 0, touring = false, tourTimer = null, autoTimer = null;

    function markCam(i) {
      for (var j = 0; j < camChips.length; j++) {
        var on = parseInt(camChips[j].getAttribute("data-shot"), 10) === i;
        camChips[j].classList.toggle("is-active", on);
        camChips[j].setAttribute("aria-pressed", on ? "true" : "false");
      }
    }

    function show(i, fade) {
      idx = ((i % SHOTS.length) + SHOTS.length) % SHOTS.length;
      markCam(idx);
      var base = SHOTS[idx][0], label = SHOTS[idx][1];
      var swap = function () {
        if (srcEl) srcEl.setAttribute("srcset", base + ".webp");
        img.src = base + ".png";
        img.alt = "Development capture — " + label + ".";
        if (cap) cap.textContent = "Development capture — " + label;
        screen.classList.remove("is-fading");
      };
      if (fade && !reduced) {
        screen.classList.add("is-fading");
        setTimeout(swap, 480);
      } else {
        swap();
      }
    }

    // Guided watch — a scripted pass over the captures narrating what a
    // spectator would be looking for. The notes describe the captures, not a
    // live feed, and say so on the card. ~12 s per beat.
    var TOUR = [
      [0, "Start overhead. The fog band on the rooftops is the world's own weather — it keeps its schedule whether or not a camera is up here. Spectators get this roofline view for free."],
      [1, "Now street level. This is the follow-cam the spectator view is built around: close enough to read the block — who opened the café, who isn't speaking to whom — never close enough to steer it."],
      [2, "Dolores Park, the block's commons. Viewer requests tend to land here because everyone watching can see them land — every intervention is public and attributed."],
      [3, "Director mode. Framing the shot is part of watching; the pastel rowhouses on the hill are the postcard the feed writes under. When the build ships, this deck retires — live needs no script."]
    ];
    var tourBeat = -1;
    function tourStep() {
      tourBeat++;
      if (tourBeat >= TOUR.length) { endTour(true); return; }
      show(TOUR[tourBeat][0], true);
      if (note && noteStep && noteText) {
        noteStep.textContent = (tourBeat + 1) + " / " + TOUR.length;
        noteText.textContent = TOUR[tourBeat][1];
        note.hidden = false;
      }
      tourTimer = setTimeout(tourStep, 12000);
    }
    function startTour() {
      if (!screen || !img) return;
      touring = true;
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      if (tourBtn) tourBtn.textContent = "End the tour";
      tourBeat = -1;
      tourStep();
      // the button's own data-rw-event emits cta_click{cta:"demo-tour"}
    }
    function endTour(done) {
      touring = false;
      if (tourTimer) { clearTimeout(tourTimer); tourTimer = null; }
      if (note) note.hidden = true;
      if (tourBtn) tourBtn.textContent = "Guided watch";
      if (done && window.rw && window.rw.track) {
        window.rw.track("cta_click", { cta: "demo-tour-done" });
      }
      if (!reduced && !autoTimer) startAuto();
    }
    function startAuto() {
      autoTimer = setInterval(function () {
        if (document.hidden || touring) return;
        show(idx + 1, true);
      }, 8000);
    }

    // Camera presets — clicking a chip jumps the deck to its shot and
    // resets the auto-cycle so the pick actually lands. The chip's own
    // data-rw-event emits cta_click{cta:"demo-cam",cam:<name>}.
    function resetAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      if (!reduced && !touring) startAuto();
    }
    for (var ci = 0; ci < camChips.length; ci++) {
      (function (chip) {
        chip.addEventListener("click", function () {
          if (!screen || !img) return;
          if (touring) endTour(false);
          show(parseInt(chip.getAttribute("data-shot"), 10), true);
          resetAuto();
        });
      })(camChips[ci]);
    }

    if (screen && img) {
      if (hashShot >= 0) show(hashShot, false);
      if (!reduced) startAuto();
      if (tourBtn) {
        tourBtn.addEventListener("click", function () {
          if (touring) { endTour(false); } else { startTour(); }
        });
      } else if (note) {
        note.hidden = true;
      }
      // Keyboard: ←/→ flip captures (also nudge the tour's beat if running).
      if (keysHint) keysHint.hidden = false;
      document.addEventListener("keydown", function (e) {
        if (e.target && /^(input|select|textarea)$/i.test(e.target.tagName)) return;
        if (e.key === "ArrowRight") {
          if (touring) { if (tourTimer) clearTimeout(tourTimer); tourStep(); }
          else show(idx + 1, true);
        } else if (e.key === "ArrowLeft") {
          if (touring) { if (tourTimer) clearTimeout(tourTimer); tourBeat = Math.max(tourBeat - 2, -1); tourStep(); }
          else show(idx - 1, true);
        } else if (/^[1-4]$/.test(e.key)) {
          if (touring) endTour(false);
          show(parseInt(e.key, 10) - 1, true);
          resetAuto();
        }
      });
    } else {
      if (tourBtn) tourBtn.hidden = true;
    }
  } else {
    // Live embed resolved — guided watch, capture deck and the site-side
    // camera bar are fallback-only; the live view carries its own camera UI.
    var tb = document.getElementById("demo-tour");
    if (tb) tb.hidden = true;
    var kh = document.getElementById("demo-keys");
    if (kh) kh.hidden = true;
    var cb = document.getElementById("cam-bar");
    if (cb) cb.hidden = true;
  }

  // First-watch field card — a local checklist for a first visit. State is
  // stored in localStorage on this device only (key rw_watchcard_v1);
  // storage failures degrade to a session-only card. Works in both modes.
  var card = document.getElementById("fieldcard");
  if (card) {
    var FC_KEY = "rw_watchcard_v1";
    var boxes = card.querySelectorAll("input[data-fc]");
    var count = document.getElementById("fc-count");
    var reset = document.getElementById("fc-reset");
    var fcLoad = function () {
      try { return JSON.parse(localStorage.getItem(FC_KEY) || "{}"); }
      catch (e) { return {}; }
    };
    var fcSave = function (state) {
      try { localStorage.setItem(FC_KEY, JSON.stringify(state)); } catch (e) {}
    };
    var fcState = fcLoad();
    var fcSync = function () {
      var done = 0;
      for (var i = 0; i < boxes.length; i++) {
        var k = boxes[i].getAttribute("data-fc");
        boxes[i].checked = !!fcState[k];
        if (fcState[k]) done++;
      }
      if (count) count.textContent = done + " / " + boxes.length;
    };
    for (var bi = 0; bi < boxes.length; bi++) {
      (function (box) {
        box.addEventListener("change", function () {
          fcState[box.getAttribute("data-fc")] = box.checked;
          fcSave(fcState);
          fcSync();
          if (window.rw && window.rw.track) {
            window.rw.track("cta_click", { cta: "demo-fieldcard",
              item: box.getAttribute("data-fc"), checked: box.checked });
          }
        });
      })(boxes[bi]);
    }
    if (reset) {
      reset.addEventListener("click", function () {
        fcState = {};
        fcSave(fcState);
        fcSync();
      });
    }
    fcSync();
  }
})();
