import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UniversalModal from '../components/UniversalModal';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { X, TrendingUp, ArrowRight, Lightbulb, Target, Users, ChevronDown } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';
import Heatmap from '../components/Heatmap';
import { generateInsights } from '../utils/analytics';
import {
    calculateConsistencyScore,
    calculateStreakRisk,
    generateTimeHeatmap,
    calculateMomentum,
    analyzeFailureReasons,
    detectKeystoneHabits,
    predictBurnout,
    TimeHeatmapData
} from '../utils/advancedAnalytics';
import { format, subDays } from 'date-fns';

export default function AnalyticsScreen() {
    const {
        habits,
        logs,
        streak,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getOverallSuccessRate, // Keep if needed for other calculations, or remove if truly unused. 
        // usage in renderOverview suggests getMonthly is used.
        // Let's add getMonthlySuccessRate here
        getMonthlySuccessRate,
        getTotalCompletions,
        getMonthlyTotalCompletions,
        getYearlyTotalCompletions,
        getYearlySuccessRate,
        getDailyCompletionStats,
        getHabitConsistency
    } = useHabitStore();



    const [activeTab, setActiveTab] = useState<'overview' | 'advance'>('overview');
    const [insights, setInsights] = useState<string[]>([]);

    useEffect(() => {
        setInsights(generateInsights(habits, logs, streak));
    }, [habits, logs, streak]);

    const dailyStats = getDailyCompletionStats(7); // Last 7 days

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                onPress={() => setActiveTab('overview')}
            >
                <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'advance' && styles.activeTab]}
                onPress={() => setActiveTab('advance')}
            >
                <Text style={[styles.tabText, activeTab === 'advance' && styles.activeTabText]}>Advance</Text>
            </TouchableOpacity>
        </View>
    );



    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    const [yearDropdownVisible, setYearDropdownVisible] = useState(false);
    const selectYear = (year: number) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year);
        setSelectedDate(newDate);
        setYearDropdownVisible(false);
    };



    const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);
    const selectMonth = (monthIndex: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(monthIndex);
        setSelectedDate(newDate);
        setMonthDropdownVisible(false);
    };

    const renderMonthSelector = () => (
        <View style={styles.monthSelector}>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setMonthDropdownVisible(true)}>
                <Text style={styles.monthTitle}>{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                <ChevronDown size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <UniversalModal visible={monthDropdownVisible} onClose={() => setMonthDropdownVisible(false)}>
                <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, width: '80%', alignItems: 'center', maxHeight: '80%' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Select Month</Text>
                    <ScrollView style={{ width: '100%' }}>
                        {Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'long' })).map((month, index) => (
                            <TouchableOpacity key={index} style={{ paddingVertical: 12, width: '100%', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} onPress={() => selectMonth(index)}>
                                <Text style={{ fontSize: 16, color: index === selectedDate.getMonth() ? theme.colors.primary : theme.colors.text, fontWeight: index === selectedDate.getMonth() ? 'bold' : 'normal' }}>{month}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={{ marginTop: 16, padding: 10 }} onPress={() => setMonthDropdownVisible(false)}>
                        <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </UniversalModal>
        </View>
    );

    const renderYearlyProgress = () => {
        const year = selectedDate.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

        return (
            <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    {/* Year Dropdown */}
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            backgroundColor: '#F8FAFC',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#E2E8F0'
                        }}
                        onPress={() => setYearDropdownVisible(true)}
                    >
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>{year}</Text>
                        <ChevronDown size={14} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Share Button */}
                    <TouchableOpacity style={styles.shareButtonSmall} onPress={() => { setShareType('yearly'); setShareModalVisible(true); }}>
                        <ArrowRight size={16} color="white" style={{ transform: [{ rotate: '-45deg' }] }} />
                        <Text style={styles.shareButtonTextSmall}>Share</Text>
                    </TouchableOpacity>
                </View>

                <UniversalModal visible={yearDropdownVisible} onClose={() => setYearDropdownVisible(false)}>
                    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 20, width: '80%', alignItems: 'center' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>Select Year</Text>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <TouchableOpacity key={y} style={{ paddingVertical: 12, width: '100%', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }} onPress={() => selectYear(y)}>
                                <Text style={{ fontSize: 16, color: y === year ? theme.colors.primary : theme.colors.text, fontWeight: y === year ? 'bold' : 'normal' }}>{y}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={{ marginTop: 16, padding: 10 }} onPress={() => setYearDropdownVisible(false)}>
                            <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </UniversalModal>

                {/* Yearly Performance Summary */}
                <View style={[styles.card, { marginBottom: 20 }]}>
                    <Text style={styles.cardTitle}>Yearly Summary</Text>
                    <View style={styles.statRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{getYearlyTotalCompletions(year)}</Text>
                            <Text style={styles.statLabel}>Total Checks</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{getYearlySuccessRate(year)}%</Text>
                            <Text style={styles.statLabel}>Success Rate</Text>
                        </View>
                    </View>
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
                                <Text style={styles.statValue}>{getMonthlyTotalCompletions(selectedDate)}</Text>
                                <Text style={styles.statLabel}>Total Checks</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{getMonthlySuccessRate(selectedDate).toFixed(2)}%</Text>
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



    const renderAdvance = () => {
        // We render specific components for each featured analytics
        return (
            <View style={{ gap: 20 }}>
                {/* 1. Consistency Score & 2. Streak Fragility */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Consistency Card */}
                    <View style={[styles.card, { flex: 1, padding: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Target size={18} color={theme.colors.primary} />
                            <Text style={[styles.cardTitle, { marginBottom: 0, fontSize: 14 }]}>Consistency</Text>
                        </View>
                        {habits.length > 0 ? (() => {
                            const { score, trend, change_7d } = calculateConsistencyScore(habits[0].id, logs);
                            return (
                                <View>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: theme.colors.text }}>
                                        {score}
                                        <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>/100</Text>
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        {trend === 'up' ? <TrendingUp size={14} color="#10B981" /> : trend === 'down' ? <TrendingUp size={14} color="#EF4444" style={{ transform: [{ rotate: '180deg' }] }} /> : null}
                                        <Text style={{ fontSize: 12, color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : theme.colors.textSecondary }}>
                                            {change_7d > 0 ? '+' : ''}{change_7d} (7d)
                                        </Text>
                                    </View>
                                </View>
                            );
                        })() : <Text style={{ color: theme.colors.textSecondary }}>No habits</Text>}
                    </View>

                    {/* Streak Risk Card */}
                    <View style={[styles.card, { flex: 1, padding: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <TrendingUp size={18} color="#EF4444" />
                            <Text style={[styles.cardTitle, { marginBottom: 0, fontSize: 14 }]}>Break Risk</Text>
                        </View>
                        {habits.length > 0 ? (() => {
                            const { risk_percentage, risk_level, primary_factor } = calculateStreakRisk(habits[0].id, logs, streak);
                            const color = risk_level === 'High' ? '#EF4444' : risk_level === 'Medium' ? '#F59E0B' : '#10B981';
                            return (
                                <View>
                                    <Text style={{ fontSize: 32, fontWeight: '900', color: color }}>
                                        {risk_percentage}%
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: color }}>{risk_level} Risk</Text>
                                    <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                                        {primary_factor}
                                    </Text>
                                </View>
                            );
                        })() : <Text style={{ color: theme.colors.textSecondary }}>No habits</Text>}
                    </View>
                </View>

                {/* 3. Time of Day Heatmap */}
                {habits.length > 0 && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Optimal Execution Window</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 12 }}>
                            Success rate by hour ({habits[0].name})
                        </Text>
                        {/* Simple Grid Visual */}
                        <View style={{ gap: 2 }}>
                            {generateTimeHeatmap(habits[0].id, logs).heatmap.length > 0 ? (
                                <View>
                                    <Text style={{ fontSize: 14, color: theme.colors.text }}>
                                        Most active: {generateTimeHeatmap(habits[0].id, logs).heatmap.sort((a, b) => b.count - a.count)[0].hour}:00
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                                        {/* Just showing top hours for now */}
                                        {generateTimeHeatmap(habits[0].id, logs).heatmap.sort((a, b) => b.count - a.count).slice(0, 5).map((h, i) => (
                                            <View key={i} style={{ padding: 6, backgroundColor: '#EFF6FF', borderRadius: 6 }}>
                                                <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: 'bold' }}>
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][h.day]} {h.hour}:00
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            ) : (
                                <Text style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No time data available yet.</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* 4. Momentum */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Habit Momentum</Text>
                    {habits.map(h => {
                        const { momentum, slope } = calculateMomentum(h.id, logs);
                        const color = momentum === 'Improving' ? '#10B981' : momentum === 'Declining' ? '#EF4444' : '#F59E0B';
                        return (
                            <View key={h.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text>{h.icon}</Text>
                                    <Text style={{ fontWeight: '500', color: theme.colors.text }}>{h.name}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: color + '20', borderRadius: 4 }}>
                                        <Text style={{ color: color, fontSize: 10, fontWeight: '700' }}>{momentum.toUpperCase()}</Text>
                                    </View>
                                </View>
                            </View>
                        )
                    })}
                </View>

                {/* 6. Keystone Habits */}
                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Lightbulb size={24} color="#8B5CF6" />
                        <Text style={styles.cardTitle}>Keystone Habits</Text>
                    </View>
                    {habits.length > 1 ? (
                        detectKeystoneHabits(habits, logs).slice(0, 1).map(k => {
                            return (
                                <View key={k.habit}>
                                    <Text style={{ lineHeight: 20, color: theme.colors.text }}>
                                        <Text style={{ fontWeight: 'bold' }}>{k.habit}</Text> increases your overall success probability.
                                    </Text>
                                    <Text style={{ marginTop: 8, fontSize: 12, color: theme.colors.textSecondary, fontWeight: 'bold' }}>
                                        IMPACT SCORE: {k.impact_score}x
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                                        {k.affected_habits.map((ah, i) => (
                                            <View key={i} style={{ padding: 4, backgroundColor: '#F3F4F6', borderRadius: 4 }}>
                                                <Text style={{ fontSize: 10, color: '#4B5563' }}>{ah}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )
                        })
                    ) : <Text style={{ color: theme.colors.textSecondary }}>Track more habits to unlock correlation data.</Text>}
                </View>

                {/* 7. Burnout Prediction */}
                {(() => {
                    const { risk_level, signals, recommendation } = predictBurnout(habits, logs);
                    if (risk_level !== 'Low') {
                        return (
                            <View style={[styles.card, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <Users size={24} color="#DC2626" />
                                    <Text style={[styles.cardTitle, { color: '#B91C1C', marginBottom: 0 }]}>Burnout Risk: {risk_level}</Text>
                                </View>
                                <View style={{ marginBottom: 8 }}>
                                    {signals.map((s, i) => (
                                        <Text key={i} style={{ fontSize: 12, color: '#B91C1C' }}>• {s}</Text>
                                    ))}
                                </View>
                                <Text style={{ color: '#991B1B', fontWeight: 'bold' }}>{recommendation}</Text>
                            </View>
                        );
                    }
                    return null;
                })()}

            </View>
        );
    };

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
                            {shareType === 'monthly' ? `${getMonthlySuccessRate(selectedDate)}%` : `${getYearlyTotalCompletions(selectedDate.getFullYear())} 🔥`}
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Analytics</Text>
            </View>

            {renderTabs()}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'advance' && renderAdvance()}
            </ScrollView>

            {renderShareModal()}
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: '#F7F8FA',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
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
        paddingTop: 0,
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
