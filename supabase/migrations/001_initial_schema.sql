-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('coach', 'student')),
  coach_id uuid references public.profiles(id),
  invite_code text unique,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Coaches can view their students"
  on public.profiles for select
  using (
    auth.uid() = coach_id
    or auth.uid() = id
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Golf courses
create table public.golf_courses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  coach_id uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.golf_courses enable row level security;

create policy "Coaches can manage their courses"
  on public.golf_courses for all
  using (auth.uid() = coach_id);

create policy "Students can view their coach courses"
  on public.golf_courses for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.coach_id = golf_courses.coach_id
    )
  );

-- Course holes
create table public.course_holes (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references public.golf_courses(id) on delete cascade not null,
  hole_number int not null check (hole_number between 1 and 18),
  par int not null check (par between 3 and 5),
  unique (course_id, hole_number)
);

alter table public.course_holes enable row level security;

create policy "Course holes follow course access"
  on public.course_holes for all
  using (
    exists (
      select 1 from public.golf_courses
      where golf_courses.id = course_holes.course_id
        and golf_courses.coach_id = auth.uid()
    )
  );

create policy "Students can view course holes"
  on public.course_holes for select
  using (
    exists (
      select 1 from public.golf_courses
      join public.profiles on profiles.coach_id = golf_courses.coach_id
      where golf_courses.id = course_holes.course_id
        and profiles.id = auth.uid()
    )
  );

-- Scorecards
create table public.scorecards (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) not null,
  course_id uuid references public.golf_courses(id) not null,
  tournament_name text not null default '',
  round_date date not null default current_date,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'reviewed')),
  hundred_yards_in int,
  reflections text,
  mentality_rating int check (mentality_rating between 1 and 4),
  what_transpired text,
  how_to_respond text,
  coach_feedback text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.scorecards enable row level security;

create policy "Students can manage their own scorecards"
  on public.scorecards for all
  using (auth.uid() = student_id);

create policy "Coaches can view and update their students scorecards"
  on public.scorecards for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = scorecards.student_id
        and profiles.coach_id = auth.uid()
    )
  );

create policy "Coaches can update their students scorecards"
  on public.scorecards for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = scorecards.student_id
        and profiles.coach_id = auth.uid()
    )
  );

-- Hole scores
create table public.hole_scores (
  id uuid default gen_random_uuid() primary key,
  scorecard_id uuid references public.scorecards(id) on delete cascade not null,
  hole_number int not null check (hole_number between 1 and 18),
  par int not null check (par between 3 and 5),
  score int,
  fairway text check (fairway in ('hit', 'left', 'right')),
  gir text check (gir in ('hit', 'left', 'right', 'short', 'long')),
  putts int,
  first_putt_distance int,
  up_and_down boolean,
  penalty_strokes int default 0 not null,
  chip_in boolean default false not null,
  coach_note text,
  unique (scorecard_id, hole_number)
);

alter table public.hole_scores enable row level security;

create policy "Hole scores follow scorecard access for students"
  on public.hole_scores for all
  using (
    exists (
      select 1 from public.scorecards
      where scorecards.id = hole_scores.scorecard_id
        and scorecards.student_id = auth.uid()
    )
  );

create policy "Coaches can view their students hole scores"
  on public.hole_scores for select
  using (
    exists (
      select 1 from public.scorecards
      join public.profiles on profiles.id = scorecards.student_id
      where scorecards.id = hole_scores.scorecard_id
        and profiles.coach_id = auth.uid()
    )
  );

create policy "Coaches can update their students hole scores"
  on public.hole_scores for update
  using (
    exists (
      select 1 from public.scorecards
      join public.profiles on profiles.id = scorecards.student_id
      where scorecards.id = hole_scores.scorecard_id
        and profiles.coach_id = auth.uid()
    )
  );

-- Notifications
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  type text not null check (type in ('scorecard_submitted', 'scorecard_reviewed')),
  scorecard_id uuid references public.scorecards(id) on delete cascade not null,
  message text not null,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Allow system to insert notifications (via trigger)
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Auto-update updated_at on scorecards
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scorecards_updated_at
  before update on public.scorecards
  for each row execute function update_updated_at();

-- Auto-create notifications on scorecard status change
create or replace function notify_on_status_change()
returns trigger as $$
begin
  if old.status = 'in_progress' and new.status = 'submitted' then
    -- Notify the coach
    insert into public.notifications (user_id, type, scorecard_id, message)
    select
      profiles.coach_id,
      'scorecard_submitted',
      new.id,
      (select full_name from public.profiles where id = new.student_id) || ' submitted a scorecard for review'
    from public.profiles
    where profiles.id = new.student_id
      and profiles.coach_id is not null;
  end if;

  if old.status = 'submitted' and new.status = 'reviewed' then
    -- Notify the student
    insert into public.notifications (user_id, type, scorecard_id, message)
    values (
      new.student_id,
      'scorecard_reviewed',
      new.id,
      'Your coach has reviewed your scorecard'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger scorecard_status_notification
  after update on public.scorecards
  for each row
  when (old.status is distinct from new.status)
  execute function notify_on_status_change();

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;
