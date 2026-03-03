import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';
import { theme } from '../constants/theme';

interface HeatmapProps {
    month?: Date;
    cellSize?: number;
    gap?: number;
    showLegend?: boolean;
    showMonthLabel?: boolean;
    disableContainer?: boolean;
}

export default function Heatmap({
    month = new Date(),
    cellSize = 24,
    gap = 6,
    showLegend = true,
    showMonthLabel = true,
    disableContainer = false
}: HeatmapProps) {
    const logs = useHabitStore(state => state.logs); // Subscribe to updates
    const getCompletionPercentage = useHabitStore(state => state.getCompletionPercentage);

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
    });

    const getLevel = (date: Date) => {
        const percentage = getCompletionPercentage(date);
        if (percentage === 0) return 0;
        if (percentage <= 0.25) return 1;
        if (percentage <= 0.5) return 2;
        if (percentage <= 0.75) return 3;
        return 4;
    };

    const Container = disableContainer ? View : View;
    const containerStyle = disableContainer ? {} : styles.container;

    return (
        <View style={containerStyle}>
            {showMonthLabel && <Text style={styles.monthLabel}>{format(month, 'MMMM yyyy')}</Text>}
            <View style={[styles.grid, { gap }]}>
                {daysInMonth.map((date: Date) => {
                    const level = getLevel(date) as 0 | 1 | 2 | 3 | 4;
                    return (
                        <View
                            key={date.toISOString()}
                            style={[
                                styles.cell,
                                {
                                    backgroundColor: theme.colors.heatmap[level],
                                    width: cellSize,
                                    height: cellSize,
                                    borderRadius: cellSize / 6
                                }
                            ]}
                        />
                    );
                })}
            </View>
            {showLegend && (
                <View style={styles.legendContainer}>
                    <Text style={styles.legendText}>Less</Text>
                    {([0, 1, 2, 3, 4] as const).map(level => (
                        <View key={level} style={[styles.legendBox, { backgroundColor: theme.colors.heatmap[level] }]} />
                    ))}
                    <Text style={styles.legendText}>More</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.m,
        backgroundColor: '#F6F8FA',
        borderRadius: theme.borderRadius.l,
        marginVertical: theme.spacing.m,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    monthLabel: {
        ...theme.typography.subHeader,
        marginBottom: theme.spacing.s,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    cell: {
        // base style, overridden by props
    },
    legendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: theme.spacing.m,
        gap: 4,
    },
    legendBox: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    legendText: {
        fontSize: 10,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    }
});
