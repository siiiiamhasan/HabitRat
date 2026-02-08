// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
// @ts-ignore
import { differenceInCalendarDays, format, subDays, parseISO } from "https://esm.sh/date-fns@2.29.3";

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- COPY PACKS (The "Behavioral Budget") ---
const COPY_PACKS = {
    // Type A: Basic Reminder (Neutral/Polite) - High Frequency allowed
    basic: [
        "Time for {habit}! small steps.",
        "Don't forget {habit} today.",
        "Ready to crush {habit}?",
        "Gentle reminder: {habit} awaits.",
        "Keep the momentum: {habit} time."
    ],
    // Type B: Streak Protection (Loss Aversion) - Trigger: Streak > 3 & Risk High
    streak_protection: [
        "🔥 Danger! Your {streak} day streak on {habit} is at risk!",
        "Don't let your {streak} day streak break now!",
        "Save your streak! Do {habit} before midnight.",
        "You've come too far to stop. {streak} days and counting!",
        "Emergency: {habit} streak entering critical zone."
    ],
    // Type C: Identity Reinforcement (Pride) - Trigger: Consistency > 80%
    identity: [
        "You're the kind of person who crushes {habit}.",
        "{habit} is just who you are now.",
        "Look at you go! A true {habit} master.",
        "Excellence is a habit, and you're proving it with {habit}.",
        "Building a better you, one {habit} at a time."
    ],
    // Type D: Recovery (Empathy) - Trigger: Missed yesterday
    recovery: [
        "Missed yesterday? No stress. Today is a fresh start.",
        "The best time to plant a tree was yesterday. Second best is now.",
        "Don't break the chain twice. Get back on {habit}!",
        "Bounce back! One miss isn't failure.",
        "Resilience is key. Restart {habit} today."
    ],
    // Type E: Smart Window (Timing) - Trigger: Time of day pattern
    smart_window: [
        "Usually you do {habit} right now. Ready?",
        "It's your prime time for {habit}!",
        "Clock's ticking on your usual {habit} slot.",
        "Perfect time for {habit} based on your history.",
        "Seize the moment: {habit} time."
    ],
    // Type G: Burnout Prevention (Compassion) - Trigger: Trend Down + High Intensity
    burnout: [
        "Take it easy. Just a small {habit} today counts.",
        "Feeling tired? A partial {habit} is better than none.",
        "Consistency > Intensity. Just show up.",
        "Be kind to yourself. Small win on {habit}?",
        "Low energy? That's okay. Keep the habit alive."
    ],
    // Type F: Fragility (Wobbly Streak)
    fragility: [
        "Careful! Your {streak} day streak is looking shaky.",
        "Don't let your hard work slip away.",
        "You built this streak. Defend it today.",
        "Steady the ship. Do {habit} to secure your progress.",
        "Focus! Keep your {streak} days safe."
    ]
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Init Supabase
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 2. Fetch Users with Push Token & Data
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('id, push_token, habits_data, notification_settings(quiet_hours_start, quiet_hours_end, focus_mode)') // Joined query if relation exists, else separate
            .not('push_token', 'is', null)
            .order('id'); // Batching? For now process all.

        if (error) throw error;

        console.log(`Processing ${profiles.length} profiles...`);
        const notificationsToSend: any[] = [];
        const historyLogInsert: any[] = [];

        const now = new Date();
        const currentHour = now.getUTCHours(); // Simplified: Doing everything in UTC for MVP or need offset

        for (const profile of profiles) {
            if (!profile.habits_data) continue;

            const { habits, logs } = profile.habits_data; // JSONB
            const settings = profile.notification_settings?.[0] || {}; // Handle relation array or object

            // --- FILTER 1: Quiet Hours & Focus Mode ---
            // (Assuming simple UTC check or we skip complex timezone math for MVP and assume server run time matches user expectation roughly, 
            // OR user provides offset. For MVP, we'll skip strict timezone check if not provided, or assume UTC)
            if (settings.focus_mode) continue;

            // --- BEHAVIOR ENGINE ---
            for (const habit of habits) {
                // Check if already completed today
                const todayKey = format(now, 'yyyy-MM-dd');
                const todayLog = logs[todayKey]?.[habit.id];
                const isCompleted = typeof todayLog === 'object' ? todayLog.completed : !!todayLog;

                if (isCompleted) continue; // Skip if done

                // Calculate Metrics
                const streak = calculateStreak(habit.id, logs);
                const consistency = calculateConsistency(habit.id, logs);

                // Decider Logic
                let type: keyof typeof COPY_PACKS = 'basic';
                let priority = 1;

                if (streak > 3) {
                    type = 'streak_protection'; // Prioritize saving streaks
                    priority = 10;
                } else if (consistency > 80) {
                    type = 'identity';
                    priority = 5;
                } else if (wasMissedYesterday(habit.id, logs)) {
                    type = 'recovery';
                    priority = 8;
                }

                // Anti-Fatigue: Check if we sent this type recently (mock logic for now, would query history)
                // For MVP: Randomize copy
                const copyOptions = COPY_PACKS[type];
                const message = copyOptions[Math.floor(Math.random() * copyOptions.length)].replace('{habit}', habit.name).replace('{streak}', streak.toString());

                // Add to send list
                notificationsToSend.push({
                    to: profile.push_token,
                    sound: 'default',
                    title: type === 'streak_protection' ? '🔥 Streak at Risk!' : 'HabitRat',
                    body: message,
                    data: { habitId: habit.id, type }
                });

                // Log
                historyLogInsert.push({
                    user_id: profile.id,
                    habit_id: habit.id,
                    notification_type: type,
                    sent_at: now.toISOString()
                });

                // Limit to 1 notification per user per run to avoid spam?
                // "Why this message? Why not others?" logic. 
                // Return to break inner loop if we only want 1 notification per user batch.
                break;
            }
        }

        // 3. Send via Expo (Batching)
        if (notificationsToSend.length > 0) {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notificationsToSend),
            });
        }

        // 4. Log History
        if (historyLogInsert.length > 0) {
            await supabaseClient.from('notification_history').insert(historyLogInsert);
        }

        return new Response(JSON.stringify({ sent: notificationsToSend.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

// --- HELPER FUNCTIONS ---
function calculateStreak(habitId: any, logs: any) {
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 365; i++) {
        const date = subDays(today, i);
        const key = format(date, 'yyyy-MM-dd');
        const entry = logs[key]?.[habitId];
        const done = typeof entry === 'object' ? entry.completed : !!entry;
        if (done) streak++;
        else break;
    }
    return streak;
}

function calculateConsistency(habitId: any, logs: any) {
    // Simple 30 day consistency
    let completed = 0;
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
        const date = subDays(today, i);
        const key = format(date, 'yyyy-MM-dd');
        const entry = logs[key]?.[habitId];
        if (typeof entry === 'object' ? entry.completed : !!entry) completed++;
    }
    return (completed / 30) * 100;
}

function wasMissedYesterday(habitId: any, logs: any) {
    const yesterday = subDays(new Date(), 1);
    const key = format(yesterday, 'yyyy-MM-dd');
    const entry = logs[key]?.[habitId];
    return !(typeof entry === 'object' ? entry.completed : !!entry);
}

function calculateAverageTime(habitId: any, logs: any): number | null {
    let totalHours = 0;
    let count = 0;
    const entries = Object.values(logs);

    for (const dayLog of entries as any[]) {
        const entry = dayLog[habitId];
        if (typeof entry === 'object' && entry.completionTime) {
            const date = new Date(entry.completionTime);
            totalHours += date.getUTCHours(); // Use UTC for consistency
            count++;
        }
    }

    return count > 0 ? Math.round(totalHours / count) : null;
}
