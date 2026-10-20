import { type FC, useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  DEFAULT_MUSIC_PLAYLIST_ID,
  DEFAULT_MUSIC_PLAYLIST_VIDEO_IDS,
  musicChannel,
  MUSIC_STORAGE_KEY,
  readMusicSource,
  type MusicSource,
} from './music';
import { MusicSettings } from './components/MusicSettings';
import { ControlMenu } from './components/ControlMenu';
import { VideoGrid } from './components/VideoGrid';
import { initialChannels, type Channel, type LiveVideoOption } from './model';
import { useYoutubePlayers } from './hooks/useYoutubePlayers';

const ACTIVE_AUDIO_CHANNEL_KEY = 'activeAudioChannelId';
const CHANNELS_SYNCED_ON_BOOT_KEY = 'channelsSyncedOnBootAt';
const PLAYER_ERROR_CODES = new Set([2, 5, 100, 101, 150]);
const playlistCacheKey = (playlistId: string) => `musicPlaylistCache:${playlistId}`;

const fetchPlaylistVideoIds = async (playlistId: string, key: string): Promise<string[]> => {
  const ids: string[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({ part: 'contentDetails', maxResults: '50', playlistId, key });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetch(`https://youtube.googleapis.com/youtube/v3/playlistItems?${params}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data?.error) throw new Error(data?.error?.message || 'No se pudo leer la playlist de YouTube.');
    for (const item of data.items || []) {
      const videoId = item?.contentDetails?.videoId;
      if (typeof videoId === 'string' && !ids.includes(videoId)) ids.push(videoId);
    }
    pageToken = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
  } while (pageToken);

  const embeddableIds: string[] = [];
  for (let start = 0; start < ids.length; start += 50) {
    const chunk = ids.slice(start, start + 50);
    const params = new URLSearchParams({ part: 'status', id: chunk.join(','), key });
    const response = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?${params}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data?.error) throw new Error(data?.error?.message || 'No se pudo validar la playlist de YouTube.');
    const allowed = new Set<string>(
      (data.items || [])
        .filter((item: any) => item?.status?.embeddable !== false && item?.status?.privacyStatus === 'public')
        .map((item: any) => String(item.id))
    );
    embeddableIds.push(...chunk.filter((id) => allowed.has(id)));
  }
  return embeddableIds;
};

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
  const [isMenuClosed, setIsMenuClosed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [activeAudioChannelId, setActiveAudioChannelId] = useState('');
  const [lastSmartSyncSummary, setLastSmartSyncSummary] = useState('No sync yet.');
  const [isSmartSyncRunning, setIsSmartSyncRunning] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);

  const [musicSource, setMusicSource] = useState(readMusicSource);
  const [resolvedPlaylistVideos, setResolvedPlaylistVideos] = useState<string[]>(() =>
    musicSource.kind === 'playlist' && musicSource.playlistId === DEFAULT_MUSIC_PLAYLIST_ID
      ? DEFAULT_MUSIC_PLAYLIST_VIDEO_IDS
      : []
  );
  const availableChannels = useMemo(() => [...channels, musicChannel], [channels]);
  const playbackMusicSource: MusicSource = useMemo(
    () => musicSource.kind === 'playlist' && resolvedPlaylistVideos.length
      ? { kind: 'videos', videoIds: resolvedPlaylistVideos }
      : musicSource,
    [musicSource, resolvedPlaylistVideos]
  );

  useEffect(() => {
    if (musicSource.kind !== 'playlist') {
      setResolvedPlaylistVideos([]);
      return;
    }
    let cancelled = false;
    const builtIn = musicSource.playlistId === DEFAULT_MUSIC_PLAYLIST_ID
      ? DEFAULT_MUSIC_PLAYLIST_VIDEO_IDS
      : [];
    try {
      const cached = JSON.parse(localStorage.getItem(playlistCacheKey(musicSource.playlistId)) || 'null');
      const validCache = Array.isArray(cached)
        ? cached.filter((id): id is string => typeof id === 'string' && /^[\w-]{11}$/.test(id))
        : [];
      setResolvedPlaylistVideos(validCache.length ? validCache : builtIn);
    } catch {
      setResolvedPlaylistVideos(builtIn);
    }
    if (!apiKey) return () => { cancelled = true; };
    void fetchPlaylistVideoIds(musicSource.playlistId, apiKey).then((ids) => {
      if (cancelled || !ids.length) return;
      setResolvedPlaylistVideos(ids);
      localStorage.setItem(playlistCacheKey(musicSource.playlistId), JSON.stringify(ids));
    }).catch((error: Error) => {
      if (!cancelled && !builtIn.length) setStatusMessage(error.message);
    });
    return () => { cancelled = true; };
  }, [musicSource, apiKey]);

  const liveVideos: LiveVideoOption[] = useMemo(
    () =>
      availableChannels.flatMap((channel) =>
        channel.liveVideos.map((video, index) => ({
          videoId: video.videoId,
          channelId: channel.channelId,
          channelTitle: channel.title,
          videoTitle: video.title,
          label: `${channel.title} - ${video.title || `Live #${index + 1}`}`,
        }))
      ),
    [availableChannels]
  );

  const orderedChannels = useMemo(() => {
    return [...availableChannels].sort((left, right) => {
      const leftHasLive = left.liveVideos.length > 0;
      const rightHasLive = right.liveVideos.length > 0;

      if (leftHasLive === rightHasLive) return 0;
      return leftHasLive ? -1 : 1;
    });
  }, [availableChannels]);

  const {
    controlAllVideos,
    controlSingleVideo,
    unmuteSingleVideo,
    smartSyncPlayers,
    analyzeAndRecoverPlayers,
  } = useYoutubePlayers(activeAudioChannelId);

  const selectedChannelId = useMemo(() => {
    const selected = liveVideos.find((video) => video.videoId === selectedVideoId);
    return selected?.channelId || '';
  }, [selectedVideoId, liveVideos]);

  useEffect(() => {
    const storedAudioChannel = localStorage.getItem(ACTIVE_AUDIO_CHANNEL_KEY);
    if (storedAudioChannel) setActiveAudioChannelId(storedAudioChannel);
  }, []);

  useEffect(() => {
    if (activeAudioChannelId) {
      localStorage.setItem(ACTIVE_AUDIO_CHANNEL_KEY, activeAudioChannelId);
    }
  }, [activeAudioChannelId]);

  useEffect(() => {
    if (!liveVideos.length) {
      setSelectedVideoId('');
      setActiveAudioChannelId('');
      return;
    }

    if (!selectedVideoId || !liveVideos.some((video) => video.videoId === selectedVideoId)) {
      setSelectedVideoId(liveVideos[0].videoId);
    }

    if (!activeAudioChannelId) {
      const firstChannelId = channels.find((channel) => channel.liveVideos.length > 0)?.channelId || '';
      if (firstChannelId) setActiveAudioChannelId(firstChannelId);
    }
  }, [liveVideos, selectedVideoId, activeAudioChannelId, channels]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuPinned(false);
        setIsMenuClosed(true);
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    const recentErrors = new Map<string, number>();
    const dedupeMs = 15000;

    const onPlayerMessage = (event: MessageEvent) => {
      let payload: any = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      if (!payload || payload.event !== 'onError') return;
      const code = Number(payload.info);
      if (!PLAYER_ERROR_CODES.has(code)) return;

      const iframe = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo')).find(
        (item) => item.contentWindow === event.source
      );
      const channelId = iframe?.dataset.channelId || 'unknown-channel';
      const channelTitle =
        channels.find((channel) => channel.channelId === channelId)?.title || channelId;

      const errorKey = `${channelId}:${code}`;
      const now = Date.now();
      const previousTs = recentErrors.get(errorKey) || 0;
      if (now - previousTs < dedupeMs) return;
      recentErrors.set(errorKey, now);

      console.warn(
        `[YouTube Player Error] channel="${channelTitle}" channelId="${channelId}" code=${code}`
      );
    };

    window.addEventListener('message', onPlayerMessage);
    return () => window.removeEventListener('message', onPlayerMessage);
  }, [channels]);

  useEffect(() => {
    let isCancelled = false;
    let isRunning = false;

    const runHealthCheck = async () => {
      if (isRunning) return;
      isRunning = true;
      try {
        await analyzeAndRecoverPlayers();
        if (isCancelled) return;
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
        // One-shot background refresh to replace stale videoIds from previous sessions.
        const lastBootSyncRaw = localStorage.getItem(CHANNELS_SYNCED_ON_BOOT_KEY);
        const lastBootSync = lastBootSyncRaw ? Number(lastBootSyncRaw) : 0;
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;
        if (!lastBootSync || now - lastBootSync > twelveHours) {
          localStorage.setItem(CHANNELS_SYNCED_ON_BOOT_KEY, String(now));
          window.setTimeout(() => {
            void forceRefresh(key);
          }, 1200);
        }
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
    if (!selectedChannelId) return;
    setActiveAudioChannelId(selectedChannelId);
    unmuteSingleVideo(selectedChannelId);
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
          <button type="button" onClick={() => setShowApiKeyForm(false)}>Continuar solo con Música</button>
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

      <VideoGrid
        channels={orderedChannels}
        musicSource={playbackMusicSource}
        isFocusMode={isFocusMode}
        focusChannelId={selectedChannelId}
      />

      <ControlMenu
        musicSettings={<MusicSettings source={musicSource} onSave={(source) => {
          try {
            localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(source));
            setMusicSource(source);
          } catch {
            setStatusMessage('No se pudo guardar la playlist en este navegador.');
          }
        }} />}
        isMenuPinned={isMenuPinned}
        setIsMenuPinned={setIsMenuPinned}
        isMenuClosed={isMenuClosed}
        setIsMenuClosed={setIsMenuClosed}
        liveVideos={liveVideos}
        selectedVideoId={selectedVideoId}
        setSelectedVideoId={setSelectedVideoId}
        onAllAction={controlAllVideos}
        onSingleAction={(action) => controlSingleVideo(action, selectedChannelId)}
        onUnmuteSelected={handleUnmuteSelected}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        onRefresh={() => apiKey ? void forceRefresh(apiKey) : setShowApiKeyForm(true)}
        onSmartSync={handleSmartSync}
        isSmartSyncRunning={isSmartSyncRunning}
        lastSmartSyncSummary={lastSmartSyncSummary}
      />
    </>
  );
};

export default App;

