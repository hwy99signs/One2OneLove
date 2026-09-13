const fs = require('fs');
const vm = require('vm');

const langs = ['en','es','fr','it','de'];
const baseCategories = [
  'romantic','lgbtqRomantic','lgbtqSupport','lgbtqMilestone','sweet','playful','deep','appreciation',
  'memories','future','morning','night','daily','special','dateIdeas','milestone','justBecause','encouragement',
  'apology','family','friends','heartBroken','sick','goodLuck'
];

const labels = {
  en:{romantic:'Romantic',lgbtqRomantic:'LGBTQ Romantic',lgbtqSupport:'LGBTQ Support',lgbtqMilestone:'LGBTQ Milestone',sweet:'Sweet',playful:'Playful',deep:'Deep',appreciation:'Appreciation',memories:'Memories',future:'Future',morning:'Morning',night:'Night',daily:'Daily',special:'Special Occasion',dateIdeas:'Date Idea',milestone:'Milestone',justBecause:'Just Because',encouragement:'Encouragement',apology:'Apology',family:'Family',friends:'Friends',heartBroken:'Heart Healing',sick:'Get Well',goodLuck:'Good Luck',holidayRomantic:'Holiday Romance',holidayFamily:'Holiday Family',holidayFriends:'Holiday Friends'},
  es:{romantic:'Romántico',lgbtqRomantic:'Romance LGBTQ',lgbtqSupport:'Apoyo LGBTQ',lgbtqMilestone:'Hito LGBTQ',sweet:'Dulce',playful:'Divertido',deep:'Profundo',appreciation:'Aprecio',memories:'Recuerdos',future:'Futuro',morning:'Mañana',night:'Noche',daily:'Diario',special:'Ocasión Especial',dateIdeas:'Idea de Cita',milestone:'Hito',justBecause:'Porque Sí',encouragement:'Ánimo',apology:'Disculpa',family:'Familia',friends:'Amistad',heartBroken:'Sanar el Corazón',sick:'Recupérate',goodLuck:'Buena Suerte',holidayRomantic:'Romance Festivo',holidayFamily:'Familia en Fiesta',holidayFriends:'Amigos en Fiesta'},
  fr:{romantic:'Romantique',lgbtqRomantic:'Romance LGBTQ',lgbtqSupport:'Soutien LGBTQ',lgbtqMilestone:'Étape LGBTQ',sweet:'Tendre',playful:'Ludique',deep:'Profond',appreciation:'Reconnaissance',memories:'Souvenirs',future:'Avenir',morning:'Matin',night:'Nuit',daily:'Quotidien',special:'Occasion Spéciale',dateIdeas:'Idée de Rendez-vous',milestone:'Étape',justBecause:'Juste Comme Ça',encouragement:'Encouragement',apology:'Excuses',family:'Famille',friends:'Amitié',heartBroken:'Cœur à Guérir',sick:'Bon Rétablissement',goodLuck:'Bonne Chance',holidayRomantic:'Romance des Fêtes',holidayFamily:'Famille des Fêtes',holidayFriends:'Amis des Fêtes'},
  it:{romantic:'Romantico',lgbtqRomantic:'Romance LGBTQ',lgbtqSupport:'Sostegno LGBTQ',lgbtqMilestone:'Traguardo LGBTQ',sweet:'Dolce',playful:'Giocoso',deep:'Profondo',appreciation:'Apprezzamento',memories:'Ricordi',future:'Futuro',morning:'Mattino',night:'Notte',daily:'Quotidiano',special:'Occasione Speciale',dateIdeas:'Idea per un Appuntamento',milestone:'Traguardo',justBecause:'Solo Perché',encouragement:'Incoraggiamento',apology:'Scuse',family:'Famiglia',friends:'Amicizia',heartBroken:'Cuore da Guarire',sick:'Guarisci Presto',goodLuck:'Buona Fortuna',holidayRomantic:'Romance delle Feste',holidayFamily:'Famiglia nelle Feste',holidayFriends:'Amici nelle Feste'},
  de:{romantic:'Romantisch',lgbtqRomantic:'LGBTQ Romantik',lgbtqSupport:'LGBTQ Unterstützung',lgbtqMilestone:'LGBTQ Meilenstein',sweet:'Süß',playful:'Verspielt',deep:'Tief',appreciation:'Wertschätzung',memories:'Erinnerungen',future:'Zukunft',morning:'Morgen',night:'Nacht',daily:'Täglich',special:'Besonderer Anlass',dateIdeas:'Date-Idee',milestone:'Meilenstein',justBecause:'Einfach So',encouragement:'Ermutigung',apology:'Entschuldigung',family:'Familie',friends:'Freundschaft',heartBroken:'Herzheilung',sick:'Gute Besserung',goodLuck:'Viel Glück',holidayRomantic:'Feiertagsromantik',holidayFamily:'Feiertage mit Familie',holidayFriends:'Feiertage mit Freunden'}
};

const stems = {
  en:['A Little Reminder','For You Today','From My Heart','Just Because','Keep This Close','One More Thought','A Quiet Note','For This Moment','A Note for You','Something I Mean','With Love','Today and Always','A Small Truth','Worth Remembering','For Your Heart'],
  es:['Un Pequeño Recordatorio','Para Ti Hoy','Desde Mi Corazón','Porque Sí','Guarda Esto Cerca','Un Pensamiento Más','Una Nota Tranquila','Para Este Momento','Una Nota Para Ti','Algo Que Siento','Con Amor','Hoy y Siempre','Una Pequeña Verdad','Vale Recordarlo','Para Tu Corazón'],
  fr:['Un Petit Rappel','Pour Toi Aujourd’hui','De Tout Mon Cœur','Juste Comme Ça','Garde Ceci Près de Toi','Une Pensée de Plus','Une Note Douce','Pour Cet Instant','Une Note Pour Toi','Quelque Chose de Sincère','Avec Amour','Aujourd’hui et Toujours','Une Petite Vérité','À Ne Pas Oublier','Pour Ton Cœur'],
  it:['Un Piccolo Promemoria','Per Te Oggi','Dal Mio Cuore','Solo Perché','Tienilo Vicino','Un Pensiero in Più','Una Nota Tranquilla','Per Questo Momento','Una Nota Per Te','Qualcosa Che Sento','Con Amore','Oggi e Sempre','Una Piccola Verità','Da Ricordare','Per il Tuo Cuore'],
  de:['Eine Kleine Erinnerung','Für Dich Heute','Von Herzen','Einfach So','Behalte Das Bei Dir','Noch Ein Gedanke','Eine Leise Notiz','Für Diesen Moment','Eine Nachricht Für Dich','Etwas, Das Ich Meine','Mit Liebe','Heute und Immer','Eine Kleine Wahrheit','Denk Daran','Für Dein Herz']
};

