'use client';

export default function WizardDuelPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(180deg, #1a0833 0%, #0a0418 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: '#c4a3e8',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔮</div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px' }}>مبارزة السحرة</h1>
        <p style={{ fontSize: '14px', opacity: 0.7 }}>قيد التطوير — سيتم إطلاقها قريباً</p>
      </div>
    </div>
  );
}
