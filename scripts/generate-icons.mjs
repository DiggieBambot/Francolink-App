import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', 'public');
const iconSrc = join(root, 'logo-icon.png');

async function main() {
  // First, get the dimensions and auto-crop whitespace
  const meta = await sharp(iconSrc).metadata();
  console.log(`Source icon: ${meta.width}x${meta.height}`);

  // Trim whitespace, then get the trimmed image as a buffer
  const trimmed = await sharp(iconSrc)
    .trim()
    .toBuffer();

  const trimMeta = await sharp(trimmed).metadata();
  console.log(`After trim: ${trimMeta.width}x${trimMeta.height}`);

  // Make it square by extending the shorter side
  const maxDim = Math.max(trimMeta.width, trimMeta.height);
  const padded = await sharp(trimmed)
    .resize(maxDim, maxDim, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();

  // Generate PWA / app icons
  const iconSizes = [
    { path: 'icons/icon-144.png', size: 144 },
    { path: 'icons/icon-192.png', size: 192 },
    { path: 'icons/icon-384.png', size: 384 },
    { path: 'icons/icon-512.png', size: 512 },
  ];

  for (const { path, size } of iconSizes) {
    await sharp(padded)
      .resize(size, size)
      .png()
      .toFile(join(root, path));
    console.log(`  ✓ ${path} (${size}x${size})`);
  }

  // Apple touch icon (180x180)
  await sharp(padded)
    .resize(180, 180)
    .png()
    .toFile(join(root, 'apple-touch-icon.png'));
  console.log('  ✓ apple-touch-icon.png (180x180)');

  // Favicons
  await sharp(padded)
    .resize(32, 32)
    .png()
    .toFile(join(root, 'favicon-32x32.png'));
  console.log('  ✓ favicon-32x32.png');

  await sharp(padded)
    .resize(16, 16)
    .png()
    .toFile(join(root, 'favicon-16x16.png'));
  console.log('  ✓ favicon-16x16.png');

  // favicon.ico — use 32x32 png as ico (browsers accept png favicons)
  await sharp(padded)
    .resize(48, 48)
    .png()
    .toFile(join(root, 'favicon.ico'));
  console.log('  ✓ favicon.ico (48x48 png)');

  // Replace old logo.png with the wordmark (cropped to content)
  const wordmarkSrc = join(root, 'logo-wordmark.png');
  const wordmarkTrimmed = await sharp(wordmarkSrc)
    .trim()
    .toBuffer();
  const wmMeta = await sharp(wordmarkTrimmed).metadata();
  console.log(`\nWordmark after trim: ${wmMeta.width}x${wmMeta.height}`);

  // Save as the main logo
  await sharp(wordmarkTrimmed)
    .png()
    .toFile(join(root, 'logo.png'));
  console.log('  ✓ logo.png (wordmark, trimmed)');

  console.log('\nAll icons generated!');
}

main().catch(console.error);
