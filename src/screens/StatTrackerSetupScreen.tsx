import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { useCoach } from '../context/CoachContext';
import { Sport } from './PlayEditorScreen';

// ─── Shared types (imported by Live + Summary screens) ───────────────────────

export interface StatDef {
  key: string;
  label: string;
  sub: string;
  scoreValue?: number;
}

export interface PlayerStatLine {
  playerId: string;
  name: string;
  jersey: number;
  position?: string;
  battingOrder?: number;
  stats: Record<string, number>;
}

export type PeriodType = 'halves' | 'quarters' | 'innings' | 'sets';

export interface StatTrackerConfig {
  opponentName: string;
  teamName: string;
  sport: Sport;
  periodType: PeriodType;
  periodShort: string;
  periodLabel: string;
  totalPeriods: number;
  trackingMode: 'team' | 'individual';
  isHomeTeam: boolean;
}

// ─── Sport config ─────────────────────────────────────────────────────────────

export const PERIOD_CONFIG: Record<Sport, {
  label: string; short: string; default: number; options: number[]; periodType: PeriodType;
}> = {
  soccer:     { label: 'Half',    short: 'H',   default: 2, options: [2],    periodType: 'halves'   },
  basketball: { label: 'Quarter', short: 'Q',   default: 4, options: [2, 4], periodType: 'quarters' },
  football:   { label: 'Quarter', short: 'Q',   default: 4, options: [2, 4], periodType: 'quarters' },
  baseball:   { label: 'Inning',  short: '',    default: 9, options: [7, 9], periodType: 'innings'  },
  volleyball: { label: 'Set',     short: 'SET', default: 3, options: [3, 5], periodType: 'sets'     },
};

// ─── Baseball stat lists ───────────────────────────────────────────────────────

export const BASEBALL_BATTING_STATS: StatDef[] = [
  { key: 'run',    label: 'R',    sub: 'Run Scored',   scoreValue: 1 },
  { key: 'hit',    label: 'H',    sub: 'Base Hit'                    },
  { key: 'double', label: '2B',   sub: 'Double'                      },
  { key: 'triple', label: '3B',   sub: 'Triple'                      },
  { key: 'hr',     label: 'HR',   sub: 'Home Run'                    },
  { key: 'rbi',    label: 'RBI',  sub: 'Batted In'                   },
  { key: 'bb',     label: 'BB',   sub: 'Walk'                        },
  { key: 'kbat',   label: 'K',    sub: 'Strikeout'                   },
  { key: 'sac',    label: 'SAC',  sub: 'Sacrifice'                   },
  { key: 'sb',     label: 'SB',   sub: 'Stolen Base'                 },
];

export const BASEBALL_PITCHING_STATS: StatDef[] = [
  { key: 'pc',     label: 'PC',   sub: 'Pitch Count'                 },
  { key: 'kpitch', label: 'K',    sub: 'Strikeout (P)'               },
  { key: 'bbpit',  label: 'BB',   sub: 'Walk (P)'                    },
  { key: 'hitopp', label: 'H',    sub: 'Hit Allowed'                 },
  { key: 'ropp',   label: 'R',    sub: 'Run Allowed'                 },
  { key: 'wp',     label: 'WP',   sub: 'Wild Pitch'                  },
  { key: 'hbp',    label: 'HBP',  sub: 'Hit By Pitch'                },
  { key: 'err',    label: 'ERR',  sub: 'Error'                       },
  { key: 'dp',     label: 'DP',   sub: 'Double Play'                 },
];

export const SPORT_STATS: Record<Sport, StatDef[]> = {
  soccer: [
    { key: 'goal',   label: 'GOAL',  sub: '+1 pt',      scoreValue: 1 },
    { key: 'assist', label: 'AST',   sub: 'Assist'                    },
    { key: 'shot',   label: 'SHOT',  sub: 'On Target'                 },
    { key: 'save',   label: 'SAVE',  sub: 'Goalkeeper'                },
    { key: 'foul',   label: 'FOUL',  sub: 'Committed'                 },
    { key: 'yellow', label: 'YEL',   sub: 'Yellow Card'               },
    { key: 'red',    label: 'RED',   sub: 'Red Card'                  },
    { key: 'corner', label: 'CRN',   sub: 'Corner Kick'               },
  ],
  basketball: [
    { key: 'pts2', label: 'PTS',  sub: '+2 pts', scoreValue: 2 },
    { key: 'pts3', label: '3PT',  sub: '+3 pts', scoreValue: 3 },
    { key: 'ft',   label: 'FT',   sub: '+1 pt',  scoreValue: 1 },
    { key: 'reb',  label: 'REB',  sub: 'Rebound'               },
    { key: 'ast',  label: 'AST',  sub: 'Assist'                },
    { key: 'stl',  label: 'STL',  sub: 'Steal'                 },
    { key: 'blk',  label: 'BLK',  sub: 'Block'                 },
    { key: 'to',   label: 'TO',   sub: 'Turnover'              },
  ],
  football: [
    { key: 'td',     label: 'TD',   sub: '+6 pts', scoreValue: 6 },
    { key: 'fg',     label: 'FG',   sub: '+3 pts', scoreValue: 3 },
    { key: 'pat',    label: 'PAT',  sub: '+1 pt',  scoreValue: 1 },
    { key: 'twopt',  label: '2PT',  sub: '+2 pts', scoreValue: 2 },
    { key: 'safety', label: 'SAFE', sub: '+2 pts', scoreValue: 2 },
    { key: 'int',    label: 'INT',  sub: 'Intercept'             },
    { key: 'sack',   label: 'SACK', sub: 'Sack'                  },
    { key: 'fumble', label: 'FUM',  sub: 'Fumble'                },
  ],
  baseball:   BASEBALL_BATTING_STATS,
  volleyball: [
    { key: 'kill',  label: 'KILL', sub: '+1 pt',     scoreValue: 1 },
    { key: 'ace',   label: 'ACE',  sub: '+1 pt',     scoreValue: 1 },
    { key: 'block', label: 'BLK',  sub: '+1 pt',     scoreValue: 1 },
    { key: 'dig',   label: 'DIG',  sub: 'Dig'                      },
    { key: 'ast',   label: 'SET',  sub: 'Set Assist'               },
    { key: 'err',   label: 'ERR',  sub: 'Error'                    },
  ],
};

