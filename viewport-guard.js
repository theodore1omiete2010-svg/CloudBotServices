/* ===== DESKTOP-SITE VIEWPORT GUARD =====
   Runs synchronously in <head>, before first paint. Not deferred/async on
   purpose — it must set the real viewport before layout happens, otherwise
   the page briefly (or permanently) renders at the wrong width.

   The problem this fixes: when a mobile browser's "Desktop site" toggle is
   on, it ignores the page's <meta name="viewport" content="width=device-
   width"> and substitutes a fixed wide layout viewport (commonly 980px or
   1024px) even though the physical screen is still e.g. 390px wide. CSS
   then renders the desktop layout, just squeezed to fit the real screen —
   which is why pinch-zooming "fixes" it visually. This script detects that
   mismatch and re-locks the viewport meta tag to the real device width.
*/
(function () {
  function lockViewportToDevice() {
    var meta = document.getElementById('viewportMeta');
    if (!meta) return;

    // window.screen.width is the physical screen width in CSS pixels and is
    // NOT affected by "Desktop site" mode — unlike window.innerWidth, which
    // is exactly the value Desktop site mode distorts.
    var deviceWidth = (window.screen && window.screen.width) ? window.screen.width : window.innerWidth;
    var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    // Only force a fixed width for small touch screens (phones/small
    // tablets). This avoids ever narrowing a real desktop or a large
    // touchscreen laptop, which should keep using width=device-width.
    if (isTouch && deviceWidth > 0 && deviceWidth <= 900) {
      meta.setAttribute('content', 'width=' + deviceWidth + ', initial-scale=1.0');
    } else {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
    }
  }

  lockViewportToDevice();
  window.addEventListener('resize', lockViewportToDevice);
  window.addEventListener('orientationchange', lockViewportToDevice);
})();
