# agents.md — Live Session State
> Updated every ~30 min during active coding. Open this in new threads for context.

## Current Focus
_What we're working on right now_

Org demo outreach prep — expanded DemoCoachesScreen with 3 interactive sub-levels and unlocked paid features for testcoach@mail.com.

## Recent Changes
_Last few things completed_

- **DemoCoachesScreen** (`src/screens/DemoCoachesScreen.tsx`): Added 3 interactive sub-levels reachable from coach-view Quick Actions: `playbook` (6 demo plays with filter tabs and field thumbnails), `stat-demo` (live score bar + 6 stat tiles + tappable player rows with ✓ RECORDED flash), `live-taps` (animated LIVE TAP button + 6-player shoutout grid). Quick Actions expanded to 5 cards (Stat Tracker, Roster, Playbook, Team Chat, Game Day) — tappable cards have cyan border accent.
- **Firestore** (`teams/GG354`): Set `isPaid: true` via REST API — unlocks PrepBook, individual stat tracking, and all paid features for `testcoach@mail.com`.
- **GameDayLiveScreen** (`src/screens/GameDayLiveScreen.tsx`): New screen. Supporters enter a 2-hour session (pregame confirm → active → paused/halftime → ended). Live Taps button (3 taps = +1 point). 3-column alphabetical shoutout grid for roster players. 15-min extension prompt (+30/+60 min). End session → batch upload to Firestore `teams/{teamCode}/gameEngagements`.
- **SupporterHomeScreen** (`src/screens/SupporterHomeScreen.tsx`): GameDayLiveCard upgraded from static placeholder to a tappable nav button → GameDayLiveScreen.
- **AthleteProfileScreen** (`src/screens/AthleteProfileScreen.tsx`): Added FAN SUPPORT card (shows team live taps + personal shoutout count if > 0). Post-game celebration modal fires once per engagement (localStorage-gated). Uses `onSnapshot` on `teams/{teamCode}/gameEngagements`.
- **Navigation** (`src/navigation/index.tsx`): Registered `GameDayLive` screen in SupporterStack.

## In Progress / Open Issues
_Unfinished work, bugs, or blockers_

- Roster card JERSEY/POSITION data is placeholder (`#--`, `—`) — needs Firestore wire-up
- Season stats individual values are placeholder `—`
- GameDayLiveScreen loads real roster from Firestore `teams/{teamCode}/roster` — if roster is empty (mock-only teams), shows "No players loaded" fallback
- Firestore security rules not yet updated for `teams/{teamCode}/gameEngagements` collection

## Key Files Being Touched
_Files actively edited this session_

- `src/screens/GameDayLiveScreen.tsx` — new screen (created)
- `src/screens/SupporterHomeScreen.tsx` — GameDayLiveCard → navigable button
- `src/screens/AthleteProfileScreen.tsx` — FAN SUPPORT card + celebration modal
- `src/navigation/index.tsx` — GameDayLive registered in SupporterStack

## Next Steps
_Planned work after current task_

- Add Firestore security rules for `teams/{teamCode}/gameEngagements` (write: supporter/staff; read: all team members)
- Wire real roster data (jersey/position) into AthleteProfileScreen roster card
- Future: when `isPaid` + individual stat tracking active, highlight "in game" players in GameDayLiveScreen shoutout grid

## Context / Decisions Made
_Anything that would help a new thread understand why things are the way they are_

- LeagueMatrix pivot complete — MOTI/XP system removed
- Demo layer is for Parks & Rec org admins (not end users)
- Soccer is the only fully-populated sport in demo data
- Push notifications only fire in `display-mode: standalone` (installed PWA)
- All teams are admin-provisioned; coaches claim, never create
- AthleteProfileScreen uses `navigation.canGoBack()` to conditionally show BACK button (hidden when it's the tab root, shown when navigated to as modal)
- `trackingMode` field on team doc controls whether AthleteProfileScreen shows individual stat columns or team-aggregate stats
- Background SVG is in `public/` (not `assets/`) so it gets a clean URL without special characters
