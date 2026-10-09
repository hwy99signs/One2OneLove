import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles, WalletCards } from 'lucide-react';
import { motion } from 'framer-motion';

const COPY={
  en:{label:'Account Access',title:'Registered Free',founder:'Founding Member',price:'FREE',body:'Your One2OneLove account is free. Add Credit only when you choose a metered premium service.',features:['No recurring membership charge','Relationship tools and community access','Credit shown in US dollars and cents','Optional Auto-Replenish'],action:'Open Credit Wallet'},
  es:{label:'Acceso de Cuenta',title:'Registrado Gratis',founder:'Miembro Fundador',price:'GRATIS',body:'Tu cuenta One2OneLove es gratuita. Agrega Crédito solo cuando elijas un servicio premium medido.',features:['Sin cargo recurrente de membresía','Herramientas de relación y comunidad','Crédito mostrado en dólares y centavos estadounidenses','Recarga Automática opcional'],action:'Abrir Billetera de Crédito'},
  fr:{label:'Accès au Compte',title:'Inscription Gratuite',founder:'Membre Fondateur',price:'GRATUIT',body:'Votre compte One2OneLove est gratuit. Ajoutez du Crédit uniquement lorsque vous choisissez un service premium mesuré.',features:['Aucun abonnement récurrent','Outils relationnels et accès communauté','Crédit affiché en dollars et cents américains','Recharge Automatique facultative'],action:'Ouvrir le Portefeuille Crédit'},
  it:{label:'Accesso Account',title:'Registrato Gratuito',founder:'Membro Fondatore',price:'GRATIS',body:'Il tuo account One2OneLove è gratuito. Aggiungi Credito solo quando scegli un servizio premium a consumo.',features:['Nessun addebito ricorrente di iscrizione','Strumenti relazionali e accesso alla community','Credito mostrato in dollari e centesimi USA','Ricarica Automatica facoltativa'],action:'Apri Portafoglio Credito'},
  de:{label:'Kontozugang',title:'Kostenlos Registriert',founder:'Gründungsmitglied',price:'KOSTENLOS',body:'Ihr One2OneLove-Konto ist kostenlos. Fügen Sie Credit nur hinzu, wenn Sie einen nutzungsabhängigen Premium-Dienst wählen.',features:['Keine wiederkehrende Mitgliedsgebühr','Beziehungstools und Community-Zugang','Credit in US-Dollar und Cent angezeigt','Optionale automatische Aufladung'],action:'Credit-Wallet Öffnen'}
};

export default function SubscriptionCard({user,currentLanguage='en'}){
  const t=COPY[currentLanguage]||COPY.en;
  const founder=Boolean(user?.founding_number||user?.foundingNumber);
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
      <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"><WalletCards className="h-6 w-6 text-white"/></div>
              <div><p className="text-sm text-gray-600">{t.label}</p><h3 className="text-2xl font-bold text-gray-900">{founder?t.founder:t.title}</h3></div>
            </div>
            <div className="text-2xl font-black text-emerald-700">{t.price}</div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-gray-700">{t.body}</p>
          <div className="space-y-2">
            {t.features.map(feature=><div key={feature} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"/><span className="text-sm text-gray-700">{feature}</span></div>)}
          </div>
          <Link to="/Credit"><Button variant="outline" className="w-full"><Sparkles className="mr-2 h-4 w-4"/>{t.action}<ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
