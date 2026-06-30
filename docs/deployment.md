# Panduan Deploy & CI/CD Nicord ke VPS

Dokumen ini menjelaskan cara setup VPS dan GitHub Actions agar setiap kali kamu melakukan `git push origin main`, aplikasi akan otomatis ter-deploy ke VPS secara aman dengan database **Neon.tech**.

---

## 1. Persiapan VPS (Contabo Linux)

Hubungkan ke VPS kamu dan jalankan setup berikut:

### A. Install Docker & Docker Compose
Jika belum terinstall, pasang Docker di VPS:
```bash
# Update package
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verifikasi
docker --version
docker compose version
```

### B. Buat Folder Aplikasi
Buat direktori `/opt/nicord` untuk menampung konfigurasi compose dan environment:
```bash
sudo mkdir -p /opt/nicord
sudo chown -R $USER:$USER /opt/nicord
cd /opt/nicord
```

### C. Copy File `docker-compose.yml`
Copy file `docker-compose.yml` dari repository ini ke `/opt/nicord/docker-compose.yml` di VPS.

### D. Setup Environment Variables (`.env`)
Buat file `/opt/nicord/.env` di VPS (Jangan pernah commit file ini ke Git!):
```env
DATABASE_URL=postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=pilih-secret-random-panjang-untuk-auth
NEXTAUTH_URL=http://IP_VPS_KAMU:3000
NEXT_PUBLIC_APP_URL=http://IP_VPS_KAMU:3000
LOW_STOCK_THRESHOLD=5
```

---

## 2. Setup GitHub Repository Secrets

Agar GitHub Actions bisa melakukan build dan push Docker image serta SSH ke VPS, kamu perlu mendaftarkan secrets berikut di repository GitHub kamu:

1. Buka repository kamu di GitHub.
2. Masuk ke **Settings** → **Secrets and variables** → **Actions**.
3. Tambahkan **Repository Secrets** berikut:

| Nama Secret | Nilai / Value |
|-------------|---------------|
| `VPS_HOST` | IP Publik VPS kamu (misal: `123.45.67.89`) atau IP Tailscale (`100.111.134.117`) jika SSH port hanya dibuka lewat Tailscale* |
| `VPS_USER` | Username SSH untuk masuk ke VPS (misal: `root` atau `hafid`) |
| `VPS_SSH_KEY` | **Private Key** SSH kamu (isi dari file `~/.ssh/id_ed25519` atau `id_rsa` di laptop kamu yang sudah di-authorize di VPS) |

> [!NOTE]  
> *Jika menggunakan IP Tailscale (`100.111.134.117`), GitHub Actions secara default tidak bisa mengaksesnya karena berada di jaringan private. Agar GitHub Actions bisa masuk ke Tailscale, kita harus menambahkan step Tailscale Action di `deploy.yml`.

---

## 3. Menyesuaikan Workflow `.github/workflows/deploy.yml`

Untuk mendukung deploy lewat Tailscale private network (karena VPS dihubungkan via Tailscale), kita bisa menambahkan step Tailscale di `.github/workflows/deploy.yml` menggunakan **Tailscale Auth Key**.

Jika SSH port 22 di VPS dibuka untuk publik, workflow `deploy.yml` yang sekarang sudah bisa langsung dipakai tanpa modifikasi (cukup set `VPS_HOST` ke IP publik VPS).

### Jika SSH port ditutup untuk publik (Hanya via Tailscale):
1. Buat **Auth Key** di [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys).
2. Daftarkan di GitHub Secrets dengan nama `TAILSCALE_AUTH_KEY`.
3. Update `.github/workflows/deploy.yml` untuk menghubungkan runner ke Tailnet sebelum step deploy SSH:

```yaml
      - name: Connect to Tailscale
        uses: tailscale/github-action@v2
        with:
          oauth-client-id: ${{ secrets.TS_API_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_API_CLIENT_SECRET }}
          tags: tag:ci
```

---

## 4. Cara Update Aplikasi

Setelah setup di atas selesai:
1. Lakukan coding/bugfix di local.
2. Push ke branch development untuk pengujian: `git push origin develop`.
3. Jika sudah stabil, merge ke branch `main`:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```
4. GitHub Actions akan otomatis mendeteksi push ke `main`, memulai build Docker image, menyimpannya di GHCR (GitHub Container Registry), dan memerintahkan VPS untuk me-restart kontainer dengan versi terbaru (Zero-downtime deploy).
