import { Colors } from '../theme';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;   // MaterialCommunityIcons name
  color: string;
  category: 'games' | 'plays' | 'roster';
}

export const ALL_BADGES: Badge[] = [
  { id: 'game_first',  name: 'KICKOFF',    description: 'Completed first tracked game',    icon: 'trophy',         color: Colors.cyan,   category: 'games'  },
  { id: 'game_five',   name: 'FIVE TIMER', description: 'Completed 5 tracked games',       icon: 'chart-bar',      color: Colors.blue,   category: 'games'  },
  { id: 'game_ten',    name: 'FULL STRETCH', description: 'Completed 10 tracked games',    icon: 'medal',          color: Colors.amber,  category: 'games'  },
  { id: 'play_first',  name: 'PLAYMAKER',  description: 'Created your first play',         icon: 'vector-triangle', color: Colors.green, category: 'plays'  },
  { id: 'roster_full', name: 'FULL SQUAD', description: 'Added 8 or more players to the roster', icon: 'account-group', color: Colors.purple, category: 'roster' },
];

export interface BadgeTriggers {
  gamesTracked: number;
  playsCreated: number;
  rosterCount: number;
}

export function checkNewBadges(earnedIds: string[], triggers: BadgeTriggers): Badge[] {
  const earned = new Set(earnedIds);
  const newBadges: Badge[] = [];

  for (const badge of ALL_BADGES) {
    if (earned.has(badge.id)) continue;

    let qualifies = false;

    if      (badge.id === 'game_first')  qualifies = triggers.gamesTracked >= 1;
    else if (badge.id === 'game_five')   qualifies = triggers.gamesTracked >= 5;
    else if (badge.id === 'game_ten')    qualifies = triggers.gamesTracked >= 10;
    else if (badge.id === 'play_first')  qualifies = triggers.playsCreated >= 1;
    else if (badge.id === 'roster_full') qualifies = triggers.rosterCount >= 8;

    if (qualifies) newBadges.push(badge);
  }

  return newBadges;
}
