-- Add push_token and habits_data to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS habits_data JSONB;

-- Notification Settings
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone TEXT DEFAULT 'UTC',
    focus_mode BOOLEAN DEFAULT FALSE,
    enabled_types TEXT[] DEFAULT ARRAY['basic', 'streak_protection', 'identity', 'recovery', 'smart_window', 'burnout', 'reward']
);

-- Notification History (Anti-Fatigue)
CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    habit_id TEXT, -- Optional, if specific to a habit
    notification_type TEXT NOT NULL,
    copy_variant_id TEXT, -- ID of the specific message template used
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Store specific details
);

-- Index for fast lookup of recent notifications
CREATE INDEX IF NOT EXISTS idx_notif_history_user_type_time 
ON public.notification_history (user_id, notification_type, sent_at DESC);

-- RLS Policies
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" 
ON public.notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own history" 
ON public.notification_history FOR SELECT 
USING (auth.uid() = user_id);
