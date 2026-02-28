// Shared mock data for the admin demo walkthrough

export const DEMO_ORG = {
  name: 'Fredericksburg Parks & Recreation',
  season: 'Fall 2025',
  code: 'FPR-2025',
};

export const DEMO_PENDING_REG = 18; // pending registrations for Soccer Rec U8

// ─── Sports ───────────────────────────────────────────────────────────────────

export type DemoSport = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  available: boolean; // false = greyed-out "coming soon"
};

export const DEMO_SPORTS: DemoSport[] = [
  { id: 'soccer',     name: 'Soccer',     emoji: '⚽', color: '#16a34a', available: true  },
  { id: 'baseball',   name: 'Baseball',   emoji: '⚾', color: '#d97706', available: false },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', color: '#ea580c', available: false },
];

// ─── Leagues ──────────────────────────────────────────────────────────────────

export type DemoLeague = {
  id: string;
  sportId: string;
  name: string;
  ageGroup: string;
  teamCount: number;
  athleteCount: number;
  registrationOpen: boolean;
  leagueName?: string;
};

export const DEMO_LEAGUES: DemoLeague[] = [
  // ── Soccer — 7 leagues ────────────────────────────────────────────────────
  { id: 'sl1', sportId: 'soccer', name: 'Recreational', ageGroup: 'U6',  teamCount: 4, athleteCount:  32, registrationOpen: false },
  { id: 'sl2', sportId: 'soccer', name: 'Recreational', ageGroup: 'U8',  teamCount: 5, athleteCount:  55, registrationOpen: true  },
  { id: 'sl3', sportId: 'soccer', name: 'Recreational', ageGroup: 'U10', teamCount: 6, athleteCount:  72, registrationOpen: true  },
  { id: 'sl4', sportId: 'soccer', name: 'Recreational', ageGroup: 'U12', teamCount: 4, athleteCount:  52, registrationOpen: false },
  { id: 'sl5', sportId: 'soccer', name: 'Recreational', ageGroup: 'U14', teamCount: 3, athleteCount:  39, registrationOpen: false },
  { id: 'sl6', sportId: 'soccer', name: 'Travel',       ageGroup: 'U10', teamCount: 3, athleteCount:  42, registrationOpen: false },
  { id: 'sl7', sportId: 'soccer', name: 'Travel',       ageGroup: 'U12', teamCount: 2, athleteCount:  30, registrationOpen: false },
  // ── Baseball — stub (coming soon) ─────────────────────────────────────────
  { id: 'bl1', sportId: 'baseball',   name: 'Recreational', ageGroup: 'U10', teamCount: 0, athleteCount: 0, registrationOpen: false },
  // ── Basketball — stub (coming soon) ───────────────────────────────────────
  { id: 'bk1', sportId: 'basketball', name: 'Recreational', ageGroup: 'U8',  teamCount: 0, athleteCount: 0, registrationOpen: false },
];

// ─── Teams ────────────────────────────────────────────────────────────────────

export type DemoTeam = {
  id: string;
  leagueId: string;
  sportId: string;
  name: string;
  coach: string;
  athletes: number;
  status: 'active' | 'setup';
  code: string;
};

