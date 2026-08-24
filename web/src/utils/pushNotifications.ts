import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { registerPushToken, unregisterPushToken } from '../api/userApi';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const isConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && vapidKey
);

let app: FirebaseApp | null = null;
let currentToken: string | null = null;
let listenerAttached = false;

// Same "fail soft, log once" idiom as the backend's pushNotifier.ts and
// mobile's push_service.dart — no Firebase project is configured by default,
// so this quietly does nothing rather than throwing during login.
export async function registerForPushNotifications(): Promise<void> {
  if (!isConfigured) {
    console.log('[push] Firebase not configured (see .env.example) — skipping push registration.');
    return;
  }
  if (typeof window === 'undefined' || !(await isSupported())) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  if (!app) app = initializeApp(firebaseConfig);

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (token) {
    currentToken = token;
    await registerPushToken(token);
  }

  // Background messages are shown automatically by the service worker;
  // foreground ones need to be surfaced explicitly, since the browser
  // doesn't auto-display a notification for a page that's already open.
  if (!listenerAttached) {
    listenerAttached = true;
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'Sartora';
      const body = payload.notification?.body;
      new Notification(title, { body });
    });
  }
}

export async function unregisterForPushNotifications(): Promise<void> {
  if (!currentToken) return;
  const token = currentToken;
  currentToken = null;
  await unregisterPushToken(token).catch(() => {});
}
