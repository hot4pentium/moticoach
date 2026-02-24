import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { ALL_BADGES } from '../lib/badges';

interface BadgeShelfProps {
  earnedBadges: string[];
}

export default function BadgeShelf({ earnedBadges }: BadgeShelfProps) {
  const earnedSet = new Set(earnedBadges);
  const count = earnedBadges.length;
  const total = ALL_BADGES.length;

  // Most recently earned first, then locked badges in default order
  const sorted = [
    ...[...earnedBadges].reverse().map(id => ALL_BADGES.find(b => b.id === id)!),
    ...ALL_BADGES.filter(b => !earnedSet.has(b.id)),
  ];

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>TEAM BADGES</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{count}/{total}</Text>
        </View>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sorted.map(badge => {
          const earned = earnedSet.has(badge.id);
          return (
            <View
              key={badge.id}
              style={[
                styles.card,
                earned
                  ? { borderColor: badge.color + '60' }
                  : styles.cardLocked,
              ]}
            >
              {/* Icon circle */}
              <View style={[
                styles.iconCircle,
                earned
                  ? { backgroundColor: badge.color + '18', borderColor: badge.color + '70' }
                  : styles.iconCircleLocked,
              ]}>
                {earned ? (
                  <MaterialCommunityIcons
                    name={badge.icon as any}
                    size={22}
                    color={badge.color}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="lock"
                    size={18}
                    color={Colors.muted}
                  />
                )}
              </View>

              {/* Name */}
              <Text
                style={[styles.name, earned ? { color: badge.color } : styles.nameLocked]}
                numberOfLines={2}
              >
                {earned ? badge.name : '???'}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom:   Spacing.sm,
  },
  headerLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      10,
    color:         Colors.dim,
    letterSpacing: 2,
  },
  countPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.muted,
    backgroundColor:   'rgba(0,0,0,0.3)',
  },
  countText: {
    fontFamily: Fonts.mono,
    fontSize:   9,
    color:      Colors.muted,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap:               Spacing.sm,
  },
  card: {
    width:           68,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius:    Radius.md,
    borderWidth:     1,
    backgroundColor: 'rgba(10,18,36,0.85)',
    alignItems:      'center',
    gap:             Spacing.xs,
  },
  cardLocked: {
    borderColor: Colors.muted + '40',
  },
  iconCircle: {
    width:        44,
    height:       44,
    borderRadius: 22,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
  },
  iconCircleLocked: {
    backgroundColor: 'rgba(40,60,100,0.2)',
    borderColor:     Colors.muted + '30',
  },
  name: {
    fontFamily:  Fonts.mono,
    fontSize:    8,
    letterSpacing: 0.5,
    textAlign:   'center',
    lineHeight:  11,
  },
  nameLocked: {
    color: Colors.muted,
  },
});
