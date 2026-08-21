import { showToast } from "../../js/components/modals.js";

export function init() {
    const container = document.getElementById("view-settings");
    if (!container) return;

    const saveBtn = container.querySelector("#save-settings-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            showToast("⚙️ Settings are coming soon — stay tuned!");
        });
    }

    container.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
            showToast(
                `${btn.dataset.action.replace(/-/g, " ")} will be available soon.`
            );
        });
    });
}