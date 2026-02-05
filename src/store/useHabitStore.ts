import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

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
    getCompletionPercentage: (date: string | Date | number) => number;
    getHabitStatus: (date: string | Date | number, habitId: string) => boolean;

    // Statistics & Analytics
    getCurrentStreak: () => number;
    getBestStreak: () => number;
    getTotalCompletions: () => number;
    getOverallSuccessRate: () => number;
    getMonthlySuccessRate: (date: Date) => number;
    getDailyCompletionStats: (days_count: number) => number[];
    getHabitConsistency: (habitId: string) => number;
    checkStreak: () => void;
    populateDummyData: () => void;

    // Language
    language: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn';
    setLanguage: (lang: 'en' | 'es' | 'fr' | 'de' | 'hi' | 'bn') => void;

    // Auth
    session: Session | null;
    initializeAuth: () => Promise<void>;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
    handleDeepLink: (url: string) => Promise<void>;

    // Data Sync
    fetchHabits: () => Promise<void>;
    fetchLogs: () => Promise<void>;
    fetchSocialProfile: () => Promise<void>;

    // Social Actions
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
    { id: '1', name: 'Email', target: 'Inbox Zero', icon: '📧' },
    { id: '2', name: 'Work', target: '2 hours', icon: '💼' },
    { id: '3', name: 'Code', target: '1 hour', icon: '💻' },
    { id: '4', name: 'Relax', target: '1 ep', icon: '📺' },
    { id: '5', name: 'Gym', target: '45 mins', icon: '🏋️' },
    { id: '6', name: 'Read', target: '30 mins', icon: '📖' },
    { id: '7', name: 'Water', target: '2L', icon: '💧' },
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

            // Auth State
            session: null,
            user: DEFAULT_USER, // Start with default user until profile loaded
            isAuthenticated: false,

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

            initializeAuth: async () => {
                // 1. Check local session
                const { data: { session } } = await supabase.auth.getSession();
                set({ session, isAuthenticated: !!session });

                if (session?.user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
                    if (profile) set(state => ({ user: { ...state.user, ...profile } }));
                }

                // 2. Listen for Auth State Changes
                supabase.auth.onAuthStateChange(async (_event, session) => {
                    set({ session, isAuthenticated: !!session });
                    if (session?.user && _event === 'SIGNED_IN') {
                        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
                        if (profile) set(state => ({ user: { ...state.user, ...profile } }));
                    }
                });

                // 3. Handle Deep Link Listener
                const deepLinkHandler = (event: { url: string }) => {
                    get().handleDeepLink(event.url);
                };

                const initialUrl = await Linking.getInitialURL();
                if (initialUrl) deepLinkHandler({ url: initialUrl });

                Linking.addEventListener('url', deepLinkHandler);
            },

            handleDeepLink: async (url: string) => {
                console.log('🔗 [DeepLink] Received:', url);

                if (url.includes('access_token') || url.includes('refresh_token')) {
                    // Alert the user we got the signal
                    // Alert.alert('Debug', 'Received Deep Link with Token!');

                    // Extract hash or query params
                    const paramsString = url.split('#')[1] || url.split('?')[1];
                    if (!paramsString) return;

                    const params = new URLSearchParams(paramsString);
                    const access_token = params.get('access_token');
                    const refresh_token = params.get('refresh_token');

                    if (access_token && refresh_token) {
                        const { error } = await supabase.auth.setSession({
                            access_token,
                            refresh_token,
                        });
                        if (!error) {
                            console.log('✅ [Auth] Session Set Successfully');
                            set({ isAuthenticated: true });
                            // Alert.alert('Success', 'You are now logged in!');
                        } else {
                            console.error('❌ [Auth] Session Error:', error);
                            Alert.alert('Auth Error', error.message);
                        }
                    }
                } else {
                    console.log('⚠️ [DeepLink] No tokens found in URL');
                    // Alert.alert('Debug', 'Deep link received but no tokens.');
                }
            },

            login: async () => {
                try {
                    // IMPORTANT: Dynamic redirect URL for Expo Go vs Production
                    // Expo Go (Lan): exp://192.168.1.110:8081/--/login-callback
                    // Production: habitrat://login-callback
                    const redirectUrl = Linking.createURL('/login-callback');
                    console.log('🔒 [Auth Debug] REQUIRED REDIRECT URL:', redirectUrl);
                    Alert.alert(
                        "Supabase Configuration",
                        `Add this URL to Supabase -> Auth -> URL Config:\n\n${redirectUrl}\n\n(Tap to copy logic not included, please type or check logs)`
                    );


                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: redirectUrl,
                            skipBrowserRedirect: true, // We handle the redirect manually
                        },
                    });

                    if (error) {
                        console.error('❌ [Auth] Init Error:', error.message);
                        Alert.alert('Login Initialization Failed', error.message);
                        return;
                    }

                    if (data?.url) {
                        console.log('🔗 [Auth] Opening WebBrowser Session:', data.url);

                        // Use WebBrowser for In-App Auth
                        // The 'redirectUrl' tells the browser where to return to close the window
                        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

                        // Debug Alert for User Verification
                        const debugMsg = `Result Type: ${result.type}`;
                        console.log('🔍 [Auth] WebBrowser Result:', result);

                        if (result.type === 'success' && result.url) {
                            // Valid Success with URL
                            await get().handleDeepLink(result.url);
                        } else if (result.type === 'success') {
                            // Success but no URL (sometimes happens on Android if Linking listener catches it first)
                            console.log('✅ [Auth] Browser reported success but no URL. Listener should handle it.');
                        } else if (result.type === 'dismiss') {
                            Alert.alert('Cancelled', 'You closed the login window.');
                        } else {
                            Alert.alert('Login Debug', `Browser closed with state: ${result.type}`);
                        }
                    } else {
                        Alert.alert('Error', 'No login URL returned from Supabase.');
                    }
                } catch (err: any) {
                    console.error('❌ [Auth] Exception:', err);
                    Alert.alert('Login Exception', err.message || 'An unexpected error occurred');
                }
            },

            loginAnonymously: async () => {
                const { data, error } = await supabase.auth.signInAnonymously();
                if (error) {
                    Alert.alert('Guest Login Failed', error.message);
                }
            },

            logout: async () => {
                await supabase.auth.signOut();
                set({ isAuthenticated: false, session: null });
            },

            // --- Messaging Implementation ---
            chats: [],

            fetchChats: async () => {
                const { session } = get();
                if (!session?.user) return;

                // Get all messages where user is sender or receiver
                // To list "Chats", we need to group by the OTHER user.

                // 1. Get unique conversation partners
                const { data: sent } = await supabase.from('messages').select('receiver_id').eq('sender_id', session.user.id);
                const { data: received } = await supabase.from('messages').select('sender_id').eq('receiver_id', session.user.id);

                const partners = new Set<string>();
                sent?.forEach((m: any) => partners.add(m.receiver_id));
                received?.forEach((m: any) => partners.add(m.sender_id));

                const partnerIds = Array.from(partners);

                if (partnerIds.length === 0) {
                    set({ chats: [] });
                    return;
                }

                // 2. Fetch profiles for these partners
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('*')
                    .in('user_id', partnerIds);

                if (!profiles) return;

                // 3. For each partner, get last message (optional but good for list)
                // Simplified: just map to Chat objects
                const chats: Chat[] = profiles.map((p: any) => ({
                    id: p.user_id,
                    name: p.full_name || 'User',
                    avatar: p.profile_picture || '',
                    messages: [], // Will fetch detail on open
                    unreadCount: 0
                }));

                set({ chats });
            },

            fetchMessages: async (friendId) => {
                const { session } = get();
                if (!session?.user) return;

                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${session.user.id})`)
                    .order('sent_at', { ascending: false });

                if (data) {
                    const messages: Message[] = data.map((m: any) => ({
                        id: m.message_id,
                        text: m.content,
                        senderId: m.sender_id === session.user.id ? 'me' : 'other',
                        timestamp: m.sent_at
                    }));

                    set(state => ({
                        chats: state.chats.map(c => c.id === friendId ? { ...c, messages } : c)
                    }));
                }
            },

            sendMessage: async (friendId, text) => {
                const { session } = get();
                if (!session?.user) return;

                // Optimistic Update
                const optimisticMsg: Message = {
                    id: Date.now().toString(),
                    text,
                    senderId: 'me',
                    timestamp: new Date().toISOString()
                };

                set(state => ({
                    chats: state.chats.map(c => c.id === friendId ? { ...c, messages: [optimisticMsg, ...c.messages] } : c)
                }));

                const { error } = await supabase
                    .from('messages')
                    .insert([{
                        sender_id: session.user.id,
                        receiver_id: friendId,
                        content: text
                    }]);

                if (error) {
                    console.error("Send message error", error);
                    // Revert logic here if needed
                }
            },

            subscribeToMessages: () => {
                const { session } = get();
                if (!session?.user) return;

                supabase.channel('public:messages')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${session.user.id}` },
                        payload => {
                            const newMsgRaw = payload.new as any;
                            const senderId = newMsgRaw.sender_id;

                            const newMsg: Message = {
                                id: newMsgRaw.message_id,
                                text: newMsgRaw.content,
                                senderId: 'other',
                                timestamp: newMsgRaw.sent_at
                            };

                            set(state => {
                                // If chat exists, append. If not, maybe need to fetch chat?
                                const chatExists = state.chats.find(c => c.id === senderId);
                                if (chatExists) {
                                    return {
                                        chats: state.chats.map(c => c.id === senderId ? { ...c, messages: [newMsg, ...c.messages], unreadCount: c.unreadCount + 1 } : c)
                                    };
                                }
                                return state; // Or trigger fetchChats()
                            });
                        })
                    .subscribe();
            },

            // Legacy/Local Actions replaced or mapped
            addChat: (friend) => { /* handled by backend now usually, but kept for legacy UI calls */
                set(state => {
                    if (state.chats.find(c => c.id === friend.id)) return state;
                    return { chats: [{ ...friend, messages: [], unreadCount: 0 }, ...state.chats] };
                });
            },
            receiveMessage: () => { }, // Handled by realtime
            markChatRead: (chatId: string) => set((state) => ({
                chats: state.chats.map(chat =>
                    chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
                )
            })),

            setPremium: (status) => set({ isPremium: status }),

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

                // Should refill if never refilled OR if last refill was > 30 days ago
                if (!last || differenceInCalendarDays(today, last) >= 30) {
                    set(state => ({
                        diamonds: state.diamonds + 150,
                        lastRefillDate: today.toISOString()
                    }));
                    // Alert.alert("Monthly Bonus", "+150 Diamonds added to your account!"); // Logic only here
                }
            },

            updateUser: (updates) => set((state) => ({
                user: { ...state.user, ...updates }
            })),

            fetchHabits: async () => {
                const { session } = get();
                if (!session?.user) return;

                const { data, error } = await supabase
                    .from('habits')
                    .select('*')
                    .order('created_at', { ascending: true });

                if (data) {
                    set({ habits: data });
                }
            },

            fetchLogs: async () => {
                const { session } = get();
                if (!session?.user) return;

                // Fetch logs for last 365 days or all 
                const { data, error } = await supabase
                    .from('habit_logs')
                    .select('*');

                if (data) {
                    // Transform flat logs to Logs object structure
                    const newLogs: Logs = {};
                    data.forEach(log => {
                        if (!newLogs[log.date]) newLogs[log.date] = {};
                        newLogs[log.date][log.habit_id] = log.completed;
                    });
                    set({ logs: newLogs });
                }
            },

            fetchSocialProfile: async () => {
                const { session, user } = get();
                if (!session?.user) return;

                // Get counts
                const { count: followingCount } = await supabase
                    .from('social_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('flower_id', session.user.id);

                const { count: followersCount } = await supabase
                    .from('social_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', session.user.id);

                set(state => ({
                    user: {
                        ...state.user,
                        following: followingCount || 0,
                        followers: followersCount || 0
                    }
                }));
            },

            addHabit: async (habit) => {
                const { session, habits, isPremium } = get();
                if (!isPremium && habits.length >= 12) return false;
                if (!session?.user) return false; // Must be logged in

                // Optimistic Update
                const tempId = Date.now().toString();
                const newHabit = { ...habit, id: tempId, user_id: session.user.id };
                set(state => ({ habits: [...state.habits, newHabit as any] }));

                const { data, error } = await supabase
                    .from('habits')
                    .insert([{
                        user_id: session.user.id,
                        name: habit.name,
                        target: habit.target,
                        icon: habit.icon,
                        color: (habit as any).color // Assuming color might be added
                    }])
                    .select()
                    .single();

                if (data) {
                    // Replace temp ID with real ID
                    set(state => ({
                        habits: state.habits.map(h => h.id === tempId ? data : h)
                    }));
                    return true;
                } else {
                    // Revert on error
                    if (error) console.error(error);
                    set(state => ({ habits: state.habits.filter(h => h.id !== tempId) }));
                    return false;
                }
            },

            updateHabit: (updatedHabit) => set((state) => ({
                habits: state.habits.map(h => h.id === updatedHabit.id ? updatedHabit : h)
            })),

            createNewLog: (date) => set((state) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                if (state.logs[dateKey]) return state; // Already exists
                return { logs: { ...state.logs, [dateKey]: {} } };
            }),

            removeHabit: async (id) => {
                set(state => ({ habits: state.habits.filter(h => h.id !== id) }));

                await supabase.from('habits').delete().eq('id', id);
            },

            toggleHabit: async (date, habitId) => {
                const dateKey = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
                const { logs, session } = get();

                // Optimistic Update
                const dayLog = logs[dateKey] || {};
                const newStatus = !dayLog[habitId];

                set((state) => ({
                    logs: {
                        ...state.logs,
                        [dateKey]: { ...dayLog, [habitId]: newStatus }
                    }
                }));
                get().checkStreak();

                if (session?.user) {
                    if (newStatus) {
                        // Insert
                        await supabase.from('habit_logs').upsert({
                            user_id: session.user.id,
                            habit_id: habitId,
                            date: dateKey,
                            completed: true
                        }, { onConflict: 'user_id, habit_id, date' });
                    } else {
                        // Delete
                        await supabase
                            .from('habit_logs')
                            .delete()
                            .eq('user_id', session.user.id)
                            .eq('habit_id', habitId)
                            .eq('date', dateKey);
                    }
                }
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
                const { session } = get();
                if (!session?.user) return false;

                const { error } = await supabase
                    .from('social_follows')
                    .insert([{ flower_id: session.user.id, following_id: targetUserId }]);

                if (!error) {
                    // Update local count optimistic
                    set(state => ({
                        user: { ...state.user, following: state.user.following + 1 }
                    }));
                    return true;
                }
                return false;
            },

            unfollowUser: async (targetUserId) => {
                const { session } = get();
                if (!session?.user) return false;

                const { error } = await supabase
                    .from('social_follows')
                    .delete()
                    .eq('flower_id', session.user.id)
                    .eq('following_id', targetUserId);

                if (!error) {
                    set(state => ({
                        user: { ...state.user, following: Math.max(0, state.user.following - 1) }
                    }));
                    return true;
                }
                return false;
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

            // --- Challenges Implementation ---
            challenges: [],

            fetchChallenges: async () => {
                const { session } = get();
                // Fetch valid challenges (public)
                // Also could fetch joined challenges

                const { data, error } = await supabase
                    .from('challenges')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data) {
                    // Map Supabase data to local Challenge interface
                    const mapped: Challenge[] = data.map((c: any) => ({
                        id: c.challenge_id,
                        title: c.title,
                        description: c.description || '',
                        participants: 0, // Need accurate count via join
                        type: c.is_global ? 'worldwide' : 'event',
                        duration: c.end_date ? `${format(parseISO(c.start_date || new Date().toISOString()), 'MMM d')} - ${format(parseISO(c.end_date), 'MMM d')}` : 'Ongoing',
                        joined: false, // Updated below
                        host: 'Community',
                        avatar: '',
                        start_date: c.start_date,
                        end_date: c.end_date
                    }));

                    // Check joined status if logged in
                    if (session?.user) {
                        const { data: joinedData } = await supabase
                            .from('challenge_participants')
                            .select('challenge_id')
                            .eq('user_id', session.user.id);

                        const joinedSet = new Set(joinedData?.map((j: any) => j.challenge_id));

                        const finalChallenges = mapped.map(c => ({
                            ...c,
                            joined: joinedSet.has(c.id)
                        }));
                        set({ challenges: finalChallenges });
                    } else {
                        set({ challenges: mapped });
                    }
                }
            },

            joinChallenge: async (challengeId) => {
                const { session } = get();
                if (!session?.user) return false;

                const { error } = await supabase
                    .from('challenge_participants')
                    .insert([{ challenge_id: challengeId, user_id: session.user.id }]);

                if (!error) {
                    set(state => ({
                        challenges: state.challenges.map(c => c.id === challengeId ? { ...c, joined: true, participants: c.participants + 1 } : c)
                    }));
                    return true;
                }
                return false;
            },

            createChallenge: async (challenge) => {
                const { session } = get();
                if (!session?.user) return false;

                const { data, error } = await supabase
                    .from('challenges')
                    .insert([{
                        title: challenge.title,
                        description: challenge.description,
                        is_global: challenge.type === 'worldwide',
                        start_date: challenge.start_date,
                        end_date: challenge.end_date,
                        created_by: session.user.id
                    }])
                    .select()
                    .single();

                if (data) {
                    // Refresh list
                    await get().fetchChallenges();
                    return true;
                }
                return false;
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
