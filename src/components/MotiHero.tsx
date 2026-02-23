import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Colors, Fonts } from '../theme';

// All stage images pre-required so the bundler can resolve them statically
const MOTI_IMAGES = [
  require('../../assets/MOTIS/0-MOTI.png'),
  require('../../assets/MOTIS/1-MOTi.png'),
  require('../../assets/MOTIS/2-MOTI.png'),
  require('../../assets/MOTIS/3-MOTI.png'),
  require('../../assets/MOTIS/4-MOTI.png'),
  require('../../assets/MOTIS/5-MOTI.png'),
];

interface MotiHeroProps {
  motiStage: number;
}

/**
 * Reusable MOTI hero widget.
 * Plays the intro video on mount; fades to the correct stage still image when done.
 * Tap to replay.
 */
export default function MotiHero({ motiStage }: MotiHeroProps) {
  const videoOpacity = useRef(new Animated.Value(1)).current;

  const player = useVideoPlayer(
    require('../../assets/MOTI-Small-File.mp4'),
    p => {
      p.loop   = false;
      p.muted  = true;
      p.play();
    }
  );

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      Animated.timing(videoOpacity, {
        toValue:         0,
        duration:        700,
        useNativeDriver: true,
      }).start();
    });
    return () => sub.remove();
  }, [player]);

  const handlePress = () => {
    videoOpacity.setValue(1);
    player.replay();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.wrap}>
        {/* Stage-correct still image — always visible underneath */}
        <Image
          source={MOTI_IMAGES[motiStage] ?? MOTI_IMAGES[0]}
          style={styles.image}
          resizeMode="contain"
        />
        {/* Intro video on top — fades out when playback ends */}
        <Animated.View style={[styles.videoWrap, { opacity: videoOpacity }]}>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls={false}
          />
        </Animated.View>
        <Text style={styles.label}>PROTO · LV{motiStage + 1}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width:           120,
    height:          190,
    alignItems:      'center',
    justifyContent:  'flex-end',
    paddingBottom:   4,
    backgroundColor: '#000',
    overflow:        'hidden',
  },
  image: {
    width:    120,
    height:   178,
    position: 'absolute',
    bottom:   18,
  },
  videoWrap: {
    position: 'absolute',
    bottom:   18,
    width:    120,
    height:   178,
  },
  video: { width: '100%', height: '100%' },
  label: {
    fontFamily:    Fonts.mono,
    fontSize:      8,
    color:         Colors.dim,
    letterSpacing: 1,
    marginTop:     4,
  },
});
