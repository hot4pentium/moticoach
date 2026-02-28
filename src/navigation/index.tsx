import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme';
import { AR, AS, AdminSection, ACPalette } from '../lib/adminTheme';
import { DemoThemeProvider, useDemoTheme } from '../lib/demoTheme';
import { DEMO_ORG } from '../lib/demoData';
import { useCoach, CoachProvider } from '../context/CoachContext';
import { useAuth } from '../context/AuthContext';
import UpdateBanner from '../components/UpdateBanner';
import LandingScreen       from '../screens/LandingScreen';
import DemoOverviewScreen  from '../screens/DemoOverviewScreen';
import DemoTeamsScreen     from '../screens/DemoTeamsScreen';
import DemoScheduleScreen  from '../screens/DemoScheduleScreen';
import DemoCommsScreen     from '../screens/DemoCommsScreen';
import DemoCoachesScreen   from '../screens/DemoCoachesScreen';

// ─── Screens ──────────────────────────────────────────────────────────────────

import DashboardScreen          from '../screens/DashboardScreen';
import CalendarScreen           from '../screens/CalendarScreen';
import ChatScreen               from '../screens/ChatScreen';
import PlaymakerScreen          from '../screens/PlaymakerScreen';
import PrepBookScreen           from '../screens/PrepBookScreen';
import PlayEditorScreen         from '../screens/PlayEditorScreen';
import ToolsScreen              from '../screens/ToolsScreen';
import StatsScreen              from '../screens/StatsScreen';
import HighlightsScreen         from '../screens/HighlightsScreen';
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

const Tab          = createBottomTabNavigator();
const Stack        = createNativeStackNavigator();
const DashStack    = createNativeStackNavigator();
const ChatNavStack = createNativeStackNavigator();
const StatsStack   = createNativeStackNavigator();

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
      <Ionicons name={icon} size={22} color={focused ? Colors.blue : Colors.muted} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ─── Custom Tab Bar (centered on wide screens) ────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { openSettings } = useCoach();
  return (
    <View style={styles.tabBarOuter}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity key={route.key} style={styles.tabItem} onPress={onPress} activeOpacity={0.7}>
              {options.tabBarIcon?.({ focused, color: focused ? Colors.blue : Colors.muted, size: 22 })}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.tabItem} onPress={openSettings} activeOpacity={0.7}>
          <View style={styles.tabIcon}>
            <Ionicons name="settings-outline" size={22} color={Colors.muted} />
            <Text style={styles.tabLabel}>SETTINGS</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Per-tab nested stacks (tab bar stays visible on all sub-screens) ─────────

function DashboardTabStack() {
  return (
    <DashStack.Navigator screenOptions={{ headerShown: false }}>
      <DashStack.Screen name="Dashboard"           component={withFilter(DashboardScreen)} />
      <DashStack.Screen name="Calendar"            component={withFilter(CalendarScreen)}           options={{ animation: 'slide_from_bottom' }} />
      <DashStack.Screen name="Roster"              component={withFilter(RosterScreen)}             options={{ animation: 'slide_from_bottom' }} />
      <DashStack.Screen name="Playmaker"           component={withFilter(PlaymakerScreen)}          options={{ animation: 'slide_from_bottom' }} />
      <DashStack.Screen name="PrepBook"            component={withFilter(PrepBookScreen)}           options={{ animation: 'slide_from_bottom' }} />
      <DashStack.Screen name="PlayEditor"          component={withFilter(PlayEditorScreen)}         options={{ animation: 'slide_from_bottom' }} />
      <DashStack.Screen name="StatTrackerSetup"    component={withFilter(StatTrackerSetupScreen)}   options={{ animation: 'slide_from_bottom' }} />
      <DashStack.Screen name="StatTrackerLive"     component={withFilter(StatTrackerLiveScreen)}    options={{ animation: 'slide_from_right'  }} />
      <DashStack.Screen name="StatTrackerSummary"  component={withFilter(StatTrackerSummaryScreen)} options={{ animation: 'slide_from_right'  }} />
      <DashStack.Screen name="Highlights"          component={HighlightsScreen}                     options={{ animation: 'slide_from_bottom' }} />
    </DashStack.Navigator>
  );
}

