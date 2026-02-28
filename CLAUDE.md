# moticoach

React Native / Expo PWA for sports coaching. TypeScript throughout.

## Run
```
npm start        # Expo dev server
npm run web      # PWA in browser
npm run build    # Export web build → serves locally + opens browser
npm run deploy   # Export web build → push to leaguematrix.com (Firebase Hosting)
```

## Stack
- React Native 0.81 + Expo ~54
- React Navigation (bottom tabs + native stack)
- Firebase ^12 (auth, firestore, storage — configured in src/lib/firebase.ts)
- react-native-safe-area-context, react-native-reanimated, react-native-svg
- Web Push API + VAPID (PWA push notifications — no native build required)

## Project Structure
```
src/
  screens/        # All screen components (no subdirectories)
  navigation/     # index.tsx — AuthGate + role-based tab/stack navigators
  theme/          # index.ts — Colors, Fonts, Radius, Spacing, Gradients, HeroText
  context/        # CoachContext.tsx, AuthContext.tsx
  lib/            # firebase.ts, dmUtils.ts, notifications.ts, badges.ts, demoData.ts, adminTheme.ts, demoTheme.tsx
  components/     # OnboardingTooltip.tsx, BadgeShelf.tsx, BadgeUnlockModal.tsx, UpdateBanner.tsx, UpgradePrompt.tsx, TeamSettingsSheet.tsx, InstallPromptBanner.tsx, ProfileSheet.tsx, LogoMark.tsx
  hooks/          # useOnboarding.ts, useSwUpdate.ts
```

## Theme (`src/theme/index.ts`)
Always import from `../theme`. Never hardcode colors or spacing.
```ts
import { Colors, Fonts, Gradients, HeroText, Radius, Spacing } from '../theme';
```
Key values:
- `Colors.bg` #0d1b2e, `Colors.bgDeep` #081525, `Colors.card`, `Colors.border`, `Colors.border2`
- `Colors.text`, `Colors.dim`, `Colors.muted`
- `Colors.cyan` (primary accent), `.amber`, `.green`, `.red`, `.blue`, `.purple`
- `Fonts.orbitron` (display), `Fonts.mono` (JetBrains Mono, data/labels), `Fonts.rajdhani` (body), `Fonts.rajdhaniBold`, `Fonts.monoBold`
- `Spacing.xs/sm/md/lg/xl/xxl` = 4/8/12/16/20/24
- `Radius.sm/md/lg/xl/full` = 8/12/18/24/999
- `Gradients.hero` — `['#42a5f5', '#1565c0']` blue gradient used on all hero panels
- `HeroText.primary/secondary/muted` — white-scale text for use on blue gradient backgrounds

## Navigation (`src/navigation/index.tsx`)
Auth gate drives all routing — no manual navigation calls for auth transitions:
- `loading` → spinner
- `!user` on web → `LandingScreen` (or `DemoShell` if showDemo, or `AuthScreen` if showAuth)
- `!user` on native → `AuthScreen` directly
- `user && !role` → `RoleSelectScreen`
- `role === 'coach' | 'staff'` → `CoachStack` (Dashboard, Chat, Tools tabs + modal stack)
- `role === 'supporter' | 'athlete'` → `SupporterStack` (Home, Chat tabs)

`AuthScreen` has optional `onBack?: () => void` prop — renders "← Back" button only when provided (web flow only).

Modal stack screens (both stacks): DMList, DMConversation, NewDM.
Modal stack screens (coach only): Roster, StatTrackerSetup, StatTrackerLive, StatTrackerSummary, Playmaker, PrepBook, PlayEditor.

Navigate with `navigation.navigate('ScreenName', { params })`.

All dashboards have a `⏻` sign-out button in the header (calls `signOut(auth)` → auth gate reacts).

## User Roles
Four roles: `coach` | `staff` | `supporter` | `athlete`
- **Coach** — claims an admin-provisioned team via teamCode. All teams are created by the org admin; coaches never self-generate a code. Full access, runs stat tracker, manages roster.
- **Staff** — promoted from supporter by coach (from roster card), can run stat tracker
- **Supporter** (parent) — joins via team code. Gets access to the team hub (schedule, roster, badges, chat).
- **Athlete** — joins via team code. Same hub as supporter + their own stats tile.
- Independent athlete tracking by supporter = paid feature (`isPaid` gate)
- Role stored in Firestore `users/{uid}.role` — AuthContext reads this on login

