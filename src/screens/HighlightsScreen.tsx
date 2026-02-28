import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';

// ─── Mock data ────────────────────────────────────────────────────────────────

type HighlightRole = 'athlete' | 'supporter';
type ActionType = 'GOAL' | 'SAVE' | 'ASSIST' | 'MOMENT' | 'BIG PLAY' | 'PREGAME';

interface Highlight {
  id: string;
  title: string;
  player: string;
  jersey?: number;
  role: HighlightRole;
  action: ActionType;
  emoji: string;
  date: string;
  game: string;
  likes: number;
}

const ACTION_COLOR: Record<ActionType, string> = {
  'GOAL':     Colors.green,
  'SAVE':     Colors.blue,
  'ASSIST':   Colors.cyan,
  'MOMENT':   Colors.purple,
  'BIG PLAY': Colors.amber,
  'PREGAME':  Colors.muted,
};

const MOCK_HIGHLIGHTS: Highlight[] = [
  { id: '1', title: 'Screamer from outside the box!',       player: 'Luis Garcia',   jersey: 9,  role: 'athlete',   action: 'GOAL',     emoji: '⚽', date: 'FEB 22', game: 'vs Eagles SC',      likes: 14 },
  { id: '2', title: 'Fingertip save in the 89th minute',   player: 'James Porter',  jersey: 1,  role: 'athlete',   action: 'SAVE',     emoji: '🧤', date: 'FEB 22', game: 'vs Eagles SC',      likes: 9  },
  { id: '3', title: 'Full team celebration after the win', player: 'Lisa Porter',   jersey: 0,  role: 'supporter', action: 'MOMENT',   emoji: '🎉', date: 'FEB 22', game: 'vs Eagles SC',      likes: 27 },
  { id: '4', title: 'Perfect through ball, clinical finish', player: 'Aiden Cole',  jersey: 8,  role: 'athlete',   action: 'ASSIST',   emoji: '⚡', date: 'FEB 22', game: 'vs Eagles SC',      likes: 18 },
  { id: '5', title: 'Warmup energy before the match',      player: 'Greg Mendez',   jersey: 0,  role: 'supporter', action: 'PREGAME',  emoji: '📸', date: 'FEB 15', game: 'vs Storm United',   likes: 11 },
  { id: '6', title: '40-yard strike, top corner!',         player: 'Ryan Zhang',    jersey: 10, role: 'athlete',   action: 'GOAL',     emoji: '⚽', date: 'FEB 15', game: 'vs Storm United',   likes: 31 },
  { id: '7', title: 'Cracking free kick drill in training', player: 'Noah Banks',   jersey: 7,  role: 'athlete',   action: 'BIG PLAY', emoji: '🔥', date: 'FEB 12', game: 'Training',          likes: 7  },
  { id: '8', title: 'Parent section going crazy!',         player: 'Sarah Thompson', jersey: 0, role: 'supporter', action: 'MOMENT',   emoji: '📣', date: 'FEB 8',  game: 'vs North Eagles',   likes: 22 },
];

