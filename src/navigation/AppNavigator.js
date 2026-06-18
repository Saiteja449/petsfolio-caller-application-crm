import Text from '../components/AppText';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet, Platform } from 'react-native';

import CallLogsScreen from '../screens/CallLogsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import LeadsScreen from '../screens/LeadsScreen';
import CallDetailsScreen from '../screens/CallDetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import ActiveCallScreen from '../screens/ActiveCallScreen';
import { useAuth } from '../context/AuthContext';

import { Colors } from '../styles/Colors';
import { Fonts } from '../styles/Fonts';
import { HistoryIcon, AnalyticsIcon, ContactsIcon } from '../icons/Icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={styles.tabIconContainer}>
    {icon}
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
      {label}
    </Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen
      name="Leads"
      component={LeadsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon
            icon={
              <ContactsIcon
                size={22}
                color={focused ? Colors.primary : Colors.tabInactive}
              />
            }
            label="Leads"
            focused={focused}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Calls"
      component={CallLogsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon
            icon={
              <HistoryIcon
                size={22}
                color={focused ? Colors.primary : Colors.tabInactive}
              />
            }
            label="Calls"
            focused={focused}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Analytics"
      component={AnalyticsScreen}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon
            icon={
              <AnalyticsIcon
                size={22}
                color={focused ? Colors.primary : Colors.tabInactive}
              />
            }
            label="Analytics"
            focused={focused}
          />
        ),
      }}
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.root}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen name="CallDetails" component={CallDetailsScreen} />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthenticated && (
        <>
          <IncomingCallScreen />
          <ActiveCallScreen />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 12,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: Fonts.family.medium,
    color: Colors.tabInactive,
    marginTop: 4,
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontFamily: Fonts.family.bold,
  },
});

export default AppNavigator;
