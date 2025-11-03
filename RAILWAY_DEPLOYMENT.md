# Railway Deployment Guide - hashtagwoodworking.co.uk

## Step-by-Step Deployment

### Step 1: Create Railway Account & Project

1. Go to https://railway.app
2. Sign up or log in (connect with GitHub)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose **`oracleconsulting/hashtagtooling`**
6. Railway will detect Next.js automatically ✅

### Step 2: Configure Environment Variables

In Railway dashboard → Your Project → Variables tab:

**Add these variables:**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# PayPal Configuration (LIVE credentials for production!)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_live_client_id
PAYPAL_CLIENT_SECRET=your_paypal_live_secret

# Node Environment
NODE_ENV=production
```

**⚠️ Important:** Use PayPal **LIVE** credentials for production, not sandbox!

### Step 3: Wait for Initial Build

Railway will automatically:
- ✅ Detect Next.js
- ✅ Run `npm install`
- ✅ Run `npm run build`
- ✅ Deploy to a Railway subdomain (e.g., `hashtagtooling-production.up.railway.app`)

This takes 2-5 minutes. Watch the **Deployments** tab for progress.

### Step 4: Set Up Custom Domain (hashtagwoodworking.co.uk)

#### A. Add Domain in Railway

1. Go to your Railway project
2. Click **Settings** → **Domains**
3. Click **"Custom Domain"**
4. Enter: `hashtagwoodworking.co.uk`
5. Railway will show DNS records to configure

#### B. Configure DNS Records

You'll need to add these records at your domain registrar:

**Primary Domain:**
```
Type: A
Name: @
Value: [Railway's IP address shown in dashboard]
```

**WWW Subdomain (recommended):**
```
Type: CNAME
Name: www
Value: [your-app].up.railway.app
```

**Or use Railway's preferred method:**
```
Type: CNAME
Name: @
Value: [your-app].up.railway.app
```

#### C. Where to Update DNS

Depending on where you registered `hashtagwoodworking.co.uk`:

**GoDaddy:**
1. My Products → Domains → Manage DNS
2. Add/Edit records

**Namecheap:**
1. Domain List → Manage → Advanced DNS
2. Add records

**123-reg:**
1. My Account → Manage Domains
2. Click domain → Manage DNS

**CloudFlare (if using):**
1. Select domain
2. DNS tab → Add records
3. **Important:** Set Proxy Status to "DNS Only" (grey cloud)

### Step 5: SSL Certificate (Automatic)

Railway automatically provisions SSL certificates via Let's Encrypt.
- Usually takes 5-15 minutes after DNS propagates
- Your site will be accessible via HTTPS

### Step 6: Test Your Deployment

Once DNS propagates (can take up to 48 hours, usually 1-4 hours):

1. Visit https://hashtagwoodworking.co.uk
2. Test all pages:
   - [ ] Homepage loads
   - [ ] Shop displays products
   - [ ] Custom mallet builder works
   - [ ] Commission form submits
   - [ ] Cart functionality works
3. **Test PayPal checkout with a small amount**

---

## Railway Configuration Details

### Build Settings (Auto-detected)

Railway automatically uses:
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Install Command:** `npm install`
- **Node Version:** 18+ (from engines in package.json if specified)

### Port Configuration

Next.js runs on port 3000 by default. Railway handles this automatically.

---

## Environment Variables Reference

### Required for Production

| Variable | Where to Get It | Example |
|----------|----------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → API | `eyJhbGc...` |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Developer Dashboard → Live | `AZ9x...` |
| `PAYPAL_CLIENT_SECRET` | PayPal Developer Dashboard → Live | `EGnH...` |

### Optional (Recommended)

```bash
# Force production mode
NODE_ENV=production

# Next.js optimizations
NEXT_TELEMETRY_DISABLED=1
```

---

## Switching PayPal from Sandbox to Live

**Currently using:** Sandbox (test mode)  
**For production:** You need Live credentials

### Get Live Credentials:

1. Go to https://developer.paypal.com
2. Toggle from "Sandbox" to "Live" (top right)
3. Go to "Apps & Credentials"
4. Create Live app (or use existing)
5. Copy **Live** Client ID and Secret
6. Update Railway environment variables

**⚠️ Test thoroughly before going live!**

---

## Cost Breakdown

### Railway Pricing

- **Starter Plan:** $5/month
  - 512 MB RAM
  - 1 GB disk
  - Should be sufficient for starting
  
- **Developer Plan:** $20/month (if you need more)
  - 8 GB RAM
  - 100 GB disk
  - Better for scaling

**Free Trial:** Railway offers $5 credit to start.

### Other Services

- **Supabase:** Free tier (500 MB database)
- **Domain:** ~£10/year (already owned)
- **PayPal:** 2.9% + £0.30 per transaction

**Total monthly cost:** £5-25 depending on traffic

---

## Monitoring & Logs

### View Logs
1. Railway dashboard → Your project
2. Click **"Deployments"**
3. Select latest deployment
4. View build and runtime logs

### Metrics
- **Metrics tab** shows CPU, memory, and network usage
- Set up alerts for issues

---

## Automatic Deployments

Once connected, Railway automatically deploys when you push to GitHub:

```bash
cd /Users/James.Howard/Documents/hashtagtooling
git add .
git commit -m "Update product prices"
git push
```

Railway will:
1. Detect the push
2. Build the new version
3. Deploy automatically
4. Zero downtime!

---

## Troubleshooting

### Build Fails

**Check:**
- Railway logs for specific error
- All dependencies in `package.json`
- Environment variables are set
- Node version compatibility

**Solution:**
```bash
# Locally test production build
npm run build
npm run start
```

### Domain Not Working

**Check:**
- DNS records are correct
- DNS has propagated (use https://dnschecker.org)
- SSL certificate has been issued (can take 15 mins)
- Try both `hashtagwoodworking.co.uk` and `www.hashtagwoodworking.co.uk`

**Solution:**
- Wait up to 48 hours for DNS propagation
- Check Railway dashboard for SSL status

### PayPal Not Working

**Check:**
- Using LIVE credentials (not sandbox)
- Client ID starts with correct prefix
- Environment variables saved in Railway
- App is approved in PayPal dashboard

**Solution:**
- Test with PayPal sandbox first
- Check browser console for errors
- Verify PayPal app is set to "Live"

### Database Connection Issues

**Check:**
- Supabase URL and key are correct
- Supabase project is active
- API access is enabled
- RLS policies if configured

**Solution:**
- Test connection in Supabase dashboard
- Check Railway logs for connection errors

---

## Pre-Launch Checklist

Before going live with real customers:

### Technical
- [ ] Custom domain configured and working
- [ ] SSL certificate active (HTTPS)
- [ ] All environment variables set
- [ ] PayPal using LIVE credentials
- [ ] Database tables created
- [ ] Test checkout flow end-to-end

### Content
- [ ] Replace placeholder images with real photos
- [ ] Add all your wood types to `/lib/constants.ts`
- [ ] Upload actual products to Supabase
- [ ] Update About page with your story
- [ ] Update Contact page with real email
- [ ] Verify shipping rates in Shipping page

### Legal & Business
- [ ] Terms & Conditions page (consider adding)
- [ ] Privacy Policy page (consider adding)
- [ ] Cookie consent (if tracking users)
- [ ] Business insurance in place
- [ ] PayPal business account verified

### Testing
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Test complete purchase flow
- [ ] Test commission form submission
- [ ] Verify emails are received
- [ ] Test with real payment (small amount)

---

## Going Live - Day 1

1. **Soft Launch:** Share with friends/family first
2. **Monitor:** Watch Railway logs and PayPal dashboard
3. **Test:** Make sure orders come through
4. **Iterate:** Fix any issues quickly
5. **Announce:** Share on social media when confident

---

## Post-Launch

### Add Analytics (Recommended)

Consider adding:
- Google Analytics 4
- Facebook Pixel (if using ads)
- Hotjar (to see user behavior)

### Marketing

- Instagram/Facebook posts
- Share progress photos of builds
- Behind-the-scenes content
- Customer testimonials

### Optimization

- Monitor which products sell best
- A/B test pricing
- Add more photos to popular items
- Collect customer feedback

---

## Support

**Railway Issues:**
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

**Deployment Help:**
See `QUICKSTART.md` and `ADMIN_GUIDE.md` in your repository

---

**Ready to deploy? Let's get hashtagwoodworking.co.uk live! 🚀**

