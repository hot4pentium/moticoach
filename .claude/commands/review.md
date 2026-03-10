Review the recently changed code for correctness and adherence to project conventions.

Read the files that were modified in this session (check agents.md → Key Files Being Touched if unsure), then check each one for:

**Theme**
- [ ] All colors from `Colors.*` — no hardcoded hex values
- [ ] All spacing from `Spacing.*` — no hardcoded numbers for padding/margin
- [ ] All border radii from `Radius.*`
- [ ] Fonts from `Fonts.*` only (orbitron/mono/rajdhani/rajdhaniBold/monoBold)
- [ ] Import: `import { Colors, Fonts, Spacing, Radius } from '../theme'`

**Navigation**
- [ ] No `navigation.navigate('Tabs')` inside CoachTabs — use `navigation.popToTop()` instead
- [ ] New screens registered in the correct stack in `src/navigation/index.tsx`
- [ ] `useNavigation<any>()` and `useRoute<any>()` (not typed variants)

**Layout**
- [ ] `SafeAreaView` from `react-native-safe-area-context` with `edges={['top']}`
- [ ] Wide-screen centering: `maxWidth: 800, alignSelf: 'center', width: '100%'` on content wrapper
- [ ] `StyleSheet.create({})` at the bottom of every file

**Feature gates**
- [ ] PrepBook and individual stat tracking gated behind `isPaid` from `useCoach()`
- [ ] `UpgradePrompt` shown when `!isPaid` tries to access paid features

**Safety**
- [ ] DM safeguarding: coach/staff ↔ athlete blocked (use `canDM()` from `src/lib/dmUtils.ts`)
- [ ] No direct `document.title` mutations (use `NavigationContainer documentTitle` formatter)

**Web**
- [ ] File uploads use `document.createElement('input')` with `type='file'` (not expo-image-picker)
- [ ] Clipboard writes use `navigator.clipboard?.writeText(text).catch(() => {})`

Report any issues found, then suggest fixes.
