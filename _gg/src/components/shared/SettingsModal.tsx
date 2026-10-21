'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isSoundEnabled, setSoundEnabled, isMusicEnabled, setMusicEnabled } from '@/lib/sounds';

// ════════════════════════════════════════════════════════════════════════════
// SettingsModal — نسخة طبق الأصل من Yalla Ludo dialog_setting.xml
// مصدر: dialog_setting.xml + dialog_setting2.xml
// ════════════════════════════════════════════════════════════════════════════

const A = {
  // 4 أزرار اختصار
  btnFaq:     '/yalla-ui/full/btn_faq.webp',
  fbHome:     '/yalla-ui/full/fb_home.webp',
  btnShare:   '/yalla-ui/full/btn_share.webp',
  btnRateus:  '/yalla-ui/full/btn_rateus.webp',
  // Toggle
  btnOn:      '/yalla-ui/full/btn_on.webp',
  btnOff:     '/yalla-ui/full/btn_off.webp',
  // Language
  btnLanguage:       '/yalla-ui/full/btn_language.webp',
  iconChangeLanguage: '/yalla-ui/full/icon_change_language.webp',
  // Faded buttons bg
  deleteAccount: '/yalla-ui/full/delete_account.webp',
  // Divider
  lineGray: '/yalla-ui/full/line_gray.webp',
  // Panel bg
  bgFeedBackDetail: '/yalla-ui/full/bg_feed_back_detail.9.png',
  // Close
  skinClose: '/yalla-ui/full/skin_close.webp',
  // Footer icon
  privacyTerms: '/yalla-ui/full/privacy_terms.webp',
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authUser?: { id: string; displayName?: string } | null;
  onLogout?: () => void;
}

