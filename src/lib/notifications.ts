import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Register an Expo push token for the given user.
 * Silently no-ops on web or when expo-notifications is not installed.
 */
export async function registerPushToken(uid: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Device = require('expo-device');
    if (!Device.isDevice) return;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require('expo-notifications');
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await updateDoc(doc(db, 'users', uid), { pushToken: token });
  } catch {
    // no-op on web or when expo-notifications is not installed
  }
}
