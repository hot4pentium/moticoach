import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useCoach } from '../context/CoachContext';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';
import BadgeShelf from '../components/BadgeShelf';
import ProfileSheet from '../components/ProfileSheet';
import { Badge } from '../lib/badges';

// ─── Types ────────────────────────────────────────────────────────────────────

type EventType = 'game' | 'practice' | 'film';

interface TeamEvent {
  id: string;
  type: EventType;
  title: string;
  opponent?: string;
  date: Date;
  time: string;
  location: string;
  bringsDrinks?: string;
  bringsSnacks?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const today = new Date();
const d = (n: number) => { const dt = new Date(today); dt.setDate(today.getDate() + n); return dt; };

const MOCK_EVENTS: TeamEvent[] = [
  { id: '1', type: 'game',     title: 'vs Eagles SC',   opponent: 'Eagles SC',   date: d(0),  time: '6:30 PM', location: 'Turf Stadium' },
  { id: '2', type: 'practice', title: 'PRACTICE',                                date: d(2),  time: '4:30 PM', location: 'Field B' },
  { id: '3', type: 'film',     title: 'FILM SESSION',                            date: d(4),  time: '6:00 PM', location: 'Rec Center' },
  { id: '4', type: 'game',     title: 'vs Storm United', opponent: 'Storm United', date: d(7), time: '10:00 AM', location: 'Riverside Park' },
];

const TYPE_COLOR: Record<EventType, string> = {
  game:     Colors.amber,
  practice: Colors.green,
  film:     Colors.purple,
};

const TYPE_LABEL: Record<EventType, string> = {
  game:     'GAME',
  practice: 'TRAIN',
  film:     'FILM',
};

const DAYS   = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const SPORT_ICON: Record<string, string> = {
  soccer:     '⚽',
  basketball: '🏀',
  football:   '🏈',
  baseball:   '⚾',
  volleyball: '🏐',
};

const SPORT_STATS: Record<string, { label: string; key: string }[]> = {
  soccer:     [{ label: 'Goals', key: 'goals' }, { label: 'Assists', key: 'assists' }, { label: 'Games', key: 'games' }],
  basketball: [{ label: 'Points', key: 'points' }, { label: 'Rebounds', key: 'rebounds' }, { label: 'Games', key: 'games' }],
  football:   [{ label: 'TDs', key: 'tds' }, { label: 'Yards', key: 'yards' }, { label: 'Games', key: 'games' }],
  baseball:   [{ label: 'Hits', key: 'hits' }, { label: 'RBIs', key: 'rbis' }, { label: 'Games', key: 'games' }],
  volleyball: [{ label: 'Kills', key: 'kills' }, { label: 'Aces', key: 'aces' }, { label: 'Games', key: 'games' }],
};

// ─── Calendar Helpers ─────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): Date {
  const dt = new Date(date);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - day + (day === 0 ? -6 : 1));
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(weekStart);
    dt.setDate(dt.getDate() + i);
    return dt;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

function getEventForDay(date: Date): TeamEvent | undefined {
  return MOCK_EVENTS.find(e => isSameDay(e.date, date));
}

// ─── Engagement Types ─────────────────────────────────────────────────────────

interface EngagementSummary {
  id: string;
  livePoints: number;
  liveTaps: number;
  myShoutouts: number;
}

// ─── Message Types ────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: any;
}

const ROLE_COLOR: Record<string, string> = {
  coach:     Colors.cyan,
  staff:     Colors.blue,
  supporter: Colors.amber,
  athlete:   Colors.green,
};

// ─── Calendar Sub-components ──────────────────────────────────────────────────

function WeekRow({ weekStart, days, onEventPress }: {
  weekStart: Date; days: Date[]; onEventPress: (e: TeamEvent) => void;
}) {
  return (
    <View style={calStyles.weekRow}>
      <View style={calStyles.weekLabel}>
        <Text style={calStyles.weekLabelText}>{formatWeekRange(weekStart)}</Text>
        <View style={calStyles.weekLabelLine} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={calStyles.weekStrip}>
        {days.map((date, i) => {
          const event    = getEventForDay(date);
          const todayDay = isToday(date);
          return (
            <DayCard key={i} date={date} event={event} isToday={todayDay} dayLabel={DAYS[i]}
              onPress={event ? () => onEventPress(event) : undefined} />
          );
        })}
      </ScrollView>
    </View>
  );
}

