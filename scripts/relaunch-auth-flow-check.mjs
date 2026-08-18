import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) failures.push(label);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) failures.push(label);
};

const reset = read('src/pages/ResetPassword.jsx');
const forgot = read('src/pages/ForgotPassword.jsx');
const signup = read('src/components/signup/RegularUserRelaunchForm.jsx');
const callback = read('src/pages/AuthCallback.jsx');
const signin = read('src/pages/SignIn.jsx');
const routes = read('src/pages/index.jsx');

requireText(reset, 'event === "PASSWORD_RECOVERY"', 'ResetPassword must require the PASSWORD_RECOVERY auth event.');
requireText(reset, 'urlHasRecoveryMarker()', 'ResetPassword must limit its fallback to an explicit recovery URL marker.');
forbidText(reset, 'event === "SIGNED_IN" || event === "INITIAL_SESSION"', 'ResetPassword must not authorize an ordinary signed-in session.');
requireText(reset, 'if (!validSession)', 'Password update must fail closed without a validated recovery session.');

requireText(forgot, 'resetPasswordForEmail', 'ForgotPassword must use Supabase password-recovery delivery.');
requireText(forgot, '/ResetPassword', 'Password recovery must return to the reviewed ResetPassword route.');
requireText(forgot, 'If an account matches that email address', 'Password recovery copy must resist account enumeration.');

requireText(signup, "window.localStorage.setItem('o2ol-return-after-auth', destination)", 'Signup must persist its validated return destination across email-confirmation tabs.');
requireText(callback, "window.localStorage.getItem(RETURN_KEY)", 'AuthCallback must read the cross-tab return destination.');
requireText(callback, 'window.sessionStorage.getItem(RETURN_KEY)', 'AuthCallback must preserve backward compatibility with older preview handoffs.');
requireText(callback, 'clearStoredReturnTo()', 'AuthCallback must clear a completed return handoff.');
requireText(callback, "!value.startsWith('/') || value.startsWith('//')", 'AuthCallback must reject external/protocol-relative return destinations.');
requireText(signin, "!value.startsWith('/') || value.startsWith('//')", 'SignIn must reject external/protocol-relative return destinations.');

requireText(routes, '["/auth/callback", AuthCallback]', 'Router must expose the exact lowercase auth callback used by Supabase email confirmation.');
requireText(routes, '["/ResetPassword", ResetPassword]', 'Router must expose the reviewed password-reset route.');

for (const source of [reset, forgot, signup, callback, signin]) {
  forbidText(source, '123456', 'Legacy fixed verification code 123456 must not exist in relaunch auth surfaces.');
}

if (failures.length) {
  console.error('\nAuthentication-flow preflight blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Authentication-flow preflight passed: recovery requires genuine recovery context, signup confirmation preserves only local return paths, and callback/reset routes are aligned.');
