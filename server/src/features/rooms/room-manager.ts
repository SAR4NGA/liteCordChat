import { v4 as uuidv4 } from 'uuid';
import { Room, User, RoomArea } from '@litecordchat/shared';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();

  createRoom(hostId: string, hostName: string, hostAvatar?: string): Room {
    const roomId = uuidv4();
    const host: User = {
      id: hostId,
      name: hostName,
      avatar: hostAvatar || '',
      roomArea: 'lobby',
      isMuted: false
    };

    const room: Room = {
      id: roomId,
      hostId: hostId,
      isLocked: false,
      members: [host],
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    this.userToRoom.set(hostId, roomId);
    return room;
  }

  joinRoom(roomId: string, userId: string, userName: string, userAvatar?: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user: User = {
      id: userId,
      name: userName,
      avatar: userAvatar || '',
      roomArea: 'lobby',
      isMuted: false
    };

    room.members.push(user);
    this.userToRoom.set(userId, roomId);
    return room;
  }

  leaveRoom(userId: string): { roomId: string, members: User[] } | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) {
      this.userToRoom.delete(userId);
      return null;
    }

    room.members = room.members.filter(m => m.id !== userId);
    this.userToRoom.delete(userId);

    if (room.members.length === 0) {
      this.rooms.delete(roomId);
    } else if (room.hostId === userId) {
      room.hostId = room.members[0].id;
    }

    return { roomId, members: room.members };
  }

  toggleMute(userId: string): Room | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const member = room.members.find(m => m.id === userId);
    if (member) {
      member.isMuted = !member.isMuted;
    }

    return room;
  }

  toggleLock(userId: string): Room | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== userId) return null;

    room.isLocked = !room.isLocked;
    return room;
  }

  burnRoom(userId: string): { roomId: string, members: User[] } | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== userId) return null;

    const members = [...room.members];
    
    // Cleanup all users in that room
    members.forEach(m => {
      this.userToRoom.delete(m.id);
    });
    
    this.rooms.delete(roomId);
    
    return { roomId, members };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomIdByUser(userId: string): string | undefined {
    return this.userToRoom.get(userId);
  }

  moveArea(userId: string, area: RoomArea): Room | null {
    const roomId = this.userToRoom.get(userId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const member = room.members.find(m => m.id === userId);
    if (member) {
      member.roomArea = area;
    }

    return room;
  }
}

export const roomManager = new RoomManager();
