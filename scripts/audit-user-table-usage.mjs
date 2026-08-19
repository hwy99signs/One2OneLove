import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'src');
const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/\.from\(\s*['"]users['"]\s*\)/.test(line)) {
        findings.push({
          file: path.relative(process.cwd(), fullPath),
          line: index + 1,
          text: line.trim(),
        });
      }
    });
  }
}

walk(root);

console.log(`Direct public.users references found: ${findings.length}`);
for (const finding of findings) {
  console.log(`${finding.file}:${finding.line} ${finding.text}`);
}

// This audit is intentionally informational while the remaining references are
// classified as own-account access or migrated to user_directory_profiles.
