#!/bin/bash
echo "Building site..."
npm run build

echo "Deploying to server..."
rsync -avz --delete dist/ deploy@69.164.204.88:/var/www/alexanderkey.com

echo "Deployment complete!"
