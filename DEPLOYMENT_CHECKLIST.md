# Vercel Deployment Checklist

## Pre-Deployment Setup

### ✅ Database Preparation

- [ ] Set up PostgreSQL database (Neon, Supabase, or other)
- [ ] Obtain database connection string
- [ ] Test database connection locally
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed database if needed: `npx prisma db seed`

### ✅ Environment Variables

- [ ] Generate secure JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Prepare all environment variables (see `vercel.env.example`)
- [ ] Test with environment variables locally

### ✅ Code Preparation

- [ ] All TypeScript errors resolved: `npm run typecheck`
- [ ] Build succeeds locally: `npm run build`
- [ ] All tests pass: `npm test`
- [ ] Dependencies up to date in `package.json`

## Vercel Project Setup

### ✅ Initial Deployment

- [ ] Create Vercel account
- [ ] Connect GitHub repository
- [ ] Import project to Vercel
- [ ] Configure build settings:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### ✅ Environment Variables Setup

In Vercel Dashboard → Settings → Environment Variables:

**Required:**

- [ ] `DATABASE_URL` - Your PostgreSQL connection string
- [ ] `JWT_SECRET` - Secure random string for JWT signing
- [ ] `NODE_ENV=production`

**Optional:**

- [ ] `NEXTAUTH_URL` - Your Vercel app URL
- [ ] `NEXTAUTH_SECRET` - Additional auth secret
- [ ] `VITE_API_BASE_URL` - API base URL
- [ ] `PRISMA_CLI_BINARY_TARGETS=native,rhel-openssl-1.0.x`

## Post-Deployment Testing

### ✅ API Endpoints

- [ ] Health check: `https://your-app.vercel.app/api/health`
- [ ] Auth login: `POST https://your-app.vercel.app/api/auth/login`
- [ ] Auth register: `POST https://your-app.vercel.app/api/auth/register`
- [ ] Protected routes work with authentication

### ✅ Frontend Testing

- [ ] Homepage loads correctly
- [ ] Login/Register functionality works
- [ ] Client dashboard accessible after login
- [ ] Doctor dashboard accessible for doctors
- [ ] Admin dashboard accessible for admins
- [ ] All major features work as expected

### ✅ Database Operations

- [ ] User registration creates database records
- [ ] Login retrieves user data correctly
- [ ] Session creation and management works
- [ ] All CRUD operations function properly

## Performance & Security

### ✅ Performance Checks

- [ ] Page load times are acceptable
- [ ] API response times are reasonable
- [ ] Database queries are optimized
- [ ] No console errors in browser

### ✅ Security Verification

- [ ] HTTPS is enforced
- [ ] API routes require proper authentication
- [ ] JWT tokens are secure and expire appropriately
- [ ] Sensitive data is not exposed in client-side code
- [ ] Database connections use SSL

## Production Configuration

### ✅ Domain Setup (Optional)

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] DNS records properly set

### ✅ Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Error tracking configured
- [ ] Database monitoring in place
- [ ] Uptime monitoring configured

## Troubleshooting Common Issues

### Database Connection Issues

```bash
# Test database connection
npx prisma db pull

# Reset and migrate
npx prisma migrate reset
npx prisma migrate deploy
```

### Build Failures

```bash
# Check TypeScript errors
npm run typecheck

# Test build locally
npm run build:vercel

# Check dependencies
npm audit
npm update
```

### API Route Issues

- Check Vercel function logs in dashboard
- Verify environment variables are set
- Test API routes individually
- Check for CORS issues

### Prisma Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Check database schema
npx prisma db pull
```

## Rollback Plan

### If Deployment Fails

1. Check Vercel deployment logs
2. Verify environment variables
3. Test build locally
4. Use Vercel CLI to debug: `vercel logs`
5. Rollback to previous deployment if needed

### Emergency Contacts

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Database Provider Support
- Development Team Contacts

## Success Criteria

Deployment is successful when:

- [ ] Application loads without errors
- [ ] All user authentication flows work
- [ ] Database operations are functional
- [ ] All critical user journeys work
- [ ] Performance is acceptable
- [ ] No security vulnerabilities detected

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel

# Check deployment logs
vercel logs

# Pull environment variables
vercel env pull

# Run database migrations on Vercel
vercel exec -- npx prisma migrate deploy
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
