/**
 * Konfigurasi Terpusat Endpoint Server API Mobile
 * 
 * CARA MENGUBAH URL KE VPS / DOMAIN PRODUKSI:
 * 1. Opsi A (Mudah): Cukup ubah nilai default di variabel DEFAULT_API_URL di bawah ini ke IP atau domain VPS Anda.
 *    Contoh: 'http://103.xxx.xxx.xxx:8080' atau 'https://api.namadomain.com'
 * 
 * 2. Opsi B (via .env): Tambahkan di file .env mobile:
 *    EXPO_PUBLIC_API_URL=http://IP_VPS:8080
 */

// Ganti IP ini saat deploy ke VPS (atau gunakan file .env)
export const DEFAULT_API_URL = 'http://192.168.1.2:8080';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

/**
 * Helper untuk menyusun URL endpoint API secara otomatis
 * Contoh: getApiUrl('/api/auth/login') -> 'http://IP_VPS:8080/api/auth/login'
 */
export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
