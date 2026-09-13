const titleSets = {
  en: {
    romantic: ['From My Heart', 'For Us', 'Close to You', 'Together', 'With Love'],
    family: ['With Family Love', 'For You, Always', 'Family Matters', 'In Your Corner', 'From the Family'],
    casual: ['Thinking of You', 'Just a Note', 'For You Today', 'A Good Thought', 'Sending Good Energy'],
  },
  es: {
    romantic: ['Desde Mi Corazón', 'Para Nosotros', 'Cerca de Ti', 'Juntos', 'Con Amor'],
    family: ['Con Amor de Familia', 'Para Ti, Siempre', 'La Familia Importa', 'A Tu Lado', 'De Parte de la Familia'],
    casual: ['Pensando en Ti', 'Solo una Nota', 'Para Ti Hoy', 'Un Buen Pensamiento', 'Enviando Buena Energía'],
  },
  fr: {
    romantic: ['De Tout Mon Cœur', 'Pour Nous', 'Près de Toi', 'Ensemble', 'Avec Amour'],
    family: ['Avec l’Amour de la Famille', 'Pour Toi, Toujours', 'La Famille Compte', 'À Tes Côtés', 'De la Part de la Famille'],
    casual: ['Je Pense à Toi', 'Juste un Mot', 'Pour Toi Aujourd’hui', 'Une Bonne Pensée', 'De Bonnes Ondes'],
  },
  it: {
    romantic: ['Dal Mio Cuore', 'Per Noi', 'Vicino a Te', 'Insieme', 'Con Amore'],
    family: ['Con Amore di Famiglia', 'Per Te, Sempre', 'La Famiglia Conta', 'Al Tuo Fianco', 'Dalla Famiglia'],
    casual: ['Ti Penso', 'Solo un Messaggio', 'Per Te Oggi', 'Un Bel Pensiero', 'Buona Energia'],
  },
  de: {
    romantic: ['Von Herzen', 'Für Uns', 'Dir Nah', 'Gemeinsam', 'Mit Liebe'],
    family: ['Mit Familienliebe', 'Für Dich, Immer', 'Familie Zählt', 'An Deiner Seite', 'Von der Familie'],
    casual: ['Ich Denke an Dich', 'Nur eine Nachricht', 'Für Dich Heute', 'Ein Guter Gedanke', 'Gute Energie für Dich'],
  },
};

