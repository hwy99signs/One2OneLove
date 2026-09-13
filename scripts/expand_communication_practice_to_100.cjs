const fs = require('fs');

const scenarioPath = 'src/components/communication/CommunicationPracticeScenarios.js';
const pagePath = 'src/pages/CommunicationPractice.jsx';

let scenarios = fs.readFileSync(scenarioPath, 'utf8');
let page = fs.readFileSync(pagePath, 'utf8');

if (!scenarios.includes('export const communicationPracticeScenarios = {')) throw new Error('Scenario export anchor missing');
if (!page.includes('const [completedScenarios, setCompletedScenarios] = useState([]);')) throw new Error('Communication Practice state anchor missing');

const extension = `

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
      expanded[\`${id}_variant_\${index + 1}\`] = {
        title: \`\${scenario.title} — \${suffix}\`,
        situation: \`\${scenario.situation} \${localized.situations[index]}\`,
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
`;

scenarios = scenarios.replace('\nexport const communicationPracticeScenarios = {', extension + '\nexport const communicationPracticeScenarios = {');
for (const lang of ['en','es','fr','it']) {
  scenarios = scenarios.replace(`  ${lang}: buildScenarios('${lang}', ${lang}),`, `  ${lang}: expandScenarioBank('${lang}', buildScenarios('${lang}', ${lang})),`);
}
scenarios = scenarios.replace("  de: buildScenarios('de', de)", "  de: expandScenarioBank('de', buildScenarios('de', de))");

page = page.replace('import React, { useState } from "react";', 'import React, { useState, useMemo } from "react";');

const anchors = {
  en: '    completed: "Scenario Complete!",\n    scenario: "Scenario",\n    of: "of",',
  es: '    completed: "¡Escenario Completo!",\n    scenario: "Escenario",\n    of: "de"',
  fr: '    completed: "Scénario Terminé!",\n    scenario: "Scénario",\n    of: "de"',
  it: '    completed: "Scenario Completato!",\n    scenario: "Scenario",\n    of: "di"',
  de: '    completed: "Szenario Abgeschlossen!",\n    scenario: "Szenario",\n    of: "von"'
};
const labels = {
  en: ['roundComplete: "Round Complete!"','correctAnswers: "Correct Answers"','wrongAnswers: "Wrong Answers"','percentageScore: "Percentage Score"','newRound: "Try Again"'],
  es: ['roundComplete: "¡Ronda Completada!"','correctAnswers: "Respuestas Correctas"','wrongAnswers: "Respuestas Incorrectas"','percentageScore: "Puntuación Porcentual"','newRound: "Intentar de Nuevo"'],
  fr: ['roundComplete: "Tour Terminé !"','correctAnswers: "Bonnes Réponses"','wrongAnswers: "Mauvaises Réponses"','percentageScore: "Score en Pourcentage"','newRound: "Réessayer"'],
  it: ['roundComplete: "Turno Completato!"','correctAnswers: "Risposte Corrette"','wrongAnswers: "Risposte Sbagliate"','percentageScore: "Punteggio Percentuale"','newRound: "Riprova"'],
  de: ['roundComplete: "Runde Abgeschlossen!"','correctAnswers: "Richtige Antworten"','wrongAnswers: "Falsche Antworten"','percentageScore: "Prozentwert"','newRound: "Erneut Versuchen"']
};
for (const lang of Object.keys(anchors)) {
  const anchor = anchors[lang];
  if (!page.includes(anchor)) throw new Error(`Translation anchor missing for ${lang}`);
  const needsComma = !anchor.endsWith(',');
  page = page.replace(anchor, anchor + (needsComma ? ',' : '') + '\n' + labels[lang].map(x => '    ' + x).join(',\n'));
}

page = page.replace('export default function CommunicationPractice() {', `const ROUND_SIZE = 20;

const pickRoundIds = (allIds, previousIds = []) => {
  const previous = new Set(previousIds);
  const fresh = allIds.filter(id => !previous.has(id));
  const preferred = fresh.length >= ROUND_SIZE ? fresh : allIds;
  return [...preferred].sort(() => Math.random() - 0.5).slice(0, ROUND_SIZE);
};

export default function CommunicationPractice() {`);

const oldState = `  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState([]);

  const scenarioList = Object.keys(scenarios).map(key => ({
    id: key,
    ...scenarios[key]
  }));`;
const newState = `  const allScenarioIds = Object.keys(scenarios);
  const [roundScenarioIds, setRoundScenarioIds] = useState(() => pickRoundIds(allScenarioIds));
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState([]);
  const [roundResults, setRoundResults] = useState({});

  const scenarioList = useMemo(() => roundScenarioIds.map(key => ({
    id: key,
    ...scenarios[key],
    options: [...scenarios[key].options].sort(() => Math.random() - 0.5)
  })), [roundScenarioIds, scenarios]);

  const correctAnswers = Object.values(roundResults).filter(Boolean).length;
  const answeredCount = Object.keys(roundResults).length;
  const wrongAnswers = answeredCount - correctAnswers;
  const percentageScore = answeredCount ? Math.round((correctAnswers / answeredCount) * 100) : 0;
  const roundComplete = answeredCount === ROUND_SIZE;`;
