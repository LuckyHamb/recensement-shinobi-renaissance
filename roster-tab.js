"use strict";

const rosterTabButton = document.querySelector('[data-filter="roster"]');

if (typeof syncFilterButtons === "function") {
  syncFilterButtons = function () {
    elements.filterButtons.forEach((button) => {
      const isRosterButton = button.dataset.filter === "roster";
      const isActive = state.view === "roster"
        ? isRosterButton
        : !isRosterButton && button.dataset.filter === state.filter;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };
}

if (rosterTabButton) {
  rosterTabButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    state.view = "roster";
    state.filter = "all";
    state.query = "";
    elements.search.value = "";
    renderCurrentView();
  }, true);
}
