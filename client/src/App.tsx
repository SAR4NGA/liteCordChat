import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSocketStore } from './store/useSocketStore';
import { Home } from './features/gatekeeper/components/Home';
import { JoinInvite } from './features/gatekeeper/components/JoinInvite';
import { RoomPage } from './features/triptych/components/RoomPage';

function App() {
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/join/:roomId" element={<JoinInvite />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
    </Routes>
  );
}

export default App;
