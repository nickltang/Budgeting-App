# Deploying Backend to AWS EC2

## Cost-Effective Deployment Strategy

### Recommended: Hybrid Approach
- **Frontend**: Deploy to Netlify (free tier or $19/month for Pro)
- **Backend**: Deploy to EC2 (much cheaper than full stack on EC2)

### EC2 Cost-Effective Options

#### Option 1: EC2 t4g.nano (ARM-based, cheapest)
- **Instance**: `t4g.nano` (2 vCPU, 0.5 GB RAM)
- **Cost**: ~$3.50/month (~$0.0048/hour)
- **OS**: Amazon Linux 2023 (ARM)
- **Storage**: 8 GB gp3 EBS (~$0.80/month)
- **Total**: ~$4.30/month
- **Pros**: Cheapest option, sufficient for small-medium traffic
- **Cons**: Limited RAM (0.5GB), may need optimization

#### Option 2: EC2 t3.micro (x86, free tier eligible)
- **Instance**: `t3.micro` (2 vCPU, 1 GB RAM)
- **Cost**: FREE for first 12 months (free tier), then ~$8.50/month (~$0.0116/hour)
- **OS**: Amazon Linux 2023 or Ubuntu 22.04
- **Storage**: 30 GB included in free tier
- **Total**: $0/month (first year), then ~$8.50/month
- **Pros**: More RAM, x86 compatible, free tier available
- **Cons**: Only free for 12 months if new AWS account

#### Option 3: EC2 t4g.micro (ARM-based, more RAM)
- **Instance**: `t4g.micro` (2 vCPU, 1 GB RAM)
- **Cost**: ~$7/month (~$0.0096/hour)
- **OS**: Amazon Linux 2023 (ARM)
- **Storage**: 8 GB gp3 EBS (~$0.80/month)
- **Total**: ~$7.80/month
- **Pros**: Better performance than nano, still cheap
- **Cons**: ARM architecture (need to compile Go for ARM)

#### Option 4: AWS Lightsail (Simpler, predictable pricing)
- **Instance**: 512 MB RAM, 1 vCPU
- **Cost**: $3.50/month (includes 20 GB SSD, 1 TB transfer)
- **Pros**: Fixed pricing, simpler management, includes domain/static IP
- **Cons**: Less flexible than EC2

### Cost Comparison Summary

| Option | Monthly Cost | Notes |
|-------|--------------|-------|
| t4g.nano | ~$4.30 | Cheapest, 0.5GB RAM |
| t3.micro | $0 (first year) / $8.50 | Free tier eligible, 1GB RAM |
| t4g.micro | ~$7.80 | Good balance, 1GB RAM |
| Lightsail | $3.50 | Simplest, predictable pricing |

**Recommendation**: Start with **t3.micro** (free tier) or **Lightsail** ($3.50/month) for simplicity.

---

## Step-by-Step EC2 Deployment

### Prerequisites
- AWS account
- AWS CLI installed (optional, can use AWS Console)
- SSH key pair

### Step 1: Launch EC2 Instance

#### Via AWS Console:
1. Go to **EC2 Dashboard** → **Launch Instance**
2. **Name**: `household-budget-backend`
3. **AMI**: 
   - For x86: `Amazon Linux 2023 AMI`
   - For ARM: `Amazon Linux 2023 AMI (ARM64)`
4. **Instance Type**: 
   - `t3.micro` (free tier, x86)
   - `t4g.nano` (cheapest, ARM)
5. **Key Pair**: Create new or select existing (download `.pem` file)
6. **Network Settings**: 
   - Allow HTTP (port 80)
   - Allow HTTPS (port 443)
   - Allow Custom TCP (port 8000) from your IP or 0.0.0.0/0 (less secure)
7. **Storage**: 8 GB gp3 (or 30 GB if using free tier)
8. Click **Launch Instance**

### Step 2: Connect to Instance

```bash
# Replace with your instance details
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 3: Install Go

```bash
# On Amazon Linux 2023
sudo dnf update -y
sudo dnf install -y golang git

# Verify installation
go version
```

### Step 4: Clone and Build Your App

```bash
# Create app directory
mkdir -p ~/app
cd ~/app

# Option A: Clone from GitHub (if your repo is public)
git clone https://github.com/your-username/Budgeting-App.git
cd Budgeting-App/backend

# Option B: Upload files manually using SCP
# From your local machine:
# scp -i your-key.pem -r backend/* ec2-user@your-ec2-ip:~/app/backend/

# Build the application
go mod download
go build -o server main.go

