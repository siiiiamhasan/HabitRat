import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Users, MessageSquare, User } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import SocialScreen from '../screens/SocialScreen';
import InboxScreen from '../screens/InboxScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { theme } from '../constants/theme';

export type BottomTabParamList = {
    Home: undefined;
    Social: undefined;
    Inbox: undefined;
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
                name="Social"
                component={SocialScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                    tabBarLabel: 'Social'
                }}
            />
            <Tab.Screen
                name="Inbox"
                component={InboxScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
                    tabBarLabel: 'Inbox'
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
