'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { TUI, type VoiceRoom, type AuthUser } from '../types';
import type { SeatData, RoomRole } from '../types';
import { useVoiceRoom } from '../hooks/useVoiceRoom';
import { useVoiceRTC } from '../hooks/useVoiceRTC';
import { playJoinSound, playLeaveSound, playMicOnSound, playMicOffSound, playGiftSound, playNotificationSound } from '@/lib/sound-effects';
import { enableBgMusicAutoStart, initVolumeFromStorage } from '@/lib/sounds';

/*
 * RoomInteriorView — مبني من الصفر بناءً على room_layout_room.xml من يلا لودو v1.5.1.0
 *
 * الهيكل (مطابق للـ XML):
 * FrameLayout (root)
 * ├── ImageView (roomImage — خلفية الغرفة)
 * ├── VideoView (خلفية فيديو — معطّلة مؤقتاً)
 * ├── LinearLayout (محتوى عمودي)
 * │   ├── LinearLayout (llRoomTop)
 * │   │   ├── RoomTop (أفتار + اسم + ID + مشاركة + أكثر + إغلاق)
 * │   │   ├── RoomMic (مقاعد المايك — RecyclerView أفقي)
 * │   │   └── RoomSofa (صف الجمهور)
 * │   ├── RoomBody (دردشة عائمة)
 * │   └── RoomInput (شريط سفلي: صوت + مايك + إدخال + إيموجي + صورة + إرسال + هدية SVGA)
 * ├── GiftPlayer (أنيميشن الهدايا)
 * └── FunCenter (عدّاد + ساعة)
 *
 * كل الأيقونات من /room-icons/ (حقيقية من يلا لودو v1.5.1.0)
 */

interface RoomInteriorViewProps {
  room: VoiceRoom;
  onExit: (alreadyCalledLeave?: boolean) => void;
  authUser: AuthUser | null;
  onRoomUpdate: (room: VoiceRoom) => void;
}

