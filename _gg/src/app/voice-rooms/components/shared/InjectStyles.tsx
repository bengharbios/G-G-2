'use client';

import { TUI } from '../../types';

export default function InjectStyles() {
  return (
    <style>{`
      /* ── Cairo Font (Google Fonts) ── */
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');

      /* ── Base Reset ── */
      html, body {
        overflow: hidden;
        background: ${TUI.colors.G1};
        color: ${TUI.colors.G7};
        font-family: 'Cairo', sans-serif;
      }

      /* ── Keyframe: floatUp (gift message floats up and fades) ── */
      @keyframes floatUp {
        0% {
          transform: translateY(100%);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateY(-10vh);
          opacity: 0;
        }
      }

      /* ── Keyframe: slideUp (sheet content rises into view) ── */
      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      /* ── Keyframe: ripple (tap / interaction ripple) ── */
      @keyframes ripple {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }

      /* ── Keyframe: pulse (gentle breathing pulse) ── */
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      /* ── Keyframe: fadeSlideIn (notification / toast slides in from right) ── */
      @keyframes fadeSlideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* ── Custom Scrollbar (Dark Theme — thin, subtle) ── */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.25);
        background-clip: padding-box;
      }

      /* ── TUILiveKit Utility: Drawer Scrollbar (inside sheets) ── */
      .tuilivekit-scroll::-webkit-scrollbar {
        width: 6px;
        background: transparent;
      }

      .tuilivekit-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .tuilivekit-scroll::-webkit-scrollbar-thumb {
        background: #58585A;
        border-radius: 3px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      /* ── TUILiveKit: Icon Button Hover Glow ── */
      .tui-icon-btn {
        min-width: 56px;
        height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border-radius: ${TUI.radius.lg};
        transition: all ${TUI.anim.normal};
        cursor: pointer;
        user-select: none;
      }

      .tui-icon-btn:hover {
        box-shadow: ${TUI.shadow.iconHover};
      }

      .tui-icon-btn.disabled {
        cursor: not-allowed;
        opacity: 0.5;
        pointer-events: none;
      }

      /* ── TUILiveKit: Card Title with Bottom Stroke ── */
      .tui-card-title {
        font-size: 16px;
        font-weight: 600;
        color: #FFFFFF;
        padding: 14px 0;
        border-bottom: 1px solid ${TUI.colors.strokePrimary};
        margin-bottom: 12px;
      }

      /* ── TUILiveKit: Divider Utilities ── */
      .tui-divider-bottom {
        border-bottom: 1px solid ${TUI.colors.strokePrimary};
      }

      .tui-divider-top {
        border-top: 1px solid ${TUI.colors.strokePrimary};
      }

      /* ── Ellipsis Utility ── */
      .tui-ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── TUILiveKit: Audio Bar Animations ── */
      .audio-bar-1 { animation: audioBarAnim 0.6s ease-in-out infinite alternate; }
      .audio-bar-2 { animation: audioBarAnim 0.6s ease-in-out 0.1s infinite alternate; }
      .audio-bar-3 { animation: audioBarAnim 0.6s ease-in-out 0.2s infinite alternate; }
      .audio-bar-4 { animation: audioBarAnim 0.6s ease-in-out 0.3s infinite alternate; }
      .audio-bar-5 { animation: audioBarAnim 0.6s ease-in-out 0.4s infinite alternate; }

      @keyframes audioBarAnim {
        from { transform: scaleY(1); }
        to { transform: scaleY(1.6); }
      }

      /* ── TUILiveKit: Speak Glow (ring around speaking avatar) ── */
      @keyframes speakGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(41, 204, 106, 0.4); }
        50% { box-shadow: 0 0 0 6px rgba(41, 204, 106, 0); }
      }

      .animate-speak-glow {
        animation: speakGlow 1.5s ease-in-out infinite;
      }

      /* ── Notification Slide In ── */
      @keyframes notificationSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* ── Rotate Animation (loading spinners) ── */
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}
