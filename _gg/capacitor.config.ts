import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bengharbios.ggames',
  appName: 'G-Games',
  webDir: 'out',
  // Point to live deployment URL (WebView wrapper mode)
  server: {
    url: 'https://g-g-brown.vercel.app',
    androidScheme: 'https',
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
