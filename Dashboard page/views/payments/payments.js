import { showToast } from "../../js/components/modals.js";

export function init() {
  document.querySelectorAll("#view-payments [data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action.replace(/-/g, " ");
      showToast(`${action} action is ready.`);
    });
  });
  console.log("Payments module initialised.");
}