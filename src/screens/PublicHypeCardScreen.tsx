import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
  increment,
  serverTimestamp,
  orderBy,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import HypeCard, { HypeAthlete, HypeGame } from '../components/HypeCard';
import LogoMark from '../components/LogoMark';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Motivation {
  id: string;
  text: string;
  emoji?: string;
  senderName: string;
  createdAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LIKE_KEY = (tc: string, aid: string) => `hype_liked_${tc}_${aid}`;

const FOLLOW_KEY = (tc: string, aid: string) => `hype_followed_${tc}_${aid}`;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PublicHypeCardScreen({
  teamCode,
  athleteId,
}: {
  teamCode: string;
  athleteId: string;
}) {
  const [athlete, setAthlete]         = useState<HypeAthlete | null>(null);
  const [upcomingGames, setUpcoming]  = useState<HypeGame[]>([]);
  const [likeCount, setLikeCount]     = useState(0);
  const [hasLiked, setHasLiked]       = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [motivations, setMotivations] = useState<Motivation[]>([]);
  const [motText, setMotText]         = useState('');
  const [motName, setMotName]         = useState('');
  const [sending, setSending]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const [followHint, setFollowHint]   = useState(false);

  const followHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load roster doc ─────────────────────────────────────────────────────
  useEffect(() => {
    const rosterRef = doc(db, 'teams', teamCode, 'roster', athleteId);

    const unsub = onSnapshot(rosterRef, snap => {
      if (!snap.exists()) { setLoading(false); return; }
      const d = snap.data();

      setLikeCount(d.publicLikes ?? 0);

      // Build HypeAthlete from roster fields
      const nameParts = (d.name ?? '').split(' ');
      const a: HypeAthlete = {
        id:        athleteId,
        firstName: nameParts[0] ?? '—',
        lastName:  nameParts.slice(1).join(' ') || '—',
        jersey:    String(d.jersey ?? '?'),
        position:  d.position ?? 'Player',
        sport:     'soccer',
        stats: [
          { label: 'Goals',   val: '—', accent: true },
          { label: 'Assists', val: '—' },
          { label: 'Games',   val: '—' },
          { label: 'Shot %',  val: '—', accent: true },
        ],
      };
      setAthlete(a);
      setLoading(false);
    }, () => setLoading(false));

    return unsub;
  }, [teamCode, athleteId]);

  // ── Load upcoming games from team events ────────────────────────────────
  useEffect(() => {
    getDoc(doc(db, 'teams', teamCode)).then(snap => {
      if (!snap.exists()) return;
      // events are in sub-collection
    }).catch(() => {});
    // Use static fallback since events sub-collection requires more wiring
    const today = new Date();
    setUpcoming([
      { title: 'Next Game', date: `${MONTHS[today.getMonth()]} ${today.getDate() + 7}`, time: '—', isHome: true },
    ]);
  }, [teamCode]);

  // ── Load motivations ────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, 'teams', teamCode, 'roster', athleteId, 'motivations'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );
    const unsub = onSnapshot(q, snap => {
      setMotivations(snap.docs.map(d => ({
        id:         d.id,
        text:       d.data().text,
        emoji:      d.data().emoji,
        senderName: d.data().senderName ?? 'A fan',
        createdAt:  d.data().createdAt?.toDate() ?? new Date(),
      })));
    }, () => {});
    return unsub;
  }, [teamCode, athleteId]);

  // ── Restore liked/followed state ────────────────────────────────────────
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    setHasLiked(localStorage.getItem(LIKE_KEY(teamCode, athleteId)) === '1');
    setIsFollowing(localStorage.getItem(FOLLOW_KEY(teamCode, athleteId)) === '1');
  }, [teamCode, athleteId]);

  // ── Like ────────────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    setLikeCount(c => c + 1);
    localStorage.setItem(LIKE_KEY(teamCode, athleteId), '1');
    try {
      await updateDoc(doc(db, 'teams', teamCode, 'roster', athleteId), {
        publicLikes: increment(1),
      });
    } catch {
      // doc may not exist yet — silently ignore
    }
  };

  // ── Follow ──────────────────────────────────────────────────────────────
  const handleFollow = () => {
    if (isFollowing) return;
    setIsFollowing(true);
    localStorage.setItem(FOLLOW_KEY(teamCode, athleteId), '1');

    // Show PWA install hint
    setFollowHint(true);
    if (followHintTimer.current) clearTimeout(followHintTimer.current);
    followHintTimer.current = setTimeout(() => setFollowHint(false), 5000);

    // Android: trigger native install prompt if available
    const w = window as any;
    if (w._deferredInstallPrompt) {
      w._deferredInstallPrompt.prompt();
    }
  };

  // ── Submit motivation ───────────────────────────────────────────────────
  const submitMotivation = async () => {
    const trimmed = motText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'teams', teamCode, 'roster', athleteId, 'motivations'), {
        text:       trimmed,
        senderName: motName.trim() || 'A fan',
        createdAt:  serverTimestamp(),
      });
      setMotText('');
      setMotName('');
    } catch {
      // silently ignore
    } finally {
      setSending(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color={Colors.cyan} size="large" />
      </View>
    );
  }

  if (!athlete) {
    return (
      <View style={s.loadingWrap}>
        <Text style={s.notFound}>Card not found.</Text>
        <Text style={s.notFoundSub}>Check the link and try again.</Text>
      </View>
    );
  }

  const firstName = athlete.firstName;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={s.logoRow}>
            <LogoMark size="sm" />
          </View>

          {/* Card */}
          <View style={s.cardWrap}>
            <HypeCard athlete={athlete} upcomingGames={upcomingGames} teamCode={teamCode} />
          </View>

          {/* Like + Follow */}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.likeBtn, hasLiked && s.likeBtnActive]}
              onPress={handleLike}
              activeOpacity={0.8}
            >
              <Text style={[s.likeBtnIcon, hasLiked && s.likeBtnIconActive]}>
                {hasLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={[s.likeBtnCount, hasLiked && s.likeBtnCountActive]}>
                {likeCount > 0 ? likeCount : ''}
              </Text>
              <Text style={[s.likeBtnText, hasLiked && s.likeBtnTextActive]}>
                {hasLiked ? 'LIKED' : 'LIKE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.followBtn, isFollowing && s.followBtnActive]}
              onPress={handleFollow}
              activeOpacity={0.8}
            >
              <Text style={[s.followBtnText, isFollowing && s.followBtnTextActive]}>
                {isFollowing ? '✓ FOLLOWING' : `FOLLOW ${firstName.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Follow hint */}
          {followHint && (
            <View style={s.followHint}>
              <Text style={s.followHintText}>
                📱 Add this page to your home screen to follow {firstName}'s card anytime.
              </Text>
            </View>
          )}

          {/* Motivations feed */}
          <View style={s.motivationsSection}>
            <Text style={s.sectionLabel}>MOTIVATIONS</Text>

            {/* Input */}
            <View style={s.motInputCard}>
              <TextInput
                style={s.motNameInput}
                value={motName}
                onChangeText={setMotName}
                placeholder="Your name (optional)"
                placeholderTextColor={Colors.muted}
                maxLength={40}
              />
              <View style={s.motRow}>
                <TextInput
                  style={s.motInput}
                  value={motText}
                  onChangeText={setMotText}
                  placeholder={`Send ${firstName} a motivation...`}
                  placeholderTextColor={Colors.muted}
                  maxLength={120}
                  multiline
                />
                <TouchableOpacity
                  style={[s.motSendBtn, (!motText.trim() || sending) && { opacity: 0.4 }]}
                  onPress={submitMotivation}
                  disabled={!motText.trim() || sending}
                  activeOpacity={0.8}
                >
                  {sending
                    ? <ActivityIndicator color="#000" size="small" />
                    : <Text style={s.motSendBtnText}>SEND</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Feed */}
            {motivations.length === 0 ? (
              <View style={s.motEmpty}>
                <Text style={s.motEmptyText}>Be the first to send {firstName} a motivation!</Text>
              </View>
            ) : (
              motivations.map(m => (
                <View key={m.id} style={s.motItem}>
                  <View style={s.motItemHeader}>
                    <Text style={s.motSender}>{m.senderName}</Text>
                    <Text style={s.motTs}>
                      {m.createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={s.motText}>{m.text}</Text>
                </View>
              ))
            )}
          </View>

          {/* Footer CTA */}
          <View style={s.footerCta}>
            <Text style={s.footerCtaText}>
              Want to follow the whole team?
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (typeof window !== 'undefined') window.location.href = '/';
              }}
            >
              <Text style={s.footerCtaLink}>Join LeagueMatrix →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound:    { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, letterSpacing: 1 },
  notFoundSub: { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.muted },

  scroll: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },

  logoRow: { alignSelf: 'flex-start', marginBottom: Spacing.md },

  cardWrap: { marginBottom: Spacing.lg },

  // Like + Follow row
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    maxWidth: 340,
    marginBottom: Spacing.sm,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border2,
    backgroundColor: Colors.card,
  },
  likeBtnActive: {
    borderColor: '#e8735a',
    backgroundColor: 'rgba(232,115,90,0.1)',
  },
  likeBtnIcon:      { fontSize: 16 },
  likeBtnIconActive: {},
  likeBtnCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 13,
    color: Colors.dim,
    minWidth: 16,
  },
  likeBtnCountActive: { color: '#e8735a' },
  likeBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dim,
    letterSpacing: 1.5,
  },
  likeBtnTextActive: { color: '#e8735a' },

  followBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.cyan,
    backgroundColor: 'transparent',
  },
  followBtnActive: {
    borderColor: Colors.green,
    backgroundColor: `${Colors.green}15`,
  },
  followBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.cyan,
    letterSpacing: 1.5,
  },
  followBtnTextActive: { color: Colors.green },

  // Follow hint
  followHint: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: `${Colors.cyan}15`,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.cyan}40`,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  followHintText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.cyan,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Motivations
  motivationsSection: {
    width: '100%',
    maxWidth: 340,
    marginTop: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },

  motInputCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  motNameInput: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.dim,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
    paddingHorizontal: 2,
  },
  motRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  motInput: {
    flex: 1,
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.text,
    minHeight: 40,
    paddingTop: 6,
    paddingHorizontal: 2,
  },
  motSendBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  motSendBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: '#000',
    letterSpacing: 1.5,
  },

  motEmpty: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  motEmptyText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },

  motItem: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.cyan,
  },
  motItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  motSender: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: Colors.cyan,
    letterSpacing: 0.5,
  },
  motTs: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
  },
  motText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 18,
  },

  // Footer CTA
  footerCta: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: 4,
  },
  footerCtaText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.muted,
  },
  footerCtaLink: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.cyan,
    letterSpacing: 1,
  },
});
