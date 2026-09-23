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
})();
