# Carte & Chronologie — refonte v3

Branche : feature/map-overhaul-v3. Base initiale : 7c3138e6e1898accff4ff648b152e82e21fa05dc.

## Périmètre

La refonte est limitée à l’explorateur. Les fichiers de recensement, les emblèmes, les pages de clans, les Chroniques et les événements historiques existants restent conservés. Les tests obsolètes référençant la page et le module Techniques déjà supprimés ont été retirés ; aucune interface Techniques n’est réintroduite.

## Carte

- Vue mondiale au chargement ; 5 grands villages toujours identifiables, y compris avant les événements de fondation.
- Géographie originale : côte continentale, archipel, cinq territoires, lacs, rivières et routes historiques.
- Relief Canvas déterministe : montagnes éclairées, plateaux, collines, forêts, dunes et marais.
- Calques Relief, Territoires et Routes.
- Caméra uniforme de 0,75× à 18× : déplacement souris/tactile/clavier et zoom ancré au pointeur ou par pincement.
- Mise en cache du fond ; animation des événements limitée à environ 30 images/seconde. Aucun modèle ou service distant.
- Échelle calculée depuis la transformation réelle de la caméra.
- Recherche, filtres, liens cause/conséquence et frise de 300 à 400.
- 347 se centre sur le champ de bataille ; une conséquence hors filtre rétablit la frise complète.
- 400 utilise un marqueur carré doré et rétablit une vue globale.

## Konoha

Les données détaillées sont chargées à partir de 3,5× à proximité du village. À 3,8× apparaissent remparts, routes et quartiers ; à 5× les maisons et jardins ; à 8× les façades, ombres et noms des quartiers. Le plan utilise 55 bâtiments, quatre quartiers et une porte. Le rendu 2,5D fonctionne sans WebGL et reste attaché aux coordonnées mondiales. Ajouter detailSource à un autre lieu permet de réutiliser le même moteur.

## Validation

npm test : tests existants encore applicables et tests des cinq villages, périodes, références, terrain déterministe, données locales et absence de navigation Techniques.
npm run validate et npm run build.
Tests navigateur : carte mondiale, Konoha détaillée, recherche 347, conséquence 352, curseur historique, calques, filtres, clavier et responsive 390, 768, 1440 et 1920 px. Test sous le préfixe /recensement-shinobi-renaissance/ pour GitHub Pages.

## Choix à valider par l’équipe RP

Suna, Kiri, Kumo et Iwa sont indiqués « Non jouable » ; Konoha « Ouvert », conformément à la phase V1 actuelle. Ces indications cartographiques ne modifient aucune donnée de membre ni permission de jeu. Le relief et le plan urbain sont des représentations stylisées à valider artistiquement. Les lieux et événements historiques existants sont conservés. La 2,5D est volontairement légère : pas de caméra orbitale ou de modèle 3D photoréaliste.

## Mise en production et restauration

Juste avant le merge : fetch origin main, intégrer origin/main sur feature/map-overhaul-v3, comparer clans.json et tous les fichiers hors périmètre, puis créer backup/before-map-overhaul-v3 sur le SHA exact obtenu. Publier la sauvegarde avant main. Utiliser un merge normal et un push sans force ; un rejet oblige à refaire la synchronisation et la sauvegarde avec un nom unique.

En cas de régression après publication : revert du commit de merge avec git revert -m 1 <SHA-du-merge>, puis push normal. Ce retour annule uniquement la refonte et préserve les nouveaux commits éventuels. La branche de sauvegarde reste disponible pour comparaison et restauration.
