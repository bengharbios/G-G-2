'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type {
  AuthUser, VoiceRoom, VoiceRoomParticipant, Gift, ChatMessage,
  ActiveGiftAnimation, SeatData, RoomRole, MicMenuSheetState,
} from '../types';
import {
  canDo, genId, DEFAULT_GIFTS, ROLE_LABELS,
} from '../types';

// ─── Main Room Hook ────────────────────────────────────────────────────────

export function useVoiceRoom(
  initialRoom: VoiceRoom,
  authUser: AuthUser | null,
  onRoomUpdate: (updatedRoom: VoiceRoom) => void,
) {
  const { toast } = useToast();

  /* ── State ── */
  const [room, setRoom] = useState<VoiceRoom>(initialRoom);
  const [participants, setParticipants] = useState<VoiceRoomParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<VoiceRoomParticipant | null>(null);
  const [myRole, setMyRole] = useState<RoomRole>('visitor');
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRoomMuted, setIsRoomMuted] = useState(false);
  const [lastChatTimestamp, setLastChatTimestamp] = useState(0);
  const [profileStats, setProfileStats] = useState<{ giftsSent: number; giftsReceived: number; totalReceivedValue: number } | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Refs for adaptive chat polling ──
  const prevTimestampRef = useRef(0); // track last seen timestamp to detect new messages
  const [weeklyGems, setWeeklyGems] = useState(0);
  const [myGemsBalance, setMyGemsBalance] = useState(0);
  const [topGifts, setTopGifts] = useState<Array<{
    giftName: string; giftEmoji: string; gems: number;
    senderName: string; senderAvatar: string;
    receiverName: string; receiverAvatar: string;
    createdAt: string;
  }>>([]);

  /* ── UI state ── */
  const [profileSheet, setProfileSheet] = useState<VoiceRoomParticipant | null>(null);
  const [giftSheetOpen, setGiftSheetOpen] = useState(false);
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<ActiveGiftAnimation | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<string>('');
  const pendingInviteDismissedRef = useRef(false);
  const [pendingMicInvite, setPendingMicInvite] = useState<number>(-1);
  const [micMenuSheet, setMicMenuSheet] = useState<MicMenuSheetState>({
    isOpen: false, seatIndex: -1, participant: null, mySeatIndex: -1,
  });

  const roomId = room.id;
  const currentUserId = myParticipant?.userId || authUser?.id || '';
  const isOnSeat = myParticipant && myParticipant.seatIndex >= 0;

  /* ── Build seat data ── */
  const buildSeats = useCallback((): SeatData[] => {
    const seatMap = new Map<number, VoiceRoomParticipant>();
    participants.forEach(p => {
      if (p.seatIndex >= 0) seatMap.set(p.seatIndex, p);
    });
    const lockedSet = new Set(room.lockedSeats || []);
    const seats: SeatData[] = [];
    for (let i = 0; i < room.micSeatCount; i++) {
      const p = seatMap.get(i) || null;
      const isLocked = lockedSet.has(i);
      seats.push({
        seatIndex: i,
        participant: p,
        status: p ? (p.seatStatus || 'open') : (isLocked ? 'locked' : 'open'),
      });
    }
    return seats;
  }, [participants, room.micSeatCount, room.lockedSeats]);

  /* ── API fetchers ── */
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=participants`);
      const data = await res.json();
      if (data.success && data.participants) {
        setParticipants(data.participants);
        const me = data.participants.find((p: VoiceRoomParticipant) => p.userId === authUser?.id);
        if (me) {
          setMyParticipant(me);
          setMyRole(me.role);
          setIsMicMuted(me.isMuted);
        }
      }
    } catch { /* ignore */ }
  }, [roomId, authUser?.id]);

  const fetchMyParticipant = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=my-participant`);
      const data = await res.json();
      if (data.success && data.participant) {
        setMyParticipant(data.participant);
        setMyRole(data.participant.role);
        setIsMicMuted(data.participant.isMuted);
        if (data.participant.pendingRole && data.participant.pendingRole !== '' && !pendingInviteDismissedRef.current) {
          setPendingInvite(data.participant.pendingRole);
        }
        if (data.participant.pendingMicInvite !== undefined && Number(data.participant.pendingMicInvite) >= 0) {
          setPendingMicInvite(Number(data.participant.pendingMicInvite));
        }
      } else if (data.success && !data.participant && authUser) {
        // Auto-rejoin: participant record was cleaned up (e.g. app went to background)
        // Silently rejoin without leaving the room view
        console.log('[VoiceRoom] Participant not found, auto-rejoining...');
        try {
          await fetch(`/api/voice-rooms/${roomId}?action=join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: authUser.id,
              username: authUser.username,
              displayName: authUser.displayName,
              avatar: authUser.avatar,
            }),
          });
          // Refresh participant state after rejoin
          const reRes = await fetch(`/api/voice-rooms/${roomId}?action=my-participant`);
          const reData = await reRes.json();
          if (reData.success && reData.participant) {
            setMyParticipant(reData.participant);
            setMyRole(reData.participant.role);
            setIsMicMuted(reData.participant.isMuted);
          }
        } catch { /* ignore — will retry on next poll */ }
      }
    } catch { /* ignore */ }
  }, [roomId, authUser]);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=gifts`);
      const data = await res.json();
      if (data.success && data.gifts) setGifts(data.gifts);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchWeeklyGems = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=weekly-gems`);
      const data = await res.json();
      if (data.success) setWeeklyGems(data.gems);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchMyGemsBalance = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=my-gems`);
      const data = await res.json();
      if (data.success) setMyGemsBalance(data.gems);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchTopGifts = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=top-gifts&limit=20`);
      const data = await res.json();
      if (data.success && data.gifts) setTopGifts(data.gifts);
    } catch { /* ignore */ }
  }, [roomId]);

  const fetchChatMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}/chat?after=${lastChatTimestamp}`);
      const data = await res.json();
      if (data.success && data.messages?.length > 0) {
        setChatMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = data.messages
            .filter((m: Record<string, unknown>) => !existingIds.has(m.id as string))
            .map((m: Record<string, unknown>) => ({
              id: m.id as string,
              userId: m.userId as string,
              displayName: m.displayName as string,
              avatar: m.avatar as string,
              text: m.text as string,
              time: new Date(m.timestamp as number).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
              isSystem: m.isSystem as boolean,
              isGift: m.isGift as boolean,
            }));
          const maxTs = Math.max(...data.messages.map((m: Record<string, unknown>) => m.timestamp as number));
          if (maxTs > lastChatTimestamp) {
            setLastChatTimestamp(maxTs);
            prevTimestampRef.current = maxTs;
          }
          return [...prev, ...newMsgs];
        });
      }
    } catch { /* ignore */ }
  }, [roomId, lastChatTimestamp]);

  const fetchRoomDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=room-details`);
      const data = await res.json();
      if (data.success && data.room) {
        const updatedRoom = { ...data.room, lockedSeats: data.room.lockedSeats || [] };
        setRoom(updatedRoom);
        setIsRoomMuted(!!updatedRoom.chatMuted);
        onRoomUpdate(updatedRoom);
      }
    } catch { /* ignore */ }
  }, [roomId, onRoomUpdate]);

  const checkKicked = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=kicked`);
      const data = await res.json();
      return data.success && data.kicked;
    } catch { return false; }
  }, [roomId]);

  /* ── Stable polling using refs ── */
  const fetchParticipantsRef = useRef(fetchParticipants);
  const fetchChatMessagesRef = useRef(fetchChatMessages);
  const fetchRoomDetailsRef = useRef(fetchRoomDetails);
  const fetchMyParticipantRef = useRef(fetchMyParticipant);
  const fetchGiftsRef = useRef(fetchGifts);
  const fetchWeeklyGemsRef = useRef(fetchWeeklyGems);
  const fetchTopGiftsRef = useRef(fetchTopGifts);
  const checkKickedRef = useRef(checkKicked);
  const toastRef = useRef(toast);

  useEffect(() => { fetchParticipantsRef.current = fetchParticipants; }, [fetchParticipants]);
  useEffect(() => { fetchChatMessagesRef.current = fetchChatMessages; }, [fetchChatMessages]);
  useEffect(() => { fetchRoomDetailsRef.current = fetchRoomDetails; }, [fetchRoomDetails]);
  useEffect(() => { fetchMyParticipantRef.current = fetchMyParticipant; }, [fetchMyParticipant]);
  useEffect(() => { fetchGiftsRef.current = fetchGifts; }, [fetchGifts]);
  useEffect(() => { fetchWeeklyGemsRef.current = fetchWeeklyGems; }, [fetchWeeklyGems]);
  useEffect(() => { fetchTopGiftsRef.current = fetchTopGifts; }, [fetchTopGifts]);
  const fetchMyGemsBalanceRef = useRef(fetchMyGemsBalance);
  useEffect(() => { fetchMyGemsBalanceRef.current = fetchMyGemsBalance; }, [fetchMyGemsBalance]);
  useEffect(() => { checkKickedRef.current = checkKicked; }, [checkKicked]);
  useEffect(() => { toastRef.current = toast; }, [toast]);

  // ── Adaptive chat polling state ──
  const chatActivityRef = useRef(0); // higher = more active conversation
  const chatPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleNextChatPollRef = useRef<(fast?: boolean) => void>(() => {});

  const scheduleNextChatPoll = useCallback((fast = false) => {
    if (chatPollTimerRef.current) clearTimeout(chatPollTimerRef.current);
    // Fast mode: 600ms when active conversation detected
    // Active mode: 900ms when there was recent activity
    // Idle mode: 2000ms when no new messages
    const delay = fast ? 600 : (chatActivityRef.current > 0 ? 900 : 2000);
    if (fast) chatActivityRef.current = Math.min(chatActivityRef.current + 4, 10);
    else chatActivityRef.current = Math.max(0, chatActivityRef.current - 1);

    chatPollTimerRef.current = setTimeout(async () => {
      const tsBefore = prevTimestampRef.current;
      await fetchChatMessagesRef.current();
      const tsAfter = prevTimestampRef.current;
      // New messages arrived if timestamp changed
      const newMsgsArrived = tsAfter > tsBefore;
      if (newMsgsArrived) {
        chatActivityRef.current = Math.min(chatActivityRef.current + 3, 10);
        scheduleNextChatPollRef.current(true); // Poll fast
      } else {
        scheduleNextChatPollRef.current(false); // Poll slow
      }
    }, delay);
  }, []);

  scheduleNextChatPollRef.current = scheduleNextChatPoll; // eslint-disable-line react-hooks/refs

  useEffect(() => {
    let cancelled = false;
    let partPoll: ReturnType<typeof setInterval> | null = null;
    let roomPoll: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      setLoading(true);
      const kicked = await checkKickedRef.current();
      if (kicked) {
        toastRef.current({ title: 'تم طردك من الغرفة', description: 'لا يمكنك الدخول حالياً' });
        setLoading(false);
        return;
      }
      if (!cancelled) {
        await Promise.all([
          fetchParticipantsRef.current(),
          fetchMyParticipantRef.current(),
          fetchGiftsRef.current(),
          fetchChatMessagesRef.current(),
          fetchRoomDetailsRef.current(),
          fetchWeeklyGemsRef.current(),
          fetchTopGiftsRef.current(),
          fetchMyGemsBalanceRef.current(),
        ]);
        setLoading(false);
        // Start adaptive chat polling after init
        scheduleNextChatPollRef.current(false);
      }
    };
    init();

    partPoll = setInterval(() => { if (!cancelled) fetchParticipantsRef.current(); }, 2500);
    roomPoll = setInterval(() => { if (!cancelled) fetchRoomDetailsRef.current(); }, 6000);
    const myPoll = setInterval(() => { if (!cancelled) fetchMyParticipantRef.current(); }, 3000);
    const gemsPoll = setInterval(() => { if (!cancelled) fetchWeeklyGemsRef.current(); }, 10000);
    const myGemsPoll = setInterval(() => { if (!cancelled) fetchMyGemsBalanceRef.current(); }, 10000);
    const heartbeatPoll = setInterval(() => {
      if (!cancelled && authUser) {
        fetch(`/api/voice-rooms/${roomId}?action=heartbeat`, { method: 'GET' }).catch(() => {});
      }
    }, 8000);

    // ── Visibility change: send heartbeat immediately when app returns to foreground ──
    const handleVisibilityChange = () => {
      if (!document.hidden && !cancelled && authUser) {
        // App came back to foreground — send heartbeat immediately
        fetch(`/api/voice-rooms/${roomId}?action=heartbeat`, { method: 'GET' }).catch(() => {});
        // Also refresh participant list and own state immediately
        fetchParticipantsRef.current();
        fetchMyParticipantRef.current();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Auto-rejoin: if my participant record is missing, rejoin the room ──
    // (myPoll already defined above)

    // Send leave request when user closes browser/tab
    const handleBeforeUnload = () => {
      if (authUser) {
        fetch(`/api/voice-rooms/${roomId}?action=leave`, {
          method: 'POST',
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cancelled = true;
      if (partPoll) clearInterval(partPoll);
      if (roomPoll) clearInterval(roomPoll);
      if (myPoll) clearInterval(myPoll);
      if (gemsPoll) clearInterval(gemsPoll);
      if (myGemsPoll) clearInterval(myGemsPoll);
      if (heartbeatPoll) clearInterval(heartbeatPoll);
      if (chatPollTimerRef.current) clearTimeout(chatPollTimerRef.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomId]);

  /* ── Profile stats ── */

  useEffect(() => {
    if (myParticipant?.pendingRole && pendingInvite) {
      pendingInviteDismissedRef.current = false;
    }
  }, [myParticipant?.pendingRole]);

  useEffect(() => {
    if (!profileSheet) return;
    let cancelled = false;
    fetch(`/api/voice-rooms/${roomId}?action=user-stats&userId=${profileSheet.userId}`)
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setProfileStats(d.stats); })
      .catch(() => { if (!cancelled) setProfileStats(null); });
    return () => { cancelled = true; };
  }, [profileSheet, roomId]);

  /* ── Actions ── */

  const handleSendChat = useCallback(async (chatInput: string) => {
    if (!chatInput.trim() || isRoomMuted || !authUser) return;
    const text = chatInput.trim();
    try {
      await fetch(`/api/voice-rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          displayName: authUser.displayName,
          avatar: authUser.avatar,
        }),
      });
      // Immediately refresh chat + trigger fast polling so recipient sees it quickly
      chatActivityRef.current = 5;
      await fetchChatMessagesRef.current();
      scheduleNextChatPoll(true);
    } catch { /* ignore */ }
  }, [isRoomMuted, authUser, roomId, scheduleNextChatPoll]);

  const handleToggleMic = useCallback(async () => {
    if (myParticipant?.micFrozen) {
      toast({ title: 'المايك مجمد', description: 'لا يمكنك إلغاء الكتم' });
      return;
    }
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=toggle-mic`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setIsMicMuted(data.isMuted);
        if (!data.frozen) {
          toast({ title: data.isMuted ? 'تم كتم المايك' : 'تم فتح المايك' });
        }
      }
    } catch { /* ignore */ }
  }, [roomId, myParticipant, toast]);

  const handleToggleRoomMute = useCallback(async () => {
    const newMuted = !isRoomMuted;
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=update-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatMuted: newMuted ? 1 : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRoomMuted(newMuted);
        toast({ title: newMuted ? 'تم كتم الغرفة' : 'تم فتح الغرفة' });
      }
    } catch { /* ignore */ }
  }, [roomId, isRoomMuted, toast]);

  const handleRequestSeat = useCallback(async (seatIndex: number) => {
    if (!authUser) {
      toast({ title: 'يجب تسجيل الدخول', description: 'سجل دخولك أولاً للصعود على المايك' });
      return;
    }
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=request-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUser.username,
          displayName: authUser.displayName,
          avatar: authUser.avatar,
          seatIndex,
        }),
      });
      const data = await res.json();
      if (data.success && data.autoAssigned) {
        toast({ title: 'تم تعيينك على المايك', description: `مقعد ${data.seatIndex + 1}` });
      } else if (data.success) {
        toast({ title: 'تم إرسال الطلب', description: 'بانتظار الموافقة' });
      } else {
        toast({ title: 'لم يتم الصعود', description: data.error || 'حاول مرة أخرى' });
      }
      await fetchParticipants();
      await fetchMyParticipant();
    } catch { /* ignore */ }
  }, [roomId, authUser, fetchParticipants, fetchMyParticipant, toast]);

  const handleKickFromMic = useCallback(async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=kick-from-mic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم سحبه من المايك' });
        await fetchParticipants();
      } else {
        toast({ title: 'فشل', description: data.error || 'حاول مرة أخرى' });
      }
    } catch { /* ignore */ }
  }, [roomId, fetchParticipants, toast]);

  const handleKickTemp = useCallback(async (minutes: number, targetUserId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=kick-from-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, durationMinutes: minutes }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم طرده مؤقتاً' });
        await fetchParticipants();
      }
    } catch { /* ignore */ }
  }, [roomId, fetchParticipants, toast]);

  const handleBan = useCallback(async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم طرده نهائياً' });
        await fetchParticipants();
      }
    } catch { /* ignore */ }
  }, [roomId, fetchParticipants, toast]);

  const handleSetSeatStatus = useCallback(async (seatIndex: number, status: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=set-seat-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatIndex, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: status === 'locked' ? 'تم قفل المقعد' : 'تم فتح المقعد' });
        await fetchParticipants();
      }
    } catch { /* ignore */ }
  }, [roomId, fetchParticipants, toast]);

  const handleSendGift = useCallback(async (giftId: string, target: string, quantity: number, specificUserId?: string, specificDisplayName?: string) => {
    if (!authUser) return;
    try {
      const toUserId = target === 'specific' ? (specificUserId || profileSheet?.userId) : undefined;
      if (target === 'specific' && !toUserId) return;
      // Look up gift price from DEFAULT_GIFTS (client-side hardcoded) since DB uses different IDs
      const giftData = DEFAULT_GIFTS.find(g => g.id === giftId) || (gifts.length > 0 ? gifts.find(g => g.id === giftId) : undefined);
      const unitPrice = giftData?.price || 0;
      const body: Record<string, unknown> = { giftId, unitPrice };
      if (toUserId) body.toUserId = toUserId;
      if (quantity && quantity > 1) body.quantity = quantity;
      const res = await fetch("/api/voice-rooms/" + roomId + "?action=gift", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: data.error || 'فشل إرسال الهدية', description: 'حاول مرة أخرى' });
        return;
      }
      const totalCost = unitPrice * (quantity || 1);
      // Resolve recipient name: prefer explicit displayName, then lookup from participants, fallback
      let receiverName: string;
      if (specificDisplayName) {
        receiverName = specificDisplayName;
      } else if (toUserId) {
        const receiverParticipant = participants.find(p => p.userId === toUserId);
        receiverName = receiverParticipant?.displayName || 'شخص';
      } else {
        receiverName = 'الجميع';
      }

      const giftMsg: ChatMessage = {
        id: genId(),
        userId: authUser.id,
        displayName: authUser.displayName,
        avatar: authUser.avatar,
        text: (quantity && quantity > 1
          ? `⭐ ${authUser.displayName} أرسل ${quantity}× ${giftData?.nameAr || 'هدية'} لـ ${receiverName}`
          : `⭐ ${authUser.displayName} أرسل ${giftData?.nameAr || 'هدية'} لـ ${receiverName}`),
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        isGift: true,
        giftEmoji: giftData?.emoji,
        giftAnimation: giftData?.animation,
      };
      setChatMessages(prev => [...prev, giftMsg]);

      if (giftData && giftData.animation && giftData.animation !== 'none') {
        const anim: ActiveGiftAnimation = {
          id: genId(),
          emoji: giftData.emoji,
          senderName: authUser.displayName,
          receiverName: receiverName,
          giftName: giftData.nameAr,
          animation: giftData.animation,
          price: totalCost,
          timestamp: Date.now(),
          grade: giftData.grade,
          bmType: giftData.bmType,
          video: giftData.video,
          giftImageUrl: giftData.giftImageUrl,
          animationResourceUrl: giftData.animationResourceUrl,
          format: giftData.format,
          timeLength: giftData.timeLength,
        };
        setActiveGiftAnimation(anim);
        const clearDelay = giftData.timeLength
          ? (giftData.timeLength * 1000) + 500
          : totalCost >= 5200 ? 4000 : totalCost >= 199 ? 3000 : 2000;
        setTimeout(() => setActiveGiftAnimation(null), clearDelay);
      }

      toast({ title: 'تم إرسال الهدية! 🎉' });
      fetchMyGemsBalance();
      fetchWeeklyGems();
      fetchTopGifts();
    } catch (err) {
      console.error('[Gift Send Error]', err);
      toast({ title: 'فشل إرسال الهدية', description: 'حاول مرة أخرى' });
    }
  }, [roomId, authUser, gifts, participants, profileSheet, toast, fetchWeeklyGems, fetchTopGifts, fetchMyGemsBalance]);

  /* ── Seat click handler ── */
  const handleSeatClick = useCallback((seatIndex: number) => {
    const seats = buildSeats();
    const seatData = seats[seatIndex];
    if (!seatData) return;

    const isAdmin = canDo(myRole, 'admin');
    const mySeat = myParticipant?.seatIndex ?? -1;

    if (seatData.participant) {
      if (isAdmin) {
        setMicMenuSheet({ isOpen: true, seatIndex, participant: seatData.participant, mySeatIndex: mySeat });
      } else if (seatData.participant.userId === currentUserId) {
        setMicMenuSheet({ isOpen: true, seatIndex, participant: seatData.participant, mySeatIndex: mySeat });
      } else {
        setProfileSheet(seatData.participant);
      }
    } else {
      if (seatData.status === 'locked') {
        if (isAdmin) {
          setMicMenuSheet({ isOpen: true, seatIndex, participant: null, mySeatIndex: mySeat });
        } else {
          toast({ title: 'المقعد مقفل', description: 'لا يمكنك الجلوس هنا' });
        }
      } else {
        if (isAdmin) {
          setMicMenuSheet({ isOpen: true, seatIndex, participant: null, mySeatIndex: mySeat });
        } else if (mySeat >= 0 && mySeat !== seatIndex) {
          handleRequestSeat(seatIndex);
        } else {
          handleRequestSeat(seatIndex);
        }
      }
    }
  }, [myRole, buildSeats, handleRequestSeat, toast, currentUserId, myParticipant?.seatIndex]);

  /* ── Mic menu action dispatcher ── */
  const micMenuSheetRef = useRef(micMenuSheet);
  useEffect(() => { micMenuSheetRef.current = micMenuSheet; }, [micMenuSheet]);

  const handleMicMenuAction = useCallback(async (action: string) => {
    const { seatIndex, participant } = micMenuSheetRef.current;
    switch (action) {
      case 'view-profile':
      case 'profile':
        if (participant) setProfileSheet(participant);
        break;
      case 'take-seat':
      case 'change-mic':
        await handleRequestSeat(seatIndex);
        break;
      case 'lock-seat':
        await handleSetSeatStatus(seatIndex, 'locked');
        await fetchRoomDetails();
        break;
      case 'unlock-seat':
        await handleSetSeatStatus(seatIndex, 'open');
        await fetchRoomDetails();
        break;
      case 'close-seat':
        if (participant) await handleKickFromMic(participant.userId);
        await handleSetSeatStatus(seatIndex, 'locked');
        await fetchRoomDetails();
        break;
      case 'pull-from-mic':
        if (participant) await handleKickFromMic(participant.userId);
        break;
      case 'kick-temp':
        setKickDialogOpen(true);
        break;
      case 'kick-perm':
        if (participant) await handleBan(participant.userId);
        break;
      case 'leave-seat':
        try {
          await fetch(`/api/voice-rooms/${roomId}?action=leave-seat`, { method: 'POST' });
          await fetchParticipants();
          await fetchMyParticipant();
        } catch { /* ignore */ }
        break;
      case 'toggle-lock': {
        const isCurrentlyLocked = (room.lockedSeats || []).includes(seatIndex);
        await handleSetSeatStatus(seatIndex, isCurrentlyLocked ? 'open' : 'locked');
        await fetchRoomDetails();
        break;
      }
    }
  }, [roomId, room, handleRequestSeat, handleSetSeatStatus, handleKickFromMic, handleBan, fetchRoomDetails, fetchParticipants, fetchMyParticipant]);

  /* ── Update settings ── */
  const handleUpdateSettings = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=update-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'تم تحديث الإعدادات' });
        setRoom(prev => ({ ...prev, ...data }));
        onRoomUpdate({ ...room, ...data });
        fetchRoomDetails();
        fetchParticipants();
      } else {
        toast({ title: 'فشل التحديث', description: result.error || 'حاول مرة أخرى' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال' });
    }
  }, [roomId, toast, fetchRoomDetails, fetchParticipants, room, onRoomUpdate]);

  /* ── Accept/Reject role invitation ── */
  const handleAcceptInvite = useCallback(async () => {
    if (!pendingInvite) return;
    const inviteRole = pendingInvite;
    setPendingInvite(''); // Clear immediately to prevent re-trigger
    pendingInviteDismissedRef.current = true;
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=accept-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        const acceptedRole = data.role || inviteRole;
        toast({ title: 'تم قبول الدعوة! ⭐', description: `أصبحت ${ROLE_LABELS[acceptedRole as RoomRole] || acceptedRole}` });
      } else {
        toast({ title: 'فشل قبول الدعوة', description: data.error || 'الدعوة لم تعد متاحة، اطلب دعوة جديدة' });
      }
      await Promise.all([fetchParticipants(), fetchMyParticipant()]);
    } catch {
      toast({ title: 'خطأ في الاتصال', description: 'تحقق من الإنترنت وحاول مرة أخرى' });
    }
  }, [roomId, pendingInvite, toast, fetchParticipants, fetchMyParticipant]);

  const handleRejectInvite = useCallback(async () => {
    try {
      await fetch(`/api/voice-rooms/${roomId}?action=reject-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setPendingInvite('');
      pendingInviteDismissedRef.current = true;
      toast({ title: 'تم رفض الدعوة' });
    } catch { /* ignore */ }
  }, [roomId, toast]);

  /* ── Invite user to mic ── */
  const handleInviteToMic = useCallback(async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=invite-to-mic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, seatIndex: -1 }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم إرسال دعوة للمايك' });
      } else {
        toast({ title: 'فشل الإرسال', description: data.error || 'لا توجد مقاعد فارغة' });
      }
    } catch { /* ignore */ }
  }, [roomId, toast]);

  /* ── Accept mic invitation ── */
  const handleAcceptMicInvite = useCallback(async () => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=accept-mic-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم الصعود للمايك', description: `مقعد ${data.seatIndex + 1}` });
        setPendingMicInvite(-1);
        await Promise.all([fetchParticipants(), fetchMyParticipant()]);
      } else {
        toast({ title: 'المقعد لم يعد متاحاً' });
        setPendingMicInvite(-1);
      }
    } catch { /* ignore */ }
  }, [roomId, toast, fetchParticipants, fetchMyParticipant]);

  const handleRejectMicInvite = useCallback(async () => {
    try {
      await fetch(`/api/voice-rooms/${roomId}?action=reject-mic-invite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      setPendingMicInvite(-1);
      toast({ title: 'تم رفض دعوة المايك' });
    } catch { /* ignore */ }
  }, [roomId, toast]);

  /* ── Profile actions ── */
  const handleRemoveRole = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/voice-rooms/${roomId}?action=change-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, newRole: 'visitor' }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'تم إزالة الدور', description: 'أصبح المستخدم زائراً في الغرفة' });
        await fetchParticipants();
        await fetchMyParticipant();
      } else {
        toast({ title: 'فشل الإزالة', description: data.error || 'لا يمكنك إزالة هذا الدور' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال' });
    }
  }, [roomId, toast, fetchParticipants, fetchMyParticipant]);

  const handleProfileKickTemp = useCallback((userId: string) => {
    fetch(`/api/voice-rooms/${roomId}?action=kick-from-room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId, durationMinutes: 10 }),
    }).then(r => r.json()).then(d => {
      if (d.success) { toast({ title: 'تم طرده مؤقتاً' }); fetchParticipants(); }
    }).catch(() => {});
  }, [roomId, toast, fetchParticipants]);

  const handleProfileBan = useCallback((userId: string) => {
    fetch(`/api/voice-rooms/${roomId}?action=ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: userId }),
    }).then(r => r.json()).then(d => {
      if (d.success) { toast({ title: 'تم طرده نهائياً' }); fetchParticipants(); }
    }).catch(() => {});
  }, [roomId, toast, fetchParticipants]);

  const handleChangeRole = useCallback(async (userId: string, newRole: RoomRole) => {
    try {
      if (newRole === 'member') {
        const res = await fetch(`/api/voice-rooms/${roomId}?action=invite-role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId: userId, newRole }),
        });
        const data = await res.json();
        if (data.success) {
          toast({ title: 'تم إرسال دعوة العضوية ⭐', description: 'بانتظار قبول المستخدم' });
        } else {
          toast({ title: 'فشل إرسال الدعوة', description: data.error || 'حاول مرة أخرى' });
        }
        return;
      }
      const res = await fetch(`/api/voice-rooms/${roomId}?action=change-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `تم تغيير الدور إلى ${ROLE_LABELS[newRole]}` });
        await fetchParticipants();
        await fetchMyParticipant();
      } else {
        toast({ title: 'فشل تغيير الدور', description: data.error || 'حاول مرة أخرى' });
      }
    } catch {
      toast({ title: 'خطأ في الاتصال' });
    }
  }, [roomId, toast, fetchParticipants, fetchMyParticipant]);

  /* ── Leave room ── */
  const handleLeaveRoom = useCallback(async () => {
    try {
      await fetch(`/api/voice-rooms/${roomId}?action=leave`, { method: 'POST' });
    } catch { /* ignore */ }
    setChatMessages([]);
  }, [roomId]);

  /* ── Copy link ── */
  const handleCopyLink = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      toast({ title: 'تم نسخ رابط الغرفة' });
    }).catch(() => {
      toast({ title: 'تم نسخ رابط الغرفة' });
    });
  }, [toast]);

  const seats = buildSeats();
  const listenerCount = Math.max(0, participants.length - participants.filter(p => p.seatIndex >= 0).length);

  return {
    // State
    room, participants, myParticipant, myRole, gifts, chatMessages,
    isRoomMuted, isMicMuted, loading, weeklyGems, topGifts, seats, myGemsBalance,
    profileStats, profileSheet, giftSheetOpen, activeGiftAnimation,
    settingsOpen, kickDialogOpen, pendingInvite, pendingMicInvite,
    micMenuSheet, currentUserId, isOnSeat, listenerCount,

    // Setters
    setProfileSheet, setGiftSheetOpen, setSettingsOpen,
    setKickDialogOpen, setPendingInvite, setPendingMicInvite,
    setMicMenuSheet,

    // Actions
    handleSendChat, handleToggleMic, handleToggleRoomMute,
    handleRequestSeat, handleSeatClick, handleMicMenuAction,
    handleUpdateSettings, handleSendGift, handleAcceptInvite,
    handleRejectInvite, handleInviteToMic, handleAcceptMicInvite,
    handleRejectMicInvite, handleLeaveRoom, handleCopyLink,
    handleKickTemp, handleBan,
    handleRemoveRole, handleProfileKickTemp, handleProfileBan,
    handleChangeRole,
    fetchTopGifts,
    fetchParticipants, fetchMyParticipant,
  };
}
