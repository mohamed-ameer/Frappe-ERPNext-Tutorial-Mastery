// NPM INSTALL: you must install the following icon packages in your app directory to generate the icons.svg sprite file. You can add more icon packages to the list below if you want to include them in your app. After installing, run this script to generate the icons.svg file in your app's public/icons directory.
// npm install @fortawesome/fontawesome-free lucide-static heroicons bootstrap-icons remixicon @tabler/icons @material-design-icons/svg @phosphor-icons/core @primer/octicons lineicons feather-icons ionicons weather-icons simple-icons flag-icons payment-icons boxicons @carbon/icons iconoir @iconscout/unicons @fluentui/svg-icons cryptocurrency-icons healthicons grommet-icons eva-icons line-awesome @iconify/json academicons devicon maki undraw-svg css.gg pixelarticons @vscode/codicons

const fs = require('fs');
const path = require('path');

const appName = 'your_app'; // Change to your app directory name
const outputDir = path.join(__dirname, appName, 'public/icons');
const nodeModulesDir = path.join(__dirname, 'node_modules');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper: Safely converts raw SVG string to a Frappe <symbol> tag
function convertToSymbol(rawSvg, symbolId) {
  const viewBoxMatch = rawSvg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';

  const innerContent = rawSvg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>[\s\S]*$/i, '')
    .trim();

  return `  <symbol id="${symbolId}" viewBox="${viewBox}">\n    ${innerContent}\n  </symbol>`;
}

// Helper: Writes sprite SVG file
function writeSprite(filename, symbolTags) {
  if (symbolTags.length === 0) return;
  const spriteContent = `<svg id="frappe-symbols" aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden;" xmlns="http://www.w3.org/2000/svg">\n${symbolTags.join('\n')}\n</svg>`;
  const targetPath = path.join(outputDir, filename);
  fs.writeFileSync(targetPath, spriteContent, 'utf8');
  console.log(`✅ Generated ${filename} (${symbolTags.length} icons)`);
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

// -------------------------------------------------------------
// 1. LUCIDE ICONS (lucide-static)
// -------------------------------------------------------------
const lucideDir = path.join(nodeModulesDir, 'lucide-static/icons');
if (fs.existsSync(lucideDir)) {
  const symbols = fs.readdirSync(lucideDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(lucideDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-lucide-${name}`);
    });
  writeSprite('lucide-icons.svg', symbols);
}

// -------------------------------------------------------------
// 2. HEROICONS (heroicons)
// -------------------------------------------------------------
const heroDir = path.join(nodeModulesDir, 'heroicons');
if (fs.existsSync(heroDir)) {
  const svgFiles = getSvgFiles(heroDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    // Extract variant from path (e.g., 24/outline, 24/solid, 20/solid)
    const relative = path.relative(heroDir, filePath).replace(/\\/g, '/');
    const parts = relative.replace('.svg', '').split('/');
    const iconId = `icon-hero-${parts.join('-')}`; // e.g., icon-hero-24-outline-user
    return convertToSymbol(raw, iconId);
  });
  writeSprite('heroicons.svg', symbols);
}

// -------------------------------------------------------------
// 3. BOOTSTRAP ICONS (bootstrap-icons)
// -------------------------------------------------------------
const bsDir = path.join(nodeModulesDir, 'bootstrap-icons/icons');
if (fs.existsSync(bsDir)) {
  const symbols = fs.readdirSync(bsDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(bsDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-bs-${name}`); // e.g., icon-bs-alarm
    });
  writeSprite('bootstrap-icons.svg', symbols);
}

// -------------------------------------------------------------
// 4. REMIX ICON (remixicon)
// -------------------------------------------------------------
const remixDir = path.join(nodeModulesDir, 'remixicon/icons');
if (fs.existsSync(remixDir)) {
  const svgFiles = getSvgFiles(remixDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath, '.svg');
    return convertToSymbol(raw, `icon-ri-${name}`); // e.g., icon-ri-user-line
  });
  writeSprite('remixicons.svg', symbols);
}

// -------------------------------------------------------------
// 5. TABLER ICONS (@tabler/icons)
// -------------------------------------------------------------
const tablerDir = path.join(nodeModulesDir, '@tabler/icons/icons');
if (fs.existsSync(tablerDir)) {
  const svgFiles = getSvgFiles(tablerDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath, '.svg');
    return convertToSymbol(raw, `icon-tabler-${name}`); // e.g., icon-tabler-user
  });
  writeSprite('tabler-icons.svg', symbols);
}

// -------------------------------------------------------------
// 6. MATERIAL SYMBOLS (@material-design-icons/svg)
// -------------------------------------------------------------
const msDir = path.join(nodeModulesDir, '@material-design-icons/svg');
if (fs.existsSync(msDir)) {
  const svgFiles = getSvgFiles(msDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const relative = path.relative(msDir, filePath).replace(/\\/g, '/').replace('.svg', '');
    const parts = relative.split('/');
    // e.g., filled/account_circle -> icon-ms-filled-account-circle
    const iconId = `icon-ms-${parts.join('-').replace(/_/g, '-')}`;
    return convertToSymbol(raw, iconId);
  });
  writeSprite('material-symbols.svg', symbols);
}

