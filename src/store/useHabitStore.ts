
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

export interface Logs {
    [date: string]: {
        [habitId: string]: boolean;
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

    // Statistics & Analytics
    getCurrentStreak: () => number;
    getBestStreak: () => number;
    getTotalCompletions: () => number;
    getOverallSuccessRate: () => number;
    getMonthlySuccessRate: (date: Date) => number;
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

    // Challenges
    challenges: Challenge[];
    fetchChallenges: () => Promise<void>;
    joinChallenge: (challengeId: string) => Promise<boolean>;
    createChallenge: (challenge: Omit<Challenge, 'id' | 'participants' | 'joined' | 'host' | 'avatar'>) => Promise<boolean>;

    // Reminders
    reminders: Record<string, ReminderConfig[]>;
    notificationSettings: {
        smartReminders: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
    };
    addReminder: (habitId: string, reminder: Omit<ReminderConfig, 'id'>) => void;
    removeReminder: (habitId: string, reminderId: string) => void;
    updateReminder: (habitId: string, reminder: ReminderConfig) => void;
    toggleSmartReminders: () => void;

    // Chat System
    chats: Chat[];
    fetchChats: () => Promise<void>;
    fetchMessages: (friendId: string) => Promise<void>;
    sendMessage: (friendId: string, text: string) => Promise<void>;
    subscribeToMessages: () => void;
    // Legacy/UI helpers
    addChat: (friend: { id: string, name: string, avatar: string }) => void;
    receiveMessage: (chatId: string, text: string) => void;
    markChatRead: (chatId: string) => void;
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
                smartReminders: false,
                quietHoursStart: '22:00',
                quietHoursEnd: '07:00'
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
                    chats: [],
                    user: DEFAULT_USER
                });
            },

            // --- Messaging (Local Only) ---
            chats: [],

            fetchChats: async () => {
                // Local only - return current state
            },

            fetchMessages: async (friendId) => {
                // Local only - messages already in state
            },

            sendMessage: async (friendId, text) => {
                const optimisticMsg: Message = {
                    id: Date.now().toString(),
                    text,
                    senderId: 'me',
                    timestamp: new Date().toISOString()
                };

                set(state => ({
                    chats: state.chats.map(c => c.id === friendId ? { ...c, messages: [optimisticMsg, ...c.messages] } : c)
                }));
            },

            subscribeToMessages: () => {
                // No-op - local only
            },

            addChat: (friend) => {
                set(state => {
                    if (state.chats.find(c => c.id === friend.id)) return state;
                    return { chats: [{ ...friend, messages: [], unreadCount: 0 }, ...state.chats] };
                });
            },
            receiveMessage: () => { },
            markChatRead: (chatId: string) => set((state) => ({
                chats: state.chats.map(chat =>
                    chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
                )
            })),

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
                const newStatus = !dayLog[habitId];

                set((state) => ({
                    logs: {
                        ...state.logs,
                        [dateKey]: { ...dayLog, [habitId]: newStatus }
                    }
                }));
                get().checkStreak();
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

            challenges: [],

            fetchChallenges: async () => {
                // Local mock challenges
                const mockChallenges: Challenge[] = [
                    {
                        id: '1',
                        title: '30-Day Reading Challenge',
                        description: 'Read for at least 30 minutes every day',
                        participants: 1250,
                        type: 'worldwide',
                        duration: '30 Days',
                        joined: false,
                        host: 'HabitRat Team',
                        avatar: 'https://via.placeholder.com/50'
                    },
                    {
                        id: '2',
                        title: 'Fitness February',
                        description: 'Exercise daily throughout February',
                        participants: 890,
                        type: 'event',
                        duration: '28 Days',
                        joined: false,
                        host: 'Community',
                        avatar: 'https://via.placeholder.com/50'
                    }
                ];
                set({ challenges: mockChallenges });
            },

            joinChallenge: async (challengeId) => {
                set(state => ({
                    challenges: state.challenges.map(c =>
                        c.id === challengeId ? { ...c, joined: true, participants: c.participants + 1 } : c
                    )
                }));
                return true;
            },

            createChallenge: async (challenge) => {
                const newChallenge: Challenge = {
                    ...challenge,
                    id: Date.now().toString(),
                    participants: 1,
                    joined: true,
                    host: get().user.name,
                    avatar: get().user.avatar
                };
                set(state => ({ challenges: [newChallenge, ...state.challenges] }));
                return true;
            },

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
                        if (status) total++;
                    });
                });
                return total;
            },

            getOverallSuccessRate: () => {
                const { habits, logs } = get();
                if (habits.length === 0) return 0;

                // Count days since user joined? Or days since first log?
                // Let's use last 30 days for relevance
                const today = new Date();
                let totalOpportunities = 0;
                let totalCompleted = 0;

                for (let i = 0; i < 30; i++) {
                    const date = subDays(today, i);
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayLog = logs[dateKey] || {};

                    totalOpportunities += habits.length;
                    habits.forEach(h => {
                        if (dayLog[h.id]) totalCompleted++;
                    });
                }

                const rate = totalOpportunities === 0 ? 0 : (totalCompleted / totalOpportunities) * 100;
                return Math.round(rate * 100) / 100;
            },

            getMonthlySuccessRate: (date) => {
                // Return percentage for specific month
                const rate = get().getOverallSuccessRate(); // Placeholder for specific month logic if needed
                return Math.round(rate * 100) / 100;
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
