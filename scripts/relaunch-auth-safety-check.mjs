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
const signIn = read('src/pages/SignIn.jsx');
const callback = read('src/pages/AuthCallback.jsx');
const reset = read('src/pages/ResetPassword.jsx');
const forgot = read('src/pages/ForgotPassword.jsx');

requireText(auth, 'emailIsConfirmed', 'AuthContext must derive confirmation from Supabase Auth.');
requireText(auth, 'rejectUnconfirmedSession', 'AuthContext must reject unconfirmed sessions.');
requireText(auth, "user_type: 'regular'", 'Regular signup must not grant a professional role.');
requireText(signIn, "supabase.auth.resend({", 'Sign In must provide a real confirmation resend path.');
requireText(signIn, "type: 'signup'", 'Confirmation resend must use the signup confirmation type.');
requireText(signIn, 'o2ol-return-after-auth', 'Confirmation resend must preserve the safe return destination.');
requireText(callback, 'Confirmation link processed. Please sign in to continue.', 'Callback must not claim confirmation without proof.');
forbidText(callback, "setStatus('Email confirmed. Please sign in to continue.')", 'Callback may not call an unverified no-session state confirmed.');
requireText(reset, 'event === "PASSWORD_RECOVERY"', 'Password reset must require Supabase recovery state.');
requireText(reset, 'urlHasRecoveryMarker()', 'Password reset must verify an explicit recovery marker fallback.');
requireText(forgot, 'If an account matches that email address', 'Forgot Password must avoid account-enumeration success copy.');
forbidText(signIn, '123456', 'Sign In may not contain a mock verification code.');
forbidText(auth, '123456', 'AuthContext may not contain a mock verification code.');

if (failures.length) {
  console.error('\n⛔ Relaunch auth safety check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Relaunch auth safety check passed.');
