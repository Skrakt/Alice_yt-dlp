# Alice

Alice est une application desktop locale construite avec Tauri v2, React, TypeScript et Rust.

Elle sert à la fois de :
- téléchargeur YouTube basé sur `yt-dlp`
- navigateur de médias locaux avec dossiers favoris persistants

## Ce que permet l'application

- analyser une URL YouTube avec `yt-dlp --flat-playlist --dump-json`
- afficher les médias détectés avant téléchargement
- sélectionner les éléments à télécharger
- télécharger en audio ou vidéo
- choisir le format de sortie
- choisir ou saisir manuellement le dossier de destination
- suivre la progression et les logs
- annuler une analyse ou un téléchargement
- consulter un historique local
- parcourir des dossiers locaux favoris depuis une barre latérale repliable

## Interface actuelle

- barre latérale gauche repliable, dans l'esprit ChatGPT / Claude desktop
- vue `Accueil` pour le téléchargement
- vue `Bibliothèque locale` pour naviguer dans les dossiers favoris
- favoris persistés côté Tauri dans le dossier de données de l'application
- historique visible dans la barre latérale

## Stack

- Tauri v2
- React 19
- TypeScript
- Vite
- Rust
- `yt-dlp`
- `ffmpeg`

## Pré-requis

### Obligatoires

1. Node.js 20+ ou 22+
2. Rust toolchain avec `cargo` et `rustc`
3. Prérequis Tauri pour macOS

### Dépendances médias

Alice vérifie `yt-dlp` et `ffmpeg` au lancement.

Si elles manquent, l'application tente de les installer automatiquement via Homebrew.

Installation manuelle possible :

```bash
brew install yt-dlp ffmpeg
```

## Installation

```bash
npm install
```

## Lancer en développement

```bash
npm run tauri dev
```

Comportement attendu :
- modification frontend : hot reload
- modification Rust / Tauri : recompilation puis relance de l'app

## Build

```bash
npm run build
```

## Scripts utiles

```bash
npm run dev
npm run build
npm run preview
npm run tauri dev
```

## Structure du projet

```text
src/
  App.tsx
  components/
  lib/

src-tauri/
  icons/
  src/
    commands.rs
    folders.rs
    history.rs
    main.rs
    models.rs
    ytdlp.rs
  tauri.conf.json
```

## Nommage des fichiers téléchargés

L'interface propose des modèles simples :
- `Numéro + titre`
- `Titre seul`
- `Auteur + titre`
- `Date + titre`

Le modèle par défaut est :

```text
%(playlist_index)03d - %(title)s.%(ext)s
```

## Données locales

Alice est pensée pour une distribution publique sur GitHub avec persistance 100 % locale.

Alice stocke localement :
- l'historique des téléchargements
- les dossiers favoris
- certains paramètres d'interface, comme l'état ouvert / fermé de la barre latérale

Ces données sont enregistrées dans le dossier applicatif Tauri.

Aucune donnée utilisateur n'est synchronisée vers un serveur distant par l'application.

## Icône de l'application

L'icône utilisée par Tauri est :

```text
src-tauri/icons/icon.png
```

Elle est actuellement générée à partir du fichier racine :

```text
ChatGPT Image Jun 11, 2026, 04_04_35 PM.png
```

## Limites connues

- la progression détaillée dépend du format des logs émis par `yt-dlp`
- l'installation automatique des dépendances suppose un environnement Homebrew
- le navigateur local est centré sur l'exploration, pas encore sur la lecture intégrée des médias

## Légal

Télécharge uniquement les contenus que tu as le droit de télécharger.