function ChatTabStack() {
  return (
    <ChatNavStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatNavStack.Screen name="Chat"           component={ChatScreen} />
      <ChatNavStack.Screen name="DMList"         component={DMListScreen}         options={{ animation: 'slide_from_bottom' }} />
      <ChatNavStack.Screen name="NewDM"          component={NewDMScreen}          options={{ animation: 'slide_from_bottom' }} />
      <ChatNavStack.Screen name="DMConversation" component={DMConversationScreen} options={{ animation: 'slide_from_right'  }} />
    </ChatNavStack.Navigator>
  );
}

function StatsTabStack() {
  return (
    <StatsStack.Navigator screenOptions={{ headerShown: false }}>
      <StatsStack.Screen name="Stats"               component={StatsScreen} />
      <StatsStack.Screen name="StatTrackerSetup"    component={withFilter(StatTrackerSetupScreen)}   options={{ animation: 'slide_from_bottom' }} />
      <StatsStack.Screen name="StatTrackerLive"     component={withFilter(StatTrackerLiveScreen)}    options={{ animation: 'slide_from_right'  }} />
      <StatsStack.Screen name="StatTrackerSummary"  component={withFilter(StatTrackerSummaryScreen)} options={{ animation: 'slide_from_right'  }} />
    </StatsStack.Navigator>
  );
}

// ─── Coach/Staff Tabs ─────────────────────────────────────────────────────────

function CoachTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardTabStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="HOME"   icon="flash-outline"        focused={focused} /> }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatTabStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="CHAT"   icon="chatbubble-outline"   focused={focused} /> }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsTabStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="STATS"  icon="bar-chart-outline"    focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── Supporter/Athlete Tabs ───────────────────────────────────────────────────

function SupporterTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarShowLabel: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
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
    </Tab.Navigator>
  );
}

// ─── Root Stacks ──────────────────────────────────────────────────────────────

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

// ─── Demo Nav Config ──────────────────────────────────────────────────────────

type DemoNavItem = { id: AdminSection; label: string; icon: IoniconsName };

const DEMO_NAV: DemoNavItem[] = [
  { id: 'overview', label: 'Overview',  icon: 'grid-outline'      },
  { id: 'sports',   label: 'Teams',     icon: 'people-outline'    },
  { id: 'schedule', label: 'Schedule',  icon: 'calendar-outline'  },
  { id: 'comms',    label: 'Comms',     icon: 'megaphone-outline' },
  { id: 'coaches',  label: 'Coaches',   icon: 'person-outline'    },
];

// ─── Demo Stack (consumes theme context) ─────────────────────────────────────

