import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Animated,
} from 'react-native';
import { Fonts, AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { useDemoAC } from '../lib/demoTheme';
import { DEMO_CONVOS, DEMO_BROADCASTS, DEMO_SPORTS, DEMO_LEAGUES, DEMO_TEAMS } from '../lib/demoData';

interface Props { navigate?: (s: AdminSection, param?: string) => void; }

type Tab = 'broadcast' | 'messages';
type AudienceScope = 'org' | 'sport' | 'league' | 'team' | 'individual';

type Recipient = { type: AudienceScope; id: string; label: string; sub: string };

const SCOPE_OPTIONS: { id: AudienceScope; label: string }[] = [
  { id: 'org',        label: 'Org-Wide'   },
  { id: 'sport',      label: 'Sport'      },
  { id: 'league',     label: 'League'     },
  { id: 'team',       label: 'Team'       },
  { id: 'individual', label: 'Individual' },
];

function getRecipientSummary(scope: AudienceScope, recipients: Recipient[]): string {
  if (scope === 'org') {
    const active = DEMO_TEAMS.filter(t => t.status === 'active');
    return `${active.length} coaches · ${active.reduce((a, t) => a + t.athletes, 0)} parents`;
  }
  if (!recipients.length) return 'No recipients added yet';
  let totalCoaches = 0, totalParents = 0;
  const counted = new Set<string>();
  recipients.forEach(r => {
    let teams: typeof DEMO_TEAMS = [];
    if (r.type === 'sport')       teams = DEMO_TEAMS.filter(t => t.sportId  === r.id && t.status === 'active');
    else if (r.type === 'league') teams = DEMO_TEAMS.filter(t => t.leagueId === r.id && t.status === 'active');
    else                          teams = DEMO_TEAMS.filter(t => t.id === r.id);
    teams.forEach(t => {
      if (!counted.has(t.id)) { counted.add(t.id); totalCoaches++; totalParents += t.athletes; }
    });
  });
  return `${totalCoaches} coach${totalCoaches !== 1 ? 'es' : ''} · ${totalParents} parents`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoCommsScreen({ navigate }: Props) {
  const AC = useDemoAC();
  const s  = useMemo(() => makeStyles(AC), [AC]);

  const [activeTab, setActiveTab] = useState<Tab>('broadcast');

  // Broadcast
  const [scope, setScope]                   = useState<AudienceScope>('org');
  const [filterSportId, setFilterSportId]   = useState('');
  const [filterLeagueId, setFilterLeagueId] = useState('');
  const [pendingId, setPendingId]           = useState('');
  const [recipients, setRecipients]         = useState<Recipient[]>([]);
  const [draft, setDraft]                   = useState('');
  const [sending, setSending]               = useState(false);
  const [sentInfo, setSentInfo]             = useState('');
  const [broadcasts, setBroadcasts]         = useState(DEMO_BROADCASTS);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // Messages
  const [convos, setConvos]                 = useState(DEMO_CONVOS);
  const [openConvoId, setOpenConvoId]       = useState<string | null>(null);
  const [replyText, setReplyText]           = useState('');
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set(['soccer']));

  const openConvo = convos.find(c => c.id === openConvoId);

  // ── Scope helpers ──────────────────────────────────────────────────────────
  function changeScope(sc: AudienceScope) {
    setScope(sc); setFilterSportId(''); setFilterLeagueId(''); setPendingId(''); setRecipients([]);
  }

  function handleSportTap(id: string) {
    if (scope === 'sport') {
      setPendingId(prev => prev === id ? '' : id);
    } else {
      if (filterSportId === id) { setFilterSportId(''); setFilterLeagueId(''); setPendingId(''); }
      else { setFilterSportId(id); setFilterLeagueId(''); setPendingId(''); }
    }
  }

  function handleLeagueTap(id: string) {
    if (scope === 'league') {
      setPendingId(prev => prev === id ? '' : id);
    } else {
      if (filterLeagueId === id) { setFilterLeagueId(''); setPendingId(''); }
      else { setFilterLeagueId(id); setPendingId(''); }
    }
  }

  function handleAddRecipient() {
    if (!pendingId) return;
    let label = '', sub = '';
    switch (scope) {
      case 'sport': {
        const sp = DEMO_SPORTS.find(s => s.id === pendingId);
        if (!sp) return;
        const t = DEMO_TEAMS.filter(t => t.sportId === pendingId && t.status === 'active');
        label = `${sp.emoji} ${sp.name}`;
        sub   = `${t.length} coaches`;
        break;
      }
      case 'league': {
        const l  = DEMO_LEAGUES.find(l => l.id === pendingId);
        if (!l) return;
        const sp = DEMO_SPORTS.find(s => s.id === l.sportId);
        label = `${l.name} · ${l.ageGroup}`;
        sub   = sp ? `${sp.emoji} ${sp.name}` : '';
        break;
      }
      case 'team': {
        const t = DEMO_TEAMS.find(t => t.id === pendingId);
        if (!t) return;
        label = t.name;
        sub   = t.coach;
        break;
      }
      case 'individual': {
        const t = DEMO_TEAMS.find(t => t.id === pendingId);
        if (!t) return;
        label = t.coach;
        sub   = t.name;
        break;
      }
      default: return;
    }
    if (recipients.some(r => r.id === pendingId)) { setPendingId(''); return; }
    setRecipients(prev => [...prev, { type: scope, id: pendingId, label, sub }]);
    setPendingId('');
  }

  function handleStartOver() {
    setRecipients([]); setPendingId(''); setFilterSportId(''); setFilterLeagueId('');
  }

  // ── Messages tree ──────────────────────────────────────────────────────────
  const convosBySport: Record<string, typeof convos> = {};
  convos.forEach(c => {
    const team = DEMO_TEAMS.find(t => t.id === c.teamId);
    if (!team) return;
    if (!convosBySport[team.sportId]) convosBySport[team.sportId] = [];
    convosBySport[team.sportId].push(c);
  });

  function toggleSport(sportId: string) {
    setExpandedSports(prev => {
      const next = new Set(prev);
      if (next.has(sportId)) next.delete(sportId); else next.add(sportId);
      return next;
    });
  }

  // ── Broadcast send ─────────────────────────────────────────────────────────
  function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    const msg     = draft;
    const summary = getRecipientSummary(scope, recipients);
    setTimeout(() => {
      const audience =
        scope === 'org'         ? 'Everyone' :
        recipients.length === 1 ? recipients[0].label :
                                  `${recipients.length} recipients`;
      setBroadcasts(prev => [{ text: msg, audience, time: 'Just now' }, ...prev]);
      setSentInfo(summary);
      setDraft('');
      setSending(false);
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setSentInfo(''));
    }, 600);
  }

  // ── Reply ──────────────────────────────────────────────────────────────────
  function handleReply() {
    if (!replyText.trim() || !openConvoId) return;
    const text = replyText;
    setReplyText('');
    setConvos(prev => prev.map(c => c.id !== openConvoId ? c : {
      ...c, preview: text, time: 'Just now', unread: false,
      messages: [...c.messages, { from: 'admin' as const, text, time: 'Just now' }],
    }));
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const leaguesForSport  = DEMO_LEAGUES.filter(l => l.sportId  === filterSportId);
  const teamsForLeague   = DEMO_TEAMS.filter(t => t.leagueId  === filterLeagueId && t.status === 'active');
  const coachesForSport  = DEMO_TEAMS.filter(t => t.sportId   === filterSportId  && t.status === 'active');
  const recipientSummary = getRecipientSummary(scope, recipients);
  const isRecipientReady = scope === 'org' || recipients.length > 0;
  const canSend          = !!draft.trim() && isRecipientReady;

  let pendingLabel = '';
  if (pendingId) {
    switch (scope) {
      case 'sport':      pendingLabel = DEMO_SPORTS.find(sp => sp.id === pendingId)?.name ?? ''; break;
      case 'league': {   const l = DEMO_LEAGUES.find(l => l.id === pendingId); pendingLabel = l ? `${l.name} · ${l.ageGroup}` : ''; break; }
      case 'team':       pendingLabel = DEMO_TEAMS.find(t => t.id === pendingId)?.name ?? ''; break;
      case 'individual': pendingLabel = DEMO_TEAMS.find(t => t.id === pendingId)?.coach ?? ''; break;
    }
  }

  // ── Conversation view ──────────────────────────────────────────────────────
  if (openConvo) {
    return (
      <View style={s.root}>
        <View style={s.convoHeader}>
          <TouchableOpacity onPress={() => setOpenConvoId(null)} style={s.backBtn}>
            <Text style={s.backTxt}>← Back</Text>
          </TouchableOpacity>
          <View style={s.convoHeaderMid}>
            <Text style={s.convoName}>{openConvo.coach}</Text>
            <Text style={s.convoTeam}>{openConvo.team}</Text>
          </View>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.messageList} showsVerticalScrollIndicator={false}>
          {openConvo.messages.map((m, i) => (
            <View key={i} style={[s.bubbleWrap, m.from === 'admin' && s.bubbleWrapAdmin]}>
              <View style={[s.bubble, m.from === 'admin' ? s.bubbleAdmin : s.bubbleCoach]}>
                <Text style={[s.bubbleTxt, m.from === 'admin' && s.bubbleTxtAdmin]}>{m.text}</Text>
              </View>
              <Text style={[s.bubbleTime, m.from === 'admin' && { textAlign: 'right' }]}>{m.time}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={s.replyBar}>
          <TextInput
            style={s.replyInput}
            placeholder="Type a message..."
            placeholderTextColor={AC.muted}
            value={replyText}
            onChangeText={setReplyText}
            onSubmitEditing={handleReply}
            returnKeyType="send"
          />
          <TouchableOpacity style={s.sendBtn} onPress={handleReply} disabled={!replyText.trim()}>
            <Text style={s.sendBtnTxt}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>

      {/* Toast */}
      <Animated.View style={[s.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={s.toastTitle}>✓ Announcement sent</Text>
        {!!sentInfo && <Text style={s.toastSub}>Delivered to {sentInfo}</Text>}
      </Animated.View>

      {/* Header */}
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Communications</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['broadcast', 'messages'] as Tab[]).map(t => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabTxt, activeTab === t && s.tabTxtActive]}>
              {t === 'broadcast' ? 'Broadcast' : 'Messages'}
            </Text>
            {t === 'messages' && convos.some(c => c.unread) && <View style={s.tabUnreadDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'broadcast' ? (

        /* ── Broadcast tab ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          <View style={s.composeCard}>
            <Text style={s.composeTitle}>Compose Announcement</Text>

            {/* Scope selector */}
            <Text style={s.fieldLabel}>SEND TO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scopeRow}>
              {SCOPE_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  style={[s.scopeChip, scope === opt.id && s.scopeChipActive]}
                  onPress={() => changeScope(opt.id)}
                >
                  <Text style={[s.scopeChipTxt, scope === opt.id && s.scopeChipTxtActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sport picker */}
            {scope !== 'org' && (
              <>
                <Text style={s.refinLabel}>{scope === 'sport' ? 'SELECT SPORT' : 'SPORT'}</Text>
                <View style={s.sportRow}>
                  {DEMO_SPORTS.map(sp => {
                    const isFilter  = scope !== 'sport' && filterSportId === sp.id;
                    const isPending = scope === 'sport'  && pendingId === sp.id;
                    const isAdded   = scope === 'sport'  && recipients.some(r => r.id === sp.id);
                    return (
                      <TouchableOpacity
                        key={sp.id}
                        style={[
                          s.sportChip,
                          (isFilter || isPending) && { borderColor: sp.color, backgroundColor: sp.color + '20' },
                          isAdded && s.sportChipAdded,
                        ]}
                        onPress={() => !isAdded && handleSportTap(sp.id)}
                        activeOpacity={isAdded ? 1 : 0.7}
                      >
                        <Text style={s.sportChipEmoji}>{sp.emoji}</Text>
                        <Text style={[
                          s.sportChipTxt,
                          (isFilter || isPending) && { color: sp.color, fontFamily: Fonts.monoBold },
                          isAdded && { color: AC.green },
                        ]}>{sp.name}</Text>
                        {isAdded && <Text style={s.addedCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* League picker */}
            {(scope === 'league' || scope === 'team') && !!filterSportId && (
              <>
                <Text style={s.refinLabel}>{scope === 'league' ? 'SELECT LEAGUE' : 'LEAGUE'}</Text>
                <View style={s.refinList}>
                  {leaguesForSport.map(l => {
                    const isFilter  = scope === 'team'   && filterLeagueId === l.id;
                    const isPending = scope === 'league' && pendingId === l.id;
                    const isAdded   = scope === 'league' && recipients.some(r => r.id === l.id);
                    return (
                      <TouchableOpacity
                        key={l.id}
                        style={[
                          s.refinChip,
                          (isFilter || isPending) && s.refinChipActive,
                          isAdded && s.refinChipAdded,
                        ]}
                        onPress={() => !isAdded && handleLeagueTap(l.id)}
                        activeOpacity={isAdded ? 1 : 0.7}
                      >
                        <Text style={[
                          s.refinChipTxt,
                          (isFilter || isPending) && s.refinChipTxtActive,
                          isAdded && { color: AC.green },
                        ]}>
                          {l.name} · {l.ageGroup}
                        </Text>
                        <Text style={s.refinChipSub}>{isAdded ? '✓ added' : `${l.teamCount} teams`}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Team picker */}
            {scope === 'team' && !!filterLeagueId && (
              <>
                <Text style={s.refinLabel}>SELECT TEAM</Text>
                <View style={s.refinList}>
                  {teamsForLeague.map(t => {
                    const isPending = pendingId === t.id;
                    const isAdded   = recipients.some(r => r.id === t.id);
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[s.refinChip, isPending && s.refinChipActive, isAdded && s.refinChipAdded]}
                        onPress={() => !isAdded && setPendingId(prev => prev === t.id ? '' : t.id)}
                        activeOpacity={isAdded ? 1 : 0.7}
                      >
                        <Text style={[s.refinChipTxt, isPending && s.refinChipTxtActive, isAdded && { color: AC.green }]}>
                          {t.name}
                        </Text>
                        <Text style={s.refinChipSub}>{isAdded ? '✓ added' : t.coach}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Individual coach picker */}
            {scope === 'individual' && !!filterSportId && (
              <>
                <Text style={s.refinLabel}>SELECT COACH</Text>
                <View style={s.coachList}>
                  {coachesForSport.map(t => {
                    const isPending = pendingId === t.id;
                    const isAdded   = recipients.some(r => r.id === t.id);
                    return (
                      <TouchableOpacity
                        key={t.id}
                        style={[s.coachRow, isPending && s.coachRowActive, isAdded && s.coachRowAdded]}
                        onPress={() => !isAdded && setPendingId(prev => prev === t.id ? '' : t.id)}
                        activeOpacity={isAdded ? 1 : 0.7}
                      >
                        <View style={[s.coachAvatar, isPending && s.coachAvatarActive, isAdded && s.coachAvatarAdded]}>
                          <Text style={[s.coachAvatarTxt, (isPending || isAdded) && { color: '#fff' }]}>
                            {t.coach.split(' ').map(n => n[0]).join('')}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.coachName, isPending && s.coachNameActive, isAdded && { color: AC.green }]}>
                            {t.coach}
                          </Text>
                          <Text style={s.coachTeamTxt}>{t.name}</Text>
                        </View>
                        {isAdded   && <Text style={[s.coachCheck, { color: AC.green }]}>✓ added</Text>}
                        {isPending && !isAdded && <Text style={s.coachCheck}>●</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Add button */}
            {!!pendingId && scope !== 'org' && (
              <TouchableOpacity style={s.addBtn} onPress={handleAddRecipient}>
                <Text style={s.addBtnTxt}>+ Add "{pendingLabel}" →</Text>
              </TouchableOpacity>
            )}

            {/* Recipients list */}
            {recipients.length > 0 && (
              <>
                <Text style={s.refinLabel}>RECIPIENTS</Text>
                <View style={s.recipientChips}>
                  {recipients.map((r, i) => (
                    <View key={i} style={s.recipientChip}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.recipientChipLabel}>{r.label}</Text>
                        {!!r.sub && <Text style={s.recipientChipSub}>{r.sub}</Text>}
                      </View>
                      <TouchableOpacity
                        onPress={() => setRecipients(prev => prev.filter((_, j) => j !== i))}
                        style={s.recipientChipXBtn}
                      >
                        <Text style={s.recipientChipXTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                <TouchableOpacity onPress={handleStartOver}>
                  <Text style={s.startOverTxt}>Start Over</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Recipient count summary */}
            <View style={s.recipientRow}>
              <Text style={s.recipientArrow}>→</Text>
              <Text style={[s.recipientTxt, isRecipientReady && s.recipientTxtReady]}>{recipientSummary}</Text>
            </View>

            {/* Message */}
            <Text style={s.fieldLabel}>MESSAGE</Text>
            <TextInput
              style={s.composeInput}
              placeholder="Type your announcement..."
              placeholderTextColor={AC.muted}
              value={draft}
              onChangeText={setDraft}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={s.charCount}>{draft.length} / 500</Text>

            <TouchableOpacity
              style={[s.sendAnnBtn, (!canSend || sending) && s.sendAnnBtnOff]}
              onPress={handleSend}
              disabled={!canSend || sending}
            >
              <Text style={s.sendAnnBtnTxt}>{sending ? 'Sending...' : 'Send Announcement  →'}</Text>
            </TouchableOpacity>
          </View>

          {/* Recent broadcasts */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Recent Broadcasts</Text>
            <View style={s.broadcastList}>
              {broadcasts.map((b, i) => (
                <View key={i} style={[s.broadcastRow, i < broadcasts.length - 1 && s.broadcastRowBorder]}>
                  <Text style={s.broadcastMsg}>{b.text}</Text>
                  <View style={s.broadcastMeta}>
                    <View style={s.audiencePill}><Text style={s.audiencePillTxt}>{b.audience}</Text></View>
                    <Text style={s.broadcastTime}>{b.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

      ) : (

        /* ── Messages tab — grouped by sport ── */
        <ScrollView showsVerticalScrollIndicator={false}>
          {DEMO_SPORTS.map(sp => {
            const sportConvos = convosBySport[sp.id] ?? [];
            if (!sportConvos.length) return null;
            const isExpanded  = expandedSports.has(sp.id);
            const unreadCount = sportConvos.filter(c => c.unread).length;
            return (
              <View key={sp.id}>
                <TouchableOpacity style={s.sportHeader} onPress={() => toggleSport(sp.id)} activeOpacity={0.8}>
                  <Text style={s.sportHeaderEmoji}>{sp.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sportHeaderName}>{sp.name}</Text>
                    <Text style={s.sportHeaderCount}>{sportConvos.length} coaches</Text>
                  </View>
                  {unreadCount > 0 && (
                    <View style={s.sportUnreadBadge}>
                      <Text style={s.sportUnreadTxt}>{unreadCount}</Text>
                    </View>
                  )}
                  <Text style={s.sportChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && sportConvos.map(c => {
                  const team   = DEMO_TEAMS.find(t => t.id === c.teamId);
                  const league = DEMO_LEAGUES.find(l => l.id === team?.leagueId);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={s.dmRow}
                      onPress={() => {
                        setConvos(prev => prev.map(cv => cv.id === c.id ? { ...cv, unread: false } : cv));
                        setOpenConvoId(c.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={s.avatar}>
                        <Text style={s.avatarTxt}>{c.coach.split(' ').map(n => n[0]).join('')}</Text>
                      </View>
                      <View style={s.dmInfo}>
                        <View style={s.dmInfoTop}>
                          <Text style={s.dmName}>{c.coach}</Text>
                          <Text style={s.dmTime}>{c.time}</Text>
                        </View>
                        <Text style={s.dmLeague}>
                          {league ? `${league.name} · ${league.ageGroup}` : ''}{team ? ` · ${team.name}` : ''}
                        </Text>
                        <Text style={s.dmPreview} numberOfLines={1}>{c.preview}</Text>
                      </View>
                      {c.unread && <View style={s.unreadDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
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
      borderRadius: AR.md, padding: AS.md, alignItems: 'center', gap: 2,
    },
    toastTitle: { fontFamily: Fonts.monoBold, fontSize: 12, color: AC.greenText },
    toastSub:   { fontFamily: Fonts.mono, fontSize: 10, color: AC.green },

    pageHeader: { paddingHorizontal: AS.xl, paddingTop: AS.xl, paddingBottom: AS.sm },
    pageTitle:  { fontFamily: Fonts.rajdhaniBold, fontSize: 22, color: AC.text },

    tabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: AC.border, paddingHorizontal: AS.xl },
    tab:          { paddingVertical: 12, paddingHorizontal: AS.md, marginRight: AS.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
    tabActive:    { borderBottomWidth: 2, borderBottomColor: AC.primary, marginBottom: -1 },
    tabTxt:       { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.muted },
    tabTxtActive: { color: AC.primary },
    tabUnreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: AC.primary },

    // Compose card
    composeCard:  { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, padding: AS.xl, gap: AS.sm },
    composeTitle: { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: AC.text, marginBottom: AS.xs },
    fieldLabel:   { fontFamily: Fonts.rajdhaniBold, fontSize: 11, color: AC.primary, letterSpacing: 0.6, marginTop: AS.sm },

    scopeRow:          { gap: AS.sm, paddingVertical: 2 },
    scopeChip:         { borderWidth: 1, borderColor: AC.border, borderRadius: AR.full, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: AC.bg },
    scopeChipActive:   { borderColor: AC.primary, backgroundColor: AC.primaryLight },
    scopeChipTxt:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    scopeChipTxtActive:{ color: AC.primary, fontFamily: Fonts.rajdhaniBold },

    refinLabel: { fontFamily: Fonts.rajdhaniBold, fontSize: 11, color: AC.sub, letterSpacing: 0.5, marginTop: AS.md, marginBottom: AS.xs },

    sportRow:       { flexDirection: 'row', gap: AS.sm, flexWrap: 'wrap' },
    sportChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: AC.border, borderRadius: AR.md, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: AC.bg },
    sportChipAdded: { borderColor: AC.green + '60', backgroundColor: AC.greenLight, opacity: 0.6 },
    sportChipEmoji: { fontSize: 16 },
    sportChipTxt:   { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.sub },
    addedCheck:     { fontFamily: Fonts.monoBold, fontSize: 9, color: AC.green },

    refinList:         { gap: AS.xs },
    refinChip:         { borderWidth: 1, borderColor: AC.border, borderRadius: AR.md, paddingHorizontal: AS.md, paddingVertical: AS.sm, backgroundColor: AC.bg, flexDirection: 'row', alignItems: 'center', gap: AS.sm },
    refinChipActive:   { borderColor: AC.primary, backgroundColor: AC.primaryLight },
    refinChipAdded:    { borderColor: AC.green + '50', backgroundColor: AC.greenLight, opacity: 0.65 },
    refinChipTxt:      { flex: 1, fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    refinChipTxtActive:{ color: AC.primary },
    refinChipSub:      { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },

    coachList:        { gap: 1, backgroundColor: AC.border, borderRadius: AR.md, overflow: 'hidden', borderWidth: 1, borderColor: AC.border },
    coachRow:         { flexDirection: 'row', alignItems: 'center', gap: AS.md, padding: AS.md, backgroundColor: AC.surface },
    coachRowActive:   { backgroundColor: AC.primaryLight },
    coachRowAdded:    { backgroundColor: AC.greenLight, opacity: 0.7 },
    coachAvatar:      { width: 36, height: 36, borderRadius: 18, backgroundColor: AC.bg, borderWidth: 1, borderColor: AC.border2, alignItems: 'center', justifyContent: 'center' },
    coachAvatarActive:{ backgroundColor: AC.primary, borderColor: AC.primary },
    coachAvatarAdded: { backgroundColor: AC.green,   borderColor: AC.green   },
    coachAvatarTxt:   { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.primary },
    coachName:        { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.text },
    coachNameActive:  { color: AC.primary },
    coachTeamTxt:     { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },
    coachCheck:       { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.primary },

    // Add button
    addBtn:    { backgroundColor: AC.primary, borderRadius: AR.md, paddingVertical: 12, paddingHorizontal: AS.lg, alignItems: 'center', marginTop: AS.sm },
    addBtnTxt: { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: '#fff' },

    // Recipients chips
    recipientChips:    { gap: AS.xs },
    recipientChip:     { flexDirection: 'row', alignItems: 'center', gap: AS.sm, backgroundColor: AC.primaryLight, borderRadius: AR.md, borderWidth: 1, borderColor: AC.primary + '40', paddingHorizontal: AS.md, paddingVertical: AS.sm },
    recipientChipLabel:{ fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: AC.primaryText },
    recipientChipSub:  { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.primary },
    recipientChipXBtn: { padding: 4 },
    recipientChipXTxt: { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.primary },

    startOverTxt: { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted, textDecorationLine: 'underline', textAlign: 'right', paddingVertical: 4 },

    recipientRow:      { flexDirection: 'row', alignItems: 'center', gap: AS.xs, paddingVertical: AS.xs },
    recipientArrow:    { fontFamily: Fonts.monoBold, fontSize: 11, color: AC.muted },
    recipientTxt:      { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },
    recipientTxtReady: { color: AC.primary },

    composeInput: { backgroundColor: AC.bg, borderWidth: 1, borderColor: AC.border, borderRadius: AR.md, padding: AS.md, fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text, minHeight: 90, textAlignVertical: 'top' },
    charCount:    { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted, textAlign: 'right' },
    sendAnnBtn:   { backgroundColor: AC.primary, borderRadius: AR.md, paddingVertical: 14, alignItems: 'center', marginTop: AS.sm },
    sendAnnBtnOff:{ opacity: 0.4 },
    sendAnnBtnTxt:{ fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: '#fff' },

    section:           { marginTop: AS.lg },
    sectionTitle:      { fontFamily: Fonts.rajdhaniBold, fontSize: 16, color: AC.text, marginBottom: AS.md },
    broadcastList:     { backgroundColor: AC.surface, borderRadius: AR.lg, borderWidth: 1, borderColor: AC.border, overflow: 'hidden' },
    broadcastRow:      { padding: AS.lg, gap: AS.sm },
    broadcastRowBorder:{ borderBottomWidth: 1, borderBottomColor: AC.border },
    broadcastMsg:      { fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text, lineHeight: 22 },
    broadcastMeta:     { flexDirection: 'row', alignItems: 'center', gap: AS.sm },
    audiencePill:      { backgroundColor: AC.primaryLight, borderRadius: AR.full, borderWidth: 1, borderColor: AC.primary + '40', paddingHorizontal: 8, paddingVertical: 2 },
    audiencePillTxt:   { fontFamily: Fonts.rajdhani, fontSize: 11, color: AC.primaryText },
    broadcastTime:     { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },

    sportHeader:      { flexDirection: 'row', alignItems: 'center', gap: AS.md, paddingHorizontal: AS.xl, paddingVertical: AS.md, backgroundColor: AC.bg, borderBottomWidth: 1, borderBottomColor: AC.border },
    sportHeaderEmoji: { fontSize: 20 },
    sportHeaderName:  { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    sportHeaderCount: { fontFamily: Fonts.rajdhani, fontSize: 13, color: AC.muted },
    sportUnreadBadge: { backgroundColor: AC.primary, borderRadius: AR.full, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    sportUnreadTxt:   { fontFamily: Fonts.monoBold, fontSize: 9, color: '#fff' },
    sportChevron:     { fontFamily: Fonts.mono, fontSize: 10, color: AC.muted },

    dmRow:    { flexDirection: 'row', alignItems: 'center', gap: AS.md, paddingVertical: AS.lg, paddingRight: AS.xl, paddingLeft: AS.xxl + AS.sm, borderBottomWidth: 1, borderBottomColor: AC.border, backgroundColor: AC.surface },
    avatar:   { width: 40, height: 40, borderRadius: 20, backgroundColor: AC.primaryLight, borderWidth: 1, borderColor: AC.primary + '40', alignItems: 'center', justifyContent: 'center' },
    avatarTxt:{ fontFamily: Fonts.monoBold, fontSize: 12, color: AC.primary },
    dmInfo:   { flex: 1, gap: 1 },
    dmInfoTop:{ flexDirection: 'row', justifyContent: 'space-between' },
    dmName:   { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    dmTime:   { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },
    dmLeague: { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.primary },
    dmPreview:{ fontFamily: Fonts.rajdhani, fontSize: 14, color: AC.sub },
    unreadDot:{ width: 8, height: 8, borderRadius: 4, backgroundColor: AC.primary },

    convoHeader:    { flexDirection: 'row', alignItems: 'center', gap: AS.md, paddingHorizontal: AS.xl, paddingVertical: AS.md, borderBottomWidth: 1, borderBottomColor: AC.border, backgroundColor: AC.surface },
    backBtn:        { paddingVertical: 4, paddingRight: AS.md },
    backTxt:        { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.primary },
    convoHeaderMid: { flex: 1 },
    convoName:      { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: AC.text },
    convoTeam:      { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.primary },
    messageList:    { padding: AS.xl, gap: AS.md },
    bubbleWrap:     { alignItems: 'flex-start', gap: 3 },
    bubbleWrapAdmin:{ alignItems: 'flex-end' },
    bubble:         { maxWidth: '80%', borderRadius: AR.lg, padding: AS.md },
    bubbleCoach:    { backgroundColor: AC.surface, borderWidth: 1, borderColor: AC.border },
    bubbleAdmin:    { backgroundColor: AC.primary },
    bubbleTxt:      { fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text, lineHeight: 22 },
    bubbleTxtAdmin: { color: '#fff' },
    bubbleTime:     { fontFamily: Fonts.rajdhani, fontSize: 12, color: AC.muted },
    replyBar:       { flexDirection: 'row', gap: AS.sm, padding: AS.md, borderTopWidth: 1, borderTopColor: AC.border, backgroundColor: AC.surface },
    replyInput:     { flex: 1, backgroundColor: AC.bg, borderWidth: 1, borderColor: AC.border, borderRadius: AR.full, paddingHorizontal: AS.lg, paddingVertical: AS.md, fontFamily: Fonts.rajdhani, fontSize: 15, color: AC.text },
    sendBtn:        { backgroundColor: AC.primary, borderRadius: AR.full, paddingHorizontal: 20, paddingVertical: AS.md, justifyContent: 'center' },
    sendBtnTxt:     { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: '#fff' },
  });
}
