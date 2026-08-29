import fs from 'node:fs';
import path from 'node:path';

const srcRoot = path.join(process.cwd(), 'src');
const patterns = [
  { name: 'direct users table read/write', regex: /\.from\(\s*['"]users['"]\s*\)/g },
  { name: 'embedded users foreign-key relation', regex: /\busers!/g },
  { name: 'aliased users relation', regex: /\b\w+\s*:\s*users(?:!|\s*\()/g },
  { name: 'select users relation', regex: /\busers\s*\(/g },
];

const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;
    const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of patterns) {
        pattern.regex.lastIndex = 0;
        if (pattern.regex.test(line)) {
          findings.push({
            type: pattern.name,
            file: path.relative(process.cwd(), full),
            line: index + 1,
            text: line.trim().slice(0, 300),
          });
        }
      }
    });
  }
}

walk(srcRoot);
findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.type.localeCompare(b.type));

console.log(`# Private public.users dependency audit (${findings.length} findings)`);
for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} [${finding.type}] ${finding.text}`);
}
