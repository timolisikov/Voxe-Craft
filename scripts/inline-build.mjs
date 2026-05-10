import { access, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const publicAssetsDir = fileURLToPath(new URL('../public/assets/', import.meta.url));
const rootIndexPath = fileURLToPath(new URL('../index.html', import.meta.url));
const indexPath = join(distDir, 'index.html');
const appPath = join(distDir, 'app.html');
const sourceHtmlPath = (await exists(appPath)) ? appPath : indexPath;
let html = await readFile(sourceHtmlPath, 'utf8');

const styled = await inlineStyles(html);
const withEmbeddedAssets = await inlineEmbeddedAssets(styled);
html = await moveAndInlineScripts(withEmbeddedAssets);

await writeFile(indexPath, html, 'utf8');
await writeFile(rootIndexPath, html, 'utf8');
if (sourceHtmlPath !== indexPath) {
  await unlink(sourceHtmlPath);
}
await removeInlinedBundles();

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function inlineStyles(source) {
  const linkPattern = /<link rel="stylesheet" crossorigin href="\.\/([^"]+)"\/?>/g;
  let result = source;
  const matches = [...source.matchAll(linkPattern)];

  for (const match of matches) {
    const cssPath = join(distDir, match[1]);
    const css = await readFile(cssPath, 'utf8');
    result = result.replace(match[0], () => `<style>\n${css}\n</style>`);
  }

  return result;
}

async function inlineEmbeddedAssets(source) {
  const assetPaths = [
    'textures/grass/color.jpg',
    'textures/dirt/color.jpg',
    'textures/sand/color.jpg',
    'textures/stone/color.jpg',
    'textures/log/color.jpg',
    'textures/leaves/color.jpg',
    'textures/planks/color.jpg'
  ];

  const assets = Object.fromEntries(
    await Promise.all(
      assetPaths.map(async (assetPath) => {
        const bytes = await readFile(join(publicAssetsDir, assetPath));
        return [assetPath, `data:${mimeType(assetPath)};base64,${bytes.toString('base64')}`];
      })
    )
  );
  const payload = JSON.stringify(assets).replace(/</g, '\\u003c');

  return source.replace(
    '</body>',
    () => `<script>\nwindow.__VOXEL_ASSETS__ = ${payload};\n</script>\n</body>`
  );
}

function mimeType(path) {
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (path.endsWith('.png')) {
    return 'image/png';
  }

  return 'application/octet-stream';
}

async function moveAndInlineScripts(source) {
  const scriptPattern =
    /<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g;
  let result = source;
  const matches = [...source.matchAll(scriptPattern)];
  const scripts = [];

  for (const match of matches) {
    const jsPath = join(distDir, match[1]);
    const js = await readFile(jsPath, 'utf8');
    scripts.push(`<script>\n${escapeInlineScript(js)}\n</script>`);
    result = result.replace(match[0], '');
  }

  if (scripts.length === 0) {
    return result;
  }

  return result.replace('</body>', () => `${scripts.join('\n')}\n  </body>`);
}

function escapeInlineScript(source) {
  return source.replace(/<\/script/gi, '<\\/script');
}

async function removeInlinedBundles() {
  const assetsDir = join(distDir, 'assets');
  const entries = await readdir(assetsDir, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && /^(app|index)-.*\.(css|js)$/.test(entry.name))
      .map((entry) => unlink(join(assetsDir, entry.name)))
  );
}
