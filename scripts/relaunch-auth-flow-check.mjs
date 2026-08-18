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
const auth = read('src/contexts/AuthContext.jsx');
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
requireText(callback, 'Confirmation link processed. Please sign in to continue.', 'AuthCallback must not claim email confirmation without a confirmed session.');
forbidText(callback, "setStatus('Email confirmed. Please sign in to continue.')", 'AuthCallback may not label an unverified no-session state as confirmed.');

requireText(signin, "!value.startsWith('/') || value.startsWith('//')", 'SignIn must reject external/protocol-relative return destinations.');
requireText(signin, 'supabase.auth.resend({', 'SignIn must provide a real confirmation-email resend path.');
requireText(signin, "type: 'signup'", 'Confirmation resend must use Supabase signup confirmation.');
requireText(signin, 'o2ol-return-after-auth', 'Confirmation resend must preserve the validated local return destination.');

requireText(auth, 'emailIsConfirmed', 'AuthContext must derive confirmation from Supabase Auth.');
requireText(auth, 'rejectUnconfirmedSession', 'AuthContext must reject unconfirmed sessions.');
requireText(auth, "user_type: 'regular'", 'Public account signup must not grant professional roles.');

requireText(routes, '["/auth/callback", AuthCallback]', 'Router must expose the exact lowercase auth callback used by Supabase email confirmation.');
requireText(routes, '["/ResetPassword", ResetPassword]', 'Router must expose the reviewed password-reset route.');

for (const source of [reset, forgot, signup, callback, signin, auth]) {
  forbidText(source, '123456', 'Legacy fixed verification code 123456 must not exist in relaunch auth surfaces.');
}

if (failures.length) {
  console.error('\nAuthentication-flow preflight blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Authentication-flow preflight passed: recovery requires genuine recovery context, unconfirmed sessions fail closed, confirmation resend is real, and auth return routes stay local.');
