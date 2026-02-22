import React, { createContext, useContext, useState } from 'react';
import { Sport } from '../screens/PlayEditorScreen';

interface CoachContextValue {
  coachSport: Sport;
  setCoachSport: (s: Sport) => void;
  greyScale: number;
  setGreyScale: (n: number) => void;
}

const CoachContext = createContext<CoachContextValue>({
  coachSport: 'soccer',
  setCoachSport: () => {},
  greyScale: 0,
  setGreyScale: () => {},
});

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [coachSport, setCoachSport] = useState<Sport>('soccer');
  const [greyScale, setGreyScale] = useState(0);
  return (
    <CoachContext.Provider value={{ coachSport, setCoachSport, greyScale, setGreyScale }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoach() {
  return useContext(CoachContext);
}
