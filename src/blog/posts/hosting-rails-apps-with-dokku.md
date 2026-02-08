---
title: "How to Host Rails Apps with Dokku"
description: "A step-by-step guide to deploying Rails applications using Dokku. Learn how to set up a server, configure databases, deploy your app, and manage multiple Rails apps on a single server."
date: 2025-02-08
tags: ["blog", "rails", "dokku", "deployment", "devops"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

I use Dokku for hosting all of my Rails apps these days. It's easy to deploy, makes managing production and staging environments straightforward, and lets you host multiple Rails apps on a single server. Below are the instructions I've refined over the years for setting up a new server with Dokku and deploying a Rails app.

This guide covers installing Dokku, setting up databases, creating your Dokku app, configuring a domain name with SSL, and adding additional apps to the same server.

## Part 1: Install and Configure Dokku

### Step 1: Install Dokku (as root)

SSH into your server as root (Dokku installation requires root privileges):

```bash
ssh root@your-server-ip
```

Install Dokku:

```bash
# Download and install latest stable Dokku
wget https://raw.githubusercontent.com/dokku/dokku/v0.35.18/bootstrap.sh
DOKKU_TAG=v0.35.18 bash bootstrap.sh
```

**Note**: Check the [Dokku installation docs](https://dokku.com/docs/getting-started/installation/) for the latest version number before running these commands.

Installation takes 5-10 minutes and includes Docker setup.

### Step 2: Configure SSH Access

Add your SSH public key to enable git push deployments:

```bash
# Get your public key from local machine first:
# cat ~/.ssh/id_rsa.pub

# Add your public key to Dokku
echo "your-ssh-public-key-here" | sudo dokku ssh-keys:add admin
```

**Important**: Using `admin` as the key name grants administrative privileges.

### Step 3: Set Global Domain

Configure a global domain for automatic subdomain routing:

```bash
# Replace YOUR_SERVER_IP with your actual IP
sudo dokku domains:set-global YOUR_SERVER_IP.sslip.io
```

**Example**: For IP `192.168.1.100`:

```bash
sudo dokku domains:set-global 192.168.1.100.sslip.io
```

This enables automatic subdomains like `app-name-staging.192.168.1.100.sslip.io`.

## Part 2: Create Application and Databases

With Dokku installed, you can now create your application and set up the required databases.

### Step 4: Create Dokku Application

```bash
sudo dokku apps:create app-name-staging
```

Verify creation:

```bash
dokku apps:list
```

### Step 5: Install MySQL Plugin

```bash
sudo dokku plugin:install https://github.com/dokku/dokku-mysql.git mysql
```

### Step 6: Create Multiple Databases

Create all databases needed for Rails 8 multi-database setup:

```bash
# Create primary database
sudo dokku mysql:create app-name-staging-db

# Create additional databases for Rails 8 multi-database architecture
sudo dokku mysql:create app-name-staging-cache-db
sudo dokku mysql:create app-name-staging-queue-db
sudo dokku mysql:create app-name-staging-cable-db
```

### Step 7: Link Databases to Application

```bash
# Link all databases to the app
sudo dokku mysql:link app-name-staging-db app-name-staging
sudo dokku mysql:link app-name-staging-cache-db app-name-staging
sudo dokku mysql:link app-name-staging-queue-db app-name-staging
sudo dokku mysql:link app-name-staging-cable-db app-name-staging
```

### Step 8: Check Database Environment Variables

Verify the database URLs that were created:

```bash
sudo dokku config app-name-staging
```

You should see output like:

```
DATABASE_URL:           mysql://mysql:password@dokku-mysql-app-name-staging-db:3306/app_name_staging_db
DOKKU_MYSQL_AQUA_URL:   mysql://mysql:password@dokku-mysql-app-name-staging-cache-db:3306/app_name_staging_cache_db
DOKKU_MYSQL_BLACK_URL:  mysql://mysql:password@dokku-mysql-app-name-staging-queue-db:3306/app_name_staging_queue_db
DOKKU_MYSQL_BLUE_URL:   mysql://mysql:password@dokku-mysql-app-name-staging-cable-db:3306/app_name_staging_cable_db
```

**Note**: Dokku automatically assigns color-coded names (AQUA, BLACK, BLUE) to additional database links.

### Step 9: Configure Environment Variables

```bash
# Set Rails environment
sudo dokku config:set app-name-staging RAILS_ENV=staging

# Set Rails master key (get from config/master.key in your Rails app)
sudo dokku config:set app-name-staging RAILS_MASTER_KEY=your-master-key-here
```

Get your Rails master key:

```bash
# On your local machine in your Rails app directory:
cat config/master.key
```

## Part 3: Prepare Rails Application

Before deploying, you need to configure your Rails application to work with Dokku.

### Step 10: Update Database Configuration

In your Rails app's `config/database.yml`, configure staging to use all databases:

```yaml
staging:
  primary: &primary_staging
    <<: *default
    url: <%= ENV["DATABASE_URL"] %>
  cache:
    <<: *primary_staging
    url: <%= ENV["DOKKU_MYSQL_AQUA_URL"] %>
    migrations_paths: db/cache_migrate
  queue:
    <<: *primary_staging
    url: <%= ENV["DOKKU_MYSQL_BLACK_URL"] %>
    migrations_paths: db/queue_migrate
  cable:
    <<: *primary_staging
    url: <%= ENV["DOKKU_MYSQL_BLUE_URL"] %>
    migrations_paths: db/cable_migrate
```

**Important**: Use the exact environment variable names that Dokku created (check with `sudo dokku config app-name-staging`).

### Step 11: Create Procfile

Create a `Procfile` in your Rails app root directory:

```bash
touch Procfile
```

Add this content:

```
web: bundle exec rails server -p $PORT -e $RAILS_ENV
worker: bundle exec rake solid_queue:start
release: bundle exec rails db:create db:schema:load
```

**Note**: The release command above is for the first deploy only. After your initial deployment, change it to:

```
release: bundle exec rails db:migrate
```

**Process explanations**:

- `web`: Starts Rails server on Dokku-assigned port
- `worker`: Starts Solid Queue for background jobs
- `release`: Runs database setup/migrations during deployment (before web process starts)

### Step 12: Verify Required Dependencies

Ensure your `Gemfile` includes:

```ruby
gem 'mysql2'
gem 'puma'  # or your preferred web server
```

Fix any Dockerfile issues (common Rails 8 issue):

```dockerfile
# In your Dockerfile, ensure this line is correct (around line 31):
ARG NODE_VERSION=20.19.2
# NOT: ARG NODE_VERSIONv=v20.19.2 (extra 'v' causes build failure)
```

## Part 4: Deploy Application

Now you're ready to deploy your Rails application to Dokku.

### Step 13: Set Up Git Remote

On your local machine in your Rails app directory:

```bash
# Add Dokku as git remote (use raw IP, not sslip.io domain)
git remote add dokku-staging dokku@YOUR_SERVER_IP:app-name-staging

# Example:
git remote add dokku-staging dokku@192.168.1.100:app-name-staging

# Verify remotes
git remote -v
```

### Step 14: Deploy

Commit your changes and deploy:

```bash
# Add all changes
git add .
git commit -m "Configure for Dokku staging deployment"

# Deploy to staging
git push dokku-staging main
```

**Deployment process**:

1. Dokku detects Ruby/Rails buildpack
2. Installs dependencies (`bundle install`)
3. Builds Docker image
4. Runs release command (database setup)
5. Starts web process
6. Configures HTTP routing

### Step 15: Access Your Application

Once deployment completes:

```bash
# Your app will be accessible at:
http://app-name-staging.YOUR_SERVER_IP.sslip.io

# Example:
http://app-name-staging.192.168.1.100.sslip.io
```

## Part 5: Custom Domain and SSL Setup

Once your app is running, you'll likely want to configure a custom domain and enable HTTPS.

### Add Custom Domain

```bash
# Add the domain to your app
dokku domains:add app-name-staging yourdomain.com

# Add the www version (for redirect purposes)
dokku domains:add app-name-staging www.yourdomain.com

# Check your current domains
dokku domains:report app-name-staging
```

### Install Let's Encrypt Plugin

```bash
dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
```

### Enable SSL

```bash
# Enable SSL for your app
dokku letsencrypt:enable app-name-staging

# Set up automatic certificate renewal
dokku letsencrypt:cron-job --add

# Check SSL status
dokku letsencrypt:list
```

### Configure WWW Redirect (Optional)

If you want to redirect www to non-www (or vice versa):

```bash
# Install the redirect plugin
dokku plugin:install https://github.com/dokku/dokku-redirect.git

# Set up the www redirect
dokku redirect:set app-name-staging www.yourdomain.com yourdomain.com
```

## Part 6: Management Commands

Here are the essential commands for managing your Dokku applications.

### Application Management

```bash
# View application logs
dokku logs app-name-staging

# Follow logs in real-time
dokku logs app-name-staging -t

# Check app status
dokku ps:report app-name-staging

# Restart application
dokku ps:restart app-name-staging

# Run Rails console
dokku run app-name-staging bundle exec rails console

# Run database migrations manually
dokku run app-name-staging bundle exec rails db:migrate
```

### Database Management

```bash
# List all databases
dokku mysql:list

# Connect to primary database
dokku mysql:connect app-name-staging-db

# Connect to specific database
dokku mysql:connect app-name-staging-cache-db

# Create database backup
dokku mysql:backup app-name-staging-db backup-$(date +%Y%m%d)

# View database info
dokku mysql:info app-name-staging-db

# Import database
dokku mysql:import app-name-db < db_file.sql
```

### Configuration Management

```bash
# View all environment variables
dokku config app-name-staging

# Add new environment variable
dokku config:set app-name-staging NEW_VAR=value

# Remove environment variable
dokku config:unset app-name-staging OLD_VAR

# Export configuration
dokku config:export app-name-staging
```

## Part 7: Adding More Applications

One of Dokku's strengths is hosting multiple applications on a single server. To deploy additional Rails apps:

```bash
# Create new app
dokku apps:create another-app-staging

# Create databases
dokku mysql:create another-app-staging-db
dokku mysql:create another-app-staging-cache-db
dokku mysql:create another-app-staging-queue-db
dokku mysql:create another-app-staging-cable-db

# Link databases
dokku mysql:link another-app-staging-db another-app-staging
dokku mysql:link another-app-staging-cache-db another-app-staging
dokku mysql:link another-app-staging-queue-db another-app-staging
dokku mysql:link another-app-staging-cable-db another-app-staging

# Configure environment
dokku config:set another-app-staging RAILS_ENV=staging RAILS_MASTER_KEY=key

# Add git remote locally
git remote add dokku-another dokku@YOUR_SERVER_IP:another-app-staging

# Deploy
git push dokku-another main
```

Each app gets its own subdomain: `another-app-staging.YOUR_SERVER_IP.sslip.io`

## Part 8: Persistent Storage

If your Rails app needs persistent storage (for file uploads, for example), configure storage mounts:

```bash
# Create storage folder
dokku storage:ensure-directory --chown false app-name

# Set permissions
sudo chown -R 1000:1000 /var/lib/dokku/data/storage/app-name
sudo chmod -R 775 /var/lib/dokku/data/storage/app-name

# Mount folder (for public/uploads use: /rails/public/uploads)
dokku storage:mount app-name /var/lib/dokku/data/storage/app-name:/app/storage

# Restart app
dokku ps:restart app-name

# Check the mount is active
dokku storage:list app-name
```

## Troubleshooting

### Build Failures

```bash
# Check build logs
dokku logs app-name-staging

# Common Dockerfile issue - fix NODE_VERSION typo
# Change: ARG NODE_VERSIONv=v20.19.2
# To: ARG NODE_VERSION=20.19.2
```

### Database Connection Issues

```bash
# Verify database URLs
dokku config app-name-staging | grep URL

# Test database connection
dokku run app-name-staging bundle exec rails runner "puts ActiveRecord::Base.connection.execute('SELECT 1')"

# Check database status
dokku mysql:info app-name-staging-db
```

### Application Won't Start

```bash
# Check if process is running
dokku ps:report app-name-staging

# Check for missing environment variables
dokku config app-name-staging

# Run migrations manually if needed
dokku run app-name-staging bundle exec rails db:migrate
```
