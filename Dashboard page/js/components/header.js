/**
 * Helper to get 2-letter initials from the business name
 */
function getInitials(name) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Mounts the top navigation bar into #headerMount
 */
export function mountHeader(businessName = "Chawntee's Grill") {
  const container = document.getElementById("headerMount");
  if (!container) return;

  // Removed the initials variable – we don't show avatar

  container.innerHTML = `
    <header class="topbar">
      <div class="topbar-left">
        <button class="mobile-menu-btn mobile-menu" id="mobileMenu" aria-label="Toggle Sidebar Navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <!-- Business Switcher (custom dropdown) -->
        <div class="business-switcher" id="businessSwitcher">
          <div class="business-info">
            <span class="business-name">${businessName}</span>
            <span class="business-label"><span class="status-dot"></span> Open for orders</span>
          </div>
          <span class="business-arrow">▾</span>
          <div class="business-dropdown" id="businessDropdown"></div>
        </div>
      </div>

      <div class="topbar-search">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Search orders, customers, or items..." id="globalSearch" />
        </div>
      </div>

      <div class="topbar-right">
        <!-- Settings icon FIRST -->
        <button class="topbar-icon-btn" title="Settings" id="topbarSettings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 01 0-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"></path>
          </svg>
        </button>

        <!-- Notifications -->
        <button class="topbar-icon-btn" title="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 01-3.46 0"></path>
          </svg>
          <span class="notification-badge"></span>
        </button>

        <!-- User Avatar (no CG, just initials) -->
        <div class="user-avatar-btn" title="Account Menu">
          BO
        </div>
      </div>
    </header>
  `;
}