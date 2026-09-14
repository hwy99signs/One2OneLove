const quizText = {
  en: {
    communication: {
      title: 'Communication Style Reflection',
      description: 'Reflect on how clearly, calmly and openly you communicate in a relationship.',
      questions: [
        'I say what I need instead of expecting my partner to guess.',
        'I can listen to a concern without immediately defending myself.',
        'I ask questions when I am unsure instead of assuming intent.',
        'I can express disappointment without insults, threats or silent punishment.',
        'I make room for my partner to finish speaking before I respond.',
        'I can admit when my words landed differently than I intended.',
        'I bring up important issues before resentment builds.',
        'I can ask for reassurance directly when I need it.'
      ],
      results: [
        { min: 13, title: 'Open & Intentional', body: 'Your answers suggest many healthy communication habits are already present. Keep protecting clarity, curiosity and respect.' },
        { min: 8, title: 'Developing Consistency', body: 'You show several strong habits, with some situations where stress may make communication harder. Focus on one repeat pattern at a time.' },
        { min: 0, title: 'Room to Strengthen', body: 'Your answers point to useful opportunities for growth. Start with slowing down, naming needs clearly, and listening before defending.' }
      ]
    },
    conflict: {
      title: 'Conflict & Repair Reflection',
      description: 'Look at what happens when tension rises and how you reconnect afterward.',
      questions: [
        'I can take a pause without using distance as punishment.',
        'After cooling down, I return to the conversation instead of avoiding it.',
        'I can apologize for my behavior without adding a “but.”',
        'I try to understand the impact of what happened, not only my intention.',
        'I avoid bringing unrelated old arguments into a new disagreement.',
        'I can accept influence from my partner when they make a fair point.',
        'We can end a disagreement without needing one person to “win.”',
        'I make an effort to reconnect after conflict rather than acting as if nothing happened.'
      ],
      results: [
        { min: 13, title: 'Strong Repair Habits', body: 'You appear to use several habits that help conflict become repair instead of lasting distance.' },
        { min: 8, title: 'Repair Is Possible, but Uneven', body: 'You have useful repair skills, though certain conflicts may still pull you into old patterns. Notice the moments where repair usually breaks down.' },
        { min: 0, title: 'Build a Repair Plan', body: 'Conflict may currently leave more distance than resolution. A simple plan—pause, return, listen, own impact, reconnect—can help create a new pattern.' }
      ]
    },
    relationship: {
      title: 'Relationship Health Reflection',
      description: 'A non-diagnostic look at everyday patterns of respect, trust, connection and teamwork.',
      questions: [
        'I feel safe expressing an opinion my partner may not share.',
        'We can talk about expectations without fear of ridicule or retaliation.',
        'Affection and appreciation are present outside of special occasions.',
        'We respect each other’s friendships, privacy and reasonable independence.',
        'Important promises are generally followed by consistent behavior.',
        'We can discuss money, time and responsibilities without avoiding the subject completely.',
        'Both people are allowed to have needs and boundaries.',
        'We can enjoy each other as friends, not only as partners solving problems.',
        'When one person hurts the other, repair matters more than being right.',
        'I can picture growth in this relationship without losing myself.'
      ],
      results: [
        { min: 16, title: 'Many Healthy Foundations', body: 'Your answers suggest several protective relationship habits: respect, communication, trust and room for individuality.' },
        { min: 10, title: 'Mixed but Workable Patterns', body: 'There are meaningful strengths along with areas that deserve more attention. Choose one recurring issue and talk about what “better” would look like together.' },
        { min: 0, title: 'Important Areas Need Attention', body: 'Several core relationship needs may feel inconsistent right now. Focus on safety, respect, boundaries and communication before trying to solve everything at once.' }
      ]
    }
  },
  es: {
    communication: {
      title: 'Reflexión sobre el Estilo de Comunicación', description: 'Reflexiona sobre qué tan clara, calmada y abierta es tu comunicación en una relación.',
      questions: ['Digo lo que necesito en vez de esperar que mi pareja lo adivine.','Puedo escuchar una preocupación sin ponerme a la defensiva de inmediato.','Hago preguntas cuando no estoy seguro en vez de asumir intenciones.','Puedo expresar decepción sin insultos, amenazas ni silencio como castigo.','Dejo que mi pareja termine de hablar antes de responder.','Puedo admitir cuando mis palabras tuvieron un impacto distinto al que pretendía.','Hablo de asuntos importantes antes de que crezca el resentimiento.','Puedo pedir tranquilidad o reafirmación directamente cuando la necesito.'],
      results: [{min:13,title:'Abierta e Intencional',body:'Tus respuestas muestran muchos hábitos saludables de comunicación. Sigue protegiendo la claridad, la curiosidad y el respeto.'},{min:8,title:'Desarrollando Consistencia',body:'Tienes varios hábitos fuertes, aunque el estrés puede dificultar la comunicación en algunas situaciones. Trabaja un patrón repetido a la vez.'},{min:0,title:'Espacio para Fortalecer',body:'Hay oportunidades útiles de crecimiento. Empieza por bajar el ritmo, expresar necesidades con claridad y escuchar antes de defenderte.'}]
    },
    conflict: {
      title: 'Reflexión sobre Conflicto y Reparación', description: 'Observa qué ocurre cuando aumenta la tensión y cómo vuelven a conectarse después.',
      questions: ['Puedo tomar una pausa sin usar la distancia como castigo.','Después de calmarme, regreso a la conversación en lugar de evitarla.','Puedo disculparme por mi conducta sin añadir un “pero”.','Intento entender el impacto de lo ocurrido, no solo mi intención.','Evito traer discusiones antiguas que no tienen relación con el problema actual.','Puedo aceptar la influencia de mi pareja cuando hace un punto justo.','Podemos terminar un desacuerdo sin que alguien tenga que “ganar”.','Hago un esfuerzo por reconectar después del conflicto en vez de actuar como si nada hubiera pasado.'],
      results: [{min:13,title:'Hábitos Fuertes de Reparación',body:'Tus respuestas muestran varias prácticas que ayudan a convertir el conflicto en reparación y no en distancia duradera.'},{min:8,title:'La Reparación Existe, pero es Irregular',body:'Tienes habilidades útiles, aunque ciertos conflictos pueden llevarlos a patrones antiguos. Observa dónde suele romperse la reparación.'},{min:0,title:'Construyan un Plan de Reparación',body:'El conflicto puede estar dejando más distancia que solución. Una secuencia simple—pausa, regreso, escucha, responsabilidad y reconexión—puede ayudar.'}]
    },
    relationship: {
      title: 'Reflexión sobre la Salud de la Relación', description: 'Una mirada no diagnóstica a patrones cotidianos de respeto, confianza, conexión y trabajo en equipo.',
      questions: ['Me siento seguro expresando una opinión que mi pareja quizá no comparta.','Podemos hablar de expectativas sin miedo al ridículo o a represalias.','El afecto y el agradecimiento existen fuera de ocasiones especiales.','Respetamos las amistades, la privacidad y una independencia razonable.','Las promesas importantes suelen ir acompañadas de conducta consistente.','Podemos hablar de dinero, tiempo y responsabilidades sin evitar totalmente el tema.','Ambas personas pueden tener necesidades y límites.','Podemos disfrutar como amigos, no solo como pareja resolviendo problemas.','Cuando uno hiere al otro, reparar importa más que tener razón.','Puedo imaginar crecimiento en esta relación sin perderme a mí mismo.'],
      results: [{min:16,title:'Muchas Bases Saludables',body:'Tus respuestas sugieren varios hábitos protectores: respeto, comunicación, confianza y espacio para la individualidad.'},{min:10,title:'Patrones Mixtos pero Trabajables',body:'Hay fortalezas importantes y áreas que necesitan atención. Elijan un problema recurrente y definan juntos cómo se vería una mejora.'},{min:0,title:'Hay Áreas Importantes que Atender',body:'Varias necesidades centrales pueden sentirse inconsistentes. Prioriza seguridad, respeto, límites y comunicación antes de intentar resolverlo todo.'}]
    }
  },
  fr: {
    communication: {
      title:'Réflexion sur le Style de Communication', description:'Réfléchissez à la clarté, au calme et à l’ouverture de votre communication relationnelle.',
      questions:['J’exprime mes besoins au lieu d’attendre que mon partenaire les devine.','Je peux écouter une préoccupation sans me défendre immédiatement.','Je pose des questions quand je ne suis pas sûr au lieu de supposer les intentions.','Je peux exprimer une déception sans insultes, menaces ni silence punitif.','Je laisse mon partenaire finir de parler avant de répondre.','Je peux reconnaître que mes mots ont eu un effet différent de mon intention.','J’aborde les sujets importants avant que le ressentiment s’installe.','Je peux demander directement du réconfort quand j’en ai besoin.'],
      results:[{min:13,title:'Ouverte et Intentionnelle',body:'Vos réponses montrent de nombreuses habitudes de communication saines. Continuez à protéger la clarté, la curiosité et le respect.'},{min:8,title:'Une Cohérence en Développement',body:'Plusieurs habitudes sont solides, mais le stress peut rendre certaines conversations plus difficiles. Travaillez un schéma récurrent à la fois.'},{min:0,title:'Des Points à Renforcer',body:'Il existe des possibilités de croissance. Commencez par ralentir, nommer clairement vos besoins et écouter avant de vous défendre.'}]
    },
    conflict: {
      title:'Réflexion sur le Conflit et la Réparation', description:'Observez ce qui se passe quand la tension monte et comment vous vous reconnectez ensuite.',
      questions:['Je peux faire une pause sans utiliser la distance comme punition.','Après m’être calmé, je reviens à la conversation au lieu de l’éviter.','Je peux m’excuser pour mon comportement sans ajouter « mais ».','J’essaie de comprendre l’impact de ce qui s’est passé, pas seulement mon intention.','J’évite de ramener d’anciens conflits sans lien avec le désaccord actuel.','Je peux reconnaître un point juste de mon partenaire.','Nous pouvons terminer un désaccord sans qu’une personne doive « gagner ».','Je fais un effort pour nous reconnecter après le conflit plutôt que d’agir comme si rien ne s’était passé.'],
      results:[{min:13,title:'De Solides Habitudes de Réparation',body:'Vos réponses montrent plusieurs habitudes qui transforment le conflit en réparation plutôt qu’en distance durable.'},{min:8,title:'Une Réparation Possible mais Irrégulière',body:'Vous avez des compétences utiles, mais certains conflits peuvent réactiver d’anciens schémas. Observez où la réparation se bloque.'},{min:0,title:'Construisez un Plan de Réparation',body:'Le conflit peut laisser plus de distance que de résolution. Une séquence simple—pause, retour, écoute, responsabilité, reconnexion—peut aider.'}]
    },
    relationship: {
      title:'Réflexion sur la Santé de la Relation', description:'Un regard non diagnostique sur le respect, la confiance, la connexion et le travail d’équipe au quotidien.',
      questions:['Je me sens en sécurité pour exprimer une opinion différente.','Nous pouvons parler des attentes sans peur du ridicule ou de représailles.','L’affection et la gratitude existent en dehors des occasions spéciales.','Nous respectons les amitiés, la vie privée et une indépendance raisonnable.','Les promesses importantes sont généralement suivies d’actions cohérentes.','Nous pouvons parler d’argent, de temps et de responsabilités sans tout éviter.','Les deux personnes ont le droit d’avoir des besoins et des limites.','Nous pouvons nous apprécier comme amis, pas seulement comme partenaires qui résolvent des problèmes.','Quand l’un blesse l’autre, réparer compte plus qu’avoir raison.','Je peux imaginer grandir dans cette relation sans me perdre.'],
      results:[{min:16,title:'De Nombreuses Bases Saines',body:'Vos réponses suggèrent plusieurs habitudes protectrices : respect, communication, confiance et place pour l’individualité.'},{min:10,title:'Des Schémas Mixtes mais Travaillables',body:'Il existe de vraies forces et des points qui méritent de l’attention. Choisissez un problème récurrent et définissez ensemble ce que serait une amélioration.'},{min:0,title:'Des Domaines Importants à Travailler',body:'Plusieurs besoins fondamentaux peuvent être irréguliers. Priorisez la sécurité, le respect, les limites et la communication avant de tout résoudre.'}]
    }
  },
  it: {
    communication: {
      title:'Riflessione sullo Stile di Comunicazione', description:'Rifletti su quanto comunichi in modo chiaro, calmo e aperto nella relazione.',
      questions:['Dico ciò di cui ho bisogno invece di aspettare che il partner lo indovini.','Posso ascoltare una preoccupazione senza difendermi subito.','Faccio domande quando non sono sicuro invece di presumere le intenzioni.','Posso esprimere delusione senza insulti, minacce o silenzio punitivo.','Lascio finire il partner prima di rispondere.','Posso ammettere quando le mie parole hanno avuto un effetto diverso da quello che intendevo.','Affronto i temi importanti prima che cresca il risentimento.','Posso chiedere rassicurazione direttamente quando ne ho bisogno.'],
      results:[{min:13,title:'Aperta e Intenzionale',body:'Le tue risposte mostrano molte abitudini sane. Continua a proteggere chiarezza, curiosità e rispetto.'},{min:8,title:'Coerenza in Crescita',body:'Hai diverse buone abitudini, ma lo stress può rendere alcune conversazioni più difficili. Lavora su un modello ricorrente alla volta.'},{min:0,title:'Spazio per Rafforzarsi',body:'Ci sono opportunità utili di crescita. Inizia rallentando, esprimendo bisogni chiari e ascoltando prima di difenderti.'}]
    },
    conflict: {
      title:'Riflessione su Conflitto e Riparazione', description:'Osserva cosa succede quando sale la tensione e come vi riconnettete dopo.',
      questions:['Posso fare una pausa senza usare la distanza come punizione.','Dopo essermi calmato, torno alla conversazione invece di evitarla.','Posso chiedere scusa per il mio comportamento senza aggiungere “ma”.','Cerco di capire l’impatto di ciò che è successo, non solo la mia intenzione.','Evito di portare vecchi litigi non collegati al problema attuale.','Posso accettare l’influenza del partner quando fa un’osservazione giusta.','Possiamo chiudere un disaccordo senza che qualcuno debba “vincere”.','Cerco di riconnettermi dopo il conflitto invece di fingere che non sia successo nulla.'],
      results:[{min:13,title:'Forti Abitudini di Riparazione',body:'Le tue risposte mostrano abitudini che aiutano a trasformare il conflitto in riparazione e non in distanza.'},{min:8,title:'Riparazione Possibile ma Irregolare',body:'Hai capacità utili, anche se certi conflitti possono riattivare vecchi schemi. Nota dove la riparazione tende a interrompersi.'},{min:0,title:'Costruite un Piano di Riparazione',body:'Il conflitto può lasciare più distanza che soluzione. Una sequenza semplice—pausa, ritorno, ascolto, responsabilità e riconnessione—può aiutare.'}]
    },
    relationship: {
      title:'Riflessione sulla Salute della Relazione', description:'Uno sguardo non diagnostico a rispetto, fiducia, connessione e collaborazione quotidiana.',
      questions:['Mi sento al sicuro nell’esprimere un’opinione diversa.','Possiamo parlare delle aspettative senza paura di ridicolo o ritorsioni.','Affetto e apprezzamento esistono anche fuori dalle occasioni speciali.','Rispettiamo amicizie, privacy e una ragionevole indipendenza.','Le promesse importanti sono generalmente seguite da comportamenti coerenti.','Possiamo parlare di denaro, tempo e responsabilità senza evitare completamente l’argomento.','Entrambe le persone possono avere bisogni e confini.','Possiamo goderci l’amicizia, non solo risolvere problemi come coppia.','Quando uno ferisce l’altro, riparare conta più che avere ragione.','Posso immaginare una crescita in questa relazione senza perdere me stesso.'],
      results:[{min:16,title:'Molte Basi Sane',body:'Le tue risposte suggeriscono diverse abitudini protettive: rispetto, comunicazione, fiducia e spazio per l’individualità.'},{min:10,title:'Schemi Misti ma Lavorabili',body:'Ci sono punti di forza e aree che meritano attenzione. Scegliete un problema ricorrente e definite insieme come sarebbe un miglioramento.'},{min:0,title:'Aree Importanti da Affrontare',body:'Alcuni bisogni fondamentali possono essere incoerenti. Dai priorità a sicurezza, rispetto, confini e comunicazione prima di risolvere tutto.'}]
    }
  },
  de: {
    communication: {
      title:'Reflexion über den Kommunikationsstil', description:'Reflektiere, wie klar, ruhig und offen du in einer Beziehung kommunizierst.',
      questions:['Ich sage, was ich brauche, statt zu erwarten, dass mein Partner es errät.','Ich kann eine Sorge anhören, ohne mich sofort zu verteidigen.','Ich frage nach, wenn ich unsicher bin, statt Absichten anzunehmen.','Ich kann Enttäuschung ohne Beleidigungen, Drohungen oder strafendes Schweigen ausdrücken.','Ich lasse meinen Partner ausreden, bevor ich antworte.','Ich kann anerkennen, wenn meine Worte anders wirkten als beabsichtigt.','Ich spreche wichtige Themen an, bevor Groll entsteht.','Ich kann direkt um Bestätigung oder Beruhigung bitten, wenn ich sie brauche.'],
      results:[{min:13,title:'Offen und Bewusst',body:'Deine Antworten zeigen viele gesunde Kommunikationsgewohnheiten. Schütze weiterhin Klarheit, Neugier und Respekt.'},{min:8,title:'Wachsende Beständigkeit',body:'Mehrere Gewohnheiten sind stark, aber Stress kann manche Gespräche erschweren. Arbeite jeweils an einem wiederkehrenden Muster.'},{min:0,title:'Raum zur Stärkung',body:'Es gibt sinnvolle Wachstumschancen. Beginne damit, langsamer zu werden, Bedürfnisse klar zu benennen und vor dem Verteidigen zuzuhören.'}]
    },
    conflict: {
      title:'Reflexion über Konflikt und Reparatur', description:'Schau darauf, was bei steigender Spannung passiert und wie ihr danach wieder Verbindung herstellt.',
      questions:['Ich kann eine Pause machen, ohne Distanz als Strafe zu benutzen.','Nach dem Beruhigen kehre ich zum Gespräch zurück, statt es zu vermeiden.','Ich kann mich für mein Verhalten entschuldigen, ohne ein „aber“ anzuhängen.','Ich versuche die Wirkung zu verstehen, nicht nur meine Absicht.','Ich bringe keine alten, unverbundenen Streitpunkte in einen neuen Konflikt.','Ich kann den Einfluss meines Partners annehmen, wenn ein Punkt fair ist.','Wir können einen Streit beenden, ohne dass jemand „gewinnen“ muss.','Ich bemühe mich nach einem Konflikt um Wiederverbindung, statt so zu tun, als wäre nichts passiert.'],
      results:[{min:13,title:'Starke Reparaturgewohnheiten',body:'Deine Antworten zeigen Gewohnheiten, die Konflikte eher in Reparatur als in dauerhafte Distanz verwandeln.'},{min:8,title:'Reparatur Möglich, aber Uneinheitlich',body:'Du hast hilfreiche Fähigkeiten, doch bestimmte Konflikte können alte Muster aktivieren. Beobachte, wo Reparatur typischerweise abbricht.'},{min:0,title:'Erstellt einen Reparaturplan',body:'Konflikte können derzeit mehr Distanz als Lösung hinterlassen. Eine einfache Abfolge—Pause, Rückkehr, Zuhören, Verantwortung, Wiederverbindung—kann helfen.'}]
    },
    relationship: {
      title:'Reflexion über Beziehungsgesundheit', description:'Ein nicht-diagnostischer Blick auf Respekt, Vertrauen, Verbindung und Teamarbeit im Alltag.',
      questions:['Ich fühle mich sicher, eine abweichende Meinung zu äußern.','Wir können über Erwartungen sprechen, ohne Angst vor Spott oder Vergeltung.','Zuneigung und Wertschätzung gibt es auch außerhalb besonderer Anlässe.','Wir respektieren Freundschaften, Privatsphäre und angemessene Unabhängigkeit.','Wichtige Versprechen werden meist durch konsequentes Verhalten begleitet.','Wir können über Geld, Zeit und Verantwortlichkeiten sprechen, ohne das Thema völlig zu vermeiden.','Beide dürfen Bedürfnisse und Grenzen haben.','Wir können uns als Freunde genießen und nicht nur Probleme lösen.','Wenn einer den anderen verletzt, ist Reparatur wichtiger als Recht zu haben.','Ich kann mir Wachstum in dieser Beziehung vorstellen, ohne mich selbst zu verlieren.'],
      results:[{min:16,title:'Viele Gesunde Grundlagen',body:'Deine Antworten deuten auf mehrere schützende Gewohnheiten hin: Respekt, Kommunikation, Vertrauen und Raum für Individualität.'},{min:10,title:'Gemischte, aber Bearbeitbare Muster',body:'Es gibt echte Stärken und Bereiche mit Aufmerksamkeitspotenzial. Wählt ein wiederkehrendes Thema und beschreibt gemeinsam, wie Verbesserung aussehen würde.'},{min:0,title:'Wichtige Bereiche Brauchen Aufmerksamkeit',body:'Mehrere Grundbedürfnisse können derzeit unbeständig sein. Priorisiere Sicherheit, Respekt, Grenzen und Kommunikation, bevor ihr alles gleichzeitig lösen wollt.'}]
    }
  }
};

export const relationshipQuizLibrary = quizText;