function DayCard({ date, event, isToday: todayFlag, dayLabel, onPress }: {
  date: Date; event?: TeamEvent; isToday: boolean; dayLabel: string; onPress?: () => void;
}) {
  const hasEvent = !!event;
  const color    = event ? TYPE_COLOR[event.type] : Colors.muted;
  return (
    <TouchableOpacity
      style={[calStyles.dayCard, !hasEvent && calStyles.dayCardEmpty, todayFlag && calStyles.dayCardToday]}
      onPress={onPress}
      activeOpacity={hasEvent ? 0.75 : 0.4}
      disabled={!hasEvent}
    >
      {hasEvent && <View style={[calStyles.dayCardBar, { backgroundColor: color }]} />}
      <Text style={[calStyles.dayCardWeekday, !hasEvent && calStyles.dimText]}>{dayLabel}</Text>
      <Text style={[calStyles.dayCardMonth,   !hasEvent && calStyles.dimText]}>{MONTHS[date.getMonth()]}</Text>
      <Text style={[calStyles.dayCardNum,     !hasEvent && calStyles.dimText]}>{date.getDate()}</Text>
      {hasEvent ? (
        <>
          <Text style={[calStyles.dayCardType, { color }]}>{TYPE_LABEL[event!.type]}</Text>
          {event?.opponent && <Text style={calStyles.dayCardOpp} numberOfLines={1}>{event.opponent}</Text>}
        </>
      ) : (
        <Text style={calStyles.dayCardPlus}>+</Text>
      )}
    </TouchableOpacity>
  );
}

