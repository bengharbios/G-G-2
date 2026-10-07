'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Shield,
  Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  avatar: string;
  role: string;
  numericId?: number | null;
}

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
  onRegisterSuccess: (user: AuthUser) => void;
}

// ─── Animation variants ──────────────────────────────────────────────

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 25 },
  }),
};

// ─── Password Strength ───────────────────────────────────────────────

function getPasswordStrength(password: string): { level: number; label: string; color: string; percent: number } {
  if (!password) return { level: 0, label: '', color: '', percent: 0 };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { level: 0, label: 'ضعيفة', color: 'bg-rose-500', percent: 0 },
    { level: 1, label: 'ضعيفة', color: 'bg-rose-500', percent: 20 },
    { level: 2, label: 'متوسطة', color: 'bg-amber-500', percent: 40 },
    { level: 3, label: 'متوسطة', color: 'bg-amber-500', percent: 60 },
    { level: 4, label: 'قوية', color: 'bg-emerald-500', percent: 80 },
    { level: 5, label: 'قوية جداً', color: 'bg-emerald-500', percent: 100 },
  ];

  return levels[score];
}

// ─── Login Modal ─────────────────────────────────────────────────────

export function LoginModal({ open, onOpenChange, onSwitchToRegister, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: '⚠️ تنبيه', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: '✅ مرحباً!', description: `تم تسجيل الدخول بنجاح` });
        onLoginSuccess(data.user);
        onOpenChange(false);
        setEmail('');
        setPassword('');
      } else {
        toast({ title: '❌ خطأ', description: data.error || 'فشل تسجيل الدخول', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [email, password, toast, onLoginSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-0 bg-transparent">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="login-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative flex flex-col"
              dir="rtl"
            >
              {/* Top gradient */}
              <div className="relative h-24 overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/60 via-orange-900/40 to-slate-950" />
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-500/10 blur-xl" />
                <motion.div
                  className="absolute top-4 right-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                >
                  <Shield className="w-10 h-10 text-amber-400/60" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="bg-slate-950 rounded-b-2xl border border-slate-800/60 border-t-0 p-6 sm:p-8">
                <motion.div variants={fieldVariants} custom={0} className="text-center mb-6">
                  <h2 className="text-xl font-black text-white mb-1">تسجيل الدخول</h2>
                  <p className="text-sm text-slate-400">مرحباً بعودتك إلى ألعاب الغريب</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <motion.div variants={fieldVariants} custom={1} className="space-y-2">
                    <Label className="text-sm text-slate-300">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        dir="ltr"
                        className="pr-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-11"
                        disabled={loading}
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={fieldVariants} custom={2} className="space-y-2">
                    <Label className="text-sm text-slate-300">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        className="pr-10 pl-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-amber-500/20 h-11"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Forgot password */}
                  <motion.div variants={fieldVariants} custom={3} className="text-left">
                    <button
                      type="button"
                      onClick={() => toast({ title: '🔒 قريباً', description: 'استعادة كلمة المرور ستتوفر قريباً' })}
                      className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={fieldVariants} custom={4}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-base shadow-lg shadow-amber-500/20 rounded-xl"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري تسجيل الدخول...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogIn className="w-5 h-5" />
                          <span>تسجيل الدخول</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Switch to register */}
                <motion.div variants={fieldVariants} custom={5} className="mt-6 text-center">
                  <Separator className="bg-slate-800/60 mb-4" />
                  <p className="text-sm text-slate-400">
                    ليس لديك حساب؟{' '}
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        setTimeout(() => onSwitchToRegister(), 150);
                      }}
                      className="text-amber-400 font-bold hover:text-amber-300 transition-colors"
                    >
                      سجل الآن
                    </button>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ─── Register Modal ──────────────────────────────────────────────────

