import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import Svg from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import {
  Play, PlayCat, Sport,
  FieldBackground,
  pendingPlay, clearPendingPlay,
} from './PlayEditorScreen';
import { useCoach } from '../context/CoachContext';

// ─── Mock seed data ───────────────────────────────────────────────────────────

const SEED_PLAYS: Play[] = [
  {
    id: '1',
    name: '4-3-3 High Press',
    sport: 'soccer',
    category: 'offense',
    createdAt: Date.now() - 86400000 * 2,
    tokens: [
      { id: 't1',  nx: 0.50, ny: 0.88, label: '1',  team: 'offense' },
      { id: 't2',  nx: 0.20, ny: 0.73, label: '2',  team: 'offense' },
      { id: 't3',  nx: 0.40, ny: 0.70, label: '5',  team: 'offense' },
      { id: 't4',  nx: 0.60, ny: 0.70, label: '6',  team: 'offense' },
      { id: 't5',  nx: 0.80, ny: 0.73, label: '3',  team: 'offense' },
      { id: 't6',  nx: 0.30, ny: 0.54, label: '8',  team: 'offense' },
      { id: 't7',  nx: 0.50, ny: 0.50, label: '4',  team: 'offense' },
      { id: 't8',  nx: 0.70, ny: 0.54, label: '10', team: 'offense' },
      { id: 't9',  nx: 0.18, ny: 0.33, label: '7',  team: 'offense' },
      { id: 't10', nx: 0.50, ny: 0.28, label: '9',  team: 'offense' },
      { id: 't11', nx: 0.82, ny: 0.33, label: '11', team: 'offense' },
    ],
    routes: [
      { id: 'r1', color: '#00d4ff', points: [{ x: 0.5, y: 0.28 }, { x: 0.5, y: 0.14 }, { x: 0.62, y: 0.08 }] },
      { id: 'r2', color: '#d4a853', points: [{ x: 0.18, y: 0.33 }, { x: 0.12, y: 0.18 }] },
      { id: 'r3', color: '#d4a853', points: [{ x: 0.82, y: 0.33 }, { x: 0.88, y: 0.18 }] },
    ],
  },
  {
    id: '2',
    name: 'Counter Press',
    sport: 'soccer',
    category: 'defense',
    createdAt: Date.now() - 86400000,
    tokens: [
      { id: 't1', nx: 0.50, ny: 0.85, label: '1', team: 'offense' },
      { id: 't2', nx: 0.22, ny: 0.68, label: '2', team: 'offense' },
      { id: 't3', nx: 0.78, ny: 0.68, label: '3', team: 'offense' },
      { id: 't4', nx: 0.50, ny: 0.63, label: '4', team: 'offense' },
      { id: 't5', nx: 0.50, ny: 0.48, label: '5', team: 'offense' },
    ],
    routes: [
      { id: 'r1', color: '#e74c3c', points: [{ x: 0.22, y: 0.68 }, { x: 0.34, y: 0.54 }] },
      { id: 'r2', color: '#e74c3c', points: [{ x: 0.78, y: 0.68 }, { x: 0.66, y: 0.54 }] },
    ],
  },
  {
    id: '3',
    name: 'Corner Routine A',
    sport: 'soccer',
    category: 'set-piece',
    createdAt: Date.now() - 86400000 * 5,
    tokens: [
      { id: 't1', nx: 0.50, ny: 0.48, label: '9',  team: 'offense' },
      { id: 't2', nx: 0.34, ny: 0.40, label: '10', team: 'offense' },
      { id: 't3', nx: 0.66, ny: 0.40, label: '11', team: 'offense' },
      { id: 't4', nx: 0.50, ny: 0.58, label: '6',  team: 'offense' },
      { id: 'd1', nx: 0.50, ny: 0.35, label: 'A',  team: 'defense' },
    ],
    routes: [
      { id: 'r1', color: '#00d4ff', points: [{ x: 0.34, y: 0.40 }, { x: 0.44, y: 0.30 }] },
      { id: 'r2', color: '#00d4ff', points: [{ x: 0.66, y: 0.40 }, { x: 0.56, y: 0.30 }] },
    ],
  },
  {
    id: '4',
    name: '2-3 Zone',
    sport: 'basketball',
    category: 'defense',
    createdAt: Date.now() - 86400000 * 3,
    tokens: [
      { id: 't1', nx: 0.25, ny: 0.32, label: '1', team: 'offense' },
      { id: 't2', nx: 0.75, ny: 0.32, label: '2', team: 'offense' },
      { id: 't3', nx: 0.18, ny: 0.58, label: '3', team: 'offense' },
      { id: 't4', nx: 0.50, ny: 0.62, label: '4', team: 'offense' },
      { id: 't5', nx: 0.82, ny: 0.58, label: '5', team: 'offense' },
    ],
    routes: [],
  },
];

