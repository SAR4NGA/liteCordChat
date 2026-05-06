import { v4 as uuidv4 } from 'uuid';
import { Room, User, RoomArea } from '@litecordchat/shared';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private userToRoom: Map<string, string> = new Map();

  createRoom(hostId: string, hostName: string, hostAvatar?: string, customRoomId?: string): Room | null {
    const roomId = customRoomId || uuidv4();
    if (this.rooms.has(roomId)) {
      return null;
    }

    const host: User = {
      id: hostId,
      name: hostName,
      avatar: hostAvatar || '',
      roomArea: 'lobby',
      isMuted: false,
      isTeamAdmin: false
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

    // Idempotent join: if this socket is already a member, return the current
    // room state without duplicating the entry. Without this guard, a retried
    // JOIN_ROOM (e.g. due to a race or a flaky network) creates a phantom
    // duplicate in members[] which then never gets cleaned up.
    if (room.members.some(m => m.id === userId)) {
      return room;
    }

    const user: User = {
      id: userId,
      name: userName,
      avatar: userAvatar || '',
      roomArea: 'lobby',
      isMuted: false,
      isTeamAdmin: false
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

    const leavingUser = room.members.find(m => m.id === userId);
    room.members = room.members.filter(m => m.id !== userId);
    this.userToRoom.delete(userId);

    if (room.members.length === 0) {
      this.rooms.delete(roomId);
    } else {
      if (room.hostId === userId) {
        room.hostId = room.members[0].id;
      }
      
      // Inheritance logic: If a Team Admin leaves, promote someone else in that area
      if (leavingUser?.isTeamAdmin && leavingUser.roomArea !== 'lobby') {
        const nextInArea = room.members.find(m => m.roomArea === leavingUser.roomArea);
        if (nextInArea) {
          nextInArea.isTeamAdmin = true;
        }
      }
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
    if (!member) return null;

    const oldArea = member.roomArea;
    const oldIsAdmin = member.isTeamAdmin;
    
    member.roomArea = area;
    member.isTeamAdmin = false; // Reset first

    // Logic: if moving to a team area and no one is admin there, become admin
    if (area !== 'lobby') {
      const anyAdminInNewArea = room.members.some(m => m.roomArea === area && m.isTeamAdmin);
      if (!anyAdminInNewArea) {
        member.isTeamAdmin = true;
      }
    }

    // Inheritance: if we were admin in old area, promote someone else there
    if (oldIsAdmin && oldArea !== 'lobby') {
      const nextInOldArea = room.members.find(m => m.roomArea === oldArea && m.id !== userId);
      if (nextInOldArea) {
        nextInOldArea.isTeamAdmin = true;
      }
    }

    return room;
  }
}

export const roomManager = new RoomManager();
