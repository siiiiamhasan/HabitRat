import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { eachDayOfInterval, endOfYear, format, getDay, startOfYear } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';
import { theme } from '../constants/theme';

interface YearlyHeatmapProps {
    year: number;
    color?: string;
}

export default function YearlyHeatmap({ year, color = theme.colors.primary }: YearlyHeatmapProps) {
    const getCompletionPercentage = useHabitStore(state => state.getCompletionPercentage);

    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 0, 1));

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Group by weeks for columns (GitHub style: columns are weeks)
    // We need to pad the beginning if the year doesn't start on Sunday/Monday
    // 0 = Sunday, 1 = Monday...

    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day) => {
        const dayOfWeek = getDay(day); // 0 (Sun) to 6 (Sat)

        // If it's a new week (say Sunday is start), and we have logs, push old week
        // Assuming Sunday start for simplicity
        if (dayOfWeek === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Calculate level based on percentage
    const getLevel = (date: Date) => {
        const percentage = getCompletionPercentage(date);
        if (percentage === 0) return 0;
        if (percentage <= 0.25) return 1;
        if (percentage <= 0.5) return 2;
        if (percentage <= 0.75) return 3;
        return 4;
    };

    return (
        <View style={styles.container}>
            <View style={styles.graph}>
                {weeks.map((week, wIndex) => (
                    <View key={wIndex} style={styles.column}>
                        {week.map((day, dIndex) => {
                            const level = getLevel(day) as 0 | 1 | 2 | 3 | 4;
                            return (
                                <View
                                    key={day.toISOString()}
                                    style={[
                                        styles.cell,
                                        {
                                            backgroundColor: theme.colors.heatmap[level],
                                            // Opacity fallback if heatmap colors aren't defined
                                            opacity: level === 0 ? 0.3 : 1
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>
                ))}
            </View>
            <View style={styles.legend}>
                <Text style={styles.legendText}>Less</Text>
                <View style={styles.legendGradient}>
                    {([0, 1, 2, 3, 4] as const).map(l => (
                        <View key={l} style={[styles.legendBox, { backgroundColor: theme.colors.heatmap[l] }]} />
                    ))}
                </View>
                <Text style={styles.legendText}>More</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    graph: {
        flexDirection: 'row',
        gap: 2,
    },
    column: {
        flexDirection: 'column',
        gap: 2,
        justifyContent: 'flex-start', // Align to top
    },
    cell: {
        width: 4,
        height: 4,
        borderRadius: 1,
        backgroundColor: '#eee',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    legendGradient: {
        flexDirection: 'row',
        gap: 2,
    },
    legendBox: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    legendText: {
        color: 'white',
        fontSize: 10,
        opacity: 0.8,
    }
});
