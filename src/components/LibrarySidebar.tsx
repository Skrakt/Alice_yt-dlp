import { formatDate } from "../lib/format";
import type { HistoryEntry, SavedFolder } from "../lib/types";

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

interface LibrarySidebarProps {
  savedFolders: SavedFolder[];
  history: HistoryEntry[];
  activePath: string;
  isLibraryView: boolean;
  isOpen: boolean;
  onBackToDownload: () => void;
  onAddFolder: () => void;
  onOpenFolder: (path: string) => void;
  onClearHistory: () => void;
  onToggle: () => void;
}

export function LibrarySidebar({
  savedFolders,
  history,
  activePath,
  isLibraryView,
  isOpen,
  onBackToDownload,
  onAddFolder,
  onOpenFolder,
  onClearHistory,
  onToggle,
}: LibrarySidebarProps) {
  const compactFavorites = savedFolders.slice(0, 8);

  return (
    <aside className={isOpen ? "library-sidebar panel" : "library-sidebar panel collapsed"}>
      <div className="sidebar-topbar">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={isOpen ? "Replier la barre latérale" : "Déplier la barre latérale"}
          title={isOpen ? "Replier" : "Déplier"}
        >
          {isOpen ? "<" : ">"}
        </button>
      </div>

      <button
        className={!isLibraryView ? "sidebar-action active" : "sidebar-action"}
        onClick={onBackToDownload}
        title="Accueil"
      >
        <span className="sidebar-action-icon">A</span>
        {isOpen ? <span className="truncate-line">Accueil</span> : null}
      </button>

      {isOpen ? (
        <>
          <div className="sidebar-header">
            <div>
              <p className="eyebrow">Bibliothèque locale</p>
              <h2>Dossiers favoris</h2>
            </div>
            <button onClick={onAddFolder}>Ajouter</button>
          </div>

          {savedFolders.length === 0 ? (
            <p className="empty-state">
              Ajoute un dossier pour naviguer dans tes médias locaux depuis Alice.
            </p>
          ) : (
            <div className="sidebar-folder-list">
              {savedFolders.map((folder) => (
                <button
                  key={folder.id}
                  className={
                    activePath === folder.path
                      ? "sidebar-folder active"
                      : "sidebar-folder"
                  }
                  onClick={() => onOpenFolder(folder.path)}
                >
                  <strong className="truncate-line">{folder.name}</strong>
                </button>
              ))}
            </div>
          )}

          <section className="sidebar-history-section">
            <div className="panel-header">
              <h2>Historique</h2>
              <button onClick={onClearHistory} disabled={history.length === 0}>
                Vider
              </button>
            </div>

            {history.length === 0 ? (
              <p className="empty-state">Aucun téléchargement enregistré.</p>
            ) : (
              <div className="sidebar-history-list">
                {history.slice(0, 8).map((entry) => (
                  <article key={entry.id} className="history-card sidebar-history-card">
                    <div className="history-topline">
                      <strong className="truncate-line">
                        {entry.format.toUpperCase()}
                      </strong>
                      <span className={`status-chip ${entry.status}`}>
                        {formatHistoryStatus(entry.status)}
                      </span>
                    </div>
                    <p className="truncate-line">{entry.source_url}</p>
                    <small className="truncate-line">
                      {formatDate(entry.created_at)} · {entry.downloaded_count} élément(s)
                    </small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="sidebar-compact-actions">
          <button
            type="button"
            className="sidebar-compact-button"
            onClick={onAddFolder}
            title="Ajouter un dossier favori"
          >
            +
          </button>
          {compactFavorites.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={
                activePath === folder.path
                  ? "sidebar-compact-button active"
                  : "sidebar-compact-button"
              }
              onClick={() => onOpenFolder(folder.path)}
              title={folder.name}
            >
              {folder.name.trim().charAt(0).toUpperCase() || "F"}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
