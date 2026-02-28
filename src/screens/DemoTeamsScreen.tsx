import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Fonts, AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { useDemoAC } from '../lib/demoTheme';
import { Ionicons } from '@expo/vector-icons';
import { DEMO_SPORTS, DEMO_LEAGUES, DEMO_TEAMS, DEMO_ROSTER_PREVIEW, INITIAL_DEMO_EVENTS, DemoTeam, DemoLeague } from '../lib/demoData';

interface Props { navigate?: (s: AdminSection, param?: string) => void; initialSportId?: string; }

type DrillLevel = 'sports' | 'leagues' | 'teams' | 'hub';

function generateTeamCode(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase();
  const digits = String(Math.floor(100 + Math.random() * 900));
  return (letters + digits).padEnd(5, 'X');
}

export default function DemoTeamsScreen({ navigate, initialSportId }: Props) {
  const AC = useDemoAC();
  const s  = useMemo(() => makeStyles(AC), [AC]);

  const sportColor      = useMemo(() => ({ soccer: AC.soccer,    baseball: AC.baseball,   basketball: AC.basketball   }), [AC]);
  const sportColorLight = useMemo(() => ({ soccer: AC.greenLight, baseball: AC.amberLight, basketball: AC.orangeLight  }), [AC]);
  const eventTypeColor  = useMemo(() => ({ game: AC.amber, practice: AC.green, meeting: AC.purple, tournament: AC.primary }), [AC]);

  const [level, setLevel]           = useState<DrillLevel>('sports');
  const [activeSport, setActiveSport]   = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);
  const [activeTeam, setActiveTeam] = useState<DemoTeam | null>(null);
  const [localTeams, setLocalTeams] = useState<DemoTeam[]>(DEMO_TEAMS);
  const [localLeagues, setLocalLeagues] = useState<DemoLeague[]>(DEMO_LEAGUES);
  const [addTeamVisible, setAddTeamVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newCoachName, setNewCoachName] = useState('');
  const [addLeagueVisible, setAddLeagueVisible] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueType, setNewLeagueType] = useState('Recreational');
  const [newLeagueAge, setNewLeagueAge] = useState('');
  const [newLeagueReg, setNewLeagueReg] = useState(false);
  const [lastCreatedCode, setLastCreatedCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [hubCodeCopied, setHubCodeCopied] = useState(false);

  // Auto-drill: sport ID → leagues level, team ID → team hub level
  useEffect(() => {
    if (!initialSportId) return;
    const teamMatch = DEMO_TEAMS.find(t => t.id === initialSportId);
    if (teamMatch) {
      setActiveSport(teamMatch.sportId);
      setActiveLeague(teamMatch.leagueId);
      setActiveTeam(teamMatch);
      setLevel('hub');
    } else {
      setActiveSport(initialSportId);
      setLevel('leagues');
    }
  }, []);

  const sport  = DEMO_SPORTS.find(sp => sp.id === activeSport);
  const league = localLeagues.find(l => l.id === activeLeague);

  function handleAddLeague() {
    if (!newLeagueName.trim() || !newLeagueAge.trim() || !activeSport) return;
    const newLeague: DemoLeague = {
      id: `league-new-${Date.now()}`,
      sportId: activeSport,
      name: newLeagueType,
      ageGroup: newLeagueAge.trim(),
      teamCount: 0,
      athleteCount: 0,
      registrationOpen: newLeagueReg,
      leagueName: newLeagueName.trim(),
    };
    setLocalLeagues(prev => [...prev, newLeague]);
    setNewLeagueName('');
    setNewLeagueType('Recreational');
    setNewLeagueAge('');
    setNewLeagueReg(false);
    setAddLeagueVisible(false);
  }

  function handleAddTeam() {
    if (!newTeamName.trim() || !activeLeague || !activeSport) return;
    const code = generateTeamCode(newTeamName.trim());
    const newTeam: DemoTeam = {
      id: `team-new-${Date.now()}`,
      leagueId: activeLeague,
      sportId: activeSport,
      name: newTeamName.trim(),
      coach: newCoachName.trim() || 'Pending',
      athletes: 0,
      status: newCoachName.trim() ? 'active' : 'setup',
      code,
    };
    setLocalTeams(prev => [...prev, newTeam]);
    setNewTeamName('');
    setNewCoachName('');
    setLastCreatedCode(code);
  }

  function handleCopyCode(code: string, hub = false) {
    navigator.clipboard?.writeText(code).catch(() => {});
    if (hub) {
      setHubCodeCopied(true);
      setTimeout(() => setHubCodeCopied(false), 2000);
    } else {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  // ── Breadcrumb ─────────────────────────────────────────────────────────────
  function Breadcrumb() {
    return (
      <View style={s.breadcrumb}>
        <TouchableOpacity onPress={() => { setLevel('sports'); setActiveSport(null); setActiveLeague(null); }}>
          <Text style={[s.breadcrumbItem, level === 'sports' && s.breadcrumbActive]}>Sports</Text>
        </TouchableOpacity>
        {activeSport && (
          <>
            <Text style={s.breadcrumbSep}>/</Text>
            <TouchableOpacity onPress={() => { setLevel('leagues'); setActiveLeague(null); }}>
              <Text style={[s.breadcrumbItem, level === 'leagues' && s.breadcrumbActive]}>{sport?.name}</Text>
            </TouchableOpacity>
          </>
        )}
        {activeLeague && (
          <>
            <Text style={s.breadcrumbSep}>/</Text>
            <TouchableOpacity onPress={() => { setLevel('teams'); setActiveTeam(null); }}>
              <Text style={[s.breadcrumbItem, level === 'teams' && s.breadcrumbActive]}>{league?.name} {league?.ageGroup}</Text>
            </TouchableOpacity>
          </>
        )}
        {activeTeam && (
          <>
            <Text style={s.breadcrumbSep}>/</Text>
            <Text style={[s.breadcrumbItem, s.breadcrumbActive]}>{activeTeam.name}</Text>
          </>
        )}
      </View>
    );
  }

  // ── Level 1: Sports ────────────────────────────────────────────────────────
  if (level === 'sports') {
    return (
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <Text style={s.pageTitle}>Sports &amp; Leagues</Text>
          <Text style={s.pageSub}>Select a sport to manage its leagues and teams</Text>
        </View>
        <Breadcrumb />
        <View style={s.sportsGrid}>
          {DEMO_SPORTS.map(sp => {
            const leagues  = DEMO_LEAGUES.filter(l => l.sportId === sp.id);
            const athletes = leagues.reduce((a, l) => a + l.athleteCount, 0);
            const teams    = leagues.reduce((a, l) => a + l.teamCount, 0);
            const openReg  = leagues.filter(l => l.registrationOpen).length;

            if (!sp.available) {
              return (
                <View key={sp.id} style={[s.sportCard, s.sportCardDim]}>
                  <View style={s.sportCardLeft}>
                    <View style={[s.sportIcon, { backgroundColor: AC.border }]}>
                      <Text style={{ fontSize: 28, opacity: 0.4 }}>{sp.emoji}</Text>
                    </View>
                    <View style={s.sportCardInfo}>
                      <View style={s.sportNameRow}>
                        <Text style={[s.sportName, s.sportNameDim]}>{sp.name}</Text>
                        <View style={s.comingSoonBadge}>
                          <Text style={s.comingSoonTxt}>COMING SOON</Text>
                        </View>
                      </View>
                      <Text style={[s.sportMetaTxt, { color: AC.muted }]}>Not yet configured for this season</Text>
                    </View>
                  </View>
                  <Ionicons name="lock-closed-outline" size={16} color={AC.muted} />
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={sp.id}
                style={s.sportCard}
                onPress={() => { setActiveSport(sp.id); setLevel('leagues'); }}
                activeOpacity={0.8}
              >
                <View style={s.sportCardLeft}>
                  <View style={[s.sportIcon, { backgroundColor: sportColorLight[sp.id as keyof typeof sportColorLight] }]}>
                    <Text style={{ fontSize: 28 }}>{sp.emoji}</Text>
                  </View>
                  <View style={s.sportCardInfo}>
                    <Text style={s.sportName}>{sp.name}</Text>
                    <View style={s.sportMeta}>
                      <Text style={s.sportMetaTxt}>{leagues.length} leagues</Text>
                      <Text style={s.sportMetaDot}>·</Text>
                      <Text style={s.sportMetaTxt}>{teams} teams</Text>
                      <Text style={s.sportMetaDot}>·</Text>
                      <Text style={s.sportMetaTxt}>{athletes} athletes</Text>
                    </View>
                    {openReg > 0 && (
                      <View style={s.regOpenBadge}>
                        <Text style={s.regOpenTxt}>Registration open · {openReg} {openReg === 1 ? 'league' : 'leagues'}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[s.chevron, { color: sportColor[sp.id as keyof typeof sportColor] }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  // ── Level 2: Leagues within a sport ───────────────────────────────────────
  if (level === 'leagues' && activeSport) {
    const leagues = localLeagues.filter(l => l.sportId === activeSport);
    return (
      <>
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>{sport?.emoji} {sport?.name}</Text>
            <Text style={s.pageSub}>{leagues.length} leagues · Fall 2025</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setAddLeagueVisible(true)}>
            <Text style={s.addBtnTxt}>+ Add League</Text>
          </TouchableOpacity>
        </View>
        <Breadcrumb />

        {/* Group by league type */}
        {['Recreational', 'Travel', 'Competitive'].map(type => {
          const group = leagues.filter(l => l.name === type);
          if (!group.length) return null;
          return (
            <View key={type} style={s.leagueGroup}>
              <Text style={s.leagueGroupTitle}>{type}</Text>
              {group.map(lg => (
                <TouchableOpacity
                  key={lg.id}
                  style={s.leagueRow}
                  onPress={() => { setActiveLeague(lg.id); setLevel('teams'); }}
                  activeOpacity={0.8}
                >
                  <View style={[s.leagueAgeTag, { backgroundColor: sportColorLight[activeSport as keyof typeof sportColorLight] }]}>
                    <Text style={[s.leagueAgeTxt, { color: sportColor[activeSport as keyof typeof sportColor] }]}>{lg.ageGroup}</Text>
                  </View>
                  <View style={s.leagueInfo}>
                    <Text style={s.leagueName}>{lg.leagueName || lg.name} · {lg.ageGroup}</Text>
                    <Text style={s.leagueMeta}>{lg.teamCount} teams · {lg.athleteCount} athletes</Text>
                  </View>
                  {lg.registrationOpen && (
                    <View style={s.regBadge}>
                      <View style={s.regDot} />
                      <Text style={s.regBadgeTxt}>Open</Text>
                    </View>
                  )}
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={addLeagueVisible} transparent animationType="fade" onRequestClose={() => setAddLeagueVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setAddLeagueVisible(false)} />
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Add League</Text>

            <Text style={s.modalLabel}>LEAGUE NAME *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. Spring 2025 Rec Soccer"
              placeholderTextColor={AC.muted}
              value={newLeagueName}
              onChangeText={setNewLeagueName}
              autoFocus
            />

            <Text style={s.modalLabel}>LEAGUE TYPE</Text>
            <View style={s.chipRow}>
              {['Recreational', 'Travel', 'Competitive'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, newLeagueType === t && s.chipSel]}
                  onPress={() => setNewLeagueType(t)}
                >
                  <Text style={[s.chipTxt, newLeagueType === t && s.chipTxtSel]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.modalLabel}>AGE GROUP *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="e.g. U10, U8-U10, Adult"
              placeholderTextColor={AC.muted}
              value={newLeagueAge}
              onChangeText={setNewLeagueAge}
            />

            <TouchableOpacity style={s.toggleRow} onPress={() => setNewLeagueReg(v => !v)}>
              <View style={[s.toggle, newLeagueReg && s.toggleOn]}>
                <View style={[s.toggleThumb, newLeagueReg && s.toggleThumbOn]} />
              </View>
              <Text style={s.toggleLabel}>Registration open</Text>
            </TouchableOpacity>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancel} onPress={() => setAddLeagueVisible(false)}>
                <Text style={s.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirm, (!newLeagueName.trim() || !newLeagueAge.trim()) && s.modalConfirmDim]}
                onPress={handleAddLeague}
                disabled={!newLeagueName.trim() || !newLeagueAge.trim()}
              >
                <Text style={s.modalConfirmTxt}>Add League</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </>
    );
  }

  // ── Level 3: Teams within a league ────────────────────────────────────────
  if (level === 'teams' && activeLeague) {
    const teams = localTeams.filter(t => t.leagueId === activeLeague);
    return (
      <>
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>{league?.name} · {league?.ageGroup}</Text>
            <Text style={s.pageSub}>{sport?.emoji} {sport?.name} · {teams.length} teams · {league?.athleteCount} athletes</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setAddTeamVisible(true)}>
            <Text style={s.addBtnTxt}>+ Add Team</Text>
          </TouchableOpacity>
        </View>
        <Breadcrumb />

        <View style={s.teamList}>
          {teams.map(team => {
            const roster = DEMO_ROSTER_PREVIEW[team.id] ?? [];
            const statusColor = team.status === 'active' ? AC.green : AC.amber;
            const statusBg    = team.status === 'active' ? AC.greenLight : AC.amberLight;
            return (
              <TouchableOpacity
                key={team.id}
                style={s.teamCard}
                onPress={() => { setActiveTeam(team); setLevel('hub'); }}
                activeOpacity={0.8}
              >
                <View style={s.teamCardLeft}>
                  <Text style={s.teamName}>{team.name}</Text>
                  <View style={s.teamCardMeta}>
                    <Text style={team.status === 'setup' ? s.coachPending : s.coachName}>{team.coach}</Text>
                    <Text style={s.teamCodeInline}>{team.code}</Text>
                  </View>
                </View>
                <View style={s.teamCardRight}>
                  <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[s.statusTxt, { color: statusColor }]}>
                      {team.status === 'active' ? 'Active' : 'Needs Setup'}
                    </Text>
                  </View>
                  <Text style={s.athleteCount}>{roster.length || team.athletes} athletes</Text>
                  <Text style={s.chevron}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal
        visible={addTeamVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setAddTeamVisible(false); setLastCreatedCode(null); setCodeCopied(false); }}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => { if (!lastCreatedCode) { setAddTeamVisible(false); } }}
          />
          <View style={s.modalSheet}>
            {lastCreatedCode ? (
              <>
                <View style={s.successIconRow}>
                  <Ionicons name="checkmark-circle" size={32} color={AC.green} />
                  <Text style={[s.modalTitle, { marginBottom: 0, marginLeft: AS.sm }]}>Team Created!</Text>
                </View>
                <Text style={[s.modalLabel, { marginTop: AS.lg }]}>TEAM CODE</Text>
                <View style={[s.codeBox, { backgroundColor: AC.primaryLight, borderColor: AC.primary }]}>
                  <Text style={[s.codeTxt, { color: AC.primary }]}>{lastCreatedCode}</Text>
                  <TouchableOpacity
                    style={[s.copyBtn, { backgroundColor: codeCopied ? AC.green : AC.primary }]}
                    onPress={() => handleCopyCode(lastCreatedCode)}
                  >
                    <Text style={s.copyBtnTxt}>{codeCopied ? 'Copied!' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[s.modalHint, { marginTop: AS.sm }]}>
                  Share this code with your coach so they can claim the team in the app. Athletes and supporters use it too.
                </Text>
                <TouchableOpacity
                  style={[s.modalConfirm, { marginTop: AS.lg }]}
                  onPress={() => { setAddTeamVisible(false); setLastCreatedCode(null); setCodeCopied(false); }}
                >
                  <Text style={s.modalConfirmTxt}>Done</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.modalTitle}>Add Team</Text>
                <Text style={s.modalLabel}>TEAM NAME *</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="e.g. Blue Thunder FC"
                  placeholderTextColor={AC.muted}
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  autoFocus
                />
                <Text style={s.modalLabel}>COACH NAME (optional)</Text>
                <TextInput
                  style={s.modalInput}
                  placeholder="e.g. Sarah Johnson"
                  placeholderTextColor={AC.muted}
                  value={newCoachName}
                  onChangeText={setNewCoachName}
                />
                {!newCoachName.trim() && (
                  <Text style={s.modalHint}>No coach — team will be marked "Needs Setup"</Text>
                )}
                <View style={s.modalActions}>
                  <TouchableOpacity style={s.modalCancel} onPress={() => setAddTeamVisible(false)}>
                    <Text style={s.modalCancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.modalConfirm, !newTeamName.trim() && s.modalConfirmDim]}
                    onPress={handleAddTeam}
                    disabled={!newTeamName.trim()}
                  >
                    <Text style={s.modalConfirmTxt}>Add Team</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
    );
  }

  // ── Level 4: Team Hub ─────────────────────────────────────────────────────
  if (level === 'hub' && activeTeam) {
    const roster  = DEMO_ROSTER_PREVIEW[activeTeam.id] ?? [];
    const events  = INITIAL_DEMO_EVENTS.filter(e => e.teamId === activeTeam.id).slice(0, 3);
    const hasCoach = activeTeam.coach !== 'Pending';
    const sColor   = activeSport ? sportColor[activeSport as keyof typeof sportColor] : AC.primary;
    const sColorLt = activeSport ? sportColorLight[activeSport as keyof typeof sportColorLight] : AC.border;

    return (
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Breadcrumb />

        {/* ── Team header ── */}
        <View style={s.hubHeader}>
          <View style={[s.hubSportBadge, { backgroundColor: sColorLt }]}>
            <Text style={[s.hubSportTxt, { color: sColor }]}>{sport?.emoji} {sport?.name}</Text>
          </View>
          <Text style={s.hubTeamName}>{activeTeam.name}</Text>
          <Text style={s.hubLeagueTxt}>{league?.name} · {league?.ageGroup}</Text>
        </View>

        {/* ── Coach Card ── */}
        <View style={s.hubSection}>
          <Text style={s.hubSectionTitle}>COACH</Text>
          <View style={s.hubCoachCard}>
            <View style={s.hubCoachAvatar}>
              <Text style={s.hubCoachAvatarTxt}>{hasCoach ? activeTeam.coach.charAt(0).toUpperCase() : '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.hubCoachName}>{hasCoach ? activeTeam.coach : 'No coach assigned'}</Text>
              <View style={[s.hubCoachStatus, {
                backgroundColor: hasCoach
                  ? activeTeam.status === 'active' ? AC.greenLight : AC.amberLight
                  : AC.amberLight,
              }]}>
                <View style={[s.hubCoachDot, {
                  backgroundColor: hasCoach
                    ? activeTeam.status === 'active' ? AC.green : AC.amber
                    : AC.amber,
                }]} />
                <Text style={[s.hubCoachStatusTxt, {
                  color: hasCoach
                    ? activeTeam.status === 'active' ? AC.green : AC.amber
                    : AC.amber,
                }]}>
                  {hasCoach
                    ? activeTeam.status === 'active' ? 'Active Coach' : 'Invite Sent · Pending Acceptance'
                    : 'Needs Coach'}
                </Text>
              </View>
            </View>
            {hasCoach ? (
              <TouchableOpacity style={s.hubCoachMsgBtn} onPress={() => navigate?.('comms')}>
                <Text style={s.hubCoachMsgTxt}>Message</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.hubCoachMsgBtn}>
                <Text style={s.hubCoachMsgTxt}>Invite</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Join Code ── */}
        <View style={s.hubSection}>
          <Text style={s.hubSectionTitle}>JOIN CODE</Text>
          <View style={[s.codeBox, { backgroundColor: AC.primaryLight, borderColor: AC.primary }]}>
            <Text style={[s.codeTxt, { color: AC.primary }]}>{activeTeam.code}</Text>
            <TouchableOpacity
              style={[s.copyBtn, { backgroundColor: hubCodeCopied ? AC.green : AC.primary }]}
              onPress={() => handleCopyCode(activeTeam.code, true)}
            >
              <Text style={s.copyBtnTxt}>{hubCodeCopied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.hubEmptyTxt, { marginTop: AS.xs }]}>
            Share with coaches, athletes & supporters to join this team hub.
          </Text>
        </View>

        {/* ── Roster ── */}
        <View style={s.hubSection}>
          <View style={s.hubSectionHeader}>
            <Text style={s.hubSectionTitle}>ROSTER</Text>
            <View style={s.hubPill}><Text style={s.hubPillTxt}>{roster.length || activeTeam.athletes} athletes</Text></View>
          </View>
          {roster.length > 0 ? (
            <View style={s.rosterTable}>
              <View style={s.rosterHeader}>
                <Text style={[s.rosterHeaderTxt, { width: 36 }]}>#</Text>
                <Text style={[s.rosterHeaderTxt, { flex: 1 }]}>Name</Text>
                <Text style={[s.rosterHeaderTxt, { width: 48 }]}>Pos</Text>
              </View>
              {roster.map(p => (
                <View key={p.jersey} style={s.rosterRow}>
                  <Text style={[s.rosterCell, { width: 36, color: AC.primary }]}>{p.jersey}</Text>
                  <Text style={[s.rosterCell, { flex: 1 }]}>{p.name}</Text>
                  <Text style={[s.rosterCell, { width: 48, color: AC.sub }]}>{p.pos}</Text>
                </View>
              ))}
            </View>
          ) : activeTeam.athletes > 0 ? (
            <View style={s.hubEmptyBox}>
              <Text style={s.hubEmptyTxt}>{activeTeam.athletes} athletes enrolled — detailed roster available in the coach's app.</Text>
            </View>
          ) : (
            <View style={s.hubEmptyBox}>
              <Text style={s.hubEmptyTxt}>No athletes yet — they'll appear here automatically as they join with the team code.</Text>
            </View>
          )}
        </View>

        {/* ── Upcoming Events ── */}
        <View style={s.hubSection}>
          <View style={s.hubSectionHeader}>
            <Text style={s.hubSectionTitle}>UPCOMING EVENTS</Text>
            <TouchableOpacity onPress={() => navigate?.('schedule')}>
              <Text style={s.hubSeeAll}>See all →</Text>
            </TouchableOpacity>
          </View>
          {events.length > 0 ? events.map(ev => (
            <View key={ev.id} style={s.hubEventRow}>
              <View style={[s.hubEventTypeDot, { backgroundColor: eventTypeColor[ev.type as keyof typeof eventTypeColor] ?? AC.primary }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.hubEventTitle}>{ev.title}</Text>
                <Text style={s.hubEventMeta}>{ev.date} · {ev.time} · {ev.location}</Text>
              </View>
            </View>
          )) : (
            <View style={s.hubEmptyBox}>
              <Text style={s.hubEmptyTxt}>No upcoming events scheduled yet.</Text>
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.hubActions}>
          <TouchableOpacity style={s.hubActionBtn} onPress={() => navigate?.('schedule')}>
            <Text style={s.hubActionTxt}>📅  View Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.hubActionBtn} onPress={() => navigate?.('comms')}>
            <Text style={s.hubActionTxt}>💬  Message Coach</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(AC: ACPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: AC.bg },
    scroll: { padding: AS.xl },

    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: AS.md },
    pageTitle:  { fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: AC.text },
    pageSub:    { fontFamily: Fonts.rajdhani, fontSize: 14, color: AC.muted, marginTop: 2 },
    addBtn:     { borderWidth: 1, borderColor: AC.border2, borderRadius: AR.md, paddingHorizontal: AS.md, paddingVertical: AS.sm },
    addBtnTxt:  { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.primary },

    breadcrumb:       { flexDirection: 'row', alignItems: 'center', gap: AS.xs, marginBottom: AS.xl, flexWrap: 'wrap' },
    breadcrumbItem:   { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.primary },
    breadcrumbActive: { color: AC.sub, textDecorationLine: 'underline' },
    breadcrumbSep:    { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },

    // Sports level
    sportsGrid: { gap: AS.md },
    sportCard:     { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.xl, flexDirection: 'row', alignItems: 'center', gap: AS.lg },
    sportCardDim:  { opacity: 0.55 },
    sportCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: AS.lg },
    sportIcon:     { width: 56, height: 56, borderRadius: AR.lg, alignItems: 'center', justifyContent: 'center' },
    sportCardInfo: { flex: 1, gap: 4 },
    sportNameRow:  { flexDirection: 'row', alignItems: 'center', gap: AS.sm, flexWrap: 'wrap' },
    sportName:     { fontFamily: Fonts.rajdhaniBold, fontSize: 18, color: AC.text },
    sportNameDim:  { color: AC.muted },
    comingSoonBadge: { backgroundColor: AC.border, borderRadius: AR.full, paddingHorizontal: 8, paddingVertical: 2 },
    comingSoonTxt:   { fontFamily: Fonts.monoBold, fontSize: 9, color: AC.muted, letterSpacing: 0.5 },
    sportMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    sportMetaTxt:  { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    sportMetaDot:  { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },
    regOpenBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    regOpenTxt:    { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.green },
    chevron:       { fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: AC.muted },

    // Leagues level
    leagueGroup:      { marginBottom: AS.xl },
    leagueGroupTitle: { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.sub, marginBottom: AS.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
    leagueRow:        { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.lg, flexDirection: 'row', alignItems: 'center', gap: AS.md, marginBottom: AS.sm },
    leagueAgeTag:     { borderRadius: AR.md, paddingHorizontal: AS.md, paddingVertical: AS.xs, minWidth: 44, alignItems: 'center' },
    leagueAgeTxt:     { fontFamily: Fonts.monoBold, fontSize: 12 },
    leagueInfo:       { flex: 1 },
    leagueName:       { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: AC.text },
    leagueMeta:       { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub, marginTop: 2 },
    regBadge:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
    regDot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: AC.green },
    regBadgeTxt:      { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.green },

    // Teams level
    teamList: { gap: AS.md },
    teamCard: { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.lg, flexDirection: 'row', alignItems: 'center', gap: AS.md },
    teamCardLeft:   { flex: 1 },
    teamCardRight:  { alignItems: 'flex-end', gap: 4 },
    teamName:       { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: AC.text },
    teamCardMeta:   { flexDirection: 'row', alignItems: 'center', gap: AS.sm, marginTop: 2 },
    coachName:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    coachPending:   { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.amber },
    teamCodeInline: { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.primary, backgroundColor: AC.primaryLight, paddingHorizontal: 5, paddingVertical: 1, borderRadius: AR.sm },
    statusBadge:    { borderRadius: AR.full, paddingHorizontal: AS.sm, paddingVertical: 2 },
    statusTxt:      { fontFamily: Fonts.rajdhani, fontSize: 12 },
    athleteCount:   { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },

    // Roster table (shared: teams level + hub)
    rosterTable:    { borderRadius: AR.md, borderWidth: 1, borderColor: AC.border, overflow: 'hidden' },
    rosterHeader:   { flexDirection: 'row', backgroundColor: AC.bg, padding: AS.sm, gap: AS.sm, borderBottomWidth: 1, borderBottomColor: AC.border },
    rosterHeaderTxt:{ fontFamily: Fonts.rajdhaniBold, fontSize: 11, color: AC.muted, textTransform: 'uppercase' },
    rosterRow:      { flexDirection: 'row', padding: AS.sm, gap: AS.sm, borderBottomWidth: 1, borderBottomColor: AC.border },
    rosterCell:     { fontFamily: Fonts.rajdhani, fontSize: 14, color: AC.text },

    // Team Hub level
    hubHeader:       { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.xl, marginBottom: AS.lg, gap: AS.xs },
    hubSportBadge:   { alignSelf: 'flex-start', borderRadius: AR.full, paddingHorizontal: AS.md, paddingVertical: 3, marginBottom: AS.xs },
    hubSportTxt:     { fontFamily: Fonts.monoBold, fontSize: 12 },
    hubTeamName:     { fontFamily: Fonts.rajdhaniBold, fontSize: 26, color: AC.text },
    hubLeagueTxt:    { fontFamily: Fonts.rajdhani, fontSize: 14, color: AC.sub },

    hubSection:      { marginBottom: AS.xl },
    hubSectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: AS.sm, marginBottom: AS.md },
    hubSectionTitle: { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
    hubPill:         { backgroundColor: AC.border, borderRadius: AR.full, paddingHorizontal: AS.sm, paddingVertical: 2 },
    hubPillTxt:      { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.sub },
    hubSeeAll:       { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: AC.primary },

    hubCoachCard:    { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.lg, flexDirection: 'row', alignItems: 'center', gap: AS.md },
    hubCoachAvatar:  { width: 44, height: 44, borderRadius: 22, backgroundColor: AC.primary + '20', alignItems: 'center', justifyContent: 'center' },
    hubCoachAvatarTxt:{ fontFamily: Fonts.rajdhaniBold, fontSize: 20, color: AC.primary },
    hubCoachName:    { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: AC.text, marginBottom: 4 },
    hubCoachStatus:  { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: AR.full, paddingHorizontal: AS.sm, paddingVertical: 2 },
    hubCoachDot:     { width: 6, height: 6, borderRadius: 3 },
    hubCoachStatusTxt:{ fontFamily: Fonts.rajdhani, fontSize: 12 },
    hubCoachMsgBtn:  { borderWidth: 1, borderColor: AC.border2, borderRadius: AR.md, paddingHorizontal: AS.md, paddingVertical: AS.xs },
    hubCoachMsgTxt:  { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: AC.primary },

    hubEmptyBox:     { backgroundColor: AC.border + '40', borderRadius: AR.md, padding: AS.lg },
    hubEmptyTxt:     { fontFamily: Fonts.rajdhani, fontSize: 14, color: AC.sub, lineHeight: 20 },

    hubEventRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: AS.md, paddingVertical: AS.sm, borderBottomWidth: 1, borderBottomColor: AC.border },
    hubEventTypeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
    hubEventTitle:   { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    hubEventMeta:    { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub, marginTop: 2 },

    hubActions:      { flexDirection: 'row', gap: AS.md, marginTop: AS.sm },
    hubActionBtn:    { flex: 1, backgroundColor: AC.surface, borderWidth: 1, borderColor: AC.border2, borderRadius: AR.md, paddingVertical: AS.md, alignItems: 'center' },
    hubActionTxt:    { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.text },

    // Chip + toggle shared (Add League modal)
    chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: AS.sm },
    chip:          { borderWidth: 1, borderColor: AC.border2, borderRadius: AR.full, paddingHorizontal: AS.md, paddingVertical: AS.xs },
    chipSel:       { backgroundColor: AC.primary, borderColor: AC.primary },
    chipTxt:       { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.sub },
    chipTxtSel:    { color: '#fff' },
    toggleRow:     { flexDirection: 'row', alignItems: 'center', gap: AS.md },
    toggle:        { width: 40, height: 22, borderRadius: 11, backgroundColor: AC.border2, justifyContent: 'center', paddingHorizontal: 2 },
    toggleOn:      { backgroundColor: AC.primary },
    toggleThumb:   { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', alignSelf: 'flex-start' },
    toggleThumbOn: { alignSelf: 'flex-end' },
    toggleLabel:   { fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text },

    // Add Team modal
    modalOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet:      { backgroundColor: AC.surface, borderTopLeftRadius: AR.lg, borderTopRightRadius: AR.lg, padding: AS.xl, gap: AS.md },
    modalTitle:      { fontFamily: Fonts.rajdhaniBold, fontSize: 20, color: AC.text, marginBottom: AS.xs },
    modalLabel:      { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
    modalInput:      { backgroundColor: AC.bg, borderWidth: 1, borderColor: AC.border2, borderRadius: AR.md, paddingHorizontal: AS.md, paddingVertical: AS.sm, fontFamily: Fonts.rajdhani, fontSize: 16, color: AC.text },
    modalHint:       { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.amber, marginTop: -AS.xs },
    modalActions:    { flexDirection: 'row', gap: AS.md, marginTop: AS.sm },
    modalCancel:     { flex: 1, borderWidth: 1, borderColor: AC.border2, borderRadius: AR.md, paddingVertical: AS.md, alignItems: 'center' },
    modalCancelTxt:  { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.sub },
    modalConfirm:    { flex: 2, backgroundColor: AC.primary, borderRadius: AR.md, paddingVertical: AS.md, alignItems: 'center' },
    modalConfirmDim: { opacity: 0.4 },
    modalConfirmTxt: { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: '#fff' },

    // Team code
    successIconRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: AS.xs },
    codeBox:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: AR.md, paddingHorizontal: AS.lg, paddingVertical: AS.md, marginTop: AS.xs },
    codeTxt:         { fontFamily: Fonts.monoBold, fontSize: 28, letterSpacing: 2 },
    copyBtn:         { paddingHorizontal: AS.md, paddingVertical: AS.xs + 2, borderRadius: AR.md },
    copyBtnTxt:      { fontFamily: Fonts.monoBold, fontSize: 12, color: '#fff' },
  });
}
