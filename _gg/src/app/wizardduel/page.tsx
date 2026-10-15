'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';

const WizardDuelApp = dynamic(
  () => import('@/components/wizardduel/App').then((m) => m.WizardDuelApp),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: '#1a0833', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4a3e8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
          <p>جاري تحميل مبارزة السحرة...</p>
        </div>
      </div>
    ),
  }
);

function rearrangeMobileLayout() {
  if (window.innerWidth > 768) return;
  
  const container = document.querySelector('.container-fluid.vh-100') as HTMLElement;
  if (!container) return;
  
  // Get all rows
  const rows = container.querySelectorAll('.row');
  if (rows.length < 3) return;
  
  // Flatten: move all col-* from all rows into the container directly
  const allCols: HTMLElement[] = [];
  rows.forEach(row => {
    row.querySelectorAll('.col-3, .col-6').forEach(col => {
      allCols.push(col as HTMLElement);
    });
  });
  
  // Reorder: we want:
  // 1. Opponent hand cards (col-6 from row 1)
  // 2. Opponent stats (col-3 last from row 1) 
  // 3. Center play card (col-6 from row 2)
  // 4. Player hand (col-6 from row 3)
  // 5. Player draw pile (col-3 first from row 3)
  // 6. Player stats (col-3 last from row 3)
  
  const row1 = rows[0];
  const row2 = rows[1];
  const row3 = rows[2];
  
  const oppHand = row1?.querySelector('.col-6') as HTMLElement;
  const oppStats = row1?.querySelector('.col-3:last-child') as HTMLElement;
  const oppLeft = row1?.querySelector('.col-3:first-child') as HTMLElement;
  
  const centerPlay = row2?.querySelector('.col-6') as HTMLElement;
  const centerLeft = row2?.querySelector('.col-3:first-child') as HTMLElement;
  const centerRight = row2?.querySelector('.col-3:last-child') as HTMLElement;
  
  const playerHand = row3?.querySelector('.col-6') as HTMLElement;
  const playerDraw = row3?.querySelector('.col-3:first-child') as HTMLElement;
  const playerStats = row3?.querySelector('.col-3:last-child') as HTMLElement;
  
  // Hide unnecessary panels
  if (oppLeft) oppLeft.style.display = 'none';
  if (centerLeft) centerLeft.style.display = 'none';
  if (centerRight) centerRight.style.display = 'none';
  
  // Make all cols full width
  allCols.forEach(col => {
    col.style.flex = '0 0 100%';
    col.style.maxWidth = '100%';
    col.style.width = '100%';
    col.style.textAlign = 'center';
    col.style.padding = '2px 4px';
  });
  
  // Remove rows from DOM
  rows.forEach(row => {
    (row as HTMLElement).style.display = 'contents';
  });
  
  // Append in correct order to container
  const elements = [oppHand, oppStats, centerPlay, playerHand, playerDraw, playerStats].filter(Boolean);
  elements.forEach(el => container.appendChild(el));
  
  // Make center play card BIG
  const centerCard = centerPlay?.querySelector('img[src*="cards/front"]') as HTMLImageElement;
  if (centerCard) {
    centerCard.style.width = '130px';
    centerCard.style.maxHeight = '182px';
  }
  
  // Make hand cards medium
  const handCards = playerHand?.querySelectorAll('img[src*="cards/front"]');
  handCards?.forEach((img: Element) => {
    (img as HTMLImageElement).style.width = '75px';
    (img as HTMLImageElement).style.maxHeight = '105px';
  });
  
  // Face-down cards (opponent hand)
  const faceDown = oppHand?.querySelectorAll('img[src*="cards/back"], img[src*="cards/placeholder"]');
  faceDown?.forEach((img: Element) => {
    (img as HTMLImageElement).style.width = '45px';
    (img as HTMLImageElement).style.maxHeight = '63px';
  });
}

export default function WizardDuelPage() {
  useEffect(() => {
    // Load CSS
    if (!document.getElementById('bootstrap-css')) {
      const link = document.createElement('link');
      link.id = 'bootstrap-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('wizardduel-css')) {
      const link = document.createElement('link');
      link.id = 'wizardduel-css';
      link.rel = 'stylesheet';
      link.href = '/wizardduel/index.css';
      document.head.appendChild(link);
    }
    document.body.classList.add('in-game-setup');
    
    // Wait for game to load, then rearrange
    const observer = new MutationObserver(() => {
      if (document.querySelector('.container-fluid.vh-100')) {
        rearrangeMobileLayout();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also try every 2 seconds for 10 seconds
    const interval = setInterval(() => {
      rearrangeMobileLayout();
    }, 2000);
    setTimeout(() => clearInterval(interval), 10000);
    
    return () => {
      document.body.classList.remove('in-game-setup');
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto', background: '#1a0833', zIndex: 9999 }}>
      <WizardDuelApp />
    </div>
  );
}
