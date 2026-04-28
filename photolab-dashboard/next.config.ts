/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      // Kalau nanti mau pakai gambar dari Supabase Storage, tambahkan juga di sini:
      {
        protocol: 'https',
        hostname: 'tukwbzgpkbzozchaqrcz.supabase.co', // Sesuai dengan yang ada di error log kamu
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;