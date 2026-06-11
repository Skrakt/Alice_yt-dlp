import { formatBytes, formatUnixTimestamp } from "../lib/format";
import type { LocalMediaEntry } from "../lib/types";

interface LocalMediaBrowserProps {
  currentPath: string;
  entries: LocalMediaEntry[];
  loading: boolean;
  error: string | null;
  canGoUp: boolean;
  onOpenEntry: (entry: LocalMediaEntry) => void;
  onGoUp: () => void;
}

export function LocalMediaBrowser({
  currentPath,
  entries,
  loading,
  error,
  canGoUp,
  onOpenEntry,
  onGoUp,
}: LocalMediaBrowserProps) {
  return (
    <section className="panel library-browser">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Alice</p>
          <h2>Explorateur local</h2>
        </div>
        <button onClick={onGoUp} disabled={!canGoUp}>
          Dossier parent
        </button>
      </div>

      {loading ? <p className="empty-state">Chargement du dossier...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {!loading && !error && entries.length === 0 ? (
        <p className="empty-state">Ce dossier est vide.</p>
      ) : null}

      {!loading && !error && entries.length > 0 ? (
        <div className="local-entry-list">
          {entries.map((entry) => (
            <button
              key={entry.path}
              className="local-entry-card"
              onClick={() => onOpenEntry(entry)}
            >
              <div className="local-entry-topline">
                <strong className="truncate-line">{entry.name}</strong>
                <span className={entry.is_dir ? "status-chip downloading" : "status-chip"}>
                  {entry.is_dir ? "dossier" : entry.extension || "fichier"}
                </span>
              </div>
              <div className="media-meta">
                <span>{entry.is_dir ? "Ouvrir" : formatBytes(entry.size_bytes)}</span>
                <span>{formatUnixTimestamp(entry.modified_at)}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
