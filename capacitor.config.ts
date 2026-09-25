import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.portioshop.app',
  appName: 'Portfolio Shop',
  webDir: 'dist',
  server: {
    // Trỏ trực tiếp về Domain Production của Vercel hoặc Shared URL của AI Studio
    // Cho phép OTA Live Update tức thì không cần build lại file APK
    url: process.env.CAPACITOR_SERVER_URL || 'https://ais-pre-cbg6p5tmrlyzcymqqfrmqj-395109314000.asia-southeast1.run.app',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A',
      overlaysWebView: false,
    },
  },
};

export default config;
