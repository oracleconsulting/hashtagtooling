# Quick Start Guide

## What You Have

A fully functional e-commerce website for #TOOLING with:

✅ **Homepage** - Professional landing with hero section  
✅ **Shop** - Product catalog with category filtering  
✅ **Custom Mallet Builder** - Interactive configurator with 100+ wood options  
✅ **Commission Form** - Waiting list for custom work  
✅ **Shopping Cart** - With PayPal checkout integration  
✅ **Product Pages** - Individual pages for each item  
✅ **Info Pages** - About, Contact, Shipping policy  
✅ **Responsive Design** - Works on mobile, tablet, desktop  

## Get Started in 3 Steps

### 1. Set Up Environment Variables

Create `.env.local` in the project root:

```bash
cd /Users/James.Howard/Documents/hashtagtooling

# Create the file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
EOF
```

### 2. Set Up Supabase Database

1. Go to https://supabase.com
2. Create a new project
3. In SQL Editor, paste the contents of `supabase-schema.sql`
4. Run the query
5. Copy your project URL and anon key to `.env.local`

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 - your store is live!

## What's Next?

### Add Your Products

See `ADMIN_GUIDE.md` for detailed instructions on:
- Uploading product images
- Adding products via Supabase
- Managing orders and commissions
- Updating wood types

### Customize Content

- **Wood types**: Edit `/lib/constants.ts`
- **About page**: Edit `/app/about/page.tsx`
- **Contact info**: Edit `/app/contact/page.tsx`
- **Shipping rates**: Edit `/app/shipping/page.tsx`

### Deploy to Production

See `DEPLOYMENT.md` for Railway deployment instructions.

## File Structure

```
hashtagtooling/
├── app/                      # Next.js pages
│   ├── page.tsx             # Homepage
│   ├── shop/                # Product catalog
│   ├── custom-mallet/       # Mallet builder
│   ├── commissions/         # Commission form
│   ├── cart/                # Shopping cart
│   ├── product/[id]/        # Individual product pages
│   ├── about/               # About page
│   ├── contact/             # Contact page
│   └── shipping/            # Shipping info
├── components/              # Reusable components
│   ├── ui/                  # UI primitives
│   ├── Header.tsx           # Navigation
│   ├── Footer.tsx           # Footer
│   └── ProductCard.tsx      # Product display
├── lib/                     # Utilities
│   ├── constants.ts         # Wood types, mallet types
│   ├── store.ts             # Shopping cart state
│   ├── supabase.ts          # Database client
│   └── utils.ts             # Helper functions
└── supabase-schema.sql      # Database schema
```

## Need Help?

- **Supabase not connecting?** Check URL and key in `.env.local`
- **PayPal not working?** Make sure you're using the correct Client ID
- **Build errors?** Run `npm install` to ensure all dependencies are installed
- **Styling issues?** Check that Tailwind CSS is properly configured

## Testing Checklist

Before going live:

- [ ] All pages load without errors
- [ ] Products display correctly in shop
- [ ] Custom mallet builder updates preview
- [ ] Commission form submits to database
- [ ] Cart adds/removes items properly
- [ ] PayPal checkout flow works (use sandbox mode for testing)
- [ ] Mobile responsive on phone-sized screen
- [ ] Images load correctly

## Development vs Production

**Development** (what you have now):
- Placeholder product images
- PayPal sandbox mode
- Sample products in database

**Production** (when you deploy):
- Your actual product photos
- PayPal live credentials
- Real product data
- Custom domain name

---

**Ready to launch your woodworking business online! 🔨🪵**

