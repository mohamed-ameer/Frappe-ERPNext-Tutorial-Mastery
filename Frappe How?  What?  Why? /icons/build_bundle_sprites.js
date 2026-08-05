// NPM INSTALL: you must install the following icon packages in your app directory to generate the sprite files. You can add more icon packages to the list below if you want to include them in your app. After installing, run this script to generate one sprite per package in your app's public/icons directory.
// npm install @fortawesome/fontawesome-free lucide-static heroicons bootstrap-icons remixicon @tabler/icons @material-design-icons/svg @phosphor-icons/core @primer/octicons lineicons feather-icons ionicons weather-icons simple-icons flag-icons payment-icons boxicons @carbon/icons iconoir @iconscout/unicons @fluentui/svg-icons cryptocurrency-icons healthicons grommet-icons eva-icons line-awesome @iconify/json academicons devicon maki undraw-svg css.gg pixelarticons @vscode/codicons
// npm install svgo --save-dev  (needed to keep sprites small; a global install won't be picked up by `require`)

const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

const appName = 'your_app'; // Change to your app directory name
const outputDir = path.join(__dirname, appName, 'public/icons');
const nodeModulesDir = path.join(__dirname, 'node_modules');
const iconifyDir = path.join(nodeModulesDir, '@iconify/json/json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Recursive directory walker
function getSvgFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getSvgFiles(filePath));
    } else if (file.endsWith('.svg')) {
      results.push(filePath);
    }
  });
  return results;
}

// Runs a raw SVG document through SVGO (rounds/simplifies path data, strips metadata,
// editor cruft, default attrs, etc.) before it gets wrapped into a <symbol>.
// viewBox and IDs are preserved since symbols are addressed by id and sized via viewBox.
function optimizeSvg(rawSvg) {
  try {
    const result = optimize(rawSvg, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            // cleanupIds is disabled because it renames ids to short, collision-prone
            // strings (e.g. "a", "b") — unsafe once thousands of icons share one document.
            overrides: {
              cleanupIds: false,
            },
          },
        },
      ],
    });
    return result.data;
  } catch (err) {
    return rawSvg;
  }
}

// Safely converts a raw SVG string into a Frappe <symbol> tag
function convertToSymbol(rawSvg, symbolId) {
  const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  const innerContent = rawSvg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>[\s\S]*$/i, '')
    .trim();

  return `  <symbol id="${symbolId}" viewBox="${viewBox}">\n    ${innerContent}\n  </symbol>`;
}

// Strips comments and collapses whitespace so the bundled sprite ships as few bytes as possible
function minifySvgContent(content) {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function writeSprite(filename, symbolTags, { minify = false } = {}) {
  if (symbolTags.length === 0) return;

  let content = `<svg id="frappe-symbols" aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" xmlns="http://www.w3.org/2000/svg">\n${symbolTags.join('\n')}\n</svg>`;
  if (minify) content = minifySvgContent(content);

  fs.writeFileSync(path.join(outputDir, filename), content, 'utf8');

  const sizeKb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`✅ Generated ${filename} (${symbolTags.length} icons, ${sizeKb} KB)`);
}

// Builds symbol tags for one node_modules icon package and writes its individual sprite file.
// idFrom: 'basename' uses just the file name, 'path' joins the relative sub-folders too
// (e.g. heroicons' 24/outline/user.svg -> icon-hero-24-outline-user).
function buildSpriteFromDir({ dir, prefix, output, recursive = false, idFrom = 'basename', transform = (name) => name }) {
  const sourceDir = path.join(nodeModulesDir, dir);
  if (!fs.existsSync(sourceDir)) return [];

  const files = recursive
    ? getSvgFiles(sourceDir)
    : fs.readdirSync(sourceDir).filter((f) => f.endsWith('.svg')).map((f) => path.join(sourceDir, f));

  const symbols = files.map((filePath) => {
    const raw = optimizeSvg(fs.readFileSync(filePath, 'utf8'));
    const relative = path.relative(sourceDir, filePath).replace(/\\/g, '/').replace(/\.svg$/, '');
    const name = idFrom === 'path' ? relative.split('/').join('-') : path.basename(relative);
    return convertToSymbol(raw, `icon-${prefix}-${transform(name)}`);
  });

  writeSprite(output, symbols);
  return symbols;
}

