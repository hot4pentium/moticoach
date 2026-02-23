import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCoach } from '../context/CoachContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import MotiHero from '../components/MotiHero';

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
  const { user, role } = useAuth();
  const { teamXp, motiStage } = useCoach();

  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const [sheetVisible,  setSheetVisible]  = useState(false);
  const [calExpanded,   setCalExpanded]   = useState(false);

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Fan';
  const roleLabel   = role === 'athlete' ? 'ATHLETE' : 'SUPPORTER';

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
        <View>
          <Text style={styles.logo}>
            MOTI<Text style={{ color: Colors.cyan }}>coach</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>LVL {motiStage + 1}</Text>
          </View>
          <View style={[styles.pill, styles.pillAmber]}>
            <Text style={[styles.pillText, { color: Colors.amber }]}>{teamXp} XP</Text>
          </View>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.exitBtn} hitSlop={8}>
            <Text style={styles.exitBtnText}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Welcome hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroGreet}>WELCOME BACK</Text>
            <Text style={styles.heroName}>{displayName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>
          <MotiHero motiStage={motiStage} />
        </View>

        <View style={styles.sectionDivider} />

        {/* Next event card */}
        {nextEvent && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NEXT EVENT</Text>
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
                    ? `NEXT ${TYPE_LABEL[nextEvent.type]} · TODAY`
                    : `NEXT ${TYPE_LABEL[nextEvent.type]}`}
                </Text>
              </View>
              <Text style={styles.necTitle}>{nextEvent.title}</Text>
              <Text style={styles.necMeta}>
                🕐 {nextEvent.time}  📍 {nextEvent.location}
                {nextEvent.playerCount ? `  👥 ${nextEvent.playerCount} Players` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionDivider} />

        {/* Schedule */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHead}>
            <Text style={styles.sectionLabel}>SCHEDULE</Text>
          </View>

          <WeekRow
            weekStart={weeks[0]}
            days={getWeekDays(weeks[0])}
            onEventPress={openEvent}
          />

          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setCalExpanded(prev => !prev)}
          >
            <Text style={styles.expandText}>
              {calExpanded ? 'HIDE CALENDAR ▲' : 'SEE FULL CALENDAR ▼'}
            </Text>
          </TouchableOpacity>

          {calExpanded && weeks.slice(1).map((weekStart, wi) => (
            <WeekRow
              key={wi}
              weekStart={weekStart}
              days={getWeekDays(weekStart)}
              onEventPress={openEvent}
            />
          ))}
        </View>

        <View style={styles.sectionDivider} />

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EXPLORE</Text>
          <View style={styles.quickGrid}>
            <QuickLink icon="people-outline"     label="ROSTER"     desc="View the team"    />
            <QuickLink icon="book-outline"        label="PLAYBOOK"   desc="Study the plays"  />
            {role === 'athlete'
              ? <QuickLink icon="bar-chart-outline" label="STATS"    desc="Your performance" />
              : <QuickLink icon="sparkles-outline"  label="MOTI"     desc="Team spirit meter"/>
            }
            <QuickLink icon="trophy-outline"      label="HIGHLIGHTS" desc="Coming soon"  dim />
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* Team MOTI status */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TEAM MOTI</Text>
          <View style={styles.motiCard}>
            <View style={styles.motiCardLeft}>
              <Text style={styles.motiStageLabel}>STAGE {motiStage + 1}</Text>
              <Text style={styles.motiStageName}>
                {['BOOT', 'CORE', 'REACH', 'STRIDE', 'PRIME'][motiStage]}
              </Text>
              <Text style={styles.motiXp}>{teamXp} XP earned together</Text>
            </View>
            <View style={styles.motiCardRight}>
              <Text style={styles.motiEmoji}>⚡</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Event sheet */}
      <EventSheet
        event={selectedEvent}
        visible={sheetVisible}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}

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
        <Text style={[styles.dayCardType, { color }]}>{TYPE_LABEL[event!.type]}</Text>
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
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose} />
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
    </Modal>
  );
}

