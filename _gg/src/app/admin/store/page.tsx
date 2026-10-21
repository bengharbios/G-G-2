'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Loader2, Shield, ArrowRight, RefreshCw, Eye, EyeOff, Edit, Upload, Search, X, Save, Tag, Crown, Sparkles, Trash2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import SvgaOrImg from '@/components/shared/SvgaOrImg';

// ════════════════════════════════════════════════════════════════════════════
// /admin/store — لوحة إدارة المتجر الموحّدة
// - تجمع PlayerFrame (frames) + DecorItem (skins/themes/cards/ornaments) تحت واجهة واحدة
// - تكشف العناصر المخفية (visible='hidden') + المسحوبة (source='imported')
// - تتيح تعديل: price / rarity / visible / source / isNew / discountPercent / categoryId / sortOrder
// - رفع صورة (PNG/WebP) أو SVGA مباشرة عبر /api/admin/store/items/[id]/upload
// ════════════════════════════════════════════════════════════════════════════

interface Category { id: string; nameAr: string; icon: string; layoutType: string; sortOrder: number; }
interface StoreItem {
  id: string;
  kind: string;
  kindLabel: string;
  nameAr: string;
  imageUrl: string;
  animatedUrl: string;
  rarity: string;
  price: number;
  isFree: boolean;
  isActive: boolean;
  sortOrder: number;
  categoryId: string;
  visible: string;
  source: string;
  isNew: boolean;
  discountPercent: number;
  totalOwned: number;
}

