# moticoach

React Native / Expo PWA for sports coaching. TypeScript throughout.

## Run
```
npm start        # Expo dev server
npm run web      # PWA in browser
```

## Stack
- React Native 0.81 + Expo ~54
- React Navigation (bottom tabs + native stack)
- Firebase ^12 (auth, firestore, storage — configured in src/lib/firebase.ts)
- react-native-safe-area-context, react-native-reanimated, react-native-svg
- expo-notifications + expo-device + expo-constants (push notifications, native only — **not yet installed**, run `npx expo install expo-notifications expo-device expo-constants` before EAS build)

## Project Structure
```
src/
  screens/        # All screen components (no subdirectories)
  navigation/     # index.tsx — AuthGate + role-based tab/stack navigators
  theme/          # index.ts — Colors, Fonts, Radius, Spacing
  context/        # CoachContext.tsx, AuthContext.tsx
  lib/            # firebase.ts, dmUtils.ts, notifications.ts
  components/     # OnboardingTooltip.tsx, MotiHero.tsx
  hooks/          # useOnboarding.ts
```

## Theme (`src/theme/index.ts`)
Always import from `../theme`. Never hardcode colors or spacing.
```ts
import { Colors, Fonts, Radius, Spacing } from '../theme';
```
Key values:
- `Colors.bg` #070b12, `Colors.card`, `Colors.border`, `Colors.border2`
- `Colors.text`, `Colors.dim`, `Colors.muted`
- `Colors.cyan` (primary accent), `.amber`, `.green`, `.red`, `.blue`, `.purple`
- `Fonts.orbitron` (display), `Fonts.mono` (JetBrains Mono, data/labels), `Fonts.rajdhani` (body)
- `Spacing.xs/sm/md/lg/xl/xxl` = 4/8/12/16/20/24
- `Radius.sm/md/lg/full` = 8/12/14/999(ish)

## Navigation (`src/navigation/index.tsx`)
Auth gate drives all routing — no manual navigation calls for auth transitions:
- `loading` → spinner
- `!user` → `AuthScreen`
- `user && !role` → `RoleSelectScreen`
- `role === 'coach' | 'staff'` → `CoachStack` (Dashboard, Calendar, **Chat**, Moti, Tools tabs + modal stack)
- `role === 'supporter' | 'athlete'` → `SupporterStack` (Home, **Chat**, Moti tabs)

Modal stack screens (both stacks): DMList, DMConversation, NewDM.
Modal stack screens (coach only): Roster, StatTrackerSetup, StatTrackerLive, StatTrackerSummary, Playmaker, PrepBook, PlayEditor.

Navigate with `navigation.navigate('ScreenName', { params })`.

All dashboards have a `⏻` sign-out button in the header (calls `signOut(auth)` → auth gate reacts).

## User Roles
Four roles: `coach` | `staff` | `supporter` | `athlete`
- **Coach** — creates team, full access, runs stat tracker, manages roster
- **Staff** — promoted from supporter by coach (from roster card), can run stat tracker
- **Supporter** — joins via team code (free), accesses Game Day Live, roster, playbook, MOTI
- **Athlete** — joins via team code (free), same access as supporter + their own stats
- Independent athlete tracking by supporter = paid feature
- Role stored in Firestore `users/{uid}.role` — AuthContext reads this on login

## Auth System
- `src/context/AuthContext.tsx` — `AuthProvider` wraps `onAuthStateChanged`, fetches `role`, `teamCode`, and `displayName` from `users/{uid}` in Firestore. Exports `useAuth()` → `{ user, role, teamCode, displayName, loading, setRole, setTeamCode, setDisplayName }`. Setters update context immediately after signup. Also triggers `registerPushToken(uid)` after user data loads.
- `src/screens/AuthScreen.tsx` — single screen, LOG IN / SIGN UP toggle, email+password, mapped Firebase error messages.
- `src/screens/RoleSelectScreen.tsx` — shown once after signup. Coach picks team name (generates unique code). Supporter/Athlete enters team code. Writes to `users/{uid}` and `teams/{code}` in Firestore. Calls `setRole`, `setTeamCode`, `setDisplayName` immediately. Clears legacy onboarding localStorage key on success.

