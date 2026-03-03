import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Habit } from '../store/useHabitStore';

// Configure notification behavior when the app is in the foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
});

export const REMINDER_CHANNEL_ID = 'habit-reminders';
export const STREAK_WARNING_CHANNEL_ID = 'streak-warnings';

class NotificationService {
    private static instance: NotificationService;

    private constructor() { }

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
                name: 'Habit Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
            await Notifications.setNotificationChannelAsync(STREAK_WARNING_CHANNEL_ID, {
                name: 'Streak Warnings',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 250, 500],
                lightColor: '#FF0000',
            });
        }

        if (Device.isDevice) {
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

            // For local notifications, we don't strictly need the token, 
            // but it's good practice for future remote push integration.
            try {
                const projectId =
                    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                if (!projectId) {
                    // If no project ID (local dev without EAS), just return phantom token
                    return 'local-device-token';
                }
                const tokenData = await Notifications.getExpoPushTokenAsync({
                    projectId,
                });
                return tokenData.data;
            } catch (e) {
                console.warn("Could not get Expo Push Token (might be simulator):", e);
                return undefined;
            }
        } else {
            console.log('Must use physical device for Push Notifications');
            return undefined;
        }
    }

    private getRandomMessage(context: 'reminder' | '12h' | '7pm' | '10pm', habitName: string): { title: string, body: string } {
        const messages = {
            reminder: [
                { title: `Time for ${habitName}! 🏆`, body: `Keep your streak alive! ${habitName} awaits.` },
                { title: `Action Required: ${habitName}`, body: `Consistency is key. Do it for future you!` },
                { title: `Hey! ${habitName} time!`, body: `Small steps lead to big changes.` },
                { title: `${habitName} calling...`, body: `Don't break the chain!` }
            ],
            '12h': [
                { title: `Check-in: ${habitName}`, body: `It's been 12h. Have you done it yet?` },
                { title: `${habitName} update?`, body: `Half the day is gone. Did you finish this?` }
            ],
            '7pm': [
                { title: `Evening Check: ${habitName}`, body: `Don't let the day end without this!` },
                { title: `Wrap up ${habitName}`, body: `Almost bedtime. Finish strong!` }
            ],
            '10pm': [
                { title: `⚠️ Last Call: ${habitName}`, body: `Streak rescue mission! Complete it now!` },
                { title: `Emergency: ${habitName}`, body: `Notifications stopping soon. Do it now!` }
            ]
        };
        const list = messages[context] || messages['reminder'];
        return list[Math.floor(Math.random() * list.length)];
    }

    // Schedule reminders for specific days
    async scheduleReminders(habit: Habit, hour: number, minute: number, days: number[], isSmart: boolean = false): Promise<string[]> {
        const ids: string[] = [];

        const uniqueDays = Array.from(new Set(days)).sort();
        const isEveryDay = uniqueDays.length === 7;

        const message = isSmart
            ? this.getRandomMessage('reminder', habit.name)
            : { title: `Time for ${habit.name}! 🏆`, body: `Keep your streak alive! ${habit.target} awaits.` };

        if (isEveryDay) {
            const trigger: any = {
                hour,
                minute,
                repeats: true,
            };
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: message.title,
                    body: message.body,
                    sound: true,
                    data: { habitId: habit.id, type: 'reminder' },
                    categoryIdentifier: 'habit-reminder',
                },
                trigger,
            });
            ids.push(id);
        } else {
            for (const dayIndex of uniqueDays) {
                // dayIndex is 0 (Sun) to 6 (Sat)
                // Expo weekday is 1 (Sun) to 7 (Sat)
                const weekday = dayIndex + 1;

                const trigger: any = {
                    weekday,
                    hour,
                    minute,
                    repeats: true,
                };

                const id = await Notifications.scheduleNotificationAsync({
                    content: {
                        title: message.title,
                        body: message.body,
                        sound: true,
                        data: { habitId: habit.id, type: 'reminder' },
                        categoryIdentifier: 'habit-reminder',
                    },
                    trigger,
                });
                ids.push(id);
            }
        }

        return ids;
    }

    // Schedule follow-up reminders (12h later, 7 PM, 10 PM)
    // Returns map of type -> notificationId
    // Schedule follow-up reminders for TODAY (One-off)
    async scheduleDailyFollowUps(habit: Habit, primaryTime: string, isSmart: boolean = false): Promise<Record<string, string>> {
        const ids: Record<string, string> = {};
        const now = new Date();
        const [h, m] = primaryTime.split(':').map(Number);

        // 1. 12 Hours Later
        const twelveHourDate = new Date();
        twelveHourDate.setHours(h + 12, m, 0, 0);

        // Limit to "Today" (before midnight)
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        if (twelveHourDate > now && twelveHourDate < endOfDay) {
            const msg = isSmart
                ? this.getRandomMessage('12h', habit.name)
                : { title: `Time to check in on ${habit.name}!`, body: `It's been 12 hours. Have you done it yet?` };

            const id = await this.scheduleOneOffNotification(habit, twelveHourDate, 'followup_12h', msg.title, msg.body);
            if (id) ids['12h'] = id;
        }

        // 2. 7 PM Check (19:00)
        const sevenPmDate = new Date();
        sevenPmDate.setHours(19, 0, 0, 0);
        if (sevenPmDate > now) {
            const msg = isSmart
                ? this.getRandomMessage('7pm', habit.name)
                : { title: `Evening Check: ${habit.name}`, body: `Don't let the day end without this!` };

            const id = await this.scheduleOneOffNotification(habit, sevenPmDate, 'followup_7pm', msg.title, msg.body);
            if (id) ids['7pm'] = id;
        }

        // 3. 10 PM Rescue (22:00)
        const tenPmDate = new Date();
        tenPmDate.setHours(22, 0, 0, 0);
        if (tenPmDate > now) {
            const msg = isSmart
                ? this.getRandomMessage('10pm', habit.name)
                : { title: `⚠️ Last Call: ${habit.name}`, body: `Streak rescue mission! Complete it now!` };

            const id = await this.scheduleOneOffNotification(habit, tenPmDate, 'followup_10pm', msg.title, msg.body);
            if (id) ids['10pm'] = id;
        }

        return ids;
    }

    // Generic Daily Notification (no specific habit)
    async scheduleDailyNotification(title: string, body: string, hour: number, minute: number): Promise<string> {
        const trigger: any = {
            hour,
            minute,
            repeats: true
        };
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: true,
                data: { type: 'daily_global' },
            },
            trigger,
        });
        return id;
    }

    private async scheduleOneOffNotification(habit: Habit, date: Date, type: string, title: string, body: string): Promise<string | undefined> {
        try {
            const trigger: Notifications.DateTriggerInput = {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date
            };
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: true,
                    data: { habitId: habit.id, type },
                    categoryIdentifier: 'habit-followup',
                },
                trigger,
            });
            return id;
        } catch (e) {
            console.log("Error scheduling one-off:", e);
            return undefined;
        }
    }

    // One-off recovery notification for next morning if streak was lost?
    async scheduleRecoveryPrompt(habit: Habit) {
        // Schedule for 9 AM tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `New Day, New Start! caused by ${habit.name}`,
                body: `Don't let yesterday get you down. restart your streak today! 💪`,
                data: { habitId: habit.id, type: 'recovery' }
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tomorrow },
        });
    }

    async cancelNotification(notificationId: string) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    async getAllScheduled() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }
}

export default NotificationService.getInstance();
