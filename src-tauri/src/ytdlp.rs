use crate::{
    AnalysisState,
    models::{DependencyStatus, DownloadOptions, DownloadProgressEvent, LogEvent, MediaItem},
};
use serde_json::Value;
use std::{
    path::Path,
    process::{Command, Stdio},
    sync::atomic::Ordering,
};
use tauri::{AppHandle, Emitter};

pub fn resolve_binary(name: &str) -> Option<String> {
    let paths = std::env::var_os("PATH")?;

    for directory in std::env::split_paths(&paths) {
        let candidate = directory.join(name);
        if is_executable(&candidate) {
            return Some(candidate.to_string_lossy().to_string());
        }
    }

    None
}

fn is_executable(path: &Path) -> bool {
    path.is_file()
}

pub fn check_dependencies() -> DependencyStatus {
    let yt_dlp_path = resolve_binary("yt-dlp");
    let ffmpeg_path = resolve_binary("ffmpeg");
    let mut issues = Vec::new();

    if yt_dlp_path.is_none() {
        issues.push("yt-dlp est introuvable dans le PATH.".to_string());
    }

    if ffmpeg_path.is_none() {
        issues.push("FFmpeg est introuvable dans le PATH.".to_string());
    }

    DependencyStatus {
        yt_dlp: yt_dlp_path.is_some(),
        ffmpeg: ffmpeg_path.is_some(),
        yt_dlp_path,
        ffmpeg_path,
        issues,
    }
}

pub fn ensure_dependencies() -> DependencyStatus {
    let mut status = check_dependencies();

    if status.yt_dlp && status.ffmpeg {
        return status;
    }

    let Some(brew) = resolve_binary("brew") else {
        status
            .issues
            .push("Homebrew est requis pour installer automatiquement les dépendances.".to_string());
        return status;
    };

    let mut packages = Vec::new();
    if !status.yt_dlp {
        packages.push("yt-dlp");
    }
    if !status.ffmpeg {
        packages.push("ffmpeg");
    }

    let output = Command::new(&brew).args(["install"]).args(&packages).output();

    match output {
        Ok(result) if result.status.success() => check_dependencies(),
        Ok(result) => {
            let mut refreshed = check_dependencies();
            let stderr = String::from_utf8_lossy(&result.stderr).trim().to_string();
            refreshed.issues.push(if stderr.is_empty() {
                format!(
                    "Installation automatique échouée pour: {}.",
                    packages.join(", ")
                )
            } else {
                format!("Installation automatique échouée: {stderr}")
            });
            refreshed
        }
        Err(error) => {
            let mut refreshed = check_dependencies();
            refreshed
                .issues
                .push(format!("Impossible de lancer Homebrew: {error}"));
            refreshed
        }
    }
}

pub fn analyze_url(
    app: &AppHandle,
    state: &AnalysisState,
    url: &str,
) -> Result<Vec<MediaItem>, String> {
    let yt_dlp = resolve_binary("yt-dlp")
        .ok_or_else(|| "yt-dlp est requis pour analyser une URL.".to_string())?;

    state.cancel_flag.store(false, Ordering::SeqCst);

    let mut child = Command::new(yt_dlp)
        .arg("--flat-playlist")
        .arg("--dump-json")
        .arg(url)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Échec du lancement de yt-dlp: {error}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Impossible de capturer la sortie d'analyse.".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Impossible de capturer les erreurs d'analyse.".to_string())?;

    let (tx, rx) = std::sync::mpsc::channel::<(String, String)>();
    let tx_stdout = tx.clone();
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stdout);
        for line in std::io::BufRead::lines(reader).map_while(Result::ok) {
            let _ = tx_stdout.send(("stdout".to_string(), line));
        }
    });
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stderr);
        for line in std::io::BufRead::lines(reader).map_while(Result::ok) {
            let _ = tx.send(("stderr".to_string(), line));
        }
    });

    {
        let mut guard = state
            .child
            .lock()
            .map_err(|_| "Impossible d'enregistrer l'analyse en cours.".to_string())?;
        *guard = Some(child);
    }

    let mut stdout_lines = Vec::new();
    let mut stderr_lines = Vec::new();
    let mut exit_success = true;

    loop {
        if state.cancel_flag.load(Ordering::SeqCst) {
            if let Ok(mut guard) = state.child.lock() {
                if let Some(child) = guard.as_mut() {
                    let _ = child.kill();
                }
            }
        }

        match rx.recv_timeout(std::time::Duration::from_millis(100)) {
            Ok((stream, line)) => {
                if stream == "stdout" {
                    stdout_lines.push(line);
                } else {
                    stderr_lines.push(line.clone());
                    let _ = app.emit(
                        "download-log",
                        LogEvent {
                            level: "error".to_string(),
                            message: line,
                        },
                    );
                }
            }
            Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {}
            Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => {}
        }

        let completed = {
            let mut guard = state
                .child
                .lock()
                .map_err(|_| "Impossible de surveiller l'analyse.".to_string())?;

            match guard.as_mut() {
                Some(child) => match child.try_wait() {
                    Ok(Some(status)) => {
                        exit_success = status.success();
                        *guard = None;
                        true
                    }
                    Ok(None) => false,
                    Err(error) => {
                        *guard = None;
                        return Err(format!("Impossible de surveiller yt-dlp: {error}"));
                    }
                },
                None => true,
            }
        };

        if completed {
            break;
        }
    }

    if state.cancel_flag.load(Ordering::SeqCst) {
        state.cancel_flag.store(false, Ordering::SeqCst);
        let _ = app.emit(
            "download-log",
            LogEvent {
                level: "info".to_string(),
                message: "Analyse annulée.".to_string(),
            },
        );
        return Err("Analyse annulée.".to_string());
    }

    if !exit_success {
        return Err(format!(
            "Analyse yt-dlp échouée: {}",
            stderr_lines.join("\n")
        ));
    }

    let mut items = Vec::new();

    for (position, line) in stdout_lines.iter().enumerate() {
        let parsed: Value = match serde_json::from_str(line) {
            Ok(value) => value,
            Err(_) => continue,
        };

        if let Some(entries) = parsed.get("entries").and_then(Value::as_array) {
            for (entry_index, entry) in entries.iter().enumerate() {
                if let Some(media) = value_to_media_item(entry, entry_index + 1) {
                    items.push(media);
                }
            }
        } else if let Some(media) = value_to_media_item(&parsed, position + 1) {
            items.push(media);
        }
    }

    if items.is_empty() {
        return Err("Aucun média exploitable n'a été détecté.".to_string());
    }

    Ok(items)
}

