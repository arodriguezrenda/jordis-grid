import { useCallback } from 'react';

interface SmartSyncResult {
  updated: number;
  total: number;
}

interface HealthCheckResult {
  recoveredIds: string[];
}

const sendPlayerCommand = (iframe: HTMLIFrameElement | null, action: string) => {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(`{"event":"command","func":"${action}","args":[]}`, '*');
};

const sendPlayerCommandWithArgs = (iframe: HTMLIFrameElement | null, action: string, args: Array<number | boolean>) => {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: action, args }),
    '*'
  );
};

const requestPlayerCurrentTime = (iframe: HTMLIFrameElement): Promise<number | null> => {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, 900);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      let payload: any = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      const maybeTime = payload?.info?.currentTime;
      if (typeof maybeTime === 'number') {
        window.clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);
        resolve(maybeTime);
      }
    };

    window.addEventListener('message', handleMessage);
    iframe.contentWindow?.postMessage('{"event":"command","func":"getCurrentTime","args":[]}', '*');
  });
};

const requestPlayerDuration = (iframe: HTMLIFrameElement): Promise<number | null> => {
  return new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve(null);
    }, 900);

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;

      let payload: any = event.data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      const maybeDuration = payload?.info?.duration;
      if (typeof maybeDuration === 'number') {
        window.clearTimeout(timeoutId);
        window.removeEventListener('message', handleMessage);
        resolve(maybeDuration);
      }
    };

    window.addEventListener('message', handleMessage);
    iframe.contentWindow?.postMessage('{"event":"command","func":"getDuration","args":[]}', '*');
  });
};

const findIframeByChannelId = (channelId: string) =>
  document.querySelector<HTMLIFrameElement>(`iframe.myVideo[data-channel-id="${channelId}"]`);

export const useYoutubePlayers = (activeAudioChannelId: string) => {
  const controlAllVideos = useCallback((action: string) => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo');
    iframes.forEach((iframe) => sendPlayerCommand(iframe, action));
  }, []);

  const controlSingleVideo = useCallback((action: string, channelId: string) => {
    if (!channelId) return;
    const iframe = findIframeByChannelId(channelId);
    sendPlayerCommand(iframe, action);
  }, []);

  const unmuteSingleVideo = useCallback((channelId: string) => {
    if (!channelId) return;

    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo');
    iframes.forEach((iframe) => {
      const currentChannelId = iframe.dataset.channelId;
      if (!currentChannelId) return;

      if (currentChannelId === channelId) {
        sendPlayerCommand(iframe, 'unMute');
        sendPlayerCommand(iframe, 'playVideo');
      } else {
        sendPlayerCommand(iframe, 'mute');
      }
    });
  }, []);

  const smartSyncPlayers = useCallback(async (): Promise<SmartSyncResult> => {
    const allIframes = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo'));
    const candidates = allIframes.filter((iframe) => {
      const channelId = iframe.dataset.channelId;
      return Boolean(channelId && channelId !== activeAudioChannelId);
    });

    if (!candidates.length) return { updated: 0, total: 0 };

    const [times, durations] = await Promise.all([
      Promise.all(candidates.map((iframe) => requestPlayerCurrentTime(iframe))),
      Promise.all(candidates.map((iframe) => requestPlayerDuration(iframe))),
    ]);

    let updated = 0;
    const lagThresholdSeconds = 12;

    candidates.forEach((iframe, idx) => {
      const currentTime = times[idx];
      const duration = durations[idx];
      const canMeasureLag = typeof currentTime === 'number' && typeof duration === 'number' && duration > 0;
      const lagSeconds = canMeasureLag ? Math.max(0, (duration as number) - (currentTime as number)) : null;
      const isLagging = typeof lagSeconds === 'number' && lagSeconds > lagThresholdSeconds;

      if (canMeasureLag && !isLagging) return;

      updated += 1;
      // Push player to near live edge if possible, then ensure playback continues muted.
      if (typeof duration === 'number' && duration > 3) {
        sendPlayerCommandWithArgs(iframe, 'seekTo', [Math.max(0, duration - 1), true]);
      } else {
        sendPlayerCommand(iframe, 'stopVideo');
      }
      sendPlayerCommand(iframe, 'playVideo');
      sendPlayerCommand(iframe, 'mute');
    });

    return { updated, total: candidates.length };
  }, [activeAudioChannelId]);

  const analyzeAndRecoverPlayers = useCallback(async (): Promise<HealthCheckResult> => {
    // Keep this passive to avoid visual flicker from aggressive stop/play cycles.
    // Recovery is handled by controlled API refresh from App logic.
    return { recoveredIds: [] };
  }, [activeAudioChannelId]);

  return {
    controlAllVideos,
    controlSingleVideo,
    unmuteSingleVideo,
    smartSyncPlayers,
    analyzeAndRecoverPlayers,
  };
};
