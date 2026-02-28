import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { useDemoAC } from '../lib/demoTheme';
import { DEMO_ORG, DEMO_SPORTS, DEMO_LEAGUES, DEMO_TEAMS, INITIAL_DEMO_EVENTS, DEMO_PENDING_REG, DEMO_ACTIVITY } from '../lib/demoData';

interface Props { navigate?: (s: AdminSection, param?: string) => void; }

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Derived data ─────────────────────────────────────────────────────────────

const totalTeams    = DEMO_TEAMS.filter(t => t.status === 'active').length;
const totalAthletes = DEMO_LEAGUES.filter(l => l.sportId === 'soccer').reduce((a, l) => a + l.athleteCount, 0);
const pendingReg    = DEMO_PENDING_REG;
const teamsNeedingCoach = DEMO_TEAMS.filter(t => t.coach === 'Pending').length;
const unpublished   = INITIAL_DEMO_EVENTS.filter(e => !e.published).length;

const NEEDS_ATTENTION = [
  { id: 'reg',   label: `${pendingReg} registrations pending`,           sub: 'Soccer Rec U8 — review & assign', color: '#d97706', icon: 'people-outline'    as IoniconsName, section: 'sports'   as AdminSection },
  { id: 'coach', label: `${teamsNeedingCoach} teams need a coach`,       sub: 'Tap to assign coaches',           color: '#dc2626', icon: 'person-add-outline' as IoniconsName, section: 'sports'   as AdminSection },
  { id: 'sched', label: `${unpublished} unpublished event${unpublished !== 1 ? 's' : ''}`, sub: 'Review & publish to notify coaches', color: '#7c3aed', icon: 'calendar-outline' as IoniconsName, section: 'schedule' as AdminSection },
];

