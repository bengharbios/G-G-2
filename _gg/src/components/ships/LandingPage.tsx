'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

export default function LandingPage({ onStartLocal, onStartDiwaniya }: {
  onStartLocal: () => void;
  onStartDiwaniya?: () => void;
}) {
  const router = useRouter();
  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/img/ship/themes/theme1/background.png) center / cover no-repeat, linear-gradient(180deg, #0a0b10 0%, #12141d 30%, #0d0e16 60%, #0a0b10 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '30px' }}
      >
        <div style={{ fontSize: '60px', marginBottom: '12px' }}>🚢</div>
        <h1 style={{
          ...STROKE_STYLE,
          fontSize: '28px',
          fontWeight: 900,
          textShadow: '0 2px 6px rgba(0,0,0,.85)',
          marginBottom: '8px',
        }}>سفن</h1>
        <p style={{ color: '#9fc4b4', fontSize: '12px', fontWeight: 600 }}>
          Battleship — ضع أسطولك بذكاء ثم قصف سفن خصمك
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartLocal}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4338ca)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '16px 24px',
            fontSize: '16px',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(99,102,241,.35)',
          }}
        >
          <span style={{ fontSize: '20px' }}>👑</span>
          العرّاب (لاعب واحد ضد الكمبيوتر)
        </motion.button>

        {onStartDiwaniya && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStartDiwaniya}
            style={{
              background: 'linear-gradient(135deg, #10b981, #047857)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(16,185,129,.35)',
            }}
          >
            <span style={{ fontSize: '20px' }}>🏠</span>
            الديوانية (متعدد اللاعبين)
          </motion.button>
        )}

        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#9fc4b4',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '10px',
          }}
        >← العودة للرئيسية</button>
      </motion.div>
    </div>
  );
}
