import { State, DataService } from "./state.js";
import { mountSidebar } from "./components/sidebar.js";
import { mountHeader } from "./components/header.js";
import { initNotifications } from "./components/notifications.js";
import { showToast } from "./components/modals.js";
import { navigate, initRouter } from "./router.js";
import * as Overview from "../views/overview/overview.js";
import { initSwipe } from './swipe.js';

function setTheme(theme) {
  State.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("cbs-theme", theme);
  const label = document.getElementById("themeLabel");
  const sun = document.querySelector(".ftt-sun");
  const moon = document.querySelector(".ftt-moon");
  if (label) label.textContent = theme === "dark" ? "Dark" : "Light";
  if (sun) sun.style.opacity = theme === "dark" ? "0" : "1";
  if (moon) moon.style.opacity = theme === "dark" ? "1" : "0";
}

function initTheme() {
  setTheme(State.theme === "dark" ? "dark" : "light");
  document
    .getElementById("themeToggleFloating")
    ?.addEventListener("click", () =>
      setTheme(State.theme === "dark" ? "light" : "dark")
    );
}

function openSidebar() {
  document.getElementById("sidebar")?.classList.add("open");
  document.getElementById("overlay")?.classList.add("open");

  window.dispatchEvent(
    new CustomEvent("cbs:sidebar-state")
  );
}

function closeSidebar() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("overlay")?.classList.remove("open");

  window.dispatchEvent(
    new CustomEvent("cbs:sidebar-state")
  );
}

