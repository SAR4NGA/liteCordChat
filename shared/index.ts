import { z } from 'zod';

// Shared Types and Interfaces

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  avatar: z.string().optional(),
  roomArea: z.enum(['lobby', 'team-1', 'team-2']).default('lobby'),
  isMuted: z.boolean().default(false),
});

export type User = z.infer<typeof UserSchema>;

export type RoomArea = User['roomArea'];

export const RoomSchema = z.object({
  id: z.string(),
  hostId: z.string(),
  isLocked: z.boolean().default(false),
  members: z.array(UserSchema),
  createdAt: z.number(),
});

export type Room = z.infer<typeof RoomSchema>;

export const CreateRoomSchema = z.object({
  userName: z.string().min(1),
  avatar: z.string().optional(),
});

export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;

export const JoinRoomSchema = z.object({
  roomId: z.string(),
  userName: z.string().min(1),
  avatar: z.string().optional(),
  token: z.string().optional(),
});

export type JoinRoomRequest = z.infer<typeof JoinRoomSchema>;

export const KnockRequestSchema = z.object({
  roomId: z.string(),
  userName: z.string().min(1),
  avatar: z.string().optional(),
});

export type KnockRequest = z.infer<typeof KnockRequestSchema>;

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  ROOM_CREATED: 'room_created',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  MOVE_AREA: 'move_area',
  AREA_MOVED: 'area_moved',
  SIGNAL: 'signal',
  TOGGLE_MUTE: 'toggle_mute',
  MUTE_TOGGLED: 'mute_toggled',
  KNOCK_REQUEST: 'knock_request',
  KNOCK_RECEIVED: 'knock_received',
  KNOCK_APPROVED: 'knock_approved',
  KNOCK_DENIED: 'knock_denied',
  TOGGLE_LOCK: 'toggle_lock',
  LOCK_TOGGLED: 'lock_toggled',
  BURN_ROOM: 'burn_room',
  ROOM_BURNED: 'room_burned',
  ERROR: 'error'
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
