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
        <h1>Télécharge. Explore. Organise.</h1>
        <p className="hero-copy">
          Colle une URL de Playlist ou Vidéo YouTube, analyse son contenu, puis
          télécharge en audio ou vidéo avec simplicité.
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
        Alice n'attend que toi pour commencer ton voyage.
      </p>
    </section>
  );
}
