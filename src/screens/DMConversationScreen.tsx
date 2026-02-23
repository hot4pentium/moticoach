import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

const ROLE_COLOR: Record<string, string> = {
  coach:     Colors.cyan,
  staff:     Colors.blue,
  supporter: Colors.amber,
  athlete:   Colors.green,
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DMConversationScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const insets     = useSafeAreaInsets();

  const { conversationId, otherName, otherRole } = route.params as {
    conversationId: string;
    otherName: string;
    otherRole: string;
  };

  const { user, displayName } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text,     setText]     = useState('');

  // ─── Subscribe to messages ──────────────────────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, 'dmConversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100),
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
  }, [conversationId]);

  // ─── Send message ──────────────────────────────────────────────────────────
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setText('');

    const msgRef = collection(db, 'dmConversations', conversationId, 'messages');
    await addDoc(msgRef, {
      senderId:   user.uid,
      senderName: displayName ?? user.email ?? 'Unknown',
      text:       trimmed,
      createdAt:  serverTimestamp(),
      readBy:     [user.uid],
    });

    // Update conversation meta
    await updateDoc(doc(db, 'dmConversations', conversationId), {
      updatedAt:    serverTimestamp(),
      lastMessage:  trimmed,
      lastSenderId: user.uid,
    });
  };

  const otherRoleColor = ROLE_COLOR[otherRole] ?? Colors.dim;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{otherName}</Text>
          <View style={[styles.roleChip, { borderColor: otherRoleColor + '55', backgroundColor: otherRoleColor + '15' }]}>
            <Text style={[styles.roleChipText, { color: otherRoleColor }]}>
              {otherRole.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={{ width: 22 }} />
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
            <Text style={styles.emptyText}>Start the conversation</Text>
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
            placeholder={`Message ${otherName}…`}
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
  const isOwn  = item.senderId === myUid;
  const timeStr = item.createdAt?.toDate?.()?.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  }) ?? '';

  return (
    <View style={[styles.msgRow, isOwn && styles.msgRowOwn]}>
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
    gap: 8,
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerName: {
    fontFamily: Fonts.orbitron,
    fontSize: 12,
    color: Colors.text,
    letterSpacing: 1.5,
  },
  roleChip: {
    paddingHorizontal: 8,
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

  list: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyIcon: { fontSize: 36 },
  emptyText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
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
  bubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
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
