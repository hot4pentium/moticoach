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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  onAvatarChange: (url: string) => void;
}

export default function ProfileSheet({ visible, onClose, avatarUrl, onAvatarChange }: ProfileSheetProps) {
  const { user, notificationPrefs, setNotificationPrefs } = useAuth();
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
      if (!file || !user) return;
      setUploading(true);
      try {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url });
        onAvatarChange(url);
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
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>PROFILE</Text>
              <Text style={[styles.saveStatus, savedAt !== null && styles.saveStatusActive]}>
                {savedAt !== null ? 'SAVED' : 'SAVES AUTOMATICALLY'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={Colors.dim} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* ── Avatar ── */}
            <Text style={styles.sectionLabel}>PHOTO</Text>
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

            {/* ── Notifications ── */}
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
    width:                '100%',
    maxWidth:             600,
    backgroundColor:      '#080f22',
    borderTopLeftRadius:  Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth:          1,
    borderColor:          Colors.border2,
    maxHeight:            '85%',
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
  prefRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: Spacing.sm,
    gap:             Spacing.md,
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
});
