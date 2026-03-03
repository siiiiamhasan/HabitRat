import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Share, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Trophy, Calendar, Star, QrCode, Check, BarChart3, Share2, ArrowRight } from 'lucide-react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useHabitStore } from '../store/useHabitStore';
import { theme } from '../constants/theme';
import Heatmap from './Heatmap';
import YearlyHeatmap from './YearlyHeatmap';
import UniversalModal from './UniversalModal';

interface ShareCardModalProps {
    visible: boolean;
    onClose: () => void;
    mode?: 'monthly' | 'yearly';
}

export default function ShareCardModal({ visible, onClose, mode = 'monthly' }: ShareCardModalProps) {
    const user = useHabitStore((state) => state.user);
    const getCurrentStreak = useHabitStore((state) => state.getCurrentStreak);
    const getMonthlySuccessRate = useHabitStore((state) => state.getMonthlySuccessRate);
    const getYearlyTotalCompletions = useHabitStore((state) => state.getYearlyTotalCompletions);
    const getYearlySuccessRate = useHabitStore((state) => state.getYearlySuccessRate);
    const getBestStreak = useHabitStore((state) => state.getBestStreak);


    const viewShotRef = React.useRef<View>(null);

    const handleShare = async () => {
        try {
            const uri = await captureRef(viewShotRef, {
                format: 'png',
                quality: 1,
            });

            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error('Error sharing image:', error);
            Alert.alert('Error', 'Could not share the image.');
        }
    };

    const monthlySuccess = getMonthlySuccessRate(new Date());
    const yearlyTotal = getYearlyTotalCompletions(new Date().getFullYear());
    const yearSuccessRate = getYearlySuccessRate(new Date().getFullYear());
    const bestStreak = getBestStreak();

    return (
        <UniversalModal visible={visible} onClose={onClose} animationType="slide">
            <View style={[styles.modalContent, { maxWidth: 360 }]}>
                <View style={styles.shareHeader}>
                    <Text style={styles.shareTitle}>Share Your Progress</Text>
                </View>

                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color={theme.colors.text} />
                </TouchableOpacity>



                <View ref={viewShotRef} style={[styles.shareCardContainer]} collapsable={false}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.shareCardGradient}
                    >
                        {/* Header */}
                        <View style={styles.shareHeaderRow}>
                            <View>
                                <Text style={styles.shareCardTitle}>My HabitRat Journey</Text>
                                <Text style={styles.shareCardSubtitle}>{user.username}</Text>
                            </View>
                            <View style={styles.shareBrandBox}>
                                <View style={styles.shareBrandIcon}>
                                    <Text style={{ fontSize: 12 }}>🐀</Text>
                                </View>
                                <Text style={styles.shareBrandText}>HabitRat</Text>
                            </View>
                        </View>

                        {/* User & Main Stat */}
                        <View style={styles.shareMainSection}>
                            <Image source={{ uri: user.avatar }} style={styles.shareAvatarLarge} />
                            <View style={styles.shareMainStat}>
                                <Text style={styles.shareMainValue}>{getCurrentStreak()}</Text>
                                <Text style={styles.shareMainLabel}>Day Streak</Text>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.shareStatsGrid}>
                            <View style={styles.shareStatItem}>
                                <Trophy size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.shareStatValue}>{bestStreak}</Text>
                                <Text style={styles.shareStatLabel}>Best Streak</Text>
                            </View>
                            <View style={styles.shareStatItem}>
                                <Calendar size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.shareStatValue}>{monthlySuccess}%</Text>
                                <Text style={styles.shareStatLabel}>Month</Text>
                            </View>
                            <View style={styles.shareStatItem}>
                                <Star size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.shareStatValue}>{yearlyTotal}</Text>
                                <Text style={styles.shareStatLabel}>Year Total</Text>
                            </View>
                        </View>

                        {/* Content based on Mode */}
                        {mode === 'monthly' ? (
                            <View style={styles.shareHeatmapContainer}>
                                <Text style={styles.shareSectionTitle}>This Month's Activity</Text>
                                <Heatmap
                                    month={new Date()}
                                    disableContainer={true}
                                    showMonthLabel={false}
                                    gap={4}
                                />
                            </View>
                        ) : (
                            <View style={styles.shareYearlyContainer}>
                                <Text style={styles.shareSectionTitle}>Yearly Activity</Text>
                                <YearlyHeatmap year={new Date().getFullYear()} />

                                <View style={[styles.yearlyStatsRow, { marginTop: 16 }]}>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                                        {yearlyTotal} Check-ins • {yearSuccessRate}% Success Rate
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Footer / QR */}
                        <View style={styles.shareFooter}>
                            <Text style={styles.shareFooterText}>Join me on HabitRat to build better habits!</Text>
                            <View style={styles.shareQrBox}>
                                <QrCode size={40} color="white" />
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Text style={styles.shareButtonText}>Share Now</Text>
                    <Share2 size={18} color="white" />
                </TouchableOpacity>
            </View>
        </UniversalModal >
    );
}

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        padding: 4,
        backgroundColor: '#F1F5F9', // Optional: add background for better visibility? User said "cross position" not visual. I'll stick to simple move first. 
        // Actually transparent is fine if it's on white modal.
        // Let's just do position.
        borderRadius: 20,
    },
    shareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center title since toggle is gone
        width: '100%',
        marginBottom: 20,
        // Padding for close buttons if needed, but since it's absolute now, we might just center.
        // Actually closer button is absolute left. 
    },
    shareTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    shareCardContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 20,
        width: '100%',
        elevation: 8,
        shadowColor: "#667eea",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    shareCardGradient: {
        padding: 24,
    },
    shareHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    shareCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    shareCardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    shareBrandBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 6,
    },
    shareBrandIcon: {
        width: 16,
        height: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shareBrandText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    shareMainSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 20,
    },
    shareAvatarLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: 'white',
    },
    shareMainStat: {
        flex: 1,
    },
    shareMainValue: {
        fontSize: 42,
        fontWeight: '900',
        color: 'white',
        lineHeight: 42,
    },
    shareMainLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    shareStatsGrid: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    shareStatItem: {
        alignItems: 'center',
        gap: 4,
    },
    shareStatValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    shareStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    shareHeatmapContainer: {
        marginBottom: 20,
    },
    shareSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 12,
    },
    shareFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    shareFooterText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        maxWidth: 180,
    },
    shareQrBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: 8,
        borderRadius: 12,
    },
    shareToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        padding: 4,
        alignItems: 'center',
    },
    shareToggleItem: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    shareToggleActive: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    shareToggleText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    shareToggleTextActive: {
        color: theme.colors.text,
    },
    shareYearlyContainer: {
        marginBottom: 20,
    },
    yearlyStatsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    shareButton: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
        width: '100%',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
