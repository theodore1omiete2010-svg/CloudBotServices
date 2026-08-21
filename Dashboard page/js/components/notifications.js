import { showToast } from "./modals.js";

export function initNotifications() {
  // FIXED: Selector now matches the button in header.js
  const button = document.querySelector('.topbar-icon-btn[title="Notifications"]');
  if (!button) {
    console.warn("Notification button not found");
    return;
  }
  button.addEventListener("click", () => {
    showToast("You have 3 dashboard notifications.");
  });
}