import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase'; // Adjust path if needed

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync(userId: string) {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    // In Expo Go or Development, we might not have a Project ID, and that's okay.
    // We should fail gracefully if we can't get the token.

    try {
        let token;
        if (projectId) {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId,
            });
            token = tokenData.data;
        } else {
            // Try without project ID (might fail in bare workflow but works in some managed contexts)
            // or just log warning and exit for dev
            console.log('No EAS Project ID found. Push notifications may not work in development/Expo Go.');
            // Attempt to get token anyway, let it fail if needed but catch it
            const tokenData = await Notifications.getExpoPushTokenAsync();
            token = tokenData.data;
        }

        console.log('Expo Push Token obtained:', token);

        if (token) {
            // Save token to Supabase
            const { error } = await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', userId);

            if (error) console.error('Error saving push token:', error);

            return token;
        }
    } catch (e: any) {
        // Silently fail in dev for expected errors
        if (e.message.includes('No "projectId" found') || e.message.includes('Expo Go')) {
            console.log('Push notification registration skipped (Dev/Expo Go environment issue):', e.message);
        } else {
            console.error('Error getting push token:', e);
        }
    }
}
