import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

const MOTI_IMAGES = [
  require('../../assets/MOTIS/0-MOTI.png'),
  require('../../assets/MOTIS/1-MOTi.png'),
  require('../../assets/MOTIS/2-MOTI.png'),
  require('../../assets/MOTIS/3-MOTI.png'),
  require('../../assets/MOTIS/4-MOTI.png'),
  require('../../assets/MOTIS/5-MOTI.png'),
];
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../theme';


const STAGES = [
  { id: 1, name: 'BOOT', desc: 'System initializing...', xpRequired: 0, unlocked: true },
  { id: 2, name: 'CORE', desc: 'Torso assembly complete', xpRequired: 100, unlocked: true },
  { id: 3, name: 'REACH', desc: 'Arms deployed', xpRequired: 250, unlocked: true },
  { id: 4, name: 'STRIDE', desc: 'Legs online', xpRequired: 500, unlocked: false },
  { id: 5, name: 'PRIME', desc: 'Full form achieved', xpRequired: 1000, unlocked: false },
];

const TEAM_XP = 340;

export default function MotiScreen() {
  const [activeStage, setActiveStage] = useState(2);
  const stage = STAGES[activeStage];

  const nextStage = STAGES[activeStage + 1];
  const xpToNext = nextStage ? nextStage.xpRequired - TEAM_XP : 0;
  const currentStageXp = stage.xpRequired;
  const nextStageXp = nextStage?.xpRequired ?? TEAM_XP;
  const progress = Math.min((TEAM_XP - currentStageXp) / (nextStageXp - currentStageXp), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.motiName}>PROTO</Text>
        <View style={styles.stageBadge}>
          <Text style={styles.stageBadgeText}>STAGE {stage.id}</Text>
        </View>
      </View>

      {/* Stage name */}
      <View style={styles.stageNameWrap}>
        <Text style={styles.stageTitle}>{stage.name}</Text>
        <Text style={styles.stageDesc}>{stage.desc}</Text>
      </View>

      {/* Moti Display */}
      <View style={styles.motiDisplay}>
        {/* Glow */}
        <View style={styles.glow} />

        <Image
          source={MOTI_IMAGES[activeStage] ?? MOTI_IMAGES[0]}
          style={styles.motiImage}
          resizeMode="contain"
        />
      </View>

      {/* Stage dots */}
      <View style={styles.stageDots}>
        {STAGES.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => s.unlocked && setActiveStage(i)}
            style={[
              styles.dot,
              i === activeStage && styles.dotActive,
              s.unlocked && i !== activeStage && styles.dotUnlocked,
            ]}
          />
        ))}
      </View>

      {/* XP Bar */}
      <View style={styles.xpSection}>
        <View style={styles.xpTop}>
          <Text style={styles.xpLabel}>TEAM XP</Text>
          <Text style={styles.xpVal}>{TEAM_XP} / {nextStageXp}</Text>
        </View>
        <View style={styles.xpBar}>
          <View style={[styles.xpFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Next unlock */}
      {xpToNext > 0 && (
        <View style={styles.nextUnlock}>
          <Text style={styles.nuLabel}>NEXT UNLOCK</Text>
          <Text style={styles.nuVal}>+{xpToNext} XP → {nextStage?.name}</Text>
        </View>
      )}

      {/* XP Sources */}
      <View style={styles.xpSources}>
        <Text style={styles.xpSourcesTitle}>EARN XP TODAY</Text>
        <View style={styles.sourceRow}>
          <XpSource label="Check-in" xp="+10" color={Colors.green} />
          <XpSource label="Prep Task" xp="+15" color={Colors.cyan} />
          <XpSource label="Game Stats" xp="+50" color={Colors.amber} />
        </View>
      </View>

    </SafeAreaView>
  );
}

function XpSource({ label, xp, color }: { label: string; xp: string; color: string }) {
  return (
    <TouchableOpacity style={[styles.sourceCard, { borderColor: `${color}33` }]}>
      <Text style={[styles.sourceXp, { color }]}>{xp}</Text>
      <Text style={styles.sourceLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  motiName: {
    fontFamily: Fonts.orbitron,
    fontSize: 24,
    fontWeight: '900',
    color: Colors.cyan,
    letterSpacing: 3,
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cyan,
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  stageBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.cyan,
    letterSpacing: 2,
  },

  stageNameWrap: { alignItems: 'center', paddingBottom: 6 },
  stageTitle: {
    fontFamily: Fonts.orbitron,
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: 3,
  },
  stageDesc: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dim,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // Moti display
  motiDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.cyan,
    opacity: 0.04,
  },
  motiImage: {
    width: 280,
    height: 280,
  },

  // Stage dots
  stageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.muted,
  },
  dotActive: {
    backgroundColor: Colors.cyan,
    borderColor: Colors.cyan,
  },
  dotUnlocked: {
    backgroundColor: 'rgba(0,212,255,0.25)',
    borderColor: Colors.border2,
  },

  // XP
  xpSection: { paddingHorizontal: Spacing.xl, paddingBottom: 6 },
  xpTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  xpLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 1,
  },
  xpVal: {
    fontFamily: Fonts.orbitron,
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '700',
  },
  xpBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.cyan,
    borderRadius: 3,
  },

  nextUnlock: {
    marginHorizontal: Spacing.xl,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nuLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },
  nuVal: {
    fontFamily: Fonts.orbitron,
    fontSize: 11,
    color: Colors.cyan,
    fontWeight: '700',
  },

  // XP Sources
  xpSources: { padding: Spacing.xl, paddingTop: Spacing.lg },
  xpSourcesTitle: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sourceRow: { flexDirection: 'row', gap: 8 },
  sourceCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  sourceXp: {
    fontFamily: Fonts.orbitron,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  sourceLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 1,
  },
});
