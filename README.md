# Parenting Chore & Rewards App

Docker-first SaaS-ready app for daily child chore tracking, parent approval, points, and weekly rupee payouts.

## Architecture

```text
Parent Browser / Child Profile Mode
              |
              v
Next.js App Router frontend
              |
              v
FastAPI backend with custom JWT auth
              |
              v
PostgreSQL via SQLAlchemy models
              |
              v
Redis optional cache / future scheduled jobs
```

## Services

- `frontend`: Next.js, TailwindCSS, ShadCN-style local UI primitives
- `backend`: FastAPI, SQLAlchemy, Pydantic, custom JWT
- `database`: PostgreSQL 16
- `redis`: Redis 7 for future streak caching and job locks

## Local Setup

1. Create the environment file:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up --build
```

3. Seed the database:

```bash
docker compose exec backend python -m app.scripts.seed
```

4. Open the apps:

- Frontend: http://localhost:3001
- API docs: http://localhost:8000/docs

Default login:

```text
parent@example.com
ChangeMe123!
```

## Production Setup

1. Copy `.env.example` to `.env`.
2. Change `JWT_SECRET`, database password, parent password, and CORS origins.
3. Build and run:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

4. Seed once:

```bash
docker compose -f docker-compose.prod.yml exec backend python -m app.scripts.seed
```

## Core Rules

- `BOOLEAN`: approved completion earns `fixed_points`, default `1`
- `SCORE`: approved score earns `score * score_multiplier`, default multiplier `1`
- `TIME_BASED`: approved minutes earn `floor(minutes / minutes_per_point)`, default `10`
- `1 approved point = ₹1`
- Only approved logs count toward payout

## API Routes

- `POST /auth/login`
- `GET /me`
- `GET /dashboard`
- `GET /children`
- `GET /chores`
- `POST /chores`
- `PATCH /chores/{chore_id}`
- `GET /children/{child_id}/daily-logs`
- `POST /daily-logs/{log_id}/submit`
- `POST /daily-logs/{log_id}/review`
- `GET /approvals/pending`
- `GET /analytics/children/{child_id}?period=weekly|monthly|quarterly|half_yearly|yearly`
- `GET /payouts/weekly`
- `POST /payouts/finalize`

## Data Model

The app is SaaS-ready through `families`. Default chores are global with `chores.family_id = NULL`; parent-created chores are scoped to the active family.

Main tables:

- `families`
- `users`
- `children`
- `chores`
- `daily_logs`
- `approvals`
- `payouts`

SQL schema and indexes are in `backend/sql/schema.sql`. SQLAlchemy models are in `backend/app/models/domain.py`.

## Current MVP Scope

- Parent-only login
- Parent switches between Isaac and Nehemiah
- Daily logs generated lazily when a child profile opens
- Parent can add custom family chores
- Parent can edit chore names, categories, active state, and scoring rules
- Children can submit chores
- Parent can approve or reject submitted chores
- Weekly live payout estimate
- AI-style behavior analytics by child and period

## Next Production Hardening

- Alembic migrations
- Unit tests for scoring and payout
- Playwright smoke tests
- Cron job for reminders and weekly payout snapshots
- PDF weekly reports
- Child PIN mode
- Family invite flow
