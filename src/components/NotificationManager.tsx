import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Alert, Platform } from 'react-native';
import UniversalModal from './UniversalModal';
import { X, Clock, Bell, Trash2, Plus, Calendar } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { useHabitStore, ReminderConfig } from '../store/useHabitStore';

interface NotificationManagerProps {
    visible: boolean;
    onClose: () => void;
}

export default function NotificationManager({ visible, onClose }: NotificationManagerProps) {
    const { habits, reminders, addReminder, removeReminder, updateReminder, notificationSettings, toggleSmartReminders, updateNotificationSettings } = useHabitStore();
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);


    // Editing State
    const [editingReminder, setEditingReminder] = useState<Partial<ReminderConfig> | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const handleAddReminder = (habitId: string) => {
        setSelectedHabitId(habitId);
        setEditingReminder({
            time: '09:00',
            days: [0, 1, 2, 3, 4, 5, 6],
            message: `Time for your habit!`,
            enabled: true
        });
        setShowEditModal(true);
    };

    const handleEditReminder = (habitId: string, reminder: ReminderConfig) => {
        setSelectedHabitId(habitId);
        setEditingReminder(reminder);
        setShowEditModal(true);
    };

    const saveReminder = () => {
        if (!selectedHabitId || !editingReminder || !editingReminder.time) return;

        // Validation for Free Users: Custom Message and Days check?
        // Let's just enforce count for now as per Prompt "Multiple Reminder Customization" being premium.

        if (editingReminder.id) {
            updateReminder(selectedHabitId, editingReminder as ReminderConfig);
        } else {
            addReminder(selectedHabitId, editingReminder as Omit<ReminderConfig, 'id'>);
        }
        setShowEditModal(false);
        setEditingReminder(null);
    };

    const toggleDay = (dayIndex: number) => {
        if (!editingReminder) return;
        const currentDays = editingReminder.days || [];
        const newDays = currentDays.includes(dayIndex)
            ? currentDays.filter(d => d !== dayIndex)
            : [...currentDays, dayIndex].sort();
        setEditingReminder({ ...editingReminder, days: newDays });
    };

    const DAYSString = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <UniversalModal visible={visible} onClose={onClose} animationType="slide">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications & Reminders</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Global Settings</Text>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Smart Context Reminders</Text>
                                <Text style={styles.settingDesc}>
                                    Adapts message based on your streak and time of day.
                                </Text>
                            </View>
                            <Switch
                                value={notificationSettings.smartReminders}
                                onValueChange={() => toggleSmartReminders()}
                                trackColor={{ false: '#e2e8f0', true: theme.colors.primary }}
                            />
                        </View>

                        {/* Quiet Hours */}
                        <View style={[styles.settingRow, { marginTop: 16 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Quiet Hours</Text>
                                <Text style={styles.settingDesc}>
                                    Don't notify me between these times.
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <View style={styles.timeBox}>
                                <Clock size={14} color={theme.colors.textSecondary} />
                                <TextInput
                                    style={[styles.timeText, { minWidth: 40, textAlign: 'center' }]}
                                    value={notificationSettings.quietHoursStart}
                                    onChangeText={(t) => updateNotificationSettings({ quietHoursStart: t })}
                                    placeholder="22:00"
                                    maxLength={5}
                                />
                            </View>
                            <Text style={{ color: theme.colors.textSecondary }}>to</Text>
                            <View style={styles.timeBox}>
                                <Clock size={14} color={theme.colors.textSecondary} />
                                <TextInput
                                    style={[styles.timeText, { minWidth: 40, textAlign: 'center' }]}
                                    value={notificationSettings.quietHoursEnd}
                                    onChangeText={(t) => updateNotificationSettings({ quietHoursEnd: t })}
                                    placeholder="08:00"
                                    maxLength={5}
                                />
                            </View>
                        </View>

                        {/* Focus Mode */}
                        <View style={[styles.settingRow, { marginTop: 20 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Focus Mode</Text>
                                <Text style={styles.settingDesc}>
                                    Pause all non-critical notifications.
                                </Text>
                            </View>
                            <Switch
                                value={notificationSettings.focusMode}
                                onValueChange={(v) => updateNotificationSettings({ focusMode: v })}
                                trackColor={{ false: '#e2e8f0', true: theme.colors.primary }}
                            />
                        </View>
                    </View>

                    {/* Habits List */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Habit Schedules</Text>
                    {habits.map(habit => {
                        const habitReminders = reminders[habit.id] || [];
                        return (
                            <View key={habit.id} style={styles.habitCard}>
                                <View style={styles.habitHeader}>
                                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                                    <Text style={styles.habitName}>{habit.name}</Text>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={() => handleAddReminder(habit.id)}
                                    >
                                        <Plus size={16} color={theme.colors.primary} />
                                        <Text style={styles.addButtonText}>Add</Text>
                                    </TouchableOpacity>
                                </View>

                                {habitReminders.length === 0 ? (
                                    <Text style={styles.emptyText}>No reminders set.</Text>
                                ) : (
                                    habitReminders.map(reminder => (
                                        <TouchableOpacity
                                            key={reminder.id}
                                            style={styles.reminderItem}
                                            onPress={() => handleEditReminder(habit.id, reminder)}
                                        >
                                            <View style={styles.timeBox}>
                                                <Clock size={14} color={theme.colors.textSecondary} />
                                                <Text style={styles.timeText}>{reminder.time}</Text>
                                            </View>
                                            <View style={{ flex: 1, paddingHorizontal: 10 }}>
                                                <Text numberOfLines={1} style={styles.reminderMsg}>{reminder.message}</Text>
                                                <Text style={styles.daysText}>
                                                    {reminder.days.length === 7 ? 'Every day' : reminder.days.map(d => DAYSString[d]).join(', ')}
                                                </Text>
                                            </View>
                                            <Switch
                                                value={reminder.enabled}
                                                onValueChange={() => updateReminder(habit.id, { ...reminder, enabled: !reminder.enabled })}
                                                trackColor={{ false: '#e2e8f0', true: theme.colors.primary }}
                                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                            />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Edit Modal */}
                <UniversalModal visible={showEditModal} onClose={() => setShowEditModal(false)} animationType="fade">
                    <View style={styles.editModalContent}>
                        <Text style={styles.editTitle}>{editingReminder?.id ? "Edit Reminder" : "New Reminder"}</Text>

                        {/* Time Input (Text for now) */}
                        <Text style={styles.label}>Time (24h)</Text>
                        <TextInput
                            style={styles.input}
                            value={editingReminder?.time}
                            onChangeText={t => setEditingReminder(prev => prev ? ({ ...prev, time: t }) : null)}
                            placeholder="09:00"
                            keyboardType="numbers-and-punctuation"
                        />

                        {/* Message */}
                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            style={styles.input}
                            value={editingReminder?.message}
                            onChangeText={t => setEditingReminder(prev => prev ? ({ ...prev, message: t }) : null)}
                            placeholder="Don't forget!"
                        />

                        {/* Days */}
                        <Text style={styles.label}>Repeat</Text>
                        <View style={styles.daysContainer}>
                            {DAYSString.map((day, index) => {
                                const selected = editingReminder?.days?.includes(index);
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.dayChip, selected && styles.dayChipSelected]}
                                        onPress={() => toggleDay(index)}
                                    >
                                        <Text style={[styles.dayText, selected && { color: 'white' }]}>{day}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Actions */}
                        <View style={styles.editActions}>
                            {editingReminder?.id && (
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => {
                                        if (selectedHabitId && editingReminder.id) {
                                            removeReminder(selectedHabitId, editingReminder.id);
                                            setShowEditModal(false);
                                        }
                                    }}
                                >
                                    <Trash2 size={20} color={theme.colors.danger} />
                                </TouchableOpacity>
                            )}
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.cancelButton}>
                                <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveReminder} style={styles.saveButton}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </UniversalModal>
            </View>
        </UniversalModal>
    );
}


const styles = StyleSheet.create({
    container: {
        width: '95%',
        height: '90%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: theme.colors.text,
    },
    settingDesc: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        marginTop: 2,
    },
    habitCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    habitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    habitIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    habitName: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        flex: 1,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E0F2FE',
        borderRadius: 6,
    },
    addButtonText: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        fontSize: 13,
    },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.text,
    },
    reminderMsg: {
        fontSize: 14,
        color: theme.colors.text,
        marginBottom: 2,
    },
    daysText: {
        fontSize: 11,
        color: theme.colors.textSecondary,
    },
    // Edit Modal
    editModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    editModalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
    },
    editTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: theme.colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    dayChip: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayChipSelected: {
        backgroundColor: theme.colors.primary,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textSecondary,
    },
    editActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    deleteButton: {
        padding: 10,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
    },
    cancelButton: {
        padding: 12,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
});
