import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GAME_CATALOG } from '../lib/games';

async function downloadFile(url: string, destPath: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!res.ok) {
      console.warn(`[POSTER WARNING] Failed to download from ${url}: HTTP ${res.status}`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(destPath, buffer);
    console.log(`✓ Đã tải poster: ${path.basename(destPath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err) {
    console.warn(`[POSTER ERROR] Lỗi tải từ ${url}:`, err);
    return false;
  }
}

export async function fetchAllPosters() {
  const publicDir = path.join(process.cwd(), 'public', 'games');
  await mkdir(publicDir, { recursive: true });
  console.log(`[POSTER] Tải poster 5 tựa game chuẩn vào ${publicDir}...`);

  for (const game of GAME_CATALOG) {
    const destFile = path.join(publicDir, path.basename(game.localPoster));
    console.log(`-> Đang tải ${game.name}...`);
    const success = await downloadFile(game.posterUrl, destFile);
    if (!success && game.steamAppId) {
      // Fallback to Steam header image
      const fallbackUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`;
      console.log(`   Thử URL dự phòng Steam: ${fallbackUrl}`);
      await downloadFile(fallbackUrl, destFile);
    }
  }
  console.log('[POSTER] Hoàn tất nạp hình ảnh game!\n');
}

if (process.argv[1]?.endsWith('fetch-game-posters.ts')) {
  fetchAllPosters().catch(console.error);
}
