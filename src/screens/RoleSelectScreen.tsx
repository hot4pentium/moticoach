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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuth, UserRole } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

type RoleOption = { role: UserRole; label: string; desc: string; icon: string; needsCode: boolean };

const ROLE_OPTIONS: RoleOption[] = [
  {
    role:      'coach',
    label:     'COACH',
    desc:      'Create a team and run the full coaching suite — stat tracker, playmaker, prep book, roster management.',
    icon:      '🏟️',
    needsCode: false,
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
  const [teamName,  setTeamName]  = useState('');
  const [error,     setError]     = useState('');
  const [busy,      setBusy]      = useState(false);

  const option = ROLE_OPTIONS.find(o => o.role === selected);
  const needsCode = option?.needsCode ?? false;

  const handleConfirm = async () => {
    if (!selected || !user) return;
    if (needsCode && !teamCode.trim()) {
      setError('Enter your team code to continue.');
      return;
    }
    if (selected === 'coach' && !teamName.trim()) {
      setError('Enter a team name to continue.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const code = needsCode
        ? teamCode.trim().toUpperCase()
        : generateCode(user.uid);

      await setDoc(doc(db, 'users', user.uid), {
        role:        selected,
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Coach',
        teamCode:    code,
        createdAt:   serverTimestamp(),
      });

      if (selected === 'coach') {
        await setDoc(doc(db, 'teams', code), {
          coachUid:  user.uid,
          teamName:  teamName.trim(),
          sport:     'soccer',
          teamXp:    0,
          createdAt: serverTimestamp(),
        });
      }

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
                  onPress={() => { setSelected(opt.role); setError(''); }}
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

          {/* Conditional fields */}
          {selected === 'coach' && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>TEAM NAME</Text>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="e.g. Riverside Rockets"
                placeholderTextColor={Colors.muted}
                autoCapitalize="words"
              />
              <Text style={styles.fieldHint}>
                A unique team code will be generated for you to share with players.
              </Text>
            </View>
          )}

          {needsCode && (
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>TEAM CODE</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={teamCode}
                onChangeText={t => setTeamCode(t.toUpperCase())}
                placeholder="e.g. RVR-2025"
                placeholderTextColor={Colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.fieldHint}>Get this from your coach.</Text>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function generateCode(uid: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
    if (i === 2 || i === 5) code += '-';
  }
  return code.slice(0, 11);
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
