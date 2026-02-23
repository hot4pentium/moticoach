import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { registerPushToken } from '../lib/notifications';

export type UserRole = 'coach' | 'staff' | 'supporter' | 'athlete';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  teamCode: string | null;
  displayName: string | null;
  loading: boolean;
  setRole: (r: UserRole) => void;
  setTeamCode: (c: string) => void;
  setDisplayName: (n: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  teamCode: null,
  displayName: null,
  loading: true,
  setRole: () => {},
  setTeamCode: () => {},
  setDisplayName: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null);
  const [role,        setRole]        = useState<UserRole | null>(null);
  const [teamCode,    setTeamCode]    = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          const data = snap.data();
          setRole((data?.role as UserRole) ?? null);
          setTeamCode(data?.teamCode ?? null);
          setDisplayName(
            data?.displayName ??
            firebaseUser.displayName ??
            firebaseUser.email?.split('@')[0] ??
            null
          );
          // Register push token non-blocking (no-ops on web)
          registerPushToken(firebaseUser.uid);
        } catch {
          setRole(null);
          setTeamCode(null);
          setDisplayName(null);
        }
      } else {
        setRole(null);
        setTeamCode(null);
        setDisplayName(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, teamCode, displayName, loading, setRole, setTeamCode, setDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