function initMobile() {
  // ============================================================
  // EXISTING MOBILE MENU BEHAVIOR
  // ============================================================

  document.addEventListener("click", (e) => {
    if (e.target.closest("#mobileMenu, .mobile-menu, .mobile-menu-btn")) {
      openSidebar();
    }
  });

  document
    .getElementById("overlay")
    ?.addEventListener("click", closeSidebar);

  // ============================================================
  // LIVE SIDEBAR SWIPE SYSTEM
  //
  // CLOSED:
  //   Start from left edge -> drag right -> sidebar follows finger
  //
  // OPEN:
  //   Drag sidebar left -> sidebar follows finger
  // ============================================================

  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (!sidebar) return;

  const EDGE_SIZE = 24;
  const OPEN_RATIO = 0.5;

  let edgeHandle = document.getElementById("cbsSwipeEdge");

  // Create exactly one invisible left-edge gesture handle.
  if (!edgeHandle) {
    edgeHandle = document.createElement("div");
    edgeHandle.id = "cbsSwipeEdge";

    Object.assign(edgeHandle.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${EDGE_SIZE}px`,
      height: "100dvh",
      zIndex: "110",
      background: "transparent",
      touchAction: "none",
      WebkitTapHighlightColor: "transparent"
    });

    document.body.appendChild(edgeHandle);
  }

  let mode = null; // "open" or "close"
  let activePointerId = null;

  let startX = 0;
  let startY = 0;
  let startOffset = 0;

  let lockedHorizontal = false;

  function getWidth() {
    return sidebar.getBoundingClientRect().width || 280;
  }

  function getProgress(offset) {
    const width = getWidth();
    return 1 - Math.abs(offset) / width;
  }

  function setOverlayProgress(progress) {
    if (!overlay) return;

    const p = Math.max(0, Math.min(1, progress));

    overlay.classList.add("open");
    overlay.style.display = "block";
    overlay.style.opacity = String(p);
  }

  function setSidebarOffset(offset) {
    const width = getWidth();

    const clamped = Math.max(
      -width,
      Math.min(0, offset)
    );

    sidebar.style.transition = "none";
    sidebar.style.transform =
      `translate3d(${clamped}px, 0, 0)`;

    setOverlayProgress(getProgress(clamped));
  }

  function resetInlineStyles() {
    sidebar.style.transition = "";
    sidebar.style.transform = "";

    if (overlay) {
      overlay.style.transition = "";
      overlay.style.opacity = "";
      overlay.style.display = "";
    }
  }

  function settle(open) {
    const width = getWidth();

    sidebar.style.transition =
      "transform 220ms cubic-bezier(.22,.8,.25,1)";

    if (open) {
      sidebar.classList.add("open");
      sidebar.style.transform =
        "translate3d(0,0,0)";

      if (overlay) {
        overlay.classList.add("open");
        overlay.style.display = "block";
        overlay.style.transition =
          "opacity 220ms cubic-bezier(.22,.8,.25,1)";
        overlay.style.opacity = "1";
      }

      edgeHandle.style.pointerEvents = "none";

    } else {
      sidebar.classList.remove("open");
      sidebar.style.transform =
        `translate3d(-${width}px,0,0)`;

      if (overlay) {
        overlay.style.transition =
          "opacity 220ms cubic-bezier(.22,.8,.25,1)";
        overlay.style.opacity = "0";

        setTimeout(() => {
          overlay.classList.remove("open");
          overlay.style.display = "";
        }, 220);
      }

      edgeHandle.style.pointerEvents = "auto";
    }

    setTimeout(() => {
      resetInlineStyles();
    }, 240);
  }

  function cancelGesture() {
    mode = null;
    activePointerId = null;
    lockedHorizontal = false;

    resetInlineStyles();

    if (!sidebar.classList.contains("open")) {
      edgeHandle.style.pointerEvents = "auto";
    } else {
      edgeHandle.style.pointerEvents = "none";
    }
  }

  // ============================================================
  // OPEN: LEFT EDGE -> RIGHT
  // ============================================================

  edgeHandle.addEventListener("pointerdown", (e) => {
    if (sidebar.classList.contains("open")) return;
    if (e.pointerType === "mouse") return;

    mode = "open";
    activePointerId = e.pointerId;

    startX = e.clientX;
    startY = e.clientY;

    startOffset = -getWidth();

    lockedHorizontal = false;

    edgeHandle.setPointerCapture?.(e.pointerId);
  });

  edgeHandle.addEventListener("pointermove", (e) => {
    if (mode !== "open") return;
    if (e.pointerId !== activePointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!lockedHorizontal) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

      // Vertical movement means normal scrolling.
      if (Math.abs(dy) > Math.abs(dx)) {
        cancelGesture();
        return;
      }

      lockedHorizontal = true;
    }

    if (!lockedHorizontal) return;

    e.preventDefault();

    setSidebarOffset(startOffset + dx);
  });

  edgeHandle.addEventListener("pointerup", (e) => {
    if (mode !== "open") return;
    if (e.pointerId !== activePointerId) return;

    const dx = e.clientX - startX;

    edgeHandle.releasePointerCapture?.(e.pointerId);

    const width = getWidth();
    const finalOffset =
      Math.max(-width, Math.min(0, startOffset + dx));

    const progress = getProgress(finalOffset);

    mode = null;
    activePointerId = null;

    if (lockedHorizontal) {
      settle(progress >= OPEN_RATIO);
    } else {
      cancelGesture();
    }
  });

  edgeHandle.addEventListener("pointercancel", () => {
    if (mode === "open") {
      cancelGesture();
    }
  });

  // ============================================================
  // CLOSE: SIDEBAR -> LEFT
  // ============================================================

  sidebar.addEventListener("pointerdown", (e) => {
    if (!sidebar.classList.contains("open")) return;
    if (e.pointerType === "mouse") return;

    mode = "close";
    activePointerId = e.pointerId;

    startX = e.clientX;
    startY = e.clientY;

    startOffset = 0;

    lockedHorizontal = false;

    sidebar.setPointerCapture?.(e.pointerId);
  });

  sidebar.addEventListener("pointermove", (e) => {
    if (mode !== "close") return;
    if (e.pointerId !== activePointerId) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!lockedHorizontal) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

      if (Math.abs(dy) > Math.abs(dx)) {
        cancelGesture();
        return;
      }

      lockedHorizontal = true;
    }

    if (!lockedHorizontal) return;

    e.preventDefault();

    setSidebarOffset(startOffset + dx);
  });

  sidebar.addEventListener("pointerup", (e) => {
    if (mode !== "close") return;
    if (e.pointerId !== activePointerId) return;

    const dx = e.clientX - startX;

    sidebar.releasePointerCapture?.(e.pointerId);

    const width = getWidth();
    const finalOffset =
      Math.max(-width, Math.min(0, dx));

    const progress = getProgress(finalOffset);

    mode = null;
    activePointerId = null;

    if (lockedHorizontal) {
      settle(progress >= OPEN_RATIO);
    } else {
      cancelGesture();
    }
  });

  sidebar.addEventListener("pointercancel", () => {
    if (mode === "close") {
      cancelGesture();
    }
  });

  // ============================================================
  // KEEP EDGE HANDLE CORRECT AFTER NORMAL MENU ACTIONS
  // ============================================================

  const originalOpen = openSidebar;
  const originalClose = closeSidebar;

  window.addEventListener("cbs:sidebar-state", () => {
    edgeHandle.style.pointerEvents =
      sidebar.classList.contains("open")
        ? "none"
        : "auto";
  });

  // Small wrapper hooks for existing button/overlay actions.
  window.__cbsSwipeSync = () => {
    edgeHandle.style.pointerEvents =
      sidebar.classList.contains("open")
        ? "none"
        : "auto";
  };

  console.log("CBS swipe system initialized.");
}
function initGlobalSearch() {
  document.getElementById("globalSearch")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const query = e.target.value.toLowerCase().trim();
    if (!query) return;
    const routes = {
      business: "business",
      conversation: "conversations",
      customer: "customers",
      order: "orders",
      product: "catalogue",
      products: "catalogue",
      catalogue: "catalogue",
      bot: "bot",
      automation: "automations",
      faq: "faqs",
      knowledge: "knowledge",
      analytics: "analytics",
      lead: "leads",
      payment: "payments",
      broadcast: "broadcasts",
      team: "team",
      setting: "settings",
    };
    // IMPROVED: partial match – find if query is part of any key
    const hit = Object.keys(routes).find((k) => k.includes(query) || query.includes(k));
    if (hit) {
      navigate(routes[hit]);
      e.target.value = "";
    } else {
      showToast(`No route found for "${query}".`);
    }
  });
}

function initBusinessSwitcher() {
  const switcher = document.getElementById("businessSwitcher");
  const dropdown = document.getElementById("businessDropdown");

  if (!switcher || !dropdown) return;

  function render() {
    const businesses =
      DataService &&
      DataService.businesses &&
      typeof DataService.businesses === "object"
        ? DataService.businesses
        : {};

    const names = Object.keys(businesses);

    dropdown.innerHTML = names.length
      ? names.map((name) => {
          const b = businesses[name] || {};
          return `
            <button
              class="business-dropdown-item ${
                name === State.currentBusiness ? "active" : ""
              }"
              data-business="${name}">
              <span class="bd-logo">${b.initials || "CB"}</span>
              ${name}
            </button>
          `;
        }).join("")
      : `
        <div style="padding:12px;color:var(--text-soft)">
          No businesses available
        </div>
      `;

    dropdown.querySelectorAll("[data-business]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();

        State.currentBusiness = btn.dataset.business;

        try {
          localStorage.setItem(
            "cbs_current_business",
            State.currentBusiness
          );
        } catch (err) {
          console.warn("Could not save current business:", err);
        }

        switcher.classList.remove("open");
        updateGlobalBusinessUI();

        window.dispatchEvent(
          new CustomEvent("cbs:business-changed")
        );
      };
    });
  }

  switcher.addEventListener("click", (e) => {
    e.stopPropagation();
    switcher.classList.toggle("open");

    if (switcher.classList.contains("open")) {
      render();
    }
  });

  document.addEventListener(
    "click",
    () => switcher.classList.remove("open")
  );

  render();
}

function updateGlobalBusinessUI() {
  const b = DataService.getBusiness(State.currentBusiness);
  if (!b) return;
  const logo = document.getElementById("businessLogo");
  const name = document.getElementById("businessName");
  if (logo) logo.textContent = b.initials;
  if (name) name.textContent = State.currentBusiness;
  Overview.updateBusiness();
}

function initComponentNavigation() {
  document.querySelectorAll(".nav-item,.bottom-nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      navigate(btn.dataset.route);
      closeSidebar();
    });
  });
}

// Check if Chart.js loaded, else show fallback
function checkChartAvailability() {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js not loaded – showing fallback.");
    // We'll show a message in the chart container via CSS later, but we can also inject a fallback.
    // This will be handled in the overview.js chart render.
    return false;
  }
  return true;
}

async function boot() {
  mountSidebar();
  mountHeader();
  await new Promise((r) => requestAnimationFrame(r));
  initTheme();
  initSwipe();
  initMobile();
  initNotifications();
  initGlobalSearch();
  initBusinessSwitcher();
  initComponentNavigation();
  document.documentElement.dataset.theme = State.theme;
  await initRouter();
}

boot().catch((err) => {
  console.error(err);
  document.getElementById("viewContainer").innerHTML = `
    <div class="route-placeholder active">
      <h2>Dashboard failed to load</h2>
      <p>${err.message}. Use a local development server to run this modular version.</p>
    </div>`;
});