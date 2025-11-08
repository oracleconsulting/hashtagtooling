# Admin Guide - Managing Your #TOOLING Store

## Adding Products via Supabase Dashboard

### Step 1: Access Supabase Dashboard

1. Go to https://supabase.com
2. Select your project
3. Click **Table Editor** in the sidebar
4. Select the **products** table

### Step 2: Add a New Product

Click **Insert row** and fill in:

- **name**: Product name (e.g., "Cherry Framing Mallet")
- **description**: Short description (appears on product cards)
- **price**: Decimal number (e.g., 129.99)
- **category**: One of: `mallet`, `awl`, `coin`, `square`
- **image_url**: URL to product image (see image guide below)
- **stock_status**: One of: `in_stock`, `made_to_order`, `out_of_stock`

### Step 3: Upload Product Images

#### Option A: Supabase Storage

1. Go to **Storage** in Supabase dashboard
2. Create a bucket called `products`
3. Upload your images
4. Copy the public URL
5. Use that URL in the `image_url` field

#### Option B: External Image Host

- Use Imgur, Cloudinary, or another image host
- Upload images and copy URLs
- Paste URLs into `image_url` field

### Recommended Image Specs

- **Format**: JPG or PNG
- **Dimensions**: At least 800x600px (4:3 ratio works best)
- **File Size**: Under 500KB for fast loading
- **Quality**: High resolution showing wood grain and details

## Managing Commission Requests

### View Commission Requests

1. Go to Supabase → **Table Editor**
2. Select **commissions** table
3. Sort by `created_at` to see newest first

### Update Commission Status

Click on a row and change `status` to:
- `pending` - Just submitted
- `contacted` - You've reached out
- `in_progress` - Work has started
- `completed` - Finished

### Export Commission Data

1. In Table Editor, click the export icon
2. Download as CSV
3. Open in Excel/Numbers for record keeping

## Managing Orders

### View Orders

1. Supabase → **Table Editor** → **orders**
2. All PayPal transactions are logged here

### Order Fields

- **customer_name**: From checkout form
- **customer_email**: For sending updates
- **total_amount**: Order total in GBP
- **paypal_order_id**: PayPal transaction reference
- **status**: `pending`, `paid`, `shipped`, `completed`
- **order_details**: JSON with cart contents

### Mark as Shipped

1. Find the order
2. Change `status` to `shipped`
3. (Future: This will trigger email notification)

## Updating Wood Types

Edit `/lib/constants.ts`:

```typescript
export const WOOD_TYPES = [
  { id: 'walnut', name: 'Black Walnut', color: '#3D2817' },
  { id: 'your-new-wood', name: 'Your Wood Name', color: '#HEX_COLOR' },
  // Add more...
]
```

The `color` hex code should roughly match the wood's appearance.

## Product Categories

Current categories:
- **mallets** - All mallet types
- **awls** - Marking awls and scribers
- **squares** - Engineering and try squares  
- **coins** - EDC carry coins

To add new categories, you'll need to:
1. Update database CHECK constraint
2. Add to shop page filters
3. Add to footer links

## Pricing Tips

Consider:
- Material cost (exotic woods cost more)
- Labor time (custom work takes longer)
- Shipping weight and size
- Market comparison
- Your skill level and reputation

Most mallets: £60-150
Awls: £30-60
Squares: £50-100
Coins: £20-50

## Customer Communication

When you receive commission requests:

1. **Respond within 48 hours**
2. **Clarify specifications** - wood types, dimensions, timeline
3. **Quote price** - be clear about deposit/payment schedule
4. **Set expectations** - realistic timeline, potential variations in wood grain
5. **Show progress** - send photos during creation
6. **Get approval** - before final finishing

## Backup Your Data

### Database Backup

Supabase automatically backs up, but you can also:
1. Go to **Database** → **Backups**
2. Download manual backup
3. Store safely

### Code Backup

Your code is on GitHub (if you pushed it), or:
```bash
cd /Users/James.Howard/Documents/hashtagtooling
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

## Analytics (Future Enhancement)

Consider adding:
- Google Analytics for traffic
- Supabase Analytics for database queries
- PayPal reporting for sales data
- Email marketing (Mailchimp, ConvertKit)

## Security Best Practices

1. **Never commit .env.local** to git (already in .gitignore)
2. **Use Row Level Security** in Supabase for sensitive tables
3. **Keep dependencies updated**: `npm audit` and `npm update`
4. **Monitor PayPal dashboard** for suspicious transactions
5. **Regular backups** of product images and database



