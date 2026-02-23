import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Colors, Fonts, Radius, Spacing } from '../theme';

export default function AuthScreen() {
  const [mode,     setMode]     = useState<'login' | 'signup'>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setError('');
    setBusy(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // Auth state change in AuthContext handles navigation
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Navigation will gate to RoleSelectScreen (no role yet)
      }
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/user-not-found':    'No account found with that email.',
        'auth/wrong-password':    'Incorrect password.',
        'auth/email-already-in-use': 'That email is already registered.',
        'auth/weak-password':     'Password must be at least 6 characters.',
        'auth/invalid-email':     'Please enter a valid email address.',
        'auth/invalid-credential': 'Incorrect email or password.',
      };
      setError(msg[e.code] ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <Text style={styles.logo}>
              MOTI<Text style={{ color: Colors.cyan }}>coach</Text>
            </Text>
            <Text style={styles.tagline}>Train smarter. Win together.</Text>
          </View>

          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, isLogin && styles.modeBtnActive]}
              onPress={() => { setMode('login'); setError(''); }}
            >
              <Text style={[styles.modeBtnText, isLogin && styles.modeBtnTextActive]}>LOG IN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, !isLogin && styles.modeBtnActive]}
              onPress={() => { setMode('signup'); setError(''); }}
            >
              <Text style={[styles.modeBtnText, !isLogin && styles.modeBtnTextActive]}>SIGN UP</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={Colors.muted}
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={isLogin ? '••••••••' : 'min 6 characters'}
              placeholderTextColor={Colors.muted}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, busy && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.submitText}>{isLogin ? 'LOG IN' : 'CREATE ACCOUNT'}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Footer hint */}
          <Text style={styles.hint}>
            {isLogin
              ? "Don't have an account? "
              : 'Already have an account? '}
            <Text
              style={{ color: Colors.cyan }}
              onPress={() => { setMode(isLogin ? 'signup' : 'login'); setError(''); }}
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  kav:       { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 40,
  },

  brand: { alignItems: 'center', marginBottom: 40 },
  logo: {
    fontFamily: Fonts.orbitron,
    fontSize: 32,
    color: Colors.text,
    letterSpacing: 4,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.dim,
    letterSpacing: 1,
  },

  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: 28,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Colors.cyan },
  modeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.5,
  },
  modeBtnTextActive: { color: '#000' },

  form: { marginBottom: 24 },
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
  error: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.red,
    marginTop: 12,
    letterSpacing: 0.3,
  },
  submitBtn: {
    marginTop: 24,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontFamily: Fonts.orbitron,
    fontSize: 13,
    color: '#000',
    letterSpacing: 2,
  },

  hint: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.dim,
    textAlign: 'center',
  },
});
