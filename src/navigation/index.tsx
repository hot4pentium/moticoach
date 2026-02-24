import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme';
import { useCoach } from '../context/CoachContext';
import { useAuth } from '../context/AuthContext';

// ─── Screens ──────────────────────────────────────────────────────────────────

import DashboardScreen          from '../screens/DashboardScreen';
import CalendarScreen           from '../screens/CalendarScreen';
import ChatScreen               from '../screens/ChatScreen';
import MotiScreen               from '../screens/MotiScreen';
import PlaymakerScreen          from '../screens/PlaymakerScreen';
import PrepBookScreen           from '../screens/PrepBookScreen';
import PlayEditorScreen         from '../screens/PlayEditorScreen';
import ToolsScreen              from '../screens/ToolsScreen';
import RosterScreen             from '../screens/RosterScreen';
import StatTrackerSetupScreen   from '../screens/StatTrackerSetupScreen';
import StatTrackerLiveScreen    from '../screens/StatTrackerLiveScreen';
import StatTrackerSummaryScreen from '../screens/StatTrackerSummaryScreen';
import DMListScreen             from '../screens/DMListScreen';
import DMConversationScreen     from '../screens/DMConversationScreen';
import NewDMScreen              from '../screens/NewDMScreen';
import AuthScreen               from '../screens/AuthScreen';
import RoleSelectScreen         from '../screens/RoleSelectScreen';
import SupporterHomeScreen      from '../screens/SupporterHomeScreen';

// ─── Navigators ──────────────────────────────────────────────────────────────

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Desaturation HOC ────────────────────────────────────────────────────────

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
      <Ionicons name={icon} size={22} color={focused ? Colors.cyan : Colors.muted} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ─── Coach/Staff Tabs ─────────────────────────────────────────────────────────

function CoachTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="HOME"   icon="flash-outline"        focused={focused} /> }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="CHAT"   icon="chatbubble-outline"   focused={focused} /> }}
      />
      <Tab.Screen
        name="Moti"
        component={withFilter(MotiScreen)}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="AWARDS" icon="trophy-outline"       focused={focused} /> }}
      />
      <Tab.Screen
        name="Tools"
        component={withFilter(ToolsScreen)}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="TOOLS"  icon="grid-outline"         focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Supporter/Athlete Tabs ───────────────────────────────────────────────────

function SupporterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}
    >
      <Tab.Screen
        name="Home"
        component={withFilter(SupporterHomeScreen)}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="HOME"   icon="home-outline"         focused={focused} /> }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="CHAT"   icon="chatbubble-outline"   focused={focused} /> }}
      />
      <Tab.Screen
        name="Moti"
        component={withFilter(MotiScreen)}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="AWARDS" icon="trophy-outline"       focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Root Stacks ──────────────────────────────────────────────────────────────

function CoachStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={CoachTabs} />
      {/* DM modals */}
      <Stack.Screen name="DMList"          component={DMListScreen}         options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="NewDM"           component={NewDMScreen}          options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DMConversation"  component={DMConversationScreen} options={{ animation: 'slide_from_right'  }} />
      {/* Coach-only modals */}
      <Stack.Screen name="Roster"              component={withFilter(RosterScreen)}             options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="StatTrackerSetup"    component={withFilter(StatTrackerSetupScreen)}   options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="StatTrackerLive"     component={withFilter(StatTrackerLiveScreen)}    options={{ animation: 'slide_from_right'  }} />
      <Stack.Screen name="StatTrackerSummary"  component={withFilter(StatTrackerSummaryScreen)} options={{ animation: 'slide_from_right'  }} />
      <Stack.Screen name="Playmaker"           component={withFilter(PlaymakerScreen)}          options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="PrepBook"            component={withFilter(PrepBookScreen)}           options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="PlayEditor"          component={withFilter(PlayEditorScreen)}         options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Calendar"            component={withFilter(CalendarScreen)}           options={{ animation: 'slide_from_bottom' }} />
    </Stack.Navigator>
  );
}

function SupporterStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={SupporterTabs} />
      {/* DM modals */}
      <Stack.Screen name="DMList"         component={DMListScreen}         options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="NewDM"          component={NewDMScreen}          options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="DMConversation" component={DMConversationScreen} options={{ animation: 'slide_from_right'  }} />
    </Stack.Navigator>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.cyan} />
      </View>
    );
  }

  if (!user) return <AuthScreen />;
  if (!role) return <RoleSelectScreen />;

  if (role === 'coach' || role === 'staff') return <CoachStack />;
  return <SupporterStack />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Navigation() {
  return (
    <NavigationContainer>
      <AuthGate />
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
  tabIcon:  { alignItems: 'center', gap: 3 },
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
