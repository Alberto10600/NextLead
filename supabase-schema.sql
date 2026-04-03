-- ====================================================
-- NEXTLEAD — Schema Supabase
-- Ejecutar en Supabase SQL Editor en este orden
-- ====================================================

-- Extensión UUID
create extension if not exists "uuid-ossp";

-- Tabla de perfiles (extiende auth.users de Supabase)
create table public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nombre text,
  agencia text,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  stripe_customer_id text,
  stripe_subscription_id text,
  creditos_restantes integer default 25,
  created_at timestamptz default now()
);

-- Tabla de campañas
create table public.campanas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.perfiles(id) on delete cascade,
  nombre text not null,
  sector text not null,
  pais text default 'España',
  descripcion_agencia text not null,
  cargos_objetivo text[] default array['CEO', 'Director de Marketing'],
  estado text default 'borrador'
    check (estado in ('borrador', 'procesando', 'activa', 'pausada', 'completada')),
  total_contactos integer default 0,
  total_enviados integer default 0,
  total_abiertos integer default 0,
  total_respondidos integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de contactos
create table public.contactos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.perfiles(id) on delete cascade,
  campana_id uuid references public.campanas(id) on delete cascade,
  nombre text,
  apellido text,
  cargo text,
  email text not null,
  empresa text,
  dominio text,
  linkedin_url text,
  contexto_web text,
  asunto_generado text,
  email_generado text,
  estado text default 'pendiente'
    check (estado in ('pendiente', 'enviado', 'abierto',
                      'respondido', 'rebotado', 'error')),
  fecha_envio timestamptz,
  fecha_apertura timestamptz,
  fecha_respuesta timestamptz,
  numero_seguimiento integer default 0,
  created_at timestamptz default now()
);

-- Tabla de seguimientos (follow-ups)
create table public.seguimientos (
  id uuid default uuid_generate_v4() primary key,
  contacto_id uuid references public.contactos(id) on delete cascade,
  campana_id uuid references public.campanas(id) on delete cascade,
  user_id uuid references public.perfiles(id) on delete cascade,
  numero_seguimiento integer not null,
  asunto text,
  cuerpo text,
  estado text default 'pendiente'
    check (estado in ('pendiente', 'enviado', 'cancelado')),
  fecha_programada timestamptz not null,
  fecha_enviado timestamptz,
  created_at timestamptz default now()
);

-- ====================================================
-- MIGRACIÓN: Drill-down + Leads calientes
-- Ejecutar en Supabase SQL Editor si ya tienes datos
-- ====================================================

-- Nuevas columnas en contactos
alter table public.contactos add column if not exists total_aperturas integer default 0;
alter table public.contactos add column if not exists es_lead_caliente boolean default false;

-- Tabla de eventos de apertura (una fila por cada apertura individual)
create table if not exists public.eventos_apertura (
  id uuid default uuid_generate_v4() primary key,
  contacto_id uuid references public.contactos(id) on delete cascade not null,
  campana_id uuid references public.campanas(id) on delete cascade not null,
  user_id uuid references public.perfiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.eventos_apertura enable row level security;

create policy "service role puede insertar eventos" on public.eventos_apertura
  for insert with check (true);

create policy "usuarios ven sus eventos de apertura" on public.eventos_apertura
  for select using (auth.uid() = user_id);

-- Índice para consultas de drill-down por contacto
create index if not exists idx_eventos_apertura_contacto on public.eventos_apertura(contacto_id);
create index if not exists idx_eventos_apertura_campana on public.eventos_apertura(campana_id);

-- ====================================================
-- Tabla de historial (para deduplicación)
-- ====================================================

-- Tabla de historial (para deduplicación)
create table public.historial_contactos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.perfiles(id) on delete cascade,
  email text not null,
  dominio text not null,
  fecha_ultimo_contacto timestamptz default now(),
  total_contactos integer default 1,
  unique(user_id, email)
);

-- ====================================================
-- RLS — cada usuario solo ve sus datos
-- ====================================================

alter table public.perfiles enable row level security;
alter table public.campanas enable row level security;
alter table public.contactos enable row level security;
alter table public.seguimientos enable row level security;
alter table public.historial_contactos enable row level security;

create policy "usuarios ven su perfil" on public.perfiles
  for all using (auth.uid() = id);

create policy "usuarios ven sus campañas" on public.campanas
  for all using (auth.uid() = user_id);

create policy "usuarios ven sus contactos" on public.contactos
  for all using (auth.uid() = user_id);

create policy "usuarios ven sus seguimientos" on public.seguimientos
  for all using (auth.uid() = user_id);

create policy "usuarios ven su historial" on public.historial_contactos
  for all using (auth.uid() = user_id);

-- ====================================================
-- Trigger: crear perfil automáticamente al registrarse
-- ====================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
