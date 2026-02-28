import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuth, UserRole } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { DEMO_TEAMS } from '../lib/demoData';

type RoleOption = { role: UserRole; label: string; desc: string; icon: string; needsCode: boolean };

const ROLE_OPTIONS: RoleOption[] = [
  {
    role:      'coach',
    label:     'COACH',
    desc:      'Enter the team code from your org admin to claim your team and access the full coaching suite.',
    icon:      '🏟️',
    needsCode: true,
  },
  {
    role:      'supporter',
    label:     'SUPPORTER / PARENT',
    desc:      'Follow your team, access Game Day Live, view the roster and playbook.',
    icon:      '📣',
    needsCode: true,
  },
  {
    role:      'athlete',
    label:     'ATHLETE',
    desc:      'Join your team, track your own stats, and access all team content.',
    icon:      '⚡',
    needsCode: true,
  },
];

export default function RoleSelectScreen() {
  const { user, setRole, setTeamCode: setCtxTeamCode, setDisplayName: setCtxDisplayName } = useAuth();
  const [selected,  setSelected]  = useState<UserRole | null>(null);
  const [teamCode,  setTeamCode]  = useState('');
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);


  const handleConfirm = async () => {
    if (!selected || !user) return;
    if (!teamCode.trim()) {
      setError('Enter your team code to continue.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const code = teamCode.trim().toUpperCase();

      if (selected === 'coach') {
        const teamSnap = await getDoc(doc(db, 'teams', code));
        if (!teamSnap.exists()) {
          // Fallback: check if it's a pending demo team and seed it
          const demoTeam = DEMO_TEAMS.find(t => t.code === code && t.status === 'setup');
          if (demoTeam) {
            await setDoc(doc(db, 'teams', code), {
              coachUid:     user.uid,
              teamName:     demoTeam.name,
              sport:        demoTeam.sportId,
              leagueId:     demoTeam.leagueId,
              isPaid:       false,
              status:       'active',
              badges:       ['game_first', 'roster_full'],
              gamesTracked: 1,
              createdAt:    serverTimestamp(),
            });
          } else {
            setError('Team code not found. Check with your org admin.');
            setBusy(false);
            return;
          }
        } else {
          const teamData = teamSnap.data();
          const isDemoCode = DEMO_TEAMS.some(t => t.code === code);
          if (!isDemoCode && teamData.coachUid !== null && teamData.coachUid !== undefined) {
            setError('A coach has already claimed this team.');
            setBusy(false);
            return;
          }
          await updateDoc(doc(db, 'teams', code), {
            coachUid: user.uid,
            status:   'active',
          });
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        role:        selected,
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Coach',
        teamCode:    code,
        createdAt:   serverTimestamp(),
      });

      // Clear legacy non-UID onboarding key so old dev installs don't block it
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('onboarding_dashboard');
      }
      const name = user.displayName ?? user.email?.split('@')[0] ?? 'Coach';
      setCtxTeamCode(code);
      setCtxDisplayName(name);
      setRole(selected);
    } catch {
      setError('Could not save your role. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>
          {/* Header */}
          <Text style={styles.heading}>WHO ARE YOU?</Text>
          <Text style={styles.sub}>Choose your role to set up your experience.</Text>

          {/* Role cards */}
          <View style={styles.cards}>
            {ROLE_OPTIONS.map(opt => {
              const active = selected === opt.role;
              return (
                <TouchableOpacity
                  key={opt.role}
                  style={[styles.card, active && styles.cardActive]}
                  onPress={() => { setSelected(opt.role); setError(''); if (opt.role === 'coach') setTeamCode('GG354'); else setTeamCode(''); }}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <Text style={styles.cardIcon}>{opt.icon}</Text>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardLabel, active && { color: Colors.cyan }]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.cardDesc}>{opt.desc}</Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Team code — required for all roles */}
          {selected && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>TEAM CODE</Text>
              <TextInput
                style={[styles.input, styles.codeInput, selected === 'coach' && styles.codeInputLocked]}
                value={teamCode}
                onChangeText={t => setTeamCode(t.toUpperCase())}
                placeholder="e.g. RVR-2025"
                placeholderTextColor={Colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={selected !== 'coach'}
                selectTextOnFocus={false}
              />
              <Text style={styles.fieldHint}>
                {selected === 'coach'
                  ? '🔒 Demo code — pre-loaded for testing.'
                  : 'Get this from your coach.'}
              </Text>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, (!selected || busy) && { opacity: 0.5 }]}
            onPress={handleConfirm}
            disabled={!selected || busy}
            activeOpacity={0.85}
          >
            {busy
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.confirmText}>CONFIRM ROLE</Text>
            }
          </TouchableOpacity>

          {/* Sign out escape hatch */}
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>← Sign out</Text>
          </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 40,
    paddingBottom: 40,
  },

  heading: {
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 3,
    marginBottom: 6,
  },
  sub: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.dim,
    marginBottom: 28,
    letterSpacing: 0.3,
  },

  cards: { gap: 10, marginBottom: 24 },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
  },
  cardActive: {
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: { fontSize: 24, marginTop: 2 },
  cardInfo: { flex: 1 },
  cardLabel: {
    fontFamily: Fonts.orbitron,
    fontSize: 11,
    color: Colors.text,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.dim,
    lineHeight: 18,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioActive: { borderColor: Colors.cyan },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.cyan },

  fieldBlock: { marginBottom: 16 },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontFamily: Fonts.rajdhani,
    fontSize: 16,
  },
  codeInput: {
    fontFamily: Fonts.orbitron,
    fontSize: 18,
    letterSpacing: 3,
    color: Colors.cyan,
  },
  codeInputLocked: {
    opacity: 0.55,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  fieldHint: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    marginTop: 5,
    letterSpacing: 0.3,
  },

  error: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.red,
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  confirmBtn: {
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmText: {
    fontFamily: Fonts.orbitron,
    fontSize: 13,
    color: '#000',
    letterSpacing: 2,
  },

  signOutBtn: { alignItems: 'center', padding: 8 },
  signOutText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
});
