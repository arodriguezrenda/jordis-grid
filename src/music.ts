import type { Channel } from './model';

export const MUSIC_CHANNEL_ID = 'virtual-music';
export const MUSIC_SELECTION_ID = 'music-playlist';
export const MUSIC_STORAGE_KEY = 'musicSource';
const LEGACY_MUSIC_STORAGE_KEY = 'musicVideoIds';
export const DEFAULT_MUSIC_IDS = ['fJ9rUzIMcZQ', 'hTWKbfoikeg', 'YkgkThdzX-8', 'OPf0YbXqDm0', 'dJRsWJqDjFE'];
export const DEFAULT_MUSIC_PLAYLIST_ID = 'PLTtOBDiB_ofJdQMh8VzO41feB_v06vFPF';
export const DEFAULT_MUSIC_PLAYLIST_VIDEO_IDS = [
  'ql85UJMUykY', 'wlJeEZ6Qq98',
  'Z4-g8UXa944', 'mrV8kK5t0V8', 'Z5ezegzd9dc', 'xiZUf98A1Ts', 'sqFickrNDrk',
  'ekr2nIex040', 'rK5TyISxZ_M', '2yrLJ9h5roY', 'D3jQltsjUzE', 'EFqvVSqh6R8',
];

export type MusicSource =
  | { kind: 'playlist'; playlistId: string }
  | { kind: 'videos'; videoIds: string[] };

export const musicChannel: Channel = {
  channelId: MUSIC_CHANNEL_ID,
  title: 'Música',
  liveVideos: [{ videoId: MUSIC_SELECTION_ID, title: 'Videoclips sin fin' }],
};

export function parseMusicVideos(text: string): string[] {
  return [...new Set(text.split(/[\s,]+/).filter(Boolean).map((value) => {
    if (/^[\w-]{11}$/.test(value)) return value;
    try {
      const url = new URL(value);
      if (url.hostname === 'youtu.be') return url.pathname.slice(1);
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
        return url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})/)?.[1] || '';
      }
    } catch { /* Invalid entries are reported by the editor. */ }
    return '';
  }).filter((id) => /^[\w-]{11}$/.test(id)))];
}

export function parsePlaylistId(value: string): string | null {
  const trimmed = value.trim().replace(/\\([&?])/g, '$1');
  if (!trimmed) return null;
  try {
    // Also accept links copied from Markdown or surrounding prose.
    const urlText = trimmed.match(/https?:\/\/[^\s\])]+/)?.[0] || trimmed;
    const url = new URL(urlText);
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(url.hostname)) return null;
    const playlistId = url.searchParams.get('list');
    return playlistId && /^[\w-]{10,}$/.test(playlistId) ? playlistId : null;
  } catch {
    return /^[\w-]{10,}$/.test(trimmed) ? trimmed : null;
  }
}

function isVideoList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((id) => typeof id === 'string' && /^[\w-]{11}$/.test(id));
}

export function readMusicSource(): MusicSource {
  try {
    const saved = JSON.parse(localStorage.getItem(MUSIC_STORAGE_KEY) || 'null') as Partial<MusicSource> | null;
    if (saved?.kind === 'playlist' && typeof saved.playlistId === 'string' && parsePlaylistId(saved.playlistId)) {
      return { kind: 'playlist', playlistId: saved.playlistId };
    }
    if (saved?.kind === 'videos' && isVideoList(saved.videoIds)) return { kind: 'videos', videoIds: saved.videoIds };
    const legacy = JSON.parse(localStorage.getItem(LEGACY_MUSIC_STORAGE_KEY) || 'null');
    if (isVideoList(legacy)) return { kind: 'videos', videoIds: legacy };
  } catch { /* Use the starter playlist if storage is unavailable or invalid. */ }
  return { kind: 'playlist', playlistId: DEFAULT_MUSIC_PLAYLIST_ID };
}
