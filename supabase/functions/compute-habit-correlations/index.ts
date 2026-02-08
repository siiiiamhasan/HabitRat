import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { subDays, format } from "date-fns";

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

        // 1. Fetch active users (distinct from habits table)
        const { data: users, error: usersError } = await supabase
            .from("habits")
            .select("user_id")
            .neq("is_active", false);

        if (usersError) throw usersError;

        const uniqueUserIds = [...new Set(users.map((u: any) => u.user_id))];
        const results = [];

        for (const userId of uniqueUserIds) {
            const result = await computeUserCorrelations(supabase, userId);
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

async function computeUserCorrelations(supabase: any, userId: string) {
    const today = new Date();
    const sixtyDaysAgo = subDays(today, 60);

    // 1. Fetch User's Habits
    const { data: habits } = await supabase
        .from("habits")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true);

    if (!habits || habits.length < 2) return { userId, status: "insufficient_habits" };

    // 2. Fetch User's Logs for last 60 days
    const { data: logs } = await supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .eq("user_id", userId)
        .gte("log_date", format(sixtyDaysAgo, "yyyy-MM-dd"));

    if (!logs || logs.length < 10) return { userId, status: "insufficient_data" };

    const totalDays = 60; // Approximate
    // Map: date -> Set of completed habit_ids
    const dayMap = new Map<string, Set<string>>();

    logs.forEach((l: any) => {
        if (l.completed) {
            const d = l.log_date;
            if (!dayMap.has(d)) dayMap.set(d, new Set());
            dayMap.get(d)!.add(l.habit_id);
        }
    });

    const habitCounts = new Map<string, number>();
    // Initialize counts
    habits.forEach((h: any) => habitCounts.set(h.id, 0));

    // Count recurrences
    for (const completedSet of dayMap.values()) {
        for (const hId of completedSet) {
            habitCounts.set(hId, (habitCounts.get(hId) || 0) + 1);
        }
    }

    // Compute Correlations (Lift)
    // For each pair (A, B)
    for (const habitA of habits) {
        const countA = habitCounts.get(habitA.id) || 0;
        if (countA === 0) continue;

        const probA = countA / totalDays;

        for (const habitB of habits) {
            if (habitA.id === habitB.id) continue;

            const countB = habitCounts.get(habitB.id) || 0;
            if (countB === 0) continue;

            const probB = countB / totalDays;

            // Count(A & B)
            let countAB = 0;
            for (const completedSet of dayMap.values()) {
                if (completedSet.has(habitA.id) && completedSet.has(habitB.id)) {
                    countAB++;
                }
            }

            const probB_given_A = countAB / countA; // P(B|A)

            // Lift = P(B|A) / P(B)
            // If ProbB is very small, lift can be huge but noisy.
            let lift = 0;
            if (probB > 0) {
                lift = probB_given_A / probB;
            }

            // Store if significant correlation (e.g. Lift > 1.2 meaning 20% more likely)
            // Also store if negative? Prompt implies "increases completion probability".
            if (lift > 1.1) {
                await supabase.from("habit_correlations").upsert({
                    user_id: userId,
                    habit_a: habitA.id,
                    habit_b: habitB.id,
                    correlation_score: parseFloat(lift.toFixed(3))
                }, { onConflict: "user_id, habit_a, habit_b" });
            }
        }
    }

    return { userId, status: "processed" };
}
