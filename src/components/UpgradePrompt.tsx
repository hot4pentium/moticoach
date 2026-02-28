import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';

interface UpgradePromptProps {
  visible: boolean;
  featureName: string;
  description?: string;
  onDismiss: () => void;
}

export default function UpgradePrompt({ visible, featureName, description, onDismiss }: UpgradePromptProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          <View style={styles.iconWrap}>
            <Ionicons name="lock-closed" size={32} color={Colors.cyan} />
          </View>

          <View style={styles.pill}>
            <Text style={styles.pillText}>PRO FEATURE</Text>
          </View>

          <Text style={styles.featureName}>{featureName}</Text>

          {description && (
            <Text style={styles.description}>{description}</Text>
          )}

          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.85}>
            <Text style={styles.upgradeBtnText}>UPGRADE</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn} activeOpacity={0.7}>
            <Text style={styles.dismissText}>NOT NOW</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: Spacing.xl,
  },
  container: {
    width:             '100%',
    maxWidth:          400,
    backgroundColor:   Colors.card,
    borderRadius:      Radius.lg,
    borderWidth:       1,
    borderColor:       `${Colors.cyan}33`,
    padding:           Spacing.xxl,
    alignItems:        'center',
    gap:               Spacing.md,
  },
  iconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    borderWidth:     1,
    borderColor:     `${Colors.cyan}44`,
    backgroundColor: `${Colors.cyan}10`,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xs,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   3,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       `${Colors.cyan}55`,
    backgroundColor:   `${Colors.cyan}10`,
  },
  pillText: {
    fontFamily:    Fonts.mono,
    fontSize:      9,
    color:         Colors.cyan,
    letterSpacing: 2,
  },
  featureName: {
    fontFamily:    Fonts.rajdhaniBold,
    fontSize:      22,
    color:         Colors.text,
    letterSpacing: 1,
    textAlign:     'center',
  },
  description: {
    fontFamily: Fonts.mono,
    fontSize:   11,
    color:      Colors.dim,
    textAlign:  'center',
    lineHeight: 17,
  },
  upgradeBtn: {
    width:           '100%',
    paddingVertical: Spacing.md,
    borderRadius:    Radius.md,
    backgroundColor: Colors.cyan,
    alignItems:      'center',
    marginTop:       Spacing.xs,
  },
  upgradeBtnText: {
    fontFamily:    Fonts.rajdhaniBold,
    fontSize:      16,
    color:         '#000',
    letterSpacing: 2,
  },
  dismissBtn: {
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    fontFamily:    Fonts.mono,
    fontSize:      10,
    color:         Colors.muted,
    letterSpacing: 1.5,
  },
});
