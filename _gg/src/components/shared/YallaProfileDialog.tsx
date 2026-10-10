'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, X, Shirt } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

interface YallaAuthUser {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  country?: string;
  cover?: string;
  frame?: string;
  ornament?: string;
  card?: string;
  role?: string;
  numericId?: number | null;
}

interface GameStat {
  slug: string;
  name: string;
  played: number;
  won: number;
}

interface XPInfo {
  total: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
  isMaxLevel: boolean;
}

interface CountryRec {
  id: number;
  name: string;
  name_ar: string;
  shortName: string;
  areaCode: string;
}

interface FrameRec {
  id: number;
  name: string;
  png: string;
}

type DecorPanel = 'ornaments' | 'themes' | 'frames' | 'cards' | null;

interface YallaProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authUser?: YallaAuthUser | null;
  subscriberCode?: string;
  subscriberPlan?: string;
  isTrial?: boolean;
  allowedGames?: string[];
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onLogout?: () => void;
  onProfileUpdated?: (u: Partial<YallaAuthUser>) => void;
}

// ─── Yalla asset catalogs (extracted from APK 1.5.1.0) ────────────────// المعلقات والمواضيع والبطاقات — كلها الآن من كتالوج الزينة في قاعدة البيانات (DecorItem)
// مع ملكية وأسعار وأقفال بدل القوائم الثابتة

// تسميات وشارات الندرة (نفس لغة المتجر) لاستخدامها في نوافذ الزينة
const RARITY_LABELHOLDER: Record<string, string> = {
  legendary: 'أسطوري',
  epic: 'ملحمي',
  rare: 'نادر',
  common: 'عادي',
};
const RARITY_BADGEHOLDER: Record<string, string> = {
  legendary: 'fs-badge fs-badge--legendary',
  epic: 'fs-badge fs-badge--epic',
  rare: 'fs-badge fs-badge--rare',
  common: 'fs-badge fs-badge--common',
};

// ─── Helpers ──────────────────────────────────────────────────────────

function levelFlagSrc(level: number): string {
  if (level >= 50) return '/yalla-ui/level_big_50_60_ic.png';
  if (level >= 40) return '/yalla-ui/level_big_40_49_ic.png';
  if (level >= 30) return '/yalla-ui/level_big_30_39_ic.png';
  if (level >= 20) return '/yalla-ui/level_big_20_29_ic.png';
  if (level >= 10) return '/yalla-ui/level_big_10_19_ic.png';
  return '/yalla-ui/level_big_1_9_ic.png';
}

function idSeed(user: YallaAuthUser | null | undefined): number {
  if (!user) return 1;
  if (user.numericId && Number.isFinite(user.numericId)) return Number(user.numericId);
  let h = 0;
  const s = user.id || '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function avatarSrc(user: YallaAuthUser | null | undefined): string {
  if (user?.avatar) return user.avatar;
  return `/yalla-avatars/defaultPhoto_${(idSeed(user) % 12) + 1}.png`;
}

function planInfo(plan?: string, isTrial?: boolean) {
  if (isTrial) return { label: 'تجربة', cls: 'yp-badge--trial' };
  if (plan === 'paid') return { label: 'مميز', cls: 'yp-badge--paid' };
  return { label: 'مشترك', cls: 'yp-badge--free' };
}

// ─── Yalla countries (extracted from APK: assets/app/country) ────────

function flagUrlFor(name: string | undefined, countries: CountryRec[]): string {
  const c = countries.find((x) => x.name_ar === name);
  return c ? `/yalla-flags/icon_country_${c.id}.png` : '/yalla-flags/NO_COUNTRY.png';
}

// ─── Component ────────────────────────────────────────────────────────

