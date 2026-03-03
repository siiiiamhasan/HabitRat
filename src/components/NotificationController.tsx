import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import NotificationService from '../services/NotificationService';

export const NotificationController = () => {
    const notificationListener = useRef<Notifications.Subscription>(undefined);
    const responseListener = useRef<Notifications.Subscription>(undefined);
    const navigation = useNavigation<any>();

    useEffect(() => {
        // 1. Register for permissions on mount
        NotificationService.registerForPushNotificationsAsync();

        // 2. Listen for incoming notifications (foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log("Notification Received:", notification);
        });

        // 3. Listen for user interaction (tapping notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.habitId) {
                // Navigate to habit details. Adjust route name as per your navigation structure
                // Assuming 'MainTabs' -> 'Home' or similar. 
                // For now, let's just navigate to root.
                // If deep linking handles specific screens, add logic here.
                console.log("Tapped notification for:", data.habitId);
                // Example: navigation.navigate('HabitDetail', { id: data.habitId });
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, []);

    return null;
};
