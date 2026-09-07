"use strict";
const viewButtons = [...document.querySelectorAll("[data-view-target]")];
const views = [...document.querySelectorAll("[data-view]")];
function showView(viewId, updateHash = true) {
  const target = views.find((view) => view.dataset.view === viewId) || views[0];
  views.forEach((view) => { const active = view === target; view.classList.toggle("is-active", active); view.hidden = !active; });
  viewButtons.forEach((button) => { const active = button.dataset.viewTarget === target.dataset.view; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
  if (updateHash) history.replaceState(null, "", `#${target.dataset.view}`);
  window.dispatchEvent(new CustomEvent("app:viewchange", { detail: { view: target.dataset.view } }));
}
viewButtons.forEach((button) => button.addEventListener("click", () => showView(button.dataset.viewTarget)));
const initialView = location.hash.replace("#", "").split("/")[0];
if (initialView && views.some((view) => view.dataset.view === initialView)) showView(initialView, false);
window.showAppView = showView;
