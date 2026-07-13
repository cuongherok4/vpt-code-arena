import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'websocket-service' });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`);
});
