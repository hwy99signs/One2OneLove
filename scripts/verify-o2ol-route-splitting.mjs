import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routerPath = path.join(root, 'src/pages/index.jsx');
const failures = [];

if (!fs.existsSync(routerPath)) {
  failures.push('Missing src/pages/index.jsx');
} else {
  const source = fs.readFileSync(routerPath, 'utf8');

  if (!source.includes("import React, { Suspense, lazy } from 'react';")) {
    failures.push('Router must import React.lazy and Suspense.');
  }
  if (!source.includes('<Suspense fallback={<RouteLoadingFallback />}>')) {
    failures.push('Routes must remain wrapped in the multilingual Suspense fallback.');
  }

  const eagerPageImports = source
    .split('\n')
    .filter((line) => /^import\s+\w+\s+from\s+['"]\.\/[^'"]+['"];?$/.test(line.trim()))
    .filter((line) => !line.includes("'./Layout.jsx'") && !line.includes('"./Layout.jsx"'));

  if (eagerPageImports.length > 0) {
    failures.push(`Router restored eager page imports: ${eagerPageImports.join(' | ')}`);
  }

  const lazyDeclarations = [...source.matchAll(/const\s+\w+\s*=\s*lazy\(\(\)\s*=>\s*import\(['"]\.\//g)].length;
  if (lazyDeclarations < 50) {
    failures.push(`Expected broad route lazy loading; found only ${lazyDeclarations} lazy page declarations.`);
  }

  const requiredRoutes = [
    '/Home',
    '/login',
    '/signup',
    '/LoveNotes',
    '/SharedJournals',
    '/RelationshipQuizzes',
    '/GlobalRelationshipRoom',
    '/RoomOpsDashboard',
    '/PaymentSuccess',
    '/payment-success',
    '/ResetPassword',
  ];
  for (const route of requiredRoutes) {
    if (!source.includes(`path=\"${route}\"`)) failures.push(`Missing preserved route: ${route}`);
  }

  for (const language of ['en', 'es', 'fr', 'it', 'de']) {
    if (!source.includes(`${language}:`)) failures.push(`Missing ${language} route-loading translation.`);
  }
}

if (fs.existsSync(path.join(root, 'dist/assets'))) {
  const assetDir = path.join(root, 'dist/assets');
  const jsFiles = fs.readdirSync(assetDir).filter((name) => name.endsWith('.js'));
  if (jsFiles.length < 20) {
    failures.push(`Production build emitted only ${jsFiles.length} JS chunks; route splitting may have regressed.`);
  }
  const largest = jsFiles
    .map((name) => ({ name, bytes: fs.statSync(path.join(assetDir, name)).size }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);
  console.log(`Production JS chunks: ${jsFiles.length}`);
  console.log('Largest JS chunks:');
  for (const item of largest) console.log(`- ${item.name}: ${(item.bytes / 1024).toFixed(1)} KiB`);
}

if (failures.length) {
  console.error('\nO2OL route-splitting verification failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('O2OL route-splitting source verification passed.');