export default function YallaProfileDialog({
  open,
  onOpenChange,
  authUser,
  subscriberCode,
  subscriberPlan,
  isTrial,
  allowedGames = [],
  onLoginClick,
  onRegisterClick,
  onLogout,
  onProfileUpdated,
}: YallaProfileDialogProps) {
  const [xp, setXp] = useState<XPInfo | null>(null);
  const [stats, setStats] = useState<GameStat[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBio, setFormBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  // Country picker state (yalla flag list)
  const [countries, setCountries] = useState<CountryRec[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryRec | null>(null);
  const [showCountryList, setShowCountryList] = useState(false);

  // Decoration state (shirt menu: ornaments/themes/frames/card)
  const [menuOpen, setMenuOpen] = useState(false);
  const [decorPanel, setDecorPanel] = useState<DecorPanel>(null);
  const [frames, setFrames] = useState<FrameRec[]>([]);
  const [savingDecor, setSavingDecor] = useState(false);

  // ── Edit window (view_edit_user_info) + Basic info window (edit_avatar) state ──
  const [editWin, setEditWin] = useState(false);
  const [basicWin, setBasicWin] = useState(false);
  const [eAvatar, setEAvatar] = useState('');
  const [eGender, setEGender] = useState('');
  const [eBirth, setEBirth] = useState('');
  const [eName, setEName] = useState('');
  const [eBio, setEBio] = useState('');
  const [eCountry, setECountry] = useState<CountryRec | null>(null);
  const [eSaving, setESaving] = useState(false);
  const [eMsg, setEMsg] = useState('');
  const [photoTab, setPhotoTab] = useState<'frames' | 'photos'>('frames');
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  // الملكية: معرفات الإطارات التي يملكها المستخدم (مجاني/شراء/نشاط) + بيانات كتالوج الأسعار
  const [ownedFrameIds, setOwnedFrameIds] = useState<Set<string>>(new Set());
  const [framesCatalog, setFramesCatalog] = useState<Map<string, { nameAr: string; price: number; isFree: boolean; rarity: string }>>(new Map());
  const [frameView, setFrameView] = useState<'all' | 'owned'>('all');
  // ملكية الزينة (معلقات/مواضيع/بطاقات) من قاعدة البيانات + الكتالوج العام
  const [ownedDecor, setOwnedDecor] = useState<Set<string>>(new Set());
  const [decorCatalog, setDecorCatalog] = useState<Array<{ id: string; kind: string; nameAr: string; imageUrl: string; rarity: string; price: number; isFree: boolean }>>([]);

  const openEditWindow = useCallback(() => {
    setEName(authUser?.displayName || authUser?.username || '');
    setEBio(authUser?.bio || '');
    setECountry(countries.find((c) => c.name_ar === authUser?.country) || null);
    setEAvatar(authUser?.avatar || '');
    setEGender((authUser as Partial<YallaAuthUser> & { gender?: string })?.gender || 'ذكر');
    setEBirth((authUser as Partial<YallaAuthUser> & { birthDate?: string })?.birthDate || '');
    setEMsg('');
    setEditWin(true);
  }, [authUser, countries]);

  const saveEditWindow = useCallback(async () => {
    if (!eName.trim()) { setEMsg('الاسم مطلوب'); return; }
    setESaving(true);
    setEMsg('');
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: eName.trim(),
          bio: eBio.trim(),
          country: eCountry?.name_ar ?? '',
          gender: eGender,
          birthDate: eBirth,
          ...(eAvatar !== (authUser?.avatar || '') ? { avatar: eAvatar } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onProfileUpdated?.({
          displayName: data.user?.displayName || eName.trim(),
          bio: data.user?.bio || '',
          country: data.user?.country || '',
          avatar: data.user?.avatar,
        });
        setEditWin(false);
      } else {
        setEMsg(data.error || 'تعذر حفظ التغييرات');
      }
    } catch {
      setEMsg('تعذر الاتصال بالخادم');
    } finally {
      setESaving(false);
    }
  }, [eName, eBio, eCountry, eGender, eBirth, eAvatar, authUser, onProfileUpdated]);

  // Pick a photo from the owned-avatars grid (defaultPhoto_1..12)
  const applyOwnedAvatar = useCallback(async (src: string) => {
    setEAvatar(src);
    setOwnedAvatars((prev) => (prev.includes(src) ? prev : [...prev, src]));
    try {
      await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: src }),
      });
      onProfileUpdated?.({ avatar: src });
    } catch { /* silent */ }
  }, [onProfileUpdated]);

  // Upload a custom photo → dataURL (small) or uploaded file URL
  const onPhotoFile = useCallback(async (file: File) => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      // Downscale to 256px to keep payload small
      const img = new Image();
      img.src = dataUrl;
      await new Promise((r) => { img.onload = r; img.onerror = r; });
      const canvas = document.createElement('canvas');
      const side = Math.min(img.width, img.height) || 256;
      canvas.width = 256; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx && img.width) {
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
        const out = canvas.toDataURL('image/jpeg', 0.82);
        setEAvatar(out);
        setOwnedAvatars((prev) => (prev.includes(out) ? prev : [...prev, out]));
        await fetch('/api/auth/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: out }),
        });
        onProfileUpdated?.({ avatar: out });
      }
    } catch { /* silent */ }
  }, [onProfileUpdated]);

  // Copy code state
  const [copied, setCopied] = useState(false);

  const plan = planInfo(subscriberPlan, isTrial);
  const hasCover = !!authUser?.cover;

  // Fetch XP + game stats when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadData() {
      if (!subscriberCode) return;
      setLoadingData(true);
      try {
        const [xpRes, statsRes] = await Promise.allSettled([
          fetch(`/api/player/xp?code=${encodeURIComponent(subscriberCode)}`),
          fetch(`/api/player/game-stats?code=${encodeURIComponent(subscriberCode)}`),
        ]);
        if (cancelled) return;
        if (xpRes.status === 'fulfilled' && xpRes.value.ok) {
          const d = await xpRes.value.json();
          if (!cancelled && d.success && d.xp) {
            setXp({
              total: d.xp.total ?? 0,
              level: d.xp.level ?? 1,
              currentLevelXP: d.xp.currentLevelXP ?? 0,
              nextLevelXP: d.xp.nextLevelXP ?? 0,
              progress: d.xp.progress ?? 0,
              isMaxLevel: d.xp.isMaxLevel ?? false,
            });
          }
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const d = await statsRes.value.json();
          if (!cancelled && d.success && Array.isArray(d.games)) {
            setStats(d.games);
          }
        }
      } catch {
        // silent — dialog still renders with placeholders
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [open, subscriberCode]);

  // Load yalla frames catalog (frameConfig + localFrameConfig, Arabic names)
  useEffect(() => {
    if (!open || frames.length > 0) return;
    fetch('/yalla-frames/frames.json')
      .then((r) => r.json())
      .then((list) => setFrames(Array.isArray(list) ? list : []))
      .catch(() => { /* silent */ });
  }, [open, frames.length]);

  // جلب ملكية الإطارات + أسعار الكتالوج + ملكية الزينة عند فتح النافذة (المصدر: قاعدة بياناتنا)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/frames')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success || !Array.isArray(d.userFrames)) return;
        setOwnedFrameIds(new Set(d.userFrames.map((uf: { frame?: { id?: number | string } }) => String(uf.frame?.id ?? ''))));
      })
      .catch(() => { /* silent */ });
    fetch('/api/store/frames-catalog')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success || !Array.isArray(d.frames)) return;
        const m = new Map<string, { nameAr: string; price: number; isFree: boolean; rarity: string }>();
        for (const f of d.frames) {
          m.set(String(f.id), { nameAr: f.nameAr || f.name, price: f.price, isFree: f.isFree, rarity: f.rarity });
        }
        setFramesCatalog(m);
      })
      .catch(() => { /* silent */ });
    fetch('/api/store/decor-catalog')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success || !Array.isArray(d.items)) return;
        setDecorCatalog(d.items);
        setOwnedDecor(new Set((d.ownedDecor || []).map(String)));
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [open]);

  // Load yalla countries list once per open session
  useEffect(() => {
    if (!open || countries.length > 0) return;
    fetch('/yalla-flags/countries.json')
      .then((r) => r.json())
      .then((list) => setCountries(Array.isArray(list) ? list : []))
      .catch(() => { /* silent */ });
  }, [open, countries.length]);

  // Reset edit form from the current user when opening / exiting edit mode
  useEffect(() => {
    if (open && authUser) {
      setFormName(authUser.displayName || authUser.username || '');
      setFormBio(authUser.bio || '');
      setFormMsg('');
      setEditing(false);
      setShowCountryList(false);
      setMenuOpen(false);
      setDecorPanel(null);
    }
    if (!open) {
      setEditing(false);
      setMenuOpen(false);
      setDecorPanel(null);
    }
  }, [open, authUser]);

  // Sync selected country with the stored user country
  useEffect(() => {
    if (!open) return;
    setSelectedCountry(countries.find((c) => c.name_ar === authUser?.country) || null);
  }, [open, authUser, countries]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape closes topmost layer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (editWin) setEditWin(false);
      else if (basicWin) setBasicWin(false);
      else if (decorPanel) setDecorPanel(null);
      else if (menuOpen) setMenuOpen(false);
      else onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, decorPanel, menuOpen, editWin, basicWin, onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!formName.trim()) {
      setFormMsg('الاسم مطلوب');
      return;
    }
    setSaving(true);
    setFormMsg('');
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formName.trim(),
          country: selectedCountry?.name_ar ?? '',
          bio: formBio.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onProfileUpdated?.({
          displayName: data.user?.displayName || formName.trim(),
          country: data.user?.country || '',
          bio: data.user?.bio || '',
        });
        setEditing(false);
        setShowCountryList(false);
      } else {
        setFormMsg(data.error || 'تعذر حفظ التغييرات');
      }
    } catch {
      setFormMsg('تعذر الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  }, [formName, selectedCountry, formBio, onProfileUpdated]);

  // Apply a decoration immediately (like yalla: uses the item at once)
  const applyDecor = useCallback(async (field: 'cover' | 'frame' | 'ornament' | 'card', value: string) => {
    setSavingDecor(true);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onProfileUpdated?.({ [field]: data.user?.[field] ?? value });
      }
    } catch {
      // silent
    } finally {
      setSavingDecor(false);
    }
  }, [onProfileUpdated]);

  const handleCopyCode = useCallback(() => {
    if (!subscriberCode) return;
    navigator.clipboard.writeText(subscriberCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* silent */ });
  }, [subscriberCode]);

  const totalPts = stats.reduce((s, g) => s + g.won, 0);
  const winRate = xp ? Math.round(xp.progress) : 0;
  // محلّل رابط الصورة من كتالوج الزينة: عناصر البذر معرفها = مسارها، أما المرفوع من الأدمن
  // فمعرفه UUID وصورته على /api/media/<id> — نحلّل المعرف إلى رابط الصورة الحقيقي
  const decorUrlById = new Map(decorCatalog.map((d) => [d.id, d.imageUrl]));
  const frameUrl = authUser?.frame ? `/yalla-frames/${authUser.frame}.png` : '';
  const ornamentUrl = authUser?.ornament
    ? (decorUrlById.get(authUser.ornament) || `/yalla-ornaments/${authUser.ornament}.png`)
    : '';
  // كل البطاقات بلا استثناء: نفس تموضع حديقة الفضاء (طبقة الغلاف yp-carddecor)
  const backdropUrl = authUser?.card
    ? (decorUrlById.get(authUser.card) || `/yalla-ornaments/${authUser.card}.png`)
    : '';
  // موضوع البروفايل: المعرف قد يكون مساراً (بذر) أو UUID (رفع أدمن) — نحلّله دائماً
  const coverUrl = authUser?.cover
    ? (decorUrlById.get(authUser.cover) || authUser.cover)
    : '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="yp-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            className="yp-panel"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Close / Logout buttons — pinned to panel, outside the scroll area */}
            <button className="yp-iconbtn yp-iconbtn--close" onClick={() => onOpenChange(false)} aria-label="إغلاق">
              <X className="w-4 h-4" />
            </button>
            {authUser && onLogout && (
              <button className="yp-iconbtn yp-iconbtn--logout" onClick={onLogout} aria-label="تسجيل الخروج" title="تسجيل الخروج">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Avatar head (with yalla frame overlay) */}
            {authUser && (
              <div className={`yp-headwrap${hasCover ? ' yp-headwrap--cover' : ''}`}>
                <div className={`yp-head${frameUrl ? '' : ' yp-head--plain'}`}>
                  <img
                    src={avatarSrc(authUser)}
                    alt={authUser.displayName || authUser.username}
                    className="yp-head-img"
                    onError={(e) => {
                      const t = e.currentTarget;
                      if (!t.src.includes('defaultPhoto_')) t.src = '/yalla-avatars/defaultPhoto_1.png';
                    }}
                  />
                </div>
                {frameUrl && (
                  <img src={frameUrl} alt="" className="yp-frame" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
              </div>
            )}

            {/* Profile cover strip (yalla موضوع الملف الشخصي) — الافتراضي الأخضر دائم كما في يلا */}
            {authUser && (
              <div className="yp-cover" onClick={() => setDecorPanel('themes')}>
                <img
                  src={coverUrl || '/yalla-covers/bg_profile_theme_default.webp'}
                  alt=""
                  onError={(e) => { e.currentTarget.src = '/yalla-covers/bg_profile_theme_default.webp'; }}
                />
                {/* بطاقة الملف — طفلة الموضوع: حافتها السفلية = حافة الموضوع السفلية بالضبط وبعرضه */}
                {backdropUrl && (
                  <img
                    src={backdropUrl}
                    alt=""
                    className="yp-carddecor"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </div>
            )}

            {/* Card backdrop BEHIND the avatar (بطاقة خلف البروفايل) -- */}
            {authUser && ornamentUrl && (
              <img
                src={ornamentUrl}
                alt=""
                className="yp-ornament"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}

            {/* Side buttons: square-pencil (edit) + shirt (decoration menu) */}
            {authUser && (
              <>
                <button
                  className="yp-sidebtn yp-sidebtn--edit"
                  onClick={() => openEditWindow()}
                  aria-label="تعديل الملف الشخصي"
                  title="تعديل الملف الشخصي"
                >
                  <img src="/yalla-ui/icon_edit_profile.webp" alt="" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                </button>
                <button
                  className="yp-sidebtn yp-sidebtn--shirt"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="زينة الملف الشخصي"
                  title="زينة الملف الشخصي"
                >
                  <Shirt className="w-5 h-5" />
                </button>

                {/* Shirt dropdown menu (yalla: تفعيل معلقة / موضوع / بطاقة / إطار) */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      className="yp-menu"
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                    >
                      <button className="yp-menuitem" onClick={() => { setMenuOpen(false); setDecorPanel('ornaments'); }}>تفعيل معلقة جدارية</button>
                      <button className="yp-menuitem" onClick={() => { setMenuOpen(false); setDecorPanel('themes'); }}>تعديل موضوع الملف الشخصي</button>
                      <button className="yp-menuitem" onClick={() => { setMenuOpen(false); setDecorPanel('cards'); }}>تعيين بطاقة الملف الشخصي</button>
                      <button className="yp-menuitem" onClick={() => { setMenuOpen(false); setDecorPanel('frames'); }}>تعيين إطار صورة الملف الشخصي</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Scrollable content — avatar head stays above/outside it */}
            <div className="yp-scroll">

              {/* ── Guest view ── */}
              {!authUser ? (
                <div className="yp-body yp-body--guest">
                  <h2 className="yp-name">الملف الشخصي</h2>
                  <p className="yp-guest-txt">
                    سجّل دخولك لعرض ملفك الشخصي ومستواك وخبرتك وإحصاءات ألعابك
                  </p>
                  <div className="yp-btnrow yp-btnrow--guest">
                    <button className="yp-btn" onClick={onLoginClick}>تسجيل الدخول</button>
                    <button className="yp-btn yp-btn--alt" onClick={onRegisterClick}>حساب جديد</button>
                  </div>
                </div>
              ) : (
                <div className="yp-body">
                  {/* Player name */}
                  <h2 className="yp-name">{authUser.displayName || authUser.username || 'لاعب'}</h2>

                  {/* ID pill (يلا: ID: 9805432347) */}
                  <div className="yp-idrow">
                    <span className="yp-idpill">
                      <span className="yp-idico" />
                      <span dir="ltr">ID: {authUser.numericId ?? '—'}</span>
                    </span>
                  </div>

                  {/* Info strip: level flag | membership | sep | gender | country (يلا) */}
                  <div className="yp-inforow">
                    <span className="yp-flag">
                      <img src={levelFlagSrc(xp?.level ?? 1)} alt="" className="yp-flag-img" />
                      <i className="yp-flag-num">{xp?.level ?? 1}</i>
                    </span>
                    <img
                      className="yp-mflag"
                      src="/yalla-ui/level_big_50_60_ic.png"
                      alt="العضوية"
                      title={`العضوية: ${plan.label}`}
                    />
                    <span className="yp-sep" />
                    <img className="yp-mflag" src="/yalla-ui/gender_male.webp" alt="ذكر" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <img
                      className="yp-flag-lg"
                      src={flagUrlFor(authUser.country, countries)}
                      alt={authUser.country || 'دولة'}
                      onError={(e) => { e.currentTarget.src = '/yalla-flags/NO_COUNTRY.png'; }}
                    />
                  </div>

                  {/* Bio (max 5 lines, like CustomTextView) */}
                  <p className="yp-bio">
                    {authUser.bio || 'لا يوجد وصف شخصي بعد — أضف وصفك من زر التعديل'}
                  </p>

    {editWin && (
      <div className="ye-overlay" dir="rtl" onClick={() => setEditWin(false)}>
        <div className="ye-scroll" onClick={(e) => e.stopPropagation()}>
            <button className="ye-close" onClick={() => setEditWin(false)} aria-label="إغلاق">
                <X className="w-6 h-6" />
              </button>
              <div className="ye-head">
                <div className="ye-headcard">
                  <img src={coverUrl || '/yalla-covers/bg_profile_theme_default.webp'} alt="" onError={(e) => { e.currentTarget.src = '/yalla-covers/bg_profile_theme_default.webp'; }} />
                </div>
                <button className="ye-headbtn" onClick={() => setBasicWin(true)} aria-label="تغيير صورة الملف الشخصي" title="تغيير صورة الملف الشخصي">
                  <img src={eAvatar || avatarSrc(authUser)} alt="" onError={(e) => { e.currentTarget.src = avatarSrc(authUser); }} />
                </button>
              </div>
              <div className="ye-body">
                <div className="ye-field">
                  <label className="ye-label">الاسم المعروض</label>
                  <div style={{ position: 'relative' }}>
                    <input className="ye-input" value={eName} onChange={(e) => setEName(e.target.value)} maxLength={16} placeholder="أدخل اسمك" />
                    <span className="ye-counter" dir="ltr">{eName.length}/16</span>
                  </div>
                </div>

                {/* الجنس — منتقي شبكي (dialog_sex_select) */}
                <div className="ye-field">
                  <label className="ye-label">الجنس</label>
                  <div className="ye-row">
                    {['ذكر', 'أنثى'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`ye-pick${eGender === g ? ' ye-pick--on' : ''}`}
                        style={eGender === g ? { borderColor: '#2C7762', background: 'rgba(44,119,98,.14)' } : undefined}
                        onClick={() => setEGender(g)}
                      >
                        <img src={`/yalla-ui/gender_${g === 'ذكر' ? 'male' : 'female'}.webp`} alt="" />
                        <span className="ye-pick-name">{g}</span>
                        {eGender === g && <span className="yp-idico" style={{ width: 12, height: 12, borderRadius: '50%', background: '#22B365' }} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* تاريخ الميلاد */}
                <div className="ye-field">
                  <label className="ye-label">تاريخ الميلاد</label>
                  <input
                    className="ye-input"
                    type="date"
                    value={eBirth}
                    max="2025-12-31"
                    onChange={(e) => setEBirth(e.target.value)}
                  />
                </div>

                {/* الدولة — شبكة الأعلام */}
                <div className="ye-field">
                  <label className="ye-label">الدولة</label>
                  <button type="button" className="ye-pick" onClick={(e) => { const el = document.getElementById('ye-cgrid'); if (el) el.style.display = el.style.display === 'none' ? 'grid' : 'none'; }}>
                    <img className="yp-flag-lg" src={flagUrlFor(eCountry?.name_ar, countries)} alt="" onError={(e) => { e.currentTarget.src = '/yalla-flags/NO_COUNTRY.png'; }} />
                    <span className="ye-pick-name">{eCountry?.name_ar || 'اختر دولتك'}</span>
                    <span className="ye-pick-car">▾</span>
                  </button>
                  <div id="ye-cgrid" className="ye-cgrid" style={{ display: 'none' }}>
                    {countries.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        className={`ye-citem${eCountry?.id === c.id ? ' ye-citem--on' : ''}`}
                        onClick={() => { setECountry(c); const el = document.getElementById('ye-cgrid'); if (el) el.style.display = 'none'; }}
                      >
                        <img src={`/yalla-flags/icon_country_${c.id}.png`} alt="" />
                        <span>{c.name_ar}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* الوصف الشخصي */}
                <div className="ye-field">
                  <label className="ye-label">الوصف الشخصي</label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="ye-input"
                      style={{ height: 84, padding: '10px 13px', resize: 'none' }}
                      value={eBio}
                      onChange={(e) => setEBio(e.target.value)}
                      maxLength={300}
                      rows={3}
                      placeholder="اكتب وصفاً قصيراً عنك..."
                    />
                    <span className="ye-counter" dir="ltr">{eBio.length}/300</span>
                  </div>
                </div>

                {eMsg && <p className={`ye-msg${eMsg.includes('تعذر') ? ' ye-msg--err' : ''}`}>{eMsg}</p>}
                <button className="ye-save" onClick={saveEditWindow} disabled={eSaving}>
                  {eSaving ? '...جارٍ الحفظ' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Basic info window (edit_avatar / dialog_avatar_edit) ─── */}
    {basicWin && (
          <div className="yb-overlay" dir="rtl" onClick={() => setBasicWin(false)}>
            <div className="yb-card" onClick={(e) => e.stopPropagation()}>
              <div className="yb-titlebar">
                <h2 className="yb-title">معلومات أساسية</h2>
                <button className="yb-x" onClick={() => setBasicWin(false)} aria-label="إغلاق">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="yb-headrow">
                <span className="yb-avwrap">
                  <img className="yb-avface" src={eAvatar || avatarSrc(authUser)} alt="" />
                  {!!authUser.frame && (
                    <img src={`/yalla-frames/${authUser.frame}.png`} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </span>
                <div className="yb-xpwrap">
                  <div className="yb-xprow">
                    <span>الخبرة</span>
                    <b dir="ltr">{xp ? `${new Intl.NumberFormat('en-US').format(xp.currentLevelXP)}/${new Intl.NumberFormat('en-US').format(xp.nextLevelXP)}` : '—'}</b>
                  </div>
                  <div className="yb-xptrack">
                    <div className="yb-xpfill" style={{ width: `${Math.max(4, Math.min(100, xp?.progress ?? 0))}%` }} />
                  </div>
                </div>
                <button className="yb-userpick">
                  <img src="/yalla-ui/jia.webp" alt="" style={{ width: 16, height: 16 }} />
                  <span>لدي</span>
                </button>
              </div>

              <div className="yb-tabs">
                <button className={`yb-tab${photoTab === 'photos' ? ' yb-tab--on' : ''}`} onClick={() => setPhotoTab('photos')}>صورة الملف الشخصي</button>
                <button className={`yb-tab${photoTab === 'frames' ? ' yb-tab--on' : ''}`} onClick={() => setPhotoTab('frames')}>إطار الصورة</button>
              </div>

              {photoTab === 'frames' ? (
                <>
                  <div className="yb-filterbar">
                    <button className={`yb-filter${frameView === 'all' ? ' yb-filter--on' : ''}`} onClick={() => setFrameView('all')}>الكل</button>
                    <button className={`yb-filter${frameView === 'owned' ? ' yb-filter--on' : ''}`} onClick={() => setFrameView('owned')}>المملوكة</button>
                  </div>
                  <div className="yb-body">
                    <div className="yb-secband">إطارات الصورة</div>
                    <div className="yb-framegrid">
                      <button className={`yb-framecell${!authUser.frame ? ' yb-framecell--on' : ''}`} onClick={() => applyDecor('frame', '')}>
                        <span className="yb-framecell-imgwrap">
                          <img className="yb-framecell-face" src={eAvatar || avatarSrc(authUser)} alt="" />
                        </span>
                        {!authUser.frame && <i className="yb-check">✓</i>}
                      </button>
                      {frames
                        .filter((f) => (frameView === 'owned' ? ownedFrameIds.has(String(f.id)) : true))
                        .map((f) => {
                          const fid = String(f.id);
                          const active = authUser.frame === fid;
                          const owned = ownedFrameIds.has(fid);
                          const cat = framesCatalog.get(fid);
                          return (
                            <button
                              key={f.id}
                              className={`yb-framecell${active ? ' yb-framecell--on' : ''}${owned ? '' : ' yb-framecell--locked'}`}
                              onClick={() => { if (owned) applyDecor('frame', fid); }}
                              title={owned ? (cat?.nameAr || f.name) : `${cat?.nameAr || f.name} — ${cat?.isFree ? 'مجاني' : `${cat?.price ?? ''} جوهرة — من المتجر`}`}
                            >
                              <span className="yb-framecell-imgwrap">
                                <img className="yb-framecell-face" src={eAvatar || avatarSrc(authUser)} alt="" />
                                <img src={f.png} alt={f.name} />
                                {!owned && <i className="yb-lock">🔒</i>}
                                {!owned && cat && !cat.isFree && (
                                  <span className="yb-price">{cat.price}<img src="/yalla-ui/diamonds.webp" alt="" /></span>
                                )}
                              </span>
                              {active && <i className="yb-check">✓</i>}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="yb-body">
                  <div className="yb-secband">تم الحصول عليها</div>
                  <div className="yb-photogrid">
                    <button className="yb-addphoto" onClick={() => photoInputRef.current?.click()}>
                      <span className="yb-addphoto-ico">+</span>
                      <span>إضافة صورة</span>
                    </button>
                    {(ownedAvatars.length ? ownedAvatars : [avatarSrc(authUser)]).map((src, i) => (
                      <button
                        key={i}
                        className={`yb-photocell${(eAvatar || authUser.avatar) === src ? ' yb-photocell--on' : ''}`}
                        onClick={() => applyOwnedAvatar(src)}
                      >
                        <img className="yb-photocell-face" src={src} alt="" />
                        {(eAvatar || authUser.avatar) === src && <i className="yb-check">✓</i>}
                      </button>
                    ))}
                  </div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhotoFile(f); e.target.value = ''; }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

                  {/* ── بطاقات الأقسام بنمط يلا: المستوى / اللعبة / الإنجازات ── */}
                  <div className="yp-sec">
                    {/* المستوى */}
                    <div className="yp-seccard">
                      <span className="yp-ribbon yp-ribbon--tr">المستوى</span>
                      <div className="yp-lvrow">
                        <div className="yp-lvtrack">
                          <div
                            className="yp-lvfill"
                            style={{ width: `${Math.max(4, Math.min(100, xp?.progress ?? 0))}%` }}
                          />
                          <span className="yp-lvnum" dir="ltr">
                            {xp
                              ? `${new Intl.NumberFormat('en-US').format(xp.currentLevelXP)}/${new Intl.NumberFormat('en-US').format(xp.isMaxLevel ? xp.currentLevelXP : xp.nextLevelXP)}`
                              : '—'}
                          </span>
                        </div>
                        <span className="yp-flag">
                          <img src={levelFlagSrc(xp?.level ?? 1)} alt="" className="yp-flag-img" />
                          <i className="yp-flag-num">{xp?.level ?? 1}</i>
                        </span>
                      </div>
                    </div>

                    {/* اللعبة */}
                    <div className="yp-seccard">
                      <span className="yp-ribbon yp-ribbon--tr">اللعبة</span>
                      <div className="yp-secrow yp-secrow--btn">
                        <span className="yp-seclabel">بطولة الدوري</span>
                        <span className="yp-secval">{new Intl.NumberFormat('en-US').format(totalPts)}</span>
                        <span className="yp-secval yp-secval--blue">احتمال الفوز {winRate}%</span>
                      </div>
                      <div className="yp-secgames">
                        {loadingData && stats.length === 0 && (
                          <span className="yp-secgame"><span>...جارٍ التحميل</span></span>
                        )}
                        {!loadingData && stats.length === 0 && (
                          <span className="yp-secgame"><span>لا توجد ألعاب مفعّلة بعد</span></span>
                        )}
                        {stats.slice(0, 4).map((g) => (
                          <span className="yp-secgame" key={g.slug}>
                            <img
                              src={`/yalla-games/${g.slug}.png`}
                              alt={g.name}
                              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                            />
                            <span>{g.name}</span>
                            <b>{new Intl.NumberFormat('en-US').format(g.won)}</b>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* الإنجازات */}
                    <div className="yp-seccard">
                      <span className="yp-ribbon yp-ribbon--tr">الإنجازات</span>
                      <div className="yp-secrow">
                        <span className="yp-seclabel">الشارات</span>
                        <span className="yp-secval" style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
                          <i style={{ display: 'inline-flex', width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'linear-gradient(180deg,#F0B429,#C98A12)', color: '#fff', fontSize: 10, fontWeight: 900, fontStyle: 'normal' }}>5</i>
                          <i style={{ display: 'inline-flex', width: 18, height: 18, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'linear-gradient(180deg,#4A90D9,#2C5F9E)', color: '#fff', fontSize: 10, fontWeight: 900, fontStyle: 'normal' }}>1</i>
                        </span>
                      </div>
                      <div className="yp-secrow">
                        <span className="yp-seclabel">مستوى رويال</span>
                        <span className="yp-secval">مستوى {xp?.level ?? 1}</span>
                      </div>
                    </div>
                  </div>


                  {/* Subscription code card (bottom invite-style card) */}
                  {subscriberCode && (
                    <button className="yp-invite" onClick={handleCopyCode}>
                      <img src="/yalla-ui/jia.webp" alt="" className="yp-invite-ico" />
                      <span className="yp-invite-txt" dir="ltr">{subscriberCode}</span>
                      <span className="yp-invite-act">{copied ? 'تم النسخ ✓' : 'نسخ الكود'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* ─── Decoration FULL-SCREEN windows (yalla: room_profile_card_shop / dialog_skin_theme / dialog_head_frame_select) ─── */}
      <AnimatePresence>
        {open && authUser && decorPanel && (
          <motion.div
            className="yd-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="yd-rays" />
            <div className="yd-bubbles">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span
                  key={i}
                  className="yd-bubble"
                  style={{
                    left: `${6 + i * 13.5}%`,
                    width: 16 + (i % 3) * 10,
                    height: 16 + (i % 3) * 10,
                    animationDelay: `${i * 1.7}s`,
                    animationDuration: `${10 + (i % 3) * 2.5}s`,
                  }}
                />
              ))}
            </div>

            <div className="yd-scroll" dir="rtl">
              <button className="yd-close" onClick={() => setDecorPanel(null)} aria-label="إغلاق">
                <X className="w-6 h-6" />
              </button>

              <div className="yd-wallet">
                <img src="/yalla-ui/exp.png" alt="" />
                <span dir="ltr">3.8M</span>
                <img src="/yalla-ui/exp.png" alt="" />
                <span dir="ltr">144</span>
              </div>

              <div className="yd-titlewrap">
                <h2 className="yd-title">
                  {decorPanel === 'ornaments' && 'المعلقات الجدارية'}
                  {decorPanel === 'themes' && 'موضوع الملف الشخصي'}
                  {decorPanel === 'frames' && 'إطار الصورة'}
                  {decorPanel === 'cards' && 'بطاقة الملف الشخصي'}
                </h2>
              </div>

              {/* Ornaments: owned-only بتصميم المتجر */}
              {decorPanel === 'ornaments' && (
                <div className="fs-bodygrid fs-bodygrid--panel">
                  <button
                    className={`fs-card fs-card--none${!authUser.ornament ? ' fs-card--active' : ''}`}
                    disabled={savingDecor}
                    onClick={() => applyDecor('ornament', '')}
                  >
                    <span className="fs-card-name">لا يوجد</span>
                    <span className="fs-card-imgwrap fs-card-imgwrap--owned"><span className="fs-nopic">بدون</span></span>
                    <span className="fs-price fs-price--owned">—</span>
                    {!authUser.ornament && <i className="fs-check-check">✓</i>}
                  </button>
                  {decorCatalog.filter((d) => d.kind === 'ornament').map((o) => {
                    const active = (authUser.ornament || '') === o.id;
                    const owned = ownedDecor.has(o.id);
                    if (!owned) return null;
                    return (
                      <button
                        key={`orn-${o.id}`}
                        className={`fs-card fs-card--owned${active ? ' fs-card--active' : ''}`}
                        disabled={savingDecor}
                        onClick={() => applyDecor('ornament', o.id)}
                        title={o.nameAr}
                      >
                        <span className="fs-card-name">{o.nameAr}</span>
                        <span className="fs-card-imgwrap fs-card-imgwrap--owned">
                          <img src={o.imageUrl} alt={o.nameAr} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </span>
                        <span className="fs-price fs-price--owned">✓ تم الشراء</span>
                        <span className={RARITY_BADGEHOLDER[o.rarity] || RARITY_BADGEHOLDER.common}>{RARITY_LABELHOLDER[o.rarity] || RARITY_LABELHOLDER.common}</span>
                        {active && <i className="fs-check-check">✓</i>}
                      </button>
                    );
                  })}
                  {decorCatalog.filter((d) => d.kind === 'ornament' && ownedDecor.has(d.id)).length === 0 && (
                    <div className="fs-empty">لا تملك معلقات بعد — احصل عليها من المتجر</div>
                  )}
                </div>
              )}

              {/* Themes/covers: owned-only بتصميم المتجر */}
              {decorPanel === 'themes' && (
                <div className="fs-bodygrid fs-bodygrid--panel">
                  <button
                    className={`fs-card fs-card--none${!authUser.cover ? ' fs-card--active' : ''}`}
                    disabled={savingDecor}
                    onClick={() => applyDecor('cover', '')}
                  >
                    <span className="fs-card-name">بدون موضوع</span>
                    <span className="fs-card-imgwrap fs-card-imgwrap--owned"><span className="fs-nopic">بدون</span></span>
                    <span className="fs-price fs-price--owned">—</span>
                    {!authUser.cover && <i className="fs-check-check">✓</i>}
                  </button>
                  {decorCatalog.filter((d) => d.kind === 'theme').map((t) => {
                    const active = (authUser.cover || '') === t.id;
                    const owned = ownedDecor.has(t.id);
                    if (!owned) return null;
                    return (
                      <button
                        key={`cover-${t.id}`}
                        className={`fs-card fs-card--owned${active ? ' fs-card--active' : ''}`}
                        disabled={savingDecor}
                        onClick={() => applyDecor('cover', t.id)}
                        title={t.nameAr}
                      >
                        <span className="fs-card-name">{t.nameAr}</span>
                        <span className="fs-card-imgwrap fs-card-imgwrap--owned">
                          <img src={t.imageUrl} alt={t.nameAr} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </span>
                        <span className="fs-price fs-price--owned">✓ تم الشراء</span>
                        <span className={RARITY_BADGEHOLDER[t.rarity] || RARITY_BADGEHOLDER.common}>{RARITY_LABELHOLDER[t.rarity] || RARITY_LABELHOLDER.common}</span>
                        {active && <i className="fs-check-check">✓</i>}
                      </button>
                    );
                  })}
                  {decorCatalog.filter((d) => d.kind === 'theme' && ownedDecor.has(d.id)).length === 0 && (
                    <div className="fs-empty">لا تملك مواضيع بعد — احصل عليها من المتجر</div>
                  )}
                </div>
              )}

              {/* Frames: owned-only بتصميم المتجر */}
              {decorPanel === 'frames' && (
                <div className="fs-bodygrid fs-bodygrid--panel">
                  <button
                    className={`fs-card fs-card--none${!authUser.frame ? ' fs-card--active' : ''}`}
                    disabled={savingDecor}
                    onClick={() => applyDecor('frame', '')}
                  >
                    <span className="fs-card-name">بدون إطار</span>
                    <span className="fs-card-imgwrap fs-card-imgwrap--owned"><span className="fs-nopic">بدون</span></span>
                    <span className="fs-price fs-price--owned">—</span>
                    {!authUser.frame && <i className="fs-check-check">✓</i>}
                  </button>
                  {frames.filter((f) => ownedFrameIds.has(String(f.id))).map((f) => {
                    const fid = String(f.id);
                    const active = authUser.frame === fid;
                    const cat = framesCatalog.get(fid);
                    return (
                      <button
                        key={f.id}
                        className={`fs-card fs-card--owned${active ? ' fs-card--active' : ''}`}
                        disabled={savingDecor}
                        onClick={() => applyDecor('frame', fid)}
                        title={cat?.nameAr || f.name}
                      >
                        <span className="fs-card-name">{cat?.nameAr || f.name}</span>
                        <span className="fs-card-imgwrap fs-card-imgwrap--owned">
                          <img src={f.png} alt={f.name} loading="lazy" />
                        </span>
                        <span className="fs-price fs-price--owned">✓ تم الشراء</span>
                        <span className={RARITY_BADGEHOLDER[cat?.rarity || 'common']}>{RARITY_LABELHOLDER[cat?.rarity || 'common']}</span>
                        {active && <i className="fs-check-check">✓</i>}
                      </button>
                    );
                  })}
                  {frames.filter((f) => ownedFrameIds.has(String(f.id))).length === 0 && (
                    <div className="fs-empty">لا تملك إطارات بعد — احصل عليها من المتجر</div>
                  )}
                </div>
              )}

              {/* Cards: owned-only بتصميم المتجر — مكان البطاقة الوحيد: خلفية الغلاف */}
              {decorPanel === 'cards' && (
                <div className="fs-bodygrid fs-bodygrid--panel">
                  <button
                    key="none"
                    className={`fs-card fs-card--none${!authUser.card ? ' fs-card--active' : ''}`}
                    disabled={savingDecor}
                    onClick={() => applyDecor('card', '')}
                  >
                    <span className="fs-card-name">لا يوجد</span>
                    <span className="fs-card-imgwrap fs-card-imgwrap--owned"><span className="fs-nopic">بدون</span></span>
                    <span className="fs-price fs-price--owned">—</span>
                    {!authUser.card && <i className="fs-check-check">✓</i>}
                  </button>
                  {decorCatalog.filter((d) => d.kind === 'card').map((cb) => {
                    const active = (authUser.card || '') === cb.id;
                    const owned = ownedDecor.has(cb.id);
                    if (!owned) return null;
                    return (
                      <button
                        key={`card-${cb.id}`}
                        className={`fs-card fs-card--owned${active ? ' fs-card--active' : ''}`}
                        disabled={savingDecor}
                        onClick={() => applyDecor('card', cb.id)}
                        title={cb.nameAr}
                      >
                        <span className="fs-card-name">{cb.nameAr}</span>
                        <span className="fs-card-imgwrap fs-card-imgwrap--owned">
                          <img src={cb.imageUrl} alt={cb.nameAr} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </span>
                        <span className="fs-price fs-price--owned">✓ تم الشراء</span>
                        <span className={RARITY_BADGEHOLDER[cb.rarity] || RARITY_BADGEHOLDER.common}>{RARITY_LABELHOLDER[cb.rarity] || RARITY_LABELHOLDER.common}</span>
                        {active && <i className="fs-check-check">✓</i>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