export const DEMO_TEAMS: DemoTeam[] = [
  // ── Soccer Rec U6 (sl1) ──────────────────────────────────────────────────
  { id: 'su6_1', leagueId: 'sl1', sportId: 'soccer', name: 'Blue Dolphins', coach: 'Maria Santos', athletes: 8, status: 'active', code: 'BD482' },
  { id: 'su6_2', leagueId: 'sl1', sportId: 'soccer', name: 'Red Rockets',   coach: 'Tom Baker',    athletes: 8, status: 'active', code: 'RR719' },
  { id: 'su6_3', leagueId: 'sl1', sportId: 'soccer', name: 'Green Gators',  coach: 'Pending',      athletes: 0, status: 'setup',  code: 'GG354' },
  { id: 'su6_4', leagueId: 'sl1', sportId: 'soccer', name: 'Yellow Stars',  coach: 'Pending',      athletes: 0, status: 'setup',  code: 'YS261' },

  // ── Soccer Rec U8 (sl2) ──────────────────────────────────────────────────
  { id: 'su8_1', leagueId: 'sl2', sportId: 'soccer', name: 'Riverside Rovers',  coach: 'Kevin Park',   athletes: 11, status: 'active', code: 'RR538' },
  { id: 'su8_2', leagueId: 'sl2', sportId: 'soccer', name: 'Westside Warriors', coach: 'Angela Davis', athletes: 11, status: 'active', code: 'WW194' },
  { id: 'su8_3', leagueId: 'sl2', sportId: 'soccer', name: 'North FC',          coach: 'Chris Moore',  athletes: 11, status: 'active', code: 'NF827' },
  { id: 'su8_4', leagueId: 'sl2', sportId: 'soccer', name: 'East United',       coach: 'Jenny Walsh',  athletes: 11, status: 'active', code: 'EU463' },
  { id: 'su8_5', leagueId: 'sl2', sportId: 'soccer', name: 'Lake Lions',        coach: 'Pending',      athletes: 0,  status: 'setup',  code: 'LL915' },

  // ── Soccer Rec U10 (sl3) — main featured league ──────────────────────────
  { id: 'su10_1', leagueId: 'sl3', sportId: 'soccer', name: 'Riverside United', coach: 'Sarah Rivera',    athletes: 14, status: 'active', code: 'RU827' },
  { id: 'su10_2', leagueId: 'sl3', sportId: 'soccer', name: 'Westfield FC',     coach: 'Marcus Williams', athletes: 12, status: 'active', code: 'WF341' },
  { id: 'su10_3', leagueId: 'sl3', sportId: 'soccer', name: 'North Stars',      coach: 'Amy Park',        athletes: 13, status: 'active', code: 'NS673' },
  { id: 'su10_4', leagueId: 'sl3', sportId: 'soccer', name: 'Valley Hawks',     coach: 'Tony Burns',      athletes: 11, status: 'active', code: 'VH492' },
  { id: 'su10_5', leagueId: 'sl3', sportId: 'soccer', name: 'Eastside SC',      coach: 'Pending',         athletes: 0,  status: 'setup',  code: 'ES156' },
  { id: 'su10_6', leagueId: 'sl3', sportId: 'soccer', name: 'Lakefront FC',     coach: 'Pending',         athletes: 0,  status: 'setup',  code: 'LF738' },

  // ── Soccer Rec U12 (sl4) ─────────────────────────────────────────────────
  { id: 'su12_1', leagueId: 'sl4', sportId: 'soccer', name: 'Cedar Hill FC',   coach: 'Rob Johnson',  athletes: 13, status: 'active', code: 'CH529' },
  { id: 'su12_2', leagueId: 'sl4', sportId: 'soccer', name: 'Pinewood United', coach: 'Lisa Chen',    athletes: 13, status: 'active', code: 'PU384' },
  { id: 'su12_3', leagueId: 'sl4', sportId: 'soccer', name: 'Sunset SC',       coach: 'David Torres', athletes: 13, status: 'active', code: 'SS917' },
  { id: 'su12_4', leagueId: 'sl4', sportId: 'soccer', name: 'Harbor City FC',  coach: 'Pending',      athletes: 0,  status: 'setup',  code: 'HC246' },

  // ── Soccer Rec U14 (sl5) ─────────────────────────────────────────────────
  { id: 'su14_1', leagueId: 'sl5', sportId: 'soccer', name: 'Lakeside FC', coach: 'Nina Roberts', athletes: 14, status: 'active', code: 'LF613' },
  { id: 'su14_2', leagueId: 'sl5', sportId: 'soccer', name: 'Metro SC',    coach: 'James Allen',  athletes: 13, status: 'active', code: 'MS782' },
  { id: 'su14_3', leagueId: 'sl5', sportId: 'soccer', name: 'City United', coach: 'Pending',      athletes: 0,  status: 'setup',  code: 'CU451' },

  // ── Soccer Travel U10 (sl6) ──────────────────────────────────────────────
  { id: 'stu10_1', leagueId: 'sl6', sportId: 'soccer', name: 'Premier FC',    coach: 'John Mitchell', athletes: 14, status: 'active', code: 'PF839' },
  { id: 'stu10_2', leagueId: 'sl6', sportId: 'soccer', name: 'Elite Squad',   coach: 'Rachel Kim',    athletes: 14, status: 'active', code: 'ES174' },
  { id: 'stu10_3', leagueId: 'sl6', sportId: 'soccer', name: 'Select United', coach: 'Pending',       athletes: 0,  status: 'setup',  code: 'SU562' },

  // ── Soccer Travel U12 (sl7) ──────────────────────────────────────────────
  { id: 'stu12_1', leagueId: 'sl7', sportId: 'soccer', name: 'Academy SC',   coach: 'Brian Wilson', athletes: 15, status: 'active', code: 'AS347' },
  { id: 'stu12_2', leagueId: 'sl7', sportId: 'soccer', name: 'Champions FC', coach: 'Pending',      athletes: 0,  status: 'setup',  code: 'CF921' },
];

