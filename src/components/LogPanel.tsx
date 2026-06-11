interface LogPanelProps {
  logs: string[];
}

export function LogPanel({ logs }: LogPanelProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Journaux</h2>
      </div>
      <div className="log-panel">
        {logs.length === 0 ? (
          <p className="empty-state">Les journaux apparaîtront ici.</p>
        ) : (
          logs.map((line, index) => (
            <pre key={`${index}-${line.slice(0, 12)}`}>{line}</pre>
          ))
        )}
      </div>
    </section>
  );
}
