import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { StatusBar } from 'expo-status-bar';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatDetailScreen from './src/screens/ChatDetailScreen';

import UserSearchScreen from './src/screens/UserSearchScreen';
import UserListScreen from './src/screens/UserListScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';

import { useEffect } from 'react';
import { useHabitStore } from './src/store/useHabitStore';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { syncUserData } from './src/utils/sync';

import * as Notifications from 'expo-notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  const user = useHabitStore(state => state.user);
  const habits = useHabitStore(state => state.habits);
  const notificationSettings = useHabitStore(state => state.notificationSettings);

  // Notification Listener
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap
      console.log('Notification tapped:', response);
    });
    return () => subscription.remove();
  }, []);

  // Sync & Register
  useEffect(() => {
    // Only register if:
    // 1. User is logged in
    // 2. User has at least one habit
    // 3. User has enabled notifications in settings
    if (user?.id && habits.length > 0 && notificationSettings.notificationsEnabled) {
      registerForPushNotificationsAsync(user.id);

      // Subscribe to store changes for sync
      const unsub = useHabitStore.subscribe((state) => {
        if (state.user?.id) {
          syncUserData(state.user.id, state.habits, state.logs, state.notificationSettings);
        }
      });
      return () => unsub();
    }
  }, [user?.id, habits.length, notificationSettings.notificationsEnabled]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="UserSearch" component={UserSearchScreen} />
          <Stack.Screen name="UserList" component={UserListScreen} />
          <Stack.Screen name="Terms" component={TermsScreen} />
          <Stack.Screen name="Privacy" component={PrivacyScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
