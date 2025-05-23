import { useEffect, useState } from 'react';
import './App.css';
import Marquee from "react-fast-marquee";
import { format, parseISO } from 'date-fns';

interface Dolar {
  compra: number,
  venta: number,
  casa: string,
  nombre: string,
  moneda: string,
  fechaActualizacion: string
}

const App: React.FC = () => {
  const apiKey = 'AIzaSyBaReZ7kPFRgXQDIZ3NdbEjtOMb_jS3u2g';
  const [dolarMarquee, setDolarMarquee] = useState<string>();
  const [loading, setLoading] = useState(false);

  //@ts-ignore
  const [channelIds, setchannelIds] = useState<string[]>(["UCba3hpU7EFBSk817y9qZkiA", "UCj6PcyLvpnIRT_2W_mwa9Aw", "UC-rI_XNppHJO-Ga4RW_CDKw", "UCC1kfsMJko54AqxtcFECt-A","UCT7KFGv6s2a-rh2Jq8ZdM1g"]);
  const [videoIds, setvideoIds] = useState<string[]>(['LY2XEQ_SSXA', 'cb12KmMMDJA', 'VRWYe26u_J8', 'WRzbqXaEEVQ', 'avly0uwZzOE']);

  useEffect(() => {
    forceRefresh();
  }, []);

  const fetchDolarData = async (): Promise<void> => {
    await fetch('https://dolarapi.com/v1/dolares')
      .then(response => response.json())
      .then(data => {  

        const filteredData = data.filter((item: Dolar) => {
          return item.casa === "oficial" || item.casa === "blue" || item.casa === "tarjeta";
        });

        const dateString = filteredData[0].fechaActualizacion;
        const dateObject = parseISO(dateString);
        const formattedDate = format(dateObject, 'dd/MM/yyyy HH:mm:ss');

        let dolarInfo = `Actualizado: ${formattedDate}` + filteredData.map((item: Dolar) => {
          return `*** Dolar ${item.casa.charAt(0).toUpperCase() + item.casa.slice(1)} - Compra: ${item.compra} Venta: ${item.venta}  *** `
        }).join("| ");
      
        setDolarMarquee(dolarInfo);

      })
      .catch(error => console.error('Error fetching data:', error));
  };


const getChannelTitle = async (channelId: string): Promise<string> => {
  const url = `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items[0]?.snippet?.title ?? 'Unknown Channel';
};

const forceRefresh = async () => {
  try {
    setLoading(true);
    fetchDolarData();

    const myVideoIds: string[] = [];

    const promises = channelIds.map(async (channelId) => {
      const apiUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
      await new Promise(res => setTimeout(res, 2000));
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.items.length > 0) {
        myVideoIds.push(data.items[0].id.videoId);
      } else {
        const title = await getChannelTitle(channelId);
        console.warn(`No live video found for channel: ${title} (${channelId})`);
      }
    });

    await Promise.all(promises);

    if (myVideoIds.length > 0) {
      setvideoIds(myVideoIds);
    }

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

  return (
    <>
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner">Cargando...</div>
        </div>
      )}

      <div className="myContainer">
        {videoIds && videoIds.map((videoId) => (
            <iframe key={videoId} className="myVideo" src={`https://www.youtube.com/embed/${videoId}?mute=1&enablejsapi=1&autoplay=1`} frameBorder="0" allowFullScreen></iframe>))}        
        <div className="myRow">
          <div className="myColumnDouble">
            <div>
              <Marquee autoFill={false} pauseOnHover={true} pauseOnClick={true} speed={150} className="myMarquee">
                {dolarMarquee && (<h2>{dolarMarquee}</h2>)}
              </Marquee>
            </div>
            <div>
              <Marquee autoFill={false} pauseOnHover={true} pauseOnClick={true} speed={150} className="myMarquee">
                {dolarMarquee && (<h2>{dolarMarquee}</h2>)}
              </Marquee>
            </div>
          </div>
          <div className="myColumn">
            <div className="btn-group-vertical align-items-center justify-content-end" role="group">
              <button onClick={(e) => simulateClickOnIframes('playVideo')(e)}>Play!</button>
              <button onClick={(e) => simulateClickOnIframes('pauseVideo')(e)}>Pause</button>
              <button onClick={(e) => simulateClickOnIframes('stopVideo')(e)}>Stop</button>
              <button onClick={forceRefresh}>Force Refresh</button>
            </div>
          </div>
        </div>        
    </div>
    </>
  )
}

export default App
