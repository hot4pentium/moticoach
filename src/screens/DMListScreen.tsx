import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DMConversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantRoles: Record<string, string>;
  lastMessage: string;
  lastSenderId: string;
  updatedAt: any;
}

// ─── Role colours ─────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  coach:     Colors.cyan,
  staff:     Colors.blue,
  supporter: Colors.amber,
  athlete:   Colors.green,
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DMListScreen() {
  const navigation = useNavigation<any>();
  const { user }   = useAuth();

  const [convos, setConvos] = useState<DMConversation[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'dmConversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc'),
    );
    return onSnapshot(q, snap => {
      setConvos(snap.docs.map(d => ({ id: d.id, ...d.data() } as DMConversation)));
    });
  }, [user]);

  const getOther = (conv: DMConversation) => {
    const otherUid  = conv.participants.find(p => p !== user?.uid) ?? '';
    const otherName = conv.participantNames?.[otherUid] ?? 'Unknown';
    const otherRole = conv.participantRoles?.[otherUid] ?? 'supporter';
    return { otherUid, otherName, otherRole };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DIRECT MESSAGES</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('NewDM')}
          hitSlop={8}
        >
          <Ionicons name="add" size={20} color={Colors.cyan} />
        </TouchableOpacity>
      </View>

      {convos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✉️</Text>
          <Text style={styles.emptyText}>NO MESSAGES YET</Text>
          <Text style={styles.emptySub}>Tap + to start a conversation</Text>
        </View>
      ) : (
        <FlatList
          data={convos}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const { otherName, otherRole } = getOther(item);
            const roleColor = ROLE_COLOR[otherRole] ?? Colors.dim;
            const timeStr   = item.updatedAt?.toDate?.()?.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            }) ?? '';
            const isUnread  = item.lastSenderId !== user?.uid;

            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate('DMConversation', {
                    conversationId: item.id,
                    otherName,
                    otherRole,
                  })
                }
              >
                {/* Avatar */}
                <View style={[styles.avatar, { borderColor: roleColor + '66' }]}>
                  <Text style={[styles.avatarText, { color: roleColor }]}>
                    {otherName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                {/* Content */}
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowName, isUnread && styles.rowNameUnread]}>
                      {otherName}
                    </Text>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowTime}>{timeStr}</Text>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                  <View style={styles.rowBottom}>
                    <View style={[styles.roleChip, { borderColor: roleColor + '44', backgroundColor: roleColor + '12' }]}>
                      <Text style={[styles.roleChipText, { color: roleColor }]}>
                        {otherRole.toUpperCase()}
                      </Text>
                    </View>
                    {item.lastMessage ? (
                      <Text style={styles.rowPreview} numberOfLines={1}>
                        {item.lastMessage}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  headerTitle: {
    fontFamily: Fonts.orbitron,
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 2,
  },
  newBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { paddingVertical: Spacing.sm },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontFamily: Fonts.orbitron,
    fontSize: 12,
    color: Colors.dim,
    letterSpacing: 2,
  },
  emptySub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.orbitron,
    fontSize: 16,
  },
  rowContent: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rowName: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.dim,
    letterSpacing: 0.5,
  },
  rowNameUnread: { color: Colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowTime: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.cyan,
  },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  roleChipText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  rowPreview: {
    flex: 1,
    fontFamily: Fonts.rajdhani,
    fontSize: 12,
    color: Colors.muted,
  },
});