## CoachContext (`src/context/CoachContext.tsx`)
Global state for the active session (used by both coach and supporter/athlete screens):
- `coachSport: Sport` — current sport (default 'baseball' for dev)
- `greyScale: number` — UI desaturation filter (coach only)
- `teamXp: number` — team XP pool, persisted to `localStorage('teamXp')`
- `addXp(amount)` — adds XP + writes localStorage
- `motiStage: number` — 0–4, computed from teamXp thresholds [0,100,250,500,1000]
- `XP_THRESHOLDS` exported array `[0, 100, 250, 500, 1000]`

## XP System
Team XP pool drives the shared MOTI advancement.

| Source | XP |
|---|---|
| Stat tracker game completed (SAVE & EXIT) | +50 base |
| Per stat recorded in that game | +1 each |
| Game Day Live taps (future) | every 3 taps = +1 |

MOTI stages: BOOT(0) → CORE(100) → REACH(250) → STRIDE(500) → PRIME(1000)
- `motiStage` in CoachContext is the source of truth for all screens
- Dashboard + SupporterHome LVL/XP badges read from context
- MotiScreen XP bar and stage dots read from context (unlocked computed live from teamXp)
- StatTrackerSummaryScreen SAVE & EXIT calls `addXp(50 + totalStatCount)`

## Firestore Data Model
```
users/{uid}
  role: 'coach' | 'staff' | 'supporter' | 'athlete'
  displayName: string
  teamCode: string
  createdAt: timestamp
  pushToken: string | null          ← Expo push token, written by notifications.ts

teams/{teamCode}
  coachUid: string
  teamName: string
  sport: string
  teamXp: number

teamChats/{teamCode}/messages/{messageId}
  senderId, senderName, senderRole, text, createdAt (serverTimestamp), readBy: string[]

dmConversations/{convId}            ← convId = [uid1,uid2].sort().join('_')
  participants: string[]
  participantRoles: Record<uid, role>
  participantNames: Record<uid, string>  ← stored on create so inbox can show names without extra fetches
  updatedAt, lastMessage, lastSenderId

dmConversations/{convId}/messages/{messageId}
  senderId, senderName, text, createdAt, readBy: string[]
```

## Team / Roster
- `TEAM_CODE` exported from `RosterScreen.tsx` — used on dashboard and roster header
- Mock roster data lives in `RosterScreen.tsx` (no Firebase persistence yet)
- Tapping any member opens `ProfileSheet` (bottom modal):
  - **Athletes**: large jersey, position badge, status pill (AVAILABLE/INJURED/ABSENT), expandable edit form (jersey + position picker), XP contribution row
  - **Supporters**: promote to staff button (placeholder)
  - **Staff**: title badge, demote button (placeholder)
- Coach can promote supporter → staff from profile sheet (wired to Firestore: TODO)
- `canEdit = role === 'coach' || role === 'staff'` — passed to ProfileSheet; hides all edit/promote/demote actions for supporter/athlete

## Game Day Live (PLANNED)
- Independent per-user participation — no coach action required to start
- Supporter sees a "Game Day Live" card on their home screen for today's game
- Features: Live Tap button (every 3 taps = +1 XP), Shout Outs to in-game players
- Has pause button (halftime), 2-hour session limit with 30/60 min extension prompt
- XP from taps syncs to team pool when user ends the game
- Needs Firebase Realtime / Firestore live listeners

## Stat Tracker Feature
Three-screen flow: Setup (3-step wizard) → Live → Summary.

**StatTrackerSetupScreen** — 3-step wizard:
- Step 1: Select Game
- Step 2: Sport config (field position for baseball, structure for soccer, period count for others)
- Step 3: Tracking Mode (Individual / Team)
Exports: `StatTrackerConfig`, `PeriodType`, `SPORT_STATS`, `BASEBALL_BATTING_STATS`, `BASEBALL_PITCHING_STATS`, `PERIOD_CONFIG`

**Baseball-specific logic (StatTrackerLiveScreen):**
- `inningHalf: 'top' | 'bottom'` state
- `isMyTeamBatting = isHomeTeam ? inningHalf === 'bottom' : inningHalf === 'top'`
- Active stats switch between `BASEBALL_BATTING_STATS` (batting) and `BASEBALL_PITCHING_STATS` (fielding)
- No clock bar, no OT button for baseball
- No innings picker in setup — coach counts up freely and ends the game manually
- Period label: `TOP 1`, `BOT 1`, etc.
- Undo bar always occupies space (opacity toggle) to prevent layout shift
- Stat selection persists after recording (no auto-clear) — user taps ✕ or picks new stat

