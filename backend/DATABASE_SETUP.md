# Database Setup Guide

This guide will help you set up the PostgreSQL database using Supabase for the Client Management Platform.

## Prerequisites

1. Node.js and npm installed
2. A Supabase account (free tier available)

## Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be provisioned (usually takes 1-2 minutes)

### 2. Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** > **Database**
2. Find the **Connection string** section
3. Copy the **URI** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in your `.env` file with your Supabase connection string:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Test Database Connection

```bash
npm run db:setup
```

This will test the connection and initialize the database.

### 6. Apply Database Schema

```bash
npm run db:push
```

This will create all the tables defined in the Prisma schema.

### 7. Generate Prisma Client

```bash
npm run db:generate
```

This generates the TypeScript client for database operations.

## Database Schema

The database includes the following models:

- **User**: System users with roles (CEO, MANAGER, TEAM_MEMBER)
- **Company**: Client companies with tier classification
- **Note**: Notes associated with companies
- **Audit**: Scheduled audits for companies
- **Notification**: System notifications for users

## Useful Commands

- `npm run db:studio` - Open Prisma Studio to view/edit data
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Regenerate Prisma client
- `npm test` - Run database connection tests

## Troubleshooting

### Connection Issues

1. **Invalid connection string**: Make sure you've replaced `[YOUR-PASSWORD]` and `[PROJECT-REF]` with actual values
2. **Network issues**: Ensure your network allows connections to Supabase
3. **Project not ready**: Wait a few minutes after creating the Supabase project

### Schema Issues

1. **Migration conflicts**: Use `npx prisma db push --force-reset` to reset the database (⚠️ This will delete all data)
2. **Client out of sync**: Run `npm run db:generate` after schema changes

## Free Tier Limitations

Supabase free tier includes:
- 500MB database storage
- 2 concurrent connections
- 50,000 monthly active users

These limits are sufficient for development and small-scale production use.