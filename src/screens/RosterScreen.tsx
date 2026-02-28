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
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';
import { useCoach } from '../context/CoachContext';
import { useAuth } from '../context/AuthContext';
import { Sport } from './PlayEditorScreen';

// ─── Types ───────────────────────────────────────────────────────────────────

type MemberRole   = 'athlete' | 'staff' | 'supporter';
type PlayerStatus = 'present' | 'absent' | 'injured';

interface RosterMember {
  id: string;
  name: string;
  role: MemberRole;
  jersey?: number;
  position?: string;
  status?: PlayerStatus;
  staffTitle?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
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
  { id: 'a1',  role: 'athlete',   name: 'James Porter',   jersey: 1,  position: 'GK',  status: 'present', parentName: 'Lisa Porter',    parentEmail: 'lisa.porter@email.com',   parentPhone: '(555) 201-4832' },
  { id: 'a2',  role: 'athlete',   name: 'Carlos Mendez',  jersey: 2,  position: 'RB',  status: 'present', parentName: 'Greg Mendez',    parentEmail: 'gmendez@email.com',       parentPhone: '(555) 348-9021' },
  { id: 'a3',  role: 'athlete',   name: 'Devon Wallace',  jersey: 3,  position: 'LB',  status: 'injured', parentName: 'Sarah Wallace',  parentEmail: 'swallace@email.com',      parentPhone: '(555) 512-7743' },
  { id: 'a4',  role: 'athlete',   name: 'Marcus Hill',    jersey: 5,  position: 'CB',  status: 'injured', parentName: 'Diane Hill',     parentEmail: 'diane.hill@email.com',    parentPhone: '(555) 667-3390' },
  { id: 'a5',  role: 'athlete',   name: 'Tyler Brooks',   jersey: 6,  position: 'CB',  status: 'present', parentName: 'Kevin Brooks',   parentEmail: 'kbrooks@email.com',       parentPhone: '(555) 789-0012' },
  { id: 'a6',  role: 'athlete',   name: 'Aiden Cole',     jersey: 8,  position: 'CDM', status: 'present' },
  { id: 'a7',  role: 'athlete',   name: 'Ryan Zhang',     jersey: 10, position: 'CAM', status: 'present' },
  { id: 'a8',  role: 'athlete',   name: 'Jordan Ellis',   jersey: 14, position: 'CM',  status: 'present', parentName: 'David Ellis',    parentEmail: 'd.ellis@email.com',       parentPhone: '(555) 423-8856' },
  { id: 'a9',  role: 'athlete',   name: 'Noah Banks',     jersey: 7,  position: 'LW',  status: 'present' },
  { id: 'a10', role: 'athlete',   name: 'Luis Garcia',    jersey: 9,  position: 'ST',  status: 'present', parentName: 'Maria Garcia',   parentEmail: 'mgarcia@email.com',       parentPhone: '(555) 334-6178' },
  { id: 'a11', role: 'athlete',   name: 'Kai Thompson',   jersey: 11, position: 'RW',  status: 'present', parentName: 'Sarah Thompson', parentEmail: 'sarah.thompson@email.com', parentPhone: '(555) 901-2245' },
  { id: 'a12', role: 'athlete',   name: 'Owen Price',     jersey: 15, position: 'CM',  status: 'present' },
  { id: 'a13', role: 'athlete',   name: 'Sam Rivers',     jersey: 16, position: 'ST',  status: 'present' },
  { id: 's1',  role: 'staff',     name: 'Coach Rivera',   staffTitle: 'Head Coach'       },
  { id: 's2',  role: 'staff',     name: 'Mike Torres',    staffTitle: 'Assistant Coach'  },
  { id: 's3',  role: 'staff',     name: 'Dr. Patel',      staffTitle: 'Athletic Trainer' },
  { id: 'p1',  role: 'supporter', name: 'Lisa Porter'    },
  { id: 'p2',  role: 'supporter', name: 'Greg Mendez'    },
  { id: 'p3',  role: 'supporter', name: 'Sarah Thompson' },
  { id: 'p4',  role: 'supporter', name: 'David Ellis'    },
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
  const { coachSport } = useCoach();
  const { role } = useAuth();
  const canEdit = role === 'coach' || role === 'staff';
  const [tab,     setTab]     = useState<TabKey>('all');
  const [members, setMembers] = useState<RosterMember[]>(MOCK_MEMBERS);
  const [profile, setProfile] = useState<RosterMember | null>(null);