export default function SettingsModal({ open, onOpenChange, authUser, onLogout }: SettingsModalProps) {
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);

  useEffect(() => {
    if (open) {
      Promise.resolve().then(() => {
        setSoundOn(isSoundEnabled());
        setMusicOn(isMusicEnabled());
      });
    }
  }, [open]);

  if (!open) return null;

  const toggleSound = () => {
    const newVal = !soundOn;
    setSoundOn(newVal);
    Promise.resolve().then(() => setSoundEnabled(newVal));
  };

  const toggleMusic = () => {
    const newVal = !musicOn;
    setMusicOn(newVal);
    Promise.resolve().then(() => setMusicEnabled(newVal));
  };

  // الأزرار الباهتة من السورس (dialog_setting.xml)
  const FADED_BUTTONS = [
    { id: 'privacy', label: 'إعدادات الخصوصية' },
    { id: 'cd_key', label: 'رمز الاستبدال' },
    { id: 'game_center', label: 'مركز الألعاب' },
    { id: 'net_test', label: 'اختبار الشبكة' },
    { id: 'ad_privacy', label: 'إعلانات الخصوصية' },
    { id: 'delete_account', label: 'حذف الحساب' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(3px)' }}
        onClick={() => onOpenChange(false)}
      >
        {/* ══════ النافذة الحوارية ══════ */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative flex flex-col"
          style={{
            width: 'min(92vw, 340px)',
            maxHeight: '90vh',
            background: 'linear-gradient(180deg, #1a8a6a 0%, #0e6b50 100%)',
            borderRadius: 16,
            border: '3px solid #2bc895',
            boxShadow: '0 0 0 1px rgba(255,255,255,.15), 0 10px 40px rgba(0,0,0,.5)',
            padding: 0,
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ══════ [2] الرأس: زر X (يسار) + عنوان + ترس ══════ */}
          <div className="relative flex items-center justify-center" style={{ height: 44, flexShrink: 0 }}>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute"
              style={{ left: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32 }}
              aria-label="إغلاق"
            >
              <img src={A.skinClose} alt="إغلاق" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            </button>
            <div className="flex items-center gap-2" dir="rtl">
              <span style={{ color: '#87ebaa', fontSize: 18, fontWeight: 700, textShadow: '0 2px 2px rgba(0,0,0,.4)' }}>
                الإعدادات
              </span>
              <span style={{ fontSize: 18 }}>⚙</span>
            </div>
          </div>

          {/* ══════ [3] 4 أزرار اختصار (ثابتة) ══════ */}
          <div className="flex justify-center gap-1.5" style={{ marginTop: 6, marginBottom: 4, flexShrink: 0 }}>
            {[
              { src: A.btnFaq, label: '؟', text: 'المساعدة' },
              { src: A.fbHome, label: '', text: 'الرئيسية' },
              { src: A.btnShare, label: '', text: 'مشاركة' },
              { src: A.btnRateus, label: '', text: 'البريد' },
            ].map((btn, i) => (
              <button
                key={i}
                className="relative flex flex-col items-center justify-end"
                style={{ width: 60, height: 50 }}
              >
                <img
                  src={btn.src}
                  alt={btn.text}
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'fill' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                />
                <span className="relative" style={{ color: '#fff', fontSize: 9, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.4)', marginBottom: 3 }}>
                  {btn.text}
                </span>
              </button>
            ))}
          </div>

          {/* ══════ [4] اللوحة الفاتحة القابلة للتمرير ══════ */}
          <div
            className="relative mx-2"
            style={{
              height: 200,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE
              borderRadius: 10,
            }}
          >
            {/* خلفية اللوحة */}
            <img
              src={A.bgFeedBackDetail}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'fill', opacity: 0.95, borderRadius: 10 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>

            {/* محتوى اللوحة */}
            <div className="relative" style={{ padding: '10px 0' }} dir="rtl">

              {/* صف 1: الصوت + الموسيقى (نفس الصف) */}
              <div className="flex items-center justify-between" style={{ height: 44, padding: '0 16px' }}>
                {/* الصوت (يمين في RTL) */}
                <div className="flex items-center gap-2">
                  <span style={{ color: '#2d6b5a', fontSize: 16, fontWeight: 600 }}>الصوت</span>
                </div>
                {/* الموسيقى (يسار في RTL) + Toggle */}
                <div className="flex items-center gap-2">
                  <span style={{ color: '#2d6b5a', fontSize: 16, fontWeight: 600 }}>الموسيقى</span>
                  <button onClick={toggleMusic} style={{ width: 40, height: 20 }}>
                    <img src={musicOn ? A.btnOn : A.btnOff} alt="toggle" style={{ width: 40, height: 20, objectFit: 'contain' }} />
                  </button>
                </div>
              </div>

              {/* فاصل */}
              <Divider />

              {/* صف 2: اللغة */}
              <div className="flex items-center justify-between" style={{ height: 44, padding: '0 16px' }}>
                <span style={{ color: '#2d6b5a', fontSize: 16, fontWeight: 600 }}>اللغة</span>
                <button
                  className="relative flex items-center gap-1"
                  style={{ height: 25, width: 85, overflow: 'hidden' }}
                >
                  <img src={A.btnLanguage} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />
                  <span className="relative" style={{ color: '#fff', fontSize: 11, fontWeight: 700, flex: 1, textAlign: 'center' }}>
                    English
                  </span>
                  <img src={A.iconChangeLanguage} alt="" className="relative" style={{ width: 14, height: 15, objectFit: 'contain', marginRight: 4 }} />
                </button>
              </div>

              <Divider />

              {/* صف 3-8: الأزرار الباهتة */}
              {FADED_BUTTONS.map((btn, i) => (
                <div key={btn.id}>
                  <div className="flex justify-center" style={{ padding: '5px 0' }}>
                    <button
                      className="relative flex items-center justify-center"
                      style={{ width: 130, height: 36, overflow: 'hidden', borderRadius: 6 }}
                    >
                      <img src={A.deleteAccount} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill', opacity: 0.9 }} />
                      <span className="relative" style={{ color: '#70af9e', fontSize: btn.id === 'game_center' ? 11 : 13, fontWeight: 700 }}>
                        {btn.label}
                      </span>
                    </button>
                  </div>
                  {i < FADED_BUTTONS.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </div>

          {/* ══════ [5] الأزرار السفلية ══════ */}
          <div className="flex justify-between items-center mx-3" style={{ marginTop: 8, flexShrink: 0 }}>
            {/* مركز الحساب — أصفر (يسار) */}
            <button
              className="flex items-center justify-center"
              style={{
                width: 110, height: 32, borderRadius: 8,
                background: 'linear-gradient(180deg, #e6c022 0%, #c8a010 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,.2)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
                مركز الحساب
              </span>
            </button>
            {/* تسجيل الخروج — أخضر (يمين) */}
            <button
              onClick={onLogout}
              className="flex items-center justify-center"
              style={{
                width: 110, height: 32, borderRadius: 8,
                background: 'linear-gradient(180deg, #2bc895 0%, #1a8a6a 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,.2)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
                تسجيل الخروج
              </span>
            </button>
          </div>

          {/* ══════ [6] التذييل ══════ */}
          <div className="flex items-center justify-between mx-3" style={{ marginTop: 6, marginBottom: 8, flexShrink: 0 }}>
            {/* الإصدار (يسار) */}
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 10 }}>
              الإصدار 1.5.1.0
            </span>
            {/* روابط الخصوصية والشروط (يمين) */}
            <div className="flex items-center gap-3" dir="rtl">
              <a href="#" className="flex items-center gap-1" style={{ textDecoration: 'underline' }}>
                <img src={A.privacyTerms} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, textDecoration: 'underline' }}>
                  سياسة الخصوصية
                </span>
              </a>
              <a href="#" className="flex items-center gap-1" style={{ textDecoration: 'underline' }}>
                <img src={A.privacyTerms} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, textDecoration: 'underline' }}>
                  شروط الخدمة
                </span>
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Divider — فاصل متقطع (line_gray.webp)
// ════════════════════════════════════════════════════════════════════════════
function Divider() {
  return (
    <div style={{ margin: '2px 10px' }}>
      <img
        src={A.lineGray}
        alt=""
        style={{ width: '100%', height: 2, objectFit: 'fill' }}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.style.display = 'none';
          el.parentElement!.style.borderTop = '1px dashed #bcd0cb';
        }}
      />
    </div>
  );
}
