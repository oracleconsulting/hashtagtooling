#!/bin/bash

echo "🔨 #TOOLING Setup Script"
echo "========================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required. You have: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error: npm install failed"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo ""
    echo "⚠️  .env.local file not found"
    echo ""
    echo "Please create .env.local with the following variables:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id"
    echo "PAYPAL_CLIENT_SECRET=your_paypal_secret"
    echo ""
    
    read -p "Would you like to create a template .env.local now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cat > .env.local << 'EOF'
# Supabase Configuration
# Get these from: https://supabase.com → Your Project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# PayPal Configuration  
# Get these from: https://developer.paypal.com → Dashboard → Apps
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_secret_here
EOF
        echo "✅ Template .env.local created. Please edit it with your actual credentials."
    fi
else
    echo "✅ .env.local exists"
fi

echo ""
echo "========================"
echo "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your Supabase and PayPal credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "Documentation:"
echo "- README.md - Project overview"
echo "- DEPLOYMENT.md - Deploy to Railway"
echo "- ADMIN_GUIDE.md - Manage products and orders"
echo "- supabase-schema.sql - Database setup"
echo ""

