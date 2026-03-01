import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionStatus = 'pregame' | 'active' | 'paused' | 'ended' | 'already_done';

interface RosterEntry {
  id: string;
  name: string;
  jersey?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function todayKey(teamCode: string, uid: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `gdl_done_${teamCode}_${uid}_${date}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GameDayLiveScreen() {
  const navigation                  = useNavigation<any>();
  const { user, teamCode, displayName } = useAuth();
  const insets                      = useSafeAreaInsets();

  const [sessionStatus,    setSessionStatus]    = useState<SessionStatus>('pregame');
  const [liveTaps,         setLiveTaps]         = useState(0);
  const [shoutouts,        setShoutouts]        = useState<Record<string, number>>({});
  const [roster,           setRoster]           = useState<RosterEntry[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(2 * 60 * 60);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const [showEndConfirm,   setShowEndConfirm]   = useState(false);
  const [uploading,        setUploading]        = useState(false);
  const [uploadDone,       setUploadDone]       = useState(false);
  const [uploadError,      setUploadError]      = useState(false);

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningShownRef = useRef(false);
  const sessionStartRef = useRef<number>(0);
  const tapScaleAnim    = useRef(new Animated.Value(1)).current;

  // ── Check if session already submitted today ────────────────────────────────

  useEffect(() => {
    if (!teamCode || !user) return;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(todayKey(teamCode, user.uid))) {
      setSessionStatus('already_done');
    }
  }, [teamCode, user]);

  // ── Roster loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!teamCode) return;
    getDocs(collection(db, 'teams', teamCode, 'roster')).then(snap => {
      const entries: RosterEntry[] = snap.docs
        .map(d => ({ id: d.id, name: d.data().name ?? '—', jersey: d.data().jersey }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setRoster(entries);
    }).catch(() => {});
  }, [teamCode]);

  // ── Countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (sessionStatus !== 'active') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setSecondsRemaining(s => {
        if (s <= 1) {
          handleEndSession('auto');
          return 0;
        }
        if (s === 15 * 60 + 1 && !warningShownRef.current) {
          warningShownRef.current = true;
          setShowExtendPrompt(true);
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStatus]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Session controls ───────────────────────────────────────────────────────

  const handleStartSession = () => {
    warningShownRef.current = false;
    sessionStartRef.current = Date.now();
    setSessionStatus('active');
  };

  const handlePause  = () => setSessionStatus('paused');
  const handleResume = () => setSessionStatus('active');

  const handleExtend = (minutes: 30 | 60) => {
    setSecondsRemaining(s => s + minutes * 60);
    warningShownRef.current = false;
    setShowExtendPrompt(false);
  };

  const handleEndSession = useCallback(async (_reason: 'manual' | 'auto' = 'manual') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionStatus('ended');
    setUploading(true);
    setUploadError(false);

    const elapsedSec = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const livePoints = Math.floor(liveTaps / 3);

    try {
      await addDoc(collection(db, 'teams', teamCode!, 'gameEngagements'), {
        submittedAt:        serverTimestamp(),
        submittedBy:        user!.uid,
        submittedByName:    displayName ?? 'Fan',
        liveTaps,
        livePoints,
        shoutouts,
        sessionDurationSec: elapsedSec,
        teamCode,
      });
      // Gate this user from opening another session today
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(todayKey(teamCode!, user!.uid), '1');
      }
      setUploadDone(true);
    } catch (_e) {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }, [liveTaps, shoutouts, teamCode, user, displayName]);

  // ── Live tap ───────────────────────────────────────────────────────────────

  const handleLiveTap = () => {
    setLiveTaps(t => t + 1);
    Animated.sequence([
      Animated.timing(tapScaleAnim, { toValue: 0.92, duration: 80,  useNativeDriver: true }),
      Animated.timing(tapScaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
  };

  // ── Shoutout ───────────────────────────────────────────────────────────────

  const handleShoutout = (name: string) => {
    setShoutouts(prev => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const livePoints     = Math.floor(liveTaps / 3);
  const totalShoutouts = Object.values(shoutouts).reduce((a, b) => a + b, 0);
  const isActive       = sessionStatus === 'active';
  const isPaused       = sessionStatus === 'paused';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>GAME DAY LIVE</Text>

        {isActive && (
          <TouchableOpacity onPress={handlePause} style={styles.pauseBtn}>
            <Ionicons name="pause" size={16} color={Colors.amber} />
            <Text style={styles.pauseText}>PAUSE</Text>
          </TouchableOpacity>
        )}
        {isPaused && (
          <TouchableOpacity onPress={handleResume} style={styles.resumeBtn}>
            <Ionicons name="play" size={16} color={Colors.green} />
            <Text style={styles.resumeText}>RESUME</Text>
          </TouchableOpacity>
        )}
        {!isActive && !isPaused && <View style={styles.headerSpacer} />}
      </View>

      {/* ── Timer bar ── */}
      {(isActive || isPaused) && (
        <View style={[styles.timerBar, isPaused && styles.timerBarPaused]}>
          <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
          {isPaused && (
            <View style={styles.pausedChip}>
              <Text style={styles.pausedChipText}>HALFTIME — PAUSED</Text>
            </View>
          )}
        </View>
      )}

      {/* ── ALREADY DONE ── */}
      {sessionStatus === 'already_done' && (
        <View style={styles.pregameContainer}>
          <View style={styles.pregameCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.green} />
            <Text style={styles.pregameTitle}>SESSION SUBMITTED</Text>
            <Text style={styles.pregameSub}>
              You've already submitted a Game Day Live session for today's game.
              Check back for the next game day!
            </Text>
            <TouchableOpacity style={styles.notYetBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.notYetText}>← GO BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── PREGAME ── */}
      {sessionStatus === 'pregame' && (
        <View style={styles.pregameContainer}>
          <View style={styles.pregameCard}>
            <View style={styles.pregameLiveDot} />
            <Text style={styles.pregameTitle}>GAME DAY LIVE</Text>
            <Text style={styles.pregameSub}>
              Tap to cheer for your team and shoutout specific players during the game.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={handleStartSession}>
              <Ionicons name="flash" size={16} color={Colors.bg} />
              <Text style={styles.startBtnText}>YES — START SESSION</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.notYetBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.notYetText}>NOT YET — GO BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── ACTIVE / PAUSED ── */}
      {(isActive || isPaused) && (
        <>
          {/* Scrollable shoutout grid */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Live stats summary */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{liveTaps}</Text>
                <Text style={styles.statLabel}>TAPS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, styles.statValueAmber]}>{livePoints}</Text>
                <Text style={styles.statLabel}>POINTS</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalShoutouts}</Text>
                <Text style={styles.statLabel}>SHOUTOUTS</Text>
              </View>
            </View>

            {/* Shoutout grid */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SHOUTOUT A PLAYER</Text>
              <Text style={styles.sectionSub}>Tap a name to send a shoutout</Text>
              {roster.length === 0 ? (
                <View style={styles.rosterEmpty}>
                  <Text style={styles.rosterEmptyText}>No players loaded</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {roster.map(player => {
                    const count = shoutouts[player.name] ?? 0;
                    return (
                      <TouchableOpacity
                        key={player.id}
                        style={[
                          styles.gridCell,
                          count > 0 && styles.gridCellActive,
                          isPaused && styles.gridCellDisabled,
                        ]}
                        onPress={() => handleShoutout(player.name)}
                        disabled={isPaused}
                        activeOpacity={0.7}
                      >
                        {count > 0 && (
                          <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{count}</Text>
                          </View>
                        )}
                        <Text style={styles.gridName} numberOfLines={1}>
                          {player.name.split(' ')[0]}
                        </Text>
                        {player.name.split(' ')[1] && (
                          <Text style={styles.gridLastName} numberOfLines={1}>
                            {player.name.split(' ').slice(1).join(' ')}
                          </Text>
                        )}
                        {player.jersey != null && (
                          <Text style={styles.gridJersey}>#{player.jersey}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* End Session — at the bottom of scroll, separated from tap button */}
            <View style={styles.endSection}>
              <View style={styles.endSectionDivider} />
              <TouchableOpacity
                style={styles.endBtn}
                onPress={() => setShowEndConfirm(true)}
              >
                <Ionicons name="stop-circle-outline" size={16} color={Colors.red} />
                <Text style={styles.endBtnText}>END SESSION</Text>
              </TouchableOpacity>
            </View>

            {/* Extra scroll space so content clears the sticky bottom */}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* ── Sticky bottom: Live Tap only ── */}
          <View style={[styles.stickyBottom, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <Text style={styles.tapHint}>Every 3 taps = 1 cheer point</Text>
            <Animated.View style={{ transform: [{ scale: tapScaleAnim }] }}>
              <TouchableOpacity
                style={[styles.tapBtn, isPaused && styles.tapBtnDisabled]}
                onPress={handleLiveTap}
                disabled={isPaused}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={28} color={Colors.bg} />
                <Text style={styles.tapBtnText}>LIVE TAP</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </>
      )}

      {/* ── ENDED ── */}
      {sessionStatus === 'ended' && (
        <View style={styles.endedContainer}>
          <View style={styles.endedCard}>
            {uploading && (
              <>
                <ActivityIndicator color={Colors.amber} size="large" />
                <Text style={styles.endedTitle}>SUBMITTING...</Text>
                <Text style={styles.endedSub}>Sending your game day energy to the team</Text>
              </>
            )}
            {uploadDone && (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={Colors.green} />
                </View>
                <Text style={styles.endedTitle}>SESSION SUBMITTED!</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{liveTaps}</Text>
                    <Text style={styles.summaryLabel}>TAPS</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, styles.summaryPoints]}>{livePoints}</Text>
                    <Text style={styles.summaryLabel}>POINTS</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{totalShoutouts}</Text>
                    <Text style={styles.summaryLabel}>SHOUTOUTS</Text>
                  </View>
                </View>
                <Text style={styles.endedSub}>
                  Athletes will see their shoutouts on their dashboard.
                </Text>
                <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.doneBtnText}>DONE</Text>
                </TouchableOpacity>
              </>
            )}
            {uploadError && !uploading && (
              <>
                <Ionicons name="cloud-offline-outline" size={48} color={Colors.red} />
                <Text style={styles.endedTitle}>UPLOAD FAILED</Text>
                <Text style={styles.endedSub}>
                  Your session data is ready. Tap retry to try again.
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => handleEndSession('manual')}>
                  <Text style={styles.retryBtnText}>RETRY UPLOAD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.doneBtnText}>DISCARD & EXIT</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* ── Extension modal ── */}
      <Modal visible={showExtendPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="time-outline" size={28} color={Colors.amber} />
            </View>
            <Text style={styles.modalTitle}>15 MINUTES REMAINING</Text>
            <Text style={styles.modalSub}>Need more time? Extend your session.</Text>
            <TouchableOpacity style={styles.extendBtn} onPress={() => handleExtend(30)}>
              <Text style={styles.extendBtnText}>+ 30 MINUTES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.extendBtn} onPress={() => handleExtend(60)}>
              <Text style={styles.extendBtnText}>+ 60 MINUTES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipExtendBtn} onPress={() => setShowExtendPrompt(false)}>
              <Text style={styles.skipExtendText}>SKIP — LET IT END</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── End confirm modal ── */}
      <Modal visible={showEndConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>END SESSION?</Text>
            <Text style={styles.modalSub}>
              Your {liveTaps} taps and {totalShoutouts} shoutouts will be submitted to the team.
            </Text>
            <TouchableOpacity
              style={styles.endConfirmBtn}
              onPress={() => { setShowEndConfirm(false); handleEndSession('manual'); }}
            >
              <Ionicons name="stop-circle-outline" size={16} color="#fff" />
              <Text style={styles.endConfirmBtnText}>YES — END SESSION</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowEndConfirm(false)}
            >
              <Text style={styles.cancelBtnText}>KEEP GOING</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText:     { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  headerTitle:  { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.text, letterSpacing: 1.5 },
  pauseBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pauseText:    { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.amber, letterSpacing: 1 },
  resumeBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resumeText:   { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.green, letterSpacing: 1 },
  headerSpacer: { width: 60 },

  // Timer bar
  timerBar: {
    backgroundColor: `${Colors.amber}12`,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.amber}33`,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  timerBarPaused: { backgroundColor: `${Colors.blue}12`, borderBottomColor: `${Colors.blue}33` },
  timerText:      { fontFamily: Fonts.monoBold, fontSize: 22, color: Colors.text, letterSpacing: 2 },
  pausedChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: `${Colors.blue}44`, backgroundColor: `${Colors.blue}18`,
  },
  pausedChipText: { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.blue, letterSpacing: 1.5 },

