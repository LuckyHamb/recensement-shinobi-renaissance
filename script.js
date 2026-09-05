"use strict";

const state = {
  clans: [],
  query: "",
  filter: "all",
  view: "clans",
};

const elements = {
  clanGrid: document.querySelector("#clans"),
  rosterView: document.querySelector("#roster-view"),
  rosterBody: document.querySelector("#roster-body"),
  rosterEmpty: document.querySelector("#roster-empty"),
  rosterBack: document.querySelector("#roster-back"),
  emptyMessage: document.querySelector("#empty-message"),
  errorMessage: document.querySelector("#error-message"),
  filterButtons: [...document.querySelectorAll("[data-filter]")],
  lastUpdate: document.querySelector("#last-update"),
  resultCount: document.querySelector("#result-count"),
  search: document.querySelector("#search"),
  stats: document.querySelector("#stats"),
  registryTitle: document.querySelector("#registry-title"),
  registryKicker: document.querySelector("#registry-kicker"),
};

function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function validateClans(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Le registre doit contenir au moins un clan.");
  }

  const ids = data.map((clan) => clan?.id);
  const hasInvalidId = ids.some((id) => typeof id !== "string" || id.trim() === "");

  if (hasInvalidId || new Set(ids).size !== ids.length) {
    throw new Error("La liste des clans contient un identifiant invalide ou en double.");
  }

  return data.map((clan) => {
    const isValid =
      clan &&
      typeof clan.name === "string" &&
      clan.name.trim() !== "" &&
      typeof clan.displayName === "string" &&
      clan.displayName.trim() !== "" &&
      typeof clan.emoji === "string" &&
      clan.emoji.trim() !== "" &&
      Number.isInteger(clan.maxMembers) &&
      clan.maxMembers >= 0 &&
      Array.isArray(clan.members) &&
      clan.members.every((member) => typeof member === "string" && member.trim() !== "") &&
      typeof clan.enabled === "boolean";

    if (!isValid) {
      throw new Error(`Les données du clan ${clan?.id ?? "inconnu"} sont invalides.`);
    }

    return {
      ...clan,
      id: clan.id.trim(),
      name: clan.name.trim(),
      displayName: clan.displayName.trim(),
      emoji: clan.emoji.trim(),
      members: clan.members.map((member) => member.trim()),
    };
  });
}

function getClanMetrics(clan) {
  const memberCount = clan.members.length;
  const remaining = clan.maxMembers > 0 ? Math.max(clan.maxMembers - memberCount, 0) : null;
  const progress = clan.maxMembers > 0 ? Math.min((memberCount / clan.maxMembers) * 100, 100) : 0;

  if (!clan.enabled) {
    return { key: "closed", label: "Fermé", memberCount, remaining, progress };
  }

  if (clan.maxMembers === 0) {
    return { key: "config", label: "À configurer", memberCount, remaining, progress };
  }

  if (memberCount >= clan.maxMembers) {
    return { key: "full", label: "Complet", memberCount, remaining, progress };
  }

  const almostFullThreshold = Math.max(2, Math.ceil(clan.maxMembers * 0.2));
  if (remaining <= almostFullThreshold) {
    return { key: "almost", label: "Presque complet", memberCount, remaining, progress };
  }

  return { key: "open", label: "Ouvert", memberCount, remaining, progress };
}

function getTotalMembers() {
  return state.clans.reduce((sum, clan) => sum + clan.members.length, 0);
}

function formatAvailablePlaces(count) {
  return `${count} place${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`;
}

function createMemberContent(clan) {
  if (clan.members.length === 0) {
    const empty = document.createElement("p");
    empty.className = "members-empty";
    empty.textContent = "Aucun shinobi recensé dans ce clan.";
    return empty;
  }

  const list = document.createElement("ul");
  list.className = "members-list";
  clan.members.forEach((member) => {
    const item = document.createElement("li");
    item.textContent = member;
    list.append(item);
  });
  return list;
}

