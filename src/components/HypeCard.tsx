import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HypeAthlete {
  id: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  sport: string;
  stats: { label: string; val: string; accent?: boolean }[];
}

export interface HypeGame {
  title: string;
  date: string;
  time: string;
  isHome: boolean;
}

interface FeedItem {
  emoji: string;
  text: string;
  ts: string;
}

// ─── Sport cheers ─────────────────────────────────────────────────────────────

const SPORT_CHEERS: Record<string, { emoji: string; text: string }[]> = {
  soccer: [
    { emoji: '⚽', text: 'Great touch!' },
    { emoji: '🔥', text: 'On fire!' },
    { emoji: '💪', text: 'Unstoppable!' },
    { emoji: '🎯', text: 'Pinpoint!' },
    { emoji: '🦁', text: 'Pure heart!' },
    { emoji: '👑', text: 'Baller!' },
  ],
  basketball: [
    { emoji: '🏀', text: 'Nice bucket!' },
    { emoji: '🔥', text: "Can't stop!" },
    { emoji: '💪', text: 'D up!' },
    { emoji: '🎯', text: 'Splash!' },
    { emoji: '⚡', text: 'Lightning!' },
    { emoji: '👑', text: 'King of the court!' },
  ],
  football: [
    { emoji: '🏈', text: 'Great play!' },
    { emoji: '🔥', text: 'Fired up!' },
    { emoji: '💪', text: 'Dominating!' },
    { emoji: '🎯', text: 'Laser throw!' },
    { emoji: '⚡', text: 'Speed demon!' },
    { emoji: '👑', text: 'MVP move!' },
  ],
  baseball: [
    { emoji: '⚾', text: 'Nice hit!' },
    { emoji: '🔥', text: 'On a roll!' },
    { emoji: '💪', text: 'Crushing it!' },
    { emoji: '🎯', text: 'Perfect pitch!' },
    { emoji: '⚡', text: 'Speed!' },
    { emoji: '👑', text: 'All-star!' },
  ],
  volleyball: [
    { emoji: '🏐', text: 'Ace!' },
    { emoji: '🔥', text: 'On fire!' },
    { emoji: '💪', text: 'Beast mode!' },
    { emoji: '🎯', text: 'Perfect set!' },
    { emoji: '⚡', text: 'Unstoppable!' },
    { emoji: '👑', text: 'Dominating!' },
  ],
};

const DEFAULT_CHEERS = SPORT_CHEERS.soccer;