// ─── Events ───────────────────────────────────────────────────────────────────

export type DemoEvent = {
  id: string;
  teamId: string;
  teamName: string;
  leagueId?: string;
  sportId?: string;
  type: 'game' | 'practice' | 'meeting' | 'tournament';
  title: string;
  date: string;
  time: string;
  location: string;
  published: boolean;
};

export const INITIAL_DEMO_EVENTS: DemoEvent[] = [
  // ── Soccer Rec U10 ────────────────────────────────────────────────────────
  { id: 'e1',  teamId: 'su10_1', teamName: 'Riverside United',  leagueId: 'sl3', sportId: 'soccer', type: 'game',       title: 'vs Westfield FC',              date: 'Sat Mar 1',  time: '10:00 AM', location: 'Riverside Field 1', published: true  },
  { id: 'e2',  teamId: 'su10_4', teamName: 'Valley Hawks',      leagueId: 'sl3', sportId: 'soccer', type: 'game',       title: 'vs North Stars',               date: 'Sat Mar 1',  time: '12:00 PM', location: 'Field A',           published: true  },
  { id: 'e3',  teamId: 'su10_3', teamName: 'North Stars',       leagueId: 'sl3', sportId: 'soccer', type: 'practice',   title: 'Practice',                     date: 'Thu Feb 27', time: '4:30 PM',  location: 'Field B',           published: true  },
  { id: 'e4',  teamId: 'su10_2', teamName: 'Westfield FC',      leagueId: 'sl3', sportId: 'soccer', type: 'practice',   title: 'Practice',                     date: 'Mon Mar 3',  time: '5:00 PM',  location: 'Field B',           published: false },
  // ── Soccer Rec U8 ─────────────────────────────────────────────────────────
  { id: 'e5',  teamId: 'su8_1',  teamName: 'Riverside Rovers',  leagueId: 'sl2', sportId: 'soccer', type: 'practice',   title: 'Practice',                     date: 'Thu Feb 27', time: '3:30 PM',  location: 'Field D',           published: true  },
  { id: 'e6',  teamId: 'su8_3',  teamName: 'North FC',          leagueId: 'sl2', sportId: 'soccer', type: 'game',       title: 'vs East United',               date: 'Sat Mar 1',  time: '9:00 AM',  location: 'Field C',           published: true  },
  // ── Soccer Rec U12 ────────────────────────────────────────────────────────
  { id: 'e7',  teamId: 'su12_1', teamName: 'Cedar Hill FC',     leagueId: 'sl4', sportId: 'soccer', type: 'game',       title: 'vs Pinewood United',           date: 'Sat Mar 1',  time: '1:00 PM',  location: 'Field C',           published: true  },
  { id: 'e8',  teamId: 'su12_3', teamName: 'Sunset SC',         leagueId: 'sl4', sportId: 'soccer', type: 'practice',   title: 'Practice',                     date: 'Wed Feb 26', time: '5:30 PM',  location: 'Field A',           published: true  },
  // ── Soccer Travel U10 ─────────────────────────────────────────────────────
  { id: 'e9',  teamId: 'stu10_1', teamName: 'Premier FC',        leagueId: 'sl6', sportId: 'soccer', type: 'practice',   title: 'Training Session',             date: 'Tue Mar 4',  time: '5:30 PM',  location: 'Riverside Field 2', published: true  },
  { id: 'e10', teamId: 'stu10_1', teamName: 'Premier FC',        leagueId: 'sl6', sportId: 'soccer', type: 'tournament', title: 'Spring Kickoff Tournament',    date: 'Sat Mar 8',  time: '9:00 AM',  location: 'Riverside Complex', published: true  },
  // ── Soccer Travel U12 ─────────────────────────────────────────────────────
  { id: 'e11', teamId: 'stu12_1', teamName: 'Academy SC',        leagueId: 'sl7', sportId: 'soccer', type: 'game',       title: 'vs Champions FC',              date: 'Sat Mar 8',  time: '10:00 AM', location: 'Riverside Field 1', published: false },
  // ── All Coaches ───────────────────────────────────────────────────────────
  { id: 'e12', teamId: 'all',    teamName: 'All Coaches',                                              type: 'meeting',    title: 'Spring Season Kickoff Meeting',date: 'Mon Mar 3',  time: '7:00 PM',  location: 'Rec Center Room A', published: false },
];

