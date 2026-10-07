'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Volume2, RefreshCw, CheckCircle, AlertCircle, Headphones } from 'lucide-react';
import { TUI } from '../../types';

/* ═══════════════════════════════════════════════════════════════════════
   AudioSettingsDialog — لوحة إعدادات الصوت

   تتيح للمستخدم:
   - اختيار جهاز الميكروفون
   - اختيار جهاز السماعة/الخارجية
   - طلب صلاحيات المتصفح
   - معاينة مستوى الصوت مباشرة
   - حفظ التفضيلات في localStorage
   ═══════════════════════════════════════════════════════════════════════ */

interface AudioDeviceInfo {
  deviceId: string;
  label: string;
}

interface AudioSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentMicDeviceId?: string;
  currentSpeakerDeviceId?: string;
  onMicChange: (deviceId: string) => void;
  onSpeakerChange: (deviceId: string) => void;
}

export default function AudioSettingsDialog({
  isOpen,
  onClose,
  currentMicDeviceId,
  currentSpeakerDeviceId,
  onMicChange,
  onSpeakerChange,
}: AudioSettingsDialogProps) {
  /* ── State ── */
  const [micDevices, setMicDevices] = useState<AudioDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<AudioDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState(currentMicDeviceId || 'default');
  const [selectedSpeaker, setSelectedSpeaker] = useState(currentSpeakerDeviceId || 'default');
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTesting, setIsTesting] = useState(false);

  /* ── Refs ── */
  const testStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  /* ── Enumerate devices ── */
  const enumerateDevices = useCallback(async () => {
    try {
      // Need permission first to get device labels
      if (micPermission !== 'granted') {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach(t => t.stop());
          setMicPermission('granted');
        } catch (err: any) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicPermission('denied');
          } else {
            setMicPermission('prompt');
          }
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput' && d.deviceId).map(d => ({
        deviceId: d.deviceId,
        label: d.label || `ميكروفون ${devices.filter(dd => dd.kind === 'audioinput').indexOf(d) + 1}`,
      }));
      const speakers = devices.filter(d => d.kind === 'audiooutput' && d.deviceId).map(d => ({
        deviceId: d.deviceId,
        label: d.label || `سماعة ${devices.filter(dd => dd.kind === 'audiooutput').indexOf(d) + 1}`,
      }));

      setMicDevices(mics);
      setSpeakerDevices(speakers);

      // Restore saved preferences
      const savedMic = localStorage.getItem('gg_audio_mic');
      const savedSpeaker = localStorage.getItem('gg_audio_speaker');
      if (savedMic && mics.some(m => m.deviceId === savedMic)) setSelectedMic(savedMic);
      if (savedSpeaker && speakers.some(s => s.deviceId === savedSpeaker)) setSelectedSpeaker(savedSpeaker);
    } catch {
      setMicPermission('denied');
    }
  }, [micPermission]);

  /* ── Check current permission ── */
  useEffect(() => {
    if (!isOpen) return;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(t => t.stop());
          setMicPermission('granted');
        })
        .catch(() => {
          setMicPermission('prompt');
        });
    }
  }, [isOpen]);

  /* ── Enumerate on open ── */
  useEffect(() => {
    if (!isOpen) return;
    enumerateDevices();
  }, [isOpen, micPermission, enumerateDevices]);

  /* ── Listen for device changes ── */
  useEffect(() => {
    if (!isOpen || typeof navigator === 'undefined') return;
    const handler = () => enumerateDevices();
    navigator.mediaDevices.addEventListener('devicechange', handler);
    return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
  }, [isOpen, enumerateDevices]);

  /* ── Audio level monitoring ── */
  const startMicTest = useCallback(async () => {
    // Stop existing test
    stopMicTest();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      testStreamRef.current = stream;
      setIsTesting(true);

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        setAudioLevel(Math.min(rms * 3, 1)); // Amplify for visual feedback
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch {
      setMicPermission('denied');
    }
  }, [selectedMic]);

  const stopMicTest = useCallback(() => {
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach(t => t.stop());
      testStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsTesting(false);
    setAudioLevel(0);
  }, []);

  /* ── Cleanup on close ── */
  useEffect(() => {
    return () => { stopMicTest(); };
  }, [stopMicTest, isOpen]);

  /* ── Apply mic change ── */
  const handleMicChange = useCallback((deviceId: string) => {
    setSelectedMic(deviceId);
    localStorage.setItem('gg_audio_mic', deviceId);
    onMicChange(deviceId);
    // Restart test with new device if testing
    if (isTesting) {
      setTimeout(() => startMicTest(), 100);
    }
  }, [onMicChange, isTesting, startMicTest]);

  /* ── Apply speaker change ── */
  const handleSpeakerChange = useCallback((deviceId: string) => {
    setSelectedSpeaker(deviceId);
    localStorage.setItem('gg_audio_speaker', deviceId);
    onSpeakerChange(deviceId);
  }, [onSpeakerChange]);

  /* ── Request permission ── */
  const handleRequestPermission = useCallback(async () => {
    setMicPermission('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermission('granted');
      enumerateDevices();
    } catch {
      setMicPermission('denied');
    }
  }, [enumerateDevices]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 60 }}
      onClick={(e) => { if (e.target === e.currentTarget) { stopMicTest(); onClose(); } }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />

      {/* Panel — slides up from bottom */}
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth: 420,
          maxHeight: '80vh',
          backgroundColor: '#0A2824',
          borderRadius: '20px 20px 0 0',
          border: '1px solid rgba(255,255,255,0.08)',
          borderTop: 'none',
          animation: 'slideUp 0.3s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between flex-shrink-0"
          style={{
            padding: '16px 20px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 700, color: TUI.colors.white }}>
            إعدادات الصوت
          </h3>
          <button
            onClick={() => { stopMicTest(); onClose(); }}
            className="rounded-full flex items-center justify-center cursor-pointer touch-manipulation"
            style={{
              width: 32, height: 32,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
            aria-label="إغلاق"
          >
            <X size={16} style={{ color: TUI.colors.G6 }} />
          </button>
        </div>

        {/* ── Content (scrollable) ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '16px 20px 24px', gap: 20 }}
        >
          {/* ── Permission Status ── */}
          {micPermission === 'denied' && (
            <div
              className="flex items-center gap-3"
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(252, 85, 85, 0.1)',
                border: '1px solid rgba(252, 85, 85, 0.2)',
                borderRadius: 12,
              }}
            >
              <AlertCircle size={18} style={{ color: TUI.colors.red, flexShrink: 0 }} />
              <div className="flex flex-col flex-1 min-w-0">
                <span style={{ fontSize: 12, fontWeight: 600, color: TUI.colors.red }}>
                  صلاحية الميكروفون مرفوضة
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  اسمح بالوصول للميكروفون من إعدادات المتصفح
                </span>
              </div>
              <button
                onClick={handleRequestPermission}
                className="flex items-center justify-center flex-shrink-0 cursor-pointer touch-manipulation"
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(252, 85, 85, 0.15)',
                  border: '1px solid rgba(252, 85, 85, 0.3)',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: TUI.colors.red,
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {micPermission === 'checking' && (
            <div className="flex items-center justify-center" style={{ padding: '12px 0' }}>
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" style={{ color: TUI.colors.tealLight }} />
                <span style={{ fontSize: 12, color: TUI.colors.G6 }}>جاري فحص الصلاحيات...</span>
              </div>
            </div>
          )}

          {micPermission === 'granted' && (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 200, 150, 0.08)',
                border: '1px solid rgba(0, 200, 150, 0.15)',
                borderRadius: 10,
              }}
            >
              <CheckCircle size={14} style={{ color: TUI.colors.tealLight }} />
              <span style={{ fontSize: 11, color: TUI.colors.tealLight }}>
                صلاحية الميكروفون مفعّلة
              </span>
            </div>
          )}

          {/* ── Microphone Selection ── */}
          <div className="flex flex-col" style={{ gap: 10 }}>
            <div className="flex items-center gap-2">
              <Mic size={15} style={{ color: TUI.colors.tealLight }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.white }}>
                جهاز الميكروفون
              </span>
            </div>

            {micDevices.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{
                  padding: '20px 0',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontSize: 12, color: TUI.colors.G5 }}>
                  لا توجد أجهزة ميكروفون
                </span>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 4 }}>
                {micDevices.map((device) => {
                  const isSelected = selectedMic === device.deviceId;
                  return (
                    <button
                      key={device.deviceId}
                      onClick={() => handleMicChange(device.deviceId)}
                      className="flex items-center gap-3 cursor-pointer touch-manipulation w-full text-right"
                      style={{
                        padding: '10px 12px',
                        backgroundColor: isSelected ? 'rgba(0, 200, 150, 0.12)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1.5px solid rgba(0, 200, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 10,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 32, height: 32,
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'rgba(0, 200, 150, 0.15)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <Mic size={14} style={{ color: isSelected ? TUI.colors.tealLight : TUI.colors.G5 }} />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className="truncate"
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? TUI.colors.tealLight : TUI.colors.G7,
                          }}
                        >
                          {device.label}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle size={16} style={{ color: TUI.colors.tealLight, flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Speaker / Output Selection ── */}
          <div className="flex flex-col" style={{ gap: 10 }}>
            <div className="flex items-center gap-2">
              <Headphones size={15} style={{ color: TUI.colors.tealLight }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.white }}>
                جهاز السماعة
              </span>
            </div>

            {speakerDevices.length === 0 ? (
              <div
                className="flex items-center justify-center"
                style={{
                  padding: '20px 0',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  border: '1px dashed rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontSize: 12, color: TUI.colors.G5 }}>
                  لا توجد أجهزة سماعة (غير مدعوم في بعض المتصفحات)
                </span>
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: 4 }}>
                {speakerDevices.map((device) => {
                  const isSelected = selectedSpeaker === device.deviceId;
                  return (
                    <button
                      key={device.deviceId}
                      onClick={() => handleSpeakerChange(device.deviceId)}
                      className="flex items-center gap-3 cursor-pointer touch-manipulation w-full text-right"
                      style={{
                        padding: '10px 12px',
                        backgroundColor: isSelected ? 'rgba(0, 200, 150, 0.12)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1.5px solid rgba(0, 200, 150, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 10,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 32, height: 32,
                          borderRadius: 8,
                          backgroundColor: isSelected ? 'rgba(0, 200, 150, 0.15)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <Volume2 size={14} style={{ color: isSelected ? TUI.colors.tealLight : TUI.colors.G5 }} />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span
                          className="truncate"
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? TUI.colors.tealLight : TUI.colors.G7,
                          }}
                        >
                          {device.label}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle size={16} style={{ color: TUI.colors.tealLight, flexShrink: 0 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Mic Test / Audio Level Meter ── */}
          {micPermission === 'granted' && micDevices.length > 0 && (
            <div className="flex flex-col" style={{ gap: 10 }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 13, fontWeight: 600, color: TUI.colors.white }}>
                  اختبار الميكروفون
                </span>
                <button
                  onClick={isTesting ? stopMicTest : startMicTest}
                  className="flex items-center gap-2 cursor-pointer touch-manipulation"
                  style={{
                    padding: '6px 14px',
                    backgroundColor: isTesting ? 'rgba(252, 85, 85, 0.15)' : 'rgba(0, 200, 150, 0.12)',
                    border: isTesting ? '1px solid rgba(252, 85, 85, 0.3)' : '1px solid rgba(0, 200, 150, 0.3)',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    color: isTesting ? TUI.colors.red : TUI.colors.tealLight,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isTesting ? 'إيقاف' : 'تشغيل'}
                </button>
              </div>

              {/* Audio Level Bars */}
              <div
                className="flex items-center gap-1"
                style={{
                  height: 32,
                  padding: '0 4px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                }}
              >
                {Array.from({ length: 20 }).map((_, i) => {
                  const threshold = i / 20;
                  const isActive = isTesting && audioLevel > threshold;
                  const barColor = i < 12 ? TUI.colors.tealLight : i < 16 ? '#f59e0b' : TUI.colors.red;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: isActive ? `${8 + (i / 20) * 20}px` : '4px',
                        backgroundColor: isActive ? barColor : 'rgba(255,255,255,0.06)',
                        borderRadius: 1,
                        transition: 'height 0.08s ease, background-color 0.15s ease',
                        minHeight: 4,
                      }}
                    />
                  );
                })}
              </div>

              <span
                style={{
                  fontSize: 10,
                  color: isTesting ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
                  textAlign: 'center',
                }}
              >
                {isTesting ? 'تحدّث الآن لرؤية مستوى الصوت...' : 'اضغط تشغيل لاختبار الميكروفون'}
              </span>
            </div>
          )}

          {/* ── Refresh devices button ── */}
          <button
            onClick={enumerateDevices}
            className="flex items-center justify-center gap-2 cursor-pointer touch-manipulation w-full"
            style={{
              padding: '10px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              fontSize: 12,
              color: TUI.colors.G6,
              transition: TUI.anim.fast,
            }}
          >
            <RefreshCw size={14} />
            تحديث قائمة الأجهزة
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