// ─── Mock upcoming games ──────────────────────────────────────────────────────

const today = new Date();
const d = (n: number) => { const x = new Date(today); x.setDate(today.getDate() + n); return x; };
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const fmt = (date: Date) => `${MONTHS[date.getMonth()]} ${date.getDate()}`;

interface GameOption { id: string; opponent: string; date: Date; time: string; isToday: boolean; }

const GAME_OPTIONS: GameOption[] = [
  { id: '1', opponent: 'Eagles SC',    date: d(0),  time: '6:30 PM',  isToday: true  },
  { id: '2', opponent: 'Storm United', date: d(7),  time: '10:00 AM', isToday: false },
  { id: '3', opponent: 'North Eagles', date: d(14), time: '11:00 AM', isToday: false },
];

// ─── Setup Screen ─────────────────────────────────────────────────────────────

export default function StatTrackerSetupScreen() {
  const navigation = useNavigation<any>();
  const { coachSport } = useCoach();

  const pc = PERIOD_CONFIG[coachSport];
  const [selectedGame,    setSelectedGame]    = useState<GameOption>(GAME_OPTIONS[0]);
  const [totalPeriods,    setTotalPeriods]    = useState(pc.default);
  const [trackingMode,    setTrackingMode]    = useState<'team' | 'individual'>('individual');
  const [soccerStructure, setSoccerStructure] = useState<'halves' | 'quarters'>('halves');
  const [isHomeTeam,      setIsHomeTeam]      = useState(true);

  const handleSoccerStructure = (s: 'halves' | 'quarters') => {
    setSoccerStructure(s);
    setTotalPeriods(s === 'halves' ? 2 : 4);
  };

  const handleStart = () => {
    let periodType: PeriodType = pc.periodType;
    let periodShort             = pc.short;
    let periodLabel             = pc.label;

    if (coachSport === 'soccer' && soccerStructure === 'quarters') {
      periodType  = 'quarters';
      periodShort = 'Q';
      periodLabel = 'Quarter';
    }

    const config: StatTrackerConfig = {
      opponentName: selectedGame.opponent,
      teamName: 'Riverside Rockets',
      sport: coachSport,
      periodType,
      periodShort,
      periodLabel,
      totalPeriods,
      trackingMode,
      isHomeTeam,
    };
    navigation.navigate('StatTrackerLive', { config });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>NEW GAME</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Select Game ── */}
        <SectionLabel label="SELECT GAME" />
        {GAME_OPTIONS.map(g => (
          <TouchableOpacity
            key={g.id}
            style={[styles.gameCard, selectedGame.id === g.id && styles.gameCardActive]}
            onPress={() => setSelectedGame(g)}
            activeOpacity={0.7}
          >
            <View style={styles.gameCardLeft}>
              {g.isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>TODAY</Text>
                </View>
              )}
              <Text style={styles.gameOpponent}>vs {g.opponent}</Text>
              <Text style={styles.gameMeta}>{fmt(g.date)}  ·  {g.time}</Text>
            </View>
            <View style={[styles.gameRadio, selectedGame.id === g.id && styles.gameRadioActive]} />
          </TouchableOpacity>
        ))}

        {/* ── Soccer: Structure ── */}
        {coachSport === 'soccer' && (
          <>
            <SectionLabel label="STRUCTURE" />
            <View style={styles.pillRow}>
              {(['halves', 'quarters'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, soccerStructure === s && styles.pillActive]}
                  onPress={() => handleSoccerStructure(s)}
                >
                  <Text style={[styles.pillText, soccerStructure === s && styles.pillTextActive]}>
                    {s === 'halves' ? '2 Halves' : '4 Quarters'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Non-soccer, non-baseball: Period count ── */}
        {coachSport !== 'soccer' && coachSport !== 'baseball' && (
          <>
            <SectionLabel label={`${pc.label.toUpperCase()}S`} hint={`Default for ${coachSport}`} />
            <View style={styles.pillRow}>
              {pc.options.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.pill, totalPeriods === n && styles.pillActive]}
                  onPress={() => setTotalPeriods(n)}
                >
                  <Text style={[styles.pillText, totalPeriods === n && styles.pillTextActive]}>
                    {n} {n === 1 ? pc.label : pc.label + 's'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Baseball: Home / Away ── */}
        {coachSport === 'baseball' && (
          <>
            <SectionLabel label="FIELD POSITION" hint="Determines batting order" />
            <View style={styles.pillRow}>
              {([true, false] as const).map(home => (
                <TouchableOpacity
                  key={String(home)}
                  style={[styles.pill, styles.pillWide, isHomeTeam === home && styles.pillActive]}
                  onPress={() => setIsHomeTeam(home)}
                >
                  <Text style={[styles.pillText, isHomeTeam === home && styles.pillTextActive]}>
                    {home ? '🏠 HOME  (bat last)' : '✈️ AWAY  (bat first)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Tracking Mode ── */}
        <SectionLabel label="TRACKING MODE" />
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeCard, trackingMode === 'individual' && styles.modeCardActive]}
            onPress={() => setTrackingMode('individual')}
          >
            <Ionicons name="person-outline" size={26}
              color={trackingMode === 'individual' ? Colors.cyan : Colors.muted} />
            <Text style={[styles.modeLabel, trackingMode === 'individual' && { color: Colors.cyan }]}>
              INDIVIDUAL
            </Text>
            <Text style={styles.modeSub}>Stats attributed{'\n'}to each player</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeCard, trackingMode === 'team' && styles.modeCardActive]}
            onPress={() => setTrackingMode('team')}
          >
            <Ionicons name="people-outline" size={26}
              color={trackingMode === 'team' ? Colors.cyan : Colors.muted} />
            <Text style={[styles.modeLabel, trackingMode === 'team' && { color: Colors.cyan }]}>
              TEAM
            </Text>
            <Text style={styles.modeSub}>Track totals{'\n'}without players</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
          <Text style={styles.startBtnText}>START TRACKING →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hint && <Text style={styles.sectionHint}>{hint}</Text>}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border2,
    backgroundColor: 'rgba(5,10,22,0.98)', gap: 12,
  },
  backBtn:  { paddingVertical: 6, paddingRight: 4 },
  backText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 1 },
  title:    { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, letterSpacing: 2 },

  scroll: { padding: Spacing.lg, paddingBottom: 0 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  sectionLabel:    { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 2, textTransform: 'uppercase' },
  sectionHint:     { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.5 },

  // Game cards
  gameCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card, marginBottom: 8,
  },
  gameCardActive: { borderColor: Colors.cyan, backgroundColor: 'rgba(0,212,255,0.06)' },
  gameCardLeft:   { flex: 1 },
  todayBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: Radius.full, backgroundColor: 'rgba(0,212,255,0.15)', marginBottom: 4,
  },
  todayBadgeText: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.cyan, letterSpacing: 1 },
  gameOpponent:   { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.text, letterSpacing: 0.5 },
  gameMeta:       { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, marginTop: 3, letterSpacing: 0.5 },
  gameRadio:      { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.muted },
  gameRadioActive: { borderColor: Colors.cyan, backgroundColor: Colors.cyan },

  // Pills
  pillRow:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill:          { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  pillWide:      { flex: 1 },
  pillActive:    { borderColor: Colors.cyan, backgroundColor: 'rgba(0,212,255,0.1)' },
  pillText:      { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted, letterSpacing: 1 },
  pillTextActive: { color: Colors.cyan },

  // Mode cards
  modeRow: { flexDirection: 'row', gap: Spacing.md },
  modeCard: {
    flex: 1, alignItems: 'center', paddingVertical: 20, paddingHorizontal: 12,
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card, gap: 8,
  },
  modeCardActive: { borderColor: Colors.cyan, backgroundColor: 'rgba(0,212,255,0.07)' },
  modeLabel:      { fontFamily: Fonts.orbitron, fontSize: 12, color: Colors.muted, letterSpacing: 1 },
  modeSub:        { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, textAlign: 'center', letterSpacing: 0.5, lineHeight: 13 },

  // Footer
  footer:       { padding: Spacing.lg, paddingBottom: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border },
  startBtn:     { backgroundColor: Colors.cyan, borderRadius: Radius.lg, padding: 16, alignItems: 'center' },
  startBtnText: { fontFamily: Fonts.orbitron, fontSize: 13, color: '#000', letterSpacing: 2 },
});
