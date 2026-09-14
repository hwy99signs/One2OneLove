import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { requestAdminMfaCode, verifyAdminMfaCode } from '@/lib/adminMfaService';

export default function AdminAccess() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('your admin email');
  const [sending, setSending] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const sendCode = async (showToast = true) => {
    setSending(true);
    try {
      const result = await requestAdminMfaCode();
      setEmail(result?.email || 'your admin email');
      setSent(true);
      setCooldown(30);
      if (showToast) toast.success('A new administrator verification code was sent.');
    } catch (error) {
      if (error?.status === 401) {
        window.location.replace('/SignIn');
        return;
      }
      if (error?.status === 403) {
        toast.error('Administrator access is required.');
        navigate('/Home', { replace: true });
        return;
      }
      toast.error(error?.message || 'Unable to send the verification code.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    sendCode(false);
  }, []);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setInterval(() => {
      setCooldown(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const verify = async (event) => {
    event.preventDefault();
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your email.');
      return;
    }

    setVerifying(true);
    try {
      await verifyAdminMfaCode(code);
      toast.success('Administrator verification complete.');
      window.location.replace('/Admin');
    } catch (error) {
      toast.error(error?.message || 'The verification code is invalid or expired.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[72vh] bg-gradient-to-br from-rose-50 via-white to-sky-50 px-4 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-rose-200 bg-white p-7 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={() => navigate('/Home')}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={17}/>Back to One2OneLove
        </button>

        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldCheck size={30}/>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin Verification</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          For added security, entering One2OneLove Admin requires a second verification step.
        </p>

        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 shrink-0 text-sky-600" size={19}/>
            <div>
              <p className="text-sm font-bold text-sky-900">Verification code sent</p>
              <p className="mt-1 text-sm text-sky-800">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
              <p className="mt-1 text-xs text-sky-700">The code expires in about 5 minutes.</p>
            </div>
          </div>
        </div>

        <form onSubmit={verify} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">6-digit verification code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-center text-2xl font-black tracking-[0.35em] text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              disabled={sending || verifying}
              maxLength={6}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={sending || verifying || otp.length !== 6}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 px-5 font-bold text-white shadow-sm transition hover:from-rose-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18}/>} {verifying ? 'Verifying…' : 'Enter Admin Dashboard'}
          </button>
        </form>

        <div className="mt-5 border-t border-slate-200 pt-5 text-center">
          <button
            type="button"
            onClick={() => sendCode(true)}
            disabled={sending || verifying || cooldown > 0}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {sending ? 'Sending code…' : cooldown > 0 ? `Resend code in ${cooldown}s` : sent ? 'Resend verification code' : 'Send verification code'}
          </button>
        </div>
      </div>
    </div>
  );
}
