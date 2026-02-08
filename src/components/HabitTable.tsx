import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { useHabitStore, Habit } from '../store/useHabitStore';
import { format, subDays, isSameDay, isBefore, startOfDay } from 'date-fns';
import { Check, Plus } from 'lucide-react-native';
import { theme } from '../constants/theme';
import StreakPopup from './StreakPopup';

import UniversalModal from './UniversalModal';

export default function HabitTable() {
    const { habits, addHabit, updateHabit, removeHabit, toggleHabit, getHabitStatus, logs, createNewLog, checkStreak, setShowStreakPopup, diamonds, spendDiamonds } = useHabitStore();

    const [modalVisible, setModalVisible] = useState(false);


    // Form State
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitIcon, setNewHabitIcon] = useState('');
    const [newHabitTarget, setNewHabitTarget] = useState('');

    // Sort dates descending
    const dates = useMemo(() => {
        // We only use dates that exist in logs. No auto-population.
        return Object.keys(logs).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
    }, [logs]);

    const handleAddNewPage = () => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        if (logs[todayKey]) {
            Alert.alert("Already Active", "Today is already logged.", [{ text: "OK" }], { cancelable: true });
            return;
        }
        createNewLog(new Date());
    };

    const handleToggle = (dateString: string, habitId: string) => {
        const date = new Date(dateString);
        const isPast = isBefore(startOfDay(date), startOfDay(new Date()));

        const isCurrentlyDone = getHabitStatus(dateString, habitId);

        if (isPast) {
            if (!isCurrentlyDone) {
                // Repair Logic
                Alert.alert(
                    "Repair Habit",
                    `Missed this day? You can repair it for 10 Diamonds.\n\nBalance: ${diamonds} 💎`,
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Repair (-10 💎)",
                            onPress: () => {
                                if (spendDiamonds(10)) {
                                    toggleHabit(dateString, habitId);
                                    Alert.alert("Success", "Habit repaired!", [{ text: "OK" }], { cancelable: true });
                                } else {
                                    Alert.alert("Insufficient Diamonds", "You need 10 diamonds to repair a missed habit.", [{ text: "OK" }], { cancelable: true });
                                }
                            }
                        }
                    ],
                    { cancelable: true }
                );
                return;
            } else {
                // If trying to uncheck a past habit -> Prevent it
                Alert.alert("History Locked", "You cannot uncheck a habit from a past day.", [{ text: "OK" }], { cancelable: true });
                return;
            }
        }

        // Prevent Uncheck Logic (for Today/Active streaks)
        if (isCurrentlyDone && isSameDay(date, new Date())) {
            const dayLogs = logs[dateString] || {};
            const completedCount = Object.values(dayLogs).filter(v => v).length;

            if (completedCount === 1) {
                Alert.alert(
                    "Warning!",
                    "Unchecking this will clear your progress for today and break your streak. Are you sure?",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Uncheck",
                            style: 'destructive',
                            onPress: () => {
                                toggleHabit(dateString, habitId);
                                // Re-check streak immediately to update UI
                                setTimeout(() => checkStreak(), 100);
                            }
                        }
                    ],
                    { cancelable: true }
                );
                return;
            }
        }

        toggleHabit(dateString, habitId);

        // Streak Logic
        if (!isCurrentlyDone) {
            // If checking a habit for today
            if (isSameDay(date, new Date())) {
                const dayLogs = logs[dateString] || {};
                const completedCount = Object.values(dayLogs).filter(v => v).length;

                // If this is the first completion of the day (count was 0)
                if (completedCount === 0) {
                    // We need to update streak calculation
                    // Small delay to allow state to settle if needed, though Zustand is sync usually
                    setTimeout(() => {
                        checkStreak();
                        setShowStreakPopup(true);
                    }, 100);
                }
            }
        }
    };

    const openModal = (habit?: Habit) => {
        if (habit) {
            setEditingHabitId(habit.id);
            setNewHabitName(habit.name);
            setNewHabitIcon(habit.icon);
            setNewHabitTarget(habit.target);
        } else {
            setEditingHabitId(null);
            setNewHabitName('');
            setNewHabitIcon('');
            setNewHabitTarget('');
        }
        setModalVisible(true);
    };

    const handleSaveHabit = () => {
        if (!newHabitName || !newHabitIcon) {
            Alert.alert("Missing Info", "Please enter a Name and an Emoji.", [{ text: "OK" }], { cancelable: true });
            return;
        }

        const habitData = {
            name: newHabitName,
            icon: newHabitIcon,
            target: newHabitTarget
        };

        if (editingHabitId) {
            updateHabit({ ...habitData, id: editingHabitId });
        } else {
            addHabit(habitData);
        }

        setModalVisible(false);
    };

    const handleHabitAction = (habit: Habit) => {
        Alert.alert(
            "Manage Habit",
            `What would you like to do with "${habit.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Edit", onPress: () => openModal(habit) },
                { text: "Delete", style: "destructive", onPress: () => removeHabit(habit.id) }
            ],
            { cancelable: true }
        );
    };

    const isTodayLogged = useMemo(() => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        return !!logs[todayKey];
    }, [logs]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Daily Checklist</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* "New" Button opens Modal */}
                    <TouchableOpacity onPress={() => openModal()} style={[styles.addButton, { backgroundColor: '#2196F3' }]}>
                        <Text style={styles.addButtonText}>New</Text>
                        <Plus color="white" size={16} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                <View>
                    {/* Header Row: Habit Icons */}
                    <View style={styles.row}>
                        <View style={[styles.cell, styles.dateColumnHeader]}>
                            <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Date's</Text>
                        </View>
                        {habits.map((habit: Habit) => (
                            <TouchableOpacity
                                key={habit.id}
                                onLongPress={() => handleHabitAction(habit)}
                                style={styles.headerCell}
                            >
                                <Text style={{ fontSize: 24, marginBottom: 4 }}>{habit.icon}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Data Rows Container with Max Height constraint */}
                    <View style={{ maxHeight: 300 }}>
                        <ScrollView showsVerticalScrollIndicator={true}>
                            {dates.length === 0 ? (
                                <View style={{ padding: 20 }}>
                                    <Text style={{ color: theme.colors.textSecondary }}>No days logged yet.</Text>
                                </View>
                            ) : (
                                dates.map((dateKey: string) => {
                                    const date = new Date(dateKey + 'T00:00:00'); // Fix TZ issues roughly
                                    const isToday = isSameDay(date, new Date());

                                    return (
                                        <View key={dateKey} style={[styles.row, isToday && styles.todayRow]}>
                                            <View style={[styles.cell, styles.dateColumn]}>
                                                <Text style={[styles.dateText, isToday && { fontWeight: 'bold', color: theme.colors.text }]}>
                                                    @{isToday ? "Today" :
                                                        isSameDay(date, subDays(new Date(), 1)) ? "Yesterday" :
                                                            format(date, 'MMMM d, yyyy')}
                                                </Text>
                                            </View>
                                            {habits.map((habit: Habit) => {
                                                const isDone = getHabitStatus(dateKey, habit.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={habit.id}
                                                        style={styles.cell}
                                                        activeOpacity={0.7}
                                                        onPress={() => handleToggle(dateKey, habit.id)}
                                                    >
                                                        <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                                                            {isDone && <Check size={14} color="white" />}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    );
                                })
                            )}

                        </ScrollView>
                    </View>

                    {/* + New Page Button Row (Fixed at bottom) */}
                    <TouchableOpacity
                        onPress={handleAddNewPage}
                        disabled={isTodayLogged}
                        style={[styles.row, { marginTop: 12, opacity: isTodayLogged ? 0.5 : 1, paddingLeft: 8 }]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                            <Plus size={16} color={theme.colors.textSecondary} />
                            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Start New Day</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>



            {/* Add/Edit Habit Modal */}
            <UniversalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                animationType="slide"
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{editingHabitId ? "Edit Habit" : "New Habit"}</Text>

                    {/* 1. Emoji (Short Form) */}
                    <TextInput
                        placeholder="Emoji (e.g. 🧘)"
                        value={newHabitIcon}
                        onChangeText={setNewHabitIcon}
                        style={styles.input}
                    />

                    {/* 2. Name */}
                    <TextInput
                        placeholder="Habit Name"
                        value={newHabitName}
                        onChangeText={setNewHabitName}
                        style={styles.input}
                    />

                    {/* 3. Target (Optional) */}
                    <TextInput
                        placeholder="Target (e.g. 10 mins) - Optional"
                        value={newHabitTarget}
                        onChangeText={setNewHabitTarget}
                        style={styles.input}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSaveHabit} style={styles.saveButton}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </UniversalModal>

            <StreakPopup />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.l,
        marginVertical: theme.spacing.m,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    title: {
        ...theme.typography.subHeader,
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.text,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
        gap: 4,
    },
    addButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
        paddingVertical: 4,
    },
    todayRow: {
        backgroundColor: '#f0f8ff',
        borderRadius: 4,
    },
    cell: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateColumnHeader: {
        width: 130,
    },
    dateColumn: {
        width: 130,
        alignItems: 'flex-start',
        paddingLeft: 8,
    },
    headerCell: {
        width: 50,
        alignItems: 'center',
        paddingBottom: 8,
    },
    dateText: {
        fontSize: 13,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        marginBottom: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    cancelButton: {
        padding: 10,
    },
    cancelButtonText: {
        color: theme.colors.textSecondary,
    },
    saveButton: {
        backgroundColor: theme.colors.text,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    }
});