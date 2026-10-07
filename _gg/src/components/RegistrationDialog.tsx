'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, Copy, Clock, Gamepad2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

interface RegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (code: string) => void;
  subscriptionPrice: string;
  contactMessage: string;
  trialDurationDays: number;
  maxTrialSessions: number;
  trialGameSlugs: string[];
}

// ─── Component ────────────────────────────────────────────────────────

export default function RegistrationDialog({
  open,
  onOpenChange,
  onSuccess,
  subscriptionPrice,
  contactMessage,
  trialDurationDays,
  maxTrialSessions,
  trialGameSlugs,
}: RegistrationDialogProps) {
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError('الاسم والبريد الإلكتروني مطلوبان');
      return;
    }

    setError('');
    setStep('loading');

    try {
      const res = await fetch('/api/subscription/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء التسجيل');
        setStep('form');
        return;
      }

      setGeneratedCode(data.code);
      setStep('success');
    } catch {
      setError('تعذر الاتصال بالخادم');
      setStep('form');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = generatedCode;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handlePlayNow = () => {
    onSuccess(generatedCode);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setStep('form');
        setName('');
        setEmail('');
        setPhone('');
        setGeneratedCode('');
        setError('');
      }, 300);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="bg-slate-900 border-slate-800/60 backdrop-blur-sm sm:max-w-md"
        dir="rtl"
      >
        {step === 'form' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl font-black text-white">
                🎁 تجربة مجانية!
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                سجل واحصل على كود تجربة للعب مجاناً
              </DialogDescription>
            </DialogHeader>

            {/* Trial Details */}
            {(trialDurationDays > 0 || maxTrialSessions > 0) && (
              <div className="bg-violet-950/30 border border-violet-500/20 rounded-xl p-4">
                <h4 className="text-sm font-bold text-violet-300 mb-3 text-center">
                  تفاصيل التجربة المجانية
                </h4>
                <div className="flex items-center justify-center gap-6">
                  {trialDurationDays > 0 && (
                    <div className="text-center">
                      <Clock className="w-5 h-5 mx-auto text-violet-400 mb-1" />
                      <p className="text-lg font-black text-white">{trialDurationDays}</p>
                      <p className="text-[10px] text-slate-500">أيام</p>
                    </div>
                  )}
                  {maxTrialSessions > 0 && (
                    <div className="text-center">
                      <Gamepad2 className="w-5 h-5 mx-auto text-violet-400 mb-1" />
                      <p className="text-lg font-black text-white">{maxTrialSessions}</p>
                      <p className="text-[10px] text-slate-500">{maxTrialSessions === 1 ? 'جولة' : 'جولات'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  الاسم <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500"
                  dir="rtl"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  البريد الإلكتروني <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  type="email"
                  className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500"
                  dir="ltr"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  الهاتف <span className="text-slate-500">(اختياري)</span>
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500"
                  dir="ltr"
                  maxLength={15}
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-rose-400 text-center"
                >
                  {error}
                </motion.p>
              )}

              {contactMessage && (
                <p className="text-xs text-slate-500 text-center">{contactMessage}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={!name.trim() || !email.trim()}
                className="w-full h-12 bg-gradient-to-l from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold text-base shadow-lg shadow-violet-500/20 disabled:opacity-50"
              >
                احصل على كود التجربة
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
            <p className="text-sm text-slate-400">جاري إنشاء كود التجربة...</p>
          </div>
        )}

        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 py-2"
          >
            {/* Success Icon */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-4"
              >
                <Check className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h3 className="text-lg font-bold text-white mb-1">تم التسجيل بنجاح!</h3>
              <p className="text-sm text-slate-400">
                احفظ كود التجربة التالي
              </p>
            </div>

            {/* Trial badge */}
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-950/40 border border-violet-500/20 text-xs font-bold text-violet-300">
                🎁 تجربة مجانية
              </span>
            </div>

            {/* Generated Code */}
            <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-2">كود التجربة</p>
              <p className="text-3xl font-mono font-black text-amber-300 tracking-[0.2em] mb-3" dir="ltr">
                {generatedCode}
              </p>
              <Button
                onClick={handleCopyCode}
                variant="outline"
                size="sm"
                className="border-slate-700/60 text-slate-300 hover:bg-slate-700/60 hover:text-white gap-2"
              >
                {codeCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    تم النسخ!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    نسخ الكود
                  </>
                )}
              </Button>
            </div>

            {/* Trial Limits Reminder */}
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-lg p-3 space-y-2">
              <p className="text-xs text-amber-300/80 text-center font-bold">
                ⚠️ احفظ هذا الكود! ستستخدمه للدخول.
              </p>
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500">
                {trialDurationDays > 0 && (
                  <span>مدة التجربة: {trialDurationDays} أيام</span>
                )}
                {maxTrialSessions > 0 && (
                  <span>عدد الجولات: {maxTrialSessions}</span>
                )}
              </div>
            </div>

            {/* Play Now Button */}
            <Button
              onClick={handlePlayNow}
              className="w-full h-13 bg-gradient-to-l from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-base shadow-lg shadow-emerald-500/20"
            >
              🎮 العب الآن
            </Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
