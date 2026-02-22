import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme';
import { useCoach } from '../context/CoachContext';

import DashboardScreen  from '../screens/DashboardScreen';
import CalendarScreen   from '../screens/CalendarScreen';
import MotiScreen       from '../screens/MotiScreen';
import PlaymakerScreen  from '../screens/PlaymakerScreen';
import PrepBookScreen   from '../screens/PrepBookScreen';
import PlayEditorScreen from '../screens/PlayEditorScreen';

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Desaturation HOC ────────────────────────────────────────────────────────
// Native screens render in their own native view hierarchy, so a filter on a
// parent wrapper View won't cascade through. Instead we wrap each screen's
// root with a filtered View from inside the screen's own render context.

function withFilter(Screen: React.ComponentType<any>) {
  return function FilteredScreen(props: any) {
    const { greyScale } = useCoach();
    return (
      <View style={{ flex: 1, filter: [{ saturate: 1 - greyScale }] }}>
        <Screen {...props} />
      </View>
    );
  };
}

// ─── Tab Bar Icon ─────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ icon, label, focused }: { icon: IoniconsName; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={icon}
        size={22}
        color={focused ? Colors.cyan : Colors.muted}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ─── Tab Navigator ───────────────────────────────────────────────────────────

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="HOME"   icon="flash-outline"            focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={withFilter(CalendarScreen)}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="EVENTS" icon="calendar-outline"          focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Moti"
        component={withFilter(MotiScreen)}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="MOTI"   icon="sparkles-outline"         focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Playmaker"
        component={withFilter(PlaymakerScreen)}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="PLAYS"  icon="clipboard-outline"        focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stack (allows full-screen modals over tabs) ────────────────────────

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="PrepBook"
          component={withFilter(PrepBookScreen)}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="PlayEditor"
          component={withFilter(PlayEditorScreen)}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(4,8,18,0.98)',
    borderTopWidth: 1,
    borderTopColor: Colors.border2,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabIcon: { alignItems: 'center', gap: 3 },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  tabLabelFocused: { color: Colors.cyan },
});
