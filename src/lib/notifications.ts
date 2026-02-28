import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * VAPID public key — generated via: npx web-push generate-vapid-keys
 * Private key stored in Firebase Secret Manager: VAPID_PRIVATE_KEY
 * To set: firebase functions:secrets:set VAPID_PRIVATE_KEY
 */
const VAPID_PUBLIC_KEY = 'BALTBBBA1cPIuie-rKNDECO0rSwDAQAB9u21n86XUM3Lx_DMzM0OylVD32LMx1seFpL04PlztokD-KAqUQflx-g';

/**
 * Register for web push notifications.
 * Only activates when running as an installed PWA (display-mode: standalone).
 * Saves the PushSubscription to Firestore users/{uid}.webPushSubscription.
 */
export async function registerWebPush(uid: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  // Only subscribe when installed to home screen
  if (!window.matchMedia('(display-mode: standalone)').matches) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as ArrayBuffer,
    });

    await updateDoc(doc(db, 'users', uid), {
      webPushSubscription: JSON.stringify(sub),
    });
  } catch {
    // silently no-op if push not supported or permission denied
  }
}

/**
 * Clear the app badge — call when user opens the app and views messages.
 */
export function clearBadge(): void {
  if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
    (navigator as any).clearAppBadge().catch(() => {});
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
