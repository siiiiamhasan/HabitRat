import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import UniversalModal from './UniversalModal';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';
import { Star, ThumbsUp } from 'lucide-react-native';

interface RateAppModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function RateAppModal({ visible, onClose }: RateAppModalProps) {
    const { rateApp, snoozeRateApp } = useHabitStore();

    const handleRate = () => {
        // In a real app, we would link to the store here:
        // Linking.openURL(Platform.OS === 'ios' ? '...' : '...');

        // We assume they rated it (standard patterns)
        const rewardGiven = rateApp();
        onClose();

        if (rewardGiven) {
            setTimeout(() => {
                Alert.alert(
                    "Thank You!",
                    "Thanks for your feedback! Here are 50 Diamonds for you! 💎",
                    [{ text: "Awesome!" }],
                    { cancelable: true }
                );
            }, 500);
        }
    };

    const handleLater = () => {
        snoozeRateApp();
        onClose();
    };

    return (
        <UniversalModal visible={visible} onClose={handleLater} animationType="slide">
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <ThumbsUp size={40} color={theme.colors.primary} />
                </View>

                <Text style={styles.title}>Enjoying Habit Tracker?</Text>
                <Text style={styles.description}>
                    If you like using our app, would you mind rating us on the Play Store?
                    {"\n\n"}
                    <Text style={styles.rewardText}>Sign of appreciation: 50 Diamonds 💎</Text>
                </Text>

                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={32} color="#FFD700" fill="#FFD700" style={{ marginHorizontal: 4 }} />
                    ))}
                </View>

                <TouchableOpacity style={styles.rateButton} onPress={handleRate}>
                    <Text style={styles.rateButtonText}>Rate Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
                    <Text style={styles.laterButtonText}>Remind me later</Text>
                </TouchableOpacity>
            </View>
        </UniversalModal>
    );
}

const styles = StyleSheet.create({
    content: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '90%',
        maxWidth: 340,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E6F0FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    rewardText: {
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    rateButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    rateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    laterButton: {
        paddingVertical: 12,
    },
    laterButtonText: {
        color: theme.colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
