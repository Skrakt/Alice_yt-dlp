#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use alice_lib::{AnalysisState, DownloadState, commands};
use std::sync::{
    Arc, Mutex,
    atomic::AtomicBool,
};

fn main() {
    tauri::Builder::default()
        .manage(DownloadState {
            cancel_flag: Arc::new(AtomicBool::new(false)),
        })
        .manage(AnalysisState {
            cancel_flag: Arc::new(AtomicBool::new(false)),
            child: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            commands::check_dependencies,
            commands::ensure_dependencies,
            commands::analyze_url,
            commands::cancel_analysis,
            commands::choose_output_directory,
            commands::list_directory,
            commands::start_download,
            commands::cancel_download,
            commands::get_history,
            commands::clear_history,
            commands::get_saved_folders,
            commands::save_saved_folders
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
