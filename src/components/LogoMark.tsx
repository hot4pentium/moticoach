import React from 'react';
import { View, Image } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

// No-BG.png is 1320×880. The logo content (M icon + "LEAGUE MATRIX" text) sits
// roughly in the vertical band 39%–63% of the image (24% of total height).
// We size the image so that band equals the desired visible height, then use
// overflow:hidden + a negative marginTop to crop off the top padding.
const SIZES: Record<Size, { visH: number; imgH: number; imgW: number; marginTop: number }> = {
  sm: { visH: 60, imgH: 250, imgW: 375, marginTop: -98 },
  md: { visH: 72, imgH: 300, imgW: 450, marginTop: -117 },
  lg: { visH: 90, imgH: 375, imgW: 562, marginTop: -146 },
};

export default function LogoMark({ size = 'sm' }: { size?: Size }) {
  const { visH, imgH, imgW, marginTop } = SIZES[size];
  return (
    <View style={{ height: visH, width: imgW, maxWidth: '100%', overflow: 'hidden', flexShrink: 1 }}>
      <Image
        source={require('../../assets/Logos/No-BG.png')}
        style={{ width: imgW, height: imgH, marginTop }}
        resizeMode="stretch"
      />
    </View>
  );
}
