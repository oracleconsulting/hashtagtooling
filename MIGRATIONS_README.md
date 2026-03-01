# Supabase migrations for #TOOLING

Run these in the **Supabase SQL Editor** in order. Use your project’s **Database** → **SQL Editor**.

---

## 1. Base schema and tables

**File:** `supabase-setup-step1-tables.sql`

- Enables UUID extension
- Creates: `products`, `commissions`, `orders`, `material`, `base_prices`
- Indexes and `updated_at` triggers

Run this first on a new project.

---

## 2. Awl builder support

**File:** `supabase-migration-awl-ferrule.sql`

- Adds `awl_ferrule_premium` to `materials` (for Custom Awl builder)

Run after step 1.

---

## 3. Seed data (optional)

**File:** `supabase-materials-complete.sql`

- Inserts base prices for mallets and awls
- Inserts transition materials and wood species with premiums

Run after step 2 if you want seed data.

---

## 4. Products V2 + RLS

**File:** `supabase-migration-v2.sql`

- Products: adds `wood` category, `sold` status, `subcategory`, `featured`, `metadata`
- Enables RLS and policies on `products`, `orders`, `commissions`, `materials`, `base_prices`

Run after steps 1–2 (and 3 if you use it).

---

## Environment variables

In your app (e.g. `.env.local`), set:

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL from Supabase dashboard (Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key from the same page

**Do not** put your database password in the app. The Next.js app uses the Supabase client and anon key only. The direct DB password is for the SQL Editor or other server-side DB tools if you use them.

---

## Storage (for product images)

1. In Supabase: **Storage** → create a bucket named `products`.
2. Set it to **Public** if product images should be publicly readable.
3. The admin “Add Product” upload uses this bucket.
