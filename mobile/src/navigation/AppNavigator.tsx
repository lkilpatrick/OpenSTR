import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { getAccessToken } from '../lib/storage';

import LoginScreen from '../screens/auth/LoginScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import ActiveSessionScreen from '../screens/session/ActiveSessionScreen';
import StandardsScreen from '../screens/standards/StandardsScreen';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  ActiveSession: { sessionId: string };
};

export type TabParamList = {
  Schedule: undefined;
  Standards: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Standards" component={StandardsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => setIsAuthenticated(!!token));
  }, []);

  if (isAuthenticated === null) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLoginSuccess={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ActiveSession" component={ActiveSessionScreen} options={{ headerShown: true, title: 'Active Session' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
