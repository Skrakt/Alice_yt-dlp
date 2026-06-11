export function formatDuration(seconds?: number | null): string {
  if (!seconds && seconds !== 0) {
    return "N/A";
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatUnixTimestamp(value?: string | null): string {
  if (!value) {
    return "Date inconnue";
  }

  return formatDate(new Date(Number(value) * 1000).toISOString());
}

export function formatBytes(value?: number | null): string {
  if (!value && value !== 0) {
    return "-";
  }

  const units = ["o", "Ko", "Mo", "Go", "To"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
