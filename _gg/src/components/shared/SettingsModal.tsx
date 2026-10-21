'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isSoundEnabled, setSoundEnabled, isMusicEnabled, setMusicEnabled } from '@/lib/sounds';

// ════════════════════════════════════════════════════════════════════════════
// SettingsModal — نسخة طبق الأصل من Yalla Ludo dialog_setting.xml
// [الجولة 2] إصلاحات: اللوحة، فصل الصفوف، ترتيب الأزرار، النصوص
// ════════════════════════════════════════════════════════════════════════════

const A = {
  btnFaq:     '/yalla-ui/full/btn_faq.webp',
  fbHome:     '/yalla-ui/full/fb_home.webp',
  btnShare:   '/yalla-ui/full/btn_share.webp',
  btnRateus:  '/yalla-ui/full/btn_rateus.webp',
  btnOn:      '/yalla-ui/full/btn_on.webp',
  btnOff:     '/yalla-ui/full/btn_off.webp',
  btnLanguage:       '/yalla-ui/full/btn_language.webp',
  iconChangeLanguage: '/yalla-ui/full/icon_change_language.webp',
  deleteAccount: '/yalla-ui/full/delete_account.webp',
  lineGray: '/yalla-ui/full/line_gray.webp',
  skinClose: '/yalla-ui/full/skin_close.webp',
  privacyTerms: '/yalla-ui/full/privacy_terms.webp',
};

