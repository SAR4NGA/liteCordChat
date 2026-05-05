import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketStore } from '../../../store/useSocketStore';
import { useMediaStream } from '../../voice/hooks/useMediaStream';
import { generateGhostAvatar } from '../../../shared/avatars';
import { sessionStore } from '../../../shared/sessionStore';

export function Home() {
  const { createRoom, joinRoom, room, setLocalStream, lastError, clearError } = useSocketStore();
  const { startStream } = useMediaStream();
  const [userName, setUserName] = useState('');
  const [createRoomId, setCreateRoomId] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Show store-level errors (e.g. "room name already in use") in local error state.
  useEffect(() => {
    if (lastError) {
      setError(lastError);
      clearError();
    }
  }, [lastError, clearError]);

  useEffect(() => {
    if (room) {
      navigate(`/room/${room.id}`);
    }
  }, [room, navigate]);

  const MIC_DENIED_MSG = 'Microphone access is required for voice rooms. Please grant the permission in your browser and try again.';

  const handleCreateRoom = async () => {
    if (!userName.trim()) return setError('Please enter your name first!');
    setError(null);
    const avatar = generateGhostAvatar();
    const stream = await startStream();
    if (!stream) {
      setError(MIC_DENIED_MSG);
      return;
    }
    setLocalStream(stream);
    sessionStore.save({ roomId: createRoomId, userName, avatar });
    createRoom(userName, avatar, createRoomId || undefined);
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) return setError('Please enter your name at the top first!');
    if (!roomIdInput.trim()) return setError('Please enter a Room ID to join!');
    setError(null);
    const avatar = generateGhostAvatar();
    const stream = await startStream();
    if (!stream) {
      setError(MIC_DENIED_MSG);
      return;
    }
    setLocalStream(stream);
    sessionStore.save({ roomId: roomIdInput, userName, avatar });
    joinRoom(roomIdInput, userName, avatar);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '20px',
      background: 'radial-gradient(circle at center, var(--bg-surface) 0%, var(--bg-darker) 100%)'
    }}>
      <div style={{ 
        maxWidth: '400px', 
        width: '100%',
        background: 'var(--bg-dark)',
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontFamily: "'Comfortaa', sans-serif", 
            letterSpacing: '-0.02em', 
            marginBottom: '8px',
            fontWeight: 700
          }}>
            Lite<span style={{ fontWeight: 'bolder' }}>Cord</span><span style={{ fontSize: '0.5em', opacity: 0.7 }}>Chat</span>
          </h1>
          <p style={{ fontSize: '0.9rem' }}>Instant, temporary, P2P voice rooms.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--accent-red)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '20px',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-gray)', textTransform: 'uppercase', marginLeft: '8px', marginBottom: '8px', letterSpacing: '0.05em' }}>  Name<label style={{ color: 'var(--accent-red)' }}> *</label></label>
          <input 
            placeholder="Your Display Name" 
            value={userName} 
            onChange={e => setUserName(e.target.value)}
            style={{ fontSize: '1.1rem', padding: '12px 16px' }}
          />
        </div>

        <div style={{ padding: '24px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-dim)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-white)', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.1em' }}>Room Options</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                placeholder="Room Name (Optional)" 
                value={createRoomId} 
                onChange={e => setCreateRoomId(e.target.value)} 
              />
              <button className="primary" onClick={handleCreateRoom} style={{ width: '100%' }}>Create New Room</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
              OR
              <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                placeholder="Room ID" 
                value={roomIdInput} 
                onChange={e => setRoomIdInput(e.target.value)} 
              />
              <button onClick={handleJoinRoom} style={{ minWidth: '80px' }}>Join</button>
            </div>
          </div>
        </div>
      </div>
      
      <footer style={{ marginTop: '40px', color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
        SECURE P2P · NO ACCOUNTS · ZERO LOGS
      </footer>
    </div>
  );
}

