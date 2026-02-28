import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated, useWindowDimensions, Platform,
} from 'react-native';
import { Fonts, AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { useDemoAC } from '../lib/demoTheme';
import {
  INITIAL_DEMO_EVENTS, DEMO_TEAMS, DEMO_SPORTS, DEMO_LEAGUES,
  DEMO_OPPONENTS, DEMO_LOCATIONS, DemoEvent,
} from '../lib/demoData';

interface Props { navigate?: (s: AdminSection, param?: string) => void; }

// ─── Date / time helpers ──────────────────────────────────────────────────────

const TODAY_ISO = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

function formatDateValue(iso: string): string {
  const D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const d = new Date(iso + 'T00:00:00');
  return `${D[d.getDay()]} ${M[d.getMonth()]} ${d.getDate()}`;
}


const HOURS   = ['12','1','2','3','4','5','6','7','8','9','10','11'];
const MINUTES = ['00','15','30','45'];

// ─── Wizard step types ────────────────────────────────────────────────────────

type StepKey = 'type' | 'sport' | 'league' | 'home' | 'away' | 'team' | 'date' | 'time' | 'location' | 'notes';

type Answers = {
  type: string; sportId: string; leagueId: string;
  homeId: string; awayId: string; awayExt: string;
  teamId: string; date: string; time: string; location: string; notes: string;
};

const EMPTY: Answers = {
  type: '', sportId: '', leagueId: '', homeId: '', awayId: '',
  awayExt: '', teamId: '', date: '', time: '', location: '', notes: '',
};

function nextStep(step: StepKey, type: string): StepKey | 'publish' {
  if (step === 'type')     return type === 'MEETING' ? 'date' : 'sport';
  if (step === 'sport')    return 'league';
  if (step === 'league')   return type === 'GAME' ? 'home' : 'team';
  if (step === 'home')     return 'away';
  if (step === 'away' || step === 'team') return 'date';
  if (step === 'date')     return 'time';
  if (step === 'time')     return 'location';
  if (step === 'location') return 'notes';
  return 'publish';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoScheduleScreen({ navigate }: Props) {
  const AC = useDemoAC();
  const s  = useMemo(() => makeStyles(AC), [AC]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const TYPE_OPTIONS = useMemo(() => [
    { id: 'GAME',       label: 'Game',       emoji: '🏆', desc: 'Scheduled match vs opponent',  color: AC.green   },
    { id: 'PRACTICE',   label: 'Practice',   emoji: '🎯', desc: 'Team training session',         color: AC.primary },
    { id: 'MEETING',    label: 'Meeting',    emoji: '📋', desc: 'Coaches or parents meeting',    color: AC.purple  },
    { id: 'TOURNAMENT', label: 'Tournament', emoji: '🥇', desc: 'Multi-team tournament day',     color: AC.orange  },
  ], [AC]);

  const EVENT_COLOR = useMemo(() => ({
    game: AC.green, practice: AC.primary, meeting: AC.purple, tournament: AC.orange,
  }), [AC]);
  const EVENT_COLOR_LIGHT = useMemo(() => ({
    game: AC.greenLight, practice: AC.primaryLight, meeting: AC.purpleLight, tournament: AC.orangeLight,
  }), [AC]);

  const [events, setEvents]         = useState<DemoEvent[]>(INITIAL_DEMO_EVENTS);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [showForm, setShowForm]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const [savedLocations, setSavedLocations] = useState<string[]>(DEMO_LOCATIONS);
  const [showLocDrop, setShowLocDrop]       = useState(false);

  // Wizard
  const [active, setActive]         = useState<StepKey | 'publish' | 'done'>('type');
  const [done, setDone]             = useState<StepKey[]>([]);
  const [ans, setAns]               = useState<Answers>(EMPTY);
  const [tempText, setTempText]     = useState('');
  const [lastPublished, setLastPublished] = useState('');
  const [timeHour, setTimeHour]     = useState('');
  const [timeMin, setTimeMin]       = useState('');
  const [timeAmPm, setTimeAmPm]     = useState('AM');
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const wizScrollRef                = useRef<ScrollView>(null);

  // Scroll to bottom whenever a new step is revealed
  useEffect(() => {
    if (showForm) setTimeout(() => wizScrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [active, showForm]);

  // Reset league selection when sport filter changes
  useEffect(() => { setSelectedLeague(null); }, [sportFilter]);

  // ── Lookup helpers ──────────────────────────────────────────────────────────
  const sport   = DEMO_SPORTS.find(sp => sp.id === ans.sportId);
  const league  = DEMO_LEAGUES.find(l => l.id === ans.leagueId);
  const homeTeam = DEMO_TEAMS.find(t => t.id === ans.homeId);
  const awayTeam = DEMO_TEAMS.find(t => t.id === ans.awayId);
  const singleTeam = DEMO_TEAMS.find(t => t.id === ans.teamId);
  const teamsInLeague  = DEMO_TEAMS.filter(t => t.leagueId === ans.leagueId);
  const extOpponents   = DEMO_OPPONENTS[ans.sportId] ?? [];
  const filteredLocs   = tempText
    ? savedLocations.filter(l => l.toLowerCase().includes(tempText.toLowerCase()) && l.toLowerCase() !== tempText.toLowerCase())
    : savedLocations;

  const awayLabel = awayTeam?.name ?? ans.awayExt;
  const isGame    = ans.type === 'GAME';

  // ── Wizard actions ──────────────────────────────────────────────────────────
  function openForm() {
    setActive('type'); setDone([]); setAns(EMPTY); setTempText(''); setLastPublished('');
    setTimeHour(''); setTimeMin(''); setTimeAmPm('AM'); setShowForm(true);
  }

  function resetWizard() {
    setActive('type'); setDone([]); setAns(EMPTY); setTempText(''); setLastPublished('');
    setTimeHour(''); setTimeMin(''); setTimeAmPm('AM');
  }

  function advance(step: StepKey, update: Partial<Answers>) {
    const newAns = { ...ans, ...update };
    setAns(newAns);
    setDone(prev => [...prev, step]);
    setActive(nextStep(step, newAns.type));
    setTempText('');
  }

  function confirmText(step: StepKey, key: keyof Answers, value: string) {
    if (!value.trim()) return;
    if (key === 'location') {
      if (!savedLocations.some(l => l.toLowerCase() === value.toLowerCase())) {
        setSavedLocations(prev => [value, ...prev]);
      }
    }
    advance(step, { [key]: value });
    setShowLocDrop(false);
  }

  function skipNotes() { advance('notes', { notes: '' }); }

  function showToast(msg: string) {
    setSuccessMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setSuccessMsg(''));
  }

  function handleSave() {
    setPublishing(true);
    setTimeout(() => {
      const title = isGame
        ? `${homeTeam?.name ?? 'Home'} vs ${awayLabel}`
        : ans.type.charAt(0) + ans.type.slice(1).toLowerCase();
      const team = isGame ? homeTeam : (ans.type === 'MEETING' ? undefined : singleTeam);
      const newEv: DemoEvent = {
        id: `new_${Date.now()}`,
        teamId:   ans.type === 'MEETING' ? 'all' : (team?.id ?? ''),
        teamName: ans.type === 'MEETING' ? 'All Teams' : (team?.name ?? 'Team'),
        sportId:  team?.sportId,
        type:     ans.type.toLowerCase() as DemoEvent['type'],
        title, date: ans.date, time: ans.time, location: ans.location, published: false,
      };
      setEvents(prev => [...prev, newEv]);
      setPublishing(false);
      setLastPublished(title);
      setActive('done');
    }, 600);
  }

  function publishEvent(id: string) {
    setEvents(prev => prev.map(ev => ev.id === id ? { ...ev, published: true } : ev));
  }

  // ── Confirmed step labels ───────────────────────────────────────────────────
  function confirmedValue(step: StepKey): string {
    const typeOpt = TYPE_OPTIONS.find(t => t.id === ans.type);
    switch (step) {
      case 'type':     return `${typeOpt?.emoji ?? ''} ${typeOpt?.label ?? ''}`;
      case 'sport':    return `${sport?.emoji ?? ''} ${sport?.name ?? ''}`;
      case 'league':   return `${league?.name ?? ''} · ${league?.ageGroup ?? ''}`;
      case 'home':     return homeTeam?.name ?? '';
      case 'away':     return awayLabel;
      case 'team':     return singleTeam?.name ?? '';
      case 'date':     return ans.date;
      case 'time':     return ans.time;
      case 'location': return ans.location;
      case 'notes':    return ans.notes || '(none)';
    }
  }
  function confirmedLabel(step: StepKey): string {
    const map: Record<StepKey, string> = {
      type: 'Event', sport: 'Sport', league: 'League',
      home: 'Home', away: 'Away', team: 'Team',
      date: 'Date', time: 'Time', location: 'Location', notes: 'Notes',
    };
    return map[step];
  }

  // ── Active step question labels ─────────────────────────────────────────────
  const QUESTIONS: Record<StepKey, string> = {
    type:     'What kind of event?',
    sport:    'Which sport?',
    league:   'Which league?',
    home:     'Select home team',
    away:     'Who are they playing?',
    team:     'Select team',
    date:     'Event date?',
    time:     'Start time?',
    location: 'Location?',
    notes:    'Any notes? (optional)',
  };

  // ── Flat league list for grid ───────────────────────────────────────────────
  type FlatLeague = {
    key: string; leagueId: string; sportId: string;
    sportName: string; sportEmoji: string; sportColor: string;
    leagueName: string; ageGroup: string;
    events: DemoEvent[]; unpublished: number;
  };

  const flatLeagues = useMemo((): FlatLeague[] => {
    const result: FlatLeague[] = [];
    for (const sp of DEMO_SPORTS) {
      if (sportFilter !== 'all' && sportFilter !== sp.id) continue;
      const spEvs = events.filter(ev => ev.sportId === sp.id);
      if (spEvs.length === 0) continue;
      const leagueMap = new Map<string, DemoEvent[]>();
      for (const ev of spEvs) {
        const team = DEMO_TEAMS.find(t => t.id === ev.teamId);
        const lid = team?.leagueId ?? 'other';
        if (!leagueMap.has(lid)) leagueMap.set(lid, []);
        leagueMap.get(lid)!.push(ev);
      }
      leagueMap.forEach((evs, lid) => {
        const lg = DEMO_LEAGUES.find(l => l.id === lid);
        result.push({
          key: `${sp.id}_${lid}`,
          leagueId: lid, sportId: sp.id,
          sportName: sp.name, sportEmoji: sp.emoji, sportColor: sp.color,
          leagueName: lg?.name ?? 'Other', ageGroup: lg?.ageGroup ?? '',
          events: evs, unpublished: evs.filter(e => !e.published).length,
        });
      });
    }
    const noSport = events.filter(ev => !ev.sportId);
    if (noSport.length > 0 && sportFilter === 'all') {
      result.push({
        key: 'all_meetings', leagueId: 'all', sportId: '',
        sportName: 'All Teams', sportEmoji: '📋', sportColor: AC.purple,
        leagueName: 'All Teams', ageGroup: '',
        events: noSport, unpublished: noSport.filter(e => !e.published).length,
      });
    }
    return result;
  }, [events, sportFilter, AC]);

  const selectedLeagueData = flatLeagues.find(lg => lg.key === selectedLeague) ?? null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      <Animated.View style={[s.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={s.toastTxt}>{successMsg}</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.pageHeader}>
          <View>
            <Text style={s.pageTitle}>Schedule</Text>
            <Text style={s.pageSub}>Fall 2025 · All Teams</Text>
          </View>
          <TouchableOpacity style={s.newBtn} onPress={openForm}>
            <Text style={s.newBtnTxt}>+ New Event</Text>
          </TouchableOpacity>
        </View>

        {/* Sport filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {[{ id: 'all', label: 'All Sports', emoji: '🗓' }, ...DEMO_SPORTS.map(sp => ({ id: sp.id, label: sp.name, emoji: sp.emoji }))].map(f => (
            <TouchableOpacity
              key={f.id}
              style={[s.filterPill, sportFilter === f.id && s.filterPillActive]}
              onPress={() => setSportFilter(f.id)}
              activeOpacity={0.75}
            >
              <Text style={s.filterPillEmoji}>{f.emoji}</Text>
              <Text style={[s.filterPillTxt, sportFilter === f.id && s.filterPillTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* League grid */}
        <View style={s.leagueGrid}>
          {flatLeagues.map(lg => (
            <TouchableOpacity
              key={lg.key}
              style={[s.leagueGridCard, { width: isDesktop ? '31%' : '47%' }, selectedLeague === lg.key && s.leagueGridCardSel]}
              onPress={() => setSelectedLeague(selectedLeague === lg.key ? null : lg.key)}
              activeOpacity={0.85}
            >
              <View style={[s.leagueGridAccent, { backgroundColor: lg.sportColor }]} />
              <View style={s.leagueGridBody}>
                <Text style={[s.leagueGridSportTag, { color: lg.sportColor }]}>{lg.sportEmoji}  {lg.sportName}</Text>
                <Text style={s.leagueGridName}>{lg.leagueName}</Text>
                {!!lg.ageGroup && <Text style={s.leagueGridAge}>{lg.ageGroup}</Text>}
                <View style={s.leagueGridFooter}>
                  <Text style={s.leagueGridCount}>{lg.events.length} events</Text>
                  {lg.unpublished > 0 && (
                    <View style={s.leagueGridDraftBadge}>
                      <Text style={s.leagueGridDraftTxt}>{lg.unpublished} draft</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {flatLeagues.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>📭</Text>
              <Text style={s.emptyTxt}>No events for this sport yet</Text>
            </View>
          )}
        </View>

        {/* Expanded league events panel */}
        {selectedLeagueData && (
          <View style={[s.leagueExpanded, { borderLeftColor: selectedLeagueData.sportColor }]}>
            <View style={s.leagueExpandedHeader}>
              <Text style={s.leagueExpandedTitle}>
                {selectedLeagueData.sportEmoji}  {selectedLeagueData.leagueName}{selectedLeagueData.ageGroup ? `  ·  ${selectedLeagueData.ageGroup}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedLeague(null)}>
                <Text style={s.leagueExpandedClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedLeagueData.events.map((ev, i) => {
              const color      = EVENT_COLOR[ev.type as keyof typeof EVENT_COLOR]       ?? AC.primary;
              const colorLight = EVENT_COLOR_LIGHT[ev.type as keyof typeof EVENT_COLOR_LIGHT] ?? AC.primaryLight;
              return (
                <View key={ev.id} style={[s.eventCard, i < selectedLeagueData.events.length - 1 && s.eventCardBorder]}>
                  <View style={[s.eventTypePill, { backgroundColor: colorLight }]}>
                    <View style={[s.eventTypeDot, { backgroundColor: color }]} />
                    <Text style={[s.eventTypeTxt, { color }]}>{ev.type.toUpperCase()}</Text>
                  </View>
                  <View style={s.eventBody}>
                    <View style={s.eventLeft}>
                      <Text style={s.eventTitle}>{ev.title}</Text>
                      <Text style={s.eventMeta}>{ev.date}  ·  {ev.time}</Text>
                      <Text style={s.eventLoc}>📍 {ev.location}</Text>
                    </View>
                    <View style={s.eventRight}>
                      <Text style={s.eventTeamName}>{ev.teamName}</Text>
                      {ev.published
                        ? <View style={s.pubBadge}><Text style={s.pubTxt}>Published</Text></View>
                        : (
                          <TouchableOpacity style={s.publishEventBtn} onPress={() => publishEvent(ev.id)} activeOpacity={0.8}>
                            <Text style={s.publishEventTxt}>Publish</Text>
                          </TouchableOpacity>
                        )
                      }
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Conversational Wizard ─────────────────────────────────────────────── */}
      {showForm && (
        <View style={s.overlay}>
          <TouchableOpacity style={s.backdrop} onPress={() => setShowForm(false)} />
          <View style={[s.sheet, isDesktop && s.sheetDesktop]}>

            {/* Sheet header */}
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>New Event</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Text style={s.sheetClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable conversation */}
            <ScrollView
              ref={wizScrollRef}
              showsVerticalScrollIndicator={false}
              style={s.wizScroll}
              contentContainerStyle={s.wizContent}
            >

              {/* Confirmed steps */}
              {done.map(step => (
                <View key={step} style={s.confirmedRow}>
                  <Text style={s.confirmedCheck}>✓</Text>
                  <Text style={s.confirmedLabel}>{confirmedLabel(step)}</Text>
                  <Text style={s.confirmedValue} numberOfLines={1}>{confirmedValue(step)}</Text>
                </View>
              ))}

              {/* Divider between confirmed and active */}
              {done.length > 0 && active !== 'publish' && (
                <View style={s.wizDivider} />
              )}

              {/* Active step */}
              {active !== 'publish' && (
                <View style={s.activeWrap}>
                  <Text style={s.activeQ}>{QUESTIONS[active as StepKey]}</Text>

                  {/* Type */}
                  {active === 'type' && TYPE_OPTIONS.map(t => (
                    <TouchableOpacity key={t.id} style={[s.wizCard, { borderLeftColor: t.color }]} onPress={() => advance('type', { type: t.id })} activeOpacity={0.8}>
                      <Text style={s.wizCardEmoji}>{t.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.wizCardLabel}>{t.label}</Text>
                        <Text style={s.wizCardDesc}>{t.desc}</Text>
                      </View>
                      <Text style={[s.wizCardArrow, { color: t.color }]}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Sport */}
                  {active === 'sport' && DEMO_SPORTS.map(sp => (
                    <TouchableOpacity key={sp.id} style={[s.wizCard, { borderLeftColor: sp.color }]} onPress={() => advance('sport', { sportId: sp.id })} activeOpacity={0.8}>
                      <Text style={s.wizCardEmoji}>{sp.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.wizCardLabel}>{sp.name}</Text>
                        <Text style={s.wizCardDesc}>{DEMO_LEAGUES.filter(l => l.sportId === sp.id).length} leagues</Text>
                      </View>
                      <Text style={[s.wizCardArrow, { color: sp.color }]}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {/* League */}
                  {active === 'league' && DEMO_LEAGUES.filter(l => l.sportId === ans.sportId).map(l => (
                    <TouchableOpacity key={l.id} style={[s.wizCard, { borderLeftColor: sport?.color ?? AC.primary }]} onPress={() => advance('league', { leagueId: l.id })} activeOpacity={0.8}>
                      <Text style={s.wizCardEmoji}>{sport?.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.wizCardLabel}>{l.name} · {l.ageGroup}</Text>
                        <Text style={s.wizCardDesc}>{l.teamCount} teams · {l.athleteCount} athletes</Text>
                      </View>
                      <Text style={[s.wizCardArrow, { color: sport?.color ?? AC.primary }]}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Home team */}
                  {active === 'home' && teamsInLeague.map(t => (
                    <TouchableOpacity key={t.id} style={[s.teamCard, ans.homeId === t.id && s.teamCardActive]} onPress={() => advance('home', { homeId: t.id })} activeOpacity={0.8}>
                      <View style={[s.teamCardDot, { backgroundColor: AC.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.teamCardName, ans.homeId === t.id && s.teamCardNameActive]}>{t.name}</Text>
                        <Text style={s.teamCardCoach}>{t.coach}</Text>
                      </View>
                      <Text style={s.teamCardArrow}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Away team */}
                  {active === 'away' && (
                    <>
                      {/* Confirmed home team context (non-interactive) */}
                      <View style={s.awayContextRow}>
                        <Text style={s.awayContextLabel}>HOME</Text>
                        <Text style={s.awayContextName}>{homeTeam?.name ?? '—'}</Text>
                        <View style={s.awayContextLock}><Text style={s.awayContextLockTxt}>✓</Text></View>
                      </View>

                      <Text style={s.awaySubLabel}>Select away team</Text>

                      {/* League teams minus home */}
                      {teamsInLeague.filter(t => t.id !== ans.homeId).map(t => (
                        <TouchableOpacity key={t.id} style={[s.teamCard, s.teamCardAway, ans.awayId === t.id && s.teamCardAwayActive]} onPress={() => advance('away', { awayId: t.id, awayExt: '' })} activeOpacity={0.8}>
                          <View style={[s.teamCardDot, { backgroundColor: AC.orange }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[s.teamCardName, ans.awayId === t.id && s.teamCardNameAwayActive]}>{t.name}</Text>
                            <Text style={s.teamCardCoach}>{t.coach}</Text>
                          </View>
                          <Text style={s.teamCardArrow}>→</Text>
                        </TouchableOpacity>
                      ))}

                      {/* External opponents */}
                      <Text style={s.awayExtLabel}>Or pick an external opponent</Text>
                      <View style={s.oppGrid}>
                        {extOpponents.map(opp => (
                          <TouchableOpacity
                            key={opp}
                            style={[s.oppChip, ans.awayExt === opp && s.oppChipActive]}
                            onPress={() => advance('away', { awayExt: opp, awayId: '' })}
                            activeOpacity={0.8}
                          >
                            <Text style={[s.oppChipTxt, ans.awayExt === opp && s.oppChipTxtActive]}>{opp}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={s.inlineRow}>
                        <TextInput
                          style={s.inlineInput}
                          placeholder="Custom opponent name..."
                          placeholderTextColor={AC.muted}
                          value={ans.awayId || extOpponents.includes(ans.awayExt) ? '' : tempText}
                          onChangeText={setTempText}
                        />
                        <TouchableOpacity style={[s.inlineBtn, !tempText.trim() && s.inlineBtnOff]} onPress={() => { if (tempText.trim()) advance('away', { awayExt: tempText.trim(), awayId: '' }); }} disabled={!tempText.trim()}>
                          <Text style={s.inlineBtnTxt}>→</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Single team (practice / tournament) */}
                  {active === 'team' && teamsInLeague.map(t => (
                    <TouchableOpacity key={t.id} style={[s.teamCard, ans.teamId === t.id && s.teamCardActive]} onPress={() => advance('team', { teamId: t.id })} activeOpacity={0.8}>
                      <View style={[s.teamCardDot, { backgroundColor: AC.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.teamCardName, ans.teamId === t.id && s.teamCardNameActive]}>{t.name}</Text>
                        <Text style={s.teamCardCoach}>{t.coach}</Text>
                      </View>
                      <Text style={s.teamCardArrow}>→</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Date */}
                  {active === 'date' && (
                    Platform.OS === 'web'
                      ? React.createElement('input', {
                          type: 'date',
                          min: TODAY_ISO,
                          style: {
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 15,
                            color: AC.text,
                            backgroundColor: AC.surface,
                            border: `1px solid ${AC.border}`,
                            borderRadius: 8,
                            padding: '12px 16px',
                            width: '100%',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                            outline: 'none',
                          },
                          onChange: (e: any) => {
                            const v = e.target.value;
                            if (v) advance('date', { date: formatDateValue(v) });
                          },
                        } as any)
                      : (
                        <View style={s.inlineRow}>
                          <TextInput style={s.inlineInput} placeholder="YYYY-MM-DD" placeholderTextColor={AC.muted} value={tempText} onChangeText={setTempText} onSubmitEditing={() => { if (tempText.trim()) advance('date', { date: tempText.trim() }); }} returnKeyType="next" />
                          <TouchableOpacity style={[s.inlineBtn, !tempText.trim() && s.inlineBtnOff]} onPress={() => { if (tempText.trim()) advance('date', { date: tempText.trim() }); }} disabled={!tempText.trim()}>
                            <Text style={s.inlineBtnTxt}>→</Text>
                          </TouchableOpacity>
                        </View>
                      )
                  )}

                  {/* Time */}
                  {active === 'time' && (
                    <View style={{ gap: AS.sm }}>
                      <View style={s.timePicker}>
                        {/* Hours */}
                        <ScrollView style={s.timeHourCol} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                          {HOURS.map(h => (
                            <TouchableOpacity
                              key={h}
                              style={[s.timeItem, timeHour === h && s.timeItemSel]}
                              onPress={() => setTimeHour(h)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.timeItemTxt, timeHour === h && s.timeItemSelTxt]}>{h}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <View style={s.timeColDiv} />
                        {/* Minutes */}
                        <View style={[s.timeMinCol, { justifyContent: 'center' }]}>
                          {MINUTES.map(m => (
                            <TouchableOpacity
                              key={m}
                              style={[s.timeItem, timeMin === m && s.timeItemSel]}
                              onPress={() => setTimeMin(m)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.timeItemTxt, timeMin === m && s.timeItemSelTxt]}>{m}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={s.timeColDiv} />
                        {/* AM / PM */}
                        <View style={[s.timeAmPmCol, { justifyContent: 'center' }]}>
                          {['AM','PM'].map(ap => (
                            <TouchableOpacity
                              key={ap}
                              style={[s.timeItem, timeAmPm === ap && s.timeItemSel]}
                              onPress={() => setTimeAmPm(ap)}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.timeItemTxt, timeAmPm === ap && s.timeItemSelTxt]}>{ap}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[s.inlineBtn, { alignSelf: 'flex-end' }, (!timeHour || !timeMin) && s.inlineBtnOff]}
                        onPress={() => {
                          if (!timeHour || !timeMin) return;
                          advance('time', { time: `${timeHour}:${timeMin} ${timeAmPm}` });
                        }}
                        disabled={!timeHour || !timeMin}
                      >
                        <Text style={s.inlineBtnTxt}>
                          {timeHour && timeMin ? `${timeHour}:${timeMin} ${timeAmPm}  →` : '→'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Location with autocomplete */}
                  {active === 'location' && (
                    <View>
                      <View style={s.inlineRow}>
                        <TextInput
                          style={s.inlineInput}
                          placeholder="Field, gym, or address"
                          placeholderTextColor={AC.muted}
                          value={tempText}
                          onChangeText={v => { setTempText(v); setShowLocDrop(true); }}
                          onFocus={() => setShowLocDrop(true)}
                          onBlur={() => setTimeout(() => setShowLocDrop(false), 150)}
                          onSubmitEditing={() => confirmText('location', 'location', tempText)}
                          returnKeyType="done"
                        />
                        <TouchableOpacity style={[s.inlineBtn, !tempText.trim() && s.inlineBtnOff]} onPress={() => confirmText('location', 'location', tempText)} disabled={!tempText.trim()}>
                          <Text style={s.inlineBtnTxt}>→</Text>
                        </TouchableOpacity>
                      </View>
                      {showLocDrop && filteredLocs.length > 0 && (
                        <View style={s.locDropdown}>
                          {filteredLocs.slice(0, 5).map(loc => (
                            <TouchableOpacity key={loc} style={s.locDropItem} onPress={() => { confirmText('location', 'location', loc); setShowLocDrop(false); }}>
                              <Text style={s.locDropPin}>📍</Text>
                              <Text style={s.locDropTxt}>{loc}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Notes (optional) */}
                  {active === 'notes' && (
                    <>
                      <TextInput
                        style={s.notesInput}
                        placeholder="e.g. Bring extra balls, check weather forecast..."
                        placeholderTextColor={AC.muted}
                        value={tempText}
                        onChangeText={setTempText}
                        multiline
                        numberOfLines={3}
                      />
                      <View style={s.notesBtns}>
                        <TouchableOpacity style={s.skipBtn} onPress={skipNotes}>
                          <Text style={s.skipBtnTxt}>Skip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.inlineBtn, !tempText.trim() && s.inlineBtnOff]} onPress={() => { if (tempText.trim()) advance('notes', { notes: tempText }); else skipNotes(); }} disabled={false}>
                          <Text style={s.inlineBtnTxt}>Add Note →</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Save as draft button */}
              {active === 'publish' && (
                <TouchableOpacity style={[s.publishBtn, publishing && s.publishBtnOff]} onPress={handleSave} disabled={publishing} activeOpacity={0.85}>
                  <Text style={s.publishBtnTxt}>{publishing ? 'Saving...' : '💾 Save to Calendar  →'}</Text>
                </TouchableOpacity>
              )}

              {/* Post-save — add another? */}
              {active === 'done' && (
                <View style={s.doneCard}>
                  <View style={s.doneCheck}>
                    <Text style={s.doneCheckTxt}>✓</Text>
                  </View>
                  <Text style={s.doneTitle}>Draft saved!</Text>
                  <Text style={s.doneSub} numberOfLines={2}>{lastPublished}</Text>
                  <Text style={s.doneCoaches}>Review and publish from the schedule.</Text>
                  <View style={s.doneBtns}>
                    <TouchableOpacity style={s.doneAnotherBtn} onPress={resetWizard} activeOpacity={0.8}>
                      <Text style={s.doneAnotherTxt}>+ Add Another Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.doneDoneBtn} onPress={() => setShowForm(false)} activeOpacity={0.8}>
                      <Text style={s.doneDoneTxt}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(AC: ACPalette) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: AC.bg },
    scroll: { padding: AS.xl, paddingBottom: AS.xxxl },

    toast: {
      position: 'absolute', top: 16, left: AS.xl, right: AS.xl, zIndex: 200,
      backgroundColor: AC.greenLight, borderWidth: 1, borderColor: AC.green,
      borderRadius: AR.md, padding: AS.md, alignItems: 'center',
    },
    toastTxt: { fontFamily: Fonts.monoBold, fontSize: 12, color: AC.greenText },

    pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: AS.xl },
    pageTitle:  { fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: AC.text },
    pageSub:    { fontFamily: Fonts.rajdhani, fontSize: 14, color: AC.muted, marginTop: 2 },
    newBtn:     { backgroundColor: AC.primary, borderRadius: AR.md, paddingHorizontal: AS.lg, paddingVertical: AS.sm },
    newBtnTxt:  { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },

    // Sport filter pills
    filterRow:          { marginBottom: AS.xl, gap: AS.sm, alignItems: 'center' },
    filterPill:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: AS.md, paddingVertical: 7, borderRadius: AR.full, borderWidth: 1, borderColor: AC.border, backgroundColor: AC.surface },
    filterPillActive:   { borderColor: AC.primary, backgroundColor: AC.primaryLight },
    filterPillEmoji:    { fontSize: 13 },
    filterPillTxt:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    filterPillTxtActive:{ fontFamily: Fonts.rajdhaniBold, color: AC.primary },

    // League grid
    leagueGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: AS.md, marginBottom: AS.md },
    leagueGridCard:      { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, overflow: 'hidden' },
    leagueGridCardSel:   { borderColor: AC.primary, borderWidth: 2 },
    leagueGridAccent:    { height: 4, width: '100%' },
    leagueGridBody:      { padding: AS.md, gap: 3 },
    leagueGridSportTag:  { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: 0.4 },
    leagueGridName:      { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    leagueGridAge:       { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },
    leagueGridFooter:    { flexDirection: 'row', alignItems: 'center', gap: AS.xs, marginTop: AS.xs },
    leagueGridCount:     { fontFamily: Fonts.mono, fontSize: 11, color: AC.sub, flex: 1 },
    leagueGridDraftBadge:{ backgroundColor: AC.amberLight, borderRadius: AR.full, paddingHorizontal: 6, paddingVertical: 1 },
    leagueGridDraftTxt:  { fontFamily: Fonts.mono, fontSize: 10, color: AC.amberText },

    // Expanded events panel
    leagueExpanded:       { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, overflow: 'hidden', borderLeftWidth: 3, marginBottom: AS.lg },
    leagueExpandedHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: AS.md, paddingVertical: AS.md, borderBottomWidth: 1, borderBottomColor: AC.border, backgroundColor: AC.bg },
    leagueExpandedTitle:  { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text, flex: 1 },
    leagueExpandedClose:  { fontFamily: Fonts.mono, fontSize: 14, color: AC.muted, padding: 4 },
    eventCard:     { paddingHorizontal: AS.md, paddingTop: AS.sm, paddingBottom: AS.md },
    eventCardBorder: { borderBottomWidth: 1, borderBottomColor: AC.border },
    eventTypePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: AR.full, marginBottom: 6 },
    eventTypeDot:  { width: 6, height: 6, borderRadius: 3 },
    eventTypeTxt:  { fontFamily: Fonts.rajdhaniBold, fontSize: 10, letterSpacing: 0.5 },
    eventBody:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: AS.md },
    eventLeft:     { flex: 1, gap: 2 },
    eventRight:    { alignItems: 'flex-end', gap: AS.xs },
    eventTitle:    { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    eventMeta:     { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    eventLoc:      { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },
    eventTeamName: { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },
    pubBadge:      { backgroundColor: AC.greenLight, borderRadius: AR.sm, borderWidth: 1, borderColor: AC.green + '50', paddingHorizontal: 7, paddingVertical: 2 },
    pubTxt:        { fontFamily: Fonts.rajdhani, fontSize: 11, color: AC.greenText },
    draftBadge:    { backgroundColor: AC.amberLight, borderRadius: AR.sm, borderWidth: 1, borderColor: AC.amber + '60', paddingHorizontal: 7, paddingVertical: 2 },
    draftTxt:      { fontFamily: Fonts.rajdhani, fontSize: 11, color: AC.amberText },
    publishEventBtn: { backgroundColor: AC.primary, borderRadius: AR.sm, paddingHorizontal: 10, paddingVertical: 4 },
    publishEventTxt: { fontFamily: Fonts.rajdhaniBold, fontSize: 11, color: '#fff' },

    emptyState:    { paddingVertical: AS.xxxl, alignItems: 'center', gap: AS.md },
    emptyEmoji:    { fontSize: 32 },
    emptyTxt:      { fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.muted },

    // Sheet
    overlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end' },
    backdrop:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
    sheet:        { backgroundColor: AC.surface, borderTopLeftRadius: AR.xl, borderTopRightRadius: AR.xl, borderWidth: 1, borderColor: AC.border, paddingTop: AS.xl, paddingHorizontal: AS.xl, maxHeight: '88%' },
    sheetDesktop: { maxWidth: 520, alignSelf: 'center', width: '100%', borderRadius: AR.xl, marginBottom: 40 },
    sheetHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: AS.lg },
    sheetTitle:   { fontFamily: Fonts.rajdhaniBold, fontSize: 20, color: AC.text },
    sheetClose:   { fontFamily: Fonts.mono, fontSize: 16, color: AC.muted, padding: 4 },

    wizScroll:  { flex: 1 },
    wizContent: { paddingBottom: AS.xl },

    // Confirmed rows
    confirmedRow:  { flexDirection: 'row', alignItems: 'center', gap: AS.sm, paddingVertical: 5 },
    confirmedCheck:{ fontFamily: Fonts.monoBold, fontSize: 12, color: AC.green, width: 16 },
    confirmedLabel:{ fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted, letterSpacing: 0.3, width: 70 },
    confirmedValue:{ fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.sub, flex: 1 },

    wizDivider: { height: 1, backgroundColor: AC.border, marginVertical: AS.md },

    // Active step
    activeWrap: { gap: AS.sm },
    activeQ:    { fontFamily: Fonts.rajdhaniBold, fontSize: 17, color: AC.text, marginBottom: AS.xs },

    // Wizard cards (type / sport / league)
    wizCard:      { flexDirection: 'row', alignItems: 'center', gap: AS.md, backgroundColor: AC.bg, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, borderLeftWidth: 3, padding: AS.lg, marginBottom: AS.xs },
    wizCardEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
    wizCardLabel: { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    wizCardDesc:  { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted, marginTop: 1 },
    wizCardArrow: { fontFamily: Fonts.rajdhaniBold, fontSize: 18 },

    // Team cards
    teamCard:             { flexDirection: 'row', alignItems: 'center', gap: AS.md, backgroundColor: AC.bg, borderRadius: AR.md, borderWidth: 1, borderColor: AC.border, padding: AS.md, marginBottom: AS.xs },
    teamCardAway:         {},
    teamCardActive:       { borderColor: AC.primary, backgroundColor: AC.primaryLight },
    teamCardAwayActive:   { borderColor: AC.orange,  backgroundColor: AC.orangeLight  },
    teamCardDot:          { width: 8, height: 8, borderRadius: 4 },
    teamCardName:         { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    teamCardNameActive:   { color: AC.primaryText },
    teamCardNameAwayActive: { color: AC.orange },
    teamCardCoach:        { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },
    teamCardArrow:        { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: AC.border2 },

    // Away — confirmed home context
    awayContextRow:     { flexDirection: 'row', alignItems: 'center', gap: AS.sm, backgroundColor: AC.bg, borderRadius: AR.md, borderWidth: 1, borderColor: AC.border, padding: AS.md, marginBottom: AS.sm },
    awayContextLabel:   { fontFamily: Fonts.rajdhaniBold, fontSize: 11, color: AC.muted, letterSpacing: 0.5, width: 44 },
    awayContextName:    { flex: 1, fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.primary },
    awayContextLock:    { backgroundColor: AC.greenLight, borderRadius: AR.full, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    awayContextLockTxt: { fontFamily: Fonts.monoBold, fontSize: 9, color: AC.green },

    // Away sub-labels
    awaySubLabel: { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: AC.text, marginBottom: AS.xs },
    awayExtLabel: { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted, marginTop: AS.sm },
    oppGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: AS.sm, marginVertical: AS.xs },
    oppChip:          { borderWidth: 1, borderColor: AC.border, borderRadius: AR.full, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: AC.bg },
    oppChipActive:    { borderColor: AC.orange, backgroundColor: AC.orangeLight },
    oppChipTxt:       { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    oppChipTxtActive: { color: AC.orange },

    // Time picker
    timePicker:    { flexDirection: 'row', borderWidth: 1, borderColor: AC.border, borderRadius: AR.lg, backgroundColor: AC.bg, overflow: 'hidden', height: 220 },
    timeHourCol:   { flex: 1 },
    timeMinCol:    { flex: 1 },
    timeAmPmCol:   { flex: 1 },
    timeColDiv:    { width: 1, backgroundColor: AC.border },
    timeItem:      { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
    timeItemSel:   { backgroundColor: AC.primaryLight },
    timeItemTxt:   { fontFamily: Fonts.rajdhani, fontSize: 16, color: AC.sub },
    timeItemSelTxt:{ fontFamily: Fonts.rajdhaniBold, color: AC.primary },

    // Inline text row (date / time / location / custom away)
    inlineRow:    { flexDirection: 'row', gap: AS.sm, alignItems: 'center' },
    inlineInput:  { flex: 1, backgroundColor: AC.bg, borderWidth: 1, borderColor: AC.border, borderRadius: AR.md, padding: AS.md, fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text },
    inlineBtn:    { backgroundColor: AC.primary, borderRadius: AR.md, paddingVertical: AS.md, paddingHorizontal: AS.lg, justifyContent: 'center' },
    inlineBtnOff: { opacity: 0.35 },
    inlineBtnTxt: { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },

    // Notes
    notesInput:   { backgroundColor: AC.bg, borderWidth: 1, borderColor: AC.border, borderRadius: AR.md, padding: AS.md, fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text, minHeight: 80, textAlignVertical: 'top', marginBottom: AS.sm },
    notesBtns:    { flexDirection: 'row', gap: AS.sm, justifyContent: 'flex-end' },
    skipBtn:      { paddingVertical: AS.md, paddingHorizontal: AS.md },
    skipBtnTxt:   { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.muted },

    // Location dropdown
    locDropdown: { backgroundColor: AC.surface, borderWidth: 1, borderColor: AC.border, borderRadius: AR.md, marginTop: 2, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 50 },
    locDropItem: { flexDirection: 'row', alignItems: 'center', gap: AS.sm, paddingVertical: AS.sm, paddingHorizontal: AS.md, borderBottomWidth: 1, borderBottomColor: AC.border },
    locDropPin:  { fontSize: 13 },
    locDropTxt:  { fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text },

    // Publish
    publishBtn:    { backgroundColor: AC.primary, borderRadius: AR.md, paddingVertical: 16, alignItems: 'center', marginTop: AS.md },
    publishBtnOff: { opacity: 0.4 },
    publishBtnTxt: { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: '#fff' },

    // Post-publish
    doneCard:       { backgroundColor: AC.greenLight, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.green + '60', padding: AS.xl, alignItems: 'center', gap: AS.sm, marginTop: AS.md },
    doneCheck:      { width: 44, height: 44, borderRadius: 22, backgroundColor: AC.green, alignItems: 'center', justifyContent: 'center', marginBottom: AS.xs },
    doneCheckTxt:   { fontFamily: Fonts.monoBold, fontSize: 18, color: '#fff' },
    doneTitle:      { fontFamily: Fonts.rajdhaniBold, fontSize: 18, color: AC.greenText },
    doneSub:        { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.greenText, opacity: 0.8, textAlign: 'center' },
    doneCoaches:    { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.green, marginBottom: AS.xs },
    doneBtns:       { flexDirection: 'row', gap: AS.md, marginTop: AS.xs },
    doneAnotherBtn: { flex: 1, backgroundColor: AC.primary, borderRadius: AR.md, paddingVertical: 12, alignItems: 'center' },
    doneAnotherTxt: { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },
    doneDoneBtn:    { paddingVertical: 12, paddingHorizontal: AS.lg, borderRadius: AR.md, borderWidth: 1, borderColor: AC.green + '80', alignItems: 'center' },
    doneDoneTxt:    { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.greenText },
  });
}
