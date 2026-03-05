# Current Sprint — Game Day Live + Org Demo Prep

## What We Built

### Game Day Live — Coach Access
- `src/screens/DashboardScreen.tsx` — Added **Game Day** tool card (amber, `radio-outline` icon) to `DASH_TOOLS`
- `src/navigation/index.tsx` — Registered `GameDayLive` in `DashboardTabStack` so coaches can reach it from the tools grid

### Game Day Live — Engagement Upgrade
- `src/screens/GameDayLiveScreen.tsx` — Major enhancements:
  - **Fallback roster** (`DEMO_PLAYERS`) — 9 mock soccer players shown when Firestore `teams/{teamCode}/roster` is empty (e.g. demo team GG354)
  - **Sport-specific cheer picker** — tapping a player opens a modal with 5 sport-specific cheers (soccer, basketball, football, baseball, volleyball). Closes on cheer tap; shoutout count increments.
  - **Pulsing glow ring** — `Animated.loop` pulse behind the LIVE TAP button while session is active; stops on pause/end
  - **Tap progress dots** — 3 dots above the button show progress toward the next cheer point (3 taps = 1 point)
  - **Streak counter** — rapid taps within 1.5s build a streak; `🔥 N STREAK!` replaces hint text when streak ≥ 3; auto-clears after 2s
  - **Player cell pop animation** — spring scale bounce on player cell when a cheer is sent
  - `useCoach` imported for `coachSport` to drive sport-specific cheer lists

### PrepBook — Print Sideline Sheet
- `src/screens/PrepBookScreen.tsx` — Added **PRINT SIDELINE SHEET** button on the Final Check step (web only)
  - **Game prep sheet**: Starters/Subs lineup with captain badge, absent/injured list, Game Focus priorities, Scout notes
  - **Practice plan sheet**: Roster attendance (two-column present list + absent/injured), Drill plan with durations/notes, Training Focus themes, Equipment checklist
  - Opens in a new browser tab with clean light-background HTML; `window.print()` fires after 300ms (allows print-to-paper or Save as PDF)

### PrepBook — Event Picker (previously completed)
- `src/screens/DashboardScreen.tsx` — `PrepBookPickerSheet` intercepts the Prep Book tools card tap
  - Shows upcoming game/practice events; tap navigates to PrepBook with `eventType` + `eventTitle` params
  - Fallback buttons: GAME PREP (amber) / PRACTICE PLAN (green) for prep without a specific event

### Stat Tracker — Navigation Fix (previously completed)
- `src/screens/StatTrackerSummaryScreen.tsx` — SAVE & EXIT and EXIT WITHOUT SAVING buttons now use `navigation.popToTop()` (was `navigate('Tabs')` which silently failed in CoachTabs context)

### Demo Layer — testcoach@mail.com Full Access
- Firestore `teams/GG354` — `isPaid: true` set via REST API (unlocks PrepBook, individual stat tracking, all paid features)
- `src/screens/DemoCoachesScreen.tsx` — 3 interactive sub-levels added to coach-view Quick Actions:
  - `playbook` — 6 demo plays with filter tabs and field thumbnails
  - `stat-demo` — live score bar + 6 stat tiles + tappable player rows with ✓ RECORDED flash
  - `live-taps` — animated LIVE TAP button + 9-player shoutout grid

---

## Firestore Collections Touched

| Collection | Change | Purpose |
|---|---|---|
| `teams/GG354` | `isPaid: true` | Enables paid features for demo coach |
| `teams/{teamCode}/gameEngagements` | Write on session end | Stores liveTaps, livePoints, shoutouts, sessionDurationSec |

---

## Files Modified This Sprint

| File | Status | Notes |
|---|---|---|
| `src/screens/GameDayLiveScreen.tsx` | Modified | Fallback roster, cheer picker, animations, streak |
| `src/screens/DashboardScreen.tsx` | Modified | Game Day tool card + PrepBook event picker |
| `src/screens/PrepBookScreen.tsx` | Modified | Print sideline sheet (game + practice) |
| `src/screens/StatTrackerSummaryScreen.tsx` | Modified | `popToTop()` navigation fix |
| `src/screens/DemoCoachesScreen.tsx` | Modified | 3 new interactive demo sub-levels |
| `src/navigation/index.tsx` | Modified | GameDayLive registered in DashboardTabStack |

---

## Open / Next Steps

- **Athlete self-signup removed** — `ROLE_OPTIONS` in `RoleSelectScreen.tsx` only has coach + supporter. Navigation still handles existing athlete accounts. Decision pending: restore self-signup or keep admin-provisioned only.
- Wire HYPE cards to real Firestore roster data (currently mock)
- Add Firestore security rules for `teams/{teamCode}/gameEngagements` (write: supporter/staff; read: team members)
- Roster card JERSEY/POSITION data is placeholder (`#--`, `—`) — needs Firestore wire-up
- `hype-card.html` prototype can be retired once the in-app version is fully wired
