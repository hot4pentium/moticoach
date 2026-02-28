import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { StatTrackerConfig, PlayerStatLine, SPORT_STATS, BASEBALL_BATTING_STATS, BASEBALL_PITCHING_STATS } from './StatTrackerSetupScreen';
import { useCoach } from '../context/CoachContext';

export default function StatTrackerSummaryScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { recordGame } = useCoach();

  const {
    config,
    homeScore,
    oppScore,
    teamStats,
    playerStats,
    isOT,
  }: {
    config: StatTrackerConfig;
    homeScore: number;
    oppScore: number;
    teamStats: Record<string, number>;
    playerStats: PlayerStatLine[];
    isOT: boolean;
  } = route.params;

  // Baseball: show both batting and pitching stat categories in the summary
  const allStats = config.sport === 'baseball'
    ? [...BASEBALL_BATTING_STATS, ...BASEBALL_PITCHING_STATS]
    : SPORT_STATS[config.sport];
  const trackedStats = allStats.filter(s => (teamStats[s.key] ?? 0) > 0);
  const homeWin   = homeScore > oppScore;
  const tied      = homeScore === oppScore;
  const resultLabel = tied ? 'DRAW' : homeWin ? 'WIN' : 'LOSS';
  const resultColor = tied ? Colors.amber : homeWin ? Colors.green : Colors.red;

  // Sort players by total stat count (most active first)
  const sortedPlayers = [...playerStats]
    .filter(p => Object.values(p.stats).some(v => v > 0))
    .sort((a, b) => {
      const aTotal = Object.values(a.stats).reduce((s, v) => s + v, 0);
      const bTotal = Object.values(b.stats).reduce((s, v) => s + v, 0);
      return bTotal - aTotal;
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.resultBadge, { borderColor: `${resultColor}55`, backgroundColor: `${resultColor}14` }]}>
          <Text style={[styles.resultText, { color: resultColor }]}>{resultLabel}</Text>
        </View>
        <Text style={styles.title}>FINAL</Text>
        {isOT && <Text style={styles.otTag}>OT</Text>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

        {/* Final Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamName}>
              {config.teamName.split(' ').slice(-1)[0].toUpperCase()}
            </Text>
            <Text style={[styles.scoreFinal, { color: homeWin ? Colors.green : Colors.text }]}>
              {homeScore}
            </Text>
          </View>
          <Text style={styles.vsText}>VS</Text>
          <View style={[styles.scoreTeam, styles.scoreTeamRight]}>
            <Text style={styles.scoreTeamName}>
              {config.opponentName.split(' ').slice(-1)[0].toUpperCase()}
            </Text>
            <Text style={[styles.scoreFinal, { color: !homeWin && !tied ? Colors.green : Colors.text }]}>
              {oppScore}
            </Text>
          </View>
        </View>

        {/* Game info */}
        <View style={styles.gameMeta}>
          <Text style={styles.gameMetaText}>
            {config.sport === 'baseball'
              ? `${config.totalPeriods} INNINGS  ·  ${config.isHomeTeam ? 'HOME' : 'AWAY'}`
              : `${config.totalPeriods} ${config.periodLabel.toUpperCase()}${config.totalPeriods !== 1 ? 'S' : ''}${isOT ? ' + OT' : ''}`}
            {'  ·  '}{config.sport.toUpperCase()}
            {'  ·  '}{config.trackingMode === 'individual' ? 'INDIVIDUAL' : 'TEAM'} TRACKING
          </Text>
        </View>

        {/* Team Stats */}
        {trackedStats.length > 0 && (
          <>
            <SectionLabel label="TEAM STATS" />
            <View style={styles.teamStatsGrid}>
              {trackedStats.map(stat => (
                <View key={stat.key} style={styles.teamStatCell}>
                  <Text style={styles.teamStatVal}>{teamStats[stat.key] ?? 0}</Text>
                  <Text style={styles.teamStatKey}>{stat.label}</Text>
                  <Text style={styles.teamStatSub}>{stat.sub}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Individual Stats */}
        {config.trackingMode === 'individual' && sortedPlayers.length > 0 && (
          <>
            <SectionLabel label="PLAYER STATS" />
            {/* Stat header row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadCell, { flex: 2 }]}>PLAYER</Text>
              {trackedStats.map(s => (
                <Text key={s.key} style={styles.tableHeadCell}>{s.label}</Text>
              ))}
            </View>
            {sortedPlayers.map(player => (
              <View key={player.playerId} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <View style={styles.miniJersey}>
                    <Text style={styles.miniJerseyNum}>{player.jersey}</Text>
                  </View>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {player.name.split(' ').slice(-1)[0]}
                  </Text>
                </View>
                {trackedStats.map(s => (
                  <View key={s.key} style={styles.tableCell}>
                    <Text style={[
                      styles.tableCellText,
                      (player.stats[s.key] ?? 0) > 0 && { color: Colors.cyan },
                    ]}>
                      {player.stats[s.key] ?? 0}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => {
            recordGame(config.sport);
            navigation.navigate('Tabs');
          }}
        >
          <Text style={styles.saveBtnText}>SAVE &amp; EXIT</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={styles.exitBtnText}>EXIT WITHOUT SAVING</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  resultBadge: {
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },
  resultText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5 },
  title:      { fontFamily: Fonts.orbitron, fontSize: 18, color: Colors.text, letterSpacing: 3 },
  otTag:      { fontFamily: Fonts.mono, fontSize: 9, color: Colors.amber, letterSpacing: 1.5 },

  scroll: { padding: Spacing.lg },

  // Score card
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: Radius.lg,
    marginBottom: 10,
  },
  scoreTeam:      { alignItems: 'center', gap: 4, flex: 1 },
  scoreTeamRight: { alignItems: 'center' },
  scoreTeamName:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 1.5 },
  scoreFinal:     { fontFamily: Fonts.orbitron, fontSize: 52, lineHeight: 58 },
  vsText:         { fontFamily: Fonts.mono, fontSize: 12, color: Colors.muted, letterSpacing: 2 },

  gameMeta: { alignItems: 'center', marginBottom: 6 },
  gameMetaText: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.5 },

  sectionLabel: {
    fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim,
    letterSpacing: 2, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 10,
  },

  // Team stats grid
  teamStatsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  teamStatCell: {
    width: '22%',
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  teamStatVal: { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.cyan },
  teamStatKey: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.text, letterSpacing: 1 },
  teamStatSub: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, letterSpacing: 0.3 },

  // Player table
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
  },
  tableHeadCell: {
    flex: 1, fontFamily: Fonts.mono, fontSize: 7,
    color: Colors.muted, letterSpacing: 1, textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  tableCell:     { flex: 1, alignItems: 'center' },
  tableCellText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.dim },

  miniJersey: {
    width: 24, height: 24, borderRadius: 4,
    borderWidth: 1, borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
  },
  miniJerseyNum: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan },
  playerName:    { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.text, fontWeight: '600' },

  // Footer
  footer: {
    padding: Spacing.lg, paddingBottom: Spacing.xl,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: Colors.cyan,
    borderRadius: Radius.lg, padding: 15,
    alignItems: 'center',
  },
  saveBtnText: { fontFamily: Fonts.orbitron, fontSize: 12, color: '#000', letterSpacing: 2 },
  exitBtn:     { alignItems: 'center', padding: 8 },
  exitBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
});
