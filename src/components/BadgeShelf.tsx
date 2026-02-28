import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { ALL_BADGES, Badge } from '../lib/badges';

interface BadgeShelfProps {
  earnedBadges: string[];
  onBadgePress?: (badge: Badge) => void;
}

export default function BadgeShelf({ earnedBadges, onBadgePress }: BadgeShelfProps) {
  const earnedSet = new Set(earnedBadges);
  const count = earnedBadges.length;
  const total = ALL_BADGES.length;

  const sorted = [
    ...[...earnedBadges].reverse()
      .map(id => ALL_BADGES.find(b => b.id === id))
      .filter((b): b is Badge => b !== undefined),
    ...ALL_BADGES.filter(b => !earnedSet.has(b.id)),
  ];

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>TEAM BADGES</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{count}/{total}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {sorted.map(badge => {
          const earned = earnedSet.has(badge.id);
          const Wrapper = earned ? TouchableOpacity : View;
          return (
            <Wrapper
              key={badge.id}
              style={[styles.card, earned ? { borderColor: badge.color + '60' } : styles.cardLocked]}
              {...(earned ? { onPress: () => onBadgePress?.(badge), activeOpacity: 0.75 } : {})}
            >
              <View style={[
                styles.iconCircle,
                earned
                  ? { backgroundColor: badge.color + '18', borderColor: badge.color + '70' }
                  : styles.iconCircleLocked,
              ]}>
                {earned ? (
                  <MaterialCommunityIcons name={badge.icon as any} size={20} color={badge.color} />
                ) : (
                  <MaterialCommunityIcons name="lock" size={16} color={Colors.muted} />
                )}
              </View>
              <Text
                style={[styles.name, earned ? { color: badge.color } : styles.nameLocked]}
                numberOfLines={2}
              >
                {earned ? badge.name : '???'}
              </Text>
            </Wrapper>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
  },
  countPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgDeep,
  },
  countText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  card: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.card,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardLocked: {
    borderColor: Colors.border,
    backgroundColor: Colors.bgDeep,
    opacity: 0.4,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleLocked: {
    backgroundColor: Colors.bgDeep,
    borderColor: Colors.border,
  },
  name: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 10,
  },
  nameLocked: {
    color: Colors.muted,
  },
});
