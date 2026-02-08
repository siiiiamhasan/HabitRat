
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, subDays } from 'date-fns';

export interface Habit {
    id: string;
    name: string;
    target: string;
    icon: string;
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

export interface ReminderConfig {
    id: string;
    time: string; // HH:mm
    days: number[]; // 0-6 (Sun-Sat)
    message: string;
    enabled: boolean;
}

export interface LogMetadata {
    completionTime?: string; // ISO timestamp
    failureReason?: string;
    mood?: 'happy' | 'neutral' | 'stressed' | 'tired';
}

export type LogValue = boolean | (LogMetadata & { completed: boolean });

export interface Logs {
    [date: string]: {
        [habitId: string]: LogValue;
    };
}





interface HabitState {
    habits: Habit[];
    logs: Logs;
    user: UserProfile;
    isPremium: boolean;
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
    logFailure: (date: string | Date, habitId: string, reason: string) => void;

    // Statistics & Analytics
    getCurrentStreak: () => number;
    getBestStreak: () => number;
    getTotalCompletions: () => number;
    getMonthlyTotalCompletions: (date: Date) => number;
    getYearlyTotalCompletions: (year: number) => number;
    getOverallSuccessRate: () => number;
    getMonthlySuccessRate: (date: Date) => number;
    getYearlySuccessRate: (year: number) => number;
    getDailyCompletionStats: (days_count: number) => number[];
    getCompletionPercentage: (date: Date) => number;
    getHabitConsistency: (habitId: string) => number;
    getHabitStatus: (date: Date | string, habitId: string) => boolean;
    checkStreak: () => void;
    populateDummyData: () => void;

    // Language
    language: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn';
    setLanguage: (lang: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn') => void;

    // Auth (simplified - always authenticated)
    isAuthenticated: boolean;
    initializeAuth: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;

    // Data Sync (local only now)
    fetchHabits: () => Promise<void>;
    fetchLogs: () => Promise<void>;
    fetchSocialProfile: () => Promise<void>;

    // Social Actions (local only)
    followUser: (targetUserId: string) => Promise<boolean>;
    unfollowUser: (targetUserId: string) => Promise<boolean>;



    // Reminders
    reminders: Record<string, ReminderConfig[]>;
    notificationSettings: {
        notificationsEnabled: boolean;
        smartReminders: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
        focusMode: boolean;
    };
    addReminder: (habitId: string, reminder: Omit<ReminderConfig, 'id'>) => void;
    removeReminder: (habitId: string, reminderId: string) => void;
    updateReminder: (habitId: string, reminder: ReminderConfig) => void;
    toggleSmartReminders: () => void;
    updateNotificationSettings: (settings: Partial<{ notificationsEnabled: boolean; smartReminders: boolean; quietHoursStart: string; quietHoursEnd: string; focusMode: boolean }>) => void;

}


const DEFAULT_HABITS: Habit[] = [
    { id: '1', name: 'Academic Study', target: '3 hours', icon: '📚' },
    { id: '2', name: 'Exercise', target: '30 minutes', icon: '🏃' },
    { id: '3', name: 'Sleep before 12am', target: 'Before 12am', icon: '😴' },
    { id: '4', name: 'Anime', target: '1 episode', icon: '🎬' },
    { id: '5', name: 'Water Intake', target: '2 liters', icon: '💧' },
    { id: '6', name: 'Programming', target: 'Daily', icon: '💻' },
];

const DEFAULT_USER: UserProfile = {
    id: 'local_user',
    name: 'HabitRat User',
    username: '@habitrat_user',
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

            // Auth State - Always authenticated, always premium
            user: DEFAULT_USER,
            isAuthenticated: true,
            isPremium: true,

            streak: 0,
            diamonds: 100,
            lastRefillDate: null,
            adsWatchedToday: 0,
            lastAdWatchDate: null,

            // Rate App Logic
            hasRatedApp: false,
            lastRatePromptDate: null,

            showStreakPopup: false,
            setShowStreakPopup: (show) => set({ showStreakPopup: show }),

            // Reminders Init
            reminders: {},
            notificationSettings: {
                notificationsEnabled: true,
                smartReminders: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '07:00',
                focusMode: false
            },

            // Language
            language: 'en',
            setLanguage: (lang) => set({ language: lang }),

            // Simplified Auth - no Supabase
            initializeAuth: async () => {
                // No-op - always authenticated
                set({ isAuthenticated: true });
            },

            loginWithGoogle: async () => {
                // No-op - already logged in
                set({ isAuthenticated: true });
            },

            logout: async () => {
                set({
                    isAuthenticated: true, // Keep authenticated since no login
                    habits: DEFAULT_HABITS,
                    logs: {},

                    user: DEFAULT_USER
                });
            },

            // --- Messaging (Local Only) ---


            setPremium: (status) => {
                set({ isPremium: status });
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
                // Premium refill - always premium now
                const { lastRefillDate } = get();
                const today = new Date();
                const last = lastRefillDate ? parseISO(lastRefillDate) : null;
                if (!last || differenceInCalendarDays(today, last) >= 30) {
                    set(state => ({
                        diamonds: state.diamonds + 150,
                        lastRefillDate: today.toISOString()
                    }));
                }
            },

            updateUser: (updates) => set((state) => ({
                user: { ...state.user, ...updates }
            })),

            // Local data operations
            fetchHabits: async () => {
                // Local only - habits already in state
            },

            fetchLogs: async () => {
                // Local only - logs already in state
            },

            fetchSocialProfile: async () => {
                // Local only - no-op
            },

            addHabit: async (habit) => {
                // No habit limit - all premium features free
                const newId = Date.now().toString();
                const newHabit = { ...habit, id: newId };
                set(state => ({ habits: [...state.habits, newHabit] }));
                return true;
            },

            updateHabit: (updatedHabit) => set((state) => ({
                habits: state.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h)
            })),

