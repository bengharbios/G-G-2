'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Globe } from 'lucide-react';

/**
 * ClearCacheCard
 * 
 * بطاقة في لوحة التحكم تتيح للـadmin مسح cache لكل المستخدمين
 * (بما فيهم مستخدمي APK على الهواتف).
 */
export function ClearCacheCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; version?: number; updatedAt?: string } | null>(null);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [lastCleared, setLastCleared] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/clear-cache', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.success) {
          setCurrentVersion(data.version);
          setLastCleared(data.updatedAt || '');
        }
      })
      .catch(() => {});
  }, []);

  const handleClearCache = async () => {
    if (loading) return;
    if (!confirm('سيتم مسح cache لكل المستخدمين (بما فيهم مستخدمي APK على الهواتف).\n\nهل أنت متأكد؟')) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/clear-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'مسح cache من لوحة التحكم' }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          version: data.version,
          updatedAt: data.updatedAt,
        });
        setCurrentVersion(data.version);
        setLastCleared(data.updatedAt || '');
      } else {
        setResult({ success: false, message: data.error || 'فشل المسح' });
      }
    } catch (error) {
      setResult({ success: false, message: `خطأ في الاتصال: ${String(error)}` });
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 10_000);
    }
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800/40">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          مسح cache لكل المستخدمين
        </CardTitle>
        <CardDescription className="text-slate-500">
          يجبر كل المستخدمين (الويب + APK) على تحميل النسخة الجديدة من الصور والملفات
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
              <RefreshCw className="w-3 h-3" />
              <span>الإصدار الحالي</span>
            </div>
            <div className="text-xl font-black text-emerald-400">v{currentVersion ?? '-'}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
              <RefreshCw className="w-3 h-3" />
              <span>آخر تحديث</span>
            </div>
            <div className="text-sm font-bold text-slate-300" dir="ltr">
              {lastCleared || '—'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-700/20">
          <div className="flex items-start gap-2 text-xs text-amber-200/80">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Smartphone className="w-3 h-3" />
                مستخدمو APK على الهواتف
              </div>
              <p>سيحصلون على نسخة جديدة عند فتح التطبيق القادم. الـWebView سيُمسح cache تلقائياً ويُحمّل الملفات الجديدة.</p>
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mt-2">
                <Globe className="w-3 h-3" />
                مستخدمو الويب
              </div>
              <p>سيحصلون على نسخة جديدة خلال 60 ثانية (أقرب فحص للإصدار).</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleClearCache}
          disabled={loading}
          className="w-full bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold py-3 text-sm shadow-lg shadow-rose-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري المسح...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 ml-2" />
              🧹 مسح cache لكل المستخدمين
            </>
          )}
        </Button>

        {result && (
          <div
            className={`p-3 rounded-lg border ${
              result.success
                ? 'bg-emerald-950/30 border-emerald-700/30 text-emerald-200'
                : 'bg-rose-950/30 border-rose-700/30 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2 text-xs">
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{result.success ? '✅ تم بنجاح' : '❌ فشل'}</p>
                <p>{result.message}</p>
                {result.version && (
                  <p className="text-[10px] text-slate-400">الإصدار الجديد: v{result.version}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-[10px] text-slate-500 space-y-1">
          <p>💡 <strong>متى تستخدم هذا الزر؟</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>عند تحديث صور ألعاب (مثل صورة حرب الاكلات)</li>
            <li>عند تغيير أيقونات في BattlePage</li>
            <li>عند تحديث CSS أو JS ولاحظت أن المستخدمين يرون نسخة قديمة</li>
          </ul>
          <p className="mt-2 text-amber-400/70">⚠ لا تستخدمه بشكل متكرر — كل ضغطة تجبر كل المستخدمين على إعادة تحميل الموقع.</p>
        </div>
      </CardContent>
    </Card>
  );
}
