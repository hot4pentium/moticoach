import React, { useState, useCallback, useRef } from 'react';
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
import { auth } from '../lib/firebase';
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
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const today = new Date();
const d = (offsetDays: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);
  return date;
};

const MOCK_EVENTS: TeamEvent[] = [
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

function getEventForDay(date: Date): TeamEvent | undefined {
  return MOCK_EVENTS.find(e => isSameDay(e.date, date));
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
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { width: sw, height: sh } = useWindowDimensions();
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
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
            onEventPress={openEvent}
          />

          {/* Full calendar link */}
          <TouchableOpacity
            style={styles.expandRow}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={[styles.expandText, { color: ds(Colors.cyan) }]}>
              SEE FULL CALENDAR →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section divider */}
        <View style={styles.sectionDivider} />

        {/* Tools Grid */}
        <ToolsGrid />

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
  { label: 'Playmaker',    sub: 'Build plays & formations',   icon: 'easel-outline'     as IoniconsName, color: Colors.cyan,   screen: 'Playmaker',        locked: false },
  { label: 'Roster',       sub: 'Manage your players',        icon: 'people-outline'    as IoniconsName, color: Colors.blue,   screen: 'Roster',           locked: false },
  { label: 'Stat Tracker', sub: 'Record & review team stats', icon: 'bar-chart-outline' as IoniconsName, color: Colors.green,  screen: 'StatTrackerSetup', locked: false },
  { label: 'Prep Book',    sub: 'Game-day preparation steps', icon: 'book-outline'      as IoniconsName, color: Colors.amber,  screen: 'PrepBook',         locked: false },
  { label: 'Highlights',   sub: 'Review & share key moments', icon: 'film-outline'      as IoniconsName, color: Colors.purple, screen: 'Highlights',       locked: false },
];

function ToolsGrid() {
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
            onPress={() => !tool.locked && tool.screen && navigation.navigate(tool.screen)}
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
    fontSize: 9,
    color: Colors.dim,
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
}: {
  event: TeamEvent | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { greyScale } = useCoach();
  const ds = (color: string) => desaturate(color, greyScale);
  if (!event) return null;
  const rawColor = TYPE_COLOR[event.type];
  const color = ds(rawColor);

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

        </View>

        {/* Buttons */}
        <View style={styles.sheetBtns}>
          <TouchableOpacity onPress={onClose} style={styles.sheetBtnClose}>
            <Text style={styles.sheetBtnCloseText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
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
    // Web: subtle dot-grid texture
    backgroundImage: 'radial-gradient(rgba(37,99,235,0.13) 1.5px, transparent 1.5px)' as any,
    backgroundSize: '22px 22px' as any,
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
    paddingHorizontal: Spacing.md,
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
    paddingTop: Spacing.xl,
    paddingBottom: 60,
    minHeight: 220,
    gap: Spacing.xl,
    borderRadius: 28,
    borderBottomLeftRadius: 72,
    borderBottomRightRadius: 72,
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
    width: 100,
    height: 100,
  },
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
  avatarImage: {
    width: 100,
    height: 100,
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
    fontSize: 9,
    color: Colors.dim,
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
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.08), inset 0 -1px 3px rgba(255,255,255,0.6)' as any,
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
    fontSize: 15,
    color: Colors.muted,
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
