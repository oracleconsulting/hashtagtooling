# #TOOLING - E-commerce Platform

## Railway Deployment Guide

### Prerequisites
1. Railway account (https://railway.app)
2. Supabase project set up
3. PayPal Developer account

### Step 1: Set Up Supabase

1. Create a new project at https://supabase.com
2. Go to **Settings** → **API** and copy:
   - Project URL
   - Anon/Public key
3. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
4. (Optional) Enable Row Level Security policies if needed

### Step 2: Set Up PayPal

1. Go to https://developer.paypal.com
2. Create an app in the Dashboard
3. Copy your **Client ID**
4. For production, get your **Live credentials** (not sandbox)

### Step 3: Deploy to Railway

#### Option A: Connect via GitHub (Recommended)

1. Push your code to GitHub
2. Go to Railway.app and create a new project
3. Select **Deploy from GitHub repo**
4. Select your repository
5. Railway will auto-detect Next.js

#### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to project
railway link

# Deploy
railway up
```

### Step 4: Configure Environment Variables

In Railway dashboard, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
```

### Step 5: Configure Domain

1. Railway provides a default domain: `yourapp.railway.app`
2. To use custom domain:
   - Go to **Settings** → **Domains**
   - Add your domain
   - Update DNS records as shown

### Build Configuration

Railway auto-detects Next.js. If you need custom settings:

**Build Command:** `npm run build`
**Start Command:** `npm run start`
**Install Command:** `npm install`

### Monitoring

- Railway provides automatic logging
- Check **Deployments** tab for build logs
- **Metrics** tab shows CPU, memory, and network usage

### Troubleshooting

**Build fails?**
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

**Environment variables not working?**
- Make sure they start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new variables

**Database connection issues?**
- Verify Supabase URL and keys
- Check if RLS policies are blocking queries
- Test connection in Supabase dashboard

### Cost Estimate

- Railway: Free tier available, then ~$5-20/month
- Supabase: Free tier (500MB), then pay-as-you-go
- PayPal: Transaction fees only (2.9% + £0.30 per transaction)

### Production Checklist

- [ ] Set up custom domain
- [ ] Switch PayPal to Live credentials (not sandbox)
- [ ] Enable Supabase Row Level Security
- [ ] Set up SSL (automatic with Railway)
- [ ] Test payment flow end-to-end
- [ ] Add Google Analytics or similar
- [ ] Set up email notifications for orders
- [ ] Configure backup strategy for database

### Updating the Site

With GitHub connected:
```bash
git add .
git commit -m "Update description"
git push origin main
```

Railway will automatically rebuild and deploy!

### Need Help?

- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- PayPal Integration: https://developer.paypal.com/docs

