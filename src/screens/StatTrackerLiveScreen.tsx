import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import {
  StatTrackerConfig, StatDef, PlayerStatLine,
  SPORT_STATS,
} from './StatTrackerSetupScreen';

// ─── Mock players ─────────────────────────────────────────────────────────────

const MOCK_STARTERS: PlayerStatLine[] = [
  { playerId: 'a1',  name: 'Aiden Cole',    jersey: 8,  position: 'CDM', stats: {} },
  { playerId: 'a2',  name: 'Carlos Mendez', jersey: 2,  position: 'RB',  stats: {} },
  { playerId: 'a3',  name: 'Devon Wallace', jersey: 3,  position: 'LB',  stats: {} },
  { playerId: 'a4',  name: 'James Porter',  jersey: 1,  position: 'GK',  stats: {} },
  { playerId: 'a5',  name: 'Jordan Ellis',  jersey: 14, position: 'CM',  stats: {} },
  { playerId: 'a6',  name: 'Kai Thompson',  jersey: 11, position: 'RW',  stats: {} },
  { playerId: 'a7',  name: 'Luis Garcia',   jersey: 9,  position: 'ST',  stats: {} },
  { playerId: 'a8',  name: 'Marcus Hill',   jersey: 5,  position: 'CB',  stats: {} },
  { playerId: 'a9',  name: 'Noah Banks',    jersey: 7,  position: 'LW',  stats: {} },
  { playerId: 'a10', name: 'Ryan Zhang',    jersey: 10, position: 'CAM', stats: {} },
  { playerId: 'a11', name: 'Tyler Brooks',  jersey: 6,  position: 'CB',  stats: {} },
];

const MOCK_BENCH: PlayerStatLine[] = [
  { playerId: 'b1', name: 'Ethan Ross',  jersey: 20, position: 'GK', stats: {} },
  { playerId: 'b2', name: 'Finn Marsh',  jersey: 22, position: 'DF', stats: {} },
  { playerId: 'b3', name: 'Owen Price',  jersey: 16, position: 'FW', stats: {} },
  { playerId: 'b4', name: 'Sam Torres',  jersey: 15, position: 'MF', stats: {} },
];

// ─── Live Screen ──────────────────────────────────────────────────────────────

