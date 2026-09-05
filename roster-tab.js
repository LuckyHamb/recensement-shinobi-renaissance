"use strict";

function setRosterTabActive() {
  if (typeof elements === "undefined" || !elements.filterButtons) return;

  elements.filterButtons.forEach((button) => {
    const isRosterButton = button.dataset.filter === "roster";
    const isActive = state.view === "roster"
      ? isRosterButton
      : !isRosterButton && button.dataset.filter === state.filter;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

// Intercepte le clic avant les anciens gestionnaires de filtres.
document.addEventListener("click", (event) => {
  const button = event.target.closest?.('[data-filter="roster"]');
  if (!button) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  state.view = "roster";
  state.filter = "all";
  state.query = "";
  elements.search.value = "";

  renderCurrentView();
  setRosterTabActive();
}, true);

// Garde l'onglet visuellement actif pendant une recherche dans la liste.
if (typeof elements !== "undefined" && elements.search) {
  elements.search.addEventListener("input", () => {
    if (state.view === "roster") {
      setRosterTabActive();
    }
  });
}
