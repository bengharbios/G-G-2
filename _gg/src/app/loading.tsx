import GazelleLoader from '@/components/shared/GazelleLoader';

/**
 * loading.tsx — يُعرض تلقائياً من Next.js App Router أثناء تحميل أي صفحة.
 *
 * ملاحظة: هذا يُعرض فقط أثناء التحميل الأولي للـ route قبل hydrate React.
 * بعد hydrate، NetworkStatusProvider يعرض AntLoaderOverlay (عنصر عائم فوق
 * الصفحات الحالية بدلاً من استبدالها).
 *
 * نُظهر النملة كاملة الشاشة (fullScreen) مع تدرّج أخضر يلا لودو، لأن
 * loading.tsx يستبدل الصفحة بالكامل — لا توجد صفحة سابقة للحفاظ عليها.
 */
export default function Loading() {
  return <GazelleLoader fullScreen label="جارٍ التحضير..." />;
}
