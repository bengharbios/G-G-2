'use client';

import { useState, useCallback, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import {
  TUI,
  DEFAULT_BG_URLS,
  MIC_OPTIONS,
  MIC_LAYOUTS,
  ROOM_MODE_OPTIONS,
  type AuthUser,
  type RoomMode,
  type MicLayoutId,
} from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   CreateRoomDialog — TUILiveKit Create Room Flow

   Center modal with exact TUILiveKit design tokens.
   Form: name, description, mic seat count (pill buttons),
   room mode (option cards), password (conditional),
   background selector, max participants, auto-mic toggle.
   ═══════════════════════════════════════════════════════════════════════ */

interface CreateRoomData {
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
}

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateRoomData) => void;
  authUser: AuthUser | null;
}

export default function CreateRoomDialog({ isOpen, onClose, onCreate }: CreateRoomDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [micSeatCount, setMicSeatCount] = useState(5);
  const [micTheme, setMicTheme] = useState<MicLayoutId>('chat5');
  const [roomMode, setRoomMode] = useState<RoomMode>('public');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomImage, setRoomImage] = useState(DEFAULT_BG_URLS[0]);
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [roomAvatar, setRoomAvatar] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setMicSeatCount(5);
    setMicTheme('chat5');
    setRoomMode('public');
    setRoomPassword('');
    setRoomImage(DEFAULT_BG_URLS[0]);
    setMaxParticipants(100);
    setIsAutoMode(false);
    setRoomAvatar('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim(),
      micSeatCount,
      roomMode,
      roomPassword: roomMode === 'key' ? roomPassword : '',
      maxParticipants,
      isAutoMode,
      micTheme: micTheme,
      roomImage,
      roomAvatar: roomAvatar || undefined,
    });
    resetForm();
  }, [name, description, micSeatCount, micTheme, roomMode, roomPassword, maxParticipants, isAutoMode, roomImage, roomAvatar, onCreate, resetForm]);

  if (!isOpen) return null;

  const inputBase = `w-full bg-[${TUI.colors.bgInput}] border border-[${TUI.colors.strokePrimary}] text-[${TUI.colors.G7}] placeholder-[${TUI.colors.G5}] rounded-[8px] h-[40px] px-3 text-sm outline-none transition-colors focus:border-[${TUI.colors.sliderFilled}]`;
  const textareaBase = `w-full bg-[${TUI.colors.bgInput}] border border-[${TUI.colors.strokePrimary}] text-[${TUI.colors.G7}] placeholder-[${TUI.colors.G5}] rounded-[8px] px-3 py-2 text-sm outline-none resize-none transition-colors focus:border-[${TUI.colors.sliderFilled}]`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: TUI.colors.black80 }}
      onClick={handleClose}
    >
      <div
        className="relative flex flex-col gap-5 overflow-y-auto"
        style={{
          backgroundColor: TUI.colors.G2,
          borderRadius: TUI.radius.xl,
          maxWidth: 380,
          width: '100%',
          padding: 24,
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
          style={{ color: TUI.colors.G6 }}
          aria-label="إغلاق"
        >
          <X size={20} />
        </button>

        {/* ── Title ── */}
        <h2
          className="text-center"
          style={{
            fontSize: TUI.font.title20.size,
            fontWeight: 700,
            color: TUI.font.title20.color,
          }}
        >
          إنشاء غرفة
        </h2>

        {/* ── Room Name ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>اسم الغرفة</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أدخل اسم الغرفة..."
            className={inputBase}
          />
        </div>

        {/* ── Room Avatar ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>صورة الغرفة</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                border: `2px dashed ${TUI.colors.strokePrimary}`,
                background: roomAvatar ? 'transparent' : TUI.colors.bgInput,
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                transition: 'border-color 0.2s ease',
              }}
            >
              {roomAvatar ? (
                <img
                  src={roomAvatar}
                  alt="صورة الغرفة"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Camera size={22} style={{ color: TUI.colors.G5 }} />
              )}
            </button>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              style={{
                fontSize: '12px',
                color: TUI.colors.B1,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              اختر صورة
            </button>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const img = new window.Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const max = 200;
                  let w = img.width;
                  let h = img.height;
                  if (w > max || h > max) {
                    if (w > h) { h = Math.round((h / w) * max); w = max; }
                    else { w = Math.round((w / h) * max); h = max; }
                  }
                  canvas.width = w;
                  canvas.height = h;
                  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
                  setRoomAvatar(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = ev.target?.result as string;
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* ── Description ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>الوصف</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر للغرفة..."
            rows={3}
            className={textareaBase}
          />
        </div>

        {/* ── Mic Seat Count (Pill Buttons) ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>عدد مقاعد المايك</label>
          <div className="flex gap-2">
            {MIC_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => setMicSeatCount(count)}
                className="flex-1 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  backgroundColor: micSeatCount === count ? TUI.colors.B1 : TUI.colors.bgInput,
                  color: micSeatCount === count ? '#FFFFFF' : TUI.colors.G7,
                  border: micSeatCount === count ? 'none' : `1px solid ${TUI.colors.strokePrimary}`,
                }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* ── Room Mode (Option Cards) ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>نوع الغرفة</label>
          <div className="flex gap-2">
            {ROOM_MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = roomMode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setRoomMode(opt.value)}
                  className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-[8px] transition-all"
                  style={{
                    height: 60,
                    backgroundColor: isSelected ? TUI.colors.bgInput : 'transparent',
                    border: isSelected
                      ? `1.5px solid ${TUI.colors.sliderFilled}`
                      : `1px solid ${TUI.colors.strokePrimary}`,
                  }}
                >
                  <Icon size={18} style={{ color: isSelected ? TUI.colors.B1 : TUI.colors.G5 }} />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: isSelected ? TUI.colors.G7 : TUI.colors.G5,
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Password (shown only when mode=key) ── */}
        {roomMode === 'key' && (
          <div className="flex flex-col gap-1.5">
            <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>كلمة المرور</label>
            <input
              type="text"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              placeholder="أدخل كلمة المرور..."
              className={inputBase}
            />
          </div>
        )}

        {/* ── Mic Seat Layout (نمط المايكات) ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>نمط المايكات</label>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {MIC_LAYOUTS.filter(l => l.seatCounts.includes(micSeatCount)).map((layout) => {
              const isSelected = micTheme === layout.id;
              return (
                <button
                  key={layout.id}
                  onClick={() => setMicTheme(layout.id)}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-[10px] transition-all cursor-pointer touch-manipulation"
                  style={{
                    width: 68,
                    height: 60,
                    backgroundColor: isSelected ? 'rgba(123, 97, 255, 0.1)' : TUI.colors.bgInput,
                    border: isSelected
                      ? `2px solid ${TUI.colors.purple}`
                      : `1px solid ${TUI.colors.strokePrimary}`,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{layout.icon}</span>
                  <span style={{ fontSize: 10, color: isSelected ? TUI.colors.purple : TUI.colors.G5, fontWeight: isSelected ? 600 : 400 }}>
                    {layout.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Background Image Selector ── */}
        <div className="flex flex-col gap-1.5">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>الخلفية</label>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {DEFAULT_BG_URLS.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setRoomImage(url)}
                className="flex-shrink-0 rounded-[8px] overflow-hidden transition-all"
                style={{
                  width: 80,
                  height: 54,
                  border: roomImage === url
                    ? `3px solid ${TUI.colors.B1}`
                    : `2px solid ${TUI.colors.strokePrimary}`,
                }}
              >
                <img
                  src={url}
                  alt={`خلفية ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Max Participants ── */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>الحد الأقصى للمشاركين</label>
            <span style={{ fontSize: '13px', color: TUI.colors.G7, fontWeight: 500 }}>{maxParticipants}</span>
          </div>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${TUI.colors.sliderFilled} 0%, ${TUI.colors.sliderFilled} ${((maxParticipants - 20) / (500 - 20)) * 100}%, ${TUI.colors.sliderEmpty} ${((maxParticipants - 20) / (500 - 20)) * 100}%, ${TUI.colors.sliderEmpty} 100%)`,
            }}
          />
        </div>

        {/* ── Auto Mic Mode Toggle ── */}
        <div className="flex items-center justify-between">
          <label style={{ fontSize: '13px', color: TUI.colors.G6 }}>فتح المايك تلقائياً</label>
          <button
            onClick={() => setIsAutoMode(!isAutoMode)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{
              backgroundColor: isAutoMode ? TUI.colors.B1 : TUI.colors.sliderEmpty,
            }}
            role="switch"
            aria-checked={isAutoMode}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
              style={{
                transform: isAutoMode ? 'translateX(22px)' : 'translateX(2px)',
                transition: 'transform 200ms ease',
              }}
            />
          </button>
        </div>

        {/* ── Create Button ── */}
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full rounded-[8px] text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: name.trim() ? TUI.colors.B1 : TUI.colors.sliderEmpty,
            height: 44,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          إنشاء
        </button>

        {/* ── Cancel ── */}
        <button
          onClick={handleClose}
          className="w-full text-center py-1 transition-colors hover:opacity-80"
          style={{ color: TUI.colors.G6, fontSize: 14 }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