  // Pregame / already done
  pregameContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  pregameCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: `${Colors.amber}33`,
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md, maxWidth: 400, width: '100%',
  },
  pregameLiveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.amber },
  pregameTitle:   { fontFamily: Fonts.monoBold, fontSize: 18, color: Colors.amber, letterSpacing: 2 },
  pregameSub: {
    fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.dim,
    textAlign: 'center', lineHeight: 21,
  },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.amber, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    marginTop: Spacing.sm, width: '100%', justifyContent: 'center',
  },
  startBtnText: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.bg, letterSpacing: 1.5 },
  notYetBtn:    { paddingVertical: Spacing.sm },
  notYetText:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    maxWidth: 800, alignSelf: 'center', width: '100%',
  },

  // Stats bar (top of scroll area)
  statsBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statItem:       { flex: 1, alignItems: 'center' },
  statValue:      { fontFamily: Fonts.monoBold, fontSize: 24, color: Colors.text },
  statValueAmber: { color: Colors.amber },
  statLabel:      { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1 },
  statDivider:    { width: 1, height: 32, backgroundColor: Colors.border },

  // Section
  section: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, gap: Spacing.md,
  },
  sectionLabel: { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.text, letterSpacing: 1.5 },
  sectionSub:   { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.muted, marginTop: -Spacing.sm },

  // Shoutout grid
  rosterEmpty: { paddingVertical: Spacing.lg, alignItems: 'center' },
  rosterEmptyText: { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridCell: {
    flexBasis: '31%', flexGrow: 1, maxWidth: '33%',
    backgroundColor: Colors.bgDeep, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.sm, paddingTop: Spacing.md,
    alignItems: 'center', minHeight: 72, justifyContent: 'center', position: 'relative',
  },
  gridCellActive:   { borderColor: `${Colors.amber}66`, backgroundColor: `${Colors.amber}0a` },
  gridCellDisabled: { opacity: 0.5 },
  countBadge: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: Colors.amber, borderRadius: Radius.full,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  countBadgeText: { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.bg },
  gridName:       { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.text, textAlign: 'center' },
  gridLastName:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, textAlign: 'center' },
  gridJersey:     { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, marginTop: 2 },

  // Sticky bottom
  stickyBottom: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    gap: Spacing.sm,
    maxWidth: 800, alignSelf: 'center', width: '100%',
  },
  tapHint: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted,
    letterSpacing: 1, textAlign: 'center',
  },

  // Live Tap button (prominent amber)
  tapBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.amber,
    borderRadius: Radius.lg, paddingVertical: Spacing.lg,
    shadowColor: Colors.amber, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  tapBtnDisabled: { opacity: 0.4 },
  tapBtnText: { fontFamily: Fonts.monoBold, fontSize: 18, color: Colors.bg, letterSpacing: 2 },

  // End Session — in scroll area, below shoutout grid
  endSection: { paddingHorizontal: 0, gap: Spacing.md },
  endSectionDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: `${Colors.red}18`, borderWidth: 2, borderColor: Colors.red,
    borderRadius: Radius.md, paddingVertical: Spacing.md,
  },
  endBtnText: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.red, letterSpacing: 1.5 },

  // Ended / upload
  endedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  endedCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md, maxWidth: 400, width: '100%',
  },
  successIcon:    { marginBottom: Spacing.sm },
  endedTitle:     { fontFamily: Fonts.monoBold, fontSize: 16, color: Colors.text, letterSpacing: 1.5 },
  endedSub: {
    fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.dim,
    textAlign: 'center', lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row', gap: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
    width: '100%', justifyContent: 'space-around',
  },
  summaryItem:  { alignItems: 'center' },
  summaryValue: { fontFamily: Fonts.monoBold, fontSize: 28, color: Colors.text },
  summaryPoints:{ color: Colors.amber },
  summaryLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1, marginTop: 2 },
  doneBtn: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    width: '100%', alignItems: 'center', marginTop: Spacing.sm,
  },
  doneBtnText:   { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.dim, letterSpacing: 1 },
  retryBtn: {
    backgroundColor: `${Colors.red}18`, borderWidth: 1, borderColor: `${Colors.red}44`,
    borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    width: '100%', alignItems: 'center',
  },
  retryBtnText:  { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.red, letterSpacing: 1 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl,
    alignItems: 'center', gap: Spacing.md, width: '100%', maxWidth: 360,
  },
  modalIcon:  { marginBottom: Spacing.xs },
  modalTitle: { fontFamily: Fonts.monoBold, fontSize: 15, color: Colors.text, letterSpacing: 1.5 },
  modalSub: {
    fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.dim,
    textAlign: 'center', lineHeight: 20,
  },
  extendBtn: {
    backgroundColor: `${Colors.amber}18`, borderWidth: 1, borderColor: `${Colors.amber}44`,
    borderRadius: Radius.md, paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  extendBtnText:  { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.amber, letterSpacing: 1 },
  skipExtendBtn:  { paddingVertical: Spacing.sm },
  skipExtendText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
  endConfirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.red, borderRadius: Radius.md,
    paddingVertical: Spacing.md, width: '100%',
  },
  endConfirmBtnText: { fontFamily: Fonts.monoBold, fontSize: 13, color: '#fff', letterSpacing: 1 },
  cancelBtn: {
    backgroundColor: `${Colors.amber}18`, borderWidth: 1, borderColor: `${Colors.amber}44`,
    borderRadius: Radius.md, paddingVertical: Spacing.md, width: '100%', alignItems: 'center',
  },
  cancelBtnText: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.amber, letterSpacing: 1 },
});
