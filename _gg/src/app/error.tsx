'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft, Gamepad2 } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[App Error Boundary]', error);
    try {
      sessionStorage.setItem('gg_app_error', JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString(),
      }));
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4" dir="rtl">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md text-center relative"
      >
        {/* Logo / Branding */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <a
            href="/"
            className="inline-flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-shadow">
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-8 h-8 rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML =
                    '<span class="text-white text-xl font-black">غ</span>';
                }}
              />
            </div>
            <span className="text-lg font-black bg-gradient-to-l from-red-400 via-yellow-300 to-red-400 bg-clip-text text-transparent">
              ألعاب الغريب
            </span>
          </a>
        </motion.div>

        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="relative w-24 h-24 mx-auto mb-6"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-red-500/30 animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-slate-900/80 border border-red-500/20 flex items-center justify-center backdrop-blur-sm">
            <AlertTriangle className="w-12 h-12 text-red-400" />
          </div>
          {/* Decorative dots */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-red-400 rounded-full animate-ping" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        </motion.div>

        {/* Error Text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-black text-white mb-3"
        >
          حدث خطأ غير متوقع!
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm text-slate-400 mb-2 leading-relaxed"
        >
          عذراً، حدث خطأ أثناء تحميل الصفحة.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="text-xs text-slate-500 mb-6"
        >
          يمكنك إعادة المحاولة أو العودة للرئيسية.
        </motion.p>

        {/* Error details (collapsed) */}
        {error.message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="bg-red-950/20 border border-red-500/20 rounded-xl p-3 mb-6 text-left"
            dir="ltr"
          >
            <p className="text-[10px] text-red-400/70 font-mono break-all leading-relaxed">
              {error.message.substring(0, 300)}
            </p>
            {error.digest && (
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Digest: {error.digest}
              </p>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={reset}
            className="w-full h-12 bg-gradient-to-l from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-base shadow-lg shadow-red-500/20"
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </a>
        </motion.div>

        {/* Fun touch */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8"
        >
          <Gamepad2 className="w-6 h-6 text-slate-700 mx-auto" />
        </motion.div>
      </motion.div>
    </div>
  );
}
