#!/bin/bash
set -e
echo "Building site..."
npm run build
echo "Deploying to server..."
rsync -avz --delete dist/ deploy@198.251.65.190:/var/www/alexanderkey.com/_site
echo "Deployment complete!"