function DemoStack({ onExitDemo }: { onExitDemo: () => void }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [section, setSection] = useState<AdminSection>('overview');
  const [sectionParam, setSectionParam] = useState<string | null>(null);
  const { isDark, AC, toggleTheme } = useDemoTheme();

  const ds = useMemo(() => makeDemoStyles(AC), [AC]);

  function navigateTo(s: AdminSection, param?: string) {
    setSection(s);
    setSectionParam(param ?? null);
  }

  const renderScreen = () => {
    switch (section) {
      case 'overview': return <DemoOverviewScreen  navigate={navigateTo} />;
      case 'sports':   return <DemoTeamsScreen     navigate={navigateTo} initialSportId={sectionParam ?? undefined} />;
      case 'schedule': return <DemoScheduleScreen  navigate={navigateTo} />;
      case 'comms':    return <DemoCommsScreen     navigate={navigateTo} />;
      case 'coaches':  return <DemoCoachesScreen   navigate={navigateTo} initialCoachId={sectionParam ?? undefined} />;
    }
  };

  return (
    <View style={[ds.root, { backgroundColor: AC.bg }]}>

      {/* Banner */}
      <View style={ds.demoBanner}>
        <Text style={ds.demaBannerOrg}>{DEMO_ORG.name}</Text>
        <View style={ds.demoBannerBadge}>
          <Text style={ds.demoBannerBadgeTxt}>DEMO</Text>
        </View>
        <View style={{ flex: 1 }} />
        {/* Dark/light toggle */}
        <TouchableOpacity onPress={toggleTheme} style={ds.themeToggle}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={16}
            color={AC.bannerTxt}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onExitDemo}>
          <Text style={ds.demoExitTxt}>← Exit Demo</Text>
        </TouchableOpacity>
      </View>

      {isDesktop ? (
        /* ── Desktop: sidebar + content ─────────────────────────────────── */
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={ds.sidebar}>
            {DEMO_NAV.map(item => {
              const active = section === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[ds.navItem, active && ds.navItemActive]}
                  onPress={() => navigateTo(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={item.icon} size={18} color={active ? AC.navActiveTxt : AC.navInactive} />
                  <Text style={[ds.navLabel, active && ds.navLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ flex: 1 }}>{renderScreen()}</View>
        </View>
      ) : (
        /* ── Mobile: content + bottom tabs ──────────────────────────────── */
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>{renderScreen()}</View>
          <View style={ds.demoBottomTabs}>
            {DEMO_NAV.map(item => {
              const active = section === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={ds.demoBottomTab}
                  onPress={() => navigateTo(item.id)}
                >
                  <Ionicons name={item.icon} size={20} color={active ? AC.primary : AC.navInactive} />
                  <Text style={[ds.demoTabLabel, active && ds.demoTabLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Demo Shell (wraps DemoStack in theme provider) ───────────────────────────

function DemoShell({ onExitDemo }: { onExitDemo: () => void }) {
  return (
    <DemoThemeProvider>
      <DemoStack onExitDemo={onExitDemo} />
    </DemoThemeProvider>
  );
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user, role, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.cyan} />
      </View>
    );
  }

  if (!user) {
    if (Platform.OS === 'web' && showDemo) return <DemoShell onExitDemo={() => setShowDemo(false)} />;
    if (Platform.OS === 'web' && !showAuth) return <LandingScreen onSignIn={() => setShowAuth(true)} onTryDemo={() => setShowDemo(true)} />;
    return <AuthScreen onBack={Platform.OS === 'web' ? () => setShowAuth(false) : undefined} />;
  }
  if (!role) return <RoleSelectScreen />;

  if (role === 'coach' || role === 'staff') return <CoachTabs />;
  return <SupporterStack />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Navigation() {
  return (
    <View style={{ flex: 1 }}>
      <UpdateBanner />
      <NavigationContainer>
        <AuthGate />
      </NavigationContainer>
    </View>
  );
}

// ─── Static styles (app-wide, not theme-dependent) ────────────────────────────

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tabBarInner: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon:  { alignItems: 'center', gap: 3 },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: 7,
    color: Colors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  tabLabelFocused: { color: Colors.blue },
});

// ─── Dynamic demo styles (theme-aware) ────────────────────────────────────────

function makeDemoStyles(AC: ACPalette) {
  return StyleSheet.create({
    root: { flex: 1 },

    demoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: AC.banner,
      paddingHorizontal: AS.xl,
      paddingVertical: 10,
      gap: 10,
    },
    demaBannerOrg:       { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.bannerTxt },
    demoBannerBadge:     { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: AR.sm, paddingHorizontal: 6, paddingVertical: 2 },
    demoBannerBadgeTxt:  { fontFamily: Fonts.monoBold, fontSize: 9, color: AC.bannerTxt, letterSpacing: 1 },
    themeToggle:         { padding: 4, opacity: 0.85 },
    demoExitTxt:         { fontFamily: Fonts.mono, fontSize: 11, color: 'rgba(255,255,255,0.75)', letterSpacing: 0.5 },

    sidebar: {
      width: 200,
      backgroundColor: AC.sidebar,
      borderRightWidth: 1,
      borderRightColor: AC.sidebarBorder,
      paddingVertical: 12,
    },
    navItem: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 11, paddingHorizontal: 16,
      borderRadius: AR.lg, marginHorizontal: 8, marginVertical: 1,
    },
    navItemActive: { backgroundColor: AC.navActive },
    navLabel:      { fontFamily: Fonts.rajdhaniBold, fontSize: 14, color: AC.navInactive },
    navLabelActive:{ color: AC.navActiveTxt },

    demoBottomTabs: {
      flexDirection: 'row',
      backgroundColor: AC.surface,
      borderTopWidth: 1,
      borderTopColor: AC.border,
      paddingBottom: 10,
      paddingTop: 6,
    },
    demoBottomTab:      { flex: 1, alignItems: 'center', gap: 3 },
    demoTabLabel:       { fontFamily: Fonts.mono, fontSize: 8, color: AC.navInactive },
    demoTabLabelActive: { color: AC.primary },
  });
}
