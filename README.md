# Shinobi Renaissance — Registre & Archives du Siècle

Site public et statique de consultation du recensement et du Lore du serveur Minecraft RP **Shinobi Renaissance**.

Il fonctionne avec HTML, CSS, JavaScript Vanilla et JSON, sans base de données, sans compte administrateur, sans dépendance et sans commande d’installation. Les visiteurs peuvent uniquement consulter les données.

## Encyclopédie du Lore

L’onglet **Lore** contient cinq espaces : Clans, Chroniques, Techniques, Carte & Chronologie et Administration.

- `data/world-timeline.json` contient tous les événements historiques, leurs lieux et leurs relations.
- `data/world-map.json` contient la géographie, les routes, les niveaux de détail et les états historiques.
- `data/lore-clans.json` contient les origines, traditions et héritages des dix-neuf groupes du registre.
- `data/techniques.json` contient les techniques historiques.
- `data/locations/konoha.json` contient la scène détaillée chargée uniquement à proximité de Konoha.

La carte utilise une grille interne de 1200 × 800 indépendante de la résolution de l’écran. Les niveaux Monde, Pays, Région, Village et Village 3D apparaissent progressivement pendant le zoom. La scène 3D de Konoha utilise WebGL et possède un fallback 2D.

L’Administration du Lore reste volontairement publique et sans connexion : elle documente les fichiers à modifier et permet uniquement de valider localement la syntaxe d’un JSON. Les modifications persistantes passent par GitHub.

## Modifier le recensement

Le seul fichier à modifier régulièrement est :

`data/clans.json`

### Ajouter ou retirer un joueur

Repérez le clan concerné puis modifiez uniquement son tableau `members` :

```json
"members": [
  "LuckyHamb",
  "Katsuko"
]
```

Pour retirer un joueur, supprimez simplement sa ligne en veillant à conserver un JSON valide. Le site recalcule automatiquement le nombre de membres, les places restantes, la barre de progression, le statut du clan et les statistiques générales.

### Définir la capacité d’un clan

Modifiez la valeur de `maxMembers` :

```json
"maxMembers": 10
```

- `0` affiche **À configurer** et aucune barre de progression.
- Une valeur supérieure à `0` active les calculs automatiques.
- Un clan qui n’a plus de place devient **Complet**.
- Un clan auquel il reste au plus 2 places ou 20 % de sa capacité devient **Presque complet**.

### Ouvrir ou fermer un clan

Utilisez la propriété `enabled` :

```json
"enabled": false
```

`false` affiche le clan comme **Fermé**. Remettez `true` pour le rouvrir.

## Tester le site sur votre ordinateur

Le navigateur ne permet généralement pas de charger un fichier JSON lorsque `index.html` est ouvert directement avec un double-clic. Lancez donc un petit serveur local depuis le dossier du projet, par exemple si Python est installé :

```bash
python -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.

Cette étape est facultative pour GitHub Pages.

## Publier gratuitement avec GitHub Pages

1. Connectez-vous à GitHub puis créez un nouveau repository, par exemple `recensement`.
2. Ajoutez tous les fichiers et dossiers du projet à la racine du repository, notamment `index.html`, `style.css`, `script.js`, `navigation.js`, `lore`, `assets` et `data`.
3. Validez les fichiers sur la branche `main`.
4. Ouvrez l’onglet **Settings** du repository.
5. Dans le menu latéral, ouvrez **Pages**.
6. Dans **Build and deployment**, choisissez **Deploy from a branch** comme source.
7. Sélectionnez la branche **main** et le dossier **/ (root)**.
8. Cliquez sur **Save** et attendez la fin de la publication.
9. GitHub affiche ensuite l’adresse du site, sous la forme `https://VOTRE-PSEUDO.github.io/recensement/`.

Toutes les ressources utilisent des chemins relatifs, le site fonctionne donc dans un sous-chemin GitHub Pages.

## Mettre les données à jour depuis GitHub

1. Dans le repository, ouvrez `data/clans.json`.
2. Cliquez sur l’icône crayon **Edit this file**.
3. Modifiez les capacités, les membres ou l’état des clans.
4. Cliquez sur **Commit changes**.
5. Après la nouvelle publication automatique de GitHub Pages, rechargez le site.

## Sécurité

Ce projet ne contient ni authentification, ni mot de passe, ni jeton GitHub, ni clé d’API. Les espaces « Administration » sont uniquement des aides publiques de consultation/validation ; les modifications persistantes sont réalisées depuis le repository GitHub par les personnes qui y ont accès.
