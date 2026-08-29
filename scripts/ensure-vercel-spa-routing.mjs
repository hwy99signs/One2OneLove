import fs from 'node:fs';

const file = 'vercel.json';
let config = {};

if (fs.existsSync(file)) {
  try {
    config = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw new Error('vercel.json exists but is not valid JSON');
  }
}

const rewrites = Array.isArray(config.rewrites) ? config.rewrites : [];
const hasSpaFallback = rewrites.some((rewrite) =>
  rewrite && rewrite.source === '/(.*)' && (rewrite.destination === '/index.html' || rewrite.destination === '/')
);

if (!hasSpaFallback) {
  config.rewrites = [
    ...rewrites,
    { source: '/(.*)', destination: '/index.html' },
  ];
}

fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
console.log(hasSpaFallback ? 'Vercel SPA fallback already present.' : 'Added Vercel SPA fallback rewrite.');
