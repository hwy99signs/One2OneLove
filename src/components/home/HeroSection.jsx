import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Users, Trophy, BrainCircuit } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    hero: { title: "One2One Love", slogan: "We Start Where Dating Sites Stop.", subtitle: "Create beautiful, heartfelt love notes and strengthen your bond with the person you love most.", description: "Join thousands of couples who are making their relationships more romantic, meaningful, and connected every day.", loveNotesCreated: "Love Notes Created", happyCouples: "Happy Couples", loveLanguageQuiz: "Love Language Quiz", sendLoveNote: "Send A Love Note", coupleSupport: "Couple Support", dateIdeas: "Date Ideas", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Most Notes (Week)", mostNotesMonth: "Most Notes (Month)", mostNotesYear: "Most Notes (Year)" }
  },
  es: {
    hero: { title: "One2One Love", slogan: "Comenzamos Donde los Sitios de Citas Se Detienen.", subtitle: "Crea hermosas notas de amor sinceras y fortalece el vínculo con la persona que más amas.", description: "Únete a miles de parejas que están haciendo sus relaciones más románticas, significativas y conectadas cada día.", loveNotesCreated: "Notas de Amor Creadas", happyCouples: "Parejas Felices", loveLanguageQuiz: "Quiz de Lenguaje del Amor", sendLoveNote: "Enviar una Nota de Amor", coupleSupport: "Apoyo para Parejas", dateIdeas: "Ideas para Citas", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Más Notas (Semana)", mostNotesMonth: "Más Notas (Mes)", mostNotesYear: "Más Notas (Año)" }
  },
  fr: {
    hero: { title: "One2One Love", slogan: "Nous Commençons Là Où les Sites de Rencontres S'Arrêtent.", subtitle: "Créez de belles notes d'amour sincères et renforcez votre lien avec la personne que vous aimez le plus.", description: "Rejoignez des milliers de couples qui rendent leurs relations plus romantiques, significatives et connectées chaque jour.", loveNotesCreated: "Notes d'Amour Créées", happyCouples: "Couples Heureux", loveLanguageQuiz: "Quiz sur les Langages d'Amour", sendLoveNote: "Envoyer une Note d'Amour", coupleSupport: "Soutien aux Couples", dateIdeas: "Idées de Rendez-vous", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Plus de Notes (Semaine)", mostNotesMonth: "Plus de Notes (Mois)", mostNotesYear: "Plus de Notes (Année)" }
  },
  it: {
    hero: { title: "One2One Love", slogan: "Iniziamo Dove i Siti di Incontri Si Fermano.", subtitle: "Crea bellissime note d'amore sincere e rafforza il legame con la persona che ami di più.", description: "Unisciti a migliaia di coppie che rendono le loro relazioni più romantiche, significative e connesse ogni giorno.", loveNotesCreated: "Note d'Amore Create", happyCouples: "Coppie Felici", loveLanguageQuiz: "Quiz sul Linguaggio dell'Amore", sendLoveNote: "Invia una Nota d'Amore", coupleSupport: "Supporto per Coppie", dateIdeas: "Idee per Appuntamenti", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Più Note (Settimana)", mostNotesMonth: "Più Note (Mese)", mostNotesYear: "Più Note (Anno)" }
  },
  de: {
    hero: { title: "One2One Love", slogan: "Wir Beginnen, Wo Dating-Seiten Aufhören.", subtitle: "Erstellen Sie schöne, herzliche Liebesbotschaften und stärken Sie die Bindung zu der Person, die Sie am meisten lieben.", description: "Schließen Sie sich Tausenden von Paaren an, die ihre Beziehungen jeden Tag romantischer, bedeutungsvoller und verbundener machen.", loveNotesCreated: "Erstellte Liebesbotschaften", happyCouples: "Glückliche Paare", loveLanguageQuiz: "Liebessprachen-Quiz", sendLoveNote: "Eine Liebesbotschaft Senden", coupleSupport: "Paar-Unterstützung", dateIdeas: "Date-Ideen", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Meiste Nachrichten (Woche)", mostNotesMonth: "Meiste Nachrichten (Monat)", mostNotesYear: "Meiste Nachrichten (Jahr)" }
  },
  nl: {
    hero: { title: "One2One Love", slogan: "Wij Beginnen Waar Datingsites Stoppen.", subtitle: "Creëer prachtige, oprechte liefdebriefjes en versterk de band met de persoon van wie je het meest houdt.", description: "Sluit je aan bij duizenden koppels die hun relaties elke dag romantischer, betekenisvoller en meer verbonden maken.", loveNotesCreated: "Gemaakte Liefdebriefjes", happyCouples: "Gelukkige Koppels", loveLanguageQuiz: "Liefdetalen Quiz", sendLoveNote: "Stuur een Liefdebriefje", coupleSupport: "Koppel Ondersteuning", dateIdeas: "Date Ideeën", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Meeste Notities (Week)", mostNotesMonth: "Meeste Notities (Maand)", mostNotesYear: "Meeste Notities (Jaar)" }
  },
  pt: {
    hero: { title: "One2One Love", slogan: "Começamos Onde os Sites de Namoro Param.", subtitle: "Crie lindas notas de amor sinceras e fortaleça o vínculo com a pessoa que você mais ama.", description: "Junte-se a milhares de casais que estão tornando seus relacionamentos mais românticos, significativos e conectados todos os dias.", loveNotesCreated: "Notas de Amor Criadas", happyCouples: "Casais Felizes", loveLanguageQuiz: "Quiz das Linguagens do Amor", sendLoveNote: "Enviar uma Nota de Amor", coupleSupport: "Apoio para Casais", dateIdeas: "Ideias de Encontros", myMatchIQ: "MyMatchIQ", mostNotesWeek: "Mais Notas (Semana)", mostNotesMonth: "Mais Notas (Mês)", mostNotesYear: "Mais Notas (Ano)" }
  }
};

export default function HeroSection({ stats }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/bd7450758_-appbackgroundphoto.png')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-10 sm:pb-12 text-center">
        <div className="flex justify-center mb-6">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/19ffc2fa2_ONE2ONELOVELOGO.png" 
            alt="One2One Love Logo" 
            className="h-32 sm:h-40 md:h-48 w-auto drop-shadow-2xl"
          />
        </div>
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-white mb-3 tracking-tight drop-shadow-2xl">
          {t.hero.title} ✨
        </h1>
        
        <p className="text-2xl sm:text-3xl md:text-4xl bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-6 font-bold drop-shadow-lg italic">
          {t.hero.slogan}
        </p>
        
        <p className="text-xl sm:text-2xl md:text-3xl text-white mb-4 font-medium drop-shadow-lg max-w-4xl mx-auto leading-relaxed">
          {t.hero.subtitle}
        </p>
        
        <p className="text-lg sm:text-xl text-white/95 mb-10 drop-shadow-lg max-w-3xl mx-auto">
          {t.hero.description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto mb-12">
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            <Link to={createPageUrl("LoveLanguageQuiz")}>
              <Button 
                size="lg"
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all w-64"
              >
                <Heart className="mr-3" size={24} />
                {t.hero.loveLanguageQuiz}
              </Button>
            </Link>
            <Link to={createPageUrl("LoveNotes")}>
              <Button 
                size="lg"
                className="bg-white hover:bg-gray-50 text-pink-600 font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all w-64"
              >
                <Heart className="mr-3" size={24} />
                {t.hero.sendLoveNote}
              </Button>
            </Link>
            <Link to={createPageUrl("CoupleSupport")}>
              <Button 
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
              >
                <Users className="mr-3" size={24} />
                {t.hero.coupleSupport}
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 w-full">
            <Link to={createPageUrl("DateIdeas")}>
              <Button 
                size="lg"
                className="bg-pink-500 hover:bg-pink-600 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
              >
                <Calendar className="mr-3" size={24} />
                {t.hero.dateIdeas}
              </Button>
            </Link>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-600 hover:via-blue-700 hover:to-purple-700 text-white font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
            >
              <a href="https://www.mymatchiq.com/" target="_blank" rel="noopener noreferrer">
                <BrainCircuit className="mr-3" size={24} />
                {t.hero.myMatchIQ}
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-stretch justify-center gap-2">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-xl flex flex-col justify-center">
            <div className="text-xl leading-none font-bold text-pink-600 mb-1">{stats?.notesCreated || 0}</div>
            <div className="text-[11px] leading-tight text-gray-600 font-medium">{t.hero.loveNotesCreated}</div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-xl flex flex-col justify-center">
            <div className="text-xl leading-none font-bold text-purple-600 mb-1">{stats?.happyCouples || 0}</div>
            <div className="text-[11px] leading-tight text-gray-600 font-medium">{t.hero.happyCouples}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-xl flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <div className="text-xl leading-none font-bold">{stats?.mostNotesWeek?.count || 0}</div>
            </div>
            <div className="text-[11px] leading-tight font-medium">{t.hero.mostNotesWeek}</div>
            {stats?.mostNotesWeek?.membershipId && (
              <div className="text-[10px] leading-tight font-bold opacity-90">ID: {stats.mostNotesWeek.membershipId}</div>
            )}
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-xl flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <div className="text-xl leading-none font-bold">{stats?.mostNotesMonth?.count || 0}</div>
            </div>
            <div className="text-[11px] leading-tight font-medium">{t.hero.mostNotesMonth}</div>
            {stats?.mostNotesMonth?.membershipId && (
              <div className="text-[10px] leading-tight font-bold opacity-90">ID: {stats.mostNotesMonth.membershipId}</div>
            )}
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-xl flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <div className="text-xl leading-none font-bold">{stats?.mostNotesYear?.count || 0}</div>
            </div>
            <div className="text-[11px] leading-tight font-medium">{t.hero.mostNotesYear}</div>
            {stats?.mostNotesYear?.membershipId && (
              <div className="text-[10px] leading-tight font-bold opacity-90">ID: {stats.mostNotesYear.membershipId}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
