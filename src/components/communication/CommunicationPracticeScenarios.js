const optionTypes = ['poor', 'excellent', 'poor', 'good'];

const feedbackByLanguage = {
  en: {
    poor: "This response may increase defensiveness or avoid the real issue. Try naming your feelings, the specific behavior, and what you need without blame.",
    good: "This is a respectful start. It could be even stronger with a little more specificity, curiosity, or a clear collaborative request.",
    excellent: "Excellent communication. This response is clear, respectful, emotionally honest, and invites understanding or problem-solving without blame."
  },
  es: {
    poor: "Esta respuesta puede aumentar la defensiva o evitar el problema real. Intenta expresar tus sentimientos, la conducta concreta y lo que necesitas sin culpar.",
    good: "Es un buen comienzo y es respetuoso. Puede mejorar con más claridad, curiosidad o una petición concreta para colaborar.",
    excellent: "Excelente comunicación. La respuesta es clara, respetuosa, emocionalmente honesta e invita a comprender o resolver el problema sin culpar."
  },
  fr: {
    poor: "Cette réponse peut provoquer de la défensive ou éviter le vrai problème. Essayez de nommer vos émotions, le comportement précis et votre besoin sans accuser.",
    good: "C'est un bon début respectueux. Il serait encore meilleur avec davantage de précision, de curiosité ou une demande claire de collaboration.",
    excellent: "Excellente communication. La réponse est claire, respectueuse, honnête sur le plan émotionnel et ouvre la voie à la compréhension ou à une solution sans accusation."
  },
  it: {
    poor: "Questa risposta può aumentare la difensiva o evitare il vero problema. Prova a esprimere i tuoi sentimenti, il comportamento specifico e ciò di cui hai bisogno senza accusare.",
    good: "È un buon inizio rispettoso. Può diventare ancora più efficace con maggiore chiarezza, curiosità o una richiesta concreta di collaborazione.",
    excellent: "Comunicazione eccellente. La risposta è chiara, rispettosa, emotivamente onesta e invita alla comprensione o alla soluzione del problema senza colpevolizzare."
  },
  de: {
    poor: "Diese Antwort kann Abwehr auslösen oder das eigentliche Problem umgehen. Benenne deine Gefühle, das konkrete Verhalten und dein Bedürfnis ohne Vorwürfe.",
    good: "Das ist ein respektvoller Anfang. Noch stärker wäre die Antwort mit mehr Klarheit, Neugier oder einer konkreten gemeinsamen Bitte.",
    excellent: "Ausgezeichnete Kommunikation. Die Antwort ist klar, respektvoll und emotional ehrlich und lädt ohne Schuldzuweisung zu Verständnis oder gemeinsamer Lösung ein."
  }
};

const buildScenarios = (lang, rows) => Object.fromEntries(rows.map(([id, title, situation, options]) => [
  id,
  {
    title,
    situation,
    options: options.map((text, index) => ({
      text,
      type: optionTypes[index],
      feedback: feedbackByLanguage[lang][optionTypes[index]]
    }))
  }
]));

const en = [
  ['conflict', 'Resolving a Disagreement', 'Your partner forgot an important date you both agreed on. You feel disappointed and hurt.', [
    'Why do you always forget important things? You never listen to me!',
    'I feel hurt that our date was forgotten. Can we talk about what happened and how to prevent this?',
    "Whatever, it's fine. I didn't care about it anyway.",
    "I'm disappointed this happened. I know you didn't mean to hurt me. Can we find a solution together?"
  ]],
  ['needs', 'Expressing Your Needs', "You've been feeling disconnected lately and want more quality time together, but your partner has been very busy with work.", [
    "You care more about work than about us. I guess I'm just not a priority anymore.",
    "I miss spending quality time with you. I understand work is demanding. Can we schedule some time for just us this week?",
    "I'll just wait until you have time for me, I guess.",
    "I've been feeling a bit lonely lately. I know you're busy, but could we make time for a date night?"
  ]],
  ['listening', 'Active Listening', 'Your partner is sharing stress about a difficult situation at work. They seem upset and need support.', [
    "That's nothing. Let me tell you what happened to me today...",
    'That sounds really stressful. Tell me more about what happened. How are you feeling about it?',
    'You should just quit that job. Why do you even stay there?',
    "I'm sorry you're going through this. That must be really hard. I'm here for you."
  ]],
  ['appreciation', 'Showing Appreciation', "Your partner has been doing a lot around the house lately while you've been overwhelmed with other responsibilities.", [
    "Thanks for doing the basics. That's what partners do.",
    "I really appreciate how you've been taking care of things at home. It means so much, especially when I'm stressed. Thank you for being so supportive.",
    'Yeah, I noticed. Good job.',
    "Thank you for handling so much at home. You've really helped me while I've been stretched thin."
  ]],
  ['apology', 'Giving a Meaningful Apology', 'You made a sarcastic comment during an argument that hurt your partner. Later, you realize it crossed a line.', [
    "I'm sorry you took it that way, but you were making me angry.",
    'What I said was hurtful and disrespectful. I am sorry. You did not deserve that, and I want to handle conflict differently next time.',
    "Can we just forget it? I already said I didn't mean it.",
    'I should not have said that. I am sorry, and I want to understand how it affected you.'
  ]],
  ['boundaries', 'Setting a Respectful Boundary', 'Your partner keeps reading messages on your phone without asking, and it makes you uncomfortable.', [
    'Touch my phone again and see what happens.',
    'I want us to trust each other, and I am not comfortable with my phone being checked without permission. Can we agree to ask rather than assume?',
    'It is fine. I will just change my password and not say anything.',
    'I need more privacy around my phone. I would like us to talk about what is making you feel you need to check it.'
  ]],
  ['finances', 'Talking About Money', 'You notice several unexpected purchases from your shared account, and you are worried about the monthly budget.', [
    'You are terrible with money. This is exactly why I cannot trust you with the account.',
    'I noticed some purchases I was not expecting, and I am worried about our budget. Can we review them together and agree on a spending plan?',
    'I will just move my money to another account and let you figure it out.',
    'Can we look at the budget tonight? I want us to make sure we are both comfortable with what we are spending.'
  ]],
  ['chores', 'Sharing Household Responsibilities', 'You feel you have been carrying more of the household work lately and are becoming resentful.', [
    'I do everything around here. You are lazy and never help.',
    'I have been feeling overloaded with the household tasks. Can we list what needs to be done and divide it more evenly?',
    'Never mind. I will just keep doing it myself.',
    'I need more help at home. Can we talk about which tasks each of us can consistently own?'
  ]],
  ['familyBoundaries', 'Handling Family and In-Law Boundaries', 'A family member repeatedly drops by without warning, and it is creating tension at home.', [
    'Your family has no respect. Tell them to stop coming over.',
    'I want your family to feel welcome, but surprise visits are stressful for me. Can we agree together on how to ask for a heads-up first?',
    'I will just avoid the house when they come over.',
    'Could we set a simple visiting boundary so we both feel comfortable when family comes by?'
  ]],
  ['privacy', 'Social Media and Privacy', 'Your partner posted a private disagreement online. You feel exposed and embarrassed.', [
    'Delete it now. You always embarrass me online.',
    'I felt exposed seeing our private disagreement posted publicly. I need conflicts between us to stay private unless we both agree otherwise.',
    'I will post my side so everyone knows what really happened.',
    'That post made me uncomfortable. Can we talk about what we both consider private before posting about our relationship?'
  ]],
  ['jealousy', 'Jealousy and Reassurance', 'You feel uneasy about how close your partner has become with a new coworker, but you do not want to accuse them unfairly.', [
    'I know something is going on. Stop talking to that person.',
    'I have noticed I am feeling insecure about this friendship. I am not accusing you, but I would like to talk about what would help both of us feel secure and respected.',
    'I will keep it to myself and check their social media instead.',
    'I want to be honest that I am feeling jealous. Could we talk about boundaries that feel comfortable to both of us?'
  ]],
  ['space', 'Asking for Personal Space', 'You are emotionally overloaded after a long day and need some quiet time before talking.', [
    'Leave me alone. I cannot deal with you right now.',
    'I want to talk with you, but I am overloaded right now. Can I have 30 minutes to reset, and then we can reconnect?',
    'I will just disappear into another room and ignore everyone.',
    'I need a little quiet time before I can be fully present. I will come back and talk after I decompress.'
  ]],
  ['repair', 'Repairing After a Heated Argument', 'An argument became intense, both of you raised your voices, and now things feel tense and distant.', [
    'You started it, so you should be the one to fix it.',
    'That argument got out of control, and I do not like how we spoke to each other. I want us to reset, listen, and work through the issue more calmly.',
    'Let us pretend it never happened and move on.',
    'I want to repair this. Can we come back to the conversation when we are both calmer?'
  ]],
  ['textTone', 'Clearing Up a Text Misunderstanding', 'A short text from your partner sounded cold to you, and you are unsure whether they are upset.', [
    'Fine. If you want to be rude, I can be rude too.',
    'Your message felt a little distant to me, and I may be reading the tone wrong. Are we okay?',
    'I will ignore them until they explain themselves.',
    'I could be misreading your text. Did you mean it the way it sounded to me?'
  ]],
  ['decision', 'Making a Joint Decision', 'You and your partner disagree about a major purchase that would affect both of your finances.', [
    'It is my money too, so I am buying it whether you like it or not.',
    'This affects both of us, so I do not want either of us to feel overruled. Can we compare the costs, priorities, and alternatives before deciding?',
    'Forget it. We just will not buy anything ever.',
    'Let us slow down and look at what matters most to each of us before we decide.'
  ]],
  ['punctuality', 'Talking About Lateness and Plans', 'Your partner has been late to several plans, and you feel your time is not being respected.', [
    'You are always late because you do not care about anyone else.',
    'When plans start late repeatedly, I feel frustrated and unimportant. Can we agree on a way to communicate earlier if timing changes?',
    'I will start showing up late too so you understand how it feels.',
    'I need more reliability around our plans. Can we figure out what keeps getting in the way?'
  ]],
  ['stressSupport', 'Supporting a Stressed Partner', 'Your partner is overwhelmed by several responsibilities and seems irritable and exhausted.', [
    'Everyone is stressed. You need to stop taking it out on me.',
    'You seem really overwhelmed. I am here with you. Would it help more if I listened, helped with something specific, or gave you some space?',
    'I will stay out of the way until you are in a better mood.',
    'I can tell you are carrying a lot. What kind of support would feel useful right now?'
  ]],
  ['affection', 'Talking About Affection', 'You have been missing everyday affection and closeness, but you do not want your partner to feel pressured.', [
    'You never show me affection anymore. What is wrong with you?',
    'I have been missing our everyday closeness, like hugs and affectionate time together. I would love to talk about what feels good and comfortable for both of us.',
    'I guess I will stop trying since you clearly are not interested.',
    'I miss feeling close to you. Can we talk about ways we both like to give and receive affection?'
  ]],
  ['parenting', 'Handling a Parenting Disagreement', 'You and your partner disagree about how to respond to a child breaking an important household rule.', [
    'Your way of parenting is the problem. I am handling this myself.',
    'We see this differently, and I do not want to undermine each other. Can we talk privately and agree on a response before we address it together?',
    'Whatever you decide is fine. I am staying out of it.',
    'Can we compare what each of us is concerned about and choose a response we can both support?'
  ]],
  ['recurringIssue', 'Bringing Up a Recurring Issue', 'The same disagreement keeps coming back, and previous conversations have not produced a lasting change.', [
    'Here we go again. You clearly do not care enough to change.',
    'We keep getting stuck on the same issue, and I do not want us to keep hurting each other with it. Can we identify what has not worked and try a different agreement?',
    'There is no point talking about it anymore.',
    'This keeps coming back. I would like us to focus on one small change we can both follow through on.'
  ]]
];

