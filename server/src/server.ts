import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { setupInterviewSockets } from './sockets/interview.socket';

const server = http.createServer(app);

// Initialize Socket.IO with CORS
export const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin === env.FRONTEND_ORIGIN || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by Socket.IO CORS'));
      }
    },
    credentials: true,
  },
});

// Attach WebRTC Signalling handlers
setupInterviewSockets(io);

// Start server
async function startServer() {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 AptiCore Backend running on: http://localhost:${env.PORT}`);
    console.log(`📖 API Documentation available at: http://localhost:${env.PORT}/api/docs`);
    console.log(`📡 Socket.IO Real-Time Signalling Ready`);
    console.log(`======================================================\n`);
  });
}

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    await disconnectDB();
    console.log('Server and database connections closed cleanly.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
