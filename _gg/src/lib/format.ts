// اختصار الأرقام للألف K والمليون M والبليون B
// 1000 → 1K، 10542 → 10.5K، 1200000 → 1.2M، 2500000000 → 2.5B
// أقل من 1000 يبقى كما هو، ويُحذف الصفر العشري الزائد (10.0K → 10K)
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return sign + trimZeros((abs / 1_000_000_000).toFixed(1)) + 'B';
  }
  if (abs >= 1_000_000) {
    return sign + trimZeros((abs / 1_000_000).toFixed(1)) + 'M';
  }
  if (abs >= 1_000) {
    return sign + trimZeros((abs / 1_000).toFixed(1)) + 'K';
  }
  return sign + String(abs);
}

function trimZeros(s: string): string {
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}
