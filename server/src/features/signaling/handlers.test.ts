import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { io as Client, Socket } from 'socket.io-client';
import { httpServer, io } from '../../index';
import { SOCKET_EVENTS, Room } from '@shared/index';

describe('Signaling Handlers', () => {
  let clientSocket: Socket;
  let otherClientSocket: Socket;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const port = (httpServer.address() as any).port;
        clientSocket = Client(`http://localhost:${port}`);
        otherClientSocket = Client(`http://localhost:${port}`);
        clientSocket.on('connect', () => {
          if (otherClientSocket.connected) resolve();
        });
        otherClientSocket.on('connect', () => {
          if (clientSocket.connected) resolve();
        });
      });
    });
  });

  afterAll(() => {
    io.close();
    httpServer.close();
    clientSocket.disconnect();
    otherClientSocket.disconnect();
  });

  it('should create a room', () => {
    return new Promise<void>((resolve) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_ROOM, { userName: 'Alice' });
      clientSocket.once(SOCKET_EVENTS.ROOM_CREATED, (room: Room) => {
        expect(room.id).toBeDefined();
        expect(room.members).toHaveLength(1);
        expect(room.members[0].name).toBe('Alice');
        resolve();
      });
    });
  });

  it('should join a room', () => {
    return new Promise<void>((resolve) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_ROOM, { userName: 'Alice' });
      clientSocket.once(SOCKET_EVENTS.ROOM_CREATED, (room: Room) => {
        const roomId = room.id;
        otherClientSocket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userName: 'Bob' });
        otherClientSocket.once(SOCKET_EVENTS.ROOM_CREATED, (joinedRoom: Room) => {
          expect(joinedRoom.id).toBe(roomId);
          expect(joinedRoom.members).toHaveLength(2);
          expect(joinedRoom.members.find(m => m.name === 'Bob')).toBeDefined();
          resolve();
        });
      });
    });
  });

  it('should notify others when a user joins', () => {
    return new Promise<void>((resolve) => {
      clientSocket.emit(SOCKET_EVENTS.CREATE_ROOM, { userName: 'Alice' });
      clientSocket.once(SOCKET_EVENTS.ROOM_CREATED, (room: Room) => {
        const roomId = room.id;
        clientSocket.once(SOCKET_EVENTS.USER_JOINED, (user: any) => {
          expect(user.name).toBe('Bob');
          resolve();
        });
        otherClientSocket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userName: 'Bob' });
      });
    });
  });

  it('should relay signaling data between users', () => {
    return new Promise<void>((resolve) => {
      const signalData = { type: 'offer', sdp: 'dummy-sdp' };
      clientSocket.emit(SOCKET_EVENTS.CREATE_ROOM, { userName: 'Alice' });
      clientSocket.once(SOCKET_EVENTS.ROOM_CREATED, (room: Room) => {
        const roomId = room.id;
        otherClientSocket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId, userName: 'Bob' });
        otherClientSocket.once(SOCKET_EVENTS.ROOM_CREATED, () => {
          clientSocket.once(SOCKET_EVENTS.SIGNAL, (data: any) => {
            expect(data.from).toBe(otherClientSocket.id);
            expect(data.signal).toEqual(signalData);
            resolve();
          });
          otherClientSocket.emit(SOCKET_EVENTS.SIGNAL, { to: clientSocket.id, signal: signalData });
        });
      });
    });
  });
});
