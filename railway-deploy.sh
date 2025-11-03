#!/bin/bash

echo "🚂 Railway Deployment Setup for hashtagwoodworking.co.uk"
echo "========================================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI not found. Installing..."
    npm install -g @railway/cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Railway CLI"
        echo "💡 Try manually: npm install -g @railway/cli"
        exit 1
    fi
    echo "✅ Railway CLI installed"
else
    echo "✅ Railway CLI already installed"
fi

echo ""
echo "🔐 Please log in to Railway..."
railway login

echo ""
echo "📁 Linking to Railway project..."
echo ""
echo "If this is your first deployment:"
echo "  1. Run: railway init"
echo "  2. Create a new project or link existing"
echo "  3. Then run this script again"
echo ""

read -p "Have you already created a Railway project? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway link
    
    echo ""
    echo "📊 Current project status:"
    railway status
    
    echo ""
    echo "⚙️  Setting environment variables..."
    echo ""
    echo "Please add these variables in Railway dashboard:"
    echo "  → Settings → Variables"
    echo ""
    echo "Required variables:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - NEXT_PUBLIC_PAYPAL_CLIENT_ID"
    echo "  - PAYPAL_CLIENT_SECRET"
    echo "  - NODE_ENV=production"
    echo ""
    
    read -p "Have you set all environment variables? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🚀 Deploying to Railway..."
        railway up
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Deployment successful!"
            echo ""
            echo "📝 Next steps:"
            echo "  1. Go to Railway dashboard → Settings → Domains"
            echo "  2. Add custom domain: hashtagwoodworking.co.uk"
            echo "  3. Configure DNS records as shown"
            echo "  4. Wait for SSL certificate (5-15 minutes)"
            echo "  5. Test your site!"
            echo ""
            railway open
        else
            echo "❌ Deployment failed"
            echo "💡 Check Railway logs for details"
        fi
    else
        echo ""
        echo "⚠️  Please set environment variables first"
        echo "  → Railway dashboard → Settings → Variables"
    fi
else
    echo ""
    echo "📋 Next steps:"
    echo "  1. Run: railway init"
    echo "  2. Choose 'Create new project'"
    echo "  3. Name it: hashtagtooling"
    echo "  4. Then run: ./railway-deploy.sh again"
fi

echo ""
echo "📚 Documentation:"
echo "  → RAILWAY_DEPLOYMENT.md - Complete deployment guide"
echo "  → https://docs.railway.app - Official Railway docs"
echo ""