const prefixes = {
  en:['A little note for you:','Just in case you need to hear it today:','From my heart to yours:','One thing I never want you to forget:','For this moment, remember:'],
  es:['Una pequeña nota para ti:','Por si hoy necesitas escucharlo:','De mi corazón al tuyo:','Algo que nunca quiero que olvides:','Para este momento, recuerda:'],
  fr:['Une petite note pour toi :','Au cas où tu aurais besoin de l’entendre aujourd’hui :','De mon cœur au tien :','Une chose que je ne veux jamais que tu oublies :','Pour cet instant, souviens-toi :'],
  it:['Una piccola nota per te:','Nel caso tu abbia bisogno di sentirlo oggi:','Dal mio cuore al tuo:','Una cosa che non voglio mai che tu dimentichi:','Per questo momento, ricorda:'],
  de:['Eine kleine Nachricht für dich:','Falls du das heute hören musst:','Von meinem Herzen zu deinem:','Eine Sache, die du nie vergessen sollst:','Für diesen Moment denk daran:']
};

const themes = {
  en:{
    romantic:['I still choose you with my whole heart, in ordinary moments and extraordinary ones.','Being loved by you makes even simple days feel meaningful.','I want you beside me through every chapter still ahead.'],
    lgbtqRomantic:['Loving you openly and authentically is one of the greatest joys of my life.','Our love deserves to be celebrated exactly as it is—real, brave, and ours.','With you, I never have to shrink who I am to be loved.'],
    lgbtqSupport:['I see you, respect you, and support every part of who you are becoming.','You never have to earn my acceptance; you already have my love and respect.','Whatever the world asks of you, you can come to me as your full self.'],
    lgbtqMilestone:['Every step toward living more fully as yourself deserves to be honored.','I am proud to celebrate the milestones that mark your courage and growth.','Your journey matters, and I am grateful to witness this chapter with you.'],
    sweet:['You make my day softer just by being part of it.','A thought of you can turn an ordinary moment into a good one.','You are one of my favorite reasons to smile.'],
    playful:['You are still my favorite person to tease, laugh with, and steal snacks from.','If loving you were a competition, I would be embarrassingly overprepared.','Life with you is more fun, more ridiculous, and exactly how I like it.'],
    deep:['You know parts of me I once kept hidden, and you meet them with care.','Our connection has changed the way I understand trust, love, and home.','I value the kind of love that keeps growing through truth, patience, and time.'],
    appreciation:['I notice the quiet things you do, and they matter more than you know.','Thank you for the patience, effort, and care you bring into my life.','I appreciate not only what you do, but the person you are while doing it.'],
    memories:['Some of my favorite memories are ordinary moments that became special because you were there.','I love looking back at how much we have laughed, learned, and grown together.','The memories we have made remind me how much life we have truly shared.'],
    future:['I look forward to the plans we make and the surprises we cannot predict.','The future feels less frightening and more exciting when I imagine it with you.','I want to keep building a life that gives us both room to grow.'],
    morning:['I hope this morning starts gently and reminds you how loved you are.','Before the day gets busy, I wanted you to know I am thinking of you.','May today bring you clear thoughts, steady energy, and at least one reason to smile.'],
    night:['Rest tonight knowing you are cared for, appreciated, and loved.','Whatever today held, you do not have to carry all of it into tomorrow.','I hope sleep brings you peace and morning brings you new energy.'],
    daily:['No special occasion—just a reminder that you matter to me today.','I hope something small and good finds you before this day is over.','Whatever today looks like, I am in your corner.'],
    special:['This personal milestone deserves to be celebrated because of everything it represents in your journey.','I am proud of what you have reached and excited for what comes next.','Today belongs to you and to the work, courage, and growth that brought you here.'],
    dateIdeas:['Let’s put our phones away, pick a place we have never tried, and make a memory.','Let’s plan a simple evening with good food, a walk, and time to really talk.','Let’s each choose one surprise activity and turn an ordinary day into a date.'],
    milestone:['Look how far we have come—this milestone deserves a moment of real gratitude.','Every milestone tells part of our story, and I am proud of the story we are building.','This moment is worth celebrating because we reached it together.'],
    justBecause:['There is no reason for this note except that I thought of you and smiled.','I do not need a special day to remind you how important you are to me.','Just because: you make my life better by being in it.'],
    encouragement:['You do not have to solve everything today; just take the next honest step.','I believe in your ability to handle what is in front of you.','You have made it through hard days before, and you do not have to face this one alone.'],
    apology:['I am sorry for the hurt I caused, and I want my actions to show that I understand it.','You deserved more care from me in that moment, and I am committed to doing better.','I cannot undo what happened, but I can listen, take responsibility, and change.'],
    family:['Family feels stronger when we make room for patience, honesty, and kindness.','I am grateful for the love, history, and support we share as a family.','No family is perfect, but I am thankful we keep choosing connection.'],
    friends:['Your friendship has brought laughter, perspective, and comfort into my life.','I am grateful for a friend who can celebrate the good days and stay through the hard ones.','Life is better with someone like you to call a friend.'],
    heartBroken:['I know this hurts, and you do not have to rush yourself into feeling better.','Healing is not a straight line; be gentle with yourself while your heart catches up.','This ending does not erase your worth or your capacity to love again.'],
    sick:['Rest as much as you need; getting better is enough work for today.','I wish I could take the discomfort away, so I am sending care instead.','Please be gentle with yourself and let your body have the time it needs.'],
    goodLuck:['You have prepared for this; trust what you know and take it one step at a time.','I am cheering for you and hoping the right doors open today.','Whatever the outcome, I am proud of the courage it took to show up.'],
    holidayRomantic:['Sharing the season with you makes every light, song, and tradition feel more meaningful.','My favorite part of any holiday is having your hand to hold through it.','Another celebration with you is another memory I want to keep.'],
    holidayFamily:['May our family celebrations be filled with patience, laughter, good food, and real connection.','The best part of the season is making time for the people who make home feel like home.','I am grateful for the traditions, stories, and love our family shares.'],
    holidayFriends:['The season is brighter when good friends are part of the celebration.','I am grateful for the friendship, laughter, and memories we bring into every holiday.','Here’s to celebrating the season with friends who feel like chosen family.']
  },
  es:{
    romantic:['Te sigo eligiendo con todo mi corazón, en los momentos sencillos y en los extraordinarios.','Ser amado por ti hace que hasta los días simples tengan un significado especial.','Quiero tenerte a mi lado en cada capítulo que aún nos queda por vivir.'],
    lgbtqRomantic:['Amarte abierta y auténticamente es una de las mayores alegrías de mi vida.','Nuestro amor merece celebrarse tal como es: real, valiente y nuestro.','Contigo nunca tengo que hacerme pequeño para merecer amor.'],
    lgbtqSupport:['Te veo, te respeto y apoyo cada parte de la persona en la que te estás convirtiendo.','Nunca tienes que ganarte mi aceptación; ya tienes mi amor y mi respeto.','Pase lo que pase afuera, conmigo puedes ser plenamente tú.'],
    lgbtqMilestone:['Cada paso hacia una vida más auténtica merece ser reconocido.','Me enorgullece celebrar los hitos que reflejan tu valor y tu crecimiento.','Tu camino importa y agradezco poder acompañarte en este capítulo.'],
    sweet:['Haces que mi día sea más suave simplemente por formar parte de él.','Pensar en ti puede convertir un momento común en uno bueno.','Eres una de mis razones favoritas para sonreír.'],
    playful:['Sigues siendo mi persona favorita para bromear, reír y robarle algún bocadillo.','Si amarte fuera una competencia, estaría ridículamente preparado.','La vida contigo es más divertida, más absurda y exactamente como me gusta.'],
    deep:['Conoces partes de mí que antes escondía y las recibes con cuidado.','Nuestra conexión cambió mi manera de entender la confianza, el amor y el hogar.','Valoro un amor que sigue creciendo con verdad, paciencia y tiempo.'],
    appreciation:['Veo las cosas silenciosas que haces y significan más de lo que imaginas.','Gracias por la paciencia, el esfuerzo y el cuidado que aportas a mi vida.','Aprecio no solo lo que haces, sino la persona que eres al hacerlo.'],
    memories:['Algunos de mis recuerdos favoritos son momentos comunes que se hicieron especiales porque estabas allí.','Me encanta mirar atrás y ver cuánto hemos reído, aprendido y crecido juntos.','Los recuerdos que hemos creado me recuerdan cuánto hemos compartido de verdad.'],
    future:['Me ilusionan los planes que hacemos y las sorpresas que todavía no podemos imaginar.','El futuro da menos miedo y más ilusión cuando lo imagino contigo.','Quiero seguir construyendo una vida en la que ambos podamos crecer.'],
    morning:['Espero que esta mañana empiece con calma y te recuerde cuánto te quieren.','Antes de que el día se vuelva ocupado, quería decirte que estoy pensando en ti.','Que hoy tengas ideas claras, energía estable y al menos una razón para sonreír.'],
    night:['Descansa esta noche sabiendo que te cuidan, te valoran y te quieren.','Sea lo que sea que haya traído hoy, no tienes que llevarlo todo contigo hasta mañana.','Espero que el sueño te dé paz y la mañana te devuelva energía.'],
    daily:['No hace falta una ocasión especial; solo quiero recordarte que hoy importas para mí.','Espero que algo pequeño y bueno te encuentre antes de que termine el día.','Sea como sea tu día, estoy de tu lado.'],
    special:['Este hito personal merece celebrarse por todo lo que representa en tu camino.','Estoy orgulloso de lo que has alcanzado y emocionado por lo que viene después.','Hoy es tuyo y también del trabajo, el valor y el crecimiento que te trajeron hasta aquí.'],
    dateIdeas:['Guardemos los teléfonos, probemos un lugar nuevo y hagamos un recuerdo juntos.','Planeemos una noche sencilla con buena comida, un paseo y tiempo para hablar de verdad.','Elijamos cada uno una actividad sorpresa y convirtamos un día normal en una cita.'],
    milestone:['Mira todo lo que hemos avanzado; este hito merece un momento de verdadera gratitud.','Cada hito cuenta una parte de nuestra historia y me enorgullece lo que estamos construyendo.','Este momento merece celebrarse porque llegamos hasta aquí juntos.'],
    justBecause:['No hay ninguna razón para esta nota salvo que pensé en ti y sonreí.','No necesito un día especial para recordarte lo importante que eres para mí.','Porque sí: haces que mi vida sea mejor con tu presencia.'],
    encouragement:['No tienes que resolverlo todo hoy; da solo el siguiente paso honesto.','Confío en tu capacidad para afrontar lo que tienes delante.','Ya superaste días difíciles antes y no tienes que enfrentar este en soledad.'],
    apology:['Siento el daño que causé y quiero que mis acciones demuestren que lo entiendo.','Merecías más cuidado de mi parte en ese momento y estoy comprometido a hacerlo mejor.','No puedo deshacer lo ocurrido, pero puedo escuchar, asumir responsabilidad y cambiar.'],
    family:['La familia se fortalece cuando damos espacio a la paciencia, la honestidad y la bondad.','Agradezco el amor, la historia y el apoyo que compartimos como familia.','Ninguna familia es perfecta, pero agradezco que sigamos eligiendo la conexión.'],
    friends:['Tu amistad ha traído risas, perspectiva y consuelo a mi vida.','Agradezco tener un amigo que celebra los días buenos y permanece en los difíciles.','La vida es mejor con alguien como tú a quien llamar amigo.'],
    heartBroken:['Sé que esto duele y no tienes que apresurarte a sentirte mejor.','Sanar no es una línea recta; trátate con ternura mientras tu corazón se recupera.','Este final no borra tu valor ni tu capacidad de volver a amar.'],
    sick:['Descansa todo lo que necesites; mejorar ya es suficiente trabajo por hoy.','Ojalá pudiera quitarte el malestar, así que te envío cariño en su lugar.','Trátate con suavidad y dale a tu cuerpo el tiempo que necesita.'],
    goodLuck:['Te has preparado para esto; confía en lo que sabes y ve paso a paso.','Estoy animándote y deseando que hoy se abran las puertas correctas.','Sea cual sea el resultado, me enorgullece el valor que mostraste al presentarte.'],
    holidayRomantic:['Compartir estas fechas contigo hace que cada luz, canción y tradición tenga más sentido.','Mi parte favorita de cualquier celebración es tener tu mano junto a la mía.','Otra celebración contigo es otro recuerdo que quiero guardar.'],
    holidayFamily:['Que nuestras celebraciones familiares estén llenas de paciencia, risas, buena comida y conexión real.','Lo mejor de estas fechas es hacer tiempo para quienes hacen que el hogar se sienta como hogar.','Agradezco las tradiciones, historias y el amor que comparte nuestra familia.'],
    holidayFriends:['La temporada es más luminosa cuando buenos amigos forman parte de la celebración.','Agradezco la amistad, las risas y los recuerdos que llevamos a cada fiesta.','Brindo por celebrar con amigos que se sienten como familia elegida.']
  },
  fr:{
    romantic:['Je te choisis encore de tout mon cœur, dans les moments ordinaires comme dans les plus extraordinaires.','Être aimé par toi donne du sens même aux journées les plus simples.','Je veux t’avoir à mes côtés dans tous les chapitres qui nous attendent encore.'],
    lgbtqRomantic:['T’aimer ouvertement et avec authenticité est l’une des plus grandes joies de ma vie.','Notre amour mérite d’être célébré exactement comme il est : vrai, courageux et à nous.','Avec toi, je n’ai jamais besoin de diminuer qui je suis pour être aimé.'],
    lgbtqSupport:['Je te vois, je te respecte et je soutiens chaque part de la personne que tu deviens.','Tu n’as jamais à gagner mon acceptation ; tu as déjà mon amour et mon respect.','Quoi que le monde exige de toi, avec moi tu peux être pleinement toi-même.'],
    lgbtqMilestone:['Chaque pas vers une vie plus pleinement authentique mérite d’être honoré.','Je suis fier de célébrer les étapes qui témoignent de ton courage et de ta croissance.','Ton parcours compte et je suis reconnaissant d’être témoin de ce chapitre avec toi.'],
    sweet:['Tu adoucis ma journée simplement en en faisant partie.','Une pensée pour toi peut transformer un moment ordinaire en un bon moment.','Tu es l’une de mes raisons préférées de sourire.'],
    playful:['Tu restes ma personne préférée pour plaisanter, rire et voler quelques snacks.','Si t’aimer était une compétition, je serais ridiculement bien préparé.','La vie avec toi est plus drôle, plus absurde et exactement comme je l’aime.'],
    deep:['Tu connais des parts de moi que je cachais autrefois et tu les accueilles avec douceur.','Notre lien a changé ma façon de comprendre la confiance, l’amour et le foyer.','J’apprécie un amour qui continue de grandir avec vérité, patience et temps.'],
    appreciation:['Je remarque les petites choses silencieuses que tu fais et elles comptent plus que tu ne l’imagines.','Merci pour la patience, les efforts et l’attention que tu apportes à ma vie.','J’apprécie non seulement ce que tu fais, mais aussi la personne que tu es en le faisant.'],
    memories:['Certains de mes souvenirs préférés sont des moments ordinaires devenus spéciaux parce que tu étais là.','J’aime regarder en arrière et voir tout ce que nous avons ri, appris et grandi ensemble.','Les souvenirs que nous avons créés me rappellent combien de vie nous avons vraiment partagée.'],
    future:['J’ai hâte de vivre les projets que nous faisons et les surprises que nous ne pouvons pas encore prévoir.','L’avenir fait moins peur et paraît plus excitant quand je l’imagine avec toi.','Je veux continuer à construire une vie qui nous laisse à tous les deux la place de grandir.'],
    morning:['J’espère que cette matinée commence doucement et te rappelle combien tu es aimé.','Avant que la journée ne s’accélère, je voulais que tu saches que je pense à toi.','Que cette journée t’apporte des idées claires, une énergie stable et au moins une raison de sourire.'],
    night:['Repose-toi ce soir en sachant que tu es entouré de soin, d’estime et d’amour.','Quoi qu’ait apporté cette journée, tu n’as pas besoin de tout emporter avec toi demain.','J’espère que le sommeil t’apportera la paix et que le matin te rendra de l’énergie.'],
    daily:['Aucune occasion spéciale, juste un rappel : tu comptes pour moi aujourd’hui.','J’espère qu’une petite bonne chose te trouvera avant la fin de cette journée.','Quelle que soit ta journée, je suis de ton côté.'],
    special:['Cette étape personnelle mérite d’être célébrée pour tout ce qu’elle représente dans ton parcours.','Je suis fier de ce que tu as accompli et impatient de voir ce qui vient ensuite.','Cette journée t’appartient, ainsi qu’au travail, au courage et à la croissance qui t’ont conduit jusqu’ici.'],
    dateIdeas:['Rangeons nos téléphones, essayons un endroit nouveau et créons un souvenir.','Planifions une soirée simple avec un bon repas, une promenade et du temps pour vraiment parler.','Choisissons chacun une activité surprise et transformons une journée ordinaire en rendez-vous.'],
    milestone:['Regarde le chemin parcouru : cette étape mérite un vrai moment de gratitude.','Chaque étape raconte une partie de notre histoire et je suis fier de celle que nous construisons.','Ce moment mérite d’être célébré parce que nous l’avons atteint ensemble.'],
    justBecause:['Il n’y a aucune raison particulière à cette note, sauf que j’ai pensé à toi et souri.','Je n’ai pas besoin d’un jour spécial pour te rappeler à quel point tu comptes pour moi.','Juste comme ça : ma vie est meilleure parce que tu en fais partie.'],
    encouragement:['Tu n’as pas besoin de tout résoudre aujourd’hui ; fais simplement le prochain pas honnête.','Je crois en ta capacité à gérer ce qui est devant toi.','Tu as déjà traversé des jours difficiles et tu n’as pas à affronter celui-ci seul.'],
    apology:['Je suis désolé pour la douleur que j’ai causée et je veux que mes actes montrent que je le comprends.','Tu méritais plus d’attention de ma part à ce moment-là et je m’engage à faire mieux.','Je ne peux pas effacer ce qui s’est passé, mais je peux écouter, assumer ma responsabilité et changer.'],
    family:['La famille devient plus forte quand nous faisons de la place à la patience, à l’honnêteté et à la gentillesse.','Je suis reconnaissant pour l’amour, l’histoire et le soutien que nous partageons en famille.','Aucune famille n’est parfaite, mais je suis reconnaissant que nous continuions à choisir le lien.'],
    friends:['Ton amitié a apporté du rire, du recul et du réconfort dans ma vie.','Je suis reconnaissant d’avoir un ami qui célèbre les bons jours et reste présent dans les jours difficiles.','La vie est meilleure avec quelqu’un comme toi à appeler ami.'],
    heartBroken:['Je sais que ça fait mal et tu n’as pas à te presser d’aller mieux.','La guérison n’est pas une ligne droite ; sois doux avec toi-même pendant que ton cœur se répare.','Cette fin n’efface ni ta valeur ni ta capacité à aimer de nouveau.'],
    sick:['Repose-toi autant que nécessaire ; aller mieux est déjà assez de travail pour aujourd’hui.','J’aimerais pouvoir enlever ton inconfort, alors je t’envoie toute mon affection à la place.','Sois doux avec toi-même et laisse à ton corps le temps dont il a besoin.'],
    goodLuck:['Tu t’es préparé pour cela ; fais confiance à ce que tu sais et avance étape par étape.','Je t’encourage et j’espère que les bonnes portes s’ouvriront aujourd’hui.','Quel que soit le résultat, je suis fier du courage qu’il t’a fallu pour te présenter.'],
    holidayRomantic:['Partager les fêtes avec toi donne plus de sens à chaque lumière, chanson et tradition.','Ma partie préférée de toute célébration est d’avoir ta main dans la mienne.','Une fête de plus avec toi, c’est un souvenir de plus que je veux garder.'],
    holidayFamily:['Que nos fêtes en famille soient remplies de patience, de rires, de bons repas et de vraie connexion.','Le meilleur des fêtes est de prendre du temps pour les personnes qui font de la maison un vrai foyer.','Je suis reconnaissant pour les traditions, les histoires et l’amour que partage notre famille.'],
    holidayFriends:['Les fêtes sont plus lumineuses quand de bons amis font partie de la célébration.','Je suis reconnaissant pour l’amitié, les rires et les souvenirs que nous apportons à chaque fête.','À la joie de célébrer avec des amis qui ressemblent à une famille choisie.']
  },
  it:{
    romantic:['Continuo a scegliere te con tutto il cuore, nei momenti ordinari e in quelli straordinari.','Essere amato da te rende significative anche le giornate più semplici.','Ti voglio accanto a me in ogni capitolo che ci aspetta.'],
    lgbtqRomantic:['Amarti apertamente e con autenticità è una delle gioie più grandi della mia vita.','Il nostro amore merita di essere celebrato esattamente com’è: vero, coraggioso e nostro.','Con te non devo mai ridurre ciò che sono per essere amato.'],
    lgbtqSupport:['Ti vedo, ti rispetto e sostengo ogni parte della persona che stai diventando.','Non devi mai guadagnarti la mia accettazione; hai già il mio amore e il mio rispetto.','Qualunque cosa il mondo ti chieda, con me puoi essere pienamente te stesso.'],
    lgbtqMilestone:['Ogni passo verso una vita più autentica merita di essere onorato.','Sono orgoglioso di celebrare i traguardi che raccontano il tuo coraggio e la tua crescita.','Il tuo percorso conta e sono grato di vivere questo capitolo accanto a te.'],
    sweet:['Rendi la mia giornata più dolce semplicemente facendone parte.','Un pensiero di te può trasformare un momento normale in uno bello.','Sei uno dei miei motivi preferiti per sorridere.'],
    playful:['Sei ancora la mia persona preferita con cui scherzare, ridere e rubare qualche snack.','Se amarti fosse una gara, sarei imbarazzantemente preparato.','La vita con te è più divertente, più assurda e proprio come piace a me.'],
    deep:['Conosci parti di me che un tempo tenevo nascoste e le accogli con cura.','Il nostro legame ha cambiato il mio modo di capire fiducia, amore e casa.','Apprezzo un amore che continua a crescere con verità, pazienza e tempo.'],
    appreciation:['Noto le piccole cose silenziose che fai e contano più di quanto immagini.','Grazie per la pazienza, l’impegno e la cura che porti nella mia vita.','Apprezzo non solo ciò che fai, ma anche la persona che sei mentre lo fai.'],
    memories:['Alcuni dei miei ricordi preferiti sono momenti normali diventati speciali perché c’eri tu.','Mi piace guardare indietro e vedere quanto abbiamo riso, imparato e cresciuto insieme.','I ricordi che abbiamo creato mi ricordano quanta vita abbiamo davvero condiviso.'],
    future:['Non vedo l’ora di vivere i progetti che facciamo e le sorprese che non possiamo prevedere.','Il futuro fa meno paura e sembra più emozionante quando lo immagino con te.','Voglio continuare a costruire una vita che lasci a entrambi spazio per crescere.'],
    morning:['Spero che questa mattina inizi con dolcezza e ti ricordi quanto sei amato.','Prima che la giornata diventi frenetica, volevo dirti che sto pensando a te.','Che oggi ti porti pensieri chiari, energia costante e almeno un motivo per sorridere.'],
    night:['Riposa stanotte sapendo che sei curato, apprezzato e amato.','Qualunque cosa abbia portato oggi, non devi trascinarla tutta fino a domani.','Spero che il sonno ti porti pace e il mattino nuova energia.'],
    daily:['Nessuna occasione speciale, solo un promemoria: oggi sei importante per me.','Spero che qualcosa di piccolo e bello ti trovi prima che finisca la giornata.','Comunque vada oggi, io sono dalla tua parte.'],
    special:['Questo traguardo personale merita di essere celebrato per tutto ciò che rappresenta nel tuo percorso.','Sono orgoglioso di ciò che hai raggiunto ed entusiasta per quello che verrà.','Oggi appartiene a te e al lavoro, al coraggio e alla crescita che ti hanno portato fin qui.'],
    dateIdeas:['Mettiamo via i telefoni, proviamo un posto nuovo e creiamo un ricordo.','Organizziamo una serata semplice con buon cibo, una passeggiata e tempo per parlare davvero.','Scegliamo ciascuno un’attività a sorpresa e trasformiamo un giorno normale in un appuntamento.'],
    milestone:['Guarda quanta strada abbiamo fatto: questo traguardo merita un vero momento di gratitudine.','Ogni traguardo racconta una parte della nostra storia e sono orgoglioso di ciò che stiamo costruendo.','Questo momento merita di essere celebrato perché ci siamo arrivati insieme.'],
    justBecause:['Non c’è nessun motivo per questa nota, tranne che ho pensato a te e ho sorriso.','Non mi serve un giorno speciale per ricordarti quanto sei importante per me.','Solo perché: la mia vita è migliore perché tu ne fai parte.'],
    encouragement:['Non devi risolvere tutto oggi; fai solo il prossimo passo sincero.','Credo nella tua capacità di affrontare ciò che hai davanti.','Hai già superato giorni difficili e non devi affrontare questo da solo.'],
    apology:['Mi dispiace per il dolore che ho causato e voglio che le mie azioni dimostrino che l’ho capito.','In quel momento meritavi più attenzione da parte mia e mi impegno a fare meglio.','Non posso cancellare ciò che è successo, ma posso ascoltare, assumermi la responsabilità e cambiare.'],
    family:['La famiglia diventa più forte quando facciamo spazio a pazienza, sincerità e gentilezza.','Sono grato per l’amore, la storia e il sostegno che condividiamo come famiglia.','Nessuna famiglia è perfetta, ma sono grato che continuiamo a scegliere il legame.'],
    friends:['La tua amicizia ha portato risate, prospettiva e conforto nella mia vita.','Sono grato di avere un amico che celebra i giorni belli e resta nei giorni difficili.','La vita è migliore con una persona come te da chiamare amico.'],
    heartBroken:['So che fa male e non devi avere fretta di stare meglio.','La guarigione non è una linea retta; sii gentile con te stesso mentre il tuo cuore si riprende.','Questa fine non cancella il tuo valore né la tua capacità di amare ancora.'],
    sick:['Riposa quanto ti serve; stare meglio è già abbastanza lavoro per oggi.','Vorrei poterti togliere il disagio, quindi ti mando affetto al suo posto.','Sii gentile con te stesso e dai al tuo corpo il tempo di cui ha bisogno.'],
    goodLuck:['Ti sei preparato per questo; fidati di ciò che sai e procedi un passo alla volta.','Faccio il tifo per te e spero che oggi si aprano le porte giuste.','Qualunque sia il risultato, sono orgoglioso del coraggio che hai avuto nel presentarti.'],
    holidayRomantic:['Condividere le feste con te rende ogni luce, canzone e tradizione più significativa.','La mia parte preferita di ogni festa è avere la tua mano nella mia.','Un’altra celebrazione con te è un altro ricordo che voglio conservare.'],
    holidayFamily:['Che le nostre feste in famiglia siano piene di pazienza, risate, buon cibo e vera connessione.','La parte migliore delle feste è trovare tempo per le persone che fanno sentire casa davvero casa.','Sono grato per le tradizioni, le storie e l’amore che la nostra famiglia condivide.'],
    holidayFriends:['Le feste sono più luminose quando buoni amici fanno parte della celebrazione.','Sono grato per l’amicizia, le risate e i ricordi che portiamo in ogni festa.','Ecco a festeggiare con amici che sembrano una famiglia scelta.']
  },
  de:{
    romantic:['Ich entscheide mich immer noch mit ganzem Herzen für dich, in gewöhnlichen wie in besonderen Momenten.','Von dir geliebt zu werden gibt selbst einfachen Tagen Bedeutung.','Ich möchte dich in jedem Kapitel, das noch vor uns liegt, an meiner Seite haben.'],
    lgbtqRomantic:['Dich offen und authentisch zu lieben gehört zu den größten Freuden meines Lebens.','Unsere Liebe verdient es, genau so gefeiert zu werden, wie sie ist: echt, mutig und unsere.','Bei dir muss ich mich nie kleiner machen, um geliebt zu werden.'],
    lgbtqSupport:['Ich sehe dich, respektiere dich und unterstütze jeden Teil der Person, zu der du wirst.','Du musst dir meine Akzeptanz nie verdienen; du hast bereits meine Liebe und meinen Respekt.','Was auch immer die Welt von dir verlangt, bei mir darfst du ganz du selbst sein.'],
    lgbtqMilestone:['Jeder Schritt zu einem authentischeren Leben verdient Anerkennung.','Ich bin stolz darauf, die Meilensteine zu feiern, die deinen Mut und dein Wachstum zeigen.','Dein Weg zählt, und ich bin dankbar, dieses Kapitel mit dir erleben zu dürfen.'],
    sweet:['Du machst meinen Tag allein dadurch sanfter, dass du ein Teil davon bist.','Ein Gedanke an dich kann einen gewöhnlichen Moment in einen guten verwandeln.','Du bist einer meiner liebsten Gründe zu lächeln.'],
    playful:['Du bist immer noch mein Lieblingsmensch zum Necken, Lachen und Snacks-Klauen.','Wenn dich zu lieben ein Wettbewerb wäre, wäre ich peinlich gut vorbereitet.','Das Leben mit dir ist lustiger, verrückter und genau so, wie ich es mag.'],
    deep:['Du kennst Seiten von mir, die ich früher verborgen habe, und gehst behutsam mit ihnen um.','Unsere Verbindung hat verändert, wie ich Vertrauen, Liebe und Zuhause verstehe.','Ich schätze eine Liebe, die mit Wahrheit, Geduld und Zeit weiter wächst.'],
    appreciation:['Ich bemerke die stillen Dinge, die du tust, und sie bedeuten mehr, als du denkst.','Danke für die Geduld, Mühe und Fürsorge, die du in mein Leben bringst.','Ich schätze nicht nur, was du tust, sondern auch den Menschen, der du dabei bist.'],
    memories:['Einige meiner liebsten Erinnerungen sind gewöhnliche Momente, die besonders wurden, weil du da warst.','Ich schaue gern zurück und sehe, wie viel wir zusammen gelacht, gelernt und uns entwickelt haben.','Unsere Erinnerungen zeigen mir, wie viel Leben wir wirklich miteinander geteilt haben.'],
    future:['Ich freue mich auf unsere Pläne und auf die Überraschungen, die wir noch nicht kennen.','Die Zukunft wirkt weniger beängstigend und viel spannender, wenn ich sie mir mit dir vorstelle.','Ich möchte weiter ein Leben aufbauen, in dem wir beide Raum zum Wachsen haben.'],
    morning:['Ich hoffe, dieser Morgen beginnt sanft und erinnert dich daran, wie sehr du geliebt wirst.','Bevor der Tag hektisch wird, wollte ich dir sagen, dass ich an dich denke.','Möge dir dieser Tag klare Gedanken, ruhige Energie und mindestens einen Grund zum Lächeln schenken.'],
    night:['Ruhe dich heute Nacht aus in dem Wissen, dass du umsorgt, geschätzt und geliebt wirst.','Was auch immer dieser Tag gebracht hat, du musst nicht alles mit in den morgigen Tag nehmen.','Ich hoffe, der Schlaf bringt dir Frieden und der Morgen neue Energie.'],
    daily:['Kein besonderer Anlass, nur eine Erinnerung daran, dass du mir heute wichtig bist.','Ich hoffe, etwas Kleines und Gutes findet dich noch, bevor dieser Tag vorbei ist.','Wie dieser Tag auch aussieht, ich stehe auf deiner Seite.'],
    special:['Dieser persönliche Meilenstein verdient eine Feier für alles, was er auf deinem Weg bedeutet.','Ich bin stolz auf das, was du erreicht hast, und freue mich auf das, was als Nächstes kommt.','Dieser Tag gehört dir und der Arbeit, dem Mut und dem Wachstum, die dich hierher gebracht haben.'],
    dateIdeas:['Lass uns die Handys weglegen, einen neuen Ort ausprobieren und eine Erinnerung schaffen.','Lass uns einen einfachen Abend mit gutem Essen, einem Spaziergang und Zeit für echte Gespräche planen.','Lass uns beide eine Überraschungsaktivität wählen und einen normalen Tag in ein Date verwandeln.'],
    milestone:['Schau, wie weit wir gekommen sind; dieser Meilenstein verdient echte Dankbarkeit.','Jeder Meilenstein erzählt einen Teil unserer Geschichte, und ich bin stolz auf das, was wir aufbauen.','Dieser Moment ist eine Feier wert, weil wir ihn gemeinsam erreicht haben.'],
    justBecause:['Es gibt keinen besonderen Grund für diese Nachricht, außer dass ich an dich gedacht und gelächelt habe.','Ich brauche keinen besonderen Tag, um dich daran zu erinnern, wie wichtig du mir bist.','Einfach so: Mein Leben ist besser, weil du darin bist.'],
    encouragement:['Du musst heute nicht alles lösen; mach einfach den nächsten ehrlichen Schritt.','Ich glaube an deine Fähigkeit, mit dem umzugehen, was vor dir liegt.','Du hast schwere Tage schon früher geschafft und musst diesen nicht allein bewältigen.'],
    apology:['Es tut mir leid, dass ich dich verletzt habe, und ich möchte durch mein Handeln zeigen, dass ich es verstehe.','Du hättest in diesem Moment mehr Rücksicht von mir verdient, und ich will es besser machen.','Ich kann das Geschehene nicht rückgängig machen, aber ich kann zuhören, Verantwortung übernehmen und mich ändern.'],
    family:['Familie wird stärker, wenn wir Raum für Geduld, Ehrlichkeit und Freundlichkeit schaffen.','Ich bin dankbar für die Liebe, Geschichte und Unterstützung, die wir als Familie teilen.','Keine Familie ist perfekt, aber ich bin dankbar, dass wir uns immer wieder für Verbindung entscheiden.'],
    friends:['Deine Freundschaft hat Lachen, Perspektive und Trost in mein Leben gebracht.','Ich bin dankbar für einen Freund, der gute Tage mitfeiert und an schweren Tagen bleibt.','Das Leben ist besser mit jemandem wie dir, den ich Freund nennen darf.'],
    heartBroken:['Ich weiß, dass es weh tut, und du musst dich nicht beeilen, dich besser zu fühlen.','Heilung verläuft nicht gerade; sei freundlich zu dir, während dein Herz nachkommt.','Dieses Ende nimmt dir weder deinen Wert noch deine Fähigkeit, wieder zu lieben.'],
    sick:['Ruh dich so viel aus, wie du brauchst; gesund zu werden ist für heute genug Arbeit.','Ich wünschte, ich könnte dir das Unwohlsein nehmen, also schicke ich dir stattdessen Fürsorge.','Sei sanft zu dir und gib deinem Körper die Zeit, die er braucht.'],
    goodLuck:['Du hast dich vorbereitet; vertraue auf dein Wissen und geh einen Schritt nach dem anderen.','Ich feuere dich an und hoffe, dass sich heute die richtigen Türen öffnen.','Unabhängig vom Ergebnis bin ich stolz auf den Mut, mit dem du dich der Sache gestellt hast.'],
    holidayRomantic:['Die Feiertage mit dir zu teilen lässt jedes Licht, jedes Lied und jede Tradition bedeutungsvoller wirken.','Mein liebster Teil jeder Feier ist, deine Hand in meiner zu halten.','Noch eine Feier mit dir bedeutet noch eine Erinnerung, die ich bewahren möchte.'],
    holidayFamily:['Mögen unsere Familienfeiern voller Geduld, Lachen, gutem Essen und echter Verbundenheit sein.','Das Schönste an den Feiertagen ist Zeit für die Menschen zu haben, die ein Zuhause wirklich wie Zuhause fühlen lassen.','Ich bin dankbar für die Traditionen, Geschichten und die Liebe, die unsere Familie teilt.'],
    holidayFriends:['Die Feiertage sind heller, wenn gute Freunde Teil der Feier sind.','Ich bin dankbar für die Freundschaft, das Lachen und die Erinnerungen, die wir in jede Feier mitbringen.','Auf Feiertage mit Freunden, die sich wie selbst gewählte Familie anfühlen.']
  }
};