// ─── Quick Link ───────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function QuickLink({ icon, label, desc, dim }: { icon: IoniconsName; label: string; desc: string; dim?: boolean }) {
  return (
    <TouchableOpacity style={[styles.qlCard, dim && { opacity: 0.4 }]} activeOpacity={dim ? 1 : 0.75}>
      <Ionicons name={icon} size={22} color={dim ? Colors.muted : Colors.cyan} style={styles.qlIcon} />
      <Text style={styles.qlLabel}>{label}</Text>
      <Text style={styles.qlDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  logo: { fontFamily: Fonts.orbitron, fontSize: 15, color: Colors.text, letterSpacing: 3 },
  headerRight: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(61,143,255,0.07)',
  },
  pillAmber: {
    borderColor: 'rgba(212,168,83,0.3)',
    backgroundColor: 'rgba(212,168,83,0.07)',
  },
  pillText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.blue, letterSpacing: 0.5 },
  exitBtn: { paddingHorizontal: 8, paddingVertical: 3, marginLeft: 2 },
  exitBtnText: { fontSize: 15, color: Colors.muted },

  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: '#000',
  },
  heroLeft: { flex: 1 },
  heroGreet: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2, marginBottom: 4 },
  heroName:  { fontFamily: Fonts.orbitron, fontSize: 26, color: Colors.text, marginBottom: 10 },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.cyan}44`,
    backgroundColor: `${Colors.cyan}10`,
  },
  roleBadgeText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.cyan, letterSpacing: 1.5 },

  sectionDivider: {
    marginHorizontal: Spacing.lg,
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
    opacity: 0.6,
  },
  section:      { paddingHorizontal: Spacing.lg },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Next event card
  nextEventCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: 'rgba(15,35,90,0.95)',
    borderWidth: 1,
    borderColor: Colors.border2,
    overflow: 'hidden',
  },
  necAccent:  { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  necTag:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  necDot:     { width: 6, height: 6, borderRadius: 3 },
  necTagText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 2 },
  necTitle:   { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.text, marginBottom: 6 },
  necMeta:    { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim },

  // Schedule
  scheduleSection: { paddingTop: 0 },
  scheduleHead: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 12,
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
  expandText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.cyan,
    letterSpacing: 1.5,
  },

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
  },
  dayCardEmpty:   { opacity: 0.35 },
  dayCardToday:   { borderColor: 'rgba(0,212,255,0.5)' },
  dayCardBar:     { width: '100%', height: 2, marginBottom: 6 },
  dayCardWeekday: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCardMonth:   { fontFamily: Fonts.mono, fontSize: 7, color: Colors.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCardNum:     { fontFamily: Fonts.orbitron, fontSize: 18, color: Colors.text, lineHeight: 22, marginBottom: 2 },
  dayCardType:    { fontFamily: Fonts.mono, fontSize: 7, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  dayCardPlus:    { fontFamily: Fonts.mono, fontSize: 16, color: Colors.muted, marginTop: 4 },
  dimText:        { opacity: 0.4 },

  // Event sheet
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#080f22',
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
  sheetTitle:     { fontFamily: Fonts.orbitron, fontSize: 24, color: Colors.text, lineHeight: 28, marginBottom: 10 },
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
  gdlBtnText: { fontFamily: Fonts.orbitron, fontSize: 12, color: Colors.amber, letterSpacing: 1.5 },
  gdlBtnSub:  { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, marginTop: 3, letterSpacing: 1 },
  sheetCloseBtn:     { alignItems: 'center', paddingVertical: 16 },
  sheetCloseBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },

  // Quick links
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  qlCard: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  qlIcon:  { marginBottom: 6 },
  qlLabel: { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.text, letterSpacing: 1, marginBottom: 2 },
  qlDesc:  { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.5 },

  // MOTI card
  motiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.cyan}33`,
    backgroundColor: `${Colors.cyan}07`,
    padding: Spacing.lg,
  },
  motiCardLeft:   { flex: 1 },
  motiStageLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 1.5, marginBottom: 2 },
  motiStageName:  { fontFamily: Fonts.orbitron, fontSize: 18, color: Colors.cyan, marginBottom: 4 },
  motiXp:         { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  motiCardRight:  { marginLeft: 12 },
  motiEmoji:      { fontSize: 32 },
});
