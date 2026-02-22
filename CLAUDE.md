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
- Firebase ^12
- react-native-safe-area-context, react-native-reanimated, react-native-svg

## Project Structure
```
src/
  screens/        # All screen components (no subdirectories)
  navigation/     # index.tsx — tab navigator + stack modals
  theme/          # index.ts — Colors, Fonts, Radius, Spacing
  context/        # CoachContext.tsx — global state (coachSport, greyScale)
  lib/            # firebase.ts
  components/     # OnboardingTooltip.tsx
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

## Navigation
Bottom tabs: Dashboard, Calendar, Moti, Tools.
Modal stack screens: Roster, StatTrackerSetup, StatTrackerLive, StatTrackerSummary, Playmaker, PrepBook, PlayEditor.
Navigate with `navigation.navigate('ScreenName', { params })`.

## Conventions
- `SafeAreaView` from `react-native-safe-area-context` with `edges={['top']}`
- `StyleSheet.create` at bottom of each file
- Functional components with hooks only
- `useNavigation<any>()` and `useRoute<any>()` for navigation/params

## Team / Roster
- `TEAM_CODE` exported from `RosterScreen.tsx` — used on dashboard and roster header
- Mock roster data lives in `RosterScreen.tsx` (no Firebase persistence yet)

## Onboarding System
- `src/hooks/useOnboarding.ts` — `useOnboarding(key, totalSteps)` hook
  - Backed by `localStorage` (`onboarding_<key>`) — persists dismissal across sessions
  - Returns `{ step, next, dismiss, isDone }`
  - To reset during dev: `localStorage.removeItem('onboarding_<key>')` in browser console
- `src/components/OnboardingTooltip.tsx` — reusable tooltip overlay
  - Props: `visible`, `step`, `totalSteps`, `title`, `body`, `targetLayout`, `arrowSide`, `onNext`, `onDismiss`
  - Uses 4-piece overlay so the highlighted element stays fully bright (not dimmed)
  - Highlight ring + callout card with arrow, step dots, NEXT/GOT IT/SKIP buttons
  - For measuring targets on web/PWA use `getBoundingClientRect()` (not `measure()`)
- Dashboard onboarding key: `'dashboard'` — 3 steps: MOTI, team code, navigation bar

## Stat Tracker Feature
Three-screen flow: Setup → Live → Summary.

**StatTrackerSetupScreen** exports:
- `StatTrackerConfig` type (sport, teamName, opponentName, totalPeriods, periodLabel, periodShort, periodType, trackingMode, isHomeTeam, players)
- `PeriodType`: `'halves' | 'quarters' | 'innings' | 'sets'`
- `SPORT_STATS`, `BASEBALL_BATTING_STATS`, `BASEBALL_PITCHING_STATS`, `PERIOD_CONFIG`

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
