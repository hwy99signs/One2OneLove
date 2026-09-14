from pathlib import Path
import re


def must_replace(path, old, new, count=1):
    p = Path(path)
    text = p.read_text()
    found = text.count(old)
    if found < count:
        raise SystemExit(f"Expected {count} occurrence(s) in {path}, found {found}: {old[:120]!r}")
    p.write_text(text.replace(old, new, count))

# 1) Trial becomes full/Exclusive-level access. Basic becomes 4 SMS Love Notes/month.
must_replace(
    'worker/billing.ts',
    "return { smsLoveNotesMonthly: 8, smsLoveNotesDaily: null, dateIdeasMonthly: 1, loveNoteCategories: 6 };",
    "return { smsLoveNotesMonthly: 4, smsLoveNotesDaily: null, dateIdeasMonthly: 1, loveNoteCategories: 6 };",
)
must_replace(
    'worker/billing.ts',
    "const effectivePlan = user?.subscription_status === 'trial' ? 'Premiere' : storedPlan;",
    "const effectivePlan = user?.subscription_status === 'trial' ? 'Exclusive' : storedPlan;",
)
must_replace(
    'worker/billing.ts',
    "trial_entitlement: user?.subscription_status === 'trial' ? 'Premiere' : null",
    "trial_entitlement: user?.subscription_status === 'trial' ? 'Exclusive' : null",
)
must_replace('worker/billing.ts', "params.set('metadata[trial_entitlement]', 'Premiere');", "params.set('metadata[trial_entitlement]', 'Exclusive');")
must_replace('worker/billing.ts', "params.set('subscription_data[metadata][trial_entitlement]', 'Premiere');", "params.set('subscription_data[metadata][trial_entitlement]', 'Exclusive');")

# 2) Update the visible 7-day trial copy to full-platform access.
p = Path('src/pages/Subscription.jsx')
text = p.read_text()
start = text.index('const TRIAL_COPY = {')
end = text.index('\n\nconst tierBase', start)
trial = """const TRIAL_COPY = {
  en: { title: '7 Days of Full One2OneLove Access', body: 'Add a credit or debit card to start. You will not be charged today. For 7 days you receive full One2OneLove access, including Exclusive-level features. After 7 days, your membership continues on Basic at $4.99/month unless you choose Premier, Exclusive, or cancel.', start: 'Start 7-Day Full Access Trial', starting: 'Opening secure checkout...', active: 'Your 7-day Full Access trial is active.' },
  es: { title: '7 Días de Acceso Completo a One2OneLove', body: 'Agrega una tarjeta de crédito o débito para comenzar. No se te cobrará hoy. Durante 7 días tendrás acceso completo a One2OneLove. Después, tu membresía continúa en Básico por $4.99/mes a menos que elijas Premier, Exclusive o canceles.', start: 'Comenzar 7 Días de Acceso Completo', starting: 'Abriendo pago seguro...', active: 'Tu prueba de acceso completo está activa.' },
  fr: { title: '7 Jours d’Accès Complet à One2OneLove', body: 'Ajoutez une carte de crédit ou de débit pour commencer. Aucun prélèvement aujourd’hui. Pendant 7 jours, vous bénéficiez d’un accès complet à One2OneLove. Ensuite, votre abonnement continue en Basic à 4,99 $/mois sauf si vous choisissez Premier, Exclusive ou annulez.', start: 'Commencer 7 Jours d’Accès Complet', starting: 'Ouverture du paiement sécurisé...', active: 'Votre essai d’accès complet est actif.' },
  it: { title: '7 Giorni di Accesso Completo a One2OneLove', body: 'Aggiungi una carta di credito o debito per iniziare. Oggi non verrà addebitato nulla. Per 7 giorni avrai accesso completo a One2OneLove. Dopo, l’abbonamento continua con Basic a $4,99/mese salvo scelta di Premier, Exclusive o annullamento.', start: 'Inizia 7 Giorni di Accesso Completo', starting: 'Apertura del pagamento sicuro...', active: 'La prova di accesso completo è attiva.' },
  de: { title: '7 Tage Vollzugriff auf One2OneLove', body: 'Fügen Sie zum Start eine Kredit- oder Debitkarte hinzu. Heute erfolgt keine Belastung. Sie erhalten 7 Tage vollständigen One2OneLove-Zugriff. Danach läuft Ihre Mitgliedschaft mit Basic für 4,99 $/Monat weiter, sofern Sie nicht Premier, Exclusive wählen oder kündigen.', start: '7 Tage Vollzugriff Starten', starting: 'Sicherer Checkout wird geöffnet...', active: 'Ihr Vollzugriff-Test ist aktiv.' },
  nl: { title: '7 Dagen Volledige One2OneLove-Toegang', body: 'Voeg een creditcard of betaalpas toe om te starten. Vandaag wordt niets afgeschreven. Je krijgt 7 dagen volledige toegang tot One2OneLove. Daarna gaat je lidmaatschap verder met Basic voor $4,99/maand, tenzij je Premier, Exclusive kiest of opzegt.', start: 'Start 7 Dagen Volledige Toegang', starting: 'Beveiligde checkout openen...', active: 'Je proefperiode met volledige toegang is actief.' },
  pt: { title: '7 Dias de Acesso Completo ao One2OneLove', body: 'Adicione um cartão de crédito ou débito para começar. Nada será cobrado hoje. Durante 7 dias você terá acesso completo ao One2OneLove. Depois, sua assinatura continua no Basic por US$ 4,99/mês, a menos que escolha Premier, Exclusive ou cancele.', start: 'Começar 7 Dias de Acesso Completo', starting: 'Abrindo checkout seguro...', active: 'Seu teste de acesso completo está ativo.' },
};"""
text = text[:start] + trial + text[end:]
p.write_text(text)

