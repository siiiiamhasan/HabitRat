import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { subDays, format, isAfter, parseISO } from "date-fns";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // 1. Fetch distinct user_ids from 'habits' table.
        const { data: users, error: usersError } = await supabase
            .from("habits")
            .select("user_id")
            .neq("is_active", false); // Only active users

        if (usersError) throw usersError;

        // extensive use of Sets to get unique user_ids
        const uniqueUserIds = [...new Set(users.map((u: any) => u.user_id))];
        const results = [];

        for (const userId of uniqueUserIds) {
            const result = await computeUserAnalytics(supabase, userId);
            results.push(result);
        }

        return new Response(JSON.stringify({ processed: results.length, details: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

async function computeUserAnalytics(supabase: any, userId: string) {
    const today = new Date();
    const analyticsDate = format(today, "yyyy-MM-dd");
    const thirtyDaysAgo = subDays(today, 30);

    // 1. Fetch User's Habits
    const { data: habits } = await supabase
        .from("habits")
        .select("id, name")
        .eq("user_id", userId)
        .eq("is_active", true);

    if (!habits || habits.length === 0) return { userId, status: "no_habits" };

    // 2. Fetch User's Logs for last 30 days
    const { data: logs } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("log_date", format(thirtyDaysAgo, "yyyy-MM-dd"));

    const burnoutSignals: any = {
        highLoad: habits.length >= 6,
        decliningHabits: 0,
        missFrequencyIncreasing: false, // simplified for now
    };

    for (const habit of habits) {
        const habitLogs = logs?.filter((l: any) => l.habit_id === habit.id) || [];

        // Calculate Score (Simple Consistency)
        // Last 30 days completion rate
        const completions = habitLogs.filter((l: any) => l.completed).length;
        const consistencyScore = Math.min(100, Math.round((completions / 30) * 100));

        // Calculate Streak Fragility
        // Logic: higher if recent misses exist
        const last7DaysLogs = habitLogs.filter((l: any) => isAfter(parseISO(l.log_date), subDays(today, 7)));
        const missedLast7Days = 7 - last7DaysLogs.filter((l: any) => l.completed).length; // Rough approx
        const streakFragility = Math.min(100, Math.round((missedLast7Days / 7) * 100));

        // Calculate Momentum (Slope)
        // Compare last 14 vs prev 14? simplified: 
        // If consistency > 80% -> Improving/Stable. consistency < 50% -> Declining.
        let momentum = "Stable";
        let momentumSlope = 0;
        if (consistencyScore > 80) momentum = "Improving";
        else if (consistencyScore < 40) {
            momentum = "Declining";
            burnoutSignals.decliningHabits++;
        }

        // Upsert Analytics
        await supabase.from("habit_analytics_daily").upsert({
            habit_id: habit.id,
            user_id: userId,
            analytics_date: analyticsDate,
            consistency_score: consistencyScore,
            streak_fragility: streakFragility,
            momentum: momentum,
            momentum_slope: momentumSlope,
            burnout_signal: consistencyScore < 30 // simple signal
        }, { onConflict: "habit_id, analytics_date" });
    }

    // Compute Burnout
    let riskLevel = "Low";
    if (burnoutSignals.highLoad && burnoutSignals.decliningHabits >= 3) riskLevel = "High";
    else if (burnoutSignals.highLoad || burnoutSignals.decliningHabits >= 2) riskLevel = "Medium";

    await supabase.from("user_burnout_daily").upsert({
        user_id: userId,
        analytics_date: analyticsDate,
        risk_level: riskLevel,
        signals: burnoutSignals
    }, { onConflict: "user_id, analytics_date" });

    return { userId, status: "processed", riskLevel };
}
