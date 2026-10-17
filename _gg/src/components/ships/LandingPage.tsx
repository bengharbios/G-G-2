'use client';
import { useRouter } from 'next/navigation';

export default function LandingPage({ onStartLocal, onStartDiwaniya }: {
  onStartLocal: () => void;
  onStartDiwaniya?: () => void;
}) {
  const router = useRouter();
  return (
    <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center tobol-bg" style={{ background: 'url(/img/ship/themes/theme1/background.png) center / cover, #0a0b10' }}>
      <div style={{ fontSize: '80px', marginBottom: '20px' }}>🚢</div>
      <h1 style={{ color: '#feef91', fontSize: '32px', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,.85)', marginBottom: '20px' }}>سفن</h1>
      <p style={{ color: '#9fc4b4', fontSize: '14px', marginBottom: '30px', textAlign: 'center', maxWidth: '300px' }}>
        ضع أسطولك بذكاء ثم قصف سفن خصمك قبل أن يقصف سفنك!
      </p>
      <button onClick={onStartLocal} style={{
        background: 'linear-gradient(135deg, #6366f1, #4338ca)',
        color: '#fff', border: 'none', borderRadius: '12px',
        padding: '14px 30px', fontSize: '16px', fontWeight: 800,
        cursor: 'pointer', marginBottom: '10px', width: '250px',
      }}>العرّاب (لاعب واحد)</button>
      {onStartDiwaniya && (
        <button onClick={onStartDiwaniya} style={{
          background: 'linear-gradient(135deg, #10b981, #047857)',
          color: '#fff', border: 'none', borderRadius: '12px',
          padding: '14px 30px', fontSize: '16px', fontWeight: 800,
          cursor: 'pointer', width: '250px',
        }}>الديوانية (متعدد اللاعبين)</button>
      )}
      <button onClick={() => router.push('/')} style={{
        background: 'none', border: 'none', color: '#9fc4b4',
        fontSize: '12px', cursor: 'pointer', marginTop: '20px',
      }}>← العودة</button>
    </div>
  );
}
