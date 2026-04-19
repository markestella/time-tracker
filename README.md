# Time Clock

Employee time-tracking application built with Next.js 15, Prisma, NextAuth, and PostgreSQL.

## Prerequisites

- **Node.js** 18+
- **PostgreSQL** (local install or Docker)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

### 3. Start the database

Using Docker:

```bash
docker-compose up -d
```

With Docker, use this connection string:

```
DATABASE_URL="postgresql://timeclock_user:timeclock_password@localhost:5434/timeclock_db"
```

### 4. Run migrations and seed

```bash
npx prisma migrate deploy
npm run seed
```

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed the database |