export function RegisterModal({ open, onOpenChange, onSwitchToLogin, onRegisterSuccess }: RegisterModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const { toast } = useToast();

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      toast({ title: '⚠️ تنبيه', description: 'يرجى ملء الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: '⚠️ تنبيه', description: 'كلمة المرور غير متطابقة', variant: 'destructive' });
      return;
    }

    if (!agreeTerms) {
      toast({ title: '⚠️ تنبيه', description: 'يرجى الموافقة على الشروط والأحكام', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast({ title: '🎉 مرحباً!', description: 'تم إنشاء الحساب بنجاح' });
        onRegisterSuccess(data.user);
        onOpenChange(false);
        // Reset form
        setUsername('');
        setEmail('');
        setDisplayName('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
        setAgreeTerms(false);
      } else {
        toast({ title: '❌ خطأ', description: data.error || 'فشل إنشاء الحساب', variant: 'destructive' });
      }
    } catch {
      toast({ title: '❌ خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [username, email, displayName, phone, password, confirmPassword, agreeTerms, toast, onRegisterSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-0 bg-transparent">
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              key="register-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative flex flex-col"
              dir="rtl"
            >
              {/* Top gradient */}
              <div className="relative h-24 overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-bl from-emerald-900/60 via-teal-900/40 to-slate-950" />
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl" />
                <motion.div
                  className="absolute top-4 right-4"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                >
                  <Sparkles className="w-10 h-10 text-emerald-400/60" />
                </motion.div>
              </div>

              {/* Content */}
              <div className="bg-slate-950 rounded-b-2xl border border-slate-800/60 border-t-0 p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
                <style>{`
                  .register-scroll::-webkit-scrollbar { width: 4px; }
                  .register-scroll::-webkit-scrollbar-track { background: transparent; }
                  .register-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 4px; }
                `}</style>

                <motion.div variants={fieldVariants} custom={0} className="text-center mb-5">
                  <h2 className="text-xl font-black text-white mb-1">إنشاء حساب جديد</h2>
                  <p className="text-sm text-slate-400">انضم إلى مجتمع ألعاب الغريب</p>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Username */}
                  <motion.div variants={fieldVariants} custom={1} className="space-y-1.5">
                    <Label className="text-sm text-slate-300">اسم المستخدم <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        dir="ltr"
                        className="pr-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                        disabled={loading}
                      />
                    </div>
                  </motion.div>

                  {/* Display Name */}
                  <motion.div variants={fieldVariants} custom={2} className="space-y-1.5">
                    <Label className="text-sm text-slate-300">الاسم المعروض</Label>
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="اسمك الذي سيظهر للجميع"
                      className="bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                      disabled={loading}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div variants={fieldVariants} custom={3} className="space-y-1.5">
                    <Label className="text-sm text-slate-300">البريد الإلكتروني <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        dir="ltr"
                        className="pr-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                        disabled={loading}
                      />
                    </div>
                  </motion.div>

                  {/* Phone */}
                  <motion.div variants={fieldVariants} custom={4} className="space-y-1.5">
                    <Label className="text-sm text-slate-300">رقم الهاتف (اختياري)</Label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+968 XXXX XXXX"
                        dir="ltr"
                        className="pr-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                        disabled={loading}
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div variants={fieldVariants} custom={5} className="space-y-1.5">
                    <Label className="text-sm text-slate-300">كلمة المرور <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        dir="ltr"
                        className="pr-10 pl-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Password strength */}
                    {password && (
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${passwordStrength.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${passwordStrength.percent}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500">قوة كلمة المرور: {passwordStrength.label}</p>
                      </div>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div variants={fieldVariants} custom={6} className="space-y-1.5">
                    <Label className="text-sm text-slate-300">تأكيد كلمة المرور <span className="text-rose-400">*</span></Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="أعد كتابة كلمة المرور"
                        dir="ltr"
                        className="pr-10 bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-11"
                        disabled={loading}
                      />
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-[10px] text-rose-400">كلمة المرور غير متطابقة</p>
                    )}
                  </motion.div>

                  {/* Terms */}
                  <motion.div variants={fieldVariants} custom={7} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer accent-amber-500"
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      أوافق على{' '}
                      <span className="text-amber-400 hover:text-amber-300 cursor-pointer">شروط الاستخدام</span>
                      {' '}و{' '}
                      <span className="text-amber-400 hover:text-amber-300 cursor-pointer">سياسة الخصوصية</span>
                    </p>
                  </motion.div>

                  {/* Submit */}
                  <motion.div variants={fieldVariants} custom={8}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/20 rounded-xl"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>جاري إنشاء الحساب...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5" />
                          <span>إنشاء حساب</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </form>

                {/* Switch to login */}
                <motion.div variants={fieldVariants} custom={9} className="mt-5 text-center">
                  <Separator className="bg-slate-800/60 mb-4" />
                  <p className="text-sm text-slate-400">
                    لديك حساب بالفعل؟{' '}
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        setTimeout(() => onSwitchToLogin(), 150);
                      }}
                      className="text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                    >
                      سجل دخول
                    </button>
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
