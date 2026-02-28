import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';

const STORAGE_KEY = 'install_prompt_dismissed';

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPromptBanner() {
  const [visible,     setVisible]     = useState(false);
  const [isIOS,       setIsIOS]       = useState(false);
  const [deferredEvt, setDeferredEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    if (localStorage.getItem(STORAGE_KEY)) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      setVisible(true);
    } else {
      const handler = (e: BeforeInstallPromptEvent) => {
        e.preventDefault();
        setDeferredEvt(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredEvt) {
      await deferredEvt.prompt();
      const { outcome } = await deferredEvt.userChoice;
      if (outcome === 'accepted') dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Tap outside to dismiss */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismiss} activeOpacity={1} />

        <View style={styles.card}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={10}>
            <Ionicons name="close" size={20} color={Colors.muted} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={48} color={Colors.cyan} />
          </View>

          <Text style={styles.title}>Install LeagueMatrix</Text>
          <Text style={styles.subtitle}>
            Add to your home screen to enable push notifications and the full app experience.
          </Text>

          {isIOS ? (
            <>
              <View style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                <Text style={styles.stepText}>
                  Tap <Text style={styles.highlight}>Share</Text> at the bottom of Safari
                </Text>
              </View>
              <View style={styles.step}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                <Text style={styles.stepText}>
                  Select <Text style={styles.highlight}>Add to Home Screen</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryBtn} onPress={dismiss} activeOpacity={0.8}>
                <Text style={styles.primaryBtnText}>GOT IT</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleInstall} activeOpacity={0.8}>
                <Ionicons name="download-outline" size={18} color="#000" style={{ marginRight: Spacing.xs }} />
                <Text style={styles.primaryBtnText}>INSTALL APP</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={dismiss} style={styles.notNowBtn}>
                <Text style={styles.notNowText}>Not now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.cyan}18`,
    borderWidth: 1,
    borderColor: `${Colors.cyan}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.orbitron,
    fontSize: 16,
    color: Colors.text,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.rajdhani,
    fontSize: 15,
    color: Colors.dim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    alignSelf: 'stretch',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${Colors.cyan}22`,
    borderWidth: 1,
    borderColor: `${Colors.cyan}55`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    fontFamily: Fonts.monoBold,
    fontSize: 12,
    color: Colors.cyan,
  },
  stepText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    lineHeight: 20,
  },
  highlight: {
    color: Colors.cyan,
    fontFamily: Fonts.rajdhaniBold,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cyan,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  primaryBtnText: {
    fontFamily: Fonts.orbitron,
    fontSize: 12,
    color: '#000',
    letterSpacing: 1.5,
  },
  notNowBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  notNowText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.muted,
  },
});
