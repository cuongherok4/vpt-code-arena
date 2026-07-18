import express from 'express';
import { createServer } from 'http';
import { Redis } from 'ioredis';
import { Server } from 'socket.io';
import { registerBattleNamespace, type BattleEvent } from './battleNamespace.js';
import { registerChatNamespace } from './chatNamespace.js';
import { loadLocalEnv, redisUrlFromEnv } from './env.js';
import { RedisBattleStore } from './redisBattleStore.js';
import { RedisChatPresenceStore } from './redisChatPresenceStore.js';

loadLocalEnv();

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((origin) => origin.trim());
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST']
  }
});

const redisUrl = redisUrlFromEnv();
const redis = new Redis(redisUrl);
const subscriber = new Redis(redisUrl);
const battleStore = new RedisBattleStore(redis);
const chatPresenceStore = new RedisChatPresenceStore(redis);
const battleNamespace = registerBattleNamespace(io, battleStore, {
  jwtSecret: process.env.JWT_SECRET || '',
  authDisabled: process.env.WS_AUTH_DISABLED === 'true'
});
registerChatNamespace(io, chatPresenceStore, {
  jwtSecret: process.env.JWT_SECRET || '',
  authDisabled: process.env.WS_AUTH_DISABLED === 'true',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:8080'
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'websocket-service' });
});

app.post('/internal/battle/events', (req, res) => {
  const event = req.body as BattleEvent;
  if (!event?.type || !event?.roomId) {
    res.status(400).json({ error: 'Invalid battle event' });
    return;
  }
  battleNamespace.handleBattleEvent(event);
  res.status(202).json({ accepted: true });
});

subscriber.subscribe('battle:events', (error) => {
  if (error) {
    console.error('Failed to subscribe to battle events:', error);
  }
});

subscriber.on('message', (_channel, message) => {
  try {
    battleNamespace.handleBattleEvent(JSON.parse(message) as BattleEvent);
  } catch (error) {
    console.error('Invalid battle event message:', error);
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => {
  console.log(`WebSocket service running on port ${PORT}`);
});

function shutdown() {
  battleNamespace.stopAllCountdowns();
  subscriber.disconnect();
  redis.disconnect();
  httpServer.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
