# Railway Build Issues - FIXED ✅

## Issues Encountered

### Error 1: `supabaseUrl is required`

**Problem:** Supabase client initialization fails during build because environment variables aren't set yet.

**Solution:** Added placeholder values that allow the build to complete:

```typescript
// lib/supabase.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
```

The actual environment variables will be used at runtime.

### Error 2: `useSearchParams() should be wrapped in a suspense boundary`

**Problem:** Next.js 14 requires `useSearchParams()` to be wrapped in Suspense for proper SSR.

**Solution:** Refactored shop page:

```typescript
// Split into two components
function ShopContent() {
  const searchParams = useSearchParams()
  // ... component logic
}

export default function ShopPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <ShopContent />
    </Suspense>
  )
}
```

---

## ✅ Build Now Passes

Latest commit fixes both issues. Railway should now deploy successfully!

---

## Railway Deployment Steps (Updated)

### 1. In Railway Dashboard

After connecting your GitHub repo:

**Add Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
NODE_ENV=production
```

### 2. Trigger Redeploy

If already deployed:
- Click "Deployments" tab
- Click "Redeploy" on latest deployment
- OR just push a new commit (Railway auto-deploys)

### 3. Verify Build

Watch the build logs. You should see:
```
✓ Compiled successfully
✓ Generating static pages (12/12)
   Finalizing page optimization ...

Successfully prepared Railpack plan for build
```

---

## Important Notes

### Environment Variables Are Required at Runtime

The placeholders only allow the build to complete. Your site will NOT function properly without the real environment variables set in Railway!

**What won't work without real env vars:**
- Commission form submissions (Supabase)
- Product loading from database (Supabase)
- PayPal checkout
- Any database operations

**What will still work:**
- Homepage
- Navigation
- Static content
- Layout/UI
- Cart (client-side only, no persistence)

### Verifying Environment Variables

After setting env vars in Railway, check they're being used:

1. Railway Dashboard → Your Project → Variables
2. All required vars should be listed
3. Values should show as "••••" (hidden for security)
4. After adding, click "Redeploy" or push a new commit

---

## Testing Checklist

After successful Railway deployment:

- [ ] Site loads at Railway URL (e.g., hashtagtooling-production.up.railway.app)
- [ ] Homepage displays correctly
- [ ] No console errors about missing Supabase URL
- [ ] Commission form submits (check Supabase table)
- [ ] Products load from database
- [ ] PayPal button appears in cart
- [ ] Custom domain configured (hashtagwoodworking.co.uk)
- [ ] SSL certificate active

---

## If Build Still Fails

### Check Railway Logs

1. Railway Dashboard → Deployments
2. Click failed deployment
3. View logs
4. Look for specific error message

### Common Issues

**"supabaseUrl is required" still appears:**
- Make sure you pulled latest code: `git pull origin main`
- Check lib/supabase.ts has placeholder values
- Try clearing Railway cache (Settings → Clear Cache)

**"useSearchParams" error persists:**
- Verify app/shop/page.tsx has Suspense wrapper
- Check you're on latest commit
- Clear Railway build cache

**Environment variables not working:**
- Double-check variable names (case-sensitive!)
- Ensure they start with NEXT_PUBLIC_ for client-side
- Redeploy after adding variables

---

## Success Indicators

Your deployment is successful when you see:

```
✓ Compiled successfully
✓ Generating static pages (12/12)
Finalizing page optimization ...

Deploy
──────────
$ npm run start

Successfully deployed!
```

And your site loads at the Railway URL with no errors.

---

## Next Steps After Successful Build

1. **Test the Railway subdomain** - Make sure everything works
2. **Add environment variables** - Required for functionality
3. **Configure custom domain** - hashtagwoodworking.co.uk
4. **Set up DNS** - Point domain to Railway
5. **Wait for SSL** - Automatic via Let's Encrypt
6. **Go live!** 🚀

---

**Latest commit with fixes pushed to GitHub. Railway will auto-deploy on next push!**

