import type { UserRole } from '../context/AuthContext';

export function getDmConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * DM permission rules (safeguarding):
 * - Coach / Staff ↔ Athlete: BLOCKED (no private adult-to-minor messages)
 * - Athlete ↔ Athlete: BLOCKED
 * - All other combinations: allowed
 */
export function canDM(senderRole: UserRole, targetRole: UserRole): boolean {
  if (senderRole === 'athlete' && targetRole === 'athlete') return false;
  if (senderRole === 'coach' && targetRole === 'athlete') return false;
  if (senderRole === 'staff' && targetRole === 'athlete') return false;
  if (senderRole === 'athlete' && targetRole === 'coach') return false;
  if (senderRole === 'athlete' && targetRole === 'staff') return false;
  return true;
}
