export default {
  expo: {
    name: "Dwello",
    slug: "dwello",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://gjfyiqdpysudxfiodvbf.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZnlpcWRweXN1ZHhmaW9kdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Mzk3MDMsImV4cCI6MjA2NDExNTcwM30.JNfhPx6CZUsuOuDBJ6o-y504VD2CZwt9Ij8oTeK41WE"
    },
    "plugins": [
      "expo-web-browser"
    ]
  }
}; 