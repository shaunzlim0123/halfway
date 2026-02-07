# GitHub Actions Deployment Setup

This workflow automatically deploys your app to AWS whenever you push to the `main` branch.

## Setup Instructions

### 1. Generate SSH Key (if you don't have one)

On your local machine:
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

### 2. Add Public Key to AWS Instance

Copy the public key to your AWS instance:
```bash
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub your-user@your-aws-instance
```

Or manually:
```bash
# Copy the public key
cat ~/.ssh/github_actions_deploy.pub

# SSH to your AWS instance
ssh your-user@your-aws-instance

# Add to authorized_keys
echo "paste-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Configure GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_HOST` | Your AWS instance public IP or domain | `ec2-1-2-3-4.compute.amazonaws.com` or `52.12.34.56` |
| `AWS_USER` | SSH username (usually `ubuntu` or `ec2-user`) | `ubuntu` |
| `AWS_SSH_KEY` | Your **private** SSH key content | Copy from `~/.ssh/github_actions_deploy` |
| `APP_PATH` | Full path to your app on AWS | `/home/ubuntu/halfway-meetup-app` |
| `AWS_PORT` | (Optional) SSH port if not 22 | `22` |

#### Getting the Private Key:
```bash
cat ~/.ssh/github_actions_deploy
# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... key content ...
# -----END OPENSSH PRIVATE KEY-----
```

### 4. Set Up PM2 on AWS Instance (if not already done)

SSH to your AWS instance and install PM2:
```bash
# Install PM2 globally
npm install -g pm2

# Set up PM2 to start on system boot
pm2 startup
# Follow the command it outputs

# Navigate to your app
cd /path/to/halfway-meetup-app

# Start your services manually first time
cd backend
pm2 start app/main.py --name backend --interpreter python3
cd ..

pm2 start npm --name frontend -- start

# Save PM2 configuration
pm2 save
```

### 5. Test the Deployment

Push a commit to the `main` branch:
```bash
git add .
git commit -m "Test GitHub Actions deployment"
git push origin main
```

Then:
1. Go to your GitHub repository
2. Click **Actions** tab
3. You should see the workflow running
4. Click on it to see live logs

### 6. Manual Deployment (Optional)

You can also trigger deployment manually:
1. Go to **Actions** tab
2. Click **Deploy to AWS** workflow
3. Click **Run workflow** → **Run workflow**

## Troubleshooting

### SSH Connection Failed
- Check `AWS_HOST` is correct
- Verify `AWS_USER` matches your instance user
- Ensure public key is in `~/.ssh/authorized_keys` on AWS
- Check AWS Security Group allows SSH from GitHub Actions IPs (or allow all IPs on port 22)

### Permission Denied
- Verify the private key in `AWS_SSH_KEY` is complete
- Check file permissions on AWS: `~/.ssh` should be `700`, `authorized_keys` should be `600`

### Git Pull Fails
- Make sure git is configured on AWS instance
- If private repo, set up SSH keys for GitHub on AWS instance

### PM2 Command Not Found
- Install PM2: `npm install -g pm2`
- Make sure it's in PATH

### Build Fails
- Check environment variables are set on AWS instance (`.env.local` file)
- Verify all dependencies are installed

## Current Workflow

After setup is complete, your workflow is:

1. **Develop locally** → Make changes
2. **Commit & push** → `git push origin main`
3. **Auto-deploy** → GitHub Actions handles the rest!

No more SSH, no more manual pulls, no more manual restarts! 🚀
