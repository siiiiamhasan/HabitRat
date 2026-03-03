import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, deleteDoc, getDocs } from 'firebase/firestore';
import NotificationService from '../services/NotificationService';

export interface Habit {
    id: string;
    name: string;
    target: string;
    icon: string;
    targetTime?: string; // e.g. "09:00". If set, notifications are automated.
    reminderEnabled?: boolean;
}

export interface UserProfile {
    id: string;
    name: string;
    username: string;
    avatar: string;
    joinedDate: string;
    following: number;
    followers: number;
}

// Simplified Reminder Config - No longer used as array, but kept for type compatibility during migration if needed
// or we can remove it if we fully migrate. Let's keep a simplified version for valid time checking.
export const isValidTime = (time: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);

export interface Logs {
    [date: string]: {
        [habitId: string]: boolean;
    };
}

export interface CompletionRecord {
    [date: string]: {
        [habitId: string]: string; // ISO timestamp
    };
}

export interface Message {
    id: string;
    text: string;
    senderId: string; // 'me' or 'other'
    timestamp: string;
}

export interface Chat {
    id: string;
    name: string;
    avatar: string;
    messages: Message[];
    unreadCount: number;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    participants: number;
    type: 'friend' | 'worldwide' | 'event';
    duration: string;
    joined: boolean;
    host: string;
    avatar: string;
    communityTag?: string;
    start_date?: string;
    end_date?: string;
}

interface HabitState {
    habits: Habit[];
    logs: Logs;
    completionRecords: CompletionRecord;
    user: UserProfile;
    isPremium: boolean;
    globalNotificationIds: { dailyCheck?: string; midDay?: string };
    scheduleGlobalNotifications: () => Promise<void>;
    streak: number;
    diamonds: number;
    lastRefillDate: string | null;
    adsWatchedToday: number;
    lastAdWatchDate: string | null;

    hasRatedApp: boolean;
    lastRatePromptDate: string | null;
    rateApp: () => boolean;
    snoozeRateApp: () => void;

    showStreakPopup: boolean;
    setShowStreakPopup: (show: boolean) => void;
    setPremium: (status: boolean) => void;
    spendDiamonds: (amount: number) => boolean;
    watchAd: () => Promise<boolean>;
    checkMonthlyRefill: () => void;
    updateUser: (profile: Partial<UserProfile>) => void;
    addHabit: (habit: Omit<Habit, 'id'>) => Promise<boolean>;
    updateHabit: (habit: Habit) => void;
    createNewLog: (date: Date | string | number) => void;
    removeHabit: (id: string) => Promise<void>;
    toggleHabit: (date: string, habitId: string) => Promise<void>;
    getCompletionPercentage: (date: string | Date | number) => number;
    getHabitStatus: (date: string | Date | number, habitId: string) => boolean;

    // Statistics & Analytics
    getCurrentStreak: () => number;
    getBestStreak: () => number;
    getTotalCompletions: () => number;
    getOverallSuccessRate: () => number;
    getMonthlySuccessRate: (date: Date) => number;
    getMonthlyTotalCompletions: (date: Date) => number;
    getYearlyTotalCompletions: (year: number) => number;
    getYearlySuccessRate: (year: number) => number;
    getDailyCompletionStats: (days_count: number) => number[];
    getHabitConsistency: (habitId: string) => number;
    checkStreak: () => void;
    populateDummyData: () => void;

    lastRewardClaimed: number;
    claimReward: (streak: number, type: string) => void;



