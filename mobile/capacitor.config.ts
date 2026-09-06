import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The web app is fully server-rendered (auth, database, server actions), so it
 * cannot be exported into the bundle. The shell therefore loads the deployed
 * site directly and `www/` exists only to satisfy Capacitor's webDir contract
 * and to show something useful when the device is offline.
 */
const config: CapacitorConfig = {
  appId: "sa.khabeer.app",
  appName: "خبير",
  webDir: "www",

  server: {
    url: process.env.KHABEER_URL ?? "https://khabeer-inky.vercel.app",
    cleartext: false,
  },

  ios: {
    // Matches --background in the web app, so there is no white flash on launch.
    backgroundColor: "#FAF7F2",
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#16233a",
      showSpinner: false,
    },
  },
};

export default config;
