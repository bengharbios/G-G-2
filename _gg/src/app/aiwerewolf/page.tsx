'use client';
import { useEffect } from 'react';

export default function AIWerewolfPage() {
  useEffect(() => {
    document.body.classList.add('in-game-setup');
    return () => { document.body.classList.remove('in-game-setup'); };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#041F18' }}>
      <div className="tobol-header-actions" style={{ position: 'absolute', top: '8px', left: '12px', zIndex: 10000 }}>
        <button type="button" className="tobol-header-btn active" onClick={() => window.history.back()} aria-label="خروج" title="خروج">
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>
      <iframe src="/aiwerewolf/index.html" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} title="AI Werewolf" allow="fullscreen" />
    </div>
  );
}