export default function RoomInteriorView({ room, onExit, authUser, onRoomUpdate }: RoomInteriorViewProps) {
  // ── Hooks ──
  const vr = useVoiceRoom(room, authUser);
  const voiceRTC = useVoiceRTC(room.id, authUser, {
    onJoinSound: () => playJoinSound(),
    onLeaveSound: () => playLeaveSound(),
    onMicOnSound: () => playMicOnSound(),
    onMicOffSound: () => playMicOffSound(),
    onGiftSound: () => playGiftSound(),
    onNotification: () => playNotificationSound(),
  });

  // ── State ──
  const [chatInput, setChatInput] = useState('');
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ── Background ──
  const currentBgImage = vr.room.roomImage || '';
  const bgStyle: React.CSSProperties = currentBgImage
    ? { backgroundImage: `url(${currentBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(180deg, ${TUI.colors.teal} 0%, ${TUI.colors.tealDark} 30%, #074a42 100%)` };

  // ── Init audio ──
  useEffect(() => {
    initVolumeFromStorage();
    enableBgMusicAutoStart();
  }, []);

  // ── Auto-scroll chat ──
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [vr.chatMessages]);

  // ── Handle send chat ──
  const handleSendChat = useCallback(() => {
    if (!chatInput.trim() || vr.isRoomMuted || !authUser) return;
    vr.handleSendChat(chatInput.trim());
    setChatInput('');
  }, [chatInput, vr, authUser]);

  const isAdmin = vr.myRole === 'owner' || vr.myRole === 'coowner' || vr.myRole === 'admin';
  const isOwner = vr.myRole === 'owner';
  const isOnSeat = vr.isOnSeat;

  // ── Loading ──
  if (vr.loading) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center" style={bgStyle}>
        <Loader2 size={40} className="animate-spin mb-4" style={{ color: TUI.colors.white }} />
        <span style={{ fontSize: 14, color: TUI.colors.white }}>جاري تحميل الغرفة...</span>
      </div>
    );
  }

  /*
   * ═══════════════════════════════════════════════════════════════════════
   * ROOT: FrameLayout — خلفية + محتوى عمودي + أنيميشن
   * ═══════════════════════════════════════════════════════════════════════
   */
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={bgStyle}
      dir="rtl"
    >
      {/* ── خلفية معتمة للقراءة ── */}
      {currentBgImage && (
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1 }} />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT LAYER (z-10) — LinearLayout عمودي
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ═══════════════════════════════════════════════════
            llRoomTop — الهيدر (50dp)
            من room_include_room_top.xml:
            LinearLayout أفقي → [ConstraintLayout: أفتار+اسم+ID+follow] + Space + [share] + [more] + [close]
            ═══════════════════════════════════════════════════ */}
        <div
          className="flex flex-col flex-shrink-0"
          style={{ padding: '8px 12px 0' }}
        >
          {/* ── صف علوي: معلومات الغرفة + أزرار ── */}
          <div className="flex items-center justify-between" style={{ height: 50 }}>
            {/* ── يمين: أفتار الغرفة + اسم + ID ── */}
            <button
              onClick={() => {/* TODO: open room info */}}
              className="flex items-center gap-2 min-w-0 bg-transparent border-none cursor-pointer"
              style={{ flex: 1 }}
            >
              {/* أفتار الغرفة (40dp, زاوية 5dp) */}
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: 40, height: 40, borderRadius: 5,
                  border: '2px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                {vr.room.roomAvatar ? (
                  <img src={vr.room.roomAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src="/room-icons/room_default.webp" alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>

              {/* اسم الغرفة (13sp bold white, max 92dp) + ID (12sp white) */}
              <div className="flex flex-col items-start min-w-0">
                <span
                  className="truncate font-bold"
                  style={{ fontSize: 13, color: '#fff', maxWidth: 92, lineHeight: '20px', height: 20 }}
                >
                  {vr.room.name}
                </span>
                <span
                  className="truncate"
                  style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', maxWidth: 100, direction: 'ltr', textAlign: 'right' }}
                >
                  {vr.room.id}
                </span>
              </div>
            </button>

            {/* ── يسار: مشاركة + أكثر + إغلاق (40dp each) ── */}
            <div className="flex items-center flex-shrink-0" style={{ gap: 6 }}>
              {/* زر المشاركة */}
              <button
                onClick={() => vr.handleCopyLink()}
                className="rounded-full flex items-center justify-center cursor-pointer"
                style={{ width: 40, height: 40, minWidth: 44, minHeight: 44, background: 'transparent', border: 'none' }}
                aria-label="مشاركة"
              >
                <img src="/room-icons/room_icon_share.webp" alt="مشاركة" style={{ width: 28, height: 28 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </button>

              {/* زر المزيد (3 نقاط) — للمشرف */}
              {isAdmin && (
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="rounded-full flex items-center justify-center cursor-pointer"
                  style={{ width: 40, height: 40, minWidth: 44, minHeight: 44, background: 'transparent', border: 'none' }}
                  aria-label="المزيد"
                >
                  <img src="/room-icons/room_icon_room_top_more.webp" alt="المزيد" style={{ width: 28, height: 28 }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </button>
              )}

              {/* زر الإغلاق */}
              <button
                onClick={() => setShowExitMenu(true)}
                className="rounded-full flex items-center justify-center cursor-pointer"
                style={{ width: 40, height: 40, minWidth: 44, minHeight: 44, background: 'transparent', border: 'none' }}
                aria-label="إغلاق"
              >
                <img src="/room-icons/room_icon_room_top_close.webp" alt="إغلاق" style={{ width: 28, height: 28 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              RoomMic — مقاعد المايك (RecyclerView أفقي, 5dp padding top)
              من room_include_room_mic.xml
              ═══════════════════════════════════════════════════ */}
          <div
            className="flex items-start justify-center gap-2 overflow-x-auto"
            style={{ paddingTop: 5, paddingBottom: 3, minHeight: 80 }}
          >
            {vr.seats.map((seat, i) => (
              <SeatCircle
                key={i}
                seat={seat}
                isMySeat={seat.participant?.userId === authUser?.id}
                isSpeaking={voiceRTC.speakingPeers.current?.has(seat.participant?.userId || '') || (seat.participant?.userId === authUser?.id && voiceRTC.localSpeaking)}
                onClick={() => vr.handleSeatClick(seat.seatIndex)}
                authUserId={authUser?.id || ''}
              />
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════
              RoomSofa — صف الجمهور (51dp)
              من room_include_room_sofa.xml:
              [ترتيب الماس] + [عدد الجمهور] + [أفاتارات متراصة]
              ═══════════════════════════════════════════════════ */}
          <div
            className="flex items-center justify-between flex-shrink-0"
            style={{ height: 51, padding: '0 12px' }}
          >
            {/* ── ترتيب الماس ── */}
            <div className="flex items-center gap-1.5">
              <img src="/room-icons/room_icon_rank.webp" alt="" style={{ width: 16, height: 16 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ fontSize: 11, color: '#3de' }}>0</span>
              <img src="/room-icons/room_icon_rank_arrow.webp" alt="" style={{ width: 10, height: 10 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </div>

            {/* ── عدد الجمهور + أفاتارات ── */}
            <div className="flex items-center gap-1.5">
              {/* عدد المستمعين */}
              <div className="flex items-center justify-center"
                style={{ width: 34, height: 34 }}>
                <img src="/room-icons/icon_room_sofa_people_label.webp" alt="" style={{ width: 34, height: 34 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                <span className="absolute" style={{ fontSize: 8, color: '#fff' }}>{vr.listenerCount}</span>
              </div>

              {/* أفاتارات المستمعين (حد أقصى 5) */}
              <div className="flex items-center -space-x-2">
                {vr.participants
                  .filter(p => p.seatIndex < 0)
                  .slice(0, 5)
                  .map(p => (
                    <img
                      key={p.id}
                      src={p.avatar || '/yalla-avatars/defaultPhoto_1.png'}
                      alt=""
                      className="rounded-full border-2 border-[#074a42]"
                      style={{ width: 28, height: 28, objectFit: 'cover' }}
                    />
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            RoomBody — الدردشة العائمة
            من room_include_room_body.xml:
            RecyclerView (دردشة) + شريط عائم + قائمة جانبية + شريط هدايا
            ═══════════════════════════════════════════════════ */}
        <div className="flex-1 relative overflow-hidden" style={{ marginTop: 10 }}>
          {/* ── رسائل الدردشة العائمة ── */}
          <div
            ref={chatScrollRef}
            className="absolute inset-0 overflow-y-auto"
            style={{ paddingRight: 70, paddingLeft: 50, paddingBottom: 10 }}
          >
            {vr.chatMessages.map((msg, i) => (
              <div key={msg.id || i} className="mb-1.5" style={{ maxWidth: '75%' }}>
                <div
                  className="inline-block rounded-xl px-3 py-1.5"
                  style={{
                    backgroundColor: msg.fromUserId === authUser?.id
                      ? 'rgba(0,200,150,0.15)'
                      : 'rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {msg.fromDisplayName || msg.fromUserId}:
                  </span>{' '}
                  <span style={{ fontSize: 12, color: '#fff' }}>{msg.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════
              RoomBodySidebar — القائمة الجانبية اليسرى (45dp width)
              من room_include_room_body_sidebar.xml:
              ScrollView → LinearLayout(vertical, 45dp):
              [activities] + [activities2] + [treasure_chest] + [fruit] + [message_box] + [music]
              ═══════════════════════════════════════════════════ */}
          <div
            className="absolute top-0 left-0 flex flex-col items-center"
            style={{ width: 45, height: '100%', gap: 6, overflowY: 'auto', paddingBottom: 60 }}
          >
            {/* الموسيقى */}
            <button className="flex flex-col items-center bg-transparent border-none cursor-pointer"
              onClick={() => {/* TODO: open music player */}}
              aria-label="الموسيقى">
              <img src="/room-icons/room_icon_room_music.webp" alt="موسيقى"
                style={{ width: 43, height: 43 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>موسيقى</span>
            </button>

            {/* صندوق الكنز */}
            <button className="flex flex-col items-center bg-transparent border-none cursor-pointer"
              onClick={() => {/* TODO: open treasure chest */}}
              aria-label="صندوق الكنز">
              <img src="/room-icons/room_center_small_treasure_chest.webp" alt="كنز"
                style={{ width: 43, height: 43 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>كنز</span>
            </button>

            {/* ماكينة الفواكه */}
            <button className="flex flex-col items-center bg-transparent border-none cursor-pointer"
              onClick={() => {/* TODO: open fruit machine */}}
              aria-label="فواكه">
              <img src="/room-icons/room_fruit_small_icon.webp" alt="فواكه"
                style={{ width: 43, height: 43 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>فواكه</span>
            </button>

            {/* صندوق الرسائل */}
            <button className="flex flex-col items-center bg-transparent border-none cursor-pointer relative"
              onClick={() => {/* TODO: open messages */}}
              aria-label="الرسائل">
              <img src="/room-icons/icon_message_box.webp" alt="رسائل"
                style={{ width: 43, height: 43 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/room-icons/room_chat_icon_emoji.webp'; }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>رسائل</span>
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            RoomInput — الشريط السفلي (50dp min)
            من room_include_room_input.xml:
            LinearLayout أفقي: [sound] + [mic] + [micEmoji] + [EditText(flex)] + [emoji] + [picture] + [send] + [prop] + [gift SVGA]
            ═══════════════════════════════════════════════════ */}
        <div
          className="flex items-center flex-shrink-0"
          style={{
            minHeight: 50,
            padding: '8px 12px',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
            backgroundColor: TUI.colors.G1,
            borderTop: `1px solid ${TUI.colors.G3Divider}`,
          }}
        >
          {/* زر الصوت (38dp) */}
          <button
            onClick={() => voiceRTC.toggleSpeaker()}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center"
            style={{ height: 38 }}
            aria-label="الصوت">
            <img
              src={voiceRTC.isSpeakerMuted
                ? '/room-icons/room_ic_input_sound_off.webp'
                : '/room-icons/room_ic_input_sound.webp'}
              alt="صوت"
              style={{ height: 38, width: 'auto' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </button>

          {/* زر المايك (38dp) — ظاهر فقط إن على مقعد */}
          {isOnSeat && (
            <button
              onClick={() => voiceRTC.toggleMic()}
              className="bg-transparent border-none cursor-pointer flex items-center justify-center ml-2"
              style={{ height: 38 }}
              aria-label="المايك">
              <img
                src={voiceRTC.isLocalMicMuted
                  ? '/room-icons/room_ic_input_mic_off.webp'
                  : '/room-icons/room_ic_input_mic.webp'}
                alt="مايك"
                style={{ height: 38, width: 'auto' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </button>
          )}

          {/* زر إيموجي المايك (38dp) */}
          <button
            onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center ml-2"
            style={{ height: 38 }}
            aria-label="إيموجي">
            <img src="/room-icons/room_mic_emoji_icon.webp" alt="إيموجي"
              style={{ height: 38, width: 'auto' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </button>

          {/* حقل الإدخال (flex-1, 38dp height, 13sp text) */}
          <input
            ref={inputRef}
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            placeholder="قل شيئاً..."
            disabled={vr.isRoomMuted || !authUser}
            className="flex-1 rounded-full"
            style={{
              height: 38,
              fontSize: 13,
              color: '#442',
              backgroundColor: 'rgba(255,255,255,0.9)',
              border: 'none',
              padding: '0 12px',
              margin: '0 5px 0 11px',
              opacity: (vr.isRoomMuted || !authUser) ? 0.5 : 1,
            }}
          />

          {/* زر الإيموجي في الإدخال (37x50dp) */}
          <button
            onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center"
            style={{ width: 37, height: 50 }}
            aria-label="لوحة الإيموجي">
            <img src="/room-icons/room_selector_input_panel_emoji_key.webp" alt="إيموجي"
              style={{ width: 28, height: 28 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </button>

          {/* زر صورة (38dp) */}
          <button
            className="bg-transparent border-none cursor-pointer flex items-center justify-center"
            style={{ height: 38 }}
            aria-label="صورة">
            <img src="/room-icons/room_icon_picture.webp" alt="صورة"
              style={{ height: 38, width: 'auto' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </button>

          {/* زر الإرسال (37x50dp) — ظاهر فقط عند وجود نص */}
          {chatInput.trim() && (
            <button
              onClick={handleSendChat}
              className="bg-transparent border-none cursor-pointer flex items-center justify-center"
              style={{ width: 37, height: 50 }}
              aria-label="إرسال">
              <img src="/room-icons/room_ic_message_send.webp" alt="إرسال"
                style={{ width: 28, height: 28 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            </button>
          )}

          {/* زر العناصر (38dp) */}
          <button
            className="bg-transparent border-none cursor-pointer flex items-center justify-center"
            style={{ height: 38 }}
            aria-label="عناصر">
            <img src="/room-icons/room_prop_icon.webp" alt="عناصر"
              style={{ height: 38, width: 'auto' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </button>

          {/* زر الهدية SVGA (45x45dp) */}
          <button
            onClick={() => vr.setGiftSheetOpen(true)}
            className="bg-transparent border-none cursor-pointer flex items-center justify-center ml-2"
            style={{ width: 45, height: 45 }}
            aria-label="هدية">
            <img src="/room-icons/room_gift.svga" alt="هدية"
              style={{ width: 45, height: 45 }}
              onError={(e) => {
                // احتياطي: اعرض صورة الهدية العادية إن فشل SVGA
                (e.currentTarget as HTMLImageElement).src = '/room-icons/room_gift_send_icon.webp';
              }} />
          </button>
        </div>

        {/* ── لوحة الإيموجي المنبثقة ── */}
        {showEmojiPanel && (
          <div className="flex-shrink-0 p-2" style={{ backgroundColor: TUI.colors.G1, borderTop: `1px solid ${TUI.colors.G3Divider}` }}>
            <div className="grid grid-cols-8 gap-1">
              {['😀','😂','😍','🥰','😎','🤔','😢','😡','👍','👎','❤️','🔥','🎉','🎁','💀','👻'].map(e => (
                <button key={e} onClick={() => setChatInput(prev => prev + e)} className="text-2xl p-1 rounded hover:bg-white/10">{e}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          نافذة الخروج
          ═══════════════════════════════════════════════════ */}
      {showExitMenu && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowExitMenu(false)}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#0a2a1e', maxWidth: 320, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <p style={{ fontSize: 14, color: '#fff', marginBottom: 20 }}>
                {isOwner ? 'هل تريد مغادرة الغرفة؟ ستنتهي الغرفة عند خروجك.' : 'هل تريد مغادرة الغرفة؟'}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowExitMenu(false)}
                  className="px-6 py-2 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  إلغاء
                </button>
                <button
                  onClick={() => { setShowExitMenu(false); onExit(); }}
                  className="px-6 py-2 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#ef4444', color: '#fff' }}
                >
                  خروج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          قائمة المزيد (للمشرف)
          ═══════════════════════════════════════════════════ */}
      {showMoreMenu && (
        <div
          className="absolute z-50 rounded-xl overflow-hidden"
          style={{
            top: 50, left: 12,
            backgroundColor: '#0a2a1e',
            border: '1px solid rgba(21,188,131,0.3)',
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          {/* إعدادات الغرفة */}
          <button
            onClick={() => { setShowMoreMenu(false); vr.setSettingsOpen(true); }}
            className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 flex items-center gap-2"
            style={{ color: '#fff' }}>
            <img src="/room-icons/room_icon_room_top_more.webp" alt="" style={{ width: 16, height: 16 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            إعدادات الغرفة
          </button>

          {/* كتم الدردشة */}
          <button
            onClick={() => { setShowMoreMenu(false); vr.handleToggleRoomMute(); }}
            className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 flex items-center gap-2"
            style={{ color: '#fff' }}>
            {vr.isRoomMuted ? '🔊 فتح الدردشة' : '🔇 كتم الدردشة'}
          </button>

          {/* ترقية الغرفة */}
          <button
            onClick={() => { setShowMoreMenu(false); /* TODO: open upgrade */ }}
            className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 flex items-center gap-2"
            style={{ color: '#fff' }}>
            <img src="/room-icons/room_icon_room_top_more.webp" alt="" style={{ width: 16, height: 16 }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            ترقية الغرفة
          </button>

          {/* قفل الغرفة */}
          {isOwner && (
            <button
              onClick={() => { setShowMoreMenu(false); /* TODO: toggle room lock */ }}
              className="w-full px-4 py-3 text-right text-sm hover:bg-white/5 flex items-center gap-2"
              style={{ color: '#fff' }}>
              <img src="/room-icons/room_icon_arrow_lock.webp" alt="" style={{ width: 16, height: 16 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              {vr.room.roomMode === 'key' ? 'فتح الغرفة' : 'قفل الغرفة'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * ═══════════════════════════════════════════════════════════════════════
 * SeatCircle — دائرة المقعد (مطابقة لـ MicModel من يلا لودو)
 *
 * حالات:
 *   • فارغ (open)      → دائرة + أيقونة مايك + رقم
 *   • مقفل (locked)    → دائرة + أيقونة قفل
 *   • مشغول (occupied) → أفاتار + رقم + حالة مايك + شارة دور
 *   • متحدث (speaking) → توهّج أخضر حول الدائرة
 * ═══════════════════════════════════════════════════════════════════════
 */
function SeatCircle({
  seat,
  isMySeat,
  isSpeaking,
  onClick,
  authUserId,
}: {
  seat: SeatData;
  isMySeat: boolean;
  isSpeaking: boolean;
  onClick: () => void;
  authUserId: string;
}) {
  const isLocked = !seat.participant && seat.status === 'locked';
  const isEmpty = !seat.participant && !isLocked;
  const isOccupied = !!seat.participant;
  const isMuted = isOccupied && (seat.participant?.isMuted || seat.participant?.micFrozen);
  const isOwner = isOccupied && seat.participant?.role === 'owner';
  const isAdmin = isOccupied && (seat.participant?.role === 'admin' || seat.participant?.role === 'coowner');

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center bg-transparent border-none cursor-pointer"
      style={{ gap: 4 }}
      aria-label={isOccupied ? `مقعد ${seat.seatIndex + 1}: ${seat.participant?.displayName}` : `مقعد ${seat.seatIndex + 1}`}
    >
      {/* ── الدائرة (40–50px responsive) ── */}
      <div
        className="relative rounded-full flex items-center justify-center transition-transform duration-150"
        style={{
          width: 'clamp(44px, 12vw, 52px)',
          height: 'clamp(44px, 12vw, 52px)',
          backgroundColor: isEmpty ? 'rgba(242,245,252,0.1)' : 'transparent',
          border: isMySeat ? `2px solid ${TUI.colors.tealLight}` : '2px solid transparent',
        }}
      >
        {/* توهّج عند الكلام */}
        {isOccupied && isSpeaking && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: `2px solid ${TUI.colors.green}`,
              animation: 'seatRipple 1.2s ease-out infinite',
            }}
          />
        )}

        {/* رقم المقعد (أعلى يسار) */}
        <span
          className="absolute -top-0.5 -left-0.5 flex items-center justify-center rounded-full z-10 pointer-events-none"
          style={{
            minWidth: 16, height: 14, padding: '0 3px',
            backgroundColor: 'rgba(0,0,0,0.5)',
            fontSize: 10, lineHeight: '14px', color: '#fff', fontWeight: 500,
          }}
        >
          {seat.seatIndex + 1}
        </span>

        {/* ── الحالة الفارغة ── */}
        {isEmpty && (
          <img src="/room-icons/room_ic_room_mic_free.webp" alt="فارغ"
            style={{ width: 24, height: 24, opacity: 0.4 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        )}

        {/* ─ـ الحالة المقفلة ── */}
        {isLocked && (
          <img src="/room-icons/room_icon_arrow_lock.webp" alt="مقفل"
            style={{ width: 20, height: 20, opacity: 0.6 }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        )}

        {/* ── الحالة المشغولة — أفاتار ── */}
        {isOccupied && seat.participant && (
          <>
            <div
              className="rounded-full overflow-hidden"
              style={{
                width: 'clamp(36px, 10vw, 42px)',
                height: 'clamp(36px, 10vw, 42px)',
                border: `2px solid ${isSpeaking ? TUI.colors.green : 'transparent'}`,
              }}
            >
              {seat.participant.avatar ? (
                <img src={seat.participant.avatar} alt={seat.participant.displayName}
                  className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-full"
                  style={{ backgroundColor: '#3a4270', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                  {seat.participant.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* شارة كتم المايك (أسفل يمين) */}
            {isMuted && (
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full z-10"
                style={{ width: 16, height: 16, backgroundColor: TUI.colors.red }}>
                <img src="/room-icons/room_ic_input_mic_off.webp" alt="مكتوم"
                  style={{ width: 10, height: 10 }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </span>
            )}

            {/* شارة المالك (أعلى يمين) */}
            {isOwner && (
              <img src="/room-icons/room_icon_room_top_close_king.webp" alt="مالك"
                className="absolute -top-1 -right-1 z-10 pointer-events-none"
                style={{ width: 18, height: 18 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}

            {/* شارة المشرف */}
            {isAdmin && !isOwner && (
              <img src="/room-icons/room_icon_room_top_more_purple.webp" alt="مشرف"
                className="absolute -top-1 -right-1 z-10 pointer-events-none"
                style={{ width: 16, height: 16 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
          </>
        )}
      </div>

      {/* ── الاسم تحت المقعد ── */}
      <span
        className="text-center leading-tight"
        style={{
          maxWidth: 55, fontSize: 11, color: 'rgba(255,255,255,0.7)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {isOccupied && seat.participant
          ? (seat.participant.displayName.length > 6
            ? seat.participant.displayName.slice(0, 6) + '…'
            : seat.participant.displayName)
          : '\u00A0'}
      </span>

      <style>{`
        @keyframes seatRipple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </button>
  );
}
