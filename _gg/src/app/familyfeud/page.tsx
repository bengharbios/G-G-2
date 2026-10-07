'use client';

import { useSyncExternalStore, useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Home as HomeIcon,
  RotateCcw,
  Plus,
  Minus,
  Play,
  Crown,
  Home,
  Zap,
  Users,
  Info,
  ChevronLeft,
  CheckCircle,
  XCircle,
  SkipForward,
  Clock,
  Trophy,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

// ============================================================
// Hydration guard
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// Sound Effects Hook (Web Audio API)
// ============================================================
function useSoundEffects(soundEnabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(soundEnabled);
  useEffect(() => { enabledRef.current = soundEnabled; }, [soundEnabled]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playCorrect = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, [getCtx]);

  const playBuzz = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.setValueAtTime(70, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [getCtx]);

  const playStrike = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      // Second layer
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(150, ctx.currentTime + 0.05);
      osc2.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc2.start(ctx.currentTime + 0.05);
      osc2.stop(ctx.currentTime + 0.45);
    } catch {}
  }, [getCtx]);

  const playReveal = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [getCtx]);

  const playSteal = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      // Tension rising
      for (let i = 0; i < 4; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + i * 100, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.2);
      }
    } catch {}
  }, [getCtx]);

  const playWin = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {}
  }, [getCtx]);

  const playCountdown = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [getCtx]);

  const playTopAnswer = useCallback(() => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      // 3 quick ascending "ding" tones (bell celebration)
      const freqs = [1047, 1319, 1568]; // C6, E6, G6
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.4);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch {}
  }, [getCtx]);

  return { playCorrect, playBuzz, playStrike, playReveal, playSteal, playWin, playCountdown, playTopAnswer };
}

// ============================================================
// Types
// ============================================================
type GamePhase =
  | 'landing'
  | 'godfather_setup'
  | 'diwaniya_setup'
  | 'faceoff'
  | 'gameboard'
  | 'steal'
  | 'round_result'
  | 'fast_money_intro'
  | 'fast_money'
  | 'fast_money_results'
  | 'game_over';

interface Answer {
  text: string;
  points: number;
  revealed: boolean;
}

