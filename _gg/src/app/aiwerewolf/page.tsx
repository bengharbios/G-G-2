'use client';

import { useEffect, useRef } from 'react';

export default function AIWerewolfPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    document.body.classList.add('in-game-setup');
    return () => { document.body.classList.remove('in-game-setup'); };
  }, []);

  const injectCSS = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      
      // Check if already injected
      if (doc.getElementById('gg-overlay-css')) return;
      
      const style = doc.createElement('style');
      style.id = 'gg-overlay-css';
      style.textContent = `
        /* Hide the game's own top header */
        header, .top-status-bar, .top-bar, .TopStatusBar, [class*="top-bar"], [class*="TopBar"], [class*="topbar"] {
          display: none !important;
        }
        
        /* Hide the game's bottom navigation */
        nav, .bottom-nav, .BottomNav, [class*="bottom-nav"], [class*="BottomNav"], [class*="bottomnav"],
        footer, .footer, [class*="footer"], [class*="tabbar"], [class*="tab-bar"] {
          display: none !important;
        }
        
        /* Add padding-top to compensate for hidden header */
        main, body > div, #root > div {
          padding-top: 0 !important;
          margin-top: 0 !important;
        }
        
        /* Ensure content fills the space */
        body { 
          padding-bottom: 0 !important;
        }
      `;
      doc.head.appendChild(style);
    } catch (e) {
      // Cross-origin — can't inject
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#0a0a0f' }}>
      {/* G-G Header (same as other games) */}
      <div className="tobol-header-actions" style={{ position: 'absolute', top: '8px', left: '12px', zIndex: 10000 }}>
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => window.history.back()}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>
      
      {/* Game iframe */}
      <iframe
        ref={iframeRef}
        src="/aiwerewolf/index.html"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="AI Werewolf"
        allow="fullscreen"
        onLoad={injectCSS}
      />
    </div>
  );
}
