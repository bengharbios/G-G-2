import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/10 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-slate-900/80 border border-slate-800/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        </div>

        {/* Text */}
        <p className="text-sm text-slate-400 animate-pulse">
          جاري التحميل...
        </p>
      </div>
    </div>
  );
}