// ─── Global plays store (for DrillPlanStep access) ───────────────────────────

export let globalPlays: Play[] = SEED_PLAYS;

// ─── Filter config ────────────────────────────────────────────────────────────

const SPORT_FILTERS: { id: Sport | 'all'; label: string }[] = [
  { id: 'all',        label: '🏅 ALL'       },
  { id: 'soccer',     label: '⚽ SOCCER'    },
  { id: 'basketball', label: '🏀 BASKETBALL' },
  { id: 'football',   label: '🏈 FOOTBALL'  },
  { id: 'baseball',   label: '⚾ BASEBALL'  },
  { id: 'volleyball', label: '🏐 VOLLEYBALL' },
];

const CAT_FILTERS: { id: PlayCat | 'all'; label: string }[] = [
  { id: 'all',       label: 'ALL'      },
  { id: 'offense',   label: 'OFFENSE'  },
  { id: 'defense',   label: 'DEFENSE'  },
  { id: 'set-piece', label: 'SET PIECE'},
  { id: 'special',   label: 'SPECIAL'  },
];

const CAT_COLORS: Record<PlayCat, string> = {
  offense:   Colors.green,
  defense:   Colors.red,
  'set-piece': Colors.amber,
  special:   Colors.purple,
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

// ─── Play Thumbnail ───────────────────────────────────────────────────────────

const THUMB_W = 140;
const THUMB_H = 100;

function PlayThumbnail({ play }: { play: Play }) {
  const sw = THUMB_W, sh = THUMB_H;
  return (
    <Svg width={sw} height={sh} style={{ borderRadius: 8 }}>
      <FieldBackground sport={play.sport} w={sw} h={sh} dim />
      {/* Routes */}
      {play.routes.map(r => {
        const pts = r.points.map(p => ({ x: p.x * sw, y: p.y * sh }));
        if (pts.length < 2) return null;
        let d = `M${pts[0].x},${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) d += ` L${pts[i].x},${pts[i].y}`;
        return <Svg key={r.id}><Svg viewBox={`0 0 ${sw} ${sh}`} width={sw} height={sh}></Svg></Svg>;
      })}
      {/* Tokens */}
      {play.tokens.map(t => {
        const px = t.nx * sw, py = t.ny * sh;
        const fill = t.team === 'offense' ? Colors.amber : 'transparent';
        const stroke = t.team === 'offense' ? 'rgba(255,255,255,0.6)' : Colors.red;
        return (
          <Svg key={t.id} viewBox={`0 0 ${sw} ${sh}`} width={sw} height={sh}>
            {/* We re-render these inside a nested SVG to avoid path conflicts */}
          </Svg>
        );
      })}
    </Svg>
  );
}

// ─── Playbook Screen ──────────────────────────────────────────────────────────

export default function PlaymakerScreen({ navigation }: any) {
  const { coachSport } = useCoach();
  const [plays,     setPlays]     = useState<Play[]>(SEED_PLAYS);
  const [catFilter, setCatFilter] = useState<PlayCat | 'all'>('all');

  // Keep module-level store in sync so DrillPlanStep can read plays without prop drilling
  useEffect(() => { globalPlays = plays; }, [plays]);

  // Pick up any play saved from the editor
  useFocusEffect(useCallback(() => {
    if (pendingPlay) {
      setPlays(prev => {
        const idx = prev.findIndex(p => p.id === pendingPlay!.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = pendingPlay!;
          return updated;
        }
        return [pendingPlay!, ...prev];
      });
      clearPendingPlay();
    }
  }, []));

  const filtered = plays.filter(p =>
    p.sport === coachSport &&
    (catFilter === 'all' || p.category === catFilter)
  );

  const openEditor = (play?: Play) => {
    navigation.navigate('PlayEditor', play ? { play } : {});
  };

  const renderPlay = ({ item, index }: { item: Play; index: number }) => {
    const catColor = CAT_COLORS[item.category];
    return (
      <TouchableOpacity
        style={[styles.playCard, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}
        onPress={() => openEditor(item)}
        activeOpacity={0.85}
      >
        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          <PlayThumbnailSimple play={item} />
        </View>

        {/* Info */}
        <View style={styles.playInfo}>
          <Text style={styles.playName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.playMeta}>
            <View style={[styles.catTag, { borderColor: `${catColor}66` }]}>
              <Text style={[styles.catTagText, { color: catColor }]}>
                {item.category.toUpperCase().replace('-', ' ')}
              </Text>
            </View>
            <Text style={styles.playAge}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>

        {/* Accent bar */}
        <View style={[styles.playCardAccent, { backgroundColor: catColor }]} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PLAYBOOK</Text>
          <Text style={styles.headerSub}>{plays.length} plays saved</Text>
        </View>
        <TouchableOpacity style={styles.newPlayBtn} onPress={() => openEditor()}>
          <Text style={styles.newPlayBtnText}>+ NEW PLAY</Text>
        </TouchableOpacity>
      </View>

      {/* Sport filter */}
      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterScrollContent}
      >
        {CAT_FILTERS.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterTab, catFilter === f.id && styles.filterTabActive]}
            onPress={() => setCatFilter(f.id)}
          >
            <Text style={[styles.filterTabText, catFilter === f.id && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Play grid */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No plays yet</Text>
          <Text style={styles.emptySub}>Tap + NEW PLAY to draw your first play</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => openEditor()}>
            <Text style={styles.emptyBtnText}>CREATE FIRST PLAY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderPlay}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Simplified thumbnail (avoids nested SVG issues) ─────────────────────────

function PlayThumbnailSimple({ play }: { play: Play }) {
  const w = THUMB_W, h = THUMB_H;
  const { Circle, Path: SvgPath, G, Line } = require('react-native-svg');

  return (
    <Svg width={w} height={h} style={{ borderRadius: 8 }}>
      <FieldBackground sport={play.sport} w={w} h={h} dim />
      {/* Tokens as simple dots */}
      {play.tokens.map(t => {
        const px = t.nx * w;
        const py = t.ny * h;
        const fill   = t.team === 'offense' ? Colors.amber : 'transparent';
        const stroke = t.team === 'offense' ? 'rgba(255,255,255,0.5)' : Colors.red;
        return (
          <Circle key={t.id} cx={px} cy={py} r={6} fill={fill} stroke={stroke} strokeWidth={1.5} />
        );
      })}
    </Svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    backgroundColor: 'rgba(5,10,22,0.98)', borderBottomWidth: 1, borderBottomColor: Colors.border2,
  },
  backBtn:  { paddingVertical: 6, paddingRight: 12 },
  backText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 1 },
  headerCenter: { flex: 1 },
  headerTitle: { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, letterSpacing: 1 },
  headerSub:   { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, marginTop: 3, letterSpacing: 0.5 },
  newPlayBtn:  { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, backgroundColor: Colors.cyan },
  newPlayBtnText: { fontFamily: Fonts.orbitron, fontSize: 10, color: '#000', letterSpacing: 1 },

  filterScroll:        { flexGrow: 0, backgroundColor: 'rgba(5,10,22,0.9)', borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterScrollContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterTab:           { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  filterTabActive:     { borderColor: `${Colors.cyan}88`, backgroundColor: 'rgba(0,212,255,0.08)' },
  filterTabText:       { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  filterTabTextActive: { color: Colors.cyan },

  grid: { padding: 12 },

  playCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  thumbWrap:      { width: '100%', height: THUMB_H },
  playInfo:       { padding: 10 },
  playName:       { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text, fontWeight: '700', marginBottom: 6 },
  playMeta:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catTag:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  catTagText:     { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 0.5 },
  playAge:        { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted },
  playCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },

  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyIcon:  { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, marginBottom: 8 },
  emptySub:   { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted, textAlign: 'center', marginBottom: 24 },
  emptyBtn:   { paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.md, backgroundColor: Colors.cyan },
  emptyBtnText: { fontFamily: Fonts.orbitron, fontSize: 11, color: '#000', letterSpacing: 1 },
});
