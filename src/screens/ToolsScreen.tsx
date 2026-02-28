import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';

// ─── Tool definitions ─────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Tool = {
  label: string;
  sub: string;
  icon: IoniconsName;
  color: string;
  screen?: string;
  badge?: string;
};

const ACTIVE_TOOLS: Tool[] = [
  { label: 'Playmaker',    sub: 'Build plays & formations',   icon: 'easel-outline',     color: Colors.cyan,  screen: 'Playmaker' },
  { label: 'Roster',       sub: 'Manage your players',        icon: 'people-outline',    color: Colors.blue,  screen: 'Roster' },
  { label: 'Stat Tracker', sub: 'Record & review team stats', icon: 'bar-chart-outline', color: Colors.green, screen: 'StatTrackerSetup' },
];

const ADDON_TOOLS: Tool[] = [
  { label: 'Prep Book',   sub: 'Game-day preparation steps',  icon: 'book-outline',  color: Colors.amber,  badge: 'ADD-ON' },
  { label: 'Highlights',  sub: 'Review & share key moments',  icon: 'film-outline',  color: Colors.purple, badge: 'COMING SOON' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

          {/* Hero banner */}
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroIconWrap}>
              <Ionicons name="construct-outline" size={28} color={HeroText.primary} />
            </View>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTag}>COACH TOOLS</Text>
              <Text style={styles.heroTitle}>Everything you need{'\n'}on game day</Text>
            </View>
          </LinearGradient>

          {/* Active tools */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INCLUDED</Text>
            {ACTIVE_TOOLS.map((tool) => (
              <TouchableOpacity
                key={tool.label}
                style={styles.toolRow}
                activeOpacity={0.78}
                onPress={() => tool.screen && navigation.navigate(tool.screen)}
              >
                {/* Left accent */}
                <View style={[styles.accentBar, { backgroundColor: tool.color }]} />

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: `${tool.color}18` }]}>
                  <Ionicons name={tool.icon} size={24} color={tool.color} />
                </View>

                {/* Text */}
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolLabel, { color: tool.color }]}>{tool.label}</Text>
                  <Text style={styles.toolSub}>{tool.sub}</Text>
                </View>

                {/* Arrow */}
                <Ionicons name="chevron-forward" size={18} color={Colors.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Add-on tools */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADD-ONS</Text>
            {ADDON_TOOLS.map((tool) => (
              <View key={tool.label} style={[styles.toolRow, styles.toolRowLocked]}>
                {/* Dim accent */}
                <View style={[styles.accentBar, { backgroundColor: tool.color, opacity: 0.35 }]} />

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: `${tool.color}0e` }]}>
                  <Ionicons name={tool.icon} size={24} color={`${tool.color}88`} />
                </View>

                {/* Text */}
                <View style={styles.toolInfo}>
                  <Text style={[styles.toolLabel, { color: `${tool.color}88` }]}>{tool.label}</Text>
                  <Text style={[styles.toolSub, { opacity: 0.5 }]}>{tool.sub}</Text>
                </View>

                {/* Badge */}
                <View style={[styles.addonBadge, { borderColor: `${tool.color}44`, backgroundColor: `${tool.color}0d` }]}>
                  <Ionicons name="lock-closed-outline" size={9} color={`${tool.color}88`} style={{ marginRight: 3 }} />
                  <Text style={[styles.addonBadgeText, { color: `${tool.color}88` }]}>{tool.badge}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    backgroundImage: 'radial-gradient(rgba(37,99,235,0.13) 1.5px, transparent 1.5px)' as any,
    backgroundSize: '22px 22px' as any,
  },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 48,
    borderRadius: 28,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    gap: Spacing.lg,
    boxShadow: '0 12px 40px rgba(21,101,192,0.4), 0 4px 14px rgba(0,0,0,0.2)' as any,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  heroTextWrap: { flex: 1 },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: HeroText.secondary,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 22,
    color: HeroText.primary,
    lineHeight: 26,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },

  // Tool row
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    paddingRight: Spacing.lg,
    paddingVertical: Spacing.md,
    overflow: 'hidden',
    gap: Spacing.md,
    boxShadow: 'inset 0 2px 8px rgba(0,50,150,0.08), inset 0 -1px 4px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.05)' as any,
  },
  toolRowLocked: {
    opacity: 0.85,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: { flex: 1 },
  toolLabel: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 18,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  toolSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 0.3,
  },

  // Add-on badge
  addonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  addonBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.8,
  },
});
