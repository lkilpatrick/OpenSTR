import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { getAccessToken, clearAccessToken } from '../lib/storage';
import { api, setOnUnauthenticated } from '../lib/api';

import LoginScreen from '../screens/auth/LoginScreen';
import ScheduleScreen from '../screens/schedule/ScheduleScreen';
import ActiveSessionScreen from '../screens/session/ActiveSessionScreen';
import StandardsScreen from '../screens/standards/StandardsScreen';

export type RootStackParamList = {
  Loading: undefined;
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

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Standards" component={StandardsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');

  useEffect(() => {
    setOnUnauthenticated(() => setAuthState('unauthenticated'));

    async function validateSession() {
      try {
        const token = await getAccessToken();
        if (!token) {
          setAuthState('unauthenticated');
          return;
        }
        await api.get('/api/auth/get-session');
        setAuthState('authenticated');
      } catch {
        await clearAccessToken();
        setAuthState('unauthenticated');
      }
    }

    validateSession();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authState === 'loading' ? (
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : authState === 'unauthenticated' ? (
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreen
                {...props}
                onLoginSuccess={() => setAuthState('authenticated')}
              />
            )}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="ActiveSession"
              component={ActiveSessionScreen}
              options={{ headerShown: true, title: 'Active Session' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
