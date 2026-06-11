import { formatDate } from "../lib/format";
import type { HistoryEntry } from "../lib/types";

function formatHistoryStatus(status: HistoryEntry["status"]) {
  switch (status) {
    case "success":
      return "succès";
    case "cancelled":
      return "annulé";
    case "error":
      return "erreur";
    default:
      return status;
  }
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  onClear: () => void;
}

export function HistoryPanel({ history, onClear }: HistoryPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Historique</h2>
        <button onClick={onClear} disabled={history.length === 0}>
          Vider
        </button>
      </div>

      {history.length === 0 ? (
        <p className="empty-state">Aucun téléchargement enregistré.</p>
      ) : (
        <div className="history-list">
          {history.map((entry) => (
            <article key={entry.id} className="history-card">
              <div className="history-topline">
                <strong>{entry.format.toUpperCase()}</strong>
                <span className={`status-chip ${entry.status}`}>
                  {formatHistoryStatus(entry.status)}
                </span>
              </div>
              <p>{entry.source_url}</p>
              <p>{entry.output_dir}</p>
              <small>
                {formatDate(entry.created_at)} · {entry.downloaded_count} élément(s)
              </small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
