import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

const SPORT_ICON: Record<string, string> = {
  soccer:     '⚽',
  basketball: '🏀',
  football:   '🏈',
  baseball:   '⚾',
  volleyball: '🏐',
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { useCoach } from '../context/CoachContext';
import { useAuth } from '../context/AuthContext';
import { Sport } from './PlayEditorScreen';

// ─── Types ───────────────────────────────────────────────────────────────────

type MemberRole = 'athlete' | 'staff' | 'supporter';
type PlayerStatus = 'present' | 'absent' | 'injured';

interface RosterMember {
  id: string;
  name: string;
  role: MemberRole;
  jersey?: number;
  position?: string;
  status?: PlayerStatus;
  staffTitle?: string;
}

// ─── Sport Positions ─────────────────────────────────────────────────────────

const POSITIONS: Record<Sport, string[]> = {
  soccer:     ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'],
  basketball: ['PG', 'SG', 'SF', 'PF', 'C'],
  football:   ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'],
  baseball:   ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'],
  volleyball: ['S', 'OH', 'MB', 'RS', 'L'],
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: RosterMember[] = [
  // Athletes
  { id: 'a1',  role: 'athlete', name: 'James Porter',   jersey: 1,  position: 'GK',  status: 'present' },
  { id: 'a2',  role: 'athlete', name: 'Carlos Mendez',  jersey: 2,  position: 'RB',  status: 'present' },
  { id: 'a3',  role: 'athlete', name: 'Devon Wallace',  jersey: 3,  position: 'LB',  status: 'injured' },
  { id: 'a4',  role: 'athlete', name: 'Marcus Hill',    jersey: 5,  position: 'CB',  status: 'injured' },
  { id: 'a5',  role: 'athlete', name: 'Tyler Brooks',   jersey: 6,  position: 'CB',  status: 'present' },
  { id: 'a6',  role: 'athlete', name: 'Aiden Cole',     jersey: 8,  position: 'CDM', status: 'present' },
  { id: 'a7',  role: 'athlete', name: 'Ryan Zhang',     jersey: 10, position: 'CAM', status: 'present' },
  { id: 'a8',  role: 'athlete', name: 'Jordan Ellis',   jersey: 14, position: 'CM',  status: 'present' },
  { id: 'a9',  role: 'athlete', name: 'Noah Banks',     jersey: 7,  position: 'LW',  status: 'present' },
  { id: 'a10', role: 'athlete', name: 'Luis Garcia',    jersey: 9,  position: 'ST',  status: 'present' },
  { id: 'a11', role: 'athlete', name: 'Kai Thompson',   jersey: 11, position: 'RW',  status: 'present' },
  { id: 'a12', role: 'athlete', name: 'Owen Price',     jersey: 15, position: 'CM',  status: 'present' },
  { id: 'a13', role: 'athlete', name: 'Sam Rivers',     jersey: 16, position: 'ST',  status: 'present' },
  // Staff
  { id: 's1', role: 'staff', name: 'Coach Rivera',   staffTitle: 'Head Coach'       },
  { id: 's2', role: 'staff', name: 'Mike Torres',    staffTitle: 'Assistant Coach'  },
  { id: 's3', role: 'staff', name: 'Dr. Patel',      staffTitle: 'Athletic Trainer' },
  // Supporters
  { id: 'p1', role: 'supporter', name: 'Lisa Porter'    },
  { id: 'p2', role: 'supporter', name: 'Greg Mendez'    },
  { id: 'p3', role: 'supporter', name: 'Sarah Thompson' },
  { id: 'p4', role: 'supporter', name: 'David Ellis'    },
];

export const TEAM_CODE = 'RVR-2025';

type TabKey = 'all' | 'athlete' | 'staff' | 'supporter';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'ALL'      },
  { key: 'athlete',   label: 'ATHLETES' },
  { key: 'staff',     label: 'STAFF'    },
  { key: 'supporter', label: 'FANS'     },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RosterScreen() {
  const navigation = useNavigation<any>();
  const { coachSport, motiStage } = useCoach();
  const { role } = useAuth();
  const canEdit = role === 'coach' || role === 'staff';
  const [tab, setTab] = useState<TabKey>('all');
  const [members, setMembers] = useState<RosterMember[]>(MOCK_MEMBERS);
  const [profile, setProfile] = useState<RosterMember | null>(null);

  const filtered = tab === 'all' ? members : members.filter(m => m.role === tab);

  const athleteCount   = members.filter(m => m.role === 'athlete').length;
  const staffCount     = members.filter(m => m.role === 'staff').length;
  const supporterCount = members.filter(m => m.role === 'supporter').length;

  const saveProfile = (updated: RosterMember) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setProfile(updated);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>ROSTER</Text>
          <Text style={styles.headerSub}>{members.length} members</Text>
        </View>
        <View style={styles.teamCodeChip}>
          <Text style={styles.teamCodeLabel}>CODE</Text>
          <Text style={styles.teamCodeVal}>{TEAM_CODE}</Text>
        </View>
      </View>

      {/* Hero banner */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroTag}>COACH DASHBOARD</Text>
          <Text style={styles.heroName}>Riverside{'\n'}Rockets</Text>
          <View style={styles.heroTier}>
            <View style={styles.tierDot} />
            <Text style={styles.tierText}>SEASON ACTIVE</Text>
          </View>
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>
              {SPORT_ICON[coachSport] ?? '🏅'}{'  '}{coachSport.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.motiWrap}>
          <Image
            source={require('../../assets/MOTIS/0-MOTI.png')}
            style={styles.motiImg}
            resizeMode="contain"
          />
          <Text style={styles.motiLabel}>PROTO · LV{motiStage + 1}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatPill value={athleteCount}   label="Athletes"   color={Colors.cyan}   />
        <StatPill value={staffCount}     label="Staff"      color={Colors.blue}   />
        <StatPill value={supporterCount} label="Supporters" color={Colors.purple} />
      </View>

      {/* Join hint */}
      <View style={styles.joinHint}>
        <Ionicons name="link-outline" size={12} color={Colors.dim} />
        <Text style={styles.joinHintText}>
          Share code <Text style={{ color: Colors.cyan }}>{TEAM_CODE}</Text> — members auto-join on signup
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <MemberRow member={item} onPress={() => setProfile(item)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No members in this category</Text>
        }
      />

      {/* Profile Sheet */}
      <ProfileSheet
        member={profile}
        sport={coachSport}
        canEdit={canEdit}
        onClose={() => setProfile(null)}
        onSave={saveProfile}
      />

    </SafeAreaView>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({ member, onPress }: { member: RosterMember; onPress: () => void }) {
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const statusColor = member.status === 'injured' ? Colors.amber
    : member.status === 'absent'  ? Colors.red
    : Colors.green;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Left: jersey or avatar */}
      {member.role === 'athlete' ? (
        <View style={styles.jersey}>
          <Text style={styles.jerseyNum}>{member.jersey ?? '–'}</Text>
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: member.role === 'staff' ? 'rgba(61,143,255,0.15)' : 'rgba(155,89,182,0.15)' }]}>
          <Text style={[styles.avatarText, { color: member.role === 'staff' ? Colors.blue : Colors.purple }]}>
            {initials}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.sub}>
          {member.role === 'athlete'  ? (member.position ?? 'No position set')
          : member.role === 'staff'   ? (member.staffTitle ?? 'Staff')
          : 'Supporter'}
        </Text>
      </View>

      {/* Right badges */}
      <View style={styles.right}>
        {member.role === 'athlete' && (
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        )}
        {member.role === 'staff' && (
          <View style={styles.roleBadge}>
            <Text style={[styles.roleBadgeText, { color: Colors.blue }]}>STAFF</Text>
          </View>
        )}
        {member.role === 'supporter' && (
          <View style={[styles.roleBadge, { borderColor: `${Colors.purple}44` }]}>
            <Text style={[styles.roleBadgeText, { color: Colors.purple }]}>FAN</Text>
          </View>
        )}
        <Ionicons name="chevron-forward-outline" size={14} color={Colors.muted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Profile Sheet ────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<MemberRole, string> = {
  athlete:   Colors.cyan,
  staff:     Colors.blue,
  supporter: Colors.purple,
};

const STATUS_LABEL: Record<PlayerStatus, string> = {
  present: 'AVAILABLE',
  absent:  'ABSENT',
  injured: 'INJURED',
};

function ProfileSheet({
  member,
  sport,
  canEdit,
  onClose,
  onSave,
}: {
  member: RosterMember | null;
  sport: Sport;
  canEdit: boolean;
  onClose: () => void;
  onSave: (updated: RosterMember) => void;
}) {
  const [editJersey,   setEditJersey]   = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editing,      setEditing]      = useState(false);

  // Reset edit state when a new profile opens
  const prevId = React.useRef<string | null>(null);
  if (member && member.id !== prevId.current) {
    prevId.current   = member.id;
    setEditJersey(member.jersey?.toString() ?? '');
    setEditPosition(member.position ?? '');
    setEditing(false);
  }

  if (!member) return null;

  const color    = ROLE_COLOR[member.role];
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const positions = POSITIONS[sport] ?? [];

  const statusColor = member.status === 'injured' ? Colors.amber
    : member.status === 'absent'  ? Colors.red
    : Colors.green;

  const handleSave = () => {
    onSave({
      ...member,
      jersey:   editJersey ? parseInt(editJersey, 10) : member.jersey,
      position: editPosition || member.position,
    });
    setEditing(false);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrap}
      >
        <View style={styles.modal}>
          {/* Accent bar */}
          <View style={[styles.sheetAccent, { backgroundColor: color }]} />
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.profileHeader}>
            {member.role === 'athlete' ? (
              <View style={[styles.profileJersey, { borderColor: `${color}55` }]}>
                <Text style={[styles.profileJerseyNum, { color }]}>{member.jersey ?? '–'}</Text>
              </View>
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: `${color}22` }]}>
                <Text style={[styles.profileAvatarText, { color }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.profileHeaderInfo}>
              <Text style={styles.profileName}>{member.name}</Text>
              <View style={[styles.profileRoleBadge, { borderColor: `${color}44`, backgroundColor: `${color}10` }]}>
                <Text style={[styles.profileRoleText, { color }]}>
                  {member.role === 'athlete'  ? (member.position ?? 'ATHLETE')
                  : member.role === 'staff'   ? (member.staffTitle?.toUpperCase() ?? 'STAFF')
                  : 'SUPPORTER'}
                </Text>
              </View>
            </View>
          </View>

          {/* Athlete status */}
          {member.role === 'athlete' && member.status && (
            <View style={styles.statusRow}>
              <View style={[styles.statusPill, { borderColor: `${statusColor}44`, backgroundColor: `${statusColor}10` }]}>
                <View style={[styles.statusDotSm, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {STATUS_LABEL[member.status]}
                </Text>
              </View>
            </View>
          )}

          {/* Athlete: edit form */}
          {member.role === 'athlete' && editing && (
            <View style={styles.editSection}>
              <Text style={styles.fieldLabel}>JERSEY NUMBER</Text>
              <TextInput
                style={styles.numberInput}
                value={editJersey}
                onChangeText={setEditJersey}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="–"
                placeholderTextColor={Colors.muted}
              />
              <Text style={styles.fieldLabel}>POSITION</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posRow}>
                {positions.map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.posPill, editPosition === pos && styles.posPillActive]}
                    onPress={() => setEditPosition(pos)}
                  >
                    <Text style={[styles.posPillText, editPosition === pos && styles.posPillTextActive]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* XP contribution row */}
          <View style={styles.xpRow}>
            <Text style={styles.xpRowLabel}>XP CONTRIBUTION</Text>
            <Text style={styles.xpRowVal}>— this season</Text>
          </View>

          {/* Actions — coach/staff only */}
          {canEdit && (
            <View style={styles.modalBtns}>
              {member.role === 'athlete' && !editing && (
                <TouchableOpacity style={[styles.actionBtn, { borderColor: `${color}44`, backgroundColor: `${color}10` }]} onPress={() => setEditing(true)}>
                  <Text style={[styles.actionBtnText, { color }]}>✎  EDIT DETAILS</Text>
                </TouchableOpacity>
              )}
              {member.role === 'athlete' && editing && (
                <>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>SAVE</Text>
                  </TouchableOpacity>
                </>
              )}
              {member.role === 'supporter' && (
                <TouchableOpacity style={[styles.actionBtn, { borderColor: `${Colors.blue}44`, backgroundColor: `${Colors.blue}10` }]}>
                  <Text style={[styles.actionBtnText, { color: Colors.blue }]}>⬆  PROMOTE TO STAFF</Text>
                </TouchableOpacity>
              )}
              {member.role === 'staff' && (
                <TouchableOpacity style={[styles.actionBtn, { borderColor: `${Colors.red}33`, backgroundColor: `${Colors.red}08` }]}>
                  <Text style={[styles.actionBtnText, { color: Colors.red }]}>⬇  DEMOTE TO SUPPORTER</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={[styles.statPill, { borderColor: `${color}33` }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  backBtn:    { paddingVertical: 6, paddingRight: 12 },
  backText:   { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 1 },
  headerCenter: { flex: 1 },
  title:      { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, letterSpacing: 2 },
  headerSub:  { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, marginTop: 2, letterSpacing: 0.5 },
  teamCodeChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  teamCodeLabel: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.dim, letterSpacing: 1 },
  teamCodeVal:   { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.cyan, letterSpacing: 1.5 },

  hero: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: '#000',
  },
  heroLeft: { flex: 1 },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroName: {
    fontFamily: Fonts.orbitron,
    fontSize: 24,
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.07)',
    marginBottom: 6,
  },
  tierDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.cyan },
  tierText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan, letterSpacing: 1.5 },
  sportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sportBadgeText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 1 },
  motiWrap: {
    width: 120,
    height: 178,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  motiImg: { width: 120, height: 160, position: 'absolute', bottom: 18 },
  motiLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 1 },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Colors.card,
  },
  statVal:   { fontFamily: Fonts.orbitron, fontSize: 16, lineHeight: 20 },
  statLabel: { fontFamily: Fonts.mono, fontSize: 8, color: Colors.dim, letterSpacing: 0.5 },

  joinHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: 2,
  },
  joinHintText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 0.3,
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderColor: Colors.cyan,
  },
  tabText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },
  tabTextActive: { color: Colors.cyan },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: Colors.border, opacity: 0.5 },
  empty: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  jersey: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum: { fontFamily: Fonts.orbitron, fontSize: 13, color: Colors.cyan },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.orbitron, fontSize: 12 },

  info:  { flex: 1 },
  name:  { fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text, fontWeight: '600' },
  sub:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 0.5, marginTop: 1 },

  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: `${Colors.blue}44`,
  },
  roleBadgeText: { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 1 },

  // Modal
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  modal: {
    backgroundColor: '#080f22',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, letterSpacing: 1 },
  modalSub:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 0.5, marginTop: 3, marginBottom: 20 },

  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  numberInput: {
    width: 80,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(0,212,255,0.05)',
    color: Colors.cyan,
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  posRow: { gap: 8, paddingBottom: 4 },
  posPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  posPillActive: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderColor: Colors.cyan,
  },
  posPillText:       { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  posPillTextActive: { color: Colors.cyan },

  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.cyan,
    alignItems: 'center',
  },
  saveBtnText: { fontFamily: Fonts.orbitron, fontSize: 11, color: '#000', letterSpacing: 1 },

  // Profile sheet
  sheetAccent: { height: 3, width: '100%' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
    paddingBottom: 16,
  },
  profileJersey: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileJerseyNum: { fontFamily: Fonts.orbitron, fontSize: 22 },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { fontFamily: Fonts.orbitron, fontSize: 18 },
  profileHeaderInfo: { flex: 1 },
  profileName: {
    fontFamily: Fonts.rajdhani,
    fontSize: 20,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  profileRoleText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1 },

  statusRow: { marginBottom: 14 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDotSm: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1 },

  editSection: { marginBottom: 4 },

  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 4,
  },
  xpRowLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 1 },
  xpRowVal:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },

  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1 },

  closeBtn: { alignItems: 'center', paddingVertical: 14 },
  closeBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
});
