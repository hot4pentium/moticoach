import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../theme';

type EventType = 'game' | 'practice' | 'film';

interface CalEvent {
  id: string;
  type: EventType;
  title: string;
  opponent?: string;
  day: number;
  weekday: string;
  month: string;
  time: string;
  location: string;
  prepPct: number;
  isToday?: boolean;
}

const MOCK_EVENTS: CalEvent[] = [
  { id: '1', type: 'game', title: 'GAME DAY', opponent: 'vs. North Eagles', day: 22, weekday: 'SAT', month: 'FEB', time: '10:00 AM', location: 'Riverside Park', prepPct: 72, isToday: false },
  { id: '2', type: 'practice', title: 'PRACTICE', day: 24, weekday: 'MON', month: 'FEB', time: '4:30 PM', location: 'Field B', prepPct: 0 },
  { id: '3', type: 'film', title: 'FILM SESSION', day: 25, weekday: 'TUE', month: 'FEB', time: '6:00 PM', location: 'Rec Center', prepPct: 0 },
  { id: '4', type: 'practice', title: 'PRACTICE', day: 26, weekday: 'WED', month: 'FEB', time: '4:30 PM', location: 'Field B', prepPct: 0 },
  { id: '5', type: 'game', title: 'GAME DAY', opponent: 'vs. Westside FC', day: 1, weekday: 'SAT', month: 'MAR', time: '11:00 AM', location: 'Central Stadium', prepPct: 0 },
];

const TYPE_COLOR: Record<EventType, string> = {
  game: Colors.amber,
  practice: Colors.green,
  film: Colors.purple,
};

export default function CalendarScreen() {
  const [activeTab, setActiveTab] = useState<'list' | 'week'>('list');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.month}>FEBRUARY</Text>
          <Text style={styles.sub}>2026  ·  5 events this month</Text>
        </View>
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ ADD</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['list', 'week'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tab}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Feb group */}
        <View style={styles.monthGroup}>
          <View style={styles.monthLabel}>
            <Text style={styles.monthLabelText}>FEBRUARY</Text>
          </View>
          {MOCK_EVENTS.filter(e => e.month === 'FEB').map(event => (
            <EventRow key={event.id} event={event} />
          ))}
        </View>

        {/* Mar group */}
        <View style={styles.monthGroup}>
          <View style={styles.monthLabel}>
            <Text style={styles.monthLabelText}>MARCH</Text>
          </View>
          {MOCK_EVENTS.filter(e => e.month === 'MAR').map(event => (
            <EventRow key={event.id} event={event} />
          ))}
        </View>

        {/* Add event button */}
        <TouchableOpacity style={styles.addEventBtn}>
          <Text style={styles.addEventText}>+ SCHEDULE EVENT</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function EventRow({ event }: { event: CalEvent }) {
  const color = TYPE_COLOR[event.type];
  const prepColor =
    event.prepPct >= 80 ? Colors.green
    : event.prepPct >= 40 ? Colors.amber
    : event.prepPct > 0 ? Colors.red
    : Colors.muted;

  return (
    <TouchableOpacity
      style={[
        styles.eventRow,
        event.isToday && { borderColor: 'rgba(0,212,255,0.4)' },
      ]}
      activeOpacity={0.8}
    >
      <View style={[styles.eventLeftBar, { backgroundColor: color }]} />
      {event.isToday && <Text style={styles.todayBadge}>TODAY</Text>}
      <View style={styles.erInner}>
        <View style={styles.erDate}>
          <Text style={styles.erDay}>{event.day}</Text>
          <Text style={styles.erWeekday}>{event.weekday}</Text>
        </View>
        <View style={styles.erDivider} />
        <View style={styles.erBody}>
          <View style={[styles.erBadge, { backgroundColor: `${color}18`, borderColor: `${color}33` }]}>
            <Text style={[styles.erBadgeText, { color }]}>{event.type.toUpperCase()}</Text>
          </View>
          <Text style={styles.erTitle}>{event.title}</Text>
          {event.opponent && (
            <Text style={[styles.erMeta, { color: Colors.amber }]}>{event.opponent}</Text>
          )}
          <Text style={styles.erMeta}>{event.time}  ·  {event.location}</Text>
        </View>
        {event.type !== 'practice' || event.prepPct > 0 ? (
          <View style={[styles.prepRing, { borderColor: `${prepColor}44` }]}>
            <Text style={[styles.prepNum, { color: prepColor }]}>
              {event.prepPct > 0 ? `${event.prepPct}` : '--'}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  month: {
    fontFamily: Fonts.orbitron,
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  sub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.dim,
    marginTop: 2,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  addBtnText: {
    fontFamily: Fonts.orbitron,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cyan,
    letterSpacing: 1,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabText: {
    fontFamily: Fonts.orbitron,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.muted,
  },
  tabTextActive: { color: Colors.cyan },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: Colors.cyan,
    borderRadius: 1,
  },

  // Month group
  monthGroup: { paddingHorizontal: Spacing.lg, paddingTop: 14 },
  monthLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthLabelText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // Event row
  eventRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  eventLeftBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  todayBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.cyan,
    letterSpacing: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)',
  },
  erInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingLeft: 18,
    gap: 12,
  },
  erDate: { width: 36, alignItems: 'center' },
  erDay: {
    fontFamily: Fonts.orbitron,
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
    lineHeight: 22,
  },
  erWeekday: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  erDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  erBody: { flex: 1 },
  erBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 3,
  },
  erBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  erTitle: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  erMeta: {
    fontFamily: Fonts.rajdhani,
    fontSize: 11,
    color: Colors.dim,
  },
  prepRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prepNum: {
    fontFamily: Fonts.orbitron,
    fontSize: 10,
    fontWeight: '700',
  },

  // Add event
  addEventBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: 10,
    padding: Spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border2,
    borderRadius: Radius.lg,
    alignItems: 'center',
    backgroundColor: 'rgba(61,143,255,0.03)',
  },
  addEventText: {
    fontFamily: Fonts.orbitron,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.blue,
    letterSpacing: 1.5,
  },
});
