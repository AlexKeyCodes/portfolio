#!/bin/bash
set -e
echo "Building site..."
npm run build
echo "Deploying to Cloudflare Workers..."
npx wrangler deploy
echo "Deployment complete!"
