# Deployment Guide

The recommended way to run Modern Chord Charts on your local network is with Docker. The pre-built image is hosted on GitHub Container Registry (GHCR) — no need to clone the repo or build anything. Docker bundles everything (Node.js, the app, and SQLite) so there are no external dependencies.

## Quick Start

Pull and run the container in one command:

```bash
docker run -d \
  --name chord-charts \
  -p 3000:3000 \
  -v chord_data:/app/data \
  --restart unless-stopped \
  ghcr.io/jondan1986/modern-chord-charts:latest
```

Open [http://localhost:3000](http://localhost:3000) in your browser. That's it.

> **Important:** The `-p 3000:3000` flag is required — it maps the container's port to your machine. Without it, the app won't be accessible.

## Using Docker Compose

For easier management, create a file called `docker-compose.yml` anywhere on your machine:

```yaml
services:
  chord-charts:
    image: ghcr.io/jondan1986/modern-chord-charts:latest
    ports:
      - "3000:3000"
    volumes:
      - chord_data:/app/data
    restart: unless-stopped

volumes:
  chord_data:
```

Then run from the same directory:

```bash
docker compose up -d
```

> **Note:** `docker compose` looks for `docker-compose.yml` in your current directory. You can run from a different directory with `docker compose -f /path/to/docker-compose.yml up -d`.

To update to a new version:

```bash
docker compose pull
docker compose down && docker compose up -d
```

## Accessing from Other Devices on Your Network

Once the container is running, any device on your local network can access the app:

1. Find the host machine's local IP address:
   ```bash
   # Linux / macOS
   hostname -I

   # Windows (run in PowerShell or Command Prompt)
   ipconfig
   ```
   Look for an address like `192.168.x.x` or `10.0.x.x`.

2. From any phone, tablet, or laptop on the same Wi-Fi/network, open:
   ```
   http://<host-ip>:3000
   ```
   For example: `http://192.168.1.50:3000`

3. On mobile devices, tap the browser's **"Add to Home Screen"** option to install it as a PWA for a full-screen, app-like experience.

## Customizing the Port

To run on a different port (e.g., 8080), change the first number in the port mapping:

```bash
docker run -d -p 8080:3000 -v chord_data:/app/data ghcr.io/jondan1986/modern-chord-charts:latest
```

Then access the app at `http://localhost:8080`.

## Data Persistence

Song and setlist data is stored in a SQLite database inside the container. The `-v chord_data:/app/data` flag creates a Docker volume that persists your data across container restarts, stops, and upgrades.

**Back up your data:**

```bash
docker cp chord-charts:/app/data/songs.db ./songs-backup.db
```

**Restore from a backup:**

```bash
docker cp ./songs-backup.db chord-charts:/app/data/songs.db
docker restart chord-charts
```

## Raspberry Pi Deployment

The Docker image supports both x86_64 and ARM64 architectures, so the same image works on a Raspberry Pi with no extra steps.

**Supported models:** Raspberry Pi 3B+, 4, 5, Zero 2 W (any ARM64-capable Pi). **64-bit Raspberry Pi OS (Bookworm or later) is required** — 32-bit is not supported.

### Installing Docker on the Pi

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect.

### Quick Start

Run the same command as on x86 — Docker automatically pulls the ARM64 variant:

```bash
docker run -d \
  --name chord-charts \
  -p 3000:3000 \
  -v chord_data:/app/data \
  --restart unless-stopped \
  ghcr.io/jondan1986/modern-chord-charts:latest
```

### Docker Compose on Pi

Create a `docker-compose.yml` file:

```yaml
services:
  chord-charts:
    image: ghcr.io/jondan1986/modern-chord-charts:latest
    ports:
      - "3000:3000"
    volumes:
      - chord_data:/app/data
    restart: unless-stopped

volumes:
  chord_data:
```

```bash
docker compose up -d
```

### Auto-Start on Boot

The `--restart unless-stopped` flag ensures the container restarts automatically. Just make sure the Docker daemon starts on boot:

```bash
sudo systemctl enable docker
```

### Accessing from the Network

Find the Pi's IP address:

```bash
hostname -I
```

Then open `http://<pi-ip>:3000` from any device on the same network.

> **Headless setup:** The Pi doesn't need a monitor or keyboard. Run it headless and access the app from your phone, tablet, or laptop over the network.

### Performance Notes

- **Pi 4 (4GB+) or Pi 5** — Recommended. Runs smoothly.
- **Pi 3B+ / Zero 2 W** — Works, but expect slower page loads.
- First startup takes a few extra seconds while the database is seeded with the included sample songs.