interface Question {
  question: string;
  answers: Answer[];
  category?: string;
  categoryIcon?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Helper to get difficulty based on total points
function getQuestionDifficulty(points: number): 'easy' | 'medium' | 'hard' {
  if (points <= 40) return 'easy';
  if (points <= 70) return 'medium';
  return 'hard';
}

// Get difficulty info for display
function getDifficultyInfo(diff: 'easy' | 'medium' | 'hard'): { icon: string; label: string; color: string } {
  switch (diff) {
    case 'easy': return { icon: '🟢', label: 'سهل', color: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300' };
    case 'medium': return { icon: '🟡', label: 'متوسط', color: 'bg-amber-500/20 border-amber-500/60 text-amber-300' };
    case 'hard': return { icon: '🔴', label: 'صعب', color: 'bg-rose-500/20 border-rose-500/60 text-rose-300' };
  }
}

// Helper to get category info for questions
function getQuestionCategory(q: Question): { icon: string; label: string } {
  if (q.category && q.categoryIcon) return { icon: q.categoryIcon, label: q.category };
  const text = q.question;
  if (text.includes("طعام") || text.includes("بيتزا") || text.includes("بسكويت") || text.includes("لزج") || text.includes("شراب") || text.includes("أكل") || text.includes("عشاء") || text.includes("قهوة") || text.includes("فطور"))
    return { icon: "🍕", label: "طعام" };
  if (text.includes("حيوان") || text.includes("كلب") || text.includes("قط"))
    return { icon: "🐾", label: "حيوانات" };
  if (text.includes("مكان") || text.includes("منزل") || text.includes("مرآب"))
    return { icon: "🏠", label: "منزل" };
  if (text.includes("مهنة") || text.includes("عمل"))
    return { icon: "👔", label: "مهن" };
  if (text.includes("رياض") || text.includes("كرة"))
    return { icon: "⚽", label: "رياضة" };
  if (text.includes("خاف") || text.includes("مخيف"))
    return { icon: "😱", label: "مخاوف" };
  if (text.includes("أطفال") || text.includes("طفل"))
    return { icon: "👶", label: "أطفال" };
  if (text.includes("لعب") || text.includes("ألعاب") || text.includes("حفل") || text.includes("ترفيه"))
    return { icon: "🎮", label: "ترفيه" };
  if (text.includes("سفر") || text.includes("طائرة") || text.includes("رحلة"))
    return { icon: "✈️", label: "سفر" };
  if (text.includes("نوم") || text.includes("ليل") || text.includes("صباح"))
    return { icon: "🌙", label: "حياة يومية" };
  return { icon: "❓", label: "عام" };
}

// ============================================================
// Questions Database (80+ Arabic Survey Questions)
// ============================================================
const ALL_QUESTIONS: Question[] = [
  // --- 65 questions from provided list ---
  {
    question: "اذكر شيئاً تأكله مع الخبز:",
    category: "طعام", categoryIcon: "🍞",
    answers: [
      { text: "فول مدمس", points: 25, revealed: false },
      { text: "جبنة", points: 24, revealed: false },
      { text: "زيت زيتون", points: 21, revealed: false },
      { text: "بيض", points: 16, revealed: false },
      { text: "طحينة", points: 14, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس غالباً في الليل:",
    category: "حياة يومية", categoryIcon: "🌙",
    answers: [
      { text: "قراءة كتاب", points: 26, revealed: false },
      { text: "استخدام الهاتف", points: 23, revealed: false },
      { text: "مشاهدة المسلسلات", points: 20, revealed: false },
      { text: "لعب ألعاب فيديو", points: 17, revealed: false },
      { text: "تأمل", points: 14, revealed: false },
    ],
  },
  {
    question: "اذكر أشياء ساخنة:",
    category: "طبيعة", categoryIcon: "🔥",
    answers: [
      { text: "نار", points: 26, revealed: false },
      { text: "قهوة", points: 24, revealed: false },
      { text: "شاي", points: 21, revealed: false },
      { text: "شمس", points: 16, revealed: false },
      { text: "صحراء", points: 13, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً مفتوناً به الكثير من الأطفال:",
    category: "ترفيه", categoryIcon: "🎮",
    answers: [
      { text: "ألعاب فيديو/كمبيوتر", points: 41, revealed: false },
      { text: "حلويات/وجبات سريعة", points: 29, revealed: false },
      { text: "تلفزيون", points: 20, revealed: false },
      { text: "موسيقى", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخاف منه بعض الناس ركوبه:",
    category: "سفر", categoryIcon: "✈️",
    answers: [
      { text: "طائرة", points: 44, revealed: false },
      { text: "دراجة نارية", points: 21, revealed: false },
      { text: "أفعوانية/لعبة ملاهي", points: 16, revealed: false },
      { text: "قارب", points: 4, revealed: false },
      { text: "حصان", points: 4, revealed: false },
      { text: "مصعد", points: 3, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً ذا طاقة عالية يذهب إليه الناس:",
    category: "ترفيه", categoryIcon: "🎭",
    answers: [
      { text: "ملعب رياضي", points: 28, revealed: false },
      { text: "حفل موسيقي", points: 27, revealed: false },
      { text: "حفل زفاف", points: 15, revealed: false },
      { text: "سينما", points: 8, revealed: false },
      { text: "مدينة ملاهي", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً شائعاً يخاف منه الناس:",
    category: "مخاوف", categoryIcon: "😱",
    answers: [
      { text: "الارتفاعات", points: 50, revealed: false },
      { text: "العناكب", points: 25, revealed: false },
      { text: "التحدث أمام الجمهور", points: 15, revealed: false },
      { text: "الطيران", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفقده الرجال طوال الوقت:",
    category: "حياة يومية", categoryIcon: "🔑",
    answers: [
      { text: "المفاتيح", points: 50, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "المحفظة", points: 15, revealed: false },
      { text: "النظارات الشمسية", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر حيواناً له رقبة طويلة:",
    category: "حيوانات", categoryIcon: "🦒",
    answers: [
      { text: "زرافة", points: 78, revealed: false },
      { text: "نعامة", points: 10, revealed: false },
      { text: "بجعة", points: 3, revealed: false },
      { text: "كركي", points: 3, revealed: false },
      { text: "بطة", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تجد فيه النساء مفاتيحهن:",
    category: "منزل", categoryIcon: "🏠",
    answers: [
      { text: "في المنزل", points: 55, revealed: false },
      { text: "في المول", points: 17, revealed: false },
      { text: "في حقيبة اليد", points: 10, revealed: false },
      { text: "في السيارة", points: 7, revealed: false },
      { text: "في المكتب", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تقابل فيه الناس شريك حياتهم:",
    category: "علاقات", categoryIcon: "💕",
    answers: [
      { text: "المدرسة/الجامعة", points: 56, revealed: false },
      { text: "الكنيسة/المسجد", points: 26, revealed: false },
      { text: "مناسبات عائلية", points: 9, revealed: false },
      { text: "طبيب/طبيبة أسنان", points: 4, revealed: false },
      { text: "العمل", points: 2, revealed: false },
    ],
  },
  {
    question: "إذا كان عليك إنفاق ألف دولار في ساعة، ماذا تشتري؟",
    category: "تسوق", categoryIcon: "🛒",
    answers: [
      { text: "ملابس", points: 22, revealed: false },
      { text: "إلكترونيات", points: 20, revealed: false },
      { text: "هاتف", points: 18, revealed: false },
      { text: "ذهب/مجوهرات", points: 15, revealed: false },
      { text: "طعام", points: 12, revealed: false },
    ],
  },
  {
    question: "ما الذي يضعه الناس في البيتزا ولا يجب أن يكون هناك؟",
    category: "طعام", categoryIcon: "🍕",
    answers: [
      { text: "أناناس", points: 44, revealed: false },
      { text: "سردين/سمك", points: 21, revealed: false },
      { text: "باذنجان", points: 2, revealed: false },
    ],
  },
  {
    question: "ما هو الشيء الذي يجب أن يفعله الناس بعد الأكل؟",
    category: "حياة يومية", categoryIcon: "🪥",
    answers: [
      { text: "غسل الأسنان", points: 26, revealed: false },
      { text: "تمشيط الشعر", points: 23, revealed: false },
      { text: "تسريح الشعر", points: 19, revealed: false },
      { text: "تفقد الملابس", points: 17, revealed: false },
      { text: "التدرب على الرقص", points: 15, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً يختبئ فيه الوحش عند الأطفال:",
    category: "أطفال", categoryIcon: "👹",
    answers: [
      { text: "تحت السرير", points: 45, revealed: false },
      { text: "داخل الخزانة", points: 36, revealed: false },
      { text: "خلف الباب", points: 7, revealed: false },
      { text: "الخزانة/الملزقة", points: 2, revealed: false },
      { text: "تحت الدرج", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفقدره عندما تنقطع الكهرباء:",
    category: "منزل", categoryIcon: "💡",
    answers: [
      { text: "التلفزيون", points: 50, revealed: false },
      { text: "الواي فاي/الإنترنت", points: 23, revealed: false },
      { text: "المكيف", points: 13, revealed: false },
      { text: "الإضاءة", points: 4, revealed: false },
    ],
  },
  {
    question: "اذكر مناسبة يرتدي فيها الناس ملابس خاصة:",
    category: "مناسبات", categoryIcon: "👗",
    answers: [
      { text: "التخرج", points: 32, revealed: false },
      { text: "الزفاف", points: 26, revealed: false },
      { text: "العطلات", points: 20, revealed: false },
      { text: "حفل ميلاد", points: 14, revealed: false },
      { text: "حفل تخريج جامعي", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي يخيف الناس في الأفعوانية؟",
    category: "مخاوف", categoryIcon: "🎢",
    answers: [
      { text: "السرعة", points: 77, revealed: false },
      { text: "الارتفاع", points: 8, revealed: false },
      { text: "السقوط", points: 3, revealed: false },
      { text: "الزلاقة", points: 3, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تفعله في الصباح؟",
    category: "حياة يومية", categoryIcon: "☀️",
    answers: [
      { text: "الهاتف", points: 59, revealed: false },
      { text: "طعام/شراب", points: 12, revealed: false },
      { text: "قهوة", points: 12, revealed: false },
      { text: "طفل يبكي", points: 11, revealed: false },
      { text: "إفطار", points: 2, revealed: false },
    ],
  },
  {
    question: "اذكر آلة موسيقية يسهل العزف عليها:",
    category: "موسيقى", categoryIcon: "🎵",
    answers: [
      { text: "جيتار", points: 69, revealed: false },
      { text: "الدف", points: 21, revealed: false },
      { text: "قيثارة", points: 4, revealed: false },
      { text: "بيانو", points: 2, revealed: false },
    ],
  },
  {
    question: "ما هو الشيء الذي يكره الناس تنظيفه؟",
    answers: [
      { text: "الحمام", points: 45, revealed: false },
      { text: "غسل الأطباق", points: 25, revealed: false },
      { text: "تنظيف الأرضية", points: 20, revealed: false },
      { text: "الغسيل", points: 10, revealed: false },
    ],
  },
  {
    question: "ما نوع المشروبات التي تسبب المتاعب؟",
    answers: [
      { text: "قهوة", points: 37, revealed: false },
      { text: "مشروبات غازية", points: 28, revealed: false },
      { text: "شاي", points: 17, revealed: false },
      { text: "مشاكل", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر مهنة تبدأ بحرف السين:",
    answers: [
      { text: "سائق", points: 40, revealed: false },
      { text: "سكرتير", points: 20, revealed: false },
      { text: "ساعي بريد", points: 15, revealed: false },
      { text: "ساحر", points: 15, revealed: false },
      { text: "سباك", points: 10, revealed: false },
    ],
  },
  {
    question: "إذا جلست بجانب شخص كريه الرائحة، ماذا تفعل؟",
    answers: [
      { text: "تبديل المقعد", points: 39, revealed: false },
      { text: "تغطية الأنف", points: 24, revealed: false },
      { text: "إدارة الرأس", points: 6, revealed: false },
      { text: "فتح النافذة", points: 6, revealed: false },
    ],
  },
  {
    question: "اذكر نوع بيت مخيف:",
    answers: [
      { text: "بيت مسكون", points: 27, revealed: false },
      { text: "بيت الكلب", points: 8, revealed: false },
      { text: "بيت زجاجي", points: 6, revealed: false },
      { text: "بيت مهجور", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تحب فيه النوم:",
    answers: [
      { text: "السرير", points: 46, revealed: false },
      { text: "غرفة المعيشة", points: 27, revealed: false },
      { text: "السينما", points: 9, revealed: false },
      { text: "السيارة", points: 4, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تنظفه قبل وصول الضيوف؟",
    answers: [
      { text: "الحمام", points: 59, revealed: false },
      { text: "المطبخ", points: 18, revealed: false },
      { text: "الأرضيات", points: 11, revealed: false },
      { text: "غرفة المعيشة", points: 3, revealed: false },
    ],
  },
  {
    question: "اذكر وحشاً أو كائناً مخيفاً من الأساطير:",
    answers: [
      { text: "الغول", points: 35, revealed: false },
      { text: "العنقاء", points: 25, revealed: false },
      { text: "الجن", points: 20, revealed: false },
      { text: "الغيلان", points: 12, revealed: false },
      { text: "العنكبوت العملاق", points: 8, revealed: false },
    ],
  },
  {
    question: "ما أكثر عذر شائع للتأخر عن العمل؟",
    answers: [
      { text: "نمت متأخراً", points: 52, revealed: false },
      { text: "زحمة سير", points: 25, revealed: false },
      { text: "مشكلة بالسيارة", points: 17, revealed: false },
      { text: "مريض", points: 6, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء تحبه في الحفلات؟",
    answers: [
      { text: "الرقص", points: 45, revealed: false },
      { text: "التحدث مع الناس", points: 21, revealed: false },
      { text: "أكل الحلويات", points: 18, revealed: false },
      { text: "الأكل", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شخصية كرتونية يعرفها الجميع:",
    answers: [
      { text: "ميكي ماوس", points: 30, revealed: false },
      { text: "سبونج بوب", points: 25, revealed: false },
      { text: "توم وجيري", points: 20, revealed: false },
      { text: "بن تن", points: 15, revealed: false },
      { text: "باباي", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي كنت تفعله كل يوم في الروضة و تتمنى تفعله الآن؟",
    answers: [
      { text: "أخذ قيلولة", points: 64, revealed: false },
      { text: "اللعب بالألعاب", points: 19, revealed: false },
      { text: "التلوين/الرسم", points: 12, revealed: false },
      { text: "وجبات مجانية", points: 4, revealed: false },
    ],
  },
  {
    question: "اذكر بعض أبطال مارفل (الانتقامون):",
    answers: [
      { text: "كابتن أمريكا", points: 22, revealed: false },
      { text: "آيرون مان", points: 22, revealed: false },
      { text: "الرجل الأسود", points: 20, revealed: false },
      { text: "الهالك", points: 15, revealed: false },
      { text: "ثور", points: 15, revealed: false },
    ],
  },
  {
    question: "لماذا قد يركب شخص الدراجة للعمل؟",
    answers: [
      { text: "ليس لديه سيارة", points: 46, revealed: false },
      { text: "للرياضة", points: 23, revealed: false },
      { text: "لتوفير البنزين", points: 20, revealed: false },
      { text: "للبيئة", points: 7, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة تقال للرجل الكبير في السن:",
    answers: [
      { text: "عم", points: 35, revealed: false },
      { text: "حج", points: 25, revealed: false },
      { text: "أبو فلان", points: 20, revealed: false },
      { text: "الشيخ", points: 12, revealed: false },
      { text: "الخال", points: 8, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يفقده الرجال في البيت؟",
    answers: [
      { text: "ريموت التلفزيون", points: 34, revealed: false },
      { text: "شاحن الهاتف", points: 22, revealed: false },
      { text: "جوارب", points: 18, revealed: false },
      { text: "مفاتيح", points: 14, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يفتقده الناس عن طفولتهم؟",
    answers: [
      { text: "ملاعب/أرجوحة", points: 28, revealed: false },
      { text: "كرتون", points: 24, revealed: false },
      { text: "حلوى", points: 20, revealed: false },
      { text: "ركوب الدراجة", points: 16, revealed: false },
      { text: "سهرات مع الأصدقاء", points: 12, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يضايقك في تنظيف المنزل؟",
    answers: [
      { text: "سقوط شيء", points: 34, revealed: false },
      { text: "عودة الغبار", points: 22, revealed: false },
      { text: "ظهور آثار أقدام", points: 18, revealed: false },
      { text: "تساقط شعر الكلب", points: 16, revealed: false },
    ],
  },
  {
    question: "وجبة خفيفة يحبها الأطفال:",
    answers: [
      { text: "رقائق بطاطس", points: 40, revealed: false },
      { text: "تفاح", points: 22, revealed: false },
      { text: "حبوب إفطار", points: 16, revealed: false },
      { text: "فشار", points: 12, revealed: false },
      { text: "جزر", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل شخص عندما يتحدث كثيراً ولا يعرف كيف يوقف؟",
    answers: [
      { text: "يقول 'المهم...'", points: 30, revealed: false },
      { text: "يضحك بشكل محرج", points: 24, revealed: false },
      { text: "يسأل سؤال فجأة", points: 20, revealed: false },
      { text: "ينظر للساعة", points: 16, revealed: false },
    ],
  },
  {
    question: "ما عادة سيئة يعاني منها الكثيرون؟",
    answers: [
      { text: "التدخين", points: 45, revealed: false },
      { text: "قضم الأظافر", points: 20, revealed: false },
      { text: "الإفراط في الأكل", points: 15, revealed: false },
      { text: "السب", points: 10, revealed: false },
      { text: "الكسل", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء الذي لا يملك الناس ما يكفي منه؟",
    answers: [
      { text: "المال", points: 39, revealed: false },
      { text: "الوقت", points: 27, revealed: false },
      { text: "النوم", points: 17, revealed: false },
      { text: "الطاقة", points: 10, revealed: false },
      { text: "أيام إجازة", points: 7, revealed: false },
    ],
  },
  {
    question: "ما الذي يأخذه الناس معهم في السفر؟",
    answers: [
      { text: "حقائب سفر", points: 29, revealed: false },
      { text: "ملابس/أحذية", points: 28, revealed: false },
      { text: "مال/بطاقة ائتمان", points: 20, revealed: false },
      { text: "أدوية", points: 9, revealed: false },
      { text: "كاميرا", points: 6, revealed: false },
    ],
  },
  {
    question: "ما أكثر ما يزعجك بالصور؟",
    answers: [
      { text: "شعرك", points: 28, revealed: false },
      { text: "الخلفية الفوضوية", points: 24, revealed: false },
      { text: "شيء في أسنانك", points: 20, revealed: false },
      { text: "شكلك المتعب", points: 16, revealed: false },
      { text: "الإضاءة الغريبة", points: 12, revealed: false },
    ],
  },
  {
    question: "ماذا يقول المصور عادة؟",
    answers: [
      { text: "الجميع يبتسموا!", points: 30, revealed: false },
      { text: "ليش تومض عيونك؟", points: 25, revealed: false },
      { text: "اثبت!", points: 20, revealed: false },
      { text: "ما تسوي وجه غريب!", points: 15, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تفعله عندما تضيع هاتفك؟",
    answers: [
      { text: "اتصل به", points: 34, revealed: false },
      { text: "تفقد جيوبك", points: 24, revealed: false },
      { text: "تتبع خطواتك", points: 20, revealed: false },
      { text: "استخدم تطبيق البحث", points: 14, revealed: false },
    ],
  },
  {
    question: "ما أشياء عديمة الفائدة تجدها في كل بيت؟",
    answers: [
      { text: "بطاريات", points: 28, revealed: false },
      { text: "شواحن قديمة", points: 22, revealed: false },
      { text: "شريط لاصق", points: 18, revealed: false },
      { text: "مفاتيح قديمة", points: 16, revealed: false },
      { text: "أكياس بلاستيك", points: 16, revealed: false },
    ],
  },
  // --- Additional 30+ translated questions ---
  {
    question: "اذكر رياضة تلعب بكرة:",
    answers: [
      { text: "كرة القدم", points: 45, revealed: false },
      { text: "كرة السلة", points: 25, revealed: false },
      { text: "التنس", points: 15, revealed: false },
      { text: "كرة الطائرة", points: 10, revealed: false },
      { text: "كرة اليد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشتريه يأتي في علبة محكمة الإغلاق:",
    answers: [
      { text: "المشروبات الغازية", points: 35, revealed: false },
      { text: "الحساء", points: 25, revealed: false },
      { text: "الفاصوليا", points: 20, revealed: false },
      { text: "التونة", points: 15, revealed: false },
      { text: "الفواكه المعلبة", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً يجعل الناس يسافرون لدبي:",
    answers: [
      { text: "التسوق", points: 30, revealed: false },
      { text: "برج خليفة", points: 25, revealed: false },
      { text: "الأماكن الترفيهية", points: 20, revealed: false },
      { text: "الشواطئ", points: 15, revealed: false },
      { text: "العمل", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً قد تجده في المرآب:",
    answers: [
      { text: "سيارة", points: 40, revealed: false },
      { text: "أدوات", points: 25, revealed: false },
      { text: "دراجة", points: 15, revealed: false },
      { text: "صناديق قديمة", points: 12, revealed: false },
      { text: "مجرفة", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة تعني 'سريع':",
    answers: [
      { text: "سريع", points: 45, revealed: false },
      { text: "عاجل", points: 20, revealed: false },
      { text: "سريع البرق", points: 15, revealed: false },
      { text: "فوري", points: 12, revealed: false },
      { text: "خاطف", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر بطل خارق:",
    answers: [
      { text: "سبايدرمان", points: 30, revealed: false },
      { text: "باتمان", points: 25, revealed: false },
      { text: "سوبرمان", points: 20, revealed: false },
      { text: "آيرون مان", points: 15, revealed: false },
      { text: "كابتن أمريكا", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفهمه الكلب:",
    answers: [
      { text: "اسمه", points: 40, revealed: false },
      { text: "لا", points: 25, revealed: false },
      { text: "تعال", points: 20, revealed: false },
      { text: "اجلس", points: 10, revealed: false },
      { text: "لغة الجسد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يحب الأطفال القفز عليه:",
    answers: [
      { text: "سرير", points: 35, revealed: false },
      { text: "مخدة", points: 25, revealed: false },
      { text: "ترامبولين", points: 20, revealed: false },
      { text: "أرجوحة", points: 12, revealed: false },
      { text: "ماء", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشربه عندما تعطش:",
    answers: [
      { text: "ماء", points: 55, revealed: false },
      { text: "كولا", points: 20, revealed: false },
      { text: "عصير", points: 15, revealed: false },
      { text: "شاي", points: 5, revealed: false },
      { text: "حليب", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر عطلة يتناول الناس فيها الكثير من الطعام:",
    answers: [
      { text: "عيد الفطر", points: 40, revealed: false },
      { text: "عيد الأضحى", points: 30, revealed: false },
      { text: "رمضان", points: 15, revealed: false },
      { text: "العرس", points: 10, revealed: false },
      { text: "عيد الميلاد", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس في أول لقاء:",
    answers: [
      { text: "السينما", points: 30, revealed: false },
      { text: "العشاء", points: 25, revealed: false },
      { text: "المشي", points: 20, revealed: false },
      { text: "التحدث", points: 15, revealed: false },
      { text: "القهوة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر دولة مشهورة بطعامها:",
    answers: [
      { text: "إيطاليا", points: 35, revealed: false },
      { text: "فرنسا", points: 25, revealed: false },
      { text: "الهند", points: 15, revealed: false },
      { text: "اليابان", points: 15, revealed: false },
      { text: "المكسيك", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يصعب فتحه:",
    answers: [
      { text: "علبة مخلل", points: 30, revealed: false },
      { text: "برطمان مربى", points: 25, revealed: false },
      { text: "قفل", points: 20, revealed: false },
      { text: "حزمة بلاستيك", points: 15, revealed: false },
      { text: "صدف البحر", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً لا يجب فعله أثناء القيادة:",
    answers: [
      { text: "استخدام الهاتف", points: 40, revealed: false },
      { text: "النوم", points: 20, revealed: false },
      { text: "الأكل", points: 15, revealed: false },
      { text: "موسيقى صاخبة", points: 15, revealed: false },
      { text: "التحدث كثيراً", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً قد يؤدي للتأخر:",
    answers: [
      { text: "الزحام", points: 30, revealed: false },
      { text: "النوم", points: 25, revealed: false },
      { text: "مشكلة بالسيارة", points: 20, revealed: false },
      { text: "الطقس", points: 15, revealed: false },
      { text: "نسيان شيء", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يجعل الطفل يتوقف عن البكاء:",
    answers: [
      { text: "حليب", points: 35, revealed: false },
      { text: "حضن", points: 25, revealed: false },
      { text: "لعبة", points: 20, revealed: false },
      { text: "أغنية", points: 12, revealed: false },
      { text: "تهدئة", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً تذهب إليه في يوم حار:",
    answers: [
      { text: "الشاطئ", points: 35, revealed: false },
      { text: "المسبح", points: 30, revealed: false },
      { text: "مركز تسوق", points: 15, revealed: false },
      { text: "مكيف", points: 12, revealed: false },
      { text: "مقهى بارد", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً قد يصادره المعلم:",
    answers: [
      { text: "الهاتف", points: 45, revealed: false },
      { text: "ألعاب", points: 20, revealed: false },
      { text: "مجلة", points: 15, revealed: false },
      { text: "سماعات", points: 12, revealed: false },
      { text: "طعام", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخاف منه الناس في الظلام:",
    answers: [
      { text: "العفاريت", points: 30, revealed: false },
      { text: "اللصوص", points: 25, revealed: false },
      { text: "الأصوات", points: 20, revealed: false },
      { text: "العناكب", points: 15, revealed: false },
      { text: "القطط السوداء", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً ترتبط به مصاصي الدماء:",
    answers: [
      { text: "الثوم", points: 30, revealed: false },
      { text: "الصليب الخشبي", points: 25, revealed: false },
      { text: "الدم", points: 20, revealed: false },
      { text: "الأنياب", points: 15, revealed: false },
      { text: "الخفاش", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر مهنة يعرفها الجميع:",
    answers: [
      { text: "طبيب", points: 35, revealed: false },
      { text: "معلم", points: 25, revealed: false },
      { text: "مهندس", points: 20, revealed: false },
      { text: "محامي", points: 12, revealed: false },
      { text: "شرطي", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر طعاماً لزجاً:",
    answers: [
      { text: "عسل", points: 35, revealed: false },
      { text: "فول سوداني", points: 25, revealed: false },
      { text: "كراميل", points: 20, revealed: false },
      { text: "تمر", points: 12, revealed: false },
      { text: "جلي", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله كل صباح:",
    answers: [
      { text: "الاستيقاظ", points: 30, revealed: false },
      { text: "شرب قهوة", points: 25, revealed: false },
      { text: "الاستحمام", points: 20, revealed: false },
      { text: "الإفطار", points: 15, revealed: false },
      { text: "فحص الهاتف", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر لوناً لا تود رؤيته في طعامك:",
    answers: [
      { text: "أخضر", points: 35, revealed: false },
      { text: "أسود", points: 25, revealed: false },
      { text: "أزرق", points: 20, revealed: false },
      { text: "رمادي", points: 12, revealed: false },
      { text: "بني غامق", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يستخدم الكهرباء:",
    answers: [
      { text: "التلفزيون", points: 25, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "الثلاجة", points: 20, revealed: false },
      { text: "المكيف", points: 15, revealed: false },
      { text: "الغسالة", points: 10, revealed: false },
      { text: "المصباح", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً للاتصال بالشرطة:",
    answers: [
      { text: "سرقة", points: 35, revealed: false },
      { text: "حادث", points: 25, revealed: false },
      { text: "شجار", points: 20, revealed: false },
      { text: "ضجيج", points: 12, revealed: false },
      { text: "شكوى", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر واجباً منزلياً لا يحبه أحد:",
    answers: [
      { text: "غسل الأطباق", points: 35, revealed: false },
      { text: "تنظيف الحمام", points: 30, revealed: false },
      { text: "كنس الأرض", points: 15, revealed: false },
      { text: "تعليق الغسيل", points: 10, revealed: false },
      { text: "تنظيف الفرن", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الذي يضعه الناس على البيتزا؟",
    answers: [
      { text: "بيبروني", points: 50, revealed: false },
      { text: "فطر", points: 20, revealed: false },
      { text: "سجق", points: 15, revealed: false },
      { text: "فلفل أخضر", points: 15, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الناس عندما يبقون في المنزل؟",
    answers: [
      { text: "مشاهدة التلفزيون", points: 40, revealed: false },
      { text: "لعب ألعاب فيديو", points: 30, revealed: false },
      { text: "قراءة كتاب", points: 15, revealed: false },
      { text: "أخذ قيلولة", points: 15, revealed: false },
    ],
  },
  {
    question: "إذا كنت تنام وسمعت صوتاً في الليل، ما هو؟",
    answers: [
      { text: "خطوات", points: 34, revealed: false },
      { text: "صرير الباب", points: 28, revealed: false },
      { text: "كسر زجاج", points: 18, revealed: false },
      { text: "نباح كلب", points: 12, revealed: false },
      { text: "صوت مجهول", points: 8, revealed: false },
    ],
  },
  // === Additional 15 questions ===
  {
    question: "ما أكثر شي يخليك تضحك؟",
    category: "ترفيه", categoryIcon: "😂",
    answers: [
      { text: "مقاطع فيديوهات", points: 30, revealed: false },
      { text: "نكتة صديق", points: 25, revealed: false },
      { text: "أطفال يلعبون", points: 20, revealed: false },
      { text: "وقوع شخص", points: 15, revealed: false },
      { text: "تصرف غريب", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر شيء يزعج الناس؟",
    category: "حياة يومية", categoryIcon: "😤",
    answers: [
      { text: "الدوام", points: 25, revealed: false },
      { text: "زحمة السير", points: 22, revealed: false },
      { text: "الأطفال يبكون", points: 18, revealed: false },
      { text: "الانتظار في الطابور", points: 15, revealed: false },
      { text: "البرود", points: 12, revealed: false },
      { text: "صوت المنبه", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله في الحمام:",
    category: "منزل", categoryIcon: "🚿",
    answers: [
      { text: "الاستحمام", points: 40, revealed: false },
      { text: "غسل الأسنان", points: 22, revealed: false },
      { text: "غسل الشعر", points: 15, revealed: false },
      { text: "النظر في المرآة", points: 12, revealed: false },
      { text: "التغني", points: 11, revealed: false },
    ],
  },
  {
    question: "ما أول شيء تشوفه الصباح؟",
    category: "حياة يومية", categoryIcon: "☀️",
    answers: [
      { text: "الموبايل", points: 45, revealed: false },
      { text: "الساعة", points: 20, revealed: false },
      { text: "العائلة", points: 15, revealed: false },
      { text: "النافذة", points: 10, revealed: false },
      { text: "السقف", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر أكلة يحبها الأطفال؟",
    category: "طعام", categoryIcon: "🍕",
    answers: [
      { text: "البيتزا", points: 35, revealed: false },
      { text: "البرجر", points: 25, revealed: false },
      { text: "النودلز", points: 18, revealed: false },
      { text: "الدجاج المقلي", points: 12, revealed: false },
      { text: "الآيس كريم", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أغنية يحفظها الكل؟",
    category: "ترفيه", categoryIcon: "🎵",
    answers: [
      { text: "أغنية طلال مداح", points: 20, revealed: false },
      { text: "أغنية عيد ميلاد", points: 18, revealed: false },
      { text: "أنشودة بلادي", points: 15, revealed: false },
      { text: "أغنية الاطفال", points: 12, revealed: false },
      { text: "أغنية رياضية", points: 10, revealed: false },
      { text: "أغنية تخرج", points: 8, revealed: false },
    ],
  },
  {
    question: "ما أكثر لعبة يحبها اللي يشاهدون الكورة؟",
    category: "رياضة", categoryIcon: "⚽",
    answers: [
      { text: "فيفا", points: 35, revealed: false },
      { text: "ببجي", points: 25, revealed: false },
      { text: "كاونتر سترايك", points: 15, revealed: false },
      { text: "كرة القدم", points: 15, revealed: false },
      { text: "كول أوف ديوتي", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيء تقدر تسويه بيد واحدة:",
    answers: [
      { text: "تأكل", points: 30, revealed: false },
      { text: "تكتب رسالة", points: 25, revealed: false },
      { text: "تغسل وجهك", points: 20, revealed: false },
      { text: "تلبس ثياب", points: 15, revealed: false },
      { text: "تمشط شعرك", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر مكان ينام فيه الناس؟",
    category: "منزل", categoryIcon: "🛏️",
    answers: [
      { text: "السرير", points: 50, revealed: false },
      { text: "الأريكة", points: 20, revealed: false },
      { text: "السجاد", points: 15, revealed: false },
      { text: "السيارة", points: 10, revealed: false },
      { text: "العمل", points: 5, revealed: false },
    ],
  },
  {
    question: "ما شيء لونه أخضر ويحبه الناس؟",
    category: "طبيعة", categoryIcon: "🌿",
    answers: [
      { text: "النباتات", points: 35, revealed: false },
      { text: "الطبيعة", points: 25, revealed: false },
      { text: "الأعشاب", points: 20, revealed: false },
      { text: "الأخضر", points: 10, revealed: false },
      { text: "البطيخ", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر مشروب يطلبه الناس؟",
    category: "طعام", categoryIcon: "🥤",
    answers: [
      { text: "الماء", points: 30, revealed: false },
      { text: "القهوة", points: 25, revealed: false },
      { text: "الشاي", points: 20, revealed: false },
      { text: "العصير", points: 15, revealed: false },
      { text: "المشروب الغازي", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر لعبة يلعبها الأطفال؟",
    category: "ترفيه", categoryIcon: "🎮",
    answers: [
      { text: "الاختباء", points: 25, revealed: false },
      { text: "كرة القدم", points: 20, revealed: false },
      { text: "الدمبل", points: 15, revealed: false },
      { text: "ألعاب الموبايل", points: 15, revealed: false },
      { text: "الرسم", points: 12, revealed: false },
      { text: "الحب", points: 8, revealed: false },
    ],
  },
  {
    question: "ما شيء تخلعه في جيبك دائما؟",
    category: "حياة يومية", categoryIcon: "👔",
    answers: [
      { text: "الموبايل", points: 50, revealed: false },
      { text: "المحفظة", points: 20, revealed: false },
      { text: "المفاتيح", points: 15, revealed: false },
      { text: "نقود", points: 10, revealed: false },
      { text: "منديل", points: 5, revealed: false },
    ],
  },
  {
    question: "ما شيء يخليك يومك أفضل؟",
    category: "حياة يومية", categoryIcon: "✨",
    answers: [
      { text: "النوم الكافي", points: 30, revealed: false },
      { text: "لقاء الأصدقاء", points: 25, revealed: false },
      { text: "الأكل الجيد", points: 20, revealed: false },
      { text: "مشاهدة فيديو مضحك", points: 15, revealed: false },
      { text: "الرياضة", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر تطبيق يستخدمه الناس؟",
    category: "تقنية", categoryIcon: "📱",
    answers: [
      { text: "واتساب", points: 45, revealed: false },
      { text: "تيك توك", points: 25, revealed: false },
      { text: "انستقرام", points: 15, revealed: false },
      { text: "سناب شات", points: 10, revealed: false },
      { text: "تويتر", points: 5, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً لا تستطيع العيش بدونه:",
    category: "حياة يومية", categoryIcon: "❤️",
    answers: [
      { text: "الموبايل", points: 40, revealed: false },
      { text: "العائلة", points: 30, revealed: false },
      { text: "الماء", points: 15, revealed: false },
      { text: "الأكل", points: 10, revealed: false },
      { text: "النوم", points: 5, revealed: false },
    ],
  },
  // --- 25 new culturally relevant Arabic questions (Task 15-a) ---
  {
    question: "اذكر تطبيقاً لا تستطيع العيش بدونه:",
    category: "تكنولوجيا", categoryIcon: "📱",
    answers: [
      { text: "واتساب", points: 38, revealed: false },
      { text: "تيك توك", points: 22, revealed: false },
      { text: "انستقرام", points: 18, revealed: false },
      { text: "يوتيوب", points: 12, revealed: false },
      { text: "سناب شات", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفعله الناس في المطعم:",
    category: "حياة يومية", categoryIcon: "🍽️",
    answers: [
      { text: "يطلب قهوة", points: 28, revealed: false },
      { text: "يصور الطعام", points: 25, revealed: false },
      { text: "ينتظر طاولة", points: 20, revealed: false },
      { text: "يحسب الحسبة", points: 15, revealed: false },
      { text: "يتكلم بالموبايل", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً لعدم الذهاب للعمل:",
    category: "عمل", categoryIcon: "💼",
    answers: [
      { text: "مريض", points: 32, revealed: false },
      { text: "تعب", points: 25, revealed: false },
      { text: "زحمة", points: 18, revealed: false },
      { text: "نسيان المنبه", points: 15, revealed: false },
      { text: "اجازة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر نوعاً من أنواع الشوكولاتة:",
    category: "طعام", categoryIcon: "🍫",
    answers: [
      { text: "جالاكسي", points: 28, revealed: false },
      { text: "كيت كات", points: 25, revealed: false },
      { text: "تويكس", points: 20, revealed: false },
      { text: "سنكرز", points: 15, revealed: false },
      { text: "مارس", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر مكاناً يتجمع فيه الشباب:",
    category: "حياة يومية", categoryIcon: "👥",
    answers: [
      { text: "المول", points: 30, revealed: false },
      { text: "الكافيه", points: 28, revealed: false },
      { text: "الملعب", points: 18, revealed: false },
      { text: "الشاطئ", points: 14, revealed: false },
      { text: "الحديقة", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يخبئه الأطفال عن والديهم:",
    category: "عائلة", categoryIcon: "👶",
    answers: [
      { text: "الحلوى", points: 35, revealed: false },
      { text: "الهاتف", points: 25, revealed: false },
      { text: "الألعاب", points: 20, revealed: false },
      { text: "علامات المدرسة", points: 20, revealed: false },
    ],
  },
  {
    question: "اذكر لعبة كان يلعبها آباؤنا:",
    category: "ترفيه", categoryIcon: "🎮",
    answers: [
      { text: "الطابة", points: 30, revealed: false },
      { text: "الحجلة", points: 25, revealed: false },
      { text: "الدحية", points: 20, revealed: false },
      { text: "كرة القدم", points: 15, revealed: false },
      { text: "السيجا", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تشتريه من السوق:",
    category: "حياة يومية", categoryIcon: "🛒",
    answers: [
      { text: "خضار", points: 28, revealed: false },
      { text: "فواكه", points: 25, revealed: false },
      { text: "لحم", points: 20, revealed: false },
      { text: "سمك", points: 15, revealed: false },
      { text: "خبز", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر نوعاً من أنواع الرز:",
    category: "طعام", categoryIcon: "🍚",
    answers: [
      { text: "بسمتي", points: 30, revealed: false },
      { text: "مشعري", points: 25, revealed: false },
      { text: "كابوري", points: 18, revealed: false },
      { text: "بني", points: 15, revealed: false },
      { text: "أبيض", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر مشروباً يحبه الخليجيون:",
    category: "طعام", categoryIcon: "☕",
    answers: [
      { text: "الشاي", points: 30, revealed: false },
      { text: "القهوة", points: 25, revealed: false },
      { text: "الكرك", points: 20, revealed: false },
      { text: "اللبن", points: 15, revealed: false },
      { text: "العصير", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تضعه في السيارة:",
    category: "حياة يومية", categoryIcon: "🚗",
    answers: [
      { text: "عطر", points: 28, revealed: false },
      { text: "ماء", points: 22, revealed: false },
      { text: "نظارات شمسية", points: 18, revealed: false },
      { text: "جوال", points: 17, revealed: false },
      { text: "شاحن", points: 15, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً لسرعة غضب الشخص:",
    category: "علاقات", categoryIcon: "😤",
    answers: [
      { text: "جوع", points: 30, revealed: false },
      { text: "تعب", points: 22, revealed: false },
      { text: "مضايقة", points: 20, revealed: false },
      { text: "حرارة الجو", points: 16, revealed: false },
      { text: "ضجيج", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر ماركة هاتف مشهورة:",
    category: "تكنولوجيا", categoryIcon: "📲",
    answers: [
      { text: "آيفون", points: 35, revealed: false },
      { text: "سامسونج", points: 30, revealed: false },
      { text: "هواوي", points: 15, revealed: false },
      { text: "شاومي", points: 12, revealed: false },
      { text: "نوكيا", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يحدث في رمضان:",
    category: "علاقات", categoryIcon: "🌙",
    answers: [
      { text: "إفطار", points: 25, revealed: false },
      { text: "صلاة التراويح", points: 22, revealed: false },
      { text: "سحور", points: 18, revealed: false },
      { text: "خيمة رمضان", points: 18, revealed: false },
      { text: "مسلسلات", points: 17, revealed: false },
    ],
  },
  {
    question: "اذكر رياضة مشهورة في العالم العربي:",
    category: "رياضة", categoryIcon: "⚽",
    answers: [
      { text: "كرة القدم", points: 50, revealed: false },
      { text: "كرة السلة", points: 15, revealed: false },
      { text: "التنس", points: 12, revealed: false },
      { text: "السباحة", points: 13, revealed: false },
      { text: "الكاراتيه", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تفعله في الاستراحة:",
    category: "عمل", categoryIcon: "☕",
    answers: [
      { text: "تشرب قهوة", points: 30, revealed: false },
      { text: "تتكلم مع زميل", points: 25, revealed: false },
      { text: "تستخدم الجوال", points: 25, revealed: false },
      { text: "تأكل", points: 20, revealed: false },
    ],
  },
  {
    question: "اذكر بلداً عربياً مشهوراً بالسياحة:",
    category: "سفر", categoryIcon: "✈️",
    answers: [
      { text: "مصر", points: 28, revealed: false },
      { text: "الإمارات", points: 25, revealed: false },
      { text: "تونس", points: 18, revealed: false },
      { text: "المغرب", points: 17, revealed: false },
      { text: "الأردن", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر نوعاً من الملابس الرجالية:",
    category: "حياة يومية", categoryIcon: "👔",
    answers: [
      { text: "ثوب", points: 30, revealed: false },
      { text: "بشت", points: 22, revealed: false },
      { text: "غترة", points: 20, revealed: false },
      { text: "شماغ", points: 16, revealed: false },
      { text: "جيب", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً تقدمه للضيف:",
    category: "علاقات", categoryIcon: "🫖",
    answers: [
      { text: "قهوة", points: 30, revealed: false },
      { text: "شاي", points: 25, revealed: false },
      { text: "تمور", points: 22, revealed: false },
      { text: "حلويات", points: 15, revealed: false },
      { text: "ماء", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر برنامجاً تلفزيونياً كان يحبه الجميع:",
    category: "ترفيه", categoryIcon: "📺",
    answers: [
      { text: "خشمك يا بختكار", points: 28, revealed: false },
      { text: "تلفزيون الواقع", points: 22, revealed: false },
      { text: "الأفلام", points: 20, revealed: false },
      { text: "المسلسلات التركية", points: 18, revealed: false },
      { text: "برامج الكوميديا", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر أداة مطبخ أساسية:",
    category: "طعام", categoryIcon: "🍳",
    answers: [
      { text: "القدر", points: 28, revealed: false },
      { text: "المقلاة", points: 25, revealed: false },
      { text: "السكين", points: 20, revealed: false },
      { text: "المطبقة", points: 15, revealed: false },
      { text: "الخلاط", points: 12, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يفقد شكله بسرعة:",
    category: "حياة يومية", categoryIcon: "🫧",
    answers: [
      { text: "الآيس كريم", points: 30, revealed: false },
      { text: "البالون", points: 28, revealed: false },
      { text: "الثلج", points: 22, revealed: false },
      { text: "الزهور", points: 12, revealed: false },
      { text: "البخور", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر كلمة يقولها الناس كثيراً:",
    category: "علاقات", categoryIcon: "💬",
    answers: [
      { text: "إن شاء الله", points: 30, revealed: false },
      { text: "ماشاء الله", points: 25, revealed: false },
      { text: "يلا", points: 20, revealed: false },
      { text: "لا", points: 15, revealed: false },
      { text: "شكراً", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر مادة دراسية كان يكرهها التلاميذ:",
    category: "عمل", categoryIcon: "📚",
    answers: [
      { text: "الرياضيات", points: 35, revealed: false },
      { text: "الفيزياء", points: 22, revealed: false },
      { text: "الكيمياء", points: 18, revealed: false },
      { text: "التاريخ", points: 15, revealed: false },
      { text: "اللغة الإنجليزية", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر سبباً للسهر:",
    category: "ترفيه", categoryIcon: "🦉",
    answers: [
      { text: "سهرات", points: 25, revealed: false },
      { text: "ألعاب", points: 22, revealed: false },
      { text: "فيلم", points: 20, revealed: false },
      { text: "دراسة", points: 18, revealed: false },
      { text: "سفر", points: 15, revealed: false },
    ],
  },
  // --- Questions adapted from prepscholar.com for Arab culture ---
  {
    question: "أين يُطلب منك استخدام صوتك الهادئ؟",
    category: "أماكن", categoryIcon: "📚",
    answers: [
      { text: "المكتبة", points: 30, revealed: false },
      { text: "المسجد", points: 25, revealed: false },
      { text: "المستشفى", points: 20, revealed: false },
      { text: "السينما", points: 15, revealed: false },
      { text: "الفصل الدراسي", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا تجد في بيت مسكون؟",
    category: "مخاوف", categoryIcon: "👻",
    answers: [
      { text: "أشباح", points: 30, revealed: false },
      { text: "عناكب", points: 20, revealed: false },
      { text: "فئران", points: 18, revealed: false },
      { text: "أصوات غريبة", points: 17, revealed: false },
      { text: "غبار", points: 15, revealed: false },
    ],
  },
  {
    question: "ماذا تفعل قبل النوم؟",
    category: "حياة يومية", categoryIcon: "🌙",
    answers: [
      { text: "غسل الأسنان", points: 23, revealed: false },
      { text: "فحص الهاتف", points: 22, revealed: false },
      { text: "قراءة القرآن", points: 20, revealed: false },
      { text: "الاستحمام", points: 20, revealed: false },
      { text: "إطفاء الأنوار", points: 15, revealed: false },
    ],
  },
  {
    question: "ما الذي يجعلك بصحة وقوة؟",
    category: "صحة", categoryIcon: "💪",
    answers: [
      { text: "الرياضة", points: 30, revealed: false },
      { text: "نوم كافي", points: 25, revealed: false },
      { text: "أكل صحي", points: 22, revealed: false },
      { text: "شرب ماء كثير", points: 15, revealed: false },
      { text: "الفيتامينات", points: 8, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الكلب عادة؟",
    category: "حيوانات", categoryIcon: "🐕",
    answers: [
      { text: "ينبح", points: 30, revealed: false },
      { text: "يجري", points: 25, revealed: false },
      { text: "يقفز", points: 20, revealed: false },
      { text: "يعض", points: 15, revealed: false },
      { text: "يلعب", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الأشياء التي تأتي بشكل زوجي؟",
    category: "عام", categoryIcon: "👯",
    answers: [
      { text: "الحذاء", points: 24, revealed: false },
      { text: "الجوارب", points: 22, revealed: false },
      { text: "العيون", points: 20, revealed: false },
      { text: "الأيدي", points: 18, revealed: false },
      { text: "الأذنين", points: 16, revealed: false },
    ],
  },
  {
    question: "ماذا تجد في المطبخ؟",
    category: "منزل", categoryIcon: "🍳",
    answers: [
      { text: "الثلاجة", points: 25, revealed: false },
      { text: "الفرن", points: 22, revealed: false },
      { text: "المقلاة", points: 18, revealed: false },
      { text: "الأطباق", points: 17, revealed: false },
      { text: "حوض الغسيل", points: 18, revealed: false },
    ],
  },
  {
    question: "ماذا تفعل في يوم صيفي حار؟",
    category: "ترفيه", categoryIcon: "☀️",
    answers: [
      { text: "السباحة", points: 30, revealed: false },
      { text: "البقاء في المكيف", points: 25, revealed: false },
      { text: "شرب المشروبات الباردة", points: 20, revealed: false },
      { text: "الذهاب للبحر", points: 15, revealed: false },
      { text: "أكل آيس كريم", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا تفعل بعد تصوير سيلفي؟",
    category: "تكنولوجيا", categoryIcon: "🤳",
    answers: [
      { text: "أضيف فلتر", points: 25, revealed: false },
      { text: "أرسله لصديق", points: 22, revealed: false },
      { text: "أنشره في الانستقرام", points: 20, revealed: false },
      { text: "أحذفه وأصور غيره", points: 18, revealed: false },
      { text: "أرسله بالواتساب", points: 15, revealed: false },
    ],
  },
  {
    question: "ما أكثر أكل يأكله الناس بالإيد؟",
    category: "طعام", categoryIcon: "🍔",
    answers: [
      { text: "شاورما", points: 28, revealed: false },
      { text: "برجر", points: 22, revealed: false },
      { text: "فلافل", points: 20, revealed: false },
      { text: "بيتزا", points: 18, revealed: false },
      { text: "ساندويتش", points: 12, revealed: false },
    ],
  },
  {
    question: "ما سبب عدم الرد على الرسالة؟",
    category: "تكنولوجيا", categoryIcon: "📱",
    answers: [
      { text: "نسيت", points: 28, revealed: false },
      { text: "مشغول", points: 25, revealed: false },
      { text: "ما قرأتها", points: 20, revealed: false },
      { text: "ما أعرف أيش أرد", points: 15, revealed: false },
      { text: "السوشيال ميديا", points: 12, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي ما تطلع من البيت بدونه؟",
    category: "حياة يومية", categoryIcon: "🔑",
    answers: [
      { text: "الجوال", points: 35, revealed: false },
      { text: "المفاتيح", points: 25, revealed: false },
      { text: "المحفظة", points: 20, revealed: false },
      { text: "الماء", points: 12, revealed: false },
      { text: "النعال", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي يشجع الأهل أبنائهم عليه؟",
    category: "عائلة", categoryIcon: "👨‍👩‍👦",
    answers: [
      { text: "الدراسة", points: 30, revealed: false },
      { text: "الصلاة", points: 25, revealed: false },
      { text: "الرياضة", points: 20, revealed: false },
      { text: "قراءة الكتب", points: 15, revealed: false },
      { text: "احترام الآخرين", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي دايم ينفذ من البيت بسرعة؟",
    category: "منزل", categoryIcon: "🏠",
    answers: [
      { text: "الخبز", points: 30, revealed: false },
      { text: "الحليب", points: 25, revealed: false },
      { text: "الماء", points: 18, revealed: false },
      { text: "البيض", points: 15, revealed: false },
      { text: "المناديل", points: 12, revealed: false },
    ],
  },
  {
    question: "كيف كان الناس يتواصلون قبل الجوال؟",
    category: "تكنولوجيا", categoryIcon: "📞",
    answers: [
      { text: "الزيارات", points: 30, revealed: false },
      { text: "الهاتف الأرضي", points: 25, revealed: false },
      { text: "الرسائل الورقية", points: 20, revealed: false },
      { text: "البريد", points: 15, revealed: false },
      { text: "الجيران", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الضيوف في العرس؟",
    category: "مناسبات", categoryIcon: "💒",
    answers: [
      { text: "الرقص", points: 30, revealed: false },
      { text: "الأكل", points: 25, revealed: false },
      { text: "تصوير الفيديو", points: 20, revealed: false },
      { text: "تهنئة العروسين", points: 15, revealed: false },
      { text: "تقديم الهدايا", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أهم رقم يحفظه الناس؟",
    category: "حياة يومية", categoryIcon: "🔢",
    answers: [
      { text: "رقم الجوال", points: 30, revealed: false },
      { text: "رقم البنك/آيبان", points: 25, revealed: false },
      { text: "الرقم السري", points: 20, revealed: false },
      { text: "رقم الأهل", points: 15, revealed: false },
      { text: "رقم الطوارئ", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي يصير مرة كل أربع سنين؟",
    category: "رياضة", categoryIcon: "🏆",
    answers: [
      { text: "كأس العالم", points: 35, revealed: false },
      { text: "الأولمبياد", points: 25, revealed: false },
      { text: "الانتخابات", points: 20, revealed: false },
      { text: "خسوف القمر", points: 12, revealed: false },
      { text: "النهائي العربي", points: 8, revealed: false },
    ],
  },
  {
    question: "ما الموضوع اللي ما تحب يتكلم عنه في العزومات؟",
    category: "علاقات", categoryIcon: "🤐",
    answers: [
      { text: "السياسة", points: 32, revealed: false },
      { text: "الراتب والمال", points: 25, revealed: false },
      { text: "مشاكل عائلية", points: 20, revealed: false },
      { text: "موضوع الزواج", points: 13, revealed: false },
      { text: "الدين", points: 10, revealed: false },
    ],
  },
  {
    question: "ما الشيء اللي دايم يكون في المطبخ ولا ينفد؟",
    category: "طعام", categoryIcon: "🧂",
    answers: [
      { text: "الأرز", points: 30, revealed: false },
      { text: "الزيت", points: 25, revealed: false },
      { text: "البهارات", points: 20, revealed: false },
      { text: "الملح", points: 15, revealed: false },
      { text: "البصل", points: 10, revealed: false },
    ],
  },
  {
    question: "ماذا يفعل الناس لما يرون حشرة؟",
    category: "حياة يومية", categoryIcon: "🐛",
    answers: [
      { text: "يصرخون", points: 30, revealed: false },
      { text: "يبتعدون", points: 25, revealed: false },
      { text: "يقتلونها", points: 22, revealed: false },
      { text: "يطلبون مساعدة", points: 15, revealed: false },
      { text: "يصورونها", points: 8, revealed: false },
    ],
  },
  {
    question: "اذكر شيئاً يزعجك في المطعم:",
    category: "حياة يومية", categoryIcon: "🍽️",
    answers: [
      { text: "الخدمة البطيئة", points: 30, revealed: false },
      { text: "الطعام البارد", points: 25, revealed: false },
      { text: "الضجيج", points: 20, revealed: false },
      { text: "الحسبة الغالية", points: 15, revealed: false },
      { text: "نظافة المكان", points: 10, revealed: false },
    ],
  },
  {
    question: "ما أكثر شي يخلي الواحد يحس بالملل؟",
    category: "حياة يومية", categoryIcon: "😴",
    answers: [
      { text: "الانتظار", points: 28, revealed: false },
      { text: "الجلوس بدون ما يفعل شي", points: 25, revealed: false },
      { text: "الاجتماعات الطويلة", points: 20, revealed: false },
      { text: "الرحلات الطويلة", points: 17, revealed: false },
      { text: "عدم وجود إنترنت", points: 10, revealed: false },
    ],
  },
  {
    question: "اذكر فاكهة يحبها الكل:",
    category: "طعام", categoryIcon: "🍎",
    answers: [
      { text: "التمر", points: 30, revealed: false },
      { text: "المانجو", points: 25, revealed: false },
      { text: "البرتقال", points: 18, revealed: false },
      { text: "التفاح", points: 15, revealed: false },
      { text: "البطيخ", points: 12, revealed: false },
    ],
  },
  {
    question: "ما أول شيء يخطر في بالك لما تسمع كلمة 'مطار'؟",
    category: "سفر", categoryIcon: "✈️",
    answers: [
      { text: "سفر", points: 32, revealed: false },
      { text: "تأخير", points: 25, revealed: false },
      { text: "جواز سفر", points: 20, revealed: false },
      { text: "حقائب", points: 13, revealed: false },
      { text: "فحص الأمن", points: 10, revealed: false },
    ],
  },
];

// Fast Money questions (separate set)
const FAST_MONEY_QUESTIONS: Question[] = [
  {
    question: "شيء أحمر في البيت:",
    answers: [
      { text: "السجادة", points: 25, revealed: false },
      { text: "المخدة", points: 20, revealed: false },
      { text: "المايكرويف", points: 18, revealed: false },
      { text: "المفتاح", points: 17, revealed: false },
      { text: "الطفاية", points: 12, revealed: false },
      { text: "وسادة", points: 8, revealed: false },
    ],
  },
  {
    question: "شيء يبدأ بحرف الميم:",
    answers: [
      { text: "محمد", points: 30, revealed: false },
      { text: "ماء", points: 22, revealed: false },
      { text: "موبايل", points: 20, revealed: false },
      { text: "مدرسة", points: 15, revealed: false },
      { text: "مسجد", points: 13, revealed: false },
    ],
  },
  {
    question: "حيوان تحبه:",
    answers: [
      { text: "القط", points: 28, revealed: false },
      { text: "الكلب", points: 22, revealed: false },
      { text: "الحصان", points: 18, revealed: false },
      { text: "الأرنب", points: 15, revealed: false },
      { text: "الطائر", points: 12, revealed: false },
      { text: "السلاحف", points: 5, revealed: false },
    ],
  },
  {
    question: "لون تحبه:",
    answers: [
      { text: "أزرق", points: 28, revealed: false },
      { text: "أسود", points: 22, revealed: false },
      { text: "أبيض", points: 18, revealed: false },
      { text: "أحمر", points: 17, revealed: false },
      { text: "أخضر", points: 15, revealed: false },
    ],
  },
  {
    question: "شيء تفكر فيه قبل ما تنام:",
    answers: [
      { text: "المستقبل", points: 35, revealed: false },
      { text: "الأكل", points: 22, revealed: false },
      { text: "العائلة", points: 18, revealed: false },
      { text: "المال", points: 15, revealed: false },
      { text: "المشاكل", points: 10, revealed: false },
    ],
  },
  {
    question: "مشروب تحبه:",
    answers: [
      { text: "القهوة", points: 30, revealed: false },
      { text: "الشاي", points: 25, revealed: false },
      { text: "الماء", points: 18, revealed: false },
      { text: "العصير", points: 15, revealed: false },
      { text: "الكولا", points: 12, revealed: false },
    ],
  },
  {
    question: "مادة دراسية:",
    answers: [
      { text: "الرياضيات", points: 28, revealed: false },
      { text: "اللغة العربية", points: 25, revealed: false },
      { text: "الإنجليزي", points: 20, revealed: false },
      { text: "العلوم", points: 17, revealed: false },
      { text: "التربية الإسلامية", points: 10, revealed: false },
    ],
  },
  {
    question: "شيء تفعله في العطلة:",
    answers: [
      { text: "سفر", points: 30, revealed: false },
      { text: "نوم", points: 22, revealed: false },
      { text: "خروج مع الأصدقاء", points: 20, revealed: false },
      { text: "مشاهدة مسلسلات", points: 18, revealed: false },
      { text: "رياضة", points: 10, revealed: false },
    ],
  },
  {
    question: "اسم فريق كرة قدم:",
    answers: [
      { text: "الهلال", points: 25, revealed: false },
      { text: "النصر", points: 25, revealed: false },
      { text: "الأهلي", points: 20, revealed: false },
      { text: "الزمالك", points: 15, revealed: false },
      { text: "الرجاء", points: 15, revealed: false },
    ],
  },
  {
    question: "شيء موجود في كل بيت عربي:",
    answers: [
      { text: "قهوة عربية", points: 30, revealed: false },
      { text: "قرآن", points: 25, revealed: false },
      { text: "تبخير", points: 20, revealed: false },
      { text: "سجادة صلاة", points: 15, revealed: false },
      { text: "صينية تمور", points: 10, revealed: false },
    ],
  },
];

// ============================================================
// Sound Toggle Button Component
// ============================================================
function SoundToggleButton({
  soundEnabled,
  onToggle,
  compact = false,
}: {
  soundEnabled: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={cn(
        "rounded-full flex items-center justify-center transition-colors cursor-pointer border",
        compact
          ? "w-7 h-7 border-slate-700/50 bg-slate-900/60 hover:bg-slate-800/80"
          : "w-9 h-9 border-slate-700/50 bg-slate-900/60 hover:bg-slate-800/80"
      )}
      title={soundEnabled ? "كتم الصوت" : "تشغيل الصوت"}
    >
      {soundEnabled ? (
        <span className={compact ? "text-xs" : "text-sm"}>🔊</span>
      ) : (
        <span className={compact ? "text-xs" : "text-sm"}>🔇</span>
      )}
    </motion.button>
  );
}

// ============================================================
// Sparkle Particles for Landing Page
// ============================================================
function SparkleParticles() {
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 0.4,
    x: 10 + Math.random() * 80,
    y: 5 + Math.random() * 40,
    size: 2 + Math.random() * 3,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((s, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0, 1.2, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-amber-300/40"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Animated Grid Background Pattern
// ============================================================
function AnimatedGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
      <motion.div
        animate={{ opacity: [0.02, 0.06, 0.02] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-rose-500/5"
      />
    </div>
  );
}

// ============================================================
// Animated Dots Background
// ============================================================
function AnimatedDotsBackground() {
  const dots = Array.from({ length: 20 }, (_, i) => ({
    x: 5 + (i % 5) * 22,
    y: 5 + Math.floor(i / 5) * 22,
    delay: i * 0.3,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((d, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.05, 0.2, 0.05], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, delay: d.delay }}
          className="absolute w-1 h-1 rounded-full bg-amber-400"
          style={{ left: `${d.x}%`, top: `${d.y}%` }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Countdown Ring Animation
// ============================================================
function CountdownRing({ value, max }: { value: number; max: number }) {
  const radius = 70;
  const stroke = 4;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="absolute inset-0 m-auto">
      {/* Background ring */}
      <circle
        stroke="rgba(251,191,36,0.15)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Progress ring */}
      <motion.circle
        stroke="url(#countdown-gradient)"
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset, transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============================================================
// Point Fly-Up Animation
// ============================================================
function PointFlyUp({ points, show, color }: { points: number; show: boolean; color: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 0.5 }}
          animate={{ opacity: 0, y: -60, scale: 1.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none z-20"
        >
          <span
            className="text-lg font-black drop-shadow-lg"
            style={{ color, textShadow: `0 0 12px ${color}` }}
          >
            +{points}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Celebration Burst (round complete stars)
// ============================================================
function CelebrationBurst({ show }: { show: boolean }) {
  const emojis = ["⭐", "✨", "🌟", "💫", "⚡"];
  const particles = Array.from({ length: 10 }, (_, i) => ({
    angle: (i * 36) * (Math.PI / 180),
    delay: i * 0.05,
    emoji: emojis[i % emojis.length],
    distance: 80 + Math.random() * 60,
  }));
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
        >
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: Math.cos(p.angle) * p.distance,
                y: Math.sin(p.angle) * p.distance,
                opacity: 0,
                scale: 1.5,
                rotate: [0, 180],
              }}
              transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
              className="absolute text-xl"
            >
              {p.emoji}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Timer Bar Component (horizontal progress)
// ============================================================
function TimerBar({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) {
  const percentage = (timeLeft / maxTime) * 100;
  const isLow = timeLeft <= 5;
  return (
    <div className="w-full max-w-xs mx-auto">
      <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
        <motion.div
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
          className={cn(
            "h-full rounded-full relative",
            isLow
              ? "bg-gradient-to-l from-red-500 to-red-600"
              : "bg-gradient-to-l from-amber-400 to-amber-600"
          )}
        >
          {isLow && (
            <motion.div
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="absolute inset-0 bg-red-400/40 rounded-full"
            />
          )}
        </motion.div>
      </div>
      <div className="flex justify-between mt-1">
        <span className={cn("text-[10px] font-bold", isLow ? "text-red-400" : "text-amber-400/60")}>
          {timeLeft} ثانية
        </span>
        <span className="text-[10px] text-slate-500">{maxTime} ثانية</span>
      </div>
    </div>
  );
}

// ============================================================
// Animated Bar Chart (score comparison)
// ============================================================
function AnimatedBarChart({
  team1Score,
  team2Score,
  team1Name,
  team2Name,
  show,
}: {
  team1Score: number;
  team2Score: number;
  team1Name: string;
  team2Name: string;
  show: boolean;
}) {
  const maxScore = Math.max(team1Score, team2Score, 1);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="flex items-end gap-4 justify-center h-32 px-4"
        >
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[120px]">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="text-xs font-black text-amber-300"
            >
              {team1Score}
            </motion.span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(team1Score / maxScore) * 80}px` }}
              transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
              className="w-full rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/30 min-h-[4px] relative overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
              />
            </motion.div>
            <span className="text-[10px] font-bold text-amber-400/70 truncate max-w-full">{team1Name}</span>
          </div>
          <div className="flex flex-col items-center gap-1 flex-1 max-w-[120px]">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="text-xs font-black text-rose-300"
            >
              {team2Score}
            </motion.span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(team2Score / maxScore) * 80}px` }}
              transition={{ delay: 1.6, duration: 0.8, ease: "easeOut" }}
              className="w-full rounded-t-lg bg-gradient-to-t from-rose-600 to-rose-400 shadow-lg shadow-rose-500/30 min-h-[4px] relative overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
              />
            </motion.div>
            <span className="text-[10px] font-bold text-rose-400/70 truncate max-w-full">{team2Name}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Phase Transition Shimmer
// ============================================================
function PhaseTransitionShimmer({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[300] pointer-events-none bg-slate-950/80"
        >
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Confetti Effect
// ============================================================
const CONFETTI_EMOJIS = ["🎉", "🎊", "✨", "🌟", "💫", "🏆", "🥇", "🎆"];
const CONFETTI_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FF69B4",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
];

function ConfettiPiece({ delay, left }: { delay: number; left: string }) {
  const emoji = CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)];
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 16 + Math.random() * 16;
  return (
    <motion.div
      initial={{ top: "-30px", opacity: 1, rotate: 0 }}
      animate={{
        top: ["0vh", "105vh"],
        opacity: [1, 1, 1, 0.3],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 300],
      }}
      transition={{
        duration: 3 + Math.random() * 3,
        delay,
        repeat: Infinity,
        repeatDelay: 1 + Math.random(),
      }}
      className="fixed z-[200] pointer-events-none"
      style={{ left, fontSize: size }}
    >
      <span style={{ filter: `drop-shadow(0 0 8px ${color})` }}>{emoji}</span>
    </motion.div>
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 25 }, (_, i) => ({
    delay: Math.random() * 3,
    left: `${Math.random() * 100}%`,
  }));
  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {pieces.map((p, i) => (
        <ConfettiPiece key={`${i}-${p.left}-${p.delay}`} {...p} />
      ))}
    </div>
  );
}

// ============================================================
// BrandedHeader
// ============================================================
function BrandedHeader() {
  return (
    <div className="w-full border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-7 h-7 rounded-lg object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML =
                  "<span class='text-white text-sm font-black'>غ</span>";
              }}
            />
          </div>
          <h1 className="text-base sm:text-lg font-black bg-gradient-to-l from-amber-400 via-rose-300 to-amber-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </h1>
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm font-bold text-slate-400">
            🏆 فاميلي فيود
          </span>
          <a
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BrandedFooter
// ============================================================
function BrandedFooter() {
  return (
    <div className="w-full border-t border-slate-800/30 bg-slate-950/60 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-1.5 py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
            <img
              src="/platform-logo.png"
              alt="ألعاب الغريب"
              className="w-5 h-5 rounded-md object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.parentElement!.innerHTML =
                  "<span class='text-white text-xs font-black'>غ</span>";
              }}
            />
          </div>
          <span className="text-sm font-bold bg-gradient-to-l from-amber-400 via-rose-300 to-amber-400 bg-clip-text text-transparent">
            ألعاب الغريب
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>💻 برمجة</span>
            <span className="font-bold bg-gradient-to-l from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              الغريب
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>🏠 برعاية</span>
            <span className="font-bold bg-gradient-to-l from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ANA VIP 100034
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">
          © {new Date().getFullYear()} ألعاب الغريب — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Exit Confirmation Dialog
// ============================================================
function ExitDialog({ show, onConfirm, onCancel }: { show: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🚪</div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">
                الخروج من اللعبة؟
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                سيتم حفظ تقدم اللعبة ويمكنك العودة إليها لاحقاً. هل تريد الخروج؟
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={onConfirm}
                  className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-11"
                >
                  نعم، اخرج
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 h-11"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Unified Game Header (for all gameplay phases)
// ============================================================
function GameHeader({
  phaseLabel,
  phaseLabelVariant = "amber",
  showScoreBar = true,
  showSoundToggle = true,
  showFastMoneyBtn = false,
  onFastMoney,
  showRoundHistory = false,
  roundHistory,
  onExit,
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  team1Emoji,
  team2Emoji,
  questionNumber,
  totalQuestions,
}: {
  phaseLabel: string;
  phaseLabelVariant?: "amber" | "rose" | "gold";
  showScoreBar?: boolean;
  showSoundToggle?: boolean;
  showFastMoneyBtn?: boolean;
  onFastMoney?: () => void;
  showRoundHistory?: boolean;
  roundHistory?: { round: number; team: 1 | 2; points: number; type: string }[];
  onExit: () => void;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  team1Emoji: string;
  team2Emoji: string;
  questionNumber?: number;
  totalQuestions?: number;
}) {
  const badgeStyles = {
    amber: "border-amber-500/50 text-amber-400",
    rose: "border-rose-500/50 text-rose-400 animate-pulse",
    gold: "bg-gradient-to-l from-amber-600 to-yellow-600 text-white border-0",
  };

  return (
    <div className="sticky top-0 z-50 border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-12 px-4">
        {/* Logo + Home */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <img
                src="/platform-logo.png"
                alt="ألعاب الغريب"
                className="w-6 h-6 rounded-lg object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = "<span class='text-white text-xs font-black'>غ</span>";
                }}
              />
            </div>
            <span className="text-sm font-black bg-gradient-to-l from-amber-400 via-rose-300 to-amber-400 bg-clip-text text-transparent">
              ألعاب الغريب
            </span>
          </a>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {showSoundToggle && (
            <SoundToggleButton soundEnabled={true} onToggle={() => {}} compact />
          )}
          {showFastMoneyBtn && onFastMoney && (
            <Button
              onClick={onFastMoney}
              variant="ghost"
              className="text-slate-500 hover:text-yellow-400 hover:bg-yellow-950/30 gap-1 text-[10px] h-8 px-2"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">المال السريع</span>
            </Button>
          )}
          <Badge variant="outline" className={`${badgeStyles[phaseLabelVariant]} text-[10px] px-2`}>
            {phaseLabel}
          </Badge>
          <Button
            onClick={onExit}
            variant="ghost"
            className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-1.5 text-xs h-8 px-2"
          >
            <HomeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Button>
        </div>
      </div>

      {/* Score bar */}
      {showScoreBar && (
        <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1 border-t border-slate-800/30">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-amber-400">{team1Emoji} {team1Name}</span>
            <motion.span
              key={team1Score}
              initial={{ scale: 1.3, color: "#fbbf24" }}
              animate={{ scale: 1 }}
              className="text-xs font-black tabular-nums"
            >
              {team1Score}
            </motion.span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-slate-600 text-[10px] font-bold">VS</span>
            {questionNumber != null && totalQuestions != null && (
              <span className="text-[9px] font-bold text-slate-500">📋 السؤال {questionNumber} من {totalQuestions}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span
              key={team2Score}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-xs font-black tabular-nums"
            >
              {team2Score}
            </motion.span>
            <span className="text-xs font-black text-rose-400">{team2Name} {team2Emoji}</span>
          </div>
        </div>
      )}

      {/* Round History */}
      {showRoundHistory && roundHistory && roundHistory.length > 0 && (
        <div className="max-w-md mx-auto px-3 pb-1.5 flex gap-1 overflow-x-auto scrollbar-thin">
          {roundHistory.map((rh, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 border ${
                rh.team === 1
                  ? "bg-amber-900/30 border-amber-500/20 text-amber-400"
                  : "bg-rose-900/30 border-rose-500/20 text-rose-400"
              }`}
            >
              <span>{rh.team === 1 ? team1Emoji : team2Emoji}</span>
              <span>+{rh.points}</span>
              <span className="text-slate-500">{rh.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Feedback Overlay
// ============================================================
function FeedbackOverlay({
  show,
  correct,
  answer,
}: {
  show: boolean;
  correct: boolean;
  answer?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div
            className={cn(
              "flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 backdrop-blur-lg",
              correct
                ? "bg-emerald-950/80 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
                : "bg-red-950/80 border-red-400/60 shadow-lg shadow-red-500/20"
            )}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              {correct ? (
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              ) : (
                <XCircle className="w-10 h-10 text-red-400" />
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn(
                "font-black text-lg",
                correct ? "text-emerald-300" : "text-red-300"
              )}
            >
              {correct ? "إجابة صحيحة! ✅" : "إجابة خاطئة ❌"}
            </motion.p>
            {correct && answer && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-emerald-400/80"
              >
                {answer}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Round Result Card (Big animated overlay for steal/no-steal results)
// ============================================================
function RoundResultCard({
  show,
  type,
  teamName,
  points,
}: {
  show: boolean;
  type: "steal_success" | "steal_fail" | "round_complete";
  teamName: string;
  points: number;
}) {
  const isSuccess = type === "steal_success";
  const isFail = type === "steal_fail";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {isSuccess && <ConfettiOverlay />}
          <motion.div
            initial={{ scale: 0, rotate: -15, y: 50 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 0.5, rotate: 15, y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className={cn(
              "max-w-sm w-full mx-4 rounded-3xl border-[3px] p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden",
              isSuccess
                ? "bg-gradient-to-b from-emerald-950/95 to-emerald-900/90 border-emerald-400/60 shadow-emerald-500/40"
                : isFail
                  ? "bg-gradient-to-b from-red-950/95 to-red-900/90 border-red-400/60 shadow-red-500/40"
                  : "bg-gradient-to-b from-amber-950/95 to-amber-900/90 border-amber-400/60 shadow-amber-500/40"
            )}
          >
            {/* Background glow */}
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "absolute inset-0 pointer-events-none blur-3xl",
                isSuccess ? "bg-emerald-500/20" : isFail ? "bg-red-500/20" : "bg-amber-500/20"
              )}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="text-6xl mb-4"
              >
                {isSuccess ? "🎯" : isFail ? "🛡️" : "⚡"}
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cn(
                  "text-2xl sm:text-3xl font-black mb-2",
                  isSuccess ? "text-emerald-300" : isFail ? "text-red-300" : "text-amber-300"
                )}
              >
                {isSuccess ? "سرقة ناجحة!" : isFail ? "سرقة فاشلة!" : "جولة مكتملة!"}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={cn(
                  "text-sm sm:text-base mb-5",
                  isSuccess ? "text-emerald-200/80" : isFail ? "text-red-200/80" : "text-amber-200/80"
                )}
              >
                {isSuccess
                  ? `${teamName} يسرق الجولة!`
                  : isFail
                    ? `${teamName} يحتفظ بنقاطه!`
                    : `${teamName} يكشف كل الإجابات!`}
              </motion.p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 400 }}
                className={cn(
                  "rounded-2xl px-6 py-4 inline-block border",
                  isSuccess
                    ? "bg-emerald-800/60 border-emerald-500/30"
                    : isFail
                      ? "bg-red-800/60 border-red-500/30"
                      : "bg-amber-800/60 border-amber-500/30"
                )}
              >
                <span
                  className={cn(
                    "text-4xl sm:text-5xl font-black tabular-nums",
                    isSuccess ? "text-emerald-300" : isFail ? "text-red-300" : "text-amber-300"
                  )}
                >
                  {isFail ? points : `+${points}`}
                </span>
                <p
                  className={cn(
                    "text-xs mt-1",
                    isSuccess ? "text-emerald-400/60" : isFail ? "text-red-400/60" : "text-amber-400/60"
                  )}
                >
                  {isFail ? "نقاط محفوظة" : "نقاط"}
                </p>
              </motion.div>

              {/* Decorative sparkles */}
              {isSuccess && (
                <>
                  <motion.div
                    animate={{ scale: [0, 1.5, 0], rotate: [0, 180] }}
                    transition={{ delay: 0.5, duration: 1.2 }}
                    className="absolute top-4 right-8 text-2xl opacity-80"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{ scale: [0, 1.5, 0], rotate: [0, -180] }}
                    transition={{ delay: 0.7, duration: 1.2 }}
                    className="absolute bottom-8 left-8 text-2xl opacity-80"
                  >
                    ✨
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Strike Mark (animated X marks)
// ============================================================
function StrikeMark({ show, index }: { show: boolean; index: number }) {
  return (
    <motion.div
      initial={false}
      animate={
        show
          ? { scale: [0, 1.5, 0.8, 1.1, 1], opacity: [0, 1], rotate: [0, -30, 10, -5, 0] }
          : { scale: 0, opacity: 0 }
      }
      transition={{ duration: 0.6, delay: index * 0.15, type: "spring", stiffness: 300 }}
      className="text-3xl sm:text-4xl font-black relative"
    >
      {/* Animated X drawing */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* First line of X */}
            <motion.div
              initial={{ scaleX: 0, scaleY: 0 }}
              animate={{ scaleX: 1, scaleY: 1 }}
              transition={{ duration: 0.4, delay: index * 0.15 + 0.1 }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformOrigin: "center" }}
            >
              <span className="text-3xl sm:text-4xl font-black text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">
                ✕
              </span>
            </motion.div>
            {/* Glow ring */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-6 h-6 rounded-full bg-red-500/30 blur-sm" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// HOST Answer Slot (shows points even when hidden)
// ============================================================
function HostAnswerSlot({
  answer,
  index,
  onReveal,
  revealed,
  isTopAnswer = false,
}: {
  answer: Answer;
  index: number;
  onReveal: () => void;
  revealed: boolean;
  isTopAnswer?: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={revealed ? { scale: [0.95, 1.05, 1] } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <motion.button
        whileTap={!revealed ? { scale: 0.97 } : {}}
        onClick={onReveal}
        disabled={revealed}
        className={cn(
          "relative flex items-center gap-3 rounded-2xl px-4 py-3.5 border-2 overflow-hidden transition-all duration-300 w-full max-w-full text-right group",
          revealed && "cursor-default",
          revealed
            ? "bg-gradient-to-l from-emerald-800/70 via-emerald-900/50 to-emerald-950/40 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
            : "bg-slate-800/70 border-slate-700/50 hover:border-amber-500/60 hover:bg-slate-800/90 cursor-pointer"
        )}
      >
        {/* Glow effect when revealed */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"
          />
        )}

        {/* Rank circle - larger and more prominent */}
        <motion.div
          animate={revealed ? { scale: [0.5, 1.2, 1], rotate: [0, 10, -5, 0] } : {}}
          transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-base font-black shrink-0 relative z-10 border-2",
            revealed
              ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-400 shadow-md shadow-emerald-500/30"
              : "bg-slate-700/80 text-slate-400 border-slate-600/50 group-hover:border-amber-500/40 group-hover:text-amber-400"
          )}
        >
          {index + 1}
        </motion.div>

        {/* Answer Text */}
        <div className="flex-1 min-w-0 relative z-10">
          {revealed ? (
            <motion.span
              initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="font-extrabold text-sm sm:text-base text-emerald-100 block truncate drop-shadow-sm"
            >
              {answer.text}
            </motion.span>
          ) : (
            <span className="text-sm text-slate-400 block truncate">
              {answer.text}
            </span>
          )}
          {/* Top Answer Badge */}
          {isTopAnswer && revealed && (
            <motion.span
              initial={{ opacity: 0, scale: 0, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 300 }}
              className="inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0 rounded-full bg-gradient-to-l from-yellow-500/30 to-amber-500/20 border border-yellow-400/40 text-[9px] font-black text-yellow-300"
            >
              ⭐ الأعلى!
            </motion.span>
          )}
        </div>

        {/* Points - more prominent */}
        <motion.div
          animate={revealed ? { scale: [0.5, 1.3, 1] } : {}}
          transition={{ duration: 0.4, delay: 0.1, type: "spring", stiffness: 400 }}
          className={cn(
            "text-xl sm:text-2xl font-black tabular-nums shrink-0 min-w-[48px] text-left relative z-10",
            revealed ? "text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" : "text-amber-400/70"
          )}
        >
          {answer.points}
        </motion.div>

        {/* Reveal indicator for host */}
        {!revealed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-amber-500/20 rounded-full p-2">
              <Eye className="w-6 h-6 text-amber-400/60" />
            </div>
          </div>
        )}

        {/* Shimmer effect on unrevealed slots */}
        {!revealed && (
          <motion.div
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-500/20 pointer-events-none"
          />
        )}

        {/* Reveal flash effect */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-emerald-400/20 pointer-events-none z-0"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
function LandingPage({
  onStartGodfather,
  onStartDiwaniya,
  soundEnabled,
  setSoundEnabled,
}: {
  onStartGodfather: () => void;
  onStartDiwaniya: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}) {
  const [selectedMode, setSelectedMode] = useState<"godfather" | "diwaniya" | null>(null);
  const [showRules, setShowRules] = useState(false);

  const handleConfirmMode = () => {
    if (selectedMode === "godfather") onStartGodfather();
    else if (selectedMode === "diwaniya") onStartDiwaniya();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4 relative" dir="rtl">
      {/* Animated Background */}
      <AnimatedGridBackground />
      <AnimatedDotsBackground />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-lg w-full relative z-10"
      >
        {/* Game Icon - Dramatic Hero */}
        <div className="text-center mb-6 relative">
          <SparkleParticles />
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl sm:text-7xl mb-3"
          >
            🏆
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-6xl font-black mb-2"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{
              background: "linear-gradient(270deg, #f59e0b, #fb923c, #f43f5e, #fbbf24, #f59e0b)",
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 20px rgba(251,191,36,0.3))",
            }}
          >
            فاميلي فيود
          </motion.h1>
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-xs text-amber-400/70 font-bold tracking-[0.3em] uppercase mb-1"
          >
            Family Feud
          </motion.p>
          <div className="flex items-center justify-center gap-2">
            <SoundToggleButton soundEnabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
          </div>
        </div>

        {/* Mode Selection */}
        <AnimatePresence mode="wait">
          {!selectedMode ? (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-gradient-to-bl from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30 mb-4 relative overflow-hidden">
                <motion.div
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-[60px] pointer-events-none"
                />
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="inline-flex items-center gap-2 mb-2"
                    >
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h2 className="text-lg sm:text-xl font-bold text-amber-300">
                        اختر طريقة اللعب
                      </h2>
                    </motion.div>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      العراب يتحكم باللعبة مثل ستيف هارفي! 120+ سؤال عربي
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Godfather Mode (HOST) - Enhanced with gradient border */}
                    <motion.div
                      className="relative group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute -inset-[1px] rounded-xl bg-gradient-to-l from-amber-500 via-orange-500 to-rose-500 opacity-40 group-hover:opacity-80 transition-opacity blur-[0px]"
                      />
                      <motion.button
                        onClick={() => setSelectedMode("godfather")}
                        className="relative w-full rounded-xl p-3 sm:p-4 bg-gradient-to-l from-amber-950/90 to-red-950/80 hover:from-amber-950/80 hover:to-red-950/60 transition-all text-right cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-amber-500/40 flex items-center justify-center shrink-0"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity }}
                          >
                            <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-amber-200 mb-0.5 drop-shadow-sm">
                              العراب
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                              أنت المقدم! تتحكم باللعبة وترى جميع الإجابات والنقاط
                            </p>
                          </div>
                          <motion.span
                            animate={{ x: [-3, 3, -3] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-slate-500"
                          >
                            ‹
                          </motion.span>
                        </div>
                      </motion.button>
                    </motion.div>

                    {/* Diwaniya Mode (ONLINE) - Enhanced with gradient border */}
                    <motion.div
                      className="relative group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute -inset-[1px] rounded-xl bg-gradient-to-l from-cyan-500 via-blue-500 to-purple-500 opacity-40 group-hover:opacity-80 transition-opacity blur-[0px]"
                      />
                      <motion.button
                        onClick={() => setSelectedMode("diwaniya")}
                        className="relative w-full rounded-xl p-3 sm:p-4 bg-gradient-to-l from-blue-950/90 to-indigo-950/80 hover:from-blue-950/80 hover:to-indigo-950/60 transition-all text-right cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <motion.div
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0"
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                          >
                            <Home className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-blue-200 mb-0.5 drop-shadow-sm">
                              الديوانية
                            </h3>
                            <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">
                              أنشئ غرفة وشارك الكود، اللاعبون ينضمون من أجهزتهم
                            </p>
                          </div>
                          <motion.span
                            animate={{ x: [-3, 3, -3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                            className="text-slate-500"
                          >
                            ‹
                          </motion.span>
                        </div>
                      </motion.button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Highlights Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-4"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: "🎯", label: "120+ سؤال", desc: "أسئلة عربية متنوعة" },
                    { icon: "⚡", label: "سرعة", desc: "تفاعل فوري وسريع" },
                    { icon: "🏆", label: "تنافس", desc: "فريقين يتنافسان" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3 text-center group hover:border-amber-500/30 transition-all"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl mb-1"
                      >
                        {feature.icon}
                      </motion.div>
                      <p className="text-[10px] font-bold text-slate-300">{feature.label}</p>
                      <p className="text-[8px] text-slate-500 mt-0.5">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="mode-confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4"
            >
              <Card
                className={cn(
                  "bg-gradient-to-bl",
                  selectedMode === "godfather"
                    ? "from-amber-950/40 via-slate-900/80 to-slate-900/80 border-amber-500/30"
                    : "from-blue-950/40 via-slate-900/80 to-slate-900/80 border-blue-500/30"
                )}
              >
                <CardContent className="pt-5 sm:pt-6">
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="text-4xl mb-2"
                    >
                      {selectedMode === "godfather" ? "🕴️" : "🏠"}
                    </motion.div>
                    <h2
                      className={cn(
                        "text-lg sm:text-xl font-bold",
                        selectedMode === "godfather"
                          ? "text-amber-300"
                          : "text-blue-300"
                      )}
                    >
                      {selectedMode === "godfather" ? "العراب - وضع المقدم" : "الديوانية - لعب جماعي"}
                    </h2>
                  </div>

                  {selectedMode === "godfather" && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>أنت المقدم - تتحكم باللعبة كاملة</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>ترى جميع الإجابات والنقاط قبل الكشف</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>اضغط على الإجابة لكشفها للجمهور</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>أدخل أسماء فريقين وتحكم بالجولات</span>
                      </div>
                    </div>
                  )}

                  {selectedMode === "diwaniya" && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Home className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>أنشئ غرفة واحصل على كود</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Users className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>شارك الكود مع الأصدقاء لينضموا</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Zap className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>لعب متعدد اللاعبين عبر الإنترنت</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setSelectedMode(null)}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-4 text-sm"
                    >
                      رجوع
                    </Button>
                    <Button
                      onClick={handleConfirmMode}
                      className={cn(
                        "flex-1 font-bold text-base sm:text-lg py-5 transition-all duration-300",
                        selectedMode === "godfather"
                          ? "bg-gradient-to-l from-amber-600 to-red-800 hover:from-amber-500 hover:to-red-700 text-white"
                          : "bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white"
                      )}
                    >
                      متابعة
                      <ChevronLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules Toggle */}
        <div className="flex justify-center mb-3">
          <Button
            variant="ghost"
            onClick={() => setShowRules(!showRules)}
            className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-2 text-sm"
          >
            <Info className="w-4 h-4" />
            {showRules ? "إخفاء القوانين" : "📜 عرض القوانين"}
          </Button>
        </div>

        {/* Rules */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-3"
            >
              <Card className="bg-slate-900/80 border-slate-700/50">
                <CardContent className="pt-4 text-xs sm:text-sm text-slate-300 space-y-3">
                  <div>
                    <h4 className="font-bold text-amber-400 mb-1.5">
                      👑 وضع العراب (المقدم):
                    </h4>
                    <ul className="space-y-1 text-slate-400 pr-4">
                      <li>• أنت المقدم مثل ستيف هارفي في البرنامج</li>
                      <li>• ترى جميع الإجابات والنقاط مسبقاً</li>
                      <li>• اضغط على الإجابة لكشفها عند التخمين الصحيح</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <h4 className="font-bold text-amber-400 mb-1.5">
                      🎮 مراحل اللعبة:
                    </h4>
                    <ol className="space-y-2 text-slate-400 pr-4 list-decimal">
                      <li>
                        <span className="font-bold text-amber-300">⚔️ مرحلة المواجهة:</span>
                        الفريق الذي يضغط أولاً يجيب. إذا إجابة صحيحة يبدأ اللعب. إذا خاطئة، الفريق الآخر يحاول.
                      </li>
                      <li>
                        <span className="font-bold text-amber-300">🎮 مرحلة اللعب:</span>
                        المستضيف يكشف الإجابات واحدة تلو الأخرى. 3 إخفاقات = فرصة سرقة!
                      </li>
                      <li>
                        <span className="font-bold text-amber-300">🎯 مرحلة السرقة:</span>
                        الفريق الآخر يمكنه سرقة كل النقاط بإجابة صحيحة واحدة.
                      </li>
                      <li>
                        <span className="font-bold text-amber-300">💰 المال السريع:</span>
                        كل فريق يجيب على 5 أسئلة. النقاط مضاعفة (×2)!
                      </li>
                    </ol>
                  </div>
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-amber-400/80 text-xs">
                      🏆 الفريق الفائز يحصل على أكبر عدد من النقاط
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================
// TEAM SETUP (Host Mode)
// ============================================================
function TeamSetup({
  onStartGame,
  soundEnabled,
  setSoundEnabled,
}: {
  onStartGame: (settings: { team1Name: string; team2Name: string; team1Emoji: string; team2Emoji: string; totalRounds: number; stealTimer: number; roundTimer: number; difficultyFilter: 'all' | 'easy' | 'medium' | 'hard' }) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
}) {
  const [team1Name, setTeam1Name] = useState("فريق 1");
  const [team2Name, setTeam2Name] = useState("فريق 2");
  const [team1Emoji, setTeam1Emoji] = useState("👑");
  const [team2Emoji, setTeam2Emoji] = useState("🏛️");
  const [totalRounds, setTotalRounds] = useState(5);
  const [stealTimer, setStealTimer] = useState(0); // 0=off, 30, 60
  const [roundTimer, setRoundTimer] = useState(0); // 0=off, 30, 60, 90
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1, 2, 3

  const EMOJI_OPTIONS = ["👑", "🏛️", "🔥", "⚡", "💀", "🎮", "🎯", "🌟", "🐉", "🦁", "🐺", "🦅"];

  const handleSwapNames = () => {
    const tmp = team1Name;
    setTeam1Name(team2Name);
    setTeam2Name(tmp);
    const tmpE = team1Emoji;
    setTeam1Emoji(team2Emoji);
    setTeam2Emoji(tmpE);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4 relative" dir="rtl">
      <AnimatedGridBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full relative z-10"
      >
        {/* Animated Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((step) => (
            <motion.div
              key={step}
              animate={{ scale: setupStep >= step ? 1 : 0.85 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="flex items-center gap-1.5"
            >
              <motion.div
                animate={
                  setupStep === step
                    ? { boxShadow: ["0 0 0px rgba(251,191,36,0)", "0 0 12px rgba(251,191,36,0.4)", "0 0 0px rgba(251,191,36,0)"] }
                    : {}
                }
                transition={{ duration: 2, repeat: setupStep === step ? Infinity : 0 }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all",
                  setupStep > step
                    ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                    : setupStep === step
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                      : "bg-slate-800/60 border-slate-700/40 text-slate-500"
                )}
              >
                {setupStep > step ? "✓" : step}
              </motion.div>
              {step < 3 && (
                <motion.div
                  className={cn(
                    "w-8 h-0.5 rounded-full",
                    setupStep > step ? "bg-emerald-500/50" : "bg-slate-700/50"
                  )}
                  animate={{ scaleX: setupStep > step ? 1 : 0.5 }}
                />
              )}
            </motion.div>
          ))}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-center mb-1">
          <span className="bg-gradient-to-l from-amber-400 to-rose-400 bg-clip-text text-transparent">
            إعداد الفرق
          </span>
        </h2>
        <p className="text-xs text-slate-500 text-center mb-1">
          {setupStep === 1 ? "اختر رموز الفرق" : setupStep === 2 ? "أدخل أسماء الفرق" : "الإعدادات وابدأ"}
        </p>
        <div className="flex justify-center mb-5">
          <Badge className="bg-amber-900/40 border border-amber-500/30 text-amber-400 text-[10px]">
            👑 أنت المقدم - تتحكم باللعبة كاملة
          </Badge>
        </div>

        {/* STEP 1: Emoji Selectors */}
        {setupStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Team 1 Emoji Picker */}
            <Card className="bg-slate-900/80 border-amber-500/30 mb-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl"
                  >
                    {team1Emoji}
                  </motion.div>
                  <h3 className="text-sm font-bold text-amber-300">رمز الفريق الأول</h3>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setTeam1Emoji(emoji); }}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all cursor-pointer",
                        team1Emoji === emoji
                          ? "bg-amber-500/30 border-amber-400/60 shadow-lg shadow-amber-500/20"
                          : "bg-slate-800/60 border-slate-700/40 hover:border-amber-500/40"
                      )}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team 2 Emoji Picker */}
            <Card className="bg-slate-900/80 border-rose-500/30 mb-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="text-2xl"
                  >
                    {team2Emoji}
                  </motion.div>
                  <h3 className="text-sm font-bold text-rose-300">رمز الفريق الثاني</h3>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setTeam2Emoji(emoji); }}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all cursor-pointer",
                        team2Emoji === emoji
                          ? "bg-rose-500/30 border-rose-400/60 shadow-lg shadow-rose-500/20"
                          : "bg-slate-800/60 border-slate-700/40 hover:border-rose-500/40"
                      )}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSetupStep(2)}
                className="bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                التالي
                <ChevronLeft className="w-4 h-4 mr-2" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Team Names + Preview */}
        {setupStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              {/* Swap Button (centered between team cards on sm+) */}
              <div className="hidden sm:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={handleSwapNames}
                  className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-600 hover:border-amber-500/60 flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <span className="text-base">🔄</span>
                </motion.button>
              </div>

              {/* Team 1 */}
              <Card className="bg-slate-900/80 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl shadow-md shadow-amber-500/30"
                    >
                      {team1Emoji}
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-300">الفريق الأول</h3>
                      <p className="text-[10px] text-amber-400/60">بدأ المواجهة</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 z-10" />
                    <Input
                      value={team1Name}
                      onChange={(e) => setTeam1Name(e.target.value)}
                      placeholder="اسم الفريق الأول"
                      className="bg-slate-800/60 border-amber-900/40 text-amber-100 placeholder:text-amber-800/40 h-11 text-sm pr-7"
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Team 2 */}
              <Card className="bg-slate-900/80 border-rose-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-xl shadow-md shadow-rose-500/30"
                    >
                      {team2Emoji}
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-300">الفريق الثاني</h3>
                      <p className="text-[10px] text-rose-400/60">المنافس</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 z-10" />
                    <Input
                      value={team2Name}
                      onChange={(e) => setTeam2Name(e.target.value)}
                      placeholder="اسم الفريق الثاني"
                      className="bg-slate-800/60 border-rose-900/40 text-rose-100 placeholder:text-rose-800/40 h-11 text-sm pr-7"
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Swap Button */}
              <div className="sm:hidden flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSwapNames}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  <span>🔄</span>
                  <span>تبديل الأسماء</span>
                </motion.button>
              </div>
            </div>

            {/* Preview Card - How Teams Will Look */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4"
            >
              <p className="text-[10px] text-slate-500 font-bold text-center mb-2">👁️ معاينة اللعبة</p>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3">
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="text-xs font-bold text-amber-300 truncate">{team1Name.trim() || "فريق 1"}</span>
                  <span className="text-xl">{team1Emoji}</span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/10 shrink-0"
                >
                  <span className="text-xs font-black text-white">VS</span>
                </motion.div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xl">{team2Emoji}</span>
                  <span className="text-xs font-bold text-rose-300 truncate">{team2Name.trim() || "فريق 2"}</span>
                </div>
              </div>
            </motion.div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => setSetupStep(1)}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-3 text-sm"
              >
                رجوع
              </Button>
              <Button
                onClick={() => setSetupStep(3)}
                className="flex-1 bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold py-3"
              >
                التالي
                <ChevronLeft className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Settings + Start */}
        {setupStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
        {/* Host Info */}
        <Card className="bg-amber-950/20 border-amber-500/20 mt-4 mb-4">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400">
                بصفتك العراب، ستظهر لك جميع الإجابات والنقاط. اضغط على أي إجابة
                لكشفها للجمهور عندما يخمن الفريق بشكل صحيح.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Game Settings Panel */}
        <div className="mt-3">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-slate-400 hover:text-amber-300 hover:bg-amber-500/5 gap-2 text-sm py-2 justify-center"
          >
            <Info className="w-4 h-4" />
            <span>إعدادات اللعبة</span>
            <motion.span
              animate={{ rotate: showSettings ? 90 : 0 }}
              className="text-slate-500"
            >
              ‹
            </motion.span>
          </Button>
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="bg-slate-900/60 border-slate-700/40">
                  <CardContent className="p-4 space-y-4">
                    {/* Number of Rounds */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        🎯 عدد الجولات
                      </p>
                      <div className="flex gap-2">
                        {[3, 5, 7].map((n) => (
                          <motion.button
                            key={n}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTotalRounds(n)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-sm font-bold border-2 transition-all cursor-pointer",
                              totalRounds === n
                                ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20"
                                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            {n} جولات
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Steal Timer */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        ⏱️ مؤقت السرقة
                      </p>
                      <div className="flex gap-2">
                        {[
                          { val: 0, label: "بدون" },
                          { val: 30, label: "30 ثانية" },
                          { val: 60, label: "60 ثانية" },
                        ].map((opt) => (
                          <motion.button
                            key={opt.val}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setStealTimer(opt.val)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-xs font-bold border-2 transition-all cursor-pointer",
                              stealTimer === opt.val
                                ? "bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-500/20"
                                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Round Timer */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        ⏳ مؤقت الجولة
                      </p>
                      <div className="flex gap-2">
                        {[
                          { val: 0, label: "بدون" },
                          { val: 30, label: "30 ثانية" },
                          { val: 60, label: "60 ثانية" },
                          { val: 90, label: "90 ثانية" },
                        ].map((opt) => (
                          <motion.button
                            key={opt.val}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setRoundTimer(opt.val)}
                            className={cn(
                              "flex-1 rounded-xl py-2 text-[10px] font-bold border-2 transition-all cursor-pointer",
                              roundTimer === opt.val
                                ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20"
                                : "bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600"
                            )}
                          >
                            {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        🎯 مستوى الصعوبة
                      </p>
                      <div className="flex gap-2">
                        {[
                          { val: 'all' as const, label: 'الكل' },
                          { val: 'easy' as const, label: 'سهل فقط' },
                          { val: 'medium' as const, label: 'متوسط فقط' },
                          { val: 'hard' as const, label: 'صعب فقط' },
                        ].map((opt) => (
                          <motion.button
                            key={opt.val}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDifficultyFilter(opt.val)}
                            className={cn(
                              "flex-1 rounded-xl py-2.5 text-[10px] font-bold border-2 transition-all cursor-pointer",
                              difficultyFilter === opt.val
                                ? opt.val === 'easy'
                                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
                                  : opt.val === 'medium'
                                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                                    : opt.val === 'hard'
                                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-500/20'
                                      : 'bg-slate-500/20 border-slate-500/60 text-slate-300 shadow-sm shadow-slate-500/20'
                                : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
                            )}
                          >
                            {opt.val === 'easy' ? '🟢' : opt.val === 'medium' ? '🟡' : opt.val === 'hard' ? '🔴' : '🎯'} {opt.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Sound Effects */}
                    <div>
                      <p className="text-xs font-bold text-slate-300 mb-2">
                        🔊 المؤثرات الصوتية
                      </p>
                      <div className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                        <span className="text-xs text-slate-400">
                          {soundEnabled ? "مفعّل" : "مكتّم"}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={cn(
                            "w-12 h-7 rounded-full relative transition-colors cursor-pointer",
                            soundEnabled
                              ? "bg-amber-500/60 shadow-sm shadow-amber-500/30"
                              : "bg-slate-700"
                          )}
                        >
                          <motion.div
                            animate={{ x: soundEnabled ? 20 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                          />
                        </motion.button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Store settings in data attributes for main to pick up */}
        <input type="hidden" id="settings-totalRounds" value={totalRounds} />
        <input type="hidden" id="settings-stealTimer" value={stealTimer} />
        <input type="hidden" id="settings-roundTimer" value={roundTimer} />

        <div className="text-center mt-6">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              onStartGame({
                team1Name: team1Name.trim() || "فريق 1",
                team2Name: team2Name.trim() || "فريق 2",
                team1Emoji,
                team2Emoji,
                totalRounds,
                stealTimer,
                roundTimer,
                difficultyFilter,
              })
            }
            className="relative bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold px-12 py-6 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer overflow-hidden"
          >
            {/* Pulsing glow animation */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-l from-amber-400/30 to-rose-400/30 rounded-xl pointer-events-none"
            />
            <span className="relative flex items-center gap-2 text-lg">
              <Play className="w-5 h-5" />
              ابدأ اللعبة 🎮
            </span>
          </motion.button>
          <div className="text-center mt-3">
            <Button
              onClick={() => setSetupStep(2)}
              variant="ghost"
              className="text-slate-500 hover:text-amber-300 gap-1 text-xs"
            >
              رجوع
            </Button>
          </div>
        </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================
// DIWANIYA PLACEHOLDER
// ============================================================
function DiwaniyaPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🏠
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-black mb-3">
          <span className="bg-gradient-to-l from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">
            الديوانية - قريباً
          </span>
        </h2>
        <Card className="bg-blue-950/30 border-blue-500/30 mt-6">
          <CardContent className="p-6">
            <p className="text-sm text-slate-400 mb-4">
              وضع اللعب الجماعي عبر الإنترنت قيد التطوير حالياً.
              <br />
              سيتمكن اللاعبون من الانضمام من أجهزتهم والتنافس في الوقت الحقيقي!
            </p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <span>إنشاء غرفة بكود خاص</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-green-900/50 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
                <span>انضمام اللاعبين من أجهزتهم</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-800/50 border border-slate-700/30 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-slate-500" />
                </div>
                <span>لعب في الوقت الحقيقي (قريباً)</span>
              </div>
            </div>
            <Button
              onClick={() => {
                window.location.href = "/familyfeud";
              }}
              variant="outline"
              className="border-blue-500/30 text-blue-300 hover:bg-blue-950/30"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ============================================================
// FACE-OFF SCREEN
// ============================================================
function FaceOffScreen({
  question,
  answers,
  team1Name,
  team2Name,
  onTeamStart,
}: {
  question: string;
  answers: Answer[];
  team1Name: string;
  team2Name: string;
  onTeamStart: (team: 1 | 2, revealedAnswerIdx?: number) => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(3);
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<1 | 2 | null>(null);
  const [showGo, setShowGo] = useState(false);
  const [faceoffStep, setFaceoffStep] = useState<"select_team" | "verify_answer" | "other_team_chance">("select_team");
  const selectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 800);
      return () => clearTimeout(timer);
    } else {
      const t0 = setTimeout(() => setShowGo(true), 0);
      const t1 = setTimeout(() => setBuzzerActive(true), 100);
      const t2 = setTimeout(() => setShowGo(false), 1000);
      return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
    }
  }, [countdown]);

  const handleTeamSelect = (team: 1 | 2) => {
    setSelectedTeam(team);
    selectionTimerRef.current = setTimeout(() => {
      setFaceoffStep("verify_answer");
    }, 600);
  };

  const handleUndo = () => {
    if (selectionTimerRef.current) {
      clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = null;
    }
    setSelectedTeam(null);
    setFaceoffStep("select_team");
  };

  const handleCorrect = () => {
    if (!selectedTeam) return;
    onTeamStart(selectedTeam);
  };

  const handleWrong = () => {
    if (!selectedTeam) return;
    const otherTeam: 1 | 2 = selectedTeam === 1 ? 2 : 1;
    setSelectedTeam(otherTeam);
    setFaceoffStep("other_team_chance");
  };

  const handleOtherCorrect = () => {
    if (!selectedTeam) return;
    onTeamStart(selectedTeam);
  };

  const handleOtherWrong = () => {
    onTeamStart(1);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-3 sm:p-4 gap-2.5 relative overflow-hidden" dir="rtl">
      {/* Animated background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px]"
        />
      </div>

      {/* ===== COUNTDOWN OVERLAY with Ring + Particles ===== */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-black/30 backdrop-blur-sm"
          >
            {/* Countdown Ring */}
            <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex items-center justify-center">
              <CountdownRing value={countdown} max={3} />
              <motion.div
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-rose-400"
                style={{ filter: "drop-shadow(0 0 30px rgba(251,191,36,0.4))" }}
              >
                {countdown}
              </motion.div>
            </div>
            {/* Particles during countdown */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.2, 0.5],
                  y: [0, -30 - i * 10],
                  x: [(i % 2 === 0 ? 1 : -1) * (20 + i * 15)],
                }}
                transition={{ duration: 0.8, delay: i * 0.08 }}
                className="absolute w-2 h-2 rounded-full bg-amber-400/50"
                style={{
                  left: "50%",
                  top: "50%",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== "يلا!" GO TEXT ===== */}
      <AnimatePresence>
        {showGo && (
          <motion.div
            initial={{ scale: 3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-black/20 backdrop-blur-sm"
          >
            <div className="text-6xl sm:text-7xl font-black text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]">
              يلا!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== QUESTION (always visible) ===== */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 w-full"
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs font-bold text-amber-400/80 mb-1.5 tracking-wider"
        >
          ⚔️ المواجهة
        </motion.p>

        {/* Visual Step Indicator */}
        {countdown === null && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            {[
              { key: "select_team", label: "اختيار الفريق" },
              { key: "verify_answer", label: "التحقق من الإجابة" },
              { key: "other_team_chance", label: "فرصة الفريق الآخر" },
            ].map((step, i) => {
              const stepIndex = ["select_team", "verify_answer", "other_team_chance"].indexOf(faceoffStep);
              const isActive = faceoffStep === step.key;
              const isCompleted = stepIndex > i;
              return (
                <div key={step.key} className="flex items-center gap-2">
                  {i > 0 && (
                    <div className={`w-4 h-0.5 rounded-full transition-colors duration-300 ${isCompleted ? "bg-emerald-400" : "bg-slate-700"}`} />
                  )}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <div
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        isActive
                          ? "bg-amber-400 shadow-lg shadow-amber-400/50"
                          : isCompleted
                            ? "bg-emerald-400"
                            : "bg-slate-700"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-bold transition-colors duration-300 ${
                        isActive ? "text-amber-400" : isCompleted ? "text-emerald-400" : "text-slate-600"
                      }`}
                    >
                      {step.label}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        )}

        <h2 className="text-base sm:text-lg font-black text-white max-w-md leading-relaxed mx-auto">
          «{question}»
        </h2>
        {faceoffStep === "select_team" && buzzerActive && !selectedTeam && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-amber-300 mt-1 font-bold"
          >
            اختر الفريق الذي ضغط أولاً
          </motion.p>
        )}
        {faceoffStep === "verify_answer" && selectedTeam && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-emerald-300 mt-1 font-bold"
          >
            {selectedTeam === 1 ? team1Name : team2Name} أعطى إجابة... هل هي على اللوحة؟
          </motion.p>
        )}
        {faceoffStep === "other_team_chance" && selectedTeam && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-rose-300 mt-1 font-bold"
          >
            فرصة لـ {selectedTeam === 1 ? team1Name : team2Name}... هل إجابته على اللوحة؟
          </motion.p>
        )}
      </motion.div>

      {/* ===== ANSWERS BOARD (always visible for host) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className={cn(
          "w-full max-w-md relative z-10 space-y-1.5 rounded-2xl border-2 p-3 transition-all duration-500",
          faceoffStep === "select_team"
            ? "border-slate-700/50 bg-slate-900/60"
            : faceoffStep === "verify_answer"
              ? "border-emerald-400/40 bg-emerald-950/10 shadow-lg shadow-emerald-500/10"
              : "border-rose-400/40 bg-rose-950/10 shadow-lg shadow-rose-500/10"
        )}
      >
        {/* Subtle glow when verifying - Spotlight Effect */}
        {(faceoffStep === "verify_answer" || faceoffStep === "other_team_chance") && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.01, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={cn(
              "absolute inset-0 rounded-2xl pointer-events-none",
              faceoffStep === "verify_answer"
                ? "bg-gradient-to-b from-emerald-500/10 to-transparent"
                : "bg-gradient-to-b from-rose-500/10 to-transparent"
            )}
          />
        )}
        {/* Spotlight radial effect during verification */}
        {faceoffStep === "verify_answer" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(52,211,153,0.15) 0%, transparent 70%)",
            }}
          />
        )}
        <p className="text-[10px] font-bold text-slate-500 mb-1 text-center relative z-10">
          📋 الإجابات (مرئية للمستضيف فقط)
        </p>
        {answers.map((answer, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.04 }}
            className="flex items-center gap-3 rounded-xl px-3 py-2 border bg-slate-800/60 border-slate-700/40 cursor-default"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 border bg-slate-700 text-slate-400 border-slate-600">
              {idx + 1}
            </div>
            <span className="flex-1 text-sm font-bold truncate text-slate-300">
              {answer.text}
            </span>
            <span className="text-base font-black tabular-nums text-amber-400 shrink-0">
              {answer.points}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ===== TEAM SELECTED INDICATOR ===== */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "z-10 text-lg font-black px-5 py-2 rounded-2xl border-2",
              selectedTeam === 1
                ? "text-amber-200 bg-amber-950/90 border-amber-400/50 shadow-lg shadow-amber-500/30"
                : "text-rose-200 bg-rose-950/90 border-rose-400/50 shadow-lg shadow-rose-500/30"
            )}
          >
            {selectedTeam === 1 ? "👑" : "🏛️"} {selectedTeam === 1 ? team1Name : team2Name}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== UNDO BUTTON ===== */}
      <AnimatePresence>
        {selectedTeam && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleUndo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border-2 border-slate-600/50 hover:border-amber-400/50 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all cursor-pointer relative z-10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            تراجع
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== BOTTOM ACTIONS ===== */}
      <div className="w-full max-w-md relative z-10 mt-auto space-y-2 pb-2">
        {/* SELECT TEAM STEP: Team buttons */}
        {faceoffStep === "select_team" && (
          <>
            {/* Pulsing prompt */}
            <AnimatePresence>
              {buzzerActive && !showGo && !selectedTeam && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center mb-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5"
                  >
                    🔔 اختر الفريق الذي ضغط أولاً!
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Teams row */}
            <div className="flex items-center gap-3 sm:gap-4 w-full">
              {/* Team 1 Button */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => handleTeamSelect(1)}
                disabled={!buzzerActive}
                className={cn(
                  "flex-1 relative rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer overflow-hidden",
                  buzzerActive
                    ? "border-2 border-amber-400/70 bg-gradient-to-b from-amber-800/60 to-amber-900/40"
                    : "border-2 border-amber-500/20 bg-gradient-to-b from-amber-900/30 to-amber-950/20 opacity-50"
                )}
              >
                {buzzerActive && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-b from-amber-500/20 to-transparent rounded-2xl pointer-events-none"
                  />
                )}
                <motion.div
                  animate={buzzerActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="text-2xl sm:text-3xl mb-1"
                >
                  👑
                </motion.div>
                <p className="text-xs sm:text-sm font-bold text-amber-200">{team1Name}</p>
              </motion.button>

              {/* VS Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                className="relative shrink-0"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/30 border-2 border-white/20"
                >
                  <span className="text-sm sm:text-lg font-black text-white drop-shadow-lg">VS</span>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-rose-400/30 blur-sm"
                />
              </motion.div>

              {/* Team 2 Button */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                whileHover={{ scale: 1.03 }}
                onClick={() => handleTeamSelect(2)}
                disabled={!buzzerActive}
                className={cn(
                  "flex-1 relative rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer overflow-hidden",
                  buzzerActive
                    ? "border-2 border-rose-400/70 bg-gradient-to-b from-rose-800/60 to-rose-900/40"
                    : "border-2 border-rose-500/20 bg-gradient-to-b from-rose-900/30 to-rose-950/20 opacity-50"
                )}
              >
                {buzzerActive && (
                  <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
                    className="absolute inset-0 bg-gradient-to-b from-rose-500/20 to-transparent rounded-2xl pointer-events-none"
                  />
                )}
                <motion.div
                  animate={buzzerActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
                  className="text-2xl sm:text-3xl mb-1"
                >
                  🏛️
                </motion.div>
                <p className="text-xs sm:text-sm font-bold text-rose-200">{team2Name}</p>
              </motion.button>
            </div>
          </>
        )}

        {/* VERIFY ANSWER STEP: Correct / Wrong */}
        {faceoffStep === "verify_answer" && selectedTeam && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCorrect}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 bg-emerald-900/50 border-emerald-400/60 text-emerald-200 font-black text-base cursor-pointer hover:bg-emerald-800/60 transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              إجابة صحيحة — {selectedTeam === 1 ? team1Name : team2Name} يبدأ
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleWrong}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 bg-red-900/40 border-red-400/50 text-red-200 font-black text-base cursor-pointer hover:bg-red-800/50 transition-all"
            >
              <XCircle className="w-5 h-5" />
              إجابة خاطئة — فرصة للفريق الآخر
            </motion.button>
          </>
        )}

        {/* OTHER TEAM CHANCE STEP */}
        {faceoffStep === "other_team_chance" && selectedTeam && (
          <>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOtherCorrect}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 bg-emerald-900/50 border-emerald-400/60 text-emerald-200 font-black text-base cursor-pointer hover:bg-emerald-800/60 transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              إجابة صحيحة — {selectedTeam === 1 ? team1Name : team2Name} يبدأ
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOtherWrong}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 bg-orange-900/40 border-orange-400/50 text-orange-200 font-black text-base cursor-pointer hover:bg-orange-800/50 transition-all"
            >
              <SkipForward className="w-5 h-5" />
              إجابة خاطئة أيضاً — ابدأ اللعب بالطريقة العادية
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MAIN GAME BOARD (HOST VIEW)
// ============================================================
function GameBoardView({
  question,
  answers,
  currentTeam,
  team1Score,
  team2Score,
  team1Name,
  team2Name,
  team1Emoji,
  team2Emoji,
  strikes,
  onRevealAnswer,
  onAddStrike,
  onPassToOtherTeam,
  onSteal,
  onNoSteal,
  onRevealAll,
  onSkipQuestion,
  onUseHint,
  hintsUsed,
  questionDifficulty,
  phase,
  round,
  totalRounds,
  roundScore,
  questionCategory,
  roundTimeLeft,
  roundTimerRunning,
}: {
  question: string;
  answers: Answer[];
  currentTeam: 1 | 2;
  team1Score: number;
  team2Score: number;
  team1Name: string;
  team2Name: string;
  team1Emoji: string;
  team2Emoji: string;
  strikes: number;
  onRevealAnswer: (index: number) => void;
  onAddStrike: () => void;
  onPassToOtherTeam: () => void;
  onSteal: () => void;
  onNoSteal: () => void;
  onRevealAll: () => void;
  onSkipQuestion: () => void;
  onUseHint: () => void;
  hintsUsed: number;
  questionDifficulty?: 'easy' | 'medium' | 'hard';
  phase: "playing" | "steal";
  round: number;
  totalRounds: number;
  roundScore: number;
  questionCategory?: { icon: string; label: string };
  roundTimeLeft: number;
  roundTimerRunning: boolean;
}) {
  // Calculate points remaining (unrevealed)
  const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
  const revealedPoints = answers.filter(a => a.revealed).reduce((sum, a) => sum + a.points, 0);
  const pointsRemaining = totalPoints - revealedPoints;
  const maxScore = Math.max(team1Score, team2Score, 1);
  const difficultyInfo = questionDifficulty ? getDifficultyInfo(questionDifficulty) : null;
  const hasUnrevealed = answers.some(a => !a.revealed);

  // Screen shake on strike - use strikes as key so motion.div re-mounts and replays animation
  const shakeKey = `${round}-${strikes}`;

  // Search removed for full-screen game experience

  return (
    <motion.div
      key={shakeKey}
      initial={{ x: 0 }}
      animate={strikes > 0 ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col p-3 sm:p-4 gap-3 relative"
      dir="rtl"
    >
      {/* Team Score Panels with VS Badge */}
      <div className="flex items-stretch gap-2 sm:gap-3">
        {/* Team 1 Score Panel */}
        <motion.div
          animate={currentTeam === 1 && phase === "playing" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "flex-1 rounded-2xl border-2 p-3 sm:p-4 relative overflow-hidden transition-all",
            currentTeam === 1 && phase === "playing"
              ? "bg-gradient-to-br from-amber-950/80 to-amber-900/40 border-amber-500/60 shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 border-slate-700/40"
          )}
        >
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/60">
            <motion.div
              animate={{ width: `${(team1Score / maxScore) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-l from-amber-400 to-amber-600 rounded-r-full"
            />
          </div>
          {/* Active indicator pulse */}
          {currentTeam === 1 && phase === "playing" && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50"
            />
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl sm:text-2xl">{team1Emoji}</span>
            <p className="text-xs font-bold text-amber-400/70 truncate">{team1Name}</p>
          </div>
          <motion.p
            key={team1Score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums leading-none"
          >
            {team1Score}
          </motion.p>
        </motion.div>

        {/* VS Badge + Round */}
        <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 px-1">
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/10"
          >
            <span className="text-xs sm:text-sm font-black text-white">VS</span>
          </motion.div>
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-500 block">الجولة</span>
            <span className="text-sm font-black text-white">{round}<span className="text-slate-500">/{totalRounds}</span></span>
          </div>
          {/* Round Timer Display */}
          {roundTimerRunning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "mt-1 w-12 h-12 rounded-full border-2 flex items-center justify-center relative",
                roundTimeLeft <= 5
                  ? "border-red-500 bg-red-950/50 shadow-lg shadow-red-500/30"
                  : roundTimeLeft <= 10
                    ? "border-amber-500 bg-amber-950/50"
                    : "border-emerald-500/60 bg-emerald-950/30"
              )}
            >
              {/* Circular progress */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-800/50"
                />
                <circle
                  cx="24" cy="24" r="21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 21}`}
                  strokeDashoffset={`${2 * Math.PI * 21 * (1 - roundTimeLeft / 60)}`}
                  className={cn(
                    "transition-all duration-1000",
                    roundTimeLeft <= 5 ? "text-red-500" : roundTimeLeft <= 10 ? "text-amber-500" : "text-emerald-500"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <span className={cn(
                "text-sm font-black tabular-nums",
                roundTimeLeft <= 5 ? "text-red-400" : roundTimeLeft <= 10 ? "text-amber-400" : "text-emerald-400"
              )}>
                {roundTimeLeft}
              </span>
            </motion.div>
          )}
        </div>

        {/* Team 2 Score Panel */}
        <motion.div
          animate={currentTeam === 2 && phase === "playing" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            "flex-1 rounded-2xl border-2 p-3 sm:p-4 relative overflow-hidden transition-all",
            currentTeam === 2 && phase === "playing"
              ? "bg-gradient-to-br from-rose-950/80 to-rose-900/40 border-rose-500/60 shadow-lg shadow-rose-500/20"
              : "bg-slate-900/60 border-slate-700/40"
          )}
        >
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800/60">
            <motion.div
              animate={{ width: `${(team2Score / maxScore) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-l from-rose-400 to-rose-600 rounded-r-full"
            />
          </div>
          {/* Active indicator pulse */}
          {currentTeam === 2 && phase === "playing" && (
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-400 shadow-lg shadow-rose-400/50"
            />
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl sm:text-2xl">{team2Emoji}</span>
            <p className="text-xs font-bold text-rose-400/70 truncate">{team2Name}</p>
          </div>
          <motion.p
            key={team2Score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl sm:text-3xl font-black text-rose-300 tabular-nums leading-none"
          >
            {team2Score}
          </motion.p>
        </motion.div>
      </div>

      {/* Question Number Badge + Category */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-2"
      >
        <Badge className="bg-slate-800/80 border border-slate-700/50 text-slate-400 text-[10px] px-3">
          📋 السؤال {round} من {totalRounds}
        </Badge>
        {questionCategory && (
          <Badge className="bg-amber-950/50 border border-amber-500/30 text-amber-300 text-[10px] px-2">
            {questionCategory.icon} {questionCategory.label}
          </Badge>
        )}
        {difficultyInfo && (
          <Badge className={cn("text-[10px] px-2 border", difficultyInfo.color)}>
            {difficultyInfo.icon} {difficultyInfo.label}
          </Badge>
        )}
      </motion.div>

      {/* Question + Points Remaining */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center py-1"
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0px rgba(251,191,36,0)",
              "0 0 20px rgba(251,191,36,0.15)",
              "0 0 0px rgba(251,191,36,0)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="rounded-2xl px-3 py-2"
        >
          <h2 className="text-base sm:text-lg font-black text-white leading-relaxed">
            «{question}»
          </h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/40"
        >
          <Zap className="w-3 h-3" />
          <span
            className={cn(
              "text-xs font-bold tabular-nums",
              pointsRemaining > totalPoints * 0.5
                ? "text-amber-400"
                : pointsRemaining > totalPoints * 0.2
                  ? "text-yellow-400"
                  : "text-red-400"
            )}
          >
            النقاط المتبقية: {pointsRemaining}
          </span>
        </motion.div>
        {/* Remaining Answers Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-1"
        >
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums",
              answers.filter((a) => a.revealed).length / Math.max(answers.length, 1) >= 0.5
                ? "text-emerald-400"
                : "text-amber-400"
            )}
          >
            {answers.filter((a) => a.revealed).length} من {answers.length} إجابة مكشوفة
          </span>
        </motion.div>
      </motion.div>



      {/* Strike Marks */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StrikeMark key={i} show={i < strikes} index={i} />
        ))}
      </div>

      {/* Phase Indicator */}
      <div className="text-center">
        <Badge
          className={cn(
            "text-xs font-bold",
            phase === "steal"
              ? "bg-gradient-to-l from-rose-600 to-amber-600 text-white animate-pulse"
              : currentTeam === 1
                ? "bg-amber-900/60 border border-amber-500/40 text-amber-300"
                : "bg-rose-900/60 border border-rose-500/40 text-rose-300"
          )}
        >
          {phase === "steal"
            ? "⚡ فرصة السرقة!"
            : `دور ${currentTeam === 1 ? team1Name : team2Name}`}
        </Badge>
        {phase === "playing" && (
          <p className="text-[10px] text-emerald-400/60 mt-0.5">
            +{roundScore} نقاط في هذه الجولة
          </p>
        )}
      </div>

      {/* Round Progress Bar with percentage */}
      <div className="px-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/30">
            <motion.div
              animate={{ width: `${(answers.filter((a) => a.revealed).length / Math.max(answers.length, 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full relative overflow-hidden",
                phase === "steal"
                  ? "bg-gradient-to-l from-rose-400 to-amber-500"
                  : currentTeam === 1
                    ? "bg-gradient-to-l from-amber-400 to-amber-600"
                    : "bg-gradient-to-l from-rose-400 to-rose-600"
              )}
            >
              <motion.div
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"
              />
            </motion.div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 tabular-nums shrink-0 min-w-[36px] text-center">
            {Math.round((answers.filter((a) => a.revealed).length / Math.max(answers.length, 1)) * 100)}%
          </span>
        </div>
        {/* Points progress indicator */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-slate-800/40 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${totalPoints > 0 ? (revealedPoints / totalPoints) * 100 : 0}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-l from-yellow-400 to-emerald-400"
            />
          </div>
          <span className="text-[9px] font-bold text-slate-600 tabular-nums shrink-0">
            {revealedPoints}/{totalPoints} pts
          </span>
        </div>
      </div>

      {/* Floating particles */}
      {phase === "playing" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                opacity: [0.1, 0.3, 0.1],
                x: [0, (i % 2 === 0 ? 10 : -10), 0],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.7,
              }}
              className="absolute w-1 h-1 rounded-full bg-amber-400/30"
              style={{
                left: `${15 + i * 14}%`,
                top: `${20 + (i * 17) % 60}%`,
              }}
            />
          ))}
        </div>
      )}

      {/* Answer Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 max-h-[45vh] overflow-y-auto scrollbar-thin">
        {answers.map((answer, i) => (
          <HostAnswerSlot
            key={i}
            answer={answer}
            index={i}
            onReveal={() => onRevealAnswer(i)}
            revealed={answer.revealed}
            isTopAnswer={i === 0}
          />
        ))}
      </div>

      {/* Host Controls */}
      <div className="mt-auto space-y-2">
        {phase === "playing" && (
          <div className="flex gap-2">
            <Button
              onClick={onAddStrike}
              disabled={strikes >= 3}
              className="flex-1 bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold h-10 text-sm disabled:opacity-40"
            >
              <XCircle className="w-4 h-4 ml-1" />
              إخفاق ({strikes}/3)
            </Button>
            <Button
              onClick={onPassToOtherTeam}
              className="flex-1 bg-gradient-to-l from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold h-10 text-sm"
            >
              <SkipForward className="w-4 h-4 ml-1" />
              تمرير الدور
            </Button>
          </div>
        )}

        {/* Skip Question Button (only during normal gameplay) */}
        {phase === "playing" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSkipQuestion}
            className="w-full rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-slate-500/50 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 h-8 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            ⏭️ تخطي
          </motion.button>
        )}

        {phase === "steal" && (
          <div className="space-y-3">
            {/* Dramatic steal banner */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative overflow-hidden rounded-2xl border-2 border-rose-500/50 bg-gradient-to-l from-rose-950/80 via-amber-950/60 to-rose-950/80 p-4 text-center"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-l from-rose-500/10 to-amber-500/10 pointer-events-none"
              />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-rose-300 to-amber-300 mb-1"
                  style={{ filter: "drop-shadow(0 0 20px rgba(244,63,94,0.3))" }}
                >
                  ⚔️ STEAL ⚔️
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <p className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-rose-300 to-amber-300 mb-2">
                    فرصة السرقة!
                  </p>
                </motion.div>
                <p className="text-xs sm:text-sm text-slate-300">
                  <span className="text-red-300 font-bold">{currentTeam === 1 ? team2Name : team1Name}</span>
                  {" "}أخذ 3 إخفاقات ← فرصة السرقة لـ{" "}
                  <span className={cn(
                    "font-black px-3 py-0.5 rounded-full",
                    currentTeam === 1
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  )}>
                    {currentTeam === 1 ? team1Name : team2Name}
                  </span>
                </p>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSteal}
                className="flex-1 relative rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-bold p-4 text-center overflow-hidden border border-emerald-400/40 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-l from-emerald-400/20 to-transparent pointer-events-none"
                />
                <div className="relative z-10">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm sm:text-base font-black">سرقة ناجحة</div>
                  <div className="text-[10px] text-emerald-200/60 mt-0.5">الفريق يسرق كل النقاط</div>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNoSteal}
                className="flex-1 relative rounded-2xl bg-gradient-to-l from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-bold p-4 text-center overflow-hidden border border-red-400/40 shadow-lg shadow-red-500/20 cursor-pointer"
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute inset-0 bg-gradient-to-l from-red-400/20 to-transparent pointer-events-none"
                />
                <div className="relative z-10">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="text-sm sm:text-base font-black">سرقة فاشلة</div>
                  <div className="text-[10px] text-red-200/60 mt-0.5">الفريق يحتفظ بنقاطه</div>
                </div>
              </motion.button>
            </div>
          </div>
        )}

        {phase !== "steal" && (
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUseHint}
            disabled={hintsUsed >= 2 || !hasUnrevealed}
            className={cn(
              "flex-1 relative overflow-hidden rounded-xl border h-9 text-xs font-bold transition-all cursor-pointer",
              hintsUsed >= 2 || !hasUnrevealed
                ? "border-slate-700/40 text-slate-600 bg-slate-800/30 cursor-not-allowed"
                : "border-violet-500/40 hover:border-violet-400/60 text-violet-300 hover:text-violet-200 hover:bg-slate-800/80"
            )}
          >
            <span className="relative flex items-center justify-center gap-1">
              💡 تلميح ({2 - hintsUsed})
            </span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRevealAll}
            className="flex-[2] relative overflow-hidden rounded-xl border border-slate-700 hover:border-amber-500/40 text-slate-400 hover:text-amber-200 hover:bg-slate-800/80 h-9 text-xs font-bold transition-all cursor-pointer"
          >
            <motion.div
              animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.05), transparent)",
                backgroundSize: "200% 100%",
              }}
            />
            <span className="relative flex items-center justify-center gap-1">
              <Eye className="w-3 h-3" />
              كشف جميع الإجابات ✨
            </span>
          </motion.button>
        </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// FAST MONEY SCREEN
// ============================================================
function FastMoneyScreen({
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  fmQuestions,
  fmAnswers1,
  fmAnswers2,
  fmRevealed1,
  fmRevealed2,
  onRevealFM1,
  onRevealFM2,
  onInputFM1,
  onInputFM2,
  onStartTimer,
  timeLeft,
  timerRunning,
  roundScore,
  fmSelected1,
  fmSelected2,
  onSelectFM1,
  onSelectFM2,
  onPhaseChange,
  fmScore1,
  fmScore2,
}: {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  fmScore1: number;
  fmScore2: number;
  fmQuestions: Question[];
  fmAnswers1: string[];
  fmAnswers2: string[];
  fmRevealed1: boolean[];
  fmRevealed2: boolean[];
  onRevealFM1: (i: number) => void;
  onRevealFM2: (i: number) => void;
  onInputFM1: (i: number, v: string) => void;
  onInputFM2: (i: number, v: string) => void;
  onStartTimer: () => void;
  timeLeft: number;
  timerRunning: boolean;
  roundScore: number;
  fmSelected1: number[];
  fmSelected2: number[];
  onSelectFM1: (questionIdx: number, answerIdx: number) => void;
  onSelectFM2: (questionIdx: number, answerIdx: number) => void;
  onPhaseChange: (phase: string) => void;
}) {
  const [phase, setPhase] = useState<"intro" | "team1" | "team2" | "results">("intro");

  if (phase === "intro") {
    return (
      <div className="flex-1 flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            💰
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            <span className="bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
              جولة المال السريع!
            </span>
          </h2>
          <Card className="bg-amber-950/30 border-amber-500/30 mt-4">
            <CardContent className="p-4 text-xs text-slate-400 space-y-2">
              <p>🎯 كل فريق يجيب على 5 أسئلة</p>
              <p>⏱️ 20 ثانية لكل فريق</p>
              <p>💰 النقاط تتضاعف في هذه الجولة</p>
              <p>🏆 الفريق الأعلى نقاطاً يفوز!</p>
            </CardContent>
          </Card>
          <Button
            onClick={() => setPhase("team1")}
            className="mt-6 bg-gradient-to-l from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold px-8 py-5"
          >
            ابدأ جولة المال السريع
            <ChevronLeft className="w-4 h-4 mr-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  if (phase === "team1") {
    return (
      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3" dir="rtl">
        {/* Header with team avatars */}
        <div className="flex items-center justify-between gap-2">
          <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">👑</span>
              <p className="text-[10px] text-amber-400/60">{team1Name}</p>
            </div>
            <p className="text-lg font-black text-amber-300">{team1Score}</p>
            {fmScore1 > 0 && <p className="text-[9px] text-emerald-400/60">💰 +{fmScore1}</p>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <Badge className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white px-3 py-1">
              💰 المال السريع
            </Badge>
            {/* Double Points Badge */}
            <motion.div
              animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(251,191,36,0)", "0 0 12px rgba(251,191,36,0.5)", "0 0 0px rgba(251,191,36,0)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/50 rounded-full px-3 py-0.5"
            >
              <span className="text-[10px] font-black text-amber-300">2× نقاط مضاعفة</span>
            </motion.div>
          </div>
          <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🏛️</span>
              <p className="text-[10px] text-rose-400/60">{team2Name}</p>
            </div>
            <p className="text-lg font-black text-rose-300">{team2Score}</p>
            {fmScore2 > 0 && <p className="text-[9px] text-emerald-400/60">💰 +{fmScore2}</p>}
          </div>
        </div>

        <div className="text-center">
          <Badge className="bg-amber-900/60 border border-amber-500/40 text-amber-300">
            👑 دور {team1Name} - يبدأ أولاً
          </Badge>
        </div>

        {/* Timer with Timer Bar */}
        <div className="text-center space-y-2">
          {!timerRunning ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPhase("team1");
                onStartTimer();
              }}
              className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              ابدأ المؤقت (20 ثانية)
            </motion.button>
          ) : (
            <div className="space-y-2">
              {/* Prominent Timer Display */}
              <motion.div
                animate={{ scale: timeLeft <= 5 ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-3 rounded-2xl border-2",
                  timeLeft <= 5
                    ? "bg-red-950/60 border-red-500/60 shadow-lg shadow-red-500/30"
                    : "bg-amber-950/40 border-amber-500/40 shadow-lg shadow-amber-500/20"
                )}
              >
                <motion.span
                  animate={{ rotate: timeLeft <= 5 ? [0, 15, -15, 0] : 0 }}
                  transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.8 }}
                  className="text-lg"
                >
                  ⏱️
                </motion.span>
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums",
                    timeLeft <= 5 ? "text-red-400" : "text-amber-400"
                  )}
                  style={{
                    filter: timeLeft <= 5
                      ? "drop-shadow(0 0 12px rgba(239,68,68,0.5))"
                      : "drop-shadow(0 0 8px rgba(251,191,36,0.3))"
                  }}
                >
                  {timeLeft}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  timeLeft <= 5 ? "text-red-300/70" : "text-amber-300/70"
                )}>
                  ثانية
                </span>
              </motion.div>
              <TimerBar timeLeft={timeLeft} maxTime={20} />
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="flex-1 max-h-[50vh] overflow-y-auto space-y-2">
          {fmQuestions.map((q, i) => {
            const isRevealed = fmRevealed1[i];
            const selectedAnswerIdx = fmSelected1[i];
            return (
              <Card key={i} className="bg-slate-900/80 border-slate-700/40">
                <CardContent className="p-3">
                  <p className="text-xs font-bold text-white mb-2">
                    {i + 1}. {q.question}
                  </p>
                  {isRevealed ? (
                    <div className="space-y-1">
                      {q.answers.map((a, j) => (
                        <div
                          key={j}
                          className={cn(
                            "flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition-all",
                            selectedAnswerIdx === j
                              ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-200"
                              : "bg-slate-800/40 border-slate-700/30 text-slate-500"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {selectedAnswerIdx === j && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                            {a.text}
                          </span>
                          <span className="font-bold">{a.points}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {q.answers.map((a, j) => (
                        <motion.button
                          key={j}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { onSelectFM1(i, j); setTimeout(() => onRevealFM1(i), 100); }}
                          className="flex items-center justify-between text-xs px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/40 hover:border-amber-400/50 hover:bg-amber-900/20 text-slate-300 hover:text-amber-200 transition-all cursor-pointer text-right"
                        >
                          <span>{a.text}</span>
                          <span className="font-bold text-amber-400/60">{a.points}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={() => setPhase("team2")}
          className="bg-gradient-to-l from-rose-600 to-rose-800 text-white font-bold h-10"
        >
          التالي - دور {team2Name}
          <ChevronLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    );
  }

  if (phase === "team2") {
    return (
      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="bg-amber-950/50 border border-amber-500/40 rounded-xl px-3 py-2">
            <p className="text-[10px] text-amber-400/60">{team1Name}</p>
            <p className="text-lg font-black text-amber-300">{team1Score}</p>
            {fmScore1 > 0 && <p className="text-[9px] text-emerald-400/60">💰 +{fmScore1}</p>}
          </div>
          <Badge className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white">
            💰 المال السريع
          </Badge>
          <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl px-3 py-2">
            <p className="text-[10px] text-rose-400/60">{team2Name}</p>
            <p className="text-lg font-black text-rose-300">{team2Score}</p>
            {fmScore2 > 0 && <p className="text-[9px] text-emerald-400/60">💰 +{fmScore2}</p>}
          </div>
        </div>

        <div className="text-center">
          <Badge className="bg-rose-900/60 border border-rose-500/40 text-rose-300">
            🏛️ دور {team2Name}
          </Badge>
        </div>

        {/* Timer */}
        <div className="text-center space-y-2">
          {!timerRunning ? (
            <Button
              onClick={onStartTimer}
              className="bg-gradient-to-l from-rose-600 to-rose-800 text-white font-bold"
            >
              <Play className="w-4 h-4 ml-1" />
              ابدأ المؤقت (20 ثانية)
            </Button>
          ) : (
            <div className="space-y-2">
              {/* Prominent Timer Display */}
              <motion.div
                animate={{ scale: timeLeft <= 5 ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.5 }}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-3 rounded-2xl border-2",
                  timeLeft <= 5
                    ? "bg-red-950/60 border-red-500/60 shadow-lg shadow-red-500/30"
                    : "bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-500/20"
                )}
              >
                <motion.span
                  animate={{ rotate: timeLeft <= 5 ? [0, 15, -15, 0] : 0 }}
                  transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 0.8 }}
                  className="text-lg"
                >
                  ⏱️
                </motion.span>
                <span
                  className={cn(
                    "text-3xl font-black tabular-nums",
                    timeLeft <= 5 ? "text-red-400" : "text-rose-400"
                  )}
                  style={{
                    filter: timeLeft <= 5
                      ? "drop-shadow(0 0 12px rgba(239,68,68,0.5))"
                      : "drop-shadow(0 0 8px rgba(244,63,94,0.3))"
                  }}
                >
                  {timeLeft}
                </span>
                <span className={cn(
                  "text-sm font-bold",
                  timeLeft <= 5 ? "text-red-300/70" : "text-rose-300/70"
                )}>
                  ثانية
                </span>
              </motion.div>
              <TimerBar timeLeft={timeLeft} maxTime={20} />
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="flex-1 max-h-[50vh] overflow-y-auto space-y-2">
          {fmQuestions.map((q, i) => {
            const isRevealed = fmRevealed2[i];
            const selectedAnswerIdx = fmSelected2[i];
            const team1AnswerIdx = fmSelected1[i];
            return (
              <Card key={i} className="bg-slate-900/80 border-slate-700/40">
                <CardContent className="p-3">
                  <p className="text-xs font-bold text-white mb-2">
                    {i + 1}. {q.question}
                  </p>
                  {isRevealed ? (
                    <div className="space-y-1">
                      {q.answers.map((a, j) => (
                        <div
                          key={j}
                          className={cn(
                            "flex items-center justify-between text-xs px-3 py-2 rounded-lg border transition-all",
                            selectedAnswerIdx === j
                              ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-200"
                              : "bg-slate-800/40 border-slate-700/30 text-slate-500"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {selectedAnswerIdx === j && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                            {a.text}
                          </span>
                          <span className="font-bold">{a.points}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5">
                      {q.answers.map((a, j) => {
                        const disabledByTeam1 = j === team1AnswerIdx;
                        return (
                          <motion.button
                            key={j}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { onSelectFM2(i, j); setTimeout(() => onRevealFM2(i), 100); }}
                            disabled={disabledByTeam1}
                            className={cn(
                              "flex items-center justify-between text-xs px-3 py-2.5 rounded-lg border transition-all text-right",
                              disabledByTeam1
                                ? "opacity-40 line-through pointer-events-none bg-red-900/20 border-red-500/20 text-slate-500"
                                : "bg-slate-800/60 border-slate-700/40 hover:border-rose-400/50 hover:bg-rose-900/20 text-slate-300 hover:text-rose-200 cursor-pointer"
                            )}
                          >
                            <span>{a.text}</span>
                            <span className={cn("font-bold", disabledByTeam1 ? "text-slate-600" : "text-rose-400/60")}>{a.points}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button
          onClick={() => {
            setPhase("results");
            onPhaseChange("results");
          }}
          className="bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold h-10"
        >
          عرض النتائج
          <Trophy className="w-4 h-4 mr-2" />
        </Button>
      </div>
    );
  }

  // Results phase - handled by parent
  return null;
}

// ============================================================
// GAME OVER SCREEN
// ============================================================
function GameOverScreen({
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  team1Emoji,
  team2Emoji,
  onRestart,
  onHome,
  roundHistory,
  gameStats,
  regularRoundScore1,
  regularRoundScore2,
}: {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  team1Emoji: string;
  team2Emoji: string;
  onRestart: () => void;
  onHome: () => void;
  roundHistory: { round: number; team: 1 | 2; points: number; type: string }[];
  gameStats: {
    team1Correct: number;
    team2Correct: number;
    team1Strikes: number;
    team2Strikes: number;
    totalSteals: number;
    successfulSteals: number;
    fastMoneyScore1: number;
    fastMoneyScore2: number;
  };
  regularRoundScore1: number;
  regularRoundScore2: number;
}) {
  const winner =
    team1Score > team2Score
      ? team1Name
      : team2Score > team1Score
        ? team2Name
        : null;
  const isTie = team1Score === team2Score;

  // Calculate fast money scores from the difference
  const fastMoneyOnly1 = team1Score - regularRoundScore1;
  const fastMoneyOnly2 = team2Score - regularRoundScore2;

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <AnimatedGridBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full relative z-10"
      >
        {/* Confetti on winning team side only */}
        {!isTie && team1Score > team2Score && (
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
            <ConfettiOverlay />
          </div>
        )}
        {!isTie && team2Score > team1Score && (
          <div className="absolute top-0 left-0 w-1/2 h-full pointer-events-none overflow-hidden">
            <ConfettiOverlay />
          </div>
        )}
        {isTie && <ConfettiOverlay />}

        {/* Trophy slides in from top */}
        <motion.div
          initial={{ y: -200, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="relative inline-block mb-4"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-7xl"
            style={{ filter: "drop-shadow(0 0 20px rgba(251,191,36,0.4))" }}
          >
            🏆
          </motion.div>
          {/* Glow behind trophy */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 -m-4 bg-amber-500/10 rounded-full blur-xl pointer-events-none"
          />
        </motion.div>

        <h2 className="text-3xl sm:text-4xl font-black mb-4">
          {isTie ? (
            <span className="bg-gradient-to-l from-slate-300 to-slate-400 bg-clip-text text-transparent">
              تعادل!
            </span>
          ) : (
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 15px rgba(251,191,36,0.3))" }}
            >
              فاز {winner}! 🎉
            </motion.span>
          )}
        </h2>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card
              className={cn(
                "relative overflow-hidden",
                team1Score >= team2Score && !isTie
                  ? "bg-amber-950/40 border-amber-500/40 shadow-lg shadow-amber-500/20"
                  : "bg-slate-900/60 border-slate-800/30"
              )}
            >
              {team1Score >= team2Score && !isTie && (
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none"
                />
              )}
              <CardContent className="p-4 relative z-10">
                <p className="text-2xl mb-1">{team1Emoji}</p>
                <p className="text-sm font-bold text-amber-300">{team1Name}</p>
                {/* Score breakdown */}
                <div className="mt-1 mb-1 space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">الجولات العادية</span>
                    <span className="font-bold text-slate-300">{regularRoundScore1}</span>
                  </div>
                  {fastMoneyOnly1 > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-400">💰 المال السريع</span>
                      <span className="font-bold text-emerald-400">+{fastMoneyOnly1}</span>
                    </div>
                  )}
                </div>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                  className="text-3xl font-black text-amber-400 tabular-nums"
                  style={{ textShadow: "0 0 12px rgba(251,191,36,0.3)" }}
                >
                  {team1Score}
                </motion.p>
                {team1Score >= team2Score && !isTie && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                  >
                    <Badge className="mt-2 bg-gradient-to-l from-amber-600 to-yellow-500 text-white text-[10px] px-2 py-0.5">
                      🏆 الفائز
                    </Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card
              className={cn(
                "relative overflow-hidden",
                team2Score > team1Score && !isTie
                  ? "bg-rose-950/40 border-rose-500/40 shadow-lg shadow-rose-500/20"
                  : "bg-slate-900/60 border-slate-800/30"
              )}
            >
              {team2Score > team1Score && !isTie && (
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent pointer-events-none"
                />
              )}
              <CardContent className="p-4 relative z-10">
                <p className="text-2xl mb-1">{team2Emoji}</p>
                <p className="text-sm font-bold text-rose-300">{team2Name}</p>
                {/* Score breakdown */}
                <div className="mt-1 mb-1 space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">الجولات العادية</span>
                    <span className="font-bold text-slate-300">{regularRoundScore2}</span>
                  </div>
                  {fastMoneyOnly2 > 0 && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-emerald-400">💰 المال السريع</span>
                      <span className="font-bold text-emerald-400">+{fastMoneyOnly2}</span>
                    </div>
                  )}
                </div>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring", stiffness: 300 }}
                  className="text-3xl font-black text-rose-400 tabular-nums"
                  style={{ textShadow: "0 0 12px rgba(244,63,94,0.3)" }}
                >
                  {team2Score}
                </motion.p>
                {team2Score > team1Score && !isTie && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.2, type: "spring" }}
                  >
                    <Badge className="mt-2 bg-gradient-to-l from-rose-600 to-pink-500 text-white text-[10px] px-2 py-0.5">
                      🏆 الفائز
                    </Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Animated Bar Chart */}
        <AnimatedBarChart
          team1Score={team1Score}
          team2Score={team2Score}
          team1Name={team1Name}
          team2Name={team2Name}
          show={true}
        />

        {/* Most Valuable Round Highlight */}
        {roundHistory.length > 0 && (() => {
          const bestRound = roundHistory.reduce((best, rh) => rh.points > best.points ? rh : best, roundHistory[0]);
          return bestRound.points > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.1, type: "spring", stiffness: 200 }}
              className="mt-4"
            >
              <div className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-l from-amber-600/20 via-yellow-500/10 to-amber-600/20 border border-amber-500/40 shadow-lg shadow-amber-500/10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xl"
                >
                  🏆
                </motion.div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-amber-400/70">أعلى نقطة في جولة واحدة</p>
                  <p className="text-sm font-black">
                    <span className="bg-gradient-to-l from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                      ج{bestRound.round}
                    </span>
                    <span className="text-slate-500 mx-1">·</span>
                    <span className="text-amber-200">{bestRound.type}</span>
                    <span className="text-slate-500 mx-1">·</span>
                    <Badge className="bg-gradient-to-l from-amber-600 to-yellow-500 text-white text-xs px-2 py-0.5 font-black">
                      +{bestRound.points}
                    </Badge>
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null;
        })()}

        {/* Score Difference Indicator */}
        {!isTie && winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, type: "spring" }}
            className="mt-4 mb-6"
          >
            <Badge className="bg-gradient-to-l from-amber-600 to-yellow-500 text-white px-4 py-1.5 text-sm font-black">
              📊 فارق {Math.abs(team1Score - team2Score)} نقطة
            </Badge>
          </motion.div>
        )}

        {/* Game Statistics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-5 mb-5"
        >
          <p className="text-xs font-bold text-slate-400 text-center mb-2">📋 إحصائيات اللعبة</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "✅", label: `${team1Emoji} إجابات صحيحة`, value: gameStats.team1Correct, color: "text-amber-300" },
              { icon: "✅", label: `${team2Emoji} إجابات صحيحة`, value: gameStats.team2Correct, color: "text-rose-300" },
              { icon: "❌", label: `${team1Emoji} إخفاقات`, value: gameStats.team1Strikes, color: "text-amber-300" },
              { icon: "❌", label: `${team2Emoji} إخفاقات`, value: gameStats.team2Strikes, color: "text-rose-300" },
              { icon: "🎯", label: "محاولات سرقة", value: gameStats.totalSteals, color: "text-purple-300" },
              { icon: "🏆", label: "سرقات ناجحة", value: gameStats.successfulSteals, color: "text-emerald-300" },
              { icon: "💰", label: `${team1Emoji} المال السريع`, value: gameStats.fastMoneyScore1, color: "text-amber-300" },
              { icon: "💰", label: `${team2Emoji} المال السريع`, value: gameStats.fastMoneyScore2, color: "text-rose-300" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4 + i * 0.06 }}
                className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-2.5 text-center"
              >
                <span className="text-sm">{stat.icon}</span>
                <p className="text-lg font-black tabular-nums mt-0.5" style={{ color: "inherit" }}>
                  <span className={stat.color}>{stat.value}</span>
                </p>
                <p className="text-[9px] text-slate-500 truncate">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onRestart}
            className="flex-1 relative overflow-hidden bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold py-5 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"
            />
            <span className="relative flex items-center justify-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              لعب مرة أخرى 🔄
            </span>
          </motion.button>
          <Button
            onClick={onHome}
            variant="outline"
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 py-5"
          >
            <HomeIcon className="w-4 h-4 ml-1" />
            الرئيسية
          </Button>
        </div>

        {/* Round History */}
        {roundHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-right"
          >
            <p className="text-xs text-slate-500 font-bold mb-2 text-center">📊 ملخص الجولات</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {roundHistory.map((rh, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border",
                    rh.team === 1
                      ? "bg-amber-950/60 border-amber-500/30 text-amber-300"
                      : "bg-rose-950/60 border-rose-500/30 text-rose-300"
                  )}
                >
                  <span>{rh.type === "سرقة" ? "🎯" : rh.type === "محفوظ" ? "🛡️" : rh.type === "كشف" ? "👁️" : "⚡"}</span>
                  <span>ج{rh.round}</span>
                  <span>+{rh.points}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function FamilyFeudPage() {
  return (
    <SubscriptionGuard gameSlug="familyfeud">
      <GameLayout gameSlug="familyfeud" gameName="فاميلي فيود" gameEmoji="🏆" accentColor="amber">
        <FamilyFeudContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function FamilyFeudContent() {
  const mounted = useHydrated();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playCorrect, playBuzz, playStrike, playReveal, playSteal, playWin, playCountdown, playTopAnswer } = useSoundEffects(soundEnabled);

  // Navigation state
  const [uiPhase, setUiPhase] = useState<
    "landing" | "godfather_setup" | "diwaniya_setup" | "game"
  >("landing");

  // Game state
  const [team1Name, setTeam1Name] = useState("فريق 1");
  const [team2Name, setTeam2Name] = useState("فريق 2");
  const [team1Emoji, setTeam1Emoji] = useState("👑");
  const [team2Emoji, setTeam2Emoji] = useState("🏛️");
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [currentTeam, setCurrentTeam] = useState<1 | 2>(1);
  const [strikes, setStrikes] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);
  const [stealTimerDuration, setStealTimerDuration] = useState(0);
  const [roundTimerDuration, setRoundTimerDuration] = useState(0);
  const [gamePhase, setGamePhase] = useState<"faceoff" | "gameboard" | "steal" | "fast_money" | "game_over">("faceoff");

  // Score change animation
  const [scoreChangeAnimation, setScoreChangeAnimation] = useState<{
    team: 1 | 2;
    points: number;
    visible: boolean;
  }>({ team: 1, points: 0, visible: false });
  const scoreAnimTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showScoreAnimation = useCallback((team: 1 | 2, points: number) => {
    if (scoreAnimTimerRef.current) clearTimeout(scoreAnimTimerRef.current);
    setScoreChangeAnimation({ team, points, visible: true });
    scoreAnimTimerRef.current = setTimeout(() => {
      setScoreChangeAnimation((prev) => ({ ...prev, visible: false }));
    }, 1500);
  }, []);

  // Questions
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);
  const [roundScore, setRoundScore] = useState(0);

  // Fast Money
  const [fmQuestions, setFmQuestions] = useState<Question[]>([]);
  const [fmAnswers1, setFmAnswers1] = useState<string[]>([]);
  const [fmAnswers2, setFmAnswers2] = useState<string[]>([]);
  const [fmRevealed1, setFmRevealed1] = useState<boolean[]>([]);
  const [fmRevealed2, setFmRevealed2] = useState<boolean[]>([]);
  const [fmScore1, setFmScore1] = useState(0);
  const [fmScore2, setFmScore2] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerRunning, setTimerRunning] = useState(false);
  const [fmPhase, setFmPhase] = useState<"intro" | "team1" | "team2" | "results">("intro");
  const [fmSelected1, setFmSelected1] = useState<number[]>([]);
  const [fmSelected2, setFmSelected2] = useState<number[]>([]);
  const [showGameOver, setShowGameOver] = useState(false);

  // Track regular round scores (before fast money) for score breakdown display
  const [regularRoundScore1, setRegularRoundScore1] = useState(0);
  const [regularRoundScore2, setRegularRoundScore2] = useState(0);
  const regularRoundScore1Ref = useRef(0);
  const regularRoundScore2Ref = useRef(0);

  // Feedback
  const [feedback, setFeedback] = useState<{
    show: boolean;
    correct: boolean;
    answer?: string;
  }>({ show: false, correct: false });

  // Streak tracking for answer reveals
  const revealStreakRef = useRef(0);
  const revealStreakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [revealStreak, setRevealStreak] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for bug-free steal logic
  const strikesTeamRef = useRef<1 | 2>(1); // Which team got 3 strikes
  const roundPointsAwardedRef = useRef(false); // Whether points were awarded this round

  // Round result display
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundResultType, setRoundResultType] = useState<"steal_success" | "steal_fail" | "round_complete">("round_complete");
  const [roundResultTeamName, setRoundResultTeamName] = useState("");
  const [roundResultPoints, setRoundResultPoints] = useState(0);

  // Round history
  const [roundHistory, setRoundHistory] = useState<{ round: number; team: 1 | 2; points: number; type: string }[]>([]);

  // Game statistics
  const [gameStats, setGameStats] = useState({
    team1Correct: 0,
    team2Correct: 0,
    team1Strikes: 0,
    team2Strikes: 0,
    totalSteals: 0,
    successfulSteals: 0,
    fastMoneyScore1: 0,
    fastMoneyScore2: 0,
  });

  // Round timer
  const [roundTimeLeft, setRoundTimeLeft] = useState(0);
  const [roundTimerRunning, setRoundTimerRunning] = useState(false);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Difficulty filter
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // 300+ celebration
  const [celebration300, setCelebration300] = useState<{ show: boolean; teamName: string }>({ show: false, teamName: '' });
  const prevTeam1ScoreRef = useRef(0);
  const prevTeam2ScoreRef = useRef(0);

  // Hint system
  const [hintsUsedThisRound, setHintsUsedThisRound] = useState(0);
  const hintsUsedThisRoundRef = useRef(0);

  // Exit confirmation dialog
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Skip question confirmation
  const skipConfirmRef = useRef(false);

  // Ref for internal strike to avoid ordering issues
  const handleAddStrikeInternalRef = useRef<() => void>(() => {});

  // LocalStorage keys for tracking used questions across games
  const USED_QUESTIONS_KEY = "familyfeud_used_questions";
  const USED_FM_QUESTIONS_KEY = "familyfeud_used_fm_questions";

  // Shuffle and pick questions
  const initializeQuestions = useCallback(() => {
    // Filter questions by difficulty
    const filtered = difficultyFilter === 'all'
      ? ALL_QUESTIONS
      : ALL_QUESTIONS.filter((q) => {
          const totalPts = q.answers.reduce((sum, a) => sum + a.points, 0);
          return getQuestionDifficulty(totalPts) === difficultyFilter;
        });
    const pool = filtered.length >= totalRounds ? filtered : ALL_QUESTIONS;

    // Track used questions across games
    let usedIndices: number[] = [];
    let usedFmIndices: number[] = [];
    try {
      usedIndices = JSON.parse(localStorage.getItem(USED_QUESTIONS_KEY) || '[]');
      usedFmIndices = JSON.parse(localStorage.getItem(USED_FM_QUESTIONS_KEY) || '[]');
    } catch {}

    // Filter regular questions to exclude recently used ones
    let filteredPool = pool.filter((q) => {
      const idx = ALL_QUESTIONS.indexOf(q);
      return idx === -1 || !usedIndices.includes(idx);
    });
    // If remaining pool is too small, reset used history
    if (filteredPool.length < totalRounds) {
      usedIndices = [];
      filteredPool = pool;
    }
    const shuffled = [...filteredPool].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, totalRounds).map((q) => {
      const totalPts = q.answers.reduce((sum, a) => sum + a.points, 0);
      return {
        ...q,
        difficulty: q.difficulty || getQuestionDifficulty(totalPts),
        answers: q.answers.map((a) => ({ ...a, revealed: false })),
      };
    });
    setSelectedQuestions(picked);

    // Save used regular question indices
    const newUsedIndices = [...usedIndices];
    picked.forEach((q) => {
      const idx = ALL_QUESTIONS.findIndex((aq) => aq.question === q.question);
      if (idx !== -1 && !newUsedIndices.includes(idx)) {
        newUsedIndices.push(idx);
      }
    });
    // Keep last 100 used indices max
    try {
      localStorage.setItem(USED_QUESTIONS_KEY, JSON.stringify(newUsedIndices.slice(-100)));
    } catch {}

    // Filter fast money questions to exclude recently used ones
    const fmNeeded = Math.min(5, FAST_MONEY_QUESTIONS.length);
    let filteredFmPool = FAST_MONEY_QUESTIONS.filter((q) => {
      const idx = FAST_MONEY_QUESTIONS.indexOf(q);
      return idx === -1 || !usedFmIndices.includes(idx);
    });
    if (filteredFmPool.length < fmNeeded) {
      usedFmIndices = [];
      filteredFmPool = FAST_MONEY_QUESTIONS;
    }
    const fmShuffled = [...filteredFmPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, fmNeeded)
      .map((q) => ({
        ...q,
        answers: q.answers.map((a) => ({ ...a, revealed: false })),
      }));
    setFmQuestions(fmShuffled);

    // Save used fast money question indices
    const newUsedFmIndices = [...usedFmIndices];
    fmShuffled.forEach((q) => {
      const idx = FAST_MONEY_QUESTIONS.findIndex((fq) => fq.question === q.question);
      if (idx !== -1 && !newUsedFmIndices.includes(idx)) {
        newUsedFmIndices.push(idx);
      }
    });
    try {
      localStorage.setItem(USED_FM_QUESTIONS_KEY, JSON.stringify(newUsedFmIndices.slice(-50)));
    } catch {}
  }, [totalRounds, difficultyFilter]);

  // Start game
  const handleStartGame = useCallback(
    (settings: { team1Name: string; team2Name: string; team1Emoji: string; team2Emoji: string; totalRounds: number; stealTimer: number; roundTimer: number; difficultyFilter: 'all' | 'easy' | 'medium' | 'hard' }) => {
      setTeam1Name(settings.team1Name);
      setTeam2Name(settings.team2Name);
      setTeam1Emoji(settings.team1Emoji);
      setTeam2Emoji(settings.team2Emoji);
      setTeam1Score(0);
      setTeam2Score(0);
      setRound(1);
      setCurrentTeam(1);
      setStrikes(0);
      setTotalRounds(settings.totalRounds);
      setStealTimerDuration(settings.stealTimer);
      setRoundTimerDuration(settings.roundTimer);
      setDifficultyFilter(settings.difficultyFilter);
      setCelebration300({ show: false, teamName: '' });
      prevTeam1ScoreRef.current = 0;
      prevTeam2ScoreRef.current = 0;
      setHintsUsedThisRound(0);
      hintsUsedThisRoundRef.current = 0;
      setGamePhase("faceoff");
      setUiPhase("game");
      setShowGameOver(false);
      setGameStats({
        team1Correct: 0,
        team2Correct: 0,
        team1Strikes: 0,
        team2Strikes: 0,
        totalSteals: 0,
        successfulSteals: 0,
        fastMoneyScore1: 0,
        fastMoneyScore2: 0,
      });
      initializeQuestions();
    },
    [initializeQuestions, difficultyFilter]
  );

  // ============================
  // GAME STATE PERSISTENCE (localStorage)
  // ============================
  const SAVE_KEY = "familyfeud_game_state";

  const saveGameState = useCallback(() => {
    if (uiPhase !== "game") return;
    try {
      const state = {
        team1Name, team2Name, team1Emoji, team2Emoji,
        team1Score, team2Score, currentTeam, strikes, round, totalRounds,
        stealTimerDuration, roundTimerDuration, gamePhase,
        selectedQuestions, currentAnswers, roundScore,
        fmQuestions, fmAnswers1, fmAnswers2, fmRevealed1, fmRevealed2,
        fmScore1, fmScore2, fmPhase, fmSelected1, fmSelected2,
        showGameOver, roundHistory, gameStats,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {}
  }, [uiPhase, team1Name, team2Name, team1Emoji, team2Emoji, team1Score, team2Score, currentTeam, strikes, round, totalRounds, stealTimerDuration, roundTimerDuration, gamePhase, selectedQuestions, currentAnswers, roundScore, fmQuestions, fmAnswers1, fmAnswers2, fmRevealed1, fmRevealed2, fmScore1, fmScore2, fmPhase, fmSelected1, fmSelected2, showGameOver, roundHistory, gameStats]);

  // Save state on every relevant change (debounced)
  useEffect(() => {
    if (uiPhase !== "game") return;
    const t = setTimeout(saveGameState, 500);
    return () => clearTimeout(t);
  }, [uiPhase, saveGameState, team1Score, team2Score, round, gamePhase, strikes, currentTeam, currentAnswers, fmScore1, fmScore2, fmPhase]);

  // Restore saved game state on mount
  const savedGameRef = useRef(false);
  useEffect(() => {
    if (savedGameRef.current) return;
    savedGameRef.current = true;
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (!saved) return;
      const state = JSON.parse(saved);
      if (state && state.uiPhase === "game" && state.selectedQuestions?.length > 0) {
        setTimeout(() => {
          setTeam1Name(state.team1Name || "فريق 1");
          setTeam2Name(state.team2Name || "فريق 2");
          setTeam1Emoji(state.team1Emoji || "👑");
          setTeam2Emoji(state.team2Emoji || "🏛️");
          setTeam1Score(state.team1Score || 0);
          setTeam2Score(state.team2Score || 0);
          setCurrentTeam(state.currentTeam || 1);
          setStrikes(state.strikes || 0);
          setRound(state.round || 1);
          setTotalRounds(state.totalRounds || 5);
          setStealTimerDuration(state.stealTimerDuration || 0);
          setRoundTimerDuration(state.roundTimerDuration || 0);
          setGamePhase(state.gamePhase || "faceoff");
          setSelectedQuestions(state.selectedQuestions || []);
          setCurrentAnswers(state.currentAnswers || []);
          setRoundScore(state.roundScore || 0);
          setFmQuestions(state.fmQuestions || []);
          setFmAnswers1(state.fmAnswers1 || []);
          setFmAnswers2(state.fmAnswers2 || []);
          setFmRevealed1(state.fmRevealed1 || []);
          setFmRevealed2(state.fmRevealed2 || []);
          setFmScore1(state.fmScore1 || 0);
          setFmScore2(state.fmScore2 || 0);
          setFmPhase(state.fmPhase || "intro");
          setFmSelected1(state.fmSelected1 || []);
          setFmSelected2(state.fmSelected2 || []);
          setShowGameOver(state.showGameOver || false);
          setRoundHistory(state.roundHistory || []);
          setGameStats(state.gameStats || { team1Correct: 0, team2Correct: 0, team1Strikes: 0, team2Strikes: 0, totalSteals: 0, successfulSteals: 0, fastMoneyScore1: 0, fastMoneyScore2: 0 });
          setUiPhase("game");
        }, 0);
      }
    } catch {}
  }, []);

  // Clear saved state on exit / reset
  const clearSavedState = useCallback(() => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
  }, []);

  // Handle exit to home
  const handleExitToHome = useCallback(() => {
    clearSavedState();
    setShowExitDialog(false);
    window.location.href = "/";
  }, [clearSavedState]);

  // Setup current round
  useEffect(() => {
    if (round <= totalRounds && selectedQuestions.length > 0) {
      const q = selectedQuestions[round - 1];
      if (q) {
        roundPointsAwardedRef.current = false;
        const t = setTimeout(() => {
          setCurrentAnswers(q.answers.map((a) => ({ ...a, revealed: false })));
          setRoundScore(0);
          // Start round timer if enabled
          if (roundTimerDuration > 0) {
            setRoundTimeLeft(roundTimerDuration);
            setRoundTimerRunning(true);
          }
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [round, selectedQuestions, totalRounds, roundTimerDuration]);

  // Round timer countdown
  useEffect(() => {
    if (roundTimerRunning && roundTimeLeft > 0 && gamePhase === "gameboard") {
      if (roundTimeLeft <= 5) playCountdown();
      roundTimerRef.current = setTimeout(() => {
        setRoundTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (roundTimerRunning && roundTimeLeft === 0 && gamePhase === "gameboard") {
      roundTimerRef.current = setTimeout(() => {
        setRoundTimerRunning(false);
        playBuzz();
        handleAddStrikeInternalRef.current();
      }, 0);
    }
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, [roundTimerRunning, roundTimeLeft, gamePhase, playCountdown, playBuzz]);

  // Internal strike handler (without useCallback dependency)
  const handleAddStrikeInternal = useCallback(() => {
    setStrikes((prev) => {
      const newStrikes = prev + 1;
      if (newStrikes >= 3) {
        strikesTeamRef.current = currentTeam;
        playSteal();
        setGamePhase("steal");
      }
      return newStrikes;
    });
    setFeedback({ show: true, correct: false });
    setTimeout(() => setFeedback({ show: false, correct: false }), 1500);
    // Track stats
    setGameStats((prev) => ({
      ...prev,
      [currentTeam === 1 ? "team1Strikes" : "team2Strikes"]: prev[currentTeam === 1 ? "team1Strikes" : "team2Strikes"] + 1,
    }));
  }, [currentTeam, playSteal]);

  // Keep ref in sync
  useEffect(() => {
    handleAddStrikeInternalRef.current = handleAddStrikeInternal;
  }, [handleAddStrikeInternal]);

  // Handle face-off team selection
  const handleFaceOffStart = useCallback(
    (team: 1 | 2) => {
      setCurrentTeam(team);
      setStrikes(0);
      setGamePhase("gameboard");
    },
    []
  );

  // Reveal answer
  const handleRevealAnswer = useCallback(
    (index: number) => {
      setCurrentAnswers((prev) => {
        const updated = [...prev];
        if (!updated[index].revealed) {
          updated[index] = { ...updated[index], revealed: true };
          setRoundScore((rs) => rs + updated[index].points);
          setFeedback({
            show: true,
            correct: true,
            answer: `${updated[index].text} - ${updated[index].points} نقاط`,
          });
          setTimeout(() => setFeedback({ show: false, correct: false }), 1500);
          playReveal();
          setTimeout(() => playCorrect(), 200);

          // Top answer celebration sound (#1 answer by index)
          if (index === 0) {
            setTimeout(() => playTopAnswer(), 350);
          }

          // Streak tracking
          revealStreakRef.current += 1;
          setRevealStreak(revealStreakRef.current);
          if (revealStreakTimerRef.current) clearTimeout(revealStreakTimerRef.current);
          revealStreakTimerRef.current = setTimeout(() => {
            revealStreakRef.current = 0;
            setRevealStreak(0);
          }, 3000);

          // Track stats
          setGameStats((prev) => ({
            ...prev,
            [currentTeam === 1 ? "team1Correct" : "team2Correct"]: prev[currentTeam === 1 ? "team1Correct" : "team2Correct"] + 1,
          }));
        }
        return updated;
      });
    },
    [playReveal, playCorrect, playTopAnswer, currentTeam]
  );

  // Add strike
  const handleAddStrike = useCallback(() => {
    playStrike();
    setStrikes((prev) => {
      const newStrikes = prev + 1;
      if (newStrikes >= 3) {
        strikesTeamRef.current = currentTeam;
        playSteal();
        setGamePhase("steal");
        setGameStats((prev2) => ({ ...prev2, totalSteals: prev2.totalSteals + 1 }));
      }
      return newStrikes;
    });
    setFeedback({ show: true, correct: false });
    setTimeout(() => setFeedback({ show: false, correct: false }), 1500);
    // Track stats
    setGameStats((prev) => ({
      ...prev,
      [currentTeam === 1 ? "team1Strikes" : "team2Strikes"]: prev[currentTeam === 1 ? "team1Strikes" : "team2Strikes"] + 1,
    }));
    // Stop round timer on strike
    setRoundTimerRunning(false);
  }, [playStrike, playSteal, currentTeam]);

  // Pass to other team
  const handlePassToOtherTeam = useCallback(() => {
    setCurrentTeam((prev) => (prev === 1 ? 2 : 1));
    setStrikes(0);
  }, []);

  // Handle steal
  // Next round
  const handleNextRound = useCallback(() => {
    // Reset hints for new round
    setHintsUsedThisRound(0);
    hintsUsedThisRoundRef.current = 0;
    if (round >= totalRounds) {
      // Save regular round scores before entering fast money
      regularRoundScore1Ref.current = team1Score;
      regularRoundScore2Ref.current = team2Score;
      setRegularRoundScore1(team1Score);
      setRegularRoundScore2(team2Score);
      setGamePhase("fast_money");
      setFmPhase("intro");
      setFmAnswers1(Array(5).fill(""));
      setFmAnswers2(Array(5).fill(""));
      setFmRevealed1(Array(5).fill(false));
      setFmRevealed2(Array(5).fill(false));
      setFmScore1(0);
      setFmScore2(0);
      setFmSelected1([]);
      setFmSelected2([]);
      setTimerRunning(false);
      setTimeLeft(20);
    } else {
      setRound((prev) => prev + 1);
      setStrikes(0);
      setGamePhase("faceoff");
    }
  }, [round, totalRounds, team1Score, team2Score]);

  // Award round points (if not yet awarded) then go to next round
  const handleAwardAndNextRound = useCallback(() => {
    if (!roundPointsAwardedRef.current && currentAnswers.length > 0) {
      const allPoints = currentAnswers.reduce((sum, a) => sum + a.points, 0);
      if (currentTeam === 1) {
        setTeam1Score((prev) => prev + allPoints);
      } else {
        setTeam2Score((prev) => prev + allPoints);
      }
      roundPointsAwardedRef.current = true;
      showScoreAnimation(currentTeam, allPoints);
      playCorrect();

      // Track history
      setRoundHistory((prev) => [...prev, { round, team: currentTeam, points: allPoints, type: "كامل" }]);

      // Show result card briefly
      setRoundResultType("round_complete");
      setRoundResultTeamName(currentTeam === 1 ? team1Name : team2Name);
      setRoundResultPoints(allPoints);
      setShowRoundResult(true);
      setTimeout(() => setShowRoundResult(false), 1500);
    }
    handleNextRound();
  }, [currentAnswers, currentTeam, handleNextRound, playCorrect, round, team1Name, team2Name, showScoreAnimation]);

  // Handle steal (successful) - OTHER team gets ALL round points
  const handleSteal = useCallback(() => {
    const teamThatGotStrikes = strikesTeamRef.current;
    const stealingTeam: 1 | 2 = teamThatGotStrikes === 1 ? 2 : 1;
    const allPoints = currentAnswers.reduce((sum, a) => sum + a.points, 0);

    if (stealingTeam === 1) {
      setTeam1Score((prev) => prev + allPoints);
    } else {
      setTeam2Score((prev) => prev + allPoints);
    }
    showScoreAnimation(stealingTeam, allPoints);

    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    setRoundScore(0);
    roundPointsAwardedRef.current = true;
    playCorrect();
    // Stop round timer
    setRoundTimerRunning(false);

    // Show big result card
    const stealingTeamName = stealingTeam === 1 ? team1Name : team2Name;
    setRoundResultType("steal_success");
    setRoundResultTeamName(stealingTeamName);
    setRoundResultPoints(allPoints);
    setShowRoundResult(true);

    // Track history
    setRoundHistory((prev) => [...prev, { round, team: stealingTeam, points: allPoints, type: "سرقة" }]);

    // Track stats - successful steal
    setGameStats((prev) => ({ ...prev, successfulSteals: prev.successfulSteals + 1 }));

    setTimeout(() => {
      setShowRoundResult(false);
      handleNextRound();
    }, 2800);
  }, [currentAnswers, team1Name, team2Name, handleNextRound, playCorrect, round, showScoreAnimation]);

  // No steal (failed steal) - ORIGINAL team keeps revealed points
  const handleNoSteal = useCallback(() => {
    const teamThatGotStrikes = strikesTeamRef.current;
    const revealedPoints = currentAnswers
      .filter((a) => a.revealed)
      .reduce((sum, a) => sum + a.points, 0);

    if (teamThatGotStrikes === 1) {
      setTeam1Score((prev) => prev + revealedPoints);
    } else {
      setTeam2Score((prev) => prev + revealedPoints);
    }
    showScoreAnimation(teamThatGotStrikes, revealedPoints);

    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    setRoundScore(0);
    roundPointsAwardedRef.current = true;
    playStrike();

    // Show big result card
    const originalTeamName = teamThatGotStrikes === 1 ? team1Name : team2Name;
    setRoundResultType("steal_fail");
    setRoundResultTeamName(originalTeamName);
    setRoundResultPoints(revealedPoints);
    setShowRoundResult(true);

    // Track history
    setRoundHistory((prev) => [...prev, { round, team: teamThatGotStrikes, points: revealedPoints, type: "محفوظ" }]);

    setTimeout(() => {
      setShowRoundResult(false);
      handleNextRound();
    }, 2800);
  }, [currentAnswers, team1Name, team2Name, handleNextRound, playStrike, round, showScoreAnimation]);

  // Reveal all
  const handleRevealAll = useCallback(() => {
    const points = currentAnswers.reduce((sum, a) => {
      if (!a.revealed) return sum + a.points;
      return sum;
    }, 0);
    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    const totalAwarded = roundScore + points;
    if (currentTeam === 1) {
      setTeam1Score((prev) => prev + totalAwarded);
    } else {
      setTeam2Score((prev) => prev + totalAwarded);
    }
    showScoreAnimation(currentTeam, totalAwarded);
    roundPointsAwardedRef.current = true;
    setRoundScore(0);

    // Track history
    setRoundHistory((prev) => [...prev, { round, team: currentTeam, points: totalAwarded, type: "كشف" }]);

    // Show result card
    setRoundResultType("round_complete");
    setRoundResultTeamName(currentTeam === 1 ? team1Name : team2Name);
    setRoundResultPoints(totalAwarded);
    setShowRoundResult(true);
    setTimeout(() => setShowRoundResult(false), 2500);
  }, [currentAnswers, currentTeam, roundScore, round, team1Name, team2Name, showScoreAnimation]);

  // Use hint: reveal a random unrevealed answer with half points
  const handleUseHint = useCallback(() => {
    if (hintsUsedThisRoundRef.current >= 2) return;
    const unrevealedIndices = currentAnswers
      .map((a, i) => (!a.revealed ? i : -1))
      .filter((i) => i >= 0);
    if (unrevealedIndices.length === 0) return;
    const randomIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
    const answer = currentAnswers[randomIdx];
    const halfPoints = Math.floor(answer.points / 2);
    setCurrentAnswers((prev) => {
      const updated = [...prev];
      updated[randomIdx] = { ...updated[randomIdx], revealed: true };
      return updated;
    });
    setRoundScore((rs) => rs + halfPoints);
    setHintsUsedThisRound((prev) => prev + 1);
    hintsUsedThisRoundRef.current += 1;
    setFeedback({
      show: true,
      correct: true,
      answer: `💡 تلميح: ${answer.text} - ${halfPoints} نقاط (النصف)`,
    });
    setTimeout(() => setFeedback({ show: false, correct: false }), 2000);
    playReveal();
  }, [currentAnswers, playReveal]);

  // 300+ points celebration effect
  useEffect(() => {
    if (prevTeam1ScoreRef.current < 300 && team1Score >= 300) {
      requestAnimationFrame(() => {
        setCelebration300({ show: true, teamName: team1Name });
      });
      playWin();
      const t = setTimeout(() => setCelebration300({ show: false, teamName: '' }), 3000);
      return () => clearTimeout(t);
    }
    if (prevTeam2ScoreRef.current < 300 && team2Score >= 300) {
      requestAnimationFrame(() => {
        setCelebration300({ show: true, teamName: team2Name });
      });
      playWin();
      const t = setTimeout(() => setCelebration300({ show: false, teamName: '' }), 3000);
      return () => clearTimeout(t);
    }
    prevTeam1ScoreRef.current = team1Score;
    prevTeam2ScoreRef.current = team2Score;
  }, [team1Score, team2Score, team1Name, team2Name, playWin]);

  // Reset hints on round change (integrated into next round flow via ref)

  // Skip question (reveal all, 0 points, next round)
  const handleSkipQuestion = useCallback(() => {
    if (!skipConfirmRef.current) {
      skipConfirmRef.current = true;
      setTimeout(() => { skipConfirmRef.current = false; }, 3000);
      return;
    }
    skipConfirmRef.current = false;
    // Reveal all answers without awarding points
    setCurrentAnswers((prev) => prev.map((a) => ({ ...a, revealed: true })));
    roundPointsAwardedRef.current = true;
    setRoundScore(0);
    setRoundTimerRunning(false);
    // Record in round history with 0 points
    setRoundHistory((prev) => [...prev, { round, team: currentTeam, points: 0, type: "تخطي" }]);
    // Move to next round after a brief delay
    setTimeout(() => {
      if (round >= totalRounds) {
        setGamePhase("fast_money");
        setFmPhase("intro");
        setFmAnswers1(Array(5).fill(""));
        setFmAnswers2(Array(5).fill(""));
        setFmRevealed1(Array(5).fill(false));
        setFmRevealed2(Array(5).fill(false));
        setFmScore1(0);
        setFmScore2(0);
        setFmSelected1([]);
        setFmSelected2([]);
        setTimerRunning(false);
        setTimeLeft(20);
      } else {
        setRound((prev) => prev + 1);
        setStrikes(0);
        setGamePhase("faceoff");
      }
    }, 1500);
  }, [round, totalRounds, currentTeam]);

  // Timer for Fast Money
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      if (timeLeft <= 5) {
        playCountdown();
      }
      timerRef.current = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerRunning && timeLeft === 0) {
      timerRef.current = setTimeout(() => {
        setTimerRunning(false);
        playBuzz();
      }, 0);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timerRunning, timeLeft, playCountdown, playBuzz]);

  const handleStartTimer = useCallback(() => {
    setTimeLeft(20);
    setTimerRunning(true);
  }, []);

  // Fast Money selection handlers
  const handleSelectFM1 = useCallback((questionIdx: number, answerIdx: number) => {
    setFmSelected1((prev) => {
      const updated = [...prev];
      updated[questionIdx] = answerIdx;
      return updated;
    });
    setFmAnswers1((prev) => {
      const updated = [...prev];
      updated[questionIdx] = fmQuestions[questionIdx]?.answers[answerIdx]?.text || "";
      return updated;
    });
  }, [fmQuestions]);

  const handleSelectFM2 = useCallback((questionIdx: number, answerIdx: number) => {
    setFmSelected2((prev) => {
      const updated = [...prev];
      updated[questionIdx] = answerIdx;
      return updated;
    });
    setFmAnswers2((prev) => {
      const updated = [...prev];
      updated[questionIdx] = fmQuestions[questionIdx]?.answers[answerIdx]?.text || "";
      return updated;
    });
  }, [fmQuestions]);

  // Fast Money reveal handlers
  const handleRevealFM1 = useCallback(
    (i: number) => {
      setFmRevealed1((prev) => {
        const updated = [...prev];
        updated[i] = true;
        // Score check
        const answer = fmAnswers1[i]?.trim() || "";
        const question = fmQuestions[i];
        if (question) {
          const match = question.answers.find(
            (a) =>
              answer.length > 0 &&
              (a.text === answer || a.text.includes(answer) || answer.includes(a.text))
          );
          if (match) {
            setFmScore1((prev) => prev + match.points * 2);
          }
        }
        return updated;
      });
    },
    [fmAnswers1, fmQuestions]
  );

  const handleRevealFM2 = useCallback(
    (i: number) => {
      setFmRevealed2((prev) => {
        const updated = [...prev];
        updated[i] = true;
        const answer = fmAnswers2[i]?.trim() || "";
        const question = fmQuestions[i];
        if (question) {
          const match = question.answers.find(
            (a) =>
              answer.length > 0 &&
              (a.text === answer || a.text.includes(answer) || answer.includes(a.text))
          );
          if (match) {
            setFmScore2((prev) => prev + match.points * 2);
          }
        }
        return updated;
      });
    },
    [fmAnswers2, fmQuestions]
  );

  // End game
  const handleEndGame = useCallback(() => {
    const finalScore1 = team1Score + fmScore1;
    const finalScore2 = team2Score + fmScore2;
    setTeam1Score(finalScore1);
    setTeam2Score(finalScore2);
    setShowGameOver(true);
    setGamePhase("game_over");
    playWin();
    // Track fast money stats
    setGameStats((prev) => ({ ...prev, fastMoneyScore1: fmScore1, fastMoneyScore2: fmScore2 }));
  }, [fmScore1, fmScore2, playWin, team1Score, team2Score]);

  // Reset
  const handleReset = useCallback(() => {
    clearSavedState();
    setUiPhase("landing");
    setGamePhase("faceoff");
    setTeam1Score(0);
    setTeam2Score(0);
    setRound(1);
    setCurrentTeam(1);
    setStrikes(0);
    setShowGameOver(false);
    setFmPhase("intro");
    setTimerRunning(false);
    setTimeLeft(20);
    setRoundHistory([]);
    setGameStats({
      team1Correct: 0, team2Correct: 0,
      team1Strikes: 0, team2Strikes: 0,
      totalSteals: 0, successfulSteals: 0,
      fastMoneyScore1: 0, fastMoneyScore2: 0,
    });
  }, [clearSavedState]);

  // ============================
  // LOADING STATE
  // ============================
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="text-center flex-1 flex items-center justify-center">
          <div>
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // SETUP PHASES (with header/footer)
  // ============================
  if (uiPhase === "landing") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <main className="flex-1">
          <LandingPage
            onStartGodfather={() => setUiPhase("godfather_setup")}
            onStartDiwaniya={() => setUiPhase("diwaniya_setup")}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
          />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  if (uiPhase === "godfather_setup") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <main className="flex-1">
          <TeamSetup onStartGame={handleStartGame} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  if (uiPhase === "diwaniya_setup") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <BrandedHeader />
        <main className="flex-1">
          <DiwaniyaPlaceholder />
        </main>
        <BrandedFooter />
      </div>
    );
  }

  // ============================
  // GAME PHASES
  // ============================
  const currentQuestion = selectedQuestions[round - 1];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 relative overflow-hidden overflow-x-hidden" style={{ scrollBehavior: "smooth" }}>
      {/* Animated gradient background during gameplay */}
      {uiPhase === "game" && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <motion.div
            animate={{
              background: [
                "radial-gradient(ellipse at 20% 50%, rgba(120,53,15,0.12) 0%, transparent 60%)",
                "radial-gradient(ellipse at 80% 30%, rgba(136,19,55,0.12) 0%, transparent 60%)",
                "radial-gradient(ellipse at 50% 80%, rgba(120,53,15,0.10) 0%, transparent 60%)",
                "radial-gradient(ellipse at 20% 50%, rgba(120,53,15,0.12) 0%, transparent 60%)",
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
          />
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/8 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 4 }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-500/8 rounded-full blur-[100px]"
          />
        </div>
      )}

      {/* Feedback Overlay */}
      <div className="relative z-10 flex flex-col min-h-screen">
      <ExitDialog
        show={showExitDialog}
        onConfirm={handleExitToHome}
        onCancel={() => setShowExitDialog(false)}
      />
      <FeedbackOverlay
        show={feedback.show}
        correct={feedback.correct}
        answer={feedback.answer}
      />

      {/* Round Result Card */}
      <RoundResultCard
        show={showRoundResult}
        type={roundResultType}
        teamName={roundResultTeamName}
        points={roundResultPoints}
      />

      {/* 300+ Points Celebration */}
      <AnimatePresence>
        {celebration300.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="relative">
              {/* Glow backdrop */}
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-radial from-amber-500/30 to-transparent rounded-full blur-xl"
              />
              <div className="relative bg-gradient-to-br from-amber-600 via-rose-600 to-amber-700 rounded-3xl px-10 py-8 shadow-2xl shadow-amber-500/40 border-2 border-amber-300/50 text-center">
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: 3 }}
                  className="text-5xl mb-3"
                >
                  🏆
                </motion.div>
                <p className="text-xl sm:text-2xl font-black text-white mb-1">
                  {celebration300.teamName}
                </p>
                <p className="text-lg sm:text-xl font-black text-amber-200">
                  وصل لـ 300 نقطة!
                </p>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="mt-2 text-3xl"
                >
                  🎉✨🎊
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Indicator */}
      <AnimatePresence>
        {revealStreak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-l from-amber-600 to-rose-600 shadow-lg shadow-amber-500/30 border border-amber-400/30">
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3 }}
                className="text-lg"
              >
                🔥
              </motion.span>
              <span className="text-sm font-black text-white">
                x{revealStreak}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showGameOver ? (
        <GameOverScreen
          team1Name={team1Name}
          team2Name={team2Name}
          team1Score={team1Score}
          team2Score={team2Score}
          team1Emoji={team1Emoji}
          team2Emoji={team2Emoji}
          onRestart={handleReset}
          onHome={handleReset}
          roundHistory={roundHistory}
          gameStats={gameStats}
          regularRoundScore1={regularRoundScore1}
          regularRoundScore2={regularRoundScore2}
        />
      ) : gamePhase === "faceoff" && currentQuestion ? (
        <div className="flex-1 flex flex-col">
          <GameHeader
            phaseLabel={`⚔️ المواجهة — الجولة ${round}/${totalRounds}`}
            phaseLabelVariant="amber"
            showScoreBar={true}
            showSoundToggle={true}
            onExit={() => setShowExitDialog(true)}
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            team1Emoji={team1Emoji}
            team2Emoji={team2Emoji}
          />

          <FaceOffScreen
            question={currentQuestion.question}
            answers={currentAnswers}
            team1Name={team1Name}
            team2Name={team2Name}
            onTeamStart={(team) => handleFaceOffStart(team)}
          />
        </div>
      ) : gamePhase === "gameboard" && currentQuestion ? (
        <div className="flex-1 flex flex-col">
          <GameHeader
            phaseLabel={`👑 العراب — الجولة ${round}/${totalRounds}`}
            phaseLabelVariant="amber"
            showScoreBar={true}
            showSoundToggle={true}
            showFastMoneyBtn={true}
            onFastMoney={() => {
              roundPointsAwardedRef.current = true;
              setRound(totalRounds);
              handleNextRound();
            }}
            showRoundHistory={true}
            roundHistory={roundHistory}
            onExit={() => setShowExitDialog(true)}
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            team1Emoji={team1Emoji}
            team2Emoji={team2Emoji}
            questionNumber={round}
            totalQuestions={totalRounds}
          />

          <GameBoardView
            question={currentQuestion.question}
            answers={currentAnswers}
            currentTeam={currentTeam}
            team1Score={team1Score}
            team2Score={team2Score}
            team1Name={team1Name}
            team2Name={team2Name}
            team1Emoji={team1Emoji}
            team2Emoji={team2Emoji}
            strikes={strikes}
            onRevealAnswer={handleRevealAnswer}
            onAddStrike={handleAddStrike}
            onPassToOtherTeam={handlePassToOtherTeam}
            onSteal={handleSteal}
            onNoSteal={handleNoSteal}
            onRevealAll={handleRevealAll}
            onSkipQuestion={handleSkipQuestion}
            onUseHint={handleUseHint}
            hintsUsed={hintsUsedThisRound}
            questionDifficulty={currentQuestion.difficulty}
            phase="playing"
            round={round}
            totalRounds={totalRounds}
            roundScore={roundScore}
            questionCategory={getQuestionCategory(currentQuestion)}
            roundTimeLeft={roundTimeLeft}
            roundTimerRunning={roundTimerRunning}
          />

          {/* Next Round Button */}
          {currentAnswers.every((a) => a.revealed) && (
            <div className="px-3 pb-3">
              <Button
                onClick={handleAwardAndNextRound}
                className={cn(
                  "w-full font-bold h-12 text-base relative overflow-hidden group",
                  round >= totalRounds
                    ? "bg-gradient-to-l from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-amber-950 shadow-lg shadow-amber-500/30"
                    : "bg-gradient-to-l from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-lg shadow-amber-500/20"
                )}
              >
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-l from-white/10 to-transparent pointer-events-none"
                />
                <span className="relative flex items-center justify-center gap-2">
                  {round >= totalRounds ? "💰 جولة المال السريع" : "الجولة التالية"}
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </Button>
            </div>
          )}
        </div>
      ) : gamePhase === "steal" && currentQuestion ? (
        <div className="flex-1 flex flex-col">
          <GameHeader
            phaseLabel="⚡ فرصة السرقة"
            phaseLabelVariant="rose"
            showScoreBar={true}
            showSoundToggle={false}
            onExit={() => setShowExitDialog(true)}
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            team1Emoji={team1Emoji}
            team2Emoji={team2Emoji}
          />

          {/* Pulsing border during steal phase */}
          <motion.div
            animate={{
              borderColor: [
                "rgba(244,63,94,0.3)",
                "rgba(251,146,60,0.5)",
                "rgba(244,63,94,0.3)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex-1 flex flex-col mx-2 my-2 sm:mx-4 sm:my-3 border-2 rounded-3xl overflow-hidden"
          >
            <GameBoardView
              question={currentQuestion.question}
              answers={currentAnswers}
              currentTeam={currentTeam === 1 ? 2 : 1}
              team1Score={team1Score}
              team2Score={team2Score}
              team1Name={team1Name}
              team2Name={team2Name}
              team1Emoji={team1Emoji}
              team2Emoji={team2Emoji}
              strikes={strikes}
              onRevealAnswer={handleRevealAnswer}
              onAddStrike={handleAddStrike}
              onPassToOtherTeam={handlePassToOtherTeam}
              onSteal={handleSteal}
              onNoSteal={handleNoSteal}
              onRevealAll={handleRevealAll}
              onSkipQuestion={handleSkipQuestion}
              onUseHint={handleUseHint}
              hintsUsed={hintsUsedThisRound}
              questionDifficulty={currentQuestion.difficulty}
              phase="steal"
              round={round}
              totalRounds={totalRounds}
              roundScore={roundScore}
              questionCategory={getQuestionCategory(currentQuestion)}
            />
          </motion.div>
        </div>
      ) : gamePhase === "fast_money" ? (
        <div className="flex-1 flex flex-col">
          <GameHeader
            phaseLabel="💰 المال السريع"
            phaseLabelVariant="gold"
            showScoreBar={true}
            showSoundToggle={true}
            onExit={() => setShowExitDialog(true)}
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score + fmScore1}
            team2Score={team2Score + fmScore2}
            team1Emoji={team1Emoji}
            team2Emoji={team2Emoji}
          />

          <FastMoneyScreen
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            fmQuestions={fmQuestions}
            fmAnswers1={fmAnswers1}
            fmAnswers2={fmAnswers2}
            fmRevealed1={fmRevealed1}
            fmRevealed2={fmRevealed2}
            onRevealFM1={handleRevealFM1}
            onRevealFM2={handleRevealFM2}
            onInputFM1={(i, v) => {
              setFmAnswers1((prev) => {
                const updated = [...prev];
                updated[i] = v;
                return updated;
              });
            }}
            onInputFM2={(i, v) => {
              setFmAnswers2((prev) => {
                const updated = [...prev];
                updated[i] = v;
                return updated;
              });
            }}
            onStartTimer={handleStartTimer}
            timeLeft={timeLeft}
            timerRunning={timerRunning}
            roundScore={fmScore1 + fmScore2}
            fmSelected1={fmSelected1}
            fmSelected2={fmSelected2}
            onSelectFM1={handleSelectFM1}
            onSelectFM2={handleSelectFM2}
            onPhaseChange={(phase) => setFmPhase(phase as "intro" | "team1" | "team2" | "results")}
            fmScore1={fmScore1}
            fmScore2={fmScore2}
          />

          {/* Fast Money Results */}
          {fmPhase === "results" && (
            <div className="px-3 pb-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-rose-400">
                  <Card className="bg-slate-950 border-0 mb-0">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-bold text-white mb-3 text-center flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          💰
                        </motion.span>
                        نتائج المال السريع
                        <motion.span
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.75 }}
                        >
                          💰
                        </motion.span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {/* Team 1 breakdown */}
                        <div className="text-center bg-amber-950/30 rounded-xl p-3 border border-amber-500/20">
                          <p className="text-xs font-bold text-amber-400 mb-2">{team1Name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>الجولات العادية</span>
                              <span className="font-bold text-white">{team1Score}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-emerald-400">
                              <span>💰 المال السريع</span>
                              <span className="font-bold">+{fmScore1}</span>
                            </div>
                            <div className="border-t border-amber-500/20 pt-1 mt-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-amber-300 font-bold">المجموع</span>
                                <motion.span
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3, type: "spring" }}
                                  className="font-black text-amber-300 text-xl"
                                  style={{ textShadow: "0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2)" }}
                                >
                                  {team1Score + fmScore1}
                                </motion.span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Team 2 breakdown */}
                        <div className="text-center bg-rose-950/30 rounded-xl p-3 border border-rose-500/20">
                          <p className="text-xs font-bold text-rose-400 mb-2">{team2Name}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>الجولات العادية</span>
                              <span className="font-bold text-white">{team2Score}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-emerald-400">
                              <span>💰 المال السريع</span>
                              <span className="font-bold">+{fmScore2}</span>
                            </div>
                            <div className="border-t border-rose-500/20 pt-1 mt-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-rose-300 font-bold">المجموع</span>
                                <motion.span
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3, type: "spring" }}
                                  className="font-black text-rose-300 text-xl"
                                  style={{ textShadow: "0 0 20px rgba(251,113,133,0.5), 0 0 40px rgba(251,113,133,0.2)" }}
                                >
                                  {team2Score + fmScore2}
                                </motion.span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleEndGame}
                        className="w-full bg-gradient-to-l from-amber-600 to-yellow-600 text-white font-bold"
                      >
                        <Trophy className="w-4 h-4 ml-1" />
                        إنهاء اللعبة
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      ) : null}
      {/* Score Change Animation Popup */}
      <AnimatePresence>
        {scoreChangeAnimation.visible && (
          <motion.div
            key="score-anim"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div
              className={`px-6 py-3 rounded-2xl font-black text-xl shadow-2xl backdrop-blur-md border ${
                scoreChangeAnimation.team === 1
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-amber-500/30"
                  : "bg-rose-500/20 border-rose-400/40 text-rose-300 shadow-rose-500/30"
              }`}
            >
              +{scoreChangeAnimation.points} نقاط
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