const es = [
  ['conflict','Resolver un Desacuerdo','Tu pareja olvidó una fecha importante que ambos habían acordado. Te sientes decepcionado y herido.',['¿Por qué siempre olvidas las cosas importantes? ¡Nunca me escuchas!','Me dolió que se olvidara nuestra fecha. ¿Podemos hablar de lo que pasó y de cómo evitarlo la próxima vez?','Da igual, está bien. En realidad no me importaba.','Me decepcionó que pasara esto. Sé que no querías herirme. ¿Podemos buscar una solución juntos?']],
  ['needs','Expresar Tus Necesidades','Últimamente te sientes desconectado y quieres pasar más tiempo de calidad juntos, pero tu pareja está muy ocupada con el trabajo.',['Te importa más el trabajo que nosotros. Supongo que ya no soy una prioridad.','Extraño pasar tiempo de calidad contigo. Entiendo que el trabajo exige mucho. ¿Podemos reservar un tiempo solo para nosotros esta semana?','Supongo que esperaré hasta que tengas tiempo para mí.','Últimamente me he sentido un poco solo. Sé que estás ocupado, pero ¿podemos hacer tiempo para una cita?']],
  ['listening','Escucha Activa','Tu pareja te cuenta una situación difícil en el trabajo. Está alterada y necesita apoyo.',['Eso no es nada. Déjame contarte lo que me pasó hoy...','Eso suena muy estresante. Cuéntame más sobre lo que pasó. ¿Cómo te sientes al respecto?','Deberías dejar ese trabajo. ¿Por qué sigues allí?','Siento que estés pasando por esto. Debe ser muy difícil. Estoy aquí para ti.']],
  ['appreciation','Mostrar Aprecio','Tu pareja ha estado haciendo mucho en casa mientras tú has estado abrumado con otras responsabilidades.',['Gracias por hacer lo básico. Eso es lo que hacen las parejas.','Aprecio mucho cómo has estado ocupándote de las cosas en casa. Significa mucho para mí, especialmente cuando estoy estresado. Gracias por apoyarme.','Sí, me di cuenta. Buen trabajo.','Gracias por encargarte de tantas cosas en casa. Me has ayudado mucho mientras he estado saturado.']],
  ['apology','Dar una Disculpa Sincera','Hiciste un comentario sarcástico durante una discusión que hirió a tu pareja. Después te das cuenta de que cruzaste una línea.',['Siento que te lo tomaras así, pero me estabas haciendo enojar.','Lo que dije fue hiriente y irrespetuoso. Lo siento. No lo merecías y quiero manejar los conflictos de otra manera la próxima vez.','¿Podemos olvidarlo? Ya dije que no era mi intención.','No debí decir eso. Lo siento y quiero entender cómo te afectó.']],
  ['boundaries','Establecer un Límite Respetuoso','Tu pareja sigue leyendo mensajes en tu teléfono sin pedir permiso y eso te incomoda.',['Vuelve a tocar mi teléfono y verás lo que pasa.','Quiero que confiemos el uno en el otro y no me siento cómodo con que revisen mi teléfono sin permiso. ¿Podemos acordar preguntar en vez de asumir?','Está bien. Solo cambiaré mi contraseña y no diré nada.','Necesito más privacidad con mi teléfono. Me gustaría hablar de qué te hace sentir que necesitas revisarlo.']],
  ['finances','Hablar de Dinero','Notas varias compras inesperadas en la cuenta compartida y te preocupa el presupuesto mensual.',['Eres terrible con el dinero. Por eso no puedo confiar en ti con la cuenta.','Vi algunas compras que no esperaba y me preocupa nuestro presupuesto. ¿Podemos revisarlas juntos y acordar un plan de gastos?','Moveré mi dinero a otra cuenta y que tú resuelvas lo demás.','¿Podemos revisar el presupuesto esta noche? Quiero asegurarme de que ambos estemos cómodos con nuestros gastos.']],
  ['chores','Compartir las Responsabilidades del Hogar','Sientes que últimamente estás cargando con más trabajo de la casa y empiezas a resentirte.',['Yo hago todo aquí. Eres perezoso y nunca ayudas.','Me he sentido sobrecargado con las tareas de la casa. ¿Podemos hacer una lista y repartirlas de manera más justa?','No importa. Seguiré haciéndolo todo yo.','Necesito más ayuda en casa. ¿Podemos hablar de qué tareas puede asumir cada uno de forma constante?']],
  ['familyBoundaries','Límites con la Familia','Un familiar llega repetidamente sin avisar y eso está creando tensión en casa.',['Tu familia no tiene respeto. Diles que dejen de venir.','Quiero que tu familia se sienta bienvenida, pero las visitas sorpresa me estresan. ¿Podemos acordar juntos pedir que avisen antes?','Simplemente evitaré la casa cuando vengan.','¿Podemos establecer un límite sencillo para las visitas y así ambos sentirnos cómodos?']],
  ['privacy','Redes Sociales y Privacidad','Tu pareja publicó en línea una discusión privada. Te sientes expuesto y avergonzado.',['Bórralo ahora. Siempre me avergüenzas en internet.','Me sentí expuesto al ver nuestra discusión privada publicada. Necesito que nuestros conflictos se mantengan privados salvo que ambos acordemos lo contrario.','Publicaré mi versión para que todos sepan lo que pasó de verdad.','Esa publicación me incomodó. ¿Podemos hablar de lo que ambos consideramos privado antes de publicar sobre nuestra relación?']],
  ['jealousy','Celos y Seguridad','Te inquieta la cercanía de tu pareja con un nuevo compañero de trabajo, pero no quieres acusarla injustamente.',['Sé que pasa algo. Deja de hablar con esa persona.','He notado que me siento inseguro con esta amistad. No te estoy acusando, pero me gustaría hablar de lo que nos ayudaría a ambos a sentirnos seguros y respetados.','Me lo guardaré y revisaré sus redes sociales.','Quiero ser honesto: estoy sintiendo celos. ¿Podemos hablar de límites que nos resulten cómodos a ambos?']],
  ['space','Pedir Espacio Personal','Después de un día largo estás emocionalmente saturado y necesitas un poco de calma antes de hablar.',['Déjame en paz. No puedo contigo ahora mismo.','Quiero hablar contigo, pero ahora estoy saturado. ¿Puedo tomarme 30 minutos para recuperarme y luego reconectamos?','Simplemente desapareceré a otra habitación e ignoraré a todos.','Necesito un poco de silencio antes de poder estar plenamente presente. Volveré a hablar cuando me haya calmado.']],
  ['repair','Reparar Después de una Discusión Intensa','Una discusión se volvió intensa, ambos levantaron la voz y ahora hay tensión y distancia.',['Tú empezaste, así que tú tienes que arreglarlo.','La discusión se salió de control y no me gustó cómo nos hablamos. Quiero que nos calmemos, escuchemos y tratemos el tema de otra manera.','Finjamos que nunca pasó y sigamos adelante.','Quiero reparar esto. ¿Podemos retomar la conversación cuando ambos estemos más tranquilos?']],
  ['textTone','Aclarar un Malentendido por Mensaje','Un mensaje corto de tu pareja te pareció frío y no sabes si está molesta.',['Bien. Si quieres ser grosero, yo también puedo serlo.','Tu mensaje me pareció un poco distante y quizá estoy interpretando mal el tono. ¿Estamos bien?','Lo ignoraré hasta que se explique.','Puede que esté interpretando mal tu mensaje. ¿Querías decirlo como me sonó?']],
  ['decision','Tomar una Decisión en Pareja','Tú y tu pareja no están de acuerdo sobre una compra importante que afectaría las finanzas de ambos.',['También es mi dinero, así que lo compraré te guste o no.','Esto nos afecta a ambos, así que no quiero que ninguno se sienta ignorado. ¿Podemos comparar costos, prioridades y alternativas antes de decidir?','Olvídalo. Entonces nunca compraremos nada.','Bajemos el ritmo y veamos qué es lo más importante para cada uno antes de decidir.']],
  ['punctuality','Hablar de Retrasos y Planes','Tu pareja ha llegado tarde a varios planes y sientes que no respeta tu tiempo.',['Siempre llegas tarde porque no te importa nadie más.','Cuando nuestros planes empiezan tarde repetidamente, me siento frustrado y poco importante. ¿Podemos acordar avisarnos antes si cambia la hora?','Yo también empezaré a llegar tarde para que veas cómo se siente.','Necesito más constancia con nuestros planes. ¿Podemos averiguar qué está causando estos retrasos?']],
  ['stressSupport','Apoyar a una Pareja Estresada','Tu pareja está abrumada por varias responsabilidades y parece irritable y agotada.',['Todo el mundo está estresado. Deja de desquitarte conmigo.','Pareces muy abrumado. Estoy contigo. ¿Te ayudaría más que te escuche, que haga algo concreto o que te dé un poco de espacio?','Me mantendré alejado hasta que estés de mejor humor.','Veo que llevas mucho encima. ¿Qué tipo de apoyo te sería útil ahora?']],
  ['affection','Hablar del Afecto','Extrañas el afecto cotidiano y la cercanía, pero no quieres que tu pareja se sienta presionada.',['Ya nunca me muestras afecto. ¿Qué te pasa?','He estado extrañando nuestra cercanía cotidiana, como los abrazos y el tiempo afectuoso. Me gustaría hablar de lo que se siente bien y cómodo para ambos.','Supongo que dejaré de intentarlo, porque está claro que no te interesa.','Extraño sentirme cerca de ti. ¿Podemos hablar de cómo nos gusta dar y recibir afecto?']],
  ['parenting','Manejar un Desacuerdo de Crianza','Tú y tu pareja no están de acuerdo sobre cómo responder a un hijo que rompió una regla importante del hogar.',['Tu forma de criar es el problema. Yo me encargo.','Lo vemos de manera diferente y no quiero que nos desacreditemos. ¿Podemos hablar en privado y acordar una respuesta antes de abordarlo juntos?','Lo que tú decidas está bien. Yo no me meto.','¿Podemos comparar lo que preocupa a cada uno y elegir una respuesta que ambos podamos apoyar?']],
  ['recurringIssue','Hablar de un Problema Recurrente','El mismo desacuerdo sigue apareciendo y las conversaciones anteriores no han producido un cambio duradero.',['Otra vez lo mismo. Está claro que no te importa lo suficiente como para cambiar.','Seguimos atascados en el mismo problema y no quiero que sigamos haciéndonos daño. ¿Podemos identificar qué no ha funcionado y probar un acuerdo diferente?','Ya no tiene sentido hablar de esto.','Esto sigue volviendo. Me gustaría que nos enfoquemos en un pequeño cambio que ambos podamos cumplir.']]
];

