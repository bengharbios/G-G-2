'use client';

import { useEffect, useState } from 'react';

// Dynamically import the original wizard-duel game to avoid SSR issues
// with boardgame.io and browser APIs
function WizardDuelGame() {
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

    // Load the game CSS
    if (!document.getElementById('wizardduel-css')) {
      const link = document.createElement('link');
      link.id = 'wizardduel-css';
      link.rel = 'stylesheet';
      link.href = '/wizardduel/index.css';
      document.head.appendChild(link);
    }

    // Dynamically import the game to avoid SSR/CSR issues
    import('./App').then((module) => {
      setGameComponent(() => module.WizardDuelApp);
    }).catch((err) => {
      console.error('Failed to load wizard duel:', err);
    });
  }, []);

  if (!GameComponent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a0833 0%, #0a0418 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#c4a3e8',
        fontSize: '16px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
          <p>جاري تحميل مبارزة السحرة...</p>
        </div>
      </div>
    );
  }

  return <GameComponent />;
}

export default function WizardDuelPage() {
  return <WizardDuelGame />;
}
