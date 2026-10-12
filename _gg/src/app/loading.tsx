import GazelleLoader from '@/components/shared/GazelleLoader';

/**
 * loading.tsx — يُعرض تلقائياً من Next.js App Router أثناء تحميل أي صفحة.
 * نستخدم الغزال الجاري بدلاً من السبينر التقليدي لإضفاء طابع عربي مبهج.
 */
export default function Loading() {
  return <GazelleLoader fullScreen label="جارٍ التحضير..." />;
}
