import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '../theme';

export interface TargetLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  visible: boolean;
  step: number;
  totalSteps: number;
  title: string;
  body: string;
  targetLayout: TargetLayout | null;
  arrowSide: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onDismiss: () => void;
}

const CARD_WIDTH   = 260;
const ARROW_SIZE   = 9;
const RING_PAD     = 8;

export default function OnboardingTooltip({
  visible, step, totalSteps, title, body,
  targetLayout, arrowSide, onNext, onDismiss,
}: Props) {
  const { width: sw, height: sh } = useWindowDimensions();
  const isLast = step === totalSteps - 1;

  const tl = targetLayout;

  // ── Four-piece overlay (leaves target area clear) ─────────────────────────
  const rx = tl ? tl.x - RING_PAD             : 0;
  const ry = tl ? tl.y - RING_PAD             : 0;
  const rw = tl ? tl.width  + RING_PAD * 2    : sw;
  const rh = tl ? tl.height + RING_PAD * 2    : sh;

  // ── Callout card position ─────────────────────────────────────────────────
  let cardStyle: object = { top: sh / 2 - 80, left: sw / 2 - CARD_WIDTH / 2 };
  let arrowStyle: object = {};

  if (tl) {
    const cx       = tl.x + tl.width  / 2;
    const cardLeft = Math.max(12, Math.min(cx - CARD_WIDTH / 2, sw - CARD_WIDTH - 12));

    if (arrowSide === 'top') {
      const cardTop = ry + rh + ARROW_SIZE + 6;
      cardStyle  = { top: cardTop, left: cardLeft };
      arrowStyle = { top: -ARROW_SIZE, left: cx - cardLeft - ARROW_SIZE,
        borderBottomColor: Colors.border2,
        borderTopWidth: 0, borderBottomWidth: ARROW_SIZE,
        borderLeftWidth: ARROW_SIZE, borderRightWidth: ARROW_SIZE };

    } else if (arrowSide === 'bottom') {
      cardStyle  = { bottom: sh - ry + ARROW_SIZE + 6, left: cardLeft };
      arrowStyle = { bottom: -ARROW_SIZE, left: cx - cardLeft - ARROW_SIZE,
        borderTopColor: Colors.border2,
        borderBottomWidth: 0, borderTopWidth: ARROW_SIZE,
        borderLeftWidth: ARROW_SIZE, borderRightWidth: ARROW_SIZE };

    } else if (arrowSide === 'left') {
      const cardTop = Math.max(12, tl.y + tl.height / 2 - 60);
      cardStyle  = { top: cardTop, left: rx + rw + ARROW_SIZE + 6 };
      arrowStyle = { left: -ARROW_SIZE, top: tl.y + tl.height / 2 - cardTop - ARROW_SIZE,
        borderRightColor: Colors.border2,
        borderLeftWidth: 0, borderRightWidth: ARROW_SIZE,
        borderTopWidth: ARROW_SIZE, borderBottomWidth: ARROW_SIZE };

    } else {
      const cardTop = Math.max(12, tl.y + tl.height / 2 - 60);
      cardStyle  = { top: cardTop, right: sw - rx + ARROW_SIZE + 6 };
      arrowStyle = { right: -ARROW_SIZE, top: tl.y + tl.height / 2 - cardTop - ARROW_SIZE,
        borderLeftColor: Colors.border2,
        borderRightWidth: 0, borderLeftWidth: ARROW_SIZE,
        borderTopWidth: ARROW_SIZE, borderBottomWidth: ARROW_SIZE };
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>

      {tl ? (
        // Four-piece overlay — target area stays bright
        <>
          {/* top */}
          <View style={[styles.dim, { top: 0, left: 0, right: 0, height: ry }]} />
          {/* left */}
          <View style={[styles.dim, { top: ry, left: 0, width: rx, height: rh }]} />
          {/* right */}
          <View style={[styles.dim, { top: ry, left: rx + rw, right: 0, height: rh }]} />
          {/* bottom */}
          <View style={[styles.dim, { top: ry + rh, left: 0, right: 0, bottom: 0 }]} />

          {/* Highlight ring border */}
          <View style={[styles.ring, { left: rx, top: ry, width: rw, height: rh }]} />
        </>
      ) : (
        <View style={styles.fullDim} />
      )}

      {/* Callout card */}
      <View style={[styles.card, { width: CARD_WIDTH }, cardStyle]}>
        {tl && <View style={[styles.arrow, arrowStyle]} />}

        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardBody}>{body}</Text>

        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={styles.skipBtn}>SKIP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextBtnText}>{isLast ? 'GOT IT' : 'NEXT →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const DIM = 'rgba(0,0,0,0.78)';

const styles = StyleSheet.create({
  dim:     { position: 'absolute', backgroundColor: DIM },
  fullDim: { ...StyleSheet.absoluteFillObject, backgroundColor: DIM },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.cyan,
    borderRadius: Radius.md,
  },
  card: {
    position: 'absolute',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  cardTitle: {
    fontFamily: Fonts.orbitron,
    fontSize: 11,
    color: Colors.cyan,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  cardBody: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 14,
  },
  dots:       { flexDirection: 'row', gap: 5, marginBottom: 14 },
  dot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border2 },
  dotActive:  { backgroundColor: Colors.cyan },
  btnRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipBtn:    { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  nextBtn:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: `${Colors.cyan}55`, backgroundColor: 'rgba(0,212,255,0.12)' },
  nextBtnText:{ fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan, letterSpacing: 1 },
});