## Auth System
- `src/context/AuthContext.tsx` — `AuthProvider` wraps `onAuthStateChanged`, fetches `role`, `teamCode`, `displayName`, and `notificationPrefs` from `users/{uid}` in Firestore. Exports `useAuth()` → `{ user, role, teamCode, displayName, notificationPrefs, loading, setRole, setTeamCode, setDisplayName }`. Setters update context immediately after signup. Also triggers `registerWebPush(uid)` after user data loads (web only; respects `notificationPrefs.push`).
- `src/screens/AuthScreen.tsx` — single screen, LOG IN / SIGN UP toggle, email+password, mapped Firebase error messages. Optional `onBack` prop shows "← Back" for web unauthenticated flow.
- `src/screens/RoleSelectScreen.tsx` — shown once after signup. All roles enter a team code. See "Team Claiming" section below.

## Team Claiming (`src/screens/RoleSelectScreen.tsx`)
All teams are admin-provisioned. Coaches claim, never create.

**Coach claim flow:**
1. Role selected → code auto-fills `GG354` (demo code, field locked/non-editable during demo)
2. `getDoc(teams/{code})` — if not found, checks `DEMO_TEAMS` for `status: 'setup'` and seeds the doc with `setDoc` (pre-loads `badges: ['game_first', 'roster_full']`, `gamesTracked: 1`)
3. If team exists: skip "already claimed" check for demo codes (`DEMO_TEAMS.some(t => t.code === code)`); for real teams, block if `coachUid !== null`
4. Claims with `updateDoc({ coachUid: uid, status: 'active' })` — preserves admin-set fields

**Supporter/Athlete flow:** Enter code manually → `setDoc(users/{uid})` only; no team write needed.

**Demo codes:** `DEMO_TEAMS` has 9 pending teams (`status: 'setup'`). Demo codes are re-claimable by multiple accounts (no lock). `GG354` is the primary demo coach code, auto-filled on role select.

## CoachContext (`src/context/CoachContext.tsx`)
Global state for the active session (wraps all roles, not just coach):
- `coachSport: Sport` — current sport (loaded from Firestore team doc)
- `greyScale: number` — UI desaturation filter (coach dashboard only)
- `isPaid: boolean` — read from Firestore `teams/{teamCode}.isPaid`; gates paid features
- `avatarUrl`, `badgeIcon`, `badgeColor` — team-level identity, persisted to Firestore
- `setAvatarUrl`, `setBadgeIcon`, `setBadgeColor` — save to Firestore + update state
- `badgeQueue: Badge[]` — queue of newly earned badges; `pendingBadge = badgeQueue[0]`
- `clearPendingBadge()` — slices front of queue
- `recordGame(sport)` — records a game completion, checks for new badges
- `earnedBadges: string[]` — badge IDs persisted to Firestore `teams/{teamCode}.badges`
- `settingsOpen`, `openSettings()`, `closeSettings()` — TeamSettingsSheet state

## Badge System (`src/lib/badges.ts`)
5 activity-based badges per season. No XP — purely activity-driven.

| Badge ID | Name | Trigger |
|---|---|---|
| `game_first` | KICKOFF | 1 game tracked |
| `game_five` | FIVE TIMER | 5 games tracked |
| `game_ten` | FULL STRETCH | 10 games tracked |
| `play_first` | PLAYMAKER | 1 play created |
| `roster_full` | FULL SQUAD | 8+ roster members |

- `checkNewBadges(earnedIds, { gamesTracked, playsCreated, rosterCount })` — returns newly earned `Badge[]`
- `BadgeShelf` accepts `onBadgePress?: (badge: Badge) => void` — tapping shows detail modal
- `BadgeUnlockModal.tsx` — icon-only reveal animation
- `BadgeShelf.tsx` — 4-col grid, count pill shows x/5; used in both coach and supporter/athlete dashboards
- `AchievementsScreen.tsx` — Badges tab screen (coach/staff)
- Demo teams seeded with `badges: ['game_first', 'roster_full']` on first coach claim

