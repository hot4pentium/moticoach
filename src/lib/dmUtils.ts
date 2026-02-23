import type { UserRole } from '../context/AuthContext';

export function getDmConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * DM permission rules:
 * - Coach / Staff: can DM anyone
 * - Supporter: can DM anyone
 * - Athlete: can DM coach/staff/supporters — NOT other athletes
 */
export function canDM(senderRole: UserRole, targetRole: UserRole): boolean {
  if (senderRole === 'athlete' && targetRole === 'athlete') return false;
  return true;
}
