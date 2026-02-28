import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';
import { useCoach } from '../context/CoachContext';

// ─── Mock data ────────────────────────────────────────────────────────────────

const SEASON = { wins: 8, losses: 3, draws: 2 };

const SPORT_STATS: Record<string, { label: string; value: string; color: string }[]> = {
  baseball: [
    { label: 'RUNS SCORED',  value: '47',   color: Colors.green  },
    { label: 'RUNS AGAINST', value: '23',   color: Colors.red    },
    { label: 'STRIKEOUTS',   value: '89',   color: Colors.cyan   },
    { label: 'BATTING AVG',  value: '.312', color: Colors.amber  },
    { label: 'ERA',          value: '2.34', color: Colors.blue   },
    { label: 'STOLEN BASES', value: '18',   color: Colors.purple },
  ],
  soccer: [
    { label: 'GOALS FOR',      value: '34',  color: Colors.green  },
    { label: 'GOALS AGAINST',  value: '16',  color: Colors.red    },
    { label: 'SHOTS ON TGT',   value: '87',  color: Colors.cyan   },
    { label: 'CLEAN SHEETS',   value: '5',   color: Colors.blue   },
    { label: 'AVG POSSESSION', value: '56%', color: Colors.amber  },
    { label: 'PASS ACCURACY',  value: '78%', color: Colors.purple },
  ],
  basketball: [
    { label: 'PTS / GAME',   value: '94.2', color: Colors.green  },
    { label: 'OPP / GAME',   value: '81.7', color: Colors.red    },
    { label: 'REBOUNDS',     value: '43.1', color: Colors.cyan   },
    { label: 'ASSISTS',      value: '22.8', color: Colors.amber  },
    { label: 'STEALS',       value: '8.4',  color: Colors.blue   },
    { label: '3-PT %',       value: '38%',  color: Colors.purple },
  ],
  football: [
    { label: 'PTS SCORED',  value: '278',  color: Colors.green  },
    { label: 'PTS ALLOWED', value: '156',  color: Colors.red    },
    { label: 'YDS / GAME',  value: '342',  color: Colors.cyan   },
    { label: 'COMP %',      value: '64%',  color: Colors.amber  },
    { label: 'SACKS',       value: '18',   color: Colors.blue   },
    { label: 'TURNOVERS',   value: '7',    color: Colors.purple },
  ],
  volleyball: [
    { label: 'SETS WON',  value: '28',  color: Colors.green  },
    { label: 'SETS LOST', value: '12',  color: Colors.red    },
    { label: 'KILLS',     value: '187', color: Colors.cyan   },
    { label: 'ACES',      value: '34',  color: Colors.amber  },
    { label: 'BLOCKS',    value: '52',  color: Colors.blue   },
    { label: 'DIG %',     value: '71%', color: Colors.purple },
  ],
};

type Result = 'W' | 'L' | 'D';

const RECENT_GAMES: {
  id: string; date: string; opponent: string;
  homeScore: number; oppScore: number; result: Result;
}[] = [
  { id: '1', date: 'FEB 22', opponent: 'vs Eagles SC',      homeScore: 5, oppScore: 2, result: 'W' },
  { id: '2', date: 'FEB 15', opponent: 'vs Storm United',   homeScore: 3, oppScore: 3, result: 'D' },
  { id: '3', date: 'FEB 8',  opponent: 'vs North Eagles',   homeScore: 7, oppScore: 1, result: 'W' },
  { id: '4', date: 'FEB 1',  opponent: 'vs City FC',        homeScore: 2, oppScore: 4, result: 'L' },
  { id: '5', date: 'JAN 25', opponent: 'vs Riverside Reds', homeScore: 4, oppScore: 2, result: 'W' },
];

const PLAYER_LEADERS = [
  { name: 'Luis Garcia',  jersey: 9,  value: '12', label: 'Goals',   position: 'ST',  color: Colors.green },
  { name: 'Ryan Zhang',   jersey: 10, value: '8',  label: 'Goals',   position: 'CAM', color: Colors.green },
  { name: 'Aiden Cole',   jersey: 8,  value: '9',  label: 'Assists', position: 'CDM', color: Colors.cyan  },
  { name: 'James Porter', jersey: 1,  value: '5',  label: 'Saves',   position: 'GK',  color: Colors.blue  },
];

