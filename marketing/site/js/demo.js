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
      window.rw.track("watch_start", { source: "demo_page", mode: "live" });
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
      window.rw.track("watch_start", { source: "demo_page", mode: "fallback" });
    }
  }

  // Share button — navigator.share where available, clipboard otherwise.
  var btn = document.getElementById("demo-share");
  var status = document.getElementById("demo-share-status");
  if (btn) {
    btn.addEventListener("click", function () {
      var shareUrl = location.origin === "null" || location.protocol === "file:"
        ? "https://realworld-game.example/demo.html" // placeholder until launch domain
        : location.href.split("#")[0];
      var done = function (msg) {
        if (status) { status.textContent = msg; setTimeout(function () { status.textContent = ""; }, 4000); }
      };
      var t = function (method) {
        if (window.rw && window.rw.track) window.rw.track("share_click", { method: method });
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
      var cards = strip.querySelectorAll(".card[data-from]");
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

  // Fallback capture rotator — while the live embed is unwired, cycle the
  // published development captures. Always captioned "Development capture" —
  // it never pretends to be live. Off under prefers-reduced-motion and when
  // the tab is hidden.
  if (!url) {
    var SHOTS = [
      ["shots/v39-A", "the block from overhead under the marine layer"],
      ["shots/v39-B", "street-level follow-cam inside the fog"],
      ["shots/v39-C", "Dolores Park under a drifting fog tongue"],
      ["shots/v39-D", "director mode — pastel rowhouses on the sloped block"]
    ];
    var screen = stage.querySelector(".demo-fallback-screen");
    var img = screen && screen.querySelector("img");
    var srcEl = screen && screen.querySelector("source");
    var cap = document.getElementById("demo-cap");
    var reduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (screen && img && !reduced) {
      var idx = 0;
      setInterval(function () {
        if (document.hidden) return;
        idx = (idx + 1) % SHOTS.length;
        var base = SHOTS[idx][0], label = SHOTS[idx][1];
        var swap = function () {
          if (srcEl) srcEl.setAttribute("srcset", base + ".webp");
          img.src = base + ".png";
          img.alt = "Development capture — " + label + ".";
          if (cap) cap.textContent = "Development capture — " + label;
          screen.classList.remove("is-fading");
        };
        screen.classList.add("is-fading");
        setTimeout(swap, 480);
      }, 8000);
    }
  }
})();
