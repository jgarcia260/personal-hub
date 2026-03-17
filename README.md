# Personal Hub

Jorge's personal productivity workspace built with Next.js 15, Neon Postgres, and Drizzle ORM.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Neon Postgres (serverless)
- **ORM**: Drizzle ORM (type-safe queries)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Package Manager**: pnpm

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Create Neon Database

1. Go to [console.neon.tech](https://console.neon.tech/)
2. Create a new project called "personal-hub"
3. Select region: `aws-us-east-2` (or closest to you)
4. Copy the connection string

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Neon connection string:

```env
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Push Database Schema

```bash
pnpm db:push
```

This will create the tables defined in `db/schema.ts`.

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Management

- **Generate migrations**: `pnpm db:generate`
- **Push schema changes**: `pnpm db:push`
- **Run migrations**: `pnpm db:migrate`
- **Open Drizzle Studio**: `pnpm db:studio`

## Project Structure

```
personal-hub/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── db/               # Database layer
│   ├── schema.ts     # Drizzle schema definitions
│   ├── index.ts      # Database connection
│   └── migrations/   # SQL migrations (auto-generated)
├── lib/              # Utility functions
└── public/           # Static assets
```

## Testing Database Connection

Visit `/api/db-test` to verify database connectivity.

## Deployment

This project is designed to be deployed on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add `DATABASE_URL` environment variable
4. Deploy

## Development Workflow

1. Make schema changes in `db/schema.ts`
2. Run `pnpm db:push` to sync with Neon
3. Use Drizzle ORM for type-safe queries in your code

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Neon Documentation](https://neon.tech/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