const fr = [
  ['conflict','Résoudre un Désaccord','Votre partenaire a oublié une date importante que vous aviez convenue ensemble. Vous vous sentez déçu et blessé.',['Pourquoi oublies-tu toujours les choses importantes ? Tu ne m’écoutes jamais !','Je suis blessé que notre rendez-vous ait été oublié. Peut-on parler de ce qui s’est passé et de la façon d’éviter cela ?','Peu importe, ça va. De toute façon, je m’en fichais.','Je suis déçu que cela soit arrivé. Je sais que tu ne voulais pas me blesser. Peut-on trouver une solution ensemble ?']],
  ['needs','Exprimer Vos Besoins','Vous vous sentez éloignés dernièrement et souhaitez davantage de temps de qualité, mais votre partenaire est très occupé par le travail.',['Le travail compte plus pour toi que nous. Je ne suis clairement plus une priorité.','Nos moments ensemble me manquent. Je comprends que le travail soit exigeant. Peut-on prévoir un moment rien que pour nous cette semaine ?','J’attendrai simplement que tu aies du temps pour moi.','Je me sens un peu seul ces derniers temps. Je sais que tu es occupé, mais pouvons-nous prévoir une soirée ensemble ?']],
  ['listening','Écoute Active','Votre partenaire vous parle d’une situation difficile au travail. Il est contrarié et a besoin de soutien.',['Ce n’est rien. Laisse-moi plutôt te raconter ma journée...','Ça a l’air vraiment stressant. Raconte-moi davantage ce qui s’est passé. Comment te sens-tu ?','Tu devrais simplement quitter ce travail. Pourquoi restes-tu là-bas ?','Je suis désolé que tu traverses ça. Ça doit être difficile. Je suis là pour toi.']],
  ['appreciation','Montrer de la Reconnaissance','Votre partenaire fait beaucoup à la maison pendant que vous êtes submergé par d’autres responsabilités.',['Merci de faire le minimum. C’est normal dans un couple.','J’apprécie vraiment tout ce que tu fais à la maison. Cela compte énormément, surtout quand je suis stressé. Merci de me soutenir.','Oui, j’ai remarqué. Bravo.','Merci d’avoir pris en charge autant de choses à la maison. Tu m’as vraiment aidé pendant cette période chargée.']],
  ['apology','Présenter de Vraies Excuses','Vous avez fait une remarque sarcastique pendant une dispute et blessé votre partenaire. Ensuite, vous réalisez avoir dépassé les limites.',['Désolé que tu l’aies pris comme ça, mais tu m’énervais.','Ce que j’ai dit était blessant et irrespectueux. Je suis désolé. Tu ne méritais pas ça, et je veux mieux gérer les conflits la prochaine fois.','On peut juste oublier ? J’ai déjà dit que je ne le pensais pas.','Je n’aurais pas dû dire ça. Je suis désolé et je veux comprendre l’effet que cela a eu sur toi.']],
  ['boundaries','Poser une Limite Respectueuse','Votre partenaire lit régulièrement vos messages sur votre téléphone sans demander, et cela vous met mal à l’aise.',['Touche encore à mon téléphone et tu verras.','Je veux que nous nous fassions confiance et je ne suis pas à l’aise quand mon téléphone est vérifié sans permission. Peut-on convenir de demander plutôt que de supposer ?','Ce n’est pas grave. Je vais juste changer mon mot de passe sans rien dire.','J’ai besoin de davantage de vie privée concernant mon téléphone. J’aimerais comprendre ce qui te pousse à vouloir le vérifier.']],
  ['finances','Parler d’Argent','Vous remarquez plusieurs achats inattendus sur votre compte commun et le budget mensuel vous inquiète.',['Tu es nul avec l’argent. Voilà pourquoi je ne peux pas te faire confiance avec le compte.','J’ai remarqué des achats que je n’attendais pas et notre budget m’inquiète. Peut-on les examiner ensemble et convenir d’un plan de dépenses ?','Je vais simplement mettre mon argent ailleurs et te laisser gérer le reste.','Peut-on regarder le budget ce soir ? Je veux que nous soyons tous les deux à l’aise avec nos dépenses.']],
  ['chores','Partager les Tâches Ménagères','Vous avez l’impression d’assumer davantage de tâches à la maison et commencez à ressentir du ressentiment.',['Je fais tout ici. Tu es paresseux et tu n’aides jamais.','Je me sens débordé par les tâches ménagères. Peut-on faire la liste de ce qu’il y a à faire et mieux répartir les responsabilités ?','Laisse tomber. Je continuerai à tout faire moi-même.','J’ai besoin de plus d’aide à la maison. Peut-on décider quelles tâches chacun peut prendre en charge régulièrement ?']],
  ['familyBoundaries','Gérer les Limites avec la Famille','Un membre de la famille arrive régulièrement sans prévenir, ce qui crée des tensions à la maison.',['Ta famille ne respecte rien. Dis-leur d’arrêter de venir.','Je veux que ta famille se sente bienvenue, mais les visites surprises sont stressantes pour moi. Peut-on demander ensemble qu’on nous prévienne avant ?','Je vais juste éviter la maison quand ils viennent.','Peut-on fixer une règle simple pour les visites afin que nous soyons tous les deux à l’aise ?']],
  ['privacy','Réseaux Sociaux et Vie Privée','Votre partenaire a publié une dispute privée en ligne. Vous vous sentez exposé et embarrassé.',['Supprime ça maintenant. Tu m’embarrasses toujours en ligne.','Je me suis senti exposé en voyant notre dispute privée publiée. J’ai besoin que nos conflits restent privés sauf si nous décidons ensemble de les partager.','Je vais publier ma version pour que tout le monde sache la vérité.','Cette publication m’a mis mal à l’aise. Peut-on définir ensemble ce qui doit rester privé avant de parler de notre relation en ligne ?']],
  ['jealousy','Jalousie et Réassurance','Vous êtes mal à l’aise face à la proximité de votre partenaire avec un nouveau collègue, sans vouloir l’accuser injustement.',['Je sais qu’il se passe quelque chose. Arrête de parler à cette personne.','Je remarque que cette amitié me rend insécurisé. Je ne t’accuse pas, mais j’aimerais parler de ce qui pourrait nous aider tous les deux à nous sentir en sécurité et respectés.','Je vais garder ça pour moi et surveiller ses réseaux sociaux.','Je veux être honnête : je ressens de la jalousie. Peut-on parler de limites qui nous conviennent à tous les deux ?']],
  ['space','Demander de l’Espace','Après une longue journée, vous êtes émotionnellement épuisé et avez besoin de calme avant de parler.',['Laisse-moi tranquille. Je ne peux pas te supporter maintenant.','Je veux parler avec toi, mais je suis saturé en ce moment. Puis-je prendre 30 minutes pour me recentrer, puis on se retrouve ?','Je vais juste disparaître dans une autre pièce et ignorer tout le monde.','J’ai besoin d’un peu de calme avant d’être vraiment disponible. Je reviendrai parler après m’être posé.']],
  ['repair','Réparer Après une Dispute','Une dispute est devenue intense, vous avez tous les deux élevé la voix et il y a maintenant de la distance.',['Tu as commencé, donc c’est à toi de réparer.','Cette dispute a dérapé et je n’aime pas la façon dont nous nous sommes parlé. Je veux que nous nous calmions, nous écoutions et reprenions le problème autrement.','Faisons comme si rien ne s’était passé.','Je veux réparer les choses. Peut-on reprendre la conversation quand nous serons tous les deux plus calmes ?']],
  ['textTone','Clarifier un Malentendu par Message','Un message bref de votre partenaire vous a semblé froid et vous ne savez pas s’il est contrarié.',['Très bien. Si tu veux être désagréable, moi aussi je peux l’être.','Ton message m’a semblé un peu distant et j’interprète peut-être mal le ton. Est-ce que tout va bien entre nous ?','Je vais l’ignorer jusqu’à ce qu’il s’explique.','Je lis peut-être mal ton message. Est-ce que tu voulais vraiment qu’il sonne comme ça ?']],
  ['decision','Prendre une Décision Ensemble','Vous n’êtes pas d’accord sur un achat important qui affecterait les finances du couple.',['C’est aussi mon argent, donc je l’achète que ça te plaise ou non.','Cette décision nous concerne tous les deux. Je ne veux pas que l’un de nous se sente ignoré. Peut-on comparer les coûts, les priorités et les alternatives avant de décider ?','Laisse tomber. On n’achètera plus jamais rien.','Prenons le temps de voir ce qui compte le plus pour chacun avant de décider.']],
  ['punctuality','Parler des Retards','Votre partenaire a été en retard à plusieurs rendez-vous et vous avez l’impression que votre temps n’est pas respecté.',['Tu es toujours en retard parce que tu ne te soucies de personne.','Quand nos plans commencent régulièrement en retard, je me sens frustré et peu important. Peut-on convenir de prévenir plus tôt si l’horaire change ?','Je vais commencer à être en retard moi aussi pour que tu comprennes.','J’ai besoin de plus de fiabilité pour nos plans. Peut-on chercher ce qui provoque ces retards ?']],
  ['stressSupport','Soutenir un Partenaire Stressé','Votre partenaire est submergé par plusieurs responsabilités et semble irritable et épuisé.',['Tout le monde est stressé. Arrête de t’en prendre à moi.','Tu sembles vraiment débordé. Je suis avec toi. Est-ce que tu préfères que j’écoute, que je t’aide concrètement ou que je te laisse un peu d’espace ?','Je vais rester à l’écart jusqu’à ce que tu sois de meilleure humeur.','Je vois que tu portes beaucoup. Quel type de soutien t’aiderait maintenant ?']],
  ['affection','Parler d’Affection','La tendresse quotidienne et la proximité vous manquent, mais vous ne voulez pas mettre votre partenaire sous pression.',['Tu ne me montres plus jamais d’affection. Qu’est-ce qui ne va pas chez toi ?','Notre proximité quotidienne me manque, comme les câlins et les moments tendres. J’aimerais parler de ce qui est agréable et confortable pour nous deux.','Je vais arrêter d’essayer puisque ça ne t’intéresse clairement pas.','Tu me manques dans notre proximité. Peut-on parler des façons dont chacun aime donner et recevoir de l’affection ?']],
  ['parenting','Gérer un Désaccord Parental','Vous n’êtes pas d’accord sur la façon de réagir après qu’un enfant a enfreint une règle importante de la maison.',['Ta façon d’être parent est le problème. Je vais gérer ça seul.','Nous voyons les choses différemment et je ne veux pas que nous nous contredisions. Peut-on en parler en privé et convenir d’une réponse avant d’agir ensemble ?','Décide ce que tu veux, je ne m’en mêle pas.','Peut-on comparer nos inquiétudes et choisir une réponse que nous pouvons tous les deux soutenir ?']],
  ['recurringIssue','Aborder un Problème Récurrent','Le même désaccord revient et les conversations précédentes n’ont pas produit de changement durable.',['Encore la même chose. Tu ne tiens clairement pas assez à nous pour changer.','Nous restons bloqués sur le même problème et je ne veux pas que nous continuions à nous blesser. Peut-on voir ce qui n’a pas fonctionné et essayer un nouvel accord ?','Ça ne sert plus à rien d’en parler.','Ce problème revient. J’aimerais que nous choisissions un petit changement que nous pouvons tous les deux tenir.']]
];