fn value_to_media_item(value: &Value, fallback_index: usize) -> Option<MediaItem> {
    let title = value.get("title")?.as_str()?.to_string();
    let playlist_index = value
        .get("playlist_index")
        .and_then(Value::as_u64)
        .unwrap_or(fallback_index as u64) as u32;
    let raw_url = value
        .get("webpage_url")
        .and_then(Value::as_str)
        .or_else(|| value.get("url").and_then(Value::as_str))
        .unwrap_or_default();
    let id = value
        .get("id")
        .and_then(Value::as_str)
        .unwrap_or(raw_url)
        .to_string();

    Some(MediaItem {
        id: id.clone(),
        title,
        url: normalize_media_url(&id, raw_url),
        playlist_index,
        duration: value.get("duration").and_then(Value::as_f64),
        uploader: value
            .get("uploader")
            .and_then(Value::as_str)
            .or_else(|| value.get("channel").and_then(Value::as_str))
            .map(ToString::to_string),
        selected: true,
        status: "pending".to_string(),
        progress: 0.0,
        error: None,
    })
}

fn normalize_media_url(id: &str, raw_url: &str) -> String {
    if raw_url.starts_with("http://") || raw_url.starts_with("https://") {
        raw_url.to_string()
    } else if !id.is_empty() {
        format!("https://www.youtube.com/watch?v={id}")
    } else {
        raw_url.to_string()
    }
}

pub fn build_download_command(
    request_url: &str,
    selected_items: &[MediaItem],
    options: &DownloadOptions,
) -> Result<(String, Vec<String>), String> {
    let yt_dlp = resolve_binary("yt-dlp")
        .ok_or_else(|| "yt-dlp est requis pour lancer un téléchargement.".to_string())?;

    let mut args = Vec::new();
    args.push("--newline".to_string());
    args.push("-P".to_string());
    args.push(options.output_dir.clone());
    args.push("-o".to_string());
    args.push(options.output_template.clone());

    match options.mode.as_str() {
        "audio" => {
            let format = options
                .audio_format
                .clone()
                .unwrap_or_else(|| "mp3".to_string());
            args.push("-x".to_string());
            args.push("--audio-format".to_string());
            args.push(format);
            args.push("--audio-quality".to_string());
            args.push(options.audio_quality.clone());
            if options.embed_thumbnail {
                args.push("--embed-thumbnail".to_string());
            }
            if options.add_metadata {
                args.push("--add-metadata".to_string());
            }
        }
        "video" => {
            let video_format = options
                .video_format
                .clone()
                .unwrap_or_else(|| "mp4".to_string());
            args.push("-f".to_string());
            args.push(match options.video_quality.as_deref().unwrap_or("best") {
                "1080p" => "bv*[height<=1080]+ba/b[height<=1080]".to_string(),
                "720p" => "bv*[height<=720]+ba/b[height<=720]".to_string(),
                _ => "bv*+ba/b".to_string(),
            });
            args.push("--merge-output-format".to_string());
            args.push(video_format);
        }
        _ => return Err("Mode de téléchargement inconnu.".to_string()),
    }

    let indexes: Vec<String> = selected_items
        .iter()
        .map(|item| item.playlist_index.to_string())
        .collect();

    if selected_items.len() > 1 {
        args.push("--playlist-items".to_string());
        args.push(indexes.join(","));
        args.push(request_url.to_string());
    } else if let Some(item) = selected_items.first() {
        args.push(item.url.clone());
    } else {
        return Err("Aucun média sélectionné.".to_string());
    }

    Ok((yt_dlp, args))
}

