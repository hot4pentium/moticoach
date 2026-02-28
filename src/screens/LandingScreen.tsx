import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import LogoMark from '../components/LogoMark';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  onSignIn: () => void;
  onTryDemo?: () => void;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const PROBLEMS: { icon: IoniconsName; title: string; body: string }[] = [
  {
    icon: 'mail-outline',
    title: 'Email Chains & PDFs',
    body: 'Schedules get forwarded, modified, and lost. Coaches never know which version is current.',
  },
  {
    icon: 'clipboard-outline',
    title: 'Paper Registration',
    body: 'Forms collected at sign-ups, manually re-entered into spreadsheets, stored in filing cabinets.',
  },
  {
    icon: 'eye-off-outline',
    title: 'Zero Visibility',
    body: "Once teams are set, admin has no idea what's happening — who's coaching, who's showing up.",
  },
];

const FEATURES: { icon: IoniconsName; title: string; body: string }[] = [
  { icon: 'person-add-outline',  title: 'Digital Registration', body: 'Parents register online with forms, waivers, emergency contacts, and sport/age selection — all in one place.' },
  { icon: 'calendar-outline',    title: 'Schedule Publishing',  body: 'Build the official season schedule and push locked events to all teams at once. Coaches see them instantly.' },
  { icon: 'people-outline',      title: 'Team Hub',             body: 'One page for every role — coaches see full tools, athletes see stats and schedule, parents see events and chat.' },
  { icon: 'megaphone-outline',   title: 'Broadcast Comms',      body: 'Send announcements to all coaches, all parents, or your entire organization with one message.' },
  { icon: 'chatbubbles-outline', title: 'Direct Messaging',     body: 'DM any coach or parent directly through the platform. Two-way, with full message history.' },
  { icon: 'globe-outline',       title: 'No App Install',       body: 'Works in any browser on any device. Share a link — parents and coaches are in instantly.' },
];

// ─── Mini UI mockups ───────────────────────────────────────────────────────────

function MChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[mk.chip, { borderColor: color }]}>
      <Text style={[mk.chipTxt, { color }]}>{label}</Text>
    </View>
  );
}

function MField({ label, val }: { label: string; val: string }) {
  return (
    <View style={mk.field}>
      <Text style={mk.fieldLbl}>{label}</Text>
      <Text style={mk.fieldVal}>{val}</Text>
    </View>
  );
}

function SetupMockup() {
  return (
    <View style={mk.box}>
      <Text style={mk.boxTitle}>NEW PROGRAM</Text>
      <MField label="ORG" val="Springfield Parks & Rec" />
      <MField label="SPORT" val="Soccer · U10" />
      <MField label="SEASON" val="Fall 2025" />
      <View style={mk.row}>
        <MChip label="4 TEAMS" color={Colors.cyan} />
        <MChip label="OPEN REG" color={Colors.green} />
      </View>
    </View>
  );
}

function RegisterMockup() {
  return (
    <View style={mk.box}>
      <Text style={mk.boxTitle}>REGISTER YOUR ATHLETE</Text>
      <MField label="PLAYER" val="Jordan Smith, Age 9" />
      <MField label="SPORT" val="Soccer · U10" />
      <View style={mk.row}>
        <MChip label="✓ WAIVER" color={Colors.green} />
        <MChip label="✓ EMERGENCY" color={Colors.green} />
      </View>
      <MChip label="SUBMITTED" color={Colors.cyan} />
    </View>
  );
}

function AssignMockup() {
  const rows = [
    { name: 'Jordan Smith', team: 'TEAM A', color: Colors.cyan },
    { name: 'Maya Torres', team: 'TEAM A', color: Colors.cyan },
    { name: 'Eli Johnson', team: 'TEAM B', color: Colors.amber },
  ];
  return (
    <View style={mk.box}>
      <Text style={mk.boxTitle}>ASSIGN ROSTER</Text>
      {rows.map(r => (
        <View key={r.name} style={mk.assignRow}>
          <Text style={mk.assignName}>{r.name}</Text>
          <MChip label={r.team} color={r.color} />
        </View>
      ))}
      <Text style={mk.fieldLbl}>COACH → Sarah Rivera</Text>
    </View>
  );
}