const RESULT_COLOR: Record<Result, string> = { W: Colors.green, L: Colors.red, D: Colors.amber };
const RESULT_LABEL: Record<Result, string> = { W: 'WIN', L: 'LOSS', D: 'DRAW' };

// ─── Screen ───────────────────────────────────────────────────────────────────

type StatTab = 'team' | 'games' | 'players';

export default function StatsScreen() {
  const { coachSport } = useCoach();
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<StatTab>('team');

  const teamStats = SPORT_STATS[coachSport] ?? SPORT_STATS.baseball;
  const total = SEASON.wins + SEASON.losses + SEASON.draws;
  const sportEmoji: Record<string, string> = {
    baseball: '⚾', soccer: '⚽', basketball: '🏀', football: '🏈', volleyball: '🏐',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

          {/* Hero */}
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroTag}>SEASON STATS  {sportEmoji[coachSport] ?? '🏅'}</Text>
                <Text style={styles.heroTitle}>Riverside Rockets</Text>
              </View>
              <TouchableOpacity
                style={styles.trackerBtn}
                onPress={() => navigation.navigate('StatTrackerSetup')}
              >
                <Ionicons name="add-circle-outline" size={14} color={HeroText.primary} />
                <Text style={styles.trackerBtnText}>TRACK GAME</Text>
              </TouchableOpacity>
            </View>

            {/* W / L / D record */}
            <View style={styles.recordRow}>
              <View style={styles.recordPill}>
                <Text style={[styles.recordNum, { color: Colors.green }]}>{SEASON.wins}</Text>
                <Text style={styles.recordLabel}>WIN</Text>
              </View>
              <Text style={styles.recordDash}>·</Text>
              <View style={styles.recordPill}>
                <Text style={[styles.recordNum, { color: Colors.red }]}>{SEASON.losses}</Text>
                <Text style={styles.recordLabel}>LOSS</Text>
              </View>
              <Text style={styles.recordDash}>·</Text>
              <View style={styles.recordPill}>
                <Text style={[styles.recordNum, { color: Colors.amber }]}>{SEASON.draws}</Text>
                <Text style={styles.recordLabel}>DRAW</Text>
              </View>
              <View style={styles.recordSep} />
              <View style={styles.recordPill}>
                <Text style={[styles.recordNum, { color: HeroText.primary }]}>{total}</Text>
                <Text style={styles.recordLabel}>GAMES</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {(['team', 'games', 'players'] as StatTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabItem, tab === t && styles.tabItemActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                  {t === 'team' ? 'TEAM STATS' : t === 'games' ? 'GAMES' : 'PLAYERS'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Team stats ─────────────────────────────────────────────────── */}
          {tab === 'team' && (
            <View style={styles.section}>
              <View style={styles.statGrid}>
                {teamStats.map(stat => (
                  <View key={stat.label} style={styles.statCard}>
                    <View style={[styles.statCardBar, { backgroundColor: stat.color }]} />
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Games ──────────────────────────────────────────────────────── */}
          {tab === 'games' && (
            <View style={styles.section}>
              {RECENT_GAMES.map(game => (
                <View key={game.id} style={styles.gameRow}>
                  {/* Result pill */}
                  <View style={[styles.resultPill, { backgroundColor: `${RESULT_COLOR[game.result]}18`, borderColor: `${RESULT_COLOR[game.result]}44` }]}>
                    <Text style={[styles.resultText, { color: RESULT_COLOR[game.result] }]}>
                      {RESULT_LABEL[game.result]}
                    </Text>
                  </View>

                  {/* Info */}
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameOpponent}>{game.opponent}</Text>
                    <Text style={styles.gameDate}>{game.date}</Text>
                  </View>

                  {/* Score */}
                  <View style={styles.scoreWrap}>
                    <Text style={[styles.scoreMain, { color: RESULT_COLOR[game.result] }]}>
                      {game.homeScore}
                    </Text>
                    <Text style={styles.scoreSep}>–</Text>
                    <Text style={styles.scoreOpp}>{game.oppScore}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Players ────────────────────────────────────────────────────── */}
          {tab === 'players' && (
            <View style={styles.section}>
              <Text style={styles.leaderboardTitle}>TOP PERFORMERS</Text>
              {PLAYER_LEADERS.map((p, i) => (
                <View key={p.name} style={styles.leaderRow}>
                  {/* Rank */}
                  <Text style={styles.rank}>#{i + 1}</Text>

                  {/* Jersey */}
                  <View style={[styles.jerseyBadge, { backgroundColor: `${p.color}18`, borderColor: `${p.color}44` }]}>
                    <Text style={[styles.jerseyNum, { color: p.color }]}>{p.jersey}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.leaderInfo}>
                    <Text style={styles.leaderName}>{p.name}</Text>
                    <Text style={styles.leaderPos}>{p.position}  ·  {p.label}</Text>
                  </View>

                  {/* Stat */}
                  <View style={styles.leaderStat}>
                    <Text style={[styles.leaderValue, { color: p.color }]}>{p.value}</Text>
                    <Text style={styles.leaderStatLabel}>{p.label.toUpperCase()}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.leaderNote}>
                <Ionicons name="information-circle-outline" size={13} color={Colors.muted} />
                <Text style={styles.leaderNoteText}>
                  Stats pulled from tracked games via Stat Tracker
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    backgroundImage: 'radial-gradient(rgba(37,99,235,0.13) 1.5px, transparent 1.5px)' as any,
    backgroundSize: '22px 22px' as any,
  },

  // Hero
  hero: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderRadius: 24,
    gap: Spacing.lg,
    boxShadow: '0 12px 40px rgba(21,101,192,0.4), 0 4px 14px rgba(0,0,0,0.2)' as any,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: HeroText.secondary,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 26,
    color: HeroText.primary,
    lineHeight: 30,
  },
  trackerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  trackerBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: HeroText.primary,
    letterSpacing: 1,
  },

  // Record row
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  recordPill: { alignItems: 'center' },
  recordNum: {
    fontFamily: Fonts.orbitron,
    fontSize: 24,
    lineHeight: 28,
  },
  recordLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: HeroText.muted,
    letterSpacing: 1.5,
    marginTop: 1,
  },
  recordDash: {
    fontFamily: Fonts.mono,
    fontSize: 18,
    color: HeroText.muted,
  },
  recordSep: {
    flex: 1,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.06)' as any,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabItemActive: {
    backgroundColor: Colors.blue,
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 1,
  },
  tabLabelActive: {
    color: '#fff',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Stat grid (team tab)
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '31%' as any,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    overflow: 'hidden',
    gap: 2,
    boxShadow: 'inset 0 2px 8px rgba(0,50,150,0.08), inset 0 -1px 4px rgba(255,255,255,0.7)' as any,
  },
  statCardBar: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0,
    height: 3,
  },
  statValue: {
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.dim,
    letterSpacing: 0.5,
  },

  // Game rows
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.06), inset 0 -1px 3px rgba(255,255,255,0.7)' as any,
  },
  resultPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 42,
    alignItems: 'center',
  },
  resultText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
  },
  gameInfo: { flex: 1 },
  gameOpponent: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 15,
    color: Colors.text,
  },
  gameDate: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  scoreMain: {
    fontFamily: Fonts.orbitron,
    fontSize: 20,
    lineHeight: 24,
  },
  scoreSep: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.muted,
  },
  scoreOpp: {
    fontFamily: Fonts.orbitron,
    fontSize: 16,
    color: Colors.muted,
    lineHeight: 20,
  },

  // Player leaderboard
  leaderboardTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.06), inset 0 -1px 3px rgba(255,255,255,0.7)' as any,
  },
  rank: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    width: 22,
  },
  jerseyBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: {
    fontFamily: Fonts.orbitron,
    fontSize: 14,
    lineHeight: 18,
  },
  leaderInfo: { flex: 1 },
  leaderName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 16,
    color: Colors.text,
  },
  leaderPos: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  leaderStat: { alignItems: 'flex-end' },
  leaderValue: {
    fontFamily: Fonts.orbitron,
    fontSize: 20,
    lineHeight: 24,
  },
  leaderStatLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  leaderNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
  },
  leaderNoteText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
});
