import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@shared/index';
import { registerHandlers } from './features/signaling/handlers';

const app = express();
app.get('/health', (_req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ ok: true, version: '2.03' });
});
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

const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Signaling server running on port ${PORT} (0.0.0.0)`);
  });
}
