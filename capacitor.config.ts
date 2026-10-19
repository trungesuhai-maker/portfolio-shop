import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.portioshop.app',
  appName: 'Portfolio Shop',
  webDir: 'dist',
  server: {
    url: 'https://portfolio-shop-all.vercel.app',
    cleartext: true,
    androidScheme: 'https',
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
