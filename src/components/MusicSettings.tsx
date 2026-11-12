import { useEffect, useState } from 'react';
import { parseMusicVideos, parsePlaylistId, type MusicSource } from '../music';

export function MusicSettings({ source, onSave }: { source: MusicSource; onSave: (source: MusicSource) => void }) {
  const [playlistDraft, setPlaylistDraft] = useState(source.kind === 'playlist' ? source.playlistId : '');
  const [videosDraft, setVideosDraft] = useState(source.kind === 'videos' ? source.videoIds.join('\n') : '');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setPlaylistDraft(source.kind === 'playlist' ? source.playlistId : '');
    setVideosDraft(source.kind === 'videos' ? source.videoIds.join('\n') : '');
  }, [source]);

  const summary = source.kind === 'playlist' ? 'YouTube playlist' : `${source.videoIds.length} manually added videos`;
  return <details className="musicSettings">
    <summary>Music source · {summary}</summary>
    <label htmlFor="musicPlaylist">YouTube playlist URL or ID</label>
    <input id="musicPlaylist" type="text" value={playlistDraft} placeholder="https://www.youtube.com/playlist?list=..." onChange={(event) => setPlaylistDraft(event.target.value)} />
    <button type="button" onClick={() => {
      const playlistId = parsePlaylistId(playlistDraft);
      if (!playlistId) {
        setMessage('Enter a public YouTube playlist URL or a valid playlist ID.');
        return;
      }
      onSave({ kind: 'playlist', playlistId });
      setMessage('Playlist saved. The channel will now play all its available videos.');
    }}>Use YouTube playlist</button>

    <span className="musicSettingsDivider">or use individual videos</span>
    <label htmlFor="musicVideos">Video links or IDs, one per line</label>
    <textarea id="musicVideos" rows={5} value={videosDraft} onChange={(event) => setVideosDraft(event.target.value)} />
    <button type="button" onClick={() => {
      const ids = parseMusicVideos(videosDraft);
      const entries = videosDraft.split(/[\s,]+/).filter(Boolean);
      if (!ids.length || entries.some((entry) => !parseMusicVideos(entry).length)) {
        setMessage('Check the entries: use individual YouTube video links or 11-character IDs.');
        return;
      }
      onSave({ kind: 'videos', videoIds: ids });
      setMessage(`List saved with ${ids.length} videos.`);
    }}>Use manual list</button>
    {message && <span role="status">{message}</span>}
  </details>;
}
