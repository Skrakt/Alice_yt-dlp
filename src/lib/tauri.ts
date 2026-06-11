import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AppSettings,
  DependencyStatus,
  DownloadRequest,
  DownloadProgressEvent,
  HistoryEntry,
  LogEvent,
  MediaItem,
  SavedFolder,
} from "./types";

export function checkDependencies(): Promise<DependencyStatus> {
  return invoke("check_dependencies");
}

export function ensureDependencies(): Promise<DependencyStatus> {
  return invoke("ensure_dependencies");
}

export function analyzeUrl(url: string): Promise<MediaItem[]> {
  return invoke("analyze_url", { url });
}

export function cancelAnalysis(): Promise<void> {
  return invoke("cancel_analysis");
}

export function chooseOutputDirectory(): Promise<string | null> {
  return invoke("choose_output_directory");
}

export function listDirectory(path: string): Promise<import("./types").LocalMediaEntry[]> {
  return invoke("list_directory", { path });
}

export function startDownload(request: DownloadRequest): Promise<void> {
  return invoke("start_download", { request });
}

export function cancelDownload(): Promise<void> {
  return invoke("cancel_download");
}

export function getHistory(): Promise<HistoryEntry[]> {
  return invoke("get_history");
}

export function clearHistory(): Promise<void> {
  return invoke("clear_history");
}

export function getSavedFolders(): Promise<SavedFolder[]> {
  return invoke("get_saved_folders");
}

export function saveSavedFolders(folders: SavedFolder[]): Promise<void> {
  return invoke("save_saved_folders", { folders });
}

export function getSettings(): Promise<AppSettings> {
  return invoke("get_settings");
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function onProgress(
  callback: (event: DownloadProgressEvent) => void,
): Promise<UnlistenFn> {
  return listen<DownloadProgressEvent>("download-progress", ({ payload }) =>
    callback(payload),
  );
}

export async function onLog(
  callback: (event: LogEvent) => void,
): Promise<UnlistenFn> {
  return listen<LogEvent>("download-log", ({ payload }) => callback(payload));
}
