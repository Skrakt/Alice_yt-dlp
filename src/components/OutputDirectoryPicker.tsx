interface OutputDirectoryPickerProps {
  outputDir: string;
  onChoose: () => void;
  onChange: (value: string) => void;
}

export function OutputDirectoryPicker({
  outputDir,
  onChoose,
  onChange,
}: OutputDirectoryPickerProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Dossier de sortie</h2>
      </div>

      <div className="output-row">
        <input
          className="output-dir-input"
          value={outputDir}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Chemin du dossier de téléchargement"
        />
        <button onClick={onChoose}>Choisir un dossier</button>
      </div>
    </section>
  );
}
