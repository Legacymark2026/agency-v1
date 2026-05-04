#!/usr/bin/env node
/**
 * apps/web/bin/socket-server.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Simple standalone Socket.IO server for inbox real-time events.
 * Run with: `node ./apps/web/bin/socket-server.js`
 * This server can be deployed separately (Heroku, PM2, Docker) and connects
 * clients by company rooms (`company:<companyId>`).
 */

const http = require('http');
const { Server } = require('socket.io');
const port = process.env.SOCKET_PORT || 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket server running');
});

const io = new Server(server, {
  cors: { origin: process.env.SOCKET_ORIGIN || '*' },
  path: '/socket.io',
});

io.on('connection', (socket) => {
  console.log('[Socket] client connected', socket.id);

  socket.on('joinCompany', (companyId) => {
    socket.join(`company:${companyId}`);
    console.log('[Socket] joinCompany', companyId);
  });

  socket.on('leaveCompany', (companyId) => {
    socket.leave(`company:${companyId}`);
    console.log('[Socket] leaveCompany', companyId);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnect', socket.id, reason);
  });
});

server.listen(port, () => {
  console.log(`[Socket] Listening on port ${port}`);
});
