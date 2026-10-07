/* ═══════════════════════════════════════════════════════════════════════
   useVoiceRTC — Real WebRTC P2P Voice Hook (Mobile-Optimized)

   Features:
   - One RTCPeerConnection per on-mic participant (mesh topology)
   - getUserMedia() for local mic (audio only)
   - WebSocket signaling via Socket.IO
   - Independent mic mute (stop audio track) and speaker mute (local only)
   - Speaking detection via AudioContext analyser
   - iOS/Android mobile audio unlock on first user gesture
   - ICE restart with retry on failure
   - Auto-cleanup on unmount or room leave
   - In-app push notifications for room events

   Usage:
   const voice = useVoiceRTC({ roomId, userId, displayName, isOnSeat, isMicMuted });
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRTCConfig {
  roomId: string;
  userId: string;
  displayName: string;
  isOnSeat: boolean;
  isMicMuted: boolean;
}

export interface RoomNotification {
  id: string;
  type: 'invite' | 'mention' | 'kick' | 'seat_request' | 'seat_granted' | 'room_event';
  title: string;
  body: string;
  roomId: string;
  fromUserId?: string;
  fromDisplayName?: string;
  timestamp: number;
}

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

interface VoiceRTCReturn {
  /** Map of userId → true if currently speaking */
  speakingPeers: React.MutableRefObject<Map<string, boolean>>;
  /** Am I speaking? */
  localSpeaking: boolean;
  /** Is speaker muted (all remote audio)? */
  isSpeakerMuted: boolean;
  /** Is mic muted? */
  isLocalMicMuted: boolean;
  /** Is connected to signaling server? */
  isConnected: boolean;
  /** Is audio context unlocked (for iOS)? */
  isAudioUnlocked: boolean;
  /** Pending notifications */
  notifications: RoomNotification[];
  /** Clear a notification */
  clearNotification: (id: string) => void;
  /** Toggle local mic mute */
  toggleMic: () => void;
  /** Toggle speaker mute (all remote audio) */
  toggleSpeaker: () => void;
  /** Programmatic mic mute */
  setLocalMuted: (muted: boolean) => void;
  /** Unlock audio on first user gesture (iOS) */
  unlockAudio: () => Promise<boolean>;
  /** Audio elements for each peer (to attach to DOM) */
  audioStreams: React.MutableRefObject<Map<string, MediaStream>>;
  /** Change microphone device (stops old stream, creates new one) */
  changeMicDevice: (deviceId: string) => Promise<void>;
  /** Change speaker output device (setSinkId on all audio elements) */
  changeSpeakerDevice: (deviceId: string) => void;
  /** Current connection quality based on RTCPeerConnection stats */
  connectionQuality: ConnectionQuality;
  /** Send a sound effect to all room members */
  sendSoundEffect: (soundId: string) => void;
}

// ── ICE Configuration ──
// STUN servers (free, no auth needed — always available)
const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

// Metered.ca TURN API — fetches fresh credentials on each session
// Free tier: 20 GB/month. Sign up at https://dashboard.metered.ca/signup?tool=turnserver
const METERED_API_KEY = process.env.NEXT_PUBLIC_METERED_API_KEY || '';
const METERED_APP_NAME = process.env.NEXT_PUBLIC_METERED_APP_NAME || 'ggames';