// ─── Opponent teams (per sport, for the schedule wizard) ─────────────────────

export const DEMO_OPPONENTS: Record<string, string[]> = {
  soccer:     ['Spotsylvania FC', 'Stafford United', 'King George SC', 'Culpeper FC', 'Caroline SC', 'Fauquier United', 'Rappahannock FC', 'Colonial FC'],
  baseball:   ['Blue Jays', 'Falcons', 'Panthers', 'Cougars', 'Bulldogs', 'Riverside Reds'],
  basketball: ['Rockets', 'Blazers', 'Hawks', 'Wolves', 'Storm', 'Riverside Thunder'],
};

// ─── Common venue locations ────────────────────────────────────────────────────

export const DEMO_LOCATIONS: string[] = [
  'Riverside Field 1', 'Riverside Field 2', 'Riverside Complex',
  'Field A', 'Field B', 'Field C', 'Field D',
  'West Park Field 1', 'West Park Field 2',
  'Rec Center Room A', 'Rec Center Main Gym',
  'East Side Field', 'North Park Field',
];

// ─── Activity feed ────────────────────────────────────────────────────────────

export const DEMO_ACTIVITY = [
  { text: `${DEMO_PENDING_REG} new registrations pending review for Soccer Rec U8`, time: '1h ago',  sport: 'soccer' },
  { text: 'Coach Sarah Rivera confirmed Riverside United lineup for Saturday',        time: '3h ago',  sport: 'soccer' },
  { text: 'Spring Kickoff Tournament scheduled — Travel U10, Mar 8',                 time: '5h ago',  sport: 'soccer' },
  { text: 'Eastside SC & Lakefront FC still need coaches assigned',                  time: '1d ago',  sport: 'soccer' },
  { text: 'Academy SC roster finalized — 15 players confirmed',                      time: '2d ago',  sport: 'soccer' },
  { text: 'Soccer Rec U8 & U10 registration deadline extended to Mar 1',             time: '3d ago',  sport: 'soccer' },
];

// ─── Roster preview ───────────────────────────────────────────────────────────

