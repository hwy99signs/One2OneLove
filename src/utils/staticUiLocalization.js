const LANGS = new Set(['en', 'es', 'fr', 'it', 'de']);
const tr = (es, fr, it, de) => ({ es, fr, it, de });

const UI = {
  'Passed': tr('Aprobado', 'Réussi', 'Superato', 'Bestanden'),
  'Failed': tr('Fallido', 'Échoué', 'Non riuscito', 'Fehlgeschlagen'),
  'Pending': tr('Pendiente', 'En attente', 'In sospeso', 'Ausstehend'),
  'Loading One2OneLove Admin': tr('Cargando administración de One2OneLove', 'Chargement de l’administration One2OneLove', 'Caricamento amministrazione One2OneLove', 'One2OneLove-Administration wird geladen'),
  'Verifying administrator access and loading platform data.': tr('Verificando el acceso de administrador y cargando los datos de la plataforma.', 'Vérification de l’accès administrateur et chargement des données de la plateforme.', 'Verifica dell’accesso amministratore e caricamento dei dati della piattaforma.', 'Administratorzugriff wird geprüft und Plattformdaten werden geladen.'),
  'This dashboard is restricted to an authorized One2OneLove administrator account.': tr('Este panel está restringido a una cuenta de administrador autorizada de One2OneLove.', 'Ce tableau de bord est réservé à un compte administrateur One2OneLove autorisé.', 'Questa dashboard è riservata a un account amministratore One2OneLove autorizzato.', 'Dieses Dashboard ist auf ein autorisiertes One2OneLove-Administratorkonto beschränkt.'),
  'Go back': tr('Volver', 'Retour', 'Indietro', 'Zurück'),
  'ADMIN CONTROL': tr('CONTROL DE ADMINISTRACIÓN', 'CONTRÔLE ADMINISTRATEUR', 'CONTROLLO AMMINISTRATORE', 'ADMIN-STEUERUNG'),
  'Analytics': tr('Analítica', 'Analytique', 'Analisi', 'Analysen'),
  'Secure admin-only access. Dashboard controls remain read-only during launch QA.': tr('Acceso seguro solo para administradores. Los controles del panel permanecen en modo de solo lectura durante las pruebas de lanzamiento.', 'Accès sécurisé réservé aux administrateurs. Les commandes du tableau de bord restent en lecture seule pendant les tests de lancement.', 'Accesso sicuro riservato agli amministratori. I controlli della dashboard restano in sola lettura durante i test di lancio.', 'Sicherer Zugriff nur für Administratoren. Die Dashboard-Steuerung bleibt während der Launch-Prüfung schreibgeschützt.'),
  'Exit Admin': tr('Salir de administración', 'Quitter l’administration', 'Esci dall’amministrazione', 'Administration verlassen'),
  'Operations Dashboard': tr('Panel de operaciones', 'Tableau de bord des opérations', 'Dashboard operativo', 'Betriebs-Dashboard'),
  'Preview': tr('Vista previa', 'Aperçu', 'Anteprima', 'Vorschau'),
  'Refresh': tr('Actualizar', 'Actualiser', 'Aggiorna', 'Aktualisieren'),
  'members': tr('miembros', 'membres', 'membri', 'Mitglieder'),
  'Passed, Failed and Pending will populate from carrier delivery receipts after the SMS provider callback is connected. Until then, they remain zero rather than estimating.': tr('Aprobado, Fallido y Pendiente se completarán con los recibos de entrega del operador cuando se conecte la devolución de llamada del proveedor de SMS. Hasta entonces permanecerán en cero en lugar de estimarse.', 'Réussi, Échoué et En attente seront alimentés par les accusés de livraison de l’opérateur lorsque le rappel du fournisseur SMS sera connecté. D’ici là, ils resteront à zéro au lieu d’être estimés.', 'Superato, Non riuscito e In sospeso saranno popolati dalle ricevute di consegna dell’operatore quando verrà collegato il callback del provider SMS. Fino ad allora resteranno a zero invece di essere stimati.', 'Bestanden, Fehlgeschlagen und Ausstehend werden nach Anschluss des SMS-Provider-Callbacks aus den Zustellbelegen des Mobilfunkanbieters befüllt. Bis dahin bleiben sie bei null, statt geschätzt zu werden.'),
  '30 days': tr('30 días', '30 jours', '30 giorni', '30 Tage'),
  'All activity': tr('Toda la actividad', 'Toute l’activité', 'Tutta l’attività', 'Alle Aktivitäten'),
  'Avg/user': tr('Prom./usuario', 'Moy./utilisateur', 'Media/utente', 'Ø/Benutzer'),
  'Feature activity will appear as members use the platform.': tr('La actividad de funciones aparecerá a medida que los miembros usen la plataforma.', 'L’activité des fonctionnalités apparaîtra à mesure que les membres utiliseront la plateforme.', 'L’attività delle funzionalità apparirà man mano che i membri utilizzeranno la piattaforma.', 'Die Funktionsaktivität erscheint, sobald Mitglieder die Plattform nutzen.'),
  'Feature': tr('Función', 'Fonctionnalité', 'Funzionalità', 'Funktion'),
  'Unique Users': tr('Usuarios únicos', 'Utilisateurs uniques', 'Utenti unici', 'Eindeutige Benutzer'),
  '7 Days': tr('7 días', '7 jours', '7 giorni', '7 Tage'),
  '30 Days': tr('30 días', '30 jours', '30 giorni', '30 Tage'),
  'Total Activity': tr('Actividad total', 'Activité totale', 'Attività totale', 'Gesamtaktivität'),
  'Avg / User': tr('Prom. / usuario', 'Moy. / utilisateur', 'Media / utente', 'Ø / Benutzer'),
  'Last Used': tr('Último uso', 'Dernière utilisation', 'Ultimo utilizzo', 'Zuletzt verwendet'),
  'Member': tr('Miembro', 'Membre', 'Membro', 'Mitglied'),
  'Type': tr('Tipo', 'Type', 'Tipo', 'Typ'),
  'Plan': tr('Plan', 'Forfait', 'Piano', 'Tarif'),
  'Status': tr('Estado', 'Statut', 'Stato', 'Status'),
  'Joined': tr('Se unió', 'Inscrit', 'Iscritto', 'Beigetreten'),
  'No plan movements recorded yet.': tr('Aún no se han registrado cambios de plan.', 'Aucun changement de forfait enregistré pour le moment.', 'Nessun cambio di piano registrato finora.', 'Noch keine Tarifänderungen erfasst.'),
  'No payment records yet.': tr('Aún no hay registros de pagos.', 'Aucun paiement enregistré pour le moment.', 'Nessun pagamento registrato finora.', 'Noch keine Zahlungsdatensätze vorhanden.'),
  'Note': tr('Nota', 'Note', 'Nota', 'Notiz'),
  'Delivery': tr('Entrega', 'Livraison', 'Consegna', 'Zustellung'),
  'Scheduled': tr('Programado', 'Programmé', 'Programmato', 'Geplant'),
  'No scheduled Love Notes yet.': tr('Aún no hay Notas de Amor programadas.', 'Aucune Note d’Amour programmée pour le moment.', 'Nessuna Nota d’Amore programmata finora.', 'Noch keine Liebesbotschaften geplant.'),
  'No professional applications yet.': tr('Aún no hay solicitudes profesionales.', 'Aucune candidature professionnelle pour le moment.', 'Nessuna candidatura professionale finora.', 'Noch keine professionellen Bewerbungen.'),
  'No items waiting in moderation.': tr('No hay elementos pendientes de moderación.', 'Aucun élément en attente de modération.', 'Nessun elemento in attesa di moderazione.', 'Keine Elemente warten auf Moderation.'),
  'No AI usage recorded.': tr('No se ha registrado uso de IA.', 'Aucune utilisation de l’IA enregistrée.', 'Nessun utilizzo dell’IA registrato.', 'Keine KI-Nutzung erfasst.'),
  'No migration records found.': tr('No se encontraron registros de migración.', 'Aucun enregistrement de migration trouvé.', 'Nessun record di migrazione trovato.', 'Keine Migrationsdatensätze gefunden.'),

  'Progress:': tr('Progreso:', 'Progression :', 'Progresso:', 'Fortschritt:'),
  '1 per platform': tr('1 por plataforma', '1 par plateforme', '1 per piattaforma', '1 pro Plattform'),
  'Email': tr('Correo electrónico', 'E-mail', 'E-mail', 'E-Mail'),
  'Your Friends': tr('Tus amigos', 'Vos amis', 'I tuoi amici', 'Ihre Freunde'),
  'Pending Requests': tr('Solicitudes pendientes', 'Demandes en attente', 'Richieste in sospeso', 'Ausstehende Anfragen'),
  "You don't have any buddies yet": tr('Aún no tienes amigos', 'Vous n’avez pas encore d’amis', 'Non hai ancora amici', 'Sie haben noch keine Freunde'),
  'Find Your First Buddy': tr('Encuentra a tu primer amigo', 'Trouvez votre premier ami', 'Trova il tuo primo amico', 'Finden Sie Ihren ersten Freund'),
  'Loading users...': tr('Cargando usuarios...', 'Chargement des utilisateurs...', 'Caricamento utenti...', 'Benutzer werden geladen...'),
  '2 sends per $1 · credits do not expire while your account remains active.': tr('2 envíos por $1 · los créditos no vencen mientras tu cuenta permanezca activa.', '2 envois par 1 $ · les crédits n’expirent pas tant que votre compte reste actif.', '2 invii per 1 $ · i crediti non scadono finché il tuo account resta attivo.', '2 Sendungen pro 1 $ · Guthaben verfällt nicht, solange Ihr Konto aktiv bleibt.'),
  'Monthly Winner': tr('Ganador mensual', 'Gagnant mensuel', 'Vincitore mensile', 'Monatlicher Gewinner'),
  'Grand Prize Winner': tr('Ganador del gran premio', 'Gagnant du grand prix', 'Vincitore del gran premio', 'Hauptpreisgewinner'),
  'Additional Rewards': tr('Recompensas adicionales', 'Récompenses supplémentaires', 'Premi aggiuntivi', 'Zusätzliche Belohnungen'),
  'Start Competing Today!': tr('¡Empieza a competir hoy!', 'Commencez à participer dès aujourd’hui !', 'Inizia a competere oggi!', 'Machen Sie ab heute mit!'),
  'The more you engage and strengthen your relationship, the more chances you have to win!': tr('Cuanto más participes y fortalezcas tu relación, más oportunidades tendrás de ganar.', 'Plus vous participez et renforcez votre relation, plus vous avez de chances de gagner !', 'Più partecipi e rafforzi la tua relazione, più possibilità hai di vincere!', 'Je mehr Sie sich beteiligen und Ihre Beziehung stärken, desto größer sind Ihre Gewinnchancen!'),
  'Loading profile...': tr('Cargando perfil...', 'Chargement du profil...', 'Caricamento profilo...', 'Profil wird geladen...'),
  'Start Practice': tr('Iniciar práctica', 'Commencer l’exercice', 'Inizia la pratica', 'Übung starten'),
  '← Back': tr('← Volver', '← Retour', '← Indietro', '← Zurück'),
  'AI Relationship Coach': tr('Coach de relaciones con IA', 'Coach relationnel IA', 'Coach relazionale IA', 'KI-Beziehungscoach'),
  'Back to One2OneLove': tr('Volver a One2OneLove', 'Retour à One2OneLove', 'Torna a One2OneLove', 'Zurück zu One2OneLove'),
  'Admin Verification': tr('Verificación de administrador', 'Vérification administrateur', 'Verifica amministratore', 'Administratorbestätigung'),
  'For added security, entering One2OneLove Admin requires a second verification step.': tr('Para mayor seguridad, entrar al área de administración de One2OneLove requiere un segundo paso de verificación.', 'Pour plus de sécurité, l’accès à l’administration One2OneLove nécessite une deuxième étape de vérification.', 'Per maggiore sicurezza, l’accesso all’amministrazione One2OneLove richiede un secondo passaggio di verifica.', 'Für zusätzliche Sicherheit erfordert der Zugriff auf die One2OneLove-Administration einen zweiten Bestätigungsschritt.'),
  'Enter the 6-digit code sent to': tr('Ingresa el código de 6 dígitos enviado a', 'Entrez le code à 6 chiffres envoyé à', 'Inserisci il codice a 6 cifre inviato a', 'Geben Sie den 6-stelligen Code ein, der gesendet wurde an'),
  'The code expires in about 5 minutes. Refreshing this page will no longer replace a still-valid code.': tr('El código vence en unos 5 minutos. Actualizar esta página ya no reemplazará un código que siga siendo válido.', 'Le code expire dans environ 5 minutes. Actualiser cette page ne remplacera plus un code encore valide.', 'Il codice scade tra circa 5 minuti. Aggiornare questa pagina non sostituirà più un codice ancora valido.', 'Der Code läuft nach etwa 5 Minuten ab. Durch Aktualisieren dieser Seite wird ein noch gültiger Code nicht mehr ersetzt.'),
  '6-digit verification code': tr('Código de verificación de 6 dígitos', 'Code de vérification à 6 chiffres', 'Codice di verifica a 6 cifre', '6-stelliger Bestätigungscode'),
  'Developer Access': tr('Acceso de desarrollador', 'Accès développeur', 'Accesso sviluppatore', 'Entwicklerzugriff'),
  'Quick access to all pages and profile types': tr('Acceso rápido a todas las páginas y tipos de perfil', 'Accès rapide à toutes les pages et tous les types de profil', 'Accesso rapido a tutte le pagine e ai tipi di profilo', 'Schnellzugriff auf alle Seiten und Profiltypen'),
  'Saving...': tr('Guardando...', 'Enregistrement...', 'Salvataggio...', 'Wird gespeichert...'),
  'Save to Profile': tr('Guardar en el perfil', 'Enregistrer dans le profil', 'Salva nel profilo', 'Im Profil speichern'),
  'Saved to Profile': tr('Guardado en el perfil', 'Enregistré dans le profil', 'Salvato nel profilo', 'Im Profil gespeichert'),
  'Loading Analytics': tr('Cargando analítica', 'Chargement de l’analytique', 'Caricamento analisi', 'Analysen werden geladen'),
  'Building your One2OneLove trend view.': tr('Preparando tu vista de tendencias de One2OneLove.', 'Préparation de votre vue des tendances One2OneLove.', 'Preparazione della vista delle tendenze One2OneLove.', 'Ihre One2OneLove-Trendansicht wird erstellt.'),
  'Analytics is restricted to an authorized One2OneLove administrator account.': tr('La analítica está restringida a una cuenta de administrador autorizada de One2OneLove.', 'L’analytique est réservée à un compte administrateur One2OneLove autorisé.', 'Le analisi sono riservate a un account amministratore One2OneLove autorizzato.', 'Analysen sind auf ein autorisiertes One2OneLove-Administratorkonto beschränkt.'),
  'One2OneLove Admin': tr('Administración de One2OneLove', 'Administration One2OneLove', 'Amministrazione One2OneLove', 'One2OneLove-Administration'),
  '30-Day Trend View': tr('Vista de tendencias de 30 días', 'Vue des tendances sur 30 jours', 'Vista tendenze a 30 giorni', '30-Tage-Trendansicht'),
  'Graphs are built from actual One2OneLove records and feature-use events. They will become more meaningful as launch traffic grows.': tr('Los gráficos se crean con registros reales de One2OneLove y eventos de uso de funciones. Serán más significativos a medida que aumente el tráfico tras el lanzamiento.', 'Les graphiques sont construits à partir de données réelles One2OneLove et d’événements d’utilisation des fonctionnalités. Ils deviendront plus pertinents à mesure que le trafic de lancement augmentera.', 'I grafici sono costruiti con dati reali di One2OneLove ed eventi di utilizzo delle funzionalità. Diventeranno più significativi con l’aumento del traffico dopo il lancio.', 'Die Diagramme basieren auf tatsächlichen One2OneLove-Datensätzen und Nutzungsereignissen. Mit wachsendem Launch-Traffic werden sie aussagekräftiger.'),
  'Direct-send delivery status:': tr('Estado de entrega de envíos directos:', 'État de livraison des envois directs :', 'Stato di consegna degli invii diretti:', 'Zustellstatus direkter Sendungen:'),
  'Generate Content': tr('Generar contenido', 'Générer du contenu', 'Genera contenuto', 'Inhalt erstellen'),
  'Fill in the form and click generate to create AI-powered content': tr('Completa el formulario y pulsa generar para crear contenido con IA', 'Remplissez le formulaire et cliquez sur générer pour créer du contenu assisté par IA', 'Compila il modulo e fai clic su genera per creare contenuti con IA', 'Füllen Sie das Formular aus und klicken Sie auf Erstellen, um KI-gestützte Inhalte zu erzeugen'),
  'Current Level': tr('Nivel actual', 'Niveau actuel', 'Livello attuale', 'Aktuelle Stufe'),
  'Unlock exclusive features & content': tr('Desbloquea funciones y contenido exclusivos', 'Débloquez des fonctionnalités et contenus exclusifs', 'Sblocca funzionalità e contenuti esclusivi', 'Exklusive Funktionen und Inhalte freischalten'),
  'Advanced Analytics': tr('Analítica avanzada', 'Analytique avancée', 'Analisi avanzate', 'Erweiterte Analysen'),
  'Exclusive Dates': tr('Citas exclusivas', 'Rendez-vous exclusifs', 'Appuntamenti esclusivi', 'Exklusive Dates'),
  'Guided Meditations': tr('Meditaciones guiadas', 'Méditations guidées', 'Meditazioni guidate', 'Geführte Meditationen'),
  'Custom Themes': tr('Temas personalizados', 'Thèmes personnalisés', 'Temi personalizzati', 'Benutzerdefinierte Designs'),

  'Join the Waitlist': tr('Únete a la lista de espera', 'Rejoindre la liste d’attente', 'Unisciti alla lista d’attesa', 'Auf die Warteliste setzen'),
  'Be the first to know when we launch in your country!': tr('¡Sé de los primeros en saber cuándo lancemos en tu país!', 'Soyez parmi les premiers informés de notre lancement dans votre pays !', 'Scopri per primo quando lanceremo nel tuo Paese!', 'Erfahren Sie als Erste, wann wir in Ihrem Land starten!'),
  'Enter your email address': tr('Ingresa tu correo electrónico', 'Entrez votre adresse e-mail', 'Inserisci il tuo indirizzo e-mail', 'Geben Sie Ihre E-Mail-Adresse ein'),
  'Select your country': tr('Selecciona tu país', 'Sélectionnez votre pays', 'Seleziona il tuo Paese', 'Wählen Sie Ihr Land'),
  'Joining...': tr('Uniéndote...', 'Inscription...', 'Iscrizione...', 'Wird eingetragen...'),
  'What Couples Are Saying': tr('Lo que dicen las parejas', 'Ce que disent les couples', 'Cosa dicono le coppie', 'Was Paare sagen'),
  'Real stories from real couples using One 2 One Love': tr('Historias reales de parejas reales que usan One 2 One Love', 'Des histoires vraies de vrais couples utilisant One 2 One Love', 'Storie vere di coppie reali che usano One 2 One Love', 'Echte Geschichten von echten Paaren, die One 2 One Love nutzen'),
  '🌍 ALL-INCLUSIVE RELATIONSHIP PLATFORM 🌍': tr('🌍 PLATAFORMA DE RELACIONES INCLUSIVA 🌍', '🌍 PLATEFORME RELATIONNELLE INCLUSIVE 🌍', '🌍 PIATTAFORMA RELAZIONALE INCLUSIVA 🌍', '🌍 INKLUSIVE BEZIEHUNGSPLATTFORM 🌍'),
  'For Everyone': tr('Para todos', 'Pour tous', 'Per tutti', 'Für alle'),
  'LGBTQ+, interfaith, interracial, monogamous, polyamorous - all relationships are honored and supported.': tr('LGBTQ+, interreligiosas, interraciales, monógamas y poliamorosas: todas las relaciones son respetadas y apoyadas.', 'LGBTQ+, interreligieuses, interraciales, monogames ou polyamoureuses : toutes les relations sont respectées et soutenues.', 'LGBTQ+, interreligiose, interrazziali, monogame o poliamorose: tutte le relazioni sono rispettate e sostenute.', 'LGBTQ+, interreligiös, interracial, monogam oder polyamor – alle Beziehungen werden respektiert und unterstützt.'),
  'Diverse Content': tr('Contenido diverso', 'Contenu diversifié', 'Contenuti diversi', 'Vielfältige Inhalte'),
  'Articles, podcasts, and resources that reflect the beautiful diversity of modern relationships.': tr('Artículos, podcasts y recursos que reflejan la diversidad de las relaciones modernas.', 'Des articles, podcasts et ressources qui reflètent la diversité des relations modernes.', 'Articoli, podcast e risorse che riflettono la diversità delle relazioni moderne.', 'Artikel, Podcasts und Ressourcen, die die Vielfalt moderner Beziehungen widerspiegeln.'),
  'Safe Space': tr('Espacio seguro', 'Espace sûr', 'Spazio sicuro', 'Sicherer Raum'),
  'A judgment-free zone where your love story is respected, celebrated, and empowered.': tr('Un espacio sin juicios donde tu historia de amor es respetada, celebrada y fortalecida.', 'Un espace sans jugement où votre histoire d’amour est respectée, célébrée et valorisée.', 'Uno spazio senza giudizio in cui la tua storia d’amore è rispettata, celebrata e valorizzata.', 'Ein urteilsfreier Raum, in dem Ihre Liebesgeschichte respektiert, gefeiert und gestärkt wird.'),
  '⚠️ THIS IS NOT A DATING SITE!! ⚠️': tr('⚠️ ¡ESTO NO ES UN SITIO DE CITAS! ⚠️', '⚠️ CE N’EST PAS UN SITE DE RENCONTRES ! ⚠️', '⚠️ QUESTO NON È UN SITO DI INCONTRI! ⚠️', '⚠️ DIES IST KEINE DATING-SEITE! ⚠️'),
  'One 2 One Love is for couples to strengthen their existing relationships': tr('One 2 One Love ayuda a las parejas a fortalecer sus relaciones existentes', 'One 2 One Love aide les couples à renforcer leur relation existante', 'One 2 One Love aiuta le coppie a rafforzare le relazioni esistenti', 'One 2 One Love hilft Paaren, ihre bestehende Beziehung zu stärken'),
  'Waitlisted Users': tr('Usuarios en lista de espera', 'Utilisateurs sur liste d’attente', 'Utenti in lista d’attesa', 'Benutzer auf der Warteliste'),
  'Countries Worldwide': tr('Países de todo el mundo', 'Pays dans le monde', 'Paesi nel mondo', 'Länder weltweit'),
  'Launching Worldwide in December 2025': tr('Lanzamiento mundial en diciembre de 2025', 'Lancement mondial en décembre 2025', 'Lancio mondiale a dicembre 2025', 'Weltweiter Start im Dezember 2025'),
  'Available in 5 Languages:': tr('Disponible en 5 idiomas:', 'Disponible en 5 langues :', 'Disponibile in 5 lingue:', 'Verfügbar in 5 Sprachen:'),
  'Everything You Need for a': tr('Todo lo que necesitas para una', 'Tout ce qu’il vous faut pour une', 'Tutto ciò che serve per una', 'Alles, was Sie brauchen für eine'),
  'Perfect Relationship': tr('Relación perfecta', 'Relation épanouie', 'Relazione perfetta', 'Erfüllte Beziehung'),
  '✨ Featured This Week ✨': tr('✨ Destacado esta semana ✨', '✨ À la une cette semaine ✨', '✨ In evidenza questa settimana ✨', '✨ Diese Woche empfohlen ✨'),
  'Relationship Therapist': tr('Terapeuta de relaciones', 'Thérapeute de couple', 'Terapeuta relazionale', 'Beziehungstherapeutin'),
  'Listen Now': tr('Escuchar ahora', 'Écouter maintenant', 'Ascolta ora', 'Jetzt anhören'),
  '🎁 Pro Tip: Share with your partner! 💕': tr('🎁 Consejo: ¡Compártelo con tu pareja! 💕', '🎁 Astuce : partagez-le avec votre partenaire ! 💕', '🎁 Suggerimento: condividilo con il tuo partner! 💕', '🎁 Tipp: Teilen Sie es mit Ihrem Partner! 💕'),
  'Platform Features & Resources': tr('Funciones y recursos de la plataforma', 'Fonctionnalités et ressources de la plateforme', 'Funzionalità e risorse della piattaforma', 'Plattformfunktionen und Ressourcen'),
  'Good morning sunshine! ☀️ I hope your day is as beautiful as you are. 💕': tr('¡Buenos días, mi sol! ☀️ Espero que tu día sea tan hermoso como tú. 💕', 'Bonjour mon soleil ! ☀️ J’espère que ta journée sera aussi belle que toi. 💕', 'Buongiorno, raggio di sole! ☀️ Spero che la tua giornata sia bella quanto te. 💕', 'Guten Morgen, Sonnenschein! ☀️ Ich hoffe, dein Tag wird so schön wie du. 💕'),
  'Reply with Love Note': tr('Responder con una Nota de Amor', 'Répondre avec une Note d’Amour', 'Rispondi con una Nota d’Amore', 'Mit Liebesbotschaft antworten'),
  'Save to Favorites': tr('Guardar en favoritos', 'Enregistrer dans les favoris', 'Salva nei preferiti', 'Zu Favoriten hinzufügen'),
  '"This is how your love note magically appears on their phone if they are also subscribed to \'One 2 One Love\'."': tr('"Así aparece mágicamente tu nota de amor en su teléfono si también está suscrito a \'One 2 One Love\'."', '« Voici comment votre note d’amour apparaît comme par magie sur son téléphone s’il est également abonné à \'One 2 One Love\'. »', '"Ecco come la tua nota d’amore appare magicamente sul suo telefono se anche lui/lei è iscritto a \'One 2 One Love\'."', '„So erscheint Ihre Liebesbotschaft wie von Zauberhand auf dem Telefon, wenn die andere Person ebenfalls \'One 2 One Love\' abonniert hat.“'),
  'Send Love Notes': tr('Enviar Notas de Amor', 'Envoyer des Notes d’Amour', 'Invia Note d’Amore', 'Liebesbotschaften senden'),
  'Pre-written romantic messages in multiple languages': tr('Mensajes románticos preescritos en varios idiomas', 'Messages romantiques préécrits en plusieurs langues', 'Messaggi romantici predefiniti in più lingue', 'Vorformulierte romantische Nachrichten in mehreren Sprachen'),
  'Custom note creator with beautiful templates': tr('Creador de notas personalizadas con hermosas plantillas', 'Créateur de notes personnalisées avec de beaux modèles', 'Creatore di note personalizzate con splendidi modelli', 'Ersteller für individuelle Notizen mit schönen Vorlagen'),
  'Schedule notes for special occasions': tr('Programa notas para ocasiones especiales', 'Programmez des notes pour les occasions spéciales', 'Programma note per occasioni speciali', 'Notizen für besondere Anlässe planen'),

  'Parameters:': tr('Parámetros:', 'Paramètres :', 'Parametri:', 'Parameter:'),
  'Result:': tr('Resultado:', 'Résultat :', 'Risultato:', 'Ergebnis:'),
  'Today': tr('Hoy', 'Aujourd’hui', 'Oggi', 'Heute'),
  'AI-Personalized Love Note': tr('Nota de Amor personalizada con IA', 'Note d’Amour personnalisée par IA', 'Nota d’Amore personalizzata con IA', 'KI-personalisierte Liebesbotschaft'),
  "Partner's Personality Traits *": tr('Rasgos de personalidad de tu pareja *', 'Traits de personnalité de votre partenaire *', 'Tratti della personalità del partner *', 'Persönlichkeitsmerkmale Ihres Partners *'),
  'Select 2-5 traits that best describe your partner': tr('Selecciona de 2 a 5 rasgos que mejor describan a tu pareja', 'Sélectionnez 2 à 5 traits qui décrivent le mieux votre partenaire', 'Seleziona 2-5 tratti che descrivono meglio il tuo partner', 'Wählen Sie 2–5 Merkmale, die Ihren Partner am besten beschreiben'),
  'Note Style': tr('Estilo de la nota', 'Style de la note', 'Stile della nota', 'Stil der Nachricht'),
  'Shared Memories (Optional)': tr('Recuerdos compartidos (opcional)', 'Souvenirs partagés (facultatif)', 'Ricordi condivisi (facoltativo)', 'Gemeinsame Erinnerungen (optional)'),
  'The AI will naturally weave these into the note': tr('La IA incorporará estos recuerdos de forma natural en la nota', 'L’IA intégrera naturellement ces souvenirs dans la note', 'L’IA integrerà naturalmente questi ricordi nella nota', 'Die KI wird diese Erinnerungen natürlich in die Nachricht einbauen'),
  'Inside Jokes (Optional)': tr('Bromas privadas (opcional)', 'Blagues entre vous (facultatif)', 'Battute private (facoltativo)', 'Insider-Witze (optional)'),
  'Add personal touches only you two understand': tr('Añade detalles personales que solo ustedes dos entiendan', 'Ajoutez des touches personnelles que vous seuls comprenez', 'Aggiungi dettagli personali che solo voi due capite', 'Fügen Sie persönliche Details hinzu, die nur Sie beide verstehen'),
  '✨ How it works:': tr('✨ Cómo funciona:', '✨ Comment ça marche :', '✨ Come funziona:', '✨ So funktioniert es:'),
  "• AI analyzes your partner's personality traits": tr('• La IA analiza los rasgos de personalidad de tu pareja', '• L’IA analyse les traits de personnalité de votre partenaire', '• L’IA analizza i tratti della personalità del partner', '• Die KI analysiert die Persönlichkeitsmerkmale Ihres Partners'),
  '• Crafts a unique note in their preferred tone': tr('• Crea una nota única con su tono preferido', '• Crée une note unique dans le ton qui lui convient', '• Crea una nota unica nel tono preferito', '• Erstellt eine einzigartige Nachricht im bevorzugten Ton'),
  '• Weaves in your shared memories naturally': tr('• Integra de forma natural sus recuerdos compartidos', '• Intègre naturellement vos souvenirs partagés', '• Integra naturalmente i vostri ricordi condivisi', '• Baut gemeinsame Erinnerungen natürlich ein'),
  '• Adds subtle references to your inside jokes': tr('• Añade referencias sutiles a sus bromas privadas', '• Ajoute des références subtiles à vos blagues personnelles', '• Aggiunge riferimenti discreti alle vostre battute private', '• Fügt dezente Anspielungen auf Ihre Insider-Witze hinzu'),
  'Cancel': tr('Cancelar', 'Annuler', 'Annulla', 'Abbrechen'),
  'Generating...': tr('Generando...', 'Génération...', 'Generazione...', 'Wird erstellt...'),
  'Generate Love Note': tr('Generar Nota de Amor', 'Générer une Note d’Amour', 'Genera Nota d’Amore', 'Liebesbotschaft erstellen'),

  'Previous slide': tr('Diapositiva anterior', 'Diapositive précédente', 'Slide precedente', 'Vorherige Folie'),
  'Next slide': tr('Diapositiva siguiente', 'Diapositive suivante', 'Slide successiva', 'Nächste Folie'),
  'More': tr('Más', 'Plus', 'Altro', 'Mehr'),
  'Toggle Sidebar': tr('Alternar barra lateral', 'Afficher/masquer la barre latérale', 'Mostra/nascondi barra laterale', 'Seitenleiste ein-/ausblenden'),
  'Previous': tr('Anterior', 'Précédent', 'Precedente', 'Zurück'),
  'Next': tr('Siguiente', 'Suivant', 'Avanti', 'Weiter'),
  'More pages': tr('Más páginas', 'Plus de pages', 'Altre pagine', 'Weitere Seiten'),
  'Close': tr('Cerrar', 'Fermer', 'Chiudi', 'Schließen'),
  '🎉 Goal Reached!': tr('🎉 ¡Meta alcanzada!', '🎉 Objectif atteint !', '🎉 Obiettivo raggiunto!', '🎉 Ziel erreicht!'),
  'Start activities to earn badges!': tr('¡Empieza actividades para ganar insignias!', 'Commencez des activités pour gagner des badges !', 'Inizia le attività per ottenere badge!', 'Starten Sie Aktivitäten, um Abzeichen zu verdienen!'),
  'Play Now': tr('Jugar ahora', 'Jouer maintenant', 'Gioca ora', 'Jetzt spielen'),
  'Title': tr('Título', 'Titre', 'Titolo', 'Titel'),
  'Date': tr('Fecha', 'Date', 'Data', 'Datum'),
  'Mood': tr('Estado de ánimo', 'Humeur', 'Umore', 'Stimmung'),
  '😊 Happy': tr('😊 Feliz', '😊 Heureux', '😊 Felice', '😊 Glücklich'),
  '🙏 Grateful': tr('🙏 Agradecido', '🙏 Reconnaissant', '🙏 Grato', '🙏 Dankbar'),
  '🤔 Reflective': tr('🤔 Reflexivo', '🤔 Réfléchi', '🤔 Riflessivo', '🤔 Nachdenklich'),
  '🎉 Excited': tr('🎉 Emocionado', '🎉 Enthousiaste', '🎉 Entusiasta', '🎉 Begeistert'),
  '😌 Peaceful': tr('😌 En paz', '😌 Paisible', '😌 Sereno', '😌 Friedlich'),
  '💪 Challenged': tr('💪 Desafiado', '💪 Mis au défi', '💪 Messo alla prova', '💪 Gefordert'),
  '❤️ Loving': tr('❤️ Amoroso', '❤️ Aimant', '❤️ Affettuoso', '❤️ Liebevoll'),
  'Your Thoughts': tr('Tus pensamientos', 'Vos pensées', 'I tuoi pensieri', 'Ihre Gedanken'),
  'Tags': tr('Etiquetas', 'Étiquettes', 'Tag', 'Tags'),
  'Add': tr('Añadir', 'Ajouter', 'Aggiungi', 'Hinzufügen'),
  'Save Entry': tr('Guardar entrada', 'Enregistrer l’entrée', 'Salva voce', 'Eintrag speichern'),

  'Select a chat to start messaging': tr('Selecciona un chat para empezar a enviar mensajes', 'Sélectionnez une discussion pour commencer à échanger', 'Seleziona una chat per iniziare a messaggiare', 'Wählen Sie einen Chat aus, um Nachrichten zu senden'),
  'Loading messages...': tr('Cargando mensajes...', 'Chargement des messages...', 'Caricamento messaggi...', 'Nachrichten werden geladen...'),
  'No messages yet': tr('Aún no hay mensajes', 'Aucun message pour le moment', 'Nessun messaggio per ora', 'Noch keine Nachrichten'),
  'Start the conversation!': tr('¡Inicia la conversación!', 'Lancez la conversation !', 'Inizia la conversazione!', 'Starten Sie die Unterhaltung!'),
  'Save': tr('Guardar', 'Enregistrer', 'Salva', 'Speichern'),
  '(edited)': tr('(editado)', '(modifié)', '(modificato)', '(bearbeitet)'),
  'Delete Message': tr('Eliminar mensaje', 'Supprimer le message', 'Elimina messaggio', 'Nachricht löschen'),
  'How would you like to delete this message?': tr('¿Cómo quieres eliminar este mensaje?', 'Comment souhaitez-vous supprimer ce message ?', 'Come vuoi eliminare questo messaggio?', 'Wie möchten Sie diese Nachricht löschen?'),
  'Delete for me': tr('Eliminar para mí', 'Supprimer pour moi', 'Elimina per me', 'Für mich löschen'),
  'Delete for everyone': tr('Eliminar para todos', 'Supprimer pour tout le monde', 'Elimina per tutti', 'Für alle löschen'),
  'Choose how long your pin lasts': tr('Elige cuánto tiempo dura el mensaje fijado', 'Choisissez la durée de l’épinglage', 'Scegli per quanto tempo mantenere il messaggio fissato', 'Wählen Sie, wie lange die Anheftung bestehen bleibt'),
  'You can unpin at any time.': tr('Puedes desfijarlo en cualquier momento.', 'Vous pouvez le désépingler à tout moment.', 'Puoi rimuoverlo dai messaggi fissati in qualsiasi momento.', 'Sie können die Anheftung jederzeit aufheben.'),
  '24 hours': tr('24 horas', '24 heures', '24 ore', '24 Stunden'),
  '7 days': tr('7 días', '7 jours', '7 giorni', '7 Tage'),
  'Pin': tr('Fijar', 'Épingler', 'Fissa', 'Anheften'),
  'Chats': tr('Chats', 'Discussions', 'Chat', 'Chats'),
  'No conversations yet': tr('Aún no hay conversaciones', 'Aucune conversation pour le moment', 'Nessuna conversazione per ora', 'Noch keine Unterhaltungen'),
  'Start a new chat to get started': tr('Inicia un nuevo chat para comenzar', 'Démarrez une nouvelle discussion pour commencer', 'Avvia una nuova chat per iniziare', 'Starten Sie einen neuen Chat'),
  '🔇 Muted': tr('🔇 Silenciado', '🔇 Muet', '🔇 Silenziato', '🔇 Stummgeschaltet'),
  'Profile': tr('Perfil', 'Profil', 'Profilo', 'Profil'),
  'Online': tr('En línea', 'En ligne', 'Online', 'Online'),
  'Offline': tr('Desconectado', 'Hors ligne', 'Offline', 'Offline'),
  'Call': tr('Llamar', 'Appeler', 'Chiama', 'Anrufen'),
  'Video': tr('Video', 'Vidéo', 'Video', 'Video'),
  'Message': tr('Mensaje', 'Message', 'Messaggio', 'Nachricht'),
  'About': tr('Acerca de', 'À propos', 'Informazioni', 'Über'),
  'Details': tr('Detalles', 'Détails', 'Dettagli', 'Details'),
  'Phone': tr('Teléfono', 'Téléphone', 'Telefono', 'Telefon'),
  'Location': tr('Ubicación', 'Localisation', 'Posizione', 'Standort'),
  'Relationship Status': tr('Estado de la relación', 'Statut de la relation', 'Stato della relazione', 'Beziehungsstatus'),
  'Anniversary': tr('Aniversario', 'Anniversaire', 'Anniversario', 'Jahrestag'),
  'Love Language': tr('Lenguaje del amor', 'Langage de l’amour', 'Linguaggio dell’amore', 'Liebessprache'),
  'Partner': tr('Pareja', 'Partenaire', 'Partner', 'Partner'),
  'Messages': tr('Mensajes', 'Messages', 'Messaggi', 'Nachrichten'),
  'Photos': tr('Fotos', 'Photos', 'Foto', 'Fotos'),
  'Files': tr('Archivos', 'Fichiers', 'File', 'Dateien'),
  'Voice Notes': tr('Notas de voz', 'Notes vocales', 'Note vocali', 'Sprachnachrichten'),
  'No shared media yet': tr('Aún no hay contenido multimedia compartido', 'Aucun média partagé pour le moment', 'Nessun contenuto multimediale condiviso finora', 'Noch keine geteilten Medien'),
  'Open in Maps': tr('Abrir en Mapas', 'Ouvrir dans Plans', 'Apri in Mappe', 'In Karten öffnen'),
  'No shared locations yet': tr('Aún no hay ubicaciones compartidas', 'Aucun emplacement partagé pour le moment', 'Nessuna posizione condivisa finora', 'Noch keine geteilten Standorte'),
  'No shared documents yet': tr('Aún no hay documentos compartidos', 'Aucun document partagé pour le moment', 'Nessun documento condiviso finora', 'Noch keine geteilten Dokumente'),
  'Connecting...': tr('Conectando...', 'Connexion...', 'Connessione...', 'Verbindung wird hergestellt...'),
  'Recent': tr('Recientes', 'Récents', 'Recenti', 'Zuletzt verwendet'),
  'Voice Note': tr('Nota de voz', 'Note vocale', 'Nota vocale', 'Sprachnachricht'),
  'Tap to record voice note': tr('Toca para grabar una nota de voz', 'Appuyez pour enregistrer une note vocale', 'Tocca per registrare una nota vocale', 'Tippen, um eine Sprachnachricht aufzunehmen'),
  'Starting camera...': tr('Iniciando cámara...', 'Démarrage de la caméra...', 'Avvio fotocamera...', 'Kamera wird gestartet...'),
  'Photo': tr('Foto', 'Photo', 'Foto', 'Foto'),
  'Camera': tr('Cámara', 'Caméra', 'Fotocamera', 'Kamera'),
  'Document': tr('Documento', 'Document', 'Documento', 'Dokument'),
  'Admin': tr('Administrador', 'Administrateur', 'Amministratore', 'Admin'),
  'User': tr('Usuario', 'Utilisateur', 'Utente', 'Benutzer'),
  'Checking Admin Verification': tr('Comprobando verificación de administrador', 'Vérification administrateur en cours', 'Controllo verifica amministratore', 'Administratorbestätigung wird geprüft'),
  'Confirming your secure administrator session.': tr('Confirmando tu sesión segura de administrador.', 'Confirmation de votre session administrateur sécurisée.', 'Conferma della sessione amministratore sicura.', 'Ihre sichere Administratorsitzung wird bestätigt.'),

  'Premium Feature': tr('Función Premium', 'Fonctionnalité Premium', 'Funzionalità Premium', 'Premium-Funktion'),
  'This feature requires a': tr('Esta función requiere una', 'Cette fonctionnalité nécessite un', 'Questa funzionalità richiede un', 'Diese Funktion erfordert einen'),
  'subscription': tr('suscripción', 'abonnement', 'abbonamento', 'Abonnement'),
  "You're currently on the": tr('Actualmente tienes el plan', 'Vous utilisez actuellement le forfait', 'Attualmente utilizzi il piano', 'Sie nutzen derzeit den Tarif'),
  'plan': tr('plan', 'forfait', 'piano', 'Tarif'),
  '✨ Unlock all premium features with a paid plan': tr('✨ Desbloquea todas las funciones premium con un plan de pago', '✨ Débloquez toutes les fonctionnalités premium avec un forfait payant', '✨ Sblocca tutte le funzionalità premium con un piano a pagamento', '✨ Schalten Sie alle Premium-Funktionen mit einem kostenpflichtigen Tarif frei'),
  'Premium': tr('Premium', 'Premium', 'Premium', 'Premium'),
  'Upgrade Required': tr('Se requiere una mejora de plan', 'Mise à niveau requise', 'Aggiornamento richiesto', 'Upgrade erforderlich'),
  'View Plans': tr('Ver planes', 'Voir les forfaits', 'Visualizza piani', 'Tarife ansehen'),
  'Back': tr('Volver', 'Retour', 'Indietro', 'Zurück'),
  'Choose Your Love Journey': tr('Elige tu camino en el amor', 'Choisissez votre parcours amoureux', 'Scegli il tuo percorso d’amore', 'Wählen Sie Ihre Liebesreise'),
  'Select the perfect plan to strengthen your relationship and create lasting memories together': tr('Elige el plan perfecto para fortalecer tu relación y crear recuerdos duraderos juntos', 'Choisissez le forfait idéal pour renforcer votre relation et créer ensemble des souvenirs durables', 'Scegli il piano ideale per rafforzare la relazione e creare insieme ricordi duraturi', 'Wählen Sie den passenden Tarif, um Ihre Beziehung zu stärken und gemeinsam bleibende Erinnerungen zu schaffen'),
  '💜 All plans include a 14-day money-back guarantee • Cancel anytime • No hidden fees': tr('💜 Todos los planes incluyen garantía de devolución de 14 días • Cancela cuando quieras • Sin cargos ocultos', '💜 Tous les forfaits incluent une garantie de remboursement de 14 jours • Résiliation à tout moment • Aucun frais caché', '💜 Tutti i piani includono una garanzia di rimborso di 14 giorni • Annulla in qualsiasi momento • Nessun costo nascosto', '💜 Alle Tarife enthalten eine 14-tägige Geld-zurück-Garantie • Jederzeit kündbar • Keine versteckten Gebühren'),
  'Prices shown in USD. Special discounts available for annual subscriptions.': tr('Precios mostrados en USD. Hay descuentos especiales para suscripciones anuales.', 'Prix affichés en USD. Des remises spéciales sont disponibles pour les abonnements annuels.', 'Prezzi indicati in USD. Sono disponibili sconti speciali per gli abbonamenti annuali.', 'Preise in USD. Für Jahresabonnements sind Sonderrabatte verfügbar.'),

  'Terms': tr('Términos', 'Conditions', 'Termini', 'Bedingungen'),
  'Privacy': tr('Privacidad', 'Confidentialité', 'Privacy', 'Datenschutz'),
  'Profile Photo (Optional)': tr('Foto de perfil (opcional)', 'Photo de profil (facultatif)', 'Foto profilo (facoltativa)', 'Profilfoto (optional)'),
  'Upload a photo to personalize your profile. This will be visible to other users.': tr('Sube una foto para personalizar tu perfil. Será visible para otros usuarios.', 'Importez une photo pour personnaliser votre profil. Elle sera visible par les autres utilisateurs.', 'Carica una foto per personalizzare il profilo. Sarà visibile agli altri utenti.', 'Laden Sie ein Foto hoch, um Ihr Profil zu personalisieren. Es ist für andere Benutzer sichtbar.'),
  'Click to upload or drag and drop': tr('Haz clic para subir o arrastra y suelta', 'Cliquez pour importer ou glissez-déposez', 'Fai clic per caricare o trascina e rilascia', 'Zum Hochladen klicken oder Datei hierher ziehen'),
  'PNG, JPG, GIF up to 5MB': tr('PNG, JPG, GIF de hasta 5 MB', 'PNG, JPG, GIF jusqu’à 5 Mo', 'PNG, JPG, GIF fino a 5 MB', 'PNG, JPG, GIF bis 5 MB'),
  'Remove Photo': tr('Eliminar foto', 'Supprimer la photo', 'Rimuovi foto', 'Foto entfernen'),
  'Your photo helps others recognize you and makes your profile more personal.': tr('Tu foto ayuda a que otros te reconozcan y hace tu perfil más personal.', 'Votre photo aide les autres à vous reconnaître et rend votre profil plus personnel.', 'La tua foto aiuta gli altri a riconoscerti e rende il profilo più personale.', 'Ihr Foto hilft anderen, Sie zu erkennen, und macht Ihr Profil persönlicher.'),
  'Professional Information': tr('Información profesional', 'Informations professionnelles', 'Informazioni professionali', 'Berufliche Angaben'),
  'Licensed Countries *': tr('Países con licencia *', 'Pays d’exercice autorisés *', 'Paesi con licenza *', 'Zugelassene Länder *'),
  'Licensed States/Provinces *': tr('Estados/provincias con licencia *', 'États/provinces d’exercice autorisés *', 'Stati/province con licenza *', 'Zugelassene Bundesstaaten/Provinzen *'),
  'Therapy Types *': tr('Tipos de terapia *', 'Types de thérapie *', 'Tipi di terapia *', 'Therapiearten *'),
  'Specializations *': tr('Especializaciones *', 'Spécialisations *', 'Specializzazioni *', 'Spezialisierungen *'),
  'Certifications': tr('Certificaciones', 'Certifications', 'Certificazioni', 'Zertifizierungen'),
  'Years of Experience *': tr('Años de experiencia *', 'Années d’expérience *', 'Anni di esperienza *', 'Jahre Erfahrung *'),
  'Consultation Fee (USD) *': tr('Tarifa de consulta (USD) *', 'Tarif de consultation (USD) *', 'Tariffa di consulenza (USD) *', 'Beratungshonorar (USD) *'),
  'Professional Bio *': tr('Biografía profesional *', 'Biographie professionnelle *', 'Biografia professionale *', 'Berufliche Biografie *'),
  'Social Media Platforms (Optional)': tr('Plataformas de redes sociales (opcional)', 'Plateformes de réseaux sociaux (facultatif)', 'Piattaforme social (facoltative)', 'Social-Media-Plattformen (optional)'),
  'Connect your social media accounts to share with the community. Select all that apply.': tr('Conecta tus cuentas de redes sociales para compartirlas con la comunidad. Selecciona todas las que correspondan.', 'Connectez vos comptes de réseaux sociaux pour les partager avec la communauté. Sélectionnez toutes les options applicables.', 'Collega i tuoi account social per condividerli con la community. Seleziona tutte le opzioni applicabili.', 'Verbinden Sie Ihre Social-Media-Konten, um sie mit der Community zu teilen. Wählen Sie alle zutreffenden aus.'),
  'These links will be displayed on your profile and help others connect with you.': tr('Estos enlaces se mostrarán en tu perfil y ayudarán a otros a conectarse contigo.', 'Ces liens seront affichés sur votre profil et aideront les autres à vous contacter.', 'Questi link saranno mostrati sul tuo profilo e aiuteranno gli altri a connettersi con te.', 'Diese Links werden in Ihrem Profil angezeigt und helfen anderen, mit Ihnen in Kontakt zu treten.'),
  'Practice/Organization Name *': tr('Nombre de la práctica/organización *', 'Nom du cabinet/de l’organisation *', 'Nome dello studio/organizzazione *', 'Name der Praxis/Organisation *'),
  'Practice Type *': tr('Tipo de práctica *', 'Type de pratique *', 'Tipo di attività *', 'Art der Praxis *'),
  'Select type...': tr('Selecciona un tipo...', 'Sélectionnez un type...', 'Seleziona un tipo...', 'Typ auswählen...'),
  'Private Practice': tr('Práctica privada', 'Cabinet privé', 'Studio privato', 'Privatpraxis'),
  'Group Practice': tr('Práctica grupal', 'Cabinet de groupe', 'Studio associato', 'Gemeinschaftspraxis'),
  'Clinic/Center': tr('Clínica/centro', 'Clinique/centre', 'Clinica/centro', 'Klinik/Zentrum'),
  'Coaching Business': tr('Negocio de coaching', 'Activité de coaching', 'Attività di coaching', 'Coaching-Unternehmen'),
  'Consulting': tr('Consultoría', 'Conseil', 'Consulenza', 'Beratung'),
  'Non-Profit': tr('Sin fines de lucro', 'Organisation à but non lucratif', 'Non profit', 'Gemeinnützig'),
  'Media/Publishing': tr('Medios/publicaciones', 'Médias/édition', 'Media/editoria', 'Medien/Verlag'),
  'Independent Professional': tr('Profesional independiente', 'Professionnel indépendant', 'Professionista indipendente', 'Selbstständiger Fachmann'),
  'Other': tr('Otro', 'Autre', 'Altro', 'Andere'),
  'Website URL': tr('URL del sitio web', 'URL du site web', 'URL del sito web', 'Website-URL'),
  '(Optional)': tr('(Opcional)', '(Facultatif)', '(Facoltativo)', '(Optional)'),
  'Services You Offer *': tr('Servicios que ofreces *', 'Services proposés *', 'Servizi offerti *', 'Angebotene Dienstleistungen *'),
  'Note:': tr('Nota:', 'Remarque :', 'Nota:', 'Hinweis:'),
  'Your profile will be reviewed by our team before being approved to ensure quality and alignment with our community values.': tr('Nuestro equipo revisará tu perfil antes de aprobarlo para asegurar la calidad y la coherencia con los valores de nuestra comunidad.', 'Votre profil sera examiné par notre équipe avant approbation afin de garantir sa qualité et son adéquation avec les valeurs de notre communauté.', 'Il nostro team esaminerà il tuo profilo prima dell’approvazione per garantire qualità e coerenza con i valori della community.', 'Ihr Profil wird vor der Freigabe von unserem Team geprüft, um Qualität und Übereinstimmung mit unseren Community-Werten sicherzustellen.'),
  'Influencer Information': tr('Información del influencer', 'Informations sur l’influenceur', 'Informazioni influencer', 'Influencer-Angaben'),
  'Total Follower Count *': tr('Número total de seguidores *', 'Nombre total d’abonnés *', 'Numero totale di follower *', 'Gesamtzahl der Follower *'),
  'Combined followers across all platforms': tr('Seguidores combinados en todas las plataformas', 'Nombre total d’abonnés sur toutes les plateformes', 'Follower complessivi su tutte le piattaforme', 'Gesamtzahl der Follower auf allen Plattformen'),
  'Social Media Links *': tr('Enlaces de redes sociales *', 'Liens vers les réseaux sociaux *', 'Link social *', 'Social-Media-Links *'),
  'At least one platform link is required': tr('Se requiere al menos un enlace de plataforma', 'Au moins un lien vers une plateforme est requis', 'È richiesto almeno un link a una piattaforma', 'Mindestens ein Plattform-Link ist erforderlich'),
  'Content Categories *': tr('Categorías de contenido *', 'Catégories de contenu *', 'Categorie di contenuto *', 'Inhaltskategorien *'),
  'Collaboration Types *': tr('Tipos de colaboración *', 'Types de collaboration *', 'Tipi di collaborazione *', 'Arten der Zusammenarbeit *'),
  'Media Kit URL': tr('URL del kit de medios', 'URL du kit média', 'URL del media kit', 'Media-Kit-URL'),
  'Bio *': tr('Biografía *', 'Biographie *', 'Bio *', 'Biografie *'),
  'Check Your Email! 📧': tr('¡Revisa tu correo! 📧', 'Consultez votre e-mail ! 📧', 'Controlla la tua e-mail! 📧', 'Prüfen Sie Ihre E-Mail! 📧'),
  'Account Created Successfully!': tr('¡Cuenta creada correctamente!', 'Compte créé avec succès !', 'Account creato con successo!', 'Konto erfolgreich erstellt!'),
  "We've sent a verification email to:": tr('Hemos enviado un correo de verificación a:', 'Nous avons envoyé un e-mail de vérification à :', 'Abbiamo inviato un’e-mail di verifica a:', 'Wir haben eine Bestätigungs-E-Mail gesendet an:'),
  'Next Steps:': tr('Próximos pasos:', 'Étapes suivantes :', 'Passaggi successivi:', 'Nächste Schritte:'),
  'Open your email inbox': tr('Abre tu bandeja de entrada', 'Ouvrez votre boîte de réception', 'Apri la posta in arrivo', 'Öffnen Sie Ihren E-Mail-Posteingang'),
  'Find the email from': tr('Busca el correo de', 'Trouvez l’e-mail de', 'Trova l’e-mail da', 'Suchen Sie die E-Mail von'),
  'Click the verification link': tr('Haz clic en el enlace de verificación', 'Cliquez sur le lien de vérification', 'Fai clic sul link di verifica', 'Klicken Sie auf den Bestätigungslink'),
  'Return here and sign in!': tr('¡Vuelve aquí e inicia sesión!', 'Revenez ici et connectez-vous !', 'Torna qui e accedi!', 'Kehren Sie hierher zurück und melden Sie sich an!'),
  "💡 Can't find the email?": tr('💡 ¿No encuentras el correo?', '💡 Vous ne trouvez pas l’e-mail ?', '💡 Non trovi l’e-mail?', '💡 Sie finden die E-Mail nicht?'),
  'Got it, go to Sign In': tr('Entendido, ir a Iniciar Sesión', 'Compris, aller à la connexion', 'Capito, vai ad Accedi', 'Verstanden, zur Anmeldung'),
  'Couple Membership Details': tr('Detalles de membresía de pareja', 'Détails de l’adhésion du couple', 'Dettagli iscrizione coppia', 'Details zur Paarmitgliedschaft'),
  'Please provide information for both members of the couple': tr('Proporciona información de ambos miembros de la pareja', 'Veuillez fournir les informations des deux membres du couple', 'Fornisci le informazioni di entrambi i membri della coppia', 'Bitte geben Sie Informationen zu beiden Partnern an'),
  'Member 1 Information *': tr('Información del miembro 1 *', 'Informations du membre 1 *', 'Informazioni membro 1 *', 'Angaben zu Mitglied 1 *'),
  'Member 2 Information *': tr('Información del miembro 2 *', 'Informations du membre 2 *', 'Informazioni membro 2 *', 'Angaben zu Mitglied 2 *'),
  'First Name *': tr('Nombre *', 'Prénom *', 'Nome *', 'Vorname *'),
  'Last Name *': tr('Apellido *', 'Nom *', 'Cognome *', 'Nachname *'),
  'Email Address *': tr('Correo electrónico *', 'Adresse e-mail *', 'Indirizzo e-mail *', 'E-Mail-Adresse *'),
  'Verify': tr('Verificar', 'Vérifier', 'Verifica', 'Bestätigen'),
  'Verified': tr('Verificado', 'Vérifié', 'Verificato', 'Bestätigt'),
  'Confirm': tr('Confirmar', 'Confirmer', 'Conferma', 'Bestätigen'),
  'Phone Number *': tr('Número de teléfono *', 'Numéro de téléphone *', 'Numero di telefono *', 'Telefonnummer *'),
  'Country *': tr('País *', 'Pays *', 'Paese *', 'Land *'),
  'State/Province *': tr('Estado/provincia *', 'État/province *', 'Stato/provincia *', 'Bundesstaat/Provinz *'),
  'City/Town *': tr('Ciudad/localidad *', 'Ville/localité *', 'Città/località *', 'Stadt/Ort *'),
  'Language Spoken *': tr('Idioma hablado *', 'Langue parlée *', 'Lingua parlata *', 'Gesprochene Sprache *'),
  'Both members will have access to the account and can log in with their respective credentials after signup is complete.': tr('Ambos miembros tendrán acceso a la cuenta y podrán iniciar sesión con sus respectivas credenciales cuando se complete el registro.', 'Les deux membres auront accès au compte et pourront se connecter avec leurs identifiants respectifs une fois l’inscription terminée.', 'Entrambi i membri avranno accesso all’account e potranno accedere con le rispettive credenziali dopo il completamento della registrazione.', 'Beide Partner erhalten Zugriff auf das Konto und können sich nach Abschluss der Registrierung mit ihren jeweiligen Zugangsdaten anmelden.'),
  'Loading...': tr('Cargando...', 'Chargement...', 'Caricamento...', 'Wird geladen...'),
  'Uploading...': tr('Subiendo...', 'Importation...', 'Caricamento...', 'Wird hochgeladen...'),
  'Click to upload photos': tr('Haz clic para subir fotos', 'Cliquez pour importer des photos', 'Fai clic per caricare foto', 'Zum Hochladen von Fotos klicken'),
  'Connected': tr('Conectado', 'Connecté', 'Connesso', 'Verbunden'),
  'Shared Goal:': tr('Meta compartida:', 'Objectif partagé :', 'Obiettivo condiviso:', 'Gemeinsames Ziel:'),
  'Accept': tr('Aceptar', 'Accepter', 'Accetta', 'Annehmen'),
  'Decline': tr('Rechazar', 'Refuser', 'Rifiuta', 'Ablehnen'),
};

