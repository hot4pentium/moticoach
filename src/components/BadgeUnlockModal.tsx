import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { Badge } from '../lib/badges';

// Stage images for the MOTI character displayed during unlock
const MOTI_IMAGES = [
  require('../../assets/MOTIS/0-MOTI.png'),
  require('../../assets/MOTIS/1-MOTi.png'),
  require('../../assets/MOTIS/2-MOTI.png'),
  require('../../assets/MOTIS/3-MOTI.png'),
  require('../../assets/MOTIS/4-MOTI.png'),
  require('../../assets/MOTIS/5-MOTI.png'),
];

// Stage-specific intro videos — swap each entry for the real asset when ready
// Expected files: assets/MOTIS/0-IGNITE.mp4 … 4-PRIME.mp4
const MOTI_VIDEOS = [
  require('../../assets/MOTI-Small-File.mp4'), // 0 · IGNITE
  require('../../assets/MOTI-Small-File.mp4'), // 1 · CORE
  require('../../assets/MOTI-Small-File.mp4'), // 2 · REACH
  require('../../assets/MOTI-Small-File.mp4'), // 3 · STRIDE
  require('../../assets/MOTI-Small-File.mp4'), // 4 · PRIME
];

interface BadgeUnlockModalProps {
  badge: Badge | null;
  motiStage: number;
  onDismiss: () => void;
}

export default function BadgeUnlockModal({ badge, motiStage, onDismiss }: BadgeUnlockModalProps) {
  const videoOpacity  = useRef(new Animated.Value(1)).current;
  const badgeOpacity  = useRef(new Animated.Value(0)).current;
  const badgeScale    = useRef(new Animated.Value(0.4)).current;
  const btnOpacity    = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(
    MOTI_VIDEOS[motiStage] ?? MOTI_VIDEOS[0],
    p => {
      p.loop  = false;
      p.muted = true;
    }
  );

  // Reset animations and replay video each time badge changes
  useEffect(() => {
    if (!badge) return;

    videoOpacity.setValue(1);
    badgeOpacity.setValue(0);
    badgeScale.setValue(0.4);
    btnOpacity.setValue(0);

    player.replay();

    const sub = player.addListener('playToEnd', () => {
      // Fade out MOTI video
      Animated.timing(videoOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Reveal badge
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
        // Show dismiss button after badge fully revealed
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    });

    return () => sub.remove();
  }, [badge]);

  const categoryLabel = badge ? {
    stage: 'MOTI STAGE',
    xp:    'XP MILESTONE',
    games: 'GAME TRACKER',
    sport: 'SPORT',
  }[badge.category] : '';

  return (
    <Modal visible={!!badge} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* MOTI character + video */}
          <View style={styles.motiWrap}>
            <Image
              source={MOTI_IMAGES[motiStage] ?? MOTI_IMAGES[0]}
              style={styles.motiImage}
              resizeMode="contain"
            />
            <Animated.View style={[styles.videoWrap, { opacity: videoOpacity }]}>
              <VideoView
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls={false}
              />
            </Animated.View>
          </View>

          {/* Badge reveal */}
          <Animated.View style={[
            styles.badgeReveal,
            { opacity: badgeOpacity, transform: [{ scale: badgeScale }] },
          ]}>
            {/* Badge circle */}
            <View style={[styles.badgeCircle, { borderColor: badge?.color ?? Colors.cyan }]}>
              {badge && (
                <MaterialCommunityIcons
                  name={badge.icon as any}
                  size={38}
                  color={badge.color}
                />
              )}
            </View>

            {/* Category pill */}
            <View style={[styles.categoryPill, { borderColor: badge?.color ?? Colors.cyan }]}>
              <Text style={[styles.categoryText, { color: badge?.color ?? Colors.cyan }]}>
                {categoryLabel}
              </Text>
            </View>

            {/* Badge name */}
            <Text style={[styles.badgeName, { color: badge?.color ?? Colors.cyan }]}>
              {badge?.name}
            </Text>

            {/* Description */}
            <Text style={styles.badgeDesc}>{badge?.description}</Text>
          </Animated.View>

          {/* Dismiss button */}
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
    alignItems:     'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical:   Spacing.xxl,
    gap:            Spacing.lg,
  },
  motiWrap: {
    width:  180,
    height: 240,
    alignItems:     'center',
    justifyContent: 'flex-end',
    overflow:       'hidden',
  },
  motiImage: {
    width:    180,
    height:   224,
    position: 'absolute',
    bottom:   0,
  },
  videoWrap: {
    position: 'absolute',
    bottom:   0,
    width:    180,
    height:   224,
  },
  video: { width: '100%', height: '100%' },

  badgeReveal: {
    alignItems: 'center',
    gap:        Spacing.sm,
  },
  badgeCircle: {
    width:           90,
    height:          90,
    borderRadius:    45,
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
    fontFamily:    Fonts.orbitron,
    fontSize:      22,
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