function createClanCard(clan, index) {
  const metrics = getClanMetrics(clan);
  const card = document.createElement("article");
  const panelId = `members-${clan.id}`;
  card.className = "clan-card";
  card.dataset.status = metrics.key;
  card.style.animationDelay = `${Math.min(index * 35, 280)}ms`;

  const main = document.createElement("div");
  main.className = "clan-card__main";

  const header = document.createElement("div");
  header.className = "clan-card__header";

  const identity = document.createElement("div");
  identity.className = "clan-card__identity";

  const emoji = document.createElement("span");
  emoji.className = "clan-card__emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = clan.emoji;

  const title = document.createElement("h3");
  title.textContent = clan.displayName;

  const status = document.createElement("span");
  status.className = "status-badge";
  status.textContent = metrics.label;

  identity.append(emoji, title);
  header.append(identity, status);

  const capacityRow = document.createElement("div");
  capacityRow.className = "capacity-row";

  const capacityMain = document.createElement("div");
  capacityMain.className = "capacity-main";
  const capacityValue = document.createElement("strong");
  capacityValue.textContent = `${metrics.memberCount} / ${clan.maxMembers}`;
  const capacityLabel = document.createElement("span");
  capacityLabel.textContent = "membres";
  capacityMain.append(capacityValue, capacityLabel);

  const capacityDetail = document.createElement("p");
  capacityDetail.className = "capacity-detail";
  capacityDetail.textContent = clan.maxMembers === 0
    ? `${metrics.memberCount} membre${metrics.memberCount > 1 ? "s" : ""} recensé${metrics.memberCount > 1 ? "s" : ""}`
    : formatAvailablePlaces(metrics.remaining);

  capacityRow.append(capacityMain, capacityDetail);
  main.append(header, capacityRow);

  if (clan.maxMembers === 0) {
    const configMessage = document.createElement("div");
    configMessage.className = "config-message";
    configMessage.textContent = "Capacité à configurer";
    main.append(configMessage);
  } else {
    const progressBlock = document.createElement("div");
    progressBlock.className = "progress-block";

    const progressTrack = document.createElement("div");
    progressTrack.className = "progress-track";
    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-label", `Remplissage du clan ${clan.name}`);
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", String(clan.maxMembers));
    progressTrack.setAttribute("aria-valuenow", String(Math.min(metrics.memberCount, clan.maxMembers)));

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.setProperty("--progress", `${metrics.progress}%`);
    progressTrack.append(progressFill);

    const progressCaption = document.createElement("div");
    progressCaption.className = "progress-caption";
    const occupancy = document.createElement("span");
    occupancy.textContent = "Taux d’occupation";
    const percentage = document.createElement("span");
    percentage.textContent = `${Math.round(metrics.progress)} %`;
    progressCaption.append(occupancy, percentage);
    progressBlock.append(progressTrack, progressCaption);
    main.append(progressBlock);
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "members-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", panelId);
  toggle.textContent = "Voir les membres";

  const panel = document.createElement("div");
  panel.className = "members-panel";
  panel.id = panelId;
  panel.hidden = true;
  panel.append(createMemberContent(clan));

  toggle.addEventListener("click", () => {
    const willOpen = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(willOpen));
    toggle.textContent = willOpen ? "Masquer les membres" : "Voir les membres";
    panel.hidden = !willOpen;
  });

  card.append(main, toggle, panel);
  return card;
}

function createRosterLauncherCard() {
  const totalMembers = getTotalMembers();
  const card = document.createElement("button");
  card.type = "button";
  card.className = "clan-card roster-launch-card";
  card.setAttribute("aria-label", "Ouvrir la liste de tous les shinobis recensés");

  const main = document.createElement("div");
  main.className = "clan-card__main";

  const identity = document.createElement("div");
  identity.className = "clan-card__identity roster-launch-copy";

  const emoji = document.createElement("span");
  emoji.className = "clan-card__emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = "👥";

  const copy = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "「 S H I N O B I S  R E C E N S É S 」";
  const description = document.createElement("p");
  description.textContent = "Voir tous les joueurs avec leur clan, classés par clan.";
  copy.append(title, description);

  identity.append(emoji, copy);

  const count = document.createElement("div");
  count.className = "roster-launch-count";
  const countValue = document.createElement("strong");
  countValue.textContent = String(totalMembers);
  const countLabel = document.createElement("span");
  countLabel.textContent = `shinobi${totalMembers > 1 ? "s" : ""}`;
  count.append(countValue, countLabel);

  main.append(identity, count);

  const action = document.createElement("div");
  action.className = "roster-launch-action";
  const actionLabel = document.createElement("span");
  actionLabel.textContent = "Ouvrir le registre des joueurs";
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  action.append(actionLabel, arrow);

  card.append(main, action);
  card.addEventListener("click", () => {
    state.view = "roster";
    state.query = "";
    elements.search.value = "";
    renderCurrentView();
    elements.search.focus();
  });

  return card;
}

function matchesFilter(clan, filter) {
  const metrics = getClanMetrics(clan);

  if (filter === "available") {
    return clan.enabled && clan.maxMembers > 0 && metrics.remaining > 0;
  }
  if (filter === "full") {
    return metrics.key === "full";
  }
  if (filter === "closed") {
    return metrics.key === "closed";
  }
  return true;
}

function renderClans() {
  const query = normalize(state.query);
  const visibleClans = state.clans.filter((clan) => {
    const searchableText = [clan.name, clan.displayName, ...clan.members]
      .map(normalize)
      .join(" ");
    return searchableText.includes(query) && matchesFilter(clan, state.filter);
  });

  const fragment = document.createDocumentFragment();

  if (state.filter === "all" && query === "") {
    fragment.append(createRosterLauncherCard());
  }

  visibleClans.forEach((clan, index) => fragment.append(createClanCard(clan, index)));
  elements.clanGrid.replaceChildren(fragment);

  elements.emptyMessage.hidden = visibleClans.length !== 0;
  elements.resultCount.textContent = `${visibleClans.length} clan${visibleClans.length > 1 ? "s" : ""} affiché${visibleClans.length > 1 ? "s" : ""}`;
}

