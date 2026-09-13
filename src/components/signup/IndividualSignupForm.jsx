import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, Heart, Languages, Loader2, Lock, Mail, MapPin, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { registerLaunchUser, resendLaunchVerification } from "@/lib/launchSignupService";
import { getJurisdictionOptions } from "@/lib/professionalGeography";
import { INDIVIDUAL_SIGNUP_COPY } from "@/components/signup/individualSignupCopy";
import termsEn from "@/content/terms/en";
import termsEs from "@/content/terms/es";
import termsFr from "@/content/terms/fr";
import termsIt from "@/content/terms/it";
import termsDe from "@/content/terms/de";

const TERMS_VERSION = "2026-09-11";
const termsByLanguage = { en: termsEn, es: termsEs, fr: termsFr, it: termsIt, de: termsDe };
const languageOptions = [{ code:"en", label:"English" }, { code:"es", label:"Español" }, { code:"fr", label:"Français" }, { code:"it", label:"Italiano" }, { code:"de", label:"Deutsch" }];
const countryCodes = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");
const localeByLanguage = { en:"en-US", es:"es-ES", fr:"fr-FR", it:"it-IT", de:"de-DE" };

export default function IndividualSignupForm({ onBack }) {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = INDIVIDUAL_SIGNUP_COPY[currentLanguage] || INDIVIDUAL_SIGNUP_COPY.en;
  const terms = termsByLanguage[currentLanguage] || termsEn;
  const scrollRef = useRef(null);
  const [form, setForm] = useState({ name:"", email:"", country:"", region:"", city:"", language:"", password:"", confirm:"" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [resending, setResending] = useState(false);

  const countries = useMemo(() => {
    const locale = localeByLanguage[currentLanguage] || localeByLanguage.en;
    let localNames; let englishNames;
    try { localNames = new Intl.DisplayNames([locale], { type:"region" }); englishNames = new Intl.DisplayNames(["en-US"], { type:"region" }); } catch { localNames = null; englishNames = null; }
    return countryCodes.map((code) => ({ code, label: localNames?.of(code) || code, englishName: englishNames?.of(code) || code })).sort((a,b) => a.label.localeCompare(b.label, locale));
  }, [currentLanguage]);

  const country = countries.find((item) => item.code === form.country);
  const regionOptions = getJurisdictionOptions(country?.englishName || "");
  const regionRequired = regionOptions.length > 0;
  const profileComplete = Boolean(form.country && form.city.trim() && form.language && (!regionRequired || form.region));
  const passwordComplete = form.password.length >= 8 && form.confirm.length >= 8 && form.password === form.confirm;
  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const openTerms = () => {
    if (!passwordComplete) return;
    setTermsScrolled(false);
    setTermsOpen(true);
    window.setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!profileComplete) return toast.error(t.fieldsError);
    if (form.password !== form.confirm) return toast.error(t.mismatch);
    if (!termsAcceptedAt) return toast.error(t.termsError);
    setLoading(true);
    try {
      const result = await registerLaunchUser({ name:form.name, email:form.email, password:form.password, country:form.country, countryName:country?.englishName || form.country, region:form.region, city:form.city.trim(), preferredLanguage:form.language, termsAcceptedAt, termsVersion:TERMS_VERSION, privacyPolicyAcknowledged:true, age18Confirmed:true });
      if (result?.success && result.emailVerificationRequired) { setSuccessEmail(form.email); toast.success(t.verifyTitle); }
      else toast.error(result?.error || "Registration failed. Please try again.");
    } catch (error) { toast.error(error?.message || "Registration failed. Please try again."); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true);
    const result = await resendLaunchVerification(successEmail);
    result.success ? toast.success(t.resent) : toast.error(result.error || "Unable to resend verification email.");
    setResending(false);
  };

  if (successEmail) return <Card className="max-w-xl mx-auto shadow-2xl"><CardContent className="p-8 text-center"><Mail className="w-14 h-14 text-green-600 mx-auto mb-4"/><h1 className="text-3xl font-bold mb-3">{t.verifyTitle}</h1><p className="text-gray-600 mb-3">{t.verifyBody}</p><p className="font-semibold break-all mb-3">{successEmail}</p><div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 mb-6">{t.verifyNote}</div><div className="grid gap-3"><Button variant="outline" onClick={resend} disabled={resending}>{resending ? t.resending : t.resend}</Button><Button onClick={() => navigate(createPageUrl("SignIn"))} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">{t.signIn}</Button></div></CardContent></Card>;

  return <>
    <Card className="max-w-xl mx-auto shadow-2xl"><CardHeader><button type="button" onClick={onBack} className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"><ArrowLeft size={20} className="mr-2"/>{t.back}</button><div className="flex items-center gap-3 mb-2"><div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center"><Heart className="w-6 h-6 text-white fill-white"/></div><CardTitle className="text-3xl">{t.title}</CardTitle></div><p className="text-gray-600">{t.subtitle}</p></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-5">
        <TextField label={`${t.name} *`} icon={<User size={20}/>} value={form.name} onChange={(v)=>setField("name",v)} required/>
        <TextField label={`${t.email} *`} icon={<Mail size={20}/>} type="email" value={form.email} onChange={(v)=>setField("email",v)} required/>
        <SelectField label={`${t.country} *`} icon={<Globe2 size={20}/>} value={form.country} onChange={(v)=>setForm((current)=>({ ...current, country:v, region:"" }))} placeholder={t.selectCountry} options={countries.map((item)=>({ value:item.code, label:item.label }))}/>
        {form.country && (regionOptions.length ? <SelectField label={`${t.region} *`} icon={<MapPin size={20}/>} value={form.region} onChange={(v)=>setField("region",v)} placeholder={t.selectRegion} options={regionOptions.map((value)=>({ value, label:value }))}/> : <TextField label={t.regionOptional} icon={<MapPin size={20}/>} value={form.region} onChange={(v)=>setField("region",v)}/>)}
        <TextField label={`${t.city} *`} icon={<MapPin size={20}/>} value={form.city} onChange={(v)=>setField("city",v)} placeholder={t.enterCity} required/>
        <SelectField label={`${t.language} *`} icon={<Languages size={20}/>} value={form.language} onChange={(v)=>setField("language",v)} placeholder={t.selectLanguage} options={languageOptions.map((item)=>({ value:item.code, label:item.label }))}/>

        <div className={`rounded-xl border p-4 ${profileComplete ? "border-pink-200 bg-pink-50/40" : "border-gray-200 bg-gray-50"}`}>
          {!profileComplete && <p className="text-sm text-gray-600 mb-4">{t.passwordHint}</p>}
          <PasswordField label={`${t.password} *`} value={form.password} onChange={(v)=>setField("password",v)} visible={showPassword} toggle={()=>setShowPassword((v)=>!v)} disabled={!profileComplete} placeholder={t.createPassword}/>
          <div className="mt-5"><PasswordField label={`${t.confirm} *`} value={form.confirm} onChange={(v)=>setField("confirm",v)} visible={showConfirm} toggle={()=>setShowConfirm((v)=>!v)} disabled={!profileComplete} placeholder={t.confirmPassword}/></div>
        </div>

        <div className={`rounded-xl border p-4 ${termsAcceptedAt ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}><p className="font-semibold mb-1">{t.termsRequired}</p><p className="text-sm text-gray-600 mb-3">{t.termsExplain}</p><button type="button" onClick={openTerms} disabled={!passwordComplete} className="text-sm font-bold text-blue-600 underline disabled:text-gray-400 disabled:no-underline">{t.readTerms}</button>{termsAcceptedAt && <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mt-3"><CheckCircle2 size={18}/>{t.accepted}</div>}</div>
        <Button type="submit" disabled={loading || !termsAcceptedAt || !passwordComplete} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-lg py-6 disabled:opacity-50">{loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/>{t.creating}</> : t.create}</Button>
      </form></CardContent>
    </Card>

    {termsOpen && <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col relative"><button type="button" onClick={()=>setTermsOpen(false)} className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-gray-100 grid place-items-center"><X size={20}/></button><div className="p-6 pb-3 pr-16"><h2 className="text-2xl font-bold">{t.termsTitle}</h2><p className="text-sm text-gray-600 mt-2">{t.termsIntro}</p></div><div ref={scrollRef} onScroll={(e)=>{ const n=e.currentTarget; if(n.scrollTop+n.clientHeight>=n.scrollHeight-10) setTermsScrolled(true); }} className="mx-6 border rounded-xl p-5 overflow-y-auto max-h-[58vh]">{terms.map(([heading,body])=><section key={heading} className="mb-5"><h3 className="font-bold mb-1">{heading}</h3><p className="text-sm leading-6 text-gray-600">{body}</p></section>)}<p className="text-sm font-semibold text-gray-700">{t.privacy}</p><p className="text-xs text-gray-500 mt-4">Terms version: {TERMS_VERSION}</p></div><div className="p-6 pt-4"><p className={`text-xs text-center font-semibold mb-3 ${termsScrolled ? "text-green-700" : "text-gray-500"}`}>{termsScrolled ? t.reachedBottom : t.scrollHint}</p><Button type="button" disabled={!termsScrolled} onClick={()=>{ if(termsScrolled){ setTermsAcceptedAt(new Date().toISOString()); setTermsOpen(false); } }} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40">{t.acceptTerms}</Button></div></div></div>}
  </>;
}

function TextField({ label, icon, value, onChange, type="text", placeholder, required=false }) { return <div><label className="block text-sm font-medium text-gray-700 mb-2">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span><Input type={type} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="pl-12" required={required}/></div></div>; }
function SelectField({ label, icon, value, onChange, placeholder, options }) { return <div><label className="block text-sm font-medium text-gray-700 mb-2">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span><select value={value} onChange={(e)=>onChange(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white" required><option value="">{placeholder}</option>{options.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></div></div>; }
function PasswordField({ label, value, onChange, visible, toggle, disabled, placeholder }) { return <div><label className="block text-sm font-medium text-gray-700 mb-2">{label}</label><div className="relative"><Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><Input type={visible ? "text" : "password"} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="pl-12 pr-12" minLength={8} required disabled={disabled}/><button type="button" onClick={toggle} disabled={disabled} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 disabled:opacity-40">{visible ? <EyeOff size={20}/> : <Eye size={20}/>}</button></div></div>; }
