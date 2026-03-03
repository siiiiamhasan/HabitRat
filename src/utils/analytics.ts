import { Habit, Logs } from '../store/useHabitStore';
import { differenceInCalendarDays, parseISO, subDays, getDay } from 'date-fns';

export const generateInsights = (habits: Habit[], logs: Logs, streak: number): string[] => {
    const insights: string[] = [];

    // 1. Streak Motivation
    if (streak > 7) {
        insights.push(`🔥 You're on fire! ${streak} days streak. Keep it up!`);
    } else if (streak > 3) {
        insights.push(`🚀 Great momentum! You've hit ${streak} days in a row.`);
    }

    // 2. Identify Struggling Habits
    // Check last 7 days
    const strugglingHabits = habits.filter(habit => {
        let completions = 0;
        for (let i = 0; i < 7; i++) {
            const dateKey = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            if (logs[dateKey]?.[habit.id]) completions++;
        }
        return completions < 3; // Less than 3 times in 7 days
    });

    if (strugglingHabits.length > 0) {
        const names = strugglingHabits.map(h => h.name).slice(0, 2).join(', ');
        insights.push(`💪 Focus on ${names}. Consistency is key to building lasting habits.`);
    }

    // 3. Weekend Drop-off Detection
    // Check last 4 weekends (8 days)
    let weekendMisses = 0;
    let weekendOpportunities = 0;

    for (let i = 0; i < 28; i++) {
        const date = subDays(new Date(), i);
        const dayOfWeek = getDay(date); // 0=Sun, 6=Sat

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendOpportunities++;
            const dateKey = date.toISOString().split('T')[0];
            const log = logs[dateKey] || {};
            // If less than 50% of habits done, count as a "miss"
            const doneCount = habits.filter(h => log[h.id]).length;
            if (doneCount < (habits.length / 2)) weekendMisses++;
        }
    }

    if (weekendOpportunities > 0 && (weekendMisses / weekendOpportunities) > 0.5) {
        insights.push("📅 You tend to miss habits on weekends. Try setting specific reminders for Saturday and Sunday.");
    }

    // 4. Time of day / General Advice (Random rotation)
    const generalTips = [
        "💡 Tip: Stack your new habit with an existing one (e.g., 'After I brush my teeth, I will read').",
        "💡 Tip: Start small. Regularity beats intensity.",
        "💡 Tip: Prepare your environment the night before to reduce friction.",
    ];
    insights.push(generalTips[Math.floor(Math.random() * generalTips.length)]);

    return insights;
};
