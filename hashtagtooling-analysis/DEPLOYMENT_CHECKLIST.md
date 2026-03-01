# 🚀 Railway Deployment Checklist - hashtagwoodworking.co.uk

Follow these steps in order to deploy your site.

---

## Phase 1: Supabase Setup (Do First)

- [ ] Go to https://supabase.com
- [ ] Create new project (takes 2-3 minutes)
- [ ] Go to SQL Editor
- [ ] Open `supabase-schema.sql` from your project
- [ ] Copy and paste the SQL
- [ ] Run the query (creates tables and sample products)
- [ ] Go to Settings → API
- [ ] Copy your Project URL
- [ ] Copy your Anon/Public key
- [ ] Save these for later

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Phase 2: PayPal Setup

- [ ] Go to https://developer.paypal.com
- [ ] Log in with your PayPal account
- [ ] Click "Apps & Credentials"
- [ ] Toggle to "Live" (top right corner)
- [ ] Create a new app OR use existing
- [ ] Copy Live Client ID
- [ ] Copy Live Secret
- [ ] Save these for later

**⚠️ Important:** Use LIVE credentials for production, not Sandbox!

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Phase 3: Railway Deployment

### 3.1 Connect GitHub to Railway

- [ ] Go to https://railway.app
- [ ] Sign up or log in
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Authorize Railway to access your GitHub
- [ ] Select repository: `oracleconsulting/hashtagtooling`
- [ ] Railway detects Next.js automatically
- [ ] Wait for initial build (2-5 minutes)

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 3.2 Add Environment Variables

In Railway Dashboard → Your Project → Variables:

