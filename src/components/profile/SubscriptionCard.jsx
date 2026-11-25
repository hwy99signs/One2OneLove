import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles, WalletCards } from 'lucide-react';
import { motion } from 'framer-motion';

const COPY={
  en:{label:'Account Access',title:'Registered Free',founder:'Founding Member',price:'FREE',body:'One2OneLove is 100% free for everyone. Credit and wallets have been retired — no card, no checkout, and no account is required to use the platform.',features:['No membership charge — ever','Every relationship tool and community feature is free','No Credit, no wallet, no Auto-Replenish','Guests are welcome with no signup'],action:'See the Feature List'},
  es:{label:'Acceso de Cuenta',title:'Registrado Gratis',founder:'Miembro Fundador',price:'GRATIS',body:'One2OneLove es 100% gratis para todos. El Crédito y las billeteras se retiraron: sin tarjeta, sin pagos y sin necesidad de cuenta para usar la plataforma.',features:['Sin cargo de membresía, nunca','Todas las herramientas y la comunidad son gratis','Sin Crédito, sin billetera, sin Recarga Automática','Invitados bienvenidos sin registro'],action:'Ver la Lista de Funciones'},
  fr:{label:'Accès au Compte',title:'Inscription Gratuite',founder:'Membre Fondateur',price:'GRATUIT',body:'One2OneLove est 100 % gratuit pour tout le monde. Le Crédit et les portefeuilles ont été retirés — aucune carte, aucun paiement, et aucun compte requis pour utiliser la plateforme.',features:['Aucun frais d\'adhésion, jamais','Tous les outils relationnels et la communauté sont gratuits','Aucun Crédit, aucun portefeuille, aucune Recharge Automatique','Invités bienvenus sans inscription'],action:'Voir la Liste des Fonctionnalités'},
  it:{label:'Accesso Account',title:'Registrato Gratuito',founder:'Membro Fondatore',price:'GRATIS',body:'One2OneLove è gratuito al 100% per tutti. Credito e portafogli sono stati ritirati: nessuna carta, nessun pagamento e nessun account necessario per usare la piattaforma.',features:['Nessun costo di iscrizione, mai','Tutti gli strumenti e la community sono gratuiti','Nessun Credito, nessun portafoglio, nessuna Ricarica Automatica','Ospiti benvenuti senza registrazione'],action:'Vedi l\'Elenco delle Funzioni'},
  de:{label:'Kontozugang',title:'Kostenlos Registriert',founder:'Gründungsmitglied',price:'KOSTENLOS',body:'One2OneLove ist für alle 100 % kostenlos. Credit und Wallets wurden eingestellt — keine Karte, keine Kaufabwicklung und kein Konto erforderlich, um die Plattform zu nutzen.',features:['Keine Mitgliedsgebühr — niemals','Alle Beziehungstools und Community-Funktionen sind kostenlos','Kein Credit, keine Wallet, keine automatische Aufladung','Gäste sind ohne Anmeldung willkommen'],action:'Feature-Liste Ansehen'}
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
          <Link to="/FeaturePricing"><Button variant="outline" className="w-full"><Sparkles className="mr-2 h-4 w-4"/>{t.action}<ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
