'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Gift, Zap, CalendarDays, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEvents, type EventData, type EventStatus } from '@/hooks/useEvents';

// ─── Props ──────────────────────────────────────────────────────────────

interface EventsModalProps {
  open: boolean;
  onClose: () => void;
}

// ─── Filter Tabs ───────────────────────────────────────────────────────

type FilterTab = 'all' | 'permanent' | 'temporary' | 'seasonal';

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'permanent', label: 'دائمة' },
  { id: 'temporary', label: 'مؤقتة' },
  { id: 'seasonal', label: 'موسمية' },
];

// ─── Type Labels ─────────────────────────────────────────────────────────

const eventTypeLabels: Record<string, { label: string; color: string; gradient: string }> = {
  promotion: {
    label: 'ترويج',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    gradient: 'from-amber-950/60 via-slate-900/80 to-orange-950/60',
  },
  tournament: {
    label: 'بطولة',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    gradient: 'from-rose-950/60 via-slate-900/80 to-red-950/60',
  },
  seasonal: {
    label: 'موسمي',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    gradient: 'from-emerald-950/60 via-slate-900/80 to-teal-950/60',
  },
  special: {
    label: 'خاص',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gradient: 'from-purple-950/60 via-slate-900/80 to-pink-950/60',
  },
};

// ─── Status Config ──────────────────────────────────────────────────────

const statusConfig: Record<EventStatus, { label: string; dotColor: string; textColor: string }> = {
  active: { label: 'نشط', dotColor: 'bg-emerald-500', textColor: 'text-emerald-400' },
  expired: { label: 'منتهي', dotColor: 'bg-slate-500', textColor: 'text-slate-500' },
  upcoming: { label: 'قريباً', dotColor: 'bg-amber-500', textColor: 'text-amber-400' },
};

// ─── Reward Icons ───────────────────────────────────────────────────────

const rewardIcons: Record<string, string> = {
  xp: '⭐',
  gems: '💎',
  frame: '🖼️',
  cover: '🎨',
  dice: '🎲',
  none: '',
};

// ─── Countdown Timer ────────────────────────────────────────────────────

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) {
    return (
      <span className="text-[11px] font-medium text-slate-500">انتهى</span>
    );
  }

  return (
    <div className="flex items-center gap-1 text-[11px] font-mono" dir="ltr">
      {timeLeft.days > 0 && (
        <span className="bg-slate-800/80 rounded px-1.5 py-0.5 text-amber-400">
          {timeLeft.days}<span className="text-slate-500 text-[9px]">ي</span>
        </span>
      )}
      <span className="bg-slate-800/80 rounded px-1.5 py-0.5 text-amber-400">
        {String(timeLeft.hours).padStart(2, '0')}<span className="text-slate-500 text-[9px]">:</span>{String(timeLeft.mins).padStart(2, '0')}<span className="text-slate-500 text-[9px]">:</span>{String(timeLeft.secs).padStart(2, '0')}
      </span>
    </div>
  );
}

// ─── Event Card ─────────────────────────────────────────────────────────