// [1] لون اللوحة من السورس (bg_feed_back_detail avg #c6ded8)
const PANEL_BG = '#c6ded8';
// [1] لون الفاصل من السورس (line_gray avg #bcd0cb)
const DIVIDER_COLOR = '#bcd0cb';

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

  // الأزرار الباهتة من السورس (dialog_setting.xml) — كلها موجودة
  const FADED_BUTTONS = [
    { id: 'privacy', label: 'إعدادات الخصوصية' },
    { id: 'cd_key', label: 'رمز الاستبدال' },
    { id: 'game_center', label: 'مركز الألعاب', smallText: true },
    { id: 'net_test', label: 'اختبار الشبكة' },
    { id: 'ad_privacy', label: 'إعلانات الخصوصية' },
    { id: 'delete_account', label: 'حذف الحساب' },
  ];

  return (
    <AnimatePresence>
      {/* [5] تعتيم أخف خلف الـ Dialog */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)' }}
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
            maxHeight: '88vh',
            background: 'linear-gradient(180deg, #1a8a6a 0%, #0e6b50 100%)',
            borderRadius: 16,
            border: '3px solid #2bc895',
            boxShadow: '0 0 0 1px rgba(255,255,255,.15), 0 10px 40px rgba(0,0,0,.4)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ══════ [2] الرأس: زر X (يسار) + عنوان + ترس أكبر ══════ */}
          <div className="relative flex items-center justify-center" style={{ height: 44, flexShrink: 0 }}>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute"
              style={{ left: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32 }}
              aria-label="إغلاق"
            >
              <img src={A.skinClose} alt="إغلاق" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            </button>
            {/* [4] ترس أكبر */}
            <div className="flex items-center gap-2" dir="rtl">
              <span style={{ fontSize: 22 }}>⚙</span>
              <span style={{ color: '#87ebaa', fontSize: 18, fontWeight: 700, textShadow: '0 2px 2px rgba(0,0,0,.4)' }}>
                الإعدادات
              </span>
            </div>
          </div>

          {/* ══════ [3] 4 أزرار اختصار (ثابتة) — [4] نصوص كاملة وأيقونات أكبر ══════ */}
          <div className="flex justify-center gap-1.5" style={{ marginTop: 6, marginBottom: 6, flexShrink: 0 }}>
            {[
              { src: A.btnFaq, text: 'المساعدة' },
              { src: A.fbHome, text: 'الصفحة الرئيسية' },
              { src: A.btnShare, text: 'المشاركة' },
              { src: A.btnRateus, text: 'رسائل البريد' },
            ].map((btn, i) => (
              <button
                key={i}
                className="relative flex flex-col items-center justify-end"
                style={{ width: 64, height: 54 }}
              >
                <img
                  src={btn.src}
                  alt={btn.text}
                  className="absolute inset-0 w-full h-full"
                  style={{ objectFit: 'fill' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                />
                <span className="relative" style={{
                  color: '#fff', fontSize: 8, fontWeight: 700,
                  textShadow: '0 1px 1px rgba(0,0,0,.4)',
                  marginBottom: 3, whiteSpace: 'nowrap',
                  maxWidth: 64, overflow: 'hidden',
                }}>
                  {btn.text}
                </span>
              </button>
            ))}
          </div>

          {/* ══════ [1] اللوحة الفاتحة — مستطيل أبيض-فاتح بحواف مدورة حادة ══════
              سبب المشكلة السابقة: bg_feed_back_detail.9.png صورة 9-patch بها
              خطوط سوداء دليلية (1px) تظهر عند objectFit:'fill'
              الحل: استخدم لون CSS مطابق (#c6ded8) مع borderRadius حاد
          */}
          <div
            className="relative mx-2"
            style={{
              height: 210,
              overflow: 'hidden',
              borderRadius: 10,
              background: PANEL_BG,  // لون مصمت من السورس — لا 9-patch
              flexShrink: 0,
            }}
          >
            {/* المحتوى القابل للتمرير داخل اللوحة */}
            <div
              style={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'none',  // Firefox
                msOverflowStyle: 'none', // IE
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <style>{`div::-webkit-scrollbar { display: none; }`}</style>

              <div className="relative" style={{ padding: '8px 0' }} dir="rtl">

                {/* [2] صف 1: الصوت (مستقل) — نص يميناً، Toggle يساراً */}
                <div className="flex items-center justify-between" style={{ height: 40, padding: '0 16px' }}>
                  <span style={{ color: '#2d6b5a', fontSize: 16, fontWeight: 600 }}>الصوت</span>
                  <button onClick={toggleSound} style={{ width: 44, height: 22 }}>
                    <img src={soundOn ? A.btnOn : A.btnOff} alt="toggle" style={{ width: 44, height: 22, objectFit: 'contain' }} />
                  </button>
                </div>

                {/* [2] فاصل متقطع */}
                <Divider />

                {/* [2] صف 2: الموسيقى (مستقل) — نص يميناً، Toggle يساراً */}
                <div className="flex items-center justify-between" style={{ height: 40, padding: '0 16px' }}>
                  <span style={{ color: '#2d6b5a', fontSize: 16, fontWeight: 600 }}>الموسيقى</span>
                  <button onClick={toggleMusic} style={{ width: 44, height: 22 }}>
                    <img src={musicOn ? A.btnOn : A.btnOff} alt="toggle" style={{ width: 44, height: 22, objectFit: 'contain' }} />
                  </button>
                </div>

                <Divider />

                {/* [2] صف 3: اللغة — نص يميناً، زر القلم يساراً */}
                <div className="flex items-center justify-between" style={{ height: 40, padding: '0 16px' }}>
                  <span style={{ color: '#2d6b5a', fontSize: 16, fontWeight: 600 }}>اللغة</span>
                  <button
                    className="relative flex items-center gap-1"
                    style={{ height: 25, width: 90, overflow: 'hidden' }}
                  >
                    <img src={A.btnLanguage} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} />
                    <span className="relative" style={{ color: '#fff', fontSize: 11, fontWeight: 700, flex: 1, textAlign: 'center' }}>
                      English
                    </span>
                    <img src={A.iconChangeLanguage} alt="" className="relative" style={{ width: 14, height: 15, objectFit: 'contain', marginRight: 4 }} />
                  </button>
                </div>

                <Divider />

                {/* [2] صفوف 4-9: الأزرار الباهتة بالترتيب من السورس */}
                {FADED_BUTTONS.map((btn, i) => (
                  <div key={btn.id}>
                    <div className="flex justify-center" style={{ padding: '4px 0' }}>
                      <button
                        className="relative flex items-center justify-center"
                        style={{ width: 140, height: 36, overflow: 'hidden', borderRadius: 6 }}
                      >
                        <img src={A.deleteAccount} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill', opacity: 0.9 }} />
                        <span className="relative" style={{
                          color: '#70af9e',
                          fontSize: btn.smallText ? 11 : 13,
                          fontWeight: 700,
                        }}>
                          {btn.label}
                        </span>
                      </button>
                    </div>
                    {i < FADED_BUTTONS.length - 1 && <Divider />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════ [3] الأزرار السفلية — direction: 'ltr' لضبط الترتيب ══════
              تسجيل الخروج أخضر على اليمين، مركز الحساب أصفر على اليسار
              (الصفحة dir="rtl" فيعكس flex ترتيب DOM، فلولا direction:'ltr' لعكس)
          */}
          <div className="flex justify-between items-center mx-3" style={{ marginTop: 8, flexShrink: 0, direction: 'ltr' }}>
            {/* مركز الحساب — أصفر (يسار بصرياً) */}
            <button
              className="flex items-center justify-center"
              style={{
                width: 115, height: 34, borderRadius: 8,
                background: 'linear-gradient(180deg, #e6c022 0%, #c8a010 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,.2)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
                مركز الحساب
              </span>
            </button>
            {/* تسجيل الخروج — أخضر (يمين بصرياً) */}
            <button
              onClick={onLogout}
              className="flex items-center justify-center"
              style={{
                width: 115, height: 34, borderRadius: 8,
                background: 'linear-gradient(180deg, #2bc895 0%, #1a8a6a 100%)',
                boxShadow: '0 2px 4px rgba(0,0,0,.2)',
              }}
            >
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
                تسجيل الخروج
              </span>
            </button>
          </div>

          {/* ══════ [5] التذييل — نص أكبر وهامشان أفضل ══════ */}
          <div className="flex items-center justify-between mx-3" style={{ marginTop: 8, marginBottom: 10, flexShrink: 0 }}>
            {/* الإصدار (يسار) */}
            <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>
              الإصدار 1.5.1.0
            </span>
            {/* روابط الخصوصية والشروط (يمين) — [5] نص أكبر */}
            <div className="flex items-center gap-4" dir="rtl">
              <a href="#" className="flex items-center gap-1">
                <img src={A.privacyTerms} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, textDecoration: 'underline' }}>
                  سياسة الخصوصية
                </span>
              </a>
              <a href="#" className="flex items-center gap-1">
                <img src={A.privacyTerms} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, textDecoration: 'underline' }}>
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
// Divider — فاصل متقطع من line_gray.webp
// [1] لون فاصل واضح (#bcd0cb) من السورس
// ════════════════════════════════════════════════════════════════════════════
function Divider() {
  return (
    <div style={{
      margin: '2px 12px',
      borderTop: `1px dashed ${DIVIDER_COLOR}`,
    }} />
  );
}
