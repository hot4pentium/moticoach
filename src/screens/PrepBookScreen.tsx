import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Colors, Fonts, Radius, Spacing } from '../theme';
import { functions, db } from '../lib/firebase';
import { useCoach } from '../context/CoachContext';
import { useAuth } from '../context/AuthContext';
import UpgradePrompt from '../components/UpgradePrompt';
import { globalPlays } from './PlaymakerScreen';
import { type Play } from './PlayEditorScreen';

// ─── Types ───────────────────────────────────────────────────────────────────

type PlayerStatus   = 'present' | 'absent' | 'injured';
type LineupRole     = 'start' | 'sub' | 'out';
type ReminderOption = '15min' | '30min' | '1hr' | '2hr' | 'day' | '9am';

interface Player {
  id: string;
  jersey: number;
  name: string;
  position: string;
  status: PlayerStatus;
}

interface ScoutItem {
  id: string;
  title: string;
  note: string;
  checked: boolean;
  reminder: ReminderOption | null;
}

interface DrillItem {
  id: string;
  name: string;
  duration: number; // minutes
  notes: string;
}

interface SavedDrill {
  id: string;
  name: string;
  duration: number;
  notes: string;
}

interface FocusItem {
  id: string;
  text: string;
  detail: string;
}

interface EquipmentItem {
  id: string;
  label: string;
  checked: boolean;
}

// ─── Mock Roster ─────────────────────────────────────────────────────────────

const MOCK_ROSTER: Player[] = [
  { id: '1',  jersey: 1,  name: 'James Porter',   position: 'Goalkeeper',     status: 'present' },
  { id: '2',  jersey: 2,  name: 'Carlos Mendez',  position: 'Right Back',     status: 'present' },
  { id: '3',  jersey: 3,  name: 'Devon Wallace',  position: 'Left Back',      status: 'injured' },
  { id: '4',  jersey: 5,  name: 'Marcus Hill',    position: 'Centre Back',    status: 'injured' },
  { id: '5',  jersey: 6,  name: 'Tyler Brooks',   position: 'Centre Back',    status: 'present' },
  { id: '6',  jersey: 8,  name: 'Aiden Cole',     position: 'Defensive Mid',  status: 'present' },
  { id: '7',  jersey: 10, name: 'Ryan Zhang',     position: 'Right Mid',      status: 'present' },
  { id: '8',  jersey: 14, name: 'Jordan Ellis',   position: 'Central Mid',    status: 'present' },
  { id: '9',  jersey: 7,  name: 'Noah Banks',     position: 'Left Mid',       status: 'present' },
  { id: '10', jersey: 9,  name: 'Luis Garcia',    position: 'Striker',        status: 'present' },
  { id: '11', jersey: 11, name: 'Kai Thompson',   position: 'Forward',        status: 'present' },
  { id: '12', jersey: 15, name: 'Owen Price',     position: 'Sub / Mid',      status: 'present' },
  { id: '13', jersey: 16, name: 'Sam Rivers',     position: 'Sub / Forward',  status: 'present' },
];

// ─── Scout Data ──────────────────────────────────────────────────────────────

const DEFAULT_SCOUT_ITEMS: ScoutItem[] = [
  { id: 's1', title: 'Review opponent film',  note: 'Eagles last 3 matches',            checked: false, reminder: null },
  { id: 's2', title: 'Identify key threats',  note: 'Their #7 and #11 – pace on wings', checked: false, reminder: null },
  { id: 's3', title: 'Note their formation',  note: '',                                 checked: false, reminder: null },
  { id: 's4', title: 'Set counter-strategy',  note: 'Press high, defend wide channels', checked: false, reminder: null },
];

const DEFAULT_GAME_FOCUS_ITEMS: ScoutItem[] = [
  { id: 'g1', title: 'Priority #1 – Tactical',   note: 'Press high, win second balls',  checked: false, reminder: null },
  { id: 'g2', title: 'Priority #2 – Defensive',  note: 'Defend wide channels',          checked: false, reminder: null },
  { id: 'g3', title: 'Priority #3 – Set Pieces', note: '3 corner routines drilled',     checked: false, reminder: null },
];

const DEFAULT_TRAINING_FOCUS: FocusItem[] = [
  { id: 'tf1', text: 'Technical – Passing', detail: '' },
  { id: 'tf2', text: 'Tactical – Shape',    detail: '' },
];

const SPORT_EQUIPMENT: Record<string, string[]> = {
  soccer:     ['Soccer balls', 'Cones', 'Bibs / Vests', 'Goals', 'Water bottles', 'First aid kit'],
  basketball: ['Basketballs', 'Cones', 'Bibs / Vests', 'Water bottles', 'First aid kit'],
  football:   ['Footballs', 'Cones', 'Tackle pads', 'Blocking sleds', 'Water bottles', 'First aid kit'],
  baseball:   ['Baseballs', 'Bats', 'Batting helmets', 'Batting tee', 'Catcher gear', 'Bases', 'Water bottles', 'First aid kit'],
  volleyball: ['Volleyballs', 'Net', 'Antenna / poles', 'Cones', 'Water bottles', 'First aid kit'],
};

function defaultEquipment(sport: string): EquipmentItem[] {
  const labels = SPORT_EQUIPMENT[sport] ?? SPORT_EQUIPMENT.soccer;
  return labels.map((label, i) => ({ id: `eq${i + 1}`, label, checked: false }));
}

const REMINDER_ROWS = [
  [
    { id: '15min' as ReminderOption, label: '15',    sub: 'MIN BEFORE' },
    { id: '30min' as ReminderOption, label: '30',    sub: 'MIN BEFORE' },
    { id: '1hr'   as ReminderOption, label: '1 HR',  sub: 'BEFORE'     },
  ],
  [
    { id: '2hr'   as ReminderOption, label: '2 HRS', sub: 'BEFORE'     },
    { id: 'day'   as ReminderOption, label: 'DAY',   sub: 'BEFORE'     },
    { id: '9am'   as ReminderOption, label: '9 AM',  sub: 'GAME DAY'   },
  ],
];

// ─── Step Config ─────────────────────────────────────────────────────────────

const GAME_STEPS = [
  { id: 1, label: 'Attend.',  title: 'Attendance & Roster',    icon: '👥', desc: 'Mark anyone missing – everyone else is confirmed' },
  { id: 2, label: 'Lineup',   title: 'Starting Lineup',        icon: '📋', desc: 'Set your starting 11, subs, and captain' },
  { id: 3, label: 'Scout',    title: 'Scouting & Opposition',  icon: '🔍', desc: 'Know your opponent before they know you' },
  { id: 4, label: 'Game',     title: 'Game Focus',             icon: '🎯', desc: '3 things your team will execute today' },
  { id: 5, label: 'Pre-Game', title: 'Pre-Game Prep',          icon: '🔥', desc: 'Warm-up schedule and team talk points' },
  { id: 6, label: 'Final',    title: 'Final Check',            icon: '✅', desc: 'Confirm everything is ready to go' },
];

