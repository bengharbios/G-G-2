/* ═══════════════════════════════════════════════════════════════════════
   Voice Signaling Service — WebSocket signaling for WebRTC P2P voice

   Architecture:
   - Socket.io server on port 3010
   - Rooms mapped by room_id
   - Events: join-room, leave-room, offer, answer, ice-candidate,
             mic-toggle, speaker-toggle, request-offer, peer-leave
   - STUN + TURN servers configured client-side
   - Auto-cleanup of disconnected clients
   - In-app notification support for room events
   - Web Push fallback for offline users
   ═══════════════════════════════════════════════════════════════════════ */

import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = parseInt(process.env.PORT || '3010', 10);

// ── HTTP Server for health checks (Render requires this) ──
const httpServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'voice-signal',
      rooms: rooms.size,
      connections: io.sockets.sockets.size,
      uptime: process.uptime(),
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ── Room state ──
type RoomMember = {
  userId: string;
  displayName: string;
  onMic: boolean;
  micMuted: boolean;
  joinedAt: number;
};

const rooms = new Map<string, Map<string, RoomMember>>();

// ── User-to-socket mapping (for cross-room notifications) ──
const userSockets = new Map<string, string>(); // userId → socketId

// ── Socket-to-user mapping ──
const socketUsers = new Map<string, { userId: string; displayName: string; roomId: string }>();

function getRoom(roomId: string): Map<string, RoomMember> {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }
  return rooms.get(roomId)!;
}

// ── Clean stale clients ──
function cleanupStaleClients() {
  const now = Date.now();
  for (const [roomId, members] of rooms.entries()) {
    for (const [socketId, member] of members.entries()) {
      if (now - member.joinedAt > 5 * 60 * 1000) {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
          members.delete(socketId);
        }
      }
    }
    if (members.size === 0) {
      rooms.delete(roomId);
    }
  }
}

setInterval(cleanupStaleClients, 60_000);

const heartbeats = new Map<string, number>();

