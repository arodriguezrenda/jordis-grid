import { useEffect, useRef, useState } from 'react';
import { MUSIC_CHANNEL_ID, type MusicSource } from '../music';

interface Player {
  getIframe(): HTMLIFrameElement;
  getPlaylist(): string[];
  getPlaylistIndex(): number;
  getVideoData(): { video_id?: string };
  loadVideoById(id: string): void;
  mute(): void;
  nextVideo(): void;
  playVideo(): void;
  setLoop(loop: boolean): void;
  destroy(): void;
}
interface PlayerEvent { target: Player; data: number }
interface YoutubeAPI {
  Player: new (element: HTMLElement, options: {
    videoId?: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady(event: PlayerEvent): void;
      onStateChange(event: PlayerEvent): void;
      onError(event: PlayerEvent): void;
      onAutoplayBlocked(): void;
    };
  }) => Player;
}
let apiPromise: Promise<YoutubeAPI> | undefined;
function loadAPI(): Promise<YoutubeAPI> {
  const scope = window as typeof window & { YT?: YoutubeAPI; onYouTubeIframeAPIReady?: () => void };
  if (scope.YT?.Player) return Promise.resolve(scope.YT);
  if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
    const previous = scope.onYouTubeIframeAPIReady;
    const timer = window.setTimeout(() => reject(new Error('YouTube no respondió. Recargá la página.')), 20000);
    scope.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      previous?.();
      if (scope.YT) resolve(scope.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { window.clearTimeout(timer); reject(new Error('No se pudo cargar YouTube.')); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export function MusicPlayer({ source }: { source: MusicSource }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const advance = useRef<() => void>(() => {});
  const [position, setPosition] = useState({ index: 0, total: source.kind === 'videos' ? source.videoIds.length : 0 });
  const [currentVideoId, setCurrentVideoId] = useState(source.kind === 'videos' ? source.videoIds[0] : '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    let current = 0;
    let failures = 0;
    let skipTimer: number | undefined;
    setPosition({ index: 0, total: source.kind === 'videos' ? source.videoIds.length : 0 });
    setCurrentVideoId(source.kind === 'videos' ? source.videoIds[0] : '');
    setMessage('');

    const updatePlaylistPosition = (target: Player) => {
      const playlist = target.getPlaylist() || [];
      const index = Math.max(0, target.getPlaylistIndex());
      setPosition({ index, total: playlist.length });
      setCurrentVideoId(target.getVideoData()?.video_id || playlist[index] || '');
    };
    const nextManualVideo = () => {
      if (source.kind !== 'videos') return;
      window.clearTimeout(skipTimer);
      current = (current + 1) % source.videoIds.length;
      setPosition({ index: current, total: source.videoIds.length });
      setCurrentVideoId(source.videoIds[current]);
      setMessage('');
      player.current?.loadVideoById(source.videoIds[current]);
    };
    advance.current = () => {
      failures = 0;
      if (source.kind === 'playlist') player.current?.nextVideo();
      else nextManualVideo();
    };

    void loadAPI().then((api) => {
      if (cancelled || !host.current) return;
      const element = document.createElement('div');
      host.current.appendChild(element);
      const playerVars: Record<string, string | number> = {
        autoplay: 1,
        mute: 1,
        playsinline: 1,
        origin: window.location.origin,
        ...(source.kind === 'playlist'
          ? { listType: 'playlist', list: source.playlistId, loop: 1 }
          : {}),
      };
      player.current = new api.Player(element, {
        // `videoseries` makes the iframe use YouTube's playlist embed route.
        videoId: source.kind === 'videos' ? source.videoIds[0] : 'videoseries',
        playerVars,
        events: {
          onReady: ({ target }) => {
            const iframe = target.getIframe();
            iframe.className = 'myVideo';
            iframe.dataset.channelId = MUSIC_CHANNEL_ID;
            iframe.dataset.playbackKind = 'playlist';
            iframe.title = 'Música — videoclips sin fin';
            iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
            target.mute();
            if (source.kind === 'playlist') {
              target.setLoop(true);
            }
            target.playVideo();
          },
          onStateChange: ({ target, data }) => {
            if (cancelled) return;
            if (data === 1) {
              failures = 0;
              setMessage('');
              if (source.kind === 'playlist') updatePlaylistPosition(target);
            }
            if (data === 0 && source.kind === 'videos') nextManualVideo();
          },
          onError: ({ target, data }) => {
            if (cancelled) return;
            if (![2, 5, 100, 101, 150].includes(data)) {
              setMessage('YouTube no pudo reproducir el video. Probá Siguiente o recargá la página.');
              return;
            }
            if (source.kind === 'playlist') {
              setMessage('Video no disponible. Pasando al siguiente…');
              skipTimer = window.setTimeout(() => target.nextVideo(), 1000);
              return;
            }
            failures += 1;
            if (failures >= source.videoIds.length) {
              setMessage('No hay videos disponibles. Editá la lista o probá Siguiente.');
              return;
            }
            setMessage('Video no disponible. Pasando al siguiente…');
            skipTimer = window.setTimeout(nextManualVideo, 1000);
          },
          onAutoplayBlocked: () => setMessage('Presioná Play en el video para comenzar.'),
        },
      });
    }).catch((error: Error) => { if (!cancelled) setMessage(error.message); });
    return () => {
      cancelled = true;
      window.clearTimeout(skipTimer);
      player.current?.destroy();
      player.current = null;
    };
  }, [source]);

  const status = position.total > 0 ? `${position.index + 1}/${position.total}` : 'playlist de YouTube';
  return <div className="musicTile">
    <div className="musicPlayerHost" ref={host} />
    <div className="musicBar">
      <span>Música · {status} · En bucle</span>
      {currentVideoId && <a href={`https://www.youtube.com/watch?v=${currentVideoId}`} target="_blank" rel="noreferrer">Ver tema</a>}
      <button type="button" onClick={() => advance.current()}>Siguiente</button>
    </div>
    {message && <div className="musicMessage" role="status">{message}</div>}
  </div>;
}
