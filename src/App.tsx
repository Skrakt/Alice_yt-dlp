import { useEffect, useState } from "react";
import "./App.css";
import {
  analyzeUrl,
  cancelAnalysis,
  cancelDownload,
  chooseOutputDirectory,
  clearHistory,
  ensureDependencies,
  getHistory,
  getSavedFolders,
  getSettings,
  listDirectory,
  onLog,
  onProgress,
  saveSavedFolders,
  saveSettings,
  startDownload,
} from "./lib/tauri";
import type {
  AudioFormat,
  DownloadMode,
  HistoryEntry,
  LocalMediaEntry,
  MediaItem,
  SavedFolder,
  VideoFormat,
  VideoQuality,
} from "./lib/types";
import { DownloadControls } from "./components/DownloadControls";
import { DownloadModeSelector } from "./components/DownloadModeSelector";
import { DownloadOptions } from "./components/DownloadOptions";
import { LibrarySidebar } from "./components/LibrarySidebar";
import { LocalMediaBrowser } from "./components/LocalMediaBrowser";
import { LogPanel } from "./components/LogPanel";
import { MediaList } from "./components/MediaList";
import { OutputDirectoryPicker } from "./components/OutputDirectoryPicker";
import { ProgressPanel } from "./components/ProgressPanel";
import { UrlInput } from "./components/UrlInput";

const DEFAULT_TEMPLATE = "%(playlist_index)03d - %(title)s.%(ext)s";

function getFolderName(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, "");
  const parts = trimmed.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] || trimmed || path;
}

function getParentPath(path: string): string {
  const normalized = path.replace(/[\\/]+$/, "");
  const separator = normalized.includes("\\") ? "\\" : "/";
  const lastSeparator = normalized.lastIndexOf(separator);

  if (lastSeparator <= 0) {
    return normalized.startsWith(separator) ? separator : "";
  }

  return normalized.slice(0, lastSeparator);
}