if (!page.includes(oldState)) throw new Error('Existing scenario state block not found');
page = page.replace(oldState, newState);

const oldResponse = `  const handleResponseSelect = (option) => {
    setSelectedResponse(option);
    setShowFeedback(true);
    
    if (option.type === 'excellent' && !completedScenarios.includes(selectedScenario.id)) {
      setCompletedScenarios([...completedScenarios, selectedScenario.id]);
      toast.success(t.completed);
    }
  };`;
const newResponse = `  const handleResponseSelect = (option) => {
    setSelectedResponse(option);
    setShowFeedback(true);

    if (!(selectedScenario.id in roundResults)) {
      setRoundResults(prev => ({ ...prev, [selectedScenario.id]: option.type === 'excellent' }));
    }
    
    if (option.type === 'excellent' && !completedScenarios.includes(selectedScenario.id)) {
      setCompletedScenarios([...completedScenarios, selectedScenario.id]);
      toast.success(t.completed);
    }
  };`;
if (!page.includes(oldResponse)) throw new Error('Existing response handler not found');
page = page.replace(oldResponse, newResponse);

const oldNext = `  const handleNextScenario = () => {
    const currentIndex = scenarioList.findIndex(s => s.id === selectedScenario.id);
    const nextIndex = (currentIndex + 1) % scenarioList.length;
    handleScenarioSelect(scenarioList[nextIndex]);
  };`;
const newNext = `  const handleNextScenario = () => {
    const currentIndex = scenarioList.findIndex(s => s.id === selectedScenario.id);
    const unanswered = scenarioList.find((scenario, index) => index > currentIndex && !(scenario.id in roundResults))
      || scenarioList.find(scenario => !(scenario.id in roundResults));
    if (answeredCount >= ROUND_SIZE || !unanswered) {
      setSelectedScenario(null);
      setSelectedResponse(null);
      setShowFeedback(false);
      return;
    }
    handleScenarioSelect(unanswered);
  };`;
if (!page.includes(oldNext)) throw new Error('Existing next handler not found');
page = page.replace(oldNext, newNext);

const oldTry = `  const handleTryAgain = () => {
    setSelectedResponse(null);
    setShowFeedback(false);
  };`;
const newTry = `  const handleTryAgain = () => {
    setSelectedResponse(null);
    setShowFeedback(false);
  };

  const handleNewRound = () => {
    const previousRound = roundScenarioIds;
    setRoundScenarioIds(pickRoundIds(allScenarioIds, previousRound));
    setSelectedScenario(null);
    setSelectedResponse(null);
    setShowFeedback(false);
    setCompletedScenarios([]);
    setRoundResults({});
  };`;
if (!page.includes(oldTry)) throw new Error('Existing try-again handler not found');
page = page.replace(oldTry, newTry);

const returnAnchor = '  return (\n    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">';
const summaryElement = `  const roundSummary = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 text-center"
    >
      <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h3 className="text-3xl font-bold text-gray-900 mb-6">{t.roundComplete}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200">
          <div className="text-sm text-gray-600">{t.correctAnswers}</div>
          <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200">
          <div className="text-sm text-gray-600">{t.wrongAnswers}</div>
          <div className="text-3xl font-bold text-red-600">{wrongAnswers}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-200">
          <div className="text-sm text-gray-600">{t.percentageScore}</div>
          <div className="text-3xl font-bold text-purple-600">{percentageScore}%</div>
        </div>
      </div>
      <Button onClick={handleNewRound} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 px-8">
        <RotateCcw className="w-4 h-4 mr-2" />
        {t.newRound}
      </Button>
    </motion.div>
  );

`;
if (!page.includes(returnAnchor)) throw new Error('Return anchor missing');
page = page.replace(returnAnchor, summaryElement + returnAnchor);

if (!page.includes('        {!selectedScenario ? (')) throw new Error('Main scenario conditional missing');
page = page.replace('        {!selectedScenario ? (', '        {roundComplete && !selectedScenario ? roundSummary : !selectedScenario ? (');

const progressRegex = /\n        \{completedScenarios\.length > 0 && !selectedScenario && \([\s\S]*?\n        \)\}/;
if (!progressRegex.test(page)) throw new Error('Old progress summary block not found');
page = page.replace(progressRegex, '');

fs.writeFileSync(scenarioPath, scenarios);
fs.writeFileSync(pagePath, page);
console.log('Expanded Communication Practice to 100 scenarios with randomized 20-question rounds and end-of-round scoring.');
