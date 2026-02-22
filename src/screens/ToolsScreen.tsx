import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - Spacing.xl * 2 - Spacing.md) / 2;

type Tool = {
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  screen?: string;
};

const TOOLS: Tool[] = [
  {
    label: 'Playmaker',
    sub: 'Build plays & formations',
    icon: 'easel-outline',
    color: Colors.cyan,
    screen: 'Playmaker',
  },
  {
    label: 'Roster',
    sub: 'Manage your players',
    icon: 'people-outline',
    color: Colors.blue,
    screen: 'Roster',
  },
  {
    label: 'Highlights',
    sub: 'Review key moments',
    icon: 'film-outline',
    color: Colors.purple,
  },
  {
    label: 'Prep Book',
    sub: 'Game-day preparation',
    icon: 'book-outline',
    color: Colors.amber,
    screen: 'PrepBook',
  },
];

export default function ToolsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>TOOLS</Text>
        <Text style={styles.sub}>Coach utilities</Text>
      </View>

      <View style={styles.grid}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.label}
            style={[styles.card, { borderColor: `${tool.color}33` }]}
            activeOpacity={tool.screen ? 0.75 : 0.5}
            onPress={() => tool.screen && navigation.navigate(tool.screen)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${tool.color}14` }]}>
              <Ionicons name={tool.icon} size={28} color={tool.color} />
            </View>
            <Text style={[styles.cardLabel, { color: tool.color }]}>{tool.label}</Text>
            <Text style={styles.cardSub}>{tool.sub}</Text>
            {!tool.screen && (
              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>SOON</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Stat Tracker — full-width horizontal card */}
      <TouchableOpacity style={styles.wideCard} activeOpacity={0.75} onPress={() => navigation.navigate('StatTrackerSetup')}>
        <View style={[styles.wideIconWrap, { backgroundColor: `${Colors.green}14` }]}>
          <Ionicons name="bar-chart-outline" size={28} color={Colors.green} />
        </View>
        <View style={styles.wideInfo}>
          <Text style={[styles.cardLabel, { color: Colors.green }]}>Stat Tracker</Text>
          <Text style={styles.cardSub}>Record &amp; review game statistics</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color={Colors.muted} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 3,
  },
  sub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 1.5,
    marginTop: 3,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    width: CARD_SIZE,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardLabel: {
    fontFamily: Fonts.orbitron,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  wideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: `${Colors.green}33`,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  wideIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideInfo: { flex: 1 },

  comingSoon: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(60,130,255,0.08)',
  },
  comingSoonText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    letterSpacing: 1,
  },
});