export const DEMO_ROSTER_PREVIEW: Record<string, { jersey: number; name: string; pos: string }[]> = {
  // Rec U10 — Riverside United (full)
  su10_1: [
    { jersey: 1,  name: 'Jordan Smith',    pos: 'GK' },
    { jersey: 4,  name: 'Maya Torres',     pos: 'CB' },
    { jersey: 5,  name: 'Tyler Reed',      pos: 'CB' },
    { jersey: 3,  name: 'Sam Liu',         pos: 'LB' },
    { jersey: 6,  name: 'Nina Cruz',       pos: 'RB' },
    { jersey: 8,  name: 'Eli Johnson',     pos: 'CM' },
    { jersey: 10, name: 'Chloe Davis',     pos: 'ST' },
    { jersey: 11, name: 'Noah Wilson',     pos: 'LW' },
    { jersey: 7,  name: 'Aiden Scott',     pos: 'RW' },
    { jersey: 9,  name: 'Emma Park',       pos: 'CF' },
    { jersey: 2,  name: 'Ryan James',      pos: 'LM' },
    { jersey: 14, name: 'Zoe Brown',       pos: 'RM' },
  ],
  // Rec U10 — Westfield FC
  su10_2: [
    { jersey: 1,  name: 'Alex Morgan',     pos: 'GK' },
    { jersey: 5,  name: 'Jake Torres',     pos: 'CB' },
    { jersey: 4,  name: 'Emma Lee',        pos: 'CB' },
    { jersey: 3,  name: 'Luis Martinez',   pos: 'LB' },
    { jersey: 2,  name: 'Sophie Clark',    pos: 'RB' },
    { jersey: 8,  name: 'Ben White',       pos: 'CM' },
    { jersey: 6,  name: 'Olivia Brown',    pos: 'DM' },
    { jersey: 10, name: 'Max Davis',       pos: 'AM' },
    { jersey: 11, name: 'Ava Wilson',      pos: 'LW' },
    { jersey: 9,  name: 'Owen Hall',       pos: 'ST' },
    { jersey: 7,  name: 'Grace Kim',       pos: 'RW' },
  ],
  // Rec U10 — North Stars
  su10_3: [
    { jersey: 1,  name: 'Connor Walsh',    pos: 'GK' },
    { jersey: 3,  name: 'Lily Park',       pos: 'LB' },
    { jersey: 5,  name: 'Jack Moore',      pos: 'CB' },
    { jersey: 4,  name: 'Isabella Cruz',   pos: 'CB' },
    { jersey: 2,  name: 'Ava Thompson',    pos: 'RB' },
    { jersey: 8,  name: 'Ethan Brooks',    pos: 'CM' },
    { jersey: 7,  name: 'Mia Johnson',     pos: 'RW' },
    { jersey: 10, name: 'Liam Chen',       pos: 'AM' },
    { jersey: 11, name: 'Sophia Martinez', pos: 'LW' },
    { jersey: 9,  name: 'Daniel Kim',      pos: 'ST' },
  ],
  // Rec U10 — Valley Hawks
  su10_4: [
    { jersey: 1,  name: 'Tyler Banks',     pos: 'GK' },
    { jersey: 6,  name: 'Oliver Reed',     pos: 'LB' },
    { jersey: 5,  name: 'Emma Scott',      pos: 'CB' },
    { jersey: 4,  name: 'James Liu',       pos: 'CB' },
    { jersey: 3,  name: 'Aiden Cruz',      pos: 'RB' },
    { jersey: 8,  name: 'Chloe Park',      pos: 'CM' },
    { jersey: 7,  name: 'Noah Davis',      pos: 'RW' },
    { jersey: 10, name: 'Maya Wilson',     pos: 'AM' },
    { jersey: 9,  name: 'Ryan Mitchell',   pos: 'ST' },
    { jersey: 11, name: 'Ella Johnson',    pos: 'LW' },
  ],
  // Rec U8 — Riverside Rovers
  su8_1: [
    { jersey: 1,  name: 'Lena Hart',       pos: 'GK' },
    { jersey: 4,  name: 'Oscar Flynn',     pos: 'CB' },
    { jersey: 7,  name: 'Nora Walsh',      pos: 'MF' },
    { jersey: 9,  name: 'Felix Cho',       pos: 'FW' },
    { jersey: 3,  name: 'Ruby Barnes',     pos: 'DF' },
  ],
  // Rec U12 — Cedar Hill FC
  su12_1: [
    { jersey: 1,  name: 'Zach Ross',       pos: 'GK' },
    { jersey: 4,  name: 'Mia Turner',      pos: 'CB' },
    { jersey: 5,  name: 'Leo Barnes',      pos: 'CB' },
    { jersey: 8,  name: 'Grace Foster',    pos: 'CM' },
    { jersey: 10, name: 'Jake Rivera',     pos: 'AM' },
    { jersey: 11, name: 'Ava Mitchell',    pos: 'LW' },
    { jersey: 9,  name: 'Sam Chen',        pos: 'ST' },
    { jersey: 7,  name: 'Eli Torres',      pos: 'RW' },
  ],
  // Rec U12 — Pinewood United
  su12_2: [
    { jersey: 1,  name: 'Priya Nair',      pos: 'GK' },
    { jersey: 5,  name: 'Carlos Ruiz',     pos: 'CB' },
    { jersey: 4,  name: 'Diana Soto',      pos: 'CB' },
    { jersey: 8,  name: 'Marcus Hill',     pos: 'CM' },
    { jersey: 10, name: 'Freya Adams',     pos: 'AM' },
    { jersey: 9,  name: 'Kai Thompson',    pos: 'ST' },
    { jersey: 7,  name: 'Luna Park',       pos: 'LW' },
  ],
  // Travel U10 — Premier FC
  stu10_1: [
    { jersey: 1,  name: 'Sarah Kim',       pos: 'GK' },
    { jersey: 3,  name: 'Max Reed',        pos: 'LB' },
    { jersey: 5,  name: 'Emma Torres',     pos: 'CB' },
    { jersey: 4,  name: 'Jack Brown',      pos: 'CB' },
    { jersey: 2,  name: 'Grace Liu',       pos: 'RB' },
    { jersey: 6,  name: 'Owen Park',       pos: 'DM' },
    { jersey: 8,  name: 'Lily Davis',      pos: 'CM' },
    { jersey: 10, name: 'Chloe Johnson',   pos: 'AM' },
    { jersey: 11, name: 'Ethan Martinez',  pos: 'LW' },
    { jersey: 9,  name: 'Ava Scott',       pos: 'ST' },
    { jersey: 7,  name: 'Noah Wilson',     pos: 'RW' },
    { jersey: 14, name: 'Tyler Hall',      pos: 'RM' },
  ],
  // Travel U10 — Elite Squad
  stu10_2: [
    { jersey: 1,  name: 'Finn Brady',      pos: 'GK' },
    { jersey: 5,  name: 'Isla Chen',       pos: 'CB' },
    { jersey: 4,  name: 'Marco Silva',     pos: 'CB' },
    { jersey: 8,  name: 'Aria Patel',      pos: 'CM' },
    { jersey: 10, name: 'Luca Rossi',      pos: 'AM' },
    { jersey: 9,  name: 'Zara White',      pos: 'ST' },
    { jersey: 7,  name: 'Milo James',      pos: 'RW' },
  ],
  // Travel U12 — Academy SC
  stu12_1: [
    { jersey: 1,  name: 'Marcus Reyes',    pos: 'GK' },
    { jersey: 3,  name: 'Anna Foster',     pos: 'LB' },
    { jersey: 5,  name: 'Jake Kim',        pos: 'CB' },
    { jersey: 4,  name: 'Sofia Barnes',    pos: 'CB' },
    { jersey: 2,  name: 'Leo Cruz',        pos: 'RB' },
    { jersey: 6,  name: 'Emma Mitchell',   pos: 'DM' },
    { jersey: 8,  name: 'Noah Torres',     pos: 'CM' },
    { jersey: 10, name: 'Mia Park',        pos: 'AM' },
    { jersey: 11, name: 'Ethan Scott',     pos: 'LW' },
    { jersey: 9,  name: 'Grace Johnson',   pos: 'ST' },
    { jersey: 7,  name: 'Owen Davis',      pos: 'RW' },
    { jersey: 14, name: 'Lily Martinez',   pos: 'RM' },
  ],
};

