import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { Badge } from '../lib/badges';

interface BadgeUnlockModalProps {
  badge: Badge | null;
  onDismiss: () => void;
}

export default function BadgeUnlockModal({ badge, onDismiss }: BadgeUnlockModalProps) {
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale   = useRef(new Animated.Value(0.4)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;

    badgeOpacity.setValue(0);
    badgeScale.setValue(0.4);
    btnOpacity.setValue(0);

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [badge]);

  const categoryLabel = badge ? ({
    games:  'GAME TRACKER',
    plays:  'PLAYMAKER',
    roster: 'ROSTER',
  } as Record<string, string>)[badge.category] ?? '' : '';

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          <Text style={styles.unlockLabel}>BADGE UNLOCKED</Text>

          {/* Badge reveal */}
          <Animated.View style={[
            styles.badgeReveal,
            { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
          ]}>
            <View style={[styles.badgeCircle, { borderColor: badge?.color ?? Colors.cyan }]}>
              {badge && (
                <MaterialCommunityIcons
                  name={badge.icon as any}
                  size={44}
                  color={badge.color}
                />
              )}
            </View>

            <View style={[styles.categoryPill, { borderColor: badge?.color ?? Colors.cyan }]}>
              <Text style={[styles.categoryText, { color: badge?.color ?? Colors.cyan }]}>
                {categoryLabel}
              </Text>
            </View>

            <Text style={[styles.badgeName, { color: badge?.color ?? Colors.cyan }]}>
              {badge?.name}
            </Text>

            <Text style={styles.badgeDesc}>{badge?.description}</Text>
          </Animated.View>

          {/* Dismiss */}
          <Animated.View style={{ opacity: btnOpacity }}>
            <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} activeOpacity={0.7}>
              <Text style={styles.dismissText}>TAP TO CONTINUE</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  container: {
    alignItems:        'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical:   Spacing.xxl,
    gap:               Spacing.lg,
  },
  unlockLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      10,
    color:         Colors.muted,
    letterSpacing: 3,
  },

  badgeReveal: {
    alignItems: 'center',
    gap:        Spacing.sm,
  },
  badgeCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    borderWidth:     2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   2,
    borderRadius:      Radius.full,
    borderWidth:       1,
    backgroundColor:   'rgba(0,0,0,0.4)',
  },
  categoryText: {
    fontFamily:    Fonts.mono,
    fontSize:      9,
    letterSpacing: 2,
  },
  badgeName: {
    fontFamily:    Fonts.rajdhaniBold,
    fontSize:      28,
    letterSpacing: 2,
    marginTop:     Spacing.xs,
  },
  badgeDesc: {
    fontFamily: Fonts.mono,
    fontSize:   12,
    color:      Colors.dim,
    textAlign:  'center',
  },

  dismissBtn: {
    marginTop:         Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical:   Spacing.md,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       Colors.muted,
    backgroundColor:   'rgba(255,255,255,0.04)',
  },
  dismissText: {
    fontFamily:    Fonts.mono,
    fontSize:      11,
    color:         Colors.dim,
    letterSpacing: 2,
  },
});