## Firestore Data Model
```
users/{uid}
  role: 'coach' | 'staff' | 'supporter' | 'athlete'
  displayName: string
  teamCode: string
  createdAt: timestamp
  avatarUrl?: string          ← personal avatar (Firebase Storage avatars/{uid})
  webPushSubscription?: string  ← JSON-serialized PushSubscription (web push)
  notificationPrefs?: { email: boolean, push: boolean }  ← defaults true/true if absent

teams/{teamCode}
  orgId: string
  leagueId: string
  coachUid: string | null     ← null until coach claims
  teamName: string
  sport: string
  status: 'setup' | 'active'
  isPaid: boolean
  badges: string[]            ← earned badge IDs
  gamesTracked: number
  playsCreated: number
  avatarUrl?: string          ← team logo (coach-uploadable)
  badgeIcon?: string          ← MaterialCommunityIcons icon name
  badgeColor?: string         ← hex color

teams/{teamCode}/events/{eventId}
  type, title, date, time, location, published

teams/{teamCode}/roster/{entryId}
  name, jersey, position, parentName?, parentEmail?, parentPhone?

teams/{teamCode}/members/{uid}
  role, displayName, joinedAt

teams/{teamCode}/pendingInvites/{email}
  name, email, role: 'supporter', status: 'invited'

teamChats/{teamCode}/messages/{messageId}
  senderId, senderName, senderRole, text, createdAt (serverTimestamp), readBy: string[]

dmConversations/{convId}            ← convId = [uid1,uid2].sort().join('_')
  participants: string[]
  participantRoles: Record<uid, role>
  participantNames: Record<uid, string>
  updatedAt, lastMessage, lastSenderId

dmConversations/{convId}/messages/{messageId}
  senderId, senderName, text, createdAt, readBy: string[]
```

## Team Hub Architecture
The hub lives in Firestore under `teams/{teamCode}` and is **live the moment admin creates the team**.

**Sign-up flow:**
1. Admin creates team in portal → `teams/{teamCode}` written with `coachUid: null, status: 'setup'`
2. Admin pre-loads events, roster entries, optionally parent contacts
3. **Coach** signs up → enters teamCode (auto-filled for demo) → claims team → dashboard shows pre-populated data
4. **Supporter** joins with same teamCode → sees schedule, roster, badges, chat
5. **Athlete** joins with same teamCode → same hub in athlete-role view

**Testing flow (demo orgs):**
- Send org the URL + code `GG354`
- Person 1 (coach test): Sign up → select COACH → confirm → coach dashboard
- Person 2 (supporter test): Sign up with different account → select SUPPORTER → type `GG354` → supporter home
- Demo codes are re-claimable so multiple orgs can test with the same code

## Team / Roster (`src/screens/RosterScreen.tsx`)
- Mock roster data in `RosterScreen.tsx` (no Firebase persistence yet)
- `RosterMember` interface includes: `parentName?`, `parentEmail?`, `parentPhone?`
- Several mock athletes pre-populated with parent contact data
- Tapping any member opens `ProfileSheet` (bottom modal):
  - **Athletes** (coach/staff view): jersey, position badge, status pill, edit form, PARENT CONTACT section (read-only when not editing, editable fields in edit mode)
  - **Supporters**: promote to staff button (placeholder)
  - **Staff**: title badge, demote button (placeholder)
- `canEdit = role === 'coach' || role === 'staff'` — hides edit/promote/demote for supporter/athlete
- PARENT CONTACT section only visible to coach/staff (`canEdit && !editing` shows read-only, `editing` shows editable fields)

## LogoMark Component (`src/components/LogoMark.tsx`)
- Renders the app logo using `assets/Logos/No-BG.png` (transparent background PNG, 1320×880)
- Uses `overflow: 'hidden'` + negative `marginTop` to crop the transparent padding from the image
- Sizes: `sm` (headers, 60px), `md` (footer, 72px), `lg` (auth screen, 90px)
- Used in: `DashboardScreen`, `SupporterHomeScreen`, `ChatScreen` headers (sm), `AuthScreen` brand (lg), `LandingScreen` nav + footer (sm/md)

## Dashboard Layout (Coach & Supporter/Athlete)
Both dashboards share the same visual structure — role-based access gates what is shown.

**Shared layout:**
1. **Header** — LeagueMatrix logo + `⏻` sign-out
2. **Hero** (`Gradients.hero` blue gradient, `borderBottomLeftRadius/RightRadius: 72`):
   - Left: role tag, team name, team code chip, sport badge
   - Right: tappable avatar circle + team badge icon overlay (`badgeIcon`/`badgeColor` from CoachContext)