export default function StatTrackerLiveScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const config: StatTrackerConfig = route.params.config;

  const stats = SPORT_STATS[config.sport];

  const [homeScore,     setHomeScore]     = useState(0);
  const [oppScore,      setOppScore]      = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [isOT,          setIsOT]          = useState(false);
  const [teamStats,     setTeamStats]     = useState<Record<string, number>>({});
  const [inGame,        setInGame]        = useState<PlayerStatLine[]>(
    MOCK_STARTERS.map(p => ({ ...p, stats: {} }))
  );
  const [bench,         setBench]         = useState<PlayerStatLine[]>(
    MOCK_BENCH.map(p => ({ ...p, stats: {} }))
  );
  const [selectedStat,    setSelectedStat]    = useState<StatDef | null>(null);
  const [recentlyTracked, setRecentlyTracked] = useState<string | null>(null);
  const trackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const periodLabel = isOT
    ? 'OT'
    : `${config.periodShort}${currentPeriod} OF ${config.totalPeriods}`;

  // ── Player movement ────────────────────────────────────────────────────────

  const moveToGame = (player: PlayerStatLine) => {
    setBench(prev => prev.filter(p => p.playerId !== player.playerId));
    setInGame(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const moveToBench = (player: PlayerStatLine) => {
    setInGame(prev => prev.filter(p => p.playerId !== player.playerId));
    setBench(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)));
  };

  // ── Stat tracking ──────────────────────────────────────────────────────────

  const handleStatTap = (stat: StatDef) => {
    if (config.trackingMode === 'team') {
      applyStatToTeam(stat, null);
      return;
    }
    setSelectedStat(prev => prev?.key === stat.key ? null : stat);
  };

  const handlePlayerSelect = (player: PlayerStatLine) => {
    if (!selectedStat) return;
    applyStatToTeam(selectedStat, player);
    setSelectedStat(null);
    // Flash checkmark on the player row
    setRecentlyTracked(player.playerId);
    if (trackTimerRef.current) clearTimeout(trackTimerRef.current);
    trackTimerRef.current = setTimeout(() => setRecentlyTracked(null), 750);
  };

  const applyStatToTeam = (stat: StatDef, player: PlayerStatLine | null) => {
    setTeamStats(prev => ({ ...prev, [stat.key]: (prev[stat.key] ?? 0) + 1 }));
    if (player) {
      const update = (list: PlayerStatLine[]) =>
        list.map(p =>
          p.playerId === player.playerId
            ? { ...p, stats: { ...p.stats, [stat.key]: (p.stats[stat.key] ?? 0) + 1 } }
            : p
        );
      setInGame(update);
      setBench(update);
    }
    if (stat.scoreValue) setHomeScore(s => s + stat.scoreValue!);
  };

  // ── Period controls ───────────────────────────────────────────────────────

  const handleNextPeriod = () => {
    if (!isOT && currentPeriod < config.totalPeriods) {
      setCurrentPeriod(p => p + 1);
      setSelectedStat(null);
    }
  };

  const handleAddOT = () => { setIsOT(true); setSelectedStat(null); };

  const handleEndGame = () => {
    Alert.alert('End Game?', 'View final stats summary?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Game', style: 'destructive',
        onPress: () => navigation.navigate('StatTrackerSummary', {
          config, homeScore, oppScore, teamStats,
          playerStats: [...inGame, ...bench],
          isOT,
        }),
      },
    ]);
  };

  const isLastPeriod  = currentPeriod === config.totalPeriods && !isOT;
  const canNextPeriod = currentPeriod < config.totalPeriods && !isOT;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Period bar */}
      <View style={styles.periodBar}>
        <View style={styles.periodChip}>
          <Text style={styles.periodChipText}>{periodLabel}</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Scoreboard */}
      <View style={styles.scoreboard}>
        <ScoreBlock
          name={config.teamName.split(' ').slice(-1)[0].toUpperCase()}
          score={homeScore}
          onMinus={() => setHomeScore(s => Math.max(0, s - 1))}
          onPlus={() => setHomeScore(s => s + 1)}
        />
        <Text style={styles.vs}>VS</Text>
        <ScoreBlock
          name={config.opponentName.split(' ').slice(-1)[0].toUpperCase()}
          score={oppScore}
          onMinus={() => setOppScore(s => Math.max(0, s - 1))}
          onPlus={() => setOppScore(s => s + 1)}
          right
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, !canNextPeriod && styles.ctrlBtnDisabled]}
          onPress={handleNextPeriod}
          disabled={!canNextPeriod}
        >
          <Text style={[styles.ctrlBtnText, !canNextPeriod && { color: Colors.muted }]}>
            NEXT {config.periodLabel.toUpperCase()} →
          </Text>
        </TouchableOpacity>
        {isLastPeriod && !isOT && (
          <TouchableOpacity style={styles.otBtn} onPress={handleAddOT}>
            <Text style={styles.otBtnText}>+ OT</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.endBtn} onPress={handleEndGame}>
          <Text style={styles.endBtnText}>END GAME</Text>
        </TouchableOpacity>
      </View>

      {/* Instruction */}
      <View style={styles.instruction}>
        <View style={styles.instrDot} />
        <Text style={styles.instrText}>
          {selectedStat
            ? `${selectedStat.label} — TAP PLAYER IN GAME`
            : config.trackingMode === 'individual'
              ? 'TAP STAT → TAP PLAYER'
              : 'TAP STAT TO RECORD'}
        </Text>
        {selectedStat && (
          <TouchableOpacity onPress={() => setSelectedStat(null)} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Split layout: stats left, players right ── */}
      <View style={styles.split}>

        {/* Left column — stat list */}
        <ScrollView style={styles.statCol} showsVerticalScrollIndicator={false}>
          {stats.map(stat => (
            <TouchableOpacity
              key={stat.key}
              style={[styles.statRow, selectedStat?.key === stat.key && styles.statRowSelected]}
              onPress={() => handleStatTap(stat)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.statRowAccent,
                selectedStat?.key === stat.key && styles.statRowAccentActive,
              ]} />
              <View style={styles.statRowBody}>
                <Text style={[
                  styles.statRowLabel,
                  selectedStat?.key === stat.key && { color: Colors.cyan },
                ]}>
                  {stat.label}
                </Text>
                <Text style={[
                  styles.statRowSub,
                  stat.scoreValue ? styles.statRowSubScore : null,
                ]}>
                  {stat.sub}
                </Text>
              </View>
              {(teamStats[stat.key] ?? 0) > 0 && (
                <View style={styles.statRowBadge}>
                  <Text style={styles.statRowBadgeText}>{teamStats[stat.key]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Divider */}
        <View style={styles.splitDivider} />

        {/* Right column — player sections */}
        {config.trackingMode === 'individual' ? (
          <ScrollView style={styles.playerCol} showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}>
            <PlayerSection
              label="IN GAME"
              count={inGame.length}
              players={inGame}
              selectedStat={selectedStat}
              focused={!!selectedStat}
              recentlyTracked={recentlyTracked}
              onPlayerTap={handlePlayerSelect}
              onMovePlayer={moveToBench}
              moveIconName="arrow-down-circle-outline"
              moveColor={Colors.muted}
              emptyText="No players in game"
            />
            <PlayerSection
              label="BENCH"
              count={bench.length}
              players={bench}
              selectedStat={selectedStat}
              focused={false}
              recentlyTracked={recentlyTracked}
              onPlayerTap={undefined}
              onMovePlayer={moveToGame}
              moveIconName="arrow-up-circle-outline"
              moveColor={Colors.green}
              emptyText="Bench is empty"
            />
          </ScrollView>
        ) : (
          <View style={[styles.playerCol, styles.teamModeCol]}>
            <Text style={styles.teamModeText}>Team mode{'\n'}stats only</Text>
          </View>
        )}

      </View>

    </SafeAreaView>
  );
}

// ─── Player Section ───────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function PlayerSection({
  label, count, players, selectedStat, focused, recentlyTracked,
  onPlayerTap, onMovePlayer, moveIconName, moveColor, emptyText,
}: {
  label: string;
  count: number;
  players: PlayerStatLine[];
  selectedStat: StatDef | null;
  focused: boolean;
  recentlyTracked: string | null;
  onPlayerTap?: (player: PlayerStatLine) => void;
  onMovePlayer: (player: PlayerStatLine) => void;
  moveIconName: IoniconsName;
  moveColor: string;
  emptyText: string;
}) {
  return (
    <View style={[styles.section, focused && styles.sectionFocused]}>
      <View style={[styles.sectionHeader, focused && styles.sectionHeaderFocused]}>
        <Text style={[styles.sectionLabel, focused && styles.sectionLabelFocused]}>{label}</Text>
        <View style={[styles.countBadge, focused && styles.countBadgeFocused]}>
          <Text style={[styles.countText, focused && styles.countTextFocused]}>{count}</Text>
        </View>
        {focused && (
          <Text style={styles.sectionPrompt}>TAP TO RECORD</Text>
        )}
      </View>

      {players.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        players.map((player, idx) => (
          <TouchableOpacity
            key={player.playerId}
            style={[
              styles.playerRow,
              idx === players.length - 1 && styles.playerRowLast,
              focused && styles.playerRowFocused,
            ]}
            onPress={() => onPlayerTap?.(player)}
            activeOpacity={onPlayerTap ? 0.6 : 1}
          >
            <View style={styles.jersey}>
              <Text style={styles.jerseyNum}>{player.jersey}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              {player.position && (
                <Text style={styles.playerPos}>{player.position}</Text>
              )}
            </View>
            {selectedStat && (player.stats[selectedStat.key] ?? 0) > 0 && (
              <View style={styles.statBadge}>
                <Text style={styles.statBadgeText}>{player.stats[selectedStat.key]}</Text>
              </View>
            )}
            {recentlyTracked === player.playerId ? (
              <Ionicons name="checkmark-circle" size={22} color={Colors.green} />
            ) : (
              <TouchableOpacity
                onPress={() => onMovePlayer(player)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={moveIconName} size={22} color={moveColor} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ─── Score Block ─────────────────────────────────────────────────────────────

function ScoreBlock({ name, score, onMinus, onPlus, right }: {
  name: string; score: number;
  onMinus: () => void; onPlus: () => void;
  right?: boolean;
}) {
  return (
    <View style={[styles.scoreBlock, right && styles.scoreBlockRight]}>
      <Text style={styles.scoreName}>{name}</Text>
      <View style={styles.scoreRow}>
        <TouchableOpacity style={styles.scoreBtn} onPress={onMinus}>
          <Text style={styles.scoreBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.scoreNum}>{score}</Text>
        <TouchableOpacity style={styles.scoreBtn} onPress={onPlus}>
          <Text style={styles.scoreBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Period bar
  periodBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  periodChip: {
    paddingHorizontal: 18, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: Colors.border2, backgroundColor: 'rgba(61,143,255,0.1)',
  },
  periodChipText: { fontFamily: Fonts.orbitron, fontSize: 13, color: Colors.text, letterSpacing: 1 },
  liveChip:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot:        { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.green },
  liveText:       { fontFamily: Fonts.mono, fontSize: 11, color: Colors.green, letterSpacing: 1.5 },

  // Scoreboard
  scoreboard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  scoreBlock:      { alignItems: 'center', flex: 1 },
  scoreBlockRight: {},
  scoreName: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim,
    letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase',
  },
  scoreRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreBtnText: { fontFamily: Fonts.orbitron, fontSize: 18, color: Colors.text },
  scoreNum:     { fontFamily: Fonts.orbitron, fontSize: 42, color: Colors.text, lineHeight: 50, minWidth: 52, textAlign: 'center' },
  vs:           { fontFamily: Fonts.mono, fontSize: 12, color: Colors.muted, letterSpacing: 2 },

  // Controls
  controls: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  ctrlBtn:         { flex: 1, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border2, alignItems: 'center' },
  ctrlBtnDisabled: { opacity: 0.35 },
  ctrlBtnText:     { fontFamily: Fonts.mono, fontSize: 9, color: Colors.cyan, letterSpacing: 1 },
  otBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md,
    borderWidth: 1, borderColor: `${Colors.amber}55`, backgroundColor: 'rgba(212,168,83,0.1)',
  },
  otBtnText:  { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.amber, letterSpacing: 1 },
  endBtn:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.red },
  endBtnText: { fontFamily: Fonts.orbitron, fontSize: 10, color: '#fff', letterSpacing: 1 },

  // Instruction
  instruction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
  },
  instrDot:      { width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: Colors.cyan },
  instrText:     { flex: 1, fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 1.5 },
  cancelBtn:     { padding: 4 },
  cancelBtnText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.muted },

  // Split layout
  split:        { flex: 1, flexDirection: 'row' },
  statCol:      { flex: 5 },
  splitDivider: { width: 1, backgroundColor: Colors.border },
  playerCol:    { flex: 6 },
  teamModeCol:  { alignItems: 'center', justifyContent: 'center' },
  teamModeText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, textAlign: 'center', letterSpacing: 1, lineHeight: 16 },

  // Stat rows (left column)
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingRight: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  statRowSelected:    { backgroundColor: 'rgba(0,212,255,0.07)' },
  statRowAccent:      { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: 'transparent' },
  statRowAccentActive: { backgroundColor: Colors.cyan },
  statRowBody:        { flex: 1 },
  statRowLabel:       { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.text, letterSpacing: 0.5 },
  statRowSub:         { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.3, marginTop: 2 },
  statRowSubScore:    { color: Colors.green },
  statRowBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1, borderColor: `${Colors.cyan}44`,
    marginRight: 4,
  },
  statRowBadgeText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan },

  // Player sections
  // Player sections (right column)
  section: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
  },
  sectionFocused: {
    borderTopColor: Colors.cyan,
    backgroundColor: 'rgba(0,212,255,0.03)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  sectionHeaderFocused: {
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderBottomColor: 'rgba(0,212,255,0.2)',
  },
  sectionLabel:        { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 2 },
  sectionLabelFocused: { color: Colors.cyan },
  countBadge: {
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border2,
  },
  countBadgeFocused: { borderColor: `${Colors.cyan}55`, backgroundColor: 'rgba(0,212,255,0.12)' },
  countText:         { fontFamily: Fonts.orbitron, fontSize: 8, color: Colors.muted },
  countTextFocused:  { color: Colors.cyan },
  sectionPrompt:     { flex: 1, textAlign: 'right', fontFamily: Fonts.mono, fontSize: 7, color: Colors.cyan, letterSpacing: 0.5 },

  emptyText: {
    fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted,
    textAlign: 'center', paddingVertical: 14, letterSpacing: 0.5,
  },

  // Player rows (compact for right column)
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  playerRowLast:    { borderBottomWidth: 0 },
  playerRowFocused: { backgroundColor: 'rgba(0,212,255,0.04)' },
  jersey: {
    width: 28, height: 28, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  jerseyNum:  { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.cyan },
  playerInfo: { flex: 1, minWidth: 0 },
  playerName: { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.text, fontWeight: '600' },
  playerPos:  { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.3 },
  statBadge: {
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1, borderColor: `${Colors.cyan}44`,
  },
  statBadgeText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan },
});
