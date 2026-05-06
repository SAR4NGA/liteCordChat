import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { 
  SOCKET_EVENTS, 
  CreateRoomSchema, 
  JoinRoomSchema, 
  KnockRequestSchema,
  UserSchema,
  RoomArea
} from '@shared/index';
import { roomManager } from '../rooms/room-manager';

const JWT_SECRET = process.env.JWT_SECRET || 'litecord-secret-change-me';

export const registerHandlers = (io: Server, socket: Socket) => {
  socket.on(SOCKET_EVENTS.CREATE_ROOM, (payload: any) => {
    const result = CreateRoomSchema.safeParse(payload);
    if (!result.success) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid create room request', errors: result.error.flatten() });
      return;
    }

    const { userName, avatar, roomId } = result.data;
    const room = roomManager.createRoom(socket.id, userName, avatar, roomId);
    
    if (!room) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room name is already in use.' });
      return;
    }

    socket.join(room.id);
    socket.emit(SOCKET_EVENTS.ROOM_CREATED, room);
    console.log(`Room created: ${room.id} by ${userName}`);
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload: any) => {
    const result = JoinRoomSchema.safeParse(payload);
    if (!result.success) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid join room request', errors: result.error.flatten() });
      return;
    }

    const { roomId, userName, avatar, token } = result.data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
      return;
    }

    // Security check: if room is locked, require a valid token
    if (room.isLocked || token) {
      try {
        const decoded = jwt.verify(token || '', JWT_SECRET) as any;
        if (decoded.roomId !== roomId || decoded.userName !== userName) {
          throw new Error('Invalid token for this room/user');
        }
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid or missing access token' });
        return;
      }
    }

    const updatedRoom = roomManager.joinRoom(roomId, socket.id, userName, avatar);
    if (!updatedRoom) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Could not join room' });
      return;
    }

    socket.join(roomId);
    socket.emit(SOCKET_EVENTS.ROOM_CREATED, updatedRoom);
    socket.to(roomId).emit(SOCKET_EVENTS.USER_JOINED, updatedRoom.members.find(m => m.id === socket.id));
    console.log(`User ${userName} joined room: ${roomId}`);
  });

  socket.on(SOCKET_EVENTS.MOVE_AREA, (payload: { area: RoomArea }) => {
    const room = roomManager.moveArea(socket.id, payload.area);
    if (!room) return;

    // Send full members list so clients can update isTeamAdmin correctly
    io.to(room.id).emit(SOCKET_EVENTS.AREA_MOVED, { userId: socket.id, area: payload.area, members: room.members });
  });

  socket.on(SOCKET_EVENTS.KNOCK_REQUEST, (payload: any) => {
    const result = KnockRequestSchema.safeParse(payload);
    if (!result.success) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid knock request', errors: result.error.flatten() });
      return;
    }

    const { roomId, userName, avatar } = result.data;
    const room = roomManager.getRoom(roomId);
    
    if (!room) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found' });
      return;
    }

    io.to(room.hostId).emit(SOCKET_EVENTS.KNOCK_RECEIVED, {
      id: socket.id,
      name: userName,
      avatar
    });
  });

  socket.on(SOCKET_EVENTS.KNOCK_APPROVED, (payload: { guestId: string, guestName: string }) => {
    const roomId = roomManager.getRoomIdByUser(socket.id);
    if (!roomId) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    const token = jwt.sign(
      { roomId, userName: payload.guestName },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    io.to(payload.guestId).emit(SOCKET_EVENTS.KNOCK_APPROVED, { roomId, token });
  });

  socket.on(SOCKET_EVENTS.KNOCK_DENIED, (payload: { guestId: string }) => {
    const roomId = roomManager.getRoomIdByUser(socket.id);
    if (!roomId) return;
    
    const room = roomManager.getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;

    io.to(payload.guestId).emit(SOCKET_EVENTS.KNOCK_DENIED);
  });

  socket.on(SOCKET_EVENTS.TOGGLE_LOCK, () => {
    const room = roomManager.toggleLock(socket.id);
    if (!room) return;

    io.to(room.id).emit(SOCKET_EVENTS.LOCK_TOGGLED, { isLocked: room.isLocked });
  });

  socket.on(SOCKET_EVENTS.BURN_ROOM, () => {
    const result = roomManager.burnRoom(socket.id);
    if (!result) return;

    const { roomId } = result;
    io.to(roomId).emit(SOCKET_EVENTS.ROOM_BURNED);

    // Force every socket out of the io room namespace. Without this, sockets
    // remain joined to the room id in Socket.io's internal registry — so any
    // future room created with the same id would leak broadcasts to ghosts.
    io.in(roomId).socketsLeave(roomId);

    console.log(`Room burned: ${roomId} by host ${socket.id}`);
  });

  socket.on(SOCKET_EVENTS.TOGGLE_MUTE, () => {
    const room = roomManager.toggleMute(socket.id);
    if (!room) return;

    const member = room.members.find(m => m.id === socket.id);
    if (member) {
      io.to(room.id).emit(SOCKET_EVENTS.MUTE_TOGGLED, { userId: socket.id, isMuted: member.isMuted });
    }
  });

  // Signal events carry peer-to-peer WebRTC SDP/ICE data.
  // The `to` field is the target peer's socket ID — the server must route
  // these directly (unicast), never broadcast.
  // We use `unknown` for the signal payload — the server is a relay and
  // doesn't need to inspect the SDP/ICE contents (DOM types are unavailable in Node).
  socket.on(SOCKET_EVENTS.SIGNAL, (payload: { to: string; signal: unknown }) => {
    socket.to(payload.to).emit(SOCKET_EVENTS.SIGNAL, {
      from: socket.id,
      signal: payload.signal,
    });
  });

  // Backchannel signals are also peer-to-peer WebRTC (SDP/ICE).
  // The client sends a `to` field identifying the exact target peer.
  // We still gate on isTeamAdmin so only authorised senders can use this,
  // but we route to the specific `to` peer rather than broadcasting.
  socket.on(SOCKET_EVENTS.BACKCHANNEL, (payload: { to: string; signal: unknown }) => {
    const roomId = roomManager.getRoomIdByUser(socket.id);
    if (!roomId) return;

    const room = roomManager.getRoom(roomId);
    if (!room) return;

    const user = room.members.find(m => m.id === socket.id);
    if (!user || !user.isTeamAdmin) return;

    // Verify the target is a valid member (Team Admin or Host) before forwarding
    const target = room.members.find(m => m.id === payload.to);
    if (!target || (!target.isTeamAdmin && target.id !== room.hostId)) return;

    socket.to(payload.to).emit(SOCKET_EVENTS.BACKCHANNEL, {
      from: socket.id,
      signal: payload.signal,
    });
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    const result = roomManager.leaveRoom(socket.id);
    if (result) {
      const { roomId, members } = result;
      socket.to(roomId).emit(SOCKET_EVENTS.USER_LEFT, { userId: socket.id, members });
      console.log(`User ${socket.id} left room: ${roomId}`);
    }
  });
};