io.on('connection', (socket) => {
  console.log(`[VoiceSignal] Client connected: ${socket.id}`);

  // ── Heartbeat ──
  socket.on('heartbeat', () => {
    heartbeats.set(socket.id, Date.now());
    for (const [, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        members.get(socket.id)!.joinedAt = Date.now();
        break;
      }
    }
  });

  // ── Join a voice room ──
  socket.on('join-room', (data: { roomId: string; userId: string; displayName: string; onMic: boolean; micMuted: boolean }) => {
    const { roomId, userId, displayName, onMic, micMuted } = data;
    const room = getRoom(roomId);

    // Remove from any previous room
    for (const [rId, members] of rooms.entries()) {
      if (rId !== roomId && members.has(socket.id)) {
        const prev = members.get(socket.id)!;
        members.delete(socket.id);
        socket.leave(rId);
        io.to(rId).emit('peer-leave', {
          socketId: socket.id,
          userId: prev.userId,
          roomId: rId,
        });
      }
    }

    socket.join(roomId);
    room.set(socket.id, { userId, displayName, onMic, micMuted, joinedAt: Date.now() });

    // Update mappings
    userSockets.set(userId, socket.id);
    socketUsers.set(socket.id, { userId, displayName, roomId });

    // Send current room members to the new joiner
    const members: Array<{ socketId: string; userId: string; displayName: string; onMic: boolean; micMuted: boolean }> = [];
    for (const [sid, m] of room.entries()) {
      if (sid !== socket.id) {
        members.push({ socketId: sid, userId: m.userId, displayName: m.displayName, onMic: m.onMic, micMuted: m.micMuted });
      }
    }

    socket.emit('room-members', { roomId, members });

    socket.to(roomId).emit('peer-joined', {
      socketId: socket.id,
      userId,
      displayName,
      onMic,
      micMuted,
      roomId,
    });

    console.log(`[VoiceSignal] ${displayName}(${userId}) joined room ${roomId} (onMic=${onMic}, total=${room.size})`);
  });

  // ── Leave a voice room ──
  socket.on('leave-room', (data: { roomId: string }) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        room.delete(socket.id);
        socket.leave(roomId);
        io.to(roomId).emit('peer-leave', {
          socketId: socket.id,
          userId: member.userId,
          roomId,
        });
        if (room.size === 0) {
          rooms.delete(roomId);
        }
        console.log(`[VoiceSignal] ${member.displayName} left room ${roomId}`);
      }
    }
    socketUsers.delete(socket.id);
  });

  // ── WebRTC Signaling: Offer ──
  socket.on('offer', (data: { targetSocketId: string; roomId: string; offer: RTCSessionDescriptionInit }) => {
    io.to(data.targetSocketId).emit('offer', {
      fromSocketId: socket.id,
      roomId: data.roomId,
      offer: data.offer,
    });
  });

  // ── WebRTC Signaling: Answer ──
  socket.on('answer', (data: { targetSocketId: string; roomId: string; answer: RTCSessionDescriptionInit }) => {
    io.to(data.targetSocketId).emit('answer', {
      fromSocketId: socket.id,
      roomId: data.roomId,
      answer: data.answer,
    });
  });

  // ── WebRTC Signaling: ICE Candidate ──
  socket.on('ice-candidate', (data: { targetSocketId: string; roomId: string; candidate: RTCIceCandidateInit }) => {
    io.to(data.targetSocketId).emit('ice-candidate', {
      fromSocketId: socket.id,
      roomId: data.roomId,
      candidate: data.candidate,
    });
  });

  // ── Mic state change ──
  socket.on('mic-toggle', (data: { roomId: string; micMuted: boolean }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        member.micMuted = data.micMuted;
        io.to(data.roomId).emit('peer-mic-toggle', {
          socketId: socket.id,
          userId: member.userId,
          roomId: data.roomId,
          micMuted: data.micMuted,
        });
      }
    }
  });

  // ── Seat change ──
  socket.on('seat-change', (data: { roomId: string; onMic: boolean; micMuted: boolean }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      const member = room.get(socket.id);
      if (member) {
        member.onMic = data.onMic;
        member.micMuted = data.micMuted;
        io.to(data.roomId).emit('peer-seat-change', {
          socketId: socket.id,
          userId: member.userId,
          roomId: data.roomId,
          onMic: data.onMic,
          micMuted: data.micMuted,
        });
      }
    }
  });

  // ── Request offers ──
  socket.on('request-offers', (data: { roomId: string }) => {
    const room = rooms.get(data.roomId);
    if (room) {
      for (const [sid, member] of room.entries()) {
        if (sid !== socket.id && member.onMic && !member.micMuted) {
          io.to(sid).emit('request-offer', {
            targetSocketId: socket.id,
            roomId: data.roomId,
          });
        }
      }
    }
  });

  // ── Sound effect relay (share soundboard sounds to all room members) ──
  socket.on('sound-effect', (data: { roomId: string; userId: string; displayName: string; soundId: string }) => {
    const room = rooms.get(data.roomId);
    if (room && room.has(socket.id)) {
      // Broadcast to all OTHER room members (excluding sender)
      socket.to(data.roomId).emit('sound-effect', {
        userId: data.userId,
        displayName: data.displayName,
        soundId: data.soundId,
        roomId: data.roomId,
      });
    }
  });

  // ═══════════════════════════════════════════════════════════
  // Push Notification Support
  // ═══════════════════════════════════════════════════════════

  // ── Web Push helper: send push notification via /api/push/send ──
  // Uses PUSH_API_URL for Vercel production, falls back to localhost for dev
  const PUSH_API_URL = process.env.PUSH_API_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const PUSH_API_LOCAL = 'http://localhost:3000';

  function getPushApiBaseUrl(): string {
    // Production: use explicit PUSH_API_URL or derive from NEXT_PUBLIC_APP_URL
    if (PUSH_API_URL) return PUSH_API_URL.replace(/\/$/, '');
    // If NEXT_PUBLIC_APP_URL is set (Vercel sets NEXT_PUBLIC vars), use it
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    // Local development
    return PUSH_API_LOCAL;
  }

  async function sendWebPush(
    userIds: string[],
    payload: { title: string; body: string; tag?: string; url?: string; data?: Record<string, unknown> }
  ) {
    try {
      const pushApiKey = process.env.PUSH_API_KEY || 'gg-push-internal-key-2024';
      const baseUrl = getPushApiBaseUrl();
      const url = `${baseUrl}/api/push/send`;

      console.log(`[VoiceSignal] Sending Web Push to ${url} for ${userIds.length} user(s)`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-push-api-key': pushApiKey,
        },
        body: JSON.stringify({ userIds, payload }),
      });
      const result = await response.json();
      if (result.success && result.sent > 0) {
        console.log(`[VoiceSignal] 📲 Web Push sent to ${result.sent} device(s)`);
      }
    } catch (error) {
      console.warn('[VoiceSignal] Web Push failed:', error);
    }
  }

  // ── Send notification to a specific user (cross-room) ──
  socket.on('send-notification', (data: {
    targetUserId: string;
    type: 'invite' | 'mention' | 'kick' | 'seat_request' | 'seat_granted' | 'room_event';
    title: string;
    body: string;
    roomId: string;
  }) => {
    const { targetUserId, type, title, body, roomId } = data;
    const sender = socketUsers.get(socket.id);

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      body,
      roomId,
      fromUserId: sender?.userId,
      fromDisplayName: sender?.displayName,
      timestamp: Date.now(),
    };

    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      // User is online — send via WebSocket (real-time in-app)
      io.to(targetSocketId).emit('notification', notification);
    } else {
      // User is OFFLINE — send via Web Push (works even when app is closed)
      sendWebPush([targetUserId], {
        title,
        body,
        tag: `ggames-${type}-${roomId}`,
        url: `/voice-rooms`,
        data: { type, roomId, fromUserId: sender?.userId, fromDisplayName: sender?.displayName },
      });
    }

    console.log(`[VoiceSignal] Notification sent to ${targetUserId}: ${type} — ${title} (${targetSocketId ? 'websocket' : 'webpush'})`);
  });

  // ── Send notification to all users in a room ──
  socket.on('broadcast-notification', (data: {
    type: 'room_event';
    title: string;
    body: string;
    roomId: string;
  }) => {
    const room = rooms.get(data.roomId);
    if (!room) return;

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: data.type,
      title: data.title,
      body: data.body,
      roomId: data.roomId,
      timestamp: Date.now(),
    };

    // Send to all online users via WebSocket
    io.to(data.roomId).emit('notification', notification);

    // Also send Web Push to offline room participants (from DB)
    // The signaling server only knows about currently connected users,
    // but offline users who were in the room still have push subscriptions.
    // We fire-and-forget the push to all room members — the push API
    // will handle deduplication for users already notified via WebSocket.
    const roomUserIds = Array.from(room.values()).map(m => m.userId);
    if (roomUserIds.length > 0) {
      sendWebPush(roomUserIds, {
        title: data.title,
        body: data.body,
        tag: `ggames-${data.type}-${data.roomId}`,
        url: `/voice-rooms`,
        data: { type: data.type, roomId: data.roomId },
      });
    }
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`[VoiceSignal] Client disconnected: ${socket.id}`);
    heartbeats.delete(socket.id);

    const userInfo = socketUsers.get(socket.id);
    if (userInfo) {
      userSockets.delete(userInfo.userId);
    }
    socketUsers.delete(socket.id);

    for (const [roomId, members] of rooms.entries()) {
      if (members.has(socket.id)) {
        const member = members.get(socket.id)!;
        members.delete(socket.id);
        io.to(roomId).emit('peer-leave', {
          socketId: socket.id,
          userId: member.userId,
          roomId,
        });
        if (members.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[VoiceSignal] 🎙️ Voice signaling service running on port ${PORT}`);
});