function EventSheet({ event, visible, onClose }: {
  event: TeamEvent | null; visible: boolean; onClose: () => void;
}) {
  if (!event) return null;
  const color = TYPE_COLOR[event.type];
  const emoji = event.type === 'game' ? '⚽' : event.type === 'practice' ? '🏃' : '🎬';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={evStyles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={evStyles.sheet}>
          <View style={[evStyles.accent, { backgroundColor: color }]} />
          <View style={evStyles.handle} />
          <View style={evStyles.body}>
            <View style={[evStyles.badge, { backgroundColor: color + '18', borderColor: color + '44' }]}>
              <Text style={[evStyles.badgeText, { color }]}>{emoji}{'  '}{TYPE_LABEL[event.type]} DAY</Text>
            </View>
            <Text style={evStyles.title}>{event.title}</Text>
            {event.opponent && (
              <Text style={[evStyles.opponent, { color }]}>vs {event.opponent}</Text>
            )}
            <View style={evStyles.meta}>
              <Text style={evStyles.metaText}>🕐  {event.time}</Text>
              <Text style={evStyles.metaText}>📍  {event.location}</Text>
            </View>
            {(event.bringsDrinks || event.bringsSnacks) && (
              <View style={evStyles.infoSection}>
                <View style={evStyles.infoRow}>
                  <Text style={evStyles.infoLabel}>🥤  DRINKS</Text>
                  <Text style={evStyles.infoVal}>{event.bringsDrinks || '—'}</Text>
                </View>
                <View style={evStyles.infoRow}>
                  <Text style={evStyles.infoLabel}>🍿  SNACKS</Text>
                  <Text style={evStyles.infoVal}>{event.bringsSnacks || '—'}</Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity style={evStyles.closeBtn} onPress={onClose}>
            <Text style={evStyles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const evStyles = StyleSheet.create({
  backdrop:   { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%', maxWidth: 500, backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    overflow: 'hidden', paddingBottom: 32,
  },
  accent:     { height: 3, width: '100%' },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  body:       { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.sm },
  badge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
  },
  badgeText:  { fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 1 },
  title:      { fontFamily: Fonts.rajdhaniBold, fontSize: 28, color: Colors.text, lineHeight: 32, marginTop: Spacing.xs },
  opponent:   { fontFamily: Fonts.monoBold, fontSize: 13, letterSpacing: 0.5 },
  meta:       { gap: Spacing.sm, marginTop: Spacing.xs },
  metaText:   { fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.dim },
  infoSection: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, gap: Spacing.sm },
  infoRow:    { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
  infoLabel:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
  infoVal:    { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: Colors.text },
  closeBtn:   { marginTop: Spacing.xl, marginHorizontal: Spacing.xl, paddingVertical: Spacing.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border },
  closeBtnText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, letterSpacing: 1.5 },
});

const calStyles = StyleSheet.create({
  weekRow:       { marginBottom: 12 },
  weekLabel:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: 8 },
  weekLabelText: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
  weekLabelLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  weekStrip:     { paddingHorizontal: Spacing.lg, gap: 5 },
  dayCard: {
    width: 68, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 4, paddingBottom: 8, paddingTop: 0,
    alignItems: 'center', overflow: 'hidden',
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.08), inset 0 -1px 3px rgba(255,255,255,0.6)' as any,
  },
  dayCardEmpty:   { opacity: 0.35 },
  dayCardToday:   { borderColor: 'rgba(0,212,255,0.5)' },
  dayCardBar:     { width: '100%', height: 2, marginBottom: 6 },
  dayCardWeekday: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCardMonth:   { fontFamily: Fonts.mono, fontSize: 7, color: Colors.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCardNum:     { fontFamily: Fonts.orbitron, fontSize: 18, color: Colors.text, lineHeight: 22, marginBottom: 2 },
  dayCardType:    { fontFamily: Fonts.mono, fontSize: 7, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  dayCardOpp:     { fontFamily: Fonts.mono, fontSize: 6, color: Colors.amber, marginTop: 1, maxWidth: 60, textAlign: 'center' },
  dayCardPlus:    { fontFamily: Fonts.mono, fontSize: 16, color: Colors.muted, marginTop: 4 },
  dimText:        { opacity: 0.4 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AthleteProfileScreen() {
  const navigation                      = useNavigation<any>();
  const { user, displayName, teamCode } = useAuth();
  const { coachSport, earnedBadges, badgeIcon, badgeColor } = useCoach();

  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null);
  const [teamName, setTeamName]         = useState('My Team');
  const [uploading, setUploading]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedBadge, setSelectedBadge]   = useState<Badge | null>(null);
  const [selectedEvent, setSelectedEvent]   = useState<TeamEvent | null>(null);
  const [calExpanded, setCalExpanded]         = useState(false);
  const [messages, setMessages]               = useState<Message[]>([]);
  const [commsExpanded, setCommsExpanded]     = useState(false);
  const [chatText, setChatText]               = useState('');
  const [sending, setSending]                 = useState(false);
  const [trackingMode, setTrackingMode]       = useState<'individual' | 'team' | null>(null);
  const [gamesTracked, setGamesTracked]       = useState<number>(0);
  const [latestEngagement, setLatestEngagement] = useState<EngagementSummary | null>(null);
  const [showFanModal,     setShowFanModal]     = useState(false);

  // Load avatar + team name
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().avatarUrl) setAvatarUrl(snap.data().avatarUrl);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!teamCode) return;
    getDoc(doc(db, 'teams', teamCode)).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.teamName)     setTeamName(data.teamName);
      if (data.trackingMode) setTrackingMode(data.trackingMode);
      if (data.gamesTracked) setGamesTracked(data.gamesTracked);
    }).catch(() => {});
  }, [teamCode]);

  // Subscribe to team chat messages
  useEffect(() => {
    if (!teamCode) return;
    const q = query(
      collection(db, 'teamChats', teamCode, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [teamCode]);

  // Load latest game engagement — shows fan support card + celebration modal
  useEffect(() => {
    if (!teamCode || !displayName || !user) return;
    const q = query(
      collection(db, 'teams', teamCode, 'gameEngagements'),
      orderBy('submittedAt', 'desc'),
      limit(1),
    );
    return onSnapshot(q, snap => {
      if (snap.empty) return;
      const d = snap.docs[0];
      const data = d.data();
      const myShoutouts = (data.shoutouts?.[displayName] ?? 0) as number;
      setLatestEngagement({
        id: d.id,
        livePoints: data.livePoints ?? 0,
        liveTaps: data.liveTaps ?? 0,
        myShoutouts,
      });
      if (myShoutouts > 0 && typeof localStorage !== 'undefined') {
        const seenKey = `seen_engagement_${teamCode}_${d.id}_${user.uid}`;
        if (!localStorage.getItem(seenKey)) {
          localStorage.setItem(seenKey, '1');
          setShowFanModal(true);
        }
      }
    });
  }, [teamCode, displayName, user]);

  const sendMessage = async () => {
    const trimmed = chatText.trim();
    if (!trimmed || !teamCode || !user) return;
    setSending(true);
    setChatText('');
    try {
      await addDoc(collection(db, 'teamChats', teamCode, 'messages'), {
        senderId:   user.uid,
        senderName: displayName ?? user.email ?? 'Unknown',
        senderRole: 'athlete',
        text:       trimmed,
        createdAt:  serverTimestamp(),
        readBy:     [user.uid],
      });
    } catch (_e) {}
    finally { setSending(false); }
  };

  const handlePickPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !user) return;
      setUploading(true);
      try {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url });
        setAvatarUrl(url);
      } catch (_e) {}
      finally { setUploading(false); }
    };
    input.click();
  };

  const handleSignOut = () => signOut(auth);

  const statDefs = SPORT_STATS[coachSport] ?? SPORT_STATS.soccer;

  const thisMonday = getMondayOfWeek(new Date());
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() + i * 7);
    return start;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.dim} />
            <Text style={styles.backLabel}>BACK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('AthleteHome')} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="home-outline" size={22} color={Colors.dim} />
            <Text style={styles.backLabel}>HOME</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>MY PROFILE</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setSettingsOpen(true)} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={Colors.dim} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} hitSlop={8}>
            <Text style={styles.exitBtnText}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.inner}>

          {/* ── Hero Card ── */}
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Avatar */}
            <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.8} style={styles.avatarWrap}>
              <View style={styles.avatarBox}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle-outline" size={60} color={HeroText.secondary} />
                )}
                {uploading && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </View>
              <View style={styles.cameraChip}>
                <Ionicons name="camera-outline" size={12} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Info + Badge */}
            <View style={styles.heroInfo}>
              <View style={styles.heroInfoText}>
                <Text style={styles.heroName}>{displayName ?? 'Athlete'}</Text>
                <Text style={styles.heroTeam}>{teamName}</Text>
                <View style={styles.heroChips}>
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>JERSEY</Text>
                    <Text style={styles.chipVal}>#--</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>POS</Text>
                    <Text style={styles.chipVal}>—</Text>
                  </View>
                </View>
                <View style={styles.sportBadge}>
                  <Text style={styles.sportBadgeText}>
                    {SPORT_ICON[coachSport] ?? '🏅'}{'  '}{coachSport.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.heroBadgeWatermark} pointerEvents="none">
                <MaterialCommunityIcons name={badgeIcon as any} size={90} color={badgeColor || '#fff'} />
              </View>
            </View>
          </LinearGradient>

          {/* ── Fan Support Card ── */}
          {latestEngagement && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FAN SUPPORT</Text>
              <View style={fanStyles.card}>
                <View style={fanStyles.tapsRow}>
                  <Ionicons name="flash" size={16} color={Colors.amber} />
                  <Text style={fanStyles.tapsValue}>{latestEngagement.liveTaps}</Text>
                  <Text style={fanStyles.tapsSep}>→</Text>
                  <Text style={fanStyles.pointsValue}>{latestEngagement.livePoints}</Text>
                  <Text style={fanStyles.tapsLabel}>TEAM CHEER POINTS</Text>
                </View>
                {latestEngagement.myShoutouts > 0 && (
                  <View style={fanStyles.shoutoutRow}>
                    <Text style={fanStyles.shoutoutLabel}>YOUR SHOUTOUTS</Text>
                    <View style={fanStyles.shoutoutBar}>
                      {Array.from({ length: Math.min(latestEngagement.myShoutouts, 10) }).map((_, i) => (
                        <View key={i} style={fanStyles.shoutoutPip} />
                      ))}
                    </View>
                    <Text style={fanStyles.shoutoutCount}>{latestEngagement.myShoutouts}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ── Roster Card ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ROSTER SPOT</Text>
            <View style={styles.rosterCard}>
              <View style={styles.rosterRow}>
                <View style={styles.rosterStat}>
                  <Text style={styles.rosterStatVal}>#--</Text>
                  <Text style={styles.rosterStatLabel}>JERSEY</Text>
                </View>
                <View style={styles.rosterDivider} />
                <View style={styles.rosterStat}>
                  <Text style={styles.rosterStatVal}>—</Text>
                  <Text style={styles.rosterStatLabel}>POSITION</Text>
                </View>
                <View style={styles.rosterDivider} />
                <View style={styles.rosterStat}>
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>ACTIVE</Text>
                  </View>
                  <Text style={styles.rosterStatLabel}>STATUS</Text>
                </View>
              </View>
              <View style={styles.rosterFooter}>
                <Text style={styles.rosterTeamText}>{teamName}  ·  {SPORT_ICON[coachSport] ?? '🏅'} {coachSport.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* ── Season Stats ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SEASON STATS</Text>
            {trackingMode === 'team' ? (
              <View style={styles.statsCard}>
                <View style={styles.teamStatsBanner}>
                  <Ionicons name="people-outline" size={20} color={Colors.blue} />
                  <Text style={styles.teamStatsBannerText}>Team stats mode</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={[styles.statCol, styles.statColBorder]}>
                    <Text style={styles.statVal}>{gamesTracked || '—'}</Text>
                    <Text style={styles.statLabel}>Games</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>—</Text>
                    <Text style={styles.statLabel}>Wins</Text>
                  </View>
                </View>
                <Text style={styles.statsNote}>Your coach tracks team stats — individual stats unavailable</Text>
              </View>
            ) : (
              <View style={styles.statsCard}>
                <View style={styles.statsRow}>
                  {statDefs.map((s, i) => (
                    <View key={s.key} style={[styles.statCol, i < statDefs.length - 1 && styles.statColBorder]}>
                      <Text style={styles.statVal}>—</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.statsNote}>Stats are updated by your coach</Text>
              </View>
            )}
          </View>

          {/* ── Achievements ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
            <BadgeShelf earnedBadges={earnedBadges} onBadgePress={setSelectedBadge} />
          </View>

          {/* ── Schedule ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SCHEDULE</Text>
          </View>
          <WeekRow weekStart={weeks[0]} days={getWeekDays(weeks[0])} onEventPress={setSelectedEvent} />
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setCalExpanded(prev => !prev)}
          >
            <Text style={styles.expandText}>
              {calExpanded ? 'HIDE CALENDAR ▲' : 'SEE FULL CALENDAR ▼'}
            </Text>
          </TouchableOpacity>
          {calExpanded && weeks.slice(1).map((weekStart, wi) => (
            <WeekRow key={wi} weekStart={weekStart} days={getWeekDays(weekStart)} onEventPress={setSelectedEvent} />
          ))}

          {/* ── Team Comms ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TEAM COMMS</Text>
            <View style={styles.commsCard}>
              {messages.length === 0 ? (
                <Text style={styles.commsEmpty}>No messages yet</Text>
              ) : (
                (commsExpanded ? messages : messages.slice(0, 3)).map((msg, i, arr) => (
                  <View key={msg.id} style={[styles.commsRow, i < arr.length - 1 && styles.commsRowBorder]}>
                    <View style={[styles.commsRoleDot, { backgroundColor: ROLE_COLOR[msg.senderRole] ?? Colors.dim }]} />
                    <View style={styles.commsBody}>
                      <Text style={[styles.commsSender, { color: ROLE_COLOR[msg.senderRole] ?? Colors.dim }]}>
                        {msg.senderName}
                      </Text>
                      <Text style={styles.commsText}>{msg.text}</Text>
                    </View>
                  </View>
                ))
              )}
              {messages.length > 3 && (
                <TouchableOpacity style={styles.commsExpandBtn} onPress={() => setCommsExpanded(p => !p)}>
                  <Text style={styles.commsViewAll}>{commsExpanded ? 'SHOW LESS ▲' : `SHOW MORE (${messages.length - 3}) ▼`}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.commsInputRow}>
              <TextInput
                style={styles.commsInput}
                placeholder="Message the team…"
                placeholderTextColor={Colors.muted}
                value={chatText}
                onChangeText={setChatText}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!sending}
              />
              <TouchableOpacity
                style={[styles.commsSendBtn, (!chatText.trim() || sending) && styles.commsSendBtnDisabled]}
                onPress={sendMessage}
                disabled={!chatText.trim() || sending}
              >
                <Ionicons name="send" size={16} color={chatText.trim() && !sending ? Colors.cyan : Colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Quick Links ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => navigation.navigate('Playbook')}
                activeOpacity={0.8}
              >
                <View style={[styles.quickAccent, { backgroundColor: Colors.cyan }]} />
                <View style={[styles.quickIcon, { backgroundColor: Colors.cyan + '18' }]}>
                  <Ionicons name="easel-outline" size={24} color={Colors.cyan} />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.cyan }]}>Playbook</Text>
                <Text style={styles.quickSub}>Study the plays</Text>
              </TouchableOpacity>

              <View style={[styles.quickCard, styles.quickCardLocked]}>
                <View style={[styles.quickAccent, { backgroundColor: Colors.muted }]} />
                <View style={[styles.quickIcon, { backgroundColor: Colors.bgDeep }]}>
                  <Ionicons name="film-outline" size={24} color={Colors.dim} />
                </View>
                <Text style={[styles.quickLabel, { color: Colors.dim }]}>Highlights</Text>
                <Text style={styles.quickSub}>Coming soon</Text>
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={8} color={Colors.dim} />
                  <Text style={styles.lockedText}>SOON</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>

      {/* ── Badge Detail Modal ── */}
      {selectedBadge && (
        <View style={styles.badgeModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setSelectedBadge(null)} />
          <View style={styles.badgeModal}>
            <View style={[styles.badgeModalIcon, { backgroundColor: selectedBadge.color + '20', borderColor: selectedBadge.color + '50' }]}>
              <MaterialCommunityIcons name={selectedBadge.icon as any} size={40} color={selectedBadge.color} />
            </View>
            <Text style={[styles.badgeModalName, { color: selectedBadge.color }]}>{selectedBadge.name}</Text>
            <Text style={styles.badgeModalDesc}>{selectedBadge.description}</Text>
            <TouchableOpacity onPress={() => setSelectedBadge(null)} style={[styles.badgeModalClose, { borderColor: selectedBadge.color + '40' }]}>
              <Text style={[styles.badgeModalCloseText, { color: selectedBadge.color }]}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Event Sheet ── */}
      <EventSheet
        event={selectedEvent}
        visible={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* ── Settings Sheet ── */}
      <ProfileSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        avatarUrl={avatarUrl}
        onAvatarChange={setAvatarUrl}
      />

      {/* ── Fan Celebration Modal ── */}
      <Modal visible={showFanModal} transparent animationType="fade">
        <View style={fanStyles.modalOverlay}>
          <View style={fanStyles.modalCard}>
            <Ionicons name="flash" size={40} color={Colors.amber} />
            <Text style={fanStyles.modalTitle}>YOUR FANS SHOWED UP!</Text>
            <Text style={fanStyles.modalCount}>{latestEngagement?.myShoutouts ?? 0}</Text>
            <Text style={fanStyles.modalSub}>
              shoutout{(latestEngagement?.myShoutouts ?? 0) !== 1 ? 's' : ''} from your supporters today
            </Text>
            <TouchableOpacity style={fanStyles.modalBtn} onPress={() => setShowFanModal(false)}>
              <Text style={fanStyles.modalBtnText}>AWESOME!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Fan Support Styles ───────────────────────────────────────────────────────

const fanStyles = StyleSheet.create({
  card: {
    backgroundColor: `${Colors.amber}0a`,
    borderWidth: 1,
    borderColor: `${Colors.amber}33`,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  tapsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tapsValue:  { fontFamily: Fonts.monoBold, fontSize: 22, color: Colors.text },
  tapsSep:    { fontFamily: Fonts.mono, fontSize: 14, color: Colors.muted },
  pointsValue:{ fontFamily: Fonts.monoBold, fontSize: 22, color: Colors.amber },
  tapsLabel:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  shoutoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${Colors.amber}22`,
    paddingTop: Spacing.sm,
  },
  shoutoutLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.amber, letterSpacing: 1 },
  shoutoutBar:   { flex: 1, flexDirection: 'row', gap: 4 },
  shoutoutPip: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.amber,
  },
  shoutoutCount: { fontFamily: Fonts.monoBold, fontSize: 18, color: Colors.amber },

  // Celebration modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: `${Colors.amber}44`,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: Fonts.monoBold,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  modalCount: {
    fontFamily: Fonts.monoBold,
    fontSize: 56,
    color: Colors.amber,
    lineHeight: 64,
  },
  modalSub: {
    fontFamily: Fonts.rajdhani,
    fontSize: 16,
    color: Colors.dim,
    textAlign: 'center',
  },
  modalBtn: {
    backgroundColor: Colors.amber,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  modalBtnText: { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.bg, letterSpacing: 1.5 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    ...({ backgroundImage: "url('/dashboard-bg.svg')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } as any),
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: Colors.bg,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 70 },
  backLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  headerTitle: { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: Colors.text, letterSpacing: 2 },
  gearBtn: { minWidth: 70, alignItems: 'flex-end' },
  headerRight:  { minWidth: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 },
  exitBtnText:  { fontSize: 24, color: Colors.dim, lineHeight: 28 },

  scroll: { flexGrow: 1 },
  inner:  { paddingBottom: Spacing.xxl, maxWidth: 800, alignSelf: 'center', width: '100%' },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 16px 48px rgba(21,101,192,0.45), 0 4px 16px rgba(0,0,0,0.22)' as any,
  },
  heroBadgeWatermark: {
    width: 90,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  avatarWrap: { position: 'relative' },
  avatarBox: {
    width: 100,
    height: 120,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraChip: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1565c0',
  },
  heroInfo:     { flex: 1, flexDirection: 'row', alignItems: 'center' },
  heroInfoText: { flex: 1 },
  heroName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 22,
    color: HeroText.primary,
    lineHeight: 26,
  },
  heroTeam: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: HeroText.secondary,
    marginBottom: Spacing.sm,
  },
  heroChips: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chipLabel: { fontFamily: Fonts.mono, fontSize: 8, color: HeroText.muted, letterSpacing: 1 },
  chipVal:   { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: HeroText.primary },
  sportBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sportBadgeText: { fontFamily: Fonts.mono, fontSize: 10, color: HeroText.secondary, letterSpacing: 1 },

  // Sections
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },

  // Roster card
  rosterCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  rosterStat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  rosterDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  rosterStatVal: {
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    color: Colors.text,
    lineHeight: 26,
  },
  rosterStatLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 1.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.green + '18',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.green + '40',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  activePillText: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: Colors.green,
    letterSpacing: 1,
  },
  rosterFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  rosterTeamText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 13,
    color: Colors.dim,
    letterSpacing: 0.5,
  },

  // Stats
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statsRow: { flexDirection: 'row' },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  statColBorder: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statVal: {
    fontFamily: Fonts.orbitron,
    fontSize: 28,
    color: Colors.text,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dim,
    letterSpacing: 1,
    marginTop: 4,
  },
  statsNote: {
    fontFamily: Fonts.rajdhani,
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
    paddingBottom: Spacing.sm,
  },
  teamStatsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamStatsBannerText: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    color: Colors.blue,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Calendar expand
  expandRow: {
    marginHorizontal: Spacing.lg,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(61,143,255,0.04)',
    alignItems: 'center',
  },
  expandText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.cyan, letterSpacing: 1.5 },

  // Team comms
  commsSectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  commsViewAll:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 1 },
  commsExpandBtn:   { paddingVertical: Spacing.sm, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border },
  commsInputRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  commsInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.text,
  },
  commsSendBtn:         { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  commsSendBtnDisabled: { opacity: 0.4 },
  commsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  commsRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  commsRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  commsRoleDot:   { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  commsBody:      { flex: 1 },
  commsSender:    { fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 0.5, marginBottom: 2 },
  commsText:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, lineHeight: 18 },
  commsEmpty:     { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.muted, padding: Spacing.lg, textAlign: 'center' },

  // Quick links
  quickRow: { flexDirection: 'row', gap: 8 },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 4,
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 8px rgba(0,50,150,0.08), inset 0 -1px 4px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.04)' as any,
  },
  quickCardLocked: { opacity: 0.6, backgroundColor: Colors.bgDeep },
  quickAccent: { position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3 },
  quickIcon:  { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  quickLabel: { fontFamily: Fonts.rajdhaniBold, fontSize: 17, letterSpacing: 0.3 },
  quickSub:   { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.2 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  lockedText:  { fontFamily: Fonts.mono, fontSize: 7, color: Colors.dim, letterSpacing: 0.5 },

  // Badge modal
  badgeModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  badgeModal: {
    width: 260,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badgeModalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  badgeModalName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 18,
    letterSpacing: 1,
  },
  badgeModalDesc: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.dim,
    textAlign: 'center',
  },
  badgeModalClose: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeModalCloseText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
