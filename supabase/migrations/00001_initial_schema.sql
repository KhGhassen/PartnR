-- ============================================================
-- PartnR — Schéma initial de base de données
-- ============================================================
-- Convention : snake_case, UUID partout, soft delete nulle part (POC)
-- Les timestamps utilisent timestamptz (timezone-aware)

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
create extension if not exists "moddatetime" schema "extensions";

-- ============================================================
-- 2. TYPES ENUM
-- ============================================================
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.participant_status as enum ('confirmed', 'cancelled');
create type public.user_role as enum ('user', 'admin');

-- ============================================================
-- 3. TABLE : profiles
-- ============================================================
-- Liée 1:1 à auth.users via l'id.
-- Créée automatiquement au signup via un trigger.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null default '',
  phone text,                          -- format E.164 (+33612345678)
  phone_verified boolean not null default false,
  avatar_url text,
  city text not null default '',
  bio text not null default '' check (char_length(bio) <= 300),
  favorite_activities text[] not null default '{}' check (array_length(favorite_activities, 1) <= 3 or favorite_activities = '{}'),
  role public.user_role not null default 'user',
  rating_avg numeric(3,2) not null default 0,  -- moyenne glissante
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profils utilisateurs, extension de auth.users';

-- Auto-update updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function extensions.moddatetime('updated_at');

-- ============================================================
-- 4. TABLE : activities (référentiel)
-- ============================================================
-- Liste fermée d'activités pour garder la cohérence.
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,           -- ex: "Running", "Randonnée"
  slug text not null unique,           -- ex: "running", "randonnee"
  icon text not null default '🏃',     -- emoji pour l'UI
  created_at timestamptz not null default now()
);

comment on table public.activities is 'Référentiel des activités disponibles';

-- ============================================================
-- 5. TABLE : events
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id),
  title text not null check (char_length(title) between 3 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  city text not null,
  location text not null,              -- adresse ou point de RDV
  date timestamptz not null,
  max_participants integer not null check (max_participants between 2 and 50),
  status public.event_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.events is 'Événements créés par les utilisateurs';

create index events_city_date_idx on public.events (city, date);
create index events_activity_idx on public.events (activity_id);
create index events_status_idx on public.events (status);
create index events_created_by_idx on public.events (created_by);

create trigger events_updated_at
  before update on public.events
  for each row execute function extensions.moddatetime('updated_at');

-- ============================================================
-- 6. TABLE : event_participants
-- ============================================================
-- Le créateur est automatiquement ajouté comme participant.
create table public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.participant_status not null default 'confirmed',
  joined_at timestamptz not null default now(),

  unique (event_id, user_id)
);

comment on table public.event_participants is 'Participants confirmés par événement';

create index ep_event_idx on public.event_participants (event_id);
create index ep_user_idx on public.event_participants (user_id);

-- ============================================================
-- 7. TABLE : messages (chat de groupe)
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Messages du chat de groupe par événement';

create index messages_event_created_idx on public.messages (event_id, created_at);

-- ============================================================
-- 8. TABLE : ratings
-- ============================================================
-- Un participant note les autres participants après l'événement.
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rated_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  created_at timestamptz not null default now(),

  unique (event_id, rater_id, rated_id),
  check (rater_id != rated_id)          -- on ne se note pas soi-même
);

comment on table public.ratings is 'Notations post-activité entre participants';

create index ratings_rated_idx on public.ratings (rated_id);

-- ============================================================
-- 9. FUNCTIONS
-- ============================================================

-- 9a. Créer automatiquement un profil au signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9b. Ajouter le créateur comme participant quand un event est créé
create or replace function public.auto_join_creator()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.event_participants (event_id, user_id, status)
  values (new.id, new.created_by, 'confirmed');
  return new;
end;
$$;

create trigger on_event_created
  after insert on public.events
  for each row execute function public.auto_join_creator();

-- 9c. Mettre à jour la moyenne de notation d'un profil
create or replace function public.update_rating_avg()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.profiles
  set
    rating_avg = (
      select coalesce(round(avg(score)::numeric, 2), 0)
      from public.ratings
      where rated_id = new.rated_id
    ),
    rating_count = (
      select count(*)
      from public.ratings
      where rated_id = new.rated_id
    )
  where id = new.rated_id;
  return new;
