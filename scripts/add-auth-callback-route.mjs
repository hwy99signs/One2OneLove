import fs from 'node:fs';

const file = 'src/pages/index.jsx';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes('import AuthCallback from "./AuthCallback";')) {
  const anchor = 'import ResetPassword from "./ResetPassword";';
  if (!source.includes(anchor)) throw new Error('ResetPassword import anchor not found');
  source = source.replace(anchor, `${anchor}\nimport AuthCallback from "./AuthCallback";`);
}

if (!/\n\s*AuthCallback,/.test(source)) {
  const anchor = '  ResetPassword,';
  if (!source.includes(anchor)) throw new Error('ResetPassword PAGES anchor not found');
  source = source.replace(anchor, `${anchor}\n  AuthCallback,`);
}

if (!source.includes('path="/auth/callback"')) {
  const anchor = '        <Route path="/ResetPassword" element={<ResetPassword />} />';
  if (!source.includes(anchor)) throw new Error('ResetPassword route anchor not found');
  source = source.replace(anchor, `${anchor}\n        <Route path="/auth/callback" element={<AuthCallback />} />`);
}

fs.writeFileSync(file, source);
console.log('Auth callback route is wired.');
