CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE userrole AS ENUM ('PARENT', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE chorecategory AS ENUM ('Habit', 'Fun', 'Health', 'Chores', 'Skills');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE choretype AS ENUM ('BOOLEAN', 'SCORE', 'TIME_BASED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE logstatus AS ENUM ('TODO', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approvaldecision AS ENUM ('APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payoutstatus AS ENUM ('DRAFT', 'FINALIZED', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS families (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name varchar(120) NOT NULL,
  point_to_rupee_rate integer NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id varchar(36) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  role userrole NOT NULL DEFAULT 'PARENT',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS children (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id varchar(36) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name varchar(80) NOT NULL,
  avatar_color varchar(32) NOT NULL DEFAULT 'emerald',
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_children_family_name UNIQUE (family_id, name)
);

CREATE TABLE IF NOT EXISTS chores (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id varchar(36) NULL REFERENCES families(id) ON DELETE CASCADE,
  category chorecategory NOT NULL,
  name varchar(160) NOT NULL,
  duration_minutes integer NULL,
  time_slot varchar(40) NULL,
  type choretype NOT NULL,
  max_score integer NULL,
  fixed_points integer NOT NULL DEFAULT 1,
  score_multiplier integer NOT NULL DEFAULT 1,
  minutes_per_point integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_logs (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id varchar(36) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id varchar(36) NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  chore_id varchar(36) NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  status logstatus NOT NULL DEFAULT 'TODO',
  submitted_value integer NULL,
  approved_value integer NULL,
  points_awarded integer NOT NULL DEFAULT 0,
  note text NULL,
  submitted_at timestamp NULL,
  reviewed_at timestamp NULL,
  CONSTRAINT uq_daily_logs_child_chore_date UNIQUE (child_id, chore_id, log_date)
);

CREATE TABLE IF NOT EXISTS approvals (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  daily_log_id varchar(36) NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
  parent_id varchar(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decision approvaldecision NOT NULL,
  note text NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payouts (
  id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  family_id varchar(36) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id varchar(36) NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  rupees integer NOT NULL DEFAULT 0,
  status payoutstatus NOT NULL DEFAULT 'DRAFT',
  finalized_at timestamp NULL,
  paid_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_payout_child_week UNIQUE (child_id, week_start)
);

CREATE INDEX IF NOT EXISTS ix_users_family_role ON users(family_id, role);
CREATE INDEX IF NOT EXISTS ix_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS ix_chores_family_category ON chores(family_id, category);
CREATE INDEX IF NOT EXISTS ix_chores_active ON chores(is_active);
CREATE INDEX IF NOT EXISTS ix_daily_logs_family_date ON daily_logs(family_id, log_date);
CREATE INDEX IF NOT EXISTS ix_daily_logs_child_date ON daily_logs(child_id, log_date);
CREATE INDEX IF NOT EXISTS ix_daily_logs_status ON daily_logs(status);
CREATE INDEX IF NOT EXISTS ix_approvals_log ON approvals(daily_log_id);
CREATE INDEX IF NOT EXISTS ix_payouts_family_week ON payouts(family_id, week_start);