type FilterTab = 'all' | 'athlete' | 'supporter';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HighlightsScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = filter === 'all'
    ? MOCK_HIGHLIGHTS
    : MOCK_HIGHLIGHTS.filter(h => h.role === filter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

          {/* Hero */}
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={HeroText.secondary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTag}>COMMUNITY  🎬</Text>
                <Text style={styles.heroTitle}>Highlights</Text>
                <Text style={styles.heroSub}>
                  Moments uploaded by athletes &amp; supporters
                </Text>
              </View>
            </View>

            {/* Upload note */}
            <View style={styles.uploadNote}>
              <Ionicons name="cloud-upload-outline" size={14} color={HeroText.secondary} />
              <Text style={styles.uploadNoteText}>
                Athletes &amp; supporters upload via their app
              </Text>
            </View>
          </LinearGradient>

          {/* Filter tabs */}
          <View style={styles.tabBar}>
            {(['all', 'athlete', 'supporter'] as FilterTab[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tabItem, filter === t && styles.tabItemActive]}
                onPress={() => setFilter(t)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, filter === t && styles.tabLabelActive]}>
                  {t === 'all' ? 'ALL' : t === 'athlete' ? 'ATHLETES' : 'SUPPORTERS'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>{filtered.length} CLIPS</Text>
          </View>

          {/* Highlight feed */}
          <View style={styles.feed}>
            {filtered.map(h => {
              const accentColor = ACTION_COLOR[h.action];
              return (
                <View key={h.id} style={styles.card}>
                  {/* Thumbnail placeholder */}
                  <View style={[styles.thumbnail, { backgroundColor: `${accentColor}12` }]}>
                    {/* Color accent top bar */}
                    <View style={[styles.thumbBar, { backgroundColor: accentColor }]} />
                    <Text style={styles.thumbEmoji}>{h.emoji}</Text>
                    {/* Action badge */}
                    <View style={[styles.actionBadge, { backgroundColor: accentColor }]}>
                      <Text style={styles.actionBadgeText}>{h.action}</Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{h.title}</Text>

                    {/* Player + game */}
                    <View style={styles.cardMeta}>
                      {/* Role indicator */}
                      <View style={[
                        styles.roleBadge,
                        { backgroundColor: h.role === 'athlete' ? `${Colors.cyan}14` : `${Colors.purple}14`,
                          borderColor:     h.role === 'athlete' ?  Colors.cyan + '44' :  Colors.purple + '44' },
                      ]}>
                        <Ionicons
                          name={h.role === 'athlete' ? 'person-outline' : 'heart-outline'}
                          size={9}
                          color={h.role === 'athlete' ? Colors.cyan : Colors.purple}
                        />
                        <Text style={[styles.roleText, { color: h.role === 'athlete' ? Colors.cyan : Colors.purple }]}>
                          {h.role === 'athlete' ? 'ATHLETE' : 'SUPPORTER'}
                        </Text>
                      </View>

                      {h.jersey ? (
                        <Text style={styles.jerseyText}>#{h.jersey}</Text>
                      ) : null}
                      <Text style={styles.playerName}>{h.player}</Text>
                    </View>

                    {/* Game + date + likes */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardGame}>{h.game}  ·  {h.date}</Text>
                      <View style={styles.likesRow}>
                        <Ionicons name="heart-outline" size={12} color={Colors.muted} />
                        <Text style={styles.likesCount}>{h.likes}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
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
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderRadius: 24,
    gap: Spacing.md,
    boxShadow: '0 12px 40px rgba(21,101,192,0.4), 0 4px 14px rgba(0,0,0,0.2)' as any,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: HeroText.secondary,
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  heroTitle: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 28,
    color: HeroText.primary,
    lineHeight: 32,
  },
  heroSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: HeroText.secondary,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  uploadNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  uploadNoteText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: HeroText.secondary,
    letterSpacing: 0.3,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
    boxShadow: 'inset 0 2px 6px rgba(0,50,150,0.06)' as any,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  tabItemActive: { backgroundColor: Colors.blue },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 1,
  },
  tabLabelActive: { color: '#fff' },

  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 4,
  },
  countText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1.5,
  },

  // Feed
  feed: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    boxShadow: 'inset 0 2px 8px rgba(0,50,150,0.08), inset 0 -1px 4px rgba(255,255,255,0.7), 0 2px 6px rgba(0,0,0,0.04)' as any,
  },

  // Thumbnail
  thumbnail: {
    width: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative' as any,
  },
  thumbBar: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0,
    height: 3,
  },
  thumbEmoji: {
    fontSize: 30,
  },
  actionBadge: {
    position: 'absolute' as any,
    bottom: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 6,
    color: '#fff',
    letterSpacing: 0.5,
    fontWeight: '700',
  },

  // Card body
  cardBody: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 5,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: Fonts.mono,
    fontSize: 6,
    letterSpacing: 0.5,
  },
  jerseyText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
  },
  playerName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 13,
    color: Colors.dim,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardGame: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  likesCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
  },
});
