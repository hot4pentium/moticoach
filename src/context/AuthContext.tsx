import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { registerWebPush } from '../lib/notifications';

export type UserRole = 'coach' | 'staff' | 'supporter' | 'athlete';

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
}

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  teamCode: string | null;
  displayName: string | null;
  notificationPrefs: NotificationPrefs;
  loading: boolean;
  setRole: (r: UserRole) => void;
  setTeamCode: (c: string) => void;
  setDisplayName: (n: string) => void;
  setNotificationPrefs: (p: NotificationPrefs) => void;
}

const DEFAULT_PREFS: NotificationPrefs = { email: true, push: true };

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  teamCode: null,
  displayName: null,
  notificationPrefs: DEFAULT_PREFS,
  loading: true,
  setRole: () => {},
  setTeamCode: () => {},
  setDisplayName: () => {},
  setNotificationPrefs: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,              setUser]              = useState<User | null>(null);
  const [role,              setRole]              = useState<UserRole | null>(null);
  const [teamCode,          setTeamCode]          = useState<string | null>(null);
  const [displayName,       setDisplayName]       = useState<string | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading,           setLoading]           = useState(true);

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
          const prefs: NotificationPrefs = {
            email: data?.notificationPrefs?.email ?? true,
            push:  data?.notificationPrefs?.push  ?? true,
          };
          setNotificationPrefs(prefs);
          // Register web push non-blocking (no-ops if not standalone or push pref off)
          if (prefs.push) registerWebPush(firebaseUser.uid);
        } catch {
          setRole(null);
          setTeamCode(null);
          setDisplayName(null);
          setNotificationPrefs(DEFAULT_PREFS);
        }
      } else {
        setRole(null);
        setTeamCode(null);
        setDisplayName(null);
        setNotificationPrefs(DEFAULT_PREFS);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, role, teamCode, displayName, notificationPrefs, loading,
      setRole, setTeamCode, setDisplayName, setNotificationPrefs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
