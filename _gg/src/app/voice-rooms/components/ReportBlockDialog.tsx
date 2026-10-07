'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ShieldBan, Send, CheckCircle, Loader2 } from 'lucide-react';
import BottomSheetOverlay from './shared/BottomSheetOverlay';
import { TUI } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   ReportBlockDialog — Report & Block User for Voice Rooms

   Bottom sheet dialog with report reasons (radio), optional details,
   submit (amber/gold), block (red), loading & success/error states.
   Posts to /api/report with { action, reporterId, reportedUserId, ... }
   ═══════════════════════════════════════════════════════════════════════ */

interface ReportBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetDisplayName: string;
  reporterUserId?: string;
  roomId?: string;
}

const REPORT_REASONS = [
  { id: 'inappropriate', label: 'محتوى غير لائق' },
  { id: 'harassment', label: 'تنمر أو تحرش' },
  { id: 'abuse', label: 'إساءة استخدام' },
  { id: 'fake', label: 'حساب مزيف' },
  { id: 'spam', label: 'سبام' },
  { id: 'other', label: 'أخرى' },
] as const;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function ReportBlockDialog({
  isOpen,
  onClose,
  targetUserId,
  targetDisplayName,
  reporterUserId,
  roomId,
}: ReportBlockDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [blockLoading, setBlockLoading] = useState(false);

  // Reset state when dialog opens/closes
  const resetState = useCallback(() => {
    setSelectedReason(null);
    setDetails('');
    setSubmitState('idle');
    setErrorMsg('');
    setBlockLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  // Auto-close after success
  useEffect(() => {
    if (submitState === 'success') {
      const timer = setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitState, onClose, resetState]);

  const handleSubmit = async () => {
    if (!selectedReason || submitState === 'loading') return;

    setSubmitState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          reporterId: reporterUserId || '',
          reportedUserId: targetUserId,
          reason: selectedReason,
          category: selectedReason,
          roomId: roomId || '',
          details: details.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل إرسال البلاغ');
      }

      setSubmitState('success');
    } catch (err: any) {
      setSubmitState('error');
      setErrorMsg(err.message || 'حدث خطأ، حاول مرة أخرى');
    }
  };

  const handleBlock = async () => {
    if (!reporterUserId || blockLoading) return;

    setBlockLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block',
          blockerId: reporterUserId,
          blockedId: targetUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل حظر المستخدم');
      }

      setBlockLoading(false);
      setSubmitState('success');
    } catch (err: any) {
      setBlockLoading(false);
      setErrorMsg(err.message || 'حدث خطأ، حاول مرة أخرى');
    }
  };

  const handleClose = () => {
    if (submitState === 'loading' || blockLoading) return;
    onClose();
  };

  // ── Success State ──
  const renderSuccess = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'rgba(41, 204, 106, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle size={32} style={{ color: TUI.colors.green }} />
      </div>
      <span
        style={{
          fontSize: TUI.font.title16.size,
          fontWeight: 600,
          color: TUI.colors.white,
        }}
      >
        تم إرسال البلاغ بنجاح
      </span>
      <span
        style={{
          fontSize: TUI.font.captionG5.size,
          color: TUI.colors.G5,
          textAlign: 'center',
        }}
      >
        شكراً لمساعدتنا في الحفاظ على مجتمع آمن
      </span>
    </div>
  );

  // ── Main Form ──
  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Target User Info ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          backgroundColor: TUI.colors.bgOperate,
          borderRadius: TUI.radius.lg,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: TUI.colors.bgInput,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={18} style={{ color: TUI.colors.orange }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: TUI.colors.G5,
              marginBottom: 2,
            }}
          >
            الإبلاغ عن
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: TUI.colors.white,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {targetDisplayName}
          </div>
        </div>
      </div>

      {/* ── Report Reasons (Radio Buttons) ── */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: TUI.colors.G6,
            marginBottom: 10,
          }}
        >
          سبب الإبلاغ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.id;
            return (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: TUI.radius.md,
                  border: isSelected
                    ? `1.5px solid ${TUI.colors.orange}`
                    : `1px solid ${TUI.colors.strokePrimary}`,
                  backgroundColor: isSelected
                    ? 'rgba(255, 152, 0, 0.08)'
                    : TUI.colors.bgOperate,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Radio indicator */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: isSelected
                      ? `2px solid ${TUI.colors.orange}`
                      : `2px solid ${TUI.colors.G4}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'border-color 0.2s',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: TUI.colors.orange,
                      }}
                    />
                  )}
                </div>

                {/* Reason label */}
                <span
                  style={{
                    fontSize: TUI.font.body14.size,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? TUI.colors.white : TUI.colors.G7,
                    transition: 'color 0.2s',
                  }}
                >
                  {reason.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Additional Details (Optional) ── */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: TUI.colors.G6,
            marginBottom: 10,
          }}
        >
          تفاصيل إضافية <span style={{ color: TUI.colors.G5, fontWeight: 400 }}>(اختياري)</span>
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="أضف تفاصيل حول البلاغ..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: TUI.radius.md,
            border: `1px solid ${TUI.colors.strokePrimary}`,
            backgroundColor: TUI.colors.bgOperate,
            color: TUI.colors.G7,
            fontSize: 14,
            lineHeight: 1.5,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          dir="rtl"
        />
      </div>

      {/* ── Error Message ── */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            backgroundColor: 'rgba(252, 85, 85, 0.1)',
            borderRadius: TUI.radius.md,
            border: `1px solid rgba(252, 85, 85, 0.2)`,
          }}
        >
          <AlertTriangle size={16} style={{ color: TUI.colors.red, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: TUI.colors.red }}>{errorMsg}</span>
        </div>
      )}

      {/* ── Submit Button (Amber/Gold) ── */}
      <button
        onClick={handleSubmit}
        disabled={!selectedReason || submitState === 'loading'}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '13px 0',
          borderRadius: TUI.radius.lg,
          border: 'none',
          backgroundColor:
            selectedReason && submitState !== 'loading'
              ? TUI.colors.orange
              : TUI.colors.G4,
          cursor:
            selectedReason && submitState !== 'loading' ? 'pointer' : 'not-allowed',
          fontSize: 15,
          fontWeight: 700,
          color: TUI.colors.white,
          opacity: selectedReason && submitState !== 'loading' ? 1 : 0.5,
          transition: 'all 0.2s ease',
        }}
      >
        {submitState === 'loading' ? (
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Send size={18} />
        )}
        {submitState === 'loading' ? 'جارٍ الإرسال...' : 'إرسال البلاغ'}
      </button>

      {/* ── Block Button (Red) ── */}
      {reporterUserId && (
        <button
          onClick={handleBlock}
          disabled={blockLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 0',
            borderRadius: TUI.radius.lg,
            border: `1px solid rgba(252, 85, 85, 0.3)`,
            backgroundColor: 'rgba(252, 85, 85, 0.1)',
            cursor: blockLoading ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 700,
            color: TUI.colors.red,
            opacity: blockLoading ? 0.5 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {blockLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <ShieldBan size={18} />
          )}
          {blockLoading ? 'جارٍ الحظر...' : 'حظر المستخدم'}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Spin keyframe for loader */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <BottomSheetOverlay
        isOpen={isOpen}
        onClose={handleClose}
        height="auto"
        title="الإبلاغ عن مستخدم"
        zIndex={100}
      >
        {submitState === 'success' ? renderSuccess() : renderForm()}
      </BottomSheetOverlay>
    </>
  );
}
