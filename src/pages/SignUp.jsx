import React from "react";
import { ArrowLeft, BriefcaseBusiness, Coins, UserRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import LaunchRegularUserForm from "@/components/signup/LaunchRegularUserForm";

const COPY={
  en:{title:"Create Your FREE One2OneLove Account",subtitle:"No card required. Join the community free, then buy O2OL Tokens only when you choose a metered premium feature.",free:"FREE ACCOUNT",freeBody:"Watch current O2OL Studio shows, join Chat Room conversations, create milestones and use free-member features. Your Token Wallet starts at 0.",individual:"Individual Member",individualBody:"Create your free personal account for One2OneLove relationship tools, community, Studio and activities.",professional:"Professional / Contributor",professionalBody:"Apply as a licensed therapist or counselor, relationship coach or educator, creator or media contributor, organization, or professional partner.",continue:"Continue",back:"Back",founding:"Founding Member interest preserved — token benefits will be assigned after cost calibration."},
  es:{title:"Crea Tu Cuenta GRATIS de One2OneLove",subtitle:"No se requiere tarjeta. Únete gratis y compra Tokens O2OL solo cuando elijas una función premium de consumo.",free:"CUENTA GRATIS",freeBody:"Mira los programas actuales de O2OL Studio, participa en el Chat, crea hitos y usa funciones gratuitas. Tu billetera empieza en 0.",individual:"Miembro Individual",individualBody:"Crea tu cuenta personal gratuita para herramientas, comunidad, Studio y actividades.",professional:"Profesional / Colaborador",professionalBody:"Solicita acceso como terapeuta o consejero con licencia, coach o educador, creador o colaborador de medios, organización o socio profesional.",continue:"Continuar",back:"Volver",founding:"Tu interés como Miembro Fundador queda preservado; los beneficios en tokens se asignarán después de la calibración de costos."},
  fr:{title:"Créez Votre Compte One2OneLove GRATUIT",subtitle:"Aucune carte requise. Rejoignez gratuitement puis achetez des Jetons O2OL uniquement pour les fonctions premium mesurées que vous choisissez.",free:"COMPTE GRATUIT",freeBody:"Regardez les émissions Studio actuelles, participez au Chat, créez des jalons et utilisez les fonctions gratuites. Votre portefeuille commence à 0.",individual:"Membre Particulier",individualBody:"Créez votre compte personnel gratuit pour les outils, la communauté, Studio et les activités.",professional:"Professionnel / Contributeur",professionalBody:"Candidatez comme thérapeute ou conseiller agréé, coach ou éducateur, créateur ou contributeur média, organisation ou partenaire professionnel.",continue:"Continuer",back:"Retour",founding:"Votre intérêt de Membre Fondateur est conservé; les avantages en jetons seront attribués après calibration des coûts."},
  it:{title:"Crea il Tuo Account One2OneLove GRATUITO",subtitle:"Nessuna carta richiesta. Entra gratis e acquista Token O2OL solo quando scegli una funzione premium a consumo.",free:"ACCOUNT GRATUITO",freeBody:"Guarda gli show Studio attuali, partecipa alla Chat, crea traguardi e usa le funzioni gratuite. Il portafoglio parte da 0.",individual:"Membro Individuale",individualBody:"Crea il tuo account personale gratuito per strumenti, community, Studio e attività.",professional:"Professionista / Contributor",professionalBody:"Candidati come terapeuta o consulente abilitato, coach o educatore, creator o contributor media, organizzazione o partner professionale.",continue:"Continua",back:"Indietro",founding:"Il tuo interesse come Membro Fondatore viene conservato; i vantaggi in token saranno assegnati dopo la calibrazione dei costi."},
  de:{title:"Erstelle Dein KOSTENLOSES One2OneLove-Konto",subtitle:"Keine Karte erforderlich. Tritt kostenlos bei und kaufe O2OL Tokens nur, wenn du eine kostenpflichtige Premium-Funktion nutzt.",free:"KOSTENLOSES KONTO",freeBody:"Sieh aktuelle Studio-Shows, nimm am Chat teil, erstelle Meilensteine und nutze kostenlose Funktionen. Dein Token-Wallet startet bei 0.",individual:"Privatmitglied",individualBody:"Erstelle dein kostenloses persönliches Konto für Beziehungstools, Community, Studio und Aktivitäten.",professional:"Fachkraft / Contributor",professionalBody:"Bewirb dich als lizenzierte Fachkraft, Beziehungscoach oder Pädagoge, Creator, Medien-Contributor, Organisation oder professioneller Partner.",continue:"Weiter",back:"Zurück",founding:"Dein Interesse als Gründungsmitglied bleibt erhalten; Token-Vorteile werden nach der Kostenkalibrierung festgelegt."}
};

export default function SignUp(){
  const navigate=useNavigate();
  const [searchParams]=useSearchParams();
  const {currentLanguage}=useLanguage();
  const t=COPY[currentLanguage]||COPY.en;
  const signupType=String(searchParams.get("type")||"").toLowerCase();
  const foundingIntent=searchParams.get("founding")==="1";
  const source=searchParams.get("source")||"";
  const returnTo=searchParams.get("return")||"";

  if(signupType==="individual"){
    return <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 px-4 py-12">
      <LaunchRegularUserForm
        foundingIntent={foundingIntent}
        source={source}
        returnTo={returnTo}
        onBack={()=>navigate("/SignUp"+(foundingIntent?"?founding=1":""))}
      />
    </div>;
  }

  const query=new URLSearchParams();
  query.set("type","individual");
  if(foundingIntent)query.set("founding","1");
  if(source)query.set("source",source);
  if(returnTo)query.set("return",returnTo);

  return <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" onClick={()=>navigate(-1)} className="mb-8 text-gray-600"><ArrowLeft className="mr-2 h-5 w-5"/>{t.back}</Button>

      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl">{t.title}</h1>
        <p className="mx-auto max-w-3xl text-xl text-gray-600">{t.subtitle}</p>
        <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <div className="flex items-center gap-2 font-black text-emerald-800"><Coins className="h-5 w-5"/>{t.free}</div>
          <p className="mt-1 text-sm leading-6 text-emerald-900/80">{t.freeBody}</p>
        </div>
        {foundingIntent&&<div className="mx-auto mt-3 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">{t.founding}</div>}
      </div>

      <div className="grid gap-7 md:grid-cols-2">
        <Card className="border-2 border-transparent shadow-xl transition-shadow hover:border-pink-200 hover:shadow-2xl">
          <CardContent className="flex h-full flex-col p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg"><UserRound className="h-8 w-8"/></div>
            <h2 className="mb-3 text-3xl font-black text-gray-900">{t.individual}</h2>
            <p className="mb-7 flex-1 leading-relaxed text-gray-600">{t.individualBody}</p>
            <Button onClick={()=>navigate("/SignUp?"+query.toString())} className="w-full bg-gradient-to-r from-pink-500 to-rose-600 py-6 font-bold text-white">{t.continue}</Button>
          </CardContent>
        </Card>

        <Card className="border-2 border-transparent shadow-xl transition-shadow hover:border-purple-200 hover:shadow-2xl">
          <CardContent className="flex h-full flex-col p-8">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg"><BriefcaseBusiness className="h-8 w-8"/></div>
            <h2 className="mb-3 text-3xl font-black text-gray-900">{t.professional}</h2>
            <p className="mb-7 flex-1 leading-relaxed text-gray-600">{t.professionalBody}</p>
            <Button onClick={()=>navigate("/ProfessionalSignup")} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 py-6 font-bold text-white">{t.continue}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
}
