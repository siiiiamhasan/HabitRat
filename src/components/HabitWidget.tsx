import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Flame, Check } from 'lucide-react-native';

interface HabitWidgetProps {
    streakDays: number;
    completedDays: boolean[]; // Array of 7 booleans for the week
}

export default function HabitWidget({ streakDays = 4, completedDays = [true, true, true, false, false, false, false] }: HabitWidgetProps) {
    const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <View style={styles.widgetContainer}>
            {/* Top Row: Streak and Mascot */}
            <View style={styles.topRow}>
                <View style={styles.streakContainer}>
                    <Flame color="#EA580C" fill="#EA580C" size={28} />
                    <Text style={styles.streakText}>{streakDays} days</Text>
                </View>
                {/* 
                  Using a Local Image or Remote Image. 
                  Make sure to add HabitRat-removebg.png to your assets folder!
                  The transform flip horizontally ensures the rat faces left.
                */}
                <Image
                    source={require('../../assets/images/HabitRat-removebg.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                />
            </View>

            {/* Middle Row: Prompt */}
            <Text style={styles.promptText}>Ready to reach your goal?</Text>

            {/* Bottom Row: 7-Day Tracker */}
            <View style={styles.trackerRow}>
                {daysOfWeek.map((day, index) => {
                    const isCompleted = completedDays[index];
                    return (
                        <View key={index} style={styles.dayColumn}>
                            <Text style={styles.dayLabel}>{day}</Text>
                            <View style={[
                                styles.circle,
                                isCompleted ? styles.circleCompleted : styles.circleEmpty
                            ]}>
                                {isCompleted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    widgetContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 480, // Extended width for 4x2 instead of 2x2
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        alignSelf: 'stretch', // Fill container naturally
        marginHorizontal: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    streakText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937', // Dark Slate Text
        letterSpacing: -0.5,
    },
    mascotImage: {
        width: 80,
        height: 80,
        transform: [{ scaleX: -1 }], // Flips the rat horizontally to face left
    },
    promptText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280', // Muted Gray Text
        marginBottom: 20,
    },
    trackerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB', // Off-White Backdrop container
        padding: 12,
        borderRadius: 100, // Pill shape
    },
    dayColumn: {
        alignItems: 'center',
        gap: 8,
    },
    dayLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937', // Dark Slate Text
    },
    circle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleCompleted: {
        backgroundColor: '#10B981', // Emerald Green
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
    },
    circleEmpty: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#F3F4F6', // Soft Gray
    }
});
