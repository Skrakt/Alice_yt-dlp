use crate::models::SavedFolder;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const SAVED_FOLDERS_FILE: &str = "saved-folders.json";

fn saved_folders_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Impossible de résoudre le dossier d'application: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Impossible de créer le dossier d'application: {error}"))?;

    Ok(dir.join(SAVED_FOLDERS_FILE))
}

pub fn load_saved_folders(app: &AppHandle) -> Result<Vec<SavedFolder>, String> {
    let path = saved_folders_path(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path)
        .map_err(|error| format!("Lecture des dossiers favoris impossible: {error}"))?;

    serde_json::from_str(&content)
        .map_err(|error| format!("Dossiers favoris invalides, impossible à parser: {error}"))
}

pub fn save_saved_folders(app: &AppHandle, entries: &[SavedFolder]) -> Result<(), String> {
    let path = saved_folders_path(app)?;
    let content = serde_json::to_string_pretty(entries)
        .map_err(|error| format!("Sérialisation des dossiers favoris impossible: {error}"))?;

    fs::write(path, content)
        .map_err(|error| format!("Écriture des dossiers favoris impossible: {error}"))
}
