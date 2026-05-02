import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocketStore, getSocketState } from '../../../store/useSocketStore';
import { useMediaStream } from '../../voice/hooks/useMediaStream';
import { useWebRTC } from '../../voice/hooks/useWebRTC';
import { useDataMonitor } from '../../voice/hooks/useDataMonitor';
import { audioEngine } from '../../voice/utils/audio-engine';
import { sessionStore } from '../../../shared/sessionStore';

/** Small muted/volume indicator shown next to each member card. */
function MicVolumeIcon({ peerId: _peerId, isMuted }: { peerId: string; isMuted: boolean }) {
  return (
    <span
      className="material-icons-outlined"
      title={isMuted ? 'Muted' : 'Live'}
      style={{
        fontSize: '1rem',
        color: isMuted ? 'var(--accent-red)' : 'var(--accent-green)',
        opacity: isMuted ? 0.8 : 1,
      }}
    >
      {isMuted ? 'mic_off' : 'mic'}
    </span>
  );
}

export function RoomPage() {
  const { roomId: urlRoomId } = useParams<{ roomId: string }>();
  const { room, socket, joinRoom, toggleMute: toggleSocketMute, pendingKnocks, approveKnock, denyKnock, toggleLock, burnRoom, leaveRoom, moveArea, localStream, setLocalStream, lastError, clearError } = useSocketStore();
  const { startStream } = useMediaStream();
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isBackchannelActive, setIsBackchannelActive] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const rejoinAttempted = useRef(false);
  // Stable ref mirror of isRejoining — lets effect 3 check it without
  // racing against React's async state batching on the first render.
  const isRejoiningRef = useRef(false);
  const navigate = useNavigate();

  // On mount: if room state is missing (e.g. after a refresh), try to rejoin
  // using credentials saved in sessionStorage.
  useEffect(() => {
    if (room || rejoinAttempted.current) return;
    rejoinAttempted.current = true;

    const saved = sessionStore.load();
    const targetRoomId = urlRoomId || saved?.roomId;

    if (saved && targetRoomId) {
      isRejoiningRef.current = true;
      setIsRejoining(true);
      startStream().then(stream => {
        setLocalStream(stream);
        joinRoom(targetRoomId, saved.userName, saved.avatar, saved.token);
      });
    } else {
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once room loads after rejoin, clear the rejoining flag.
  // Also update sessionStorage with the actual roomId (important for hosts
  // who only had roomId='' saved before ROOM_CREATED came back).
  // Also resume the AudioContext — the user just interacted (clicked a button)
  // so browsers will allow AudioContext to start here.
  useEffect(() => {
    if (room) {
      isRejoiningRef.current = false;
      setIsRejoining(false);
      audioEngine.resume();
      const saved = sessionStore.load();
      if (saved && saved.roomId !== room.id) {
        sessionStore.save({ ...saved, roomId: room.id });
      }
    }
  }, [room]);

  // If still no room after reconnect settled and rejoin didn't work → go home.
  // IMPORTANT: We check isRejoiningRef.current (a ref) instead of the isRejoining
  // state here, because on the very first render all effects run before React
  // flushes the setIsRejoining(true) call from effect 1 — meaning isRejoining
  // would still be `false` even though a rejoin is already in-flight.
  useEffect(() => {
    if (!room && !isRejoiningRef.current && rejoinAttempted.current) {
      sessionStore.clear();
      navigate('/');
    }
  }, [room, isRejoining, navigate]);

  // Global Audio Autoplay & Background Resurrection Handlers
  useEffect(() => {
    // 1. Browser Autoplay Policy: If the user did a hard refresh, AudioContext is suspended
    //    until a user gesture. This listener catches any tap anywhere on the screen.
    const handleInteraction = () => audioEngine.resume();
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    // 2. Mobile Backgrounding: iOS Safari suspends Web Audio when the app is backgrounded.
    //    We must explicitly resume it when the tab becomes visible again.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        audioEngine.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Derive isMuted from room state for the current user
  const currentUser = room?.members.find(m => m.id === socket?.id);
  const isMuted = currentUser?.isMuted ?? false;

  const handleToggleMute = useCallback(() => {
    // Toggle the actual audio track on the local stream
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // flip: if currently muted, enable; if unmuted, disable
      });
    }
    toggleSocketMute();
    // Resume AudioContext on user interaction (browser autoplay policy)
    audioEngine.resume();
  }, [localStream, isMuted, toggleSocketMute]);

  const handleBurnRoom = () => {
    if (window.confirm('Are you sure you want to BURN this room? Everyone will be disconnected and the room will be deleted forever.')) {
      burnRoom();
    }
  };

  const handleLeaveRoom = useCallback(() => {
    audioEngine.stop();
    leaveRoom();
    navigate('/');
  }, [leaveRoom, navigate]);

  const areas: Array<{ id: 'lobby' | 'team-1' | 'team-2', label: string }> = [
    { id: 'lobby', label: 'Lobby' },
    { id: 'team-1', label: 'Team Alpha' },
    { id: 'team-2', label: 'Team Bravo' },
  ];

  const handleRemoteStream = useCallback(async (peerId: string, stream: MediaStream) => {
    console.log(`[RoomPage] Remote stream from ${peerId} — ${stream.getAudioTracks().length} audio tracks`);
    // Compute the correct initial mute state NOW using live store state rather
    // than always starting muted. This avoids the race where the area-gating
    // effect fires before room state is ready and leaves the peer silent forever.
    const storeState = getSocketState();
    const myUser = storeState.room?.members.find(m => m.id === storeState.socket?.id);
    const peer   = storeState.room?.members.find(m => m.id === peerId);
    // Default to NOT muted when we don't have enough info yet — better to
    // briefly hear someone in the wrong area than to permanently silence them.
    const startMuted = myUser && peer ? peer.roomArea !== myUser.roomArea : false;
    console.log(`[RoomPage] setupPeer ${peerId} startMuted=${startMuted} (myArea=${myUser?.roomArea} peerArea=${peer?.roomArea})`);
    await audioEngine.setupPeer(peerId, stream, 'team', startMuted);
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.set(peerId, stream);
      return next;
    });
  }, []);

  const handleBackchannelStream = useCallback(async (peerId: string, stream: MediaStream) => {
    console.log(`[RoomPage] Backchannel stream from ${peerId}`);
    await audioEngine.setupPeer(`bc-${peerId}`, stream, 'backchannel');
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.set(`bc-${peerId}`, stream);
      return next;
    });
  }, []);

  const handlePeerLeft = useCallback((peerId: string) => {
    audioEngine.removePeer(peerId);
    audioEngine.removePeer(`bc-${peerId}`);
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(peerId);
      next.delete(`bc-${peerId}`);
      return next;
    });
  }, []);

  const { peerConnections, sendBackchannel } = useWebRTC({
    localStream,
    onRemoteStream: handleRemoteStream,
    onPeerLeft: handlePeerLeft,
    onBackchannelStream: handleBackchannelStream
  });

  const dataStats = useDataMonitor(peerConnections);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm' && document.activeElement?.tagName !== 'INPUT') {
        handleToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleMute]);

  // Keyboard PTT for Backchannel
  useEffect(() => {
    if (!currentUser?.isTeamAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b' && !isBackchannelActive) {
        setIsBackchannelActive(true);
        sendBackchannel(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b' && isBackchannelActive) {
        setIsBackchannelActive(false);
        sendBackchannel(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentUser?.isTeamAdmin, isBackchannelActive, sendBackchannel]);

  // Area-based audio gating
  useEffect(() => {
    // Guard: if we don't know who we are yet, leave all peers muted (safe default via startMuted)
    // rather than accidentally opening audio while room state is loading.
    if (!room || !currentUser) return;

    remoteStreams.forEach((_stream, peerId) => {
      const isBackchannel = peerId.startsWith('bc-');
      const realPeerId = isBackchannel ? peerId.replace('bc-', '') : peerId;
      const peer = room.members.find(m => m.id === realPeerId);

      const isSameArea = !peer || peer.roomArea === currentUser.roomArea;
      const shouldHear = isSameArea || isBackchannel;

      // Use audioEngine.setMuted() — NOT track.enabled.
      // Once a MediaStreamAudioSourceNode is created from a stream, the Web Audio
      // graph owns the audio. Setting track.enabled on the original MediaStreamTrack
      // has no effect on the AudioContext output. We must gate via the gain node.
      audioEngine.setMuted(peerId, !shouldHear);
    });

    audioEngine.resume();
  }, [remoteStreams, room, currentUser]);

  // Cleanup AudioEngine on unmount — call stop() to also close the AudioContext
  // so a fresh one is created next time (avoids reusing a stale suspended context).
  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  if (!room) {
    if (isRejoining) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#09090b', color: '#fff', fontFamily: 'monospace' }}>
          <h2>REJOINING MESH...</h2>
        </div>
      );
    }
    return null;
  }

  const inviteLink = `${window.location.origin}/join/${room.id}`;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '15px 25px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            ROOM: <span style={{ color: 'var(--accent-lgreen)' }}>{room.id}</span>
          </h1>
          <div style={{
            padding: '4px 10px',
            borderRadius: '20px',
            background: room.isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${room.isLocked ? 'var(--accent-red)' : 'var(--accent-green)'}`,
            fontSize: '0.7rem',
            fontWeight: 'bold',
            color: room.isLocked ? 'var(--accent-red)' : 'var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span className="material-icons-outlined" style={{ fontSize: '1rem' }}>
              {room.isLocked ? 'lock' : 'lock_open'}
            </span>
            {room.isLocked ? 'LOCKED' : 'OPEN'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            background: 'var(--bg-dark)',
            padding: '8px 15px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem'
          }}>
            <div title="Data Rate" style={{ color: dataStats.localHealth === 'good' ? 'var(--accent-green)' : 'var(--accent-yellow)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1.1rem' }}>bolt</span> {dataStats.rateKbps} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>KBPS</span>
            </div>
            <div style={{ width: '1px', height: '15px', background: 'var(--border-subtle)' }} />
            <div title="Total Data" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-icons-outlined" style={{ fontSize: '1.1rem' }}>analytics</span> {(dataStats.totalBytes / 1048576).toFixed(2)} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>MB</span>
            </div>
            {dataStats.localHealth !== 'good' && (
              <>
                <div style={{ width: '1px', height: '15px', background: 'var(--border-subtle)' }} />
                <div style={{ color: 'var(--accent-red)', fontWeight: 'bold', animation: 'blink 1s infinite', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-icons-outlined" style={{ fontSize: '1.1rem' }}>warning</span> LOW B/W
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleToggleMute}
            className={isMuted ? '' : 'primary'}
            style={{ minWidth: '130px' }}
          >
            <span className="material-icons-outlined">
              {isMuted ? 'mic_off' : 'mic'}
            </span>
            {isMuted ? 'UNMUTE' : 'MUTE'}
          </button>

          <button
            onClick={handleLeaveRoom}
            className="danger"
            title="Leave Room"
            style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span className="material-icons-outlined">logout</span>
            LEAVE
          </button>

          {socket?.id === room.hostId && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={toggleLock} style={{ padding: '8px' }} title={room.isLocked ? 'Unlock Room' : 'Lock Room'}>
                <span className="material-icons-outlined">
                  {room.isLocked ? 'lock_open' : 'lock'}
                </span>
              </button>
              <button onClick={handleBurnRoom} className="danger" style={{ padding: '8px' }} title="Burn Room">
                <span className="material-icons-outlined">local_fire_department</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={{
        background: 'var(--bg-surface)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '30px',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid var(--border-dim)',
        gap: '15px'
      }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}>Invite Link</span>
        <code style={{ flex: 1, background: 'var(--bg-dark)', padding: '6px 12px' }}>{inviteLink}</code>
        <button onClick={copyInvite} style={{ padding: '5px 15px', fontSize: '0.75rem' }}>COPY</button>
      </div>

      <div className="triptych-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', flex: 1, minHeight: '500px' }}>
        {areas.map(area => (
          <div key={area.id} style={{
            background: currentUser?.roomArea === area.id ? 'rgba(59, 130, 246, 0.03)' : 'var(--bg-dark)',
            border: currentUser?.roomArea === area.id ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all var(--transition-normal)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {currentUser?.roomArea === area.id && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent-blue)' }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: currentUser?.roomArea === area.id ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                {area.label}
              </h2>
              {currentUser?.roomArea !== area.id && (
                <button onClick={() => moveArea(area.id)} style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'transparent', backgroundColor: 'var(--accent-lgreen)' }}>Join +</button>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {room.members.filter(m => m.roomArea === area.id).map(m => {
                const peerStats = dataStats.peers.get(m.id);
                const isSpeaking = peerStats?.isSpeaking;
                const health = peerStats?.health || 'good';

                return (
                  <div key={m.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: isSpeaking ? 'var(--bg-surface-elevated)' : 'rgba(255,255,255,0.02)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSpeaking ? 'var(--accent-green)' : m.isTeamAdmin ? 'var(--accent-green)' : 'var(--border-dim)'}`,
                    boxShadow: isSpeaking ? '0 0 15px rgba(34, 197, 94, 0.1)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'relative', marginRight: '12px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: m.avatar || '#333',
                        border: '2px solid var(--bg-dark)',
                        zIndex: 2,
                        position: 'relative'
                      }} />
                      {isSpeaking && (
                        <div className="speaking-ring" style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '-4px',
                          right: '-4px',
                          bottom: '-4px',
                          borderRadius: '50%',
                          border: '2px solid var(--accent-green)',
                          zIndex: 1
                        }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: isSpeaking ? 'bold' : 'normal',
                        color: isSpeaking ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '0.9rem'
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.name} {m.id === socket?.id ? '(YOU)' : ''}
                        </span>
                        {m.isTeamAdmin && <span className="material-icons-outlined" title="Team Admin" style={{ color: 'var(--accent-yellow)', fontSize: '1rem' }}>star</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                        {peerStats?.latency && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {peerStats.latency}MS
                          </span>
                        )}
                        {health !== 'good' && (
                          <span style={{ color: health === 'poor' ? 'var(--accent-red)' : 'var(--accent-yellow)', fontSize: '0.65rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '0.8rem' }}>bolt</span> {health.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MicVolumeIcon peerId={m.id} isMuted={m.isMuted} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {currentUser?.isTeamAdmin && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: isBackchannelActive ? 'var(--accent-red)' : 'var(--bg-surface-elevated)',
          color: 'white',
          padding: '12px 30px',
          borderRadius: '40px',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          border: '1px solid var(--border-accent)',
          transition: 'all 0.1s ease'
        }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isBackchannelActive ? 'white' : 'var(--accent-blue)',
            boxShadow: isBackchannelActive ? '0 0 10px white' : 'none',
            animation: isBackchannelActive ? 'blink 0.5s infinite' : 'none'
          }} />
          {isBackchannelActive ? 'BACKCHANNEL ACTIVE' : 'HOLD "B" FOR BACKCHANNEL'}
        </div>
      )}

      {socket?.id === room.hostId && pendingKnocks.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '100px',
          right: '30px',
          width: '320px',
          background: 'var(--bg-surface)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--accent-gray)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 900,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-yellow)', marginBottom: '15px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '10px' }}>
            Pending Knocks ({pendingKnocks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingKnocks.map(k => (
              <div key={k.id} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-dark)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-dim)' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: k.avatar || '#333',
                  marginRight: '12px'
                }} />
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.name}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => approveKnock(k.id, k.name)} style={{ padding: '4px 8px', background: 'var(--accent-green)', color: 'white', border: 'none' }}>✓</button>
                  <button onClick={() => denyKnock(k.id)} style={{ padding: '4px 8px', background: 'var(--accent-red)', color: 'white', border: 'none' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`static-fade-overlay ${dataStats.localHealth === 'poor' ? 'active' : ''}`} />

      {/* Server error toast */}
      {lastError && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--accent-red)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.85rem',
          fontWeight: 'bold',
          maxWidth: '90vw',
        }}>
          <span className="material-icons-outlined" style={{ fontSize: '1.1rem' }}>error</span>
          {lastError}
          <button
            onClick={clearError}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
          >✕</button>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        @keyframes speaking-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .speaking-ring {
          animation: speaking-ring 1s infinite;
        }
      `}</style>
    </div>
  );
}