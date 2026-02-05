import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import UniversalModal from './UniversalModal';
import { Flame } from 'lucide-react-native';
import { useHabitStore } from '../store/useHabitStore';
import { theme } from '../constants/theme';

export default function StreakPopup() {
    const { streak, showStreakPopup, setShowStreakPopup, user } = useHabitStore();
    const [scaleAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (showStreakPopup) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [showStreakPopup]);

    if (!showStreakPopup) return null;

    const fireColors = [
        '#FFD700', // Gold
        '#FFA500', // Orange
        '#FF4500', // Red-Orange
        '#FF0000', // Red
        '#800080', // Purple
        '#4B0082', // Indigo
    ];

    return (
        <UniversalModal visible={showStreakPopup} onClose={() => setShowStreakPopup(false)} animationType="fade">
            <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowStreakPopup(false)}
                >
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    You have a Streak going for
                </Text>

                <View style={styles.streakCountContainer}>
                    <Flame color="#FF4500" fill="#FF4500" size={32} />
                    <Text style={styles.streakCount}>{streak} days</Text>
                </View>

                <Text style={styles.subtitle}>
                    The more you are consistent the more you get consistent streak
                </Text>

                {/* Fire Row */}
                <View style={styles.fireRow}>
                    <View style={styles.line} />
                    {fireColors.map((color, index) => (
                        <View key={index} style={styles.fireWrapper}>
                            <Flame
                                size={32}
                                color={color}
                                fill={color}
                            />
                        </View>
                    ))}
                </View>

                {/* Button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setShowStreakPopup(false)}
                >
                    <Text style={styles.buttonText}>Got it</Text>
                </TouchableOpacity>
            </Animated.View>
        </UniversalModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '90%', // Ensure it's not full edge-to-edge
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    closeText: {
        fontSize: 20,
        color: '#999',
        fontWeight: 'bold',
    },
    avatarContainer: {
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: 'white',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    streakCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    streakCount: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FF4500',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 32,
        fontSize: 14,
        lineHeight: 20,
        paddingHorizontal: 20,
    },
    fireRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
        position: 'relative',
        paddingHorizontal: 10,
    },
    line: {
        position: 'absolute',
        height: 4,
        backgroundColor: '#eee',
        left: 20,
        right: 20,
        zIndex: -1,
        borderRadius: 2,
    },
    fireWrapper: {
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 20,
    },
    button: {
        backgroundColor: '#FF3366', // Hot pinkish red
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