const RARITY_META: Record<string, { label: string; cls: string }> = {
  common: { label: 'عادي', cls: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  rare: { label: 'نادر', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  epic: { label: 'ملحمي', cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  legendary: { label: 'أسطوري', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

const RARITY_OPTIONS = [
  { value: 'common', label: 'عادي' },
  { value: 'rare', label: 'نادر' },
  { value: 'epic', label: 'ملحمي' },
  { value: 'legendary', label: 'أسطوري' },
];

const VISIBLE_OPTIONS = [
  { value: 'shown', label: 'ظاهر' },
  { value: 'hidden', label: 'مخفي' },
  { value: 'scheduled', label: 'مجدول' },
];

const SOURCE_OPTIONS = [
  { value: 'ours', label: 'محلي' },
  { value: 'imported', label: 'مستورد' },
];

const CATEGORY_OPTIONS = [
  { value: 'frames', label: 'الإطارات' },
  { value: 'ludo_skin', label: 'غلاف لودو' },
  { value: 'domino_skin', label: 'غلاف دومينو' },
  { value: 'jackaroo_skin', label: 'غلاف جاكارو' },
  { value: 'profile_card', label: 'بطاقة الملف' },
  { value: 'wall_hangings', label: 'المعلقات الجدارية' },
  { value: 'themes', label: 'موضوع' },
  { value: 'entry_effects', label: 'مؤثرات الدخول' },
  { value: 'unique_id', label: 'المعرّف الفريد' },
  { value: 'pin_on_top', label: 'تثبيت في الأعلى' },
  { value: 'royal_vehicle', label: 'مركبة رويال' },
];

export default function AdminStorePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('frames');
  const [items, setItems] = useState<StoreItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState<'all' | 'shown' | 'hidden'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'ours' | 'imported'>('all');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<StoreItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<StoreItem>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{ id: string; table: string } | null>(null);

  // ─── Auth ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          setIsAuthenticated(true);
          setShowLogin(false);
        } else {
          setShowLogin(true);
          setIsAuthenticated(false);
        }
      } catch {
        setShowLogin(true);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setShowLogin(false);
        showToast('تم تسجيل الدخول بنجاح', 'success');
      } else {
        const data = await res.json();
        setLoginError(data.error || 'خطأ في تسجيل الدخول');
      }
    } catch {
      setLoginError('حدث خطأ في الاتصال');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/admin/login', { method: 'DELETE' }); } catch { /* ignore */ }
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Fetch categories ────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/store/categories');
      if (res.ok) {
        const d = await res.json();
        // إضافة 'frames' إن لم يكن موجوداً
        const cats = d.categories || [];
        if (!cats.find((c: Category) => c.id === 'frames')) {
          cats.unshift({ id: 'frames', nameAr: 'الإطارات', icon: '', layoutType: 'frame_shop', sortOrder: 0 });
        }
        setCategories(cats);
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Fetch items (admin: include hidden) ─────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!activeCategory) return;
    setItemsLoading(true);
    try {
      const res = await fetch(`/api/admin/store/items?categoryId=${activeCategory}&includeHidden=1`);
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (isAuthenticated) fetchCategories();
  }, [isAuthenticated, fetchCategories]);

  useEffect(() => {
    if (isAuthenticated && categories.length) fetchItems();
  }, [isAuthenticated, categories.length, fetchItems, activeCategory]);

  // ─── Edit handlers ───────────────────────────────────────────────────
  const openEdit = (item: StoreItem) => {
    setEditing(item);
    setEditForm({
      nameAr: item.nameAr,
      price: item.price,
      rarity: item.rarity,
      visible: item.visible,
      source: item.source,
      isActive: item.isActive,
      isNew: item.isNew,
      discountPercent: item.discountPercent,
      categoryId: item.categoryId,
      sortOrder: item.sortOrder,
      isFree: item.isFree,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    try {
      const table = editing.categoryId === 'frames' ? 'PlayerFrame' : 'DecorItem';
      const res = await fetch(`/api/admin/store/items/${encodeURIComponent(editing.id)}?table=${table}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, ...editForm }),
      });
      if (res.ok) {
        const d = await res.json();
        setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...d.item } : i));
        setEditing(null);
        showToast('تم تحديث العنصر', 'success');
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'فشل التحديث', 'error');
      }
    } catch {
      showToast('فشل التحديث', 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const toggleVisible = async (item: StoreItem) => {
    const newVisible = item.visible === 'shown' ? 'hidden' : 'shown';
    const table = item.categoryId === 'frames' ? 'PlayerFrame' : 'DecorItem';
    try {
      const res = await fetch(`/api/admin/store/items/${encodeURIComponent(item.id)}?table=${table}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, visible: newVisible }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, visible: newVisible } : i));
        showToast(`أصبح العنصر ${newVisible === 'shown' ? 'ظاهراً' : 'مخفياً'}`, 'success');
      } else { showToast('فشل التبديل', 'error'); }
    } catch { showToast('فشل التبديل', 'error'); }
  };

  const deleteItem = async (item: StoreItem) => {
    if (!confirm(`حذف "${item.nameAr}" (${item.id})؟ لا يمكن التراجع.`)) return;
    const table = item.categoryId === 'frames' ? 'PlayerFrame' : 'DecorItem';
    try {
      const res = await fetch(`/api/admin/store/items/${encodeURIComponent(item.id)}?table=${table}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== item.id));
        showToast('تم الحذف', 'success');
      } else { showToast('فشل الحذف', 'error'); }
    } catch { showToast('فشل الحذف', 'error'); }
  };

  // ─── Upload handler ──────────────────────────────────────────────────
  const startUpload = (item: StoreItem) => {
    setUploadTarget({ id: item.id, table: item.categoryId === 'frames' ? 'PlayerFrame' : 'DecorItem' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!uploadTarget) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(uploadTarget.id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(
        `/api/admin/store/items/${encodeURIComponent(uploadTarget.id)}/upload?table=${uploadTarget.table}`,
        { method: 'POST', body: fd },
      );
      if (res.ok) {
        const d = await res.json();
        // تحديث العنصر محلياً بالـ URL الجديد
        setItems(prev => prev.map(i => {
          if (i.id !== uploadTarget.id) return i;
          if (d.column === 'animatedUrl') return { ...i, animatedUrl: d.url };
          return { ...i, imageUrl: d.url };
        }));
        showToast('تم رفع الصورة بنجاح', 'success');
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'فشل الرفع', 'error');
      }
    } catch {
      showToast('فشل الرفع', 'error');
    } finally {
      setUploadingId(null);
      setUploadTarget(null);
    }
  };

  // ─── Login gate ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }
  if (showLogin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/50 backdrop-blur-sm relative rounded-xl">
          <div className="p-6">
            <div className="text-center space-y-4 pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">إدارة المتجر</h1>
                <p className="text-slate-400 mt-2">ألعاب الغريب — تسجيل دخول المشرف</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              {loginError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-md p-2 text-red-400 text-sm">{loginError}</div>
              )}
              <div className="space-y-1">
                <label className="text-slate-300 text-sm">اسم المستخدم</label>
                <input
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="admin"
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 text-sm">كلمة المرور</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-md px-3 py-2 text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 rounded-md py-2"
                disabled={loginLoading}
              >
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'تسجيل الدخول'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Filters ─────────────────────────────────────────────────────────
  const filtered = items.filter(i => {
    if (filterVisible !== 'all' && i.visible !== filterVisible) return false;
    if (filterSource !== 'all' && i.source !== filterSource) return false;
    if (search) {
      const q = search.trim().toLowerCase();
      const hay = `${i.id} ${i.nameAr} ${i.kind}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: items.length,
    shown: items.filter(i => i.visible === 'shown').length,
    hidden: items.filter(i => i.visible === 'hidden').length,
    imported: items.filter(i => i.source === 'imported').length,
    svga: items.filter(i => i.imageUrl.endsWith('.svga') || i.animatedUrl?.endsWith('.svga')).length,
  };

  // ═════════════════════════════════════════════════════════════════════
  // Render — main dashboard
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/webp,image/svg+xml,.svga"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
              <ArrowRight className="w-4 h-4" />
              <span>لوحة التحكم</span>
            </Link>
            <span className="text-slate-600">/</span>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-400" />
              إدارة المتجر
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchCategories(); fetchItems(); }}
              className="px-3 py-1.5 rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Category tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white border border-emerald-500'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800/50 hover:bg-slate-800/60'
              }`}
            >
              {cat.icon && (
                <img src={cat.icon} alt="" className="w-4 h-4 object-contain" />
              )}
              <span>{cat.nameAr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats + filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 border border-slate-800/40 rounded-lg p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">{stats.total} عنصر</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">{stats.shown} ظاهر</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-300">{stats.hidden} مخفي</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">{stats.imported} مستورد</span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300">{stats.svga} متحرك</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="بحث…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950/70 border border-slate-800/60 rounded-md pr-8 pl-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <select
              value={filterVisible}
              onChange={(e) => setFilterVisible(e.target.value as 'all' | 'shown' | 'hidden')}
              className="bg-slate-950/70 border border-slate-800/60 rounded-md px-2 py-1.5 text-sm text-slate-300"
            >
              <option value="all">كل الحالات</option>
              <option value="shown">ظاهر فقط</option>
              <option value="hidden">مخفي فقط</option>
            </select>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as 'all' | 'ours' | 'imported')}
              className="bg-slate-950/70 border border-slate-800/60 rounded-md px-2 py-1.5 text-sm text-slate-300"
            >
              <option value="all">كل المصادر</option>
              <option value="ours">محلي فقط</option>
              <option value="imported">مستورد فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {itemsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <p>لا توجد عناصر مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
                onToggleVisible={() => toggleVisible(item)}
                onUpload={() => startUpload(item)}
                onDelete={() => deleteItem(item)}
                uploading={uploadingId === item.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {editing && (
        <EditDialog
          item={editing}
          form={editForm}
          setForm={setEditForm}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
          saving={editSaving}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ItemCard — بطاقة عنصر في الشبكة
// ════════════════════════════════════════════════════════════════════════════
function ItemCard({
  item, onEdit, onToggleVisible, onUpload, onDelete, uploading,
}: {
  item: StoreItem;
  onEdit: () => void;
  onToggleVisible: () => void;
  onUpload: () => void;
  onDelete: () => void;
  uploading: boolean;
}) {
  const rarity = RARITY_META[item.rarity] || RARITY_META.common;
  const isSvga = item.imageUrl.endsWith('.svga') || item.animatedUrl?.endsWith('.svga');
  const previewSrc = item.imageUrl || item.animatedUrl || '';
  const isHidden = item.visible === 'hidden';
  const isImported = item.source === 'imported';

  return (
    <div className={`relative bg-slate-900/60 border border-slate-800/50 rounded-lg p-3 space-y-2 ${isHidden ? 'opacity-50' : ''}`}>
      {/* Badges row */}
      <div className="absolute top-1 left-1 z-10 flex flex-col gap-1">
        {isImported && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[9px] font-bold">مستورد</span>
        )}
        {isSvga && (
          <span className="px-1.5 py-0.5 rounded bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] font-bold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> SVGA
          </span>
        )}
        {item.isNew && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-[9px] font-bold">جديد</span>
        )}
        {item.discountPercent > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[9px] font-bold">-{item.discountPercent}%</span>
        )}
      </div>

      {/* Hidden / shown indicator */}
      <div className="absolute top-1 right-1 z-10">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
          isHidden
            ? 'bg-slate-500/30 border border-slate-500/40 text-slate-300'
            : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
        }`}>
          {isHidden ? 'مخفي' : 'ظاهر'}
        </span>
      </div>

      {/* Preview */}
      <div className="flex justify-center pt-4">
        <div className="w-20 h-20 rounded-md bg-slate-950/60 border border-slate-800/40 flex items-center justify-center overflow-hidden relative">
          {previewSrc ? (
            <div className="w-full h-full">
              <SvgaOrImg src={previewSrc} alt={item.nameAr} />
            </div>
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-600" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Name + id */}
      <div className="text-center space-y-0.5">
        <p className="font-bold text-white text-xs truncate" title={item.nameAr}>{item.nameAr}</p>
        <p className="text-[10px] text-slate-500 font-mono" dir="ltr">{item.id}</p>
      </div>

      {/* Rarity + price */}
      <div className="flex items-center justify-between text-[10px]">
        <span className={`px-1.5 py-0.5 rounded border ${rarity.cls}`}>{rarity.label}</span>
        <span className="text-slate-400">{item.isFree ? 'مجاني' : `${item.price}💎`}</span>
      </div>

      {/* Owned + category */}
      <div className="flex items-center justify-between text-[10px] text-slate-500">
        <span>{item.totalOwned} مملوك</span>
        <span dir="ltr">{item.categoryId}</span>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-1 pt-1">
        <button onClick={onEdit} className="flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded p-1" title="تعديل">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={onToggleVisible} className={`flex items-center justify-center rounded p-1 ${item.visible === 'shown' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-700'}`} title={item.visible === 'shown' ? 'إخفاء' : 'إظهار'}>
          {item.visible === 'shown' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onUpload} className="flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded p-1" title="رفع صورة">
          <Upload className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} className="flex items-center justify-center text-red-400 hover:bg-red-500/10 rounded p-1" title="حذف">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EditDialog — تعديل حقول العنصر
// ════════════════════════════════════════════════════════════════════════════
function EditDialog({
  item, form, setForm, onClose, onSave, saving,
}: {
  item: StoreItem;
  form: Partial<StoreItem>;
  setForm: (f: Partial<StoreItem>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const table = item.categoryId === 'frames' ? 'PlayerFrame' : 'DecorItem';
  const update = (patch: Partial<StoreItem>) => setForm({ ...form, ...patch });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-400" />
              تعديل العنصر
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-1" dir="ltr">{item.id} · {table}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center p-4 bg-slate-950/40">
          <div className="w-24 h-24 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
            {(form.imageUrl || item.imageUrl || form.animatedUrl || item.animatedUrl) ? (
              <div className="w-full h-full">
                <SvgaOrImg src={(form.imageUrl || item.imageUrl || form.animatedUrl || item.animatedUrl) as string} alt={form.nameAr || item.nameAr} />
              </div>
            ) : <ImageIcon className="w-8 h-8 text-slate-600" />}
          </div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الاسم (عربي)">
              <input
                value={form.nameAr ?? ''}
                onChange={(e) => update({ nameAr: e.target.value })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="المعرّف">
              <input
                value={item.id}
                disabled
                className="w-full bg-slate-950/40 border border-slate-800/40 rounded-md px-3 py-2 text-sm text-slate-500 font-mono"
                dir="ltr"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="السعر (جواهر)">
              <input
                type="number"
                min="0"
                value={form.price ?? 0}
                onChange={(e) => update({ price: Number(e.target.value) })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              />
            </Field>
            <Field label="الندرة">
              <select
                value={form.rarity ?? 'common'}
                onChange={(e) => update({ rarity: e.target.value as StoreItem['rarity'] })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              >
                {RARITY_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="الحالة">
              <select
                value={form.visible ?? 'shown'}
                onChange={(e) => update({ visible: e.target.value as StoreItem['visible'] })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              >
                {VISIBLE_OPTIONS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="المصدر">
              <select
                value={form.source ?? 'ours'}
                onChange={(e) => update({ source: e.target.value as StoreItem['source'] })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              >
                {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="القسم">
              <select
                value={form.categoryId ?? item.categoryId}
                onChange={(e) => update({ categoryId: e.target.value })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              >
                {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="ترتيب الفرز">
              <input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => update({ sortOrder: Number(e.target.value) })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="نسبة الخصم %">
              <input
                type="number"
                min="0"
                max="99"
                value={form.discountPercent ?? 0}
                onChange={(e) => update({ discountPercent: Number(e.target.value) })}
                className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white"
              />
            </Field>
            <div className="flex items-center gap-4 mt-6">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={!!form.isFree}
                  onChange={(e) => update({ isFree: e.target.checked })}
                  className="rounded"
                />
                مجاني
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => update({ isActive: e.target.checked })}
                  className="rounded"
                />
                نشط
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={!!form.isNew}
                  onChange={(e) => update({ isNew: e.target.checked })}
                  className="rounded"
                />
                جديد
              </label>
            </div>
          </div>

          {/* Image URL — direct edit */}
          <Field label="رابط الصورة (imageUrl)">
            <input
              value={form.imageUrl ?? ''}
              onChange={(e) => update({ imageUrl: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white font-mono"
              dir="ltr"
            />
          </Field>

          {/* Animated URL */}
          <Field label="رابط المتحرك (animatedUrl) — يُستخدم لملفات SVGA">
            <input
              value={form.animatedUrl ?? ''}
              onChange={(e) => update({ animatedUrl: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800/60 rounded-md px-3 py-2 text-sm text-white font-mono"
              dir="ltr"
            />
          </Field>

          {/* Conflict warning */}
          {item.source === 'imported' && item.visible === 'hidden' && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-md p-3 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">عنصر مستورد مخفي</p>
                <p className="mt-1">هذا العنصر مسحوب من سورس يللا لودو (skin_{item.id.replace('skin_', '')}). لجعله ظاهراً في المتجر، يجب رفع صورة PNG/SVGA مطابقة ثم تبديل الحالة إلى "ظاهر". استخدم زر الرفع في البطاقة.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-800/60 text-slate-300 hover:bg-slate-700 text-sm">
            إلغاء
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-400">{label}</label>
      {children}
    </div>
  );
}
