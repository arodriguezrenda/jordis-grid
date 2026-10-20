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

  const summary = source.kind === 'playlist' ? 'playlist de YouTube' : `${source.videoIds.length} videos manuales`;
  return <details className="musicSettings">
    <summary>Fuente de Música · {summary}</summary>
    <label htmlFor="musicPlaylist">URL o ID de una playlist de YouTube</label>
    <input id="musicPlaylist" type="text" value={playlistDraft} placeholder="https://www.youtube.com/playlist?list=..." onChange={(event) => setPlaylistDraft(event.target.value)} />
    <button type="button" onClick={() => {
      const playlistId = parsePlaylistId(playlistDraft);
      if (!playlistId) {
        setMessage('Pegá una URL pública de playlist de YouTube o un ID válido.');
        return;
      }
      onSave({ kind: 'playlist', playlistId });
      setMessage('Playlist guardada. El canal ahora recorrerá todos sus videos.');
    }}>Usar playlist de YouTube</button>

    <span className="musicSettingsDivider">o usá videos individuales</span>
    <label htmlFor="musicVideos">Enlaces o IDs de videos, uno por línea</label>
    <textarea id="musicVideos" rows={5} value={videosDraft} onChange={(event) => setVideosDraft(event.target.value)} />
    <button type="button" onClick={() => {
      const ids = parseMusicVideos(videosDraft);
      const entries = videosDraft.split(/[\s,]+/).filter(Boolean);
      if (!ids.length || entries.some((entry) => !parseMusicVideos(entry).length)) {
        setMessage('Revisá los enlaces: usá videos individuales de YouTube o IDs de 11 caracteres.');
        return;
      }
      onSave({ kind: 'videos', videoIds: ids });
      setMessage(`Lista guardada con ${ids.length} videos.`);
    }}>Usar lista manual</button>
    {message && <span role="status">{message}</span>}
  </details>;
}
