interface SmartSyncResult {
  updated: number;
  total: number;
}

type VideoHealthStatus = 'Live' | 'Delayed' | 'Stalled' | 'Reconnecting';

interface HealthCheckResult {
  statuses: Record<string, VideoHealthStatus>;
  recoveredIds: string[];
}

const sendPlayerCommand = (iframe: HTMLIFrameElement | null, action: string) => {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(`{"event":"command","func":"${action}","args":[]}`, '*');
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

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const useYoutubePlayers = (activeAudioVideoId: string) => {
  const controlAllVideos = useCallback((action: string) => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo');
    iframes.forEach((iframe) => sendPlayerCommand(iframe, action));
  }, []);

  const controlSingleVideo = useCallback((action: string, videoId: string) => {
    if (!videoId) return;
    const iframe = document.querySelector<HTMLIFrameElement>(
      `iframe.myVideo[data-video-id="${videoId}"]`
    );
    sendPlayerCommand(iframe, action);
  }, []);

  const unmuteSingleVideo = useCallback((videoId: string) => {
    if (!videoId) return;

    const iframes = document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo');
    iframes.forEach((iframe) => {
      const currentVideoId = iframe.dataset.videoId;
      if (!currentVideoId) return;

      if (currentVideoId === videoId) {
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
      const videoId = iframe.dataset.videoId;
      return Boolean(videoId && videoId !== activeAudioVideoId);
    });

    if (!candidates.length) return { updated: 0, total: 0 };

    const firstCheck = await Promise.all(candidates.map((iframe) => requestPlayerCurrentTime(iframe)));
    await sleep(1200);
    const secondCheck = await Promise.all(candidates.map((iframe) => requestPlayerCurrentTime(iframe)));

    let updated = 0;
    candidates.forEach((iframe, idx) => {
      const t1 = firstCheck[idx];
      const t2 = secondCheck[idx];
      const hasNoTelemetry = typeof t1 !== 'number' || typeof t2 !== 'number';
      const isFrozen = typeof t1 === 'number' && typeof t2 === 'number' && t2 - t1 < 0.35;
      const isStale = hasNoTelemetry || isFrozen;

      if (!isStale) return;

      updated += 1;
      sendPlayerCommand(iframe, 'stopVideo');
      sendPlayerCommand(iframe, 'playVideo');
      sendPlayerCommand(iframe, 'mute');
    });

    return { updated, total: candidates.length };
  }, [activeAudioVideoId]);

  const analyzeAndRecoverPlayers = useCallback(async (): Promise<HealthCheckResult> => {
    const iframes = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe.myVideo'));
    const tracked = iframes.filter((iframe) => Boolean(iframe.dataset.videoId));
    if (!tracked.length) return { statuses: {}, recoveredIds: [] };

    const firstCheck = await Promise.all(tracked.map((iframe) => requestPlayerCurrentTime(iframe)));
    await sleep(1200);
    const secondCheck = await Promise.all(tracked.map((iframe) => requestPlayerCurrentTime(iframe)));

    const statuses: Record<string, VideoHealthStatus> = {};
    const recoveredIds: string[] = [];

    tracked.forEach((iframe, idx) => {
      const videoId = iframe.dataset.videoId;
      if (!videoId) return;

      const t1 = firstCheck[idx];
      const t2 = secondCheck[idx];
      let status: VideoHealthStatus;

      if (typeof t1 !== 'number' || typeof t2 !== 'number') {
        // Missing telemetry is common in some browser/iframe states.
        // Keep status neutral to avoid false alarms.
        status = 'Live';
      } else {
        const delta = t2 - t1;
        if (delta < 0.35) status = 'Stalled';
        else if (delta < 0.9) status = 'Delayed';
        else status = 'Live';
      }

      statuses[videoId] = status;

      if (status === 'Stalled' && videoId !== activeAudioVideoId) {
        sendPlayerCommand(iframe, 'stopVideo');
        sendPlayerCommand(iframe, 'playVideo');
        sendPlayerCommand(iframe, 'mute');
        recoveredIds.push(videoId);
      }
    });

    return { statuses, recoveredIds };
  }, [activeAudioVideoId]);

  return {
    controlAllVideos,
    controlSingleVideo,
    unmuteSingleVideo,
    smartSyncPlayers,
    analyzeAndRecoverPlayers,
  };
};
import { useCallback } from 'react';
