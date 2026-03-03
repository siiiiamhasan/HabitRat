import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Platform } from 'react-native';
import UniversalModal from './UniversalModal';
import { X, Bell, Clock, Info } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore } from '../store/useHabitStore';
import PremiumModal from './PremiumModal';

interface NotificationManagerProps {
    visible: boolean;
    onClose: () => void;
}

export default function NotificationManager({ visible, onClose }: NotificationManagerProps) {
    const { habits, updateHabitNotification, updateNotificationSettings, isPremium, notificationSettings, toggleSmartReminders } = useHabitStore();
    const [premiumModalVisible, setPremiumModalVisible] = useState(false);

    // Time Editing State
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
    const [tempTime, setTempTime] = useState('');
    const [showTimeModal, setShowTimeModal] = useState(false);

    const openTimePicker = (habitId: string, currentTime: string) => {
        setEditingHabitId(habitId);
        setTempTime(currentTime || '09:00');
        setShowTimeModal(true);
    };

    const saveTime = () => {
        if (editingHabitId) {
            // Simple validation
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(tempTime)) {
                Alert.alert("Invalid Time", "Please enter time in HH:MM format (24h).");
                return;
            }

            // Update store - keep enabled state as is, just update time
            const habit = habits.find(h => h.id === editingHabitId);
            if (habit) {
                updateHabitNotification(editingHabitId, !!habit.reminderEnabled, tempTime);
            }
            setShowTimeModal(false);
            setEditingHabitId(null);
        }
    };

    return (
        <UniversalModal visible={visible} onClose={onClose} animationType="slide">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                    {/* Intro / Explanation */}
                    <View style={styles.infoBox}>
                        <Info size={16} color={theme.colors.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.infoText}>
                            HabitRat automates your reminders. Set a **Target Time** for each habit, and we'll handle the rest (including daily follow-ups if you miss it!).
                        </Text>
                    </View>

                    {/* Global Settings */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.iconContainer}>
                                <Bell size={18} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.cardTitle}>Global Settings</Text>
                            {!isPremium && <Text style={styles.premiumBadge}>PRO</Text>}
                        </View>

                        <View style={[styles.settingRow, !isPremium && styles.disabledRow]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Smart Context</Text>
                                <Text style={styles.settingDesc}>
                                    {isPremium ? "AI-adapted messages based on progress." : "Upgrade for AI-driven alerts."}
                                </Text>
                            </View>
                            <Switch
                                value={isPremium && notificationSettings.smartReminders}
                                onValueChange={() => isPremium ? toggleSmartReminders() : setPremiumModalVisible(true)}
                                trackColor={{ false: '#e2e8f0', true: theme.colors.primary }}
                                disabled={!isPremium}
                            />
                        </View>

                        {/* Quiet Hours */}
                        <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 8 }, !isPremium && styles.disabledRow]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Quiet Hours</Text>
                                <Text style={styles.settingDesc}>No notifications between:</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 8, opacity: isPremium ? 1 : 0.5 }}>
                            <TextInput
                                style={styles.timeInputSmall}
                                value={notificationSettings.quietHoursStart}
                                onChangeText={(t) => isPremium ? updateNotificationSettings({ quietHoursStart: t }) : setPremiumModalVisible(true)}
                                placeholder="22:00"
                                keyboardType="numbers-and-punctuation"
                                editable={isPremium}
                            />
                            <Text style={{ alignSelf: 'center', color: '#94A3B8' }}>to</Text>
                            <TextInput
                                style={styles.timeInputSmall}
                                value={notificationSettings.quietHoursEnd}
                                onChangeText={(t) => isPremium ? updateNotificationSettings({ quietHoursEnd: t }) : setPremiumModalVisible(true)}
                                placeholder="07:00"
                                keyboardType="numbers-and-punctuation"
                                editable={isPremium}
                            />
                        </View>

                        {/* Automated Toggles */}
                        <View style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 4 }, !isPremium && styles.disabledRow]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Automated Follow-ups</Text>
                                <Text style={styles.settingDesc}>Enable 12h, 7 PM, and 10 PM checks.</Text>
                            </View>
                            <Switch
                                value={isPremium && notificationSettings.followUpReminders}
                                onValueChange={(val) => isPremium
                                    ? updateNotificationSettings({ followUpReminders: val, eveningCheck: val, streakRescue: val })
                                    : setPremiumModalVisible(true)
                                }
                                trackColor={{ false: '#e2e8f0', true: theme.colors.primary }}
                                disabled={!isPremium}
                            />
                        </View>
                    </View>

                    {/* Habits List */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Habits</Text>
                    <View style={styles.habitsList}>
                        {habits.map(habit => (
                            <View key={habit.id} style={styles.habitRow}>
                                {/* Icon & Name */}
                                <View style={styles.habitLeft}>
                                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                                    <View>
                                        <Text style={styles.habitName}>{habit.name}</Text>
                                        <Text style={styles.habitTarget}>{habit.target}</Text>
                                    </View>
                                </View>

                                {/* Controls */}
                                <View style={styles.habitRight}>
                                    {/* Time Button */}
                                    <TouchableOpacity
                                        style={styles.timeButton}
                                        onPress={() => openTimePicker(habit.id, habit.targetTime || '09:00')}
                                    >
                                        <Clock size={14} color={theme.colors.primary} />
                                        <Text style={styles.timeButtonText}>{habit.targetTime || '09:00'}</Text>
                                    </TouchableOpacity>

                                    {/* Toggle */}
                                    <Switch
                                        value={!!habit.reminderEnabled}
                                        onValueChange={(val) => {
                                            if (!isPremium) {
                                                if (!val) {
                                                    Alert.alert("Stay Consistent!", "Reminders help you stay on track. Upgrade to customize or disable them.");
                                                }
                                                // Free user: Always true (unless system blocked, which is separate)
                                                // We enforce TRUE here when they try to toggle
                                                updateHabitNotification(habit.id, true);
                                            } else {
                                                updateHabitNotification(habit.id, val);
                                            }
                                        }}
                                        trackColor={{ false: '#e2e8f0', true: theme.colors.primary }}
                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                    />
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Simple Time Picker Modal */}
                <UniversalModal visible={showTimeModal} onClose={() => setShowTimeModal(false)} animationType="fade" transparent={true}>
                    <View style={styles.timeModalContent}>
                        <Text style={styles.modalTitle}>Set Target Time</Text>
                        <Text style={styles.modalSubtitle}>When do you want to do this?</Text>

                        <TextInput
                            style={styles.largeTimeInput}
                            value={tempTime}
                            onChangeText={setTempTime}
                            placeholder="09:00"
                            keyboardType="numbers-and-punctuation"
                            autoFocus
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setShowTimeModal(false)} style={styles.modalButtonSecondary}>
                                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveTime} style={styles.modalButtonPrimary}>
                                <Text style={styles.modalButtonTextPrimary}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </UniversalModal>

                <PremiumModal
                    visible={premiumModalVisible}
                    onClose={() => setPremiumModalVisible(false)}
                />
            </View>
        </UniversalModal>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '92%',
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    settingDesc: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    timeInputSmall: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 8,
        textAlign: 'center',
        fontWeight: '600',
        color: theme.colors.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
        marginLeft: 4,
    },
    habitsList: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    habitLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    habitIcon: {
        fontSize: 20,
    },
    habitName: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    habitTarget: {
        fontSize: 12,
        color: theme.colors.textSecondary,
    },
    habitRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    timeButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.colors.primary,
    },
    // Modal
    timeModalContent: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        width: '80%',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    largeTimeInput: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.primary,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
        width: '50%',
        textAlign: 'center',
        marginBottom: 32,
        padding: 8,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButtonSecondary: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    modalButtonPrimary: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
    },
    modalButtonTextSecondary: {
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    modalButtonTextPrimary: {
        fontWeight: '600',
        color: 'white',
    },
    premiumBadge: {
        backgroundColor: '#FDE047',
        color: '#854D0E',
        fontSize: 10,
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    disabledRow: {
        opacity: 0.5,
    },
});

