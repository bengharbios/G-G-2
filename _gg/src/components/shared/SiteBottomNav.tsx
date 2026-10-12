'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EventsModal from '@/components/shared/EventsModal';

type BottomTab = 'games' | 'events' | 'council' | 'friends';

interface SiteBottomNavProps {
  /** Which tab is currently active */
  activeTab?: BottomTab;
  /** Override the events modal open state (if managed externally) */
  eventsModalOpen?: boolean;
  onEventsModalChange?: (open: boolean) => void;
}

interface SummaryData {
  pendingFriendRequests: number;
  unreadMessages: number;
  totalBadge: number;
}

export default function SiteBottomNav({
  activeTab: controlledTab,
  eventsModalOpen: controlledEventsOpen,
  onEventsModalChange,
}: SiteBottomNavProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<BottomTab>(
    controlledTab || 'events'
  );
  const [internalEventsOpen, setInternalEventsOpen] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const router = useRouter();

  const activeTab = controlledTab ?? internalActiveTab;
  const setActiveTab = controlledTab ? () => {} : setInternalActiveTab;
  const eventsOpen = controlledEventsOpen ?? internalEventsOpen;
  const setEventsOpen = onEventsModalChange ?? setInternalEventsOpen;

  // استطلاع ملخّص الإشعارات كل 30 ثانية — يُظهر شارة على زر "أصدقائي"
  // عند وجود طلبات صداقة أو رسائل غير مقروءة
  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      try {
        const res = await fetch('/api/notifications/summary', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.success) return;
        setSummary({
          pendingFriendRequests: data.pendingFriendRequests ?? 0,
          unreadMessages: data.unreadMessages ?? 0,
          totalBadge: data.totalBadge ?? 0,
        });
      } catch { /* silent */ }
    }

    fetchSummary();
    const timer = setInterval(fetchSummary, 30000);

    // أيضاً أعد الجلب عند عودة التركيز للنافذة (المستخدم يعود من تبويب آخر)
    const onFocus = () => fetchSummary();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchSummary();
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // أيقونات يلا لودو الحقيقية (من APK) — select للنشط و unselect للغير نشط
  // 4 تبويبات بالترتيب المطلوب: أحداث - ألعاب - مجلس - أصدقاء
  const tabs: { id: BottomTab; label: string; on?: string; off?: string; icon?: React.ReactNode }[] = [
    { id: 'events', label: 'الأحداث', on: '/yalla-ui/event_select.png', off: '/yalla-ui/event_unselect.png' },
    { id: 'games', label: 'الألعاب', on: '/yalla-ui/battle_select.png', off: '/yalla-ui/battle_unselect.png' },
    { id: 'council', label: 'المجلس', on: '/yalla-ui/room_select.png', off: '/yalla-ui/room_unselect.png' },
    { id: 'friends', label: 'أصدقائي', on: '/yalla-ui/friend_select.png', off: '/yalla-ui/friend_unselect.png' },
  ];

  // الشارة على زر "أصدقائي" = عدد الطلبات + الرسائل غير المقروءة
  const friendsBadge = summary?.totalBadge ?? 0;

  const handleTabClick = (tabId: BottomTab) => {
    setActiveTab(tabId);

    switch (tabId) {
      case 'games':
        router.push('/#games');
        break;
      case 'events':
        setEventsOpen(true);
        break;
      case 'council':
        router.push('/voice-rooms');
        break;
      case 'friends':
        router.push('/friends');
        break;
    }
  };

  return (
    <>
      {/* شريط يلا السفلي — 75px بخلفية friends_titlebg وأيقونات APK الحقيقية */}
      <nav className="yalla-tabbar fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-stretch justify-around h-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const badge = tab.id === 'friends' ? friendsBadge : 0;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`yalla-tab-btn flex flex-col items-center justify-start pt-2 px-2 relative min-w-[56px] ${
                  isActive ? 'active' : ''
                }`}
              >
                <span className="yalla-tab-ic relative">
                  {tab.on && tab.off ? (
                    <img src={isActive ? tab.on : tab.off} alt={tab.label} draggable={false} />
                  ) : (
                    <span className="block w-6 h-6 leading-6 text-center">{tab.icon}</span>
                  )}
                  {/* شارة الإشعارات */}
                  {badge > 0 && (
                    <span
                      className="absolute -top-1 -left-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 border-2 border-[#074a42] leading-[14px]"
                      aria-label={`${badge} إشعارات`}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className="yalla-tab-tl">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Events Modal */}
      <EventsModal open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </>
  );
}
