import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { clearBadge } from '../lib/notifications';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: any;
}

// ─── Role colours ─────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, string> = {
  coach:     Colors.cyan,
  staff:     Colors.blue,
  supporter: Colors.amber,
  athlete:   Colors.green,
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const navigation    = useNavigation<any>();
  const insets        = useSafeAreaInsets();
  const { user, role, teamCode, displayName } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState('');

  // Clear app badge when chat is opened
  useEffect(() => { clearBadge(); }, []);

  // ─── Subscribe to group chat messages ──────────────────────────────────────
  useEffect(() => {
    if (!teamCode) return;
    const q = query(
      collection(db, 'teamChats', teamCode, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100),
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [teamCode]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !teamCode || !user) return;
    setText('');
    await addDoc(collection(db, 'teamChats', teamCode, 'messages'), {
      senderId:   user.uid,
      senderName: displayName ?? user.email ?? 'Unknown',
      senderRole: role ?? 'supporter',
      text:       trimmed,
      createdAt:  serverTimestamp(),
      readBy:     [user.uid],
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            League<Text style={{ color: Colors.cyan }}>Matrix</Text>
          </Text>
          <Text style={styles.headerSub}>TEAM CHAT</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.dmBtn}
            onPress={() => navigation.navigate('DMList')}
            hitSlop={8}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={Colors.cyan} />
            <Text style={styles.dmBtnLabel}>DMs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut(auth)} style={styles.exitBtn} hitSlop={8}>
            <Text style={styles.exitBtnText}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages + input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages yet.</Text>
            <Text style={styles.emptySub}>Be the first to say something!</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={m => m.id}
            inverted
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MessageBubble item={item} myUid={user?.uid ?? ''} />
            )}
          />
        )}

        {/* Input row */}
        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message the team…"
            placeholderTextColor={Colors.muted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!text.trim()}
          >
            <Ionicons
              name="send"
              size={18}
              color={text.trim() ? Colors.bg : Colors.muted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ item, myUid }: { item: Message; myUid: string }) {
  const isOwn      = item.senderId === myUid;
  const roleColor  = ROLE_COLOR[item.senderRole] ?? Colors.dim;
  const timeStr    = item.createdAt?.toDate?.()?.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  }) ?? '';

  return (
    <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
      {!isOwn && (
        <View style={styles.senderMeta}>
          <Text style={styles.senderName}>{item.senderName}</Text>
          <View style={[styles.roleChip, { borderColor: roleColor + '55', backgroundColor: roleColor + '15' }]}>
            <Text style={[styles.roleChipText, { color: roleColor }]}>
              {item.senderRole.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && styles.bubbleTextOwn]}>
          {item.text}
        </Text>
      </View>
      {timeStr !== '' && (
        <Text style={[styles.msgTime, isOwn && styles.msgTimeOwn]}>{timeStr}</Text>
      )}
    </View>
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
  logo: {
    fontFamily: Fonts.orbitron,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: 3,
  },
  headerSub: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.07)',
  },
  dmBtnLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.cyan,
    letterSpacing: 1,
  },
  exitBtn: { paddingHorizontal: 8, paddingVertical: 3 },
  exitBtnText: { fontSize: 15, color: Colors.muted },

  list: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontFamily: Fonts.orbitron,
    fontSize: 13,
    color: Colors.dim,
    letterSpacing: 1,
  },
  emptySub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.5,
  },

  msgRow: {
    marginBottom: 14,
    alignItems: 'flex-start',
    maxWidth: '80%',
  },
  msgRowOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  senderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderName: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 0.5,
  },
  roleChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  roleChipText: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    maxWidth: '100%',
  },
  bubbleOwn: {
    backgroundColor: Colors.cyan,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'rgba(12,22,50,0.95)',
    borderWidth: 1,
    borderColor: Colors.border2,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: Fonts.rajdhani,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
  },
  bubbleTextOwn: { color: Colors.bg },
  msgTime: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.muted,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  msgTimeOwn: { alignSelf: 'flex-end' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontFamily: Fonts.rajdhani,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