**StatTrackerSummaryScreen:**
- Receives `{ config, homeScore, oppScore, teamStats, playerStats, isOT }` via route params
- Baseball summary shows combined batting + pitching stats filtered to keys with values > 0
- SAVE & EXIT awards XP: +50 base + 1 per stat recorded (via `addXp` from CoachContext)

## Onboarding System
- `src/hooks/useOnboarding.ts` — `useOnboarding(key, totalSteps)` hook
  - Runs once on first load only (writes localStorage immediately on mount)
  - Returns `{ step, next, dismiss, isDone }`
  - Key is **user-UID specific**: `dashboard_{uid}` — each account gets fresh onboarding
  - To reset during dev: `localStorage.removeItem('onboarding_dashboard_<uid>')` in browser console
- `src/components/OnboardingTooltip.tsx` — reusable tooltip overlay
  - Props: `visible`, `step`, `totalSteps`, `title`, `body`, `targetLayout`, `arrowSide`, `onNext`, `onDismiss`
  - Uses 4-piece overlay so the highlighted element stays fully bright (not dimmed)
  - For measuring targets on web/PWA use `getBoundingClientRect()` (not `measure()`)
- Dashboard onboarding: 3 steps — MOTI character, team code chip, navigation bar

## SupporterHomeScreen (`src/screens/SupporterHomeScreen.tsx`)
Home tab for supporter/athlete roles:
- Header: logo, LVL/XP pills, ⏻ exit button
- Hero banner: row layout — left (welcome text + display name + role badge) + right (`MotiHero`)
- **NEXT EVENT** card — dynamic, driven by same MOCK_EVENTS as coach dashboard; tappable opens EventSheet
- **SCHEDULE** section — WeekRow/DayCard calendar identical to coach, with 4-week expand toggle
- EventSheet modal — shows event info; game events include Game Day Live button (coming soon)
- Quick link grid: Roster, Playbook, MOTI (supporters) / STATS (athletes), Highlights (dim)
- Roster removed from tab bar — accessible via quick link grid only
- Team MOTI status card (reads motiStage + teamXp from CoachContext)
- `canEdit` is always false for supporter/athlete — ProfileSheet shows read-only view

## MotiHero Component (`src/components/MotiHero.tsx`)
Shared widget used in DashboardScreen and SupporterHomeScreen:
- Shows stage-correct still image (`MOTIS/{n}-MOTI.png`) always underneath
- Plays `MOTI-Small-File.mp4` on mount (loop=false, muted)
- Video fades out (700ms) via `Animated` when `playToEnd` fires
- Tap replays the animation
- Props: `{ motiStage: number }`

## Chat System
Team-wide group chat + direct messages for all roles. Fully implemented.

**DM permission rules:**
- Coach / Staff: can DM anyone
- Supporter: can DM anyone
- Athlete: can DM coach/staff/supporters — NOT other athletes

**Screens:**
- `ChatScreen` — group chat, CHAT tab in both CoachTabs and SupporterTabs. Header has DM button → DMList modal.
- `DMListScreen` — DM inbox, `onSnapshot` on `dmConversations` where `participants array-contains uid`
- `NewDMScreen` — member picker filtered by `canDM()`, creates conversation doc on first open
- `DMConversationScreen` — 1-on-1 chat, params: `{ conversationId, otherName, otherRole }`

**Utilities:**
- `src/lib/dmUtils.ts` — `getDmConversationId(uid1, uid2)` (sorted join), `canDM(senderRole, targetRole)`
- `src/lib/notifications.ts` — `registerPushToken(uid)`: uses `require()` inside try-catch so it silently no-ops when expo packages aren't installed or on web. On real devices with packages installed: checks `Device.isDevice`, requests permission, writes Expo push token to `users/{uid}.pushToken`
- **Firestore index required** for `NewDMScreen`: composite index on `users` collection — field `teamCode` (ascending). Firestore will surface a console link to auto-create it on first query failure.

**App Store distribution:** Use EAS Build (`eas build`) for native iOS/Android binaries. Push notifications require `expo-notifications` (APNs + FCM). Real-device only — silently no-ops in simulator/web.

## Conventions
- `SafeAreaView` from `react-native-safe-area-context` with `edges={['top']}`
- `StyleSheet.create` at bottom of each file
- Functional components with hooks only
- `useNavigation<any>()` and `useRoute<any>()` for navigation/params
