// Real World — privacy-first analytics shim.
// Vanilla JS, no dependencies, no cookies, no live keys.
//
// INERT BY DEFAULT: until an endpoint is configured the script emits nothing
// and drops every event. To enable, set ONE of:
//   <script src="js/analytics.js" defer data-endpoint="/e" data-site="realworld">
//   window.RW_ANALYTICS = { endpoint: "https://stats.example.com/e", site: "realworld" };
//   ?rw_endpoint=<url> — dev-only override, honored ONLY on localhost/
//     127.0.0.1/::1/file: pages so a deployed URL can never be steered.
// The endpoint accepts a JSON body (see marketing/analytics-events.json).
// A local capture sink for testing: marketing/tools/analytics_sink.py
//
// PRIVACY CONTRACT (do not weaken without a LAUNCH-CHECKLIST sign-off):
//   - no cookies, no localStorage identifiers, no fingerprinting
//   - session id is a random nonce kept in sessionStorage (dies with the tab)
//   - unique-visitor counting happens server-side via daily-rotating
//     IP+UA+salt hash — the client never sends a persistent id
//   - honors Do Not Track, Global Privacy Control, and ?nocollect=1
//   - opt-out: localStorage "rw:no-collect" = "1", or window.RW_NO_COLLECT
//   - sends path + title + referrer HOST (never full referrer URL)
//   - UTM params captured on landing, attributed for the session only
(function () {
  "use strict";

  var me = document.currentScript || {};
  var cfg = window.RW_ANALYTICS || {};
  var ENDPOINT = cfg.endpoint || (me.dataset ? me.dataset.endpoint : null) || null;
  var SITE = cfg.site || (me.dataset ? me.dataset.site : null) || "realworld";

  // Dev-only endpoint override: ?rw_endpoint=<url> works only when the page
  // itself is local — never on a deployed host.
  (function () {
    try {
      var local = location.protocol === "file:" ||
        /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(location.host);
      var q = new URLSearchParams(location.search).get("rw_endpoint");
      if (local && q) ENDPOINT = q;
    } catch (e) { /* no override */ }
  })();

  // --- Opt-out gates -------------------------------------------------------
  function optedOut() {
    if (window.RW_NO_COLLECT) return true;
    if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return true;
    if (/[?&]nocollect=1/.test(location.search)) return true;
    try {
      if (localStorage.getItem("rw:no-collect") === "1") return true;
    } catch (e) { /* storage blocked — treat as fine, sessionStorage below will also fail */ }
    return false;
  }

  // --- Session nonce (sessionStorage only — no cookies) --------------------
  function sessionId() {
    try {
      var s = sessionStorage.getItem("rw:sid");
      if (!s) {
        s = "s" + Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("rw:sid", s);
      }
      return s;
    } catch (e) {
      return "s" + Math.random().toString(36).slice(2); // ephemeral fallback
    }
  }

  // --- UTM capture (landing page only, kept for the session) ---------------
  function utms() {
    try {
      var stored = sessionStorage.getItem("rw:utm");
      if (stored) return JSON.parse(stored);
      var q = new URLSearchParams(location.search);
      var u = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
        if (q.get(k)) u[k] = q.get(k);
      });
      if (q.get("ref")) u.ref = q.get("ref");
      sessionStorage.setItem("rw:utm", JSON.stringify(u));
      return u;
    } catch (e) {
      return {};
    }
  }

  function referrerHost() {
    try {
      return document.referrer ? new URL(document.referrer).host : null;
    } catch (e) {
      return null;
    }
  }

  // --- Core emitter --------------------------------------------------------
  var sentPageview = false;

  function track(name, props) {
    if (!ENDPOINT || optedOut()) return false;
    var payload = {
      v: 1,
      site: SITE,
      event: name,
      path: location.pathname,
      props: props || {},
      sid: sessionId(),
      utm: utms(),
      ref: referrerHost(),
      ts: Date.now()
    };
    var body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return true;
    } catch (e) { /* fall through to fetch */ }
    try {
      fetch(ENDPOINT, {
        method: "POST",
        body: body,
        headers: { "Content-Type": "text/plain" },
        keepalive: true,
        credentials: "omit"
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Auto pageview -------------------------------------------------------
  function pageview() {
    if (sentPageview) return;
    sentPageview = true;
    track("pageview", {
      title: document.title,
      page: document.body ? document.body.getAttribute("data-page") : null,
      vw: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      lang: navigator.language || null
    });
  }

  // --- Declarative hooks: [data-rw-event] elements -------------------------
  // <a data-rw-event="cta_click" data-rw-props='{"cta":"hero","dest":"pricing"}'>
  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("[data-rw-event]") : null;
    if (el) {
      var props = {};
      var raw = el.getAttribute("data-rw-props");
      if (raw) { try { props = JSON.parse(raw); } catch (err) { props = { raw: raw }; } }
      if (el.tagName === "A") props.href = el.getAttribute("href");
      track(el.getAttribute("data-rw-event"), props);
      return;
    }
    // Gallery opens → screenshot_view (wired without touching markup)
    var img = e.target && e.target.closest ? e.target.closest(".gallery img") : null;
    if (img) track("screenshot_view", { shot: img.getAttribute("src"), alt: (img.alt || "").slice(0, 80) });
  });

  // --- Scroll depth (25/50/75/100, once each per page) ---------------------
  var depthMarks = { 25: false, 50: false, 75: false, 100: false };
  function scrollDepth() {
    if (!ENDPOINT) return;
    try {
      var doc = document.documentElement;
      var max = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
      if (max <= 0) return;
      var pct = Math.min(100, Math.round(((window.pageYOffset || doc.scrollTop) / max) * 100));
      [25, 50, 75, 100].forEach(function (m) {
        if (!depthMarks[m] && pct >= m) {
          depthMarks[m] = true;
          track("scroll_depth", { depth: m, page: pageSlug() });
        }
      });
    } catch (e) {}
  }
  var scrollTick = false;
  window.addEventListener("scroll", function () {
    if (scrollTick) return;
    scrollTick = true;
    setTimeout(function () { scrollTick = false; scrollDepth(); }, 400);
  }, { passive: true });

  // --- Engaged time (seconds the page was actually visible) ----------------
  var visibleMs = 0, visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
  function flushEngaged(final) {
    if (visibleSince) { visibleMs += Date.now() - visibleSince; visibleSince = 0; }
    if (final && visibleMs >= 1000) {
      track("engaged_time", { seconds: Math.round(visibleMs / 1000), page: pageSlug() });
    }
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      if (!visibleSince) visibleSince = Date.now();
    } else {
      flushEngaged(false);
    }
  });
  window.addEventListener("pagehide", function () { flushEngaged(true); });

  function pageSlug() {
    return document.body ? document.body.getAttribute("data-page") : null;
  }

  // --- Outbound links ------------------------------------------------------
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.hasAttribute("data-rw-event")) return;
    var href = a.getAttribute("href") || "";
    if (/^https?:\/\//.test(href) && a.host !== location.host) {
      track("outbound_click", { href: href });
    }
  });

  // --- Public API ----------------------------------------------------------
  window.rw = window.rw || {};
  window.rw.track = track;
  window.rw.optOut = function () {
    try { localStorage.setItem("rw:no-collect", "1"); } catch (e) {}
    window.RW_NO_COLLECT = true;
  };
  window.rw.optIn = function () {
    try { localStorage.removeItem("rw:no-collect"); } catch (e) {}
    window.RW_NO_COLLECT = false;
  };
  window.rw.enabled = function () { return !!ENDPOINT && !optedOut(); };

  pageview();
})();