const it = [
  ['conflict','Risolvere un Disaccordo','Il tuo partner ha dimenticato una data importante concordata insieme. Ti senti deluso e ferito.',['Perché dimentichi sempre le cose importanti? Non mi ascolti mai!','Mi ha ferito che il nostro appuntamento sia stato dimenticato. Possiamo parlare di cosa è successo e di come evitarlo in futuro?','Va bene, non importa. Tanto non ci tenevo davvero.','Sono deluso che sia successo. So che non volevi ferirmi. Possiamo trovare una soluzione insieme?']],
  ['needs','Esprimere i Tuoi Bisogni','Ultimamente ti senti distante e desideri più tempo di qualità insieme, ma il tuo partner è molto impegnato con il lavoro.',['Ti importa più del lavoro che di noi. Immagino di non essere più una priorità.','Mi manca passare del tempo di qualità con te. Capisco che il lavoro sia impegnativo. Possiamo ritagliarci un momento solo per noi questa settimana?','Aspetterò semplicemente che tu abbia tempo per me.','Ultimamente mi sento un po’ solo. So che sei impegnato, ma possiamo trovare tempo per una serata insieme?']],
  ['listening','Ascolto Attivo','Il tuo partner ti racconta una situazione difficile al lavoro. È turbato e ha bisogno di sostegno.',['Non è niente. Lascia che ti racconti cosa è successo a me oggi...','Sembra davvero stressante. Raccontami meglio cosa è successo. Come ti senti al riguardo?','Dovresti semplicemente lasciare quel lavoro. Perché ci rimani?','Mi dispiace che tu stia passando tutto questo. Dev’essere davvero difficile. Sono qui per te.']],
  ['appreciation','Mostrare Apprezzamento','Il tuo partner sta facendo molto in casa mentre tu sei sopraffatto da altre responsabilità.',['Grazie per fare il minimo. È quello che fanno i partner.','Apprezzo davvero come ti stai occupando delle cose a casa. Significa molto per me, soprattutto quando sono stressato. Grazie per il tuo sostegno.','Sì, me ne sono accorto. Bravo.','Grazie per esserti occupato di così tante cose in casa. Mi hai aiutato davvero molto mentre ero sotto pressione.']],
  ['apology','Fare delle Scuse Sincere','Durante una discussione hai fatto un commento sarcastico che ha ferito il tuo partner. Dopo capisci di aver superato il limite.',['Mi dispiace che tu l’abbia presa così, ma mi stavi facendo arrabbiare.','Quello che ho detto è stato offensivo e irrispettoso. Mi dispiace. Non lo meritavi e voglio gestire i conflitti diversamente la prossima volta.','Possiamo dimenticarlo? Ho già detto che non lo pensavo.','Non avrei dovuto dirlo. Mi dispiace e voglio capire come ti ha fatto sentire.']],
  ['boundaries','Stabilire un Confine Rispettoso','Il tuo partner continua a leggere i messaggi sul tuo telefono senza chiedere e questo ti mette a disagio.',['Tocca di nuovo il mio telefono e vedrai.','Voglio che ci sia fiducia tra noi e non mi sento a mio agio quando il mio telefono viene controllato senza permesso. Possiamo accordarci di chiedere invece di presumere?','Va bene. Cambierò solo la password senza dire nulla.','Ho bisogno di più privacy con il mio telefono. Vorrei capire cosa ti fa sentire il bisogno di controllarlo.']],
  ['finances','Parlare di Denaro','Noti diversi acquisti inattesi sul conto condiviso e sei preoccupato per il budget mensile.',['Sei pessimo con i soldi. Ecco perché non posso fidarmi di te con il conto.','Ho notato alcune spese che non mi aspettavo e sono preoccupato per il nostro budget. Possiamo rivederle insieme e concordare un piano di spesa?','Sposterò i miei soldi altrove e lascerò che te la cavi.','Possiamo guardare il budget stasera? Voglio che entrambi ci sentiamo a nostro agio con le nostre spese.']],
  ['chores','Condividere le Responsabilità Domestiche','Senti di occuparti di più faccende domestiche ultimamente e stai iniziando a provare risentimento.',['Faccio tutto io qui. Sei pigro e non aiuti mai.','Mi sento sovraccarico dalle faccende domestiche. Possiamo elencare ciò che va fatto e dividerlo in modo più equo?','Lascia perdere. Continuerò a fare tutto da solo.','Ho bisogno di più aiuto in casa. Possiamo decidere quali compiti ciascuno può assumersi con continuità?']],
  ['familyBoundaries','Gestire i Confini con la Famiglia','Un familiare passa spesso senza avvisare e questo crea tensione in casa.',['La tua famiglia non ha rispetto. Digli di smettere di venire.','Voglio che la tua famiglia si senta benvenuta, ma le visite a sorpresa mi stressano. Possiamo chiedere insieme che ci avvisino prima?','Eviterò semplicemente casa quando arrivano.','Possiamo stabilire una regola semplice per le visite così da sentirci entrambi a nostro agio?']],
  ['privacy','Social Media e Privacy','Il tuo partner ha pubblicato online una discussione privata. Ti senti esposto e imbarazzato.',['Cancellalo subito. Mi metti sempre in imbarazzo online.','Mi sono sentito esposto vedendo la nostra discussione privata pubblicata. Ho bisogno che i nostri conflitti restino privati a meno che non decidiamo insieme diversamente.','Pubblicherò la mia versione così tutti sapranno cosa è successo davvero.','Quel post mi ha messo a disagio. Possiamo parlare di cosa consideriamo privato prima di pubblicare sulla nostra relazione?']],
  ['jealousy','Gelosia e Rassicurazione','Ti senti a disagio per la vicinanza del tuo partner con un nuovo collega, ma non vuoi accusarlo ingiustamente.',['So che c’è qualcosa. Smetti di parlare con quella persona.','Ho notato che questa amicizia mi fa sentire insicuro. Non ti sto accusando, ma vorrei parlare di cosa può farci sentire entrambi sicuri e rispettati.','Terrò tutto per me e controllerò i suoi social.','Voglio essere sincero: provo gelosia. Possiamo parlare di confini che vadano bene a entrambi?']],
  ['space','Chiedere Spazio Personale','Dopo una lunga giornata sei emotivamente sovraccarico e hai bisogno di un po’ di calma prima di parlare.',['Lasciami stare. Non riesco a sopportarti adesso.','Voglio parlare con te, ma in questo momento sono sovraccarico. Posso prendermi 30 minuti per recuperare e poi ci riconnettiamo?','Andrò in un’altra stanza e ignorerò tutti.','Ho bisogno di un po’ di silenzio prima di poter essere davvero presente. Tornerò a parlare quando mi sarò calmato.']],
  ['repair','Riparare Dopo una Discussione Accesa','Una discussione è diventata intensa, avete alzato entrambi la voce e ora c’è distanza.',['Hai iniziato tu, quindi devi sistemare tu le cose.','La discussione è sfuggita di mano e non mi è piaciuto come ci siamo parlati. Voglio che ci calmiamo, ci ascoltiamo e affrontiamo il problema in modo diverso.','Facciamo finta che non sia successo nulla.','Voglio rimediare. Possiamo riprendere la conversazione quando saremo entrambi più tranquilli?']],
  ['textTone','Chiarire un Malinteso via Messaggio','Un messaggio breve del tuo partner ti è sembrato freddo e non sai se sia arrabbiato.',['Va bene. Se vuoi essere scortese, posso esserlo anch’io.','Il tuo messaggio mi è sembrato un po’ distante e forse sto interpretando male il tono. Va tutto bene tra noi?','Lo ignorerò finché non si spiega.','Forse sto leggendo male il messaggio. Volevi davvero che suonasse così?']],
  ['decision','Prendere una Decisione Insieme','Tu e il tuo partner non siete d’accordo su un acquisto importante che influirebbe sulle finanze di entrambi.',['Sono anche soldi miei, quindi lo compro che ti piaccia o no.','Questa decisione riguarda entrambi e non voglio che nessuno si senta ignorato. Possiamo confrontare costi, priorità e alternative prima di decidere?','Lascia stare. Allora non compreremo mai più niente.','Rallentiamo e vediamo cosa conta di più per ciascuno prima di decidere.']],
  ['punctuality','Parlare di Ritardi e Programmi','Il tuo partner è arrivato tardi a diversi appuntamenti e senti che il tuo tempo non venga rispettato.',['Sei sempre in ritardo perché non ti importa degli altri.','Quando i nostri piani iniziano ripetutamente in ritardo, mi sento frustrato e poco importante. Possiamo accordarci di avvisare prima se l’orario cambia?','Inizierò ad arrivare tardi anch’io così capirai.','Ho bisogno di maggiore affidabilità nei nostri programmi. Possiamo capire cosa causa questi ritardi?']],
  ['stressSupport','Sostenere un Partner Stressato','Il tuo partner è sopraffatto da molte responsabilità e appare irritabile ed esausto.',['Tutti sono stressati. Smettila di sfogarti su di me.','Sembri davvero sopraffatto. Sono qui con te. Ti aiuterebbe di più se ascoltassi, facessi qualcosa di concreto o ti dessi un po’ di spazio?','Starò lontano finché non sarai di umore migliore.','Vedo che stai portando un peso enorme. Che tipo di supporto ti sarebbe utile adesso?']],
  ['affection','Parlare di Affetto','Ti mancano l’affetto quotidiano e la vicinanza, ma non vuoi mettere pressione al tuo partner.',['Non mi mostri più affetto. Che cosa ti succede?','Mi manca la nostra vicinanza quotidiana, come gli abbracci e i momenti affettuosi. Mi piacerebbe parlare di ciò che è piacevole e confortevole per entrambi.','Smetterò di provarci visto che chiaramente non ti interessa.','Mi manca sentirmi vicino a te. Possiamo parlare di come entrambi preferiamo dare e ricevere affetto?']],
  ['parenting','Gestire un Disaccordo Genitoriale','Tu e il tuo partner non siete d’accordo su come rispondere a un figlio che ha infranto una regola importante di casa.',['Il tuo modo di fare il genitore è il problema. Me ne occupo io.','La vediamo diversamente e non voglio che ci contraddiciamo. Possiamo parlarne in privato e concordare una risposta prima di affrontarla insieme?','Qualunque cosa decidi va bene. Io non mi metto in mezzo.','Possiamo confrontare ciò che preoccupa ciascuno e scegliere una risposta che possiamo sostenere entrambi?']],
  ['recurringIssue','Affrontare un Problema Ricorrente','Lo stesso disaccordo continua a tornare e le conversazioni precedenti non hanno prodotto un cambiamento duraturo.',['Ci risiamo. È chiaro che non ti importa abbastanza da cambiare.','Continuiamo a bloccarci sullo stesso problema e non voglio che continuiamo a ferirci. Possiamo capire cosa non ha funzionato e provare un accordo diverso?','Non ha più senso parlarne.','Questo problema continua a tornare. Vorrei concentrarci su un piccolo cambiamento che possiamo entrambi mantenere.']]
];

