use crate::{
    folders,
    history,
    models::{AppSettings, DownloadRequest, HistoryEntry, LocalMediaEntry, SavedFolder},
    settings,
    ytdlp,
    AnalysisState, DownloadState,
};
use chrono::Utc;
use std::{
    fs,
    sync::atomic::Ordering,
    time::SystemTime,
};
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

#[tauri::command]
pub fn check_dependencies() -> crate::models::DependencyStatus {
    ytdlp::check_dependencies()
}

#[tauri::command]
pub fn ensure_dependencies() -> crate::models::DependencyStatus {
    ytdlp::ensure_dependencies()
}

#[tauri::command]
pub fn analyze_url(
    app: AppHandle,
    state: State<'_, AnalysisState>,
    url: String,
) -> Result<Vec<crate::models::MediaItem>, String> {
    ytdlp::analyze_url(&app, &state, &url)
}

#[tauri::command]
pub fn cancel_analysis(state: State<'_, AnalysisState>) -> Result<(), String> {
    state.cancel_flag.store(true, Ordering::SeqCst);

    if let Some(child) = state
        .child
        .lock()
        .map_err(|_| "Impossible de verrouiller l'analyse en cours.".to_string())?
        .as_mut()
    {
        child
            .kill()
            .map_err(|error| format!("Impossible d'annuler l'analyse: {error}"))?;
    }

    Ok(())
}

#[tauri::command]
pub fn choose_output_directory() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|path| path.display().to_string())
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<LocalMediaEntry>, String> {
    let directory = fs::read_dir(&path)
        .map_err(|error| format!("Impossible de lire le dossier '{path}': {error}"))?;

    let mut entries = directory
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let path_buf = entry.path();
            let metadata = entry.metadata().ok()?;
            let modified_at = metadata
                .modified()
                .ok()
                .and_then(|value| value.duration_since(SystemTime::UNIX_EPOCH).ok())
                .map(|duration| duration.as_secs().to_string());

            Some(LocalMediaEntry {
                name: entry.file_name().to_string_lossy().to_string(),
                path: path_buf.display().to_string(),
                is_dir: metadata.is_dir(),
                size_bytes: if metadata.is_file() {
                    Some(metadata.len())
                } else {
                    None
                },
                modified_at,
                extension: path_buf
                    .extension()
                    .map(|value| value.to_string_lossy().to_string()),
            })
        })
        .collect::<Vec<_>>();

    entries.sort_by(|left, right| match (left.is_dir, right.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => left.name.to_lowercase().cmp(&right.name.to_lowercase()),
    });

    Ok(entries)
}

#[tauri::command]
pub fn start_download(
    app: AppHandle,
    state: State<'_, DownloadState>,
    request: DownloadRequest,
) -> Result<(), String> {
    if request.options.output_dir.trim().is_empty() {
        return Err("Le dossier de sortie est obligatoire.".to_string());
    }

    let selected_items: Vec<_> = request
        .items
        .unwrap_or_default()
        .into_iter()
        .filter(|item| item.selected)
        .collect();

    let (yt_dlp, args) =
        ytdlp::build_download_command(&request.url, &selected_items, &request.options)?;

    state.cancel_flag.store(false, Ordering::SeqCst);

    let app_handle = app.clone();
    let cancel_flag = state.cancel_flag.clone();
    let output_dir = request.options.output_dir.clone();
    let mode = request.options.mode.clone();
    let format = request
        .options
        .audio_format
        .clone()
        .or(request.options.video_format.clone())
        .unwrap_or_else(|| "mp4".to_string());
    let source_url = request.url.clone();
    let selected_count = selected_items.len();

    tauri::async_runtime::spawn(async move {
        let status = ytdlp::spawn_download_process(
            app_handle.clone(),
            yt_dlp,
            args,
            selected_items,
            cancel_flag,
        )
        .unwrap_or_else(|error| {
            let _ = app_handle.emit(
                "download-log",
                crate::models::LogEvent {
                    level: "error".to_string(),
                    message: error.clone(),
                },
            );
            "error".to_string()
        });

        let entry = HistoryEntry {
            id: Uuid::new_v4().to_string(),
            source_url,
            mode,
            format,
            output_dir,
            downloaded_count: selected_count,
            created_at: Utc::now().to_rfc3339(),
            status,
        };

        let _ = history::append_history(&app_handle, entry);
    });

    Ok(())
}

#[tauri::command]
pub fn cancel_download(state: State<'_, DownloadState>) {
    state.cancel_flag.store(true, Ordering::SeqCst);
}

#[tauri::command]
pub fn get_history(app: AppHandle) -> Result<Vec<HistoryEntry>, String> {
    history::load_history(&app)
}

#[tauri::command]
pub fn clear_history(app: AppHandle) -> Result<(), String> {
    history::clear_history(&app)
}

#[tauri::command]
pub fn get_saved_folders(app: AppHandle) -> Result<Vec<SavedFolder>, String> {
    folders::load_saved_folders(&app)
}

#[tauri::command]
pub fn save_saved_folders(app: AppHandle, folders: Vec<SavedFolder>) -> Result<(), String> {
    folders::save_saved_folders(&app, &folders)
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<AppSettings, String> {
    settings::load_settings(&app)
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    settings::save_settings(&app, &settings)
}
