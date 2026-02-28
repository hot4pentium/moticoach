import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Detects when a new service worker is waiting to activate (i.e. a new
 * app version has been deployed). Returns `needsUpdate` and `applyUpdate`.
 *
 * Only runs on web — no-ops on native.
 */
export function useSwUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;

    const check = (reg: ServiceWorkerRegistration) => {
      // Already a waiting worker means update is ready right now
      if (reg.waiting) {
        setNeedsUpdate(true);
        return;
      }
      // Watch for a new worker installing
      reg.addEventListener('updatefound', () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedsUpdate(true);
          }
        });
      });
    };

    navigator.serviceWorker.ready.then(check);

    // Poll every 60 s so long-lived sessions also catch updates
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then(reg => reg.update().then(() => check(reg)));
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const applyUpdate = () => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      // Reload once the new SW takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
    });
  };

  return { needsUpdate, applyUpdate };
}
