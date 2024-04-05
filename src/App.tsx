import { useEffect, useState } from 'react';
import './App.css';
import ReactFlipCard from 'reactjs-flip-card'

interface DolarBlue {
  compra: number,
  venta: number,
  casa: string,
  nombre: string,
  moneda: string,
  fechaActualizacion: string
}

const App: React.FC = () => {
  const styles = { card: {background: 'linear-gradient(#00b3ad,rgba(0,255,40,.41))', color: 'white', borderRadius: 20, height: '200px', width: '200px', },}

  const [dolarData, setDolarData] = useState<DolarBlue>({
    compra: 0,
    venta: 0,
    casa: '',
    nombre: '',
    moneda: '',
    fechaActualizacion: ''
  });

  //@ts-ignore
  const [channelIds, setchannelIds] = useState<string[]>(["UCba3hpU7EFBSk817y9qZkiA", "UCj6PcyLvpnIRT_2W_mwa9Aw", "UC-rI_XNppHJO-Ga4RW_CDKw", "UCC1kfsMJko54AqxtcFECt-A","UCT7KFGv6s2a-rh2Jq8ZdM1g"]);

  const [videoIds, setvideoIds] = useState<string[]>(["LY2XEQ_SSXA", "cb12KmMMDJA", "avly0uwZzOE", "dFCOBD0qaxo", "WRzbqXaEEVQ"]);

  useEffect(() => {
    fetchData();    
  }, []);

  const fetchData = async (): Promise<void> => {
    await fetch('https://dolarapi.com/v1/dolares/blue')
      .then(response => response.json())
      .then(data => setDolarData(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  const forceRefresh = async () => {
    try {
      // const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=ElObservador107.9&key=AIzaSyBaReZ7kPFRgXQDIZ3NdbEjtOMb_jS3u2g');
      
      // if (!response.ok) {
      //   throw new Error('Failed to fetch channel data');
      // }
      // const data = await response.json();
      // console.log(data);
      //if (data.items && data.items.length > 0) {
        //const channelIdLocal ='UC-rI_XNppHJO-Ga4RW_CDKw';
        const apiKey = '';

        //const apiUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=UC-rI_XNppHJO-Ga4RW_CDKw&eventType=live&type=video&key=AIzaSyBaReZ7kPFRgXQDIZ3NdbEjtOMb_jS3u2g`;
        // const pepe = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelIdLocal}&eventType=live&type=video&key=${apiKey}`;
        
        // console.log(pepe);
        
        // const apiUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=UC-rI_XNppHJO-Ga4RW_CDKw&eventType=live&type=video&key=${apiKey}`;

        // const response2 = await fetch(pepe);

        // if (!response2.ok) {
        //   throw new Error('Failed to fetch channel data');
        // }
        // const data2 = await response2.json();
        // console.log(data2);
        // console.log(data2.items[0].id.videoId);

      //}

      const myVideoIds = [];
      for (const channelId of channelIds) {        
        const apiUrl = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        myVideoIds.push(data.items[0].id.videoId);
        console.log(myVideoIds);
      }
      if (myVideoIds.length > 0)
        setvideoIds(myVideoIds);


    } catch (error) {
      console.error('Error fetching channel data:', error);
    }
  };

  //@ts-ignore
  const simulateClickOnIframes = (action: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('.video');
    iframes.forEach(iframe => {

      const window = iframe?.contentWindow
      
      if (!!window)
        window.postMessage(`{"event":"command","func":"${action}","args":""}`, '*');
    });
  }

  return (
    <>
      <div className="container">
        {videoIds && videoIds.map((videoId) => (
              <iframe key={videoId} className="video" src={`https://www.youtube.com/embed/${videoId}?mute=1&enablejsapi=1&autoplay=1`} frameBorder="0" allowFullScreen></iframe>
              ))}
        {dolarData && (
          <div className="row">
          <div className="column" >
            <ReactFlipCard
               frontStyle={styles.card}
               backStyle={styles.card}
               frontComponent={
               <div className="toast">
                <div className="title">Dolar Blue</div>
                <div className="content">
                  <p>Fecha: {dolarData.fechaActualizacion}</p>
                  <p>Compra: {dolarData.compra}</p>
                  <p>Venta: {dolarData.venta}</p>                  
                </div>
              </div>}
               backComponent={<div>Back!</div>}
             />
          </div>
          <div className="column" >
            <h2>Column 2</h2>
            <p>Some text..</p>
          </div>
          <div className="column" >
            <h2>Column 3</h2>
              <button onClick={(e) => simulateClickOnIframes('playVideo')(e)}>Play!</button>
              <button onClick={(e) => simulateClickOnIframes('pauseVideo')(e)}>Pause</button>
              <button onClick={(e) => simulateClickOnIframes('stopVideo')(e)}>Stop</button>
              <button onClick={forceRefresh}>Force Refresh</button>
          </div>
        </div>
          

          // <div className="dolar-info">

          //   <ReactFlipCard
          //     frontStyle={styles.card}
          //     backStyle={styles.card}
          //     frontComponent={<div className="toast">
          //     <div className="title">Dolar Blue</div>
          //     <div className="content">
          //       <p>Fecha de actualización: {dolarData.fechaActualizacion}</p>
          //       <p>Compra: {dolarData.compra}</p>
          //       <p>Venta: {dolarData.venta}</p>
          //     </div>
          //   </div>}
          //     backComponent={<div>Back!</div>}
          //   />
          //   <button onClick={(e) => simulateClickOnIframes('playVideo')(e)}>Play!</button>
          //   <button onClick={(e) => simulateClickOnIframes('pauseVideo')(e)}>Pause</button>
          //   <button onClick={(e) => simulateClickOnIframes('stopVideo')(e)}>Stop</button>
          // </div>
        )}
    </div>
    </>
  )
}

export default App
