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
import BadgeShelf from '../components/BadgeShelf';
import { ALL_BADGES } from '../lib/badges';

export default function AchievementsScreen() {
  const { earnedBadges, gamesTracked } = useCoach();
  const total = ALL_BADGES.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>SEASON BADGES</Text>
            <View style={styles.progressPill}>
              <Text style={styles.progressText}>{earnedBadges.length}/{total}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="trophy-outline" size={18} color={Colors.amber} />
              <Text style={[styles.statVal, { color: Colors.amber }]}>
                {earnedBadges.length}
                <Text style={styles.statOf}>/{total}</Text>
              </Text>
              <Text style={styles.statLabel}>BADGES EARNED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="chart-bar" size={18} color={Colors.cyan} />
              <Text style={[styles.statVal, { color: Colors.cyan }]}>{gamesTracked}</Text>
              <Text style={styles.statLabel}>GAMES TRACKED</Text>
            </View>
          </View>

          {/* Badge shelf */}
          <BadgeShelf earnedBadges={earnedBadges} />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll:    { paddingBottom: 32 },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
    paddingBottom:     Spacing.sm,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing.sm,
  },
  title: {
    fontFamily:    Fonts.rajdhaniBold,
    fontSize:      22,
    color:         Colors.text,
    letterSpacing: 2,
  },
  progressPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.border,
    backgroundColor:   'rgba(0,0,0,0.3)',
  },
  progressText: {
    fontFamily: Fonts.mono,
    fontSize:   10,
    color:      Colors.dim,
  },

  statsRow: {
    flexDirection:   'row',
    marginHorizontal: Spacing.xl,
    marginTop:        Spacing.md,
    marginBottom:     Spacing.sm,
    backgroundColor:  Colors.card,
    borderWidth:      1,
    borderColor:      Colors.border,
    borderRadius:     Radius.md,
    paddingVertical:  Spacing.md,
  },
  statCard: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  statDivider: {
    width:           1,
    backgroundColor: Colors.border,
    marginVertical:  4,
  },
  statVal: {
    fontFamily:  Fonts.rajdhaniBold,
    fontSize:    22,
  },
  statOf: {
    fontFamily: Fonts.mono,
    fontSize:   11,
    color:      Colors.muted,
  },
  statLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      8,
    color:         Colors.muted,
    letterSpacing: 1,
  },
});
