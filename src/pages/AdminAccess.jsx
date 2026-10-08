import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getAdminMfaStatus, requestAdminMfaCode, verifyAdminMfaCode } from '@/lib/adminMfaService';
import { ADMIN_AUTH_REDIRECT, claimAutoRedirect } from '@/lib/activityGuard';

const claimAdminAuthRedirect = () => claimAutoRedirect(
  ADMIN_AUTH_REDIRECT.key, ADMIN_AUTH_REDIRECT.limit, ADMIN_AUTH_REDIRECT.windowMs,
);

export default function AdminAccess() {
  const navigate = useNavigate();
  const [otp,setOtp] = useState('');
  const [email,setEmail] = useState('your admin email');
  const [loading,setLoading] = useState(true);
  const [verifying,setVerifying] = useState(false);
  const [sent,setSent] = useState(false);

  const sendCode = async (notify=false) => {
    try {
      const result = await requestAdminMfaCode();
      setEmail(result?.email || 'your admin email');
      setSent(true);
      if (notify) toast.success('A new administrator verification code was sent.');
    } catch (error) {
      if (error?.status === 401 && claimAdminAuthRedirect()) return window.location.replace('/SignIn');
      if (error?.status === 403 && claimAdminAuthRedirect()) return window.location.replace('/Home');
      toast.error(error?.message || 'Unable to send the administrator verification code.');
    }
  };

  useEffect(() => {
    if (window.location.hostname === 'one2onelove-prelaunch.hwy99signs.workers.dev') {
      window.location.replace('/Admin');
      return;
    }
    let active=true;
    (async()=>{
      try {
        const status=await getAdminMfaStatus();
        if(!active) return;
        setEmail(status?.email || 'your admin email');
        if(status?.verified) {
          // Guarded against Admin <-> AdminAccess bounce loops: if the
          // redirect budget is spent, stay on this page instead of
          // reloading forever (2026-10-08 polling fix).
          if (claimAdminAuthRedirect()) return window.location.replace('/Admin');
          return;
        }
        await sendCode(false);
      } catch(error) {
        if(!active) return;
        if(error?.status===401 && claimAdminAuthRedirect()) window.location.replace('/SignIn');
        else if(error?.status===403 && claimAdminAuthRedirect()) window.location.replace('/Home');
        else toast.error(error?.message || 'Unable to verify administrator access.');
      } finally { if(active) setLoading(false); }
    })();
    return ()=>{active=false;};
  },[]);

  const verify=async event=>{
    event.preventDefault();
    if(!/^\d{6}$/.test(otp)) return toast.error('Enter the 6-digit code from your email.');
    setVerifying(true);
    try {
      await verifyAdminMfaCode(otp);
      window.location.replace('/Admin');
    } catch(error) {
      toast.error(error?.message || 'The verification code is invalid or expired.');
    } finally { setVerifying(false); }
  };

  return <main className="grid min-h-[78vh] place-items-center bg-slate-50 px-4 py-10">
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
      <button type="button" onClick={()=>navigate('/Home')} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={17}/>Back to One2OneLove</button>
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><ShieldCheck size={30}/></div>
      <h1 className="mt-4 text-3xl font-black text-slate-900">Admin Verification</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">A verification code is required when an administrator signs in. After verification, the secure Admin session remains active for the session period.</p>
      <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="flex items-center gap-2 font-bold"><Mail size={17}/>{sent?'Verification code sent':'Preparing verification'}</div>
        <div className="mt-1">Code sent to <strong>{email}</strong></div>
      </div>
      <form onSubmit={verify} className="mt-6 space-y-5">
        <div><label htmlFor="admin-otp" className="mb-2 block text-sm font-semibold text-slate-700">6-digit verification code</label>
        <input id="admin-otp" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={loading||verifying} className="h-14 w-full rounded-xl border border-slate-300 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"/></div>
        <button type="submit" disabled={loading||verifying||otp.length!==6} className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 font-bold text-white disabled:opacity-50">{verifying?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>Verifying…</>:'Enter Admin Dashboard'}</button>
      </form>
      <button type="button" disabled={loading||verifying} onClick={()=>{setOtp('');sendCode(true);}} className="mt-5 w-full text-sm font-bold text-rose-600 disabled:opacity-50">Send a new verification code</button>
    </section>
  </main>;
}