function language() {
  try {
    const value = String(window.localStorage.getItem('preferredLanguage') || 'en').toLowerCase();
    return LANGS.has(value) ? value : 'en';
  } catch {
    return 'en';
  }
}

export function translateStaticUiText(value, lang = language()) {
  if (typeof value !== 'string' || lang === 'en') return value;
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const core = value.trim();
  if (!core) return value;
  const translated = UI[core]?.[lang];
  return translated ? `${leading}${translated}${trailing}` : value;
}

function localizeAttributes(element, lang) {
  if (!(element instanceof Element)) return;
  for (const attribute of ['placeholder', 'title', 'aria-label']) {
    if (!element.hasAttribute(attribute)) continue;
    const original = element.getAttribute(attribute);
    const translated = translateStaticUiText(original, lang);
    if (translated !== original) element.setAttribute(attribute, translated);
  }
}

function localizeTree(root) {
  const lang = language();
  if (lang === 'en' || !root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    const translated = translateStaticUiText(root.nodeValue, lang);
    if (translated !== root.nodeValue) root.nodeValue = translated;
    return;
  }
  if (![Node.ELEMENT_NODE, Node.DOCUMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(root.nodeType)) return;
  if (root.nodeType === Node.ELEMENT_NODE) localizeAttributes(root, lang);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const translated = translateStaticUiText(node.nodeValue, lang);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      localizeAttributes(node, lang);
    }
  }
}

export function installStaticUiLocalization() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__o2olStaticUiLocalizationInstalled) return;
  window.__o2olStaticUiLocalizationInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') localizeTree(mutation.target);
      for (const node of mutation.addedNodes || []) localizeTree(node);
    }
  });

  const start = () => {
    localizeTree(document.body);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('storage', (event) => {
    if (event.key === 'preferredLanguage') localizeTree(document.body);
  });
}
