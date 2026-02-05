import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, StyleSheet, Modal, Share, Dimensions, Alert, Image } from 'react-native';
import UniversalModal from './UniversalModal';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { X, CheckCircle, TrendingUp, BarChart3, PieChart, Lightbulb, ArrowRight, Target } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';
import Heatmap from './Heatmap';
import { generateInsights } from '../utils/analytics';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AnalyticsModalProps {
    visible: boolean;
    onClose: () => void;
}

type Tab = 'overview' | 'trends' | 'insights';

export default function AnalyticsModal({ visible, onClose }: AnalyticsModalProps) {
    const {
        habits,
        logs,
        streak,
        getOverallSuccessRate,
        getTotalCompletions,
        getDailyCompletionStats,
        getHabitConsistency
    } = useHabitStore();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [insights, setInsights] = useState<string[]>([]);

    useEffect(() => {
        if (visible) {
            setInsights(generateInsights(habits, logs, streak));
        }
    }, [visible, habits, logs, streak]);

    const dailyStats = getDailyCompletionStats(7); // Last 7 days

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {(['overview', 'trends', 'insights'] as Tab[]).map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    const changeMonth = (increment: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setSelectedDate(newDate);
    };

    const renderMonthSelector = () => (
        <View style={styles.monthSelector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
                <ArrowRight size={20} color={theme.colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} disabled={selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear()}>
                <ArrowRight size={20} color={selectedDate >= new Date() ? theme.colors.textSecondary : theme.colors.text} />
            </TouchableOpacity>
        </View>
    );

    const renderYearlyProgress = () => {
        const year = selectedDate.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

        return (
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={styles.cardTitle}>{year} Progress</Text>
                    <TouchableOpacity style={styles.shareButtonSmall} onPress={() => { setShareType('yearly'); setShareModalVisible(true); }}>
                        <ArrowRight size={16} color="white" style={{ transform: [{ rotate: '-45deg' }] }} />
                        <Text style={styles.shareButtonTextSmall}>Share</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.yearlyGrid}>
                    {months.map((month, index) => {
                        return (
                            <View key={index} style={styles.yearlyMonthItem}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 4 }}>
                                    <Text style={styles.yearlyMonthLabel}>{month.toLocaleString('default', { month: 'short' })}</Text>
                                </View>

                                <Heatmap
                                    month={month}
                                    cellSize={5}
                                    gap={2}
                                    showLegend={false}
                                    showMonthLabel={false}
                                    disableContainer={true}
                                />
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderOverview = () => (
        <View style={{ gap: 20 }}>
            {/* View Toggle */}
            <View style={styles.viewToggle}>
                <TouchableOpacity
                    style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
                    onPress={() => setViewMode('monthly')}
                >
                    <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, viewMode === 'yearly' && styles.toggleBtnActive]}
                    onPress={() => setViewMode('yearly')}
                >
                    <Text style={[styles.toggleText, viewMode === 'yearly' && styles.toggleTextActive]}>Yearly</Text>
                </TouchableOpacity>
            </View>

            {viewMode === 'yearly' ? renderYearlyProgress() : (
                <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        {renderMonthSelector()}
                        <TouchableOpacity style={styles.shareButtonSmall} onPress={() => { setShareType('monthly'); setShareModalVisible(true); }}>
                            <ArrowRight size={16} color="white" style={{ transform: [{ rotate: '-45deg' }] }} />
                            <Text style={styles.shareButtonTextSmall}>Share</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Key Metrics */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Performance Summary</Text>
                        <View style={styles.statRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{getTotalCompletions()}</Text>
                                <Text style={styles.statLabel}>Total Checks</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{useHabitStore.getState().getMonthlySuccessRate(selectedDate)}%</Text>
                                <Text style={styles.statLabel}>Success Rate</Text>
                            </View>
                        </View>
                    </View>

                    {/* Heatmap */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Monthly Consistency</Text>
                        <Heatmap month={selectedDate} />
                    </View>
                </>
            )}
        </View>
    );

    const renderTrends = () => (
        <View style={{ gap: 20 }}>
            {/* Weekly Activity Chart */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Last 7 Days Balance</Text>
                <View style={styles.barChartContainer}>
                    {dailyStats.map((value, index) => (
                        <View key={index} style={styles.barWrapper}>
                            <View style={styles.barTrackVertical}>
                                <View style={[styles.barFillVertical, { height: `${value}%` }]} />
                            </View>
                            <Text style={styles.barLabelVertical}>
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(new Date().getDay() - 6 + index + 7) % 7]}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Habit Consistency Comparison */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Habit Consistency (30 Days)</Text>
                {habits.map(habit => {
                    const consistency = getHabitConsistency(habit.id);
                    return (
                        <View key={habit.id} style={styles.habitRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                                <Text style={{ fontSize: 18 }}>{habit.icon}</Text>
                                <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBarFill, { width: `${consistency}%`, backgroundColor: consistency > 80 ? '#48BB78' : consistency > 50 ? theme.colors.primary : '#ECC94B' }]} />
                            </View>
                            <Text style={styles.percentText}>{consistency}%</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );

    const renderInsights = () => (
        <View style={{ gap: 20 }}>
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Lightbulb size={24} color="#F59E0B" fill="#FEF3C7" />
                    <Text style={styles.cardTitle}>AI Insights</Text>
                </View>
                <View style={{ gap: 12 }}>
                    {insights.map((insight, index) => (
                        <View key={index} style={styles.insightBox}>
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}
                    {insights.length === 0 && <Text style={{ color: theme.colors.textSecondary }}>Keep tracking to generate insights!</Text>}
                </View>
            </View>

            <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <Target size={24} color="#EF4444" />
                    <Text style={styles.cardTitle}>Goals & Targets</Text>
                </View>
                <Text style={{ color: theme.colors.textSecondary, lineHeight: 20 }}>
                    You are currently tracking {habits.length} habits. Aim for a 80% daily completion rate to maximize your diamond earnings!
                </Text>
            </View>
        </View>
    );

    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [shareType, setShareType] = useState<'monthly' | 'yearly'>('monthly');
    const user = useHabitStore(state => state.user);

    const viewShotRef = useRef<View>(null);

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

    const renderShareModal = () => (
        <UniversalModal visible={shareModalVisible} onClose={() => setShareModalVisible(false)} animationType="slide">
            <View style={[styles.modalContent, { maxWidth: 360 }]}>
                <View style={styles.shareHeader}>
                    <Text style={styles.shareTitle}>Share Preview</Text>
                    <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                        <X size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View ref={viewShotRef} style={styles.shareCard} collapsable={false}>
                    <Image source={require('../../assets/Qr_Left.png')} style={styles.qrDecoration} resizeMode="contain" />

                    <View style={styles.qrContainer}>
                        <Image
                            source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=habitrat://user/${user.username.replace('@', '')}` }}
                            style={styles.qrCode}
                        />
                        <Image source={require('../../assets/icon.png')} style={styles.qrLogo} />
                    </View >

                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <Image source={{ uri: user.avatar }} style={styles.shareAvatar} />
                        <Text style={styles.shareName}>{user.name}</Text>
                        <Text style={styles.shareStreakLabel}>{shareType === 'monthly' ? 'Monthly Success' : 'Yearly Progress'}</Text>
                        <Text style={styles.shareStreakValue}>
                            {shareType === 'monthly' ? `${useHabitStore.getState().getMonthlySuccessRate(selectedDate)}%` : `${getTotalCompletions()} 🔥`}
                        </Text>
                    </View>

                    <Text style={{ textAlign: 'center', marginBottom: 10, color: theme.colors.textSecondary }}>
                        {shareType === 'monthly' ? selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : selectedDate.getFullYear()} Snapshot
                    </Text>

                    {
                        shareType === 'monthly' ? (
                            <Heatmap month={selectedDate} />
                        ) : (
                            <View style={styles.yearlyGrid}>
                                {Array.from({ length: 12 }, (_, i) => new Date(selectedDate.getFullYear(), i, 1)).map((month, index) => {
                                    return (
                                        <View key={index} style={styles.yearlyMonthItem}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={styles.yearlyMonthLabel}>{month.toLocaleString('default', { month: 'short' })}</Text>
                                            </View>
                                            <Heatmap
                                                month={month}
                                                cellSize={5}
                                                gap={2}
                                                showLegend={false}
                                                showMonthLabel={false}
                                                disableContainer={true}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        )
                    }
                </View >

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Text style={styles.shareButtonText}>Share Now</Text>
                    <ArrowRight size={20} color="white" style={{ transform: [{ rotate: '-45deg' }] }} />
                </TouchableOpacity>
            </View >
        </UniversalModal >
    );

    return (
        <UniversalModal visible={visible} onClose={onClose} animationType="slide">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics Dashboard</Text>
                    <TouchableOpacity onPress={onClose}>
                        <X size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                {renderTabs()}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'trends' && renderTrends()}
                    {activeTab === 'insights' && renderInsights()}
                </ScrollView>
            </View>
            {renderShareModal()}
        </UniversalModal>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '95%',
        height: '90%',
        backgroundColor: '#F7F8FA',
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    activeTabText: {
        color: 'white',
    },
    content: {
        padding: 20,
        gap: 20,
        paddingBottom: 40,
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.colors.text,
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: theme.colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E1E4E8',
    },
    // Charts
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
        paddingTop: 20,
    },
    barWrapper: {
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    barTrackVertical: {
        width: 8,
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        justifyContent: 'flex-end',
    },
    barFillVertical: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
        minHeight: 4, // Ensure visibility even if 0
    },
    barLabelVertical: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    // Habit Rows
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    habitName: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.colors.text,
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    percentText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        width: 32,
        textAlign: 'right',
    },
    // Insights
    insightBox: {
        backgroundColor: '#FFFBEB',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#F59E0B',
    },
    insightText: {
        color: '#92400E',
        fontSize: 14,
        lineHeight: 20,
    },
    // Enhanced Analytics Styles
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 4,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        padding: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    toggleBtnActive: {
        backgroundColor: 'white',
        shadowColor: "rgba(0,0,0,0.1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    toggleTextActive: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    yearlyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 8,
    },
    yearlyMonthItem: {
        width: '31%', // ~3 columns
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 8,
    },
    yearlyMonthLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    // Modal Styles
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        alignSelf: 'center',
    },
    shareHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    shareTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    shareCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden', // Ensure decoration stays inside
    },
    qrDecoration: {
        position: 'absolute',
        top: 10,
        left: 10,
        width: 60,
        height: 60,
        opacity: 0.5,
        zIndex: 1,
    },
    shareAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    shareName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    shareStreakLabel: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    shareStreakValue: {
        fontSize: 48,
        fontWeight: '900',
        color: theme.colors.primary,
        marginBottom: 16,
    },
    qrContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'white',
        padding: 4,
        borderRadius: 8,
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrCode: {
        width: 70,
        height: 70,
    },
    qrLogo: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 4,
        zIndex: 20,
    },
    shareButton: {
        backgroundColor: theme.colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shareButtonSmall: {
        backgroundColor: theme.colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    shareButtonTextSmall: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
