import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { StatusBar } from 'expo-status-bar';

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatDetailScreen from './src/screens/ChatDetailScreen';

import LoginScreen from './src/screens/LoginScreen';
import UserSearchScreen from './src/screens/UserSearchScreen';
import UserListScreen from './src/screens/UserListScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import { useHabitStore } from './src/store/useHabitStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const isAuthenticated = useHabitStore(state => state.isAuthenticated);
  const initializeAuth = useHabitStore(state => state.initializeAuth);
  const subscribeToMessages = useHabitStore(state => state.subscribeToMessages);
  const fetchChats = useHabitStore(state => state.fetchChats);

  React.useEffect(() => {
    const init = async () => {
      await initializeAuth();
      // After auth init, start listening
      subscribeToMessages();
      fetchChats();
    };
    init();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="UserSearch" component={UserSearchScreen} />
            <Stack.Screen name="UserList" component={UserListScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
          </Stack.Navigator>
        )}
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
