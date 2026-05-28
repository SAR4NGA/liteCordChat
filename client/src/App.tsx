import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSocketStore } from './store/useSocketStore';
import { Home } from './features/gatekeeper/components/Home';
import { JoinInvite } from './features/gatekeeper/components/JoinInvite';
import { RoomPage } from './features/triptych/components/RoomPage';
import { SERVER_URL } from './config';

function App() {
  const { connect, disconnect } = useSocketStore();
  const [serverVersion, setServerVersion] = useState<string>('...');

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    fetch(`${SERVER_URL}/health`)
      .then(res => res.json())
      .then(data => setServerVersion(data.version || '?'))
      .catch(() => setServerVersion('error'));
  }, []);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '15px',
        left: '20px',
        color: 'var(--accent-gray)',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        zIndex: 9999,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        opacity: 0.8
      }}>
        C: 2.05 | S: {serverVersion}
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:roomId" element={<JoinInvite />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </>
  );
}

export default App;
