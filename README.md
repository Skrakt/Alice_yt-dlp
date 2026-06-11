# PRH: Personal Rabbit Hole

PRH est une application desktop locale construite avec Tauri v2, React, TypeScript et Rust pour analyser et télécharger des médias YouTube via `yt-dlp`, puis les convertir avec `FFmpeg`.

## MVP inclus

- champ URL et analyse locale via `yt-dlp --flat-playlist --dump-json`
- support vidéo unique, playlist, et chaîne si `yt-dlp` le gère
- sélection individuelle des médias détectés
- téléchargement audio ou vidéo
- formats audio `mp3`, `m4a`, `flac`, `opus`, `wav`
- formats vidéo `mp4`, `mkv`, `webm`
- qualité vidéo `best`, `1080p`, `720p`
- sélection du dossier de sortie
- progression globale et logs visibles
- annulation
- historique local en JSON

## Stack

- Tauri v2
- React
- TypeScript
- Vite
- Rust
- `yt-dlp`
- `FFmpeg`

## Pré-requis

Installe les outils suivants avant de lancer l’application :

1. Node.js 20+ ou 22+
2. Rust toolchain avec `cargo` et `rustc`
3. Tauri prerequisites pour macOS
4. `yt-dlp` disponible dans le `PATH`
5. `ffmpeg` disponible dans le `PATH`

Exemple macOS avec Homebrew :

```bash
brew install rust yt-dlp ffmpeg
npm install
npm run tauri dev
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm run tauri dev
```

## Structure

```text
src/
  App.tsx
  main.tsx
  components/
  lib/

src-tauri/
  src/
    main.rs
    commands.rs
    ytdlp.rs
    models.rs
    history.rs
  capabilities/
    default.json
```

## Notes d’implémentation

- L’analyse se fait sans API YouTube, uniquement via `yt-dlp`.
- Les téléchargements sont déclenchés dans le backend Rust pour ne pas bloquer l’interface.
- Les logs et la progression sont poussés au frontend via des événements Tauri.
- L’historique est stocké en local dans le dossier applicatif Tauri sous forme de JSON.
- Le template de nommage par défaut est `%(playlist_index)03d - %(title)s.%(ext)s`.

## Limites actuelles

- La progression par média dépend du format exact des logs `yt-dlp` et reste volontairement robuste plutôt que sur-optimisée.
- Le projet n’a pas pu être exécuté dans cet environnement car `cargo`, `rustc` et `yt-dlp` ne sont pas installés sur la machine au moment de l’implémentation.

## Message légal

Télécharge uniquement les contenus que tu as le droit de télécharger.