// -------------------------------------------------------------
// 7. PHOSPHOR ICONS (@phosphor-icons/core)
// -------------------------------------------------------------
const phosphorDir = path.join(nodeModulesDir, '@phosphor-icons/core/assets');
if (fs.existsSync(phosphorDir)) {
  const svgFiles = getSvgFiles(phosphorDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath, '.svg');
    return convertToSymbol(raw, `icon-ph-${name}`); // e.g., icon-ph-user-bold
  });
  writeSprite('phosphor-icons.svg', symbols);
}

// -------------------------------------------------------------
// 8. OCTICONS (@primer/octicons)
// -------------------------------------------------------------
const octiconDir = path.join(nodeModulesDir, '@primer/octicons/build/svg');
if (fs.existsSync(octiconDir)) {
  const symbols = fs.readdirSync(octiconDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(octiconDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-octicon-${name}`); // e.g., icon-octicon-git-commit-16
    });
  writeSprite('octicons.svg', symbols);
}

// -------------------------------------------------------------
// 9. SIMPLE ICONS (Brand Logos: simple-icons)
// -------------------------------------------------------------
const simpleDir = path.join(nodeModulesDir, 'simple-icons/icons');
if (fs.existsSync(simpleDir)) {
  const symbols = fs.readdirSync(simpleDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(simpleDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-si-${name}`); // e.g., icon-si-github, icon-si-docker
    });
  writeSprite('simple-icons.svg', symbols);
}



// -------------------------------------------------------------
// 10. FLAG ICONS (flag-icons)
// -------------------------------------------------------------
const flagDir = path.join(nodeModulesDir, 'flag-icons/flags/4x3');
if (fs.existsSync(flagDir)) {
  const symbols = fs.readdirSync(flagDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(flagDir, file), 'utf8');
      const countryCode = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-flag-${countryCode}`); // e.g., icon-flag-us, icon-flag-eg
    });
  writeSprite('flag-icons.svg', symbols);
}

// -------------------------------------------------------------
// 11. PAYMENT ICONS (payment-icons)
// -------------------------------------------------------------
const payDir = path.join(nodeModulesDir, 'payment-icons/min/flat');
if (fs.existsSync(payDir)) {
  const symbols = fs.readdirSync(payDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(payDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-pay-${name}`); // e.g., icon-pay-visa, icon-pay-paypal
    });
  writeSprite('payment-icons.svg', symbols);
}

// -------------------------------------------------------------
// 12. BOXICONS (boxicons)
// -------------------------------------------------------------
const bxDir = path.join(nodeModulesDir, 'boxicons/svg');
if (fs.existsSync(bxDir)) {
  const svgFiles = getSvgFiles(bxDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const relative = path.relative(bxDir, filePath).replace(/\\/g, '/').replace('.svg', '');
    const parts = relative.split('/');
    const iconId = `icon-bx-${parts.join('-')}`; // e.g., icon-bx-regular-bx-user
    return convertToSymbol(raw, iconId);
  });
  writeSprite('boxicons.svg', symbols);
}

// -------------------------------------------------------------
// 13. ICONOIR (iconoir)
// -------------------------------------------------------------
const noirDir = path.join(nodeModulesDir, 'iconoir/icons');
if (fs.existsSync(noirDir)) {
  const symbols = fs.readdirSync(noirDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(noirDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-noir-${name}`); // e.g., icon-noir-bell
    });
  writeSprite('iconoir-icons.svg', symbols);
}

// -------------------------------------------------------------
// 14. FLUENT UI ICONS (@fluentui/svg-icons)
// -------------------------------------------------------------
const fluentDir = path.join(nodeModulesDir, '@fluentui/svg-icons/icons');
if (fs.existsSync(fluentDir)) {
  const symbols = fs.readdirSync(fluentDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(fluentDir, file), 'utf8');
      const name = file.replace('.svg', '').replace(/_/g, '-');
      return convertToSymbol(raw, `icon-fluent-${name}`); // e.g., icon-fluent-mail-24-regular
    });
  writeSprite('fluent-icons.svg', symbols);
}



// -------------------------------------------------------------
// 15. CRYPTO ICONS (cryptocurrency-icons)
// -------------------------------------------------------------
const cryptoDir = path.join(nodeModulesDir, 'cryptocurrency-icons/svg/color');
if (fs.existsSync(cryptoDir)) {
  const symbols = fs.readdirSync(cryptoDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(cryptoDir, file), 'utf8');
      const symbolCode = file.replace('.svg', '').toLowerCase();
      return convertToSymbol(raw, `icon-crypto-${symbolCode}`); // e.g., icon-crypto-btc, icon-crypto-eth
    });
  writeSprite('crypto-icons.svg', symbols);
}

// -------------------------------------------------------------
// 16. HEALTH ICONS (healthicons)
// -------------------------------------------------------------
const healthDir = path.join(nodeModulesDir, 'healthicons/public/icons/svg/outline');
if (fs.existsSync(healthDir)) {
  const svgFiles = getSvgFiles(healthDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath, '.svg');
    return convertToSymbol(raw, `icon-health-${name}`); // e.g., icon-health-blood-pressure
  });
  writeSprite('health-icons.svg', symbols);
}

// -------------------------------------------------------------
// 17. EVA ICONS (eva-icons)
// -------------------------------------------------------------
const evaDir = path.join(nodeModulesDir, 'eva-icons/fill/svg');
if (fs.existsSync(evaDir)) {
  const symbols = fs.readdirSync(evaDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(evaDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-eva-${name}`); // e.g., icon-eva-activity
    });
  writeSprite('eva-icons.svg', symbols);
}

