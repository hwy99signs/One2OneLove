const q=(en,es,fr,it,de)=>({en,es,fr,it,de});

export const LIKE_MINDED_EXTRA_QUESTIONS = {
  'Relationship Goals': {
    easy:[
      q('You have a completely free Saturday together. What would you most want the day to feel like?','Tienen un sábado completamente libre juntos. ¿Cómo te gustaría que se sintiera el día?','Vous avez un samedi entièrement libre ensemble. Quelle ambiance aimeriez-vous pour la journée ?','Avete un sabato completamente libero insieme. Come vorresti che fosse la giornata?','Ihr habt einen völlig freien Samstag zusammen. Wie sollte sich der Tag am besten anfühlen?'),
      q('If you could design one perfect day off as a couple, which style fits you best?','Si pudieras diseñar un día libre perfecto en pareja, ¿qué estilo te representa más?','Si vous pouviez créer une journée parfaite à deux, quel style vous conviendrait le mieux ?','Se potessi creare una giornata libera perfetta in coppia, quale stile ti rappresenterebbe meglio?','Wenn du einen perfekten freien Tag als Paar gestalten könntest, welcher Stil passt am besten?')
    ],
    real:[
      q('How important is it that partners agree on where the relationship is heading?','¿Qué tan importante es que la pareja esté de acuerdo sobre hacia dónde va la relación?','À quel point est-il important que les partenaires soient d’accord sur la direction de la relation ?','Quanto è importante che i partner siano d’accordo sulla direzione della relazione?','Wie wichtig ist es, dass Partner sich über die Richtung der Beziehung einig sind?'),
      q('How important is it to revisit long-term relationship goals together?','¿Qué tan importante es revisar juntos las metas de relación a largo plazo?','À quel point est-il important de revoir ensemble les objectifs relationnels à long terme ?','Quanto è importante rivedere insieme gli obiettivi di coppia a lungo termine?','Wie wichtig ist es, langfristige Beziehungsziele gemeinsam regelmäßig zu überprüfen?')
    ],
    deep:[
      q('If staying together required one person to give up a major future plan, what should guide the decision?','Si seguir juntos exigiera que uno renunciara a un gran plan de futuro, ¿qué debería guiar la decisión?','Si rester ensemble exigeait que l’un renonce à un grand projet d’avenir, qu’est-ce qui devrait guider la décision ?','Se restare insieme richiedesse a uno di rinunciare a un grande progetto futuro, cosa dovrebbe guidare la decisione?','Wenn das Zusammenbleiben verlangt, dass einer einen großen Zukunftsplan aufgibt, was sollte die Entscheidung leiten?'),
      q('When love and life direction pull in opposite directions, what deserves priority?','Cuando el amor y el rumbo de vida van en direcciones opuestas, ¿qué merece prioridad?','Quand l’amour et la direction de vie tirent dans des sens opposés, qu’est-ce qui mérite la priorité ?','Quando amore e direzione di vita vanno in direzioni opposte, cosa merita priorità?','Wenn Liebe und Lebensrichtung in verschiedene Richtungen ziehen, was sollte Vorrang haben?')
    ]
  },
  Communication: {
    easy:[
      q('After a tense moment, when do you prefer to clear the air?','Después de un momento tenso, ¿cuándo prefieres aclarar las cosas?','Après un moment tendu, quand préférez-vous mettre les choses au clair ?','Dopo un momento teso, quando preferisci chiarire le cose?','Nach einem angespannten Moment: Wann möchtest du die Sache klären?'),
      q('If a message from your partner upsets you, when would you rather discuss it?','Si un mensaje de tu pareja te molesta, ¿cuándo preferirías hablarlo?','Si un message de votre partenaire vous contrarie, quand préféreriez-vous en parler ?','Se un messaggio del partner ti turba, quando preferiresti parlarne?','Wenn dich eine Nachricht deines Partners verärgert, wann möchtest du darüber sprechen?')
    ],
    real:[
      q('During conflict, what should a couple focus on first?','Durante un conflicto, ¿en qué debería enfocarse primero una pareja?','Pendant un conflit, sur quoi un couple devrait-il se concentrer en premier ?','Durante un conflitto, su cosa dovrebbe concentrarsi prima una coppia?','Worauf sollte sich ein Paar bei einem Konflikt zuerst konzentrieren?'),
      q('When both people think they are right, what matters most?','Cuando ambos creen tener razón, ¿qué importa más?','Quand les deux pensent avoir raison, qu’est-ce qui compte le plus ?','Quando entrambi pensano di avere ragione, cosa conta di più?','Wenn beide überzeugt sind, recht zu haben, was zählt am meisten?')
    ],
    deep:[
      q('If the same argument keeps returning, what should happen next?','Si la misma discusión sigue regresando, ¿qué debería pasar después?','Si la même dispute revient sans cesse, que devrait-il se passer ensuite ?','Se la stessa discussione continua a tornare, cosa dovrebbe succedere dopo?','Wenn derselbe Streit immer wiederkehrt, was sollte als Nächstes passieren?'),
      q('If your partner says your words hurt them even though you meant no harm, what should you do?','Si tu pareja dice que tus palabras le hirieron aunque no era tu intención, ¿qué deberías hacer?','Si votre partenaire dit que vos paroles l’ont blessé malgré vos bonnes intentions, que devriez-vous faire ?','Se il partner dice che le tue parole lo hanno ferito anche senza intenzione, cosa dovresti fare?','Wenn dein Partner sagt, dass deine Worte verletzt haben, obwohl du es nicht so meintest, was solltest du tun?')
    ]
  },
  Values: {
    easy:[
      q('Which trait makes you trust a partner most?','¿Qué cualidad te hace confiar más en una pareja?','Quelle qualité vous fait le plus confiance à un partenaire ?','Quale qualità ti fa fidare di più di un partner?','Welche Eigenschaft lässt dich einem Partner am meisten vertrauen?'),
      q('Which personal quality feels most attractive in a long-term partner?','¿Qué cualidad personal te parece más atractiva en una pareja a largo plazo?','Quelle qualité personnelle vous attire le plus chez un partenaire à long terme ?','Quale qualità personale trovi più attraente in un partner a lungo termine?','Welche persönliche Eigenschaft findest du bei einem langfristigen Partner am attraktivsten?')
    ],
    real:[
      q('How important is it to agree on moral or ethical priorities?','¿Qué tan importante es estar de acuerdo en prioridades morales o éticas?','À quel point est-il important d’être d’accord sur les priorités morales ou éthiques ?','Quanto è importante essere d’accordo sulle priorità morali o etiche?','Wie wichtig ist Übereinstimmung bei moralischen oder ethischen Prioritäten?'),
      q('How important are shared principles when everyday interests are different?','¿Qué tan importantes son los principios compartidos cuando los intereses diarios son diferentes?','Quelle importance ont les principes communs lorsque les intérêts quotidiens diffèrent ?','Quanto sono importanti i principi condivisi quando gli interessi quotidiani sono diversi?','Wie wichtig sind gemeinsame Prinzipien, wenn alltägliche Interessen unterschiedlich sind?')
    ],
    deep:[
      q('Could a relationship work if you disagree strongly about what is right and wrong?','¿Podría funcionar una relación si discrepan mucho sobre lo que está bien y mal?','Une relation peut-elle fonctionner si vous êtes fortement en désaccord sur le bien et le mal ?','Può funzionare una relazione se siete molto in disaccordo su ciò che è giusto o sbagliato?','Kann eine Beziehung funktionieren, wenn ihr stark darüber uneinig seid, was richtig und falsch ist?'),
      q('Could love last if your deepest beliefs about life move in different directions?','¿Podría durar el amor si sus creencias más profundas sobre la vida van en direcciones diferentes?','L’amour pourrait-il durer si vos convictions les plus profondes sur la vie vont dans des directions différentes ?','Può durare l’amore se le convinzioni più profonde sulla vita vanno in direzioni diverse?','Kann Liebe bestehen, wenn eure tiefsten Überzeugungen über das Leben in verschiedene Richtungen gehen?')
    ]
  },
  Family: {
    easy:[
      q('How would you feel about seeing extended family most weekends?','¿Cómo te sentirías viendo a la familia extendida la mayoría de los fines de semana?','Que penseriez-vous de voir la famille élargie presque tous les week-ends ?','Come ti sentiresti a vedere la famiglia allargata quasi ogni fine settimana?','Wie würdest du dich fühlen, wenn ihr die Großfamilie an den meisten Wochenenden seht?'),
      q('How much family time would feel comfortable to you as a couple?','¿Cuánto tiempo con la familia te resultaría cómodo como pareja?','Quelle quantité de temps en famille vous semblerait confortable en couple ?','Quanto tempo con la famiglia ti sembrerebbe comodo come coppia?','Wie viel Familienzeit würde sich für dich als Paar angenehm anfühlen?')
    ],
    real:[
      q('How involved should parents or relatives be in major relationship decisions?','¿Qué tan involucrados deberían estar padres o familiares en decisiones importantes de pareja?','Dans quelle mesure les parents ou proches devraient-ils participer aux grandes décisions du couple ?','Quanto dovrebbero essere coinvolti genitori o parenti nelle grandi decisioni di coppia?','Wie stark sollten Eltern oder Verwandte an wichtigen Beziehungsentscheidungen beteiligt sein?'),
      q('When family gives strong advice about your relationship, how much weight should it carry?','Cuando la familia da consejos fuertes sobre tu relación, ¿cuánto peso deberían tener?','Lorsque la famille donne un avis fort sur votre relation, quel poids devrait-il avoir ?','Quando la famiglia dà forti consigli sulla relazione, quanto peso dovrebbero avere?','Wenn die Familie starken Rat zu eurer Beziehung gibt, wie viel Gewicht sollte er haben?')
    ],
    deep:[
      q('If a parent asked you to end a healthy relationship, what should guide your response?','Si un padre te pidiera terminar una relación sana, ¿qué debería guiar tu respuesta?','Si un parent vous demandait de mettre fin à une relation saine, qu’est-ce qui devrait guider votre réponse ?','Se un genitore ti chiedesse di chiudere una relazione sana, cosa dovrebbe guidare la tua risposta?','Wenn ein Elternteil dich bitten würde, eine gesunde Beziehung zu beenden, was sollte deine Reaktion leiten?'),
      q('If your partner and your family could not get along, what would matter most?','Si tu pareja y tu familia no pudieran llevarse bien, ¿qué importaría más?','Si votre partenaire et votre famille ne pouvaient pas s’entendre, qu’est-ce qui compterait le plus ?','Se il partner e la famiglia non riuscissero ad andare d’accordo, cosa conterebbe di più?','Wenn dein Partner und deine Familie nicht miteinander auskommen, was wäre am wichtigsten?')
    ]
  },
  Lifestyle: {
    easy:[
      q('What kind of everyday pace feels most natural to you?','¿Qué ritmo cotidiano te resulta más natural?','Quel rythme quotidien vous semble le plus naturel ?','Quale ritmo quotidiano ti sembra più naturale?','Welches Alltagstempo fühlt sich für dich am natürlichsten an?'),
      q('Which lifestyle rhythm would make you happiest most weeks?','¿Qué ritmo de vida te haría más feliz la mayoría de las semanas?','Quel rythme de vie vous rendrait le plus heureux la plupart des semaines ?','Quale ritmo di vita ti renderebbe più felice nella maggior parte delle settimane?','Welcher Lebensrhythmus würde dich in den meisten Wochen am glücklichsten machen?')
    ],
    real:[
      q('How important is matching sleep, work and social routines?','¿Qué tan importante es coincidir en rutinas de sueño, trabajo y vida social?','À quel point est-il important d’avoir des rythmes similaires de sommeil, travail et vie sociale ?','Quanto è importante avere routine simili per sonno, lavoro e vita sociale?','Wie wichtig sind ähnliche Schlaf-, Arbeits- und Sozialroutinen?'),
      q('How important is it for partners to enjoy a similar pace of life?','¿Qué tan importante es que la pareja disfrute un ritmo de vida similar?','À quel point est-il important que les partenaires apprécient un rythme de vie similaire ?','Quanto è importante che i partner apprezzino un ritmo di vita simile?','Wie wichtig ist es, dass Partner ein ähnliches Lebenstempo mögen?')
    ],
    deep:[
      q('Could you thrive with someone who wants a much busier or quieter life than you?','¿Podrías prosperar con alguien que quiera una vida mucho más ocupada o tranquila que tú?','Pourriez-vous vous épanouir avec quelqu’un qui veut une vie beaucoup plus active ou calme que vous ?','Potresti stare bene con qualcuno che desidera una vita molto più impegnata o tranquilla della tua?','Könntest du mit jemandem aufblühen, der ein viel geschäftigeres oder ruhigeres Leben will als du?'),
      q('Could a long-term relationship work if your preferred lifestyles rarely overlap?','¿Podría funcionar una relación a largo plazo si sus estilos de vida preferidos casi no coinciden?','Une relation durable peut-elle fonctionner si vos modes de vie préférés se croisent rarement ?','Può funzionare una relazione a lungo termine se gli stili di vita preferiti si sovrappongono raramente?','Kann eine langfristige Beziehung funktionieren, wenn eure bevorzugten Lebensstile kaum übereinstimmen?')
    ]
  },
  'Money & Ambition': {
    easy:[
      q('You receive an unexpected bonus. What feels smartest to do first?','Recibes un bono inesperado. ¿Qué te parece más inteligente hacer primero?','Vous recevez une prime inattendue. Que vous semble-t-il le plus judicieux de faire d’abord ?','Ricevi un bonus inatteso. Cosa ti sembra più intelligente fare per prima cosa?','Du bekommst einen unerwarteten Bonus. Was wäre für dich zuerst am sinnvollsten?'),
      q('A surprise $2,000 arrives. What would you prefer to do with it?','Llegan $2,000 inesperados. ¿Qué preferirías hacer con ellos?','Vous recevez 2 000 $ de façon inattendue. Que préféreriez-vous en faire ?','Arrivano 2.000 dollari inattesi. Cosa preferiresti farne?','Unerwartet kommen 2.000 $. Was würdest du am liebsten damit tun?')
    ],
    real:[
      q('If incomes are very different, how should shared expenses be divided?','Si los ingresos son muy diferentes, ¿cómo deberían dividirse los gastos compartidos?','Si les revenus sont très différents, comment les dépenses communes devraient-elles être réparties ?','Se i redditi sono molto diversi, come dovrebbero essere divise le spese comuni?','Wenn die Einkommen sehr unterschiedlich sind, wie sollten gemeinsame Ausgaben aufgeteilt werden?'),
      q('What feels fairest when one partner earns several times more than the other?','¿Qué parece más justo cuando una persona gana varias veces más que la otra?','Qu’est-ce qui semble le plus juste lorsque l’un gagne plusieurs fois plus que l’autre ?','Cosa sembra più giusto quando un partner guadagna diverse volte più dell’altro?','Was fühlt sich am fairsten an, wenn ein Partner ein Vielfaches des anderen verdient?')
    ],
    deep:[
      q("Would you be comfortable using shared savings to support a partner's business dream?",'¿Te sentirías cómodo usando ahorros compartidos para apoyar el sueño empresarial de tu pareja ?','Seriez-vous à l’aise d’utiliser l’épargne commune pour soutenir le projet d’entreprise de votre partenaire ?','Ti sentiresti a tuo agio usando risparmi comuni per sostenere il sogno imprenditoriale del partner?','Wärst du damit einverstanden, gemeinsame Ersparnisse für den Geschäftstraum deines Partners einzusetzen?'),
      q("How much financial uncertainty would you accept for a partner's major opportunity?",'¿Cuánta incertidumbre financiera aceptarías por una gran oportunidad de tu pareja?','Quelle incertitude financière accepteriez-vous pour une grande opportunité de votre partenaire ?','Quanta incertezza finanziaria accetteresti per una grande opportunità del partner?','Wie viel finanzielle Unsicherheit würdest du für eine große Chance deines Partners akzeptieren?')
    ]
  },
  Boundaries: {
    easy:[
      q('How much regular personal space helps you feel balanced in a relationship?','¿Cuánto espacio personal regular te ayuda a sentirte equilibrado en una relación?','Quelle quantité d’espace personnel régulier vous aide à vous sentir équilibré dans une relation ?','Quanto spazio personale regolare ti aiuta a sentirti equilibrato in una relazione?','Wie viel regelmäßiger persönlicher Freiraum hilft dir, dich in einer Beziehung ausgeglichen zu fühlen?'),
      q('What amount of separate time feels normal and healthy to you?','¿Qué cantidad de tiempo por separado te parece normal y saludable?','Quelle quantité de temps séparé vous semble normale et saine ?','Quanto tempo separati ti sembra normale e sano?','Wie viel getrennte Zeit fühlt sich für dich normal und gesund an?')
    ],
    real:[
      q("Should partners know each other's phone passwords?",'¿Deberían las parejas conocer las contraseñas del teléfono del otro?','Les partenaires devraient-ils connaître les mots de passe du téléphone de l’autre ?','I partner dovrebbero conoscere le password del telefono dell’altro?','Sollten Partner die Handy-Passwörter des anderen kennen?'),
      q('Is privacy on a phone still important in a committed relationship?','¿Sigue siendo importante la privacidad del teléfono en una relación comprometida?','La confidentialité du téléphone reste-t-elle importante dans une relation engagée ?','La privacy sul telefono è ancora importante in una relazione seria?','Ist Privatsphäre am Handy auch in einer festen Beziehung wichtig?')
    ],
    deep:[
      q("If you think a partner's boundary is too strict, what should happen?",'Si crees que un límite de tu pareja es demasiado estricto, ¿qué debería pasar?','Si vous trouvez qu’une limite de votre partenaire est trop stricte, que devrait-il se passer ?','Se pensi che un confine del partner sia troppo rigido, cosa dovrebbe succedere?','Wenn du eine Grenze deines Partners für zu streng hältst, was sollte passieren?'),
      q("When two people's boundaries clash, how should the relationship handle it?",'Cuando los límites de dos personas chocan, ¿cómo debería manejarlo la relación?','Lorsque les limites de deux personnes s’opposent, comment le couple devrait-il gérer cela ?','Quando i confini di due persone entrano in conflitto, come dovrebbe gestirlo la relazione?','Wenn die Grenzen zweier Menschen kollidieren, wie sollte die Beziehung damit umgehen?')
    ]
  },
  'Future Priorities': {
    easy:[
      q('Which shared future would excite you most right now?','¿Qué futuro compartido te entusiasmaría más ahora mismo?','Quel avenir commun vous enthousiasmerait le plus en ce moment ?','Quale futuro condiviso ti entusiasmerebbe di più in questo momento?','Welche gemeinsame Zukunft würde dich gerade am meisten begeistern?'),
      q('What kind of next chapter would you most want to build with a partner?','¿Qué tipo de próximo capítulo te gustaría construir con una pareja?','Quel prochain chapitre aimeriez-vous le plus construire avec un partenaire ?','Quale prossimo capitolo vorresti costruire di più con un partner?','Welche Art von nächstem Kapitel würdest du am liebsten mit einem Partner aufbauen?')
    ],
    real:[
      q('How much of the next five years should a couple plan together?','¿Cuánto de los próximos cinco años debería planificar una pareja junta?','Quelle part des cinq prochaines années un couple devrait-il planifier ensemble ?','Quanto dei prossimi cinque anni dovrebbe pianificare insieme una coppia?','Wie viel der nächsten fünf Jahre sollte ein Paar gemeinsam planen?'),
      q("How structured should a couple's long-term planning be?",'¿Qué tan estructurada debería ser la planificación a largo plazo de una pareja?','À quel point la planification à long terme d’un couple devrait-elle être structurée ?','Quanto dovrebbe essere strutturata la pianificazione a lungo termine di una coppia?','Wie strukturiert sollte die langfristige Planung eines Paares sein?')
    ],
    deep:[
      q('If two career opportunities require living in different places, how should a couple choose?','Si dos oportunidades profesionales exigen vivir en lugares distintos, ¿cómo debería elegir la pareja?','Si deux opportunités professionnelles exigent de vivre dans des lieux différents, comment le couple devrait-il choisir ?','Se due opportunità di carriera richiedono di vivere in luoghi diversi, come dovrebbe scegliere la coppia?','Wenn zwei Karrierechancen das Leben an verschiedenen Orten erfordern, wie sollte ein Paar entscheiden?'),
      q('If both partners get once-in-a-lifetime opportunities at the same time, how should they decide?','Si ambos reciben oportunidades únicas al mismo tiempo, ¿cómo deberían decidir?','Si les deux partenaires reçoivent en même temps une opportunité unique, comment devraient-ils décider ?','Se entrambi ricevono opportunità irripetibili nello stesso momento, come dovrebbero decidere?','Wenn beide Partner gleichzeitig einmalige Chancen bekommen, wie sollten sie entscheiden?')
    ]
  },
  'Fun Scenarios': {
    easy:[
      q('Someone gives you two free plane tickets. Where does your instinct take you?','Alguien te da dos boletos de avión gratis. ¿Adónde te lleva tu instinto?','Quelqu’un vous offre deux billets d’avion gratuits. Où votre instinct vous emmène-t-il ?','Qualcuno ti regala due biglietti aerei. Dove ti porta l’istinto?','Jemand schenkt euch zwei Flugtickets. Wohin zieht es dich spontan?'),
      q('For an unexpected three-day getaway, what sounds best?','Para una escapada inesperada de tres días, ¿qué suena mejor?','Pour une escapade imprévue de trois jours, qu’est-ce qui vous tente le plus ?','Per una fuga imprevista di tre giorni, cosa sembra meglio?','Was klingt für einen unerwarteten dreitägigen Kurztrip am besten?')
    ],
    real:[
      q("Your date-night reservation disappears at the last minute. What's your instinct?",'La reserva para su cita desaparece a último momento. ¿Cuál es tu instinto?','Votre réservation pour la soirée disparaît à la dernière minute. Quel est votre réflexe ?','La prenotazione per la serata salta all’ultimo minuto. Qual è il tuo istinto?','Eure Reservierung für den Date-Abend fällt in letzter Minute aus. Was ist dein erster Impuls?'),
      q('A carefully planned weekend is ruined by bad weather. What do you do first?','Un fin de semana cuidadosamente planeado se arruina por mal tiempo. ¿Qué haces primero?','Un week-end soigneusement planifié est gâché par le mauvais temps. Que faites-vous d’abord ?','Un weekend pianificato con cura viene rovinato dal maltempo. Cosa fai per prima cosa?','Ein sorgfältig geplantes Wochenende fällt wegen schlechtem Wetter ins Wasser. Was tust du zuerst?')
    ],
    deep:[
      q('If your partner suggested a major adventure leaving next week, how ready would you be?','Si tu pareja propusiera una gran aventura para la próxima semana, ¿qué tan listo estarías?','Si votre partenaire proposait une grande aventure dès la semaine prochaine, à quel point seriez-vous prêt ?','Se il partner proponesse una grande avventura con partenza la prossima settimana, quanto saresti pronto?','Wenn dein Partner ein großes Abenteuer ab nächster Woche vorschlägt, wie bereit wärst du?'),
      q('How quickly could you say yes to a big unexpected opportunity together?','¿Qué tan rápido podrías decir que sí a una gran oportunidad inesperada juntos?','À quelle vitesse pourriez-vous dire oui à une grande opportunité inattendue à deux ?','Quanto velocemente potresti dire sì a una grande opportunità inattesa insieme?','Wie schnell könntest du zu einer großen unerwarteten gemeinsamen Chance Ja sagen?')
    ]
  },
  Humor: {
    easy:[
      q('Which kind of joke gets you almost every time?','¿Qué tipo de broma casi siempre te hace reír?','Quel type de blague vous fait rire presque à chaque fois ?','Quale tipo di battuta ti fa ridere quasi sempre?','Welche Art von Witz bringt dich fast immer zum Lachen?'),
      q('What style of humor would you most enjoy sharing with a partner?','¿Qué estilo de humor disfrutarías más compartir con una pareja?','Quel style d’humour aimeriez-vous le plus partager avec un partenaire ?','Quale stile di umorismo ti piacerebbe condividere di più con un partner?','Welche Art Humor würdest du am liebsten mit einem Partner teilen?')
    ],
    real:[
      q('How important is laughing together in a long-term relationship?','¿Qué tan importante es reír juntos en una relación a largo plazo?','À quel point est-il important de rire ensemble dans une relation durable ?','Quanto è importante ridere insieme in una relazione a lungo termine?','Wie wichtig ist gemeinsames Lachen in einer langfristigen Beziehung?'),
      q('How important is it that your partner understands what you find funny?','¿Qué tan importante es que tu pareja entienda lo que te hace reír?','À quel point est-il important que votre partenaire comprenne ce qui vous fait rire ?','Quanto è importante che il partner capisca cosa ti fa ridere?','Wie wichtig ist es, dass dein Partner versteht, was du lustig findest?')
    ],
    deep:[
      q('When emotions are high, how much humor belongs in the conversation?','Cuando las emociones están intensas, ¿cuánto humor debería haber en la conversación?','Quand les émotions sont fortes, quelle place l’humour devrait-il avoir dans la conversation ?','Quando le emozioni sono forti, quanto umorismo dovrebbe esserci nella conversazione?','Wenn die Emotionen hochkochen, wie viel Humor gehört ins Gespräch?'),
      q('Should a partner use humor to lighten a serious disagreement?','¿Debería una pareja usar humor para aliviar un desacuerdo serio?','Un partenaire devrait-il utiliser l’humour pour alléger un désaccord sérieux ?','Un partner dovrebbe usare l’umorismo per alleggerire un disaccordo serio?','Sollte ein Partner Humor einsetzen, um einen ernsten Streit aufzulockern?')
    ]
  },
  Activities: {
    easy:[
      q('If you had three free hours together, what activity sounds best?','Si tuvieran tres horas libres juntos, ¿qué actividad suena mejor?','Si vous aviez trois heures libres ensemble, quelle activité vous tenterait le plus ?','Se aveste tre ore libere insieme, quale attività sembra migliore?','Wenn ihr drei freie Stunden zusammen hättet, welche Aktivität klingt am besten?'),
      q('Which kind of shared hobby would you be most excited to try?','¿Qué tipo de hobby compartido te entusiasmaría más probar?','Quel type de loisir partagé seriez-vous le plus enthousiaste à essayer ?','Quale tipo di hobby condiviso saresti più entusiasta di provare?','Welche Art gemeinsames Hobby würdest du am liebsten ausprobieren?')
    ],
    real:[
      q('Should couples protect regular time for activities they both enjoy?','¿Deberían las parejas reservar regularmente tiempo para actividades que ambos disfrutan?','Les couples devraient-ils protéger régulièrement du temps pour des activités qu’ils aiment tous les deux ?','Le coppie dovrebbero proteggere regolarmente tempo per attività che piacciono a entrambi?','Sollten Paare regelmäßig Zeit für Aktivitäten reservieren, die beide mögen?'),
      q('How often should partners intentionally do hobbies together?','¿Con qué frecuencia deberían las parejas hacer hobbies juntos intencionalmente?','À quelle fréquence les partenaires devraient-ils volontairement pratiquer des loisirs ensemble ?','Quanto spesso i partner dovrebbero dedicarsi intenzionalmente a hobby insieme?','Wie oft sollten Partner bewusst gemeinsame Hobbys pflegen?')
    ],
    deep:[
      q("If one partner's favorite hobby takes a lot of shared time, how much should each adapt?",'Si el hobby favorito de uno ocupa mucho tiempo compartido, ¿cuánto debería adaptarse cada uno?','Si le loisir préféré de l’un prend beaucoup de temps commun, jusqu’où chacun devrait-il s’adapter ?','Se l’hobby preferito di uno occupa molto tempo condiviso, quanto dovrebbe adattarsi ciascuno?','Wenn das Lieblingshobby eines Partners viel gemeinsame Zeit beansprucht, wie stark sollten sich beide anpassen?'),
      q('If your favorite activities are completely different, how much compromise is fair?','Si sus actividades favoritas son completamente diferentes, ¿cuánto compromiso es justo?','Si vos activités préférées sont totalement différentes, quel niveau de compromis est juste ?','Se le attività preferite sono completamente diverse, quanto compromesso è giusto?','Wenn eure Lieblingsaktivitäten völlig verschieden sind, wie viel Kompromiss ist fair?')
    ]
  },
  'Food & Travel': {
    easy:[
      q('What kind of vacation would you choose first?','¿Qué tipo de vacaciones elegirías primero?','Quel type de vacances choisiriez-vous en premier ?','Che tipo di vacanza sceglieresti per prima?','Welche Art Urlaub würdest du zuerst wählen?'),
      q('Which travel experience sounds most like your ideal getaway?','¿Qué experiencia de viaje se parece más a tu escapada ideal?','Quelle expérience de voyage ressemble le plus à votre escapade idéale ?','Quale esperienza di viaggio somiglia di più alla tua fuga ideale?','Welches Reiseerlebnis entspricht am ehesten deinem idealen Kurzurlaub?')
    ],
    real:[
      q('On a trip together, what should be protected most?','En un viaje juntos, ¿qué debería protegerse más?','Lors d’un voyage à deux, qu’est-ce qu’il faut le plus préserver ?','Durante un viaggio insieme, cosa dovrebbe essere protetto di più?','Was sollte auf einer gemeinsamen Reise am meisten geschützt werden?'),
      q('If two people travel differently, what part of the trip matters most to get right?','Si dos personas viajan de forma distinta, ¿qué parte del viaje es más importante acertar?','Si deux personnes voyagent différemment, quelle partie du voyage est la plus importante à bien réussir ?','Se due persone viaggiano in modo diverso, quale parte del viaggio è più importante gestire bene?','Wenn zwei Menschen unterschiedlich reisen, welcher Teil der Reise muss am ehesten stimmen?')
    ],
    deep:[
      q('Would you move to another country for a shared opportunity?','¿Te mudarías a otro país por una oportunidad compartida?','Déménageriez-vous dans un autre pays pour une opportunité commune ?','Ti trasferiresti in un altro paese per un’opportunità condivisa?','Würdest du für eine gemeinsame Chance in ein anderes Land ziehen?'),
      q('Would you leave a familiar community behind if it clearly improved your future together?','¿Dejarías una comunidad conocida si claramente mejorara su futuro juntos?','Quitteriez-vous une communauté familière si cela améliorait clairement votre avenir ensemble ?','Lasceresti una comunità familiare se migliorasse chiaramente il vostro futuro insieme?','Würdest du ein vertrautes Umfeld verlassen, wenn es eure gemeinsame Zukunft deutlich verbessern würde?')
    ]
  },
  Entertainment: {
    easy:[
      q('What sounds like the most fun night out together?','¿Qué suena como la noche más divertida para salir juntos?','Quelle sortie à deux vous semble la plus amusante ?','Quale serata fuori insieme sembra più divertente?','Was klingt nach dem unterhaltsamsten gemeinsamen Abend?'),
      q('Which entertainment choice would you pick for an unexpected free evening?','¿Qué entretenimiento elegirías para una noche libre inesperada?','Quel divertissement choisiriez-vous pour une soirée libre imprévue ?','Quale intrattenimento sceglieresti per una serata libera inattesa?','Welche Unterhaltung würdest du für einen unerwartet freien Abend wählen?')
    ],
    real:[
      q('How much effort should you make to enjoy entertainment your partner loves?','¿Cuánto esfuerzo deberías hacer para disfrutar el entretenimiento que ama tu pareja?','Quel effort devriez-vous faire pour apprécier les divertissements que votre partenaire adore ?','Quanto impegno dovresti mettere nel provare l’intrattenimento che il partner ama?','Wie viel Mühe solltest du dir geben, Unterhaltung zu genießen, die dein Partner liebt?'),
      q("If you dislike your partner's favorite shows or games, how involved should you be?",'Si no te gustan los programas o juegos favoritos de tu pareja, ¿qué tan involucrado deberías estar?','Si vous n’aimez pas les séries ou jeux préférés de votre partenaire, à quel point devriez-vous participer ?','Se non ti piacciono gli show o i giochi preferiti del partner, quanto dovresti partecipare?','Wenn du die Lieblingsshows oder -spiele deines Partners nicht magst, wie sehr solltest du dich beteiligen?')
    ],
    deep:[
      q('Can a couple stay deeply connected if they rarely enjoy the same entertainment?','¿Puede una pareja mantenerse profundamente conectada si rara vez disfruta el mismo entretenimiento?','Un couple peut-il rester profondément connecté s’il apprécie rarement les mêmes divertissements ?','Può una coppia restare profondamente connessa se raramente ama lo stesso intrattenimento?','Kann ein Paar tief verbunden bleiben, wenn es selten dieselbe Unterhaltung mag?'),
      q('If your tastes are opposite, can quality time still feel natural?','Si sus gustos son opuestos, ¿puede el tiempo de calidad seguir sintiéndose natural?','Si vos goûts sont opposés, le temps de qualité peut-il rester naturel ?','Se i gusti sono opposti, il tempo di qualità può comunque sembrare naturale?','Wenn eure Geschmäcker gegensätzlich sind, kann gemeinsame Qualitätszeit trotzdem natürlich wirken?')
    ]
  },
  'Daily Preferences': {
    easy:[
      q('On a day off, what kind of morning feels best?','En un día libre, ¿qué tipo de mañana se siente mejor?','Lors d’un jour de repos, quel type de matinée vous convient le mieux ?','In un giorno libero, che tipo di mattina ti piace di più?','Welche Art Morgen fühlt sich an einem freien Tag am besten an?'),
      q('Which morning rhythm would you most enjoy sharing with a partner?','¿Qué ritmo de mañana disfrutarías más compartir con una pareja?','Quel rythme du matin aimeriez-vous le plus partager avec un partenaire ?','Quale ritmo mattutino ti piacerebbe condividere di più con un partner?','Welchen Morgenrhythmus würdest du am liebsten mit einem Partner teilen?')
    ],
    real:[
      q('How important is compatibility in cleanliness, sleep and daily habits?','¿Qué tan importante es la compatibilidad en limpieza, sueño y hábitos diarios?','À quel point la compatibilité en matière de propreté, sommeil et habitudes quotidiennes est-elle importante ?','Quanto è importante la compatibilità su pulizia, sonno e abitudini quotidiane?','Wie wichtig ist Übereinstimmung bei Sauberkeit, Schlaf und täglichen Gewohnheiten?'),
      q('How important are small routine differences when choosing a long-term partner?','¿Qué tan importantes son las pequeñas diferencias de rutina al elegir una pareja a largo plazo?','Quelle importance ont les petites différences de routine dans le choix d’un partenaire à long terme ?','Quanto contano le piccole differenze di routine nella scelta di un partner a lungo termine?','Wie wichtig sind kleine Routineunterschiede bei der Wahl eines langfristigen Partners?')
    ],
    deep:[
      q("If one person's everyday habits repeatedly annoy the other, how much change is reasonable?",'Si los hábitos diarios de uno molestan repetidamente al otro, ¿cuánto cambio es razonable?','Si les habitudes quotidiennes de l’un agacent constamment l’autre, quel changement est raisonnable ?','Se le abitudini quotidiane di uno infastidiscono continuamente l’altro, quanto cambiamento è ragionevole?','Wenn die Alltagsgewohnheiten eines Partners den anderen ständig stören, wie viel Veränderung ist angemessen?'),
      q('When daily routines keep causing conflict, how much should each person adjust?','Cuando las rutinas diarias siguen causando conflicto, ¿cuánto debería adaptarse cada persona?','Lorsque les routines quotidiennes provoquent toujours des conflits, jusqu’où chacun devrait-il s’adapter ?','Quando le routine quotidiane continuano a causare conflitti, quanto dovrebbe adattarsi ciascuno?','Wenn Alltagsroutinen immer wieder Konflikte verursachen, wie stark sollte sich jeder anpassen?')
    ]
  },
  'Wild Card': {
    easy:[
      q('A meeting gets canceled and you gain an hour. What do you naturally do?','Se cancela una reunión y ganas una hora. ¿Qué haces naturalmente?','Une réunion est annulée et vous gagnez une heure. Que faites-vous naturellement ?','Una riunione viene cancellata e guadagni un’ora. Cosa fai naturalmente?','Ein Termin fällt aus und du gewinnst eine Stunde. Was machst du ganz natürlich?'),
      q('You finish everything early today. How would you use the extra time?','Hoy terminas todo temprano. ¿Cómo usarías el tiempo extra?','Vous terminez tout plus tôt aujourd’hui. Comment utiliseriez-vous ce temps supplémentaire ?','Oggi finisci tutto in anticipo. Come useresti il tempo extra?','Du bist heute mit allem früh fertig. Wie würdest du die zusätzliche Zeit nutzen?')
    ],
    real:[
      q('In a relationship, do you prefer knowing what to expect or being surprised?','En una relación, ¿prefieres saber qué esperar o que te sorprendan?','Dans une relation, préférez-vous savoir à quoi vous attendre ou être surpris ?','In una relazione preferisci sapere cosa aspettarti o essere sorpreso?','Bevorzugst du in einer Beziehung zu wissen, was kommt, oder überrascht zu werden?'),
      q('How should stability and spontaneity balance in a strong relationship?','¿Cómo deberían equilibrarse la estabilidad y la espontaneidad en una relación sólida?','Comment stabilité et spontanéité devraient-elles s’équilibrer dans une relation solide ?','Come dovrebbero equilibrarsi stabilità e spontaneità in una relazione forte?','Wie sollten Stabilität und Spontaneität in einer starken Beziehung ausbalanciert sein?')
    ],
    deep:[
      q('What part of yourself would you most want to be accepted without having to explain it?','¿Qué parte de ti te gustaría que aceptaran sin tener que explicarla?','Quelle part de vous aimeriez-vous le plus voir acceptée sans devoir l’expliquer ?','Quale parte di te vorresti fosse accettata senza doverla spiegare?','Welcher Teil von dir sollte am liebsten akzeptiert werden, ohne dass du ihn erklären musst?'),
      q('What personal truth should a loving partner be able to hear without judging you?','¿Qué verdad personal debería poder escuchar una pareja amorosa sin juzgarte?','Quelle vérité personnelle un partenaire aimant devrait-il pouvoir entendre sans vous juger ?','Quale verità personale dovrebbe poter ascoltare un partner amorevole senza giudicarti?','Welche persönliche Wahrheit sollte ein liebevoller Partner hören können, ohne dich zu verurteilen?')
    ]
  }
};

export function getLikeMindedPrompt(baseQuestions,category,depth,variant=0,language='en'){
  const key=depth==='Easy'?'easy':depth==='Deep'?'deep':'real';
  const lang=['en','es','fr','it','de'].includes(language)?language:'en';
  if(Number(variant||0)<=0){
    return baseQuestions?.[category]?.[key]?.[lang] || baseQuestions?.[category]?.[key]?.en || '';
  }
  const row=LIKE_MINDED_EXTRA_QUESTIONS?.[category]?.[key]?.[Number(variant)-1];
  return row?.[lang] || row?.en || baseQuestions?.[category]?.[key]?.[lang] || baseQuestions?.[category]?.[key]?.en || '';
}
