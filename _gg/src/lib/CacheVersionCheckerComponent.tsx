'use client';

import { useCacheVersionChecker } from './useCacheVersionChecker';

/**
 * CacheVersionChecker — مكوّن فارغ (لا يُظهر شيء) يستخدم الـhook
 * useCacheVersionChecker الذي يفحص إصدار الـcache عند كل تحميل.
 * 
 * يُستخدم في layout.tsx الجذر ليعمل على كل الصفحات.
 */
export function CacheVersionChecker() {
  useCacheVersionChecker();
  return null;
}
