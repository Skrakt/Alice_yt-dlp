import type {
  AudioFormat,
  DownloadMode,
  VideoFormat,
  VideoQuality,
} from "../lib/types";

interface DownloadModeSelectorProps {
  mode: DownloadMode;
  audioFormat: AudioFormat;
  videoFormat: VideoFormat;
  videoQuality: VideoQuality;
  onModeChange: (value: DownloadMode) => void;
  onAudioFormatChange: (value: AudioFormat) => void;
  onVideoFormatChange: (value: VideoFormat) => void;
  onVideoQualityChange: (value: VideoQuality) => void;
}

export function DownloadModeSelector(props: DownloadModeSelectorProps) {
  const {
    mode,
    audioFormat,
    videoFormat,
    videoQuality,
    onModeChange,
    onAudioFormatChange,
    onVideoFormatChange,
    onVideoQualityChange,
  } = props;

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Mode de téléchargement</h2>
      </div>

      <div className="segmented-control">
        <button
          className={mode === "audio" ? "active" : ""}
          onClick={() => onModeChange("audio")}
        >
          Audio uniquement
        </button>
        <button
          className={mode === "video" ? "active" : ""}
          onClick={() => onModeChange("video")}
        >
          Vidéo + audio
        </button>
      </div>

      {mode === "audio" ? (
        <div className="field-grid">
          <label>
            <span>Format audio</span>
            <select
              value={audioFormat}
              onChange={(event) =>
                onAudioFormatChange(event.target.value as AudioFormat)
              }
            >
              <option value="mp3">MP3</option>
              <option value="m4a">M4A</option>
              <option value="flac">FLAC</option>
              <option value="opus">OPUS</option>
              <option value="wav">WAV</option>
            </select>
          </label>
        </div>
      ) : (
        <div className="field-grid">
          <label>
            <span>Format vidéo</span>
            <select
              value={videoFormat}
              onChange={(event) =>
                onVideoFormatChange(event.target.value as VideoFormat)
              }
            >
              <option value="mp4">MP4</option>
              <option value="mkv">MKV</option>
              <option value="webm">WEBM</option>
            </select>
          </label>

          <label>
            <span>Qualité vidéo</span>
            <select
              value={videoQuality}
              onChange={(event) =>
                onVideoQualityChange(event.target.value as VideoQuality)
              }
            >
              <option value="best">Meilleure qualité</option>
              <option value="1080p">1080p max</option>
              <option value="720p">720p max</option>
            </select>
          </label>
        </div>
      )}
    </section>
  );
}
