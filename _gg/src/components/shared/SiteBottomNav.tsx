'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import EventsModal from '@/components/shared/EventsModal';

interface BottomNavTab {
  tabKey: string;
  tabLabel: string;
  tabIconOn: string;
  tabIconOff: string;
  tabHref: string;
  tabOrder: number;
  visibility: 'visible' | 'hidden' | 'maintenance';
}

interface SummaryData {
  pendingFriendRequests: number;
  unreadMessages: number;
  totalBadge: number;
}

interface SiteBottomNavProps {
  activeTab?: string;
  eventsModalOpen?: boolean;
  onEventsModalChange?: (open: boolean) => void;
}

export default function SiteBottomNav({
  activeTab: controlledTab,
  eventsModalOpen: controlledEventsOpen,
  onEventsModalChange,
}: SiteBottomNavProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<string>(controlledTab || 'games');
  const [internalEventsOpen, setInternalEventsOpen] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [tabs, setTabs] = useState<BottomNavTab[]>([]);
  const [tabsLoaded, setTabsLoaded] = useState(false);
  const [userRole, setUserRole] = useState<string>('guest');
  const router = useRouter();

  const activeTab = controlledTab ?? internalActiveTab;
  const setActiveTab = controlledTab ? () => {} : setInternalActiveTab;
  const eventsOpen = controlledEventsOpen ?? internalEventsOpen;
  const setEventsOpen = onEventsModalChange ?? setInternalEventsOpen;

  // Fetch tabs + user role once
  useEffect(() => {
    let cancelled = false;
    async function fetchTabs() {
      try {
        const res = await fetch('/api/bottom-nav', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.success) return;
        setTabs(data.tabs || []);
        setTabsLoaded(true);
      } catch { /* silent */ }
    }
    async function fetchUserRole() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) {
          setUserRole(data.user.role || 'user');
        }
      } catch { /* silent */ }
    }
    fetchTabs();
    fetchUserRole();
    return () => { cancelled = true; };
  }, []);

  // استطلاع ملخّص الإشعارات كل 30 ثانية
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

  const friendsBadge = summary?.totalBadge ?? 0;

  // هل المستخدم admin/moderator؟ (يستطيع فتح تبويبات maintenance)
  const canAccessMaintenance = userRole === 'admin' || userRole === 'moderator';

  const handleTabClick = useCallback((tab: BottomNavTab) => {
    // لو التبويب تحت الصيانة ولا المستخدم أدمن/مشرف — لا تفتح الصفحة
    if (tab.visibility === 'maintenance' && !canAccessMaintenance) {
      // عرض رسالة Toast بسيطة
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(245,158,11,.95);color:#0f172a;padding:10px 20px;border-radius:8px;font-weight:bold;font-size:13px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.3);';
      toast.textContent = '🚧 هذا القسم تحت الصيانة حالياً';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
      return;
    }
    setActiveTab(tab.tabKey);
    switch (tab.tabKey) {
      case 'games':
        router.push(tab.tabHref || '/#games');
        break;
      case 'events':
        setEventsOpen(true);
        break;
      case 'council':
        router.push(tab.tabHref || '/voice-rooms');
        break;
      case 'friends':
        router.push(tab.tabHref || '/friends');
        break;
      default:
        // تبويبات مخصصة — افتح الـ tabHref
        if (tab.tabHref) router.push(tab.tabHref);
    }
  }, [canAccessMaintenance, router, setActiveTab, setEventsOpen]);

  // لو الـ tabs لم تُحمَّل بعد — استخدم تبويبات افتراضية (لمنع وميض الواجهة)
  const displayTabs = tabsLoaded && tabs.length > 0 ? tabs : [
    { tabKey: 'events', tabLabel: 'الأحداث', tabIconOn: '/yalla-ui/event_select.png', tabIconOff: '/yalla-ui/event_unselect.png', tabHref: '', tabOrder: 0, visibility: 'visible' as const },
    { tabKey: 'games', tabLabel: 'الألعاب', tabIconOn: '/yalla-ui/battle_select.png', tabIconOff: '/yalla-ui/battle_unselect.png', tabHref: '/#games', tabOrder: 1, visibility: 'visible' as const },
    { tabKey: 'council', tabLabel: 'المجلس', tabIconOn: '/yalla-ui/room_select.png', tabIconOff: '/yalla-ui/room_unselect.png', tabHref: '/voice-rooms', tabOrder: 2, visibility: 'visible' as const },
    { tabKey: 'friends', tabLabel: 'أصدقائي', tabIconOn: '/yalla-ui/friend_select.png', tabIconOff: '/yalla-ui/friend_unselect.png', tabHref: '/friends', tabOrder: 3, visibility: 'visible' as const },
  ];

  return (
    <>
      <nav className="yalla-tabbar fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
        <div className="max-w-lg mx-auto flex items-stretch justify-around h-full">
          {displayTabs.map((tab) => {
            const isActive = activeTab === tab.tabKey;
            const badge = tab.tabKey === 'friends' ? friendsBadge : 0;
            const isMaintenance = tab.visibility === 'maintenance';
            // لو صيانة ولا المستخدم أدمن — يعمل عادي (لكن مع الشارة)
            const showMaintenanceBadge = isMaintenance;
            return (
              <button
                key={tab.tabKey}
                onClick={() => handleTabClick(tab)}
                className={`yalla-tab-btn flex flex-col items-center justify-start pt-2 px-2 relative min-w-[56px] ${
                  isActive ? 'active' : ''
                } ${isMaintenance ? 'maintenance-mode' : ''}`}
              >
                <span className="yalla-tab-ic relative">
                  {tab.tabIconOn && tab.tabIconOff ? (
                    <img src={isActive ? tab.tabIconOn : tab.tabIconOff} alt={tab.tabLabel} draggable={false} />
                  ) : (
                    <span className="block w-6 h-6 leading-6 text-center">{tab.tabLabel.charAt(0)}</span>
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
                  {/* شارة "تحت الصيانة" — مربع صغير أصفر فوق الأيقونة */}
                  {showMaintenanceBadge && (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[8px] font-black px-1 py-0.5 rounded-sm border border-amber-600 whitespace-nowrap leading-tight"
                      title="تحت الصيانة"
                    >
                      🔧
                    </span>
                  )}
                </span>
                <span className="yalla-tab-tl">{tab.tabLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <EventsModal open={eventsOpen} onClose={() => setEventsOpen(false)} />
    </>
  );
}