function loadMain(){
  let src=fs.readFileSync('src/components/lovenotes/LoveNotesData.jsx','utf8');
  src=src.replace('export const loveNotesData =','globalThis.loveNotesData =');
  const ctx={globalThis:{}}; vm.createContext(ctx); vm.runInContext(src,ctx); return ctx.globalThis.loveNotesData;
}
function loadAdditional(lang){
  let src=fs.readFileSync(`src/components/lovenotes/additional/LoveNotesAdditional.${lang}.js`,'utf8');
  src=src.replace('export default','globalThis.additional =');
  const ctx={globalThis:{}}; vm.createContext(ctx); vm.runInContext(src,ctx); return ctx.globalThis.additional;
}
function makeNote(lang,key,index){
  const theme=themes[lang][key][index%3];
  const prefix=prefixes[lang][index%5];
  const title=`${labels[lang][key]} — ${stems[lang][index%15]}`;
  return {title,content:`${prefix} ${theme}`,tags:['love-note',key,'expanded']};
}

const main=loadMain();
for(const lang of langs){
  if(!main[lang]) main[lang]={};
  for(const key of baseCategories){
    if(!main[lang][key]) main[lang][key]=[];
    const current=main[lang][key].length;
    if(current<15){
      for(let i=current;i<15;i++) main[lang][key].push(makeNote(lang,key,i));
    }
  }
}
fs.writeFileSync('src/components/lovenotes/LoveNotesData.jsx',`\n// Comprehensive love notes data for all languages\nexport const loveNotesData = ${JSON.stringify(main,null,2)};\n`);

