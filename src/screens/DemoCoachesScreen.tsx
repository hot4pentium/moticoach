import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { Colors, Spacing, Radius } from '../theme';
import { useDemoAC } from '../lib/demoTheme';
import { DEMO_COACHES, DEMO_LEAGUES, DEMO_SPORTS, DEMO_TEAMS, DEMO_ROSTER_PREVIEW, INITIAL_DEMO_EVENTS, DemoCoach } from '../lib/demoData';

interface Props {
  navigate?: (s: AdminSection, param?: string) => void;
  initialCoachId?: string;
}

type Level = 'directory' | 'profile' | 'coach-view' | 'playbook' | 'stat-demo' | 'live-taps';

const DEMO_PLAYS = [
  { id: '1', name: '4-3-3 High Press',  cat: 'OFFENSE',   color: Colors.green  },
  { id: '2', name: '2-3 Zone Defense',  cat: 'DEFENSE',   color: Colors.red    },
  { id: '3', name: 'Corner Routine A',  cat: 'SET PIECE', color: Colors.amber  },
  { id: '4', name: 'Counter Attack',    cat: 'OFFENSE',   color: Colors.green  },
  { id: '5', name: 'Pressing Trap',     cat: 'DEFENSE',   color: Colors.red    },
  { id: '6', name: 'Free Kick Wall',    cat: 'SET PIECE', color: Colors.amber  },
];

const SOCCER_DEMO_STATS = [
  { key: 'goals',   label: 'GOALS'   },
  { key: 'assists', label: 'ASSISTS' },
  { key: 'saves',   label: 'SAVES'   },
  { key: 'shots',   label: 'SHOTS'   },
  { key: 'tackles', label: 'TACKLES' },
  { key: 'corners', label: 'CORNERS' },
];

const PRESET_PLAYER_STATS: Record<number, Record<string, number>> = {
  0: { goals: 2, assists: 1 },
  1: { assists: 2 },
  2: { saves: 4 },
  3: { goals: 1, tackles: 3 },
  4: { goals: 1 },
  5: { corners: 2 },
};

const PRESET_SHOUTOUTS = [5, 3, 7, 2, 4, 1, 8, 3, 6];

const DEMO_SHOUTOUT_PLAYERS = [
  { name: 'Jordan Smith',  jersey: 10 },
  { name: 'Maya Torres',   jersey: 7  },
  { name: 'Eli Johnson',   jersey: 4  },
  { name: 'Chloe Davis',   jersey: 9  },
  { name: 'Noah Wilson',   jersey: 11 },
  { name: 'Sam Liu',       jersey: 3  },
  { name: 'Aiden Scott',   jersey: 8  },
  { name: 'Emma Park',     jersey: 6  },
  { name: 'Ryan James',    jersey: 2  },
];

