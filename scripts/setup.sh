#!/bin/bash

# Setup script for Emotional Climate Sensing Service

set -e

echo "🌡️  Setting up Emotional Climate Sensing Service..."
echo ""

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first:"
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ pnpm found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f apps/api/.env ]; then
    cp .env.example apps/api/.env
    echo "✅ Created apps/api/.env from template"
    echo "⚠️  Please edit apps/api/.env and configure your database and API keys"
else
    echo "ℹ️  apps/api/.env already exists"
fi

if [ ! -f apps/web/.env ]; then
    cp apps/web/.env.example apps/web/.env
    echo "✅ Created apps/web/.env from template"
else
    echo "ℹ️  apps/web/.env already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start PostgreSQL (docker-compose -f docker-compose.dev.yml up -d)"
echo "2. Run migrations (pnpm db:migrate)"
echo "3. Seed database (pnpm db:seed)"
echo "4. Start dev servers (pnpm dev)"
echo ""
echo "For more information, see README.md"