# 3) Launch surface: phase-two routes remain in source but direct navigation redirects home.
p = Path('src/pages/index.jsx')
text = p.read_text()
text = text.replace("import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';", "import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';")
phase_two_routes = [
    'CooperativeGames', 'AIContentCreator', 'RelationshipCoach', 'CounselingSupport',
    'InfluencersSupport', 'Leaderboard', 'Achievements', 'PremiumFeatures', 'WinACruise', 'Developer'
]
for name in phase_two_routes:
    old = f'<Route path="/{name}" element={{<{name} />}} />'
    new = f'<Route path="/{name}" element={{<Navigate to="/Home" replace />}} />'
    if old not in text:
        raise SystemExit(f'Missing route for {name}')
    text = text.replace(old, new, 1)
p.write_text(text)

# 4) Hide phase-two links from the main/mobile navigation without deleting their code.
p = Path('src/pages/Layout.jsx')
text = p.read_text()
for name in ['RelationshipCoach', 'AIContentCreator', 'WinACruise', 'Developer']:
    marker = f'to={{createPageUrl("{name}")}}'
    if marker not in text:
        raise SystemExit(f'Missing Layout link marker for {name}')
    text = text.replace(marker, marker + " style={{ display: 'none' }}")
p.write_text(text)

# 5) Home page: remove Cooperative Games and Find-a-Professional launch cards.
p = Path('src/pages/Home.jsx')
text = p.read_text()
for line in [
    '  ["🎮", "relationshipGames", "CooperativeGames", "from-orange-600 to-red-600"],\n',
    '  ["🩺", "findTherapist", "CounselingSupport", "from-emerald-600 to-teal-700"]\n',
    '  ["🩺", "findTherapist", "CounselingSupport", "from-emerald-600 to-teal-700"],\n',
]:
    text = text.replace(line, '')
p.write_text(text)

# 6) Relationship Support: remove AI coach and unfinished group/counseling/influencer categories; keep Goals visible.
must_replace(
    'src/pages/CoupleSupport.jsx',
    "const hiddenCategoryIds = new Set(['goals', 'groupActivities', 'counseling', 'influencers']);",
    "const hiddenCategoryIds = new Set(['aiCoach', 'groupActivities', 'counseling', 'influencers']);",
)

# 7) Couple Activities: remove Cooperative Games card only, preserving journals/quizzes/goals/memories/milestones.
p = Path('src/pages/CoupleActivities.jsx')
text = p.read_text()
pattern = re.compile(r"\n    \{\n      id: 'game',\n      name: t\.activities_types\.game,\n      description: t\.activities_types\.game_desc,\n      icon: Gamepad2,\n      color: 'from-green-500 to-emerald-500',\n      link: 'CooperativeGames',\n      category: 'fun'\n    \},")
text, n = pattern.subn('', text, count=1)
if n != 1:
    raise SystemExit('Could not remove Cooperative Games activity card')
p.write_text(text)

# 8) Subscription feature catalog: Basic 4 SMS; remove Cooperative Games and Achievements/Leaderboard claims.
p = Path('src/data/subscriptionPlanCopy.js')
text = p.read_text()
replacements = {
    '8 SMS Love Notes per month': '4 SMS Love Notes per month — about 1 per week',
    '8 Notas de Amor por SMS al mes': '4 Notas de Amor por SMS al mes — aproximadamente 1 por semana',
    '8 Notes d’Amour par SMS par mois': '4 Notes d’Amour par SMS par mois — environ 1 par semaine',
    '8 Note d’Amore via SMS al mese': '4 Note d’Amore via SMS al mese — circa 1 a settimana',
    '8 SMS-Liebesnotizen pro Monat': '4 SMS-Liebesnotizen pro Monat — etwa 1 pro Woche',
    '8 sms-liefdesnotities per maand': '4 sms-liefdesnotities per maand — ongeveer 1 per week',
    '8 Notas de Amor por SMS por mês': '4 Notas de Amor por SMS por mês — cerca de 1 por semana',
}
for old, new in replacements.items():
    text = text.replace(old, new)
# Remove game and achievement items across supported translations.
terms = [
    r"'3 of 6 Cooperative Games',?\s*", r"'All 6 Cooperative Games',?\s*",
    r"'3 de 6 Juegos Cooperativos',?\s*", r"'Los 6 Juegos Cooperativos',?\s*",
    r"'3 des 6 Jeux Coopératifs',?\s*", r"'Les 6 Jeux Coopératifs',?\s*",
    r"'3 dei 6 Giochi Cooperativi',?\s*", r"'Tutti i 6 Giochi Cooperativi',?\s*",
    r"'3 von 6 Kooperativen Spielen',?\s*", r"'Alle 6 Kooperativen Spiele',?\s*",
    r"'3 van de 6 Coöperatieve Spellen',?\s*", r"'Alle 6 Coöperatieve Spellen',?\s*",
    r"'3 de 6 Jogos Cooperativos',?\s*", r"'Todos os 6 Jogos Cooperativos',?\s*",
    r"'Achievements & Leaderboard',?\s*", r"'Logros y Clasificación',?\s*", r"'Réussites et Classement',?\s*",
    r"'Risultati e Classifica',?\s*", r"'Erfolge und Bestenliste',?\s*", r"'Prestaties en Ranglijst',?\s*",
    r"'Conquistas e Classificação',?\s*",
]
for term in terms:
    text = re.sub(term, '', text)
p.write_text(text)

print('Launch trim applied successfully.')
