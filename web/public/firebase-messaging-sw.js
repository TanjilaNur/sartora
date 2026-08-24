// Handles push messages that arrive while no tab has focus (background/closed
// browser) — the browser shows a system notification automatically once this
// registers a background handler. Foreground messages are handled instead by
// src/utils/pushNotifications.ts's onMessage listener, since a page that's
// already open should react in-app rather than via the OS notification tray.
//
// This file is served as a static asset (not bundled by Vite), so it can't
// read import.meta.env — the same public, non-secret Firebase Web config
// from your .env has to be duplicated here literally. Replace every value
// below with the ones from Firebase console → Project settings → General →
// Your apps → (Web app), matching web/.env's VITE_FIREBASE_* values.
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'REPLACE_WITH_VITE_FIREBASE_API_KEY',
  projectId: 'REPLACE_WITH_VITE_FIREBASE_PROJECT_ID',
  messagingSenderId: 'REPLACE_WITH_VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_VITE_FIREBASE_APP_ID',
});

firebase.messaging();
