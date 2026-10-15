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

export default function WizardDuelPage() {
  useEffect(() => {
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
    return () => { document.body.classList.remove('in-game-setup'); };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto', background: '#1a0833', zIndex: 9999 }}>
      <WizardDuelApp />
    </div>
  );
}
