# CURRENT_SPRINT.md

Sprint Name: Game Day Live Engagement
Completed: 2026-03-01

## Objective
Implement supporter live engagement during games — Live Taps, targeted player shoutouts, session timer management, and post-game athlete dashboard display.

## What Was Built

### GameDayLiveScreen (`src/screens/GameDayLiveScreen.tsx`) — NEW FILE
Full supporter session screen. Session flows through states: `pregame → active → paused → ended`.

- **Pregame gate**: "Has the game started?" confirmation before session starts
- **One-session-per-day lock**: localStorage key `gdl_done_{teamCode}_{uid}_{date}` blocks re-entry after a session is submitted; shows "SESSION SUBMITTED — check back for the next game day" screen
- **2-hour countdown timer**: `setInterval` via `useRef` (same pattern as StatTrackerLiveScreen)
- **15-minute warning modal**: prompts to extend +30 or +60 minutes; resets if extended past threshold
- **Halftime pause/resume**: PAUSE button in header stops timer; RESUME resumes
- **Live Taps button**: pinned sticky bottom; amber button with scale pulse animation; raw tap count + cheer points (÷3) displayed in stats bar
- **3-column shoutout grid**: roster loaded from Firestore `teams/{teamCode}/roster`; sorted alphabetically; tap a player cell → increments local count; amber count badge on cell; cells disabled during pause
- **End Session button**: in scroll area below shoutout grid (intentionally separated from Live Tap button to prevent accidental taps); red border/tint with stop icon; requires confirmation modal
- **Batch upload on end**: writes to `teams/{teamCode}/gameEngagements/{autoId}` — `submittedAt`, `submittedBy`, `liveTaps`, `livePoints`, `shoutouts: Record<string, number>`, `sessionDurationSec`, `teamCode`; sets localStorage lock on success
- **Upload error recovery**: retry button retries the upload with the same local session data

### SupporterHomeScreen (`src/screens/SupporterHomeScreen.tsx`) — MODIFIED
- `GameDayLiveCard` upgraded from static "COMING SOON" placeholder to a tappable `TouchableOpacity` that navigates to `GameDayLive`
- Amber border, live dot, `TAP TO JOIN` CTA label

### AthleteProfileScreen (`src/screens/AthleteProfileScreen.tsx`) — MODIFIED
- **FAN SUPPORT card**: inserted between hero card and roster card; listens via `onSnapshot` on `teams/{teamCode}/gameEngagements` (latest 1, desc); shows team live taps + cheer points always; personal shoutout pip row shown only if `myShoutouts > 0`
- **Celebration modal**: fires once per engagement per athlete (localStorage key `seen_engagement_{teamCode}_{id}_{uid}`); shows shoutout count with "YOUR FANS SHOWED UP!" headline; only fires if `myShoutouts > 0` (athletes with 0 shoutouts see team stats but no modal)

### Navigation (`src/navigation/index.tsx`) — MODIFIED
- `GameDayLiveScreen` imported and registered in `SupporterStack` with `slide_from_bottom` animation

## Firestore Schema Added

```
teams/{teamCode}/gameEngagements/{engagementId}
  submittedAt:        Timestamp
  submittedBy:        string          ← supporter uid
  submittedByName:    string
  liveTaps:           number          ← raw tap count
  livePoints:         number          ← Math.floor(liveTaps / 3)
  shoutouts:          Record<string, number>   ← { "Alex Johnson": 4 }
  sessionDurationSec: number
  teamCode:           string
```

## Design Decisions Made
- **Local-first during game**: all data held in React state; no Firestore writes until session ends (avoids real-time write scaling risk)
- **Shoutouts keyed by athlete display name** (not uid): roster entries may have no associated user account
- **Supporters only participate**: athletes are playing, coaches are coaching — only supporters drive engagement
- **Athletes are passive recipients**: FAN SUPPORT card is read-only; athletes see team taps + personal shoutout count; no tap/shoutout controls on athlete screen
- **One session per day per user**: localStorage gate prevents duplicate submissions; resets at midnight (key includes date string)
- **End Session separated from Live Tap**: End Session lives in the scroll area below the shoutout grid; Live Tap is pinned at the bottom — accidental taps prevented by distance and scroll requirement

## Out of Scope (unchanged)
- Chat system
- Advanced moderation
- Stat integration
- Multi-game aggregation

## Open Items / Next Sprint Candidates
- Firestore security rules for `teams/{teamCode}/gameEngagements` (write: authenticated team member; read: all team members)
- Future: when `isPaid` + individual stat tracking active, highlight "in game" players in shoutout grid with green tint + "IN" chip
- Multiple supporters submitting separate sessions aggregate independently (athlete sees latest); future: merge/aggregate across submissions
