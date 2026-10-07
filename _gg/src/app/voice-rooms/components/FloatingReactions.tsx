'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface FloatingReactionProps {
  reactions: Array<{ id: string; emoji: string; x: number }>;
  onReact: (emoji: string) => void;
}

export function FloatingReactions({ reactions, onReact }: FloatingReactionProps) {
  return (
    <>
      {/* Floating animation container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {reactions.map(reaction => (
          <FloatingEmoji key={reaction.id} emoji={reaction.emoji} startX={reaction.x} />
        ))}
      </div>
    </>
  );
}

function FloatingEmoji({ emoji, startX }: { emoji: string; startX: number }) {
  return (
    <div
      className="floating-reaction-emoji absolute text-3xl select-none"
      style={{
        left: `${startX}%`,
        bottom: '10%',
        animation: 'floatUp 3s ease-out forwards',
      }}
    >
      {emoji}
    </div>
  );
}

const QUICK_REACTIONS = [
  { emoji: '❤️', label: 'حب' },
  { emoji: '😂', label: 'ضحك' },
  { emoji: '👏', label: 'تصفيق' },
  { emoji: '🔥', label: 'نار' },
  { emoji: '😍', label: 'حب' },
  { emoji: '💯', label: 'مئة' },
];

interface QuickReactionBarProps {
  onReact: (emoji: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function QuickReactionBar({ onReact, visible, onClose }: QuickReactionBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/10">
        {QUICK_REACTIONS.map((reaction, idx) => (
          <button
            key={idx}
            onClick={() => {
              onReact(reaction.emoji);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-125 transition-transform"
            title={reaction.label}
          >
            <span className="text-2xl">{reaction.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Hook to manage floating reactions
export function useFloatingReactions() {
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  const [showBar, setShowBar] = useState(false);

  const addReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = 20 + Math.random() * 60; // 20-80% from left
    setReactions(prev => [...prev, { id, emoji, x }]);

    // Remove after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 3000);
  }, []);

  const toggleBar = useCallback(() => {
    setShowBar(prev => !prev);
  }, []);

  return { reactions, addReaction, showBar, setShowBar, toggleBar };
}
