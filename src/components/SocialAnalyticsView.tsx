import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Lock, TrendingUp, BarChart3, Users } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SocialAnalyticsView() {
    const { isPremium, setPremium } = useHabitStore();

    // Mock Data for Trends
    const popularHabits = [
        { name: 'Reading', percent: 85 },
        { name: 'Gym', percent: 72 },
        { name: 'Meditation', percent: 64 },
        { name: 'Water', percent: 59 },
        { name: 'Coding', percent: 45 },
    ];

    const communityPulse = [40, 65, 50, 80, 55, 90, 75]; // Weekly activity

    const renderContent = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Intro Card */}
            <View style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                    <TrendingUp size={24} color="#0284C7" />
                </View>
                <Text style={styles.cardTitle}>Community Trends</Text>
                <Text style={styles.cardDesc}>
                    See what's trending worldwide. Compare your progress with the top 1% of achievers.
                </Text>
            </View>

            {/* Popular Habits Chart */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Most Popular Habits</Text>
                <View style={styles.chartContainer}>
                    {popularHabits.map((habit, index) => (
                        <View key={index} style={styles.barRow}>
                            <Text style={styles.barLabel}>{habit.name}</Text>
                            <View style={styles.barTrack}>
                                <View style={[styles.barFill, { width: `${habit.percent}%` }]} />
                            </View>
                            <Text style={styles.barValue}>{habit.percent}%</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Community Pulse */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Global Activity Pulse</Text>
                <View style={styles.pulseContainer}>
                    {/* Simple Bar Chart visualization */}
                    {communityPulse.map((value, index) => (
                        <View key={index} style={styles.pulseBarWrapper}>
                            <View style={[styles.pulseBar, { height: value, backgroundColor: index === 5 ? theme.colors.primary : '#E2E8F0' }]} />
                            <Text style={styles.pulseLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
                        </View>
                    ))}
                </View>
                <Text style={styles.insightText}>
                    🔥 Saturday is the most active day globally!
                </Text>
            </View>

            {/* Top Percentile */}
            <View style={[styles.card, { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Users size={24} color="#EA580C" />
                    <View>
                        <Text style={{ fontWeight: 'bold', color: '#9A3412', fontSize: 16 }}>You're in the Top 10%</Text>
                        <Text style={{ color: '#C2410C', fontSize: 13 }}>Consistent adherence places you among elite achievers.</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    if (isPremium) {
        return <View style={styles.container}>{renderContent()}</View>;
    }

    return (
        <View style={styles.container}>
            {/* Blurred/Obscured Content Effect (Simulated by opacity) */}
            <View style={{ opacity: 0.1, pointerEvents: 'none' }}>
                {renderContent()}
            </View>

            {/* Lock Overlay */}
            <View style={styles.lockOverlay}>
                <View style={styles.lockIconCircle}>
                    <Lock size={32} color="white" />
                </View>
                <Text style={styles.lockTitle}>Premium Feature</Text>
                <Text style={styles.lockDesc}>
                    Unlock global trends, community insights, and advanced comparisons with HabitRat Premium.
                </Text>
                <TouchableOpacity style={styles.unlockButton} onPress={() => setPremium(true)}>
                    <Text style={styles.unlockButtonText}>Unlock Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    cardDesc: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 16,
    },
    // Bar Chart
    chartContainer: {
        gap: 12,
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    barLabel: {
        width: 80,
        fontSize: 13,
        fontWeight: '500',
        color: theme.colors.text,
    },
    barTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    barValue: {
        width: 30,
        fontSize: 12,
        color: theme.colors.textSecondary,
        textAlign: 'right',
    },
    // Pulse
    pulseContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        marginBottom: 16,
        paddingHorizontal: 10,
    },
    pulseBarWrapper: {
        alignItems: 'center',
        gap: 8,
    },
    pulseBar: {
        width: 8,
        borderRadius: 4,
    },
    pulseLabel: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    insightText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    // Lock Overlay
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    lockIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    lockTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    lockDesc: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    unlockButton: {
        backgroundColor: theme.colors.text,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    unlockButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
