# hashtagwoodworking.co.uk - DNS Configuration Guide

## Domain Setup for Railway

Your domain: **hashtagwoodworking.co.uk**

---

## Quick Start

1. **In Railway Dashboard:**
   - Go to your project → Settings → Domains
   - Click "Custom Domain"
   - Enter: `hashtagwoodworking.co.uk`
   - Railway will show you DNS records

2. **At Your Domain Registrar:**
   - Log in to where you registered the domain
   - Go to DNS settings
   - Add the records shown by Railway

---

## DNS Records to Add

Railway will provide specific values, but typically you'll add:

### Option 1: CNAME Record (Recommended)

```
Type: CNAME
Name: @
Value: [your-project].up.railway.app
TTL: 3600 (or automatic)
```

```
Type: CNAME  
Name: www
Value: [your-project].up.railway.app
TTL: 3600 (or automatic)
```

### Option 2: A Record

```
Type: A
Name: @
Value: [IP address from Railway]
TTL: 3600 (or automatic)
```

---

## Common UK Domain Registrars

### GoDaddy.co.uk
1. Log in to GoDaddy
2. My Products → Domains
3. Click your domain → Manage DNS
4. Add/Edit records as shown above
5. Save changes

### Namecheap
1. Log in to Namecheap
2. Domain List → Manage
3. Advanced DNS tab
4. Add New Record
5. Save changes

### 123-reg
1. Log in to 123-reg
2. Manage Domains
3. Select domain → Manage DNS
4. Add records
5. Save changes

### UK2.net / Fasthosts
1. Log in to control panel
2. Select domain
3. DNS Management
4. Add records
5. Apply changes

---

## DNS Propagation

**How long does it take?**
- Minimum: 15 minutes
- Average: 1-4 hours
- Maximum: 48 hours

**Check propagation status:**
- https://dnschecker.org
- Enter: `hashtagwoodworking.co.uk`
- Select "A" or "CNAME" record type

---

## SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt.

**Timeline:**
1. Add custom domain in Railway
2. Configure DNS records
3. Wait for DNS propagation
4. Railway detects domain
5. SSL certificate issued (5-15 minutes)
6. Your site is live with HTTPS! 🎉

**Check SSL status:**
- Railway dashboard → Deployments → Domain
- Look for "SSL Active" badge

---

## Both www and non-www

To make both work:

1. Add both domains in Railway:
   - `hashtagwoodworking.co.uk`
   - `www.hashtagwoodworking.co.uk`

2. Add both DNS records:
   ```
   Type: CNAME, Name: @, Value: [railway-url]
   Type: CNAME, Name: www, Value: [railway-url]
   ```

3. Railway will handle redirects automatically

---

## Email Considerations

**Important:** If you use email with this domain (e.g., james@hashtagwoodworking.co.uk):

- Don't delete existing MX records
- Only modify/add A or CNAME records
- Keep all email-related DNS records intact

Common email records to preserve:
- MX (mail exchange)
- SPF (TXT record for email)
- DKIM (email authentication)

---

## Troubleshooting

### Domain Not Resolving

**Problem:** hashtagwoodworking.co.uk shows "Site can't be reached"

**Solutions:**
1. Check DNS records are correct (no typos)
2. Wait longer (DNS can take 48 hours)
3. Clear your DNS cache:
   ```bash
   # Mac
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   ```
4. Try incognito/private browsing
5. Try different network (mobile data)

### SSL Certificate Not Working

**Problem:** Site shows "Not Secure" or certificate error

**Solutions:**
1. Wait 15-30 minutes after DNS propagates
2. Check Railway dashboard for SSL status
3. Make sure you're using `https://` not `http://`
4. Clear browser cache
5. Contact Railway support if stuck

### Redirects Not Working

**Problem:** www redirects to non-www (or vice versa)

**Solutions:**
1. Make sure both domains added in Railway
2. Check both DNS records exist
3. Wait for DNS propagation
4. Railway handles redirects automatically once both resolve

---

## Testing Your Domain

### 1. Check DNS Resolution

```bash
# Check if domain points to Railway
dig hashtagwoodworking.co.uk

# Check CNAME records
dig www.hashtagwoodworking.co.uk CNAME
```

### 2. Check HTTP/HTTPS

Try these URLs:
- http://hashtagwoodworking.co.uk
- https://hashtagwoodworking.co.uk
- http://www.hashtagwoodworking.co.uk
- https://www.hashtagwoodworking.co.uk

All should work and redirect to HTTPS.

### 3. Check SSL Certificate

```bash
# Mac/Linux
openssl s_client -connect hashtagwoodworking.co.uk:443 -servername hashtagwoodworking.co.uk
```

Should show "Verify return code: 0 (ok)"

---

## Final Checklist

Before announcing your site is live:

- [ ] DNS records configured
- [ ] DNS propagated (use dnschecker.org)
- [ ] Site loads at hashtagwoodworking.co.uk
- [ ] SSL certificate active (HTTPS)
- [ ] Both www and non-www work
- [ ] Mobile site works
- [ ] All pages load correctly
- [ ] Test a purchase
- [ ] Email still works (if using domain for email)

---

## Need Help?

**DNS Issues:**
- Contact your domain registrar's support
- They can verify DNS records are correct

**Railway Issues:**
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app/deploy/deployments#custom-domains

**General Questions:**
- See RAILWAY_DEPLOYMENT.md for full guide

---

**Your custom domain will be live soon! 🌐**