pub fn spawn_download_process(
    app: AppHandle,
    yt_dlp: String,
    args: Vec<String>,
    selected_items: Vec<MediaItem>,
    cancel_flag: std::sync::Arc<std::sync::atomic::AtomicBool>,
) -> Result<String, String> {
    let mut child = Command::new(yt_dlp)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Impossible de lancer yt-dlp: {error}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Impossible de capturer stdout.".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Impossible de capturer stderr.".to_string())?;

    let (tx, rx) = std::sync::mpsc::channel::<(String, String)>();
    let tx_stdout = tx.clone();
    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stdout);
        for line in std::io::BufRead::lines(reader).map_while(Result::ok) {
            let _ = tx_stdout.send(("info".to_string(), line));
        }
    });

    std::thread::spawn(move || {
        let reader = std::io::BufReader::new(stderr);
        for line in std::io::BufRead::lines(reader).map_while(Result::ok) {
            let _ = tx.send(("error".to_string(), line));
        }
    });

    let total = selected_items.len().max(1) as f64;
    let mut completed = 0_f64;
    let mut current_index = selected_items.first().map(|item| item.playlist_index);
    let mut current_id = selected_items.first().map(|item| item.id.clone());
    let mut final_status = "success".to_string();

    loop {
        if cancel_flag.load(std::sync::atomic::Ordering::SeqCst) {
            let _ = child.kill();
            final_status = "cancelled".to_string();
            let _ = app.emit(
                "download-progress",
                DownloadProgressEvent {
                    item_id: current_id.clone(),
                    item_index: current_index,
                    item_progress: Some(0.0),
                    total_progress: (completed / total) * 100.0,
                    status: "skipped".to_string(),
                    message: "Téléchargement annulé.".to_string(),
                },
            );
            break;
        }

        let Ok((level, line)) = rx.recv_timeout(std::time::Duration::from_millis(150)) else {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) => continue,
                Err(error) => return Err(format!("Impossible de surveiller yt-dlp: {error}")),
            }
        };

        let _ = app.emit(
            "download-log",
            LogEvent {
                level: level.clone(),
                message: line.clone(),
            },
        );

        if let Some(percent) = parse_percent(&line) {
            let overall = ((completed + (percent / 100.0)) / total) * 100.0;
            let _ = app.emit(
                "download-progress",
                DownloadProgressEvent {
                    item_id: current_id.clone(),
                    item_index: current_index,
                    item_progress: Some(percent),
                    total_progress: overall,
                    status: "downloading".to_string(),
                    message: line.clone(),
                },
            );
        }

        if line.contains("Destination:") || line.contains("Merging formats into") {
            let _ = app.emit(
                "download-progress",
                DownloadProgressEvent {
                    item_id: current_id.clone(),
                    item_index: current_index,
                    item_progress: Some(0.0),
                    total_progress: (completed / total) * 100.0,
                    status: "downloading".to_string(),
                    message: line.clone(),
                },
            );
        }

        if line.contains("has already been downloaded")
            || line.contains("[download] 100%")
            || line.contains("Finished downloading playlist")
        {
            completed = (completed + 1.0).min(total);
            let item_position = completed as usize;
            let next_item = selected_items.get(item_position);
            let done_status = if level == "error" { "error" } else { "done" };

            let _ = app.emit(
                "download-progress",
                DownloadProgressEvent {
                    item_id: current_id.clone(),
                    item_index: current_index,
                    item_progress: Some(100.0),
                    total_progress: (completed / total) * 100.0,
                    status: done_status.to_string(),
                    message: line.clone(),
                },
            );

            current_index = next_item.map(|item| item.playlist_index);
            current_id = next_item.map(|item| item.id.clone());
        }
    }

    let status = child
        .wait()
        .map_err(|error| format!("Erreur lors de l'attente de yt-dlp: {error}"))?;

    if !status.success() && final_status != "cancelled" {
        final_status = "error".to_string();
    }

    let message = match final_status.as_str() {
        "cancelled" => "Téléchargement annulé.".to_string(),
        "error" => "Téléchargement terminé avec erreur.".to_string(),
        _ => "Téléchargement terminé.".to_string(),
    };

    let _ = app.emit(
        "download-progress",
        DownloadProgressEvent {
            item_id: None,
            item_index: None,
            item_progress: Some(100.0),
            total_progress: if final_status == "cancelled" {
                (completed / total) * 100.0
            } else {
                100.0
            },
            status: if final_status == "error" {
                "error".to_string()
            } else {
                "done".to_string()
            },
            message,
        },
    );

    Ok(final_status)
}

fn parse_percent(line: &str) -> Option<f64> {
    let marker = "%";
    let index = line.find(marker)?;
    let start = line[..index]
        .char_indices()
        .rev()
        .find(|(_, ch)| ch.is_whitespace())
        .map(|(pos, _)| pos + 1)
        .unwrap_or(0);
    let raw = line[start..index].trim();
    raw.parse::<f64>().ok()
}
