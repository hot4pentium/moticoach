import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  useWindowDimensions,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import LogoMark from '../components/LogoMark';
import BadgeShelf from '../components/BadgeShelf';
import { Badge } from '../lib/badges';
import TeamSettingsSheet from '../components/TeamSettingsSheet';
import InstallPromptBanner from '../components/InstallPromptBanner';
import { signOut } from 'firebase/auth';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useCoach } from '../context/CoachContext';
import { useAuth } from '../context/AuthContext';
import { TEAM_CODE } from './RosterScreen';
import { useOnboarding } from '../hooks/useOnboarding';
import OnboardingTooltip, { TargetLayout } from '../components/OnboardingTooltip';

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
  playerCount?: number;
  bringsDrinks?: string;
  bringsSnacks?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const today = new Date();
const d = (offsetDays: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date;
};

const INITIAL_EVENTS: TeamEvent[] = [
  { id: '1', type: 'game',     title: 'vs Eagles SC',    opponent: 'Eagles SC',   date: d(0),  time: '6:30 PM',  location: 'Turf Stadium',    playerCount: 18 },
  { id: '2', type: 'practice', title: 'PRACTICE',                                  date: d(2),  time: '4:30 PM',  location: 'Field B' },
  { id: '3', type: 'film',     title: 'FILM SESSION',                               date: d(4),  time: '6:00 PM',  location: 'Rec Center' },
  { id: '4', type: 'game',     title: 'vs Storm United', opponent: 'Storm United', date: d(7),  time: '10:00 AM', location: 'Riverside Park',  playerCount: 18 },
  { id: '5', type: 'practice', title: 'PRACTICE',                                  date: d(9),  time: '4:30 PM',  location: 'Field B' },
  { id: '6', type: 'game',     title: 'vs North Eagles', opponent: 'North Eagles', date: d(14), time: '11:00 AM', location: 'Central Stadium', playerCount: 18 },
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

const SPORT_ICON: Record<string, string> = {
  soccer:     '⚽',
  basketball: '🏀',
  football:   '🏈',
  baseball:   '⚾',
  volleyball: '🏐',
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

function getEventForDay(date: Date, evts: TeamEvent[]): TeamEvent | undefined {
  return evts.find(e => isSameDay(e.date, date));
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ─── Colour desaturation utility ─────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

/**
 * Blend a hex colour toward its greyscale equivalent.
 * Supports plain 6-char hex (#rrggbb) and 8-char hex+alpha (#rrggbbaa).
 * amount: 0 = original colour, 1 = fully grey.
 */
function desaturate(color: string, amount: number): string {
  if (amount <= 0) return color;
  // Handle '#rrggbbaa' (8-char hex with alpha)
  const hexAlpha = /^#([a-f\d]{6})([a-f\d]{2})$/i.exec(color);
  const hex6 = hexAlpha ? '#' + hexAlpha[1] : color;
  const [r, g, b] = hexToRgb(hex6);
  const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const nr = Math.round(r + (lum - r) * amount);
  const ng = Math.round(g + (lum - g) * amount);
  const nb = Math.round(b + (lum - b) * amount);
  if (hexAlpha) {
    return `rgba(${nr},${ng},${nb},${(parseInt(hexAlpha[2], 16) / 255).toFixed(2)})`;
  }
  return `rgb(${nr},${ng},${nb})`;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { coachSport, greyScale, earnedBadges, pendingBadge, clearPendingBadge,
          avatarUrl, badgeIcon, badgeColor, settingsOpen, openSettings, closeSettings } = useCoach();
  const { user, role } = useAuth();
  const navigation = useNavigation<any>();
  const { width: sw, height: sh } = useWindowDimensions();
  const [events, setEvents] = useState<TeamEvent[]>(INITIAL_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [prepPickerVisible, setPrepPickerVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  // Onboarding — keyed per user so each new account sees it fresh
  const onboarding = useOnboarding(`dashboard_${user?.uid ?? 'anon'}`, 2);
  const codeRef    = useRef<View>(null);
  const [codeLayout, setCodeLayout] = useState<TargetLayout | null>(null);

  const measureRef = (ref: React.RefObject<View | null>, setter: (l: TargetLayout) => void) => {
    setTimeout(() => {
      const node = ref.current as any;
      // getBoundingClientRect is accurate on web/PWA — use it when available
      if (node?.getBoundingClientRect) {
        const rect = node.getBoundingClientRect();
        if (rect.width > 0) setter({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
      } else {
        ref.current?.measure((_, __, width, height, pageX, pageY) => {
          if (width > 0) setter({ x: pageX, y: pageY, width, height });
        });
      }
    }, 200);
  };

  // Full nav bar: spans entire bottom of screen
  const navBarLayout: TargetLayout = { x: 0, y: sh - 70, width: sw, height: 70 };

  const TIPS = [
    { title: 'YOUR TEAM CODE',  body: `Share ${TEAM_CODE} with your players — they enter it on signup to auto-join your roster.`,                                            layout: codeLayout,   arrowSide: 'top'    as const },
    { title: 'YOUR NAVIGATION', body: 'HOME keeps you on the dashboard. BADGES tracks season achievements. TOOLS is where you run games — stat tracker, playmaker, prep book and more.', layout: navBarLayout, arrowSide: 'bottom' as const },
  ];

  const currentTip = TIPS[onboarding.step];

  // Convenience shorthand used throughout this component's JSX
  const ds = (color: string) => desaturate(color, greyScale);

  const openEvent = useCallback((event: TeamEvent) => {
    setSelectedEvent(event);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSelectedEvent(null), 300);
  }, []);

  const handleUpdateEvent = useCallback((id: string, updates: Partial<TeamEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    setSelectedEvent(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  }, []);

  const nextEvent = events.find(e => e.date >= new Date(new Date().setHours(0, 0, 0, 0)));

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
        <View style={styles.headerInner}>
          <LogoMark size="sm" />

          <View style={styles.headerPills}>
            <TouchableOpacity onPress={() => signOut(auth)} style={styles.exitBtn} hitSlop={8}>
              <Text style={styles.exitBtnText}>⏻</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

        {/* Hero */}
        <LinearGradient colors={Gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTag}>COACH DASHBOARD</Text>
            <Text style={styles.heroName}>Riverside{'\n'}Rockets</Text>
            <View
              ref={codeRef}
              style={styles.teamCodeChip}
              onLayout={() => measureRef(codeRef, setCodeLayout)}
            >
              <Text style={styles.teamCodeLabel}>CODE</Text>
              <Text style={styles.teamCodeVal}>{TEAM_CODE}</Text>
            </View>
            <View style={styles.sportBadge}>
              <Text style={styles.sportBadgeText}>
                {SPORT_ICON[coachSport] ?? '🏅'}{'  '}{coachSport.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Right: Avatar + Badge */}
          <View style={styles.heroRight}>
            <TouchableOpacity style={styles.avatarWrap} onPress={openSettings} activeOpacity={0.8}>
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
            <View style={[styles.necAccent, { backgroundColor: ds(TYPE_COLOR[nextEvent.type]) }]} />
            <View style={styles.necTag}>
              <View style={[styles.necDot, { backgroundColor: ds(Colors.cyan) }]} />
              <Text style={[styles.necTagText, { color: ds(Colors.cyan) }]}>
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

        {/* Section divider */}
        <View style={styles.sectionDivider} />

        {/* Schedule Section */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleHead}>
            <Text style={styles.sectionTitle}>SCHEDULE</Text>
          </View>

          {/* Current week — always visible */}
          <WeekRow
            weekStart={weeks[0]}
            days={getWeekDays(weeks[0])}
            events={events}
            onEventPress={openEvent}
          />

          {/* Full calendar link */}
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.expandText}>
              SEE FULL CALENDAR →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section divider */}
        <View style={styles.sectionDivider} />

        {/* Tools Grid */}
        <ToolsGrid onPickerOpen={() => setPrepPickerVisible(true)} />

        <View style={{ height: 32 }} />
          </View>
        </ScrollView>

      </View>

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
      <BadgeUnlockModal
        badge={pendingBadge}
        onDismiss={clearPendingBadge}
      />

      {/* Team Settings Sheet */}
      <TeamSettingsSheet
        visible={settingsOpen}
        onClose={closeSettings}
      />

      {/* Event Preview Sheet */}
      <EventPreviewSheet
        event={selectedEvent}
        visible={sheetVisible}
        onClose={closeSheet}
        canEdit={role === 'coach' || role === 'staff'}
        onUpdate={handleUpdateEvent}
      />

      {/* Prep Book Event Picker */}
      <PrepBookPickerSheet
        visible={prepPickerVisible}
        onClose={() => setPrepPickerVisible(false)}
        events={events}
        navigation={navigation}
      />

      {/* Onboarding tooltips */}
      {!onboarding.isDone && currentTip && (
        <OnboardingTooltip
          visible
          step={onboarding.step}
          totalSteps={2}
          title={currentTip.title}
          body={currentTip.body}
          targetLayout={currentTip.layout}
          arrowSide={currentTip.arrowSide}
          onNext={onboarding.next}
          onDismiss={onboarding.dismiss}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Tools Grid ──────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const DASH_TOOLS = [
  { label: 'Playmaker',    sub: 'Build plays & formations',   icon: 'easel-outline'     as IoniconsName, color: Colors.cyan,   screen: 'Playmaker',        locked: false, picker: false },
  { label: 'Roster',       sub: 'Manage your players',        icon: 'people-outline'    as IoniconsName, color: Colors.blue,   screen: 'Roster',           locked: false, picker: false },
  { label: 'Stat Tracker', sub: 'Record & review team stats', icon: 'bar-chart-outline' as IoniconsName, color: Colors.green,  screen: 'StatTrackerSetup', locked: false, picker: false },
  { label: 'Prep Book',    sub: 'Prep for a specific event',  icon: 'book-outline'      as IoniconsName, color: Colors.amber,  screen: 'PrepBook',         locked: false, picker: true  },
  { label: 'Highlights',   sub: 'Review & share key moments', icon: 'film-outline'      as IoniconsName, color: Colors.purple, screen: 'Highlights',       locked: false, picker: false },
  { label: 'Game Day',     sub: 'Live taps & fan engagement', icon: 'radio-outline'     as IoniconsName, color: Colors.amber,  screen: 'GameDayLive',      locked: false, picker: false },
];

function ToolsGrid({ onPickerOpen }: { onPickerOpen: () => void }) {
  const navigation = useNavigation<any>();
  return (
    <View style={toolGridStyles.section}>
      <View style={toolGridStyles.header}>
        <Text style={toolGridStyles.headerLabel}>COACH TOOLS</Text>
      </View>
      <View style={toolGridStyles.grid}>
        {DASH_TOOLS.map(tool => (
          <TouchableOpacity
            key={tool.label}
            style={[toolGridStyles.card, tool.locked && toolGridStyles.cardLocked]}
            activeOpacity={tool.locked ? 0.7 : 0.78}
            onPress={() => {
              if (tool.picker) { onPickerOpen(); return; }
              if (!tool.locked && tool.screen) navigation.navigate(tool.screen);
            }}
            disabled={tool.locked}
          >
            {/* Top accent bar */}
            <View style={[toolGridStyles.accentBar, { backgroundColor: tool.locked ? Colors.muted : tool.color }]} />

            {/* Icon */}
            <View style={[toolGridStyles.iconWrap, { backgroundColor: tool.locked ? Colors.bgDeep : `${tool.color}18` }]}>
              <Ionicons
                name={tool.icon}
                size={24}
                color={tool.locked ? Colors.muted : tool.color}
              />
            </View>

            {/* Text */}
            <Text style={[toolGridStyles.label, { color: tool.locked ? Colors.muted : tool.color }]}>
              {tool.label}
            </Text>
            <Text style={toolGridStyles.sub}>{tool.sub}</Text>

            {/* Coming soon badge */}
            {tool.locked && (
              <View style={toolGridStyles.lockedBadge}>
                <Ionicons name="lock-closed" size={8} color={Colors.muted} />
                <Text style={toolGridStyles.lockedBadgeText}>SOON</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const toolGridStyles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.lg, paddingTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerLabel: {
    fontFamily: Fonts.mono,
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  cardLocked: {
    opacity: 0.6,
    backgroundColor: Colors.bgDeep,
  },
  accentBar: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0,
    height: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  label: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 17,
    letterSpacing: 0.3,
  },
  sub: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 0.2,
    lineHeight: 12,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  lockedBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    letterSpacing: 1,
  },
});

// ─── Week Row ────────────────────────────────────────────────────────────────

function WeekRow({
  weekStart,
  days,
  events,
  onEventPress,
}: {
  weekStart: Date;
  days: Date[];
  events: TeamEvent[];
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
          const event = getEventForDay(date, events);
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
  const { greyScale } = useCoach();
  const ds = (color: string) => desaturate(color, greyScale);
  const hasEvent = !!event;
  const color = event ? ds(TYPE_COLOR[event.type]) : Colors.muted;

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
  canEdit = false,
  onUpdate,
}: {
  event: TeamEvent | null;
  visible: boolean;
  onClose: () => void;
  canEdit?: boolean;
  onUpdate?: (id: string, updates: Partial<TeamEvent>) => void;
}) {
  const { greyScale } = useCoach();
  const ds = (color: string) => desaturate(color, greyScale);
  const [editing, setEditing] = useState(false);
  const [drinksVal, setDrinksVal] = useState('');
  const [snacksVal, setSnacksVal] = useState('');

  useEffect(() => {
    if (event) {
      setDrinksVal(event.bringsDrinks ?? '');
      setSnacksVal(event.bringsSnacks ?? '');
    }
    setEditing(false);
  }, [event?.id]);

  if (!event) return null;
  const rawColor = TYPE_COLOR[event.type];
  const color = ds(rawColor);

  const handleSave = () => {
    onUpdate?.(event.id, { bringsDrinks: drinksVal.trim() || undefined, bringsSnacks: snacksVal.trim() || undefined });
    setEditing(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Top accent */}
        <View style={[styles.sheetAccent, { backgroundColor: color }]} />
        <View style={styles.sheetHandle} />

        <View style={styles.sheetBody}>
          {/* Badge */}
          <View style={[styles.sheetBadge,
            { backgroundColor: ds(rawColor + '18'), borderColor: ds(rawColor + '44') }]}>
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
            <Text style={styles.sheetMetaText}>🕐 {event.time}</Text>
            <Text style={styles.sheetMetaText}>📍 {event.location}</Text>
            {event.playerCount && (
              <Text style={styles.sheetMetaText}>👥 {event.playerCount} Players</Text>
            )}
          </View>

          {/* Drinks / Snacks */}
          {editing ? (
            <View style={styles.sheetEditSection}>
              <View style={styles.sheetEditRow}>
                <Text style={styles.sheetEditLabel}>🥤  BRINGING DRINKS</Text>
                <TextInput
                  style={styles.sheetEditInput}
                  value={drinksVal}
                  onChangeText={setDrinksVal}
                  placeholder="Enter name…"
                  placeholderTextColor={Colors.muted}
                />
              </View>
              <View style={styles.sheetEditRow}>
                <Text style={styles.sheetEditLabel}>🍿  BRINGING SNACKS</Text>
                <TextInput
                  style={styles.sheetEditInput}
                  value={snacksVal}
                  onChangeText={setSnacksVal}
                  placeholder="Enter name…"
                  placeholderTextColor={Colors.muted}
                />
              </View>
            </View>
          ) : (
            (event.bringsDrinks || event.bringsSnacks || canEdit) ? (
              <View style={styles.sheetInfoSection}>
                <View style={styles.sheetInfoRow}>
                  <Text style={styles.sheetInfoLabel}>🥤  DRINKS</Text>
                  <Text style={styles.sheetInfoVal}>{event.bringsDrinks || '—'}</Text>
                </View>
                <View style={styles.sheetInfoRow}>
                  <Text style={styles.sheetInfoLabel}>🍿  SNACKS</Text>
                  <Text style={styles.sheetInfoVal}>{event.bringsSnacks || '—'}</Text>
                </View>
              </View>
            ) : null
          )}
        </View>

        {/* Buttons */}
        <View style={styles.sheetBtns}>
          {canEdit && editing && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => setEditing(false)} style={[styles.sheetBtnSecondary, { flex: 1 }]}>
                <Text style={styles.sheetBtnSecondaryText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.sheetBtnPrimary, { flex: 1, backgroundColor: color }]}>
                <Text style={styles.sheetBtnPrimaryText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          )}
          {canEdit && !editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.sheetBtnSecondary}>
              <Text style={styles.sheetBtnSecondaryText}>EDIT EVENT</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.sheetBtnClose}>
            <Text style={styles.sheetBtnCloseText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </Modal>
  );
}

// ─── Prep Book Event Picker Sheet ────────────────────────────────────────────

interface PrepBookEntry {
  id: string;
  eventTitle: string;
  eventType: string;
  completedAt: number; // Unix ms
  completedSteps: number[];
  [key: string]: any;
}

export function PrepBookPickerSheet({
  visible, onClose, events, navigation,
}: {
  visible: boolean;
  onClose: () => void;
  events: TeamEvent[];
  navigation: any;
}) {
  const { teamCode } = useAuth();
  const [recentEntries, setRecentEntries] = useState<PrepBookEntry[]>([]);
  const [view, setView] = useState<'choice' | 'new' | 'previous'>('choice');

  useEffect(() => {
    if (visible) { setView('choice'); }
    if (!visible || !teamCode) return;
    getDocs(query(
      collection(db, 'teams', teamCode, 'prepBookEntries'),
      orderBy('completedAt', 'desc'),
      limit(5),
    )).then(snap => {
      setRecentEntries(snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
        completedAt: (d.data().completedAt as any)?.toDate?.()?.getTime() ?? 0,
      })));
    }).catch(() => {});
  }, [visible, teamCode]);

  const pickableEvents = events
    .filter(e => e.type === 'game' || e.type === 'practice')
    .slice(0, 5);

  function goPrep(eventType: string, eventTitle?: string) {
    onClose();
    navigation.navigate('PrepBook', { eventType, eventTitle: eventTitle ?? undefined });
  }

  function goReview(entry: PrepBookEntry) {
    onClose();
    navigation.navigate('PrepBook', { mode: 'review', entry });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={ppStyles.sheet}>
          <View style={ppStyles.handle} />

          {/* ── CHOICE VIEW ── */}
          {view === 'choice' && (
            <>
              <View style={ppStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={ppStyles.title}>PREP BOOK</Text>
                  <Text style={ppStyles.sub}>What would you like to do?</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={ppStyles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.dim} />
                </TouchableOpacity>
              </View>

              <View style={ppStyles.choiceGrid}>
                {/* Start New */}
                <TouchableOpacity style={ppStyles.choiceCard} onPress={() => setView('new')} activeOpacity={0.8}>
                  <View style={[ppStyles.choiceIcon, { backgroundColor: `${Colors.amber}18` }]}>
                    <Ionicons name="create-outline" size={28} color={Colors.amber} />
                  </View>
                  <Text style={[ppStyles.choiceLabel, { color: Colors.amber }]}>START NEW PREP</Text>
                  <Text style={ppStyles.choiceSub}>Build a game or practice plan</Text>
                  <View style={ppStyles.choiceArrow}>
                    <Ionicons name="arrow-forward" size={14} color={Colors.amber} />
                  </View>
                </TouchableOpacity>

                {/* Review Saved */}
                <TouchableOpacity
                  style={[ppStyles.choiceCard, recentEntries.length === 0 && ppStyles.choiceCardDim]}
                  onPress={() => recentEntries.length > 0 && setView('previous')}
                  activeOpacity={recentEntries.length > 0 ? 0.8 : 1}
                >
                  <View style={[ppStyles.choiceIcon, { backgroundColor: `${Colors.cyan}18` }]}>
                    <Ionicons name="book-outline" size={28} color={recentEntries.length > 0 ? Colors.cyan : Colors.muted} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[ppStyles.choiceLabel, { color: recentEntries.length > 0 ? Colors.cyan : Colors.muted }]}>
                      REVIEW SAVED
                    </Text>
                    {recentEntries.length > 0 && (
                      <View style={ppStyles.countPill}>
                        <Text style={ppStyles.countPillTxt}>{recentEntries.length}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={ppStyles.choiceSub}>
                    {recentEntries.length > 0 ? 'View your previous prep entries' : 'No saved prep books yet'}
                  </Text>
                  {recentEntries.length > 0 && (
                    <View style={ppStyles.choiceArrow}>
                      <Ionicons name="arrow-forward" size={14} color={Colors.cyan} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={{ height: Spacing.xl }} />
            </>
          )}

          {/* ── NEW PREP VIEW ── */}
          {view === 'new' && (
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={ppStyles.header}>
                <TouchableOpacity onPress={() => setView('choice')} style={ppStyles.backChip}>
                  <Ionicons name="chevron-back" size={14} color={Colors.cyan} />
                  <Text style={ppStyles.backChipTxt}>BACK</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={ppStyles.title}>SELECT EVENT</Text>
                  <Text style={ppStyles.sub}>Choose an upcoming event to prep for</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={ppStyles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.dim} />
                </TouchableOpacity>
              </View>

              {pickableEvents.length > 0 && (
                <View style={ppStyles.eventList}>
                  {pickableEvents.map((ev, i) => {
                    const color = TYPE_COLOR[ev.type];
                    const label = TYPE_LABEL[ev.type];
                    return (
                      <TouchableOpacity
                        key={ev.id}
                        style={[ppStyles.eventRow, i > 0 && ppStyles.eventRowBorder]}
                        onPress={() => goPrep(ev.type, ev.title)}
                        activeOpacity={0.75}
                      >
                        <View style={[ppStyles.dot, { backgroundColor: color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={ppStyles.eventTitle}>{ev.title}</Text>
                          <Text style={ppStyles.eventMeta}>{ev.time}</Text>
                        </View>
                        <View style={[ppStyles.typeBadge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
                          <Text style={[ppStyles.typeBadgeTxt, { color }]}>{label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.dim} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={ppStyles.dividerRow}>
                <View style={ppStyles.dividerLine} />
                <Text style={ppStyles.dividerTxt}>OR START WITHOUT AN EVENT</Text>
                <View style={ppStyles.dividerLine} />
              </View>

              <View style={ppStyles.fallbackRow}>
                <TouchableOpacity style={[ppStyles.fallbackBtn, { borderColor: Colors.amber }]} onPress={() => goPrep('game')} activeOpacity={0.8}>
                  <Ionicons name="trophy-outline" size={16} color={Colors.amber} />
                  <Text style={[ppStyles.fallbackBtnTxt, { color: Colors.amber }]}>GAME PREP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ppStyles.fallbackBtn, { borderColor: Colors.green }]} onPress={() => goPrep('practice')} activeOpacity={0.8}>
                  <Ionicons name="fitness-outline" size={16} color={Colors.green} />
                  <Text style={[ppStyles.fallbackBtnTxt, { color: Colors.green }]}>PRACTICE PLAN</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          )}

          {/* ── PREVIOUS VIEW ── */}
          {view === 'previous' && (
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              <View style={ppStyles.header}>
                <TouchableOpacity onPress={() => setView('choice')} style={ppStyles.backChip}>
                  <Ionicons name="chevron-back" size={14} color={Colors.cyan} />
                  <Text style={ppStyles.backChipTxt}>BACK</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={ppStyles.title}>SAVED PREP BOOKS</Text>
                  <Text style={ppStyles.sub}>Tap any entry to review</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={ppStyles.closeBtn}>
                  <Ionicons name="close" size={20} color={Colors.dim} />
                </TouchableOpacity>
              </View>

              <View style={ppStyles.eventList}>
                {recentEntries.map((entry, i) => {
                  const color = entry.eventType === 'game' ? TYPE_COLOR.game
                              : entry.eventType === 'practice' ? TYPE_COLOR.practice
                              : Colors.purple;
                  const label = entry.eventType === 'game' ? 'GAME'
                              : entry.eventType === 'practice' ? 'TRAIN'
                              : 'OTHER';
                  const dateStr = entry.completedAt
                    ? new Date(entry.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '';
                  const pct = entry.completedSteps?.length
                    ? Math.round((entry.completedSteps.length / (entry.eventType === 'practice' ? 5 : 6)) * 100)
                    : 0;
                  return (
                    <TouchableOpacity
                      key={entry.id}
                      style={[ppStyles.eventRow, i > 0 && ppStyles.eventRowBorder]}
                      onPress={() => goReview(entry)}
                      activeOpacity={0.75}
                    >
                      <View style={[ppStyles.dot, { backgroundColor: color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={ppStyles.eventTitle}>{entry.eventTitle}</Text>
                        <Text style={ppStyles.eventMeta}>{dateStr}{pct > 0 ? `  ·  ${pct}%` : ''}</Text>
                      </View>
                      <View style={[ppStyles.typeBadge, { backgroundColor: `${color}22`, borderColor: `${color}44` }]}>
                        <Text style={[ppStyles.typeBadgeTxt, { color }]}>{label}</Text>
                      </View>
                      <Ionicons name="eye-outline" size={16} color={Colors.dim} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ height: Spacing.xl }} />
            </ScrollView>
          )}

        </View>
      </View>
    </Modal>
  );
}

const ppStyles = StyleSheet.create({
  sheet:       { width: '100%', maxWidth: 600, backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: 32, borderTopWidth: 1, borderColor: Colors.border },
  handle:      { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title:       { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.text, letterSpacing: 0.5, marginBottom: 2 },
  sub:         { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.dim },
  closeBtn:    { padding: Spacing.xs },
  eventList:   { marginHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg, overflow: 'hidden', marginBottom: Spacing.md },
  eventRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  eventRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  eventTitle:  { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: Colors.text },
  eventMeta:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, marginTop: 1 },
  typeBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  typeBadgeTxt:{ fontFamily: Fonts.monoBold, fontSize: 10 },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTxt:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, marginHorizontal: Spacing.sm, letterSpacing: 0.3 },
  fallbackRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  fallbackBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, backgroundColor: Colors.bg },
  fallbackBtnTxt: { fontFamily: Fonts.monoBold, fontSize: 13 },
  sectionHeader:  { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xs },
  sectionLabel:   { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
  choiceGrid:     { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginTop: Spacing.xs },
  choiceCard:     { flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  choiceCardDim:  { opacity: 0.5 },
  choiceIcon:     { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  choiceLabel:    { fontFamily: Fonts.monoBold, fontSize: 12, letterSpacing: 0.5 },
  choiceSub:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, lineHeight: 17 },
  choiceArrow:    { marginTop: Spacing.sm },
  countPill:      { backgroundColor: Colors.cyan, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 1 },
  countPillTxt:   { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.bg },
  backChip:       { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: `${Colors.cyan}18`, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.cyan}33` },
  backChipTxt:    { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.cyan, letterSpacing: 0.5 },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    backgroundImage: "url('/dashboard-bg.svg')" as any,
    backgroundSize: 'cover' as any,
    backgroundPosition: 'center' as any,
    backgroundRepeat: 'no-repeat' as any,
  },
  scroll: { flex: 1 },

  // Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: Colors.bg,
  },
  headerInner: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 0,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.lg,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    minHeight: 160,
    gap: Spacing.xl,
    borderRadius: 28,
    boxShadow: '0 16px 48px rgba(21,101,192,0.45), 0 4px 16px rgba(0,0,0,0.22)' as any,
  },
  heroLeft: {},
  heroRight: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: 120,
  },
  avatarWrap: {
    position: 'relative',
    flex: 1,
    alignSelf: 'stretch',
  },
  avatarCircle: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
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
  teamCodeChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  teamCodeLabel: { fontFamily: Fonts.mono, fontSize: 7, color: HeroText.muted, letterSpacing: 1 },
  teamCodeVal:   { fontFamily: Fonts.monoBold, fontSize: 10, color: HeroText.primary, letterSpacing: 1.5 },
  sportBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sportBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: HeroText.secondary,
    letterSpacing: 1,
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
  necAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, opacity: 0.9 },
  necTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  necDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.cyan },
  necTagText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.cyan, letterSpacing: 2 },
  necTitle: { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.text, marginBottom: 6 },
  necMeta: { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim, marginBottom: 14 },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card2,
    borderWidth: 1,
    borderColor: Colors.border,
  },

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

  // Section divider
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
    fontSize: 13,
    color: Colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
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
    fontSize: 13,
    color: '#000000',
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
    fontSize: 11,
    color: '#000000',
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
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.08), inset 0 -1px 3px rgba(255,255,255,0.6)' as any,
  },
  dayCardEmpty: { opacity: 0.35 },
  dayCardToday: { borderColor: 'rgba(0,212,255,0.5)' },
  dayCardBar: { width: '100%', height: 2, marginBottom: 6 },
  dayCardWeekday: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayCardMonth: {
    fontFamily: Fonts.mono,
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dayCardOpp: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.amber,
    marginTop: 1,
    maxWidth: 60,
    textAlign: 'center',
  },
  dayCardPlus: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.dim,
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
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 26,
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 4,
  },
  sheetOpponent: { fontSize: 14, fontFamily: Fonts.rajdhani, fontWeight: '700', marginBottom: 8 },
  sheetMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  sheetMetaText: { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim },
  sheetInfoSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetInfoLabel: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
  sheetInfoVal: { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: Colors.text },
  sheetEditSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetEditRow: { gap: 4 },
  sheetEditLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  sheetEditInput: {
    backgroundColor: Colors.bgDeep,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.text,
  },
  prepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.bgDeep,
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
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: 1,
  },
  sheetBtnSecondary: {
    width: '100%',
    padding: 13,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    backgroundColor: Colors.bgDeep,
  },
  sheetBtnSecondaryText: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 14,
    color: Colors.blue,
    letterSpacing: 0.5,
  },
  sheetBtnClose: { alignItems: 'center', padding: 8 },
  sheetBtnCloseText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
  },

  exitBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 2,
  },
  exitBtnText: {
    fontSize: 24,
    color: Colors.dim,
  },

  // Badge detail full-screen overlay
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
    width: 96,
    height: 96,
    borderRadius: 48,
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
  badgeCatText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  badgeCloseBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  badgeCloseBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dim,
    letterSpacing: 1.5,
  },
});