// ─── Coaches ──────────────────────────────────────────────────────────────────

export type DemoCoach = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  leagueId: string;
  sportId: string;
  status: 'active' | 'invited';
  email: string;
  phone: string;
  bgCheck: boolean;
  yearsCoaching: number;
};

export const DEMO_COACHES: DemoCoach[] = [
  // ── Soccer Rec U6 (sl1) ──────────────────────────────────────────────────
  { id: 'coach_1',  name: 'Maria Santos',    teamId: 'su6_1',   teamName: 'Blue Dolphins',    leagueId: 'sl1', sportId: 'soccer', status: 'active', email: 'm.santos@demo.com',   phone: '(540) 555-0101', bgCheck: true, yearsCoaching: 5  },
  { id: 'coach_2',  name: 'Tom Baker',       teamId: 'su6_2',   teamName: 'Red Rockets',      leagueId: 'sl1', sportId: 'soccer', status: 'active', email: 't.baker@demo.com',    phone: '(540) 555-0102', bgCheck: true, yearsCoaching: 3  },
  // ── Soccer Rec U8 (sl2) ──────────────────────────────────────────────────
  { id: 'coach_3',  name: 'Kevin Park',      teamId: 'su8_1',   teamName: 'Riverside Rovers', leagueId: 'sl2', sportId: 'soccer', status: 'active', email: 'k.park@demo.com',     phone: '(540) 555-0103', bgCheck: true, yearsCoaching: 7  },
  { id: 'coach_4',  name: 'Angela Davis',    teamId: 'su8_2',   teamName: 'Westside Warriors', leagueId: 'sl2', sportId: 'soccer', status: 'active', email: 'a.davis@demo.com',    phone: '(540) 555-0104', bgCheck: true, yearsCoaching: 4  },
  { id: 'coach_5',  name: 'Chris Moore',     teamId: 'su8_3',   teamName: 'North FC',         leagueId: 'sl2', sportId: 'soccer', status: 'active', email: 'c.moore@demo.com',    phone: '(540) 555-0105', bgCheck: true, yearsCoaching: 2  },
  { id: 'coach_6',  name: 'Jenny Walsh',     teamId: 'su8_4',   teamName: 'East United',      leagueId: 'sl2', sportId: 'soccer', status: 'active', email: 'j.walsh@demo.com',    phone: '(540) 555-0106', bgCheck: true, yearsCoaching: 6  },
  // ── Soccer Rec U10 (sl3) ─────────────────────────────────────────────────
  { id: 'coach_7',  name: 'Sarah Rivera',    teamId: 'su10_1',  teamName: 'Riverside United', leagueId: 'sl3', sportId: 'soccer', status: 'active', email: 's.rivera@demo.com',   phone: '(540) 555-0107', bgCheck: true, yearsCoaching: 9  },
  { id: 'coach_8',  name: 'Marcus Williams', teamId: 'su10_2',  teamName: 'Westfield FC',     leagueId: 'sl3', sportId: 'soccer', status: 'active', email: 'm.williams@demo.com', phone: '(540) 555-0108', bgCheck: true, yearsCoaching: 11 },
  { id: 'coach_9',  name: 'Amy Park',        teamId: 'su10_3',  teamName: 'North Stars',      leagueId: 'sl3', sportId: 'soccer', status: 'active', email: 'a.park@demo.com',     phone: '(540) 555-0109', bgCheck: true, yearsCoaching: 3  },
  { id: 'coach_10', name: 'Tony Burns',      teamId: 'su10_4',  teamName: 'Valley Hawks',     leagueId: 'sl3', sportId: 'soccer', status: 'active', email: 't.burns@demo.com',    phone: '(540) 555-0110', bgCheck: true, yearsCoaching: 8  },
  // ── Soccer Rec U12 (sl4) ─────────────────────────────────────────────────
  { id: 'coach_11', name: 'Rob Johnson',     teamId: 'su12_1',  teamName: 'Cedar Hill FC',    leagueId: 'sl4', sportId: 'soccer', status: 'active', email: 'r.johnson@demo.com',  phone: '(540) 555-0111', bgCheck: true, yearsCoaching: 12 },
  { id: 'coach_12', name: 'Lisa Chen',       teamId: 'su12_2',  teamName: 'Pinewood United',  leagueId: 'sl4', sportId: 'soccer', status: 'active', email: 'l.chen@demo.com',     phone: '(540) 555-0112', bgCheck: true, yearsCoaching: 5  },
  { id: 'coach_13', name: 'David Torres',    teamId: 'su12_3',  teamName: 'Sunset SC',        leagueId: 'sl4', sportId: 'soccer', status: 'active', email: 'd.torres@demo.com',   phone: '(540) 555-0113', bgCheck: true, yearsCoaching: 7  },
  // ── Soccer Rec U14 (sl5) ─────────────────────────────────────────────────
  { id: 'coach_14', name: 'Nina Roberts',    teamId: 'su14_1',  teamName: 'Lakeside FC',      leagueId: 'sl5', sportId: 'soccer', status: 'active', email: 'n.roberts@demo.com',  phone: '(540) 555-0114', bgCheck: true, yearsCoaching: 15 },
  { id: 'coach_15', name: 'James Allen',     teamId: 'su14_2',  teamName: 'Metro SC',         leagueId: 'sl5', sportId: 'soccer', status: 'active', email: 'j.allen@demo.com',    phone: '(540) 555-0115', bgCheck: true, yearsCoaching: 4  },
  // ── Soccer Travel U10 (sl6) ──────────────────────────────────────────────
  { id: 'coach_16', name: 'John Mitchell',   teamId: 'stu10_1', teamName: 'Premier FC',       leagueId: 'sl6', sportId: 'soccer', status: 'active', email: 'j.mitchell@demo.com', phone: '(540) 555-0116', bgCheck: true, yearsCoaching: 10 },
  { id: 'coach_17', name: 'Rachel Kim',      teamId: 'stu10_2', teamName: 'Elite Squad',      leagueId: 'sl6', sportId: 'soccer', status: 'active', email: 'r.kim@demo.com',      phone: '(540) 555-0117', bgCheck: true, yearsCoaching: 6  },
  // ── Soccer Travel U12 (sl7) ──────────────────────────────────────────────
  { id: 'coach_18', name: 'Brian Wilson',    teamId: 'stu12_1', teamName: 'Academy SC',       leagueId: 'sl7', sportId: 'soccer', status: 'active', email: 'b.wilson@demo.com',   phone: '(540) 555-0118', bgCheck: true, yearsCoaching: 13 },
];

