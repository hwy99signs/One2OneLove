
import React, { useState } from "react";
import { Heart, FileText, ArrowLeft, Users, MessageCircle, BookOpen, TrendingUp, Star, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Articles & Advice",
    subtitle: "Expert insights, tips, and guidance from relationship professionals",
    back: "Back to Support",
    category: "Category",
    categories: { all: "All Articles", communication: "Communication", intimacy: "Intimacy", trust: "Trust & Loyalty", growth: "Personal Growth", challenges: "Challenges", celebration: "Celebration" },
    featuredArticles: "Featured Articles",
    allArticles: "All Articles",
    readArticle: "Read Article",
    minRead: "min read",
    newsletterTitle: "Get Weekly Relationship Tips",
    newsletterSubtitle: "Join thousands of couples receiving expert advice directly to their inbox",
    emailPlaceholder: "Enter your email",
    subscribe: "Subscribe",
    subscribed: "Thank you for subscribing! 💕"
  },
  es: {
    title: "Artículos y Consejos de Relaciones",
    subtitle: "Perspectivas expertas, consejos y orientación de profesionales de relaciones",
    back: "Volver al Apoyo",
    category: "Categoría",
    categories: { all: "Todos los Artículos", communication: "Comunicación", intimacy: "Intimidad", trust: "Confianza y Lealtad", growth: "Crecimiento Personal", challenges: "Desafíos", celebration: "Celebración" },
    featuredArticles: "Artículos Destacados",
    allArticles: "Todos los Artículos",
    readArticle: "Leer Artículo",
    minRead: "min de lectura",
    newsletterTitle: "Recibe Consejos Semanales de Relaciones",
    newsletterSubtitle: "Únete a miles de parejas que reciben consejos expertos directamente en su bandeja de entrada",
    emailPlaceholder: "Ingresa tu correo",
    subscribe: "Suscribirse",
    subscribed: "¡Gracias por suscribirte! 💕"
  },
  fr: {
    title: "Articles et Conseils sur les Relations",
    subtitle: "Perspectives d'experts, conseils et guidance de professionnels des relations",
    back: "Retour au Soutien",
    category: "Catégorie",
    categories: { all: "Tous les Articles", communication: "Communication", intimacy: "Intimité", trust: "Confiance et Loyauté", growth: "Croissance Personnelle", challenges: "Défis", celebration: "Célébration" },
    featuredArticles: "Articles en Vedette",
    allArticles: "Tous les Articles",
    readArticle: "Lire l'Article",
    minRead: "min de lecture",
    newsletterTitle: "Recevez des Conseils Hebdomadaires sur les Relations",
    newsletterSubtitle: "Rejoignez des milliers de couples recevant des conseils d'experts directement dans leur boîte de réception",
    emailPlaceholder: "Entrez votre e-mail",
    subscribe: "S'abonner",
    subscribed: "Merci de vous être abonné! 💕"
  },
  it: {
    title: "Articoli e Consigli sulle Relazioni",
    subtitle: "Approfondimenti esperti, suggerimenti e guida da professionisti delle relazioni",
    back: "Torna al Supporto",
    category: "Categoria",
    categories: { all: "Tutti gli Articoli", communication: "Comunicazione", intimacy: "Intimità", trust: "Fiducia e Lealtà", growth: "Crescita Personale", challenges: "Sfide", celebration: "Celebrazione" },
    featuredArticles: "Articoli in Evidenza",
    allArticles: "Tutti gli Articoli",
    readArticle: "Leggi Articolo",
    minRead: "min di lettura",
    newsletterTitle: "Ricevi Consigli Settimanali sulle Relazioni",
    newsletterSubtitle: "Unisciti a migliaia di coppie che ricevono consigli esperti direttamente nella loro casella di posta",
    emailPlaceholder: "Inserisci la tua email",
    subscribe: "Iscriviti",
    subscribed: "Grazie per esserti iscritto! 💕"
  },
  de: {
    title: "Beziehungsartikel & Ratschläge",
    subtitle: "Expertenwissen, Tipps und Anleitungen von Beziehungsprofis",
    back: "Zurück zur Unterstützung",
    category: "Kategorie",
    categories: { all: "Alle Artikel", communication: "Kommunikation", intimacy: "Intimität", trust: "Vertrauen & Loyalität", growth: "Persönliches Wachstum", challenges: "Herausforderungen", celebration: "Feier" },
    featuredArticles: "Hervorgehobene Artikel",
    allArticles: "Alle Artikel",
    readArticle: "Artikel Lesen",
    minRead: "Min. Lesezeit",
    newsletterTitle: "Erhalten Sie Wöchentliche Beziehungstipps",
    newsletterSubtitle: "Schließen Sie sich Tausenden von Paaren an, die Expertenrat direkt in ihrem Posteingang erhalten",
    emailPlaceholder: "Geben Sie Ihre E-Mail ein",
    subscribe: "Abonnieren",
    subscribed: "Danke fürs Abonnieren! 💕"
  },
  nl: {
    title: "Relatie Artikelen & Advies",
    subtitle: "Deskundige inzichten, tips en begeleiding van relatieprofessionals",
    back: "Terug naar Ondersteuning",
    category: "Categorie",
    categories: { all: "Alle Artikelen", communication: "Communicatie", intimacy: "Intimiteit", trust: "Vertrouwen & Loyaliteit", growth: "Persoonlijke Groei", challenges: "Uitdagingen", celebration: "Viering" },
    featuredArticles: "Uitgelichte Artikelen",
    allArticles: "Alle Artikelen",
    readArticle: "Artikel Lezen",
    minRead: "min lezen",
    newsletterTitle: "Ontvang Wekelijkse Relatietips",
    newsletterSubtitle: "Sluit je aan bij duizenden koppels die expertadvies direct in hun inbox ontvangen",
    emailPlaceholder: "Voer je e-mail in",
    subscribe: "Abonneren",
    subscribed: "Bedankt voor het abonneren! 💕"
  },
  pt: {
    title: "Artigos e Conselhos sobre Relacionamentos",
    subtitle: "Insights especializados, dicas e orientação de profissionais de relacionamento",
    back: "Voltar ao Suporte",
    category: "Categoria",
    categories: { all: "Todos os Artigos", communication: "Comunicação", intimacy: "Intimidade", trust: "Confiança e Lealdade", growth: "Crescimento Pessoal", challenges: "Desafios", celebration: "Celebração" },
    featuredArticles: "Artigos em Destaque",
    allArticles: "Todos os Artigos",
    readArticle: "Ler Artigo",
    minRead: "min de leitura",
    newsletterTitle: "Receba Dicas Semanais de Relacionamento",
    newsletterSubtitle: "Junte-se a milhares de casais recebendo conselhos especializados diretamente em sua caixa de entrada",
    emailPlaceholder: "Digite seu e-mail",
    subscribe: "Inscrever-se",
    subscribed: "Obrigado por se inscrever! 💕"
  }
};

