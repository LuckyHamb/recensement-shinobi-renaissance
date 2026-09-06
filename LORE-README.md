# Archives Shinobi Renaissance

Extension statique du dépôt LuckyHamb/recensement-shinobi-renaissance, récupéré le 6 septembre 2026. Le code original est conservé, avec deux ajouts limités : navigation vers les archives et liens sur les cartes. `style.css`, `data/clans.json`, `roster.js` et `roster-tab.js` restent inchangés.

## Utilisation

- `/` : recensement et liste des shinobis.
- `/lore/` : 19 dossiers, recherche et filtres.
- `/lore/clan/?id=uchiha` : moteur commun aux clans.
- `/lore/chroniques/` et `/lore/techniques/` : répertoires filtrables.
- `/lore/administration/?id=uchiha` : édition locale, organigramme visuel, validation et téléchargement JSON. Aucun enregistrement distant automatique.

Les liens relatifs et les chemins calculés depuis le module fonctionnent à la racine ou sous `/recensement-shinobi-renaissance/`. Un serveur HTTP est nécessaire pour charger les JSON ; ouvrir directement index.html en file:// ne suffit pas.

## Données

`data/clan-lore.json` contient les IDs dans l’ordre du registre. Chaque dossier est dans `data/lore/<id>.json`. Le recensement est toujours lu dans `data/clans.json`, jamais copié dans les dossiers.

`data/lore-config.json` conserve `SERVER_PHASE: "V1"`. Le village affiché est calculé depuis `v1Village` ou `v2Village`. `currentVillage` documente l’état initial et `originVillage` conserve l’origine ; modifier la phase ne réécrit pas ces archives. La V2 n’est pas activée.

Les hiérarchies utilisent parent, level et accessLevel. Le parent définit les connexions, l’ordre des frères suit le tableau, le niveau d’accès augmente avec les responsabilités. L’éditeur permet de renommer, ajouter, retirer, réordonner et réaffecter les grades. Les cycles et parents inexistants sont refusés.

Techniques : `public`, `name-only`, `classified`, `hidden`. `adminOnly: true` ou `enabled: false` masque entièrement une fiche. Ces règles contrôlent la présentation, pas l’accès réseau. Un site GitHub Pages et son dépôt public ne protègent aucune donnée secrète : les descriptions confidentielles sont donc absentes des fichiers livrés. N’y insérez pas de contenu confidentiel ; transmettez-le par un canal authentifié distinct.

Les histoires et personnages contemporains sont des créations RP proposées pour le serveur. Les captures Uchiha ont guidé Akaryū, la police, la Magatama et la passation de lame ; le chef contemporain est original. Les emblèmes sont des SVG locaux, avec l’éventail de la référence et des interprétations graphiques signalées dans les données. Deux illustrations originales optimisées en WebP sont accompagnées de leurs prompts dans `assets/lore/image-prompts.json`.

## Intégration GitHub Pages

Les changements sont proposés sur la branche `feature/clan-lore` du dépôt GitHub. La branche main et le site GitHub Pages de production ne sont pas modifiés. Vérifier la proposition de changement avant fusion. Les dossiers lore peuvent être édités directement sur GitHub depuis leur page d’administration. Conserver `data/clans.json` distant s’il a évolué.

Pour GitHub Pages configuré sur une branche, servir la racine du dépôt : aucune compilation n’est nécessaire. `.nojekyll` conserve la distribution statique. Les réglages GitHub Pages existants peuvent rester identiques. Après fusion, les liens d’administration GitHub existants continuent à modifier les effectifs sur main ; les dossiers lore sont téléchargeables depuis leur éditeur et intégrables dans `data/lore/`.

## Vérifications

Sans dépendances : Node.js suffit. `npm test` vérifie schéma, hiérarchies invalides, projections classifiées, V1/V2 et disponibilités ; `npm run validate` vérifie les ressources et liens locaux ; `npm run build` produit `dist/` pour Sites. Le dépôt source reste directement compatible GitHub Pages.

Un aperçu Sites privé est distinct du GitHub Pages d’origine. Il contient une copie du recensement récupérée à la date ci-dessus ; les nouvelles modifications GitHub n’y sont pas synchronisées automatiquement.

