# Terrain EINS — appli de terrain de French Acoustics

Ce fichier est lu par Claude Code au début de chaque session dans ce dépôt.
Propriétaire : Liza (acousticienne, French Acoustics). Réponds-lui en français, en la tutoyant.

## À quoi sert l'appli
Terrain EINS (ex-« Photo EINS ») est une appli web pour iPhone, installée sur l'écran d'accueil. Liza s'en sert sur site,
pendant les mesures des **EINS** (Études d'Impact des Nuisances Sonores : bars, restaurants, salles diffusant de la musique amplifiée).
Elle sert à :
- **prendre les photos** du chantier avec un nom normalisé (voisin, points de mesure, enceintes, calibration…) ;
- **remplir la fiche terrain** du chantier (horaires, lieu clos / ouvert, voisin, sono, limiteur…) ;
- **envoyer** photos et fiche dans le Google Drive, rangées par chantier ;
- **contrôler avant de partir** qu'il ne manque rien (photos obligatoires, musiques, fiche).

Ces données servent ensuite à rédiger le rapport EINS, dans un projet claude.ai séparé (skill « eins-french-acoustics »).
**Les noms de fichiers et les champs de la fiche sont lus par ce skill : ne pas les renommer sans le signaler à Liza**,
car le skill et `Outils_EINS.md` (projet claude.ai) devront être mis à jour en même temps.

## Fichiers
- `index.html` : toute l'appli (HTML, CSS, JS dans un seul fichier, sans dépendance ni build).
- `sw.js` : service worker (cache hors ligne). Constante `VERSION`.
- `manifest.webmanifest` : nom « Terrain EINS », icônes, plein écran.
- `icon-180.png`, `icon-192.png`, `icon-512.png`.
- Publication : GitHub Pages, https://lizablpe.github.io/photo-mesures/

## Côté serveur (pas dans ce dépôt)
Script Google Apps Script « Photo EINS » (compte liza@french-acoustics.com). `Code.gs` n'est **pas** dans le dépôt.
- `POST {k, name, data(base64), dossier}` : enregistre une photo.
- `POST {k, fiche, dossier | jour}` : écrit `fiche_terrain.json` dans le dossier du chantier.
- `GET ?action=lister&k=…` : fichiers déjà dans le Drive (pour le contrôle).
- `GET ?action=musiques&k=…` : morceaux reconnus (Sheet « Historique Shazam »).
- `GET ?action=affaires&k=…` : affaires « Gagné » du CRM Notion. **Pas encore active** (voir « En attente »).
- La clé `k` est dans le lien collé dans Réglages (`…/exec?k=…`). **Ne jamais l'écrire dans le dépôt.**
- Drive : `Drive partagés / 04 ETUDES ACOUSTIQUES / Fichier applis / Photo terrain` (ID `1dXeJ9GJH-L-BgPgS2DVNMvL6lBFMDzNu`).
  Un sous-dossier par chantier `Nom_AAAA-MM-JJ_HHmm`, sinon un par journée `AAAA-MM-JJ` (la journée bascule à 6 h).

## Conventions à respecter
- Photos : `AAAA-MM-JJ_HHmm_<type>[_Marque Modèle][_n].jpg`. Types : `voisin`, `voisin-2`, `P1-defavorable(-2..4)`, `P2-limiteur(-2)`,
  `micro-limiteur`, `calibration-avant`, `calibration-apres`, `enceinte-1..4`, `caisson-1..2`, `table-mixage`, `ampli-1..2`,
  `plan`, `autre-<description>`. (`facade` a été retiré en v10, mais il existe dans d'anciens dossiers.)
- Fiche (`CHAMPS_FICHE`) : horaires, lieu (« clos », « ouvert » ou « clos, ouvert »), zone_close et zone_ouverte (seulement si les deux
  sont cochés), portes, voisin, distance, gps_voisin, deux_voisins (« oui » / « non », mis à « oui » par la photo Voisin 2),
  gps_voisin_2 (visible si deux_voisins = « oui »), gps_etablissement, piece, fenetre, audible,
  sono, zones, limiteur (« non », « oui » ou marque + modèle), capacite, ouverture, remarques, maj. Champs ajoutés automatiquement : affaire_crm, affaire_nom, affaire_date_intervention (choix dans le CRM).
- GPS : format `"lat, lon (±précision m)"`. Il s'enregistre seul à la photo Voisin, et à la 1re photo P1 / P2 pour l'établissement.
- Stockage local : IndexedDB `photo-eins` (store `photos`) et localStorage `photoEins.*`
  (config, projet, projets, fiche.<dossier>, ficheAEnvoyer, modeles, affaires, sansProjet).
- **Mode Émergence (v13)** : choisi à la création du chantier (« Type d'étude » : EINS / Émergence), gardé dans le projet (`mode`)
  et dans `photoEins.mode` pour « Sans projet ». Types photo (`TYPES_EMERGENCE`) : `calibration-avant`, `calibration-apres`,
  `equipement-1..4` (+ marque et modèle), `plaque`, `voisin`, `voisin-2`, `point-limite`, `plan`, `meteo`, `autre-<description>`.
  Fiche (`CHAMPS_EMERGENCE`) : source_type, source_marque_modele, source_nombre, implantation, pilotage, regime, regime_verifie,
  fonctionnement, duree_jour, duree_nuit, seq_ambiant_jour, seq_residuel_jour, seq_ambiant_nuit, seq_residuel_nuit (« 17h15-17h45 »,
  boutons Début / Fin), point_type, point_position, piece, fenetre, distance, gps_point, gps_point_2, gps_source, vent, evenements,
  remarques, et `type_etude` = « emergence » (ajouté à l'enregistrement). GPS auto : photo voisin / point-limite → gps_point,
  voisin-2 → gps_point_2, 1re photo équipement → gps_source. Pas de section Musique en mode Émergence.
  Ces noms sont lus par le skill « rapport-emergence-fa » (projet claude.ai « Rapport Emergence »).
- Textes de l'interface en français, typographie française (’ « »).

## À chaque modification
1. Incrémenter la mention de version en bas de `index.html` (`<p class="version">`) **et** `VERSION` dans `sw.js`.
   Sinon l'iPhone garde l'ancienne version en cache.
2. Vérifier la syntaxe du JS et tester au format iPhone (375 px de large), en clair et en sombre.
3. Ne jamais supprimer une photo ni une fiche qui n'a pas encore été envoyée.
4. Montrer le diff à Liza et attendre son accord avant tout commit et push.
5. Si `Code.gs` doit changer, fournir le code à coller dans Apps Script. Rappeler ensuite de faire « Déployer → Gérer les
   déploiements → Nouvelle version » (jamais « Nouveau déploiement » : l'URL changerait).

## Historique
- v7 : fiche terrain et contrôle avant de partir.
- v8 : renommée « Terrain EINS », bouton Fiche en haut, type `plan`.
- v9 : lieu à choix multiple, `type_fenetre` retiré, croix de fermeture, reprise d'un chantier, visionneuse photo, masquage des photos.
- v10 : calibration avant / après, `facade` retiré, effacement des photos envoyées (Réglages). v10.1 : liste des chantiers mémorisée.
- v11 : GPS voisin / établissement, zones close et ouverte, affaires du CRM. v11.1 : la liste CRM est ignorée si le script ne la gère pas.
- v12 : boutons dans l'ordre d'intervention (calibration en tête), photo `voisin-2` + `gps_voisin_2`, contrôle avant de partir
  cliquable, limiteur en non / oui + marque, fiche avec un seul bouton, « Choisir un chantier », barre sombre, délai d'envoi de la fiche.
  v12.1 : question « 2e voisin ? » (oui / non) dans la fiche, qui affiche la position GPS du voisin 2.
  v12.2 : bouton « Micro du limiteur » déplacé dans Régie (nom de fichier inchangé : `micro-limiteur`).
- v13 : mode Émergence (type d'étude par chantier, boutons et fiche propres, séquences avec boutons Début / Fin, contrôle adapté).

## En attente
- **Connexion Notion** : Liza n'a pas le droit de créer une connexion interne dans l'espace « Super Corps ». Il faut que le
  propriétaire crée une connexion « Jeton d'API », en lecture seule, sur la base Affaires (ID `6d0df196eda6441697e9c0b86bf2afdb`).
  Ensuite :
  - mettre la clé dans Propriétés du script → `NOTION_TOKEN` ;
  - ajouter `Notion.gs` (gardé à part par Liza) ;
  - ajouter dans `doGet` de `Code.gs`, après la vérification de `k` : `if (e.parameter.action === 'affaires') return actionAffaires_();`
  Pas de jeton d'accès personnel (trop de droits).
- **Convention de noms des mesures sur le sonomètre Fusion** (`residuel`, `ambiant`, `pdf1`, `lim1`…) : à valider par Liza, puis
  ajouter un aide-mémoire dans la fiche.
