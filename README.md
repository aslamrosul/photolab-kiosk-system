# PhotoLab Kiosk System

Sistem photo kiosk lengkap dengan aplikasi Electron untuk kiosk dan dashboard Next.js untuk management. Solusi all-in-one untuk bisnis photo booth retail.

## 🚀 Fitur Utama

### Kiosk Client (Electron)
- 📸 Capture foto dengan kamera real-time
- 🎨 Filter dan frame foto (termasuk GIF animation)
- 📦 Pemilihan paket cetak (berbagai ukuran)
- 💳 Integrasi payment gateway Midtrans
- 📱 QR Code untuk download foto digital
- 🖥️ Mode kiosk fullscreen untuk penggunaan publik

### Dashboard Management (Next.js)
- 🏢 Manajemen multi-cabang
- 🖼️ Manajemen frame & kategori frame
- 📦 Manajemen paket cetak & harga
- 🎟️ Sistem voucher & diskon
- 🖼️ Galeri foto pelanggan
- 💰 Tracking transaksi & pembayaran
- 📊 Statistik penjualan dengan grafik
- ⚙️ Konfigurasi kiosk per cabang
- 👥 Multi-role user management

## 🛠️ Tech Stack

### Kiosk Client
- **Framework:** Electron + React 19
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **Routing:** React Router DOM
- **Backend:** Supabase
- **Libraries:** 
  - `gifshot` - GIF creation
  - `qrcode.react` - QR code generation
  - `lucide-react` - Icons

### Dashboard
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase
- **Payment:** Midtrans Client
- **Charts:** Recharts
- **Animation:** GSAP
- **Icons:** Lucide React

## 📁 Struktur Project

```
photolab-kiosk-system/
├── photolab-client/          # Electron Kiosk Application
│   ├── electron/             # Electron main & preload scripts
│   ├── src/
│   │   ├── screens/          # Screen components (Idle, Camera, Filter, etc.)
│   │   └── lib/              # Supabase config & context
│   └── package.json
│
└── photolab-dashboard/       # Next.js Admin Dashboard
    ├── src/
    │   ├── app/              # App router pages
    │   │   ├── dashboard/    # Overview & statistics
    │   │   ├── kiosk/        # Kiosk management
    │   │   ├── frames/       # Frame management
    │   │   ├── packages/     # Package management
    │   │   ├── transaction/  # Transaction history
    │   │   └── api/          # API routes (payment)
    │   ├── components/       # Reusable components
    │   └── lib/              # Supabase & auth config
    └── package.json
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Supabase account
- Midtrans account (untuk payment gateway)

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/aslamrosul/photolab-kiosk-system.git
cd photolab-kiosk-system
```

#### 2. Setup Kiosk Client
```bash
cd photolab-client
npm install
```

Buat file `.env` di `photolab-client/`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 3. Setup Dashboard
```bash
cd ../photolab-dashboard
npm install
```

Buat file `.env.local` di `photolab-dashboard/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

#### 4. Setup Database
Jalankan migration SQL yang ada di `photolab-dashboard/`:
- `schema.sql` - Database schema
- `migration.sql` - Data migration
- `migration-orientation.sql` - Orientation feature

### Running Development

#### Kiosk Client
```bash
cd photolab-client
npm run dev
```

#### Dashboard
```bash
cd photolab-dashboard
npm run dev
```
Dashboard akan berjalan di `http://localhost:3000`

### Building for Production

#### Kiosk Client (Electron)
```bash
cd photolab-client
npm run build
```
Executable akan tersedia di folder `dist/`

#### Dashboard
```bash
cd photolab-dashboard
npm run build
npm start
```

## 🌐 Deploy Dashboard ke Vercel

### Cara 1: Deploy via Vercel Dashboard (Recommended)

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import ke Vercel**
   - Buka [vercel.com](https://vercel.com)
   - Login dengan GitHub
   - Click "Add New Project"
   - Import repository Anda
   - Vercel akan auto-detect Next.js

3. **Configure Project**
   - **Root Directory:** Pilih `photolab-dashboard`
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

4. **Environment Variables**
   Tambahkan di Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   ```

5. **Deploy**
   - Click "Deploy"
   - Tunggu build selesai (~2-3 menit)
   - Dashboard live di `https://your-project.vercel.app`

### Cara 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd photolab-dashboard
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy? `Y`
   - Which scope? Pilih account Anda
   - Link to existing project? `N`
   - Project name? `photolab-dashboard`
   - Directory? `./` (sudah di folder photolab-dashboard)
   - Override settings? `N`

5. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add MIDTRANS_SERVER_KEY
   vercel env add MIDTRANS_CLIENT_KEY
   ```

6. **Deploy Production**
   ```bash
   vercel --prod
   ```

### Auto-Deploy Setup

Setelah deploy pertama, setiap push ke branch `main` akan otomatis trigger deployment baru di Vercel.

### Vercel Configuration (Optional)

Buat file `vercel.json` di `photolab-dashboard/` untuk custom config:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

### Tips Deployment

- ✅ Pastikan semua environment variables sudah diset
- ✅ Test build lokal dulu: `npm run build`
- ✅ Gunakan region Singapore (`sin1`) untuk performa optimal di Indonesia
- ✅ Enable automatic deployments untuk CI/CD
- ✅ Setup custom domain di Vercel dashboard (optional)

## 📸 Screenshots

[Tambahkan screenshots aplikasi di sini]

## 🔐 Database Schema

Database menggunakan Supabase PostgreSQL dengan tabel utama:
- `kiosks` - Data kiosk per cabang
- `branches` - Data cabang
- `frames` - Frame foto
- `frame_categories` - Kategori frame
- `packages` - Paket cetak
- `transactions` - Transaksi pelanggan
- `vouchers` - Voucher diskon
- `users` - User management

## 🤝 Contributing

Contributions, issues, dan feature requests sangat diterima!

## 📝 License

[Pilih license yang sesuai]

## 👨‍💻 Author

**Your Name**
- GitHub: [@aslamrosul](https://github.com/aslamrosul)

## 🙏 Acknowledgments

- Supabase untuk backend & database
- Midtrans untuk payment gateway
- Electron untuk desktop application framework
