# Local Development Database

EventOS API uses PostgreSQL for local development.

## Expected API connection

- Host: `localhost`
- Port: `5432`
- Database: `eventos`
- Username: `eventos`
- Password: `eventos123`
- Connection URL: `postgresql://eventos:eventos123@localhost:5432/eventos`

## Required environment variables

Create `apps/api/.env` (this file is git-ignored):

```dotenv
DATABASE_URL="postgresql://eventos:eventos123@localhost:5432/eventos"
JWT_SECRET=eventos-development-secret-change-me
JWT_EXPIRES_IN=1h
```

## Start local PostgreSQL (Docker Compose)

From the repository root:

```bash
docker compose -f docker-compose.local-db.yml up -d
```

Stop it when done:

```bash
docker compose -f docker-compose.local-db.yml down
```

Remove local DB volume (destructive):

```bash
docker compose -f docker-compose.local-db.yml down -v
```

## Prisma local setup

From the repository root:

```bash
pnpm --filter api prisma:generate
pnpm --filter api exec prisma migrate deploy
```

## Deterministic development workspace seed

Start API:

```bash
pnpm --filter api start:dev
```

Then seed/login workspace data by calling:

```bash
POST http://localhost:3001/auth/development-seed
```

This endpoint is deterministic and idempotent for local development.