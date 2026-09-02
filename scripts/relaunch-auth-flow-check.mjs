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
const authFlow = read('src/lib/authFlowService.js');
const routes = read('src/pages/index.jsx');

requireText(reset, 'event === "PASSWORD_RECOVERY"', 'ResetPassword must require the PASSWORD_RECOVERY auth event.');
requireText(reset, 'urlHasRecoveryMarker()', 'ResetPassword must limit its fallback to an explicit recovery URL marker.');
forbidText(reset, 'event === "SIGNED_IN" || event === "INITIAL_SESSION"', 'ResetPassword must not authorize an ordinary signed-in session.');
requireText(reset, 'if (!validSession)', 'Password update must fail closed without a validated recovery session.');
requireText(reset, 'scrubAuthMaterialFromUrl', 'ResetPassword must scrub consumed recovery credentials from browser history.');
requireText(reset, 'await supabase.auth.signOut()', 'Successful recovery must clear the temporary recovery session.');

requireText(forgot, 'resetPasswordForEmail', 'ForgotPassword must use Supabase password-recovery delivery.');
requireText(forgot, '/ResetPassword', 'Password recovery must return to the reviewed ResetPassword route.');
requireText(forgot, 'If an account matches that email address', 'Password recovery copy must resist account enumeration.');

requireText(authFlow, 'safeAuthReturnTo', 'Auth return validation must be centralized.');
requireText(authFlow, "value.startsWith('/')", 'Auth return destinations must remain local paths.');
requireText(authFlow, "value.startsWith('//')", 'Auth return destinations must reject protocol-relative URLs.');
requireText(authFlow, "'access_token'", 'Auth URL scrubbing must remove access tokens.');
requireText(authFlow, "'refresh_token'", 'Auth URL scrubbing must remove refresh tokens.');
requireText(authFlow, "'code'", 'Auth URL scrubbing must remove one-time authorization codes.');
requireText(authFlow, "url.hash = ''", 'Auth URL scrubbing must clear implicit-flow fragments.');
requireText(authFlow, 'history.replaceState', 'Auth material must be removed from browser history without reloading.');

requireText(signup, 'safeAuthReturnTo', 'Signup must use the centralized local return-path validator.');
requireText(signup, 'storeAuthReturnTo(destination, { durable: true })', 'Signup must persist its validated return destination across confirmation tabs.');
requireText(signup, 'clearAuthReturnTo()', 'Signup must clear the return handoff when confirmation is not required.');

requireText(callback, 'loadAuthReturnTo()', 'AuthCallback must read the centralized cross-tab return destination.');
requireText(callback, 'clearAuthReturnTo()', 'AuthCallback must clear a completed return handoff.');
requireText(callback, 'scrubAuthMaterialFromUrl()', 'AuthCallback must scrub one-time provider credentials.');
requireText(callback, 'authUserIsConfirmed', 'AuthCallback must verify confirmed account state.');
requireText(callback, 'Confirmation link processed. Please sign in to continue.', 'AuthCallback must not claim email confirmation without a confirmed session.');
forbidText(callback, "setStatus('Email confirmed. Please sign in to continue.')", 'AuthCallback may not label an unverified no-session state as confirmed.');

requireText(signin, 'safeAuthReturnTo', 'SignIn must use the centralized local return-path validator.');
requireText(signin, 'storeAuthReturnTo(returnTo, { durable: true })', 'Confirmation resend must preserve the validated local return destination.');
requireText(signin, 'supabase.auth.resend({', 'SignIn must provide a real confirmation-email resend path.');
requireText(signin, "type: 'signup'", 'Confirmation resend must use Supabase signup confirmation.');

requireText(auth, 'emailIsConfirmed', 'AuthContext must derive confirmation from Supabase Auth.');
requireText(auth, 'rejectUnconfirmedSession', 'AuthContext must reject unconfirmed sessions.');
requireText(auth, 'await supabase.auth.signOut()', 'Rejected unconfirmed sessions must be cleared.');
requireText(auth, "user_type: 'regular'", 'Public account signup must not grant professional roles.');
requireText(auth, 'ensure_own_regular_profile', 'Missing regular profiles must bootstrap through the trusted RPC.');

requireText(routes, '["/auth/callback", AuthCallback]', 'Router must expose the exact lowercase auth callback used by Supabase email confirmation.');
requireText(routes, '["/ResetPassword", ResetPassword]', 'Router must expose the reviewed password-reset route.');

for (const source of [reset, forgot, signup, callback, signin, auth, authFlow]) {
  forbidText(source, '123456', 'Legacy fixed verification code 123456 must not exist in relaunch auth surfaces.');
}

if (failures.length) {
  console.error('\nAuthentication-flow preflight blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Authentication-flow preflight passed: recovery requires genuine recovery context, unconfirmed sessions fail closed, auth return routes stay local, and consumed auth credentials are scrubbed from browser history.');
