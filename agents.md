# agents.md — Live Session State
> Updated every ~30 min during active coding. Open this in new threads for context.

## Current Focus
_What we're working on right now_

Athlete dashboard polish — AthleteProfileScreen is the athlete landing page, fully built out.

## Recent Changes
_Last few things completed_

- **Fonts**: App-wide migration to Poppins (`@expo-google-fonts/poppins`). All `Fonts.*` constants in `src/theme/index.ts` remapped to Poppins weights. No per-file changes needed.
- **SVG background**: `public/dashboard-bg.svg` added; referenced via CSS `backgroundImage: "url('/dashboard-bg.svg')"` on DashboardScreen and SupporterHomeScreen containers.
- **Hero banner**: Reduced height (minHeight 160→compact), `borderRadius: 28` uniform, `overflow: 'hidden'`. Avatar container is now rectangular (`Radius.lg`, flex:1 fill).
- **AthleteProfileScreen** (`src/screens/AthleteProfileScreen.tsx`): New full-screen athlete dashboard. Serves as Home tab via `AthleteOrSupporterHome` wrapper in navigation. Sections: hero (with badge watermark), roster card, season stats (team/individual mode), achievements, expandable calendar, team comms preview, quick links, ProfileSheet modal.
- **Navigation** (`src/navigation/index.tsx`): `AthleteOrSupporterHome` wrapper routes athletes to `AthleteProfileScreen`, supporters to `SupporterHomeScreen`. `AthleteProfile` added as modal stack screen (slide_from_bottom).
- **SupporterHomeScreen**: Avatar tap is role-aware — athletes → AthleteProfile, supporters → ProfileSheet.
- **Season stats mode**: Reads `teams/{teamCode}.trackingMode` ('individual' | 'team') from Firestore; shows team-stats banner with Games/Wins if 'team'.
- **Team badge watermark**: `badgeIcon`/`badgeColor` from CoachContext rendered at 90px, 50% opacity, right-aligned in hero info row.
- **Expandable calendar**: WeekRow/DayCard components in AthleteProfileScreen, 4 weeks, toggle with "SEE FULL CALENDAR ▼".
- **Team comms preview**: onSnapshot on `teamChats/{teamCode}/messages` (last 3), role-colored sender dots, "VIEW ALL →" to Chat tab.

## In Progress / Open Issues
_Unfinished work, bugs, or blockers_

- Roster card JERSEY/POSITION data is placeholder (`#--`, `—`) — needs to be wired to Firestore roster data when that's available
- Season stats individual values are all placeholder `—` — needs real stat persistence
- Highlights quick link is locked/coming soon

## Key Files Being Touched
_Files actively edited this session_

- `src/screens/AthleteProfileScreen.tsx` — primary athlete dashboard (new)
- `src/screens/SupporterHomeScreen.tsx` — role-aware avatar tap
- `src/navigation/index.tsx` — AthleteOrSupporterHome wrapper + AthleteProfile screen
- `src/theme/index.ts` — Poppins font mapping
- `App.tsx` — Poppins font loading

## Next Steps
_Planned work after current task_

- Wire real roster data (jersey/position) from Firestore into AthleteProfileScreen roster card
- Wire real individual stats from Firestore into season stats columns
- Consider live events from Firestore instead of MOCK_EVENTS

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
