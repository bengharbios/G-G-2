'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronRight, Globe, Shield, LogOut, Trash2, Smartphone, Lock, HelpCircle, Share2, Mail, Home, Volume2, Music, Bell, User } from 'lucide-react';
import {
  getVolume, getMuted, setVolume, toggleMuted,
  playBgMusic, pauseBgMusic, isBgMusicPlaying,
  onVolumeChange, initVolumeFromStorage,
  isMusicEnabled, setMusicEnabled,
  isSoundEnabled, setSoundEnabled,
  enableBgMusicAutoStart,
} from '@/lib/sounds';

// ─── Types ────────────────────────────────────────────────────────────
interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authUser?: { id: string; displayName?: string; username?: string; avatar?: string } | null;
  subscriberCode?: string;
  subscriberPlan?: string;
  onLogout?: () => void;
}

type SettingsView = 'main' | 'account' | 'privacy' | 'language' | 'devices';

// ─── Toggle Switch (مثل SwitchCompat في يلا) ──────────────────────
function ToggleSwitch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`ys-toggle ${on ? 'ys-toggle--on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!on); }}
      aria-pressed={on}
    >
      <span className="ys-toggle-knob" />
    </button>
  );
}

// ─── Setting Row (مثل SettingSwitchRow في يلا — 56dp ارتفاع) ──────
function SettingSwitchRow({ icon, title, on, onChange }: {
  icon?: string; title: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="ys-row ys-row--switch" onClick={() => onChange(!on)}>
      {icon && <img src={icon} alt="" className="ys-row-icon" />}
      <span className="ys-row-title">{title}</span>
      <ToggleSwitch on={on} onChange={onChange} />
    </div>
  );
}

// ─── Setting Entry Row (مثل SettingNormalRow في يلا — 56dp مع سهم) ──
function SettingEntryRow({ icon, title, value, onClick, badge }: {
  icon?: string; title: string; value?: string; onClick?: () => void; badge?: string;
}) {
  return (
    <div className="ys-row ys-row--entry" onClick={onClick}>
      {icon && <img src={icon} alt="" className="ys-row-icon" />}
      <span className="ys-row-title">{title}</span>
      {badge && <span className="ys-row-badge">{badge}</span>}
      {value && <span className="ys-row-value">{value}</span>}
      <ChevronRight className="ys-row-arrow" />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function SettingsModal({ open, onOpenChange, authUser, subscriberCode, subscriberPlan, onLogout }: SettingsModalProps) {
  const [view, setView] = useState<SettingsView>('main');
  const [soundOn, setSoundOn] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [subData, setSubData] = useState<{ plan?: string; code?: string; endDate?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // إعادة تعيين النافذة للرئيسية عند الفتح (حل مشكلة البقاء في آخر نافذة)
  useEffect(() => {
    if (open) {
      setView('main');
      setDeleteConfirm(false);
    }
  }, [open]);

  // Init sound settings from localStorage (تفضيلات عامة، تعمل خارج الألعاب)
  useEffect(() => {
    if (!open) return;
    initVolumeFromStorage();
    setSoundOn(isSoundEnabled());
    setMusicOn(isMusicEnabled());
    // Load language
    const savedLang = typeof window !== 'undefined' ? (localStorage.getItem('yalla-lang') as 'ar' | 'en' || 'ar') : 'ar';
    setLang(savedLang);
    // Load subscription
    fetch('/api/subscription/profile').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.subscription) {
        setSubData({ plan: d.subscription.plan, code: d.subscription.subscriptionCode, endDate: d.subscription.endDate || d.subscription.expiresAt });
      }
    }).catch(() => {});
  }, [open]);

  // الصوت: تفضيل عام يعمل من أول فتح للموقع
  const handleSoundToggle = useCallback((v: boolean) => {
    setSoundOn(v);
    setSoundEnabled(v);
  }, []);

  // الموسيقى: تفضيل عام يعمل من أول فتح للموقع
  const handleMusicToggle = useCallback((v: boolean) => {
    setMusicOn(v);
    setMusicEnabled(v);
  }, []);

  const handleLangChange = useCallback((l: 'ar' | 'en') => {
    setLang(l);
    if (typeof window !== 'undefined') localStorage.setItem('yalla-lang', l);
    // Reload page to apply language change (simple approach)
    if (typeof window !== 'undefined') window.location.reload();
  }, []);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    onLogout?.();
    onOpenChange(false);
    if (typeof window !== 'undefined') window.location.href = '/';
  }, [onLogout, onOpenChange]);

  const handleDeleteAccount = useCallback(async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' });
      if (res.ok) {
        onLogout?.();
        onOpenChange(false);
        if (typeof window !== 'undefined') window.location.href = '/';
      }
    } catch {}
    setDeleting(false);
    setDeleteConfirm(false);
  }, [deleteConfirm, onLogout, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="ys-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => onOpenChange(false)}
        >
          <div className="ys-panel" dir="rtl" onClick={(e) => e.stopPropagation()}>
            {/* شريط علوي: عنوان + إغلاق */}
            <div className="ys-header">
              <h2 className="ys-title">
                {view === 'main' && 'الإعدادات'}
                {view === 'account' && 'مركز الحساب'}
                {view === 'privacy' && 'إعدادات الخصوصية'}
                {view === 'language' && 'اللغة'}
                {view === 'devices' && 'الأجهزة المرتبطة'}
              </h2>
              <button className="ys-close" onClick={() => onOpenChange(false)} aria-label="إغلاق">
                <img src="/yalla-settings/ic_close.webp" alt="إغلاق" style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* شريط أيقونات علوي (Support / Home / Share / Mail) */}
            {view === 'main' && (
              <div className="ys-iconbar">
                <button className="ys-iconbtn" title="الدعم"><HelpCircle className="w-5 h-5" /></button>
                <button className="ys-iconbtn" title="الرئيسية" onClick={() => onOpenChange(false)}><Home className="w-5 h-5" /></button>
                <button className="ys-iconbtn" title="مشاركة"><Share2 className="w-5 h-5" /></button>
                <button className="ys-iconbtn" title="بريد"><Mail className="w-5 h-5" /></button>
              </div>
            )}

            {/* المحتوى القابل للتمرير */}
            <div className="ys-body">
              {view === 'main' && (
                <>
                  {/* صفوف المفاتيح (Sound / Music) */}
                  <SettingSwitchRow icon="/yalla-settings/ic_sound.webp" title="الصوت" on={soundOn} onChange={handleSoundToggle} />
                  <SettingSwitchRow icon="/yalla-settings/ic_music.webp" title="الموسيقى" on={musicOn} onChange={handleMusicToggle} />

                  {/* صفوف الإدخال (Language / Privacy) */}
                  <SettingEntryRow icon="/yalla-settings/ic_language.webp" title="اللغة" value={lang === 'ar' ? 'العربية' : 'English'} onClick={() => setView('language')} />
                  <SettingEntryRow icon="/yalla-settings/ic_privacy.webp" title="إعدادات الخصوصية" onClick={() => setView('privacy')} />

                  {/* قسم الحساب */}
                  <div className="ys-section-title">الحساب</div>
                  <SettingEntryRow icon="/yalla-settings/ic_lock.webp" title="مركز الحساب" badge={subData?.plan || ''} onClick={() => setView('account')} />
                  <SettingEntryRow icon="/yalla-settings/ic_delete_account.webp" title="حذف الحساب" onClick={handleDeleteAccount} />

                  {/* أزرار سفلية (Log Out / Account Center) */}
                  <div className="ys-bottom-buttons">
                    <button className="ys-btn ys-btn--logout" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </button>
                    <button className="ys-btn ys-btn--account" onClick={() => setView('account')}>
                      <Smartphone className="w-4 h-4" />
                      <span>مركز الحساب</span>
                    </button>
                  </div>

                  {/* تأكيد حذف الحساب */}
                  {deleteConfirm && (
                    <div className="ys-delete-confirm">
                      <p>هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع.</p>
                      <div className="ys-delete-actions">
                        <button className="ys-btn ys-btn--cancel" onClick={() => setDeleteConfirm(false)}>إلغاء</button>
                        <button className="ys-btn ys-btn--danger" disabled={deleting} onClick={handleDeleteAccount}>
                          {deleting ? 'جارٍ الحذف...' : 'حذف نهائي'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {view === 'account' && (
                <>
                  <div className="ys-account-info">
                    <p className="ys-account-name">{authUser?.displayName || authUser?.username || 'مستخدم'}</p>
                    {subscriberCode && <p className="ys-account-code" dir="ltr">{subscriberCode}</p>}
                    {subData?.plan && <p className="ys-account-plan">الخطة: {subData.plan}</p>}
                    {subData?.endDate && <p className="ys-account-expiry">ينتهي: {new Date(subData.endDate).toLocaleDateString('ar')}</p>}
                    {/* تاريخ الانضمام من معلومات المستخدم */}
                    <p className="ys-account-expiry">الاشتراك: {subscriberPlan || 'مجاني'}</p>
                  </div>
                  <SettingEntryRow icon="/yalla-settings/ic_lock.webp" title="الأجهزة المرتبطة" onClick={() => setView('devices')} />
                  <SettingEntryRow icon="/yalla-settings/ic_delete_account.webp" title="حذف الحساب نهائياً" onClick={handleDeleteAccount} />
                  <button className="ys-back" onClick={() => setView('main')}>→ رجوع</button>

                  {deleteConfirm && (
                    <div className="ys-delete-confirm">
                      <p>هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع.</p>
                      <div className="ys-delete-actions">
                        <button className="ys-btn ys-btn--cancel" onClick={() => setDeleteConfirm(false)}>إلغاء</button>
                        <button className="ys-btn ys-btn--danger" disabled={deleting} onClick={handleDeleteAccount}>
                          {deleting ? 'جارٍ الحذف...' : 'حذف نهائي'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {view === 'privacy' && (
                <>
                  <SettingSwitchRow title="إخفاء ملفي الشخصي" on={false} onChange={() => {}} />
                  <SettingSwitchRow title="إخفاء حالتي" on={false} onChange={() => {}} />
                  <SettingSwitchRow title="منع دعوات الغرباء" on={true} onChange={() => {}} />
                  <button className="ys-back" onClick={() => setView('main')}>→ رجوع</button>
                </>
              )}

              {view === 'language' && (
                <>
                  <div className="ys-row ys-row--entry" onClick={() => handleLangChange('ar')}>
                    <span className="ys-row-title">العربية</span>
                    {lang === 'ar' && <span className="ys-check">✓</span>}
                  </div>
                  <div className="ys-row ys-row--entry" onClick={() => handleLangChange('en')}>
                    <span className="ys-row-title">English</span>
                    {lang === 'en' && <span className="ys-check">✓</span>}
                  </div>
                  <button className="ys-back" onClick={() => setView('main')}>→ رجوع</button>
                </>
              )}

              {view === 'devices' && (
                <>
                  <div className="ys-device-tip">يمكنك إزالة الأجهزة المرتبطة بحسابك. عند تسجيل دخول من جهاز مُزال، سيتطلب التحقق من الحساب.</div>
                  <div className="ys-device-row">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <div className="ys-device-info">
                      <span className="ys-device-name">هذا الجهاز</span>
                      <span className="ys-device-date">الآن</span>
                    </div>
                    <span className="ys-device-badge">نشط</span>
                  </div>
                  <button className="ys-back" onClick={() => setView('account')}>→ رجوع</button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
