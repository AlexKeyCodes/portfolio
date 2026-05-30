#!/bin/bash
set -e
echo "Building site..."
npm run build
echo "Deploying to server..."
rsync -avz --delete dist/ deploy@45.79.25.166:/var/www/alexanderkey.com/_site
echo "Deployment complete!"