const CARD_W = 244;
const CARD_H = 370;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HypeCard({
  athlete,
  upcomingGames,
  teamCode,
}: {
  athlete: HypeAthlete;
  upcomingGames: HypeGame[];
  teamCode?: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showingBack, setShowingBack] = useState(false);
  const [sentSet, setSentSet] = useState<Set<number>>(new Set());
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const cheers = SPORT_CHEERS[athlete.sport] ?? DEFAULT_CHEERS;

  const flip = () => {
    Animated.timing(scaleAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setShowingBack(prev => !prev);
      Animated.timing(scaleAnim, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    });
  };

  const sendCheer = (idx: number) => {
    if (sentSet.has(idx)) return;
    const cheer = cheers[idx];
    setSentSet(prev => new Set(prev).add(idx));
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setFeed(prev => [{ emoji: cheer.emoji, text: cheer.text, ts }, ...prev]);
  };

  const shareCard = () => {
    const url = teamCode
      ? `https://leaguematrix.com/card/${teamCode}/${athlete.id}`
      : `https://leaguematrix.com`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${athlete.firstName} ${athlete.lastName} · HYPE Card`,
        text: `Check out ${athlete.firstName}'s HYPE card on LeagueMatrix!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  };

  return (
    <Animated.View style={[s.scene, { transform: [{ scaleX: scaleAnim }] }]}>
      {!showingBack ? <FrontFace athlete={athlete} onFlip={flip} onShare={shareCard} /> : (
        <BackFace
          athlete={athlete}
          upcomingGames={upcomingGames}
          cheers={cheers}
          sentSet={sentSet}
          feed={feed}
          onFlip={flip}
          onCheer={sendCheer}
        />
      )}
    </Animated.View>
  );
}

// ─── Front face ───────────────────────────────────────────────────────────────

function FrontFace({ athlete, onFlip, onShare }: { athlete: HypeAthlete; onFlip: () => void; onShare: () => void }) {
  const initials = `${athlete.firstName[0]}${athlete.lastName[0]}`;

  return (
    <TouchableOpacity style={s.front} onPress={onFlip} activeOpacity={0.95}>
      <LinearGradient
        colors={['#243044', '#1a2332', '#111b28']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Gold border */}
      <View style={s.goldBorder} pointerEvents="none" />

      {/* Top row */}
      <View style={s.frontTopRow}>
        <Text style={s.seasonTag}>2025 · 26</Text>
        <View style={s.topRight}>
          <TouchableOpacity onPress={onShare} hitSlop={8} style={s.shareBtn}>
            <Text style={s.shareIcon}>⬆</Text>
          </TouchableOpacity>
          <View style={s.sportBadge}>
            <Text style={s.sportBadgeText}>{athlete.sport.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Jersey watermark */}
      <Text style={s.jerseyWm}>{athlete.jersey}</Text>

      {/* Avatar */}
      <View style={s.avatarZone}>
        <View style={s.avatarGlow} />
        <View style={s.avatarCircle}>
          <Text style={s.avatarInitials}>{initials}</Text>
        </View>
      </View>

      {/* Name */}
      <View style={s.namePlate}>
        <Text style={s.firstName}>{athlete.firstName}</Text>
        <Text style={s.lastName}>{athlete.lastName}</Text>
        <View style={s.posRow}>
          <Text style={s.jerseyChip}>#{athlete.jersey}</Text>
          <Text style={s.posDot}>·</Text>
          <Text style={s.posText}>{athlete.position.toUpperCase()}</Text>
        </View>
      </View>

      {/* Stat strip */}
      <View style={s.statStrip}>
        {athlete.stats.map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <View style={s.statDivider} />}
            <View style={s.statItem}>
              <Text style={[s.statVal, stat.accent && s.statValGold]}>{stat.val}</Text>
              <Text style={s.statLbl}>{stat.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      <Text style={s.flipHint}>FLIP →</Text>
    </TouchableOpacity>
  );
}

// ─── Back face ────────────────────────────────────────────────────────────────

function BackFace({
  athlete,
  upcomingGames,
  cheers,
  sentSet,
  feed,
  onFlip,
  onCheer,
}: {
  athlete: HypeAthlete;
  upcomingGames: HypeGame[];
  cheers: { emoji: string; text: string }[];
  sentSet: Set<number>;
  feed: FeedItem[];
  onFlip: () => void;
  onCheer: (i: number) => void;
}) {
  return (
    <View style={s.back}>
      {/* Header */}
      <View style={s.backHeader}>
        <View>
          <Text style={s.backName}>{athlete.firstName} {athlete.lastName}</Text>
          <Text style={s.backSub}>#{athlete.jersey} · {athlete.position}</Text>
        </View>
        <TouchableOpacity onPress={onFlip} style={s.backFlipBtn}>
          <Text style={s.backFlipBtnText}>↩ FLIP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.backScroll} showsVerticalScrollIndicator={false}>
        {/* Upcoming games */}
        <Text style={s.sectionLbl}>UPCOMING</Text>
        {upcomingGames.slice(0, 3).map((g, i) => (
          <View key={i} style={s.gameRow}>
            <Text style={s.gameDateText}>{g.date}</Text>
            <View style={s.gameInfo}>
              <Text style={s.gameTitle} numberOfLines={1}>{g.title}</Text>
              <Text style={s.gameMeta}>{g.time}</Text>
            </View>
            <View style={[s.gameTag, g.isHome ? s.homeTag : s.awayTag]}>
              <Text style={[s.gameTagText, { color: g.isHome ? Colors.cyan : Colors.amber }]}>
                {g.isHome ? 'HOME' : 'AWAY'}
              </Text>
            </View>
          </View>
        ))}

        {/* Cheer grid */}
        <Text style={[s.sectionLbl, { marginTop: 12 }]}>GAME-DAY CHEER</Text>
        <View style={s.cheerGrid}>
          {cheers.map((c, i) => {
            const sent = sentSet.has(i);
            return (
              <TouchableOpacity
                key={i}
                style={[s.cheerBtn, sent && s.cheerBtnSent]}
                onPress={() => onCheer(i)}
                disabled={sent}
                activeOpacity={0.7}
              >
                <Text style={s.cheerEmoji}>{c.emoji}</Text>
                <Text style={[s.cheerText, sent && s.cheerTextSent]} numberOfLines={1}>{c.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feed */}
        {feed.length > 0 && (
          <View style={s.feed}>
            {feed.slice(0, 3).map((item, i) => (
              <View key={i} style={s.feedItem}>
                <Text style={s.feedCheer}>{item.emoji} {item.text}</Text>
                <Text style={s.feedTs}>{item.ts}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scene: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },

  // Front
  front: {
    flex: 1,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  goldBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(201,151,58,0.35)',
    zIndex: 10,
  },
  frontTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    zIndex: 5,
  },
  seasonTag: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.5,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shareBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  sportBadge: {
    backgroundColor: 'rgba(201,151,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,151,58,0.4)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sportBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: '#c9973a',
    letterSpacing: 1.5,
  },
  jerseyWm: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
    fontFamily: Fonts.orbitron,
    fontSize: 80,
    color: 'rgba(255,255,255,0.04)',
    letterSpacing: -2,
    zIndex: 1,
  },
  avatarZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(201,151,58,0.07)',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 2,
    borderColor: 'rgba(201,151,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: Fonts.orbitron,
    fontSize: 26,
    color: 'rgba(201,151,58,0.85)',
    letterSpacing: 1,
  },
  namePlate: {
    paddingHorizontal: Spacing.md,
    paddingTop: 6,
    zIndex: 3,
  },
  firstName: {
    fontFamily: Fonts.rajdhani,
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    lineHeight: 15,
  },
  lastName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 22,
    color: '#fff',
    lineHeight: 24,
  },
  posRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  jerseyChip: {
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    color: '#c9973a',
    letterSpacing: 0.5,
  },
  posDot: { color: 'rgba(255,255,255,0.2)', fontSize: 10 },
  posText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
  },
  statStrip: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    marginTop: 8,
    zIndex: 3,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  statVal: {
    fontFamily: Fonts.orbitron,
    fontSize: 15,
    color: '#fff',
    lineHeight: 17,
  },
  statValGold: { color: '#c9973a' },
  statLbl: {
    fontFamily: Fonts.mono,
    fontSize: 6,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  flipHint: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: 'rgba(201,151,58,0.4)',
    letterSpacing: 1.5,
    zIndex: 5,
  },

  // Back
  back: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  backHeader: {
    backgroundColor: '#1a2332',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 14,
    color: '#fff',
    lineHeight: 16,
  },
  backSub: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: '#c9973a',
    letterSpacing: 1,
    marginTop: 1,
  },
  backFlipBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backFlipBtnText: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  backScroll: { flex: 1, padding: Spacing.sm },
  sectionLbl: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // Games
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgDeep,
    borderRadius: Radius.sm,
    padding: 7,
    marginBottom: 4,
  },
  gameDateText: {
    fontFamily: Fonts.monoBold,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 0.5,
    width: 32,
  },
  gameInfo: { flex: 1 },
  gameTitle: { fontFamily: Fonts.rajdhaniBold, fontSize: 12, color: Colors.text },
  gameMeta: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted },
  gameTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
  },
  homeTag: { borderColor: `${Colors.cyan}44`, backgroundColor: `${Colors.cyan}10` },
  awayTag: { borderColor: `${Colors.amber}44`, backgroundColor: `${Colors.amber}10` },
  gameTagText: { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 1 },

  // Cheers
  cheerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  cheerBtn: {
    width: '48%' as any,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgDeep,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },
  cheerBtnSent: {
    borderColor: `${Colors.cyan}50`,
    backgroundColor: `${Colors.cyan}0d`,
  },
  cheerEmoji: { fontSize: 13 },
  cheerText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 11,
    color: Colors.dim,
    flex: 1,
  },
  cheerTextSent: { color: Colors.cyan },

  // Feed
  feed: { gap: 3 },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.cyan}0d`,
    borderLeftWidth: 2,
    borderLeftColor: Colors.cyan,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  feedCheer: {
    fontFamily: Fonts.rajdhani,
    fontSize: 11,
    color: Colors.text,
    flex: 1,
  },
  feedTs: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
  },
});
