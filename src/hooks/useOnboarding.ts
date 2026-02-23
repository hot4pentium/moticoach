import { useState, useCallback } from 'react';

export function useOnboarding(key: string, totalSteps: number) {
  const storageKey = `onboarding_${key}`;

  const isDoneInitially = (() => {
    if (typeof localStorage === 'undefined') return true;
    if (localStorage.getItem(storageKey) === 'done') return true;
    // Mark as done immediately — only shows this one load
    localStorage.setItem(storageKey, 'done');
    return false;
  })();

  const [step,   setStep]   = useState(0);
  const [isDone, setIsDone] = useState(isDoneInitially);

  const markDone = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, 'done');
    }
    setIsDone(true);
  }, [storageKey]);

  const next = useCallback(() => {
    setStep(prev => {
      const next = prev + 1;
      if (next >= totalSteps) { markDone(); return prev; }
      return next;
    });
  }, [totalSteps, markDone]);

  const dismiss = useCallback(() => {
    markDone();
  }, [markDone]);

  return { step, next, dismiss, isDone };
}
