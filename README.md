# #TOOLING - Handcrafted Woodworking Tools & EDC

A modern e-commerce platform for selling custom woodworking tools, mallets, awls, engineering squares, and laser-cut EDC coins.

**Live Site:** https://hashtagwoodworking.co.uk

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Payments**: PayPal
- **Hosting**: Railway
- **Image Storage**: Supabase Storage

## Features

- 🛍️ Product catalog with filtering by category
- 🔨 Custom mallet builder with 100+ wood types
- 💳 Direct PayPal checkout
- 📋 Commission waiting list system
- 🛒 Shopping cart with persistent state
- 📱 Fully responsive design

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- PayPal Developer account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

4. Set up your Supabase database with the following tables:

```sql
-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  stock_status TEXT DEFAULT 'in_stock',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Commissions table
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT,
  preferred_custom_build TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paypal_order_id TEXT,
  status TEXT DEFAULT 'pending',
  order_details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
hashtagtooling/
├── app/                    # Next.js app directory
│   ├── about/             # About page
│   ├── cart/              # Shopping cart & checkout
│   ├── commissions/       # Commission request form
│   ├── custom-mallet/     # Custom mallet builder
│   ├── shop/              # Product catalog
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # UI components (Button, Card, etc)
│   ├── Header.tsx        # Navigation header
│   ├── Footer.tsx        # Site footer
│   └── ProductCard.tsx   # Product display card
├── lib/                   # Utilities and configuration
│   ├── constants.ts      # Product constants (wood types, etc)
│   ├── store.ts          # Zustand state management
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
└── public/               # Static assets
```

## Customization

### Adding Wood Types

Edit `lib/constants.ts` and add to the `WOOD_TYPES` array:

```typescript
{ id: 'teak', name: 'Teak', color: '#CD853F' }
```

### Adding Products

Products can be managed through the Supabase dashboard or via API calls.

## Deployment

### Railway Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables
4. Deploy!

## License

Private project - All rights reserved

## Contact

For questions or custom commissions, visit [/commissions](/commissions)
