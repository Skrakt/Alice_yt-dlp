interface DownloadControlsProps {
  selectedCount: number;
  canDownload: boolean;
  isDownloading: boolean;
  onDownload: () => void;
  onCancel: () => void;
}

export function DownloadControls({
  selectedCount,
  canDownload,
  isDownloading,
  onDownload,
  onCancel,
}: DownloadControlsProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Exécution</h2>
      </div>

      <div className="controls-row">
        <div>
          <strong>{selectedCount}</strong> média(s) sélectionné(s)
        </div>
        <div className="controls-actions">
          <button onClick={onCancel} disabled={!isDownloading}>
            Annuler
          </button>
          <button onClick={onDownload} disabled={!canDownload || isDownloading}>
            {isDownloading ? "Téléchargement..." : "Télécharger"}
          </button>
        </div>
      </div>
    </section>
  );
}