const PRACTICE_STEPS = [
  { id: 1, label: 'Attend.',  title: 'Attendance',      icon: '👥', desc: 'Confirm who is showing up today' },
  { id: 2, label: 'Drills',   title: 'Drill Plan',      icon: '⚡', desc: 'Build your session with drill blocks' },
  { id: 3, label: 'Focus',    title: 'Training Focus',  icon: '🎯', desc: '2–3 skills or tactical themes for today' },
  { id: 4, label: 'Gear',     title: 'Equipment Check', icon: '🎒', desc: 'Make sure everything is packed and ready' },
  { id: 5, label: 'Final',    title: 'Final Check',     icon: '✅', desc: 'Session is planned and ready to go' },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PrepBookScreen({ navigation, route }: any) {
  const eventTitle   = route?.params?.eventTitle ?? 'Event';
  const eventType    = route?.params?.eventType  ?? 'game';
  const reviewMode   = route?.params?.mode === 'review';
  const reviewEntry  = route?.params?.entry ?? null;
  const { coachSport, isPaid } = useCoach();
  const { teamCode } = useAuth();

  const [upgradeVisible, setUpgradeVisible] = useState(!isPaid);
  const [currentStep, setCurrentStep] = useState(0);
  const [roster, setRoster]           = useState<Player[]>(MOCK_ROSTER);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step 2 — Lineup
  const [lineupRoles, setLineupRoles] = useState<Record<string, LineupRole>>(() =>
    Object.fromEntries(MOCK_ROSTER.map(p => [p.id, p.status === 'present' ? 'start' : 'out']))
  );
  const [captainId, setCaptainId] = useState<string | null>(null);

  // Step 3 — Scouting
  const [scoutItems, setScoutItems]               = useState<ScoutItem[]>(DEFAULT_SCOUT_ITEMS);
  const [scoutNotes, setScoutNotes]               = useState('');
  const [oppositionReviewed, setOppositionReviewed] = useState(false);

  // Step 4 — Game Focus
  const [gameFocusItems, setGameFocusItems] = useState<ScoutItem[]>(DEFAULT_GAME_FOCUS_ITEMS);
  const [gameNotes, setGameNotes]           = useState('');
  const [focusConfirmed, setFocusConfirmed] = useState(false);

  // Practice — Drill Plan
  const [drills, setDrills] = useState<DrillItem[]>([]);

  // Practice — Training Focus
  const [trainingFocus, setTrainingFocus]         = useState<FocusItem[]>(DEFAULT_TRAINING_FOCUS);
  const [focusNotes, setFocusNotes]               = useState('');
  const [practFocusConfirmed, setPractFocusConfirmed] = useState(false);

  // Practice — Equipment
  const [equipment, setEquipment] = useState<EquipmentItem[]>(() => defaultEquipment(coachSport));

  const isPractice  = eventType === 'practice';
  const STEPS       = isPractice ? PRACTICE_STEPS : GAME_STEPS;
  const step        = STEPS[currentStep];
  const accentColor = eventType === 'game'     ? Colors.amber
                    : eventType === 'practice' ? Colors.green
                    :                            Colors.purple;

  const [showComplete, setShowComplete] = useState(false);
  const [savedEntry, setSavedEntry] = useState<any>(null);

  const goNext = () => {
    const isFinal = currentStep === STEPS.length - 1;
    const nextCompleted = [...new Set([...completedSteps, currentStep])];
    setCompletedSteps(nextCompleted);
    if (!isFinal) {
      setCurrentStep(s => s + 1);
    } else {
      const snapshot: Record<string, any> = {
        eventTitle, eventType,
        completedAt: Date.now(),
        completedSteps: nextCompleted,
        roster: roster.map(p => ({ id: p.id, name: p.name, jersey: p.jersey, position: p.position, status: p.status })),
      };
      if (!isPractice) {
        snapshot.lineupRoles = lineupRoles;
        snapshot.captainId = captainId;
        snapshot.scoutItems = scoutItems;
        snapshot.scoutNotes = scoutNotes;
        snapshot.gameFocusItems = gameFocusItems;
        snapshot.gameNotes = gameNotes;
      } else {
        snapshot.drills = drills;
        snapshot.trainingFocus = trainingFocus;
        snapshot.focusNotes = focusNotes;
        snapshot.equipment = equipment;
      }
      if (teamCode) {
        addDoc(collection(db, 'teams', teamCode, 'prepBookEntries'), {
          ...snapshot,
          completedAt: serverTimestamp(),
        }).catch(() => {});
      }
      setSavedEntry(snapshot);
      setShowComplete(true);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else navigation?.goBack();
  };

  const printPrepBook = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const starters  = roster.filter(p => lineupRoles[p.id] === 'start');
    const subs      = roster.filter(p => lineupRoles[p.id] === 'sub');
    const captain   = roster.find(p => p.id === captainId);
    const absent    = roster.filter(p => p.status === 'absent');
    const injured   = roster.filter(p => p.status === 'injured');
    const attended  = roster.filter(p => p.status === 'present').length;
    const totalDrillMin = drills.reduce((s, d) => s + d.duration, 0);

    const gameHTML = `
      <h2>LINEUP</h2>
      <div class="row">
        <div class="col">
          <div class="col-label">STARTERS</div>
          ${starters.map(p => `<div class="player"><span class="jersey">#${p.jersey}</span><span class="name">${p.name}${captain?.id === p.id ? ' <span class="cap">C</span>' : ''}</span><span class="pos">${p.position}</span></div>`).join('')}
        </div>
        <div class="col">
          <div class="col-label">SUBS</div>
          ${subs.map(p => `<div class="player"><span class="jersey">#${p.jersey}</span><span class="name">${p.name}</span><span class="pos">${p.position}</span></div>`).join('')}
        </div>
      </div>
      ${(absent.length + injured.length) > 0 ? `<div class="absent">OUT: ${[...absent.map(p => p.name), ...injured.map(p => `${p.name} (inj.)`)].join(', ')}</div>` : ''}
      <h2>GAME FOCUS</h2>
      ${gameFocusItems.map(item => `<div class="focus-item"><span>▸</span><div><div>${item.title}</div>${item.note ? `<div class="note">${item.note}</div>` : ''}</div></div>`).join('')}
      ${gameNotes ? `<div class="notes-box">${gameNotes.replace(/\n/g, '<br>')}</div>` : ''}
      <h2>SCOUT NOTES</h2>
      ${scoutItems.filter(s => s.checked || s.note).map(item => `<div class="focus-item"><span>${item.checked ? '✓' : '○'}</span><div><div>${item.title}</div>${item.note ? `<div class="note">${item.note}</div>` : ''}</div></div>`).join('')}
      ${scoutNotes ? `<div class="notes-box">${scoutNotes.replace(/\n/g, '<br>')}</div>` : ''}
    `;

    const practiceHTML = `
      <h2>ROSTER (${attended} PRESENT)</h2>
      <div class="equipment-grid">
        ${roster.filter(p => p.status === 'present').map(p => `<div class="player" style="width:48%;"><span class="jersey">#${p.jersey}</span><span class="name">${p.name}</span><span class="pos">${p.position}</span></div>`).join('')}
      </div>
      ${(absent.length + injured.length) > 0 ? `<div class="absent">OUT: ${[...absent.map(p => p.name), ...injured.map(p => `${p.name} (inj.)`)].join(', ')}</div>` : ''}
      <h2>DRILL PLAN${drills.length > 0 ? ` (${totalDrillMin} MIN TOTAL)` : ''}</h2>
      ${drills.length > 0
        ? drills.map((d, i) => `<div class="drill-block"><div class="drill-title">${i + 1}. ${d.name}</div><div class="drill-meta">${d.duration} min${d.notes ? ` · ${d.notes}` : ''}</div></div>`).join('')
        : '<div class="muted">No drills added</div>'}
      <h2>TRAINING FOCUS</h2>
      ${trainingFocus.map(item => `<div class="focus-item"><span>▸</span><div><div>${item.text}</div>${item.detail ? `<div class="note">${item.detail}</div>` : ''}</div></div>`).join('')}
      ${focusNotes ? `<div class="notes-box">${focusNotes.replace(/\n/g, '<br>')}</div>` : ''}
      <h2>EQUIPMENT</h2>
      <div class="equipment-grid">
        ${equipment.map(item => `<div class="equipment-item"><span class="check">${item.checked ? '✓' : ''}</span><span>${item.label}</span></div>`).join('')}
      </div>
    `;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${isPractice ? 'Practice Plan' : 'Game Prep'} — ${eventTitle}</title>
<style>
  body{font-family:Arial,sans-serif;color:#111;background:#fff;max-width:780px;margin:0 auto;padding:20px 24px;font-size:13px;}
  h1{font-size:20px;margin-bottom:2px;}
  .subtitle{color:#666;font-size:12px;margin-bottom:4px;}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:20px;margin-bottom:8px;}
  .row{display:flex;gap:32px;}
  .col{flex:1;}
  .col-label{font-weight:bold;font-size:11px;color:#555;margin-bottom:6px;}
  .player{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0;}
  .jersey{font-weight:bold;width:28px;text-align:right;color:#333;}
  .name{flex:1;}
  .pos{color:#888;font-size:11px;}
  .cap{background:#f59e0b;color:#000;font-size:9px;font-weight:bold;padding:1px 5px;border-radius:3px;}
  .focus-item{padding:4px 0;display:flex;gap:8px;}
  .note{color:#666;font-size:11px;margin-top:1px;}
  .drill-block{border:1px solid #ddd;border-radius:5px;padding:8px 10px;margin-bottom:6px;}
  .drill-title{font-weight:bold;}
  .drill-meta{color:#666;font-size:11px;margin-top:2px;}
  .equipment-grid{display:flex;flex-wrap:wrap;}
  .equipment-item{display:flex;align-items:center;gap:8px;width:48%;padding:3px 0;}
  .check{width:15px;height:15px;border:1.5px solid #999;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;}
  .absent{color:#dc2626;font-size:11px;margin-top:8px;}
  .notes-box{background:#f9f9f9;border:1px solid #e5e7eb;border-radius:5px;padding:8px 10px;margin-top:6px;min-height:36px;line-height:1.5;}
  .muted{color:#999;}
  .footer{margin-top:32px;padding-top:10px;border-top:1px solid #ddd;color:#aaa;font-size:10px;text-align:center;}
  @media print{body{padding:10px 16px;}}
</style></head><body>
<h1>${isPractice ? 'PRACTICE PLAN' : 'GAME PREP'}</h1>
<div class="subtitle">${eventTitle} · ${attended} PLAYERS READY</div>
${isPractice ? practiceHTML : gameHTML}
<div class="footer">LeagueMatrix · ${new Date().toLocaleDateString()}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const toggleAbsent = (id: string) => {
    setRoster(prev => prev.map(p => {
      if (p.id !== id || p.status === 'injured') return p;
      return { ...p, status: p.status === 'absent' ? 'present' : 'absent' };
    }));
  };

  const absentCount    = roster.filter(p => p.status === 'absent').length;
  const injuredCount   = roster.filter(p => p.status === 'injured').length;
  const availableCount = roster.filter(p => p.status === 'present').length;

  if (reviewMode && reviewEntry) {
    return <PrepBookReview navigation={navigation} entry={reviewEntry} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <UpgradePrompt
        visible={upgradeVisible}
        featureName="PREP BOOK"
        description="Full game and practice prep plans are available on the Pro plan."
        onDismiss={() => { setUpgradeVisible(false); navigation?.goBack(); }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{step.title.toUpperCase()}</Text>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressWrap}>
        <View style={styles.stepsRow}>
          {STEPS.map((s, i) => {
            const isDone   = completedSteps.includes(i);
            const isActive = i === currentStep;
            const isLocked = !isDone && !isActive && i > currentStep;
            return (
              <React.Fragment key={s.id}>
                <TouchableOpacity
                  style={styles.stepItem}
                  onPress={() => !isLocked && setCurrentStep(i)}
                >
                  <View style={[
                    styles.stepDot,
                    isDone   && { backgroundColor: Colors.green, borderColor: Colors.green },
                    isActive && { backgroundColor: accentColor,  borderColor: accentColor  },
                  ]}>
                    <Text style={[
                      styles.stepDotText,
                      (isDone || isActive) && { color: '#000' },
                    ]}>
                      {isDone ? '✓' : s.id}
                    </Text>
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    isDone   && { color: Colors.green },
                    isActive && { color: accentColor  },
                  ]} numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
                {i < STEPS.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    isDone && { backgroundColor: Colors.green },
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${(completedSteps.length / STEPS.length) * 100}%` as any,
            backgroundColor: accentColor,
          }]} />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

        {/* Step Card */}
        <View style={styles.stepCard}>
          <View style={[styles.stepCardAccent, { backgroundColor: accentColor }]} />
          <Text style={styles.stepCardTag}>STEP {step.id} OF {STEPS.length}  ·  {step.icon}</Text>
          <Text style={styles.stepCardTitle}>{step.title}</Text>
          <Text style={styles.stepCardDesc}>{step.desc}</Text>
        </View>

        {/* Step 1 — Attendance (shared) */}
        {currentStep === 0 && (
          <AttendanceStep
            roster={roster}
            onToggle={toggleAbsent}
            availableCount={availableCount}
            absentCount={absentCount}
            injuredCount={injuredCount}
            navigation={navigation}
          />
        )}

        {/* Game: Step 2 — Lineup */}
        {!isPractice && currentStep === 1 && (
          <LineupStep
            roster={roster}
            lineupRoles={lineupRoles}
            setLineupRoles={setLineupRoles}
            captainId={captainId}
            setCaptainId={setCaptainId}
          />
        )}

        {/* Game: Step 3 — Scouting */}
        {!isPractice && currentStep === 2 && (
          <ScoutingStep
            scoutItems={scoutItems}
            setScoutItems={setScoutItems}
            scoutNotes={scoutNotes}
            setScoutNotes={setScoutNotes}
            oppositionReviewed={oppositionReviewed}
            setOppositionReviewed={setOppositionReviewed}
          />
        )}

        {/* Game: Step 4 — Game Focus */}
        {!isPractice && currentStep === 3 && (
          <GameFocusStep
            items={gameFocusItems}
            setItems={setGameFocusItems}
            notes={gameNotes}
            setNotes={setGameNotes}
            confirmed={focusConfirmed}
            setConfirmed={setFocusConfirmed}
          />
        )}

        {/* Game: Step 5 — Pre-Game Stub */}
        {!isPractice && currentStep === 4 && (
          <StepStub step={STEPS[currentStep]} color={accentColor} />
        )}

        {/* Game: Step 6 — Final */}
        {!isPractice && currentStep === 5 && (
          <FinalStep
            roster={roster}
            completedSteps={completedSteps}
            totalSteps={STEPS.length}
            accentColor={accentColor}
            steps={STEPS}
            onPrint={Platform.OS === 'web' ? printPrepBook : undefined}
          />
        )}

        {/* Practice: Step 2 — Drill Plan */}
        {isPractice && currentStep === 1 && (
          <DrillPlanStep
            drills={drills}
            setDrills={setDrills}
          />
        )}

        {/* Practice: Step 3 — Training Focus */}
        {isPractice && currentStep === 2 && (
          <TrainingFocusStep
            items={trainingFocus}
            setItems={setTrainingFocus}
            notes={focusNotes}
            setNotes={setFocusNotes}
            confirmed={practFocusConfirmed}
            setConfirmed={setPractFocusConfirmed}
          />
        )}

        {/* Practice: Step 4 — Equipment */}
        {isPractice && currentStep === 3 && (
          <EquipmentStep
            equipment={equipment}
            setEquipment={setEquipment}
          />
        )}

        {/* Practice: Step 5 — Final */}
        {isPractice && currentStep === 4 && (
          <FinalStep
            roster={roster}
            completedSteps={completedSteps}
            totalSteps={STEPS.length}
            accentColor={accentColor}
            steps={STEPS}
            onPrint={Platform.OS === 'web' ? printPrepBook : undefined}
          />
        )}

        <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>STEP {step.id} OF {STEPS.length}</Text>
          <Text style={styles.stepCounterSub}>{completedSteps.length} completed</Text>
        </View>
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: accentColor }]}
          onPress={goNext}
        >
          <Text style={styles.nextBtnText}>
            {currentStep < STEPS.length - 1 ? 'NEXT STEP →' : '✅ CONFIRM READY'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Completion Modal */}
      <Modal visible={showComplete} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.completeOverlay}>
          <View style={styles.completeCard}>
            <View style={[styles.completeIconWrap, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }]}>
              <Text style={styles.completeEmoji}>✅</Text>
            </View>
            <Text style={[styles.completeTitle, { color: accentColor }]}>PREP LOCKED IN</Text>
            <Text style={styles.completeMsg}>
              Your {isPractice ? 'practice plan' : 'game prep'} for{'\n'}
              <Text style={{ color: Colors.text }}>{eventTitle}</Text>
              {'\n'}has been saved.
            </Text>
            <View style={styles.completeHint}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.cyan} />
              <Text style={styles.completeHintTxt}>
                You can review this prep book anytime from the Prep Book section on your dashboard.
              </Text>
            </View>
            {savedEntry && (
              <TouchableOpacity
                style={[styles.completeReviewBtn, { borderColor: accentColor }]}
                onPress={() => {
                  setShowComplete(false);
                  navigation?.replace('PrepBook', { mode: 'review', entry: savedEntry });
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={16} color={accentColor} />
                <Text style={[styles.completeReviewBtnTxt, { color: accentColor }]}>VIEW SAVED PREP</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.completeGotItBtn, { backgroundColor: accentColor }]}
              onPress={() => { setShowComplete(false); navigation?.goBack(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.completeGotItTxt}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ─── Step 1: Attendance ───────────────────────────────────────────────────────

function AttendanceStep({
  roster, onToggle, availableCount, absentCount, injuredCount, navigation,
}: {
  roster: Player[];
  onToggle: (id: string) => void;
  availableCount: number;
  absentCount: number;
  injuredCount: number;
  navigation: any;
}) {
  return (
    <View style={styles.stepContent}>
      {/* Roster management shortcut */}
      <TouchableOpacity
        style={styles.manageRosterBtn}
        onPress={() => navigation?.navigate('Roster')}
      >
        <Text style={styles.manageRosterText}>⚙ SET JERSEYS &amp; POSITIONS</Text>
        <Text style={styles.manageRosterArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { borderColor: `${Colors.green}44` }]}>
          <Text style={[styles.summaryVal, { color: Colors.green }]}>{availableCount}</Text>
          <Text style={styles.summaryLabel}>AVAILABLE</Text>
        </View>
        <View style={[styles.summaryPill, { borderColor: `${Colors.red}44` }]}>
          <Text style={[styles.summaryVal, { color: Colors.red }]}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>ABSENT</Text>
        </View>
        <View style={[styles.summaryPill, { borderColor: `${Colors.amber}44` }]}>
          <Text style={[styles.summaryVal, { color: Colors.amber }]}>{injuredCount}</Text>
          <Text style={styles.summaryLabel}>INJURED</Text>
        </View>
      </View>
      <Text style={styles.rosterHint}>Tap a player to mark absent</Text>
      {roster.map(player => (
        <TouchableOpacity
          key={player.id}
          style={[
            styles.playerRow,
            player.status === 'absent'  && styles.playerRowAbsent,
            player.status === 'injured' && styles.playerRowInjured,
          ]}
          onPress={() => onToggle(player.id)}
          activeOpacity={player.status === 'injured' ? 1 : 0.7}
        >
          <View style={[
            styles.jersey,
            player.status === 'absent'  && { backgroundColor: 'rgba(231,76,60,0.15)',  borderColor: `${Colors.red}44`   },
            player.status === 'injured' && { backgroundColor: 'rgba(212,168,83,0.15)', borderColor: `${Colors.amber}44` },
          ]}>
            <Text style={[
              styles.jerseyNum,
              player.status === 'absent'  && { color: Colors.red   },
              player.status === 'injured' && { color: Colors.amber  },
            ]}>
              {player.jersey}
            </Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, player.status !== 'present' && { opacity: 0.5 }]}>
              {player.name}
            </Text>
            <Text style={styles.playerPos}>{player.position}</Text>
          </View>
          {player.status === 'injured' && (
            <View style={styles.injuredBadge}><Text style={styles.injuredBadgeText}>INJURED</Text></View>
          )}
          {player.status === 'absent' && (
            <View style={styles.absentBadge}><Text style={styles.absentBadgeText}>ABSENT</Text></View>
          )}
          {player.status === 'present' && (
            <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Step 2: Lineup ───────────────────────────────────────────────────────────

function LineupStep({
  roster, lineupRoles, setLineupRoles, captainId, setCaptainId,
}: {
  roster: Player[];
  lineupRoles: Record<string, LineupRole>;
  setLineupRoles: React.Dispatch<React.SetStateAction<Record<string, LineupRole>>>;
  captainId: string | null;
  setCaptainId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const startCount = Object.values(lineupRoles).filter(r => r === 'start').length;
  const subCount   = Object.values(lineupRoles).filter(r => r === 'sub').length;
  const outCount   = Object.values(lineupRoles).filter(r => r === 'out').length;

  const setRole = (id: string, role: LineupRole) => {
    setLineupRoles(prev => ({ ...prev, [id]: role }));
    if (role === 'out' && captainId === id) setCaptainId(null);
  };

  const toggleCaptain = (id: string) => {
    if (lineupRoles[id] === 'out') return;
    setCaptainId(prev => (prev === id ? null : id));
  };

  return (
    <View style={styles.stepContent}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { borderColor: `${Colors.green}44` }]}>
          <Text style={[styles.summaryVal, { color: Colors.green }]}>{startCount}</Text>
          <Text style={styles.summaryLabel}>START</Text>
        </View>
        <View style={[styles.summaryPill, { borderColor: `${Colors.blue}44` }]}>
          <Text style={[styles.summaryVal, { color: Colors.blue }]}>{subCount}</Text>
          <Text style={styles.summaryLabel}>SUB</Text>
        </View>
        <View style={[styles.summaryPill, { borderColor: `${Colors.red}44` }]}>
          <Text style={[styles.summaryVal, { color: Colors.red }]}>{outCount}</Text>
          <Text style={styles.summaryLabel}>OUT</Text>
        </View>
      </View>
      <Text style={styles.rosterHint}>Set roles  ·  Tap C to assign captain</Text>
      {roster.map(player => {
        const role      = lineupRoles[player.id] ?? 'out';
        const isCaptain = captainId === player.id;
        const jerseyBg     = role === 'start' ? 'rgba(46,204,113,0.12)' : role === 'sub' ? 'rgba(61,143,255,0.12)' : 'rgba(255,255,255,0.03)';
        const jerseyBorder = role === 'start' ? `${Colors.green}55`     : role === 'sub' ? `${Colors.blue}55`      : Colors.border;
        const jerseyText   = role === 'start' ? Colors.green             : role === 'sub' ? Colors.blue             : Colors.muted;
        return (
          <View key={player.id} style={styles.lineupRow}>
            <View style={[styles.jersey, { backgroundColor: jerseyBg, borderColor: jerseyBorder }]}>
              <Text style={[styles.jerseyNum, { color: jerseyText }]}>{player.jersey}</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, role === 'out' && { opacity: 0.45 }]}>{player.name}</Text>
              <Text style={styles.playerPos}>
                {player.position}
                {player.status === 'injured' ? <Text style={{ color: Colors.amber }}>{' · INJURED'}</Text> : null}
              </Text>
            </View>
            <View style={styles.rolePills}>
              {(['start', 'sub', 'out'] as LineupRole[]).map(r => {
                const active     = role === r;
                const pillColor  = r === 'start' ? Colors.green : r === 'sub' ? Colors.blue : Colors.red;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePill, { borderColor: `${pillColor}55` }, active && { backgroundColor: pillColor, borderColor: pillColor }]}
                    onPress={() => setRole(player.id, r)}
                  >
                    <Text style={[styles.rolePillText, { color: active ? '#000' : pillColor }]}>
                      {r === 'start' ? 'ST' : r === 'sub' ? 'SB' : 'OUT'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.captainBtn, isCaptain && { backgroundColor: Colors.amber, borderColor: Colors.amber }, role === 'out' && { opacity: 0.2 }]}
              onPress={() => toggleCaptain(player.id)}
              activeOpacity={role === 'out' ? 1 : 0.7}
            >
              <Text style={[styles.captainBtnText, isCaptain && { color: '#000' }]}>C</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ─── Step 3: Scouting ─────────────────────────────────────────────────────────

function ScoutingStep({
  scoutItems, setScoutItems, scoutNotes, setScoutNotes, oppositionReviewed, setOppositionReviewed,
}: {
  scoutItems: ScoutItem[];
  setScoutItems: React.Dispatch<React.SetStateAction<ScoutItem[]>>;
  scoutNotes: string;
  setScoutNotes: React.Dispatch<React.SetStateAction<string>>;
  oppositionReviewed: boolean;
  setOppositionReviewed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [reminderSheet, setReminderSheet] = useState<{
    visible: boolean;
    itemId: string | null;
    selected: ReminderOption | null;
  }>({ visible: false, itemId: null, selected: null });

  const toggleCheck = (id: string) =>
    setScoutItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  const updateNote = (id: string, note: string) =>
    setScoutItems(prev => prev.map(i => i.id === id ? { ...i, note } : i));

  const openReminder = (itemId: string) => {
    const item = scoutItems.find(i => i.id === itemId);
    setReminderSheet({ visible: true, itemId, selected: item?.reminder ?? null });
  };

  const confirmReminder = () => {
    const { itemId, selected } = reminderSheet;
    if (itemId && selected) {
      setScoutItems(prev => prev.map(i => i.id === itemId ? { ...i, reminder: selected } : i));
    }
    setReminderSheet({ visible: false, itemId: null, selected: null });
  };

  const addItem = () => {
    const title = newItemText.trim();
    if (title) {
      setScoutItems(prev => [...prev, { id: `s${Date.now()}`, title, note: '', checked: false, reminder: null }]);
    }
    setNewItemText('');
    setAddingItem(false);
  };

  const reminderItem = scoutItems.find(i => i.id === reminderSheet.itemId);

  return (
    <View style={styles.stepContent}>

      {/* Checklist card */}
      <View style={styles.scoutCard}>
        {scoutItems.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={styles.scoutDivider} />}
            <View style={styles.scoutRow}>
              {/* Checkbox */}
              <TouchableOpacity
                style={[styles.scoutCheck, item.checked && styles.scoutCheckDone]}
                onPress={() => toggleCheck(item.id)}
              >
                {item.checked && <Text style={styles.scoutCheckMark}>✓</Text>}
              </TouchableOpacity>

              {/* Title + note */}
              <View style={styles.scoutItemContent}>
                <Text style={[styles.scoutItemTitle, item.checked && styles.scoutItemDone]}>
                  {item.title}
                </Text>
                {editingId === item.id ? (
                  <TextInput
                    style={styles.scoutNoteInput}
                    value={item.note}
                    onChangeText={t => updateNote(item.id, t)}
                    onBlur={() => setEditingId(null)}
                    onSubmitEditing={() => setEditingId(null)}
                    autoFocus
                    placeholder="Add a note..."
                    placeholderTextColor={Colors.muted}
                    returnKeyType="done"
                  />
                ) : item.note ? (
                  <Text style={styles.scoutItemNote}>{item.note}</Text>
                ) : null}
              </View>

              {/* Action buttons */}
              <View style={styles.scoutActions}>
                <TouchableOpacity
                  style={[
                    styles.scoutActionBtn,
                    item.reminder != null && { borderColor: `${Colors.amber}88`, backgroundColor: 'rgba(212,168,83,0.12)' },
                  ]}
                  onPress={() => openReminder(item.id)}
                >
                  <Text style={styles.scoutActionIcon}>🔔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.scoutActionBtn,
                    editingId === item.id && { borderColor: `${Colors.cyan}88`, backgroundColor: 'rgba(0,212,255,0.08)' },
                  ]}
                  onPress={() => setEditingId(prev => prev === item.id ? null : item.id)}
                >
                  <Text style={styles.scoutActionIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Add item row */}
        <View style={styles.scoutDivider} />
        {addingItem ? (
          <View style={styles.addItemInputRow}>
            <TextInput
              style={styles.addItemInput}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="New scouting task..."
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
              onBlur={addItem}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.addItemBtn} onPress={() => setAddingItem(true)}>
            <Text style={styles.addItemText}>+ Add item</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Coach Notes */}
      <Text style={styles.coachNotesLabel}>COACH NOTES</Text>
      <View style={styles.coachNotesCard}>
        <TextInput
          style={styles.coachNotesInput}
          value={scoutNotes}
          onChangeText={setScoutNotes}
          multiline
          numberOfLines={4}
          placeholder="Key opponent tendencies, set piece threats, players to watch..."
          placeholderTextColor={Colors.muted}
          textAlignVertical="top"
        />
      </View>

      {/* Opposition Reviewed */}
      <TouchableOpacity
        style={[styles.reviewedCard, oppositionReviewed && { borderColor: `${Colors.green}55`, backgroundColor: 'rgba(46,204,113,0.06)' }]}
        onPress={() => setOppositionReviewed(v => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.reviewedCheck, oppositionReviewed && styles.reviewedCheckDone]}>
          {oppositionReviewed && <Text style={styles.reviewedCheckMark}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reviewedTitle, oppositionReviewed && { color: Colors.green }]}>
            Opposition reviewed
          </Text>
          <Text style={styles.reviewedSub}>Tap if scouting is complete or N/A</Text>
        </View>
      </TouchableOpacity>

      {/* ── Reminder Bottom Sheet ── */}
      <Modal
        visible={reminderSheet.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderSheet(v => ({ ...v, visible: false }))}
      >
        <View style={styles.reminderOverlay}>
          <TouchableWithoutFeedback onPress={() => setReminderSheet(v => ({ ...v, visible: false }))}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.reminderSheet}>
            <View style={styles.reminderHandle} />
            <Text style={styles.reminderTitle}>🔔 SET REMINDER</Text>
            {reminderItem && (
              <Text style={styles.reminderItemName}>{reminderItem.title.toUpperCase()}</Text>
            )}
            <Text style={styles.reminderMeta}>REMIND ME</Text>
            <Text style={styles.reminderSub}>All times are before kickoff</Text>

            {/* 3×2 grid */}
            {REMINDER_ROWS.map((row, ri) => (
              <View key={ri} style={styles.reminderGridRow}>
                {row.map(opt => {
                  const active = reminderSheet.selected === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.reminderOption, active && styles.reminderOptionActive]}
                      onPress={() => setReminderSheet(v => ({ ...v, selected: opt.id }))}
                    >
                      <Text style={[styles.reminderOptVal, active && { color: Colors.cyan }]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.reminderOptSub}>{opt.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Buttons */}
            <View style={styles.reminderBtns}>
              <TouchableOpacity
                style={styles.reminderCancelBtn}
                onPress={() => setReminderSheet(v => ({ ...v, visible: false }))}
              >
                <Text style={styles.reminderCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reminderConfirmBtn, !reminderSheet.selected && { opacity: 0.45 }]}
                onPress={confirmReminder}
                disabled={!reminderSheet.selected}
              >
                <Text style={styles.reminderConfirmText}>SET REMINDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Step 4: Game Focus ───────────────────────────────────────────────────────

function GameFocusStep({
  items, setItems, notes, setNotes, confirmed, setConfirmed,
}: {
  items: ScoutItem[];
  setItems: React.Dispatch<React.SetStateAction<ScoutItem[]>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  confirmed: boolean;
  setConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [addingItem, setAddingItem]   = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [reminderSheet, setReminderSheet] = useState<{
    visible: boolean; itemId: string | null; selected: ReminderOption | null;
  }>({ visible: false, itemId: null, selected: null });

  const toggleCheck = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));

  const updateNote = (id: string, note: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, note } : i));

  const openReminder = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    setReminderSheet({ visible: true, itemId, selected: item?.reminder ?? null });
  };

  const confirmReminder = () => {
    const { itemId, selected } = reminderSheet;
    if (itemId && selected) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, reminder: selected } : i));
    }
    setReminderSheet({ visible: false, itemId: null, selected: null });
  };

  const addItem = () => {
    const title = newItemText.trim();
    if (title) {
      setItems(prev => [...prev, { id: `g${Date.now()}`, title, note: '', checked: false, reminder: null }]);
    }
    setNewItemText('');
    setAddingItem(false);
  };

  const reminderItem = items.find(i => i.id === reminderSheet.itemId);

  return (
    <View style={styles.stepContent}>

      {/* Priority checklist */}
      <View style={styles.scoutCard}>
        {items.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={styles.scoutDivider} />}
            <View style={styles.scoutRow}>
              <TouchableOpacity
                style={[styles.scoutCheck, item.checked && styles.scoutCheckDone]}
                onPress={() => toggleCheck(item.id)}
              >
                {item.checked && <Text style={styles.scoutCheckMark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.scoutItemContent}>
                <Text style={[styles.scoutItemTitle, item.checked && styles.scoutItemDone]}>
                  {item.title}
                </Text>
                {editingId === item.id ? (
                  <TextInput
                    style={styles.scoutNoteInput}
                    value={item.note}
                    onChangeText={t => updateNote(item.id, t)}
                    onBlur={() => setEditingId(null)}
                    onSubmitEditing={() => setEditingId(null)}
                    autoFocus
                    placeholder="Add a note..."
                    placeholderTextColor={Colors.muted}
                    returnKeyType="done"
                  />
                ) : item.note ? (
                  <Text style={styles.scoutItemNote}>{item.note}</Text>
                ) : null}
              </View>
              <View style={styles.scoutActions}>
                <TouchableOpacity
                  style={[
                    styles.scoutActionBtn,
                    item.reminder != null && { borderColor: `${Colors.amber}88`, backgroundColor: 'rgba(212,168,83,0.12)' },
                  ]}
                  onPress={() => openReminder(item.id)}
                >
                  <Text style={styles.scoutActionIcon}>🔔</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.scoutActionBtn,
                    editingId === item.id && { borderColor: `${Colors.cyan}88`, backgroundColor: 'rgba(0,212,255,0.08)' },
                  ]}
                  onPress={() => setEditingId(prev => prev === item.id ? null : item.id)}
                >
                  <Text style={styles.scoutActionIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View style={styles.scoutDivider} />
        {addingItem ? (
          <View style={styles.addItemInputRow}>
            <TextInput
              style={styles.addItemInput}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="New focus priority..."
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
              onBlur={addItem}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.addItemBtn} onPress={() => setAddingItem(true)}>
            <Text style={styles.addItemText}>+ Add priority</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Coach Notes */}
      <Text style={styles.coachNotesLabel}>COACH NOTES</Text>
      <View style={styles.coachNotesCard}>
        <TextInput
          style={styles.coachNotesInput}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Any additional tactical notes or adjustments for today..."
          placeholderTextColor={Colors.muted}
          textAlignVertical="top"
        />
      </View>

      {/* Focus confirmed card */}
      <TouchableOpacity
        style={[styles.focusConfirmCard, confirmed && styles.focusConfirmCardDone]}
        onPress={() => setConfirmed(v => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.focusConfirmCheck, confirmed && styles.focusConfirmCheckDone]}>
          {confirmed && <Text style={styles.focusConfirmMark}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.focusConfirmTitle, confirmed && { color: Colors.green }]}>
            Focus areas set
          </Text>
          <Text style={styles.focusConfirmSub}>
            {confirmed ? '✓ Marked complete – tap to undo' : 'Tap to confirm focus areas'}
          </Text>
        </View>
        {confirmed && (
          <View style={styles.focusDoneBtn}>
            <Text style={styles.focusDoneBtnText}>DONE</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Reminder bottom sheet — reuses same pattern */}
      <Modal
        visible={reminderSheet.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setReminderSheet(v => ({ ...v, visible: false }))}
      >
        <View style={styles.reminderOverlay}>
          <TouchableWithoutFeedback onPress={() => setReminderSheet(v => ({ ...v, visible: false }))}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.reminderSheet}>
            <View style={styles.reminderHandle} />
            <Text style={styles.reminderTitle}>🔔 SET REMINDER</Text>
            {reminderItem && (
              <Text style={styles.reminderItemName}>{reminderItem.title.toUpperCase()}</Text>
            )}
            <Text style={styles.reminderMeta}>REMIND ME</Text>
            <Text style={styles.reminderSub}>All times are before kickoff</Text>
            {REMINDER_ROWS.map((row, ri) => (
              <View key={ri} style={styles.reminderGridRow}>
                {row.map(opt => {
                  const active = reminderSheet.selected === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.reminderOption, active && styles.reminderOptionActive]}
                      onPress={() => setReminderSheet(v => ({ ...v, selected: opt.id }))}
                    >
                      <Text style={[styles.reminderOptVal, active && { color: Colors.cyan }]}>{opt.label}</Text>
                      <Text style={styles.reminderOptSub}>{opt.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            <View style={styles.reminderBtns}>
              <TouchableOpacity
                style={styles.reminderCancelBtn}
                onPress={() => setReminderSheet(v => ({ ...v, visible: false }))}
              >
                <Text style={styles.reminderCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reminderConfirmBtn, !reminderSheet.selected && { opacity: 0.45 }]}
                onPress={confirmReminder}
                disabled={!reminderSheet.selected}
              >
                <Text style={styles.reminderConfirmText}>SET REMINDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Step Stub (placeholder for step 5: Pre-Game) ────────────────────────────

function StepStub({ step, color }: { step: typeof GAME_STEPS[0]; color: string }) {
  return (
    <View style={styles.stepContent}>
      <View style={[styles.stubCard, { borderColor: `${color}33` }]}>
        <Text style={styles.stubEmoji}>{step.icon}</Text>
        <Text style={[styles.stubTitle, { color }]}>{step.title}</Text>
        <Text style={styles.stubDesc}>This step is being built out next session.</Text>
        <Text style={styles.stubDesc2}>Tap NEXT STEP to continue.</Text>
      </View>
    </View>
  );
}

// ─── Step 6: Final Check ─────────────────────────────────────────────────────

function FinalStep({
  roster, completedSteps, totalSteps, accentColor, steps, onPrint,
}: {
  roster: Player[];
  completedSteps: number[];
  totalSteps: number;
  accentColor: string;
  steps: typeof GAME_STEPS;
  onPrint?: () => void;
}) {
  const available = roster.filter(p => p.status === 'present').length;
  const pct = Math.round((completedSteps.length / totalSteps) * 100);
  return (
    <View style={styles.stepContent}>
      <View style={styles.finalCard}>
        <Text style={[styles.finalPct, { color: accentColor }]}>{pct}%</Text>
        <Text style={styles.finalLabel}>PREP COMPLETE</Text>
        <View style={styles.finalBar}>
          <View style={[styles.finalBarFill, { width: `${pct}%` as any, backgroundColor: accentColor }]} />
        </View>
      </View>
      {steps.map((s, i) => (
        <View key={s.id} style={styles.finalCheckRow}>
          <View style={[styles.finalDot, completedSteps.includes(i) ? { backgroundColor: Colors.green } : { backgroundColor: Colors.border }]} />
          <Text style={[styles.finalStepName, completedSteps.includes(i) && { color: Colors.green }]}>{s.title}</Text>
          <Text style={{ color: completedSteps.includes(i) ? Colors.green : Colors.muted, fontFamily: Fonts.mono, fontSize: 10 }}>
            {completedSteps.includes(i) ? '✓' : '–'}
          </Text>
        </View>
      ))}
      <View style={styles.readyBanner}>
        <Text style={[styles.readyText, { color: accentColor }]}>{available} PLAYERS READY · TAP CONFIRM</Text>
      </View>
      {onPrint && (
        <TouchableOpacity style={styles.printBtn} onPress={onPrint}>
          <Text style={styles.printBtnText}>🖨 PRINT SIDELINE SHEET</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Prep Book Review (read-only) ─────────────────────────────────────────────

function PrepBookReview({ navigation, entry }: { navigation: any; entry: any }) {
  const isPractice  = entry.eventType === 'practice';
  const accentColor = entry.eventType === 'game' ? Colors.amber
                    : entry.eventType === 'practice' ? Colors.green
                    : Colors.purple;
  const completedDate = entry.completedAt
    ? new Date(entry.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const pct = entry.completedSteps && entry.completedSteps.length
    ? Math.round((entry.completedSteps.length / (isPractice ? PRACTICE_STEPS.length : GAME_STEPS.length)) * 100)
    : 0;

  const present  = (entry.roster ?? []).filter((p: any) => p.status === 'present');
  const absent   = (entry.roster ?? []).filter((p: any) => p.status === 'absent');
  const injured  = (entry.roster ?? []).filter((p: any) => p.status === 'injured');
  const starters = present.filter((p: any) => entry.lineupRoles?.[p.id] === 'start');
  const subs     = present.filter((p: any) => entry.lineupRoles?.[p.id] === 'sub');
  const captain  = present.find((p: any) => p.id === entry.captainId);

  const printEntry = () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const totalDrillMin = (entry.drills ?? []).reduce((s: number, d: any) => s + (d.duration ?? 0), 0);

    const gameHTML = `
      <h2>LINEUP</h2>
      <div class="row">
        <div class="col">
          <div class="col-label">STARTERS</div>
          ${starters.map((p: any) => `<div class="player"><span class="jersey">#${p.jersey}</span><span class="name">${p.name}${captain?.id === p.id ? ' <span class="cap">C</span>' : ''}</span><span class="pos">${p.position}</span></div>`).join('')}
        </div>
        <div class="col">
          <div class="col-label">SUBS</div>
          ${subs.map((p: any) => `<div class="player"><span class="jersey">#${p.jersey}</span><span class="name">${p.name}</span><span class="pos">${p.position}</span></div>`).join('')}
        </div>
      </div>
      ${(absent.length + injured.length) > 0 ? `<div class="absent">OUT: ${[...absent.map((p: any) => p.name), ...injured.map((p: any) => `${p.name} (inj.)`)].join(', ')}</div>` : ''}
      <h2>GAME FOCUS</h2>
      ${(entry.gameFocusItems ?? []).map((item: any) => `<div class="focus-item"><span>▸</span><div><div>${item.title}</div>${item.note ? `<div class="note">${item.note}</div>` : ''}</div></div>`).join('')}
      ${entry.gameNotes ? `<div class="notes-box">${entry.gameNotes.replace(/\n/g, '<br>')}</div>` : ''}
      <h2>SCOUT NOTES</h2>
      ${(entry.scoutItems ?? []).filter((s: any) => s.checked || s.note).map((item: any) => `<div class="focus-item"><span>${item.checked ? '✓' : '○'}</span><div><div>${item.title}</div>${item.note ? `<div class="note">${item.note}</div>` : ''}</div></div>`).join('')}
      ${entry.scoutNotes ? `<div class="notes-box">${entry.scoutNotes.replace(/\n/g, '<br>')}</div>` : ''}
    `;

    const practiceHTML = `
      <h2>ROSTER (${present.length} PRESENT)</h2>
      <div class="equipment-grid">
        ${present.map((p: any) => `<div class="player" style="width:48%;"><span class="jersey">#${p.jersey}</span><span class="name">${p.name}</span><span class="pos">${p.position}</span></div>`).join('')}
      </div>
      ${(absent.length + injured.length) > 0 ? `<div class="absent">OUT: ${[...absent.map((p: any) => p.name), ...injured.map((p: any) => `${p.name} (inj.)`)].join(', ')}</div>` : ''}
      <h2>DRILL PLAN${totalDrillMin > 0 ? ` (${totalDrillMin} MIN TOTAL)` : ''}</h2>
      ${(entry.drills ?? []).length > 0
        ? (entry.drills as any[]).map((d: any, i: number) => `<div class="drill-block"><div class="drill-title">${i + 1}. ${d.name}</div><div class="drill-meta">${d.duration} min${d.notes ? ` · ${d.notes}` : ''}</div></div>`).join('')
        : '<div class="muted">No drills added</div>'}
      <h2>TRAINING FOCUS</h2>
      ${(entry.trainingFocus ?? []).map((item: any) => `<div class="focus-item"><span>▸</span><div><div>${item.text}</div>${item.detail ? `<div class="note">${item.detail}</div>` : ''}</div></div>`).join('')}
      ${entry.focusNotes ? `<div class="notes-box">${entry.focusNotes.replace(/\n/g, '<br>')}</div>` : ''}
      <h2>EQUIPMENT</h2>
      <div class="equipment-grid">
        ${(entry.equipment ?? []).map((item: any) => `<div class="equipment-item"><span class="check">${item.checked ? '✓' : ''}</span><span>${item.label}</span></div>`).join('')}
      </div>
    `;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${isPractice ? 'Practice Plan' : 'Game Prep'} — ${entry.eventTitle}</title>
<style>
  body{font-family:Arial,sans-serif;color:#111;background:#fff;max-width:780px;margin:0 auto;padding:20px 24px;font-size:13px;}
  h1{font-size:20px;margin-bottom:2px;}
  .subtitle{color:#666;font-size:12px;margin-bottom:4px;}
  h2{font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-top:20px;margin-bottom:8px;}
  .row{display:flex;gap:32px;}
  .col{flex:1;}
  .col-label{font-weight:bold;font-size:11px;color:#555;margin-bottom:6px;}
  .player{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #f0f0f0;}
  .jersey{font-weight:bold;width:28px;text-align:right;color:#333;}
  .name{flex:1;}
  .pos{color:#888;font-size:11px;}
  .cap{background:#f59e0b;color:#000;font-size:9px;font-weight:bold;padding:1px 5px;border-radius:3px;}
  .focus-item{padding:4px 0;display:flex;gap:8px;}
  .note{color:#666;font-size:11px;margin-top:1px;}
  .drill-block{border:1px solid #ddd;border-radius:5px;padding:8px 10px;margin-bottom:6px;}
  .drill-title{font-weight:bold;}
  .drill-meta{color:#666;font-size:11px;margin-top:2px;}
  .equipment-grid{display:flex;flex-wrap:wrap;}
  .equipment-item{display:flex;align-items:center;gap:8px;width:48%;padding:3px 0;}
  .check{width:15px;height:15px;border:1.5px solid #999;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;}
  .absent{color:#dc2626;font-size:11px;margin-top:8px;}
  .notes-box{background:#f9f9f9;border:1px solid #e5e7eb;border-radius:5px;padding:8px 10px;margin-top:6px;min-height:36px;line-height:1.5;}
  .muted{color:#999;}
  .footer{margin-top:32px;padding-top:10px;border-top:1px solid #ddd;color:#aaa;font-size:10px;text-align:center;}
  @media print{body{padding:10px 16px;}}
</style></head><body>
<h1>${isPractice ? 'PRACTICE PLAN' : 'GAME PREP'}</h1>
<div class="subtitle">${entry.eventTitle} · ${completedDate} · ${present.length} PLAYERS READY</div>
${isPractice ? practiceHTML : gameHTML}
<div class="footer">LeagueMatrix · Printed ${new Date().toLocaleDateString()}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>PREP REVIEW</Text>
        {Platform.OS === 'web' ? (
          <TouchableOpacity onPress={printEntry} style={rvStyles.printBtn}>
            <Ionicons name="print-outline" size={16} color={accentColor} />
            <Text style={[rvStyles.printBtnTxt, { color: accentColor }]}>PRINT</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 48 }}>
        <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%' }}>

          {/* Hero */}
          <View style={[rvStyles.hero, { borderColor: accentColor }]}>
            <View style={[rvStyles.typeBadge, { backgroundColor: `${accentColor}22` }]}>
              <Text style={[rvStyles.typeTxt, { color: accentColor }]}>{entry.eventType?.toUpperCase()}</Text>
            </View>
            <Text style={rvStyles.eventTitle}>{entry.eventTitle}</Text>
            {completedDate ? <Text style={rvStyles.dateTxt}>{completedDate}</Text> : null}
            <View style={rvStyles.pctRow}>
              <View style={rvStyles.pctBarBg}>
                <View style={[rvStyles.pctBarFill, { width: `${pct}%` as any, backgroundColor: accentColor }]} />
              </View>
              <Text style={[rvStyles.pctTxt, { color: accentColor }]}>{pct}% COMPLETE</Text>
            </View>
          </View>

          {/* Attendance */}
          <Text style={rvStyles.sectionLabel}>ATTENDANCE</Text>
          <View style={rvStyles.card}>
            {/* Summary row */}
            <View style={rvStyles.attendSummary}>
              <View style={rvStyles.attendPill}>
                <Text style={[rvStyles.attendPillNum, { color: Colors.green }]}>{present.length}</Text>
                <Text style={rvStyles.attendPillLbl}>PRESENT</Text>
              </View>
              {absent.length > 0 && (
                <View style={rvStyles.attendPill}>
                  <Text style={[rvStyles.attendPillNum, { color: Colors.amber }]}>{absent.length}</Text>
                  <Text style={rvStyles.attendPillLbl}>ABSENT</Text>
                </View>
              )}
              {injured.length > 0 && (
                <View style={rvStyles.attendPill}>
                  <Text style={[rvStyles.attendPillNum, { color: Colors.red }]}>{injured.length}</Text>
                  <Text style={rvStyles.attendPillLbl}>INJURED</Text>
                </View>
              )}
            </View>

            {/* Present players grid */}
            {present.length > 0 && (
              <>
                <View style={rvStyles.rosterDivider} />
                <View style={rvStyles.rosterGrid}>
                  {present.map((p: any) => (
                    <View key={p.id} style={rvStyles.rosterCell}>
                      <Text style={rvStyles.rosterJersey}>#{p.jersey}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={rvStyles.rosterName}>{p.name}</Text>
                        <Text style={rvStyles.rosterPos}>{p.position}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Absent / Injured */}
            {(absent.length > 0 || injured.length > 0) && (
              <>
                <View style={rvStyles.rosterDivider} />
                {absent.map((p: any) => (
                  <View key={p.id} style={rvStyles.outRow}>
                    <View style={[rvStyles.outBadge, { backgroundColor: `${Colors.amber}20`, borderColor: `${Colors.amber}44` }]}>
                      <Text style={[rvStyles.outBadgeTxt, { color: Colors.amber }]}>ABSENT</Text>
                    </View>
                    <Text style={rvStyles.outName}>#{p.jersey}  {p.name}</Text>
                  </View>
                ))}
                {injured.map((p: any) => (
                  <View key={p.id} style={rvStyles.outRow}>
                    <View style={[rvStyles.outBadge, { backgroundColor: `${Colors.red}20`, borderColor: `${Colors.red}44` }]}>
                      <Text style={[rvStyles.outBadgeTxt, { color: Colors.red }]}>INJURED</Text>
                    </View>
                    <Text style={rvStyles.outName}>#{p.jersey}  {p.name}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Game-specific sections */}
          {!isPractice && starters.length > 0 && (
            <>
              <Text style={rvStyles.sectionLabel}>STARTING LINEUP</Text>
              <View style={rvStyles.card}>
                {starters.map((p: any) => (
                  <View key={p.id} style={rvStyles.playerRow}>
                    <Text style={rvStyles.jersey}>#{p.jersey}</Text>
                    <Text style={rvStyles.playerName}>
                      {p.name}{captain?.id === p.id ? '  C' : ''}
                    </Text>
                    <Text style={rvStyles.position}>{p.position}</Text>
                  </View>
                ))}
                {subs.length > 0 && (
                  <Text style={rvStyles.subsLine}>SUBS: {subs.map((p: any) => `#${p.jersey} ${p.name}`).join('  ·  ')}</Text>
                )}
              </View>
            </>
          )}

          {!isPractice && (entry.gameFocusItems ?? []).length > 0 && (
            <>
              <Text style={rvStyles.sectionLabel}>GAME FOCUS</Text>
              <View style={rvStyles.card}>
                {(entry.gameFocusItems as any[]).map((item: any) => (
                  <View key={item.id} style={rvStyles.focusRow}>
                    <Text style={[rvStyles.focusBullet, { color: accentColor }]}>▸</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={rvStyles.focusTitle}>{item.title}</Text>
                      {item.note ? <Text style={rvStyles.focusNote}>{item.note}</Text> : null}
                    </View>
                  </View>
                ))}
                {entry.gameNotes ? <Text style={rvStyles.notesBlock}>{entry.gameNotes}</Text> : null}
              </View>
            </>
          )}

          {!isPractice && (entry.scoutItems ?? []).some((s: any) => s.checked || s.note) && (
            <>
              <Text style={rvStyles.sectionLabel}>SCOUT NOTES</Text>
              <View style={rvStyles.card}>
                {(entry.scoutItems as any[]).filter((s: any) => s.checked || s.note).map((item: any) => (
                  <View key={item.id} style={rvStyles.focusRow}>
                    <Text style={[rvStyles.focusBullet, { color: item.checked ? Colors.green : Colors.muted }]}>
                      {item.checked ? '✓' : '○'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={rvStyles.focusTitle}>{item.title}</Text>
                      {item.note ? <Text style={rvStyles.focusNote}>{item.note}</Text> : null}
                    </View>
                  </View>
                ))}
                {entry.scoutNotes ? <Text style={rvStyles.notesBlock}>{entry.scoutNotes}</Text> : null}
              </View>
            </>
          )}

          {/* Practice-specific sections */}
          {isPractice && (entry.drills ?? []).length > 0 && (
            <>
              <Text style={rvStyles.sectionLabel}>DRILL PLAN</Text>
              <View style={rvStyles.card}>
                {(entry.drills as any[]).map((d: any, i: number) => (
                  <View key={d.id ?? i} style={[rvStyles.drillRow, i > 0 && { borderTopWidth: 1, borderTopColor: Colors.border }]}>
                    <View style={[rvStyles.drillNum, { backgroundColor: `${accentColor}22` }]}>
                      <Text style={[rvStyles.drillNumTxt, { color: accentColor }]}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={rvStyles.drillName}>{d.name}</Text>
                      <Text style={rvStyles.drillMeta}>{d.duration} min{d.notes ? `  ·  ${d.notes}` : ''}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {isPractice && (entry.trainingFocus ?? []).length > 0 && (
            <>
              <Text style={rvStyles.sectionLabel}>TRAINING FOCUS</Text>
              <View style={rvStyles.card}>
                {(entry.trainingFocus as any[]).map((item: any) => (
                  <View key={item.id} style={rvStyles.focusRow}>
                    <Text style={[rvStyles.focusBullet, { color: accentColor }]}>▸</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={rvStyles.focusTitle}>{item.text}</Text>
                      {item.detail ? <Text style={rvStyles.focusNote}>{item.detail}</Text> : null}
                    </View>
                  </View>
                ))}
                {entry.focusNotes ? <Text style={rvStyles.notesBlock}>{entry.focusNotes}</Text> : null}
              </View>
            </>
          )}

          {isPractice && (entry.equipment ?? []).some((e: any) => e.checked) && (
            <>
              <Text style={rvStyles.sectionLabel}>EQUIPMENT PACKED</Text>
              <View style={rvStyles.card}>
                {(entry.equipment as any[]).filter((e: any) => e.checked).map((item: any) => (
                  <View key={item.id} style={rvStyles.equipRow}>
                    <Text style={[rvStyles.equipCheck, { color: Colors.green }]}>✓</Text>
                    <Text style={rvStyles.equipLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const rvStyles = StyleSheet.create({
  hero:        { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.card },
  typeBadge:   { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.sm, marginBottom: Spacing.xs },
  typeTxt:     { fontFamily: Fonts.monoBold, fontSize: 10, letterSpacing: 1 },
  eventTitle:  { fontFamily: Fonts.monoBold, fontSize: 18, color: Colors.text, marginBottom: 2 },
  dateTxt:     { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, marginBottom: Spacing.sm },
  pctRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  pctBarBg:    { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  pctBarFill:  { height: 4, borderRadius: 2 },
  pctTxt:      { fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  sectionLabel:{ fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.dim, letterSpacing: 1, marginBottom: Spacing.xs, marginTop: Spacing.sm },
  card:        { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  statLine:    { fontFamily: Fonts.rajdhani, fontSize: 15 },
  statNum:     { fontFamily: Fonts.monoBold, fontSize: 20, color: Colors.text },
  statSub:     { fontFamily: Fonts.mono, fontSize: 12, color: Colors.dim },
  statAbsent:  { fontFamily: Fonts.mono, fontSize: 12, color: Colors.amber },
  statInjured: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.red },
  playerRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  jersey:      { fontFamily: Fonts.monoBold, fontSize: 12, color: Colors.cyan, width: 32 },
  playerName:  { flex: 1, fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text },
  position:    { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim },
  subsLine:    { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, marginTop: Spacing.xs, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border },
  focusRow:    { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 5 },
  focusBullet: { fontFamily: Fonts.mono, fontSize: 14, marginTop: 1 },
  focusTitle:  { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text },
  focusNote:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim, marginTop: 2 },
  notesBlock:  { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  drillRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  drillNum:    { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  drillNumTxt: { fontFamily: Fonts.monoBold, fontSize: 12 },
  drillName:   { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text },
  drillMeta:   { fontFamily: Fonts.mono, fontSize: 11, color: Colors.dim },
  equipRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  equipCheck:  { fontFamily: Fonts.monoBold, fontSize: 13, width: 20 },
  equipLabel:  { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text },
  printBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  printBtnTxt:   { fontFamily: Fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  attendSummary: { flexDirection: 'row', gap: Spacing.md, marginBottom: 2 },
  attendPill:    { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  attendPillNum: { fontFamily: Fonts.monoBold, fontSize: 22 },
  attendPillLbl: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 0.5 },
  rosterDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  rosterGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rosterCell:    { flexDirection: 'row', alignItems: 'center', gap: 6, width: '48%', paddingVertical: 5, paddingHorizontal: 6, backgroundColor: Colors.bg, borderRadius: Radius.sm },
  rosterJersey:  { fontFamily: Fonts.monoBold, fontSize: 11, color: Colors.cyan, width: 26, textAlign: 'right' },
  rosterName:    { fontFamily: Fonts.rajdhaniBold, fontSize: 13, color: Colors.text },
  rosterPos:     { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted },
  outRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  outBadge:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
  outBadgeTxt:   { fontFamily: Fonts.monoBold, fontSize: 9, letterSpacing: 0.5 },
  outName:       { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim },
});

// ─── Practice Step: Drill Plan ───────────────────────────────────────────────

const DRILL_DURATIONS = [5, 10, 15, 20, 30];
const suggestDrillFn = httpsCallable(functions, 'suggestDrill');

const CAT_COLORS: Record<string, string> = {
  offense: Colors.green,
  defense: Colors.red,
  'set-piece': Colors.amber,
  special: Colors.purple,
};

function DrillPlanStep({
  drills, setDrills,
}: {
  drills: DrillItem[];
  setDrills: React.Dispatch<React.SetStateAction<DrillItem[]>>;
}) {
  const { coachSport } = useCoach();
  const { teamCode } = useAuth();
  const [addingDrill, setAddingDrill] = useState(false);
  const [newDrillName, setNewDrillName] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showPlayPicker, setShowPlayPicker] = useState(false);
  const [savedDrills, setSavedDrills] = useState<SavedDrill[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!teamCode) return;
    getDocs(collection(db, 'teams', teamCode, 'savedDrills'))
      .then(snap => setSavedDrills(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SavedDrill, 'id'>) }))))
      .catch(() => {});
  }, [teamCode]);

  const totalMinutes = drills.reduce((sum, d) => sum + d.duration, 0);
  const sportPlays = globalPlays.filter((p: Play) => p.sport === coachSport);

  const handleSaveDrill = async (drill: DrillItem) => {
    if (!teamCode || savedIds.has(drill.id)) return;
    try {
      const ref = await addDoc(collection(db, 'teams', teamCode, 'savedDrills'), {
        name: drill.name, duration: drill.duration, notes: drill.notes, createdAt: serverTimestamp(),
      });
      setSavedDrills(prev => [...prev, { id: ref.id, name: drill.name, duration: drill.duration, notes: drill.notes }]);
      setSavedIds(prev => new Set([...prev, drill.id]));
    } catch { /* silently fail */ }
  };

  const addDrill = () => {
    const name = newDrillName.trim();
    if (name) {
      setDrills(prev => [...prev, { id: `d${Date.now()}`, name, duration: 10, notes: '' }]);
    }
    setNewDrillName('');
    setAddingDrill(false);
  };

  const removeDrill = (id: string) =>
    setDrills(prev => prev.filter(d => d.id !== id));

  const setDuration = (id: string, duration: number) =>
    setDrills(prev => prev.map(d => d.id === id ? { ...d, duration } : d));

  const setNotes = (id: string, notes: string) =>
    setDrills(prev => prev.map(d => d.id === id ? { ...d, notes } : d));

  const handleAiSuggest = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const result = await suggestDrillFn({
        sport: coachSport,
        description: aiInput.trim(),
        existingDrills: drills.map(d => d.name),
      });
      const { name, duration, notes } = result.data as { name: string; duration: number; notes: string };
      setDrills(prev => [...prev, { id: `d${Date.now()}`, name, duration, notes }]);
      setAiInput('');
    } catch (err: any) {
      const msg = err?.message || err?.details || JSON.stringify(err);
      setAiError(msg || 'Could not reach AI — check connection.');
    } finally {
      setAiLoading(false);
    }
  };

  const addPlayAsDrill = (play: Play) => {
    setDrills(prev => [...prev, { id: `d${Date.now()}`, name: play.name, duration: 10, notes: '' }]);
    setShowPlayPicker(false);
  };

  return (
    <View style={styles.stepContent}>
      <View style={styles.drillHeader}>
        <Text style={styles.drillHeaderLabel}>SESSION TOTAL</Text>
        <View style={styles.drillTimePill}>
          <Text style={styles.drillTimeText}>{totalMinutes} MIN</Text>
        </View>
      </View>

      {drills.map((drill, idx) => (
        <View key={drill.id} style={styles.drillBlock}>
          <View style={styles.drillBlockHeader}>
            <Text style={styles.drillIndex}>{idx + 1}</Text>
            <Text style={styles.drillName}>{drill.name}</Text>
            <TouchableOpacity onPress={() => handleSaveDrill(drill)} style={styles.drillSaveBtn}>
              <MaterialCommunityIcons
                name={savedIds.has(drill.id) ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={savedIds.has(drill.id) ? Colors.cyan : Colors.dim}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeDrill(drill.id)} style={styles.drillRemoveBtn}>
              <Text style={styles.drillRemoveText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.drillDurations}>
            {DRILL_DURATIONS.map(min => (
              <TouchableOpacity
                key={min}
                style={[styles.drillDurPill, drill.duration === min && styles.drillDurPillActive]}
                onPress={() => setDuration(drill.id, min)}
              >
                <Text style={[styles.drillDurText, drill.duration === min && styles.drillDurTextActive]}>
                  {min}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.drillNotes}
            value={drill.notes}
            onChangeText={t => setNotes(drill.id, t)}
            placeholder="Notes (optional)..."
            placeholderTextColor={Colors.muted}
            multiline
          />
        </View>
      ))}

      {/* AI Suggest row */}
      <View style={styles.drillAiRow}>
        <TextInput
          style={styles.drillAiInput}
          value={aiInput}
          onChangeText={t => { setAiInput(t); setAiError(''); }}
          placeholder="Describe a drill..."
          placeholderTextColor={Colors.muted}
          returnKeyType="done"
          onSubmitEditing={handleAiSuggest}
          editable={!aiLoading}
        />
        <TouchableOpacity
          style={[styles.drillAiBtn, aiLoading && styles.drillAiBtnDisabled]}
          onPress={handleAiSuggest}
          disabled={aiLoading}
        >
          {aiLoading
            ? <ActivityIndicator size="small" color={Colors.cyan} />
            : <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.cyan} />
          }
        </TouchableOpacity>
      </View>
      {!!aiError && <Text style={styles.drillAiError}>{aiError}</Text>}

      {/* From Playbook button */}
      <TouchableOpacity style={styles.drillPlaybookBtn} onPress={() => setShowPlayPicker(true)}>
        <MaterialCommunityIcons name="book-open-outline" size={14} color={Colors.cyan} />
        <Text style={styles.drillPlaybookBtnText}>FROM PLAYBOOK</Text>
      </TouchableOpacity>

      {addingDrill ? (
        <View style={styles.drillAddInputRow}>
          <TextInput
            style={styles.drillAddInput}
            value={newDrillName}
            onChangeText={setNewDrillName}
            placeholder="Drill name..."
            placeholderTextColor={Colors.muted}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={addDrill}
            onBlur={addDrill}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.drillAddBtn} onPress={() => setAddingDrill(true)}>
          <Text style={styles.drillAddBtnText}>+ ADD DRILL</Text>
        </TouchableOpacity>
      )}

      {/* Play Picker Modal */}
      <Modal visible={showPlayPicker} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowPlayPicker(false)}>
          <View style={styles.drillPickerOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.drillPickerSheet}>
          <View style={styles.drillPickerHandle} />
          <Text style={styles.drillPickerTitle}>DRILL LIBRARY</Text>
          <ScrollView>
            {/* ── Saved Drills ── */}
            <Text style={styles.drillPickerSection}>SAVED DRILLS</Text>
            {savedDrills.length === 0 ? (
              <Text style={styles.drillPickerEmpty}>No saved drills yet. Tap 🔖 on any drill to save it.</Text>
            ) : (
              savedDrills.map(sd => (
                <TouchableOpacity
                  key={sd.id}
                  style={styles.drillPickerRow}
                  onPress={() => {
                    setDrills(prev => [...prev, { id: `d${Date.now()}`, name: sd.name, duration: sd.duration, notes: sd.notes }]);
                    setShowPlayPicker(false);
                  }}
                >
                  <Text style={styles.drillPickerPlayName}>{sd.name}</Text>
                  <View style={styles.drillPickerDurBadge}>
                    <Text style={styles.drillPickerDurText}>{sd.duration}m</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* ── Plays ── */}
            <Text style={[styles.drillPickerSection, { marginTop: 20 }]}>PLAYS</Text>
            {sportPlays.length === 0 ? (
              <Text style={styles.drillPickerEmpty}>No plays in your playbook for {coachSport} yet.</Text>
            ) : (
              sportPlays.map((play: Play) => (
                <TouchableOpacity
                  key={play.id}
                  style={styles.drillPickerRow}
                  onPress={() => addPlayAsDrill(play)}
                >
                  <Text style={styles.drillPickerPlayName}>{play.name}</Text>
                  <View style={[styles.drillPickerCatBadge, { borderColor: CAT_COLORS[play.category] ?? Colors.dim }]}>
                    <Text style={[styles.drillPickerCatText, { color: CAT_COLORS[play.category] ?? Colors.dim }]}>
                      {play.category.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Practice Step: Training Focus ───────────────────────────────────────────

function TrainingFocusStep({
  items, setItems, notes, setNotes, confirmed, setConfirmed,
}: {
  items: FocusItem[];
  setItems: React.Dispatch<React.SetStateAction<FocusItem[]>>;
  notes: string;
  setNotes: React.Dispatch<React.SetStateAction<string>>;
  confirmed: boolean;
  setConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    const text = newItemText.trim();
    if (text) {
      setItems(prev => [...prev, { id: `tf${Date.now()}`, text, detail: '' }]);
    }
    setNewItemText('');
    setAddingItem(false);
  };

  const updateDetail = (id: string, detail: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, detail } : i));

  return (
    <View style={styles.stepContent}>
      <View style={styles.scoutCard}>
        {items.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={styles.scoutDivider} />}
            <View style={styles.scoutRow}>
              <View style={styles.focusNumBadge}>
                <Text style={styles.focusNumText}>{idx + 1}</Text>
              </View>
              <View style={styles.scoutItemContent}>
                <Text style={styles.scoutItemTitle}>{item.text}</Text>
                {editingId === item.id ? (
                  <TextInput
                    style={styles.scoutNoteInput}
                    value={item.detail}
                    onChangeText={t => updateDetail(item.id, t)}
                    onBlur={() => setEditingId(null)}
                    onSubmitEditing={() => setEditingId(null)}
                    autoFocus
                    placeholder="Add detail..."
                    placeholderTextColor={Colors.muted}
                    returnKeyType="done"
                  />
                ) : item.detail ? (
                  <Text style={styles.scoutItemNote}>{item.detail}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[
                  styles.scoutActionBtn,
                  editingId === item.id && { borderColor: `${Colors.cyan}88`, backgroundColor: 'rgba(0,212,255,0.08)' },
                ]}
                onPress={() => setEditingId(prev => prev === item.id ? null : item.id)}
              >
                <Text style={styles.scoutActionIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={styles.scoutDivider} />
        {addingItem ? (
          <View style={styles.addItemInputRow}>
            <TextInput
              style={styles.addItemInput}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="New focus area..."
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
              onBlur={addItem}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.addItemBtn} onPress={() => setAddingItem(true)}>
            <Text style={styles.addItemText}>+ Add focus area</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.coachNotesLabel}>SESSION NOTES</Text>
      <View style={styles.coachNotesCard}>
        <TextInput
          style={styles.coachNotesInput}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Any additional tactical notes or session goals..."
          placeholderTextColor={Colors.muted}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.focusConfirmCard, confirmed && styles.focusConfirmCardDone]}
        onPress={() => setConfirmed(v => !v)}
        activeOpacity={0.8}
      >
        <View style={[styles.focusConfirmCheck, confirmed && styles.focusConfirmCheckDone]}>
          {confirmed && <Text style={styles.focusConfirmMark}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.focusConfirmTitle, confirmed && { color: Colors.green }]}>
            Focus areas confirmed
          </Text>
          <Text style={styles.focusConfirmSub}>
            {confirmed ? '✓ Marked complete – tap to undo' : 'Tap to confirm training focus'}
          </Text>
        </View>
        {confirmed && (
          <View style={styles.focusDoneBtn}>
            <Text style={styles.focusDoneBtnText}>DONE</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Practice Step: Equipment Check ──────────────────────────────────────────

function EquipmentStep({
  equipment, setEquipment,
}: {
  equipment: EquipmentItem[];
  setEquipment: React.Dispatch<React.SetStateAction<EquipmentItem[]>>;
}) {
  const [addingItem, setAddingItem] = useState(false);
  const [newLabel, setNewLabel]     = useState('');
  const checkedCount = equipment.filter(e => e.checked).length;

  const toggle = (id: string) =>
    setEquipment(prev => prev.map(e => e.id === id ? { ...e, checked: !e.checked } : e));

  const remove = (id: string) =>
    setEquipment(prev => prev.filter(e => e.id !== id));

  const addItem = () => {
    const label = newLabel.trim();
    if (label) {
      setEquipment(prev => [...prev, { id: `eq${Date.now()}`, label, checked: false }]);
    }
    setNewLabel('');
    setAddingItem(false);
  };

  return (
    <View style={styles.stepContent}>
      <View style={styles.equipHeader}>
        <Text style={styles.equipHeaderLabel}>GEAR CHECKLIST</Text>
        <View style={[
          styles.equipCountPill,
          checkedCount === equipment.length && { borderColor: `${Colors.green}55`, backgroundColor: 'rgba(46,204,113,0.08)' },
        ]}>
          <Text style={[styles.equipCountText, checkedCount === equipment.length && { color: Colors.green }]}>
            {checkedCount}/{equipment.length} PACKED
          </Text>
        </View>
      </View>

      <View style={styles.scoutCard}>
        {equipment.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={styles.scoutDivider} />}
            <View style={styles.equipRow}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPress={() => toggle(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.scoutCheck, item.checked && styles.scoutCheckDone]}>
                  {item.checked && <Text style={styles.scoutCheckMark}>✓</Text>}
                </View>
                <Text style={[styles.equipLabel, item.checked && { textDecorationLine: 'line-through', opacity: 0.45 }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={Colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={styles.scoutDivider} />
        {addingItem ? (
          <View style={styles.addItemInputRow}>
            <TextInput
              style={styles.addItemInput}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="New item..."
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addItem}
              onBlur={addItem}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.addItemBtn} onPress={() => setAddingItem(true)}>
            <Text style={styles.addItemText}>+ Add item</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border2,
    backgroundColor: 'rgba(5,10,22,0.98)',
  },
  backBtn: { padding: 4 },
  backText:    { fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 1 },
  headerTitle: { fontFamily: Fonts.orbitron, fontSize: 13, color: Colors.text, letterSpacing: 1 },
  skipText:    { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted },

  // Progress
  progressWrap: {
    paddingHorizontal: Spacing.lg, paddingTop: 14, paddingBottom: 8,
    backgroundColor: `${Colors.bg}ee`,
  },
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepItem: { alignItems: 'center', width: 44 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  stepDotText: { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.muted },
  stepLabel: {
    fontFamily: Fonts.mono, fontSize: 6, color: Colors.muted,
    marginTop: 3, letterSpacing: 0.3, textAlign: 'center', textTransform: 'uppercase',
  },
  stepLine: {
    flex: 1, height: 2, backgroundColor: Colors.border,
    marginTop: 13, marginHorizontal: 2,
  },
  progressBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },

  // Step card
  stepCard: {
    marginHorizontal: Spacing.lg, marginTop: 14, padding: Spacing.lg,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  stepCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  stepCardTag:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2, marginBottom: 6 },
  stepCardTitle: { fontFamily: Fonts.orbitron, fontSize: 18, color: Colors.text, marginBottom: 4 },
  stepCardDesc:  { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, lineHeight: 18 },

  // Shared
  stepContent: { paddingHorizontal: Spacing.lg, paddingTop: 14 },
  manageRosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: 'rgba(61,143,255,0.06)',
  },
  manageRosterText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 1 },
  manageRosterArrow: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.cyan },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryPill: {
    flex: 1, backgroundColor: Colors.card, borderWidth: 1,
    borderRadius: Radius.md, padding: 10, alignItems: 'center',
  },
  summaryVal:   { fontFamily: Fonts.orbitron, fontSize: 20 },
  summaryLabel: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, letterSpacing: 1, marginTop: 2 },
  rosterHint:   { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },

  // Attendance player row
  playerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 6, gap: 12,
  },
  playerRowAbsent:  { borderColor: `${Colors.red}44`, opacity: 0.7 },
  playerRowInjured: { borderColor: `${Colors.amber}33` },

  // Lineup row
  lineupRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: Spacing.md, marginBottom: 6, gap: 10,
  },

  // Shared jersey
  jersey: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  jerseyNum: { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.text },

  playerInfo: { flex: 1 },
  playerName: { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text, fontWeight: '700' },
  playerPos:  { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },

  injuredBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(212,168,83,0.12)', borderWidth: 1, borderColor: `${Colors.amber}44`,
  },
  injuredBadgeText: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.amber, letterSpacing: 1 },
  absentBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(231,76,60,0.12)', borderWidth: 1, borderColor: `${Colors.red}44`,
  },
  absentBadgeText: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.red, letterSpacing: 1 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(46,204,113,0.12)', borderWidth: 1, borderColor: `${Colors.green}44`,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.green },

  // Lineup pills
  rolePills: { flexDirection: 'row', gap: 4 },
  rolePill: {
    width: 34, height: 26, borderRadius: 6, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent',
  },
  rolePillText: { fontFamily: Fonts.monoBold, fontSize: 7, letterSpacing: 0.5 },
  captainBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1.5,
    borderColor: `${Colors.amber}55`, alignItems: 'center', justifyContent: 'center',
  },
  captainBtnText: { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.amber },

  // ── Scouting ──────────────────────────────────────────────────────────────

  scoutCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, overflow: 'hidden', marginBottom: 16,
  },
  scoutDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 0 },
  scoutRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  scoutCheck: {
    width: 24, height: 24, borderRadius: 6, borderWidth: 1.5,
    borderColor: Colors.border2, backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  scoutCheckDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  scoutCheckMark: { fontFamily: Fonts.mono, fontSize: 12, color: '#000' },
  scoutItemContent: { flex: 1 },
  scoutItemTitle: { fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text, fontWeight: '700' },
  scoutItemDone:  { textDecorationLine: 'line-through', opacity: 0.45 },
  scoutItemNote:  { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.dim, marginTop: 2 },
  scoutNoteInput: {
    fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.text,
    borderBottomWidth: 1, borderBottomColor: Colors.cyan, paddingVertical: 2, marginTop: 2,
  },
  scoutActions: { flexDirection: 'row', gap: 6, marginTop: 2 },
  scoutActionBtn: {
    width: 34, height: 34, borderRadius: 8, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  scoutActionIcon: { fontSize: 14 },

  addItemInputRow: { paddingHorizontal: 14, paddingVertical: 10 },
  addItemInput: {
    fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text,
    borderBottomWidth: 1, borderBottomColor: Colors.cyan, paddingVertical: 4,
  },
  addItemBtn: { paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addItemText: { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted },

  // Coach notes
  coachNotesLabel: {
    fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted,
    letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase',
  },
  coachNotesCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: 14, marginBottom: 14,
  },
  coachNotesInput: {
    fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.text,
    minHeight: 90, lineHeight: 20,
  },

  // Opposition reviewed
  reviewedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: 16, marginBottom: 14,
  },
  reviewedCheck: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 2,
    borderColor: Colors.border2, backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewedCheckDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  reviewedCheckMark: { fontFamily: Fonts.orbitron, fontSize: 16, color: '#000' },
  reviewedTitle: { fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text, fontWeight: '700' },
  reviewedSub:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, marginTop: 2 },

  // ── Reminder Modal ────────────────────────────────────────────────────────

  reminderOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end',
  },
  reminderSheet: {
    backgroundColor: '#0c1628',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  reminderHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 20,
  },
  reminderTitle:    { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.text, letterSpacing: 1, marginBottom: 10 },
  reminderItemName: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 1.5, marginBottom: 14 },
  reminderMeta:     { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 1.5 },
  reminderSub:      { fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.muted, marginBottom: 14 },

  reminderGridRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  reminderOption: {
    flex: 1, backgroundColor: Colors.card2, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  reminderOptionActive: { borderColor: Colors.cyan, backgroundColor: 'rgba(0,212,255,0.08)' },
  reminderOptVal: { fontFamily: Fonts.orbitron, fontSize: 16, color: Colors.text, marginBottom: 4 },
  reminderOptSub: { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, letterSpacing: 0.5 },

  reminderBtns: { flexDirection: 'row', gap: 12, marginTop: 6 },
  reminderCancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  reminderCancelText: { fontFamily: Fonts.orbitron, fontSize: 11, color: Colors.dim, letterSpacing: 1 },
  reminderConfirmBtn: {
    flex: 2, paddingVertical: 16, borderRadius: Radius.md,
    backgroundColor: Colors.amber, alignItems: 'center',
  },
  reminderConfirmText: { fontFamily: Fonts.orbitron, fontSize: 11, color: '#000', letterSpacing: 1 },

  // Game Focus confirmed card
  focusConfirmCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: 16, marginBottom: 14,
  },
  focusConfirmCardDone: {
    borderColor: `${Colors.green}55`,
    backgroundColor: 'rgba(46,204,113,0.06)',
  },
  focusConfirmCheck: {
    width: 48, height: 48, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.border2, backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  focusConfirmCheckDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  focusConfirmMark:  { fontFamily: Fonts.orbitron, fontSize: 22, color: '#000' },
  focusConfirmTitle: { fontFamily: Fonts.rajdhani, fontSize: 16, color: Colors.text, fontWeight: '700' },
  focusConfirmSub:   { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, marginTop: 3, letterSpacing: 0.5 },
  focusDoneBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.green,
  },
  focusDoneBtnText: { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.green, letterSpacing: 1 },

  // Stub
  stubCard: {
    borderWidth: 1, borderRadius: Radius.lg, padding: 32,
    alignItems: 'center', backgroundColor: Colors.card, marginTop: 8,
  },
  stubEmoji:  { fontSize: 40, marginBottom: 12 },
  stubTitle:  { fontFamily: Fonts.orbitron, fontSize: 16, marginBottom: 8 },
  stubDesc:   { fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, textAlign: 'center' },
  stubDesc2:  { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, marginTop: 8, letterSpacing: 1 },

  // Final
  finalCard: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: 20, alignItems: 'center', marginBottom: 16,
  },
  finalPct:   { fontFamily: Fonts.orbitron, fontSize: 48, lineHeight: 56 },
  finalLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2, marginTop: 4 },
  finalBar: {
    width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2, marginTop: 12, overflow: 'hidden',
  },
  finalBarFill: { height: '100%', borderRadius: 2 },
  finalCheckRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  finalDot:      { width: 8, height: 8, borderRadius: 4 },
  finalStepName: { flex: 1, fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim },
  readyBanner: {
    marginTop: 16, padding: 14, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border2,
    backgroundColor: 'rgba(61,143,255,0.05)', alignItems: 'center',
  },
  readyText: { fontFamily: Fonts.orbitron, fontSize: 11, letterSpacing: 1 },

  printBtn: {
    marginTop: 12, padding: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border2,
    alignItems: 'center',
  },
  printBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 1 },

  // ── Drill Plan ────────────────────────────────────────────────────────────
  drillHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  drillHeaderLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2 },
  drillTimePill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full,
    borderWidth: 1, borderColor: `${Colors.green}55`, backgroundColor: 'rgba(46,204,113,0.08)',
  },
  drillTimeText: { fontFamily: Fonts.orbitron, fontSize: 10, color: Colors.green, letterSpacing: 1 },
  drillBlock: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 10,
  },
  drillBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  drillIndex: { fontFamily: Fonts.orbitron, fontSize: 12, color: Colors.dim, width: 18 },
  drillName: { flex: 1, fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text, fontWeight: '700' },
  drillRemoveBtn: { padding: 4 },
  drillRemoveText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.muted },
  drillDurations: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  drillDurPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  drillDurPillActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  drillDurText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 0.5 },
  drillDurTextActive: { color: '#000' },
  drillNotes: {
    fontFamily: Fonts.rajdhani, fontSize: 12, color: Colors.text,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, minHeight: 32,
  },
  drillAddInputRow: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  drillAddInput: { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text },
  drillAddBtn: {
    paddingVertical: 16, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: `${Colors.green}44`, backgroundColor: 'rgba(46,204,113,0.04)',
    alignItems: 'center', marginBottom: 14,
  },
  drillAddBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.green, letterSpacing: 2 },

  // ── AI Suggest ─────────────────────────────────────────────────────────────
  drillAiRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: `${Colors.cyan}44`,
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 8,
  },
  drillAiInput: { flex: 1, fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.text },
  drillAiBtn: {
    width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    backgroundColor: `${Colors.cyan}22`,
  },
  drillAiBtnDisabled: { opacity: 0.5 },
  drillAiError: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.red, letterSpacing: 1, marginBottom: 8 },

  // ── From Playbook ──────────────────────────────────────────────────────────
  drillPlaybookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: `${Colors.cyan}33`,
    backgroundColor: `${Colors.cyan}08`, justifyContent: 'center', marginBottom: 10,
  },
  drillPlaybookBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.cyan, letterSpacing: 2 },

  // ── Play Picker Modal ──────────────────────────────────────────────────────
  drillPickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drillPickerSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg, paddingBottom: 32, maxHeight: '60%',
  },
  drillPickerHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border2,
    alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },
  drillPickerTitle: {
    fontFamily: Fonts.orbitron, fontSize: 11, color: Colors.dim, letterSpacing: 2, marginBottom: 12,
  },
  drillPickerEmpty: { fontFamily: Fonts.rajdhani, fontSize: 14, color: Colors.muted, textAlign: 'center', paddingVertical: 20 },
  drillPickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  drillPickerPlayName: { flex: 1, fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text, fontWeight: '700' },
  drillPickerCatBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1,
  },
  drillPickerCatText: { fontFamily: Fonts.mono, fontSize: 8, letterSpacing: 1 },
  drillSaveBtn: { padding: 4 },
  drillPickerSection: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2, marginBottom: 6 },
  drillPickerDurBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.sm, backgroundColor: Colors.border },
  drillPickerDurText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim },

  // ── Training Focus ─────────────────────────────────────────────────────────
  focusNumBadge: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1,
    borderColor: `${Colors.cyan}55`, backgroundColor: 'rgba(0,212,255,0.08)',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  focusNumText: { fontFamily: Fonts.orbitron, fontSize: 9, color: Colors.cyan },

  // ── Equipment ──────────────────────────────────────────────────────────────
  equipHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  equipHeaderLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.dim, letterSpacing: 2 },
  equipCountPill: {
    paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  equipCountText: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },
  equipRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14, gap: 12,
  },
  equipLabel: { fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.text, fontWeight: '700', marginLeft: 10 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: 'rgba(4,8,18,0.98)',
  },
  stepCounter:     {},
  stepCounterText: { fontFamily: Fonts.orbitron, fontSize: 11, color: Colors.text, letterSpacing: 1 },
  stepCounterSub:  { fontFamily: Fonts.mono, fontSize: 8, color: Colors.muted, marginTop: 2 },
  nextBtn:         { paddingHorizontal: 20, paddingVertical: 13, borderRadius: Radius.md },
  nextBtnText:     { fontFamily: Fonts.orbitron, fontSize: 11, color: '#000', letterSpacing: 1 },

  // Completion modal
  completeOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  completeCard:        { width: '100%', maxWidth: 380, backgroundColor: Colors.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  completeIconWrap:    { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  completeEmoji:       { fontSize: 36 },
  completeTitle:       { fontFamily: Fonts.orbitron, fontSize: 16, letterSpacing: 1, textAlign: 'center' },
  completeMsg:         { fontFamily: Fonts.rajdhani, fontSize: 15, color: Colors.dim, textAlign: 'center', lineHeight: 22 },
  completeHint:        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.xs, backgroundColor: `${Colors.cyan}12`, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor: `${Colors.cyan}25`, width: '100%' },
  completeHintTxt:     { flex: 1, fontFamily: Fonts.rajdhani, fontSize: 13, color: Colors.dim, lineHeight: 18 },
  completeReviewBtn:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: 11, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, width: '100%', justifyContent: 'center', marginTop: Spacing.xs },
  completeReviewBtnTxt:{ fontFamily: Fonts.monoBold, fontSize: 12, letterSpacing: 0.5 },
  completeGotItBtn:    { paddingVertical: 13, paddingHorizontal: Spacing.xl, borderRadius: Radius.md, width: '100%', alignItems: 'center' },
  completeGotItTxt:    { fontFamily: Fonts.orbitron, fontSize: 12, color: '#000', letterSpacing: 1 },
});