# Test it runs
./server
# Should see: "Listening on :8000"
```

### Step 5: Set Up Systemd Service (Auto-start on boot)

Create service file:
```bash
sudo nano /etc/systemd/system/household-budget.service
```

Add this content:
```ini
[Unit]
Description=Household Budget Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/app/backend
ExecStart=/home/ec2-user/app/backend/server
Restart=always
RestartSec=10
Environment="PORT=8000"

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable household-budget
sudo systemctl start household-budget
sudo systemctl status household-budget
```

### Step 6: Set Up Nginx Reverse Proxy (Recommended)

Install Nginx:
```bash
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Configure Nginx:
```bash
sudo nano /etc/nginx/conf.d/household-budget.conf
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 public IP

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Test and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Set Up HTTPS with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

### Step 8: Configure Security Group

1. Go to **EC2 → Security Groups**
2. Select your instance's security group
3. **Inbound Rules**:
   - HTTP (port 80) from 0.0.0.0/0
   - HTTPS (port 443) from 0.0.0.0/0
   - SSH (port 22) from your IP only

### Step 9: Update Frontend to Use New Backend URL

Update Netlify environment variable:
- `VITE_API_URL` = `http://your-ec2-ip` or `https://your-domain.com`

---

## Alternative: AWS Lightsail Deployment (Simpler)

Lightsail is AWS's simplified VPS service with fixed pricing.

### Step 1: Create Lightsail Instance
1. Go to **AWS Lightsail** → **Create Instance**
2. **Platform**: Linux/Unix
3. **Blueprint**: Node.js (we'll install Go manually) or OS Only
4. **Instance Plan**: $3.50/month (512 MB, 1 vCPU)
5. Click **Create Instance**

### Step 2: Connect and Deploy
```bash
# Connect via Lightsail console or SSH
# Install Go
sudo apt-get update
sudo apt-get install -y golang-go git

# Deploy (same steps as EC2)
mkdir -p ~/app/backend
# Upload your backend code
cd ~/app/backend
go build -o server main.go

# Create systemd service (same as EC2)
# Set up Nginx (same as EC2)
```

### Step 3: Static IP (Included)
- Lightsail automatically assigns static IP
- Use this IP in your frontend `VITE_API_URL`

---

## Cost Optimization Tips

1. **Use Reserved Instances** (if committing for 1-3 years):
   - Save up to 72% on compute costs
   - Good for: Long-term deployments

2. **Use Spot Instances** (for non-critical workloads):
   - Can save up to 90%
   - Risk: Instance can be terminated
   - Not recommended for production backends

3. **Use Auto Scaling** (only if needed):
   - Scale down during low traffic
   - Add CloudWatch alarms

4. **Monitor with CloudWatch**:
   - Free tier: 10 metrics, 1 million API requests
   - Track CPU, memory, network usage

5. **Use Elastic IP** (free if attached to running instance):
   - Static IP address
   - Free if instance is running

---

## Estimated Monthly Costs (Backend Only)

### Minimal Setup (t4g.nano + 8GB storage):
- EC2: $3.50
- EBS: $0.80
- Data Transfer (first 1GB free): ~$0
- **Total: ~$4.30/month**

### Standard Setup (t3.micro + 30GB storage):
- EC2: $8.50 (or $0 first year on free tier)
- EBS: Included in free tier
- **Total: $0/month (year 1) or $8.50/month**

### With Lightsail:
- **Total: $3.50/month** (everything included)

---

## Next Steps After Deployment

1. **Set up monitoring**:
   ```bash
   # Install CloudWatch agent (optional)
   # Monitor logs: tail -f /var/log/your-app.log
   ```

2. **Set up automated backups**:
   - EBS snapshots (cheap, automated)

3. **Set up domain** (optional):
   - Route 53: ~$0.50/month per hosted zone
   - Or use free DNS services (Cloudflare)

4. **Set up CI/CD** (optional):
   - GitHub Actions to deploy on push
   - Or simple script to rsync code

---

## Quick Deploy Script

Save this as `deploy.sh` on your EC2 instance:

```bash
#!/bin/bash
cd ~/app/backend
git pull origin main  # if using git
go build -o server main.go
sudo systemctl restart household-budget
echo "Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
```

---

## Troubleshooting

**Server won't start:**
```bash
sudo systemctl status household-budget
sudo journalctl -u household-budget -f
```

**Port 8000 not accessible:**
- Check security group rules
- Check if nginx is running
- Check firewall: `sudo firewall-cmd --list-all`

**Out of memory:**
- Consider upgrading to t3.micro or t4g.micro
- Optimize Go binary (reduce allocations)

**Need to update code:**
```bash
cd ~/app/backend
git pull  # or scp new files
go build -o server main.go
sudo systemctl restart household-budget
```

