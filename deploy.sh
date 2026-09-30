#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Regenerating resume PDF and building site..."
./scripts/build-resume-pdf.sh
echo "Deploying to Cloudflare Workers..."
npx wrangler deploy
echo "Deployment complete!"
