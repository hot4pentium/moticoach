import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Sport } from '../screens/PlayEditorScreen';
import { Badge, checkNewBadges } from '../lib/badges';

const XP_THRESHOLDS = [0, 100, 250, 500, 1000];

function computeStage(xp: number): number {
  let stage = 0;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

function loadXp(): number {
  if (typeof localStorage === 'undefined') return 0;
  const stored = localStorage.getItem('teamXp');
  return stored ? parseInt(stored, 10) : 0;
}

interface XpToast {
  amount: number;
  prevXp: number;
  label: string;
}

interface CoachContextValue {
  coachSport: Sport;
  setCoachSport: (s: Sport) => void;
  greyScale: number;
  setGreyScale: (n: number) => void;
  teamXp: number;
  addXp: (amount: number, label?: string) => void;
  motiStage: number;
  // Badge system
  earnedBadges: string[];
  gamesTracked: number;
  trackedSports: string[];
  pendingBadge: Badge | null;
  clearPendingBadge: () => void;
  recordGameComplete: (sport: string, xpAmount: number) => void;
  // XP toast
  xpToast: XpToast | null;
  clearXpToast: () => void;
}

const CoachContext = createContext<CoachContextValue>({
  coachSport: 'soccer',
  setCoachSport: () => {},
  greyScale: 0,
  setGreyScale: () => {},
  teamXp: 0,
  addXp: () => {},
  motiStage: 0,
  earnedBadges: [],
  gamesTracked: 0,
  trackedSports: [],
  pendingBadge: null,
  clearPendingBadge: () => {},
  recordGameComplete: () => {},
  xpToast: null,
  clearXpToast: () => {},
});

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const { teamCode } = useAuth();

  const [coachSport,    setCoachSport]    = useState<Sport>('baseball');
  const [greyScale,     setGreyScale]     = useState(0);
  const [teamXp,        setTeamXp]        = useState<number>(loadXp);
  const [earnedBadges,  setEarnedBadges]  = useState<string[]>([]);
  const [gamesTracked,  setGamesTracked]  = useState(0);
  const [trackedSports, setTrackedSports] = useState<string[]>([]);
  const [badgeQueue,    setBadgeQueue]    = useState<Badge[]>([]);
  const [xpToast,       setXpToast]       = useState<XpToast | null>(null);
  const clearXpToast = useCallback(() => setXpToast(null), []);

  const motiStage = computeStage(teamXp);
  const pendingBadge = badgeQueue[0] ?? null;

  // Load badge data from Firestore when teamCode is available
  useEffect(() => {
    if (!teamCode) return;
    getDoc(doc(db, 'teams', teamCode)).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.badges))       setEarnedBadges(data.badges);
      if (typeof data.gamesTracked === 'number') setGamesTracked(data.gamesTracked);
      if (Array.isArray(data.trackedSports)) setTrackedSports(data.trackedSports);
    }).catch(() => {/* silently ignore */});
  }, [teamCode]);

  // Save badge data to Firestore (skips if no teamCode)
  const saveBadgeData = useCallback((
    badges: string[],
    games: number,
    sports: string[],
  ) => {
    if (!teamCode) return;
    updateDoc(doc(db, 'teams', teamCode), {
      badges,
      gamesTracked: games,
      trackedSports: sports,
    }).catch(() => {/* silently ignore */});
  }, [teamCode]);

  // Use a ref to access latest badge state inside setState callbacks
  const earnedRef   = useRef(earnedBadges);
  const gamesRef    = useRef(gamesTracked);
  const sportsRef   = useRef(trackedSports);
  earnedRef.current  = earnedBadges;
  gamesRef.current   = gamesTracked;
  sportsRef.current  = trackedSports;

  const addXpWithBadgeCheck = useCallback((amount: number, label = '+XP') => {
    setTeamXp(prev => {
      const next = prev + amount;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('teamXp', String(next));
      }
      // Check for new XP/stage badges after the XP update
      const newBadges = checkNewBadges(earnedRef.current, next, gamesRef.current, sportsRef.current);
      if (newBadges.length > 0) {
        const updatedEarned = [...earnedRef.current, ...newBadges.map(b => b.id)];
        setEarnedBadges(updatedEarned);
        setBadgeQueue(q => [...q, ...newBadges]);
        saveBadgeData(updatedEarned, gamesRef.current, sportsRef.current);
      } else {
        setXpToast({ amount, prevXp: prev, label });
      }
      return next;
    });
  }, [saveBadgeData]);

  const recordGameComplete = useCallback((sport: string, xpAmount: number) => {
    const newGames = gamesRef.current + 1;
    const newSports = sportsRef.current.includes(sport)
      ? sportsRef.current
      : [...sportsRef.current, sport];

    setGamesTracked(newGames);
    setTrackedSports(newSports);

    setTeamXp(prev => {
      const next = prev + xpAmount;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('teamXp', String(next));
      }
      const newBadges = checkNewBadges(earnedRef.current, next, newGames, newSports);
      if (newBadges.length > 0) {
        const updatedEarned = [...earnedRef.current, ...newBadges.map(b => b.id)];
        setEarnedBadges(updatedEarned);
        setBadgeQueue(q => [...q, ...newBadges]);
        saveBadgeData(updatedEarned, newGames, newSports);
      } else {
        setXpToast({ amount: xpAmount, prevXp: prev, label: 'GAME TRACKED' });
        saveBadgeData(earnedRef.current, newGames, newSports);
      }
      return next;
    });
  }, [saveBadgeData]);

  const clearPendingBadge = useCallback(() => {
    setBadgeQueue(q => q.slice(1));
  }, []);

  return (
    <CoachContext.Provider value={{
      coachSport, setCoachSport,
      greyScale, setGreyScale,
      teamXp, addXp: addXpWithBadgeCheck, motiStage,
      earnedBadges, gamesTracked, trackedSports,
      pendingBadge, clearPendingBadge, recordGameComplete,
      xpToast, clearXpToast,
    }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  return useContext(CoachContext);
}

export { XP_THRESHOLDS };
