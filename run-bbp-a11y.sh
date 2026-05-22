#!/usr/bin/env bash
set -e

echo ""
echo "🔧 BBP v0.1 Accessibility Test Runner"
echo "======================================"

if ! curl -sf http://localhost:3000/ > /dev/null 2>&1; then
  echo "❌ localhost:3000 is not responding."
  echo "   Please start your dev server first."
  exit 1
fi
echo "✅ localhost:3000 is up"

if [ ! -d "node_modules/@axe-core" ]; then
  echo ""
  echo "📦 Installing test dependencies (one-time)..."
  npm install --save-dev puppeteer @axe-core/puppeteer axe-html-reporter
fi

echo ""
echo "🚀 Running tests..."
node bbp-a11y-tests.mjs
