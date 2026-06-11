const TEMPLATE_OPTIONS = [
  {
    label: "Numéro + titre",
    description: "Exemple : 001 - Ma vidéo.mp3",
    value: "%(playlist_index)03d - %(title)s.%(ext)s",
  },
  {
    label: "Titre seul",
    description: "Exemple : Ma vidéo.mp3",
    value: "%(title)s.%(ext)s",
  },
  {
    label: "Auteur + titre",
    description: "Exemple : Mon artiste - Ma vidéo.mp3",
    value: "%(uploader)s - %(title)s.%(ext)s",
  },
  {
    label: "Date + titre",
    description: "Exemple : 20240115 - Ma vidéo.mp3",
    value: "%(upload_date)s - %(title)s.%(ext)s",
  },
] as const;

interface DownloadOptionsProps {
  audioQuality: string;
  outputTemplate: string;
  onAudioQualityChange: (value: string) => void;
  onOutputTemplateChange: (value: string) => void;
}

export function DownloadOptions({
  audioQuality,
  outputTemplate,
  onAudioQualityChange,
  onOutputTemplateChange,
}: DownloadOptionsProps) {
  const selectedTemplate =
    TEMPLATE_OPTIONS.find((option) => option.value === outputTemplate)?.value ??
    "custom";

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Options</h2>
      </div>

      <div className="field-grid">
        <label>
          <span>Qualité audio</span>
          <select
            value={audioQuality}
            onChange={(event) => onAudioQualityChange(event.target.value)}
          >
            <option value="0">Qualité maximale</option>
          </select>
        </label>
      </div>

      <div className="template-selector">
        <div className="template-selector-header">
          <span>Nom des fichiers</span>
          <small>
            Choisis la façon dont Alice nomme les fichiers téléchargés.
          </small>
        </div>
        <div className="template-option-grid">
          {TEMPLATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                selectedTemplate === option.value
                  ? "template-option-card active"
                  : "template-option-card"
              }
              onClick={() => onOutputTemplateChange(option.value)}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        {selectedTemplate === "custom" ? (
          <div className="template-custom-note">
            Mode personnalisé actif : le modèle actuel sera conservé.
          </div>
        ) : null}
      </div>
    </section>
  );
}
