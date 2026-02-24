import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { useCoach } from '../context/CoachContext';
import MotiHero from '../components/MotiHero';
import BadgeShelf from '../components/BadgeShelf';

export default function MotiScreen() {
  const { teamXp, motiStage, earnedBadges, gamesTracked } = useCoach();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>ACHIEVEMENTS</Text>
        </View>

        {/* MOTI character + XP */}
        <View style={styles.heroSection}>
          <View style={styles.glow} />
          <MotiHero motiStage={motiStage} />
          <View style={styles.xpPill}>
            <Text style={styles.xpNumber}>{teamXp}</Text>
            <Text style={styles.xpLabel}> TEAM XP</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={Colors.amber} />
            <Text style={[styles.statVal, { color: Colors.amber }]}>{earnedBadges.length}<Text style={styles.statOf}>/{13}</Text></Text>
            <Text style={styles.statLabel}>BADGES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.cyan} />
            <Text style={[styles.statVal, { color: Colors.cyan }]}>{teamXp}</Text>
            <Text style={styles.statLabel}>XP EARNED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="chart-bar" size={18} color={Colors.green} />
            <Text style={[styles.statVal, { color: Colors.green }]}>{gamesTracked}</Text>
            <Text style={styles.statLabel}>GAMES</Text>
          </View>
        </View>

        {/* Badge shelf */}
        <BadgeShelf earnedBadges={earnedBadges} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { paddingBottom: 32 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.cyan,
    letterSpacing: 3,
  },

  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.cyan,
    opacity: 0.04,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  xpNumber: {
    fontFamily: Fonts.orbitron,
    fontSize: 20,
    fontWeight: '900',
    color: Colors.amber,
  },
  xpLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.dim,
    letterSpacing: 1,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statVal: {
    fontFamily: Fonts.orbitron,
    fontSize: 18,
    fontWeight: '900',
  },
  statOf: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
  },
  statLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 1,
  },
});
