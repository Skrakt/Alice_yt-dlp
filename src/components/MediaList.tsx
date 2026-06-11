import { cn, formatDuration } from "../lib/format";
import type { MediaItem } from "../lib/types";

function formatMediaStatus(status: MediaItem["status"]) {
  switch (status) {
    case "pending":
      return "en attente";
    case "downloading":
      return "téléchargement";
    case "done":
      return "terminé";
    case "error":
      return "erreur";
    case "skipped":
      return "ignoré";
    default:
      return status;
  }
}

interface MediaListProps {
  items: MediaItem[];
  onToggle: (id: string) => void;
  onToggleAll: (selected: boolean) => void;
}

export function MediaList({ items, onToggle, onToggleAll }: MediaListProps) {
  const allSelected = items.length > 0 && items.every((item) => item.selected);

  return (
    <section className="panel media-panel">
      <div className="panel-header">
        <h2>Médias détectés</h2>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => onToggleAll(event.target.checked)}
          />
          <span>Tout sélectionner</span>
        </label>
      </div>

      {items.length === 0 ? (
        <p className="empty-state">
          Lance une analyse pour afficher les vidéos, playlists ou chaînes
          détectées.
        </p>
      ) : (
        <div className="media-list">
          {items.map((item) => (
            <article key={item.id} className="media-card">
              <div className="media-main">
                <label className="checkbox media-checkbox">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => onToggle(item.id)}
                  />
                </label>
                <div className="media-content">
                  <div className="media-header">
                    <strong>
                      {String(item.playlist_index).padStart(3, "0")} · {item.title}
                    </strong>
                    <span className={cn("status-chip", item.status)}>
                      {formatMediaStatus(item.status)}
                    </span>
                  </div>
                  <p>{item.uploader || "Auteur inconnu"}</p>
                  <p className="media-url">{item.url}</p>
                  <div className="media-meta">
                    <span>{formatDuration(item.duration)}</span>
                    <span>{Math.round(item.progress)}%</span>
                  </div>
                  {item.error ? <p className="error-text">{item.error}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
