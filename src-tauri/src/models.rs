use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyStatus {
    pub yt_dlp: bool,
    pub ffmpeg: bool,
    pub yt_dlp_path: Option<String>,
    pub ffmpeg_path: Option<String>,
    pub issues: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaItem {
    pub id: String,
    pub title: String,
    pub url: String,
    pub playlist_index: u32,
    pub duration: Option<f64>,
    pub uploader: Option<String>,
    pub selected: bool,
    pub status: String,
    pub progress: f64,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadOptions {
    pub mode: String,
    pub audio_format: Option<String>,
    pub video_format: Option<String>,
    pub video_quality: Option<String>,
    pub output_dir: String,
    pub audio_quality: String,
    pub embed_thumbnail: bool,
    pub add_metadata: bool,
    pub output_template: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadRequest {
    pub url: String,
    pub items: Option<Vec<MediaItem>>,
    pub options: DownloadOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryEntry {
    pub id: String,
    pub source_url: String,
    pub mode: String,
    pub format: String,
    pub output_dir: String,
    pub downloaded_count: usize,
    pub created_at: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct LogEvent {
    pub level: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgressEvent {
    pub item_id: Option<String>,
    pub item_index: Option<u32>,
    pub item_progress: Option<f64>,
    pub total_progress: f64,
    pub status: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct LocalMediaEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size_bytes: Option<u64>,
    pub modified_at: Option<String>,
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedFolder {
    pub id: String,
    pub path: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub sidebar_open: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self { sidebar_open: true }
    }
}
