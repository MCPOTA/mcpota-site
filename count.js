/* MCPOTA page counter (source: MCPOTA/mcpota-shared count/client/count.js; copy into each site as /count.js).
   Counts page views, link and button clicks, and how far down the page people scroll, as daily totals.
   No cookies, no storage on your device, no IDs, nothing about you. Sends nothing when your browser asks
   not to be tracked (Do Not Track or Global Privacy Control). */
(function () {
  "use strict";
  var END = "https://mcpota-count.mcpota.workers.dev/e";
  var nav = navigator;
  if (nav.doNotTrack === "1" || window.doNotTrack === "1" || nav.globalPrivacyControl === true) return;
  if (nav.webdriver) return;
  var site = location.hostname.replace(/^www\./, "");
  var path = location.pathname.replace(/[^A-Za-z0-9._~\-\/]/g, "").slice(0, 120) || "/";

  function send(events) {
    var body = JSON.stringify({ s: site, p: path, e: events });
    try {
      if (nav.sendBeacon && nav.sendBeacon(END, body)) return;
    } catch (e) { /* fall through */ }
    try { fetch(END, { method: "POST", body: body, keepalive: true, mode: "cors", credentials: "omit" }); } catch (e) { /* ignore */ }
  }

  // Page view, the site the visitor came from (name only), and phone or computer.
  var first = [["view", ""], ["device", window.matchMedia("(max-width: 800px)").matches ? "phone" : "computer"]];
  try {
    if (document.referrer) {
      var ref = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (ref && ref !== site) first.push(["ref", ref]);
    }
  } catch (e) { /* ignore */ }
  send(first);

  // Clicks on links and buttons: the label people see (or data-count) plus where the link goes. Never form contents.
  function label(el) {
    var t = el.getAttribute("data-count") || el.getAttribute("aria-label") || el.textContent || el.getAttribute("title") || "";
    t = t.replace(/\s+/g, " ").trim().slice(0, 40);
    var href = el.getAttribute("href");
    if (href) {
      var dest;
      if (/^mailto:/i.test(href)) dest = "email";
      else if (/^tel:/i.test(href)) dest = "phone call";
      else if (href.charAt(0) === "#") dest = href.slice(0, 30);
      else {
        try {
          var u = new URL(href, location.href);
          dest = u.hostname.replace(/^www\./, "") === site ? u.pathname.slice(0, 40) : u.hostname.replace(/^www\./, "");
        } catch (e) { dest = ""; }
      }
      if (dest) t = (t ? t + " → " : "") + dest;
    }
    return t.replace(/[^\p{L}\p{N} .,:;!?&'’()\/@+#_\-–—→↗]/gu, "").slice(0, 80);
  }
  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("a, button, [data-count]") : null;
    if (!el) return;
    var t = label(el);
    if (t) send([["click", t]]);
  }, { capture: true, passive: true });

  // Deepest point reached: 25, 50, 75 or 100 percent, sent once when the visitor leaves the page.
  var deepest = 0, sent = false;
  function measure() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var pct = h <= 0 ? 100 : Math.round((window.scrollY / h) * 100);
    var b = pct >= 98 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;
    if (b > deepest) deepest = b;
  }
  window.addEventListener("scroll", measure, { passive: true });
  function leave() {
    if (sent) return;
    measure();
    if (deepest > 0) { sent = true; send([["scroll", String(deepest)]]); }
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") leave(); });
  window.addEventListener("pagehide", leave);
})();