  const filtered       = tab === 'all' ? members : members.filter(m => m.role === tab);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={18} color={Colors.blue} />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ROSTER</Text>
        <View style={styles.teamCodeChip}>
          <Text style={styles.teamCodeLabel}>CODE</Text>
          <Text style={styles.teamCodeVal}>{TEAM_CODE}</Text>
        </View>
      </View>

      {/* Hero banner */}
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroLeft}>
          <Text style={styles.heroTag}>TEAM ROSTER</Text>
          <Text style={styles.heroName}>Riverside{'\n'}Rockets</Text>
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>
              {SPORT_ICON[coachSport] ?? '🏅'}{'  '}{coachSport.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.heroRight}>
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>{athleteCount}</Text>
            <Text style={styles.heroStatLabel}>ATHLETES</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>{staffCount}</Text>
            <Text style={styles.heroStatLabel}>STAFF</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatBlock}>
            <Text style={styles.heroStatNum}>{supporterCount}</Text>
            <Text style={styles.heroStatLabel}>FANS</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Join hint */}
      <View style={styles.joinHint}>
        <Ionicons name="link-outline" size={12} color={Colors.blue} />
        <Text style={styles.joinHintText}>
          Share code <Text style={{ color: Colors.blue, fontFamily: Fonts.monoBold }}>{TEAM_CODE}</Text>
          {' '}— members auto-join on signup
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
      <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%', flex: 1 }}>
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
      </View>

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

  const roleColor = member.role === 'staff' ? Colors.blue : Colors.purple;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {member.role === 'athlete' ? (
        <View style={styles.jersey}>
          <Text style={styles.jerseyNum}>{member.jersey ?? '–'}</Text>
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: `${roleColor}18` }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.sub}>
          {member.role === 'athlete'  ? (member.position ?? 'No position set')
          : member.role === 'staff'   ? (member.staffTitle ?? 'Staff')
          : 'Supporter'}
        </Text>
      </View>

      <View style={styles.right}>
        {member.role === 'athlete' && (
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        )}
        {member.role === 'staff' && (
          <View style={[styles.roleBadge, { borderColor: `${Colors.blue}44`, backgroundColor: `${Colors.blue}10` }]}>
            <Text style={[styles.roleBadgeText, { color: Colors.blue }]}>STAFF</Text>
          </View>
        )}
        {member.role === 'supporter' && (
          <View style={[styles.roleBadge, { borderColor: `${Colors.purple}44`, backgroundColor: `${Colors.purple}0d` }]}>
            <Text style={[styles.roleBadgeText, { color: Colors.purple }]}>FAN</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
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
  member, sport, canEdit, onClose, onSave,
}: {
  member: RosterMember | null;
  sport: Sport;
  canEdit: boolean;
  onClose: () => void;
  onSave: (updated: RosterMember) => void;
}) {
  const [editJersey,      setEditJersey]      = useState('');
  const [editPosition,    setEditPosition]    = useState('');
  const [editParentName,  setEditParentName]  = useState('');
  const [editParentEmail, setEditParentEmail] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editing,         setEditing]         = useState(false);

  const prevId = React.useRef<string | null>(null);
  if (member && member.id !== prevId.current) {
    prevId.current = member.id;
    setEditJersey(member.jersey?.toString() ?? '');
    setEditPosition(member.position ?? '');
    setEditParentName(member.parentName ?? '');
    setEditParentEmail(member.parentEmail ?? '');
    setEditParentPhone(member.parentPhone ?? '');
    setEditing(false);
  }

  if (!member) return null;

  const color     = ROLE_COLOR[member.role];
  const initials  = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const positions = POSITIONS[sport] ?? [];

  const statusColor = member.status === 'injured' ? Colors.amber
    : member.status === 'absent'  ? Colors.red
    : Colors.green;

  const handleSave = () => {
    onSave({
      ...member,
      jersey:      editJersey ? parseInt(editJersey, 10) : member.jersey,
      position:    editPosition || member.position,
      parentName:  editParentName.trim() || undefined,
      parentEmail: editParentEmail.trim() || undefined,
      parentPhone: editParentPhone.trim() || undefined,
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
          <View style={[styles.sheetAccent, { backgroundColor: color }]} />
          <View style={styles.modalHandle} />

          {/* Profile header */}
          <View style={styles.profileHeader}>
            {member.role === 'athlete' ? (
              <View style={[styles.profileJersey, { borderColor: `${color}55`, backgroundColor: `${color}10` }]}>
                <Text style={[styles.profileJerseyNum, { color }]}>{member.jersey ?? '–'}</Text>
              </View>
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: `${color}18` }]}>
                <Text style={[styles.profileAvatarText, { color }]}>{initials}</Text>
              </View>
            )}
            <View style={styles.profileHeaderInfo}>
              <Text style={styles.profileName}>{member.name}</Text>
              <View style={[styles.profileRoleBadge, { borderColor: `${color}44`, backgroundColor: `${color}0d` }]}>
                <Text style={[styles.profileRoleText, { color }]}>
                  {member.role === 'athlete'  ? (member.position ?? 'ATHLETE')
                  : member.role === 'staff'   ? (member.staffTitle?.toUpperCase() ?? 'STAFF')
                  : 'SUPPORTER'}
                </Text>
              </View>
            </View>
          </View>

          {/* Status */}
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

          {/* Edit form */}
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
              <Text style={styles.fieldLabel}>PARENT / GUARDIAN NAME</Text>
              <TextInput
                style={styles.input}
                value={editParentName}
                onChangeText={setEditParentName}
                placeholder="e.g. Lisa Porter"
                placeholderTextColor={Colors.muted}
                autoCapitalize="words"
              />
              <Text style={styles.fieldLabel}>PARENT EMAIL</Text>
              <TextInput
                style={styles.input}
                value={editParentEmail}
                onChangeText={setEditParentEmail}
                placeholder="e.g. parent@email.com"
                placeholderTextColor={Colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>PARENT PHONE</Text>
              <TextInput
                style={styles.input}
                value={editParentPhone}
                onChangeText={setEditParentPhone}
                placeholder="e.g. (555) 123-4567"
                placeholderTextColor={Colors.muted}
                keyboardType="phone-pad"
              />
            </View>
          )}

          {/* Parent contact (read-only, coach/staff only) */}
          {member.role === 'athlete' && canEdit && !editing && (
            <View style={styles.contactSection}>
              <Text style={styles.fieldLabel}>PARENT CONTACT</Text>
              {member.parentName || member.parentEmail || member.parentPhone ? (
                <>
                  {member.parentName && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>NAME</Text>
                      <Text style={styles.contactVal}>{member.parentName}</Text>
                    </View>
                  )}
                  {member.parentEmail && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>EMAIL</Text>
                      <Text style={styles.contactVal}>{member.parentEmail}</Text>
                    </View>
                  )}
                  {member.parentPhone && (
                    <View style={styles.contactRow}>
                      <Text style={styles.contactLabel}>PHONE</Text>
                      <Text style={styles.contactVal}>{member.parentPhone}</Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.contactEmpty}>No contact on file — tap Edit Details to add.</Text>
              )}
            </View>
          )}

          {/* XP row */}
          <View style={styles.xpRow}>
            <Text style={styles.xpRowLabel}>XP CONTRIBUTION</Text>
            <Text style={styles.xpRowVal}>— this season</Text>
          </View>

          {/* Actions */}
          {canEdit && (
            <View style={styles.modalBtns}>
              {member.role === 'athlete' && !editing && (
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: `${color}44`, backgroundColor: `${color}0d` }]}
                  onPress={() => setEditing(true)}
                >
                  <Text style={[styles.actionBtnText, { color }]}>✎  EDIT DETAILS</Text>
                </TouchableOpacity>
              )}
              {member.role === 'athlete' && editing && (
                <>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                    <Text style={styles.cancelBtnText}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: color }]} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>SAVE</Text>
                  </TouchableOpacity>
                </>
              )}
              {member.role === 'supporter' && (
                <TouchableOpacity style={[styles.actionBtn, { borderColor: `${Colors.blue}44`, backgroundColor: `${Colors.blue}0d` }]}>
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    backgroundImage: 'radial-gradient(rgba(37,99,235,0.13) 1.5px, transparent 1.5px)' as any,
    backgroundSize: '22px 22px' as any,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.blue,
    letterSpacing: 1,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: 2,
  },
  teamCodeChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(37,99,235,0.07)',
  },
  teamCodeLabel: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.dim, letterSpacing: 1 },
  teamCodeVal:   { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.blue, letterSpacing: 1.5 },

  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: 48,
    borderRadius: 28,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    gap: Spacing.lg,
    boxShadow: '0 12px 40px rgba(21,101,192,0.4), 0 4px 14px rgba(0,0,0,0.2)' as any,
  },
  heroLeft: { flex: 1 },
  heroTag: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: HeroText.secondary,
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  heroName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 26,
    color: HeroText.primary,
    lineHeight: 28,
    marginBottom: 10,
  },
  sportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sportBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: HeroText.secondary,
    letterSpacing: 1,
  },
  heroRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroStatBlock: { alignItems: 'center' },
  heroStatNum: {
    fontFamily: Fonts.orbitron,
    fontSize: 22,
    color: HeroText.primary,
    lineHeight: 26,
  },
  heroStatLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: HeroText.secondary,
    letterSpacing: 1,
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Join hint
  joinHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 4,
  },
  joinHintText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.dim,
    letterSpacing: 0.3,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  tabText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 1,
  },
  tabTextActive: { color: '#fff' },

  // List
  list:      { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  separator: { height: 1, backgroundColor: Colors.border, opacity: 0.6 },
  empty: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 1,
  },

  // Member row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  jersey: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(37,99,235,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jerseyNum:  { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.blue },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.rajdhaniBold, fontSize: 14 },
  info:  { flex: 1 },
  name:  { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: Colors.text },
  sub:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 0.5, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  roleBadgeText: { fontFamily: Fonts.mono, fontSize: 7, letterSpacing: 1 },

  // Modal / Profile sheet
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  modal: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border2,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 36,
    boxShadow: '0 -8px 32px rgba(0,40,120,0.15)' as any,
  },
  modalHandle: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  sheetAccent: { height: 3, width: '100%', marginTop: 0, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 4,
    paddingBottom: 16,
  },
  profileJersey: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileJerseyNum: { fontFamily: Fonts.orbitron, fontSize: 24 },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { fontFamily: Fonts.rajdhaniBold, fontSize: 20 },
  profileHeaderInfo: { flex: 1 },
  profileName: {
    fontFamily: Fonts.rajdhaniBold,
    fontSize: 22,
    color: Colors.text,
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
  statusText:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 1 },

  editSection: { marginBottom: 4 },
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
    backgroundColor: Colors.bgDeep,
    color: Colors.text,
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
    backgroundColor: Colors.card,
  },
  posPillActive: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  posPillText:       { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  posPillTextActive: { color: '#fff' },

  input: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.bgDeep,
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontFamily: Fonts.rajdhani,
    fontSize: 15,
    marginBottom: 16,
  },
  contactSection: {
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contactLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.dim,
    letterSpacing: 1.5,
    width: 48,
  },
  contactVal: {
    flex: 1,
    fontFamily: Fonts.rajdhani,
    fontSize: 14,
    color: Colors.text,
  },
  contactEmpty: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.muted,
    letterSpacing: 0.3,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgDeep,
    marginBottom: 4,
    boxShadow: 'inset 0 1px 4px rgba(0,50,150,0.08)' as any,
  },
  xpRowLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 1 },
  xpRowVal:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },

  modalBtns:    { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    backgroundColor: Colors.bgDeep,
  },
  cancelBtnText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  saveBtnText: { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff', letterSpacing: 1 },
  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 1 },
  closeBtn:     { alignItems: 'center', paddingVertical: 14 },
  closeBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },
});
