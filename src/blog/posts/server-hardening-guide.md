---
title: "How to Harden a New Server"
description: "A step-by-step guide to securing a new Linux server. Learn how to create a deploy user, lock down SSH, configure a firewall, set up fail2ban, and enable automatic security updates."
date: 2026-04-15
tags: ["blog", "security", "devops", "deployment"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

Every time I spin up a new server — whether it's for [setting up Rails apps on Dokku](/blog/how-to-host-rails-apps-with-dokku/) or anything else — I run through the same hardening steps before doing anything else. It only takes about 15 minutes, but it makes a huge difference in keeping the server secure.

This guide covers updating the system, creating a non-root user, locking down SSH, configuring a firewall, setting up fail2ban, and enabling automatic security updates.

## Part 1: Initial Setup and System Updates

### Step 1: Update System Packages

SSH into your server as root and bring everything up to date:

```bash
ssh root@your-server-ip
```

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Essential Packages

Install the tools you'll need for the rest of the setup:

```bash
sudo apt install -y curl wget git vim htop unattended-upgrades
```

## Part 2: Create a Non-Root User

You don't want to be running everything as root. Create a dedicated user for day-to-day server access.

### Step 3: Create the Deploy User

```bash
# Create the user
sudo adduser deploy

# Give sudo privileges
sudo usermod -aG sudo deploy

# Add to docker group (needed for Dokku)
sudo usermod -aG docker deploy
```

### Step 4: Set Up SSH Keys for the New User

Copy your existing SSH keys over so the deploy user can log in:

```bash
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

**Important**: Test the deploy user login from your local machine before proceeding:

```bash
ssh deploy@your-server-ip
```

## Part 3: Lock Down SSH

This is the most critical part. Disabling password authentication ensures that only someone with your SSH key can access the server.

### Step 5: Disable Password Authentication

**Before you do this, make absolutely sure your SSH key login works.** Open a new terminal and verify you can log in with your key. If you lock yourself out, you'll need console access from your hosting provider to fix it.

Edit the SSH configuration:

```bash
sudo nano /etc/ssh/sshd_config
```

Find and modify these lines:

```
PasswordAuthentication no
PubkeyAuthentication yes
```

You can also disable root login entirely if you prefer:

```
PermitRootLogin no
```

### Step 6: Apply SSH Changes

Test the configuration before restarting:

```bash
# Verify the config is valid
sudo sshd -t

# Restart SSH
sudo systemctl restart ssh
```

**Critical**: Test login in a new terminal before closing your current session. If something went wrong, you still have your existing connection to fix it.

## Part 4: Configure the Firewall

UFW (Uncomplicated Firewall) makes it easy to lock down which ports are accessible.

### Step 7: Set Up UFW

```bash
# Set default policies — deny everything incoming, allow outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow only the ports you need
sudo ufw allow ssh    # Port 22
sudo ufw allow 80     # HTTP
sudo ufw allow 443    # HTTPS

# Enable the firewall
sudo ufw enable
```

### Step 8: Verify Firewall Rules

```bash
sudo ufw status verbose
```

You should see output like this:

```
Status: active
Default: deny (incoming), allow (outgoing), deny (routed)
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80                         ALLOW IN    Anywhere
443                        ALLOW IN    Anywhere
```

That's it — only SSH, HTTP, and HTTPS traffic can reach your server.

## Part 5: Install and Configure Fail2ban

Fail2ban monitors log files and automatically bans IP addresses that show malicious behavior, like repeated failed SSH login attempts.

### Step 9: Install Fail2ban

```bash
sudo apt install fail2ban -y
```

### Step 10: Configure Fail2ban

Create a local configuration file (so your changes survive package updates):

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

Edit the local config to adjust settings if needed:

```bash
sudo nano /etc/fail2ban/jail.local
```

### Step 11: Start Fail2ban

```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

Verify it's running and monitoring SSH:

```bash
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

## Part 6: Enable Automatic Security Updates

You don't want to be manually checking for security patches every day. Unattended upgrades handles this for you.

### Step 12: Configure Automatic Updates

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

You can fine-tune which updates get applied automatically:

```bash
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

By default, this will automatically install security updates, which is exactly what you want.

## Part 7: Additional Hardening (Optional)

These steps aren't strictly necessary, but I find them useful on most servers.

### Install Logwatch

Logwatch sends you daily email summaries of server activity, which is helpful for spotting anything unusual:

```bash
sudo apt install logwatch -y
```

Configure it to run daily:

```bash
sudo nano /etc/cron.daily/00logwatch
```

### Set Up a Swap File

For smaller servers, adding swap prevents out-of-memory crashes:

```bash
# Create a 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Part 8: Verify Everything Works

Run through these checks to make sure all your security measures are active.

### Test Security Services

```bash
# Fail2ban running?
sudo fail2ban-client status
sudo systemctl status fail2ban

# Firewall active?
sudo ufw status verbose

# SSH config valid?
sudo sshd -t
```

### Test User Access

```bash
# From your local machine — deploy user should connect without a password
ssh deploy@your-server-ip

# Docker access should work (needed for Dokku)
docker ps
```

### Test Dokku Access

```bash
# From your local machine
ssh dokku@your-server-ip apps:list
```

This should show the Dokku command interface, not a shell prompt.

## Maintenance Commands

Here are the commands I use regularly for ongoing security management:

```bash
# Check which IPs fail2ban has blocked
sudo fail2ban-client status sshd

# Unban an IP if needed
sudo fail2ban-client set sshd unbanip IP_ADDRESS

# View firewall logs
sudo tail -f /var/log/ufw.log

# Manual system update
sudo apt update && sudo apt upgrade -y

# Preview what unattended-upgrades would install
sudo unattended-upgrade --dry-run
```

## Security Checklist

Before moving on to installing Dokku or deploying apps, make sure you've covered everything:

- Fail2ban installed and running
- UFW firewall enabled with only ports 22, 80, and 443 open
- Password authentication disabled
- Deploy user created with sudo and docker access
- SSH key authentication tested and working
- Automatic security updates enabled

This whole process takes about 15 minutes and gives you a solid security foundation before you start deploying anything.