function App() {
  const [view, setView] = useState<"download" | "library">("download");
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mode, setMode] = useState<DownloadMode>("audio");
  const [audioFormat, setAudioFormat] = useState<AudioFormat>("mp3");
  const [videoFormat, setVideoFormat] = useState<VideoFormat>("mp4");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("best");
  const [outputDir, setOutputDir] = useState("");
  const [audioQuality, setAudioQuality] = useState("0");
  const [outputTemplate, setOutputTemplate] = useState(DEFAULT_TEMPLATE);
  const [totalProgress, setTotalProgress] = useState(0);
  const [statusText, setStatusText] = useState("Prêt.");
  const [savedFolders, setSavedFolders] = useState<SavedFolder[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentFolderPath, setCurrentFolderPath] = useState("");
  const [currentRootFolderPath, setCurrentRootFolderPath] = useState("");
  const [localEntries, setLocalEntries] = useState<LocalMediaEntry[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [browseError, setBrowseError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Alice";

    void getSettings()
      .then((settings) => {
        setIsSidebarOpen(settings.sidebar_open);
      })
      .catch((error) => {
        setLogs((current) => [
          `Impossible de charger les paramètres locaux : ${String(error)}`,
          ...current,
        ]);
      });

    void getSavedFolders()
      .then(setSavedFolders)
      .catch((error) => {
        setLogs((current) => [
          `Impossible de charger les dossiers favoris : ${String(error)}`,
          ...current,
        ]);
      });

    void ensureDependencies()
      .then((status) => {
        if (status.issues.length > 0) {
          setLogs((current) => [
            ...status.issues.map((issue) => `Dépendances : ${issue}`),
            ...current,
          ]);
        }
      })
      .catch((error) => {
        setLogs((current) => [
          `Impossible de vérifier les dépendances : ${String(error)}`,
          ...current,
        ]);
      });
    void refreshHistory();

    let mounted = true;
    let unlistenProgress: (() => void) | undefined;
    let unlistenLog: (() => void) | undefined;

    void onProgress((payload) => {
      if (!mounted) {
        return;
      }

      setTotalProgress(payload.total_progress);
      setStatusText(payload.message);

      if (payload.item_id) {
        setItems((current) =>
          current.map((item) =>
            item.id === payload.item_id
              ? {
                  ...item,
                  progress: payload.item_progress ?? item.progress,
                  status: payload.status,
                  error:
                    payload.status === "error" ? payload.message : item.error,
                }
              : item,
          ),
        );
      } else if (typeof payload.item_index === "number") {
        setItems((current) =>
          current.map((item) =>
            item.playlist_index === payload.item_index
              ? {
                  ...item,
                  progress: payload.item_progress ?? item.progress,
                  status: payload.status,
                  error:
                    payload.status === "error" ? payload.message : item.error,
                }
              : item,
          ),
        );
      }

      if (payload.status === "done" && payload.total_progress >= 100) {
        setIsDownloading(false);
        void refreshHistory();
      }
    })
      .then((fn) => {
        unlistenProgress = fn;
      })
      .catch((error) => {
        setLogs((current) => [
          `Impossible d'écouter la progression : ${String(error)}`,
          ...current,
        ]);
      });

    void onLog((payload) => {
      if (mounted) {
        setLogs((current) => [payload.message, ...current].slice(0, 300));
      }
    })
      .then((fn) => {
        unlistenLog = fn;
      })
      .catch((error) => {
        setLogs((current) => [
          `Impossible d'écouter les journaux : ${String(error)}`,
          ...current,
        ]);
      });

    return () => {
      mounted = false;
      unlistenProgress?.();
      unlistenLog?.();
    };
  }, []);

  useEffect(() => {
    void saveSettings({ sidebar_open: isSidebarOpen }).catch((error) => {
      setLogs((current) => [
        `Impossible d'enregistrer les paramètres locaux : ${String(error)}`,
        ...current,
      ]);
    });
  }, [isSidebarOpen]);

  async function refreshHistory() {
    const entries = await getHistory();
    setHistory(entries);
  }

  async function persistSavedFolders(nextFolders: SavedFolder[]) {
    setSavedFolders(nextFolders);
    await saveSavedFolders(nextFolders);
  }

  async function openFolder(path: string, rootPath = currentRootFolderPath || path) {
    setView("library");
    setIsBrowsing(true);
    setBrowseError(null);
    setCurrentFolderPath(path);
    setCurrentRootFolderPath(rootPath);

    try {
      const entries = await listDirectory(path);
      setLocalEntries(entries);
    } catch (error) {
      setBrowseError(String(error));
      setLocalEntries([]);
    } finally {
      setIsBrowsing(false);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setLogs([]);
    setStatusText("Analyse en cours...");
    setTotalProgress(0);

    try {
      const media = await analyzeUrl(url);
      setItems(media);
      setStatusText(`${media.length} média(s) détecté(s).`);
    } catch (error) {
      const message = String(error);
      setStatusText(
        message.includes("annul") ? "Analyse annulée." : "Analyse échouée.",
      );
      setLogs((current) => [`Erreur d'analyse : ${message}`, ...current]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelAnalyze() {
    try {
      await cancelAnalysis();
      setStatusText("Annulation de l'analyse demandée.");
    } catch (error) {
      setLogs((current) => [
        `Impossible d'annuler l'analyse : ${String(error)}`,
        ...current,
      ]);
    }
  }

  function handleClearList() {
    setItems([]);
    setLogs([]);
    setTotalProgress(0);
    setStatusText("Prêt.");
  }

  async function handleChooseOutputDirectory() {
    const selected = await chooseOutputDirectory();
    if (selected) {
      setOutputDir(selected);
    }
  }

  async function handleAddFavoriteFolder() {
    const selected = await chooseOutputDirectory();
    if (!selected) {
      return;
    }

    if (savedFolders.some((folder) => folder.path === selected)) {
      await openFolder(selected, selected);
      return;
    }

    const nextFolders = [
      ...savedFolders,
      {
        id: crypto.randomUUID(),
        path: selected,
        name: getFolderName(selected),
      },
    ];

    await persistSavedFolders(nextFolders);

    await openFolder(selected, selected);
  }

  async function handleDownload() {
    setIsDownloading(true);
    setStatusText("Préparation du téléchargement...");
    setTotalProgress(0);
    setItems((current) =>
      current.map((item) =>
        item.selected
          ? { ...item, status: "pending", progress: 0, error: null }
          : { ...item, status: "skipped" },
      ),
    );

    try {
      await startDownload({
        url,
        items,
        options: {
          mode,
          audio_format: mode === "audio" ? audioFormat : null,
          video_format: mode === "video" ? videoFormat : null,
          video_quality: mode === "video" ? videoQuality : null,
          output_dir: outputDir,
          audio_quality: audioQuality,
          embed_thumbnail: true,
          add_metadata: true,
          output_template: outputTemplate,
        },
      });
    } catch (error) {
      setIsDownloading(false);
      setStatusText("Téléchargement impossible.");
      setLogs((current) => [
        `Erreur de téléchargement : ${String(error)}`,
        ...current,
      ]);
    }
  }

  async function handleCancel() {
    await cancelDownload();
    setIsDownloading(false);
    setStatusText("Annulation demandée.");
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
  }

  const selectedCount = items.filter((item) => item.selected).length;
  const canDownload =
    Boolean(url.trim()) && Boolean(outputDir.trim()) && selectedCount > 0;

  return (
    <main className="app-shell">
      <div
        className={
          isSidebarOpen ? "workspace-layout" : "workspace-layout sidebar-collapsed"
        }
      >
        <LibrarySidebar
          savedFolders={savedFolders}
          history={history}
          activePath={currentRootFolderPath || currentFolderPath}
          isLibraryView={view === "library"}
          isOpen={isSidebarOpen}
          onBackToDownload={() => setView("download")}
          onAddFolder={() => void handleAddFavoriteFolder()}
          onOpenFolder={(path) => void openFolder(path, path)}
          onClearHistory={() => void handleClearHistory()}
          onToggle={() => setIsSidebarOpen((current) => !current)}
        />

        <section className="content-shell">
          {view === "download" ? (
            <>
              <UrlInput
                url={url}
                loading={loading}
                canClear={items.length > 0 || logs.length > 0}
                onUrlChange={setUrl}
                onAnalyze={() => void handleAnalyze()}
                onCancelAnalyze={() => void handleCancelAnalyze()}
                onClearList={handleClearList}
              />

              <section className="grid-layout">
                <div className="main-column">
                  <MediaList
                    items={items}
                    onToggle={(id) =>
                      setItems((current) =>
                        current.map((item) =>
                          item.id === id
                            ? { ...item, selected: !item.selected }
                            : item,
                        ),
                      )
                    }
                    onToggleAll={(selected) =>
                      setItems((current) =>
                        current.map((item) => ({ ...item, selected })),
                      )
                    }
                  />
                  <LogPanel logs={logs} />
                </div>

                <aside className="side-column">
                  <ProgressPanel
                    totalProgress={totalProgress}
                    statusText={statusText}
                  />

                  <OutputDirectoryPicker
                    outputDir={outputDir}
                    onChoose={() => void handleChooseOutputDirectory()}
                    onChange={setOutputDir}
                  />

                  <DownloadModeSelector
                    mode={mode}
                    audioFormat={audioFormat}
                    videoFormat={videoFormat}
                    videoQuality={videoQuality}
                    onModeChange={setMode}
                    onAudioFormatChange={setAudioFormat}
                    onVideoFormatChange={setVideoFormat}
                    onVideoQualityChange={setVideoQuality}
                  />

                  <DownloadOptions
                    audioQuality={audioQuality}
                    outputTemplate={outputTemplate}
                    onAudioQualityChange={setAudioQuality}
                    onOutputTemplateChange={setOutputTemplate}
                  />

                  <DownloadControls
                    selectedCount={selectedCount}
                    canDownload={canDownload}
                    isDownloading={isDownloading}
                    onDownload={() => void handleDownload()}
                    onCancel={() => void handleCancel()}
                  />
                </aside>
              </section>
            </>
          ) : (
            <LocalMediaBrowser
              currentPath={currentFolderPath}
              entries={localEntries}
              loading={isBrowsing}
              error={browseError}
              canGoUp={
                Boolean(currentFolderPath) &&
                Boolean(currentRootFolderPath) &&
                currentFolderPath !== currentRootFolderPath
              }
              onOpenEntry={(entry) => {
                if (entry.is_dir) {
                  void openFolder(entry.path, currentRootFolderPath);
                }
              }}
              onGoUp={() => {
                const parentPath = getParentPath(currentFolderPath);
                if (
                  parentPath &&
                  parentPath !== currentFolderPath &&
                  parentPath.startsWith(currentRootFolderPath)
                ) {
                  void openFolder(parentPath, currentRootFolderPath);
                }
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