export default function ArticlesSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [email, setEmail] = useState('');

  const categories = [
    { id: 'all', name: t.categories.all, icon: FileText, color: 'from-pink-500 to-rose-600' },
    { id: 'communication', name: t.categories.communication, icon: MessageCircle, color: 'from-blue-500 to-cyan-600' },
    { id: 'intimacy', name: t.categories.intimacy, icon: Heart, color: 'from-red-500 to-pink-600' },
    { id: 'trust', name: t.categories.trust, icon: Users, color: 'from-purple-500 to-pink-600' },
    { id: 'growth', name: t.categories.growth, icon: TrendingUp, color: 'from-green-500 to-emerald-600' },
    { id: 'challenges', name: t.categories.challenges, icon: Star, color: 'from-orange-500 to-red-600' },
    { id: 'celebration', name: t.categories.celebration, icon: Heart, color: 'from-yellow-500 to-orange-600' }
  ];

  const articles = [
    {
      id: 1,
      title: "The 5 Love Languages: Understanding Your Partner Better",
      author: "Dr. Sarah Mitchell",
      category: 'communication',
      readTime: 8,
      date: "Dec 15, 2024",
      description: "Learn how understanding love languages can transform your relationship and deepen your emotional connection.",
      tags: ['love languages', 'communication', 'understanding']
    },
    {
      id: 2,
      title: "Building Trust After Betrayal: A Step-by-Step Guide",
      author: "Dr. James Chen",
      category: 'trust',
      readTime: 12,
      date: "Dec 10, 2024",
      description: "Practical strategies for rebuilding trust and healing your relationship after experiencing betrayal.",
      tags: ['trust', 'healing', 'recovery']
    },
    {
      id: 3,
      title: "Keeping the Spark Alive: 10 Creative Date Night Ideas",
      author: "Emily Rodriguez",
      category: 'celebration',
      readTime: 6,
      date: "Dec 5, 2024",
      description: "Discover exciting ways to keep your relationship fresh, fun, and full of romantic moments.",
      tags: ['dates', 'romance', 'fun']
    },
    {
      id: 4,
      title: "Healthy Conflict Resolution in Relationships",
      author: "Dr. Michael Brown",
      category: 'communication',
      readTime: 10,
      date: "Nov 28, 2024",
      description: "Master the art of disagreeing constructively and turning conflicts into opportunities for growth.",
      tags: ['conflict', 'communication', 'growth']
    },
    {
      id: 5,
      title: "Emotional Intelligence: The Key to Lasting Love",
      author: "Dr. Lisa Anderson",
      category: 'growth',
      readTime: 9,
      date: "Nov 20, 2024",
      description: "Develop emotional intelligence skills that will strengthen your relationship and deepen your connection.",
      tags: ['emotional intelligence', 'growth', 'skills']
    },
    {
      id: 6,
      title: "Navigating Long-Distance Relationships Successfully",
      author: "David Kim",
      category: 'challenges',
      readTime: 11,
      date: "Nov 15, 2024",
      description: "Proven strategies for maintaining intimacy and connection when you're miles apart.",
      tags: ['long-distance', 'connection', 'strategies']
    }
  ];

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(article => article.category === selectedCategory);

  const handleSubscribe = (e) => {
    e.preventDefault();
    toast.success(t.subscribed);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Sticky Header with navigation and title */}
      <div className="bg-white shadow-sm border-b border-purple-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              to={createPageUrl("CoupleSupport")}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
            >
              <ArrowLeft size={20} className="mr-2" />
              {t.back}
            </Link>
            <div className="flex items-center">
              <BookOpen className="text-purple-500 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t.title}
                </h1>
                <p className="text-sm text-gray-600">
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Browse by Category */}
        <div className="mb-12">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t.category}</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {selectedCategory === 'all' ? t.featuredArticles : t.allArticles}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                        {categories.find(c => c.id === article.category)?.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {article.readTime} {t.minRead}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 mb-2">
                      {article.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      By {article.author} • {article.date}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {article.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      {t.readArticle}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white shadow-2xl"
        >
          <Mail className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            {t.newsletterTitle}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t.newsletterSubtitle}
          </p>
          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex gap-3">
            <Input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-14 text-lg text-gray-900"
              required
            />
            <Button type="submit" size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
              {t.subscribe}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