3. **BadgeShelf** — tap any badge to show detail modal
4. **Next Event card** — color-accented, tappable → event sheet
5. **Schedule** — current week row + expand/navigate to full calendar
6. **Tools grid** — 2-col card grid (see below)

**Coach tools (`DashboardScreen`):** Playmaker, Roster, Stat Tracker, Prep Book, Highlights
**Supporter/Athlete tools (`SupporterHomeScreen`):** Roster (view), Playbook (view), My Stats (athlete only), Highlights (locked)

## Avatar Upload & Profile Settings
- **Coach**: tap avatar circle in hero → opens `TeamSettingsSheet` (avatar upload + team badge + notification prefs)
- **Supporter/Athlete**: tap avatar circle in hero → opens `ProfileSheet` (avatar upload + notification prefs)
- Avatar uploads to Firebase Storage `avatars/{uid}`, URL saved to `users/{uid}.avatarUrl`
- Coach team identity (`avatarUrl`, `badgeIcon`, `badgeColor`) stored at `teams/{teamCode}` (editable via TeamSettingsSheet)
- **All settings save immediately on tap** — both sheets show a header status line: `SAVES AUTOMATICALLY` (muted, always visible) that flashes `SAVED` (green) for 1.5s after each change. Implemented with `savedAt: number | null` state + `useRef` timer in each component.

## Stat Tracker Feature
Three-screen flow: Setup (3-step wizard) → Live → Summary.

**StatTrackerSetupScreen** — 3-step wizard:
- Step 1: Select Game
- Step 2: Sport config (field position for baseball, structure for soccer, period count for others)
- Step 3: Tracking Mode (Individual / Team)
Exports: `StatTrackerConfig`, `PeriodType`, `SPORT_STATS`, `BASEBALL_BATTING_STATS`, `BASEBALL_PITCHING_STATS`, `PERIOD_CONFIG`

**Baseball-specific logic (StatTrackerLiveScreen):**
- `inningHalf: 'top' | 'bottom'` state
- Active stats switch between batting/pitching based on `isMyTeamBatting`
- No clock bar, no OT button; period label `TOP 1`, `BOT 1`
- Undo bar always occupies space (opacity toggle) to prevent layout shift
- Stat selection persists after recording — user taps ✕ or picks new stat

**StatTrackerSummaryScreen:**
- Receives `{ config, homeScore, oppScore, teamStats, playerStats, isOT }` via route params
- SAVE & EXIT calls `recordGame(sport)` from CoachContext (triggers badge checks)

## Onboarding System
- `src/hooks/useOnboarding.ts` — `useOnboarding(key, totalSteps)` hook
  - Key is UID-specific: `dashboard_{uid}` — each account sees it once per device
  - Only writes `'done'` to localStorage when user explicitly taps NEXT through all steps or SKIP/dismiss (not on mount)
  - Returns `{ step, next, dismiss, isDone }`
  - To reset during dev: `localStorage.removeItem('onboarding_dashboard_<uid>')`
- `src/components/OnboardingTooltip.tsx` — 4-piece overlay (highlighted element stays bright)
  - For measuring targets on web/PWA use `getBoundingClientRect()` (not `measure()`)

## Chat System
Team-wide group chat + direct messages for all roles.

**DM permission rules (safeguarding):**
- Coach / Staff ↔ Athlete: **BLOCKED** — no private messages between adults and minors
- Athlete ↔ Athlete: **BLOCKED**
- All other combinations (coach↔parent, parent↔parent, etc.): allowed

**Screens:**
- `ChatScreen` — group chat, CHAT tab. Header has DM button → DMList modal.
- `DMListScreen` — DM inbox, `onSnapshot` on `dmConversations` where `participants array-contains uid`
- `NewDMScreen` — member picker filtered by `canDM()`, creates conversation doc on first open
- `DMConversationScreen` — params: `{ conversationId, otherName, otherRole }`

**Utilities:**
- `src/lib/dmUtils.ts` — `getDmConversationId(uid1, uid2)`, `canDM(senderRole, targetRole)`
- `src/lib/notifications.ts` — `registerWebPush(uid)`: VAPID push subscription (standalone only); `clearBadge()`: clears home screen icon badge
- **Firestore index required** for `NewDMScreen`: composite index on `users.teamCode` (ascending)

## Communications System

**Model:** Email and push are delivery guarantees — they pull users back to the platform. All content lives in the app.