const QUICK_ACTIONS: { label: string; sub: string; icon: IoniconsName; color: string; section: AdminSection }[] = [
  { label: 'Publish Schedule',   sub: 'Push events to teams',     icon: 'calendar-outline',   color: '#2563eb', section: 'schedule' },
  { label: 'Send Announcement',  sub: 'Broadcast to all coaches', icon: 'megaphone-outline',  color: '#16a34a', section: 'comms'    },
  { label: 'Add a Team',         sub: 'Create new team profile',  icon: 'add-circle-outline', color: '#ea580c', section: 'sports'   },
  { label: 'Message a Coach',    sub: 'Direct message any coach', icon: 'chatbubble-outline', color: '#7c3aed', section: 'comms'    },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DemoOverviewScreen({ navigate }: Props) {
  const AC = useDemoAC();
  const s  = useMemo(() => makeStyles(AC), [AC]);
  const { width } = useWindowDimensions();
  const isWide = width >= 640;

  const sportColor = useMemo(() => ({
    soccer:     AC.soccer,
    baseball:   AC.baseball,
    basketball: AC.basketball,
  }), [AC]);

  const upcomingEvents = INITIAL_DEMO_EVENTS.slice(0, 3);

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

      {/* ── Page header ───────────────────────────────────── */}
      <View style={s.pageHeader}>
        <View>
          <Text style={s.pageTitle}>Good morning 👋</Text>
          <Text style={s.pageSub}>{DEMO_ORG.season} · {DEMO_ORG.name}</Text>
        </View>
        <View style={s.headerStats}>
          <View style={s.headerPill}>
            <Text style={[s.headerPillVal, { color: AC.primary }]}>{totalTeams}</Text>
            <Text style={s.headerPillLabel}>teams</Text>
          </View>
          <View style={[s.headerPill, { marginLeft: AS.sm }]}>
            <Text style={[s.headerPillVal, { color: AC.green }]}>{totalAthletes}</Text>
            <Text style={s.headerPillLabel}>athletes</Text>
          </View>
        </View>
      </View>

      {/* ── Needs Attention ───────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={s.sectionTitleRow}>
            <View style={s.alertDot} />
            <Text style={s.sectionTitle}>Needs Attention</Text>
          </View>
          <Text style={s.sectionCount}>{NEEDS_ATTENTION.length} items</Text>
        </View>

        <View style={s.card}>
          {NEEDS_ATTENTION.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[s.attentionRow, i < NEEDS_ATTENTION.length - 1 && s.rowBorder]}
              onPress={() => navigate?.(item.section)}
              activeOpacity={0.75}
            >
              <View style={[s.attentionIcon, { backgroundColor: item.color + '18', borderColor: item.color + '40' }]}>
                <Ionicons name={item.icon} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.attentionLabel}>{item.label}</Text>
                <Text style={s.attentionSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={item.color} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Quick Actions ─────────────────────────────────── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={[s.actionsGrid, isWide && s.actionsGridWide]}>
          {QUICK_ACTIONS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[s.actionCard, isWide ? { width: '23%' } : { width: '48%' }]}
              onPress={() => navigate?.(a.section)}
              activeOpacity={0.8}
            >
              <View style={[s.actionIconWrap, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
              <Text style={s.actionSub}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Upcoming Events ───────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => navigate?.('schedule')}>
            <Text style={s.sectionLink}>View all →</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          {upcomingEvents.map((ev, i) => {
            const color = ev.sportId ? sportColor[ev.sportId as keyof typeof sportColor] : AC.primary;
            const sport = DEMO_SPORTS.find(sp => sp.id === ev.sportId);
            return (
              <TouchableOpacity
                key={ev.id}
                style={[s.eventRow, i < upcomingEvents.length - 1 && s.rowBorder]}
                onPress={() => navigate?.('schedule')}
                activeOpacity={0.75}
              >
                {/* Date block */}
                <View style={[s.eventDate, { borderColor: color + '50', backgroundColor: color + '12' }]}>
                  <Text style={[s.eventDateDay, { color }]}>{ev.date.split(' ')[1]}</Text>
                  <Text style={[s.eventDateMon, { color }]}>{ev.date.split(' ')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.eventTitleRow}>
                    {sport && <Text style={s.eventEmoji}>{sport.emoji}</Text>}
                    <Text style={s.eventTitle} numberOfLines={1}>{ev.teamName} · {ev.title}</Text>
                  </View>
                  <Text style={s.eventMeta}>{ev.time} · {ev.location}</Text>
                </View>
                {!ev.published && (
                  <View style={s.draftBadge}>
                    <Text style={s.draftBadgeTxt}>DRAFT</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Sports summary (compact) ──────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Sports</Text>
          <TouchableOpacity onPress={() => navigate?.('sports')}>
            <Text style={s.sectionLink}>Manage →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {DEMO_SPORTS.map((sp, i) => {
            const leagues  = DEMO_LEAGUES.filter(l => l.sportId === sp.id);
            const athletes = leagues.reduce((a, l) => a + l.athleteCount, 0);
            const teams    = leagues.reduce((a, l) => a + l.teamCount, 0);
            const color    = sportColor[sp.id as keyof typeof sportColor];
            return (
              <TouchableOpacity
                key={sp.id}
                style={[s.sportRow, i < DEMO_SPORTS.length - 1 && s.rowBorder]}
                onPress={() => navigate?.('sports', sp.id)}
                activeOpacity={0.75}
              >
                <View style={[s.sportEmojiBadge, { backgroundColor: color + '18' }]}>
                  <Text style={{ fontSize: 16 }}>{sp.emoji}</Text>
                </View>
                <Text style={s.sportRowName}>{sp.name}</Text>
                <Text style={s.sportRowStat}>{leagues.length} leagues</Text>
                <Text style={s.sportRowStat}>{teams} teams</Text>
                <Text style={s.sportRowStat}>{athletes} athletes</Text>
                <Ionicons name="chevron-forward" size={14} color={AC.muted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(AC: ACPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: AC.bg },
    scroll: { padding: AS.lg, paddingBottom: AS.xxxl },

    // Header
    pageHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: AS.xxl },
    pageTitle:      { fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: AC.text },
    pageSub:        { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted, marginTop: 2 },
    headerStats:    { flexDirection: 'row' },
    headerPill:     { alignItems: 'center', backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, paddingHorizontal: AS.md, paddingVertical: AS.xs },
    headerPillVal:  { fontFamily: Fonts.monoBold, fontSize: 18 },
    headerPillLabel:{ fontFamily: Fonts.rajdhani, fontSize: 11, color: AC.muted },

    // Section
    section:        { marginBottom: AS.xl },
    sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: AS.sm },
    sectionTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 7 },
    sectionTitle:   { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    sectionCount:   { fontFamily: Fonts.mono, fontSize: 11, color: AC.muted },
    sectionLink:    { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.primary },
    alertDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },

    // Card container
    card:      { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, overflow: 'hidden' },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: AC.border },

    // Needs Attention rows
    attentionRow:  { flexDirection: 'row', alignItems: 'center', gap: AS.md, padding: AS.md },
    attentionIcon: { width: 36, height: 36, borderRadius: AR.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    attentionLabel:{ fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.text },
    attentionSub:  { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted, marginTop: 1 },

    // Quick Actions grid
    actionsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: AS.sm },
    actionsGridWide: { flexWrap: 'nowrap' },
    actionCard:      { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.md, gap: AS.xs },
    actionIconWrap:  { width: 40, height: 40, borderRadius: AR.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    actionLabel:     { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.text },
    actionSub:       { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },

    // Upcoming Events
    eventRow:      { flexDirection: 'row', alignItems: 'center', gap: AS.md, padding: AS.md },
    eventDate:     { width: 38, height: 38, borderRadius: AR.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    eventDateDay:  { fontFamily: Fonts.monoBold, fontSize: 14, lineHeight: 16 },
    eventDateMon:  { fontFamily: Fonts.mono, fontSize: 8, lineHeight: 10 },
    eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
    eventEmoji:    { fontSize: 13 },
    eventTitle:    { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.text, flex: 1 },
    eventMeta:     { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },
    draftBadge:    { backgroundColor: AC.amberLight, borderRadius: AR.sm, paddingHorizontal: 6, paddingVertical: 2 },
    draftBadgeTxt: { fontFamily: Fonts.monoBold, fontSize: 8, color: AC.amberText, letterSpacing: 0.5 },

    // Sports compact rows
    sportRow:       { flexDirection: 'row', alignItems: 'center', gap: AS.md, padding: AS.md },
    sportEmojiBadge:{ width: 32, height: 32, borderRadius: AR.md, alignItems: 'center', justifyContent: 'center' },
    sportRowName:   { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.text, flex: 1 },
    sportRowStat:   { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.sub, marginLeft: AS.sm },
  });
}
