# Deployment Guide

## Single VPS

1. Install Docker and Docker Compose.
2. Copy the repository to the server.
3. Create `.env` from `.env.example`.
4. Set production values:

```text
POSTGRES_PASSWORD=<strong password>
JWT_SECRET=<long random secret>
CORS_ORIGINS=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

5. Start:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

6. Seed once:

```bash
docker compose -f docker-compose.prod.yml exec backend python -m app.scripts.seed
```

## Reverse Proxy

Place Caddy, Traefik, or Nginx in front of the app:

```text
your-domain.com      -> frontend:3000
api.your-domain.com  -> backend:8000
```

Terminate TLS at the proxy.

## Backups

Use scheduled PostgreSQL dumps:

```bash
docker compose exec database pg_dump -U parenting parenting_rewards > backup.sql
```

For production, store backups outside the host and test restore regularly.

## Migration Plan

The MVP includes SQL schema and SQLAlchemy metadata. Before real production users, add Alembic migrations so schema changes are versioned.