// Cache TURN credentials for 1 hour (they expire)
let cachedIceServers: RTCIceServer[] | null = null;
let cachedAt = 0;
const ICE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchTurnServers(): Promise<RTCIceServer[]> {
  // Return cache if still valid
  if (cachedIceServers && Date.now() - cachedAt < ICE_CACHE_TTL) {
    return cachedIceServers;
  }

  if (!METERED_API_KEY) {
    console.warn('[VoiceRTC] No METERED_API_KEY set — TURN relay unavailable. Mobile-to-mobile may fail.');
    return [];
  }

  try {
    const response = await fetch(
      `https://${METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
    );
    if (!response.ok) {
      console.warn('[VoiceRTC] Metered TURN API returned status:', response.status);
      return [];
    }
    const data = await response.json();
    if (data && Array.isArray(data)) {
      cachedIceServers = data;
      cachedAt = Date.now();
      console.log('[VoiceRTC] ✅ Fetched', data.length, 'TURN servers from Metered API');
      return data;
    }
    return [];
  } catch (err) {
    console.warn('[VoiceRTC] Failed to fetch TURN servers:', err);
    return [];
  }
}

// Build ICE configuration (async because TURN is fetched from API)
async function buildIceConfig(): Promise<RTCConfiguration> {
  const turnServers = await fetchTurnServers();
  return {
    iceServers: [
      ...STUN_SERVERS,
      ...turnServers,
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
}

// Static fallback (STUN only — used before TURN is fetched)
const ICE_SERVERS_FALLBACK: RTCConfiguration = {
  iceServers: STUN_SERVERS,
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

// ── Speaking detection threshold ──
const SPEAKING_THRESHOLD = 0.015;
const SPEAKING_HYSTERESIS = 0.01;

// ── ICE retry config ──
const MAX_ICE_RETRIES = 3;
const ICE_RETRY_DELAY = 2000;

// ── Audio streams ref (exposed for compatibility) ──
// All audio playback is handled internally by this hook via audio elements

export function useVoiceRTC({
  roomId,
  userId,
  displayName,
  isOnSeat,
  isMicMuted,
}: VoiceRTCConfig): VoiceRTCReturn {
  /* ── State ── */
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isLocalMicMuted, setIsLocalMicMuted] = useState(isMicMuted);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [notifications, setNotifications] = useState<RoomNotification[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('disconnected');

  /* ── Refs ── */
  const socketRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const speakingPeersRef = useRef<Map<string, boolean>>(new Map());
  const speakingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioContextsRef = useRef<Map<string, AudioContext>>(new Map());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingCheckRef = useRef<number | null>(null);
  const localSpeakingRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const iceRetriesRef = useRef<Map<string, number>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingAudioStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const localToggleRef = useRef(false); // prevent isMicMuted effect from overriding local toggle
  const onMicPeersRef = useRef<Map<string, { socketId: string; userId: string }>>(new Map()); // track who is on mic
  const socketIdToUserIdRef = useRef<Map<string, string>>(new Map()); // reverse mapping: socketId → userId
  const playbackAudioCtxRef = useRef<AudioContext | null>(null); // dedicated AudioContext for remote playback
  const audioSourceNodesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());
  const localMicUnavailableRef = useRef(false); // track if mic was found unavailable (don't retry)

  // Store current config in refs to avoid stale closures
  const configRef = useRef({ roomId, userId, displayName, isOnSeat, isMicMuted });
  configRef.current = { roomId, userId, displayName, isOnSeat, isMicMuted };

  /* ── Send sound effect to room ── */
  const sendSoundEffect = useCallback((soundId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('sound-effect', {
        roomId: configRef.current.roomId,
        userId: configRef.current.userId,
        displayName: configRef.current.displayName,
        soundId,
      });
    }
  }, []);

  /* ═══════════════════════════════════════════════════════════
     iOS/Android Audio Unlock
     iOS Safari blocks AudioContext and audio.play() until
     a user gesture triggers them. We call unlockAudio()
     on the first tap/click inside the room.
     ═══════════════════════════════════════════════════════════ */
  const unlockAudio = useCallback(async () => {
    // Don't return early — mobile may create new audio elements after initial unlock
    // We must always process pending/paused audio elements
    if (audioUnlockedRef.current) {
      // Already unlocked, but still try to play any new pending/paused elements
      for (const [key, audio] of audioElementsRef.current.entries()) {
        if (audio.paused && audio.srcObject) {
          audio.play().catch(() => {});
        }
      }
      // Also replay any pending streams via Web Audio API
      for (const [key, stream] of pendingAudioStreamsRef.current.entries()) {
        if (!audioSourceNodesRef.current.has(key) && playbackAudioCtxRef.current) {
          try {
            const source = playbackAudioCtxRef.current.createMediaStreamSource(stream);
            source.connect(playbackAudioCtxRef.current.destination);
            audioSourceNodesRef.current.set(key, source);
            console.log('[VoiceRTC] 🔊 Replaying pending stream via Web Audio:', key);
          } catch { /* ignore */ }
        }
      }
      pendingAudioStreamsRef.current.clear();
      return true;
    }

    try {
      // 1. Resume/create AudioContext (iOS requires user gesture)
      if (!audioContextRef.current || audioContextRef.current.state === 'suspended') {
        if (audioContextRef.current) {
          await audioContextRef.current.resume();
        } else {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
        }
      }

      // 2. Resume playback AudioContext (for remote audio)
      if (playbackAudioCtxRef.current && playbackAudioCtxRef.current.state === 'suspended') {
        await playbackAudioCtxRef.current.resume();
      }

      // 3. Resume all remote AudioContexts
      for (const [, ctx] of remoteAudioContextsRef.current.entries()) {
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
      }

      // 4. Play all pending audio streams via Web Audio API (primary) + <audio> fallback
      for (const [key, stream] of pendingAudioStreamsRef.current.entries()) {
        let played = false;

        // Try Web Audio API first
        if (playbackAudioCtxRef.current && playbackAudioCtxRef.current.state === 'running') {
          try {
            const source = playbackAudioCtxRef.current.createMediaStreamSource(stream);
            source.connect(playbackAudioCtxRef.current.destination);
            audioSourceNodesRef.current.set(key, source);
            console.log('[VoiceRTC] 🔊 Playing pending stream via Web Audio:', key);
            played = true;
          } catch { /* ignore */ }
        }

        // Fallback to <audio> element
        if (!played) {
          let audio = audioElementsRef.current.get(key);
          if (!audio) {
            // Create <audio> element if it doesn't exist
            audio = new Audio();
            audio.setAttribute('playsinline', '');
            audio.preload = 'auto';
            audio.volume = 1;
            audio.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;';
            document.body.appendChild(audio);
            audioElementsRef.current.set(key, audio);
          }
          try {
            audio.srcObject = stream;
            await audio.play();
            console.log('[VoiceRTC] ▶️ Playing pending stream via <audio>:', key);
          } catch {
            // Some browsers still reject even with gesture
          }
        }
      }
      pendingAudioStreamsRef.current.clear();

      // 5. Play all existing audio elements that might be paused
      for (const [, audio] of audioElementsRef.current.entries()) {
        if (audio.paused && audio.srcObject) {
          try { await audio.play(); } catch { /* ignore */ }
        }
      }

      audioUnlockedRef.current = true;
      setIsAudioUnlocked(true);
      console.log('[VoiceRTC] ✅ Audio unlocked successfully');

      // 5. Start a periodic retry for any still-paused audio elements (mobile reliability)
      setTimeout(() => {
        for (const [key, audio] of audioElementsRef.current.entries()) {
          if (audio.paused && audio.srcObject) {
            console.log('[VoiceRTC] 🔄 Retrying paused audio for', key);
            audio.play().catch(() => {});
          }
        }
      }, 500);
      setTimeout(() => {
        for (const [key, audio] of audioElementsRef.current.entries()) {
          if (audio.paused && audio.srcObject) {
            audio.play().catch(() => {});
          }
        }
      }, 1500);

      return true;
    } catch (err) {
      console.warn('[VoiceRTC] Audio unlock failed:', err);
      return false;
    }
  }, []);

  // Auto-unlock on ANY touch/click (not once — mobile needs repeated unlocks for new audio elements)
  useEffect(() => {
    const handleInteraction = () => {
      unlockAudio();
    };

    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('touchend', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('touchend', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [unlockAudio]);

  /* ── Notification helper ── */
  const addNotification = useCallback((notif: Omit<RoomNotification, 'id' | 'timestamp'>) => {
    const full: RoomNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    setNotifications(prev => [full, ...prev].slice(0, 20)); // keep max 20

    // Also try browser notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(full.title, {
            body: full.body,
            icon: '/favicon.ico',
            tag: full.id,
            silent: false,
          });
        } catch { /* service worker may handle this */ }
      } else if (Notification.permission === 'default') {
        // Request permission on next user gesture
        Notification.requestPermission().then(perm => {
          if (perm === 'granted') {
            try {
              new Notification(full.title, {
                body: full.body,
                icon: '/favicon.ico',
                tag: full.id,
              });
            } catch { /* ignore */ }
          }
        });
      }
    }
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /* ── Socket.IO connection ── */
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    import('socket.io-client').then(({ io }) => {
      // Signal server URL: production uses NEXT_PUBLIC_SIGNAL_SERVER_URL,
      // development falls back to Caddy proxy (XTransformPort=3010),
      // APK/WebView fallback uses direct Render URL
      const signalUrl = process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL
        || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
            ? 'https://g-g.onrender.com'
            : '/?XTransformPort=3010');
      const socket = io(signalUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 15,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        timeout: 15000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('[VoiceRTC] Connected to signaling server');
        setIsConnected(true);

        // Pre-fetch TURN credentials so they're ready when first offer is created
        buildIceConfig().then(config => {
          console.log('[VoiceRTC] ICE config ready:', config.iceServers.length, 'servers');
        }).catch(() => {});

        socket.emit('join-room', {
          roomId: configRef.current.roomId,
          userId: configRef.current.userId,
          displayName: configRef.current.displayName,
          onMic: configRef.current.isOnSeat,
          micMuted: configRef.current.isMicMuted || isLocalMicMuted,
        });
      });

      socket.on('disconnect', (reason: string) => {
        console.log(`[VoiceRTC] Disconnected: ${reason}`);
        setIsConnected(false);
      });

      socket.on('reconnect', () => {
        console.log('[VoiceRTC] Reconnected');
        setIsConnected(true);
        // Re-join room after reconnect
        socket.emit('join-room', {
          roomId: configRef.current.roomId,
          userId: configRef.current.userId,
          displayName: configRef.current.displayName,
          onMic: configRef.current.isOnSeat,
          micMuted: isLocalMicMuted,
        });
      });

      // ── Room members list ──
      socket.on('room-members', (data: { roomId: string; members: Array<{ socketId: string; userId: string; onMic: boolean; micMuted: boolean }> }) => {
        console.log(`[VoiceRTC] Room members: ${data.members.length}`);
        const { isOnSeat: onMic } = configRef.current;

        // Track all on-mic peers AND build socketId → userId reverse mapping
        onMicPeersRef.current.clear();
        socketIdToUserIdRef.current.clear();
        data.members.forEach((m) => {
          // Store reverse mapping for ALL members (needed for speaking detection)
          socketIdToUserIdRef.current.set(m.socketId, m.userId);
          if (m.onMic && m.socketId !== socket.id) {
            onMicPeersRef.current.set(m.userId, { socketId: m.socketId, userId: m.userId });
          }
        });

        // If we are on mic, create offers to ALL peers (on-mic AND listeners)
        // so everyone can hear us, not just other on-mic peers
        if (onMic && !isLocalMicMuted) {
          data.members.forEach((m) => {
            if (m.socketId !== socket.id) {
              createOfferToPeer(socket, m.socketId, m.userId);
            }
          });
        }

        // If we are NOT on mic (listening mode), request offers from on-mic peers
        // so we can hear them through WebRTC
        if (!onMic) {
          const hasOnMicPeers = data.members.some(m => m.onMic && m.socketId !== socket.id);
          if (hasOnMicPeers) {
            socket.emit('request-offers', {
              roomId: configRef.current.roomId,
            });
            console.log('[VoiceRTC] 🎧 Listener requested offers from on-mic peers');
          }
        }
      });

      // ── New peer joined ──
      socket.on('peer-joined', (data: { socketId: string; userId: string; onMic: boolean; micMuted: boolean; roomId: string; displayName: string }) => {
        console.log(`[VoiceRTC] Peer joined: ${data.userId} (onMic=${data.onMic})`);
        const { isOnSeat: onMic } = configRef.current;

        if (data.onMic) {
          onMicPeersRef.current.set(data.userId, { socketId: data.socketId, userId: data.userId });
          socketIdToUserIdRef.current.set(data.socketId, data.userId);
        }
        // Always store reverse mapping even for non-on-mic peers
        socketIdToUserIdRef.current.set(data.socketId, data.userId);

        if (onMic && !isLocalMicMuted) {
          // We're on mic — create offer to ANY peer (on-mic or listener)
          // so they can hear us through WebRTC
          createOfferToPeer(socket, data.socketId, data.userId);
        } else if (!onMic && data.onMic) {
          // We're a listener and the new peer is on mic — request their offer
          socket.emit('request-offers', {
            roomId: configRef.current.roomId,
          });
          console.log('[VoiceRTC] 🎧 Listener requested offers (new on-mic peer joined)');
        }
      });

      // ── Peer left ──
      socket.on('peer-leave', (data: { socketId: string; userId: string; roomId: string }) => {
        console.log(`[VoiceRTC] Peer left: ${data.userId}`);
        closePeerConnection(data.socketId, data.userId);
      });

      // ── Request offer ──
      socket.on('request-offer', (data: { targetSocketId: string; roomId: string }) => {
        const { isOnSeat: onMic } = configRef.current;
        if (onMic && !isLocalMicMuted) {
          createOfferToPeer(socket, data.targetSocketId, '');
        }
      });

      // ── Receive offer (with glare handling) ──
      socket.on('offer', async (data: { fromSocketId: string; roomId: string; offer: RTCSessionDescriptionInit }) => {
        const existingPc = connectionsRef.current.get(data.fromSocketId);
        console.log(`[VoiceRTC] Received offer from ${data.fromSocketId}, signalingState: ${existingPc?.signalingState || 'no-pc'}`);

        try {
          // Only get local stream if on mic (to send our audio), otherwise answer without local track
          if (configRef.current.isOnSeat) {
            await ensureLocalStream();
          }
          const pc = await getOrCreatePeerConnection(socket, data.fromSocketId);

          // ═══ GLARE FIX ═══
          // If we already sent an offer (have-local-offer), we have a "glare" conflict.
          // Both peers tried to offer simultaneously. Solution: rollback our offer,
          // accept the incoming offer, and answer it. Then onnegotiationneeded
          // will fire again to re-establish our outgoing tracks.
          if (pc.signalingState === 'have-local-offer') {
            console.log('[VoiceRTC] ⚠️ GLARE detected! Rolling back local offer, accepting remote offer');
            await pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('answer', {
            targetSocketId: data.fromSocketId,
            roomId: configRef.current.roomId,
            answer,
          });
          console.log('[VoiceRTC] ✅ Answer sent to', data.fromSocketId);
        } catch (err) {
          console.error('[VoiceRTC] Error handling offer:', err);
        }
      });

      // ── Receive answer (with stale answer handling) ──
      socket.on('answer', async (data: { fromSocketId: string; roomId: string; answer: RTCSessionDescriptionInit }) => {
        console.log(`[VoiceRTC] Received answer from ${data.fromSocketId}`);
        const pc = connectionsRef.current.get(data.fromSocketId);
        if (!pc) {
          console.warn('[VoiceRTC] No PC found for answer from', data.fromSocketId);
          return;
        }

        // If already stable, this might be a stale answer from a rolled-back offer (glare recovery)
        if (pc.signalingState === 'stable') {
          console.log('[VoiceRTC] ⚠️ Already stable, ignoring stale answer (glare recovery)');
          return;
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('[VoiceRTC] ✅ Answer set for', data.fromSocketId);
        } catch (err) {
          console.error('[VoiceRTC] Error handling answer:', err);
        }
      });

      // ── Receive ICE candidate (with robust queuing) ──
      socket.on('ice-candidate', (data: { fromSocketId: string; roomId: string; candidate: RTCIceCandidateInit }) => {
        const pc = connectionsRef.current.get(data.fromSocketId);
        if (pc && pc.remoteDescription) {
          try {
            pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error('[VoiceRTC] Error adding ICE candidate:', err);
          }
        } else {
          // Queue the candidate — try multiple times with increasing delays
          const tryAddCandidate = (attempt: number) => {
            if (attempt > 5) {
              console.warn('[VoiceRTC] ICE candidate expired, dropping:', data.fromSocketId);
              return;
            }
            const delay = 200 * attempt; // 200ms, 400ms, 600ms, 800ms, 1000ms
            setTimeout(() => {
              const pc2 = connectionsRef.current.get(data.fromSocketId);
              if (pc2 && pc2.remoteDescription) {
                pc2.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
              } else {
                tryAddCandidate(attempt + 1);
              }
            }, delay);
          };
          tryAddCandidate(1);
        }
      });

      // ── Peer mic toggle ──
      socket.on('peer-mic-toggle', (data: { socketId: string; userId: string; micMuted: boolean }) => {
        console.log(`[VoiceRTC] Peer ${data.userId} mic toggled: ${data.micMuted}`);
        speakingPeersRef.current.set(data.userId, false);
        setLocalSpeaking(prev => prev);
      });

      // ── Peer seat change ──
      socket.on('peer-seat-change', (data: { socketId: string; userId: string; onMic: boolean }) => {
        console.log(`[VoiceRTC] Peer ${data.userId} seat change: onMic=${data.onMic}`);
        if (data.onMic) {
          onMicPeersRef.current.set(data.userId, { socketId: data.socketId, userId: data.userId });
          if (configRef.current.isOnSeat && !isLocalMicMuted) {
            // We're on mic — create offer to them so they can hear us
            createOfferToPeer(socket, data.socketId, data.userId);
          } else if (!configRef.current.isOnSeat) {
            // We're a listener and they just went on mic — request their offer
            socket.emit('request-offers', {
              roomId: configRef.current.roomId,
            });
            console.log('[VoiceRTC] 🎧 Listener requested offers (peer went on mic)');
          }
        } else {
          onMicPeersRef.current.delete(data.userId);
          // Peer went off mic — disable their audio track but keep connection
          const pc = connectionsRef.current.get(data.socketId);
          if (pc) {
            const receivers = pc.getReceivers();
            receivers.forEach(r => {
              if (r.track?.kind === 'audio') {
                r.track.enabled = false;
              }
            });
          }
        }
      });

      // ── Sound effect from another user ──
      socket.on('sound-effect', (data: { userId: string; displayName: string; soundId: string; roomId: string }) => {
        console.log('[VoiceRTC] Sound effect received:', data.soundId, 'from', data.displayName);
        // Play the sound locally - the component will handle this via the sound-effects module
        if (typeof window !== 'undefined') {
          import('@/lib/sound-effects').then(({ playSoundById }) => {
            playSoundById(data.soundId);
          }).catch(() => {});
        }
      });

      // ── In-app push notifications from signaling server ──
      socket.on('notification', (data: RoomNotification) => {
        console.log('[VoiceRTC] Notification received:', data);
        addNotification(data);
      });

      // ── Heartbeat ──
      const heartbeat = setInterval(() => {
        if (socket.connected) {
          socket.emit('heartbeat');
        }
      }, 15000);

      socket.on('disconnect', () => {
        clearInterval(heartbeat);
      });
    });
  }, []);

  /* ── Ensure local media stream (mobile-compatible) ── */
  const ensureLocalStream = useCallback(async (): Promise<MediaStream | null> => {
    if (localStreamRef.current) return localStreamRef.current;
    if (localMicUnavailableRef.current) return null; // already tried and failed — don't retry

    try {
      // Mobile-compatible constraints — no sampleRate (not supported on all mobile)
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Don't force sampleRate — let browser choose (mobile compatibility)
          // channelCount: 1 is default and best for mobile
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      // Set up speaking detection
      setupSpeakingDetection(stream);

      // If muted, disable track
      if (isLocalMicMuted) {
        stream.getAudioTracks().forEach(t => t.enabled = false);
      }

      return stream;
    } catch (err: any) {
      console.error('[VoiceRTC] Error getting user media:', err?.message || err);
      // If mic is not found, mark as unavailable to avoid repeated failures
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        localMicUnavailableRef.current = true;
        console.warn('[VoiceRTC] No microphone found — audio send disabled, listening only');
      }
      return null;
    }
  }, []);

  /* ── Speaking detection (mobile-compatible) ── */
  const setupSpeakingDetection = useCallback((stream: MediaStream) => {
    if (typeof window === 'undefined') return;

    try {
      // Reuse existing AudioContext if possible
      let ctx = audioContextRef.current;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
      }

      // If suspended (iOS), it will be resumed on first user gesture via unlockAudio
      if (ctx.state === 'running') {
        attachAnalyser(ctx, stream);
      } else {
        // Wait for resume
        ctx.addEventListener('statechange', function onState() {
          if (ctx!.state === 'running') {
            ctx!.removeEventListener('statechange', onState);
            attachAnalyser(ctx!, stream);
          }
        });
      }
    } catch (err) {
      console.error('[VoiceRTC] Error setting up speaking detection:', err);
    }
  }, []);

  const attachAnalyser = useCallback((ctx: AudioContext, stream: MediaStream) => {
    if (analyserRef.current) return; // Already attached

    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const checkSpeaking = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length) / 255;

      const wasSpeaking = localSpeakingRef.current;
      const isSpeaking = wasSpeaking
        ? rms > (SPEAKING_THRESHOLD - SPEAKING_HYSTERESIS)
        : rms > (SPEAKING_THRESHOLD + SPEAKING_HYSTERESIS);

      localSpeakingRef.current = isSpeaking;

      if (isSpeaking !== wasSpeaking) {
        setLocalSpeaking(isSpeaking);
      }

      speakingCheckRef.current = requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();
  }, []);

  /* ── Create or get peer connection ── */
  const getOrCreatePeerConnection = useCallback(async (socket: any, socketId: string): Promise<RTCPeerConnection> => {
    if (connectionsRef.current.has(socketId)) {
      return connectionsRef.current.get(socketId)!;
    }

    // Fetch ICE config with TURN servers (async)
    const iceConfig = await buildIceConfig();
    const pc = new RTCPeerConnection(iceConfig);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[VoiceRTC] Remote track received from', socketId);
      if (event.streams[0]) {
        const stream = event.streams[0];
        remoteStreamsRef.current.set(socketId, stream);
        audioStreamsRef.current.set(socketId, stream);

        // Mute if speaker is muted
        if (isSpeakerMuted) {
          stream.getAudioTracks().forEach(t => t.enabled = false);
        }

        // Create audio element for playback (mobile-compatible)
        createAudioElement(socketId, stream);

        // Start speaking detection for this peer
        setupRemoteSpeakingDetection(socketId, stream);

        // Force re-render
        setLocalSpeaking(prev => prev);
      }
    };

    // Handle negotiation needed (renegotiation for track changes)
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
        await pc.setLocalDescription(offer);
        socket.emit('offer', {
          targetSocketId: socketId,
          roomId: configRef.current.roomId,
          offer,
        });
      } catch (err) {
        console.warn('[VoiceRTC] Negotiation needed failed:', err);
      }
    };

    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId: socketId,
          roomId: configRef.current.roomId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log(`[VoiceRTC] Connection state (${socketId}): ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected') {
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            closePeerConnection(socketId, '');
            if (socketRef.current?.connected && configRef.current.isOnSeat) {
              socketRef.current.emit('request-offers', {
                roomId: configRef.current.roomId,
              });
            }
          }
        }, 3000);
      }
      if (pc.connectionState === 'failed') {
        const retries = iceRetriesRef.current.get(socketId) || 0;
        if (retries < MAX_ICE_RETRIES) {
          iceRetriesRef.current.set(socketId, retries + 1);
          try {
            pc.restartIce();
            pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false })
              .then(offer => pc.setLocalDescription(offer).then(() => offer))
              .then(offer => {
                socket.emit('offer', {
                  targetSocketId: socketId,
                  roomId: configRef.current.roomId,
                  offer,
                });
              })
              .catch(() => {});
          } catch { /* ignore */ }
        } else {
          closePeerConnection(socketId, '');
        }
      }
      if (pc.connectionState === 'closed') {
        closePeerConnection(socketId, '');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[VoiceRTC] ICE state (${socketId}): ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        return;
      }
      if (pc.iceConnectionState === 'disconnected') {
        console.log(`[VoiceRTC] ICE disconnected for ${socketId}, waiting...`);
      }
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        iceRetriesRef.current.delete(socketId);
        console.log(`[VoiceRTC] ICE connected for ${socketId}`);
      }
    };

    connectionsRef.current.set(socketId, pc);
    return pc;
  }, [isSpeakerMuted]);

  /* ── Create audio playback for remote stream (Web Audio API + <audio> fallback) ── */
  const createAudioElement = useCallback((socketId: string, stream: MediaStream) => {
    // Clean up old resources for this peer
    const oldSource = audioSourceNodesRef.current.get(socketId);
    if (oldSource) {
      try { oldSource.disconnect(); } catch { /* ignore */ }
      audioSourceNodesRef.current.delete(socketId);
    }
    const old = audioElementsRef.current.get(socketId);
    if (old) {
      old.pause();
      old.srcObject = null;
      if (old.parentNode) old.parentNode.removeChild(old);
    }

    // ── Method 1: Web Audio API (most reliable in Android WebView) ──
    // This bypasses <audio> element autoplay restrictions entirely.
    // AudioContext.destination routes directly to the device speaker.
    try {
      let ctx = playbackAudioCtxRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 48000,
        });
        playbackAudioCtxRef.current = ctx;
      }

      // CRITICAL: Resume AudioContext if suspended — remote audio won't play if context is suspended
      // This can happen if the remote stream arrives after page load but before user gesture
      const startPlayback = () => {
        try {
          const source = ctx!.createMediaStreamSource(stream);
          source.connect(ctx!.destination);
          audioSourceNodesRef.current.set(socketId, source);
          console.log('[VoiceRTC] 🔊 Using Web Audio API for playback:', socketId);
        } catch (err) {
          console.warn('[VoiceRTC] Web Audio API source creation failed:', err);
        }
      };

      if (ctx.state === 'running') {
        startPlayback();
      } else {
        // Context is suspended — try to resume, then start playback
        ctx.resume().then(() => {
          startPlayback();
        }).catch(() => {
          // If resume fails, queue for next user interaction
          pendingAudioStreamsRef.current.set(socketId, stream);
          console.warn('[VoiceRTC] AudioContext resume failed, queued for user interaction');
        });
      }
      // Don't return — also create <audio> element as fallback in case Web Audio doesn't work
    } catch (err) {
      console.warn('[VoiceRTC] Web Audio API failed, falling back to <audio>:', err);
    }

    // ── Method 2: <audio> element fallback (for browsers where AudioContext fails) ──
    const audio = new Audio();
    audio.srcObject = stream;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('autoplay', '');
    audio.preload = 'auto';
    audio.volume = 1;
    audio.style.position = 'fixed';
    audio.style.top = '0';
    audio.style.left = '0';
    audio.style.width = '1px';
    audio.style.height = '1px';
    audio.style.opacity = '0.01';
    audio.style.pointerEvents = 'none';
    audio.style.zIndex = '-1';

    document.body.appendChild(audio);
    audioElementsRef.current.set(socketId, audio);

    audio.play().then(() => {
      console.log('[VoiceRTC] ▶️ Audio element playing for', socketId);
    }).catch(() => {
      console.log('[VoiceRTC] ⏸️ Audio autoplay blocked, queuing for unlock:', socketId);
      pendingAudioStreamsRef.current.set(socketId, stream);
    });

    // Retry after delay (Android WebView workaround)
    setTimeout(() => {
      if (audio.paused && audio.srcObject) {
        audio.play().catch(() => {});
      }
    }, 500);
    setTimeout(() => {
      if (audio.paused && audio.srcObject) {
        audio.play().catch(() => {});
      }
    }, 1500);
  }, []);

  /* ── Create offer to a peer ── */
  const createOfferToPeer = useCallback(async (socket: any, targetSocketId: string, _targetUserId: string) => {
    try {
      const stream = await ensureLocalStream();
      if (!stream) return;

      const pc = await getOrCreatePeerConnection(socket, targetSocketId);

      // Skip if connection is not in stable state (already negotiating)
      if (pc.signalingState !== 'stable') {
        console.log('[VoiceRTC] Skipping offer to peer, signaling state:', pc.signalingState);
        return;
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      socket.emit('offer', {
        targetSocketId,
        roomId: configRef.current.roomId,
        offer,
      });

      console.log('[VoiceRTC] Sent offer to peer');
    } catch (err) {
      console.error('[VoiceRTC] Error creating offer:', err);
    }
  }, [ensureLocalStream, getOrCreatePeerConnection]);

  /* ── Remote speaking detection (mobile-compatible) ── */
  const setupRemoteSpeakingDetection = useCallback((socketId: string, stream: MediaStream) => {
    if (typeof window === 'undefined' || !stream.getAudioTracks().length) return;

    try {
      let ctx = remoteAudioContextsRef.current.get(socketId);
      if (!ctx || ctx.state === 'closed') {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        remoteAudioContextsRef.current.set(socketId, ctx);
      }

      if (ctx.state === 'running') {
        attachRemoteAnalyser(socketId, ctx, stream);
      } else {
        // Wait for user gesture to resume (iOS)
        const onState = () => {
          if (ctx!.state === 'running') {
            ctx!.removeEventListener('statechange', onState);
            attachRemoteAnalyser(socketId, ctx!, stream);
          }
        };
        ctx.addEventListener('statechange', onState);
      }
    } catch (err) {
      // Ignore - some browsers may block AudioContext creation
    }
  }, []);

  const attachRemoteAnalyser = useCallback((socketId: string, ctx: AudioContext, stream: MediaStream) => {
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const check = () => {
      if (!remoteStreamsRef.current.has(socketId)) {
        ctx.close().catch(() => {});
        remoteAudioContextsRef.current.delete(socketId);
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length) / 255;
      const isSpeaking = rms > SPEAKING_THRESHOLD;

      // CRITICAL FIX: Look up userId from socketId for speaking map
      // The UI component reads by userId, not socketId!
      const userId = socketIdToUserIdRef.current.get(socketId) || socketId;
      const wasSpeaking = speakingPeersRef.current.get(userId) || false;

      if (isSpeaking && !wasSpeaking) {
        speakingPeersRef.current.set(userId, true);
        const timer = speakingTimersRef.current.get(userId);
        if (timer) clearTimeout(timer);
      } else if (!isSpeaking && wasSpeaking) {
        const timer = setTimeout(() => {
          speakingPeersRef.current.set(userId, false);
          setLocalSpeaking(prev => prev);
        }, 500);
        speakingTimersRef.current.set(userId, timer);
      }

      requestAnimationFrame(check);
    };

    check();
  }, []);

  /* ── Close peer connection ── */
  const closePeerConnection = useCallback((socketId: string, _userId: string) => {
    const pc = connectionsRef.current.get(socketId);
    if (pc) {
      pc.close();
      connectionsRef.current.delete(socketId);
    }
    remoteStreamsRef.current.delete(socketId);
    audioStreamsRef.current.delete(socketId);

    // Disconnect Web Audio API source node
    const sourceNode = audioSourceNodesRef.current.get(socketId);
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch { /* ignore */ }
      audioSourceNodesRef.current.delete(socketId);
    }

    // Close audio element fallback
    const audio = audioElementsRef.current.get(socketId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) audio.parentNode.removeChild(audio);
      audioElementsRef.current.delete(socketId);
    }

    pendingAudioStreamsRef.current.delete(socketId);

    // Close remote AudioContext
    const remoteCtx = remoteAudioContextsRef.current.get(socketId);
    if (remoteCtx) {
      remoteCtx.close().catch(() => {});
      remoteAudioContextsRef.current.delete(socketId);
    }

    // Clean up speaking detection by userId (not socketId)
    const userId = socketIdToUserIdRef.current.get(socketId);
    if (userId) {
      const timer = speakingTimersRef.current.get(userId);
      if (timer) clearTimeout(timer);
      speakingTimersRef.current.delete(userId);
      speakingPeersRef.current.delete(userId);
      socketIdToUserIdRef.current.delete(socketId);
    }
    iceRetriesRef.current.delete(socketId);
  }, []);

  /* ── Change microphone device ── */
  const changeMicDevice = useCallback(async (deviceId: string) => {
    // Stop old local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    // Close old audio context / analyser
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    if (speakingCheckRef.current) {
      cancelAnimationFrame(speakingCheckRef.current);
      speakingCheckRef.current = null;
    }

    // Get new stream with specified device
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId !== 'default' ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setupSpeakingDetection(stream);

      // If muted, disable track
      if (isLocalMicMuted) {
        stream.getAudioTracks().forEach(t => t.enabled = false);
      }

      // Replace tracks in all existing peer connections
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack && configRef.current.isOnSeat) {
        for (const [socketId, pc] of connectionsRef.current.entries()) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
          if (sender) {
            try {
              await sender.replaceTrack(audioTrack);
              console.log('[VoiceRTC] Replaced audio track for peer', socketId);
            } catch (err) {
              console.warn('[VoiceRTC] Failed to replace track:', err);
            }
          }
        }
      }

      console.log('[VoiceRTC] Mic device changed to', deviceId);
    } catch (err) {
      console.error('[VoiceRTC] Error changing mic device:', err);
    }
  }, [isLocalMicMuted, setupSpeakingDetection]);

  /* ── Change speaker output device ── */
  const changeSpeakerDevice = useCallback((deviceId: string) => {
    // Use setSinkId to change output device on all audio elements
    for (const [, audio] of audioElementsRef.current.entries()) {
      if (typeof (audio as any).setSinkId === 'function') {
        (audio as any).setSinkId(deviceId).catch(() => {
          // setSinkId not supported or failed
        });
      }
    }
    console.log('[VoiceRTC] Speaker device changed to', deviceId);
  }, []);

  /* ═══════════════════════════════════════════════════════════
     Connection Quality Monitor
     Checks RTCPeerConnection stats every 3 seconds to determine
     network quality based on roundTripTime and packet loss.
     ═══════════════════════════════════════════════════════════ */
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const monitorConnectionQuality = useCallback(() => {
    const checkStats = async () => {
      const connections = connectionsRef.current;
      if (connections.size === 0 || !isConnected) {
        setConnectionQuality('disconnected');
        return;
      }

      // Find the first active (connected/completed) peer connection
      let activePc: RTCPeerConnection | null = null;
      for (const [, pc] of connections.entries()) {
        if (
          (pc.connectionState as string) === 'connected' ||
          (pc.connectionState as string) === 'completed' ||
          pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed'
        ) {
          activePc = pc;
          break;
        }
      }

      if (!activePc) {
        setConnectionQuality('disconnected');
        return;
      }

      try {
        const stats = await activePc.getStats();
        let worstRtt = 0;
        let totalPacketsLost = 0;
        let totalPacketsReceived = 0;

        stats.forEach((report) => {
          // Check remote inbound RTP for roundTripTime
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.roundTripTime !== undefined) {
              const rttMs = report.roundTripTime * 1000; // convert s → ms
              if (rttMs > worstRtt) worstRtt = rttMs;
            }
          }
          // Check inbound RTP for packet loss
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            if (report.packetsLost !== undefined) totalPacketsLost += report.packetsLost;
            if (report.packetsReceived !== undefined) totalPacketsReceived += report.packetsReceived;
          }
        });

        // Calculate packet loss percentage
        const totalPackets = totalPacketsReceived + totalPacketsLost;
        const packetLossPercent = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0;

        // Determine quality
        if (packetLossPercent > 5) {
          setConnectionQuality('poor');
        } else if (worstRtt >= 300) {
          setConnectionQuality('poor');
        } else if (worstRtt >= 100) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('excellent');
        }
      } catch {
        // getStats failed — keep current quality
      }
    };

    return checkStats;
  }, [isConnected]);

  // Run stats check every 3 seconds
  useEffect(() => {
    if (!isConnected) {
      setConnectionQuality('disconnected');
      return;
    }

    const check = monitorConnectionQuality();
    // Run immediately once
    check();
    // Then every 3 seconds
    statsIntervalRef.current = setInterval(check, 3000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    };
  }, [isConnected, monitorConnectionQuality]);

  // Also update quality when connected state changes
  useEffect(() => {
    if (!isConnected) {
      setConnectionQuality('disconnected');
    }
  }, [isConnected]);

  /* ── Cleanup all ── */
  const cleanup = useCallback(() => {
    // Stop speaking check
    if (speakingCheckRef.current) {
      cancelAnimationFrame(speakingCheckRef.current);
      speakingCheckRef.current = null;
    }

    // Close all peer connections
    for (const [socketId, pc] of connectionsRef.current.entries()) {
      pc.close();
    }
    connectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    audioStreamsRef.current.clear();
    speakingPeersRef.current.clear();

    for (const [, timer] of speakingTimersRef.current.entries()) {
      clearTimeout(timer);
    }
    speakingTimersRef.current.clear();
    iceRetriesRef.current.clear();

    // Close all audio elements
    for (const [key, audio] of audioElementsRef.current.entries()) {
      audio.pause();
      audio.srcObject = null;
      if (audio.parentNode) audio.parentNode.removeChild(audio);
    }
    audioElementsRef.current.clear();
    pendingAudioStreamsRef.current.clear();

    // Close all remote AudioContexts
    for (const [, ctx] of remoteAudioContextsRef.current.entries()) {
      ctx.close().catch(() => {});
    }
    remoteAudioContextsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Disconnect socket
    if (socketRef.current) {
      const socket = socketRef.current;
      try {
        socket.emit('leave-room', { roomId: configRef.current.roomId });
      } catch {}
      socket.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsAudioUnlocked(false);
    audioUnlockedRef.current = false;
    setLocalSpeaking(false);
    localSpeakingRef.current = false;
    setNotifications([]);
  }, []);

  /* ── Toggle mic ── */
  const toggleMic = useCallback(() => {
    const newMuted = !isLocalMicMuted;
    setIsLocalMicMuted(newMuted);
    localToggleRef.current = true;
    // Clear flag after server has time to respond (2s)
    setTimeout(() => { localToggleRef.current = false; }, 2000);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !newMuted;
      });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('mic-toggle', {
        roomId: configRef.current.roomId,
        micMuted: newMuted,
      });
    }

    if (!newMuted && configRef.current.isOnSeat) {
      if (socketRef.current?.connected) {
        socketRef.current.emit('request-offers', {
          roomId: configRef.current.roomId,
        });
      }
    }
  }, [isLocalMicMuted]);

  /* ── Programmatic mute ── */
  const setLocalMuted = useCallback((muted: boolean) => {
    setIsLocalMicMuted(muted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !muted;
      });
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('mic-toggle', {
        roomId: configRef.current.roomId,
        micMuted: muted,
      });
    }
  }, []);

  /* ── Toggle speaker ── */
  const toggleSpeaker = useCallback(() => {
    const newMuted = !isSpeakerMuted;
    setIsSpeakerMuted(newMuted);

    for (const [, stream] of remoteStreamsRef.current.entries()) {
      stream.getAudioTracks().forEach(t => {
        t.enabled = !newMuted;
      });
    }
  }, [isSpeakerMuted]);

  /* ── Handle seat change ── */
  useEffect(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('seat-change', {
      roomId: configRef.current.roomId,
      onMic: configRef.current.isOnSeat,
      micMuted: isLocalMicMuted,
    });
    if (!configRef.current.isOnSeat) {
      // Going OFF mic — remove local audio tracks from senders (keep connections alive to receive)
      for (const [, pc] of connectionsRef.current.entries()) {
        const senders = pc.getSenders();
        senders.forEach(sender => {
          if (sender.track?.kind === 'audio') {
            sender.replaceTrack(null).catch(() => {});
          }
        });
      }
      // Stop local stream only (no longer needed for sending)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
      if (speakingCheckRef.current) {
        cancelAnimationFrame(speakingCheckRef.current);
        speakingCheckRef.current = null;
      }
    } else {
      ensureLocalStream().then(() => {
        // Re-add local track to all existing peer connections
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
          for (const [, pc] of connectionsRef.current.entries()) {
            const sender = pc.getSenders().find(s => !s.track);
            if (sender) {
              sender.replaceTrack(audioTrack).catch(() => {});
            } else {
              pc.addTrack(audioTrack, localStreamRef.current!);
            }
          }
        }
        // Proactively create offers to all known on-mic peers (faster than waiting for request-offers)
        const sock = socketRef.current;
        if (sock?.connected) {
          onMicPeersRef.current.forEach((peer) => {
            if (!connectionsRef.current.has(peer.socketId)) {
              createOfferToPeer(sock, peer.socketId, peer.userId);
            }
          });
          // Also request offers as fallback
          sock.emit('request-offers', {
            roomId: configRef.current.roomId,
          });
        }
      });
    }
  }, [isOnSeat, closePeerConnection, ensureLocalStream]);

  /* ── Handle external mic mute sync ── */
  useEffect(() => {
    // Don't override local toggle — wait for server response to sync
    if (localToggleRef.current) return;
    // Sync local muted state with server-provided isMicMuted prop
    setIsLocalMicMuted(isMicMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !isMicMuted;
      });
    }
    if (!isMicMuted && configRef.current.isOnSeat && socketRef.current?.connected) {
      socketRef.current.emit('request-offers', {
        roomId: configRef.current.roomId,
      });
    }
  }, [isMicMuted]);

  /* ── Connect on mount ── */
  useEffect(() => {
    connectSocket();

    return () => {
      cleanup();
    };
  }, []);

  return {
    speakingPeers: speakingPeersRef,
    localSpeaking,
    isSpeakerMuted,
    isLocalMicMuted,
    isConnected,
    isAudioUnlocked,
    notifications,
    clearNotification,
    toggleMic,
    toggleSpeaker,
    setLocalMuted,
    unlockAudio,
    audioStreams: audioStreamsRef,
    changeMicDevice,
    changeSpeakerDevice,
    connectionQuality,
    sendSoundEffect,
  };
}
