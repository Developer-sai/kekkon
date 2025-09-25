# Kekkon Deployment Guide

## Overview

This guide covers the complete deployment process for the Kekkon wedding invitation application, including local development setup, production deployment to Vercel, and database configuration with Supabase.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: For version control
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge

### Required Accounts
- **Supabase Account**: For database and storage ([supabase.com](https://supabase.com))
- **Vercel Account**: For deployment ([vercel.com](https://vercel.com))

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kekkon
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Authentication (Optional - for basic auth)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

### 4. Supabase Setup

#### Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name and database password
5. Select a region close to your users
6. Wait for project creation (2-3 minutes)

#### Get Your Supabase Credentials
1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

#### Run Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Click "Run" to execute the SQL commands

The setup script will create:
- `events` table for main events
- `sub_events` table for event sub-components
- `images` table for event photos
- `event-images` storage bucket
- Necessary indexes and security policies

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### Option 1: Vercel CLI (Recommended)

#### Install Vercel CLI
```bash
npm install -g vercel
```

#### Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Configure Environment Variables
After deployment, add environment variables in Vercel dashboard:
1. Go to your project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add the same variables from your `.env.local` file

### Option 2: Vercel Dashboard

#### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Add Environment Variables
1. In project settings, go to Environment Variables
2. Add all required environment variables
3. Deploy the project

### Option 3: Manual Build and Deploy

#### Build the Application
```bash
npm run build
```

#### Export Static Files (if needed)
```bash
npm run export
```

## Database Migration and Backup

### Backup Database
```sql
-- Export events
SELECT * FROM events;

-- Export sub_events
SELECT * FROM sub_events;

-- Export images
SELECT * FROM images;
```

### Restore Database
Use the `database-setup.sql` file to recreate the schema on a new Supabase instance.

## Environment-Specific Configuration

### Development Environment
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_key
```

### Production Environment
```env
# Vercel Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
```

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different Supabase projects for development and production
- Rotate service role keys regularly
- Use strong admin passwords

### Database Security
- Row Level Security (RLS) is enabled on all tables
- Public read access for events and images
- Authenticated access required for write operations
- Storage bucket has proper access policies

### Application Security
- Admin authentication is required for dashboard access
- File uploads are restricted to authenticated users
- Input validation on all forms
- HTTPS enforced in production

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build
npm run analyze
```

### Image Optimization
- Use Next.js Image component for automatic optimization
- Store images in Supabase storage for CDN benefits
- Implement lazy loading for gallery images

### Database Optimization
- Indexes are created for frequently queried fields
- Cascade deletes maintain data integrity
- Connection pooling handled by Supabase

## Monitoring and Logging

### Vercel Analytics
Enable Vercel Analytics in your project settings for:
- Page view tracking
- Performance monitoring
- Error tracking

### Supabase Monitoring
Monitor your database through Supabase dashboard:
- Query performance
- Storage usage
- API usage
- Error logs

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Database Connection Issues
1. Verify environment variables are correct
2. Check Supabase project status
3. Ensure database setup script was run
4. Verify network connectivity

#### Image Upload Issues
1. Check storage bucket exists
2. Verify storage policies are set
3. Ensure file size limits are appropriate
4. Check file format restrictions

#### Deployment Issues
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod --force
```

### Debug Mode
Enable debug logging by adding to your environment:
```env
DEBUG=true
NODE_ENV=development
```

## Scaling Considerations

### Database Scaling
- Supabase automatically handles connection pooling
- Consider read replicas for high-traffic applications
- Monitor query performance and add indexes as needed

### Storage Scaling
- Supabase storage scales automatically
- Implement image compression for large files
- Consider CDN for global distribution

### Application Scaling
- Vercel automatically scales based on traffic
- Consider edge functions for dynamic content
- Implement caching strategies for static content

## Backup and Recovery

### Automated Backups
Supabase provides automatic daily backups for paid plans.

### Manual Backup
```bash
# Export database schema
pg_dump --schema-only your_database_url > schema.sql

# Export data
pg_dump --data-only your_database_url > data.sql
```

### Recovery Process
1. Create new Supabase project
2. Run schema backup
3. Import data backup
4. Update environment variables
5. Redeploy application

## Support and Maintenance

### Regular Maintenance Tasks
- Monitor application performance
- Update dependencies monthly
- Review and rotate API keys quarterly
- Backup critical data regularly
- Monitor storage usage and costs

### Getting Help
- Check Vercel documentation for deployment issues
- Consult Supabase documentation for database problems
- Review Next.js documentation for framework questions
- Check project issues and discussions

This deployment guide ensures a smooth setup process for both development and production environments of the Kekkon application.