function EventCard({ event, index }: { event: EventData; index: number }) {
  const status = useEventStatus(event);
  const typeConf = eventTypeLabels[event.eventType] || eventTypeLabels.promotion;
  const statusConf = statusConfig[status];
  const isExpired = status === 'expired';
  const isTemporary = event.eventType === 'tournament' || event.eventType === 'promotion';
  const rewardIcon = event.rewardType ? (rewardIcons[event.rewardType] || '') : '';
  const hasReward = event.rewardType && event.rewardType !== 'none' && (event.rewardDescription || event.rewardAmount != null);

  const now = Date.now();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  const durationMs = end - start;
  const isPermanent = durationMs > 365 * 24 * 60 * 60 * 1000; // > 1 year

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
      className={`rounded-2xl overflow-hidden border transition-all duration-300 ${
        isExpired
          ? 'border-slate-800/40 opacity-60 grayscale-[30%]'
          : 'border-slate-700/40 hover:border-slate-600/60'
      }`}
    >
      <div className={`relative bg-gradient-to-b ${typeConf.gradient}`}>
        {/* Top: Image or gradient placeholder */}
        <div className="relative h-32 sm:h-40 overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : null}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

          {/* Badge emoji */}
          <div className="absolute top-3 right-3">
            <span className="text-3xl drop-shadow-lg">{event.badge}</span>
          </div>

          {/* Status dot */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className={`w-2 h-2 rounded-full ${statusConf.dotColor} ${status === 'active' ? 'animate-pulse' : ''}`} />
            <span className={`text-[10px] font-bold ${statusConf.textColor}`}>{statusConf.label}</span>
          </div>

          {/* Bottom overlay info */}
          <div className="absolute bottom-3 right-3 left-3">
            <h3 className={`text-base sm:text-lg font-black text-white leading-tight mb-1 ${isExpired ? 'line-through opacity-70' : ''}`}>
              {event.title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Description */}
          {event.description && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${typeConf.color}`}>
              {typeConf.label}
            </Badge>
            {hasReward && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-slate-800/50 text-slate-300 border-slate-700/40">
                {rewardIcon} {event.rewardDescription || (event.rewardAmount != null ? `${event.rewardAmount}` : '')}
              </Badge>
            )}
          </div>

          {/* Date & countdown */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="text-[11px]" dir="ltr">
                {new Date(event.startDate).toLocaleDateString('ar-SA', {
                  month: 'short',
                  day: 'numeric',
                })}
                {' — '}
                {new Date(event.endDate).toLocaleDateString('ar-SA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Countdown for temporary/active events */}
            {isTemporary && !isPermanent && status === 'active' && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <CountdownTimer endDate={event.endDate} />
              </div>
            )}

            {/* Permanent badge */}
            {isPermanent && status === 'active' && (
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">دائم</span>
              </div>
            )}

            {/* Expired label */}
            {isExpired && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-medium text-slate-500">انتهت المدة</span>
              </div>
            )}

            {/* Upcoming countdown */}
            {status === 'upcoming' && (
              <div className="flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-medium text-amber-400">يبدأ قريباً</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Small helper to use hook inside a component ────────────────────────

function useEventStatus(event: EventData): EventStatus {
  const now = Date.now();
  const start = new Date(event.startDate).getTime();
  const end = new Date(event.endDate).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'expired';
  return 'active';
}

// ─── Empty State ────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-4">
        <CalendarDays className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-base font-bold text-slate-400 mb-1">لا توجد أحداث حالياً</h3>
      <p className="text-sm text-slate-600">سيتم إضافة أحداث جديدة قريباً، ترقّعوا!</p>
    </div>
  );
}

// ─── EventsModal ────────────────────────────────────────────────────────

export default function EventsModal({ open, onClose }: EventsModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const { events, loading, refetch } = useEvents();

  // Refetch when modal opens
  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    if (activeFilter === 'permanent') {
      return events.filter((e) => {
        const duration = new Date(e.endDate).getTime() - new Date(e.startDate).getTime();
        return duration > 365 * 24 * 60 * 60 * 1000;
      });
    }
    if (activeFilter === 'temporary') {
      return events.filter((e) => {
        const duration = new Date(e.endDate).getTime() - new Date(e.startDate).getTime();
        return duration <= 365 * 24 * 60 * 60 * 1000 && duration > 0;
      });
    }
    if (activeFilter === 'seasonal') {
      return events.filter((e) => e.eventType === 'seasonal');
    }
    return events;
  }, [events, activeFilter]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[101] max-h-[92vh] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:max-h-[85vh] sm:rounded-2xl bg-slate-950 border-t sm:border border-slate-800/60 rounded-t-3xl sm:rounded-t-none overflow-hidden flex flex-col shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-3 border-b border-slate-800/40 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-white">الأحداث</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/30 flex-shrink-0 overflow-x-auto scrollbar-none">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    activeFilter === tab.id
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'text-slate-500 border border-transparent hover:text-slate-300 hover:border-slate-700/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-slate-500">جارٍ التحميل...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <EmptyState />
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