const messageSets = {
  en: {
    romantic: {
      family: [
        'I hope you always choose a relationship where you feel safe, respected, and fully yourself.',
        'As someone who loves you, I want your relationship to bring you peace, honesty, and mutual care.',
        'May the person you choose value your heart, your boundaries, and the life you are building.',
        'Whatever your love life brings, you have family who wants happiness, respect, and steadiness for you.',
        'I hope your relationship grows through trust, kindness, laughter, and room for both of you to grow.',
      ],
      casual: [
        'I hope you find a connection that feels mutual, honest, and good for both of you.',
        'Wishing you the kind of relationship where communication is clear and respect goes both ways.',
        'May the person you choose appreciate who you are without asking you to become someone else.',
        'Here is to a relationship with good boundaries, real effort, and plenty of reasons to smile.',
        'I hope love meets you in a way that feels healthy, steady, and worth showing up for.',
      ],
    },
    lgbtqRomantic: {
      family: [
        'Your relationship deserves the same respect, care, and celebration as any love built with honesty and commitment.',
        'I want you to know that your happiness and the person you love are welcome in my heart and in this family.',
        'May your relationship give you both room to be fully yourselves and deeply supported.',
        'I am proud to see you build love in a way that is authentic, caring, and true to who you are.',
        'You deserve a love that honors your identity, your boundaries, and the future you want to create together.',
      ],
      casual: [
        'I am glad to see you with someone who lets you be fully yourself and treats your heart with care.',
        'Your relationship deserves respect, joy, and the freedom to grow on its own terms.',
        'Wishing you both the kind of connection that feels honest, mutual, and easy to be proud of.',
        'I support the love that makes you feel seen, safe, and more like yourself.',
        'Here is to a relationship built on authenticity, communication, laughter, and real respect.',
      ],
    },
    family: {
      romantic: [
        'Building a life with you has made the word family feel warmer, deeper, and more meaningful to me.',
        'I love the way we keep choosing each other while creating a home where both of us can belong.',
        'Whatever shape our family takes, I am grateful that we get to build it side by side.',
        'You are my partner, my safe place, and one of the reasons home feels like home.',
        'I want our family life to keep growing from the same things that strengthen us: love, honesty, patience, and teamwork.',
      ],
      casual: [
        'I hope you and your family are doing well and finding time to enjoy one another.',
        'Thinking of your family today and sending good wishes for peace, health, and plenty of laughter.',
        'Family life can be busy, so I hope you get a little time together that feels easy and meaningful.',
        'Wishing your household a week filled with patience, good conversations, and small moments worth remembering.',
        'Sending warm thoughts to you and the people who matter most to you at home.',
      ],
    },
    friends: {
      romantic: [
        'One of my favorite things about loving you is that I also genuinely like you as my closest friend.',
        'The friendship inside our relationship makes the love between us stronger, lighter, and more honest.',
        'I love that we can be romantic, ridiculous, serious, and completely ourselves with each other.',
        'You are the person I want beside me for the big moments and the ordinary conversations in between.',
        'Our love means even more to me because it is built on trust, laughter, and real friendship.',
      ],
      family: [
        'I am grateful that being family also means we can laugh, talk, and enjoy each other like true friends.',
        'Some family bonds become friendships too, and I am thankful ours gives us both connection and trust.',
        'I appreciate having a family member I can talk to honestly and still laugh with when life gets heavy.',
        'Our family connection matters to me, and so does the friendship we have built inside it.',
        'Thank you for being family I can count on and a person whose company I genuinely enjoy.',
      ],
    },
    dateIdeas: {
      family: [
        'Pick a favorite meal, let everyone help with one part, and turn dinner into a relaxed family night.',
        'Choose a neighborhood or park you have not explored together and make a simple family adventure out of it.',
        'Have a no-phone game night with snacks, music, and one game everyone gets a turn choosing.',
        'Look through old photos together, tell the stories behind them, and make a new memory before the night ends.',
        'Plan a low-cost family outing where each person gets to choose one small stop or activity.',
      ],
      casual: [
        'Grab coffee or lunch somewhere new and make the whole plan simply catching up without rushing.',
        'Pick an easy local activity neither of you has tried and turn it into a low-pressure mini adventure.',
        'Take a walk somewhere interesting, leave the phones mostly away, and give yourselves time to really talk.',
        'Try a trivia night, casual game night, or community event and let the activity do some of the conversation work.',
        'Choose one inexpensive food stop each and make a simple two-stop outing with plenty of time to laugh and catch up.',
      ],
    },
  },
  es: {
    romantic: {
      family: [
        'Espero que siempre elijas una relación en la que te sientas seguro, respetado y plenamente tú mismo.',
        'Como alguien que te quiere, deseo que tu relación te dé paz, honestidad y cuidado mutuo.',
        'Que la persona que elijas valore tu corazón, tus límites y la vida que estás construyendo.',
        'Pase lo que pase en tu vida amorosa, tienes una familia que quiere para ti felicidad, respeto y estabilidad.',
        'Espero que tu relación crezca con confianza, bondad, risas y espacio para que ambos sigan creciendo.',
      ],
      casual: [
        'Espero que encuentres una conexión mutua, honesta y buena para los dos.',
        'Te deseo una relación donde la comunicación sea clara y el respeto vaya en ambas direcciones.',
        'Que la persona que elijas aprecie quién eres sin pedirte que te conviertas en otra persona.',
        'Brindo por una relación con buenos límites, esfuerzo verdadero y muchas razones para sonreír.',
        'Espero que el amor llegue de una forma sana, estable y que valga la pena cuidar.',
      ],
    },
    lgbtqRomantic: {
      family: [
        'Tu relación merece el mismo respeto, cuidado y celebración que cualquier amor construido con honestidad y compromiso.',
        'Quiero que sepas que tu felicidad y la persona que amas son bienvenidas en mi corazón y en esta familia.',
        'Que su relación les dé a ambos espacio para ser plenamente ustedes mismos y sentirse apoyados.',
        'Me enorgullece verte construir un amor auténtico, cariñoso y fiel a quien eres.',
        'Mereces un amor que respete tu identidad, tus límites y el futuro que quieren crear juntos.',
      ],
      casual: [
        'Me alegra verte con alguien que te permite ser plenamente tú y trata tu corazón con cuidado.',
        'Tu relación merece respeto, alegría y libertad para crecer a su manera.',
        'Les deseo una conexión honesta, mutua y de la que ambos puedan sentirse orgullosos.',
        'Apoyo el amor que te hace sentir visto, seguro y más tú mismo.',
        'Brindo por una relación basada en autenticidad, comunicación, risas y respeto verdadero.',
      ],
    },
    family: {
      romantic: [
        'Construir una vida contigo ha hecho que la palabra familia se sienta más cálida, profunda y significativa.',
        'Me encanta cómo seguimos eligiéndonos mientras creamos un hogar donde ambos podemos pertenecer.',
        'Sea cual sea la forma de nuestra familia, agradezco que podamos construirla lado a lado.',
        'Eres mi pareja, mi lugar seguro y una de las razones por las que el hogar se siente como hogar.',
        'Quiero que nuestra vida familiar siga creciendo con amor, honestidad, paciencia y trabajo en equipo.',
      ],
      casual: [
        'Espero que tú y tu familia estén bien y encuentren tiempo para disfrutar juntos.',
        'Pienso en tu familia hoy y les envío buenos deseos de paz, salud y muchas risas.',
        'La vida familiar puede ser ocupada, así que espero que tengan un poco de tiempo juntos que se sienta fácil y especial.',
        'Deseo para tu hogar una semana con paciencia, buenas conversaciones y pequeños momentos para recordar.',
        'Envío pensamientos cálidos para ti y las personas que más importan en tu hogar.',
      ],
    },
    friends: {
      romantic: [
        'Una de mis cosas favoritas de amarte es que también me gusta de verdad tenerte como mi mejor amigo.',
        'La amistad dentro de nuestra relación hace que nuestro amor sea más fuerte, ligero y honesto.',
        'Me encanta que podamos ser románticos, divertidos, serios y completamente nosotros mismos.',
        'Eres la persona que quiero a mi lado en los grandes momentos y en las conversaciones sencillas.',
        'Nuestro amor significa aún más porque está construido sobre confianza, risas y amistad verdadera.',
      ],
      family: [
        'Agradezco que ser familia también signifique que podemos reír, hablar y disfrutarnos como verdaderos amigos.',
        'Algunos lazos familiares también se vuelven amistad, y agradezco que el nuestro tenga conexión y confianza.',
        'Valoro tener un familiar con quien puedo hablar con honestidad y también reír cuando la vida pesa.',
        'Nuestra conexión familiar me importa, y también la amistad que hemos construido dentro de ella.',
        'Gracias por ser familia en quien puedo confiar y alguien cuya compañía disfruto de verdad.',
      ],
    },
    dateIdeas: {
      family: [
        'Elijan una comida favorita, dejen que todos ayuden con una parte y conviertan la cena en una noche familiar relajada.',
        'Elijan un parque o barrio que no hayan explorado juntos y conviértanlo en una pequeña aventura familiar.',
        'Hagan una noche de juegos sin teléfonos, con bocadillos, música y un juego elegido por cada persona.',
        'Miren fotos antiguas, cuenten las historias detrás de ellas y creen un recuerdo nuevo antes de terminar la noche.',
        'Planeen una salida familiar económica donde cada persona elija una pequeña parada o actividad.',
      ],
      casual: [
        'Tomen un café o almuerzo en un lugar nuevo y hagan que el plan sea simplemente ponerse al día sin prisa.',
        'Elijan una actividad local sencilla que ninguno haya probado y conviértanla en una mini aventura sin presión.',
        'Den un paseo por un lugar interesante, dejen los teléfonos a un lado y dense tiempo para hablar de verdad.',
        'Prueben una noche de trivia, juegos o un evento comunitario y dejen que la actividad ayude a la conversación.',
        'Elijan cada uno una parada económica para comer y conviértanlo en una salida sencilla de dos paradas para reír y ponerse al día.',
      ],
    },
  },
  fr: {
    romantic: {
      family: [
        'J’espère que tu choisiras toujours une relation où tu te sens en sécurité, respecté et pleinement toi-même.',
        'Comme quelqu’un qui t’aime, je souhaite que ta relation t’apporte paix, honnêteté et attention réciproque.',
        'Que la personne que tu choisis respecte ton cœur, tes limites et la vie que tu construis.',
        'Quoi qu’il arrive dans ta vie amoureuse, ta famille veut pour toi du bonheur, du respect et de la stabilité.',
        'J’espère que ta relation grandira avec confiance, gentillesse, rires et de la place pour évoluer tous les deux.',
      ],
      casual: [
        'J’espère que tu trouveras une relation réciproque, honnête et bonne pour vous deux.',
        'Je te souhaite une relation où la communication est claire et le respect va dans les deux sens.',
        'Que la personne que tu choisis apprécie qui tu es sans te demander de devenir quelqu’un d’autre.',
        'À une relation avec de bonnes limites, de vrais efforts et beaucoup de raisons de sourire.',
        'J’espère que l’amour te trouvera d’une manière saine, stable et digne de ton engagement.',
      ],
    },
    lgbtqRomantic: {
      family: [
        'Ta relation mérite le même respect, le même soin et la même célébration que tout amour fondé sur l’honnêteté et l’engagement.',
        'Je veux que tu saches que ton bonheur et la personne que tu aimes sont les bienvenus dans mon cœur et dans cette famille.',
        'Que votre relation vous donne à tous les deux l’espace d’être pleinement vous-mêmes et profondément soutenus.',
        'Je suis fier de te voir construire un amour authentique, attentionné et fidèle à qui tu es.',
        'Tu mérites un amour qui respecte ton identité, tes limites et l’avenir que vous voulez créer ensemble.',
      ],
      casual: [
        'Je suis heureux de te voir avec quelqu’un qui te laisse être pleinement toi-même et prend soin de ton cœur.',
        'Ta relation mérite respect, joie et liberté de grandir à sa façon.',
        'Je vous souhaite une relation honnête, réciproque et dont vous pouvez tous les deux être fiers.',
        'Je soutiens l’amour qui te fait te sentir vu, en sécurité et davantage toi-même.',
        'À une relation fondée sur l’authenticité, la communication, les rires et le vrai respect.',
      ],
    },
    family: {
      romantic: [
        'Construire une vie avec toi a rendu le mot famille plus chaleureux, plus profond et plus précieux pour moi.',
        'J’aime la façon dont nous continuons à nous choisir tout en créant un foyer où nous avons tous les deux notre place.',
        'Quelle que soit la forme de notre famille, je suis reconnaissant que nous puissions la construire côte à côte.',
        'Tu es mon partenaire, mon refuge et l’une des raisons pour lesquelles la maison ressemble vraiment à un foyer.',
        'Je veux que notre vie de famille continue de grandir avec amour, honnêteté, patience et esprit d’équipe.',
      ],
      casual: [
        'J’espère que toi et ta famille allez bien et trouvez du temps pour profiter les uns des autres.',
        'Je pense à ta famille aujourd’hui et vous souhaite paix, santé et beaucoup de rires.',
        'La vie de famille peut être chargée, alors j’espère que vous aurez un moment simple et précieux ensemble.',
        'Je souhaite à ton foyer une semaine de patience, de bonnes conversations et de petits moments à retenir.',
        'J’envoie des pensées chaleureuses à toi et aux personnes qui comptent le plus chez toi.',
      ],
    },
    friends: {
      romantic: [
        'L’une de mes choses préférées dans le fait de t’aimer est que je t’apprécie aussi sincèrement comme mon meilleur ami.',
        'L’amitié au cœur de notre relation rend notre amour plus fort, plus léger et plus honnête.',
        'J’aime que nous puissions être romantiques, drôles, sérieux et totalement nous-mêmes ensemble.',
        'Tu es la personne que je veux à mes côtés dans les grands moments comme dans les conversations ordinaires.',
        'Notre amour compte encore plus pour moi parce qu’il repose sur la confiance, les rires et une vraie amitié.',
      ],
      family: [
        'Je suis reconnaissant que le fait d’être de la même famille signifie aussi que nous pouvons rire, parler et nous apprécier comme de vrais amis.',
        'Certains liens familiaux deviennent aussi des amitiés, et je suis heureux que le nôtre nous apporte proximité et confiance.',
        'J’apprécie d’avoir un membre de la famille avec qui je peux parler franchement et rire quand la vie devient lourde.',
        'Notre lien familial compte pour moi, tout comme l’amitié que nous avons construite à l’intérieur de ce lien.',
        'Merci d’être une personne de ma famille sur qui je peux compter et dont j’apprécie vraiment la compagnie.',
      ],
    },
    dateIdeas: {
      family: [
        'Choisissez un repas préféré, laissez chacun préparer une partie et transformez le dîner en soirée familiale détendue.',
        'Choisissez un parc ou un quartier que vous n’avez jamais exploré ensemble et faites-en une petite aventure familiale.',
        'Organisez une soirée jeux sans téléphone avec des collations, de la musique et un jeu choisi à tour de rôle.',
        'Regardez de vieilles photos, racontez les histoires qui vont avec et créez un nouveau souvenir avant la fin de la soirée.',
        'Planifiez une sortie familiale peu coûteuse où chacun choisit un petit arrêt ou une activité.',
      ],
      casual: [
        'Prenez un café ou déjeunez dans un nouvel endroit et faites simplement de ce moment une occasion de vous retrouver sans vous presser.',
        'Choisissez une activité locale simple que vous n’avez jamais essayée et faites-en une mini-aventure sans pression.',
        'Promenez-vous dans un endroit intéressant, laissez les téléphones de côté et prenez le temps de vraiment parler.',
        'Essayez une soirée quiz, jeux ou un événement local et laissez l’activité faciliter naturellement la conversation.',
        'Choisissez chacun une petite adresse abordable et faites une sortie en deux étapes avec du temps pour rire et discuter.',
      ],
    },
  },
  it: {
    romantic: {
      family: [
        'Spero che tu scelga sempre una relazione in cui ti senti al sicuro, rispettato e pienamente te stesso.',
        'Come persona che ti vuole bene, desidero che la tua relazione ti porti pace, sincerità e cura reciproca.',
        'Che la persona che scegli sappia rispettare il tuo cuore, i tuoi confini e la vita che stai costruendo.',
        'Qualunque cosa accada nella tua vita sentimentale, hai una famiglia che desidera per te felicità, rispetto e stabilità.',
        'Spero che la tua relazione cresca con fiducia, gentilezza, risate e spazio per crescere entrambi.',
      ],
      casual: [
        'Spero che tu trovi una connessione reciproca, sincera e positiva per entrambi.',
        'Ti auguro una relazione in cui la comunicazione sia chiara e il rispetto vada in entrambe le direzioni.',
        'Che la persona che scegli apprezzi chi sei senza chiederti di diventare qualcun altro.',
        'A una relazione con buoni confini, impegno vero e tanti motivi per sorridere.',
        'Spero che l’amore arrivi in modo sano, stabile e degno del tuo impegno.',
      ],
    },
    lgbtqRomantic: {
      family: [
        'La tua relazione merita lo stesso rispetto, la stessa cura e la stessa celebrazione di ogni amore costruito con sincerità e impegno.',
        'Voglio che tu sappia che la tua felicità e la persona che ami sono benvenute nel mio cuore e in questa famiglia.',
        'Che la vostra relazione dia a entrambi lo spazio per essere pienamente voi stessi e sentirvi sostenuti.',
        'Sono orgoglioso di vederti costruire un amore autentico, premuroso e fedele a chi sei.',
        'Meriti un amore che rispetti la tua identità, i tuoi confini e il futuro che volete creare insieme.',
      ],
      casual: [
        'Sono felice di vederti con qualcuno che ti lascia essere pienamente te stesso e tratta il tuo cuore con cura.',
        'La tua relazione merita rispetto, gioia e libertà di crescere a modo suo.',
        'Vi auguro una connessione sincera, reciproca e di cui entrambi possiate essere orgogliosi.',
        'Sostengo l’amore che ti fa sentire visto, al sicuro e ancora più te stesso.',
        'A una relazione costruita su autenticità, comunicazione, risate e vero rispetto.',
      ],
    },
    family: {
      romantic: [
        'Costruire una vita con te ha reso la parola famiglia più calda, profonda e significativa per me.',
        'Amo il modo in cui continuiamo a sceglierci mentre creiamo una casa in cui entrambi possiamo sentirci parte.',
        'Qualunque forma prenda la nostra famiglia, sono grato che possiamo costruirla fianco a fianco.',
        'Sei il mio partner, il mio posto sicuro e uno dei motivi per cui casa sembra davvero casa.',
        'Voglio che la nostra vita familiare continui a crescere con amore, sincerità, pazienza e lavoro di squadra.',
      ],
      casual: [
        'Spero che tu e la tua famiglia stiate bene e troviate tempo per stare bene insieme.',
        'Penso alla tua famiglia oggi e mando auguri di pace, salute e tante risate.',
        'La vita familiare può essere intensa, quindi spero che troviate un po’ di tempo semplice e significativo insieme.',
        'Auguro alla tua casa una settimana di pazienza, belle conversazioni e piccoli momenti da ricordare.',
        'Mando pensieri affettuosi a te e alle persone che contano di più nella tua casa.',
      ],
    },
    friends: {
      romantic: [
        'Una delle cose che amo di più nell’amarti è che mi piace davvero averti anche come mio migliore amico.',
        'L’amicizia dentro la nostra relazione rende il nostro amore più forte, leggero e sincero.',
        'Amo il fatto che possiamo essere romantici, divertenti, seri e completamente noi stessi insieme.',
        'Sei la persona che voglio accanto nei grandi momenti e nelle conversazioni semplici di ogni giorno.',
        'Il nostro amore significa ancora di più perché è costruito su fiducia, risate e vera amicizia.',
      ],
      family: [
        'Sono grato che essere famiglia significhi anche poter ridere, parlare e stare bene insieme come veri amici.',
        'Alcuni legami familiari diventano anche amicizie, e sono felice che il nostro ci dia vicinanza e fiducia.',
        'Apprezzo avere un familiare con cui posso parlare con sincerità e anche ridere quando la vita pesa.',
        'Il nostro legame familiare conta per me, così come l’amicizia che abbiamo costruito al suo interno.',
        'Grazie per essere una persona di famiglia su cui posso contare e di cui apprezzo davvero la compagnia.',
      ],
    },
    dateIdeas: {
      family: [
        'Scegliete un piatto preferito, lasciate che ognuno prepari una parte e trasformate la cena in una serata familiare rilassata.',
        'Scegliete un parco o un quartiere che non avete mai esplorato insieme e fatene una piccola avventura di famiglia.',
        'Organizzate una serata giochi senza telefoni, con snack, musica e un gioco scelto a turno da ciascuno.',
        'Guardate vecchie foto, raccontate le storie dietro di esse e create un nuovo ricordo prima che finisca la serata.',
        'Pianificate un’uscita familiare economica in cui ogni persona sceglie una piccola tappa o attività.',
      ],
      casual: [
        'Prendete un caffè o pranzate in un posto nuovo e fate del piano semplicemente un’occasione per aggiornarvi senza fretta.',
        'Scegliete una semplice attività locale che nessuno dei due ha provato e trasformate la giornata in una mini-avventura senza pressione.',
        'Fate una passeggiata in un posto interessante, lasciate i telefoni da parte e prendetevi tempo per parlare davvero.',
        'Provate una serata quiz, giochi o un evento locale e lasciate che l’attività renda la conversazione più naturale.',
        'Scegliete una piccola tappa economica per mangiare a testa e create un’uscita in due tappe con tempo per ridere e aggiornarvi.',
      ],
    },
  },
  de: {
    romantic: {
      family: [
        'Ich hoffe, du wählst immer eine Beziehung, in der du dich sicher, respektiert und ganz du selbst fühlen kannst.',
        'Als jemand, der dich liebt, wünsche ich dir eine Beziehung mit Frieden, Ehrlichkeit und gegenseitiger Fürsorge.',
        'Möge die Person an deiner Seite dein Herz, deine Grenzen und das Leben, das du aufbaust, respektieren.',
        'Was auch immer dein Liebesleben bringt, deine Familie wünscht dir Glück, Respekt und Beständigkeit.',
        'Ich hoffe, eure Beziehung wächst durch Vertrauen, Freundlichkeit, Lachen und Raum für euch beide.',
      ],
      casual: [
        'Ich hoffe, du findest eine Verbindung, die ehrlich, gegenseitig und gut für euch beide ist.',
        'Ich wünsche dir eine Beziehung mit klarer Kommunikation und Respekt in beide Richtungen.',
        'Möge die Person, die du wählst, dich so schätzen, wie du bist, ohne dich verändern zu wollen.',
        'Auf eine Beziehung mit guten Grenzen, echtem Einsatz und vielen Gründen zum Lächeln.',
        'Ich hoffe, die Liebe begegnet dir auf eine gesunde, verlässliche und gute Weise.',
      ],
    },
    lgbtqRomantic: {
      family: [
        'Eure Beziehung verdient denselben Respekt, dieselbe Fürsorge und dieselbe Freude wie jede Liebe, die auf Ehrlichkeit und Verbindlichkeit beruht.',
        'Ich möchte, dass du weißt: Dein Glück und die Person, die du liebst, sind in meinem Herzen und in dieser Familie willkommen.',
        'Möge eure Beziehung euch beiden Raum geben, ganz ihr selbst zu sein und euch tief unterstützt zu fühlen.',
        'Ich bin stolz darauf zu sehen, wie du eine Liebe aufbaust, die authentisch, fürsorglich und dir selbst treu ist.',
        'Du verdienst eine Liebe, die deine Identität, deine Grenzen und eure gemeinsame Zukunft respektiert.',
      ],
      casual: [
        'Ich freue mich, dich mit jemandem zu sehen, bei dem du ganz du selbst sein kannst und der achtsam mit deinem Herzen umgeht.',
        'Eure Beziehung verdient Respekt, Freude und die Freiheit, auf ihre eigene Weise zu wachsen.',
        'Ich wünsche euch eine Verbindung, die ehrlich, gegenseitig und etwas ist, auf das ihr beide stolz sein könnt.',
        'Ich unterstütze die Liebe, bei der du dich gesehen, sicher und noch mehr wie du selbst fühlst.',
        'Auf eine Beziehung mit Authentizität, Kommunikation, Lachen und echtem Respekt.',
      ],
    },
    family: {
      romantic: [
        'Mit dir ein Leben aufzubauen hat dem Wort Familie für mich mehr Wärme, Tiefe und Bedeutung gegeben.',
        'Ich liebe es, wie wir uns immer wieder füreinander entscheiden und dabei ein Zuhause schaffen, in dem wir beide dazugehören.',
        'Welche Form unsere Familie auch annimmt, ich bin dankbar, dass wir sie Seite an Seite aufbauen.',
        'Du bist mein Partner, mein sicherer Ort und einer der Gründe, warum sich Zuhause wirklich wie Zuhause anfühlt.',
        'Ich möchte, dass unser Familienleben weiter aus Liebe, Ehrlichkeit, Geduld und Teamarbeit wächst.',
      ],
      casual: [
        'Ich hoffe, dir und deiner Familie geht es gut und ihr findet Zeit, einander zu genießen.',
        'Ich denke heute an deine Familie und wünsche euch Frieden, Gesundheit und viel gemeinsames Lachen.',
        'Familienleben kann voll sein; ich hoffe, ihr findet etwas ruhige und wertvolle Zeit miteinander.',
        'Ich wünsche eurem Zuhause eine Woche mit Geduld, guten Gesprächen und kleinen Momenten, die bleiben.',
        'Warme Gedanken an dich und die Menschen, die dir zu Hause am wichtigsten sind.',
      ],
    },
    friends: {
      romantic: [
        'Eines meiner Lieblingsdinge daran, dich zu lieben, ist, dass ich dich auch wirklich als meinen besten Freund mag.',
        'Die Freundschaft in unserer Beziehung macht unsere Liebe stärker, leichter und ehrlicher.',
        'Ich liebe es, dass wir romantisch, albern, ernst und völlig wir selbst miteinander sein können.',
        'Du bist die Person, die ich bei den großen Momenten und den ganz normalen Gesprächen an meiner Seite haben möchte.',
        'Unsere Liebe bedeutet mir noch mehr, weil sie auf Vertrauen, Lachen und echter Freundschaft aufbaut.',
      ],
      family: [
        'Ich bin dankbar, dass Familie bei uns auch bedeutet, gemeinsam lachen, reden und einander wie echte Freunde genießen zu können.',
        'Manche Familienbande werden auch zu Freundschaften, und ich bin froh, dass unsere Nähe und Vertrauen schenkt.',
        'Ich schätze es, ein Familienmitglied zu haben, mit dem ich ehrlich reden und auch dann lachen kann, wenn das Leben schwer ist.',
        'Unsere Familienverbindung bedeutet mir viel, ebenso wie die Freundschaft, die darin gewachsen ist.',
        'Danke, dass du Familie bist, auf die ich zählen kann, und ein Mensch, dessen Gesellschaft ich wirklich genieße.',
      ],
    },
    dateIdeas: {
      family: [
        'Wählt ein Lieblingsessen, jeder übernimmt einen Teil, und macht aus dem Abendessen einen entspannten Familienabend.',
        'Sucht euch einen Park oder ein Viertel aus, das ihr noch nicht gemeinsam erkundet habt, und macht daraus ein kleines Familienabenteuer.',
        'Macht einen handyfreien Spieleabend mit Snacks, Musik und einem Spiel, das jeder einmal auswählen darf.',
        'Schaut euch alte Fotos an, erzählt die Geschichten dahinter und schafft noch vor Ende des Abends eine neue Erinnerung.',
        'Plant einen günstigen Familienausflug, bei dem jede Person einen kleinen Stopp oder eine Aktivität auswählen darf.',
      ],
      casual: [
        'Trefft euch auf einen Kaffee oder zum Mittagessen an einem neuen Ort und macht den Plan einfach daraus, ohne Eile aufzuholen.',
        'Wählt eine einfache lokale Aktivität, die keiner von euch ausprobiert hat, und macht daraus ein entspanntes Mini-Abenteuer.',
        'Geht an einem interessanten Ort spazieren, lasst die Handys weitgehend weg und nehmt euch Zeit für ein echtes Gespräch.',
        'Probiert einen Quizabend, Spieleabend oder eine lokale Veranstaltung aus und lasst die Aktivität das Gespräch leichter machen.',
        'Jeder wählt einen günstigen Essensstopp, und daraus wird ein einfacher Ausflug mit zwei Stationen, Lachen und Zeit zum Reden.',
      ],
    },
  },
};

const buildNotes = (lang) => {
  const out = {};
  for (const [category, bySubject] of Object.entries(messageSets[lang])) {
    out[category] = {};
    for (const [subject, messages] of Object.entries(bySubject)) {
      out[category][subject] = messages.map((content, index) => ({
        title: titleSets[lang][subject][index],
        content,
        tags: [category, subject, 'subject-safe'],
        subject,
      }));
    }
  }
  return out;
};

export const subjectSupplementalNotes = {
  en: buildNotes('en'),
  es: buildNotes('es'),
  fr: buildNotes('fr'),
  it: buildNotes('it'),
  de: buildNotes('de'),
};

export default subjectSupplementalNotes;
