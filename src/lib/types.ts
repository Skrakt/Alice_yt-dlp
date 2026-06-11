export type DownloadMode = "audio" | "video";
export type AudioFormat = "mp3" | "m4a" | "flac" | "opus" | "wav";
export type VideoFormat = "mp4" | "mkv" | "webm";
export type VideoQuality = "best" | "1080p" | "720p";
export type MediaStatus =
  | "pending"
  | "downloading"
  | "done"
  | "error"
  | "skipped";

export interface MediaItem {
  id: string;
  title: string;
  url: string;
  playlist_index: number;
  duration?: number | null;
  uploader?: string | null;
  selected: boolean;
  status: MediaStatus;
  progress: number;
  error?: string | null;
}

export interface DownloadOptions {
  mode: DownloadMode;
  audio_format?: AudioFormat | null;
  video_format?: VideoFormat | null;
  video_quality?: VideoQuality | null;
  output_dir: string;
  audio_quality: string;
  embed_thumbnail: boolean;
  add_metadata: boolean;
  output_template: string;
}

export interface DownloadRequest {
  url: string;
  items?: MediaItem[] | null;
  options: DownloadOptions;
}

export interface HistoryEntry {
  id: string;
  source_url: string;
  mode: DownloadMode;
  format: string;
  output_dir: string;
  downloaded_count: number;
  created_at: string;
  status: "success" | "cancelled" | "error";
}

export interface DependencyStatus {
  yt_dlp: boolean;
  ffmpeg: boolean;
  yt_dlp_path?: string | null;
  ffmpeg_path?: string | null;
  issues: string[];
}

export interface DownloadProgressEvent {
  item_id?: string | null;
  item_index?: number | null;
  item_progress?: number | null;
  total_progress: number;
  status: MediaStatus;
  message: string;
}

export interface LogEvent {
  level: "info" | "error";
  message: string;
}

export interface LocalMediaEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes?: number | null;
  modified_at?: string | null;
  extension?: string | null;
}

export interface SavedFolder {
  id: string;
  path: string;
  name: string;
}
