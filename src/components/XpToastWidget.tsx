import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius } from '../theme';
import { useCoach } from '../context/CoachContext';

export default function XpToastWidget() {
  const { xpToast, clearXpToast } = useCoach();
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const [displayXp, setDisplayXp] = useState(0);
  const [label, setLabel]         = useState('');

  useEffect(() => {
    if (!xpToast) return;

    // Reset
    fadeAnim.setValue(0);
    counterAnim.setValue(0);
    setDisplayXp(xpToast.prevXp);
    setLabel(xpToast.label);

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Counter animation (useNativeDriver: false because we read the value)
    const listenerId = counterAnim.addListener(({ value }) => {
      setDisplayXp(Math.round(xpToast.prevXp + value * xpToast.amount));
    });
    Animated.timing(counterAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: false,
    }).start();

    // Auto-dismiss after 3s
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => clearXpToast());
    }, 3000);

    return () => {
      clearTimeout(timer);
      counterAnim.removeListener(listenerId);
    };
  }, [xpToast]);

  if (!xpToast) return null;

  return (
    <Animated.View style={[styles.circle, { opacity: fadeAnim }]}>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={styles.xpNumber}>{displayXp}</Text>
      <Text style={styles.xpSuffix}>XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    bottom: 82,
    left: 16,
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: `${Colors.cyan}55`,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    gap: 1,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 6,
    color: Colors.cyan,
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  xpNumber: {
    fontFamily: Fonts.orbitron,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cyan,
    lineHeight: 20,
  },
  xpSuffix: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 1,
  },
});
