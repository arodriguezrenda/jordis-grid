import { useEffect, useState } from 'react';
import './App.css';

interface DolarBlue {
  compra: number,
  venta: number,
  casa: string,
  nombre: string,
  moneda: string,
  fechaActualizacion: string
}

const App: React.FC = () => {
  const [dolarData, setDolarData] = useState<DolarBlue>({
    compra: 0,
    venta: 0,
    casa: '',
    nombre: '',
    moneda: '',
    fechaActualizacion: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    await fetch('https://dolarapi.com/v1/dolares/blue')
      .then(response => response.json())
      .then(data => setDolarData(data))
      .catch(error => console.error('Error fetching data:', error));
  };

  const simulateClickOnIframes = (action: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>('.video');
    iframes.forEach(iframe => {
      console.log(event);
      const window = iframe?.contentWindow
      
      if (!!window)
        window.postMessage(`{"event":"command","func":"${action}","args":""}`, '*');
    });
  }

  return (
    <>
      <div className="container">        
        <iframe className="video" src="https://www.youtube.com/embed/LY2XEQ_SSXA?mute=1&enablejsapi=1&autoplay=1" frameBorder="0" allowFullScreen></iframe>
        <iframe className="video" src="https://www.youtube.com/embed/cb12KmMMDJA?mute=1&enablejsapi=1&autoplay=1" frameBorder="0" allowFullScreen></iframe>
        <iframe className="video" src="https://www.youtube.com/embed/avly0uwZzOE?mute=1&enablejsapi=1&autoplay=1" frameBorder="0" allowFullScreen></iframe>
        <iframe className="video" src="https://www.youtube.com/embed/70GirogAfHQ?mute=1&enablejsapi=1&autoplay=1" frameBorder="0" allowFullScreen></iframe>
        <iframe className="video" src="https://www.youtube.com/embed/KCIwicDYO9I?mute=1&enablejsapi=1&autoplay=1" frameBorder="0" allowFullScreen></iframe>
        {dolarData && (
          <div className="dolar-info">
            <p>Dolar Blue</p>
            <p>Fecha de actualización: {dolarData.fechaActualizacion}</p>
            <p>Compra: {dolarData.compra}</p>
            <p>Venta: {dolarData.venta}</p>
            <button onClick={(e) => simulateClickOnIframes('playVideo')(e)}>Play</button>
            <button onClick={(e) => simulateClickOnIframes('pauseVideo')(e)}>Pause</button>
            <button onClick={(e) => simulateClickOnIframes('stopVideo')(e)}>Stop</button>
          </div>
        )}
    </div>
    </>
  )
}

export default App
