#!/bin/bash
cd /var/www/Francolink-App
echo "🔄 Pulling latest code..."
git pull origin main
echo "📦 Installing dependencies..."
npm install
echo "🏗️ Building Next.js..."
rm -rf .next
npm run build
echo "🚀 Restarting app..."
pm2 restart francolink
echo "✅ Deployment complete!"
pm2 logs francolink --lines 20
