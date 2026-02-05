import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { Flame, Gem } from 'lucide-react-native';
import Heatmap from '../components/Heatmap';
import HabitTable from '../components/HabitTable';
import { useHabitStore } from '../store/useHabitStore';
import { theme } from '../constants/theme';
import RateAppModal from '../components/RateAppModal';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '../navigation/BottomTabNavigator';

export default function HomeScreen() {
    const { habits, streak, diamonds, user, hasRatedApp, lastRatePromptDate, fetchHabits, fetchLogs } = useHabitStore();
    const today = new Date();
    const [rateModalVisible, setRateModalVisible] = React.useState(false);
    const navigation = useNavigation<BottomTabNavigationProp<BottomTabParamList>>();

    React.useEffect(() => {
        fetchHabits();
        fetchLogs();
    }, []);

    React.useEffect(() => {
        // Check if we should prompt for rating
        if (hasRatedApp) return;

        // Safety check for existing users who might fail "joinedDate" migration
        const joinDateStr = user?.joinedDate || new Date().toISOString();
        const installDate = parseISO(joinDateStr);
        const daysSinceInstall = differenceInCalendarDays(today, installDate);

        // Logic:
        // 1. App installed > 3 days ago AND
        // 2. Not rated yet AND
        // 3. Last prompt was > 7 days ago (or never)

        if (daysSinceInstall >= 3) {
            if (!lastRatePromptDate) {
                // First prompt
                // Delay slightly for better UX (don't pop up immediately on load)
                const timer = setTimeout(() => setRateModalVisible(true), 2000);
                return () => clearTimeout(timer);
            } else {
                const daysSinceLastPrompt = differenceInCalendarDays(today, parseISO(lastRatePromptDate));
                if (daysSinceLastPrompt >= 7) {
                    setRateModalVisible(true);
                }
            }
        }
    }, [hasRatedApp, user.joinedDate, lastRatePromptDate]);



    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.navigate('Profile')}>
                        <Image
                            source={{ uri: user?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg' }}
                            style={styles.avatar}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.weekday}>{format(today, 'EEEE')}</Text>
                            <Text style={styles.date}>{format(today, 'MMMM d')}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerRight}>
                        <View style={styles.statBadge}>
                            <Flame color="#EA580C" fill="#EA580C" size={20} />
                            <Text style={styles.statText}>{streak}</Text>
                        </View>
                        <View style={[styles.statBadge, styles.diamondBadge]}>
                            <Gem color="#0EA5E9" fill="#0EA5E9" size={18} />
                            <Text style={[styles.statText, styles.diamondText]}>{diamonds}</Text>
                        </View>
                    </View>
                </View>

                {/* Heatmap */}
                <Heatmap />

                {/* Target Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Targets</Text>
                    {habits.length === 0 ? (
                        <Text style={styles.emptyText}>No habits set yet. Add one below!</Text>
                    ) : (
                        <View style={styles.targetList}>
                            {habits.map(habit => (
                                <View key={habit.id} style={styles.targetItem}>
                                    <View style={styles.bullet} />
                                    <Text style={styles.targetName}>{habit.name}</Text>
                                    <View style={styles.dash} />
                                    <Text style={styles.targetValue}>{habit.target}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Habit Table */}
                <HabitTable />
            </ScrollView>
            <RateAppModal visible={rateModalVisible} onClose={() => setRateModalVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        padding: theme.spacing.m,
        paddingBottom: 90, // Space for bottom tab
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.l,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        flex: 1, // Allow left side to shrink/grow properly against right side
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.secondary,
    },
    weekday: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        lineHeight: 18,
    },
    date: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        lineHeight: 24,
    },

    headerRight: {
        flexDirection: 'row',
        gap: 8, // Tighter gap
        alignItems: 'center',
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#FFF7ED', // Orange-50
        borderRadius: 16,
        minWidth: 50,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFEDD5', // Orange-100
    },
    statText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#EA580C', // Orange-600
    },
    diamondBadge: {
        backgroundColor: '#E0F2FE', // Light blue
        borderColor: '#BAE6FD',
    },
    diamondText: {
        color: '#0284C7',
    },
    section: {
        marginBottom: theme.spacing.m,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        ...theme.typography.subHeader,
        marginBottom: theme.spacing.s,
    },
    targetList: {
        gap: 8,
    },
    targetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginRight: 8,
    },
    targetName: {
        fontSize: 14,
        color: theme.colors.text,
        fontWeight: '500',
    },
    dash: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.border,
        marginHorizontal: 8,
        borderStyle: 'dashed', // Dashed border doesn't work on View background, but simple line is fine
    },
    targetValue: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    }

});