// -------------------------------------------------------------
// 18. ICONIFY PARSER (@iconify/json)
// Extract icons from any set in Iconify JSON format
// -------------------------------------------------------------
const iconifyDir = path.join(nodeModulesDir, '@iconify/json/json');
function buildIconifySprite(setName) {
  const jsonPath = path.join(iconifyDir, `${setName}.json`);
  if (!fs.existsSync(jsonPath)) return;

  const iconSet = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const width = iconSet.width || 24;
  const height = iconSet.height || 24;
  let symbols = [];

  for (const [iconName, iconData] of Object.entries(iconSet.icons)) {
    const body = iconData.body;
    const w = iconData.width || width;
    const h = iconData.height || height;
    const viewBox = `0 0 ${w} ${h}`;
    const symbolId = `icon-${setName}-${iconName}`;
    
    symbols.push(`  <symbol id="${symbolId}" viewBox="${viewBox}">\n    ${body}\n  </symbol>`);
  }

  writeSprite(`${setName}-iconify.svg`, symbols);
}

// Example: Generate custom sprites directly from Iconify datasets
if (fs.existsSync(iconifyDir)) {
  buildIconifySprite('vscode-icons'); // VSCode File/Folder Icons
  buildIconifySprite('carbon');       // IBM Carbon Design Icons
}

// -------------------------------------------------------------
// 19. ACADEMICONS (academicons)
// -------------------------------------------------------------
const academicDir = path.join(nodeModulesDir, 'academicons/svg');
if (fs.existsSync(academicDir)) {
  const symbols = fs.readdirSync(academicDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(academicDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-ai-${name}`); // e.g., icon-ai-orcid, icon-ai-arxiv
    });
  writeSprite('academicons.svg', symbols);
}

// -------------------------------------------------------------
// 20. DEVICON (devicon)
// -------------------------------------------------------------
const deviconDir = path.join(nodeModulesDir, 'devicon/icons');
if (fs.existsSync(deviconDir)) {
  const svgFiles = getSvgFiles(deviconDir);
  const symbols = svgFiles.map(filePath => {
    const raw = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath, '.svg');
    return convertToSymbol(raw, `icon-dev-${name}`); // e.g., icon-dev-python-original
  });
  writeSprite('devicon.svg', symbols);
}

// -------------------------------------------------------------
// 21. MAKI MAP ICONS (maki)
// -------------------------------------------------------------
const makiDir = path.join(nodeModulesDir, 'maki/icons');
if (fs.existsSync(makiDir)) {
  const symbols = fs.readdirSync(makiDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(makiDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-maki-${name}`); // e.g., icon-maki-airport, icon-maki-hospital
    });
  writeSprite('maki-icons.svg', symbols);
}

// -------------------------------------------------------------
// 22. VSCODE CODICONS (@vscode/codicons)
// -------------------------------------------------------------
const codiconDir = path.join(nodeModulesDir, '@vscode/codicons/src/icons');
if (fs.existsSync(codiconDir)) {
  const symbols = fs.readdirSync(codiconDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(codiconDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-codicon-${name}`); // e.g., icon-codicon-account
    });
  writeSprite('codicons.svg', symbols);
}

// -------------------------------------------------------------
// 23. PIXEL ART ICONS (pixelarticons)
// -------------------------------------------------------------
const pixelDir = path.join(nodeModulesDir, 'pixelarticons/svg');
if (fs.existsSync(pixelDir)) {
  const symbols = fs.readdirSync(pixelDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(pixelDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-pixel-${name}`); // e.g., icon-pixel-zap
    });
  writeSprite('pixelarticons.svg', symbols);
}

// -------------------------------------------------------------
// 24. CSS.GG (css.gg)
// -------------------------------------------------------------
const cssggDir = path.join(nodeModulesDir, 'css.gg/icons/svg');
if (fs.existsSync(cssggDir)) {
  const symbols = fs.readdirSync(cssggDir)
    .filter(f => f.endsWith('.svg'))
    .map(file => {
      const raw = fs.readFileSync(path.join(cssggDir, file), 'utf8');
      const name = file.replace('.svg', '');
      return convertToSymbol(raw, `icon-cssgg-${name}`); // e.g., icon-cssgg-alarm
    });
  writeSprite('cssgg-icons.svg', symbols);
}
