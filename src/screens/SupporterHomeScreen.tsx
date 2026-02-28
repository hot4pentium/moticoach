import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCoach } from '../context/CoachContext';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import BadgeShelf from '../components/BadgeShelf';
import ProfileSheet from '../components/ProfileSheet';
import InstallPromptBanner from '../components/InstallPromptBanner';
import { Badge } from '../lib/badges';

// ─── Types & Constants ────────────────────────────────────────────────────────

type EventType = 'game' | 'practice' | 'film';

interface TeamEvent {
  id: string;
  type: EventType;
  title: string;
  opponent?: string;
  date: Date;
  time: string;
  location: string;
  playerCount?: number;
}

const DAYS   = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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

const SPORT_ICON: Record<string, string> = {
  soccer:     '⚽',
  basketball: '🏀',
  football:   '🏈',
  baseball:   '⚾',
  volleyball: '🏐',
};

// ─── Mock Events ─────────────────────────────────────────────────────────────

const today = new Date();
const d = (offsetDays: number) => {
  const dt = new Date(today);
  dt.setDate(today.getDate() + offsetDays);
  return dt;
};

const MOCK_EVENTS: TeamEvent[] = [
  { id: '1', type: 'game',     title: 'vs Eagles SC',     opponent: 'Eagles SC',    date: d(0),  time: '6:30 PM',  location: 'Turf Stadium',    playerCount: 18 },
  { id: '2', type: 'practice', title: 'PRACTICE',                                    date: d(2),  time: '4:30 PM',  location: 'Field B' },
  { id: '3', type: 'film',     title: 'FILM SESSION',                                date: d(4),  time: '6:00 PM',  location: 'Rec Center' },
  { id: '4', type: 'game',     title: 'vs Storm United',  opponent: 'Storm United',  date: d(7),  time: '10:00 AM', location: 'Riverside Park',  playerCount: 18 },
  { id: '5', type: 'practice', title: 'PRACTICE',                                    date: d(9),  time: '4:30 PM',  location: 'Field B' },
  { id: '6', type: 'game',     title: 'vs North Eagles',  opponent: 'North Eagles',  date: d(14), time: '11:00 AM', location: 'Central Stadium', playerCount: 18 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

function getEventForDay(date: Date): TeamEvent | undefined {
  return MOCK_EVENTS.find(e => isSameDay(e.date, date));
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SupporterHomeScreen() {
  const { user, role, teamCode } = useAuth();
  const { pendingBadge, clearPendingBadge, earnedBadges, badgeIcon, badgeColor, coachSport } = useCoach();

  const [selectedEvent,   setSelectedEvent]   = useState<TeamEvent | null>(null);
  const [sheetVisible,    setSheetVisible]    = useState(false);
  const [calExpanded,     setCalExpanded]     = useState(false);
  const [avatarUrl,       setAvatarUrl]       = useState('');
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [teamName,        setTeamName]        = useState('YOUR TEAM');
  const [selectedBadge,   setSelectedBadge]   = useState<Badge | null>(null);

  const roleTag = role === 'athlete' ? 'ATHLETE DASHBOARD' : 'SUPPORTER DASHBOARD';

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists() && snap.data().avatarUrl) setAvatarUrl(snap.data().avatarUrl);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!teamCode) return;
    getDoc(doc(db, 'teams', teamCode)).then(snap => {
      if (snap.exists() && snap.data().teamName) setTeamName(snap.data().teamName);
    }).catch(() => {});
  }, [teamCode]);

  const handleAvatarPress = () => setProfileOpen(true);

  const openEvent = useCallback((event: TeamEvent) => {
    setSelectedEvent(event);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSelectedEvent(null), 300);
  }, []);

  const nextEvent = MOCK_EVENTS.find(
    e => e.date >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  const thisMonday = getMondayOfWeek(new Date());
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() + i * 7);
    return start;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          League<Text style={{ color: Colors.cyan }}>Matrix</Text>
        </Text>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.exitBtn} hitSlop={8}>
          <Text style={styles.exitBtnText}>⏻</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

        {/* Hero */}
        <LinearGradient colors={Gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTag}>{roleTag}</Text>
            <Text style={styles.heroName}>{teamName}</Text>
            {teamCode && (
              <View style={styles.teamCodeChip}>
                <Text style={styles.teamCodeLabel}>CODE</Text>
                <Text style={styles.teamCodeVal}>{teamCode}</Text>
              </View>
            )}
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {SPORT_ICON[coachSport] ?? '🏅'}{'  '}{coachSport.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Right: Avatar + Badge overlay */}
          <View style={styles.heroRight}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handleAvatarPress} activeOpacity={0.8}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle-outline" size={56} color={HeroText.secondary} />
                )}
              </View>
              <View style={[styles.badgeOverlay, { backgroundColor: badgeColor }]}>
                <MaterialCommunityIcons name={badgeIcon as any} size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Install prompt */}
        <InstallPromptBanner />

        {/* Badges shelf */}
        <BadgeShelf earnedBadges={earnedBadges} onBadgePress={setSelectedBadge} />

        {/* Next Event Card */}
        {nextEvent && (
          <TouchableOpacity
            style={styles.nextEventCard}
            activeOpacity={0.85}
            onPress={() => openEvent(nextEvent)}
          >
            <View style={[styles.necAccent, { backgroundColor: TYPE_COLOR[nextEvent.type] }]} />
            <View style={styles.necTag}>
              <View style={[styles.necDot, { backgroundColor: Colors.cyan }]} />
              <Text style={[styles.necTagText, { color: Colors.cyan }]}>
                {isToday(nextEvent.date)
                  ? `NEXT ${TYPE_LABEL[nextEvent.type]} • TODAY`
                  : `NEXT ${TYPE_LABEL[nextEvent.type]}`}
              </Text>
            </View>
            <Text style={styles.necTitle}>{nextEvent.title}</Text>
            <Text style={styles.necMeta}>
              🕐 {nextEvent.time}{'  '}📍 {nextEvent.location}
              {nextEvent.playerCount ? `  👥 ${nextEvent.playerCount}` : ''}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionDivider} />

        {/* Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHead}>
            <Text style={styles.sectionTitle}>SCHEDULE</Text>
          </View>

          <WeekRow weekStart={weeks[0]} days={getWeekDays(weeks[0])} onEventPress={openEvent} />

          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setCalExpanded(prev => !prev)}
          >
            <Text style={styles.expandText}>
              {calExpanded ? 'HIDE CALENDAR ▲' : 'SEE FULL CALENDAR ▼'}
            </Text>
          </TouchableOpacity>

          {calExpanded && weeks.slice(1).map((weekStart, wi) => (
            <WeekRow key={wi} weekStart={weekStart} days={getWeekDays(weekStart)} onEventPress={openEvent} />
          ))}
        </View>

        <View style={styles.sectionDivider} />

        {/* Team Access Grid */}
        <TeamAccessGrid role={role} />

        <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <View style={styles.badgeOverlayFull} pointerEvents="box-none">
          <TouchableOpacity style={styles.badgeBackdrop} activeOpacity={1} onPress={() => setSelectedBadge(null)} />
          <View style={styles.badgeModal}>
            <View style={[styles.badgeModalIcon, { backgroundColor: selectedBadge.color + '20', borderColor: selectedBadge.color + '50' }]}>
              <MaterialCommunityIcons name={selectedBadge.icon as any} size={48} color={selectedBadge.color} />
            </View>
            <Text style={[styles.badgeModalName, { color: selectedBadge.color }]}>{selectedBadge.name}</Text>
            <Text style={styles.badgeModalDesc}>{selectedBadge.description}</Text>
            <View style={[styles.badgeCatPill, { borderColor: selectedBadge.color + '40', backgroundColor: selectedBadge.color + '12' }]}>
              <Text style={[styles.badgeCatText, { color: selectedBadge.color }]}>{selectedBadge.category.toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.badgeCloseBtn} onPress={() => setSelectedBadge(null)}>
              <Text style={styles.badgeCloseBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal badge={pendingBadge} onDismiss={clearPendingBadge} />

      {/* Event Sheet */}
      <EventSheet event={selectedEvent} visible={sheetVisible} onClose={closeSheet} />

      {/* Profile Sheet */}
      <ProfileSheet
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        avatarUrl={avatarUrl || null}
        onAvatarChange={setAvatarUrl}
      />
    </SafeAreaView>
  );
}

