interface UrlInputProps {
  url: string;
  loading: boolean;
  canClear: boolean;
  onUrlChange: (value: string) => void;
  onAnalyze: () => void;
  onCancelAnalyze: () => void;
  onClearList: () => void;
}

export function UrlInput({
  url,
  loading,
  canClear,
  onUrlChange,
  onAnalyze,
  onCancelAnalyze,
  onClearList,
}: UrlInputProps) {
  return (
    <section className="panel hero-panel">
      <div>
        <p className="eyebrow">Alice</p>
        <h1>Download. Browse. Organize.</h1>
        <p className="hero-copy">
          Colle une URL YouTube, analyse son contenu, puis télécharge en audio
          ou vidéo sans ligne de commande.
        </p>
      </div>

      <div className="url-input-row">
        <input
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <button onClick={onAnalyze} disabled={loading || !url.trim()}>
          {loading ? "Analyse..." : "Analyser"}
        </button>
      </div>

      <div className="hero-actions">
        <button onClick={onCancelAnalyze} disabled={!loading}>
          Annuler l'analyse
        </button>
        <button onClick={onClearList} disabled={!canClear && !url.trim()}>
          Nettoyer la liste
        </button>
      </div>

      <p className="legal-note">
        Télécharge uniquement les contenus que tu as le droit de télécharger.
      </p>
    </section>
  );
}