end;
$$;

create trigger on_rating_created
  after insert on public.ratings
  for each row execute function public.update_rating_avg();

-- 9d. Vérifier qu'on ne dépasse pas max_participants
create or replace function public.check_max_participants()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  current_count integer;
  max_allowed integer;
begin
  select count(*) into current_count
  from public.event_participants
  where event_id = new.event_id and status = 'confirmed';

  select max_participants into max_allowed
  from public.events
  where id = new.event_id;

  if current_count >= max_allowed then
    raise exception 'Événement complet (% / % participants)', current_count, max_allowed;
  end if;

  return new;
end;
$$;

create trigger before_join_event
  before insert on public.event_participants
  for each row execute function public.check_max_participants();

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
alter table public.profiles enable row level security;
alter table public.activities enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;

-- ---------- PROFILES ----------
-- Tout le monde peut voir les profils (nécessaire pour afficher les participants)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Un user ne peut modifier que son propre profil
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- ACTIVITIES ----------
-- Lecture publique, écriture admin uniquement
create policy "Activities are viewable by everyone"
  on public.activities for select
  to authenticated
  using (true);

-- ---------- EVENTS ----------
-- Tous les events publiés sont visibles
create policy "Published events are viewable"
  on public.events for select
  to authenticated
  using (status = 'published' or created_by = auth.uid());

-- Un user authentifié peut créer un event
create policy "Authenticated users can create events"
  on public.events for insert
  to authenticated
  with check (auth.uid() = created_by);

-- Seul le créateur peut modifier son event
create policy "Creator can update own event"
  on public.events for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ---------- EVENT_PARTICIPANTS ----------
-- Les participants d'un event sont visibles par tous les authentifiés
create policy "Participants are viewable"
  on public.event_participants for select
  to authenticated
  using (true);

-- Un user peut rejoindre un event
create policy "Users can join events"
  on public.event_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Un user peut annuler sa propre participation
create policy "Users can cancel own participation"
  on public.event_participants for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- MESSAGES ----------
-- Seuls les participants de l'event peuvent lire les messages
create policy "Participants can read event messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.event_participants
      where event_id = messages.event_id
        and user_id = auth.uid()
        and status = 'confirmed'
    )
  );

-- Seuls les participants peuvent envoyer des messages
create policy "Participants can send messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.event_participants
      where event_id = messages.event_id
        and user_id = auth.uid()
        and status = 'confirmed'
    )
  );

-- ---------- RATINGS ----------
-- Un user voit les notations qu'il a reçues
create policy "Users can view received ratings"
  on public.ratings for select
  to authenticated
  using (rated_id = auth.uid() or rater_id = auth.uid());

-- Un participant peut noter un autre participant du même event
create policy "Participants can rate each other"
  on public.ratings for insert
  to authenticated
  with check (
    auth.uid() = rater_id
    and rater_id != rated_id
    and exists (
      select 1 from public.event_participants
      where event_id = ratings.event_id
        and user_id = auth.uid()
        and status = 'confirmed'
    )
    and exists (
      select 1 from public.event_participants
      where event_id = ratings.event_id
        and user_id = ratings.rated_id
        and status = 'confirmed'
    )
  );

-- ============================================================
-- 11. REALTIME — Activer pour les messages (chat)
-- ============================================================
-- À activer dans le dashboard Supabase :
-- alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 12. SEED DATA — Activités de base
-- ============================================================
insert into public.activities (name, slug, icon) values
  ('Running', 'running', '🏃'),
  ('Randonnée', 'randonnee', '🥾'),
  ('Vélo', 'velo', '🚴'),
  ('Jeux de société', 'jeux-de-societe', '🎲'),
  ('Tennis', 'tennis', '🎾'),
  ('Yoga', 'yoga', '🧘'),
  ('Natation', 'natation', '🏊'),
  ('Escalade', 'escalade', '🧗'),
  ('Football', 'football', '⚽'),
  ('Badminton', 'badminton', '🏸');
