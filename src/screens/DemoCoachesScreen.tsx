import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { Colors, Spacing, Radius } from '../theme';
import { useDemoAC } from '../lib/demoTheme';
import { DEMO_COACHES, DEMO_LEAGUES, DEMO_SPORTS, DEMO_TEAMS, DEMO_ROSTER_PREVIEW, INITIAL_DEMO_EVENTS, DemoCoach } from '../lib/demoData';

interface Props {
  navigate?: (s: AdminSection, param?: string) => void;
  initialCoachId?: string;
}

type Level = 'directory' | 'profile' | 'coach-view';

export default function DemoCoachesScreen({ navigate, initialCoachId }: Props) {
  const AC = useDemoAC();
  const s  = useMemo(() => makeStyles(AC), [AC]);

  const sportColor = useMemo(() => ({
    soccer: AC.soccer, baseball: AC.baseball, basketball: AC.basketball,
  }), [AC]);
  const sportColorLight = useMemo(() => ({
    soccer: AC.greenLight, baseball: AC.amberLight, basketball: AC.orangeLight,
  }), [AC]);

  const initialCoach = initialCoachId ? DEMO_COACHES.find(c => c.id === initialCoachId) ?? null : null;
  const [level, setLevel]               = useState<Level>(initialCoach ? 'profile' : 'directory');
  const [selectedCoach, setSelectedCoach] = useState<DemoCoach | null>(initialCoach);

  // Coaches grouped by league, in league order (soccer only for now)
  const leagueGroups = useMemo(() => {
    const soccerLeagues = DEMO_LEAGUES.filter(l => l.sportId === 'soccer');
    return soccerLeagues
      .map(league => ({
        league,
        coaches: DEMO_COACHES.filter(c => c.leagueId === league.id),
      }))
      .filter(g => g.coaches.length > 0);
  }, []);

  function openProfile(coach: DemoCoach) {
    setSelectedCoach(coach);
    setLevel('profile');
  }

  function goBack() {
    setLevel('directory');
    setSelectedCoach(null);
  }

  // ── Profile level ────────────────────────────────────────────────────────────
  if (level === 'profile' && selectedCoach) {
    const coach = selectedCoach;
    const league = DEMO_LEAGUES.find(l => l.id === coach.leagueId);
    const sport  = DEMO_SPORTS.find(sp => sp.id === coach.sportId);
    const team   = DEMO_TEAMS.find(t => t.id === coach.teamId);
    const leagueLabel = league ? `${league.name} ${league.ageGroup}` : '';
    const firstName = coach.name.split(' ')[0];
    const initial   = coach.name.charAt(0);
    const sColor    = sport ? sportColor[sport.id as keyof typeof sportColor] : AC.primary;
    const sColorLt  = sport ? sportColorLight[sport.id as keyof typeof sportColorLight] : AC.primaryLight;

    return (
      <ScrollView
        style={[s.container, { backgroundColor: AC.bg }]}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {/* Breadcrumb */}
        <View style={s.breadcrumb}>
          <TouchableOpacity onPress={goBack}>
            <Text style={[s.breadcrumbLink, { color: AC.primary }]}>Coaches</Text>
          </TouchableOpacity>
          <Text style={[s.breadcrumbSep, { color: AC.muted }]}> / </Text>
          <Text style={[s.breadcrumbCurrent, { color: AC.sub }]}>{coach.name}</Text>
        </View>

        {/* Header card */}
        <View style={[s.card, s.profileHeader, { backgroundColor: AC.surface, borderColor: AC.border }]}>
          <View style={[s.avatarLg, { backgroundColor: AC.primaryLight }]}>
            <Text style={[s.avatarLgTxt, { color: AC.primary }]}>{initial}</Text>
          </View>
          <Text style={[s.profileName, { color: AC.text }]}>{coach.name}</Text>
          <View style={s.profileBadgeRow}>
            {sport && (
              <View style={[s.badge, { backgroundColor: sColorLt }]}>
                <Text style={[s.badgeTxt, { color: sColor }]}>{sport.emoji} {sport.name}</Text>
              </View>
            )}
            <View style={[s.badge, { backgroundColor: AC.primaryLight }]}>
              <Text style={[s.badgeTxt, { color: AC.primaryText }]}>{leagueLabel}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: AC.greenLight }]}>
              <Text style={[s.badgeTxt, { color: AC.greenText }]}>Active</Text>
            </View>
          </View>
        </View>

        {/* Contact & credentials */}
        <View style={[s.card, { marginTop: AS.sm, backgroundColor: AC.surface, borderColor: AC.border }]}>
          <Text style={[s.sectionLabel, { color: AC.muted }]}>CONTACT & CREDENTIALS</Text>
          <View style={s.infoRow}>
            <Ionicons name="mail-outline" size={16} color={AC.muted} />
            <Text style={[s.infoValue, { color: AC.text }]}>{coach.email}</Text>
          </View>
          <View style={[s.infoRow, s.infoRowTop, { borderTopColor: AC.border }]}>
            <Ionicons name="call-outline" size={16} color={AC.muted} />
            <Text style={[s.infoValue, { color: AC.text }]}>{coach.phone}</Text>
          </View>
          <View style={[s.infoRow, s.infoRowTop, { borderTopColor: AC.border }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={AC.green} />
            <Text style={[s.infoValue, { color: AC.green }]}>Background Check Cleared</Text>
          </View>
          <View style={[s.infoRow, s.infoRowTop, { borderTopColor: AC.border }]}>
            <Ionicons name="time-outline" size={16} color={AC.muted} />
            <Text style={[s.infoValue, { color: AC.text }]}>
              {coach.yearsCoaching} year{coach.yearsCoaching !== 1 ? 's' : ''} coaching
            </Text>
          </View>
        </View>

        {/* Team assignment */}
        <View style={[s.card, { marginTop: AS.sm, backgroundColor: AC.surface, borderColor: AC.border }]}>
          <Text style={[s.sectionLabel, { color: AC.muted }]}>TEAM ASSIGNMENT</Text>
          <View style={{ gap: AS.xs }}>
            <Text style={[s.teamAssignName, { color: AC.text }]}>{coach.teamName}</Text>
            <Text style={[s.teamAssignSub, { color: AC.sub }]}>{leagueLabel} · Soccer</Text>
            {team?.code && (
              <View style={[s.teamCodeBadge, { backgroundColor: AC.primaryLight }]}>
                <Text style={[s.teamCodeTxt, { color: AC.primary }]}>Code: {team.code}</Text>
              </View>
            )}
          </View>
        </View>

        {/* View as Admin — full-width prominent button */}
        <TouchableOpacity
          style={[s.viewAsAdminBtn, { backgroundColor: AC.primary }]}
          onPress={() => setLevel('coach-view')}
          activeOpacity={0.8}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={[s.viewAsAdminLabel, { color: '#fff' }]}>View as Admin</Text>
            <Text style={[s.viewAsAdminSub, { color: 'rgba(255,255,255,0.7)' }]}>See {firstName}'s coach dashboard exactly as they see it</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnOutline, { borderColor: AC.border2 }]}
            onPress={() => navigate?.('comms')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={15} color={AC.sub} />
            <Text style={[s.actionBtnTxt, { color: AC.sub }]}>Message {firstName}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, s.actionBtnOutline, { borderColor: AC.border2 }]}
            onPress={() => navigate?.('comms')}
            activeOpacity={0.75}
          >
            <Ionicons name="mail-outline" size={15} color={AC.sub} />
            <Text style={[s.actionBtnTxt, { color: AC.sub }]}>Email Coach</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    );
  }

  // ── Coach Dashboard view ─────────────────────────────────────────────────────
  if (level === 'coach-view' && selectedCoach) {
    const coach = selectedCoach;
    const team  = DEMO_TEAMS.find(t => t.id === coach.teamId);
    const roster = DEMO_ROSTER_PREVIEW[coach.teamId] ?? [];
    const events = INITIAL_DEMO_EVENTS.filter(e => e.teamId === coach.teamId);
    const nextEvent = events[0] ?? null;
    const firstName = coach.name.split(' ')[0];

    const eventTypeColor: Record<string, string> = {
      game: Colors.amber, practice: Colors.green, meeting: Colors.purple, tournament: Colors.cyan,
    };

    const quickActions = [
      { icon: 'stats-chart-outline', label: 'Stat Tracker' },
      { icon: 'people-outline',      label: 'Roster'       },
      { icon: 'book-outline',        label: 'Playbook'     },
      { icon: 'chatbubbles-outline', label: 'Team Chat'    },
    ] as const;

    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        {/* Admin banner */}
        <View style={cv.banner}>
          <TouchableOpacity onPress={() => setLevel('profile')} style={cv.bannerBack}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={cv.bannerBackTxt}>Back to Admin</Text>
          </TouchableOpacity>
          <View style={cv.bannerBadge}>
            <Ionicons name="eye-outline" size={12} color="#fff" />
            <Text style={cv.bannerBadgeTxt}>Admin Preview</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Header */}
          <View style={cv.header}>
            <Text style={cv.headerGreeting}>Hey Coach {firstName} 👋</Text>
            <Text style={cv.headerTeam}>{team?.name ?? coach.teamName}</Text>
            <View style={cv.codeChip}>
              <Text style={cv.codeChipTxt}>{team?.code}</Text>
            </View>
          </View>

          {/* Next event */}
          {nextEvent && (
            <View style={cv.section}>
              <Text style={cv.sectionLabel}>NEXT EVENT</Text>
              <View style={cv.eventCard}>
                <View style={[cv.eventTypeDot, { backgroundColor: eventTypeColor[nextEvent.type] ?? Colors.cyan }]} />
                <View style={{ flex: 1 }}>
                  <Text style={cv.eventTitle}>{nextEvent.title}</Text>
                  <Text style={cv.eventMeta}>{nextEvent.date} · {nextEvent.time}</Text>
                  <Text style={cv.eventLoc}>{nextEvent.location}</Text>
                </View>
                <View style={[cv.eventTypeBadge, { backgroundColor: eventTypeColor[nextEvent.type] ?? Colors.cyan }]}>
                  <Text style={cv.eventTypeTxt}>{nextEvent.type.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick actions */}
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>QUICK ACTIONS</Text>
            <View style={cv.qaGrid}>
              {quickActions.map(qa => (
                <View key={qa.label} style={cv.qaCard}>
                  <Ionicons name={qa.icon as any} size={22} color={Colors.cyan} />
                  <Text style={cv.qaLabel}>{qa.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Roster preview */}
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>ROSTER · {roster.length || team?.athletes} ATHLETES</Text>
            <View style={cv.rosterCard}>
              {roster.length > 0 ? roster.slice(0, 6).map(p => (
                <View key={p.jersey} style={cv.rosterRow}>
                  <Text style={cv.rosterNum}>#{p.jersey}</Text>
                  <Text style={cv.rosterName}>{p.name}</Text>
                  <Text style={cv.rosterPos}>{p.pos}</Text>
                </View>
              )) : (
                <Text style={cv.rosterEmpty}>{team?.athletes ?? 0} athletes enrolled</Text>
              )}
            </View>
          </View>

          {/* All events */}
          {events.length > 1 && (
            <View style={cv.section}>
              <Text style={cv.sectionLabel}>SCHEDULE</Text>
              <View style={cv.rosterCard}>
                {events.map((ev, i) => (
                  <View key={ev.id} style={[cv.rosterRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                    <View style={[cv.evDot, { backgroundColor: eventTypeColor[ev.type] ?? Colors.cyan }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={cv.rosterName}>{ev.title}</Text>
                      <Text style={cv.rosterPos}>{ev.date} · {ev.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Directory level ──────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[s.container, { backgroundColor: AC.bg }]}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      {/* Page header */}
      <View style={s.pageHeader}>
        <Text style={[s.pageTitle, { color: AC.text }]}>Coaches</Text>
        <Text style={[s.pageSubtitle, { color: AC.sub }]}>
          {DEMO_COACHES.length} coaches · Fall 2025
        </Text>
      </View>

      {/* Sport filter pills */}
      <View style={s.pillRow}>
        <View style={[s.pill, { backgroundColor: AC.primaryLight, borderColor: AC.primary }]}>
          <Text style={[s.pillTxt, { color: AC.primary }]}>⚽ Soccer</Text>
        </View>
        <View style={[s.pill, s.pillDim, { borderColor: AC.border }]}>
          <Text style={[s.pillTxt, { color: AC.muted }]}>⚾ Baseball</Text>
          <View style={[s.soonBadge, { backgroundColor: AC.border }]}>
            <Text style={[s.soonTxt, { color: AC.muted }]}>SOON</Text>
          </View>
        </View>
        <View style={[s.pill, s.pillDim, { borderColor: AC.border }]}>
          <Text style={[s.pillTxt, { color: AC.muted }]}>🏀 Basketball</Text>
          <View style={[s.soonBadge, { backgroundColor: AC.border }]}>
            <Text style={[s.soonTxt, { color: AC.muted }]}>SOON</Text>
          </View>
        </View>
      </View>

      {/* League sections */}
      {leagueGroups.map(({ league, coaches }) => (
        <View key={league.id} style={[s.leagueCard, { backgroundColor: AC.surface, borderColor: AC.border }]}>
          {/* League header */}
          <View style={[s.leagueHeader, { borderBottomColor: AC.border }]}>
            <Text style={[s.leagueHeaderTxt, { color: AC.sub }]}>
              {league.name.toUpperCase()} {league.ageGroup}
            </Text>
            <Text style={[s.leagueCount, { color: AC.muted }]}>
              {coaches.length} coach{coaches.length !== 1 ? 'es' : ''}
            </Text>
          </View>

          {/* Coach rows */}
          {coaches.map((coach, idx) => (
            <TouchableOpacity
              key={coach.id}
              style={[s.coachRow, idx > 0 && s.coachRowBorder, { borderTopColor: AC.border }]}
              onPress={() => openProfile(coach)}
              activeOpacity={0.75}
            >
              <View style={[s.avatarSm, { backgroundColor: AC.primaryLight }]}>
                <Text style={[s.avatarSmTxt, { color: AC.primary }]}>{coach.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.coachName, { color: AC.text }]}>{coach.name}</Text>
                <Text style={[s.coachTeam, { color: AC.sub }]}>{coach.teamName}</Text>
              </View>
              <View style={[s.activeBadge, { backgroundColor: AC.greenLight }]}>
                <Text style={[s.activeBadgeTxt, { color: AC.greenText }]}>Active</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={AC.muted} style={{ marginLeft: AS.xs }} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (AC: ACPalette) => StyleSheet.create({
  container:   { flex: 1 },

  // Page header
  pageHeader:  { paddingHorizontal: AS.lg, paddingTop: AS.xl, paddingBottom: AS.md },
  pageTitle:   { fontFamily: Fonts.rajdhaniBold, fontSize: 24 },
  pageSubtitle:{ fontFamily: Fonts.rajdhani, fontSize: 14, marginTop: 2 },

  // Sport filter pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: AS.sm, paddingHorizontal: AS.lg, marginBottom: AS.md },
  pill:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AS.md, paddingVertical: 6, borderRadius: AR.full, borderWidth: 1, gap: 4 },
  pillDim: { opacity: 0.65 },
  pillTxt: { fontFamily: Fonts.monoBold, fontSize: 12 },
  soonBadge: { borderRadius: AR.sm, paddingHorizontal: 4, paddingVertical: 1 },
  soonTxt:   { fontFamily: Fonts.monoBold, fontSize: 9 },

  // League card
  leagueCard:   { marginHorizontal: AS.lg, marginBottom: AS.md, borderRadius: AR.lg, borderWidth: 1, overflow: 'hidden' },
  leagueHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: AS.md, paddingVertical: 10, borderBottomWidth: 1 },
  leagueHeaderTxt: { fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  leagueCount:     { fontFamily: Fonts.mono, fontSize: 11 },

  // Coach rows
  coachRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AS.md, paddingVertical: AS.md, gap: AS.sm },
  coachRowBorder: { borderTopWidth: 1 },
  coachName:      { fontFamily: Fonts.rajdhaniBold, fontSize: 15 },
  coachTeam:      { fontFamily: Fonts.rajdhani, fontSize: 13, marginTop: 1 },
  avatarSm:       { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarSmTxt:    { fontFamily: Fonts.monoBold, fontSize: 14 },
  activeBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: AR.full },
  activeBadgeTxt: { fontFamily: Fonts.monoBold, fontSize: 10 },

  // Profile — shared card
  card:        { marginHorizontal: AS.lg, borderRadius: AR.lg, padding: AS.lg, borderWidth: 1 },

  // Profile — breadcrumb
  breadcrumb:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AS.lg, paddingTop: AS.xl, paddingBottom: AS.md },
  breadcrumbLink:    { fontFamily: Fonts.rajdhani, fontSize: 14 },
  breadcrumbSep:     { fontFamily: Fonts.rajdhani, fontSize: 14, marginHorizontal: 2 },
  breadcrumbCurrent: { fontFamily: Fonts.rajdhani, fontSize: 14 },

  // Profile — header card
  profileHeader:  { alignItems: 'center', paddingVertical: AS.md },
  avatarLg:       { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: AS.md },
  avatarLgTxt:    { fontFamily: Fonts.monoBold, fontSize: 28 },
  profileName:    { fontFamily: Fonts.rajdhaniBold, fontSize: 22, marginBottom: AS.sm },
  profileBadgeRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: AS.xs, justifyContent: 'center' },
  badge:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: AR.full },
  badgeTxt:       { fontFamily: Fonts.monoBold, fontSize: 10 },

  // Profile — info rows
  sectionLabel: { fontFamily: Fonts.monoBold, fontSize: 10, letterSpacing: 0.5, marginBottom: AS.md },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: AS.sm, paddingVertical: AS.xs + 2 },
  infoRowTop:   { borderTopWidth: 1 },
  infoValue:    { fontFamily: Fonts.rajdhani, fontSize: 14, flex: 1 },

  // Profile — team assignment
  teamAssignRow:  { flexDirection: 'row', alignItems: 'center', gap: AS.md },
  teamAssignName: { fontFamily: Fonts.rajdhaniBold, fontSize: 16 },
  teamAssignSub:  { fontFamily: Fonts.rajdhani, fontSize: 13, marginTop: 2 },
  teamCodeBadge:  { alignSelf: 'flex-start', marginTop: AS.xs, paddingHorizontal: 6, paddingVertical: 2, borderRadius: AR.sm },
  teamCodeTxt:    { fontFamily: Fonts.monoBold, fontSize: 11 },
  viewHubBtn:     { paddingHorizontal: AS.md, paddingVertical: AS.sm, borderRadius: AR.md, borderWidth: 1 },
  viewHubBtnTxt:  { fontFamily: Fonts.monoBold, fontSize: 12 },

  // Profile — action buttons
  actionRow:       { flexDirection: 'row', paddingHorizontal: AS.lg, paddingTop: AS.md, gap: AS.sm },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: AR.md, gap: AS.xs },
  actionBtnOutline:{ backgroundColor: 'transparent', borderWidth: 1 },
  actionBtnTxt:    { fontFamily: Fonts.rajdhaniBold, fontSize: 14 },

  // View as Admin button
  viewAsAdminBtn:  { flexDirection: 'row', alignItems: 'center', gap: AS.md, marginHorizontal: AS.lg, marginTop: AS.sm, padding: AS.md, borderRadius: AR.lg, borderWidth: 1 },
  viewAsAdminLabel:{ fontFamily: Fonts.rajdhaniBold, fontSize: 15 },
  viewAsAdminSub:  { fontFamily: Fonts.rajdhani, fontSize: 12, marginTop: 1 },

  // Hub modal
  hubModalHeader:  { flexDirection: 'row', alignItems: 'center', gap: AS.md, paddingHorizontal: AS.lg, paddingVertical: AS.md, borderBottomWidth: 1 },
  hubModalClose:   { padding: AS.xs },
  hubModalTitle:   { flex: 1, fontFamily: Fonts.rajdhaniBold, fontSize: 18 },
  hubModalBadge:   { paddingHorizontal: AS.sm, paddingVertical: 3, borderRadius: AR.full },
  hubModalBadgeTxt:{ fontFamily: Fonts.monoBold, fontSize: 11 },
  hubSec:          { fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 0.5, marginBottom: AS.xs },
  hubCard:         { borderRadius: AR.lg, borderWidth: 1, padding: AS.lg, marginBottom: 2 },
  hubCode:         { fontFamily: Fonts.monoBold, fontSize: 32, letterSpacing: 3, marginBottom: AS.xs },
  hubCodeSub:      { fontFamily: Fonts.rajdhani, fontSize: 13, lineHeight: 18 },
  hubAvatar:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hubAvatarTxt:    { fontFamily: Fonts.monoBold, fontSize: 16 },
  hubCoachName:    { fontFamily: Fonts.rajdhaniBold, fontSize: 16 },
  hubStatusRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: AR.full, marginTop: 4 },
  hubDot:          { width: 6, height: 6, borderRadius: 3 },
  hubStatusTxt:    { fontFamily: Fonts.monoBold, fontSize: 10 },
  rosterRow:       { flexDirection: 'row', paddingVertical: AS.xs + 2, borderBottomWidth: 1 },
  rosterHdr:       { fontFamily: Fonts.monoBold, fontSize: 11 },
  rosterCell:      { fontFamily: Fonts.rajdhani, fontSize: 14 },
  evRow:           { paddingVertical: AS.sm },
  evTitle:         { fontFamily: Fonts.rajdhaniBold, fontSize: 15 },
  evMeta:          { fontFamily: Fonts.rajdhani, fontSize: 13, marginTop: 2 },
});

// Coach dashboard preview styles (dark theme)
const cv = StyleSheet.create({
  banner:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  bannerBack:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  bannerBackTxt: { fontFamily: Fonts.rajdhani, fontSize: 14, color: '#fff' },
  bannerBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  bannerBadgeTxt:{ fontFamily: Fonts.monoBold, fontSize: 10, color: '#fff' },

  header:        { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerGreeting:{ fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: '#fff', marginBottom: 2 },
  headerTeam:    { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.cyan, marginBottom: Spacing.sm },
  codeChip:      { alignSelf: 'flex-start', backgroundColor: 'rgba(0,200,255,0.12)', borderWidth: 1, borderColor: Colors.cyan, borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  codeChipTxt:   { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.cyan, letterSpacing: 1 },

  section:       { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionLabel:  { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.dim, letterSpacing: 0.5, marginBottom: Spacing.sm },

  eventCard:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  eventTypeDot:  { width: 8, height: 8, borderRadius: 4 },
  eventTitle:    { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: '#fff' },
  eventMeta:     { fontFamily: Fonts.mono, fontSize: 12, color: Colors.dim, marginTop: 2 },
  eventLoc:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.muted, marginTop: 2 },
  eventTypeBadge:{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  eventTypeTxt:  { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.bg },

  qaGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  qaCard:        { flex: 1, minWidth: '44%', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  qaLabel:       { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: '#fff', textAlign: 'center' },

  rosterCard:    { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  rosterRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  rosterNum:     { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.cyan, width: 28 },
  rosterName:    { flex: 1, fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },
  rosterPos:     { fontFamily: Fonts.mono, fontSize: 12, color: Colors.dim },
  rosterEmpty:   { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted, padding: Spacing.md },

  evDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
});