const de = [
  ['conflict','Einen Streit Lösen','Dein Partner hat einen wichtigen gemeinsamen Termin vergessen. Du bist enttäuscht und verletzt.',['Warum vergisst du immer wichtige Dinge? Du hörst mir nie zu!','Es hat mich verletzt, dass unser Termin vergessen wurde. Können wir darüber sprechen, was passiert ist und wie wir das künftig vermeiden?','Egal, ist schon gut. Es war mir sowieso nicht wichtig.','Ich bin enttäuscht, dass das passiert ist. Ich weiß, dass du mich nicht verletzen wolltest. Können wir gemeinsam eine Lösung finden?']],
  ['needs','Bedürfnisse Ausdrücken','Du fühlst dich in letzter Zeit weniger verbunden und wünschst dir mehr gemeinsame Zeit, aber dein Partner ist beruflich sehr eingespannt.',['Dir ist die Arbeit wichtiger als wir. Ich bin wohl keine Priorität mehr.','Mir fehlt unsere gemeinsame Zeit. Ich verstehe, dass die Arbeit viel verlangt. Können wir diese Woche Zeit nur für uns einplanen?','Ich warte einfach, bis du irgendwann Zeit für mich hast.','Ich habe mich in letzter Zeit etwas einsam gefühlt. Können wir trotz deiner Arbeit Zeit für einen gemeinsamen Abend finden?']],
  ['listening','Aktiv Zuhören','Dein Partner erzählt von einer schwierigen Situation bei der Arbeit. Er ist aufgewühlt und braucht Unterstützung.',['Das ist doch nichts. Lass mich erzählen, was mir heute passiert ist...','Das klingt wirklich belastend. Erzähl mir mehr darüber, was passiert ist. Wie fühlst du dich damit?','Du solltest einfach kündigen. Warum bleibst du überhaupt dort?','Es tut mir leid, dass du das durchmachst. Das muss wirklich schwer sein. Ich bin für dich da.']],
  ['appreciation','Wertschätzung Zeigen','Dein Partner übernimmt gerade viel im Haushalt, während du mit anderen Verpflichtungen überfordert bist.',['Danke für das Nötigste. Das gehört in einer Beziehung eben dazu.','Ich schätze wirklich, wie viel du zu Hause übernimmst. Gerade wenn ich gestresst bin, bedeutet mir das sehr viel. Danke für deine Unterstützung.','Ja, habe ich gesehen. Gut gemacht.','Danke, dass du zu Hause so viel übernommen hast. Du hast mir in dieser anstrengenden Zeit wirklich geholfen.']],
  ['apology','Sich Aufrichtig Entschuldigen','Du hast während eines Streits einen sarkastischen Kommentar gemacht, der deinen Partner verletzt hat. Später merkst du, dass du zu weit gegangen bist.',['Tut mir leid, dass du das so aufgefasst hast, aber du hast mich wütend gemacht.','Was ich gesagt habe, war verletzend und respektlos. Es tut mir leid. Du hast das nicht verdient, und ich möchte Konflikte künftig anders führen.','Können wir es einfach vergessen? Ich habe doch gesagt, dass ich es nicht so meinte.','Ich hätte das nicht sagen dürfen. Es tut mir leid, und ich möchte verstehen, wie es dich getroffen hat.']],
  ['boundaries','Eine Respektvolle Grenze Setzen','Dein Partner liest immer wieder Nachrichten auf deinem Handy, ohne zu fragen, und das ist dir unangenehm.',['Fass mein Handy noch einmal an und du wirst sehen.','Ich möchte, dass wir einander vertrauen, und ich fühle mich nicht wohl, wenn mein Handy ohne Erlaubnis kontrolliert wird. Können wir vereinbaren, vorher zu fragen?','Schon gut. Ich ändere einfach mein Passwort und sage nichts.','Ich brauche mehr Privatsphäre bei meinem Handy. Ich würde gern darüber sprechen, warum du das Gefühl hast, es kontrollieren zu müssen.']],
  ['finances','Über Geld Sprechen','Dir fallen mehrere unerwartete Ausgaben vom gemeinsamen Konto auf, und du machst dir Sorgen um das Monatsbudget.',['Du kannst überhaupt nicht mit Geld umgehen. Deshalb kann ich dir mit dem Konto nicht vertrauen.','Mir sind einige unerwartete Ausgaben aufgefallen, und ich mache mir Sorgen um unser Budget. Können wir sie gemeinsam ansehen und einen Ausgabenplan vereinbaren?','Ich verschiebe mein Geld einfach auf ein anderes Konto und du kannst sehen, wie du klarkommst.','Können wir heute Abend unser Budget ansehen? Ich möchte, dass wir beide mit unseren Ausgaben zufrieden sind.']],
  ['chores','Haushaltsaufgaben Teilen','Du hast das Gefühl, in letzter Zeit mehr Hausarbeit zu übernehmen, und wirst zunehmend frustriert.',['Ich mache hier alles. Du bist faul und hilfst nie.','Ich fühle mich mit den Haushaltsaufgaben überlastet. Können wir auflisten, was erledigt werden muss, und es fairer aufteilen?','Schon gut. Ich mache eben weiterhin alles selbst.','Ich brauche mehr Unterstützung zu Hause. Können wir festlegen, welche Aufgaben jeder dauerhaft übernimmt?']],
  ['familyBoundaries','Grenzen mit der Familie','Ein Familienmitglied kommt immer wieder unangekündigt vorbei, und das sorgt zu Hause für Spannung.',['Deine Familie hat keinen Respekt. Sag ihnen, sie sollen nicht mehr kommen.','Ich möchte, dass deine Familie willkommen ist, aber Überraschungsbesuche stressen mich. Können wir gemeinsam darum bitten, vorher Bescheid zu sagen?','Ich gehe einfach aus dem Haus, wenn sie kommen.','Können wir eine einfache Besuchsregel festlegen, mit der wir uns beide wohlfühlen?']],
  ['privacy','Soziale Medien und Privatsphäre','Dein Partner hat einen privaten Streit online geteilt. Du fühlst dich bloßgestellt und peinlich berührt.',['Lösch das sofort. Du blamierst mich ständig online.','Ich habe mich bloßgestellt gefühlt, als unser privater Streit öffentlich wurde. Ich brauche, dass Konflikte zwischen uns privat bleiben, solange wir nichts anderes gemeinsam vereinbaren.','Ich poste meine Seite der Geschichte, damit alle wissen, was wirklich passiert ist.','Der Beitrag war mir unangenehm. Können wir besprechen, was für uns beide privat bleiben sollte, bevor wir etwas über unsere Beziehung posten?']],
  ['jealousy','Eifersucht und Sicherheit','Die Nähe deines Partners zu einem neuen Kollegen macht dich unsicher, aber du willst keine unfairen Vorwürfe machen.',['Ich weiß, dass da etwas läuft. Hör auf, mit dieser Person zu reden.','Ich merke, dass mich diese Freundschaft unsicher macht. Ich beschuldige dich nicht, aber ich möchte darüber sprechen, was uns beiden Sicherheit und Respekt geben würde.','Ich behalte es für mich und kontrolliere stattdessen die sozialen Medien.','Ich möchte ehrlich sein: Ich bin eifersüchtig. Können wir über Grenzen sprechen, die sich für uns beide gut anfühlen?']],
  ['space','Um Persönlichen Freiraum Bitten','Nach einem langen Tag bist du emotional überlastet und brauchst etwas Ruhe, bevor du reden kannst.',['Lass mich in Ruhe. Ich kann dich gerade nicht ertragen.','Ich möchte mit dir sprechen, bin aber gerade völlig überladen. Kann ich 30 Minuten für mich haben und danach kommen wir wieder zusammen?','Ich verschwinde einfach in ein anderes Zimmer und ignoriere alle.','Ich brauche kurz Ruhe, bevor ich wirklich präsent sein kann. Danach komme ich zurück und wir reden.']],
  ['repair','Nach einem Heftigen Streit Reparieren','Ein Streit ist eskaliert, ihr habt beide die Stimme erhoben und jetzt herrscht Distanz.',['Du hast angefangen, also musst du es auch reparieren.','Der Streit ist außer Kontrolle geraten, und mir gefällt nicht, wie wir miteinander gesprochen haben. Ich möchte, dass wir uns beruhigen, zuhören und das Thema anders angehen.','Tun wir einfach so, als wäre nichts passiert.','Ich möchte das wieder gutmachen. Können wir das Gespräch fortsetzen, wenn wir beide ruhiger sind?']],
  ['textTone','Ein Missverständnis per Nachricht Klären','Eine kurze Nachricht deines Partners klang für dich kühl, und du weißt nicht, ob er verärgert ist.',['Gut. Wenn du unfreundlich sein willst, kann ich das auch.','Deine Nachricht wirkte auf mich etwas distanziert, und vielleicht lese ich den Ton falsch. Ist zwischen uns alles in Ordnung?','Ich ignoriere ihn, bis er sich erklärt.','Vielleicht verstehe ich deine Nachricht falsch. War sie so gemeint, wie sie bei mir ankam?']],
  ['decision','Gemeinsam Entscheiden','Ihr seid euch bei einer größeren Anschaffung uneinig, die eure gemeinsamen Finanzen beeinflussen würde.',['Es ist auch mein Geld, also kaufe ich es, egal was du sagst.','Das betrifft uns beide, und keiner von uns sollte sich übergangen fühlen. Können wir Kosten, Prioritäten und Alternativen vergleichen, bevor wir entscheiden?','Vergiss es. Dann kaufen wir eben nie wieder etwas.','Lass uns langsamer machen und ansehen, was jedem von uns am wichtigsten ist, bevor wir entscheiden.']],
  ['punctuality','Über Verspätungen und Pläne Sprechen','Dein Partner ist bei mehreren Verabredungen zu spät gekommen, und du fühlst, dass deine Zeit nicht respektiert wird.',['Du bist immer zu spät, weil dir andere Menschen egal sind.','Wenn unsere Pläne wiederholt verspätet starten, fühle ich mich frustriert und unwichtig. Können wir vereinbaren, früher Bescheid zu sagen, wenn sich die Zeit ändert?','Dann komme ich ab jetzt auch zu spät, damit du merkst, wie sich das anfühlt.','Ich brauche mehr Verlässlichkeit bei unseren Plänen. Können wir herausfinden, was die Verspätungen verursacht?']],
  ['stressSupport','Einen Gestressten Partner Unterstützen','Dein Partner ist von mehreren Verpflichtungen überfordert und wirkt gereizt und erschöpft.',['Jeder ist gestresst. Hör auf, es an mir auszulassen.','Du wirkst sehr überfordert. Ich bin bei dir. Würde es dir mehr helfen, wenn ich zuhöre, etwas Konkretes übernehme oder dir etwas Raum gebe?','Ich halte mich fern, bis du wieder bessere Laune hast.','Ich sehe, dass du gerade viel trägst. Welche Unterstützung wäre im Moment hilfreich?']],
  ['affection','Über Zuneigung Sprechen','Dir fehlen alltägliche Zuneigung und Nähe, aber du möchtest deinen Partner nicht unter Druck setzen.',['Du zeigst mir nie mehr Zuneigung. Was stimmt mit dir nicht?','Mir fehlt unsere alltägliche Nähe, zum Beispiel Umarmungen und liebevolle Zeit. Ich würde gern darüber sprechen, was sich für uns beide gut und angenehm anfühlt.','Dann höre ich eben auf, es zu versuchen, wenn es dich offensichtlich nicht interessiert.','Mir fehlt die Nähe zu dir. Können wir darüber sprechen, wie wir beide Zuneigung gern geben und empfangen?']],
  ['parenting','Eine Erziehungsmeinung Klären','Ihr seid euch uneinig, wie ihr auf ein Kind reagieren sollt, das eine wichtige Hausregel gebrochen hat.',['Deine Art zu erziehen ist das Problem. Ich kümmere mich allein darum.','Wir sehen das unterschiedlich, und ich möchte nicht, dass wir uns gegenseitig untergraben. Können wir privat reden und uns auf eine Reaktion einigen, bevor wir gemeinsam handeln?','Mach, was du willst. Ich halte mich raus.','Können wir unsere jeweiligen Sorgen vergleichen und eine Reaktion wählen, die wir beide mittragen können?']],
  ['recurringIssue','Ein Wiederkehrendes Problem Ansprechen','Derselbe Streit kommt immer wieder zurück und frühere Gespräche haben keine dauerhafte Veränderung gebracht.',['Da sind wir schon wieder. Dir ist es offensichtlich nicht wichtig genug, dich zu ändern.','Wir bleiben immer wieder am selben Thema hängen, und ich möchte nicht, dass wir uns damit weiter verletzen. Können wir herausfinden, was bisher nicht funktioniert hat, und eine andere Vereinbarung versuchen?','Es hat keinen Sinn mehr, darüber zu reden.','Dieses Thema kommt immer wieder. Ich möchte, dass wir uns auf eine kleine Veränderung konzentrieren, die wir beide wirklich umsetzen können.']]
];