// ─── DM conversations ─────────────────────────────────────────────────────────

export type DemoConvo = {
  id: string;
  teamId: string;
  coach: string;
  team: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: { from: 'coach' | 'admin'; text: string; time: string }[];
};

export const DEMO_CONVOS: DemoConvo[] = [
  {
    id: 'c1', teamId: 'su10_1',
    coach: 'Sarah Rivera',
    team: 'Riverside United · Soccer Rec U10',
    preview: 'Looking forward to Saturday! ⚽',
    time: '2h ago', unread: true,
    messages: [
      { from: 'coach', text: "Hey! Just confirming — Riverside United is ready for Saturday's game vs Westfield.", time: '10:12 AM' },
      { from: 'admin', text: 'Great! Riverside Field 1 is confirmed. Gates open at 9:30 AM.', time: '10:15 AM' },
      { from: 'coach', text: 'Can you send a parking reminder to parents? Last game got congested.', time: '10:18 AM' },
      { from: 'admin', text: "Good call — I'll send a broadcast this afternoon.", time: '10:19 AM' },
      { from: 'coach', text: 'Looking forward to Saturday! ⚽', time: '10:20 AM' },
    ],
  },
  {
    id: 'c2', teamId: 'su10_2',
    coach: 'Marcus Williams',
    team: 'Westfield FC · Soccer Rec U10',
    preview: 'Can we shift practice to 5pm?',
    time: '1d ago', unread: false,
    messages: [
      { from: 'coach', text: 'Hi — any chance we could shift Monday practice to 5:00pm instead of 4:30?', time: 'Yesterday 3:04 PM' },
      { from: 'admin', text: "Let me check Field B availability. I'll get back to you shortly.", time: 'Yesterday 3:20 PM' },
      { from: 'coach', text: "No rush — just a few parents asked about pickup time.", time: 'Yesterday 3:22 PM' },
    ],
  },
  {
    id: 'c3', teamId: 'stu10_1',
    coach: 'John Mitchell',
    team: 'Premier FC · Soccer Travel U10',
    preview: "Roster is locked and we're ready for the tournament.",
    time: '3h ago', unread: true,
    messages: [
      { from: 'coach', text: "Quick update — Premier FC roster is final. All 14 players cleared for the Mar 8 tournament.", time: '8:30 AM' },
      { from: 'admin', text: "Perfect. I'll lock the roster and send tournament details to all families.", time: '9:00 AM' },
      { from: 'coach', text: 'Also, do you have the bracket schedule yet? Parents keep asking.', time: '9:05 AM' },
      { from: 'admin', text: "Bracket drops Thursday. I'll tag you when it's published.", time: '9:10 AM' },
      { from: 'coach', text: "Roster is locked and we're ready for the tournament.", time: '9:11 AM' },
    ],
  },
  {
    id: 'c4', teamId: 'su8_1',
    coach: 'Kevin Park',
    team: 'Riverside Rovers · Soccer Rec U8',
    preview: 'Great first practice — kids are so energetic!',
    time: '5h ago', unread: false,
    messages: [
      { from: 'coach', text: 'Quick question — is Field D available Wednesday afternoons going forward?', time: '9:00 AM' },
      { from: 'admin', text: "Yes, Field D is open 3–6pm Wednesdays. I'll block it for Riverside Rovers.", time: '9:30 AM' },
      { from: 'coach', text: 'Perfect, thank you!', time: '9:35 AM' },
      { from: 'coach', text: 'Great first practice — kids are so energetic!', time: '5:45 PM' },
    ],
  },
  {
    id: 'c5', teamId: 'stu12_1',
    coach: 'Brian Wilson',
    team: 'Academy SC · Soccer Travel U12',
    preview: 'Can we get extra time at Riverside Field 1 this week?',
    time: '2d ago', unread: false,
    messages: [
      { from: 'coach', text: "We have the Sat Mar 8 game coming up. Any chance of an extra session at Riverside Field 1?", time: 'Mon 2:00 PM' },
      { from: 'admin', text: "Let me check the field schedule for Thursday. I'll confirm by end of day.", time: 'Mon 3:00 PM' },
      { from: 'coach', text: 'Can we get extra time at Riverside Field 1 this week?', time: 'Mon 3:05 PM' },
    ],
  },
];

export const DEMO_BROADCASTS = [
  { text: '⛅ Fields may be wet Saturday morning — check the Parks & Rec website for last-minute closures before heading out.', audience: 'All Families', time: '2d ago' },
  { text: '📋 Soccer Rec U8 & U10 registration deadline extended to March 1st at 5pm. Late registrations will not be accepted.', audience: 'All Parents',  time: '4d ago' },
  { text: '🏆 Travel U10 Spring Kickoff Tournament confirmed for March 8 at Riverside Complex. Bracket posted Thursday.',        audience: 'Travel Teams', time: '1w ago'  },
];
