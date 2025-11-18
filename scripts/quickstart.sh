#!/bin/bash

# Quick start script - runs everything needed for development

set -e

echo "🚀 Quick Start - Emotional Climate Sensing Service"
echo ""

# Check if .env exists
if [ ! -f apps/api/.env ]; then
    echo "⚠️  No .env file found. Running setup..."
    ./scripts/setup.sh
fi

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

# Check if database is seeded
echo "🌱 Seeding database..."
pnpm db:seed

echo ""
echo "✨ Everything is ready!"
echo ""
echo "Starting development servers..."
echo "  - API: http://localhost:3001"
echo "  - Web: http://localhost:3000"
echo ""

# Start dev servers
pnpm dev
