import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

type EventType = 'game' | 'practice' | 'film';

interface TeamEvent {
  id: string;
  type: EventType;
  title: string;
  opponent?: string;
  date: Date;
  time: string;
  location: string;
  prepPct: number;
  playerCount?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const today = new Date();
const d = (offsetDays: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date;
};

const MOCK_EVENTS: TeamEvent[] = [
  {
    id: '1',
    type: 'game',
    title: 'vs Eagles SC',
    opponent: 'Eagles SC',
    date: d(0),
    time: '6:30 PM',
    location: 'Turf Stadium',
    prepPct: 46,
    playerCount: 18,
  },
  {
    id: '2',
    type: 'practice',
    title: 'PRACTICE',
    date: d(2),
    time: '4:30 PM',
    location: 'Field B',
    prepPct: 0,
  },
  {
    id: '3',
    type: 'film',
    title: 'FILM SESSION',
    date: d(4),
    time: '6:00 PM',
    location: 'Rec Center',
    prepPct: 0,
  },
  {
    id: '4',
    type: 'game',
    title: 'vs Storm United',
    opponent: 'Storm United',
    date: d(7),
    time: '10:00 AM',
    location: 'Riverside Park',
    prepPct: 0,
    playerCount: 18,
  },
  {
    id: '5',
    type: 'practice',
    title: 'PRACTICE',
    date: d(9),
    time: '4:30 PM',
    location: 'Field B',
    prepPct: 0,
  },
  {
    id: '6',
    type: 'game',
    title: 'vs North Eagles',
    opponent: 'North Eagles',
    date: d(14),
    time: '11:00 AM',
    location: 'Central Stadium',
    prepPct: 0,
    playerCount: 18,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const TYPE_COLOR: Record<EventType, string> = {
  game: Colors.amber,
  practice: Colors.green,
  film: Colors.purple,
};

const TYPE_LABEL: Record<EventType, string> = {
  game: 'GAME',
  practice: 'TRAIN',
  film: 'FILM',
};

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
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

export default function DashboardScreen() {
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [calExpanded, setCalExpanded] = useState(false);

  const openEvent = useCallback((event: TeamEvent) => {
    setSelectedEvent(event);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSelectedEvent(null), 300);
  }, []);

  const nextEvent = MOCK_EVENTS.find(e => e.date >= new Date(new Date().setHours(0, 0, 0, 0)));

  // Generate 4 weeks from this Monday
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
          MOTI<Text style={{ color: Colors.cyan }}>coach</Text>
        </Text>
        <View style={styles.headerPills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>LVL 3</Text>
          </View>
          <View style={[styles.pill, styles.pillAmber]}>
            <Text style={[styles.pillText, { color: Colors.amber }]}>340 XP</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTag}>COACH DASHBOARD</Text>
            <Text style={styles.heroName}>Riverside{'\n'}Rockets</Text>
            <View style={styles.heroTier}>
              <View style={styles.tierDot} />
              <Text style={styles.tierText}>SEASON ACTIVE</Text>
            </View>
          </View>
          <View style={styles.motiPlaceholder}>
            <Image
              source={require('../../assets/moti-nobg.png')}
              style={styles.motiImage}
              resizeMode="contain"
            />
            <Text style={styles.motiLabel}>PROTO · LV3</Text>
          </View>
        </View>

        {/* Next Event Card */}
        {nextEvent && (
          <TouchableOpacity
            style={styles.nextEventCard}
            activeOpacity={0.85}
            onPress={() => openEvent(nextEvent)}
          >
            <View style={[styles.necAccent, { backgroundColor: TYPE_COLOR[nextEvent.type] }]} />
            <View style={styles.necTag}>
              <View style={styles.necDot} />
              <Text style={styles.necTagText}>
                {isToday(nextEvent.date)
                  ? `NEXT ${TYPE_LABEL[nextEvent.type]} • TODAY`
                  : `NEXT ${TYPE_LABEL[nextEvent.type]}`}
              </Text>
            </View>
            <Text style={styles.necTitle}>{nextEvent.title}</Text>
            <Text style={styles.necMeta}>
              🕐 {nextEvent.time}  📍 {nextEvent.location}
              {nextEvent.playerCount ? `  👥 ${nextEvent.playerCount} Players` : ''}
            </Text>

            <View style={styles.necRow}>
              {/* Prep score */}
              <View style={styles.prepScoreWrap}>
                <View style={[styles.prepCircle,
                  { borderColor: nextEvent.prepPct > 0 ? Colors.amber : Colors.border }]}>
                  <Text style={[styles.prepNum,
                    { color: nextEvent.prepPct > 0 ? Colors.amber : Colors.muted }]}>
                    {nextEvent.prepPct}
                  </Text>
                </View>
                <View>
                  <Text style={styles.prepLabel}>PREP SCORE</Text>
                  <Text style={styles.prepSub}>
                    {nextEvent.prepPct > 0 ? '3 of 6 steps done' : 'Not started'}
                  </Text>
                </View>
              </View>

              {/* CTA */}
              <TouchableOpacity
                style={[styles.necCta, { backgroundColor: TYPE_COLOR[nextEvent.type] }]}
                onPress={() => openEvent(nextEvent)}
              >
                <Text style={styles.necCtaText}>▶ PREP NOW</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Schedule Section */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHead}>
            <Text style={styles.sectionTitle}>SCHEDULE</Text>
            <TouchableOpacity style={styles.addEventBtn}>
              <Text style={styles.addEventText}>+ ADD EVENT</Text>
            </TouchableOpacity>
          </View>

          {/* Current week — always visible */}
          <WeekRow
            weekStart={weeks[0]}
            days={getWeekDays(weeks[0])}
            onEventPress={openEvent}
          />

          {/* Expand toggle */}
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => setCalExpanded(prev => !prev)}
          >
            <Text style={styles.expandText}>
              {calExpanded ? 'HIDE CALENDAR ▲' : 'SEE FULL CALENDAR ▼'}
            </Text>
          </TouchableOpacity>

          {/* Remaining weeks — shown when expanded */}
          {calExpanded && weeks.slice(1).map((weekStart, wi) => (
            <WeekRow
              key={wi}
              weekStart={weekStart}
              days={getWeekDays(weekStart)}
              onEventPress={openEvent}
            />
          ))}
        </View>

        {/* Player Pulse */}
        <PlayerPulse />

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Event Preview Sheet */}
      <EventPreviewSheet
        event={selectedEvent}
        visible={sheetVisible}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}

// ─── Player Pulse ────────────────────────────────────────────────────────────

// Data will be sourced from prep book completions + check-ins once wired to Firebase
const PULSE_STATS = [
  { value: '95%', label: 'ATTENDANCE',  trend: '+3% this week',  trendUp: true,  color: Colors.green },
  { value: '82',  label: 'AVG PERF',   trend: '— Steady',       trendUp: null,  color: Colors.amber },
  { value: '2',   label: 'INJURIES',   trend: '▼ Monitor',      trendUp: false, color: Colors.red   },
  { value: '8.4', label: 'MORALE',     trend: '▲ High energy',  trendUp: true,  color: Colors.cyan  },
];

function PlayerPulse() {
  return (
    <View style={pulseStyles.section}>
      <View style={pulseStyles.head}>
        <Text style={pulseStyles.title}>PLAYER PULSE</Text>
        <Text style={pulseStyles.sub}>prep book  ·  check-in</Text>
      </View>
      <View style={pulseStyles.grid}>
        {PULSE_STATS.map((stat) => (
          <View key={stat.label} style={pulseStyles.card}>
            <View style={[pulseStyles.cardBar, { backgroundColor: stat.color }]} />
            <Text style={[pulseStyles.val, { color: stat.color }]}>{stat.value}</Text>
            <Text style={pulseStyles.label}>{stat.label}</Text>
            <Text style={[
              pulseStyles.trend,
              stat.trendUp === true  && { color: Colors.green },
              stat.trendUp === false && { color: Colors.red   },
              stat.trendUp === null  && { color: Colors.dim   },
            ]}>
              {stat.trend}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.lg, paddingTop: 20 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sub: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    width: '47.5%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
  },
  val: {
    fontFamily: Fonts.orbitron,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 6,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  trend: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});

// ─── Week Row ────────────────────────────────────────────────────────────────

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
          const event = getEventForDay(date);
          const today = isToday(date);
          return (
            <DayCard
              key={i}
              date={date}
              event={event}
              isToday={today}
              dayLabel={DAYS[i]}
              onPress={event ? () => onEventPress(event) : undefined}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Day Card ────────────────────────────────────────────────────────────────

function DayCard({
  date,
  event,
  isToday,
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
  const color = event ? TYPE_COLOR[event.type] : Colors.muted;

  return (
    <TouchableOpacity
      style={[
        styles.dayCard,
        !hasEvent && styles.dayCardEmpty,
        isToday && styles.dayCardToday,
      ]}
      onPress={onPress}
      activeOpacity={hasEvent ? 0.75 : 0.4}
      disabled={!hasEvent}
    >
      {/* Top color bar */}
      {hasEvent && <View style={[styles.dayCardBar, { backgroundColor: color }]} />}

      <Text style={[styles.dayCardWeekday, !hasEvent && styles.dimText]}>
        {dayLabel}
      </Text>
      <Text style={[styles.dayCardMonth, !hasEvent && styles.dimText]}>
        {MONTHS[date.getMonth()]}
      </Text>
      <Text style={[styles.dayCardNum, !hasEvent && styles.dimText]}>
        {date.getDate()}
      </Text>

      {hasEvent ? (
        <>
          <Text style={[styles.dayCardType, { color }]}>
            {TYPE_LABEL[event!.type]}
          </Text>
          {event?.opponent && (
            <Text style={styles.dayCardOpp} numberOfLines={1}>
              {event.opponent}
            </Text>
          )}
          {/* Prep bar */}
          <View style={styles.dayPrepBar}>
            <View style={[styles.dayPrepFill, {
              width: `${event!.prepPct}%` as any,
              backgroundColor: color,
            }]} />
          </View>
        </>
      ) : (
        <Text style={styles.dayCardPlus}>+</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Event Preview Sheet ──────────────────────────────────────────────────────

function EventPreviewSheet({
  event,
  visible,
  onClose,
}: {
  event: TeamEvent | null;
  visible: boolean;
  onClose: () => void;
}) {
  const navigation = useNavigation<any>();
  if (!event) return null;
  const color = TYPE_COLOR[event.type];

  const handleStartPrep = () => {
    onClose();
    setTimeout(() => {
      navigation.navigate('PrepBook', {
        eventTitle: event.title,
        eventType: event.type,
      });
    }, 300); // let sheet close before navigating
  };
  const prepColor = event.prepPct >= 80 ? Colors.green
    : event.prepPct >= 40 ? Colors.amber
    : Colors.red;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        {/* Top accent */}
        <View style={[styles.sheetAccent, { backgroundColor: color }]} />
        <View style={styles.sheetHandle} />

        <View style={styles.sheetBody}>
          {/* Badge */}
          <View style={[styles.sheetBadge,
            { backgroundColor: `${color}18`, borderColor: `${color}44` }]}>
            <Text style={[styles.sheetBadgeText, { color }]}>
              {event.type === 'game' ? '⚽' : event.type === 'practice' ? '🏃' : '🎬'}
              {'  '}{TYPE_LABEL[event.type]} DAY
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.sheetTitle}>{event.title}</Text>
          {event.opponent && (
            <Text style={[styles.sheetOpponent, { color }]}>{event.title}</Text>
          )}

          {/* Meta */}
          <View style={styles.sheetMeta}>
            <Text style={styles.sheetMetaText}>
              🕐 {event.time}
            </Text>
            <Text style={styles.sheetMetaText}>
              📍 {event.location}
            </Text>
            {event.playerCount && (
              <Text style={styles.sheetMetaText}>
                👥 {event.playerCount} Players
              </Text>
            )}
          </View>

          {/* Prep score */}
          <View style={styles.prepPill}>
            <View>
              <Text style={[styles.prepPillPct,
                { color: event.prepPct > 0 ? prepColor : Colors.muted }]}>
                {event.prepPct}%
              </Text>
              <Text style={styles.prepPillLabel}>PREP SCORE</Text>
            </View>
            <Text style={[styles.prepPillStatus,
              { color: event.prepPct > 0 ? prepColor : Colors.muted }]}>
              {event.prepPct === 0 ? 'Not started'
                : event.prepPct < 50 ? 'In progress'
                : event.prepPct < 100 ? 'Almost ready'
                : 'Ready!'}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.sheetBtns}>
          <TouchableOpacity
            style={[styles.sheetBtnPrimary, { backgroundColor: color }]}
            onPress={handleStartPrep}
          >
            <Text style={styles.sheetBtnPrimaryText}>⚡ START PREP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sheetBtnSecondary}
            onPress={onClose}
          >
            <Text style={styles.sheetBtnSecondaryText}>SEE FULL EVENT ↓</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.sheetBtnClose}>
            <Text style={styles.sheetBtnCloseText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  // Header
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
  logo: {
    fontFamily: Fonts.orbitron,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 3,
  },
  headerPills: { flexDirection: 'row', gap: 6 },
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
  pillText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.blue,
    letterSpacing: 0.5,
  },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    minHeight: 140,
  },
  heroLeft: { flex: 1 },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroName: {
    fontFamily: Fonts.orbitron,
    fontSize: 24,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  tierDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.cyan },
  tierText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan, letterSpacing: 1.5 },
  motiPlaceholder: { width: 100, height: 130, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 },
  motiImage: { width: 100, height: 120, position: 'absolute', bottom: 18 },
  motiLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 1, marginTop: 4 },

  // Next Event Card
  nextEventCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    backgroundColor: 'rgba(15,35,90,0.95)',
    borderWidth: 1,
    borderColor: Colors.border2,
    overflow: 'hidden',
  },
  necAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  necTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  necDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.cyan },
  necTagText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.cyan, letterSpacing: 2 },
  necTitle: { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.text, marginBottom: 6 },
  necMeta: { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim, marginBottom: 14 },
  necRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  prepScoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepNum: { fontFamily: Fonts.orbitron, fontSize: 14 },
  prepLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 1 },
  prepSub: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, marginTop: 1 },

  necCta: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: Radius.md,
  },
  necCtaText: {
    fontFamily: Fonts.orbitron,
    fontSize: 11,
    color: '#000',
    letterSpacing: 1,
  },

  // Schedule
  scheduleSection: { paddingTop: 20 },
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
  addEventBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.05)',
  },
  addEventText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.cyan,
    letterSpacing: 1,
  },

  // Expand toggle
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

  // Week row
  weekRow: { marginBottom: 16 },
  weekLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
  },
  weekLabelText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  weekLabelLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  weekStrip: { paddingHorizontal: Spacing.lg, gap: 5 },

  // Day card
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
  dayCardEmpty: { opacity: 0.35 },
  dayCardToday: { borderColor: 'rgba(0,212,255,0.5)' },
  dayCardBar: { width: '100%', height: 2, marginBottom: 6 },
  dayCardWeekday: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCardMonth: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCardNum: {
    fontFamily: Fonts.orbitron,
    fontSize: 18,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 2,
  },
  dayCardType: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayCardOpp: {
    fontFamily: Fonts.mono,
    fontSize: 6,
    color: Colors.amber,
    marginTop: 1,
    maxWidth: 60,
    textAlign: 'center',
  },
  dayCardPlus: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.muted,
    marginTop: 4,
  },
  dayPrepBar: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  dayPrepFill: { height: '100%', borderRadius: 1 },
  dimText: { opacity: 0.4 },

  // Sheet
  sheetOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
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
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetBody: { paddingHorizontal: Spacing.xl, paddingBottom: 8 },
  sheetBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  sheetBadgeText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, fontWeight: '600' },
  sheetTitle: {
    fontFamily: Fonts.orbitron,
    fontSize: 24,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 4,
  },
  sheetOpponent: { fontSize: 14, fontFamily: Fonts.rajdhani, fontWeight: '700', marginBottom: 8 },
  sheetMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  sheetMetaText: { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim },
  prepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  prepPillPct: { fontFamily: Fonts.orbitron, fontSize: 22 },
  prepPillLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1 },
  prepPillStatus: { fontFamily: Fonts.rajdhani, fontSize: 13, fontWeight: '600' },

  sheetBtns: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 10,
  },
  sheetBtnPrimary: {
    width: '100%',
    padding: 15,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnPrimaryText: {
    fontFamily: Fonts.orbitron,
    fontSize: 13,
    color: '#000',
    letterSpacing: 1.5,
  },
  sheetBtnSecondary: {
    width: '100%',
    padding: 13,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    backgroundColor: 'rgba(61,143,255,0.06)',
  },
  sheetBtnSecondaryText: {
    fontFamily: Fonts.orbitron,
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 1,
  },
  sheetBtnClose: { alignItems: 'center', padding: 8 },
  sheetBtnCloseText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
  },
});
