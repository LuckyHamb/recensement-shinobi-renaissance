# Shinobi Renaissance — Recensement des clans

Site public et statique de consultation du recensement des clans du serveur Minecraft RP **Shinobi Renaissance**.

Il fonctionne avec HTML, CSS, JavaScript Vanilla et JSON, sans base de données, sans compte administrateur, sans dépendance et sans commande d’installation. Les visiteurs peuvent uniquement consulter les données.

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
2. Ajoutez à la racine du repository `index.html`, `style.css`, `script.js`, `README.md` et le dossier `data` contenant `clans.json`.
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

Ce projet ne contient ni page d’administration, ni mot de passe, ni jeton GitHub, ni clé d’API. Les modifications sont réalisées uniquement depuis le repository GitHub par les personnes qui y ont accès.
