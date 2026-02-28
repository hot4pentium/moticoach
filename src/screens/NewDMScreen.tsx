import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { getDmConversationId, canDM } from '../lib/dmUtils';
import type { UserRole } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamMember {
  uid: string;
  displayName: string;
  role: UserRole;
}

const ROLE_COLOR: Record<string, string> = {
  coach:     Colors.cyan,
  staff:     Colors.blue,
  supporter: Colors.amber,
  athlete:   Colors.green,
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function NewDMScreen() {
  const navigation                        = useNavigation<any>();
  const { user, role, teamCode, displayName } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!teamCode || !role || !user) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'users'), where('teamCode', '==', teamCode))
        );
        const result: TeamMember[] = [];
        snap.forEach(d => {
          if (d.id === user.uid) return;                        // exclude self
          const memberRole = d.data().role as UserRole;
          if (!canDM(role, memberRole)) return;                // DM permission check
          result.push({
            uid:         d.id,
            displayName: d.data().displayName ?? d.data().email ?? 'Unknown',
            role:        memberRole,
          });
        });
        setMembers(result);
      } catch (e: any) {
        setError('Could not load team members. Make sure a Firestore index exists for teamCode.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamCode, role, user]);

  const openConversation = async (member: TeamMember) => {
    if (!user || !role) return;
    const convId = getDmConversationId(user.uid, member.uid);

    // Create conversation doc if it doesn't exist (merge so existing data is preserved)
    await setDoc(doc(db, 'dmConversations', convId), {
      participants:     [user.uid, member.uid],
      participantRoles: {
        [user.uid]:    role,
        [member.uid]:  member.role,
      },
      participantNames: {
        [user.uid]:    displayName ?? user.email ?? 'Unknown',
        [member.uid]:  member.displayName,
      },
      updatedAt:   serverTimestamp(),
      lastMessage: '',
      lastSenderId: '',
    }, { merge: true });

    navigation.replace('DMConversation', {
      conversationId: convId,
      otherName:      member.displayName,
      otherRole:      member.role,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW MESSAGE</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%', flex: 1 }}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.cyan} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : members.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>NO TEAMMATES AVAILABLE</Text>
          <Text style={styles.emptySub}>There's nobody to DM yet.</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={m => m.uid}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const roleColor = ROLE_COLOR[item.role] ?? Colors.dim;
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.75}
                onPress={() => openConversation(item)}
              >
                <View style={[styles.avatar, { borderColor: roleColor + '66' }]}>
                  <Text style={[styles.avatarText, { color: roleColor }]}>
                    {item.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.displayName}</Text>
                  <View style={[styles.roleChip, { borderColor: roleColor + '44', backgroundColor: roleColor + '12' }]}>
                    <Text style={[styles.roleChipText, { color: roleColor }]}>
                      {item.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.muted} />
              </TouchableOpacity>
            );
          }}
        />
      )}
      </View>
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

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.red,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: {
    fontFamily: Fonts.orbitron,
    fontSize: 11,
    color: Colors.dim,
    letterSpacing: 2,
  },
  emptySub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
  },

  list: { paddingVertical: Spacing.sm },

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
  rowInfo: { flex: 1, gap: 4 },
  rowName: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  roleChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
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
});
