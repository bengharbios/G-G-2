'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode, Component, type ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Loader2, ArrowLeft, RefreshCw, Crown, Gamepad2, Clock, Gift, Sparkles } from 'lucide-react';
import RegistrationDialog from '@/components/RegistrationDialog';

// ─── Types ────────────────────────────────────────────────────────────

interface SiteConfig {
  allowDirectRegistration: boolean;
  telegramLink: string;
  whatsappLink: string;
  subscriptionPrice: string;
  contactMessage: string;
  trialGameSlugs: string[];
  trialDurationDays: number;
  maxTrialSessions: number;
}

interface TrialInfo {
  sessionsUsed: number;
  maxSessions: number;
  expiresAt: string | null;
  daysLeft: number;
}

interface SubscriptionGuardProps {
  children: ReactNode;
  gameSlug: string;
}

// ─── Link normalizers ────────────────────────────────────────────────

function normalizeTelegramLink(link: string): string {
  const trimmed = link.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('@')) return `https://t.me/${trimmed.substring(1)}`;
  return `https://t.me/${trimmed}`;
}

function normalizeWhatsAppLink(link: string): string {
  const trimmed = link.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length >= 10) return `https://wa.me/${digits}`;
  return `https://wa.me/${trimmed}`;
}

// ─── Error Boundary (class component required) ──────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GameErrorBoundary extends Component<
  { children: ReactNode; gameSlug: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; gameSlug: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[GameErrorBoundary] Error in ${this.props.gameSlug}:`, error, errorInfo);
    try {
      sessionStorage.setItem('gg_last_error', JSON.stringify({
        game: this.props.gameSlug,
        message: error.message,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString(),
      }));
    } catch {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = this.state.error?.message || 'خطأ غير معروف';
      console.error(`[GameErrorBoundary] Full error in ${this.props.gameSlug}:`, this.state.error);
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-xl font-black text-white mb-2">
              حدث خطأ في اللعبة
            </h2>
            <p className="text-sm text-slate-400 mb-1">
              عذراً، حدث خطأ غير متوقع أثناء تحميل اللعبة.
            </p>
            <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-3 mt-3 mb-4 text-left" dir="ltr">
              <p className="text-[10px] text-red-400/80 font-mono break-all">
                {errorDetails.substring(0, 200)}
              </p>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              تأكد من أن الاشتراك يشمل هذه اللعبة، ثم حاول مرة أخرى.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </Button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                العودة للرئيسية
              </a>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Main Component ───────────────────────────────────────────────────

export default function SubscriptionGuard({ children, gameSlug }: SubscriptionGuardProps) {
  const [guardState, setGuardState] = useState<'checking' | 'no_code' | 'validating' | 'allowed' | 'denied'>('checking');
  const [deniedReason, setDeniedReason] = useState('');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [subscriberName, setSubscriberName] = useState('');

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const validateCode = useCallback(async (codeToValidate: string, isFirstEntry: boolean = false) => {
    if (!codeToValidate.trim()) {
      setGuardState('no_code');
      return;
    }

    setGuardState('validating');
    setErrorMsg('');
    setTrialInfo(null);

    try {
      const res = await fetch('/api/subscription/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeToValidate.trim(),
          gameSlug,
          incrementUsage: isFirstEntry,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      // Safely parse JSON
      let data: Record<string, unknown>;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('[SubscriptionGuard] Failed to parse response JSON:', jsonErr);
        throw new Error('Invalid server response');
      }

      if (!isMountedRef.current) return;

      if (data.allowed) {
        localStorage.setItem('gg_sub_code', codeToValidate.trim());
        if (data.trialInfo) {
          setTrialInfo(data.trialInfo as TrialInfo);
        }
        if (data.subscriber?.name) {
          setSubscriberName(data.subscriber.name as string);
        }
        // Store subscriber info for GameLayout to read
        if (data.subscriber) {
          localStorage.setItem('gg_sub_info', JSON.stringify({
            name: data.subscriber.name,
            subscriptionCode: data.subscriber.subscriptionCode,
            plan: data.subscriber.plan,
            isTrial: data.subscriber.isTrial,
            endDate: data.subscriber.endDate,
          }));
        } else if (data.allowed) {
          localStorage.setItem('gg_sub_info', JSON.stringify({
            name: subscriberName || 'مستخدم',
            subscriptionCode: codeToValidate.trim(),
            plan: 'paid',
            isTrial: false,
            endDate: null,
          }));
        }
        setGuardState('allowed');
      } else {
        setDeniedReason((data.reason as string) || 'not_subscribed');
        if (data.trialInfo) {
          setTrialInfo(data.trialInfo as TrialInfo);
        }
        if (data.subscriber?.name) {
          setSubscriberName(data.subscriber.name as string);
        }
        setGuardState('denied');
      }
    } catch (err) {
      console.error('[SubscriptionGuard] Validation error:', err);
      if (!isMountedRef.current) return;
      setErrorMsg('حدث خطأ في الاتصال بالخادم');
      setGuardState('no_code');
    }
  }, [gameSlug]);

  // Check localStorage for existing code on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('gg_sub_code');
    setTimeout(() => {
      if (!isMountedRef.current) return;
      if (savedCode) {
        setCode(savedCode);
        validateCode(savedCode, false);
      } else {
        setGuardState('no_code');
      }
    }, 0);
  }, [validateCode]);

  // Fetch site config
  useEffect(() => {
    let cancelled = false;
    fetch('/api/site-config')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch site config');
        return r.json();
      })
      .then((data) => {
        if (!cancelled && isMountedRef.current) {
          setSiteConfig(data);
        }
      })
      .catch((err) => {
        console.warn('[SubscriptionGuard] Failed to fetch site config:', err);
        // Don't crash - siteConfig stays null, UI just won't show social links
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmitCode = useCallback(() => {
    if (!code.trim()) return;
    const savedCode = localStorage.getItem('gg_sub_code');
    const isFirstEntry = !savedCode || savedCode !== code.trim();
    validateCode(code, isFirstEntry);
  }, [code, validateCode]);

  const handleTryAnotherCode = useCallback(() => {
    localStorage.removeItem('gg_sub_code');
    localStorage.removeItem('gg_sub_info');
    setCode('');
    setDeniedReason('');
    setErrorMsg('');
    setTrialInfo(null);
    setSubscriberName('');
    setGuardState('no_code');
  }, []);

  const handleRegistrationSuccess = useCallback((newCode: string) => {
    localStorage.setItem('gg_sub_code', newCode);
    setCode(newCode);
    setShowRegistration(false);
    validateCode(newCode, true);
  }, [validateCode]);

  // ─── Loading / checking state ────────────────────────────────────────

  if (guardState === 'checking' || guardState === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 animate-pulse" />
            <div className="relative w-full h-full flex items-center justify-center">
              {guardState === 'checking' ? (
                <Lock className="w-10 h-10 text-amber-400" />
              ) : (
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              )}
            </div>
          </div>
          <p className="text-slate-400 text-sm">
            {guardState === 'checking' ? 'جاري التحقق...' : 'جاري التحقق من الكود...'}
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Allowed → render children with error boundary ──────────────────

  if (guardState === 'allowed') {
    return (
      <GameErrorBoundary gameSlug={gameSlug}>
        {children}
      </GameErrorBoundary>
    );
  }

  // ─── No code → show subscription entry ───────────────────────────────

  if (guardState === 'no_code') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900/90 border-slate-800/60 backdrop-blur-sm shadow-2xl shadow-black/40">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Lock Icon */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center mb-4"
                >
                  <Lock className="w-10 h-10 text-amber-400" />
                </motion.div>
                <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
                  هذه اللعبة تحتاج اشتراك
                </h2>
                <p className="text-sm text-slate-400">
                  أدخل كود الاشتراك للوصول إلى اللعبة
                </p>
              </div>

              {/* Code Input */}
              <div className="space-y-3">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitCode()}
                  placeholder="أدخل كود الاشتراك GG-XXXX"
                  className="bg-slate-800/60 border-slate-700/60 text-white placeholder:text-slate-500 text-center text-lg font-mono tracking-widest h-14 focus:border-amber-500/50 focus:ring-amber-500/20"
                  dir="ltr"
                  maxLength={10}
                />
                {errorMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-rose-400 text-center"
                  >
                    {errorMsg}
                  </motion.p>
                )}
                <Button
                  onClick={handleSubmitCode}
                  disabled={!code.trim() || guardState === 'validating'}
                  className="w-full h-13 bg-gradient-to-l from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-base shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  تأكيد
                </Button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="text-xs text-slate-500">أو</span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>

              {/* Register Button - Trial */}
              {siteConfig && siteConfig.allowDirectRegistration !== false && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-gradient-to-br from-violet-950/40 to-purple-950/30 border border-violet-500/20 rounded-2xl p-5 text-center mb-4">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                      className="inline-block mb-3"
                    >
                      <Gift className="w-8 h-8 text-violet-400" />
                    </motion.div>
                    <h3 className="text-lg font-black text-white mb-1">
                      جرّب مجاناً!
                    </h3>
                    <p className="text-xs text-slate-400 mb-1">
                      سجل واحصل على كود تجربة مجاني
                    </p>
                    {(siteConfig.trialDurationDays > 0 || siteConfig.maxTrialSessions > 0) && (
                      <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                        {siteConfig.trialDurationDays > 0 && (
                          <span className="flex items-center gap-1 text-violet-300">
                            <Clock className="w-3.5 h-3.5" />
                            {siteConfig.trialDurationDays} أيام
                          </span>
                        )}
                        {siteConfig.maxTrialSessions > 0 && (
                          <span className="flex items-center gap-1 text-violet-300">
                            <Gamepad2 className="w-3.5 h-3.5" />
                            {siteConfig.maxTrialSessions} {siteConfig.maxTrialSessions === 1 ? 'جولة' : 'جولات'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowRegistration(true)}
                    className="w-full h-13 bg-gradient-to-l from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold text-base shadow-lg shadow-violet-500/20"
                  >
                    <Sparkles className="w-4 h-4 ml-2" />
                    سجل الآن للحصول على تجربة مجانية
                  </Button>
                </motion.div>
              )}

              {/* Social Links */}
              {siteConfig && (siteConfig.telegramLink || siteConfig.whatsappLink) && (
                <>
                  {siteConfig.allowDirectRegistration === false && (
                    <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-2">📩</div>
                      <p className="text-sm font-bold text-blue-300 mb-1">
                        للحصول على كود الاشتراك
                      </p>
                      <p className="text-xs text-blue-400/80">
                        تواصل معنا عبر تيليجرام أو واتساب وسنرسل لك كود الاشتراك فوراً
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    {siteConfig.telegramLink && (
                      <a
                        href={normalizeTelegramLink(siteConfig.telegramLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors px-4 py-2.5 rounded-xl hover:bg-blue-950/30 border border-slate-800 hover:border-blue-500/30"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        <span>تيليجرام</span>
                      </a>
                    )}
                    {siteConfig.whatsappLink && (
                      <a
                        href={normalizeWhatsAppLink(siteConfig.whatsappLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors px-4 py-2.5 rounded-xl hover:bg-green-950/30 border border-slate-800 hover:border-green-500/30"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span>واتساب</span>
                      </a>
                    )}
                  </div>
                </>
              )}

              {/* Back to home */}
              <div className="text-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  العودة للرئيسية
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Registration Dialog */}
        <RegistrationDialog
          open={showRegistration}
          onOpenChange={setShowRegistration}
          onSuccess={handleRegistrationSuccess}
          subscriptionPrice={siteConfig?.subscriptionPrice || ''}
          contactMessage={siteConfig?.contactMessage || ''}
          trialDurationDays={siteConfig?.trialDurationDays || 0}
          maxTrialSessions={siteConfig?.maxTrialSessions || 0}
          trialGameSlugs={siteConfig?.trialGameSlugs || []}
        />
      </div>
    );
  }

  // ─── Denied → Unified subscribe screen for ALL denied reasons ───────

  if (guardState === 'denied') {
    // All denied reasons show the same unified "اشترك الآن" screen
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4" dir="rtl">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Card className="bg-slate-900/90 border-slate-800/60 backdrop-blur-sm shadow-2xl shadow-black/40">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Crown Icon */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 mx-auto mb-4 relative"
                >
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/30 to-yellow-500/10 animate-pulse" />
                  <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-amber-950/60 to-amber-900/30 border border-amber-500/30 flex items-center justify-center">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                      <Crown className="w-12 h-12 text-amber-400" />
                    </motion.span>
                  </div>
                  {/* Sparkles */}
                  <motion.div
                    className="absolute -top-1 -right-1 text-amber-300"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute -bottom-1 -left-1 text-yellow-300"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  >
                    ⭐
                  </motion.div>
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                  اشترك الآن
                </h2>
                <p className="text-sm text-slate-400">
                  احصل على وصول كامل لجميع الألعاب
                </p>
              </div>

              {/* Subscriber greeting */}
              {subscriberName && (
                <div className="text-center">
                  <p className="text-sm text-slate-300">
                    مرحباً، <span className="text-amber-400 font-bold">{subscriberName}</span>
                  </p>
                </div>
              )}

              {/* Stats Card (for trial users) */}
              {trialInfo && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <Gamepad2 className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                      <p className="text-lg font-black text-white">{trialInfo.sessionsUsed}/{trialInfo.maxSessions}</p>
                      <p className="text-[10px] text-slate-500">الجولات المستخدمة</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                      <p className="text-lg font-black text-white">{trialInfo.daysLeft > 0 ? trialInfo.daysLeft : 0}</p>
                      <p className="text-[10px] text-slate-500">أيام متبقية</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Subscribe CTA */}
              <div className="bg-gradient-to-br from-amber-950/40 to-amber-900/20 border border-amber-500/20 rounded-xl p-5 text-center space-y-4">
                <h3 className="text-base font-bold text-white">
                  اشترك الآن للعب كل الألعاب! 🎮
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  احصل على وصول كامل لجميع الألعاب مع اشتراك مميز. تواصل معنا عبر تيليجرام أو واتساب.
                </p>

                {/* Price */}
                {siteConfig?.subscriptionPrice && (
                  <p className="text-xl font-black text-amber-400">
                    {siteConfig.subscriptionPrice}
                  </p>
                )}

                {/* Contact buttons */}
                <div className="flex items-center justify-center gap-3">
                  {siteConfig?.telegramLink && (
                    <a
                      href={normalizeTelegramLink(siteConfig.telegramLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      تيليجرام
                    </a>
                  )}
                  {siteConfig?.whatsappLink && (
                    <a
                      href={normalizeWhatsAppLink(siteConfig.whatsappLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors shadow-lg shadow-green-500/20"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      واتساب
                    </a>
                  )}
                </div>
              </div>

              {/* Try Another Code */}
              <Button
                onClick={handleTryAnotherCode}
                variant="outline"
                className="w-full h-12 border-slate-700/60 text-slate-300 hover:bg-slate-800/60 hover:text-white font-bold text-sm"
              >
                أدخل كود اشتراك آخر
              </Button>

              {/* Social Links (secondary) */}
              {siteConfig && (siteConfig.telegramLink || siteConfig.whatsappLink) && (
                <div className="flex items-center justify-center gap-3">
                  {siteConfig.telegramLink && (
                    <a
                      href={normalizeTelegramLink(siteConfig.telegramLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-400 transition-colors px-3 py-2 rounded-lg hover:bg-blue-950/30"
                    >
                      تواصل عبر تيليجرام
                    </a>
                  )}
                  {siteConfig.whatsappLink && (
                    <a
                      href={normalizeWhatsAppLink(siteConfig.whatsappLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-500 hover:text-green-400 transition-colors px-3 py-2 rounded-lg hover:bg-green-950/30"
                    >
                      تواصل عبر واتساب
                    </a>
                  )}
                </div>
              )}

              {/* Back to home */}
              <div className="text-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  العودة للرئيسية
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
}
