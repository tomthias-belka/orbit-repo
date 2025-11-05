#!/usr/bin/env node

/**
 * Build script for ClaraIconSet Figma Plugin
 *
 * This script bundles all TypeScript files into a single code.js file
 * compatible with Figma's plugin environment (no ES6 modules).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building ClaraIconSet...\n');

// Step 1: Compile TypeScript
console.log('1️⃣  Compiling TypeScript...');
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compiled\n');
} catch (error) {
  console.error('❌ TypeScript compilation failed');
  process.exit(1);
}

// Step 2: Read compiled files
console.log('2️⃣  Bundling files...');

const distDir = path.join(__dirname, 'dist');
const files = [
  'constants/index.js',
  'types/plugin.js',
  'types/icons.js',
  'classes/ProductionErrorHandler.js',
  'utils/svgTransformer.js',
  'classes/ReactNativeIconExporter.js',
  'main-icons.js'
];

let bundledCode = `"use strict";\n\n`;
bundledCode += `// ClaraIconSet - Bundled Plugin Code\n`;
bundledCode += `// Generated: ${new Date().toISOString()}\n\n`;

files.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Remove "use strict" duplicates
    content = content.replace(/^"use strict";\s*/gm, '');

    // Remove Object.defineProperty exports
    content = content.replace(/Object\.defineProperty\(exports.*?\);?\s*/g, '');

    // Remove require statements and convert to inline
    content = content.replace(/const \w+ = require\(['"]\.\/.*?['"]\);?\s*/g, '');
    content = content.replace(/exports\.__esModule = true;\s*/g, '');
    content = content.replace(/exports\.(\w+)/g, '$1');

    // Remove ES6 export statements
    content = content.replace(/^export /gm, '');
    content = content.replace(/^export default /gm, '');

    // Remove import statements
    content = content.replace(/^import .* from ['"].*['"];?\s*/gm, '');

    bundledCode += `\n// === ${file} ===\n`;
    bundledCode += content;
    bundledCode += `\n`;
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

// Step 3: Write bundled file
const outputPath = path.join(__dirname, 'code.js');
fs.writeFileSync(outputPath, bundledCode);

const stats = fs.statSync(outputPath);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log('✅ Files bundled\n');
console.log(`3️⃣  Output: code.js (${sizeKB}KB)`);
console.log('\n✨ Build complete!\n');
