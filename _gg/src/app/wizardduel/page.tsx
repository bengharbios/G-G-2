'use client';

import dynamic from 'next/dynamic';

const WizardDuelApp = dynamic(
  () => import('@/components/wizardduel/App').then(m => m.WizardDuelApp),
  {
    ssr: false,
    loading: () => (
      <div style={{ minHeight: '100vh', background: '#1a0833', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4a3e8' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔮</div>
          <p>جاري تحميل مبارزة السحرة...</p>
        </div>
      </div>
    ),
  }
);

export default function WizardDuelPage() {
  return <WizardDuelApp />;
}
