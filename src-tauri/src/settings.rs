use crate::models::AppSettings;
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "settings.json";

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Impossible de résoudre le dossier d'application: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Impossible de créer le dossier d'application: {error}"))?;

    Ok(dir.join(SETTINGS_FILE))
}

pub fn load_settings(app: &AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let content = fs::read_to_string(path)
        .map_err(|error| format!("Lecture des paramètres impossible: {error}"))?;

    serde_json::from_str(&content)
        .map_err(|error| format!("Paramètres invalides, impossible à parser: {error}"))
}

pub fn save_settings(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let content = serde_json::to_string_pretty(settings)
        .map_err(|error| format!("Sérialisation des paramètres impossible: {error}"))?;

    fs::write(path, content)
        .map_err(|error| format!("Écriture des paramètres impossible: {error}"))
}
