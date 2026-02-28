import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Sport } from '../screens/PlayEditorScreen';
import { Badge, checkNewBadges } from '../lib/badges';
import { Colors } from '../theme';

export interface XpToast {
  prevXp: number;
  amount: number;
  label: string;
}

interface CoachContextValue {
  coachSport: Sport;
  setCoachSport: (s: Sport) => void;
  greyScale: number;
  setGreyScale: (n: number) => void;
  isPaid: boolean;
  // Team identity
  avatarUrl: string;
  badgeIcon: string;
  badgeColor: string;
  setAvatarUrl: (url: string) => void;
  setBadgeIcon: (icon: string) => void;
  setBadgeColor: (color: string) => void;
  // Badge system
  earnedBadges: string[];
  gamesTracked: number;
  playsCreated: number;
  rosterCount: number;
  setPlaysCreated: (n: number) => void;
  setRosterCount: (n: number) => void;
  pendingBadge: Badge | null;
  clearPendingBadge: () => void;
  recordGame: (sport: string) => void;
  // XP toast
  xpToast: XpToast | null;
  showXpToast: (toast: XpToast) => void;
  clearXpToast: () => void;
  // Settings sheet
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const CoachContext = createContext<CoachContextValue>({
  coachSport: 'soccer',
  setCoachSport: () => {},
  greyScale: 0,
  setGreyScale: () => {},
  isPaid: false,
  avatarUrl: '',
  badgeIcon: 'shield',
  badgeColor: Colors.cyan,
  setAvatarUrl: () => {},
  setBadgeIcon: () => {},
  setBadgeColor: () => {},
  earnedBadges: [],
  gamesTracked: 0,
  playsCreated: 0,
  rosterCount: 0,
  setPlaysCreated: () => {},
  setRosterCount: () => {},
  pendingBadge: null,
  clearPendingBadge: () => {},
  recordGame: () => {},
  xpToast: null,
  showXpToast: () => {},
  clearXpToast: () => {},
  settingsOpen: false,
  openSettings: () => {},
  closeSettings: () => {},
});

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const { teamCode } = useAuth();

  const [coachSport,   setCoachSport]   = useState<Sport>('baseball');
  const [greyScale,    setGreyScale]    = useState(0);
  const [isPaid,       setIsPaid]       = useState(false);
  const [avatarUrl,    setAvatarUrlState]  = useState('');
  const [badgeIcon,    setBadgeIconState]  = useState('shield');
  const [badgeColor,   setBadgeColorState] = useState(Colors.cyan);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [gamesTracked, setGamesTracked] = useState(0);
  const [playsCreated, setPlaysCreated] = useState(0);
  const [rosterCount,  setRosterCount]  = useState(0);
  const [badgeQueue,   setBadgeQueue]   = useState<Badge[]>([]);
  const [xpToast,      setXpToast]      = useState<XpToast | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pendingBadge = badgeQueue[0] ?? null;

  // Load team data from Firestore when teamCode is available
  useEffect(() => {
    if (!teamCode) return;
    getDoc(doc(db, 'teams', teamCode)).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (Array.isArray(data.badges))            setEarnedBadges(data.badges);
      if (typeof data.gamesTracked === 'number') setGamesTracked(data.gamesTracked);
      if (typeof data.playsCreated === 'number') setPlaysCreated(data.playsCreated);
      if (typeof data.isPaid === 'boolean')      setIsPaid(data.isPaid);
      if (typeof data.avatarUrl === 'string' && data.avatarUrl)   setAvatarUrlState(data.avatarUrl);
      if (typeof data.badgeIcon === 'string' && data.badgeIcon)   setBadgeIconState(data.badgeIcon);
      if (typeof data.badgeColor === 'string' && data.badgeColor) setBadgeColorState(data.badgeColor);
    }).catch(() => {/* silently ignore */});
  }, [teamCode]);

  const saveField = useCallback((patch: Record<string, unknown>) => {
    if (!teamCode) return;
    updateDoc(doc(db, 'teams', teamCode), patch).catch(() => {/* silently ignore */});
  }, [teamCode]);

  const setAvatarUrl = useCallback((url: string) => {
    setAvatarUrlState(url);
    saveField({ avatarUrl: url });
  }, [saveField]);

  const setBadgeIcon = useCallback((icon: string) => {
    setBadgeIconState(icon);
    saveField({ badgeIcon: icon });
  }, [saveField]);

  const setBadgeColor = useCallback((color: string) => {
    setBadgeColorState(color);
    saveField({ badgeColor: color });
  }, [saveField]);

  // Use refs to access latest state inside setState callbacks
  const earnedRef  = useRef(earnedBadges);
  const gamesRef   = useRef(gamesTracked);
  const playsRef   = useRef(playsCreated);
  const rosterRef  = useRef(rosterCount);
  earnedRef.current  = earnedBadges;
  gamesRef.current   = gamesTracked;
  playsRef.current   = playsCreated;
  rosterRef.current  = rosterCount;

  const saveBadgeData = useCallback((badges: string[], games: number) => {
    saveField({ badges, gamesTracked: games });
  }, [saveField]);

  const recordGame = useCallback((_sport: string) => {
    const newGames = gamesRef.current + 1;
    setGamesTracked(newGames);

    const newBadges = checkNewBadges(earnedRef.current, {
      gamesTracked: newGames,
      playsCreated: playsRef.current,
      rosterCount: rosterRef.current,
    });

    if (newBadges.length > 0) {
      const updatedEarned = [...earnedRef.current, ...newBadges.map(b => b.id)];
      setEarnedBadges(updatedEarned);
      setBadgeQueue(q => [...q, ...newBadges]);
      saveBadgeData(updatedEarned, newGames);
    } else {
      saveBadgeData(earnedRef.current, newGames);
    }
  }, [saveBadgeData]);

  const clearPendingBadge = useCallback(() => {
    setBadgeQueue(q => q.slice(1));
  }, []);

  const showXpToast = useCallback((toast: XpToast) => {
    setXpToast(toast);
  }, []);

  const clearXpToast = useCallback(() => {
    setXpToast(null);
  }, []);

  return (
    <CoachContext.Provider value={{
      coachSport, setCoachSport,
      greyScale, setGreyScale,
      isPaid,
      avatarUrl, badgeIcon, badgeColor,
      setAvatarUrl, setBadgeIcon, setBadgeColor,
      earnedBadges, gamesTracked, playsCreated, rosterCount,
      setPlaysCreated, setRosterCount,
      pendingBadge, clearPendingBadge, recordGame,
      xpToast, showXpToast, clearXpToast,
      settingsOpen, openSettings: () => setSettingsOpen(true), closeSettings: () => setSettingsOpen(false),
    }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  return useContext(CoachContext);
}
