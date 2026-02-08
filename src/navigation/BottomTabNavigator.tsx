import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, MessageSquare, User, BarChart3 } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../constants/theme';

export type BottomTabParamList = {
    Home: undefined;

    Analytics: undefined;
    Profile: undefined;
};

const Tab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.text,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.background,
                    borderTopColor: theme.colors.border,
                    height: 90,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarShowLabel: true,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                    tabBarLabel: 'Home'
                }}
            />
            <Tab.Screen
                name="Analytics"
                component={AnalyticsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
                    tabBarLabel: 'Analytics'
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
                    tabBarLabel: 'Profile'
                }}
            />
        </Tab.Navigator>
    );
}
