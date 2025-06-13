import { useEffect, useState } from 'react';
import './App.css';

interface Channel {
  channelId: string;  
  title: string;
  videoIds: string[];
  thumbnail?: string;
  description?: string;
}

const App: React.FC = () => {

  const thumbnailSize = "240";  
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [totalVideos, setTotalVideos] = useState(6);

  //@ts-ignore
  const [channels, setChannels] = useState<Channel[]>([
    {
      channelId: "UCba3hpU7EFBSk817y9qZkiA",
      title: "LA NACION",
      videoIds: [],
      thumbnail: `https://yt3.ggpht.com/ytc/AIdro_kqtZB_6WG36RuIrX7Npa_XgoeV-KK74HcQ7m9xWQcKI7E=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`
    },
    {
      channelId: "UCj6PcyLvpnIRT_2W_mwa9Aw",
      title: "Todo Noticias",
      videoIds: [],
      thumbnail: `https://yt3.ggpht.com/OL0n5KS1Yw3200B8OhLyq6Qa_g-aNGhJcuhNQJ2Ym3Ykan1Bptx1_yJrClMlMedhLR_W4cvoOw=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`
    },
    {
      channelId: "UC-rI_XNppHJO-Ga4RW_CDKw",
      title: "El Observador 107.9",
      videoIds: [],
      thumbnail: `https://yt3.ggpht.com/MmlOtGwNdzp-2FlnS4Zk8aCd1JCVlzPo-57bkvRkoywzGmxXaLWSazItM8dkVa7TEAAGkgOQug=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`
    },
    {
      channelId: "UCC1kfsMJko54AqxtcFECt-A",
      title: "Urbana Play 104.3 FM",
      videoIds: [],
      thumbnail: `https://yt3.ggpht.com/FJNJoYpkJJJZ7eQp0nh5X8Ub5XN6Jy4xUCp3OrEiNRoSVb2eSeUxWgW1byhimytcybcM_wB8-yk=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`
    },
    {
      channelId: "UCT7KFGv6s2a-rh2Jq8ZdM1g",
      title: "Crónica TV",
      videoIds: [],
      thumbnail: `https://yt3.ggpht.com/EGyrGJo_3mJxohmZxkP0Ksma9r1J1fU1ORZkGkwJkGJKRyeu6aHTD_Zi-4AodbD0hLRnTzoCWA=s${thumbnailSize}-c-k-c0x00ffffff-no-rj`
    }
  ]);

  const getApiKeyFromStorage = () => {    
    const storedKey = localStorage.getItem('apiKey');
    if (storedKey) {
      setApiKey(storedKey);
      return storedKey;
    } else {
      setShowApiKeyForm(true);
      return null;
    }
  };

    const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      localStorage.setItem('apiKey', apiKeyInput.trim());
      setApiKey(apiKeyInput.trim());
      setShowApiKeyForm(false);
      loadVideos(apiKeyInput.trim());
    }
  };


  useEffect(() => {
    const key = getApiKeyFromStorage();
    if (key) {
      loadVideos(key);
    }
    // eslint-disable-next-line
  }, []);

const loadVideos = async (key: string) => {
  try {
    setLoading(true);   

    const storedChannels = localStorage.getItem('channels');
    if (storedChannels) {
      const parsedChannels: Channel[] = JSON.parse(storedChannels);
      setChannels(parsedChannels);
      const totalVideos = parsedChannels.reduce((sum, channel) => sum + channel.videoIds.length, 0);
      setTotalVideos(totalVideos);
    }
    else {
      forceRefresh(key);
    }
  } catch (error) {
    console.error('Error fetching channel data:', error);
  } finally {
    setLoading(false);
  }
};


const fetchWithRetries = async (url: string, options: RequestInit, retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    await new Promise(res => setTimeout(res, delay));
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data;
    }
    if (attempt === retries) {
      return data;
    }
  }
};

const forceRefresh = async (key: string) => {
  try {
    setLoading(true);

    const updatedChannels = await Promise.all(
      channels.map(async (channel) => {
        const apiUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${channel.channelId}&eventType=live&type=video&key=${key}&_=${Date.now()}`;
        const data = await fetchWithRetries(apiUrl, { cache: "no-store" });

        if (!data.items || data.items.length === 0) {
          return {
            ...channel,
            videoIds: [],
          };
        }
        const videoIds = Array.isArray(data.items)
          ? data.items
              .filter((item: { id: { videoId: any; }; }) => item.id && item.id.videoId)
              .map((item: { id: { videoId: any; }; }) => item.id.videoId)
          : [];

        return {
          ...channel,
          videoIds,
        };
      })
    );

    setChannels(updatedChannels);
    const totalVideos = updatedChannels.reduce((sum, channel) => sum + channel.videoIds.length, 0);
    setTotalVideos(totalVideos);

    localStorage.setItem('channels', JSON.stringify(updatedChannels));

  } catch (error) {
    console.error('Error fetching channel data:', error);
  } finally {
    setLoading(false);
  }
};

  //@ts-ignore
  const simulateClickOnIframes = (action: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('.myVideo');
    iframes.forEach(iframe => {

      const window = iframe?.contentWindow
      
      if (!!window)
        window.postMessage(`{"event":"command","func":"${action}","args":""}`, '*');
    });
  }

  if (showApiKeyForm) {
      return (
        <div className="apiKeyFormContainer">
          <form onSubmit={handleApiKeySubmit}>
            <label>
              Pleasae add your YouTube's API key:
              <input
                type="text"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                required
              />
            </label>
            <button type="submit">Save</button>
          </form>
        </div>
      );
    }

  return (
    <>
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <div className={totalVideos <= 6 ? "videoGrid-2-3" : "videoGrid-3-3"}>
        {channels && channels.map((channel) => (
          channel.videoIds.length === 0 ? (
            <img
              key={channel.channelId}
              className="myVideo"
              src={channel.thumbnail}
              alt={channel.title}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            channel.videoIds.map((videoId) => (
              <iframe
                key={videoId}
                className="myVideo"
                src={`https://www.youtube.com/embed/${videoId}?mute=1&enablejsapi=1&autoplay=1`}
                frameBorder="0"
                allowFullScreen
              />
            ))
          )
        ))}
      </div>

<div className="myRowWrapper" style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 1000 }}>
  <div className="myRow">
    <div>
      <button onClick={(e) => simulateClickOnIframes('playVideo')(e)}>Play!</button>
      <button onClick={(e) => simulateClickOnIframes('pauseVideo')(e)}>Pause</button>
      <button onClick={(e) => simulateClickOnIframes('stopVideo')(e)}>Stop</button>
      <button onClick={() => apiKey && forceRefresh(apiKey)}>Force Refresh</button>
      <button
        onClick={() => {
          if (totalVideos <= 6) {
            setTotalVideos(9);
          } else {
            setTotalVideos(6);
          }
        }}>{totalVideos <= 6 ? "2x3" : "3x3"}
      </button>
    </div>
  </div>
</div>
    </>
  )
}

export default App
