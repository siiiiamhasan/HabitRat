import { supabase } from '../lib/supabase';
import { Habit, Logs } from '../store/useHabitStore';

let timeoutId: NodeJS.Timeout | null = null;

export const syncUserData = async (userId: string, habits: Habit[], logs: Logs, settings: any) => {
    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(async () => {
        try {
            console.log('Syncing data to Supabase...', userId);

            // 1. Sync Habits Data
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    habits_data: { habits, logs },
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (profileError) console.error('Error syncing profile data:', profileError);

            // 2. Sync Notification Settings
            const { error: settingsError } = await supabase
                .from('notification_settings')
                .upsert({
                    user_id: userId,
                    quiet_hours_start: settings.quietHoursStart,
                    quiet_hours_end: settings.quietHoursEnd,
                    focus_mode: settings.focusMode,
                    // smart_reminders mapping if needed? logic is server side mostly
                });

            if (settingsError) console.error('Error syncing settings:', settingsError);
            else console.log('Data synced successfully.');
        } catch (e) {
            console.error('Exception syncing data:', e);
        }
    }, 2000); // 2-second debounce
};
