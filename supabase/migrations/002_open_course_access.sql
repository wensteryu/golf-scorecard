-- Allow anyone to create courses (single-coach model)
drop policy if exists "Coaches can manage their courses" on public.golf_courses;
drop policy if exists "Students can view their coach courses" on public.golf_courses;

create policy "Anyone can view courses"
  on public.golf_courses for select
  using (true);

create policy "Anyone can create courses"
  on public.golf_courses for insert
  with check (auth.uid() is not null);

create policy "Anyone can update courses"
  on public.golf_courses for update
  using (auth.uid() is not null);

create policy "Anyone can delete courses"
  on public.golf_courses for delete
  using (auth.uid() is not null);

-- Allow anyone to manage course holes
drop policy if exists "Course holes follow course access" on public.course_holes;
drop policy if exists "Students can view course holes" on public.course_holes;

create policy "Anyone can view course holes"
  on public.course_holes for select
  using (true);

create policy "Anyone can manage course holes"
  on public.course_holes for all
  using (auth.uid() is not null);

-- Allow coaches to see all submitted scorecards (single-coach model)
drop policy if exists "Coaches can view and update their students scorecards" on public.scorecards;
drop policy if exists "Coaches can update their students scorecards" on public.scorecards;

create policy "Coaches can view all submitted scorecards"
  on public.scorecards for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'coach'
    )
  );

create policy "Coaches can update all scorecards"
  on public.scorecards for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'coach'
    )
  );

-- Allow coaches to see all hole scores
drop policy if exists "Coaches can view their students hole scores" on public.hole_scores;
drop policy if exists "Coaches can update their students hole scores" on public.hole_scores;

create policy "Coaches can view all hole scores"
  on public.hole_scores for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'coach'
    )
  );

create policy "Coaches can update all hole scores"
  on public.hole_scores for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'coach'
    )
  );

-- Allow coaches to view all student profiles
drop policy if exists "Coaches can view their students" on public.profiles;

create policy "Coaches can view all students"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles as p
      where p.id = auth.uid()
        and p.role = 'coach'
    )
    or auth.uid() = id
  );
