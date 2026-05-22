-- SUPABASE DATABASE SCHEMA FOR PROMPTVERSE
-- Easily import this SQL file into your Supabase SQL Editor.
-- Configured with Tables, Relations, Indexes, and Row Level Security (RLS) rules.

-- 1. Enable UUID generating extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Users Table (Profile reference)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  badge TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to all profiles" 
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Allow active authenticated user to update their own profile" 
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- 3. Create Prompts Table
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  cover_image TEXT,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  creator_name TEXT NOT NULL,
  creator_avatar TEXT,
  creator_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for prompts
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to view prompts" 
  ON public.prompts FOR SELECT USING (true);

CREATE POLICY "Allow users to create prompts" 
  ON public.prompts FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Allow author to edit or delete their prompt" 
  ON public.prompts FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Allow author or admin to delete prompt" 
  ON public.prompts FOR DELETE USING (auth.uid() = creator_id OR EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- 4. Create Likes Table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, prompt_id)
);

-- Enable RLS for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read likes count" 
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Allow authenticated user to like a prompt" 
  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated user to unlike" 
  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Saves / Bookmarks Table
CREATE TABLE IF NOT EXISTS public.saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  folder_name TEXT DEFAULT 'Core' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, prompt_id)
);

-- Enable RLS for saves
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Saves are private: user can only see their own bookmarks" 
  ON public.saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow user to save a prompt" 
  ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user to unsave prompt" 
  ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- 6. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read comments" 
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to post comments" 
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow author or admin to delete comment" 
  ON public.comments FOR DELETE USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- 7. Create Followers Table
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (follower_id, following_id)
);

-- Enable RLS for followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Followers are public readable" 
  ON public.followers FOR SELECT USING (true);

CREATE POLICY "Allow users to establish follow relationships" 
  ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Allow users to unfollow" 
  ON public.followers FOR DELETE USING (auth.uid() = follower_id);

-- 8. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'save', 'comment', 'follow', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications are private to the recipient user" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow recipient to update read status of their notifications" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 9. Create Reports Table (Moderation)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read reports" 
  ON public.reports FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Only authenticated users can file reports" 
  ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- 10. Indexes for optimized query execution
CREATE INDEX IF NOT EXISTS idx_prompts_creator ON public.prompts(creator_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_likes_prompt ON public.likes(prompt_id);
CREATE INDEX IF NOT EXISTS idx_saves_user ON public.saves(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_prompt ON public.comments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read = false;


-- 11. Create Posts Table (to support direct posts table uploads seamlessly)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  cover_image TEXT,
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  creator_id UUID,
  creator_name TEXT,
  creator_avatar TEXT,
  creator_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select from posts" 
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Allow public insert into posts" 
  ON public.posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update in posts" 
  ON public.posts FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from posts" 
  ON public.posts FOR DELETE USING (true);


-- 12. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  customer_email TEXT,
  item TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select from orders" 
  ON public.orders FOR SELECT USING (true);

CREATE POLICY "Allow public insert into orders" 
  ON public.orders FOR INSERT WITH CHECK (true);


-- 13. Create Storage Bucket 'posts' mapping and enable open RLS policies
-- Note: In Supabase, bucket creation can be handled inside SQL directly!
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts',
  'posts',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to 'posts' bucket objects
CREATE POLICY "Allow public read access to posts bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'posts');

CREATE POLICY "Allow public insert access to posts bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Allow public update access to posts bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'posts');

CREATE POLICY "Allow public delete access to posts bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'posts');

