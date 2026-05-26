import { type FC, useEffect, useMemo, useState } from 'react';
import './App.css';
import { ControlMenu } from './components/ControlMenu';
import { VideoGrid } from './components/VideoGrid';
import { initialChannels, type Channel, type LiveVideoOption } from './model';
import { useYoutubePlayers } from './hooks/useYoutubePlayers';

const ACTIVE_AUDIO_VIDEO_KEY = 'activeAudioVideoId';

const normalizeChannels = (raw: any): Channel[] => {
  if (!Array.isArray(raw)) return initialChannels;

  return raw.map((item: any) => {
    const legacyVideoIds = Array.isArray(item.videoIds) ? item.videoIds : [];
    const liveVideos = Array.isArray(item.liveVideos)
      ? item.liveVideos.filter((v: any) => v?.videoId).map((v: any) => ({ videoId: String(v.videoId), title: String(v.title || 'Live') }))
      : legacyVideoIds.map((videoId: string, index: number) => ({ videoId, title: `Live #${index + 1}` }));

    return {
      channelId: String(item.channelId),
      title: String(item.title),
      thumbnail: item.thumbnail ? String(item.thumbnail) : undefined,
      liveVideos,
    };
  });
};

const App: FC = () => {
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isMenuPinned, setIsMenuPinned] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [activeAudioVideoId, setActiveAudioVideoId] = useState('');
  const [lastSmartSyncSummary, setLastSmartSyncSummary] = useState('No sync yet.');
  const [isSmartSyncRunning, setIsSmartSyncRunning] = useState(false);
  const [healthEvents, setHealthEvents] = useState<string[]>([]);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const liveVideos: LiveVideoOption[] = useMemo(
    () =>
      channels.flatMap((channel) =>
        channel.liveVideos.map((video, index) => ({
          videoId: video.videoId,
          channelTitle: channel.title,
          videoTitle: video.title,
          label: `${channel.title} - ${video.title || `Live #${index + 1}`}`,
        }))
      ),
    [channels]
  );

  const {
    controlAllVideos,
    controlSingleVideo,
    unmuteSingleVideo,
    smartSyncPlayers,
    analyzeAndRecoverPlayers,
  } = useYoutubePlayers(activeAudioVideoId);

  useEffect(() => {
    const storedAudioVideo = localStorage.getItem(ACTIVE_AUDIO_VIDEO_KEY);
    if (storedAudioVideo) setActiveAudioVideoId(storedAudioVideo);
  }, []);

  useEffect(() => {
    if (activeAudioVideoId) {
      localStorage.setItem(ACTIVE_AUDIO_VIDEO_KEY, activeAudioVideoId);
    }
  }, [activeAudioVideoId]);

  useEffect(() => {
    if (!liveVideos.length) {
      setSelectedVideoId('');
      setActiveAudioVideoId('');
      return;
    }

    if (!selectedVideoId || !liveVideos.some((video) => video.videoId === selectedVideoId)) {
      setSelectedVideoId(liveVideos[0].videoId);
    }

    if (!activeAudioVideoId || !liveVideos.some((video) => video.videoId === activeAudioVideoId)) {
      setActiveAudioVideoId(liveVideos[0].videoId);
    }
  }, [liveVideos, selectedVideoId, activeAudioVideoId]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuPinned(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let isRunning = false;

    const runHealthCheck = async () => {
      if (isRunning) return;
      isRunning = true;
      try {
        const { recoveredIds } = await analyzeAndRecoverPlayers();
        if (isCancelled) return;

        if (recoveredIds.length > 0) {
          const timestamp = new Date().toLocaleTimeString();
          const eventText = `${timestamp}: Auto-recovered ${recoveredIds.length} stalled stream(s).`;
          setHealthEvents((prev) => [eventText, ...prev].slice(0, 5));
        }
      } finally {
        isRunning = false;
      }
    };

    const intervalId = window.setInterval(() => {
      if (liveVideos.length > 0) void runHealthCheck();
    }, 20000);

    if (liveVideos.length > 0) void runHealthCheck();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [analyzeAndRecoverPlayers, liveVideos.length]);

  const getApiKeyFromStorage = () => {
    const storedKey = localStorage.getItem('apiKey');
    if (!storedKey) {
      setShowApiKeyForm(true);
      return null;
    }

    setApiKey(storedKey);
    return storedKey;
  };

  const parseApiError = (response: any): string | null => {
    const errorCode = response?.error?.code;
    const reason = response?.error?.errors?.[0]?.reason as string | undefined;

    if (errorCode === 400 && reason === 'keyInvalid') return 'Invalid API key. Please update your key.';
    if (errorCode === 403 && reason === 'quotaExceeded') return 'API quota exceeded. Try again later or use another key.';
    if (errorCode === 403) return 'API access denied. Check your key permissions.';
    return null;
  };

  const fetchWithRetries = async (url: string, retries = 3, delay = 900) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, delay));
      const response = await fetch(url, { cache: 'no-store' });
      const data = await response.json();

      const apiError = parseApiError(data);
      if (apiError) throw new Error(apiError);

      if (Array.isArray(data?.items) && data.items.length > 0) return data;
      if (attempt === retries) return data;
    }

    return { items: [] };
  };

  const forceRefresh = async (key: string) => {
    try {
      setLoading(true);
      setStatusMessage(null);
      setApiKeyError(null);
      localStorage.removeItem('channels');

      const updatedChannels = await Promise.all(
        initialChannels.map(async (channel) => {
          const apiUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.channelId}&eventType=live&type=video&key=${key}&_=${Date.now()}`;
          const data = await fetchWithRetries(apiUrl);
          const liveVideos = Array.isArray(data.items)
            ? data.items
                .filter((item: any) => item?.id?.videoId)
                .map((item: any) => ({
                  videoId: String(item.id.videoId),
                  title: String(item?.snippet?.title || 'Live'),
                }))
            : [];

          return { ...channel, liveVideos };
        })
      );

      setChannels(updatedChannels);
      localStorage.setItem('channels', JSON.stringify(updatedChannels));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error refreshing live streams.';
      setStatusMessage(message);
      if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('quota')) {
        setApiKeyError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async (key: string) => {
    try {
      setLoading(true);
      setStatusMessage(null);
      setApiKeyError(null);

      const storedChannels = localStorage.getItem('channels');
      if (storedChannels) {
        setChannels(normalizeChannels(JSON.parse(storedChannels)));
      } else {
        await forceRefresh(key);
      }
    } catch (error) {
      console.error('Error fetching channel data:', error);
      setStatusMessage('Could not load channels. Please try refreshing again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;

    localStorage.setItem('apiKey', apiKeyInput.trim());
    setApiKey(apiKeyInput.trim());
    setShowApiKeyForm(false);
    await loadVideos(apiKeyInput.trim());
  };

  useEffect(() => {
    const key = getApiKeyFromStorage();
    if (key) void loadVideos(key);
  }, []);

  const handleUnmuteSelected = () => {
    if (!selectedVideoId) return;
    setActiveAudioVideoId(selectedVideoId);
    unmuteSingleVideo(selectedVideoId);
  };

  const handleSmartSync = async () => {
    if (isSmartSyncRunning) return;
    setIsSmartSyncRunning(true);
    try {
      const result = await smartSyncPlayers();
      setLastSmartSyncSummary(`Updated ${result.updated}/${result.total} background videos.`);
      setStatusMessage(
        result.total === 0
          ? 'No background videos to sync.'
          : result.updated > 0
          ? `Smart Sync updated ${result.updated} video(s).`
          : 'Smart Sync: no stale videos found.'
      );
    } finally {
      setIsSmartSyncRunning(false);
      window.setTimeout(() => setStatusMessage(null), 1800);
    }
  };

  if (showApiKeyForm) {
    return (
      <div className="apiKeyFormContainer">
        <form className="apiKeyForm" onSubmit={handleApiKeySubmit}>
          <h2>Set up YouTube API Key</h2>
          <p>This is only used to check which channels are currently live.</p>
          <label htmlFor="apiKeyInput">
            API Key:
            <input
              id="apiKeyInput"
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              required
            />
          </label>
          {apiKeyError && <p className="apiError">{apiKeyError}</p>}
          <button type="submit">Save</button>
        </form>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      )}

      {statusMessage && <div className="toast">{statusMessage}</div>}

      <VideoGrid channels={channels} />

      <ControlMenu
        isMenuPinned={isMenuPinned}
        setIsMenuPinned={setIsMenuPinned}
        liveVideos={liveVideos}
        selectedVideoId={selectedVideoId}
        setSelectedVideoId={setSelectedVideoId}
        onAllAction={controlAllVideos}
        onSingleAction={controlSingleVideo}
        onUnmuteSelected={handleUnmuteSelected}
        onRefresh={() => apiKey && forceRefresh(apiKey)}
        onSmartSync={handleSmartSync}
        isSmartSyncRunning={isSmartSyncRunning}
        lastSmartSyncSummary={lastSmartSyncSummary}
        healthEvents={healthEvents}
      />
    </>
  );
};

export default App;