| From | To | Channel |
|---|---|---|
| Org Admin | Coach | Email — "Your team hub is ready" → deep link |
| Coach | Team (parents) | Push + email on new chat/announcement |
| Coach | Parent | Push + email on new DM |
| Coach → Athlete | — | Blocked (safeguarding) |
| Parent ↔ Parent | Each other | In-app group chat |

**Push notifications (Web Push / VAPID):**
- `public/firebase-messaging-sw.js` — service worker handles `push` events, calls `navigator.setAppBadge()`, handles `notificationclick` to focus/open app
- `clearBadge()` from `notifications.ts` — called in `ChatScreen` and `DMConversationScreen` on mount
- Only registers subscription in `display-mode: standalone` (installed to home screen)
- VAPID public key hardcoded in `src/lib/notifications.ts`; private key in Secret Manager as `VAPID_PRIVATE_KEY`
- Push subscription (JSON) stored in Firestore `users/{uid}.webPushSubscription`
- Cloud Functions use `web-push` npm package to send; `Promise.allSettled` so one bad subscription doesn't block others
- `firebase.json` serves SW with `Service-Worker-Allowed: /` + `Cache-Control: no-cache` headers

**Email notifications:**
- Firebase Trigger Email extension — writes to `mail/{id}` collection, extension delivers
- Minimal format: sender name + message preview + "Open App →" CTA to `leaguematrix.com`
- Triggered by: new chat message, new DM, team invite, coach onboarding

**Install prompt (`src/components/InstallPromptBanner.tsx`):**
- Full-screen modal overlay (not an inline banner) — centered card with dark backdrop
- Shown once on first login (localStorage key `install_prompt_dismissed`); tap outside or X to dismiss
- Android Chrome: `beforeinstallprompt` event → cyan INSTALL APP button triggers native prompt
- iOS Safari: numbered step instructions (Tap Share → Add to Home Screen) + GOT IT button
- Already installed (`display-mode: standalone`): hidden automatically

**Notification preferences:**
- Stored in Firestore `users/{uid}.notificationPrefs: { email: boolean, push: boolean }`
- Default: both `true`
- Coach: toggles in `TeamSettingsSheet` (avatar tap → opens sheet)
- Supporter/Athlete: toggles in `ProfileSheet` (avatar tap → opens sheet)
- Cloud Functions check prefs before sending — skip email if `notificationPrefs.email === false`, skip push if `notificationPrefs.push === false`

## Play Editor (`src/screens/PlayEditorScreen.tsx`)
- **ARROW** tool — route with arrowhead; **DRAW** tool — freehand line, no arrowhead
- `PlayRoute.arrow?: boolean` — only ARROW tool routes have `arrow: true`

## Parks & Rec Admin Demo Layer

