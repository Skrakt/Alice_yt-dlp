use crate::models::HistoryEntry;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const HISTORY_FILE: &str = "history.json";

fn history_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Impossible de résoudre le dossier d'application: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Impossible de créer le dossier d'application: {error}"))?;

    Ok(dir.join(HISTORY_FILE))
}

pub fn load_history(app: &AppHandle) -> Result<Vec<HistoryEntry>, String> {
    let path = history_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content =
        fs::read_to_string(path).map_err(|error| format!("Lecture historique impossible: {error}"))?;

    serde_json::from_str(&content)
        .map_err(|error| format!("Historique invalide, impossible à parser: {error}"))
}

pub fn save_history(app: &AppHandle, entries: &[HistoryEntry]) -> Result<(), String> {
    let path = history_path(app)?;
    let content = serde_json::to_string_pretty(entries)
        .map_err(|error| format!("Sérialisation historique impossible: {error}"))?;
    fs::write(path, content).map_err(|error| format!("Écriture historique impossible: {error}"))
}

pub fn append_history(app: &AppHandle, entry: HistoryEntry) -> Result<(), String> {
    let mut current = load_history(app)?;
    current.insert(0, entry);
    save_history(app, &current)
}

pub fn clear_history(app: &AppHandle) -> Result<(), String> {
    save_history(app, &[])
}
