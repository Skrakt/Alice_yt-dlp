pub mod commands;
pub mod folders;
pub mod history;
pub mod models;
pub mod ytdlp;

use std::sync::{atomic::AtomicBool, Arc};
use std::{process::Child, sync::Mutex};

pub struct DownloadState {
    pub cancel_flag: Arc<AtomicBool>,
}

pub struct AnalysisState {
    pub cancel_flag: Arc<AtomicBool>,
    pub child: Arc<Mutex<Option<Child>>>,
}
