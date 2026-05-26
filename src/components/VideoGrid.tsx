import { type FC } from 'react';
import type { Channel } from '../model';

interface VideoGridProps {
  channels: Channel[];
}

export const VideoGrid: FC<VideoGridProps> = ({ channels }) => {
  return (
    <div className="videoGrid">
      {channels.map((channel) =>
        channel.liveVideos.length === 0 ? (
          <div key={channel.channelId} className="channelFallback">
            <img
              className="myVideo"
              src={channel.thumbnail}
              alt={channel.title}
              style={{ width: '100%', height: '100%' }}
            />
            <div className="channelLabel">{channel.title}</div>
          </div>
        ) : (
          channel.liveVideos.map((video) => (
            <iframe
              key={video.videoId}
              className="myVideo"
              data-video-id={video.videoId}
              src={`https://www.youtube.com/embed/${video.videoId}?mute=1&enablejsapi=1&autoplay=1&playsinline=1`}
              title={`${channel.title} live`}
              frameBorder="0"
              allowFullScreen
            />
          ))
        )
      )}
    </div>
  );
};

