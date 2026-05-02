import { useEffect, useRef, useCallback } from 'react';
import { useSocketStore } from '../../../store/useSocketStore';
import { SOCKET_EVENTS, User } from '@shared/index';

interface UseWebRTCOptions {
  localStream: MediaStream | null;
  onRemoteStream: (peerId: string, stream: MediaStream) => Promise<void> | void;
  onPeerLeft: (peerId: string) => void;
  onBackchannelStream?: (peerId: string, stream: MediaStream) => Promise<void> | void;
}

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
];

export const useWebRTC = ({ localStream, onRemoteStream, onPeerLeft, onBackchannelStream }: UseWebRTCOptions) => {
  const { socket, room } = useSocketStore();
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const bcs = useRef<Map<string, RTCPeerConnection>>(new Map()); // Backchannel connections
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const ignoreOffer = useRef<Map<string, boolean>>(new Map());

  // Use a ref for socket so PC event handlers always access the live socket
  // without needing to be recreated every time the socket reference changes.
  const socketRef = useRef(socket);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  // Stable refs for callbacks — keeps createPeerConnection stable and prevents
  // all peer connections from being inadvertently recreated on every render.
  const onRemoteStreamRef = useRef(onRemoteStream);
  const onBackchannelStreamRef = useRef(onBackchannelStream);
  useEffect(() => { onRemoteStreamRef.current = onRemoteStream; }, [onRemoteStream]);
  useEffect(() => { onBackchannelStreamRef.current = onBackchannelStream; }, [onBackchannelStream]);

  const createPeerConnection = useCallback((peerId: string, isPolite: boolean, isBackchannel = false) => {
    const targetMap = isBackchannel ? bcs : pcs;
    if (targetMap.current.has(peerId)) return targetMap.current.get(peerId)!;

    console.log(`[WebRTC${isBackchannel ? '-BC' : ''}] Creating PC with ${peerId} (polite=${isPolite})`);
    const pc = new RTCPeerConnection({ iceServers });
    targetMap.current.set(peerId, pc);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && socketRef.current) {
        const event = isBackchannel ? SOCKET_EVENTS.BACKCHANNEL : SOCKET_EVENTS.SIGNAL;
        socketRef.current.emit(event, { to: peerId, signal: { candidate } });
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOffer.current.set(peerId, true);
        await pc.setLocalDescription();
        if (socketRef.current) {
          const event = isBackchannel ? SOCKET_EVENTS.BACKCHANNEL : SOCKET_EVENTS.SIGNAL;
          socketRef.current.emit(event, { to: peerId, signal: { description: pc.localDescription } });
        }
      } catch (err) {
        console.error(`[WebRTC${isBackchannel ? '-BC' : ''}] Negotiation error with ${peerId}:`, err);
      } finally {
        makingOffer.current.set(peerId, false);
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      console.log(`[WebRTC] Track from ${peerId}: kind=${event.track.kind} isBackchannel=${isBackchannel} streams=${event.streams.length}`);

      if (isBackchannel) {
        onBackchannelStreamRef.current?.(peerId, remoteStream);
      } else {
        onRemoteStreamRef.current(peerId, remoteStream);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC${isBackchannel ? '-BC' : ''}] Connection state with ${peerId}: ${pc.connectionState}`);
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC${isBackchannel ? '-BC' : ''}] ICE state with ${peerId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        // Boost Opus audio quality to 96 kbps (default ~32 kbps is thin)
        pc.getSenders().forEach(sender => {
          if (sender.track?.kind !== 'audio') return;
          const params = sender.getParameters();
          if (!params.encodings.length) params.encodings = [{}];
          params.encodings[0].maxBitrate = 96_000;
          sender.setParameters(params).catch(e =>
            console.warn('[WebRTC] setParameters error:', e)
          );
        });
      }
    };

    // Add local tracks for normal (non-backchannel) connections
    if (localStream && !isBackchannel) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
        console.log(`[WebRTC] Added local ${track.kind} track to PC with ${peerId}`);
      });
    }

    return pc;
  // Intentionally exclude onRemoteStream/onBackchannelStream — we use stable refs.
  // Exclude socket — we use socketRef.
  // Only recreate when localStream changes (need to add new tracks).
  }, [localStream]);

  // ── Signal handler effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !socket.id) return;

    const processSignal = async (
      pc: RTCPeerConnection,
      from: string,
      signal: any,
      event: string,
      isBackchannel: boolean,
    ) => {
      try {
        if (signal.description) {
          const description = signal.description as RTCSessionDescriptionInit;
          const offerCollision =
            description.type === 'offer' &&
            (makingOffer.current.get(from) || pc.signalingState !== 'stable');

          // For collision resolution we check the right map
          const targetMap = isBackchannel ? bcs : pcs;
          const isImpolite = socket.id! > from;
          ignoreOffer.current.set(
            `${isBackchannel ? 'bc-' : ''}${from}`,
            !targetMap.current.has(from) || (offerCollision && isImpolite),
          );

          if (ignoreOffer.current.get(`${isBackchannel ? 'bc-' : ''}${from}`)) return;

          await pc.setRemoteDescription(description);
          if (description.type === 'offer') {
            await pc.setLocalDescription();
            socket.emit(event, { to: from, signal: { description: pc.localDescription } });
          }
        } else if (signal.candidate) {
          try {
            await pc.addIceCandidate(signal.candidate);
          } catch (err) {
            if (!ignoreOffer.current.get(`${isBackchannel ? 'bc-' : ''}${from}`)) {
              console.error(`[WebRTC] ICE candidate error from ${from}:`, err);
            }
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Signal handling error from ${from}:`, err);
      }
    };

    const handleSignal = async ({ from, signal }: { from: string; signal: any }) => {
      const pc = createPeerConnection(from, socket.id! > from);
      await processSignal(pc, from, signal, SOCKET_EVENTS.SIGNAL, false);
    };

    const handleBackchannel = async ({ from, signal }: { from: string; signal: any }) => {
      const pc = createPeerConnection(from, socket.id! > from, true);
      await processSignal(pc, from, signal, SOCKET_EVENTS.BACKCHANNEL, true);
    };

    socket.on(SOCKET_EVENTS.SIGNAL, handleSignal);
    socket.on(SOCKET_EVENTS.BACKCHANNEL, handleBackchannel);
    return () => {
      socket.off(SOCKET_EVENTS.SIGNAL, handleSignal);
      socket.off(SOCKET_EVENTS.BACKCHANNEL, handleBackchannel);
    };
  }, [socket, createPeerConnection]);

  // ── Create PCs for members already in the room ─────────────────────────────
  useEffect(() => {
    if (!socket || !room) return;

    room.members.forEach((member: User) => {
      if (member.id === socket.id) return;
      if (!pcs.current.has(member.id) && socket.id) {
        createPeerConnection(member.id, socket.id > member.id);
      }
    });
  }, [socket, room, createPeerConnection]);

  // ── Cleanup PCs for members who left ──────────────────────────────────────
  useEffect(() => {
    if (!room) return;
    const memberIds = new Set(room.members.map((m: User) => m.id));
    pcs.current.forEach((pc, peerId) => {
      if (!memberIds.has(peerId)) {
        console.log(`[WebRTC] Peer ${peerId} left — closing PC`);
        pc.close();
        pcs.current.delete(peerId);
        makingOffer.current.delete(peerId);
        ignoreOffer.current.delete(peerId);
        onPeerLeft(peerId);
      }
    });
    bcs.current.forEach((pc, peerId) => {
      if (!memberIds.has(peerId)) {
        pc.close();
        bcs.current.delete(peerId);
      }
    });
  }, [room, onPeerLeft]);

  // ── Replace local tracks in all PCs when the local stream changes ──────────
  useEffect(() => {
    if (!localStream) return;
    pcs.current.forEach((pc, peerId) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach(track => {
        const sender = senders.find(s => s.track?.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch(e =>
            console.warn(`[WebRTC] replaceTrack error for ${peerId}:`, e)
          );
        } else {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  // ── Backchannel PTT transmission ───────────────────────────────────────────
  const sendBackchannel = useCallback((active: boolean) => {
    if (!socket || !room) return;
    const currentUser = room.members.find(m => m.id === socket.id);
    if (!currentUser?.isTeamAdmin) return;

    room.members.forEach(member => {
      if (member.id !== socket.id && (member.isTeamAdmin || member.id === room.hostId)) {
        let bc = bcs.current.get(member.id);
        if (!bc) {
          bc = createPeerConnection(member.id, socket.id! > member.id, true);
        }

        const senders = bc.getSenders();
        if (active) {
          if (senders.length === 0 && localStream) {
            localStream.getTracks().forEach(track => bc!.addTrack(track, localStream));
          }
        } else {
          senders.forEach(s => bc!.removeTrack(s));
        }
      }
    });
  }, [socket, room, localStream, createPeerConnection]);

  return {
    peerConnections: pcs.current,
    sendBackchannel,
  };
};
