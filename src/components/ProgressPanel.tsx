interface ProgressPanelProps {
  totalProgress: number;
  statusText: string;
}

export function ProgressPanel({ totalProgress, statusText }: ProgressPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Progression</h2>
      </div>
      <div className="progress-shell">
        <div className="progress-fill" style={{ width: `${totalProgress}%` }} />
      </div>
      <div className="progress-meta">
        <span>{Math.round(totalProgress)}%</span>
        <span>{statusText}</span>
      </div>
    </section>
  );
}
