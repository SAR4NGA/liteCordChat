import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, Room, User } from '@shared/index';
import { sessionStore } from '../shared/sessionStore';

interface SocketState {
  socket: Socket | null;
  room: Room | null;
  localStream: MediaStream | null;
  lastError: string | null;
  setLocalStream: (stream: MediaStream | null) => void;
  clearError: () => void;
  connect: () => void;
  disconnect: () => void;
  createRoom: (userName: string, avatar?: string, roomId?: string) => void;
  joinRoom: (roomId: string, userName: string, avatar?: string, token?: string) => void;
  moveArea: (area: User['roomArea']) => void;
  toggleMute: () => void;
  knock: (roomId: string, userName: string, avatar?: string) => void;
  approveKnock: (guestId: string, guestName: string) => void;
  denyKnock: (guestId: string) => void;
  toggleLock: () => void;
  burnRoom: () => void;
  pendingKnocks: Array<{ id: string, name: string, avatar?: string }>;
  knockStatus: 'idle' | 'pending' | 'approved' | 'denied';
  knockToken: string | null;
}

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || `${window.location.protocol}//${window.location.hostname}:3002`;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  room: null,
  localStream: null,
  lastError: null,
  pendingKnocks: [],
  knockStatus: 'idle',
  knockToken: null,

  setLocalStream: (localStream) => set({ localStream }),
  clearError: () => set({ lastError: null }),

  connect: () => {
    if (get().socket) return;
    console.log('Connecting to signaling server at:', SOCKET_URL);
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Signaling connection error:', err);
    });

    socket.on(SOCKET_EVENTS.ROOM_CREATED, (room: Room) => {
      console.log('Room created successfully:', room.id);
      set({ room });
    });

    socket.on(SOCKET_EVENTS.USER_JOINED, (user: User) => {
      console.log('User joined room:', user.name);
      set((state) => ({
        room: state.room ? { ...state.room, members: [...state.room.members, user] } : null
      }));
    });

    socket.on(SOCKET_EVENTS.USER_LEFT, ({ userId, members }: { userId: string, members: User[] }) => {
      set((state) => ({
        room: state.room ? { ...state.room, members } : null
      }));
    });

    socket.on(SOCKET_EVENTS.AREA_MOVED, ({ userId, area, members }: { userId: string, area: User['roomArea'], members?: User[] }) => {
      set((state) => ({
        room: state.room ? {
          ...state.room,
          members: members || state.room.members.map(m => m.id === userId ? { ...m, roomArea: area } : m)
        } : null
      }));
    });

    socket.on(SOCKET_EVENTS.MUTE_TOGGLED, ({ userId, isMuted }: { userId: string, isMuted: boolean }) => {
      set((state) => ({
        room: state.room ? {
          ...state.room,
          members: state.room.members.map(m => m.id === userId ? { ...m, isMuted } : m)
        } : null
      }));
    });

    socket.on(SOCKET_EVENTS.KNOCK_RECEIVED, (guest: { id: string, name: string, avatar?: string }) => {
      set((state) => ({
        pendingKnocks: [...state.pendingKnocks, guest]
      }));
    });

    socket.on(SOCKET_EVENTS.KNOCK_APPROVED, ({ roomId, token }: { roomId: string, token: string }) => {
      // Upon approval, the store doesn't have the userName/avatar handy unless we store them.
      // Let's assume the component that called `knock` will handle the join or we store it.
      // Alternatively, we emit a local event or update a 'knockStatus' state.
      set({ knockStatus: 'approved', knockToken: token });
    });

    socket.on(SOCKET_EVENTS.KNOCK_DENIED, () => {
      set({ knockStatus: 'denied' });
    });

    socket.on(SOCKET_EVENTS.LOCK_TOGGLED, ({ isLocked }: { isLocked: boolean }) => {
      set((state) => ({
        room: state.room ? { ...state.room, isLocked } : null
      }));
    });

    socket.on(SOCKET_EVENTS.ROOM_BURNED, () => {
      sessionStore.clear(); // room is gone, don't try to rejoin
      set({ room: null, pendingKnocks: [], knockStatus: 'idle', knockToken: null });
    });

    socket.on(SOCKET_EVENTS.ERROR, (payload: any) => {
      console.error('[Socket] Server error:', payload.message);
      set({ lastError: payload.message });
    });

    // When the underlying transport drops (network blip / server restart),
    // clear room state so the UI doesn't get stuck in a ghost voice session.
    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      // Only clear room if it wasn't a deliberate client-side disconnect.
      // (Our disconnect() method sets socket=null before this fires.)
      if (get().socket) {
        set({ room: null, pendingKnocks: [], knockStatus: 'idle', knockToken: null });
      }
    });

    // On successful reconnect, force a clean state so the user is prompted
    // to re-enter rather than being stuck with stale room data.
    socket.io.on('reconnect', () => {
      console.log('[Socket] Reconnected to signaling server');
      set({ room: null, pendingKnocks: [], knockStatus: 'idle', knockToken: null });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, room: null });
    }
  },

  createRoom: (userName, avatar, roomId?: string) => {
    get().connect();
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CREATE_ROOM, { userName, avatar, roomId });
    }
  },

  joinRoom: (roomId, userName, avatar, token) => {
    get().connect();
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userName, avatar, token });
    }
  },

  moveArea: (area) => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.MOVE_AREA, { area });
    }
  },

  toggleMute: () => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.TOGGLE_MUTE);
    }
  },

  knock: (roomId, userName, avatar) => {
    const { socket } = get();
    if (socket) {
      set({ knockStatus: 'pending' });
      socket.emit(SOCKET_EVENTS.KNOCK_REQUEST, { roomId, userName, avatar });
    }
  },

  approveKnock: (guestId, guestName) => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.KNOCK_APPROVED, { guestId, guestName });
      set((state) => ({
        pendingKnocks: state.pendingKnocks.filter(k => k.id !== guestId)
      }));
    }
  },

  denyKnock: (guestId) => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.KNOCK_DENIED, { guestId });
      set((state) => ({
        pendingKnocks: state.pendingKnocks.filter(k => k.id !== guestId)
      }));
    }
  },

  toggleLock: () => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.TOGGLE_LOCK);
    }
  },

  burnRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.BURN_ROOM);
    }
  }
}));
