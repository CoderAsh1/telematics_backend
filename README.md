# telematics_backend
# Add TimescaleDB repo
curl -s https://packagecloud.io/install/repositories/timescale/timescaledb/script.deb.sh | sudo bash

# Install for Postgres 16 (or your version)
sudo apt install timescaledb-2-postgresql-16

# Tune the DB and restart
sudo timescaledb-tune --quiet --yes
sudo systemctl restart postgresql


# tunnel to connect db with local
ssh -L 5433:localhost:5432 root@YOUR_DB_DROPLET_IP