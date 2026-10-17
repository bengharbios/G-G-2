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
      if (doc.getElementById('gg-overlay-css')) return;
      
      const style = doc.createElement('style');
      style.id = 'gg-overlay-css';
      style.textContent = `
        /* === HIDE GAME HEADER === */
        /* Step indicator "1 Choose Mode 2 Board, Difficulty..." */
        [class*="step"], [class*="Step"], [class*="progress"], [class*="Progress"],
        [class*="stepper"], [class*="Stepper"], [class*="breadcrumb"] {
          display: none !important;
        }
        
        /* Game's top header bar */
        header, [class*="top-bar"], [class*="TopBar"], [class*="topbar"],
        [class*="top-status"], [class*="TopStatus"], [class*="header-bar"] {
          display: none !important;
        }
        
        /* Any h1/h2 that contains "Choose Mode" text */
        h1, h2 {
          display: none !important;
        }
        
        /* === HIDE BOTTOM NAV === */
        nav, footer, [class*="bottom-nav"], [class*="BottomNav"], [class*="bottomnav"],
        [class*="tabbar"], [class*="tab-bar"], [class*="TabBar"] {
          display: none !important;
        }
        
        /* === RECOLOR TO MATCH YALLA LUDO (Tobol) STYLE === */
        /* War drums background: dark green (#041F18) with gold accents (#feef91 / #aa6e1f) */
        body, #root {
          background: linear-gradient(180deg, #041F18 0%, #021410 100%) !important;
          color: #feef91 !important;
        }
        
        /* Cards/panels — dark green with gold border */
        [class*="panel"], [class*="card"], [class*="container"], [class*="box"],
        [class*="surface"], [class*="dialog"], [class*="modal"] {
          background: linear-gradient(180deg, rgba(6,42,32,.95), rgba(4,18,14,.95)) !important;
          border: 1px solid rgba(254,239,145,.25) !important;
          border-radius: 14px !important;
        }
        
        /* Buttons — gold gradient like tobol start button */
        button[class*="primary"], button[class*="submit"], button[class*="confirm"],
        button[class*="start"], button[class*="play"], button[type="submit"] {
          background: linear-gradient(135deg, #f59e0b, #d97706) !important;
          color: #fff !important;
          border: none !important;
          border-radius: 12px !important;
          font-weight: 800 !important;
          box-shadow: 0 4px 12px rgba(245,158,11,.3) !important;
        }
        
        /* Secondary buttons — dark with gold border */
        button:not([class*="primary"]):not([class*="submit"]):not([class*="confirm"]):not([class*="start"]):not([class*="play"]):not([type="submit"]):not([disabled]) {
          background: rgba(6,42,32,.8) !important;
          border: 1px solid rgba(254,239,145,.3) !important;
          color: #feef91 !important;
          border-radius: 10px !important;
        }
        
        /* Text colors */
        p, span, div, label {
          color: #9fc4b4 !important;
        }
        
        /* Strong/emphasized text — gold */
        strong, b, [class*="title"], [class*="Title"], [class*="heading"], [class*="Heading"] {
          color: #feef91 !important;
          text-shadow: 0 1px 2px rgba(0,0,0,.7) !important;
        }
        
        /* Links — gold */
        a {
          color: #feef91 !important;
        }
        
        /* Input fields */
        input, select, textarea {
          background: rgba(0,0,0,.35) !important;
          border: 1px solid rgba(254,239,145,.25) !important;
          color: #fff !important;
          border-radius: 8px !important;
        }
        
        /* Remove shadows/glows from original theme */
        [class*="glow"], [class*="shadow"] {
          box-shadow: none !important;
        }
        
        /* Full height */
        body { min-height: 100vh !important; }
        #root { min-height: 100vh !important; }
      `;
      doc.head.appendChild(style);
    } catch (e) { /* cross-origin */ }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#041F18' }}>
      {/* G-G Header */}
      <div className="tobol-header-actions" style={{ position: 'absolute', top: '8px', left: '12px', zIndex: 10000 }}>
        <button
          type="button"
          className="tobol-header-btn active"
          onClick={() => window.history.back()}
          aria-label="خروج"
          title="خروج"
        >
          <img src="/battle/btn_exit.webp" alt="exit" />
        </button>
      </div>
      
      <iframe
        ref={iframeRef}
        src="/aiwerewolf/index.html"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
        title="AI Werewolf"
        allow="fullscreen"
        onLoad={injectCSS}
      />
    </div>
  );
}
