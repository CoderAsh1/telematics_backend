🛰️ Telematics Infrastructure Setup GuideSystems: Node.js (TCP/Socket) | PostgreSQL (TimescaleDB) | Nginx (Reverse Proxy)Target OS: Ubuntu 22.04 / 24.04 LTS1. Core Environment PreparationBefore installing specialized tools, ensure the OS is hardened and the runtime is stable.Bash# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS Version) via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for Process Management
sudo npm install pm2 -g
2. Database Layer: TimescaleDB OptimizationWe use TimescaleDB because standard Postgres struggles with millions of GPS points.A. InstallationBash# Add TimescaleDB repository
curl -s https://packagecloud.io/install/repositories/timescale/timescaledb/script.deb.sh | sudo bash

# Install Postgres + TimescaleDB (Check version, e.g., 16)
sudo apt install timescaledb-2-postgresql-16 -y
B. Tuning (Critical for Performance)TimescaleDB includes a tool to optimize your postgresql.conf based on your Droplet's RAM/CPU.Bashsudo timescaledb-tune --quiet --yes
sudo systemctl restart postgresql
C. Extension ActivationConnect to your database and enable the time-series engine:Bashsudo -u postgres psql
CREATE DATABASE telematics_prod;
\c telematics_prod
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
3. Application Layer: TCP & Socket EnginesThe architecture splits traffic into two lanes: Lane A (Raw TCP for devices) and Lane B (WebSockets for the dashboard).A. Directory StructureBashmkdir -p ~/app/telematics && cd ~/app/telematics
npm init -y
npm install pg dotenv socket.io net
B. Service Management (PM2)We run the services as background daemons to ensure they restart after a crash or server reboot.Bash# Start the TCP Listener (Port 4000) and API/Socket (Port 3000)
pm2 start server.js --name "telematics-engine"

# Ensure PM2 starts on boot
pm2 save
pm2 startup
4. Web Layer: Nginx & SSL TerminatorSince the Frontend is on HTTPS, we use Nginx to "terminate" the SSL and proxy the WebSocket traffic.A. Nginx ConfigurationCreate /etc/nginx/sites-available/tracker-config:Nginxserver {
    listen 80;
    server_name tracker.bdph.in;

    location / {
        proxy_pass http://localhost:3000; # Forward to Socket.io
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
B. Activate & SecureBash# Link and test
sudo ln -s /etc/nginx/sites-available/tracker-config /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Install SSL via Certbot (Snap version)
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d tracker.bdph.in
5. Security & Internal Firewall (UFW)We skip the Cloud Firewall here and focus on the Droplet's internal rules.Bashsudo ufw default deny incoming
sudo ufw default allow outgoing

sudo ufw allow ssh             # Port 22
sudo ufw allow 80/tcp          # HTTP (Certbot)
sudo ufw allow 443/tcp         # HTTPS/WSS
sudo ufw allow 4000/tcp        # Raw TCP (Trackers)
sudo ufw allow 5432/tcp        # Postgres (Restricted to Internal/VPN)

sudo ufw enable
6. Maintenance Commands for the Senior EngineerTaskCommandReal-time Logspm2 logsDB Performancepsql -c "SELECT * FROM timescaledb_information.hypertables;"Active Connections`netstat -tnpaSSL Renewal Testsudo certbot renew --dry-runRestart Apppm2 restart telematics-engine




# Add TimescaleDB repo
curl -s https://packagecloud.io/install/repositories/timescale/timescaledb/script.deb.sh | sudo bash

# Install for Postgres 16 (or your version)
sudo apt install timescaledb-2-postgresql-16

# Tune the DB and restart
sudo timescaledb-tune --quiet --yes
sudo systemctl restart postgresql


# tunnel to connect db with local
ssh -L 5433:localhost:5432 root@YOUR_DB_DROPLET_IP
