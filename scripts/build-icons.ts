/**
 * Genera los PNG derivados de la marca a partir del SVG oficial,
 * sustituyendo currentColor por #FA05A0 (Safari/Windows/correo no
 * aceptan currentColor). No se versionan a mano: siempre salen de aquí.
 *
 *   npm run icons
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const ACCENT = '#FA05A0';
const BG = '#0A0A0A';
const BRAND_DIR = path.resolve('public/brand');

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

async function main(): Promise<void> {
  const svgSource = await readFile(path.join(BRAND_DIR, 'grabber-mark.svg'), 'utf8');
  const pink = Buffer.from(svgSource.replace(/currentColor/g, ACCENT));

  // favicon: fill rosa explícito (currentColor se pinta NEGRO sin contexto) +
  // viewBox recortado al glifo para que llene la pestaña (el original tiene
  // mucho margen y se veía diminuto).
  const faviconSvg = svgSource
    .replace(/currentColor/g, ACCENT)
    .replace(/viewBox="0 0 1254 1254"/, 'viewBox="250 232 756 756"');
  await writeFile(path.join(BRAND_DIR, 'favicon.svg'), faviconSvg, 'utf8');
  const faviconPink = Buffer.from(faviconSvg);

  // raster con fondo configurable (transparente por defecto → la marca rosa
  // se ve limpia en la pestaña, no un cuadrado negro).
  // OJO: se rasteriza desde el SVG RECORTADO (faviconPink, viewBox al glifo).
  // El grabber-mark.svg original tiene ~40% de margen vacío: usarlo hacía que
  // el logo saliera diminuto en la app instalada y en la pantalla de la PWA.
  const raster = async (size: number, scale = 1, bg: string | typeof TRANSPARENT = TRANSPARENT) => {
    const inner = Math.round(size * scale);
    const icon = await sharp(faviconPink).resize(inner, inner).png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: icon, gravity: 'center' }])
      .png()
      .toBuffer();
  };

  // PWA: fondo oscuro sólido (así se ve bien instalada en pantalla de inicio).
  // El glifo llena el 80% del icono: menos que eso se ve perdido en la pantalla
  // de inicio y en la ventana de instalación.
  // Los nombres llevan sufijo de versión (-v2) A PROPÓSITO: Chrome/Android
  // cachea los iconos de la PWA y NO los refresca aunque cambie el archivo;
  // cambiando la URL se fuerza a que tome el nuevo (mismo truco que Hibi).
  // Proporciones equilibradas: al 43% se veía diminuto y al 80% agobiado.
  const ANY = 0.68; // icono normal (contenedor cuadrado/redondeado)
  const MASK = 0.6; // maskable: el sistema recorta a círculo → más aire
  const APPLE = 0.66;
  await writeFile(path.join(BRAND_DIR, 'icon-192-v3.png'), await raster(192, ANY, BG));
  await writeFile(path.join(BRAND_DIR, 'icon-512-v3.png'), await raster(512, ANY, BG));
  await writeFile(path.join(BRAND_DIR, 'icon-maskable-512-v3.png'), await raster(512, MASK, BG));
  await writeFile(path.join(BRAND_DIR, 'apple-touch-icon-v3.png'), await raster(180, APPLE, BG));
  // se mantienen los nombres antiguos para no romper enlaces existentes
  await writeFile(path.join(BRAND_DIR, 'icon-192.png'), await raster(192, ANY, BG));
  await writeFile(path.join(BRAND_DIR, 'icon-512.png'), await raster(512, ANY, BG));
  await writeFile(path.join(BRAND_DIR, 'icon-maskable-512.png'), await raster(512, MASK, BG));
  await writeFile(path.join(BRAND_DIR, 'apple-touch-icon.png'), await raster(180, APPLE, BG));
  // favicon: transparente, glifo recortado que llena todo el cuadro
  const rasterFav = async (size: number) => {
    const icon = await sharp(faviconPink).resize(size, size).png().toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: TRANSPARENT } })
      .composite([{ input: icon, gravity: 'center' }])
      .png()
      .toBuffer();
  };
  const png32 = await rasterFav(32);
  await writeFile(path.join(BRAND_DIR, 'favicon-32.png'), png32);
  const png16 = await rasterFav(16);
  await writeFile(path.join(BRAND_DIR, 'favicon.ico'), await pngToIco([png16, png32]));
  // correo: fondo oscuro (clientes de correo no renderizan transparencia fiable)
  await writeFile(path.join(BRAND_DIR, 'email-48.png'), await raster(48, 0.8, BG));

  console.log('Iconos generados en public/brand/ (favicon.svg rosa + PNG transparentes)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
