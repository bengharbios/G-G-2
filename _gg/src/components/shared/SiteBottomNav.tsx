'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import EventsModal from '@/components/shared/EventsModal';

type BottomTab = 'home' | 'games' | 'events' | 'council' | 'profile';

interface SiteBottomNavProps {
  /** Which tab is currently active */
  activeTab?: BottomTab;
  /** Override the events modal open state (if managed externally) */
  eventsModalOpen?: boolean;
  onEventsModalChange?: (open: boolean) => void;
}

export default function SiteBottomNav({
  activeTab: controlledTab,
  eventsModalOpen: controlledEventsOpen,
  onEventsModalChange,
}: SiteBottomNavProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<BottomTab>(
    controlledTab || 'home'
  );
  const [internalEventsOpen, setInternalEventsOpen] = useState(false);

  const activeTab = controlledTab ?? internalActiveTab;
  const setActiveTab = controlledTab ? () => {} : setInternalActiveTab;
  const eventsOpen = controlledEventsOpen ?? internalEventsOpen;
  const setEventsOpen = onEventsModalChange ?? setInternalEventsOpen;

  // أيقونات يلا لودو الحقيقية (من APK) — select للنشط و unselect للغير نشط
  const tabs: { id: BottomTab; label: string; on?: string; off?: string; icon?: React.ReactNode }[] = [
    { id: 'home', label: 'الرئيسية', on: '/yalla-ui/room_select.png', off: '/yalla-ui/room_unselect.png' },
    { id: 'games', label: 'الألعاب', on: '/yalla-ui/battle_select.png', off: '/yalla-ui/battle_unselect.png' },
    { id: 'events', label: 'الأحداث', on: '/yalla-ui/event_select.png', off: '/yalla-ui/event_unselect.png' },
    { id: 'council', label: 'المجلس', on: '/yalla-ui/friend_select.png', off: '/yalla-ui/friend_unselect.png' },
    { id: 'profile', label: 'الملف', icon: <User className="w-6 h-6" /> },
  ];

  const handleTabClick = (tabId: BottomTab) => {
    setActiveTab(tabId);

    switch (tabId) {
      case 'home':
        window.location.href = '/';
        break;
      case 'games':
        window.location.href = '/#games';
        break;
      case 'events':
        setEventsOpen(true);
        break;
      case 'council':
        window.location.href = '/voice-rooms';
        break;
      case 'profile':
        window.location.href = '/profile';
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
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`yalla-tab-btn flex flex-col items-center justify-start pt-2 px-2 relative min-w-[56px] ${
                  isActive ? 'active' : ''
                }`}
              >
                <span className="yalla-tab-ic">
                  {tab.on && tab.off ? (
                    <img src={isActive ? tab.on : tab.off} alt={tab.label} draggable={false} />
                  ) : (
                    <span className="block w-6 h-6 leading-6 text-center">{tab.icon}</span>
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