    // Language
    language: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn';
    setLanguage: (lang: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn') => void;

    // Auth
    isAuthenticated: boolean;
    login: () => Promise<void>; // Mock login
    logout: () => Promise<void>; // Mock logout

    // Data Sync (Local only now)
    fetchUserProfile: () => Promise<void>;
    fetchHabits: () => Promise<void>;
    fetchLogs: () => Promise<void>;

    // Challenges (Local only)
    challenges: Challenge[];
    fetchChallenges: () => Promise<void>;
    joinChallenge: (challengeId: string) => Promise<boolean>;
    createChallenge: (challenge: Omit<Challenge, 'id' | 'participants' | 'joined' | 'host' | 'avatar'>) => Promise<boolean>;

    // Reminders
    // Automated Reminders
    updateHabitNotification: (habitId: string, enabled: boolean, time?: string) => void;
    notificationSettings: {
        smartReminders: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
        followUpReminders: boolean;
        eveningCheck: boolean;
        streakRescue: boolean;
    };
    notificationIds: Record<string, string[]>;
    // removed old reminder methods
    updateNotificationSettings: (settings: Partial<HabitState['notificationSettings']>) => void;
    toggleSmartReminders: () => void;
}

const DEFAULT_HABITS: Habit[] = [
    { id: '1', name: 'Email', target: 'Inbox Zero', icon: '📧', targetTime: '09:00', reminderEnabled: true },
    { id: '2', name: 'Work', target: '2 hours', icon: '💼', targetTime: '10:00', reminderEnabled: true },
    { id: '3', name: 'Code', target: '1 hour', icon: '💻', targetTime: '14:00', reminderEnabled: true },
    { id: '4', name: 'Relax', target: '1 ep', icon: '📺', targetTime: '20:00', reminderEnabled: false },
    { id: '5', name: 'Gym', target: '45 mins', icon: '🏋️', targetTime: '07:00', reminderEnabled: true },
    { id: '6', name: 'Read', target: '30 mins', icon: '📖', targetTime: '21:00', reminderEnabled: true },
    { id: '7', name: 'Water', target: '2L', icon: '💧', targetTime: '08:00', reminderEnabled: true },
];

const DEFAULT_USER: UserProfile = {
    id: 'guest_user',
    name: 'Sarah Johnson',
    username: '@sarahjohnson',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    joinedDate: new Date().toISOString(),
    following: 0,
    followers: 0,
};

export const useHabitStore = create<HabitState>()(
    persist(
        (set, get) => ({
            habits: DEFAULT_HABITS,

            logs: {},
            completionRecords: {},
            challenges: [], // Initialize challenges

            // Auth State
            isAuthenticated: true, // Auto-login as guest
            user: DEFAULT_USER,

            isPremium: false,
            streak: 0,
            lastStreakCheck: null,
            diamonds: 0,
            lastRefillDate: null,
            adsWatchedToday: 0,
            lastAdWatchDate: null,



            // Rate App Logic
            hasRatedApp: false,
            lastRatePromptDate: null,

            showStreakPopup: false,
            setShowStreakPopup: (show) => set({ showStreakPopup: show }),

            lastRewardClaimed: 0,
            claimReward: (streak, type) => set({ lastRewardClaimed: streak }),

            // Reminders Init

            notificationSettings: {
                smartReminders: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '07:00',
                followUpReminders: false,
                eveningCheck: false,
                streakRescue: false,
            },

            // Global Notifications
            globalNotificationIds: {},

            notificationIds: {},

            // Language
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),

            login: async () => {
                try {
                    // For now, continue using guest structure but prepare for real auth
                    set({ isAuthenticated: true });
                } catch (error) {
                    console.error("Login error:", error);
                }
            },

            logout: async () => {
                set({ isAuthenticated: false });
            },

            // Subscriber to listen for real-time updates
            subscribeToHabits: () => {
            },

            setPremium: async (status) => {
                set(state => {
                    if (!status) {
                        // Downgrading: Reset premium settings
                        return {
                            isPremium: false,
                            notificationSettings: {
                                ...state.notificationSettings,
                                smartReminders: false,
                                followUpReminders: false,
                                eveningCheck: false,
                                streakRescue: false,
                            }
                        };
                    }
                    return { isPremium: true };
                });

                try {
                    const userDocRef = doc(db, "users", "guest");
                    await setDoc(userDocRef, { isPremium: status }, { merge: true });
                } catch (error) {
                    console.error("Error saving premium status:", error);
                }
            },

            spendDiamonds: (amount) => {
                const { diamonds } = get();
                if (diamonds >= amount) {
                    set(state => ({ diamonds: state.diamonds - amount }));
                    return true;
                }
                return false;
            },

            watchAd: async () => {
                const { adsWatchedToday } = get();
                if (adsWatchedToday >= 5) return false;

                // Simulate Ad
                await new Promise(resolve => setTimeout(resolve, 2000));

                set(state => ({
                    diamonds: state.diamonds + 4,
                    adsWatchedToday: state.adsWatchedToday + 1,
                    lastAdWatchDate: new Date().toISOString()
                }));
                return true;
            },

            rateApp: () => {
                const { hasRatedApp } = get();
                if (hasRatedApp) return false;

                set(state => ({
                    hasRatedApp: true,
                    diamonds: state.diamonds + 50
                }));
                return true;
            },

            snoozeRateApp: () => {
                set({ lastRatePromptDate: new Date().toISOString() });
            },

            checkMonthlyRefill: () => {
                const { isPremium, lastRefillDate } = get();
                if (!isPremium) return;

                const today = new Date();
                const last = lastRefillDate ? parseISO(lastRefillDate) : null;

                if (!last || differenceInCalendarDays(today, last) >= 30) {
                    set(state => ({
                        diamonds: state.diamonds + 200,
                        lastRefillDate: today.toISOString()
                    }));
                }
            },

            updateUser: (updates) => set((state) => ({
                user: { ...state.user, ...updates }
            })),

            fetchUserProfile: async () => {
                try {
                    const userDocRef = doc(db, "users", "guest");
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        if (data.isPremium !== undefined) {
                            set({ isPremium: data.isPremium });
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            },

            fetchHabits: async () => {
                try {
                    const userDocRef = doc(db, "users", "guest");
                    const habitsSnapshot = await getDocs(collection(userDocRef, "habits"));
                    const fetchedHabits: Habit[] = [];

                    habitsSnapshot.forEach((doc) => {
                        fetchedHabits.push(doc.data() as Habit);
                    });

                    if (fetchedHabits.length > 0) {
                        set({ habits: fetchedHabits });
                    }
                } catch (error) {
                    console.error("Error fetching habits:", error);
                }
            },

            fetchLogs: async () => {
                try {
                    const userDocRef = doc(db, "users", "guest");
                    // We structure logs as a subcollection 'logs' where document ID is the date
                    const logsSnapshot = await getDocs(collection(userDocRef, "logs"));
                    const fetchedLogs: Logs = {};

                    logsSnapshot.forEach((doc) => {
                        fetchedLogs[doc.id] = doc.data() as { [habitId: string]: boolean };
                    });

                    set({ logs: fetchedLogs });
                    get().checkStreak(); // Update streak after fetching
                } catch (error) {
                    console.error("Error fetching logs:", error);
                }
            },

            addHabit: async (habit) => {
                const { habits, isPremium } = get();
                if (!isPremium && habits.length >= 10) return false;

                const tempId = Date.now().toString();
                const newHabit = { ...habit, id: tempId, user_id: 'guest' };

                // Optimistic update
                set(state => ({ habits: [...state.habits, newHabit as any] }));

                try {
                    // Persist to Firestore
                    // Assuming a 'users' collection with a document for the current user/guest
                    // and a 'habits' field which is an array of habit objects.
                    // For a robust app, habits should likely be a subcollection.
                    // For this simple port, we'll try to stick to the existing structure if possible,
                    // but Firestore documents have size limits. Subcollection is better.

                    // Let's use a subcollection 'habits' under the user document.
                    const userDocRef = doc(db, "users", "guest");
                    await setDoc(doc(userDocRef, "habits", tempId), newHabit);

                } catch (error) {
                    console.error("Error adding habit to Firestore:", error);
                    // Rollback if needed
                    return false;
                }

                // Schedule default notifications
                const { notificationSettings } = get();
                NotificationService.scheduleReminders(newHabit, 9, 0, [0, 1, 2, 3, 4, 5, 6], notificationSettings.smartReminders).then(ids => {
                    if (notificationSettings.followUpReminders || notificationSettings.eveningCheck || notificationSettings.streakRescue) {
                        NotificationService.scheduleDailyFollowUps(newHabit, '09:00', notificationSettings.smartReminders).then(followUpIds => {
                            const allIds = [...ids, ...Object.values(followUpIds)];
                            set(state => ({
                                notificationIds: {
                                    ...state.notificationIds,
                                    [tempId]: allIds
                                }
                            }));
                        });
                    } else {
                        set(state => ({
                            notificationIds: {
                                ...state.notificationIds,
                                [tempId]: ids
                            }
                        }));
                    }
                });


                return true;
            },

            updateHabit: async (updatedHabit) => {
                set((state) => ({
                    habits: state.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h)
                }));

                try {
                    const userDocRef = doc(db, "users", "guest");
                    await setDoc(doc(userDocRef, "habits", updatedHabit.id), updatedHabit, { merge: true });
                } catch (error) {
                    console.error("Error updating habit:", error);
                }
            },

            createNewLog: (date) => set((state) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                if (state.logs[dateKey]) return state; // Already exists
                return { logs: { ...state.logs, [dateKey]: {} } };
            }),

            removeHabit: async (id) => {
                // Optimistic update
                set(state => ({ habits: state.habits.filter(h => h.id !== id) }));

                // Cancel all notifications for this habit
                // TODO: Store notification IDs to cancel specifically.

                try {
                    const userDocRef = doc(db, "users", "guest");
                    await deleteDoc(doc(userDocRef, "habits", id));
                } catch (error) {
                    console.error("Error removing habit:", error);
                }
            },

            toggleHabit: async (date, habitId) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                const { logs } = get();

                const dayLog = logs[dateKey] || {};
                const newStatus = !dayLog[habitId];

                // Optimistic update
                set((state) => {
                    const currentCompletionRecords = state.completionRecords[dateKey] || {};
                    const updatedCompletionRecords = { ...currentCompletionRecords };

                    if (newStatus) {
                        updatedCompletionRecords[habitId] = new Date().toISOString();
                    } else {
                        delete updatedCompletionRecords[habitId];
                    }

                    return {
                        logs: {
                            ...state.logs,
                            [dateKey]: { ...dayLog, [habitId]: newStatus }
                        },
                        completionRecords: {
                            ...state.completionRecords,
                            [dateKey]: updatedCompletionRecords
                        }
                    };
                });
                get().checkStreak();

                try {
                    const userDocRef = doc(db, "users", "guest");
                    const logRef = doc(userDocRef, "logs", dateKey);

                    // We use setDoc with merge: true to update specific fields in the day's log document
                    await setDoc(logRef, { [habitId]: newStatus }, { merge: true });
                } catch (error) {
                    console.error("Error toggling habit:", error);
                }

                // Handle Notification Logic
                const habit = get().habits.find(h => h.id === habitId);
                const { notificationSettings } = get();

                if (habit) {
                    const currentNotificationIds = get().notificationIds[habitId] || [];

                    if (newStatus) {
                        // Habit COMPLETED: Cancel follow-ups for TODAY (12h, 7pm, 10pm)
                        // This prevents "Do it now!" messages when already done.
                        if (currentNotificationIds.length > 0) {
                            currentNotificationIds.forEach(id => NotificationService.cancelNotification(id));
                            // Clear stored IDs
                            set(state => ({
                                notificationIds: {
                                    ...state.notificationIds,
                                    [habitId]: []
                                }
                            }));
                        }
                    } else {
                        // Habit UN-COMPLETED: Re-schedule follow-ups based on TARGET TIME
                        const primaryTime = habit.targetTime || '09:00';

                        // Only schedule if enabled for this habit and global settings allow
                        if (habit.reminderEnabled && (notificationSettings.followUpReminders || notificationSettings.eveningCheck || notificationSettings.streakRescue)) {
                            NotificationService.scheduleDailyFollowUps(habit, primaryTime, notificationSettings.smartReminders).then(idMap => {
                                const ids = Object.values(idMap);
                                if (ids.length > 0) {
                                    set(state => ({
                                        notificationIds: {
                                            ...state.notificationIds,
                                            [habitId]: ids
                                        }
                                    }));
                                }
                            });
                        }
                    }
                }
            },

            // Automated Reminders
            updateHabitNotification: (habitId, enabled, time) => {
                // Free User Logic: Habits are always enabled (unless system blocked).
                // If they try to disable it, we force it true.
                // The UI alerts them, but data layer ensures consistency.
                const isPremium = get().isPremium;
                if (!isPremium) {
                    enabled = true;
                }

                set(state => ({
                    habits: state.habits.map(h =>
                        h.id === habitId
                            ? { ...h, reminderEnabled: enabled, targetTime: time ?? h.targetTime ?? '09:00' }
                            : h
                    )
                }));

                // Re-schedule based on new settings
                const habit = get().habits.find(h => h.id === habitId);
                if (habit) {
                    const { notificationIds } = get();
                    // Cancel existing for this habit
                    const existingIds = notificationIds[habitId] || [];
                    existingIds.forEach(id => NotificationService.cancelNotification(id));

                    if (enabled) {
                        const targetTime = time || habit.targetTime || '09:00';
                        const [h, m] = targetTime.split(':').map(Number);
                        const { notificationSettings } = get();

                        // Schedule Main Reminder (Daily)
                        NotificationService.scheduleReminders(habit, h, m, [0, 1, 2, 3, 4, 5, 6], notificationSettings.smartReminders).then(ids => {
                            // Schedule Follow-ups (Daily Logic for Today)
                            // Schedule Follow-ups (Only if enabled in settings)
                            if (notificationSettings.followUpReminders || notificationSettings.eveningCheck || notificationSettings.streakRescue) {
                                NotificationService.scheduleDailyFollowUps(habit, targetTime, notificationSettings.smartReminders).then(followUpIds => {
                                    const allIds = [...ids, ...Object.values(followUpIds)];
                                    set(state => ({
                                        notificationIds: {
                                            ...state.notificationIds,
                                            [habitId]: allIds
                                        }
                                    }));
                                });
                            } else {
                                // Just save the main reminder IDs
                                set(state => ({
                                    notificationIds: {
                                        ...state.notificationIds,
                                        [habitId]: ids
                                    }
                                }));
                            }
                        });
                    } else {
                        // Clear IDs
                        set(state => ({
                            notificationIds: {
                                ...state.notificationIds,
                                [habitId]: []
                            }
                        }));
                    }
                }
            },

            updateNotificationSettings: (settings) => set((state) => {
                const newSettings = { ...state.notificationSettings, ...settings };
                // Free User: Premium global settings are forced OFF
                if (!state.isPremium) {
                    newSettings.smartReminders = false;
                    newSettings.followUpReminders = false;
                    newSettings.eveningCheck = false;
                    newSettings.streakRescue = false;
                }
                return { notificationSettings: newSettings };
            }),

            toggleSmartReminders: () => set((state) => ({
                notificationSettings: {
                    ...state.notificationSettings,
                    smartReminders: !state.notificationSettings.smartReminders
                }
            })),

            fetchChallenges: async () => {
                // Local challenges check?
                set({ challenges: [] });
            },

            joinChallenge: async (challengeId) => {
                // Local only
                return true;
            },

            createChallenge: async (challenge) => {
                // Local only
                return true;
            },

            getCompletionPercentage: (date) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                const dateKey = format(new Date(date), 'yyyy-MM-dd');
                const dayLogs = logs[dateKey] || {};
                const completedCount = habits.filter(h => dayLogs[h.id]).length;

                return completedCount / habits.length;
            },

            getHabitStatus: (date, habitId) => {
                const logs = get().logs;
                const dateKey = typeof date === 'string' ? date : format(new Date(date), 'yyyy-MM-dd');
                return logs[dateKey]?.[habitId] || false;
            },

            // --- Statistics Implementation ---

            getTotalCompletions: () => {
                const { logs } = get();
                let count = 0;
                Object.values(logs).forEach(dayLog => {
                    Object.values(dayLog).forEach(status => {
                        if (status) count++;
                    });
                });
                return count;
            },

            getOverallSuccessRate: () => {
                const { logs, habits } = get();
                const totalHabits = habits.length;
                const loggedDays = Object.keys(logs).length;

                if (totalHabits === 0 || loggedDays === 0) return 0;

                const totalCompletions = get().getTotalCompletions();
                const possibleCompletions = totalHabits * loggedDays;

                return Math.round((totalCompletions / possibleCompletions) * 100);
            },

            getMonthlySuccessRate: (date: Date) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                const today = new Date();
                const isCurrentMonth = date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                const isFuture = date > today;

                if (isFuture && !isCurrentMonth) return 0;

                const year = date.getFullYear();
                const month = date.getMonth();

                // Determine how many days to count
                // If past month: count all days in month
                // If current month: count days up to today
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const daysToCount = isCurrentMonth ? today.getDate() : daysInMonth;

                let completedCount = 0;
                let potentialCount = daysToCount * habits.length;

                if (potentialCount === 0) return 0;

                for (let day = 1; day <= daysToCount; day++) {
                    const currentDay = new Date(year, month, day);
                    const dateKey = format(currentDay, 'yyyy-MM-dd');
                    const dayLog = logs[dateKey] || {};

                    // Count successes for this day
                    completedCount += habits.filter(h => dayLog[h.id]).length;
                }

                return Math.round((completedCount / potentialCount) * 100);
            },

