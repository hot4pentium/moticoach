import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors, Fonts } from '../theme';

import DashboardScreen  from '../screens/DashboardScreen';
import CalendarScreen   from '../screens/CalendarScreen';
import MotiScreen       from '../screens/MotiScreen';
import PlaymakerScreen  from '../screens/PlaymakerScreen';
import PrepBookScreen   from '../screens/PrepBookScreen';
import PlayEditorScreen from '../screens/PlayEditorScreen';

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Tab Bar Icon ─────────────────────────────────────────────────────────────

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{icon}</Text>
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
          tabBarIcon: ({ focused }) => <TabIcon label="HOME"   icon="⚡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="EVENTS" icon="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Moti"
        component={MotiScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="MOTI"   icon="🤖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Playmaker"
        component={PlaymakerScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="PLAYS"  icon="📋" focused={focused} />,
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
          component={PrepBookScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="PlayEditor"
          component={PlayEditorScreen}
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
  tabIcon: { alignItems: 'center', gap: 2 },
  tabEmoji: { fontSize: 20, opacity: 0.4 },
  tabEmojiFocused: { opacity: 1 },
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
