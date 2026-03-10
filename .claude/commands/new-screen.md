Scaffold a new screen for the moticoach project. The screen name is provided as the argument (e.g. `/new-screen MyFeatureScreen`).

Follow these conventions exactly:

**File location:** `src/screens/<ScreenName>.tsx`

**Template structure:**
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing, Radius } from '../theme';

export default function <ScreenName>() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* content */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    padding: Spacing.md,
  },
});
```

**After creating the file, remind me to:**
1. Import and register the screen in `src/navigation/index.tsx` in the appropriate stack
2. Add a `navigation.navigate('ScreenName')` call from wherever it should be triggered
3. If it needs route params, define them in the params list at the top of navigation/index.tsx

Ask me for any context needed (which role sees it, which stack it belongs to, what params it needs).
