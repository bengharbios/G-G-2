'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoginModal, RegisterModal } from '@/components/AuthModals';

const TUI_COLORS_G1 = '#0F1014';
import InjectStyles from './components/shared/InjectStyles';
import RoomListView from './components/RoomListView';
import RoomInteriorView from './components/RoomInteriorView';
import FloatingRoomWidget from './components/FloatingRoomWidget';
import PasswordDialog from './components/dialogs/PasswordDialog';
import CreateRoomDialog from './components/dialogs/CreateRoomDialog';
import type { VoiceRoom, AuthUser, RoomMode } from './types';
import type { AuthUser as AuthUserFull } from '@/components/AuthModals';

/* ═══════════════════════════════════════════════════════════════════════
   VoiceRoomsPage — Entry point

   Handles auth state, room restore, join, create, exit flows.
   When a room is minimized, the RoomInteriorView stays mounted (hidden)
   and a floating mini-widget is shown for quick re-expand.
   ═══════════════════════════════════════════════════════════════════════ */

export default function VoiceRoomsPage() {
  const { toast } = useToast();
  const [activeRoom, setActiveRoom] = useState<VoiceRoom | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [pendingPasswordRoom, setPendingPasswordRoom] = useState<VoiceRoom | null>(null);

  // Lobby state
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [myRoom, setMyRoom] = useState<VoiceRoom | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Auth dialog state
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);

  /* ── Fetch auth user ── */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setAuthUser({
            id: d.user.id,
            username: d.user.username,
            displayName: d.user.displayName || d.user.username,
            avatar: d.user.avatar || '',
            numericId: d.user.numericId || null,
            vipLevel: d.user.vipLevel || 0,
          });
        }
      })
      .catch(() => {});
  }, []);

  /* ── Restore active room from localStorage on mount ── */
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const savedRoomId = localStorage.getItem('vr_active_room');
        if (savedRoomId) {
          // Always bypass cache — room may have been deleted
          const [roomData, partData] = await Promise.all([
            fetch(`/api/voice-rooms/${savedRoomId}?action=room-details&_t=${Date.now()}`).then((r) => r.json()),
            fetch(`/api/voice-rooms/${savedRoomId}?action=my-participant&_t=${Date.now()}`).then((r) => r.json()),
          ]);
          if (!cancelled) {
            if (roomData.success && roomData.room && partData.success && partData.participant) {
              const room = { ...roomData.room, lockedSeats: roomData.room.lockedSeats || [] };
              setActiveRoom(room);
            } else {
              localStorage.removeItem('vr_active_room');
            }
            setRestoring(false);
          }
        } else {
          if (!cancelled) setRestoring(false);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('vr_active_room');
          setRestoring(false);
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  /* ── Fetch rooms for lobby (when no active room or minimized) ── */
  const fetchLobbyRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      const res = await fetch('/api/voice-rooms');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
        setMyRoom(data.myRoom || null);
      }
    } catch {
      // silent fail
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!restoring && (!activeRoom || isMinimized)) {
      fetchLobbyRooms();
    }
  }, [restoring, activeRoom, isMinimized, fetchLobbyRooms]);

  const handleRoomUpdate = useCallback((updatedRoom: VoiceRoom) => {
    setActiveRoom(updatedRoom);
    try {
      localStorage.setItem('vr_active_room', updatedRoom.id);
    } catch {}
  }, []);

  const handleJoinRoom = useCallback(
    async (room: VoiceRoom, password?: string) => {
      const isGuest = !authUser;
      const userId = authUser?.id || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const username = authUser?.username || `guest_${Math.random().toString(36).substr(2, 6)}`;
      const displayName = authUser?.displayName || 'مستمع';
      const avatar = authUser?.avatar || '';

      try {
        const res = await fetch(`/api/voice-rooms/${room.id}?action=join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            displayName,
            avatar,
            ...(password ? { password } : {}),
            ...(isGuest ? { guestId: userId } : {}),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setActiveRoom(room);
          setIsMinimized(false);
          try {
            localStorage.setItem('vr_active_room', room.id);
          } catch {}
        } else {
          toast({
            title: 'لا يمكن الانضمام',
            description: data.error || 'حاول مرة أخرى',
          });
        }
      } catch {
        toast({ title: 'خطأ في الاتصال' });
      }
    },
    [authUser, toast],
  );

  /* ── Public entry: when clicking a room card ── */
  const handleRoomClick = useCallback(
    (room: VoiceRoom) => {
      // Check if user is authenticated — show login dialog if not
      if (!authUser) {
        setLoginDialogOpen(true);
        return;
      }
      // Owner always bypasses password — server-side will handle it
      if (room.hostId === authUser?.id) {
        handleJoinRoom(room);
        return;
      }
      // Non-owner: show password dialog for key-mode rooms
      if (room.roomMode === 'key') {
        setPendingPasswordRoom(room);
      } else {
        handleJoinRoom(room);
      }
    },
    [handleJoinRoom, authUser?.id, authUser],
  );

  /* ── Password dialog callback ── */
  const handlePasswordSubmit = useCallback(
    (password: string) => {
      if (pendingPasswordRoom) {
        handleJoinRoom(pendingPasswordRoom, password);
        setPendingPasswordRoom(null);
      }
    },
    [pendingPasswordRoom, handleJoinRoom],
  );

  /* ── Auth callback: after successful login/register ── */
  const handleAuthSuccess = useCallback((user: AuthUserFull) => {
    setAuthUser({
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || '',
      numericId: user.numericId || null,
      vipLevel: 0,
    });
    setLoginDialogOpen(false);
    setRegisterDialogOpen(false);
  }, []);

  /* ── Create room ── */
  const handleCreateRoom = useCallback(
    async (data: {
      name: string;
      description: string;
      micSeatCount: number;
      roomMode: RoomMode;
      roomPassword: string;
      maxParticipants: number;
      isAutoMode: boolean;
      micTheme: string;
      roomImage?: string;
      roomAvatar?: string;
    }) => {
      try {
        const res = await fetch('/api/voice-rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            hostName: authUser?.displayName || '',
          }),
        });
        const result = await res.json();
        if (result.success && result.room) {
          try {
            await fetch(`/api/voice-rooms/${result.room.id}?action=save-template`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: data.name,
                description: data.description,
                micSeatCount: data.micSeatCount,
                roomMode: data.roomMode,
                roomPassword: data.roomPassword,
                maxParticipants: data.maxParticipants,
                isAutoMode: data.isAutoMode,
                micTheme: data.micTheme,
                allowedRoles: [],
              }),
            });
          } catch { /* ignore */ }

          // Update lobby data after creating
          fetchLobbyRooms();
          setCreateDialogOpen(false);
          handleJoinRoom(result.room);
        }
      } catch { /* ignore */ }
    },
    [authUser, handleJoinRoom, fetchLobbyRooms],
  );

  /* ── Exit room ──
     alreadyCalledLeave=false → minimize (keep room alive, show floating widget)
     alreadyCalledLeave=true  → actually leave (clear room, back to lobby)
  */
  const handleExitRoom = useCallback(async (alreadyCalledLeave?: boolean) => {
    if (alreadyCalledLeave) {
      // Actually leaving the room
      try {
        const savedRoomId = localStorage.getItem('vr_active_room');
        if (savedRoomId) {
          await fetch(`/api/voice-rooms/${savedRoomId}?action=leave`, {
            method: 'POST',
          });
        }
      } catch { /* ignore */ }
      setActiveRoom(null);
      setIsMinimized(false);
      try {
        localStorage.removeItem('vr_active_room');
      } catch {}
      fetchLobbyRooms();
    } else {
      // Minimize: keep room alive, show floating widget
      setIsMinimized(true);
    }
  }, [fetchLobbyRooms]);

  /* ── Restore from minimize ── */
  const handleRestoreFromMinimize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  /* ── Loading while restoring room ── */
  if (restoring) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: TUI_COLORS_G1 }}
        dir="rtl"
      >
        <Loader2 className="w-10 h-10 text-[#6c63ff] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Global styles injection (Cairo font + animations) */}
      <InjectStyles />

      {/* ── Room Interior View (mounted when activeRoom exists, hidden when minimized) ──
           Keep mounted during minimize so heartbeat/polling continue running.
           Using pointer-events-none and visibility:hidden instead of conditional render. */}
      {activeRoom && (
        <div
          style={{
            display: isMinimized ? 'none' : 'block',
          }}
        >
          <RoomInteriorView
            room={activeRoom}
            onExit={handleExitRoom}
            authUser={authUser}
            onRoomUpdate={handleRoomUpdate}
          />
        </div>
      )}

      {/* ── Lobby View (shown when no room or minimized) ── */}
      {!activeRoom || isMinimized ? (
        <RoomListView
          rooms={rooms}
          myRoom={myRoom}
          onRoomClick={handleRoomClick}
          onCreateRoom={() => setCreateDialogOpen(true)}
          authUser={authUser}
          loading={loadingRooms}
        />
      ) : null}

      {/* ── Floating Minimized Room Widget (draggable) ── */}
      {activeRoom && isMinimized && (
        <FloatingRoomWidget
          roomName={activeRoom.name}
          onClick={handleRestoreFromMinimize}
        />
      )}

      {/* Login/Register modals for unauthenticated users */}
      <LoginModal
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        onSwitchToRegister={() => { setLoginDialogOpen(false); setTimeout(() => setRegisterDialogOpen(true), 150); }}
        onLoginSuccess={handleAuthSuccess}
      />
      <RegisterModal
        open={registerDialogOpen}
        onOpenChange={setRegisterDialogOpen}
        onSwitchToLogin={() => { setRegisterDialogOpen(false); setTimeout(() => setLoginDialogOpen(true), 150); }}
        onRegisterSuccess={handleAuthSuccess}
      />

      {/* Password dialog for key-mode rooms */}
      <PasswordDialog
        isOpen={!!pendingPasswordRoom}
        onClose={() => setPendingPasswordRoom(null)}
        onSubmit={handlePasswordSubmit}
      />

      {/* Create Room dialog */}
      <CreateRoomDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateRoom}
        authUser={authUser}
      />
    </>
  );
}
