import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useCoach } from '../context/CoachContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Badge icons ──────────────────────────────────────────────────────────────

const BADGE_ICONS = [
  { key: 'sword-cross',    label: 'SWORDS'    },
  { key: 'lightning-bolt', label: 'LIGHTNING' },
  { key: 'fire',           label: 'FLAME'     },
  { key: 'crown',          label: 'CROWN'     },
  { key: 'rocket-launch',  label: 'ROCKET'    },
  { key: 'shield',         label: 'SHIELD'    },
  { key: 'trophy',         label: 'TROPHY'    },
];

// ─── Badge colors ─────────────────────────────────────────────────────────────

const BADGE_COLORS = [
  Colors.cyan,
  Colors.amber,
  Colors.green,
  Colors.red,
  Colors.blue,
  Colors.purple,
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TeamSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function TeamSettingsSheet({ visible, onClose }: TeamSettingsSheetProps) {
  const { user, teamCode, notificationPrefs, setNotificationPrefs } = useAuth();
  const { avatarUrl, badgeIcon, badgeColor, setAvatarUrl, setBadgeIcon, setBadgeColor } = useCoach();
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt]     = useState<number | null>(null);
  const saveTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashSaved = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSavedAt(Date.now());
    saveTimerRef.current = setTimeout(() => setSavedAt(null), 1500);
  };

  const handlePickPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const storageRef = ref(storage, `avatars/${teamCode ?? 'unknown'}.jpg`);
        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);
        setAvatarUrl(downloadUrl);
      } catch (_e) {
        // silently ignore upload errors
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleTogglePref = async (key: 'email' | 'push', val: boolean) => {
    flashSaved();
    const updated = { ...notificationPrefs, [key]: val };
    setNotificationPrefs(updated);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { [`notificationPrefs.${key}`]: val }).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>TEAM SETTINGS</Text>
              <Text style={[styles.saveStatus, savedAt !== null && styles.saveStatusActive]}>
                {savedAt !== null ? 'SAVED' : 'SAVES AUTOMATICALLY'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.dim} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Section 1: Coach Photo ── */}
            <Text style={styles.sectionLabel}>COACH PHOTO</Text>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person-circle-outline" size={64} color={Colors.dim} />
                )}
                {uploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color={Colors.cyan} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.changePhotoBtn}
                onPress={handlePickPhoto}
                disabled={uploading}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={14} color={Colors.cyan} />
                <Text style={styles.changePhotoText}>CHANGE PHOTO</Text>
              </TouchableOpacity>
            </View>

            {/* ── Section 2: Team Badge ── */}
            <Text style={styles.sectionLabel}>TEAM BADGE</Text>
            <View style={styles.iconRow}>
              {BADGE_ICONS.map(({ key, label }) => {
                const active = badgeIcon === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.iconBtn,
                      active && { borderColor: badgeColor, backgroundColor: badgeColor + '18' },
                    ]}
                    onPress={() => { setBadgeIcon(key); flashSaved(); }}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={key as any}
                      size={24}
                      color={active ? badgeColor : Colors.muted}
                    />
                    <Text style={[styles.iconLabel, active && { color: badgeColor }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Section 3: Badge Color ── */}
            <Text style={styles.sectionLabel}>BADGE COLOR</Text>
            <View style={styles.colorRow}>
              {BADGE_COLORS.map(color => {
                const active = badgeColor === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorSwatch, { backgroundColor: color }, active && styles.colorSwatchActive]}
                    onPress={() => { setBadgeColor(color); flashSaved(); }}
                    activeOpacity={0.8}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={16} color="#000" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Section 4: Notifications ── */}
            <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefTitle}>Email</Text>
                <Text style={styles.prefDesc}>Get emailed when there's a new team message</Text>
              </View>
              <Switch
                value={notificationPrefs.email}
                onValueChange={val => handleTogglePref('email', val)}
                trackColor={{ false: Colors.border2, true: `${Colors.cyan}55` }}
                thumbColor={notificationPrefs.email ? Colors.cyan : Colors.muted}
              />
            </View>
            <View style={styles.prefRow}>
              <View style={styles.prefText}>
                <Text style={styles.prefTitle}>Push</Text>
                <Text style={styles.prefDesc}>Get notified when the app is in the background</Text>
              </View>
              <Switch
                value={notificationPrefs.push}
                onValueChange={val => handleTogglePref('push', val)}
                trackColor={{ false: Colors.border2, true: `${Colors.cyan}55` }}
                thumbColor={notificationPrefs.push ? Colors.cyan : Colors.muted}
              />
            </View>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    justifyContent:  'flex-end',
    alignItems:      'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    width:              '100%',
    maxWidth:           600,
    backgroundColor:    '#080f22',
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth:        1,
    borderColor:        Colors.border2,
    maxHeight:          '85%',
  },
  handle: {
    width:           36,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.border2,
    alignSelf:       'center',
    marginTop:       12,
    marginBottom:    4,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily:    Fonts.rajdhaniBold,
    fontSize:      16,
    color:         Colors.text,
    letterSpacing: 2,
  },
  saveStatus: {
    fontFamily:    Fonts.mono,
    fontSize:      9,
    color:         Colors.muted,
    letterSpacing: 1,
    marginTop:     3,
  },
  saveStatusActive: {
    color: Colors.green,
  },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop:        Spacing.lg,
  },
  sectionLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      9,
    color:         Colors.dim,
    letterSpacing: 2,
    marginBottom:  Spacing.sm,
    marginTop:     Spacing.lg,
  },

  // Avatar
  avatarRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.lg,
  },
  avatarCircle: {
    width:           72,
    height:          72,
    borderRadius:    36,
    borderWidth:     1,
    borderColor:     Colors.border2,
    backgroundColor: Colors.card,
    alignItems:      'center',
    justifyContent:  'center',
    overflow:        'hidden',
  },
  avatarImage: {
    width:  72,
    height: 72,
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  changePhotoBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1,
    borderColor:       `${Colors.cyan}55`,
    backgroundColor:   `${Colors.cyan}0d`,
  },
  changePhotoText: {
    fontFamily:    Fonts.mono,
    fontSize:      10,
    color:         Colors.cyan,
    letterSpacing: 1,
  },

  // Icon picker
  iconRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  iconBtn: {
    alignItems:        'center',
    justifyContent:    'center',
    gap:               4,
    paddingVertical:   Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius:      Radius.md,
    borderWidth:       1,
    borderColor:       Colors.border,
    backgroundColor:   Colors.card,
    minWidth:          64,
  },
  iconLabel: {
    fontFamily:    Fonts.mono,
    fontSize:      7,
    color:         Colors.muted,
    letterSpacing: 0.5,
  },

  // Notification prefs
  prefRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap:            Spacing.md,
  },
  prefText: {
    flex: 1,
  },
  prefTitle: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize:   15,
    color:      Colors.text,
  },
  prefDesc: {
    fontFamily: Fonts.rajdhani,
    fontSize:   13,
    color:      Colors.dim,
    marginTop:  2,
  },

  // Color swatches
  colorRow: {
    flexDirection: 'row',
    gap:           10,
    flexWrap:      'wrap',
  },
  colorSwatch: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