// Extracts icons from an Iconify JSON icon set (e.g. @iconify/json/json/carbon.json)
function buildIconifySprite(setName) {
  const jsonPath = path.join(iconifyDir, `${setName}.json`);
  if (!fs.existsSync(jsonPath)) return [];

  const iconSet = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const defaultWidth = iconSet.width || 24;
  const defaultHeight = iconSet.height || 24;

  const symbols = Object.entries(iconSet.icons).map(([iconName, iconData]) => {
    const w = iconData.width || defaultWidth;
    const h = iconData.height || defaultHeight;
    const raw = optimizeSvg(`<svg viewBox="0 0 ${w} ${h}">${iconData.body}</svg>`);
    return convertToSymbol(raw, `icon-${setName}-${iconName}`);
  });

  writeSprite(`${setName}-iconify.svg`, symbols);
  return symbols;
}

// -------------------------------------------------------------
// Icon package -> sprite configuration
// -------------------------------------------------------------
const sources = [
  { dir: 'lucide-static/icons', prefix: 'lucide', output: 'lucide-icons.svg' },
  { dir: '@fortawesome/fontawesome-free/svgs', prefix: 'fa', output: 'fontawsome-icons.svg', recursive: true, idFrom: 'path' },
  { dir: 'heroicons', prefix: 'hero', output: 'heroicons.svg', recursive: true, idFrom: 'path' },
  { dir: 'bootstrap-icons/icons', prefix: 'bs', output: 'bootstrap-icons.svg' },
  { dir: 'remixicon/icons', prefix: 'ri', output: 'remixicons.svg', recursive: true },
  { dir: '@tabler/icons/icons', prefix: 'tabler', output: 'tabler-icons.svg', recursive: true },
  { dir: '@material-design-icons/svg', prefix: 'ms', output: 'material-symbols.svg', recursive: true, idFrom: 'path', transform: (s) => s.replace(/_/g, '-') },
  { dir: '@phosphor-icons/core/assets', prefix: 'ph', output: 'phosphor-icons.svg', recursive: true },
  { dir: '@primer/octicons/build/svg', prefix: 'octicon', output: 'octicons.svg' },
  { dir: 'simple-icons/icons', prefix: 'si', output: 'simple-icons.svg' },
  { dir: 'flag-icons/flags/4x3', prefix: 'flag', output: 'flag-icons.svg' },
  { dir: 'payment-icons/min/flat', prefix: 'pay', output: 'payment-icons.svg' },
  { dir: 'boxicons/svg', prefix: 'bx', output: 'boxicons.svg', recursive: true, idFrom: 'path' },
  { dir: 'iconoir/icons', prefix: 'noir', output: 'iconoir-icons.svg' },
  { dir: '@fluentui/svg-icons/icons', prefix: 'fluent', output: 'fluent-icons.svg', transform: (s) => s.replace(/_/g, '-') },
  { dir: 'cryptocurrency-icons/svg/color', prefix: 'crypto', output: 'crypto-icons.svg', transform: (s) => s.toLowerCase() },
  { dir: 'healthicons/public/icons/svg/outline', prefix: 'health', output: 'health-icons.svg', recursive: true },
  { dir: 'eva-icons/fill/svg', prefix: 'eva', output: 'eva-icons.svg' },
  { dir: 'academicons/svg', prefix: 'ai', output: 'academicons.svg' },
  { dir: 'devicon/icons', prefix: 'dev', output: 'devicon.svg', recursive: true },
  { dir: 'maki/icons', prefix: 'maki', output: 'maki-icons.svg' },
  { dir: '@vscode/codicons/src/icons', prefix: 'codicon', output: 'codicons.svg' },
  { dir: 'pixelarticons/svg', prefix: 'pixel', output: 'pixelarticons.svg' },
  { dir: 'css.gg/icons/svg', prefix: 'cssgg', output: 'cssgg-icons.svg' },
];

// Iconify-format sets to pull in on top of the packages above
const iconifySets = ['vscode-icons', 'carbon'];

// -------------------------------------------------------------
// Generate one sprite per package, and collect every symbol so
// they can also be bundled into a single minified icons.svg
// -------------------------------------------------------------
const allSymbols = [];

for (const source of sources) {
  allSymbols.push(...buildSpriteFromDir(source));
}

if (fs.existsSync(iconifyDir)) {
  for (const setName of iconifySets) {
    allSymbols.push(...buildIconifySprite(setName));
  }
}

writeSprite('icons.svg', allSymbols, { minify: true });