const roundVariantText = {
  en: {
    suffixes: ['Under Stress', 'While Making Plans', 'By Text', 'Around Other People'],
    situations: [
      'This time, the issue comes up when you are both tired and stressed after a long day.',
      'This time, the issue comes up while the two of you are making plans and already feeling some pressure.',
      'This time, the issue starts through text messages, where tone is easy to misread.',
      'This time, the issue comes up around other people, and you want to handle it without embarrassing either person.'
    ],
    optionSets: [
      ['You are making this way bigger than it needs to be. I am not discussing it.','I want to talk about this without blaming each other. I feel affected by what happened, and I want to understand your side and agree on a better next step.','Fine. Do whatever you want. I am done talking about it.','I can see this matters. Can we slow down, talk about what happened, and decide what would help next time?'],
      ['This is ridiculous. You should already know why I am upset.','I want to be clear about what bothered me without attacking you. Can we talk through what each of us understood and what we need going forward?','Never mind. I will just keep it to myself.','I do not want this to become a bigger fight. Can we talk about it calmly and work out one practical change?'],
      ['If you cared, you would not have done that in the first place.','I care about us more than winning this argument. I want to explain how this affected me, hear your perspective, and find a solution we can both live with.','Whatever. Forget I said anything.','I want us to understand each other better. Can we each explain what we meant and then agree on what to do next?'],
      ['You always turn everything into a problem. I am walking away.','I want to address this respectfully and privately. I feel uncomfortable with what happened, and I would like us to talk about it and agree on a better way to handle it.','It is fine. I will just act like it did not bother me.','Can we talk about this when we have a little privacy? I want to understand what happened and keep it from becoming a bigger issue.']
    ]
  },
  es: {
    suffixes: ['Bajo Estrés', 'Al Hacer Planes', 'Por Mensaje', 'Frente a Otras Personas'],
    situations: ['Esta vez, el problema surge cuando ambos están cansados y estresados después de un día largo.','Esta vez, el problema surge mientras hacen planes y los dos ya sienten cierta presión.','Esta vez, el problema comienza por mensajes de texto, donde el tono puede malinterpretarse fácilmente.','Esta vez, el problema surge frente a otras personas y quieres manejarlo sin avergonzar a nadie.'],
    optionSets: [
      ['Estás haciendo esto mucho más grande de lo que es. No voy a hablar de esto.','Quiero hablar de esto sin culparnos. Me afectó lo que pasó y quiero entender tu punto de vista y acordar un mejor próximo paso.','Está bien. Haz lo que quieras. Ya no quiero hablar.','Veo que esto importa. ¿Podemos bajar el tono, hablar de lo ocurrido y decidir qué ayudaría la próxima vez?'],
      ['Esto es ridículo. Ya deberías saber por qué estoy molesto.','Quiero explicar claramente qué me molestó sin atacarte. ¿Podemos hablar de lo que entendió cada uno y de lo que necesitamos de ahora en adelante?','Olvídalo. Mejor me lo guardo.','No quiero que esto se convierta en una pelea mayor. ¿Podemos hablar con calma y acordar un cambio práctico?'],
      ['Si te importara, no lo habrías hecho.','Me importa más nuestra relación que ganar esta discusión. Quiero explicar cómo me afectó, escuchar tu perspectiva y encontrar una solución que funcione para los dos.','Da igual. Olvida que dije algo.','Quiero que nos entendamos mejor. ¿Podemos explicar cada uno lo que quiso decir y acordar qué hacer después?'],
      ['Siempre conviertes todo en un problema. Me voy.','Quiero tratar esto con respeto y en privado. Me incomodó lo que ocurrió y me gustaría que habláramos y acordáramos una mejor manera de manejarlo.','Está bien. Fingiré que no me molestó.','¿Podemos hablar de esto cuando tengamos un poco de privacidad? Quiero entender lo que pasó y evitar que se convierta en algo mayor.']
    ]
  },
  fr: {
    suffixes: ['Sous Stress', 'En Faisant des Projets', 'Par Message', 'Devant D’autres Personnes'],
    situations: ['Cette fois, le problème survient alors que vous êtes tous les deux fatigués et stressés après une longue journée.','Cette fois, le problème apparaît pendant que vous faites des projets et que vous ressentez déjà une certaine pression.','Cette fois, le problème commence par messages, où le ton peut facilement être mal interprété.','Cette fois, le problème survient devant d’autres personnes et vous voulez le gérer sans embarrasser qui que ce soit.'],
    optionSets: [
      ['Tu en fais beaucoup trop. Je ne veux pas en parler.','Je veux en parler sans nous accuser. Ce qui s’est passé m’a affecté, et je veux comprendre ton point de vue et convenir d’une meilleure prochaine étape.','Très bien. Fais ce que tu veux. Je ne veux plus en parler.','Je vois que c’est important. Pouvons-nous ralentir, parler de ce qui s’est passé et décider de ce qui aiderait la prochaine fois ?'],
      ['C’est ridicule. Tu devrais déjà savoir pourquoi je suis contrarié.','Je veux expliquer clairement ce qui m’a dérangé sans t’attaquer. Pouvons-nous parler de ce que chacun a compris et de ce dont nous avons besoin pour la suite ?','Laisse tomber. Je vais garder ça pour moi.','Je ne veux pas que cela devienne une plus grosse dispute. Pouvons-nous en parler calmement et convenir d’un changement concret ?'],
      ['Si tu tenais à moi, tu ne l’aurais pas fait.','Notre relation compte plus pour moi que gagner cette dispute. Je veux expliquer l’impact sur moi, entendre ton point de vue et trouver une solution acceptable pour nous deux.','Peu importe. Oublie que j’ai dit quelque chose.','Je veux que nous nous comprenions mieux. Pouvons-nous expliquer chacun ce que nous voulions dire puis décider ensemble de la suite ?'],
      ['Tu transformes toujours tout en problème. Je m’en vais.','Je veux aborder cela avec respect et en privé. Ce qui s’est passé m’a mis mal à l’aise, et j’aimerais que nous en parlions et trouvions une meilleure façon de gérer ce type de situation.','Ce n’est rien. Je vais faire comme si cela ne m’avait pas dérangé.','Pouvons-nous en parler quand nous aurons un peu d’intimité ? Je veux comprendre ce qui s’est passé et éviter que cela devienne un problème plus important.']
    ]
  },
  it: {
    suffixes: ['Sotto Stress', 'Mentre Fate Programmi', 'Via Messaggio', 'Davanti ad Altre Persone'],
    situations: ['Questa volta il problema emerge quando siete entrambi stanchi e stressati dopo una lunga giornata.','Questa volta il problema emerge mentre state facendo programmi e sentite già un po’ di pressione.','Questa volta il problema inizia tramite messaggi, dove il tono può essere facilmente frainteso.','Questa volta il problema emerge davanti ad altre persone e vuoi gestirlo senza mettere in imbarazzo nessuno.'],
    optionSets: [
      ['Stai ingigantendo tutto. Non ne parlerò.','Voglio parlarne senza accusarci. Quello che è successo mi ha colpito e voglio capire il tuo punto di vista e concordare un passo successivo migliore.','Va bene. Fai quello che vuoi. Ho finito di parlarne.','Vedo che è importante. Possiamo rallentare, parlare di ciò che è successo e decidere cosa potrebbe aiutare la prossima volta?'],
      ['È ridicolo. Dovresti già sapere perché sono arrabbiato.','Voglio spiegare chiaramente cosa mi ha infastidito senza attaccarti. Possiamo parlare di ciò che ognuno ha capito e di ciò di cui abbiamo bisogno d’ora in poi?','Lascia perdere. Me lo terrò per me.','Non voglio che diventi una lite più grande. Possiamo parlarne con calma e concordare un cambiamento pratico?'],
      ['Se ti importasse, non lo avresti fatto.','Mi importa più di noi che di vincere questa discussione. Voglio spiegare come mi ha fatto sentire, ascoltare il tuo punto di vista e trovare una soluzione che vada bene a entrambi.','Non importa. Dimentica che ho detto qualcosa.','Voglio che ci capiamo meglio. Possiamo spiegare cosa intendevamo e poi concordare cosa fare dopo?'],
      ['Trasformi sempre tutto in un problema. Me ne vado.','Voglio affrontare la cosa con rispetto e in privato. Quello che è successo mi ha messo a disagio e vorrei parlarne e concordare un modo migliore di gestirlo.','Va bene. Farò finta che non mi abbia dato fastidio.','Possiamo parlarne quando avremo un po’ di privacy? Voglio capire cosa è successo ed evitare che diventi un problema più grande.']
    ]
  },
  de: {
    suffixes: ['Unter Stress', 'Beim Planen', 'Per Nachricht', 'Vor Anderen Menschen'],
    situations: ['Diesmal kommt das Thema auf, als ihr beide nach einem langen Tag müde und gestresst seid.','Diesmal entsteht das Problem, während ihr Pläne macht und beide bereits etwas unter Druck steht.','Diesmal beginnt das Problem über Textnachrichten, bei denen der Ton leicht missverstanden werden kann.','Diesmal kommt das Problem vor anderen Menschen auf, und du möchtest es ansprechen, ohne jemanden bloßzustellen.'],
    optionSets: [
      ['Du machst daraus viel zu viel. Darüber rede ich nicht.','Ich möchte darüber sprechen, ohne uns gegenseitig Vorwürfe zu machen. Was passiert ist, hat mich beschäftigt, und ich möchte deine Sicht verstehen und einen besseren nächsten Schritt vereinbaren.','Gut. Mach, was du willst. Ich rede nicht mehr darüber.','Ich sehe, dass das wichtig ist. Können wir einen Gang zurückschalten, darüber sprechen und überlegen, was beim nächsten Mal helfen würde?'],
      ['Das ist lächerlich. Du solltest längst wissen, warum ich verärgert bin.','Ich möchte klar sagen, was mich gestört hat, ohne dich anzugreifen. Können wir besprechen, was jeder von uns verstanden hat und was wir künftig brauchen?','Vergiss es. Ich behalte es einfach für mich.','Ich möchte nicht, dass daraus ein größerer Streit wird. Können wir ruhig darüber sprechen und eine konkrete Veränderung vereinbaren?'],
      ['Wenn dir etwas an mir läge, hättest du das nicht getan.','Unsere Beziehung ist mir wichtiger, als diesen Streit zu gewinnen. Ich möchte erklären, wie es mich getroffen hat, deine Sicht hören und eine Lösung finden, mit der wir beide leben können.','Egal. Vergiss, dass ich etwas gesagt habe.','Ich möchte, dass wir uns besser verstehen. Können wir beide erklären, was wir gemeint haben, und dann gemeinsam entscheiden, wie es weitergeht?'],
      ['Du machst aus allem ein Problem. Ich gehe.','Ich möchte das respektvoll und privat ansprechen. Was passiert ist, war mir unangenehm, und ich würde gern darüber reden und eine bessere Art vereinbaren, damit umzugehen.','Schon gut. Ich tue einfach so, als hätte es mich nicht gestört.','Können wir darüber sprechen, wenn wir etwas Privatsphäre haben? Ich möchte verstehen, was passiert ist, und verhindern, dass daraus ein größeres Problem wird.']
    ]
  }
};

const expandScenarioBank = (lang, baseScenarios) => {
  const localized = roundVariantText[lang] || roundVariantText.en;
  const expanded = { ...baseScenarios };
  Object.entries(baseScenarios).forEach(([id, scenario]) => {
    localized.suffixes.forEach((suffix, index) => {
      expanded[id + '_variant_' + (index + 1)] = {
        title: scenario.title + ' — ' + suffix,
        situation: scenario.situation + ' ' + localized.situations[index],
        options: localized.optionSets[index].map((text, optionIndex) => ({
          text,
          type: optionTypes[optionIndex],
          feedback: feedbackByLanguage[lang][optionTypes[optionIndex]]
        }))
      };
    });
  });
  return expanded;
};

export const communicationPracticeScenarios = {
  en: expandScenarioBank('en', buildScenarios('en', en)),
  es: expandScenarioBank('es', buildScenarios('es', es)),
  fr: expandScenarioBank('fr', buildScenarios('fr', fr)),
  it: expandScenarioBank('it', buildScenarios('it', it)),
  de: expandScenarioBank('de', buildScenarios('de', de))
};

export default communicationPracticeScenarios;
