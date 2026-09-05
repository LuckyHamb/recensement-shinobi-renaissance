"use strict";

async function renderGlobalRoster() {
  const body = document.querySelector("#roster-body");
  const count = document.querySelector("#roster-count");
  const empty = document.querySelector("#roster-empty");

  if (!body || !count || !empty) return;

  try {
    const response = await fetch("./data/clans.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Chargement impossible (${response.status}).`);

    const clans = await response.json();
    if (!Array.isArray(clans)) throw new Error("Format de données invalide.");

    const shinobis = clans.flatMap((clan) => {
      if (!clan || !Array.isArray(clan.members)) return [];

      return clan.members
        .filter((member) => typeof member === "string" && member.trim() !== "")
        .map((member) => ({
          name: member.trim(),
          clanName: typeof clan.name === "string" ? clan.name.trim() : "Clan inconnu",
          clanDisplay: typeof clan.displayName === "string" && clan.displayName.trim() !== ""
            ? clan.displayName.trim()
            : (typeof clan.name === "string" ? clan.name.trim() : "Clan inconnu"),
          emoji: typeof clan.emoji === "string" ? clan.emoji.trim() : "",
        }));
    });

    shinobis.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

    const fragment = document.createDocumentFragment();
    shinobis.forEach((shinobi) => {
      const row = document.createElement("tr");

      const nameCell = document.createElement("td");
      nameCell.className = "roster-name";
      nameCell.textContent = shinobi.name;

      const clanCell = document.createElement("td");
      clanCell.className = "roster-clan";

      const badge = document.createElement("span");
      badge.className = "roster-clan-badge";
      badge.setAttribute("title", shinobi.clanName);

      const emoji = document.createElement("span");
      emoji.className = "roster-clan-emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = shinobi.emoji;

      const label = document.createElement("span");
      label.textContent = shinobi.clanDisplay;

      badge.append(emoji, label);
      clanCell.append(badge);
      row.append(nameCell, clanCell);
      fragment.append(row);
    });

    body.replaceChildren(fragment);
    count.textContent = `${shinobis.length} shinobi${shinobis.length > 1 ? "s" : ""} recensé${shinobis.length > 1 ? "s" : ""}`;
    empty.hidden = shinobis.length !== 0;
  } catch (error) {
    console.error("Erreur de chargement de la liste des shinobis :", error);
    body.replaceChildren();
    count.textContent = "Liste indisponible";
    empty.textContent = "Impossible de charger la liste des shinobis pour le moment.";
    empty.hidden = false;
  }
}

renderGlobalRoster();
