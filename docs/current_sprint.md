# Current Sprint — Layout Polish, PrepBook Review & Role Fixes

## What We Built

### PrepBook — Review Mode
- `src/screens/PrepBookScreen.tsx` — Coaches/staff can now review previously saved PrepBook entries
  - `PrepBookReview` component renders full saved prep: attendance grid (two-column player list with jersey/position, absent/injured badges), drill plan, scout notes, training focus, etc.
  - **Print from review** — PRINT button in review header (web only) generates the same sideline sheet HTML as the completion print
  - `reviewMode` + `reviewEntry` route params enable the screen to open in read-only review mode

### PrepBook — Completion Modal
- `src/screens/PrepBookScreen.tsx` — After tapping CONFIRM READY on the final step, a modal congratulates the coach ("PREP LOCKED IN") and offers VIEW SAVED PREP or GOT IT
- Prep snapshot saved to Firestore `teams/{teamCode}/prepBookEntries` with `serverTimestamp()`; a client-side copy with `Date.now()` is kept for immediate navigation without serialization issues

### PrepBook — Picker UX Redesign
- `src/screens/DashboardScreen.tsx` — `PrepBookPickerSheet` redesigned as a 3-state modal (`choice → new | previous`)
  - **Choice view**: two large cards — START NEW PREP and REVIEW SAVED (with count pill, dimmed if no entries)
  - **New sub-view**: existing event picker + fallback GAME PREP / PRACTICE PLAN buttons
  - **Previous sub-view**: list of saved entries from Firestore `teams/{teamCode}/prepBookEntries`; tap navigates to PrepBook in reviewMode
  - Back chip (`← BACK`) in sub-views returns to choice
- `src/screens/SupporterHomeScreen.tsx` — Staff role now opens the same `PrepBookPickerSheet` (imported and wired via `picker: true` flag on ToolDef)

### Athlete Role — Self-Signup Restored
- `src/screens/RoleSelectScreen.tsx` — ATHLETE option re-added to `ROLE_OPTIONS` with icon, description, and team code entry
- `displayName` fallback correctly resolves to `'Athlete'` for athlete role

### Game Day Live — Demo Account Always Fresh
- `src/screens/GameDayLiveScreen.tsx` — `testcoach@mail.com` bypasses the per-day localStorage gate
  - `isDemo` flag derived from `user?.email`
  - Mount effect skips `already_done` check for demo account
  - Session-end handler skips writing the gate key for demo account
  - Firestore upload still runs normally (engagement data is saved)

### Layout — Web Centering & Horizontal Scroll Fix
- **Root cause**: React Native Web defaults to `overflow: 'visible'` on all Views; any slightly-overflowing element made the entire page horizontally scrollable
- **Fix applied to all screens**: Added `overflow: 'hidden'` to root container style in every screen missing it:
  - `StatTrackerSummaryScreen`, `AchievementsScreen`, `ChatScreen`, `DMListScreen`, `DMConversationScreen`, `NewDMScreen`, `AuthScreen`, `StatTrackerSetupScreen`, `StatTrackerLiveScreen`, `RosterScreen`
- **StatTrackerLiveScreen bars** — Applied outer/inner centering wrapper (`maxWidth: 800, alignSelf: 'center'`) to:
  - Period bar → `periodBarInner`
  - Scoreboard → `scoreboardInner`
  - Controls → `controlsInner`
- **GameDayLiveScreen header** — Same outer/inner centering pattern; `headerInner` constrains BACK + PAUSE/RESUME to 800px
- **GameDayLiveScreen root** — `overflow: 'hidden'` added to `safe` container (this also fixed the header scrolling off-screen on web)

---

## Firestore Collections Touched

| Collection | Change | Purpose |
|---|---|---|
| `teams/GG354` | `isPaid: true` | Enables paid features for demo coach |
| `teams/{teamCode}/gameEngagements` | Write on session end | Stores liveTaps, livePoints, shoutouts, sessionDurationSec |
| `teams/{teamCode}/prepBookEntries` | Write on prep completion | Saves full prep snapshot for review |

---

## Files Modified This Sprint

| File | Notes |
|---|---|
| `src/screens/GameDayLiveScreen.tsx` | Demo gate bypass, header centering, overflow fix |
| `src/screens/PrepBookScreen.tsx` | Review mode, completion modal, print from review, full roster grid |
| `src/screens/DashboardScreen.tsx` | PrepBookPickerSheet redesign (choice/new/previous states) |
| `src/screens/SupporterHomeScreen.tsx` | Staff Prep Book opens picker sheet |
| `src/screens/RoleSelectScreen.tsx` | Athlete role restored to sign-up options |
| `src/screens/StatTrackerLiveScreen.tsx` | overflow fix, period bar / scoreboard / controls centering |
| `src/screens/StatTrackerSummaryScreen.tsx` | overflow fix |
| `src/screens/AchievementsScreen.tsx` | overflow fix |
| `src/screens/ChatScreen.tsx` | overflow fix |
| `src/screens/DMListScreen.tsx` | overflow fix |
| `src/screens/DMConversationScreen.tsx` | overflow fix |
| `src/screens/NewDMScreen.tsx` | overflow fix |
| `src/screens/AuthScreen.tsx` | overflow fix |
| `src/screens/StatTrackerSetupScreen.tsx` | overflow fix |
| `src/screens/RosterScreen.tsx` | overflow fix |

---

## Open / Next Steps

- Wire HYPE cards to real Firestore roster data (currently mock)
- Add Firestore security rules for `teams/{teamCode}/gameEngagements` (write: supporter/staff; read: team members)
- Add Firestore security rules for `teams/{teamCode}/prepBookEntries` (write/read: coach/staff)
- Roster card JERSEY/POSITION data is placeholder (`#--`, `—`) — needs Firestore wire-up
- `hype-card.html` prototype can be retired once the in-app version is fully wired
- PrepBook review: add delete/archive capability for old entries