const holidayNeeds={romantic:5,family:9,friends:11};
for(const lang of langs){
  const add=loadAdditional(lang);
  const appended=[];
  let serial=0;
  for(const [sub,count] of Object.entries(holidayNeeds)){
    const key=`holiday${sub[0].toUpperCase()}${sub.slice(1)}`;
    for(let i=0;i<count;i++) appended.push(makeNote(lang,key,serial++));
  }
  add.holiday=[...(add.holiday||[]),...appended];
  fs.writeFileSync(`src/components/lovenotes/additional/LoveNotesAdditional.${lang}.js`,`// Additional Love Notes categories for this language.\nexport default ${JSON.stringify(add,null,2)};\n`);
}

const pagePath='src/pages/LoveNotes.jsx';
let page=fs.readFileSync(pagePath,'utf8');
const oldBlock=/const holidaySubcategoryAssignments = \[(.*?)\];/s;
const match=page.match(oldBlock);
if(!match) throw new Error('Holiday subcategory assignments not found');
const existing=[...match[1].matchAll(/'(romantic|family|friends)'/g)].map(m=>m[1]);
if(existing.length!==20) throw new Error(`Expected 20 existing Holiday assignments, found ${existing.length}`);
const expanded=[...existing,...Array(5).fill('romantic'),...Array(9).fill('family'),...Array(11).fill('friends')];
const block=`const holidaySubcategoryAssignments = [\n  ${expanded.map(x=>`'${x}'`).join(', ')}\n];`;
page=page.replace(oldBlock,block);
fs.writeFileSync(pagePath,page);

