import path from 'path';
import { cert, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type SendResponse } from 'firebase-admin/messaging';

// No Firebase project is configured for local development by default — unlike
// mailer.ts, there's no throwaway auto-provisioned fallback for push (no
// equivalent of Ethereal exists for FCM), so this degrades to a silent no-op
// instead of throwing. Set FIREBASE_SERVICE_ACCOUNT_PATH to a service-account
// JSON key downloaded from your Firebase project (Project settings → Service
// accounts → Generate new private key) to enable real sends.
let appPromise: Promise<App | null> | null = null;

async function getApp(): Promise<App | null> {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    const credPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!credPath) {
      console.log('[push] FIREBASE_SERVICE_ACCOUNT_PATH not set — push notifications are disabled.');
      return null;
    }
    try {
      const serviceAccount = require(path.resolve(credPath));
      return initializeApp({ credential: cert(serviceAccount) });
    } catch (err) {
      console.error('[push] Failed to initialize Firebase Admin from FIREBASE_SERVICE_ACCOUNT_PATH:', err);
      return null;
    }
  })();

  return appPromise;
}

export interface PushResult {
  sent: number;
  failed: number;
  // Tokens FCM reports as permanently dead (app uninstalled, token rotated,
  // etc.) — the caller should stop storing these, or every future send pays
  // the same guaranteed failure again.
  invalidTokens: string[];
}

const FCM_MULTICAST_LIMIT = 500;

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<PushResult> {
  if (tokens.length === 0) return { sent: 0, failed: 0, invalidTokens: [] };

  const app = await getApp();
  if (!app) return { sent: 0, failed: tokens.length, invalidTokens: [] };

  const messaging = getMessaging(app);
  const invalidTokens: string[] = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < tokens.length; i += FCM_MULTICAST_LIMIT) {
    const batch = tokens.slice(i, i + FCM_MULTICAST_LIMIT);
    const response = await messaging.sendEachForMulticast({ tokens: batch, notification: { title, body }, data });

    response.responses.forEach((r: SendResponse, idx: number) => {
      if (r.success) {
        sent++;
        return;
      }
      failed++;
      const code = r.error?.code;
      if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
        invalidTokens.push(batch[idx]!);
      }
    });
  }

  return { sent, failed, invalidTokens };
}
