import { type FC } from 'react';
import type { Channel } from '../model';

interface VideoGridProps {
  channels: Channel[];
  isFocusMode: boolean;
  focusChannelId: string;
}

export const VideoGrid: FC<VideoGridProps> = ({ channels, isFocusMode, focusChannelId }) => {
  const channelsWithLive = channels.filter((channel) => channel.liveVideos.length > 0);
  const focusedChannel = channelsWithLive.find((channel) => channel.channelId === focusChannelId);
  const fallbackFocusedChannel = focusedChannel || channelsWithLive[0];
  const miniChannels = channelsWithLive.filter(
    (channel) => channel.channelId !== fallbackFocusedChannel?.channelId
  );
  const sideMiniLimit = 4;
  const sideMiniChannels = miniChannels.slice(0, sideMiniLimit);
  const overflowMiniChannels = miniChannels.slice(sideMiniLimit);

  if (isFocusMode && fallbackFocusedChannel) {
    const focusedLive = fallbackFocusedChannel.liveVideos[0];
    if (!focusedLive) return null;

    return (
      <div className="focusLayout">
        <div className="focusTop">
          <div className="focusSideColumn">
            {sideMiniChannels.map((channel) => {
              const primaryLive = channel.liveVideos[0];
              if (!primaryLive) return null;

              return (
                <div key={channel.channelId} className="focusSideTile">
                  <iframe
                    className="myVideo"
                    data-channel-id={channel.channelId}
                    src={`https://www.youtube.com/embed/${primaryLive.videoId}?mute=1&enablejsapi=1&autoplay=1&playsinline=1`}
                    title={`${channel.title} live`}
                    frameBorder="0"
                    allowFullScreen
                  />
                  <div className="focusMiniLabel">{channel.title}</div>
                </div>
              );
            })}
          </div>
          <div className="focusMain">
            <iframe
              key={focusedLive.videoId}
              className="myVideo"
              data-channel-id={fallbackFocusedChannel.channelId}
              src={`https://www.youtube.com/embed/${focusedLive.videoId}?mute=1&enablejsapi=1&autoplay=1&playsinline=1`}
              title={`${fallbackFocusedChannel.title} live`}
              frameBorder="0"
              allowFullScreen
            />
            <div className="focusLabel">{fallbackFocusedChannel.title}</div>
          </div>
        </div>

        {overflowMiniChannels.length > 0 && (
          <div className="focusMiniStrip">
            {overflowMiniChannels.map((channel) => {
              const primaryLive = channel.liveVideos[0];
              if (!primaryLive) return null;

              return (
                <div key={channel.channelId} className="focusMiniTile">
                  <iframe
                    className="myVideo"
                    data-channel-id={channel.channelId}
                    src={`https://www.youtube.com/embed/${primaryLive.videoId}?mute=1&enablejsapi=1&autoplay=1&playsinline=1`}
                    title={`${channel.title} live`}
                    frameBorder="0"
                    allowFullScreen
                  />
                  <div className="focusMiniLabel">{channel.title}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

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
          (() => {
            const primaryLive = channel.liveVideos[0];
            if (!primaryLive) return null;
            return (
          <iframe
            key={primaryLive.videoId}
            className="myVideo"
            data-channel-id={channel.channelId}
            src={`https://www.youtube.com/embed/${primaryLive.videoId}?mute=1&enablejsapi=1&autoplay=1&playsinline=1`}
            title={`${channel.title} live`}
            frameBorder="0"
            allowFullScreen
          />
            );
          })()
        )
      )}
    </div>
  );
};