// ─── Team Access Grid ─────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TEAM_TOOLS = [
  { label: 'Roster',     sub: 'View the team',     icon: 'people-outline'    as IoniconsName, color: Colors.blue,   athleteOnly: false, locked: false },
  { label: 'Playbook',   sub: 'Study the plays',   icon: 'easel-outline'     as IoniconsName, color: Colors.cyan,   athleteOnly: false, locked: false },
  { label: 'My Stats',   sub: 'Your performance',  icon: 'bar-chart-outline' as IoniconsName, color: Colors.green,  athleteOnly: true,  locked: false },
  { label: 'Highlights', sub: 'Coming soon',       icon: 'film-outline'      as IoniconsName, color: Colors.purple, athleteOnly: false, locked: true  },
];

function TeamAccessGrid({ role }: { role: string | null }) {
  return (
    <View style={gridStyles.section}>
      <View style={gridStyles.header}>
        <Text style={gridStyles.headerLabel}>TEAM ACCESS</Text>
      </View>
      <View style={gridStyles.grid}>
        {TEAM_TOOLS.map(tool => {
          const isLocked = tool.locked || (tool.athleteOnly && role !== 'athlete');
          return (
            <TouchableOpacity
              key={tool.label}
              style={[gridStyles.card, isLocked && gridStyles.cardLocked]}
              activeOpacity={isLocked ? 0.7 : 0.78}
              disabled={isLocked}
            >
              <View style={[gridStyles.accentBar, { backgroundColor: isLocked ? Colors.muted : tool.color }]} />
              <View style={[gridStyles.iconWrap, { backgroundColor: isLocked ? Colors.bgDeep : `${tool.color}18` }]}>
                <Ionicons name={tool.icon} size={24} color={isLocked ? Colors.muted : tool.color} />
              </View>
              <Text style={[gridStyles.label, { color: isLocked ? Colors.muted : tool.color }]}>{tool.label}</Text>
              <Text style={gridStyles.sub}>{tool.sub}</Text>
              {isLocked && (
                <View style={gridStyles.lockedBadge}>
                  <Ionicons name="lock-closed" size={8} color={Colors.muted} />
                  <Text style={gridStyles.lockedBadgeText}>SOON</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const gridStyles = StyleSheet.create({
  section:     { paddingHorizontal: Spacing.lg, paddingTop: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  headerLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '48%' as any,
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
  cardLocked:      { opacity: 0.6, backgroundColor: Colors.bgDeep },
  accentBar:       { position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3 },
  iconWrap:        { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  label:           { fontFamily: Fonts.rajdhaniBold, fontSize: 17, letterSpacing: 0.3 },
  sub:             { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.2, lineHeight: 12 },
  lockedBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  lockedBadgeText: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, letterSpacing: 1 },
});

// ─── Week Row ─────────────────────────────────────────────────────────────────

function WeekRow({
  weekStart,
  days,
  onEventPress,
}: {
  weekStart: Date;
  days: Date[];
  onEventPress: (e: TeamEvent) => void;
}) {
  return (
    <View style={styles.weekRow}>
      <View style={styles.weekLabel}>
        <Text style={styles.weekLabelText}>{formatWeekRange(weekStart)}</Text>
        <View style={styles.weekLabelLine} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekStrip}
      >
        {days.map((date, i) => {
          const event    = getEventForDay(date);
          const todayDay = isToday(date);
          return (
            <DayCard
              key={i}
              date={date}
              event={event}
              isToday={todayDay}
              dayLabel={DAYS[i]}
              onPress={event ? () => onEventPress(event) : undefined}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({
  date,
  event,
  isToday: todayFlag,
  dayLabel,
  onPress,
}: {
  date: Date;
  event?: TeamEvent;
  isToday: boolean;
  dayLabel: string;
  onPress?: () => void;
}) {
  const hasEvent = !!event;
  const color    = event ? TYPE_COLOR[event.type] : Colors.muted;

  return (
    <TouchableOpacity
      style={[
        styles.dayCard,
        !hasEvent && styles.dayCardEmpty,
        todayFlag && styles.dayCardToday,
      ]}
      onPress={onPress}
      activeOpacity={hasEvent ? 0.75 : 0.4}
      disabled={!hasEvent}
    >
      {hasEvent && <View style={[styles.dayCardBar, { backgroundColor: color }]} />}
      <Text style={[styles.dayCardWeekday, !hasEvent && styles.dimText]}>{dayLabel}</Text>
      <Text style={[styles.dayCardMonth,   !hasEvent && styles.dimText]}>{MONTHS[date.getMonth()]}</Text>
      <Text style={[styles.dayCardNum,     !hasEvent && styles.dimText]}>{date.getDate()}</Text>
      {hasEvent ? (
        <>
          <Text style={[styles.dayCardType, { color }]}>{TYPE_LABEL[event!.type]}</Text>
          {event?.opponent && (
            <Text style={styles.dayCardOpp} numberOfLines={1}>{event.opponent}</Text>
          )}
        </>
      ) : (
        <Text style={styles.dayCardPlus}>+</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Event Sheet ──────────────────────────────────────────────────────────────

function EventSheet({
  event,
  visible,
  onClose,
}: {
  event: TeamEvent | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!event) return null;
  const color = TYPE_COLOR[event.type];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={[styles.sheetAccent, { backgroundColor: color }]} />
          <View style={styles.sheetHandle} />
          <View style={styles.sheetBody}>
            <View style={[styles.sheetBadge, { backgroundColor: color + '18', borderColor: color + '44' }]}>
              <Text style={[styles.sheetBadgeText, { color }]}>
                {event.type === 'game' ? '⚽' : event.type === 'practice' ? '🏃' : '🎬'}
                {'  '}{TYPE_LABEL[event.type]} DAY
              </Text>
            </View>
            <Text style={styles.sheetTitle}>{event.title}</Text>
            <View style={styles.sheetMeta}>
              <Text style={styles.sheetMetaText}>🕐 {event.time}</Text>
              <Text style={styles.sheetMetaText}>📍 {event.location}</Text>
              {event.playerCount && (
                <Text style={styles.sheetMetaText}>👥 {event.playerCount} Players</Text>
              )}
            </View>
            {event.type === 'game' && (
              <TouchableOpacity style={styles.gdlBtn} activeOpacity={0.85}>
                <Text style={styles.gdlBtnText}>⚡ GAME DAY LIVE</Text>
                <Text style={styles.gdlBtnSub}>Coming soon</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
            <Text style={styles.sheetCloseBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    backgroundImage: 'radial-gradient(rgba(37,99,235,0.13) 1.5px, transparent 1.5px)' as any,
    backgroundSize: '22px 22px' as any,
  },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: Colors.bg,
  },
  logo:        { fontFamily: Fonts.rajdhaniBold, fontSize: 18, color: Colors.blue, letterSpacing: 1 },
  exitBtn:     { paddingHorizontal: 8, paddingVertical: 3, marginLeft: 2 },
  exitBtnText: { fontSize: 15, color: Colors.muted },

  // Hero — matches DashboardScreen exactly
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 60,
    minHeight: 220,
    gap: Spacing.xl,
    borderRadius: 28,
    borderBottomLeftRadius: 72,
    borderBottomRightRadius: 72,
    boxShadow: '0 16px 48px rgba(21,101,192,0.45), 0 4px 16px rgba(0,0,0,0.22)' as any,
  },
  heroLeft: { flex: 1 },
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: 120,
  },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: HeroText.secondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 32,
    color: HeroText.primary,
    lineHeight: 34,
    marginBottom: 8,
  },
  teamCodeChip: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 6,
  },
  teamCodeLabel: { fontFamily: Fonts.mono, fontSize: 7, color: HeroText.muted, letterSpacing: 1 },
  teamCodeVal:   { fontFamily: Fonts.monoBold, fontSize: 10, color: HeroText.primary, letterSpacing: 1.5 },
  sportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sportBadgeText: { fontFamily: Fonts.mono, fontSize: 9, color: HeroText.secondary, letterSpacing: 1 },

  avatarWrap: { position: 'relative', width: 100, height: 100 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 100, height: 100 },
  badgeOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1565c0',
  },

  // Next Event Card
  nextEventCard: {
    marginHorizontal: Spacing.lg,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border2,
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 8px rgba(0,50,150,0.1), inset 0 -1px 4px rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.06)' as any,
  },
  necAccent:  { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  necTag:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  necDot:     { width: 6, height: 6, borderRadius: 3 },
  necTagText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2 },
  necTitle:   { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.text, marginBottom: 6 },
  necMeta:    { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim },

  sectionDivider: {
    marginHorizontal: Spacing.lg,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
    opacity: 0.6,
  },

  // Schedule
  scheduleSection: { paddingTop: 0 },
  scheduleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
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

  weekRow:       { marginBottom: 16 },
  weekLabel:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: 8 },
  weekLabelText: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
  weekLabelLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  weekStrip:     { paddingHorizontal: Spacing.lg, gap: 5 },

  dayCard: {
    width: 68,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingBottom: 8,
    paddingTop: 0,
    alignItems: 'center',
    overflow: 'hidden',
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

  // Event sheet
  sheet: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    overflow: 'hidden',
  },
  sheetAccent: { height: 3, width: '100%' },
  sheetHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetBody:      { paddingHorizontal: Spacing.xl, paddingBottom: 8 },
  sheetBadge:     { alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  sheetBadgeText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, fontWeight: '600' },
  sheetTitle:     { fontFamily: Fonts.rajdhaniBold, fontSize: 26, color: Colors.text, lineHeight: 30, marginBottom: 10 },
  sheetMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  sheetMetaText:  { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim },
  gdlBtn: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.amber}44`,
    backgroundColor: `${Colors.amber}10`,
    alignItems: 'center',
    marginBottom: 8,
  },
  gdlBtnText:        { fontFamily: Fonts.orbitron, fontSize: 12, color: Colors.amber, letterSpacing: 1.5 },
  gdlBtnSub:         { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, marginTop: 3, letterSpacing: 1 },
  sheetCloseBtn:     { alignItems: 'center', paddingVertical: 16 },
  sheetCloseBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },

  // Badge detail overlay
  badgeOverlayFull: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  badgeBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  badgeModal: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    width: 260,
  },
  badgeModalIcon: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  badgeModalName: {
    fontFamily: Fonts.orbitron,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  badgeModalDesc: {
    fontFamily: Fonts.rajdhani,
    fontSize: 15,
    color: Colors.dim,
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeCatPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeCatText:     { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5 },
  badgeCloseBtn:    { marginTop: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border2 },
  badgeCloseBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 1.5 },
});
