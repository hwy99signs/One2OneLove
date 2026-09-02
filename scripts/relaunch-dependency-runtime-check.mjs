import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

const errors = [];
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor !== 24) {
  errors.push(`Expected Node 24.x for relaunch validation, found ${process.versions.node}.`);
}

if (packageJson.engines?.node !== '24.x') {
  errors.push(`package.json engines.node must be exactly 24.x, found ${packageJson.engines?.node ?? 'missing'}.`);
}

const manifestVersions = {
  'react-router-dom': ['dependencies', '7.18.0'],
  postcss: ['devDependencies', '8.5.23'],
  rollup: ['devDependencies', '4.59.0'],
  vite: ['devDependencies', '6.4.3'],
};

for (const [name, [section, expected]] of Object.entries(manifestVersions)) {
  const actual = packageJson[section]?.[name];
  if (actual !== expected) {
    errors.push(`${section}.${name} must be exactly ${expected}, found ${actual ?? 'missing'}.`);
  }
}

const lockVersions = {
  'node_modules/vite': '6.4.3',
  'node_modules/postcss': '8.5.23',
  'node_modules/rollup': '4.59.0',
  'node_modules/react-router': '7.18.0',
  'node_modules/react-router-dom': '7.18.0',
};

for (const [key, expected] of Object.entries(lockVersions)) {
  const actual = lock.packages?.[key]?.version;
  if (actual !== expected) {
    errors.push(`${key} must resolve to ${expected}, found ${actual ?? 'missing'}.`);
  }
}

if (errors.length) {
  console.error('Relaunch dependency/runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Relaunch dependency/runtime gate passed on Node 24.x with controlled security versions.');