            getMonthlyTotalCompletions: (date: Date) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                const year = date.getFullYear();
                const month = date.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                let completedCount = 0;
                for (let day = 1; day <= daysInMonth; day++) {
                    const currentDay = new Date(year, month, day);
                    const dateKey = format(currentDay, 'yyyy-MM-dd');
                    const dayLog = logs[dateKey] || {};
                    completedCount += habits.filter(h => dayLog[h.id]).length;
                }
                return completedCount;
            },

            getYearlyTotalCompletions: (year: number) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                let completedCount = 0;
                // Iterate through all logs and check if they belong to the year
                Object.keys(logs).forEach(dateKey => {
                    if (parseISO(dateKey).getFullYear() === year) {
                        const dayLog = logs[dateKey];
                        completedCount += habits.filter(h => dayLog[h.id]).length;
                    }
                });
                return completedCount;
            },

            getYearlySuccessRate: (year: number) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                const today = new Date();
                const isCurrentYear = year === today.getFullYear();
                const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

                // For past years, we count all days. For current year, up to today.
                const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
                const daysToCount = isCurrentYear ? dayOfYear : daysInYear;

                const potentialCompletions = daysToCount * habits.length;
                if (potentialCompletions === 0) return 0;

                const totalCompletions = get().getYearlyTotalCompletions(year);

                return Math.round((totalCompletions / potentialCompletions) * 100);
            },

            getDailyCompletionStats: (days_count: number) => {
                const { habits, logs } = get();
                if (habits.length === 0) return Array(days_count).fill(0);

                const stats: number[] = [];
                const today = new Date();

                for (let i = days_count - 1; i >= 0; i--) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayLogs = logs[dateKey] || {};
                    const completedCount = habits.filter(h => dayLogs[h.id]).length;

                    // Avoid division by zero, but length check handled above
                    stats.push(Math.round((completedCount / habits.length) * 100));
                }
                return stats;
            },

            getHabitConsistency: (habitId: string) => {
                const { logs } = get();
                const daysToCheck = 30;
                let completedCount = 0;
                const today = new Date();

                for (let i = 0; i < daysToCheck; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    if (logs[dateKey]?.[habitId]) {
                        completedCount++;
                    }
                }

                return Math.round((completedCount / daysToCheck) * 100);
            },

            getCurrentStreak: () => {
                const { logs } = get();
                // A streak requires at least one habit checked per day.

                const hasActivity = (dateKey: string) => {
                    const log = logs[dateKey];
                    if (!log) return false;
                    return Object.values(log).some(v => v === true);
                };

                const today = new Date();
                const todayKey = format(today, 'yyyy-MM-dd');

                let streak = 0;
                let checkDate = today;

                // Check today
                if (hasActivity(todayKey)) {
                    streak++;
                    checkDate = new Date(today.getTime() - 86400000); // 1 day before
                } else {
                    checkDate = new Date(today.getTime() - 86400000); // Start from yesterday
                }

                while (true) {
                    const key = format(checkDate, 'yyyy-MM-dd');
                    if (hasActivity(key)) {
                        streak++;
                        checkDate = new Date(checkDate.getTime() - 86400000);
                    } else {
                        break;
                    }
                }
                return streak;
            },

            getBestStreak: () => {
                const { logs } = get();
                const sortedDates = Object.keys(logs).sort(); // Ascending
                if (sortedDates.length === 0) return 0;

                let maxStreak = 0;
                let currentStreak = 0;
                let prevDate: Date | null = null;

                const hasActivity = (log: any) => Object.values(log).some(v => v === true);

                for (const dateKey of sortedDates) {
                    const log = logs[dateKey];
                    if (!hasActivity(log)) {
                        // Break streak if logged but no activity?
                        // Yes, strictly speaking, empty log = 0% activity.
                        currentStreak = 0;
                        prevDate = parseISO(dateKey);
                        continue;
                    }

                    const currentDate = parseISO(dateKey);

                    if (!prevDate) {
                        currentStreak = 1;
                    } else {
                        const diff = differenceInCalendarDays(currentDate, prevDate);
                        if (diff === 1) {
                            currentStreak++;
                        } else if (diff === 0) {
                            // Same day? Should not happen with keys
                        } else {
                            // Gap > 1 day
                            currentStreak = 1;
                        }
                    }

                    if (currentStreak > maxStreak) maxStreak = currentStreak;
                    prevDate = currentDate;
                }

                return maxStreak;
            },

            checkStreak: () => {
                const currentStreak = get().getCurrentStreak();
                set({ streak: currentStreak });
            },



            scheduleGlobalNotifications: async () => {
                const { globalNotificationIds } = get();

                // Cancel existing to be safe
                if (globalNotificationIds?.midDay) await NotificationService.cancelNotification(globalNotificationIds.midDay);
                if (globalNotificationIds?.dailyCheck) await NotificationService.cancelNotification(globalNotificationIds.dailyCheck);

                // Schedule 1 PM (13:00) Mid-day
                const midDayId = await NotificationService.scheduleDailyNotification(
                    "Keep it up! ☀️",
                    "Don't forget to check your habits today.",
                    13, 0
                );

                // Schedule 10 PM (22:00) Check-in
                const dailyCheckId = await NotificationService.scheduleDailyNotification(
                    "Daily Check-in 🌙",
                    "Time to review your progress! Did you complete everything?",
                    22, 0
                );

                set({
                    globalNotificationIds: {
                        dailyCheck: dailyCheckId,
                        midDay: midDayId
                    }
                });
            },

            populateDummyData: () => {
                const { habits } = get();
                const dummyLogs: Logs = {};
                const today = new Date();

                // Generate last 14 days
                for (let i = 1; i <= 14; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    dummyLogs[dateKey] = {};

                    habits.forEach(h => {
                        // 70% chance of being completed
                        // Some days completely empty to break streaks
                        if (Math.random() > 0.3) {
                            dummyLogs[dateKey][h.id] = true;
                        }
                    });
                }
                set({ logs: dummyLogs });
                get().checkStreak(); // Update streak immediately
            }
        }),
        {
            name: 'habit-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
