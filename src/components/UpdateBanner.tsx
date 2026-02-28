import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Fonts, Spacing } from '../theme';
import { useSwUpdate } from '../lib/useSwUpdate';

/**
 * Shows a slim banner at the top of the screen when a new app version is
 * available. Tapping it triggers the service worker update + page reload.
 *
 * Only renders on web.
 */
export default function UpdateBanner() {
  const { needsUpdate, applyUpdate } = useSwUpdate();

  if (!needsUpdate || Platform.OS !== 'web') return null;

  return (
    <TouchableOpacity style={styles.banner} onPress={applyUpdate} activeOpacity={0.85}>
      <Text style={styles.text}>
        ⚡ New version available —{' '}
        <Text style={styles.link}>tap to update</Text>
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Colors.cyan,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    // web-only z-index so it sits above everything
    ...(Platform.OS === 'web' ? { zIndex: 9999 } : {}),
  },
  text: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: '#000',
    letterSpacing: 0.5,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
