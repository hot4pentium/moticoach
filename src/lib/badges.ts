import { Colors } from '../theme';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;   // MaterialCommunityIcons name
  color: string;
  category: 'stage' | 'xp' | 'games' | 'sport';
}

export const ALL_BADGES: Badge[] = [
  // MOTI Stage unlocks
  { id: 'stage_core',   name: 'CORE',       description: 'Team reached 100 XP',   icon: 'lightning-bolt',  color: Colors.cyan,   category: 'stage' },
  { id: 'stage_reach',  name: 'REACH',      description: 'Team reached 250 XP',   icon: 'fire',            color: Colors.blue,   category: 'stage' },
  { id: 'stage_stride', name: 'STRIDE',     description: 'Team reached 500 XP',   icon: 'diamond-stone',   color: Colors.green,  category: 'stage' },
  { id: 'stage_prime',  name: 'PRIME',      description: 'Team reached 1000 XP',  icon: 'crown',           color: Colors.amber,  category: 'stage' },

  // XP milestones
  { id: 'xp_150', name: 'MOMENTUM', description: 'Earned 150 total XP', icon: 'rocket-launch', color: Colors.purple, category: 'xp' },
  { id: 'xp_750', name: 'SURGE',    description: 'Earned 750 total XP', icon: 'trending-up',   color: Colors.red,    category: 'xp' },

  // Games tracked
  { id: 'games_1',  name: 'FIRST GAME', description: 'Completed first tracked game', icon: 'trophy',    color: Colors.cyan,  category: 'games' },
  { id: 'games_5',  name: 'TRACKER',    description: 'Completed 5 tracked games',    icon: 'chart-bar', color: Colors.green, category: 'games' },
  { id: 'games_10', name: 'VETERAN',    description: 'Completed 10 tracked games',   icon: 'medal',     color: Colors.amber, category: 'games' },

  // Sport-specific (first game per sport)
  { id: 'sport_baseball',   name: 'FIRST PITCH', description: 'First baseball game tracked',   icon: 'baseball',    color: Colors.cyan,  category: 'sport' },
  { id: 'sport_basketball', name: 'TIP OFF',      description: 'First basketball game tracked', icon: 'basketball',  color: Colors.amber, category: 'sport' },
  { id: 'sport_soccer',     name: 'KICKOFF',      description: 'First soccer game tracked',     icon: 'soccer',      color: Colors.green, category: 'sport' },
  { id: 'sport_football',   name: 'FIRST DOWN',   description: 'First football game tracked',   icon: 'football',    color: Colors.amber, category: 'sport' },
  { id: 'sport_volleyball', name: 'SPIKE',         description: 'First volleyball game tracked', icon: 'volleyball',  color: Colors.blue,  category: 'sport' },
];

export function checkNewBadges(
  earnedIds: string[],
  newXp: number,
  gamesTracked: number,
  trackedSports: string[],
): Badge[] {
  const earned = new Set(earnedIds);
  const newBadges: Badge[] = [];

  for (const badge of ALL_BADGES) {
    if (earned.has(badge.id)) continue;

    let qualifies = false;

    if      (badge.id === 'stage_core')   qualifies = newXp >= 100;
    else if (badge.id === 'stage_reach')  qualifies = newXp >= 250;
    else if (badge.id === 'stage_stride') qualifies = newXp >= 500;
    else if (badge.id === 'stage_prime')  qualifies = newXp >= 1000;
    else if (badge.id === 'xp_150')       qualifies = newXp >= 150;
    else if (badge.id === 'xp_750')       qualifies = newXp >= 750;
    else if (badge.id === 'games_1')      qualifies = gamesTracked >= 1;
    else if (badge.id === 'games_5')      qualifies = gamesTracked >= 5;
    else if (badge.id === 'games_10')     qualifies = gamesTracked >= 10;
    else if (badge.id.startsWith('sport_')) {
      const sport = badge.id.replace('sport_', '');
      qualifies = trackedSports.includes(sport);
    }

    if (qualifies) newBadges.push(badge);
  }

  return newBadges;
}
