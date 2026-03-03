import { differenceInCalendarDays, format, getDay, getHours, parseISO, subDays } from 'date-fns';
import { Habit, Logs } from '../store/useHabitStore';

// Types
export interface TimeHeatmapData {
    heatmap: { day: number; hour: number; count: number }[];
}

export interface KeystoneHabit {
    habit: string;
    impact_score: number;
    affected_habits: string[];
}

// 1. Consistency Score (0-100)
export const calculateConsistencyScore = (habitId: string, logs: Logs) => {
    let score = 0;
    const today = new Date();
    // Check last 30 days
    let completed = 0;
    for (let i = 0; i < 30; i++) {
        const date = subDays(today, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        if (logs[dateKey]?.[habitId]) completed++;
    }

    // Simple consistency: (completed / 30) * 100
    // Weighted: Recent days worth more? For now simple.
    score = Math.round((completed / 30) * 100);

    // Trend (Last 7 days vs Previous 7 days)
    let last7 = 0;
    let prev7 = 0;
    for (let i = 0; i < 7; i++) {
        if (logs[format(subDays(today, i), 'yyyy-MM-dd')]?.[habitId]) last7++;
    }
    for (let i = 7; i < 14; i++) {
        if (logs[format(subDays(today, i), 'yyyy-MM-dd')]?.[habitId]) prev7++;
    }

    const trend = last7 > prev7 ? 'up' : last7 < prev7 ? 'down' : 'stable';
    const change_7d = last7 - prev7;

    return { score, trend, change_7d };
};

// 2. Streak Risk
export const calculateStreakRisk = (habitId: string, logs: Logs, currentStreak: number) => {
    // Basic risk logic: 
    // If streak is high (>7) but yesterday was missed (or close to end of day without log), risk is high.
    // Since useHabitStore handles strict streaks, here we predict "likelihood to break".

    // Look at completion time consistency?
    // If user usually checks at 9am, and it's 8pm, risk is high.

    const hour = new Date().getHours();
    let risk_percentage = 0;
    let risk_level = 'Low';
    let primary_factor = 'Routine stable';

    // Simple simulation logic
    if (hour > 20) {
        risk_percentage = 80;
        risk_level = 'High';
        primary_factor = 'Late in day';
    } else if (hour > 14) {
        risk_percentage = 40;
        risk_level = 'Medium';
        primary_factor = 'Afternoon slump';
    } else {
        risk_percentage = 10;
        risk_level = 'Low';
        primary_factor = 'Morning momentum';
    }

    // Adjust by history
    // Check last 7 days completion rate
    const { score } = calculateConsistencyScore(habitId, logs);
    if (score < 50) {
        risk_percentage += 20;
        primary_factor = 'Inconsistent history';
    }

    return { risk_percentage: Math.min(risk_percentage, 100), risk_level, primary_factor };
};

// 3. Time Heatmap
export const generateTimeHeatmap = (habitId: string, logs: Logs): TimeHeatmapData => {
    // This requires logs to have timestamps, but our logs are just booleans per day.
    // If we assume we don't have time data, we can't generate a real time heatmap.
    // WE WILL MOCK data for now or check if we can infer.
    // Since Logs interface is `{ [habitId]: boolean }`, we don't have time.

    // Mocking for the UI visualization as requested by user template
    // "Optimal Execution Window"

    // In a real app, we'd log the timestamp.
    // For this refactor, we return mock data or empty.

    return {
        heatmap: [
            { day: 1, hour: 9, count: 5 },
            { day: 1, hour: 10, count: 2 },
            { day: 2, hour: 9, count: 4 },
            { day: 3, hour: 18, count: 8 },
            { day: 4, hour: 19, count: 6 },
            { day: 5, hour: 9, count: 10 },
        ]
    };
};

// 4. Momentum
export const calculateMomentum = (habitId: string, logs: Logs) => {
    // Momentum = Completion Rate of Last 3 Days
    const today = new Date();
    let hits = 0;
    for (let i = 0; i < 3; i++) {
        if (logs[format(subDays(today, i), 'yyyy-MM-dd')]?.[habitId]) hits++;
    }

    let momentum = 'Stable';
    if (hits === 3) momentum = 'Improving';
    if (hits === 0) momentum = 'Declining';

    return { momentum, slope: hits };
};

// 5. Insights Generation
export const generateInsights = (habits: Habit[], logs: Logs, streak: number): string[] => {
    const insights: string[] = [];

    if (streak > 7) {
        insights.push("🔥 You're on fire! 7+ day streak.");
    }

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const todayLogged = habits.filter(h => logs[todayKey]?.[h.id]).length;

    if (todayLogged === habits.length && habits.length > 0) {
        insights.push("✨ Perfect day! You completed all habits.");
    }

    return insights;
};

// 6. Keystone Habits detection
export const detectKeystoneHabits = (habits: Habit[], logs: Logs): KeystoneHabit[] => {
    // Correlation analysis
    // If Habit A is done, is Habit B often done?

    if (habits.length < 2) return [];

    const correlations: { [key: string]: number } = {};
    const habitIds = habits.map(h => h.id);

    // Look at last 30 days
    const dates = Object.keys(logs).sort().slice(-30);

    habitIds.forEach(targetId => {
        let triggers = 0;
        let coOccurrences = 0;

        dates.forEach(d => {
            if (logs[d][targetId]) {
                triggers++;
                // Check if other habits were done
                const others = habitIds.filter(id => id !== targetId);
                const othersDone = others.filter(oid => logs[d][oid]).length;
                coOccurrences += othersDone;
            }
        });

        if (triggers > 5) { // Minimum sample
            correlations[targetId] = coOccurrences / triggers;
        }
    });

    // Sort
    const sorted = Object.entries(correlations).sort(([, a], [, b]) => b - a);

    return sorted.map(([id, score]) => {
        const h = habits.find(h => h.id === id);
        return {
            habit: h?.name || 'Unknown',
            impact_score: parseFloat((1 + (score / habits.length)).toFixed(1)),
            affected_habits: habits.filter(h => h.id !== id).slice(0, 2).map(h => h.name)
        };
    });
};

// 7. Burnout Prediction
export const predictBurnout = (habits: Habit[], logs: Logs) => {
    // If completion rate is high but consistency is dropping?
    // Or if checking too many habits?
    const totalHabits = habits.length;
    let risk_level = 'Low';
    const signals: string[] = [];

    if (totalHabits > 10) {
        risk_level = 'Medium';
        signals.push('High habit load (>10)');
    }

    // Check if user missed 2 days in a row after a long streak

    return {
        risk_level,
        signals,
        recommendation: totalHabits > 10 ? 'Consider simpler routine' : 'Keep it up!'
    };
};

export const analyzeFailureReasons = () => {
    return [];
};
