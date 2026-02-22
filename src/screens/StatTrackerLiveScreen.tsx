import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import {
  StatTrackerConfig, StatDef, PlayerStatLine,
  SPORT_STATS, BASEBALL_BATTING_STATS, BASEBALL_PITCHING_STATS,
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

  const [inningHalf,    setInningHalf]    = useState<'top' | 'bottom'>('top');
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
  const [paused,          setPaused]          = useState(false);
  const [lastAction,      setLastAction]      = useState<{
    statLabel: string; statKey: string;
    playerName: string | null; playerId: string | null;
    scoreValue?: number;
  } | null>(null);
  const [clockSeconds,  setClockSeconds]  = useState(0);
  const [clockRunning,  setClockRunning]  = useState(false);
  const [editingClock,  setEditingClock]  = useState(false);
  const [clockInput,    setClockInput]    = useState('');

  const trackTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  // ── Derived constants ──────────────────────────────────────────────────────

  const isBaseball      = config.sport === 'baseball';
  const isMyTeamBatting = isBaseball
    ? (config.isHomeTeam ? inningHalf === 'bottom' : inningHalf === 'top')
    : false;
  const activeStats = isBaseball
    ? (isMyTeamBatting ? BASEBALL_BATTING_STATS : BASEBALL_PITCHING_STATS)
    : SPORT_STATS[config.sport];

  const pauseTitle = config.periodType === 'halves'   ? 'HALFTIME'
    : config.periodType === 'quarters' ? 'BREAK'
    : config.periodType === 'innings'  ? 'INNING BREAK'
    : 'SET BREAK';

  const periodLabel = isOT
    ? 'OT'
    : isBaseball
      ? `${inningHalf === 'top' ? 'TOP' : 'BOT'} ${currentPeriod}`
      : `${config.periodShort}${currentPeriod} OF ${config.totalPeriods}`;

  const nextLabel = isBaseball
    ? (inningHalf === 'top' ? `BOT ${currentPeriod} →` : `TOP ${currentPeriod + 1} →`)
    : `NEXT ${config.periodLabel.toUpperCase()} →`;

  // Baseball: no "last period" concept — coaches end game manually
  const isLastPeriod  = !isBaseball && currentPeriod === config.totalPeriods && !isOT;
  const canNextPeriod = isBaseball || (currentPeriod < config.totalPeriods && !isOT);
  const showOTButton  = isLastPeriod && !isOT;

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

  const handlePause = () => {
    setPaused(p => !p);
    setSelectedStat(null);
  };

  const handleStatTap = (stat: StatDef) => {
    if (paused) return;
    if (config.trackingMode === 'team') {
      applyStatToTeam(stat, null);
      return;
    }
    setSelectedStat(prev => prev?.key === stat.key ? null : stat);
  };

  const handlePlayerSelect = (player: PlayerStatLine) => {
    if (!selectedStat) return;
    applyStatToTeam(selectedStat, player);
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
    setLastAction({
      statLabel: stat.label, statKey: stat.key,
      playerName: player?.name ?? null, playerId: player?.playerId ?? null,
      scoreValue: stat.scoreValue,
    });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setLastAction(null), 4000);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastAction(null);
    setTeamStats(prev => ({ ...prev, [lastAction.statKey]: Math.max(0, (prev[lastAction.statKey] ?? 0) - 1) }));
    if (lastAction.playerId) {
      const update = (list: PlayerStatLine[]) =>
        list.map(p =>
          p.playerId === lastAction.playerId
            ? { ...p, stats: { ...p.stats, [lastAction.statKey]: Math.max(0, (p.stats[lastAction.statKey] ?? 0) - 1) } }
            : p
        );
      setInGame(update);
      setBench(update);
    }
    if (lastAction.scoreValue) setHomeScore(s => Math.max(0, s - lastAction.scoreValue!));
  };

  // ── Game clock ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (clockRunning) {
      clockIntervalRef.current = setInterval(() => setClockSeconds(s => s + 1), 1000);
    } else {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    }
    return () => { if (clockIntervalRef.current) clearInterval(clockIntervalRef.current); };
  }, [clockRunning]);

  useEffect(() => { if (paused) setClockRunning(false); }, [paused]);

  const formatClock = (s: number) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };

  const handleClockEdit = () => {
    setClockRunning(false);
    setClockInput(formatClock(clockSeconds));
    setEditingClock(true);
  };

  const commitClockInput = () => {
    const t = clockInput.trim();
    if (t.includes(':')) {
      const [mStr, sStr] = t.split(':');
      const m = parseInt(mStr, 10), s = parseInt(sStr, 10);
      if (!isNaN(m) && !isNaN(s) && s < 60) setClockSeconds(m * 60 + s);
    } else {
      const total = parseInt(t, 10);
      if (!isNaN(total)) setClockSeconds(total);
    }
    setEditingClock(false);
  };

  // ── Period controls ───────────────────────────────────────────────────────

  const handleNextPeriod = () => {
    if (isBaseball) {
      if (inningHalf === 'top') {
        setInningHalf('bottom');
      } else {
        setInningHalf('top');
        setCurrentPeriod(p => p + 1);
      }
      setSelectedStat(null);
      return;
    }
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Period bar */}
      <View style={styles.periodBar}>
        <View style={styles.periodChip}>
          <Text style={styles.periodChipText}>{periodLabel}</Text>
        </View>
        {isBaseball && (
          <View style={[styles.roleChip, isMyTeamBatting ? styles.roleChipBat : styles.roleChipField]}>
            <Text style={[styles.roleChipText, isMyTeamBatting ? styles.roleChipTextBat : styles.roleChipTextField]}>
              {isMyTeamBatting ? '⚾ AT BAT' : '🧤 FIELD'}
            </Text>
          </View>
        )}
        {isBaseball && !isMyTeamBatting && (teamStats['pc'] ?? 0) > 0 && (
          <View style={styles.pitchCountChip}>
            <Text style={styles.pitchCountText}>{teamStats['pc']} PC</Text>
          </View>
        )}
        <View style={[styles.liveChip, paused && styles.pausedChip]}>
          <View style={[styles.liveDot, paused && styles.pausedDot]} />
          <Text style={[styles.liveText, paused && styles.pausedText]}>
            {paused ? 'PAUSED' : 'LIVE'}
          </Text>
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
        <TouchableOpacity style={styles.pauseBtn} onPress={handlePause}>
          <Text style={styles.pauseBtnText}>{paused ? '▶ RESUME' : '⏸ PAUSE'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctrlBtn, !canNextPeriod && styles.ctrlBtnDisabled]}
          onPress={handleNextPeriod}
          disabled={!canNextPeriod}
        >
          <Text style={[styles.ctrlBtnText, !canNextPeriod && { color: Colors.muted }]}>
            {nextLabel}
          </Text>
        </TouchableOpacity>
        {showOTButton && (
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

      {/* Undo snackbar — always occupies space, hidden when no action */}
      <View style={[styles.undoBar, !lastAction && styles.undoBarHidden]}>
        <Text style={styles.undoBarText}>
          {lastAction ? `${lastAction.statLabel}${lastAction.playerName ? ` — ${lastAction.playerName}` : ''}` : ''}
        </Text>
        <TouchableOpacity style={styles.undoBtn} onPress={handleUndo} disabled={!lastAction}>
          <Text style={[styles.undoBtnText, !lastAction && { opacity: 0 }]}>UNDO</Text>
        </TouchableOpacity>
      </View>

      {/* ── Split layout: stats left, players right ── */}
      <View style={styles.split}>
        {paused && (
          <TouchableOpacity style={styles.pauseOverlay} onPress={handlePause} activeOpacity={0.9}>
            <Text style={styles.pauseOverlayIcon}>⏸</Text>
            <Text style={styles.pauseOverlayTitle}>{pauseTitle}</Text>
            <Text style={styles.pauseOverlaySub}>Tracking paused — navigate freely{'\n'}Tap anywhere to resume</Text>
          </TouchableOpacity>
        )}

        {/* Left column — stat list */}
        <ScrollView style={styles.statCol} showsVerticalScrollIndicator={false}>
          {isBaseball && (
            <View style={[styles.statListHeader, isMyTeamBatting ? styles.statListHeaderBat : styles.statListHeaderField]}>
              <Text style={[styles.statListHeaderText, isMyTeamBatting ? styles.statListHeaderTextBat : styles.statListHeaderTextField]}>
                {isMyTeamBatting ? '⚾  BATTING' : '🧤  PITCHING / FIELDING'}
              </Text>
            </View>
          )}
          {activeStats.map(stat => (
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

      {/* Clock bar — hidden for baseball (innings-based, no game clock) */}
      {!isBaseball && (
        <View style={[styles.clockBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={[styles.clockToggle, paused && styles.clockToggleDisabled]}
            onPress={() => { if (!paused) setClockRunning(r => !r); }}
            disabled={paused}
          >
            <Text style={styles.clockToggleIcon}>{clockRunning ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {editingClock ? (
            <>
              <TextInput
                style={styles.clockInputField}
                value={clockInput}
                onChangeText={setClockInput}
                keyboardType="numbers-and-punctuation"
                autoFocus
                onSubmitEditing={commitClockInput}
                returnKeyType="done"
                selectTextOnFocus
                placeholder="MM:SS"
                placeholderTextColor={Colors.muted}
              />
              <TouchableOpacity style={styles.clockSetBtn} onPress={commitClockInput}>
                <Text style={styles.clockSetBtnText}>SET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditingClock(false)} style={styles.clockEditCancel}>
                <Text style={styles.cancelBtnText}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={handleClockEdit} style={styles.clockTimeBtn}>
              <Text style={[styles.clockTimeText, clockRunning && styles.clockTimeRunning]}>
                {formatClock(clockSeconds)}
              </Text>
              <Text style={styles.clockEditHint}>TAP TO EDIT</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.clockStatus, clockRunning && styles.clockStatusRunning]}>
            {clockRunning ? '● RUN' : '○ STOP'}
          </Text>
        </View>
      )}

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

  // Baseball role chip
  roleChip:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  roleChipBat:        { borderColor: `${Colors.amber}77`, backgroundColor: 'rgba(212,168,83,0.12)' },
  roleChipField:      { borderColor: `${Colors.cyan}55`, backgroundColor: 'rgba(0,212,255,0.08)' },
  roleChipText:       { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1 },
  roleChipTextBat:    { color: Colors.amber },
  roleChipTextField:  { color: Colors.cyan },
  pitchCountChip:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.green}55`, backgroundColor: 'rgba(76,175,80,0.1)' },
  pitchCountText:     { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.green, letterSpacing: 1 },

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

  // Stat list header (baseball batting/pitching mode indicator)
  statListHeader:          { paddingVertical: 8, paddingHorizontal: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statListHeaderBat:       { backgroundColor: 'rgba(212,168,83,0.07)' },
  statListHeaderField:     { backgroundColor: 'rgba(0,212,255,0.05)' },
  statListHeaderText:      { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
  statListHeaderTextBat:   { color: Colors.amber },
  statListHeaderTextField: { color: Colors.cyan },

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
  statRowSelected:     { backgroundColor: 'rgba(0,212,255,0.07)' },
  statRowAccent:       { width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: 'transparent' },
  statRowAccentActive: { backgroundColor: Colors.cyan },
  statRowBody:         { flex: 1 },
  statRowLabel:        { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.text, letterSpacing: 0.5, textAlign: 'center' },
  statRowSub:          { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.3, marginTop: 2, textAlign: 'center' },
  statRowSubScore:     { color: Colors.green },
  statRowBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderWidth: 1, borderColor: `${Colors.cyan}44`,
    marginRight: 4,
  },
  statRowBadgeText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan },

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

  // Pause button
  pauseBtn:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: `${Colors.amber}55`, backgroundColor: 'rgba(212,168,83,0.1)' },
  pauseBtnText: { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.amber, letterSpacing: 1 },

  // Paused chip
  pausedChip: { backgroundColor: 'rgba(212,168,83,0.1)', borderWidth: 1, borderColor: `${Colors.amber}55`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  pausedDot:  { backgroundColor: Colors.amber },
  pausedText: { color: Colors.amber },

  // Pause overlay
  pauseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10, backgroundColor: 'rgba(7,11,18,0.92)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  pauseOverlayIcon:  { fontSize: 40 },
  pauseOverlayTitle: { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.amber, letterSpacing: 3 },
  pauseOverlaySub:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 1, textAlign: 'center', lineHeight: 18 },

  // Undo snackbar
  undoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    backgroundColor: 'rgba(0,212,255,0.07)',
    borderBottomWidth: 1, borderBottomColor: `${Colors.cyan}33`,
  },
  undoBarHidden: { opacity: 0 },
  undoBarText: { flex: 1, fontFamily: Fonts.mono, fontSize: 10, color: Colors.text, letterSpacing: 0.5 },
  undoBtn:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm, borderWidth: 1, borderColor: `${Colors.cyan}55`, backgroundColor: 'rgba(0,212,255,0.15)' },
  undoBtnText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan, letterSpacing: 1 },

  // Clock bar
  clockBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: Spacing.lg, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  clockToggle: {
    width: 52, height: 52, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.cyan,
    backgroundColor: 'rgba(0,212,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  clockToggleDisabled: { borderColor: Colors.muted, backgroundColor: 'transparent', opacity: 0.35 },
  clockToggleIcon:     { fontSize: 20, color: Colors.cyan },
  clockTimeBtn:        { flex: 1, alignItems: 'center', gap: 2 },
  clockTimeText:       { fontFamily: Fonts.orbitron, fontSize: 30, color: Colors.dim, letterSpacing: 2 },
  clockTimeRunning:    { color: Colors.text },
  clockEditHint:       { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, letterSpacing: 1 },
  clockInputField: {
    flex: 1, fontFamily: Fonts.orbitron, fontSize: 26, color: Colors.text,
    letterSpacing: 2, textAlign: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.cyan, paddingVertical: 4,
  },
  clockSetBtn:        { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.cyan, backgroundColor: 'rgba(0,212,255,0.15)' },
  clockSetBtnText:    { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan, letterSpacing: 1 },
  clockEditCancel:    { padding: 6 },
  clockStatus:        { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1, textAlign: 'right' },
  clockStatusRunning: { color: Colors.green },
});
