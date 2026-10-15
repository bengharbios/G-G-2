'use client';

import { useEffect } from 'react';

export default function AIWerewolfPage() {
  useEffect(() => {
    document.body.classList.add('in-game-setup');
    return () => { document.body.classList.remove('in-game-setup'); };
  }, []);

  return (
    <iframe
      src="/aiwerewolf/index.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        border: 'none',
        zIndex: 9999,
      }}
      title="AI Werewolf"
      allow="fullscreen"
    />
  );
}