- [ ] Click "New Variable"
- [ ] Add: `NEXT_PUBLIC_SUPABASE_URL` = [your Supabase URL]
- [ ] Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY` = [your Supabase key]
- [ ] Add: `NEXT_PUBLIC_PAYPAL_CLIENT_ID` = [your PayPal Live Client ID]
- [ ] Add: `PAYPAL_CLIENT_SECRET` = [your PayPal Live Secret]
- [ ] Add: `NODE_ENV` = `production`
- [ ] Click "Deploy" (Railway will rebuild with env vars)

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 3.3 Test Railway Subdomain

- [ ] Wait for deployment to complete
- [ ] Railway gives you a URL like: `hashtagtooling-production.up.railway.app`
- [ ] Click the URL or go to it in browser
- [ ] Verify homepage loads
- [ ] Test shop page
- [ ] Test custom mallet builder
- [ ] **Do NOT test PayPal yet** (will use real money!)

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Phase 4: Custom Domain Setup

### 4.1 Add Domain in Railway

- [ ] In Railway project → Settings → Domains
- [ ] Click "Custom Domain"
- [ ] Enter: `hashtagwoodworking.co.uk`
- [ ] Railway shows DNS records to configure
- [ ] Keep this page open (you'll need the values)

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 4.2 Configure DNS Records

Where did you register hashtagwoodworking.co.uk?
- [ ] GoDaddy
- [ ] Namecheap
- [ ] 123-reg
- [ ] Other: __________

**Steps:**
- [ ] Log in to your domain registrar
- [ ] Find DNS settings / DNS management
- [ ] Add CNAME record: `@` → [Railway URL from above]
- [ ] Add CNAME record: `www` → [Railway URL from above]
- [ ] Save changes
- [ ] DNS propagation begins (can take 1-48 hours)

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 4.3 Wait for DNS & SSL

- [ ] Check DNS propagation: https://dnschecker.org
- [ ] Enter: `hashtagwoodworking.co.uk`
- [ ] Wait until green checkmarks appear
- [ ] Railway will automatically provision SSL certificate
- [ ] Check Railway dashboard for "SSL Active" badge
- [ ] Site will be accessible via HTTPS

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Phase 5: Content Updates

### 5.1 Add Your Products

- [ ] Go to Supabase dashboard → Table Editor → products
- [ ] Delete sample products (or keep as templates)
- [ ] Add your first product:
  - Name, description, price
  - Category (mallet, awl, coin, square)
  - Stock status
  - Image URL
- [ ] Add at least 5-10 products to start

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 5.2 Upload Product Images

Option A - Supabase Storage:
- [ ] Supabase → Storage → Create bucket "products"
- [ ] Upload images
- [ ] Copy public URLs
- [ ] Use in product table

Option B - External (Imgur, Cloudinary):
- [ ] Upload images to service
- [ ] Copy URLs
- [ ] Use in product table

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 5.3 Add Your Wood Types

- [ ] Open `/lib/constants.ts` in your code editor
- [ ] Find `WOOD_TYPES` array
- [ ] Add your wood species with hex colors
- [ ] Commit and push:
  ```bash
  cd /Users/James.Howard/Documents/hashtagtooling
  git add lib/constants.ts
  git commit -m "Add all wood types"
  git push
  ```
- [ ] Railway auto-deploys in 2-3 minutes

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 5.4 Update Contact Information

- [ ] Edit `/app/contact/page.tsx`
- [ ] Replace with your real email
- [ ] Update any other contact details
- [ ] Commit and push changes

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Phase 6: Testing

### 6.1 Test All Pages

Visit https://hashtagwoodworking.co.uk and test:

- [ ] Homepage loads correctly
- [ ] Shop shows your products
- [ ] Product detail pages work
- [ ] Custom mallet builder functions
- [ ] Commission form submits (check Supabase commissions table)
- [ ] About page has your content
- [ ] Contact page has correct info
- [ ] Shipping page is accurate
- [ ] Mobile responsive (test on phone)

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 6.2 Test Shopping Cart

- [ ] Add item to cart
- [ ] Cart counter updates
- [ ] Go to cart page
- [ ] Increase/decrease quantity
- [ ] Remove item
- [ ] Add multiple items
- [ ] Cart total calculates correctly

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 6.3 Test PayPal Checkout (WITH REAL MONEY!)

**⚠️ This will process a real transaction!**

- [ ] Add a cheap item to cart (or use a £1 test item)
- [ ] Go to cart
- [ ] Click "Proceed to Checkout"
- [ ] Enter name and email
- [ ] PayPal button appears
- [ ] Click PayPal, log in
- [ ] Complete payment with SMALL amount
- [ ] Verify payment appears in PayPal dashboard
- [ ] Check order in Supabase orders table
- [ ] Refund yourself if testing

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## Phase 7: Launch! 🚀

### 7.1 Final Checks

- [ ] All pages load without errors
- [ ] All images display
- [ ] No broken links
- [ ] Terms & Conditions (consider adding)
- [ ] Privacy Policy (consider adding)
- [ ] Shipping rates are correct
- [ ] Product prices are correct

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 7.2 Soft Launch

- [ ] Share with family/friends
- [ ] Ask them to test
- [ ] Fix any issues found
- [ ] Monitor Railway logs
- [ ] Watch Supabase for submissions

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

### 7.3 Public Launch

- [ ] Post on Instagram/Facebook
- [ ] Share with woodworking communities
- [ ] Tell customers about custom work
- [ ] Monitor orders closely
- [ ] Respond quickly to commissions

**Status:** ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🎉 Congratulations!

Your woodworking e-commerce site is LIVE!

**Your site:** https://hashtagwoodworking.co.uk

---

## Quick Reference

### Important URLs

- **Live Site:** https://hashtagwoodworking.co.uk
- **Railway Dashboard:** https://railway.app
- **Supabase Dashboard:** https://supabase.com
- **PayPal Dashboard:** https://www.paypal.com/merchantapps/appcenter/acceptpayments/ppplus
- **GitHub Repo:** https://github.com/oracleconsulting/hashtagtooling

### Update Your Site

```bash
cd /Users/James.Howard/Documents/hashtagtooling
# Make changes...
git add .
git commit -m "Description of changes"
git push
# Railway auto-deploys in 2-3 minutes!
```

### View Logs

Railway Dashboard → Your Project → Deployments → View Logs

### Check Orders

Supabase Dashboard → Table Editor → orders

### Check Commissions

Supabase Dashboard → Table Editor → commissions

---

## Support Documents

- `RAILWAY_DEPLOYMENT.md` - Complete deployment guide
- `DNS_SETUP_GUIDE.md` - Domain configuration help
- `ADMIN_GUIDE.md` - Managing products and orders
- `QUICKSTART.md` - Quick start guide

---

**Time to start selling! 🔨🪵**



