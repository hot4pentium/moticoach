import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Spacing } from '../theme';

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

const STEPS = [
  { id: 1, label: 'Attend.',  title: 'Attendance & Roster',    icon: '👥', desc: 'Mark anyone missing – everyone else is confirmed' },
  { id: 2, label: 'Lineup',   title: 'Starting Lineup',        icon: '📋', desc: 'Set your starting 11, subs, and captain' },
  { id: 3, label: 'Scout',    title: 'Scouting & Opposition',  icon: '🔍', desc: 'Know your opponent before they know you' },
  { id: 4, label: 'Game',     title: 'Game Focus',             icon: '🎯', desc: '3 things your team will execute today' },
  { id: 5, label: 'Pre-Game', title: 'Pre-Game Prep',          icon: '🔥', desc: 'Warm-up schedule and team talk points' },
  { id: 6, label: 'Final',    title: 'Final Check',            icon: '✅', desc: 'Confirm everything is ready to go' },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PrepBookScreen({ navigation, route }: any) {
  const eventTitle = route?.params?.eventTitle ?? 'Event';
  const eventType  = route?.params?.eventType  ?? 'game';

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

  const step        = STEPS[currentStep];
  const accentColor = eventType === 'game'     ? Colors.amber
                    : eventType === 'practice' ? Colors.green
                    :                            Colors.purple;

  const goNext = () => {
    setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1);
    else navigation?.goBack();
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
    else navigation?.goBack();
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

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

        {/* Step Card */}
        <View style={styles.stepCard}>
          <View style={[styles.stepCardAccent, { backgroundColor: accentColor }]} />
          <Text style={styles.stepCardTag}>STEP {step.id} OF {STEPS.length}  ·  {step.icon}</Text>
          <Text style={styles.stepCardTitle}>{step.title}</Text>
          <Text style={styles.stepCardDesc}>{step.desc}</Text>
        </View>

        {/* Step 1 — Attendance */}
        {currentStep === 0 && (
          <AttendanceStep
            roster={roster}
            onToggle={toggleAbsent}
            availableCount={availableCount}
            absentCount={absentCount}
            injuredCount={injuredCount}
          />
        )}

        {/* Step 2 — Lineup */}
        {currentStep === 1 && (
          <LineupStep
            roster={roster}
            lineupRoles={lineupRoles}
            setLineupRoles={setLineupRoles}
            captainId={captainId}
            setCaptainId={setCaptainId}
          />
        )}

        {/* Step 3 — Scouting */}
        {currentStep === 2 && (
          <ScoutingStep
            scoutItems={scoutItems}
            setScoutItems={setScoutItems}
            scoutNotes={scoutNotes}
            setScoutNotes={setScoutNotes}
            oppositionReviewed={oppositionReviewed}
            setOppositionReviewed={setOppositionReviewed}
          />
        )}

        {/* Step 4 — Game Focus */}
        {currentStep === 3 && (
          <GameFocusStep
            items={gameFocusItems}
            setItems={setGameFocusItems}
            notes={gameNotes}
            setNotes={setGameNotes}
            confirmed={focusConfirmed}
            setConfirmed={setFocusConfirmed}
          />
        )}

        {/* Step 5 — Stub */}
        {currentStep === 4 && (
          <StepStub step={STEPS[currentStep]} color={accentColor} />
        )}

        {/* Step 6 — Final */}
        {currentStep === 5 && (
          <FinalStep
            roster={roster}
            completedSteps={completedSteps}
            totalSteps={STEPS.length}
            accentColor={accentColor}
          />
        )}

        <View style={{ height: 120 }} />
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
    </SafeAreaView>
  );
}

// ─── Step 1: Attendance ───────────────────────────────────────────────────────

function AttendanceStep({
  roster, onToggle, availableCount, absentCount, injuredCount,
}: {
  roster: Player[];
  onToggle: (id: string) => void;
  availableCount: number;
  absentCount: number;
  injuredCount: number;
}) {
  return (
    <View style={styles.stepContent}>
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

function StepStub({ step, color }: { step: typeof STEPS[0]; color: string }) {
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
  roster, completedSteps, totalSteps, accentColor,
}: {
  roster: Player[];
  completedSteps: number[];
  totalSteps: number;
  accentColor: string;
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
      {STEPS.map((s, i) => (
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
});
