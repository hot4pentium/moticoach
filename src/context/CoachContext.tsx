import React, { createContext, useContext, useState, useCallback } from 'react';
import { Sport } from '../screens/PlayEditorScreen';

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

interface CoachContextValue {
  coachSport: Sport;
  setCoachSport: (s: Sport) => void;
  greyScale: number;
  setGreyScale: (n: number) => void;
  teamXp: number;
  addXp: (amount: number) => void;
  motiStage: number;
}

const CoachContext = createContext<CoachContextValue>({
  coachSport: 'soccer',
  setCoachSport: () => {},
  greyScale: 0,
  setGreyScale: () => {},
  teamXp: 0,
  addXp: () => {},
  motiStage: 0,
});

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [coachSport, setCoachSport] = useState<Sport>('baseball');
  const [greyScale,  setGreyScale]  = useState(0);
  const [teamXp,     setTeamXp]     = useState<number>(loadXp);

  const motiStage = computeStage(teamXp);

  const addXp = useCallback((amount: number) => {
    setTeamXp(prev => {
      const next = prev + amount;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('teamXp', String(next));
      }
      return next;
    });
  }, []);

  return (
    <CoachContext.Provider value={{ coachSport, setCoachSport, greyScale, setGreyScale, teamXp, addXp, motiStage }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  return useContext(CoachContext);
}

export { XP_THRESHOLDS };
