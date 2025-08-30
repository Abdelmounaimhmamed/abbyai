# Vercel Deployment Guide

This guide will help you deploy your full-stack therapy application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
3. **GitHub Repository**: Your code should be in a GitHub repository

## Step 1: Prepare Your Database

### Option A: Neon Database (Recommended)

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the connection string
4. It should look like: `postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`

### Option B: Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string from "Connection string > URI"

## Step 2: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? [Y/n] Y
# - Which scope? (select your account)
# - Link to existing project? [y/N] N
# - What's your project's name? (enter a name)
# - In which directory is your code located? ./
```

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to Settings > Environment Variables and add:

### Required Variables

```bash
DATABASE_URL=postgresql://your-database-connection-string
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random
NODE_ENV=production
```

### Optional Variables

```bash
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here
VITE_API_BASE_URL=https://your-project.vercel.app/api
PRISMA_CLI_BINARY_TARGETS=native,rhel-openssl-1.0.x
```

**Note**: For JWT_SECRET, generate a secure random string. You can use:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 4: Database Migration

After your first deployment, you'll need to run database migrations:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Functions
3. In the terminal or via CLI, run:

```bash
vercel exec -- npx prisma migrate deploy
vercel exec -- npx prisma db seed # If you have seed data
```

Or use Vercel CLI locally:

```bash
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

## Step 5: Test Your Deployment

1. Visit your deployed application at `https://your-project.vercel.app`
2. Test the API endpoints:
   - Health check: `https://your-project.vercel.app/api/health`
   - Auth endpoints: `https://your-project.vercel.app/api/auth/login`

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS according to Vercel's instructions

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

- Ensure your DATABASE_URL is correct
- Check that your database allows connections from Vercel's IP ranges
- Verify SSL settings in your connection string

**2. Build Failures**

- Check that all dependencies are in package.json
- Ensure TypeScript has no errors: `npm run typecheck`
- Verify build command works locally: `npm run build`

**3. API Routes Not Working**

- Check Vercel function logs in the dashboard
- Ensure API routes are in the `/api` directory
- Verify environment variables are set correctly

**4. Prisma Issues**

- Make sure `prisma generate` runs during build
- Check that the Prisma schema is valid
- Ensure database migrations are applied

### Vercel-Specific Configuration

The project includes:

- `vercel.json` - Main configuration file
- `/api/*` - Serverless function routes
- `scripts/vercel-build.js` - Custom build script
- Route handling for SPA

### Performance Optimization

1. **Database Connection Pooling**: Use a connection pooler like PgBouncer
2. **Caching**: Implement Redis for session caching if needed
3. **CDN**: Vercel automatically provides CDN for static assets
4. **Function Regions**: Configure functions to run in regions close to your database

## Development vs Production

### Development

```bash
npm run dev
```

### Production Build (Local Testing)

```bash
npm run build:vercel
npm run start
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## Quick Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/your-repo&env=DATABASE_URL,JWT_SECRET&envDescription=Required%20environment%20variables&envLink=https://github.com/your-username/your-repo/blob/main/vercel.env.example)

Replace the repository URL with your actual GitHub repository URL.
