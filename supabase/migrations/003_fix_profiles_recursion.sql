-- Fix infinite recursion: profiles policy was referencing profiles table
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Coaches can view their students" on public.profiles;
drop policy if exists "Coaches can view all students" on public.profiles;

-- Simple policy: all authenticated users can see all profiles
create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.uid() is not null);
