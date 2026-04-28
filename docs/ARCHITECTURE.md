# Architecture

## System Diagram

```text
┌─────────────────────────────┐
│ Mobile / desktop browser    │
│ Parent + child profile mode │
└──────────────┬──────────────┘
               │ HTTP / JSON
┌──────────────▼──────────────┐
│ frontend                     │
│ Next.js App Router           │
│ TailwindCSS UI               │
└──────────────┬──────────────┘
               │ Bearer JWT
┌──────────────▼──────────────┐
│ backend                      │
│ FastAPI                      │
│ Chore, approval, payout APIs │
└──────────────┬──────────────┘
               │ SQLAlchemy
┌──────────────▼──────────────┐
│ database                     │
│ PostgreSQL                   │
│ Families, users, chores,    │
│ logs, approvals, payouts     │
└─────────────────────────────┘

┌─────────────────────────────┐
│ redis                        │
│ Future streak cache,         │
│ reminders, job locks         │
└─────────────────────────────┘
```

## SaaS Boundaries

Every user, child, log, approval, and payout belongs to a `family_id`.

Chores support two modes:

- Global default chores: `family_id = NULL`
- Custom family chores: `family_id = active family`

This lets every family inherit the starter chore list while customizing their own list.

## Daily Tracking Engine

Daily logs are generated lazily:

1. Parent opens a child profile.
2. Frontend calls `GET /children/{child_id}/daily-logs`.
3. Backend finds all active global and family chores.
4. Backend creates missing `daily_logs` for that child/date.
5. Existing logs are preserved.

## Approval State Machine

```text
TODO -> SUBMITTED -> APPROVED
TODO -> SUBMITTED -> REJECTED
REJECTED -> SUBMITTED -> APPROVED
```

Rejected chores can be resubmitted.

## Points

```text
BOOLEAN    fixed_points
SCORE      approved_score * score_multiplier
TIME_BASED floor(approved_minutes / minutes_per_point)
```

Only `APPROVED` logs contribute to weekly payout.

## Payouts

The UI shows a live weekly payout estimate. `POST /payouts/finalize` stores an immutable weekly payout snapshot for a child.
