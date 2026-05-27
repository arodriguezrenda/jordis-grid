import type { Dispatch, FC, SetStateAction } from 'react';
import type { LiveVideoOption } from '../model';

interface ControlMenuProps {
  isMenuPinned: boolean;
  setIsMenuPinned: Dispatch<SetStateAction<boolean>>;
  liveVideos: LiveVideoOption[];
  selectedVideoId: string;
  setSelectedVideoId: Dispatch<SetStateAction<string>>;
  onAllAction: (action: string) => void;
  onSingleAction: (action: string) => void;
  onUnmuteSelected: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onRefresh: () => void;
  onSmartSync: () => void;
  isSmartSyncRunning: boolean;
  lastSmartSyncSummary: string;
}

export const ControlMenu: FC<ControlMenuProps> = ({
  isMenuPinned,
  setIsMenuPinned,
  liveVideos,
  selectedVideoId,
  setSelectedVideoId,
  onAllAction,
  onSingleAction,
  onUnmuteSelected,
  isFocusMode,
  onToggleFocusMode,
  onRefresh,
  onSmartSync,
  isSmartSyncRunning,
  lastSmartSyncSummary,
}) => {
  return (
    <div className={`compactMenuWrapper ${isMenuPinned ? 'pinned' : ''}`}>
      <button
        className="compactMenuHandle"
        type="button"
        aria-label={isMenuPinned ? 'Unpin menu' : 'Pin menu'}
        aria-expanded={isMenuPinned}
        onClick={() => setIsMenuPinned((prev) => !prev)}
      />
      <div className="compactMenu" role="menu" aria-label="Video controls menu">
        <div className="menuSection">
          <span className="menuSectionTitle">All Videos</span>
          <button onClick={() => onAllAction('playVideo')}>Play</button>
          <button onClick={() => onAllAction('pauseVideo')}>Pause</button>
          <button onClick={() => onAllAction('stopVideo')}>Stop</button>
          <button onClick={() => onAllAction('mute')}>Mute</button>
          <button onClick={() => onAllAction('unMute')}>Unmute</button>
        </div>
        <div className="menuSection">
          <span className="menuSectionTitle">Single Video</span>
          <div className="singleVideoControls">
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              disabled={!liveVideos.length}
              aria-label="Select live video"
            >
              {liveVideos.length === 0 && <option value="">No live videos</option>}
              {liveVideos.map((video) => (
                <option key={video.videoId} value={video.videoId}>
                  {video.label}
                </option>
              ))}
            </select>
            <div className="singleVideoActions">
              <button onClick={() => onSingleAction('playVideo')} disabled={!selectedVideoId}>
                Play
              </button>
              <button onClick={() => onSingleAction('pauseVideo')} disabled={!selectedVideoId}>
                Pause
              </button>
              <button onClick={() => onSingleAction('stopVideo')} disabled={!selectedVideoId}>
                Stop
              </button>
              <button onClick={() => onSingleAction('mute')} disabled={!selectedVideoId}>
                Mute
              </button>
              <button onClick={onUnmuteSelected} disabled={!selectedVideoId}>
                Unmute
              </button>
              <button onClick={onToggleFocusMode} disabled={!selectedVideoId}>
                {isFocusMode ? 'Exit Focus View' : 'Focus View'}
              </button>
            </div>
          </div>
        </div>
        <div className="menuSection">
          <span className="menuSectionTitle">View</span>
          <button onClick={() => setIsMenuPinned((prev) => !prev)}>
            {isMenuPinned ? 'Unpin Menu' : 'Pin Menu'}
          </button>
        </div>
        <div className="menuSection">
          <span className="menuSectionTitle">Data</span>
          <button onClick={onRefresh}>Refresh Live Channels</button>
          <button onClick={onSmartSync} disabled={isSmartSyncRunning}>
            {isSmartSyncRunning ? 'Syncing...' : 'Sync Background to Live'}
          </button>
          <span className="menuSyncMeta">{lastSmartSyncSummary}</span>
        </div>
      </div>
    </div>
  );
};
