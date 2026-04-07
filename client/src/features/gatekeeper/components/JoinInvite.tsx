import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocketStore } from '../../../store/useSocketStore';
import { useMediaStream } from '../../voice/hooks/useMediaStream';
import { generateGhostAvatar } from '../../../shared/avatars';
import { sessionStore } from '../../../shared/sessionStore';

export function JoinInvite() {
  const { roomId } = useParams();
  const { joinRoom, knock, room, knockStatus, knockToken, setLocalStream } = useSocketStore();
  const { startStream } = useMediaStream();
  const [userName, setUserName] = useState('');
  const [avatar] = useState(() => generateGhostAvatar());
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (room) {
      navigate(`/room/${room.id}`);
    }
  }, [room, navigate]);

  useEffect(() => {
    const initJoin = async () => {
      if (knockStatus === 'approved' && knockToken && roomId) {
        const stream = await startStream();
        setLocalStream(stream);
        sessionStore.save({ roomId, userName, avatar, token: knockToken });
        joinRoom(roomId, userName, avatar, knockToken);
      }
    };
    initJoin();
  }, [knockStatus, knockToken, roomId, joinRoom, userName, avatar, startStream, setLocalStream]);

  const handleJoinDirectly = async () => {
    if (!userName.trim()) return setError('Please enter your name first!');
    setError(null);
    if (roomId) {
      const stream = await startStream();
      setLocalStream(stream);
      sessionStore.save({ roomId, userName, avatar });
      joinRoom(roomId, userName, avatar);
    }
  };

  const handleKnock = () => {
    if (!userName.trim()) return setError('Please enter your name first!');
    setError(null);
    if (roomId) {
      knock(roomId, userName, avatar);
    }
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
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Join Room</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Room ID: <code style={{ color: 'var(--accent-blue)' }}>{roomId}</code>
          </p>
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

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Your Identity</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg-surface)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: avatar, boxShadow: '0 0 10px rgba(255,255,255,0.1)' }} />
            <input 
              placeholder="Enter your name" 
              value={userName} 
              onChange={e => setUserName(e.target.value)} 
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {knockStatus === 'idle' && (
            <>
              <button className="primary" onClick={handleJoinDirectly}>Join Directly</button>
              <button onClick={handleKnock}>Knock to Enter</button>
            </>
          )}

          {knockStatus === 'pending' && (
            <div style={{ textAlign: 'center', padding: '20px', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-md)' }}>
              <div className="pulse-animation" style={{ marginBottom: '10px', color: 'var(--accent-blue)', fontWeight: 'bold' }}>PENDING APPROVAL</div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Waiting for host to let you in...</p>
            </div>
          )}

          {knockStatus === 'denied' && (
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ marginBottom: '10px', color: 'var(--accent-red)', fontWeight: 'bold' }}>ACCESS DENIED</div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>The host has declined your request.</p>
              <button onClick={() => navigate('/')} style={{ marginTop: '15px' }}>Go Back</button>
            </div>
          )}

          {knockStatus === 'approved' && (
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--accent-green)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>APPROVED</div>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Joining the mesh...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