### Architecture
- Public landing page: `src/screens/LandingScreen.tsx` — sections: hero, features, how it works, sports, pricing, footer. "Ready to see it in action?" CTA section is currently hidden (`{false && ...}`). Props: `onSignIn` + `onTryDemo`.
- Auth gate: `src/navigation/index.tsx` — `showDemo` state renders `DemoShell` for web unauthenticated
- Demo shell: dark blue banner (#1e3a5f), sidebar on ≥900px, bottom tabs on mobile
- Section state: `useState<AdminSection>` inside `DemoStack` (no React Navigation for demo)
- `AdminSection` type: `'overview' | 'sports' | 'schedule' | 'comms' | 'coaches'`
- Theme toggle: `DemoThemeProvider` (`src/lib/demoTheme.tsx`) defaults to dark (`isDark: true`)

### Light/Dark Admin Theme (`src/lib/adminTheme.ts`)
- `LIGHT_AC` / `DARK_AC` palettes; `ACPalette` type; `useDemoAC()` hook
- `Fonts` re-exported from `../theme`; `AS` spacing object; `AR` radius object

### Data (`src/lib/demoData.ts`)
Org → Sport → League → Teams hierarchy. **Soccer is the only fully-populated sport.**

Key exports:
- `DEMO_ORG` — organization metadata
- `DEMO_SPORTS` — 3 sports; soccer `available: true`, others `available: false`
- `DEMO_LEAGUES` — 10 leagues (7 soccer: Rec U6/U8/U10/U12/U14, Travel U10/U12; 3 stubs)
- `DEMO_TEAMS` — 27 soccer teams; `DemoTeam` type includes `code: string` (5-char, e.g. `RU827`). 9 teams have `status: 'setup'` (pending/claimable by coaches)
- `DEMO_COACHES` — 18 active coaches; `DemoCoach` type with `id`, `teamId`, `leagueId`, `sportId`, `email`, `phone`, `yearsCoaching`
- `DEMO_PENDING_REG = 18` — consistent pending-reg count
- `INITIAL_DEMO_EVENTS` — 12 events with `teamId` for filtering
- `DEMO_ROSTER_PREVIEW` — full rosters for 10 teams, keyed by `teamId`
- `DEMO_CONVOS`, `DEMO_BROADCASTS`, `DEMO_ACTIVITY` — comms demo data

### Demo Screens
All accept `navigate?: (s: AdminSection, param?: string) => void`:

- **`DemoOverviewScreen`** — greeting → Needs Attention → Quick Actions 2×2 → Upcoming Events → Sports list
- **`DemoTeamsScreen`** — 4-level: Sports → Leagues → Teams → **Team Hub**. `localTeams`/`localLeagues` state persists adds within session. Add Team modal: name (required) + coach name (optional) → generates `code` via `generateTeamCode()`. Add Team success state shows generated code with Copy button. **Team Hub** (level 4): coach card, JOIN CODE card (code + Copy button), roster table, upcoming events, quick actions. Team cards in list show code as inline blue pill.
- **`DemoScheduleScreen`** — sport filter pills + 3-col league grid; tap to expand event panel. Draft/publish flow. Custom 3-column time picker.
- **`DemoCommsScreen`** — broadcast compose + DM conversation view
- **`DemoCoachesScreen`** — 3 levels:
  - **Directory**: sport filter pills → coaches grouped by league
  - **Profile**: breadcrumb, header card (sport/league/status badges), contact card, team assignment card (name, league, code badge), **"View as Admin"** full-width solid-primary button, action row (Message, Email Coach)
  - **Coach-view**: dark dashboard simulation — admin banner ("← Back to Admin" + "Admin Preview" badge), dark bg, greeting + team name (cyan Orbitron) + code chip, Next Event card, Quick Actions 2×2 grid, Roster preview, Schedule. Uses `cv` StyleSheet (module-level, dark `Colors.*` tokens). Back button calls `setLevel('profile')`.
  - `initialCoachId?: string` prop for deep-link from other sections

## Firebase Hosting
- Live URL: https://moticoach-907ff.web.app
- Custom domain: leaguematrix.com (GoDaddy → Firebase Quick Setup, A record 199.36.158.100)
- Deploy: `npm run deploy` (or manually: `npx expo export --platform web && firebase deploy --only hosting`)
- **Font fix**: `firebase.json` hosting ignore must use `node_modules/**` (NOT `**/node_modules/**`)

## Firebase Cloud Functions
- `functions/src/index.ts` — Node 22, TypeScript; `firebase-admin` initialized at top of file
- `firebase-functions` version: `^7.0.6` (upgraded from v5 to fix 400 validation errors on deploy)
- `suggestDrill` — HTTPS callable, uses `defineSecret('ANTHROPIC_KEY')`
- `onTeamChatMessage` — Firestore trigger on `teamChats/{teamCode}/messages`; sends push (web-push) + email (mail collection) to all team members except sender; checks `notificationPrefs` per user
- `onDmMessage` — Firestore trigger on `dmConversations/{convId}/messages`; sends push + email to the other participant
- Email delivery: Firebase **Trigger Email** extension (install from Firebase Console → Extensions) reads `mail/{id}` collection and delivers
- Push delivery: `web-push` npm package in functions; VAPID keys via Secret Manager
- Deploy functions: `cd functions && npm run build && cd .. && firebase deploy --only functions`
- Set secrets: `firebase functions:secrets:set ANTHROPIC_KEY` / `firebase functions:secrets:set VAPID_PRIVATE_KEY`

## Conventions
- `SafeAreaView` from `react-native-safe-area-context` with `edges={['top']}`
- `StyleSheet.create` at bottom of each file
- Functional components with hooks only
- `useNavigation<any>()` and `useRoute<any>()` for navigation/params
- Web clipboard: `navigator.clipboard?.writeText(text).catch(() => {})` (no expo-clipboard)
- Web file upload: `document.createElement('input')` with `type='file'` (no expo-image-picker)
- Max content width: `maxWidth: 800, alignSelf: 'center', width: '100%'` wrapper for landscape centering
