-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_scripts table for storing chat scripts
CREATE TABLE IF NOT EXISTS public.saved_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  characters JSONB NOT NULL DEFAULT '[]',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_scripts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Saved scripts policies
CREATE POLICY "scripts_select_own" ON public.saved_scripts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "scripts_insert_own" ON public.saved_scripts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scripts_update_own" ON public.saved_scripts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "scripts_delete_own" ON public.saved_scripts 
  FOR DELETE USING (auth.uid() = user_id);