const PLAY_FILTERS = ['ALL', 'OFFENSE', 'DEFENSE', 'SET PIECE'];

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

  // Stat demo state
  const [selectedStatKey, setSelectedStatKey] = useState<string>('goals');
  const [recentlyTrackedId, setRecentlyTrackedId] = useState<string | null>(null);

  // Live taps state
  const [tapCount, setTapCount] = useState(0);
  const [shoutouts, setShoutouts] = useState<Record<string, number>>({});
  const tapScaleAnim = useRef(new Animated.Value(1)).current;

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

  // ── Playbook demo level ──────────────────────────────────────────────────────
  if (level === 'playbook' && selectedCoach) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={cv.banner}>
          <TouchableOpacity onPress={() => setLevel('coach-view')} style={cv.bannerBack}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={cv.bannerBackTxt}>Coach Dashboard</Text>
          </TouchableOpacity>
          <View style={cv.bannerBadge}>
            <Ionicons name="eye-outline" size={12} color="#fff" />
            <Text style={cv.bannerBadgeTxt}>Admin Preview</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>PLAYBOOK</Text>
            <Text style={{ fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: '#fff', marginBottom: Spacing.md }}>
              {DEMO_PLAYS.length} Plays
            </Text>

            {/* Filter tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                {PLAY_FILTERS.map(f => (
                  <View key={f} style={[cv.filterTab, f === 'ALL' && cv.filterTabActive]}>
                    <Text style={[cv.filterTabTxt, f === 'ALL' && cv.filterTabTxtActive]}>{f}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Play grid */}
            <View style={cv.playGrid}>
              {DEMO_PLAYS.map(play => (
                <View key={play.id} style={cv.playCard}>
                  <View style={[cv.playAccent, { backgroundColor: play.color }]} />
                  <View style={cv.playThumb}>
                    <View style={cv.fieldCircle} />
                    <View style={cv.fieldLine} />
                  </View>
                  <View style={cv.playInfo}>
                    <Text style={cv.playName}>{play.name}</Text>
                    <View style={[cv.catTag, { borderColor: play.color }]}>
                      <Text style={[cv.catTagTxt, { color: play.color }]}>{play.cat}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Stat demo level ──────────────────────────────────────────────────────────
  if (level === 'stat-demo' && selectedCoach) {
    const roster = (DEMO_ROSTER_PREVIEW[selectedCoach.teamId] ?? []).slice(0, 6);

    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={cv.banner}>
          <TouchableOpacity onPress={() => setLevel('coach-view')} style={cv.bannerBack}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={cv.bannerBackTxt}>Coach Dashboard</Text>
          </TouchableOpacity>
          <View style={cv.bannerBadge}>
            <Ionicons name="eye-outline" size={12} color="#fff" />
            <Text style={cv.bannerBadgeTxt}>Admin Preview</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          {/* Score bar */}
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>STAT TRACKER — LIVE</Text>
            <View style={cv.scoreBar}>
              <Text style={cv.scoreTeam}>RIVERSIDE UTD</Text>
              <View style={cv.scoreBox}>
                <Text style={cv.scoreNum}>2</Text>
                <Text style={cv.scoreSep}>:</Text>
                <Text style={cv.scoreNum}>1</Text>
              </View>
              <Text style={cv.scoreTeam}>HAWKS FC</Text>
            </View>
            <View style={cv.modeChip}>
              <Text style={cv.modeChipTxt}>INDIVIDUAL MODE · TAP STAT → TAP PLAYER</Text>
            </View>
          </View>

          {/* Stat tiles */}
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>SELECT A STAT</Text>
            <View style={cv.statGrid}>
              {SOCCER_DEMO_STATS.map(stat => (
                <TouchableOpacity
                  key={stat.key}
                  style={cv.statTileWrap}
                  onPress={() => setSelectedStatKey(stat.key)}
                  activeOpacity={0.7}
                >
                  <View style={[cv.statTileCard, selectedStatKey === stat.key && cv.statTileCardSel]}>
                    <Text style={[cv.statTileLabel, selectedStatKey === stat.key && cv.statTileLabelSel]}>
                      {stat.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Player rows */}
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>TAP A PLAYER TO RECORD</Text>
            <View style={cv.rosterCard}>
              {roster.map((p, i) => {
                const ps = PRESET_PLAYER_STATS[i] ?? {};
                const isRecent = recentlyTrackedId === `${p.jersey}`;
                return (
                  <TouchableOpacity
                    key={p.jersey}
                    style={[
                      cv.statPlayerRow,
                      i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border },
                      isRecent && cv.statPlayerRowRecent,
                    ]}
                    onPress={() => {
                      setRecentlyTrackedId(`${p.jersey}`);
                      setTimeout(() => setRecentlyTrackedId(null), 750);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={cv.rosterNum}>#{p.jersey}</Text>
                    <Text style={cv.rosterName}>{p.name}</Text>
                    <Text style={cv.rosterPos}>{p.pos}</Text>
                    {isRecent ? (
                      <View style={cv.recordedBadge}>
                        <Text style={cv.recordedBadgeTxt}>✓ RECORDED</Text>
                      </View>
                    ) : (
                      <View style={cv.statBadgeRow}>
                        {Object.entries(ps).map(([k, v]) => (
                          <View key={k} style={cv.statCount}>
                            <Text style={cv.statCountTxt}>{v} {k.substring(0, 3).toUpperCase()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Live taps demo level ─────────────────────────────────────────────────────
  if (level === 'live-taps' && selectedCoach) {
    const liveRoster = DEMO_ROSTER_PREVIEW[selectedCoach.teamId]?.length
      ? DEMO_ROSTER_PREVIEW[selectedCoach.teamId].slice(0, 9).map(p => ({ name: p.name, jersey: p.jersey }))
      : DEMO_SHOUTOUT_PLAYERS;

    const handleTap = () => {
      setTapCount(c => c + 1);
      Animated.sequence([
        Animated.timing(tapScaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
        Animated.timing(tapScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    };

    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={cv.banner}>
          <TouchableOpacity onPress={() => setLevel('coach-view')} style={cv.bannerBack}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={cv.bannerBackTxt}>Coach Dashboard</Text>
          </TouchableOpacity>
          <View style={cv.bannerBadge}>
            <Ionicons name="eye-outline" size={12} color="#fff" />
            <Text style={cv.bannerBadgeTxt}>Admin Preview</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          <View style={cv.section}>
            <Text style={cv.sectionLabel}>GAME DAY LIVE — FAN ENGAGEMENT</Text>
            <View style={cv.liveBadgeRow}>
              <View style={cv.liveDot} />
              <Text style={cv.liveChipTxt}>LIVE · Riverside vs Hawks · Q3</Text>
            </View>

            {/* Tap button */}
            <View style={{ alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.lg }}>
              <Animated.View style={{ transform: [{ scale: tapScaleAnim }] }}>
                <TouchableOpacity style={cv.tapBtn} onPress={handleTap} activeOpacity={0.8}>
                  <Ionicons name="flash" size={32} color={Colors.bg} />
                  <Text style={cv.tapBtnTxt}>LIVE TAP</Text>
                </TouchableOpacity>
              </Animated.View>
              <Text style={cv.tapCounter}>{tapCount}</Text>
              <Text style={cv.tapCounterLabel}>TAPS · {Math.floor(tapCount / 3)} PTS</Text>
            </View>

            {/* Shoutout grid */}
            <Text style={[cv.sectionLabel, { marginTop: Spacing.sm }]}>SHOUT OUT A PLAYER</Text>
            <View style={cv.shoutGrid}>
              {liveRoster.map((p, i) => {
                const count = shoutouts[p.name] ?? PRESET_SHOUTOUTS[i] ?? 0;
                const firstName = p.name.split(' ')[0];
                const lastName = p.name.split(' ')[1] ?? '';
                const isActive = (shoutouts[p.name] !== undefined) || (PRESET_SHOUTOUTS[i] > 0);
                return (
                  <TouchableOpacity
                    key={p.jersey}
                    style={[cv.shoutCell, isActive && cv.shoutCellActive]}
                    onPress={() => setShoutouts(prev => ({ ...prev, [p.name]: (prev[p.name] ?? PRESET_SHOUTOUTS[i] ?? 0) + 1 }))}
                    activeOpacity={0.7}
                  >
                    <View style={cv.shoutBadge}>
                      <Text style={cv.shoutBadgeTxt}>{count}</Text>
                    </View>
                    <Text style={cv.shoutFirst}>{firstName}</Text>
                    <Text style={cv.shoutLast}>{lastName}</Text>
                    <Text style={cv.shoutJersey}>#{p.jersey}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
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
      { icon: 'stats-chart-outline', label: 'Stat Tracker', dest: 'stat-demo' as Level },
      { icon: 'people-outline',      label: 'Roster',       dest: null },
      { icon: 'book-outline',        label: 'Playbook',     dest: 'playbook' as Level },
      { icon: 'chatbubbles-outline', label: 'Team Chat',    dest: null },
      { icon: 'flash-outline',       label: 'Game Day',     dest: 'live-taps' as Level },
    ];

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
              {quickActions.map(qa => qa.dest ? (
                <TouchableOpacity
                  key={qa.label}
                  style={[cv.qaCard, cv.qaCardTappable]}
                  onPress={() => setLevel(qa.dest!)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={qa.icon as any} size={22} color={Colors.cyan} />
                  <Text style={cv.qaLabel}>{qa.label}</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.dim} style={{ position: 'absolute', top: 8, right: 8 }} />
                </TouchableOpacity>
              ) : (
                <View key={qa.label} style={cv.qaCard}>
                  <Ionicons name={qa.icon as any} size={22} color={Colors.dim} />
                  <Text style={[cv.qaLabel, { color: Colors.dim }]}>{qa.label}</Text>
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
  qaCard:        { flex: 1, minWidth: '44%', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  qaCardTappable:{ borderColor: `${Colors.cyan}40` },
  qaLabel:       { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: '#fff', textAlign: 'center' },

  rosterCard:    { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  rosterRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  rosterNum:     { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.cyan, width: 28 },
  rosterName:    { flex: 1, fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },
  rosterPos:     { fontFamily: Fonts.mono, fontSize: 12, color: Colors.dim },
  rosterEmpty:   { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted, padding: Spacing.md },

  evDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 3 },

  // ── Playbook ──────────────────────────────────────────────────────────────
  filterTab:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  filterTabActive:  { borderColor: Colors.cyan, backgroundColor: `${Colors.cyan}15` },
  filterTabTxt:     { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.dim },
  filterTabTxtActive:{ color: Colors.cyan },

  playGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  playCard:    { flex: 1, minWidth: '46%', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  playAccent:  { height: 3 },
  playThumb:   { height: 80, backgroundColor: Colors.bgDeep, alignItems: 'center', justifyContent: 'center' },
  fieldCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.green}50` },
  fieldLine:   { position: 'absolute', left: 8, right: 8, top: 39, height: 1, backgroundColor: `${Colors.green}30` },
  playInfo:    { padding: Spacing.sm },
  playName:    { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: '#fff', marginBottom: 4 },
  catTag:      { alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: 4, paddingVertical: 1 },
  catTagTxt:   { fontFamily: Fonts.monoBold, fontSize: 9 },

  // ── Stat demo ─────────────────────────────────────────────────────────────
  scoreBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  scoreTeam:   { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.dim, flex: 1, textAlign: 'center' },
  scoreBox:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scoreNum:    { fontFamily: Fonts.orbitron, fontSize: 28, color: Colors.amber },
  scoreSep:    { fontFamily: Fonts.orbitron, fontSize: 20, color: Colors.dim },
  modeChip:    { backgroundColor: `${Colors.cyan}12`, borderRadius: Radius.sm, padding: Spacing.sm, alignItems: 'center', marginBottom: Spacing.xs },
  modeChipTxt: { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.cyan, letterSpacing: 0.3 },

  statGrid:         { flexDirection: 'row', flexWrap: 'wrap' },
  statTileWrap:     { width: '33.33%', padding: 4 },
  statTileCard:     { alignItems: 'center', paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  statTileCardSel:  { borderColor: Colors.cyan, backgroundColor: `${Colors.cyan}0d` },
  statTileLabel:    { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.dim },
  statTileLabelSel: { color: Colors.cyan },

  statPlayerRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  statPlayerRowRecent: { backgroundColor: `${Colors.amber}10` },
  recordedBadge:       { backgroundColor: `${Colors.green}20`, borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  recordedBadgeTxt:    { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.green },
  statBadgeRow:        { flexDirection: 'row', gap: 4 },
  statCount:           { backgroundColor: `${Colors.cyan}15`, borderRadius: Radius.sm, paddingHorizontal: 4, paddingVertical: 1 },
  statCountTxt:        { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.cyan },

  // ── Live taps ─────────────────────────────────────────────────────────────
  liveBadgeRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  liveDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  liveChipTxt:     { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.dim },

  tapBtn:          { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.amber, alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  tapBtnTxt:       { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.bg },
  tapCounter:      { fontFamily: Fonts.orbitron, fontSize: 52, color: '#fff', marginTop: Spacing.md, textAlign: 'center' },
  tapCounterLabel: { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.dim, textAlign: 'center' },

  shoutGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  shoutCell:       { flexBasis: '31%', flexGrow: 1, maxWidth: '33%', backgroundColor: Colors.bgDeep, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.sm, paddingTop: Spacing.md, alignItems: 'center', minHeight: 80, justifyContent: 'center', position: 'relative' },
  shoutCellActive: { borderColor: `${Colors.amber}66`, backgroundColor: `${Colors.amber}0a` },
  shoutBadge:      { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.amber, alignItems: 'center', justifyContent: 'center' },
  shoutBadgeTxt:   { fontFamily: Fonts.monoBold, fontSize: 9, color: Colors.bg },
  shoutFirst:      { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },
  shoutLast:       { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim },
  shoutJersey:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
});
