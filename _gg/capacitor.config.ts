import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bengharbios.ggames',
  appName: 'G-Games',
  webDir: 'out',
  // Point to live deployment URL (WebView wrapper mode)
  server: {
    url: 'https://ggame3.vercel.app',
    androidScheme: 'https',
    // عند انقطاع الإنترنت أو فشل تحميل الرابط الأساسي، يعرض WebView
    // صفحة /offline.html المضمنة محلياً بدلاً من صفحة المتصفح
    // "Page Web non disponible" — النملة الجارية + زر إعادة الاتصال
    errorPath: 'offline.html',
  },
  // Splash screen settings
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0D8A7A',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
  // Allow mixed content (API calls to external services)
  android: {
    allowMixedContent: true,
  },
};

export default config;