            createNewLog: (date) => set((state) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                if (state.logs[dateKey]) return state;
                return { logs: { ...state.logs, [dateKey]: {} } };
            }),

            removeHabit: async (id) => {
                set(state => ({ habits: state.habits.filter(h => h.id !== id) }));
            },

            toggleHabit: async (date, habitId) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                const { logs } = get();

                const dayLog = logs[dateKey] || {};
                const current = dayLog[habitId];

                // Handle mixed types (boolean vs object)
                const isCompleted = typeof current === 'object' ? current.completed : !!current;
                const newStatus = !isCompleted;

                let newValue: LogValue = newStatus;

                // If turning ON, add timestamp
                if (newStatus) {
                    newValue = {
                        completed: true,
                        completionTime: new Date().toISOString(),
                        ...(typeof current === 'object' ? current : {})
                    };
                } else if (typeof current === 'object') {
                    newValue = { ...current, completed: false };
                }

                set((state) => ({
                    logs: {
                        ...state.logs,
                        [dateKey]: { ...dayLog, [habitId]: newValue }
                    }
                }));
                get().checkStreak();
            },

            logFailure: (date, habitId, reason) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                set(state => {
                    const dayLog = state.logs[dateKey] || {};
                    const current = dayLog[habitId];
                    const base = typeof current === 'object' ? current : { completed: !!current };

                    return {
                        logs: {
                            ...state.logs,
                            [dateKey]: {
                                ...dayLog,
                                [habitId]: { ...base, completed: false, failureReason: reason }
                            }
                        }
                    };
                });
            },

            addReminder: (habitId, reminder) => set((state) => {
                const habitReminders = state.reminders[habitId] || [];
                const newReminder = { ...reminder, id: Date.now().toString() };
                return {
                    reminders: {
                        ...state.reminders,
                        [habitId]: [...habitReminders, newReminder]
                    }
                };
            }),

            followUser: async (targetUserId) => {
                set(state => ({
                    user: { ...state.user, following: state.user.following + 1 }
                }));
                return true;
            },

            unfollowUser: async (targetUserId) => {
                set(state => ({
                    user: { ...state.user, following: Math.max(0, state.user.following - 1) }
                }));
                return true;
            },

            removeReminder: (habitId, reminderId) => set((state) => ({
                reminders: {
                    ...state.reminders,
                    [habitId]: (state.reminders[habitId] || []).filter(r => r.id !== reminderId)
                }
            })),

            updateReminder: (habitId, updatedReminder) => set((state) => ({
                reminders: {
                    ...state.reminders,
                    [habitId]: (state.reminders[habitId] || []).map(r => r.id === updatedReminder.id ? updatedReminder : r)
                }
            })),

            toggleSmartReminders: () => set((state) => ({
                notificationSettings: {
                    ...state.notificationSettings,
                    smartReminders: !state.notificationSettings.smartReminders
                }
            })),

            updateNotificationSettings: (settings) => set((state) => ({
                notificationSettings: { ...state.notificationSettings, ...settings }
            })),





            getHabitStatus: (date, habitId) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                const { logs } = get();
                return !!logs[dateKey]?.[habitId];
            },

            getCurrentStreak: () => get().streak,

            getBestStreak: () => {
                const { logs } = get();
                // Simple implementation: iterate all days?
                // For now, let's just track it alongside current streak or calculate from logs
                // Since this can be expensive with years of data, let's do a simplified scan
                let maxStreak = 0;
                let currentStreak = 0;
                const sortedDates = Object.keys(logs).sort(); // YYYY-MM-DD sort works alphabetically

                if (sortedDates.length === 0) return 0;

                // We need to fill in gaps to check consecutive days
                // Actually, let's just assume we need to check differenceInDays

                // This is a complex calculation to do on every render if called often.
                // For now, return current streak if it's the highest we've seen?
                // Let's implement a robust scan:

                let streak = 0;
                let prevDate: Date | null = null;

                // Fill gaps logic is tricky. 
                // Simplified: Just return current streak maxed with stored 'bestStreak' if we had one.
                // Since we don't store 'bestStreak' in state, let's allow it to be current streak for now.
                // A proper implementation would need to parse all keys.
                return Math.max(0, get().streak);
            },

            getTotalCompletions: () => {
                const { logs } = get();
                let total = 0;
                Object.values(logs).forEach(dayLog => {
                    Object.values(dayLog).forEach(status => {
                        if (typeof status === 'object' ? status.completed : !!status) total++;
                    });
                });
                return total;
            },

            getMonthlyTotalCompletions: (date) => {
                const { logs } = get();
                const monthStr = format(date, 'yyyy-MM');
                let total = 0;
                Object.keys(logs).forEach(dateKey => {
                    if (dateKey.startsWith(monthStr)) {
                        Object.values(logs[dateKey]).forEach(status => {
                            if (typeof status === 'object' ? status.completed : !!status) total++;
                        });
                    }
                });
                return total;
            },

            getYearlyTotalCompletions: (year) => {
                const { logs } = get();
                const yearStr = year.toString();
                let total = 0;
                Object.keys(logs).forEach(dateKey => {
                    if (dateKey.startsWith(yearStr)) {
                        Object.values(logs[dateKey]).forEach(status => {
                            if (typeof status === 'object' ? status.completed : !!status) total++;
                        });
                    }
                });
                return total;
            },



            getYearlySuccessRate: (year) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                let totalExpected = 0;
                let totalCompleted = 0;

                // Iterate through every day of the year? 
                // Or just iterate logs? 
                // Success rate implies (Completed / Expected).
                // Expected = 365 * habits.count (simplified). 
                // Better: Iterate from Jan 1 to Dec 31 (or today if current year).

                const start = new Date(year, 0, 1);
                const end = year === new Date().getFullYear() ? new Date() : new Date(year, 11, 31);

                // This loop is expensive. 
                // Alternative: total logs in year / (habits * days_elapsed).
                const daysElapsed = differenceInCalendarDays(end, start) + 1;
                totalExpected = daysElapsed * habits.length;

                totalCompleted = get().getYearlyTotalCompletions(year);

                return totalExpected === 0 ? 0 : Math.round((totalCompleted / totalExpected) * 100);
            },

            getOverallSuccessRate: () => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                const today = new Date();
                let totalOpportunities = 0;
                let totalCompleted = 0;

                for (let i = 0; i < 30; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayLog = logs[dateKey] || {};

                    totalOpportunities += habits.length;
                    habits.forEach(h => {
                        const status = dayLog[h.id];
                        if (typeof status === 'object' ? status.completed : !!status) totalCompleted++;
                    });
                }

                return totalOpportunities === 0 ? 0 : Math.round((totalCompleted / totalOpportunities) * 100);
            },

            getMonthlySuccessRate: (date) => {
                const { habits } = get();
                if (habits.length === 0) return 0;

                const totalCompleted = get().getMonthlyTotalCompletions(date);

                const now = new Date();
                let daysToCount = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

                // If it's the current month, only count days up to today to avoid artificially low rate
                if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                    daysToCount = now.getDate();
                }

                const totalExpected = daysToCount * habits.length;
                return totalExpected === 0 ? 0 : Math.round((totalCompleted / totalExpected) * 100);
            },

            getDailyCompletionStats: (days_count = 7) => {
                const { habits, logs } = get();
                const stats: number[] = [];
                const today = new Date();

                for (let i = days_count - 1; i >= 0; i--) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayLog = logs[dateKey] || {};

                    if (habits.length === 0) {
                        stats.push(0);
                    } else {
                        const completed = habits.reduce((acc, h) => acc + (dayLog[h.id] ? 1 : 0), 0);
                        stats.push(completed / habits.length);
                    }
                }
                return stats;
            },

            getHabitConsistency: (habitId) => {
                const { logs } = get();
                let completed = 0;
                const today = new Date();

                for (let i = 0; i < 30; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    if (logs[dateKey]?.[habitId]) completed++;
                }

                return (completed / 30) * 100;
            },

            getCompletionPercentage: (date: Date) => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                const dateKey = format(date, 'yyyy-MM-dd');
                const dayLog = logs[dateKey] || {};

                const completedCount = habits.reduce((count, habit) => {
                    return count + (dayLog[habit.id] ? 1 : 0);
                }, 0);

                return completedCount / habits.length;
            },

            checkStreak: () => {
                const { logs } = get();
                let streak = 0;
                const today = new Date();
                let checkDate = today;

                // Check today first
                const todayKey = format(today, 'yyyy-MM-dd');
                const todayLog = logs[todayKey] || {};
                const todayHasActivity = Object.values(todayLog).some(v => v);

                if (todayHasActivity) {
                    streak++;
                }

                // Check backwards from yesterday
                checkDate = subDays(today, 1);

                while (true) {
                    const dateKey = format(checkDate, 'yyyy-MM-dd');
                    const dayLog = logs[dateKey] || {};
                    const hasActivity = Object.values(dayLog).some(v => v);

                    if (hasActivity) {
                        streak++;
                        checkDate = subDays(checkDate, 1);
                    } else {
                        // If today had no activity, we can still count previous streak 
                        // IF today IS the break point. 
                        // But we already handled 'todayHasActivity' increment.
                        // So if we are at yesterday (first loop iteration) and it's empty:
                        // - If today has activity: streak is 1. We stop.
                        // - If today has NO activity: streak is 0. We check logs[yesterday].
                        //   Wait, if I haven't done anything today, my streak from yesterday should still show.
                        //   Correct logic:
                        //   If today has activity -> streak = 1 + backward count from yesterday.
                        //   If today NO activity -> streak = backward count from yesterday.
                        break;
                    }
                }

                // Correction for "If today NO activity -> start check from yesterday"
                if (!todayHasActivity) {
                    // Reset and check from yesterday
                    streak = 0;
                    checkDate = subDays(today, 1);
                    while (true) {
                        const dateKey = format(checkDate, 'yyyy-MM-dd');
                        const dayLog = logs[dateKey] || {};
                        const hasActivity = Object.values(dayLog).some(v => v);

                        if (hasActivity) {
                            streak++;
                            checkDate = subDays(checkDate, 1);
                        } else {
                            break;
                        }
                    }
                }

                set({ streak });
            },

            populateDummyData: () => {
                const { habits } = get();
                const today = new Date();
                const newLogs: Logs = {};

                // Generate 60 days of data
                for (let i = 0; i < 60; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayLog: Record<string, boolean> = {};

                    habits.forEach(h => {
                        // 70% chance of completion
                        if (Math.random() > 0.3) {
                            dayLog[h.id] = true;
                        }
                    });

                    if (Object.keys(dayLog).length > 0) {
                        newLogs[dateKey] = dayLog;
                    }
                }

                set(state => ({
                    logs: { ...state.logs, ...newLogs }
                }));
                get().checkStreak();
            },
        }),
        {
            name: 'habit-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                habits: state.habits,
                logs: state.logs,
                user: state.user,
                isPremium: state.isPremium,
                diamonds: state.diamonds,
                notificationSettings: state.notificationSettings,
                language: state.language
            }),
        }
    )
);