// Verification: every top-level category is at least 15, categories already above 15 were not reduced,
// and Holiday subcategories are exactly 15 each.
const verifyMain=loadMain();
for(const lang of langs){
  const add=loadAdditional(lang);
  const merged={...(verifyMain[lang]||{}),...add};
  merged.holiday=[...((verifyMain[lang]||{}).holiday||[]),...(add.holiday||[])];
  const required=[...baseCategories,'holiday','religious','service','workplace'];
  for(const key of required){
    if((merged[key]||[]).length<15) throw new Error(`${lang}:${key} has ${merged[key]?.length||0}`);
  }
  if(merged.holiday.length!==45) throw new Error(`${lang}:holiday expected 45 after subcategory expansion, found ${merged.holiday.length}`);
}
const verifyPage=fs.readFileSync(pagePath,'utf8');
const vm2=verifyPage.match(/const holidaySubcategoryAssignments = \[(.*?)\];/s);
const finalAssignments=[...vm2[1].matchAll(/'(romantic|family|friends)'/g)].map(m=>m[1]);
const finalCounts=finalAssignments.reduce((o,x)=>(o[x]=(o[x]||0)+1,o),{});
if(finalCounts.romantic!==15||finalCounts.family!==15||finalCounts.friends!==15) throw new Error(`Holiday subcategory counts invalid: ${JSON.stringify(finalCounts)}`);
console.log('Love Notes expansion complete. Holiday subcategories:',finalCounts);