function HubMockup() {
  return (
    <View style={mk.box}>
      <View style={mk.row}>
        <MChip label="COACH" color={Colors.cyan} />
        <MChip label="ATHLETE" color={Colors.green} />
        <MChip label="PARENT" color={Colors.purple} />
      </View>
      <MField label="NEXT EVENT" val="Sat vs Eagles  🔒 ORG" />
      <MField label="ROSTER" val="14 athletes · 3 staff" />
      <MField label="TEAM CHAT" val="4 unread messages" />
    </View>
  );
}

const mk = StyleSheet.create({
  box: {
    backgroundColor: Colors.cardSolid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    padding: Spacing.md,
    gap: 6,
  },
  boxTitle: {
    fontFamily: Fonts.monoBold,
    fontSize: 9,
    color: Colors.cyan,
    letterSpacing: 1,
    marginBottom: 2,
  },
  field:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLbl: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  fieldVal: { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.text },
  row:      { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip:     { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  chipTxt:  { fontFamily: Fonts.mono, fontSize: 9, letterSpacing: 0.5 },
  assignRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  assignName: { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.text },
});

const STEPS: { num: string; title: string; body: string; Mockup: React.FC }[] = [
  { num: '01', title: 'Admin Sets Up',     body: 'Create your org, define sports, age groups, divisions, and team slots — from your desk, in minutes.',         Mockup: SetupMockup    },
  { num: '02', title: 'Parents Register',  body: 'Parents fill out digital forms, sign waivers, and select sport + age group via a link you share with them.',  Mockup: RegisterMockup },
  { num: '03', title: 'Admin Assigns',     body: 'Review registrations, assign athletes to teams, and attach a coach. The team profile is instantly complete.',  Mockup: AssignMockup   },
  { num: '04', title: "Everyone's In",     body: 'Coaches, athletes, and parents each receive an invite link. They log in and see their role-specific view.',    Mockup: HubMockup      },
];

// ─── Role preview panels ───────────────────────────────────────────────────────

function DirectorPanel() {
  const teams = [
    { name: 'Team A', sport: '⚽', coach: 'S. Rivera', count: 14, status: 'ACTIVE', col: Colors.green },
    { name: 'Team B', sport: '⚽', coach: 'M. Torres',  count: 12, status: 'ACTIVE', col: Colors.green },
    { name: 'Team C', sport: '⚾', coach: 'J. Davis',   count: 15, status: 'ACTIVE', col: Colors.green },
    { name: 'Team D', sport: '🏀', coach: 'Pending',    count: 0,  status: 'SETUP',  col: Colors.amber },
  ];
  return (
    <View style={rp.panel}>
      <Text style={rp.panelTitle}>ORGANIZATION OVERVIEW</Text>
      <View style={rp.statsRow}>
        {[['4','TEAMS'],['41','ATHLETES'],['3','SPORTS']].map(([v,l]) => (
          <View key={l} style={rp.statCard}>
            <Text style={rp.statVal}>{v}</Text>
            <Text style={rp.statLbl}>{l}</Text>
          </View>
        ))}
      </View>
      {teams.map(t => (
        <View key={t.name} style={rp.teamRow}>
          <Text style={{ fontSize: 18 }}>{t.sport}</Text>
          <View style={{ flex: 1 }}>
            <Text style={rp.teamName}>{t.name}</Text>
            <Text style={rp.teamSub}>{t.coach} · {t.count} athletes</Text>
          </View>
          <View style={[rp.pill, { borderColor: t.col }]}>
            <Text style={[rp.pillTxt, { color: t.col }]}>{t.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function CoachPanel() {
  return (
    <View style={rp.panel}>
      <Text style={rp.panelTitle}>TEAM A — COACH VIEW</Text>
      <View style={rp.eventCard}>
        <View style={{ gap: 2 }}>
          <Text style={rp.eventType}>GAME</Text>
          <Text style={rp.eventTitle}>vs Eagles SC</Text>
          <Text style={rp.eventMeta}>Sat · 10:00 AM · Riverside Field</Text>
        </View>
        <View style={rp.lockBadge}>
          <Text style={{ fontSize: 12 }}>🔒</Text>
          <Text style={rp.lockTxt}>ORG</Text>
        </View>
      </View>
      <View style={[rp.eventCard, { borderColor: Colors.green + '60' }]}>
        <View style={{ gap: 2 }}>
          <Text style={[rp.eventType, { color: Colors.green }]}>TRAIN</Text>
          <Text style={rp.eventTitle}>Practice</Text>
          <Text style={rp.eventMeta}>Thu · 4:30 PM · Field B</Text>
        </View>
        <Text style={{ fontFamily: Fonts.mono, fontSize: 8, color: Colors.green }}>MY EVENT</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted }}>ROSTER</Text>
        <Text style={{ fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim }}>14 athletes · 3 staff</Text>
      </View>
    </View>
  );
}

function ParentPanel() {
  return (
    <View style={rp.panel}>
      <View style={rp.banner}>
        <Text style={rp.bannerLbl}>📢 ORG ANNOUNCEMENT</Text>
        <Text style={rp.bannerTxt}>Fields closed Saturday — weather. Game rescheduled to Sunday 11am.</Text>
      </View>
      <Text style={rp.panelTitle}>JORDAN'S SCHEDULE</Text>
      <View style={rp.eventCard}>
        <View style={{ gap: 2 }}>
          <Text style={rp.eventType}>GAME</Text>
          <Text style={rp.eventTitle}>vs Eagles SC</Text>
          <Text style={rp.eventMeta}>Sun · 11:00 AM · Riverside Field</Text>
        </View>
      </View>
      <View style={[rp.eventCard, { borderColor: Colors.green + '60' }]}>
        <View style={{ gap: 2 }}>
          <Text style={[rp.eventType, { color: Colors.green }]}>TRAIN</Text>
          <Text style={rp.eventTitle}>Practice</Text>
          <Text style={rp.eventMeta}>Thu · 4:30 PM · Field B</Text>
        </View>
      </View>
      <View style={rp.gameDayCard}>
        <Text style={rp.gameDayTxt}>⚡ GAME DAY LIVE — TAP IN</Text>
      </View>
    </View>
  );
}

const rp = StyleSheet.create({
  panel:      { backgroundColor: Colors.card2, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: 10 },
  panelTitle: { fontFamily: Fonts.monoBold, fontSize: 10, color: Colors.cyan, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  statsRow:   { flexDirection: 'row', gap: 8 },
  statCard:   { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, alignItems: 'center' },
  statVal:    { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.cyan },
  statLbl:    { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 0.5 },
  teamRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  teamName:   { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: Colors.text },
  teamSub:    { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim },
  pill:       { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pillTxt:    { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 0.5 },
  eventCard:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.amber + '60', padding: Spacing.md },
  eventType:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.amber, letterSpacing: 1 },
  eventTitle: { fontFamily: Fonts.rajdhaniBold, fontSize: 15, color: Colors.text },
  eventMeta:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim },
  lockBadge:  { alignItems: 'center', backgroundColor: Colors.card2, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border2, padding: 6 },
  lockTxt:    { fontFamily: Fonts.mono, fontSize: 7, color: Colors.cyan, letterSpacing: 0.5 },
  banner:     { backgroundColor: Colors.cyan + '15', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.cyan + '40', padding: Spacing.md, gap: 4 },
  bannerLbl:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.cyan, letterSpacing: 0.5 },
  bannerTxt:  { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.text },
  gameDayCard:{ backgroundColor: Colors.amber + '20', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.amber + '60', padding: Spacing.md, alignItems: 'center' },
  gameDayTxt: { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.amber, letterSpacing: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LandingScreen({ onSignIn, onTryDemo }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const [activeRole, setActiveRole] = useState<'director' | 'coach' | 'parent'>('director');
  const [name, setName]       = useState('');
  const [org, setOrg]         = useState('');
  const [email, setEmail]     = useState('');
  const [message, setMessage] = useState('');

  const center = {
    maxWidth: 960,
    width: '100%' as const,
    alignSelf: 'center' as const,
    paddingHorizontal: isDesktop ? 48 : Spacing.lg,
  };

  function handleSend() {
    if (!email) return;
    const sub  = encodeURIComponent('LeagueMatrix Demo Request');
    const body = encodeURIComponent(`Name: ${name}\nOrg: ${org}\nEmail: ${email}\n\n${message}`);
    // @ts-ignore — web only
    if (typeof window !== 'undefined') window.location.href = `mailto:hello@leaguematrix.com?subject=${sub}&body=${body}`;
  }

  return (
    <View style={s.root}>

      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <View style={[s.nav, { position: 'sticky' as any, top: 0, zIndex: 100 }]}>
        <View style={[s.navInner, center]}>
          <LogoMark size="sm" />
          <TouchableOpacity style={s.navBtn} onPress={onSignIn}>
            <Text style={s.navBtnTxt}>SIGN IN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <View style={s.hero}>
          {/* glow blob */}
          <View style={s.heroGlow} />
          <View style={[center, s.heroContent]}>
            <View style={s.heroTag}>
              <Text style={s.heroTagTxt}>FOR PARKS & RECREATION DEPARTMENTS</Text>
            </View>
            <Text style={[s.h1, isDesktop && s.h1Desktop]}>
              LEAGUE MANAGEMENT,{'\n'}BUILT FOR THE WAY{'\n'}YOU ACTUALLY WORK.
            </Text>
            <Text style={s.heroSub}>
              The all-in-one platform for Parks & Rec departments — digital registration, schedule publishing, team communication, and real-time coaching tools. No app download required.
            </Text>
            <View style={[s.ctaRow, !isDesktop && { flexDirection: 'column' }]}>
              <TouchableOpacity style={s.ctaPrimary} onPress={onTryDemo}>
                <Text style={s.ctaPrimaryTxt}>TRY THE DEMO  →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.ctaSecondary} onPress={onSignIn}>
                <Text style={s.ctaSecondaryTxt}>SIGN IN  →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Problem ──────────────────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: Colors.card2 }]}>
          <View style={center}>
            <Text style={s.sectionTag}>THE PROBLEM</Text>
            <Text style={s.h2}>You're running a league with 20-year-old tools.</Text>
            <View style={[s.threeGrid, isDesktop && s.threeGridRow]}>
              {PROBLEMS.map(p => (
                <View key={p.title} style={[s.problemCard, isDesktop && { flex: 1 }]}>
                  <View style={s.cardIconWrap}>
                    <Ionicons name={p.icon} size={20} color={Colors.cyan} />
                  </View>
                  <Text style={s.problemTitle}>{p.title}</Text>
                  <Text style={s.problemBody}>{p.body}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={center}>
            <Text style={s.sectionTag}>HOW IT WORKS</Text>
            <Text style={s.h2}>From sign-up to game day in four steps.</Text>
            <View style={[s.stepsGrid, isDesktop && s.stepsGridDesktop]}>
              {STEPS.map(step => (
                <View key={step.num} style={[s.stepCard, isDesktop && { width: '47%' }]}>
                  <View style={s.stepHeader}>
                    <Text style={s.stepNum}>{step.num}</Text>
                    <View style={s.stepLine} />
                  </View>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepBody}>{step.body}</Text>
                  <View style={{ marginTop: Spacing.md }}>
                    <step.Mockup />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <View style={[s.section, { backgroundColor: Colors.card2 }]}>
          <View style={center}>
            <Text style={s.sectionTag}>FEATURES</Text>
            <Text style={s.h2}>Everything your department needs.</Text>
            <View style={[s.featGrid, isDesktop && s.featGridDesktop]}>
              {FEATURES.map(f => (
                <View key={f.title} style={[s.featCard, isDesktop && { width: '30%' }]}>
                  <View style={s.cardIconWrap}>
                    <Ionicons name={f.icon} size={20} color={Colors.cyan} />
                  </View>
                  <Text style={s.featTitle}>{f.title}</Text>
                  <Text style={s.featBody}>{f.body}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ── Role Preview ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={center}>
            <Text style={s.sectionTag}>WHO USES IT</Text>
            <Text style={s.h2}>One platform. Three perspectives.</Text>
            <View style={s.roleTabs}>
              {(['director', 'coach', 'parent'] as const).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[s.roleTab, activeRole === r && s.roleTabActive]}
                  onPress={() => setActiveRole(r)}
                >
                  <Text style={[s.roleTabTxt, activeRole === r && s.roleTabTxtActive]}>
                    {r === 'director' ? 'DIRECTOR' : r === 'coach' ? 'COACH' : 'PARENT'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {activeRole === 'director' && <DirectorPanel />}
            {activeRole === 'coach'    && <CoachPanel />}
            {activeRole === 'parent'   && <ParentPanel />}
          </View>
        </View>

        {/* ── CTA / Contact ────────────────────────────────────────────── */}
        {false && <View style={[s.section, { backgroundColor: Colors.card2 }]}>
          <View style={center}>
            <Text style={s.sectionTag}>GET STARTED</Text>
            <Text style={s.h2}>Ready to see it in action?</Text>
            <Text style={s.ctaSub}>
              We'll walk your department through the full platform — from org setup to game day.
            </Text>
            <View style={[s.formRow, isDesktop && s.formRowDesktop]}>
              <TextInput
                style={[s.input, isDesktop && { flex: 1 }]}
                placeholder="Your Name"
                placeholderTextColor={Colors.muted}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[s.input, isDesktop && { flex: 1 }]}
                placeholder="Organization / Department"
                placeholderTextColor={Colors.muted}
                value={org}
                onChangeText={setOrg}
              />
              <TextInput
                style={[s.input, isDesktop && { flex: 1 }]}
                placeholder="Email Address"
                placeholderTextColor={Colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TextInput
              style={[s.input, s.inputMulti]}
              placeholder="Tell us about your league (optional)"
              placeholderTextColor={Colors.muted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={s.submitBtn} onPress={handleSend}>
              <Text style={s.submitTxt}>SEND REQUEST  →</Text>
            </TouchableOpacity>
          </View>
        </View>}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <View style={[center, { alignItems: 'center' }]}>
            <LogoMark size="md" />
            <Text style={s.footerSub}>Built for coaches. Scaled for leagues.</Text>
            <TouchableOpacity onPress={onSignIn}>
              <Text style={s.footerLink}>Sign in to your account  →</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  // Nav
  nav:      { backgroundColor: 'rgba(7,11,18,0.96)', borderBottomWidth: 1, borderBottomColor: Colors.border },
  navInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  navBtn:   { borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 7 },
  navBtnTxt:{ fontFamily: Fonts.mono, fontSize: 11, color: Colors.cyan, letterSpacing: 1 },

  // Hero
  hero: { paddingVertical: 96, overflow: 'hidden' },
  heroGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: Colors.cyan,
    opacity: 0.04,
    transform: [{ translateX: -300 }],
  },
  heroContent: { gap: Spacing.xl },
  heroTag:     { flexDirection: 'row' },
  heroTagTxt:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 2, textTransform: 'uppercase' },
  h1:          { fontFamily: Fonts.orbitron, fontSize: 28, color: Colors.text, lineHeight: 40 },
  h1Desktop:   { fontSize: 44, lineHeight: 60 },
  heroSub:     { fontFamily: Fonts.rajdhani, fontSize: 17, color: Colors.dim, lineHeight: 26, maxWidth: 600 },
  ctaRow:      { flexDirection: 'row', gap: 12, alignItems: 'center' },
  ctaPrimary:  { backgroundColor: Colors.cyan, borderRadius: Radius.full, paddingHorizontal: 28, paddingVertical: 14 },
  ctaPrimaryTxt:{ fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.bg, letterSpacing: 1.5 },
  ctaSecondary: { paddingHorizontal: 16, paddingVertical: 14 },
  ctaSecondaryTxt: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.dim, letterSpacing: 1 },

  // Sections
  section:    { paddingVertical: 72 },
  sectionTag: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm },
  h2:         { fontFamily: Fonts.orbitronBold, fontSize: 24, color: Colors.text, marginBottom: Spacing.xxl, lineHeight: 34 },

  // Problem
  threeGrid:      { gap: Spacing.lg },
  threeGridRow:   { flexDirection: 'row' },
  problemCard:    { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, gap: Spacing.sm },
  cardIconWrap:   { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.cyan + '12', borderWidth: 1, borderColor: Colors.cyan + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  problemTitle:   { fontFamily: Fonts.rajdhaniBold, fontSize: 17, color: Colors.text },
  problemBody:    { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.dim, lineHeight: 22 },

  // Steps
  stepsGrid:        { gap: Spacing.lg },
  stepsGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stepCard:         { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, gap: Spacing.sm },
  stepHeader:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepNum:          { fontFamily: Fonts.orbitron, fontSize: 22, color: Colors.cyan },
  stepLine:         { flex: 1, height: 1, backgroundColor: Colors.border2 },
  stepTitle:        { fontFamily: Fonts.rajdhaniBold, fontSize: 18, color: Colors.text },
  stepBody:         { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.dim, lineHeight: 22 },

  // Features
  featGrid:        { gap: Spacing.lg },
  featGridDesktop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  featCard:        { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, gap: Spacing.sm },
  featTitle:       { fontFamily: Fonts.rajdhaniBold, fontSize: 17, color: Colors.text },
  featBody:        { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.dim, lineHeight: 22 },

  // Role tabs
  roleTabs:       { flexDirection: 'row', gap: 0, marginBottom: Spacing.lg, borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border2, alignSelf: 'flex-start' },
  roleTab:        { paddingHorizontal: 24, paddingVertical: 10 },
  roleTabActive:  { backgroundColor: Colors.cyan },
  roleTabTxt:     { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  roleTabTxtActive: { color: Colors.bg },

  // CTA form
  ctaSub:        { fontFamily: Fonts.rajdhani, fontSize: 17, color: Colors.dim, marginBottom: Spacing.xl, lineHeight: 26 },
  formRow:       { gap: Spacing.md, marginBottom: Spacing.md },
  formRowDesktop:{ flexDirection: 'row' },
  input:         { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border2, borderRadius: Radius.md, padding: Spacing.lg, fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text },
  inputMulti:    { minHeight: 90, textAlignVertical: 'top', marginBottom: Spacing.lg },
  submitBtn:     { backgroundColor: Colors.cyan, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center' },
  submitTxt:     { fontFamily: Fonts.monoBold, fontSize: 13, color: Colors.bg, letterSpacing: 1.5 },

  // Footer
  footer:      { paddingVertical: 48, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center', gap: 8 },
  footerSub:   { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted, textAlign: 'center' },
  footerLink:  { fontFamily: Fonts.mono, fontSize: 11, color: Colors.cyan, letterSpacing: 0.5, marginTop: Spacing.sm },
});