function createRosterRow(name, clan) {
  const row = document.createElement("tr");

  const nameCell = document.createElement("td");
  nameCell.className = "roster-name";
  nameCell.textContent = name;

  const clanCell = document.createElement("td");
  clanCell.className = "roster-clan";

  const badge = document.createElement("span");
  badge.className = "roster-clan-badge";
  badge.setAttribute("title", clan.name);

  const emoji = document.createElement("span");
  emoji.className = "roster-clan-emoji";
  emoji.setAttribute("aria-hidden", "true");
  emoji.textContent = clan.emoji;

  const label = document.createElement("span");
  label.textContent = clan.displayName;

  badge.append(emoji, label);
  clanCell.append(badge);
  row.append(nameCell, clanCell);
  return row;
}

function renderRoster() {
  const query = normalize(state.query);
  const entries = [];

  state.clans.forEach((clan, clanIndex) => {
    const sortedMembers = [...clan.members].sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );

    sortedMembers.forEach((name) => {
      const searchableText = [name, clan.name, clan.displayName]
        .map(normalize)
        .join(" ");

      if (searchableText.includes(query)) {
        entries.push({ name, clan, clanIndex });
      }
    });
  });

  entries.sort((a, b) => {
    if (a.clanIndex !== b.clanIndex) return a.clanIndex - b.clanIndex;
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });

  const fragment = document.createDocumentFragment();
  entries.forEach(({ name, clan }) => fragment.append(createRosterRow(name, clan)));
  elements.rosterBody.replaceChildren(fragment);

  elements.rosterEmpty.hidden = entries.length !== 0;
  elements.resultCount.textContent = `${entries.length} shinobi${entries.length > 1 ? "s" : ""} affiché${entries.length > 1 ? "s" : ""}`;
}

function syncFilterButtons() {
  elements.filterButtons.forEach((button) => {
    const isActive = state.view === "clans" && button.dataset.filter === state.filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderCurrentView() {
  const rosterMode = state.view === "roster";

  elements.clanGrid.hidden = rosterMode;
  elements.rosterView.hidden = !rosterMode;
  elements.emptyMessage.hidden = true;
  syncFilterButtons();

  if (rosterMode) {
    elements.registryTitle.textContent = "Shinobis recensés";
    elements.registryKicker.textContent = "Registre des joueurs";
    elements.search.placeholder = "Rechercher un shinobi ou un clan…";
    renderRoster();
    return;
  }

  elements.registryTitle.textContent = "Clans recensés";
  elements.registryKicker.textContent = "Archives actives";
  elements.search.placeholder = "Rechercher un clan ou un shinobi…";
  renderClans();
}

function renderStats() {
  const metrics = state.clans.map(getClanMetrics);
  const totalMembers = metrics.reduce((sum, clan) => sum + clan.memberCount, 0);
  const availablePlaces = state.clans.reduce((sum, clan, index) => {
    const clanMetrics = metrics[index];
    return clan.enabled && clan.maxMembers > 0 ? sum + clanMetrics.remaining : sum;
  }, 0);
  const openClans = metrics.filter((clan) => clan.key === "open" || clan.key === "almost").length;
  const fullClans = metrics.filter((clan) => clan.key === "full").length;

  const values = {
    members: totalMembers,
    available: availablePlaces,
    open: openClans,
    full: fullClans,
    total: state.clans.length,
  };

  Object.entries(values).forEach(([key, value]) => {
    const target = elements.stats.querySelector(`[data-stat="${key}"]`);
    if (target) target.textContent = String(value);
  });
}

function bindControls() {
  elements.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCurrentView();
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.view = "clans";
      state.filter = button.dataset.filter;
      state.query = "";
      elements.search.value = "";
      renderCurrentView();
    });
  });

  if (elements.rosterBack) {
    elements.rosterBack.addEventListener("click", () => {
      state.view = "clans";
      state.filter = "all";
      state.query = "";
      elements.search.value = "";
      renderCurrentView();
    });
  }
}

async function loadClans() {
  try {
    const response = await fetch("./data/clans.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Chargement impossible (${response.status}).`);
    }

    state.clans = validateClans(await response.json());
    renderStats();
    renderCurrentView();
    elements.lastUpdate.textContent = "Données du registre chargées";
  } catch (error) {
    console.error("Erreur de chargement du registre :", error);
    elements.errorMessage.hidden = false;
    elements.lastUpdate.textContent = "Données indisponibles";
    elements.resultCount.textContent = "";
  } finally {
    elements.clanGrid.setAttribute("aria-busy", "false");
  }
}

bindControls();
loadClans();
