#!/bin/bash
# Runs on the EC2 host via SSM. Isolated from Gardina: own container, own dirs, memory-capped.
set -euo pipefail
cd /tmp/tb

echo "== host"; uname -m; nproc; free -m | head -2; df -h / | tail -1
AVAIL=$(free -m | awk '/Mem:/{print $7}')
FREE_DISK=$(df -m / | awk 'NR==2{print $4}')
# The bot is capped at 800 MB; refuse to start it if that would squeeze the live Gardina containers.
[ "$AVAIL" -ge 900 ] || { echo "ABORT: only ${AVAIL} MB RAM available"; exit 1; }
[ "$FREE_DISK" -ge 3000 ] || { echo "ABORT: only ${FREE_DISK} MB disk free"; exit 1; }

install -d -m 700 /opt/threads-autopilot/config /opt/threads-autopilot/data
tar -xzf config.tar.gz -C /opt/threads-autopilot/config
chmod 600 /opt/threads-autopilot/config/*
rm -rf /opt/threads-autopilot/src
cp -r threads-autopilot /opt/threads-autopilot/src

echo "== build"
nice -n 10 docker build -t threads-autopilot:new /opt/threads-autopilot/src 2>&1 | tail -4
docker tag threads-autopilot:latest threads-autopilot:rollback 2>/dev/null || true
docker rm -f threads-autopilot 2>/dev/null || true
docker run -d --name threads-autopilot --restart always \
  --memory 800m --cpus 1 --shm-size 256m \
  -v /opt/threads-autopilot/config:/config:ro \
  -v /opt/threads-autopilot/data:/data \
  threads-autopilot:new
docker tag threads-autopilot:new threads-autopilot:latest

sleep 20
echo "== status"; docker ps --filter name=threads-autopilot --format '{{.Names}} {{.Status}}'
echo "== logs"; docker logs --tail 12 threads-autopilot 2>&1 | grep -viE 'token=|access_token'
docker image prune -f >/dev/null 2>&1 || true
rm -rf /tmp/tb
echo DEPLOY_OK
