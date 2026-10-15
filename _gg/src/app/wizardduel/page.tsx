'use client';

import { useEffect, useState } from 'react';

export default function WizardDuelPage() {
  const [loaded, setLoaded] = useState(false);
  const [GameComponent, setGameComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Load Bootstrap CSS
    if (!document.getElementById('bootstrap-css')) {
      const link = document.createElement('link');
      link.id = 'bootstrap-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
      document.head.appendChild(link);
    }
    // Load game CSS
    if (!document.getElementById('wizardduel-css')) {
      const link = document.createElement('link');
      link.id = 'wizardduel-css';
      link.rel = 'stylesheet';
      link.href = '/wizardduel/index.css';
      document.head.appendChild(link);
    }
    // Dynamic import — only runs in browser, avoids build-time resolution
    import('@/components/wizardduel/App').then((m) => {
      setGameComponent(() => m.WizardDuelApp);
      setLoaded(true);
    }).catch((e) => {
      console.error('Wizard duel load error:', e);
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a0833', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4a3e8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
          <p>جاري تحميل مبارزة السحرة...</p>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a0833', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4a3e8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p>تعذر تحميل اللعبة. يرجى تحديث الصفحة.</p>
        </div>
      </div>
    );
  }

  return <GameComponent />;
}
