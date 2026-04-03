import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@shared/index';
import { registerHandlers } from './features/signaling/handlers';

const app = express();
export const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on(SOCKET_EVENTS.CONNECT, (socket) => {
  console.log('A user connected:', socket.id);
  registerHandlers(io, socket);
});

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
  });
}
