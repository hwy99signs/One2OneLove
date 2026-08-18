import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const requireText = (source, text, label) => {
  if (!source.includes(text)) failures.push(label);
};
const forbidText = (source, text, label) => {
  if (source.includes(text)) failures.push(label);
};

const auth = read('src/contexts/AuthContext.jsx');
const authFlow = read('src/lib/authFlowService.js');
const signIn = read('src/pages/SignIn.jsx');
const callback = read('src/pages/AuthCallback.jsx');
const reset = read('src/pages/ResetPassword.jsx');
const forgot = read('src/pages/ForgotPassword.jsx');
const signup = read('src/components/signup/RegularUserRelaunchForm.jsx');

requireText(auth, 'emailIsConfirmed', 'AuthContext must derive confirmation from Supabase Auth.');
requireText(auth, 'rejectUnconfirmedSession', 'AuthContext must reject unconfirmed sessions.');
requireText(auth, 'await supabase.auth.signOut()', 'Rejected unconfirmed sessions must be cleared from Supabase Auth.');
requireText(auth, "user_type: 'regular'", 'Regular signup must not grant a professional role.');
requireText(auth, 'ensure_own_regular_profile', 'Regular profile bootstrap must use the trusted database RPC.');
requireText(auth, 'registerProfessional = async () => ({ success: false', 'Public professional auth registration must fail closed into review-first intake.');

requireText(authFlow, "value.startsWith('/')", 'Auth return paths must be internal paths.');
requireText(authFlow, "value.startsWith('//')", 'Auth return paths must reject protocol-relative redirects.');
requireText(authFlow, "'access_token'", 'Auth URL scrubber must remove access tokens.');
requireText(authFlow, "'refresh_token'", 'Auth URL scrubber must remove refresh tokens.');
requireText(authFlow, "'code'", 'Auth URL scrubber must remove one-time authorization codes.');
requireText(authFlow, "url.hash = ''", 'Auth URL scrubber must clear implicit-flow fragments.');
requireText(authFlow, 'history.replaceState', 'Auth URL scrubber must replace browser history without navigation.');

requireText(signIn, "supabase.auth.resend({", 'Sign In must provide a real confirmation resend path.');
requireText(signIn, "type: 'signup'", 'Confirmation resend must use the signup confirmation type.');
requireText(signIn, 'o2ol-return-after-auth', 'Confirmation resend must preserve the safe return destination.');

requireText(callback, 'Confirmation link processed. Please sign in to continue.', 'Callback must not claim confirmation without proof.');
requireText(callback, 'scrubAuthMaterialFromUrl', 'Confirmation callback must scrub one-time auth material from the visible URL.');
requireText(callback, 'authUserIsConfirmed', 'Confirmation callback must verify confirmed account state.');
forbidText(callback, "setStatus('Email confirmed. Please sign in to continue.')", 'Callback may not call an unverified no-session state confirmed.');

requireText(reset, 'event === "PASSWORD_RECOVERY"', 'Password reset must require Supabase recovery state.');
requireText(reset, 'urlHasRecoveryMarker()', 'Password reset must verify an explicit recovery marker fallback.');
requireText(reset, 'scrubAuthMaterialFromUrl', 'Password reset must scrub temporary recovery credentials after consumption.');
requireText(reset, 'supabase.auth.updateUser({ password })', 'Password reset must update through Supabase Auth.');
requireText(reset, 'await supabase.auth.signOut()', 'Successful password recovery must clear the recovery session.');

requireText(forgot, 'supabase.auth.resetPasswordForEmail', 'Forgot Password must request a real Supabase recovery email.');
requireText(forgot, 'If an account matches that email address', 'Forgot Password must avoid account-enumeration success copy.');

requireText(signup, 'Free-account creation does not start a paid membership', 'Free signup must remain separate from paid membership checkout.');
forbidText(signup.toLowerCase(), 'card_number', 'Free signup may not collect payment card data.');

forbidText(signIn, '123456', 'Sign In may not contain a mock verification code.');
forbidText(auth, '123456', 'AuthContext may not contain a mock verification code.');
forbidText(reset, '123456', 'Reset Password may not contain a mock verification code.');

if (failures.length) {
  console.error('\n⛔ Relaunch auth safety check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relaunch auth safety check passed.');
