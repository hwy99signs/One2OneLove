import React, { useMemo, useState } from "react";
import { X, Heart, EyeOff, Puzzle, Users, RotateCcw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const COPY = {
  en: {
    close: "Close", back: "Back", reset: "Reset", start: "Start", next: "Next", done: "Done",
    hiddenTitle: "Hidden Message", hiddenDesc: "Hide a short love message inside a paragraph for your partner to discover.",
    creator: "Your name", partner: "Partner name", message: "Secret message", difficulty: "Difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", create: "Create Message", find: "Find the hidden message",
    findHelp: "Tap the hidden words in the correct order.", wrong: "Wrong selections", found: "You found it!",
    quizTitle: "Love Quiz", quizDesc: "Take turns answering relationship questions and compare your answers together.",
    player1: "Player 1", player2: "Player 2", answer: "Your answer", compare: "Compare Answers", question: "Question",
    puzzleTitle: "Photo Puzzle", puzzleDesc: "Turn a favorite photo into a puzzle you can solve together.",
    upload: "Choose Photo", pieces: "Puzzle size", shuffle: "Shuffle", puzzleHelp: "Tap two tiles to swap them.", solved: "Puzzle solved!"
  },
  es: {
    close: "Cerrar", back: "Atrás", reset: "Reiniciar", start: "Comenzar", next: "Siguiente", done: "Listo",
    hiddenTitle: "Mensaje Oculto", hiddenDesc: "Oculta un mensaje de amor corto dentro de un párrafo para que tu pareja lo descubra.",
    creator: "Tu nombre", partner: "Nombre de tu pareja", message: "Mensaje secreto", difficulty: "Dificultad",
    easy: "Fácil", medium: "Medio", hard: "Difícil", create: "Crear Mensaje", find: "Encuentra el mensaje oculto",
    findHelp: "Toca las palabras ocultas en el orden correcto.", wrong: "Selecciones incorrectas", found: "¡Lo encontraste!",
    quizTitle: "Quiz de Amor", quizDesc: "Tomen turnos para responder preguntas de relación y comparen sus respuestas.",
    player1: "Jugador 1", player2: "Jugador 2", answer: "Tu respuesta", compare: "Comparar Respuestas", question: "Pregunta",
    puzzleTitle: "Rompecabezas de Foto", puzzleDesc: "Convierte una foto favorita en un rompecabezas para resolver juntos.",
    upload: "Elegir Foto", pieces: "Tamaño", shuffle: "Mezclar", puzzleHelp: "Toca dos piezas para intercambiarlas.", solved: "¡Rompecabezas resuelto!"
  },
  fr: {
    close: "Fermer", back: "Retour", reset: "Réinitialiser", start: "Commencer", next: "Suivant", done: "Terminé",
    hiddenTitle: "Message Caché", hiddenDesc: "Cachez un petit message d'amour dans un paragraphe pour que votre partenaire le découvre.",
    creator: "Votre nom", partner: "Nom du partenaire", message: "Message secret", difficulty: "Difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", create: "Créer le Message", find: "Trouvez le message caché",
    findHelp: "Touchez les mots cachés dans le bon ordre.", wrong: "Sélections incorrectes", found: "Vous l'avez trouvé !",
    quizTitle: "Quiz d'Amour", quizDesc: "Répondez à tour de rôle aux questions et comparez vos réponses ensemble.",
    player1: "Joueur 1", player2: "Joueur 2", answer: "Votre réponse", compare: "Comparer les Réponses", question: "Question",
    puzzleTitle: "Puzzle Photo", puzzleDesc: "Transformez une photo favorite en puzzle à résoudre ensemble.",
    upload: "Choisir une Photo", pieces: "Taille du puzzle", shuffle: "Mélanger", puzzleHelp: "Touchez deux pièces pour les échanger.", solved: "Puzzle terminé !"
  },
  it: {
    close: "Chiudi", back: "Indietro", reset: "Reimposta", start: "Inizia", next: "Avanti", done: "Fatto",
    hiddenTitle: "Messaggio Nascosto", hiddenDesc: "Nascondi un breve messaggio d'amore in un paragrafo perché il partner lo scopra.",
    creator: "Il tuo nome", partner: "Nome del partner", message: "Messaggio segreto", difficulty: "Difficoltà",
    easy: "Facile", medium: "Media", hard: "Difficile", create: "Crea Messaggio", find: "Trova il messaggio nascosto",
    findHelp: "Tocca le parole nascoste nell'ordine corretto.", wrong: "Scelte errate", found: "L'hai trovato!",
    quizTitle: "Quiz d'Amore", quizDesc: "Rispondete a turno alle domande sulla relazione e confrontate le risposte.",
    player1: "Giocatore 1", player2: "Giocatore 2", answer: "La tua risposta", compare: "Confronta Risposte", question: "Domanda",
    puzzleTitle: "Puzzle Fotografico", puzzleDesc: "Trasforma una foto preferita in un puzzle da risolvere insieme.",
    upload: "Scegli Foto", pieces: "Dimensione puzzle", shuffle: "Mescola", puzzleHelp: "Tocca due tessere per scambiarle.", solved: "Puzzle completato!"
  },
  de: {
    close: "Schließen", back: "Zurück", reset: "Zurücksetzen", start: "Start", next: "Weiter", done: "Fertig",
    hiddenTitle: "Versteckte Nachricht", hiddenDesc: "Verstecke eine kurze Liebesnachricht in einem Absatz, die dein Partner entdecken kann.",
    creator: "Dein Name", partner: "Name des Partners", message: "Geheime Nachricht", difficulty: "Schwierigkeit",
    easy: "Leicht", medium: "Mittel", hard: "Schwer", create: "Nachricht Erstellen", find: "Finde die versteckte Nachricht",
    findHelp: "Tippe die versteckten Wörter in der richtigen Reihenfolge an.", wrong: "Falsche Auswahl", found: "Gefunden!",
    quizTitle: "Liebes-Quiz", quizDesc: "Beantwortet abwechselnd Beziehungsfragen und vergleicht eure Antworten.",
    player1: "Spieler 1", player2: "Spieler 2", answer: "Deine Antwort", compare: "Antworten Vergleichen", question: "Frage",
    puzzleTitle: "Foto-Puzzle", puzzleDesc: "Verwandle ein Lieblingsfoto in ein Puzzle, das ihr gemeinsam lösen könnt.",
    upload: "Foto Auswählen", pieces: "Puzzlegröße", shuffle: "Mischen", puzzleHelp: "Tippe zwei Teile an, um sie zu tauschen.", solved: "Puzzle gelöst!"
  }
};

const PARAGRAPHS = {
  en: "The morning light moved softly across the room while music played and coffee warmed the table. Small moments can become lasting memories when two people slow down, listen, laugh, and choose kindness together.",
  es: "La luz de la mañana entraba suavemente en la habitación mientras sonaba música y el café calentaba la mesa. Los pequeños momentos pueden convertirse en recuerdos duraderos cuando dos personas escuchan, ríen y eligen la bondad juntas.",
  fr: "La lumière du matin traversait doucement la pièce pendant que la musique jouait et que le café réchauffait la table. Les petits moments deviennent des souvenirs durables lorsque deux personnes écoutent, rient et choisissent la gentillesse ensemble.",
  it: "La luce del mattino attraversava dolcemente la stanza mentre suonava la musica e il caffè scaldava il tavolo. I piccoli momenti diventano ricordi duraturi quando due persone ascoltano, ridono e scelgono la gentilezza insieme.",
  de: "Das Morgenlicht fiel sanft in den Raum, während Musik spielte und Kaffee auf dem Tisch stand. Kleine Momente werden zu bleibenden Erinnerungen, wenn zwei Menschen zuhören, lachen und gemeinsam Freundlichkeit wählen."
};

const QUIZ_QUESTIONS = {
  en: ["What makes you feel most appreciated?", "What is one memory you never want to forget?", "What helps you feel heard during a disagreement?", "What would your ideal day together look like?", "What is one thing you want us to do more often?"],
  es: ["¿Qué te hace sentir más valorado?", "¿Qué recuerdo nunca quieres olvidar?", "¿Qué te ayuda a sentirte escuchado durante un desacuerdo?", "¿Cómo sería un día ideal juntos?", "¿Qué cosa quieres que hagamos con más frecuencia?"],
  fr: ["Qu'est-ce qui vous fait vous sentir le plus apprécié ?", "Quel souvenir ne voulez-vous jamais oublier ?", "Qu'est-ce qui vous aide à vous sentir écouté pendant un désaccord ?", "À quoi ressemblerait votre journée idéale ensemble ?", "Qu'aimeriez-vous faire plus souvent ensemble ?"],
  it: ["Cosa ti fa sentire più apprezzato?", "Qual è un ricordo che non vuoi mai dimenticare?", "Cosa ti aiuta a sentirti ascoltato durante un disaccordo?", "Come sarebbe la vostra giornata ideale insieme?", "Qual è una cosa che vorresti fare più spesso insieme?"],
  de: ["Wodurch fühlst du dich am meisten wertgeschätzt?", "Welche Erinnerung möchtest du nie vergessen?", "Was hilft dir, dich bei einer Meinungsverschiedenheit gehört zu fühlen?", "Wie sähe euer idealer gemeinsamer Tag aus?", "Was möchtest du häufiger gemeinsam tun?"]
};

function Modal({ children, onClose }) {
  return <div className="fixed inset-0 z-[100] bg-black/55 p-4 flex items-center justify-center"><div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"><button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 shadow hover:bg-gray-100" aria-label="Close"><X className="w-5 h-5" /></button>{children}</div></div>;
}

function Field({ label, value, onChange, placeholder, textarea=false }) {
  const C = textarea ? "textarea" : "input";
  return <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-2">{label}</span><C value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder || label} rows={textarea ? 3 : undefined} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400" /></label>;
}

export function HiddenMessageGame({ lang="en", onClose }) {
  const t = COPY[lang] || COPY.en;
  const [phase,setPhase]=useState("create");
  const [creator,setCreator]=useState("");
  const [partner,setPartner]=useState("");
  const [message,setMessage]=useState("");
  const [difficulty,setDifficulty]=useState("easy");
  const [words,setWords]=useState([]);
  const [target,setTarget]=useState([]);
  const [selected,setSelected]=useState([]);
  const [wrong,setWrong]=useState(0);
  const [complete,setComplete]=useState(false);
  const maxWrong={easy:3,medium:2,hard:1}[difficulty];

  const createGame=()=>{
    const secret=message.trim().split(/\s+/).filter(Boolean);
    if(!secret.length) return;
    const base=(PARAGRAPHS[lang]||PARAGRAPHS.en).split(/\s+/);
    const mixed=[...base];
    const slots=[];
    secret.forEach((w,i)=>{
      const min=Math.min(mixed.length, Math.floor(((i+1)/(secret.length+1))*mixed.length));
      mixed.splice(min+i,0,w);
      slots.push(min+i);
    });
    setWords(mixed.map((word,index)=>({word,index,isSecret:slots.includes(index)})));
    setTarget(secret.map(w=>w.replace(/[.,!?;:]/g,"").toLowerCase()));
    setSelected([]); setWrong(0); setComplete(false); setPhase("play");
  };

  const pick=(item)=>{
    if(complete) return;
    const clean=item.word.replace(/[.,!?;:]/g,"").toLowerCase();
    const expected=target[selected.length];
    if(clean===expected && item.isSecret){
      const next=[...selected,item.index]; setSelected(next); setWrong(0);
      if(next.length===target.length) setComplete(true);
    } else {
      const n=wrong+1;
      if(n>=maxWrong){ setSelected([]); setWrong(0); } else setWrong(n);
    }
  };

  return <Modal onClose={onClose}><div className="p-7 md:p-10 bg-gradient-to-br from-pink-50 to-purple-50 min-h-[560px]">
    <div className="text-center mb-8"><EyeOff className="w-12 h-12 mx-auto text-pink-600 mb-3"/><h2 className="text-3xl font-bold">{t.hiddenTitle}</h2><p className="text-gray-600 mt-2">{t.hiddenDesc}</p></div>
    {phase==="create" ? <div className="max-w-xl mx-auto space-y-5">
      <Field label={t.creator} value={creator} onChange={setCreator}/><Field label={t.partner} value={partner} onChange={setPartner}/><Field label={t.message} value={message} onChange={setMessage} textarea/>
      <label className="block"><span className="block text-sm font-semibold text-gray-700 mb-2">{t.difficulty}</span><select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-3"><option value="easy">{t.easy}</option><option value="medium">{t.medium}</option><option value="hard">{t.hard}</option></select></label>
      <Button onClick={createGame} disabled={!message.trim()} className="w-full bg-pink-600 hover:bg-pink-700">{t.create}</Button>
    </div> : <div className="max-w-3xl mx-auto">
      <div className="text-center mb-5"><h3 className="text-xl font-bold">{t.find}</h3><p className="text-gray-600">{t.findHelp}</p>{partner && <p className="mt-1 text-sm text-pink-700">{partner}</p>}</div>
      <div className="rounded-2xl bg-white p-6 shadow-sm leading-9 text-lg">{words.map(item=><button key={item.index} onClick={()=>pick(item)} className={`mr-1 px-1 rounded transition ${selected.includes(item.index)?"bg-pink-200 text-pink-900 font-bold":"hover:bg-yellow-100"}`}>{item.word}</button>)}</div>
      <div className="mt-4 flex items-center justify-between text-sm"><span>{t.wrong}: {wrong}/{maxWrong}</span><button onClick={()=>{setSelected([]);setWrong(0);setComplete(false)}} className="inline-flex items-center gap-1 text-gray-600"><RotateCcw className="w-4 h-4"/>{t.reset}</button></div>
      {complete && <div className="mt-5 rounded-2xl bg-green-100 p-5 text-center text-green-800 font-bold text-xl">{t.found}<div className="mt-2 text-2xl text-pink-700">“{message}”</div>{creator && <div className="text-sm mt-2 font-normal">— {creator}</div>}</div>}
    </div>}
  </div></Modal>;
}

export function LoveQuizGame({ lang="en", onClose }) {
  const t=COPY[lang]||COPY.en;
  const qs=QUIZ_QUESTIONS[lang]||QUIZ_QUESTIONS.en;
  const [phase,setPhase]=useState("setup");
  const [p1,setP1]=useState(""); const [p2,setP2]=useState("");
  const [qIndex,setQIndex]=useState(0); const [turn,setTurn]=useState(0); const [answer,setAnswer]=useState("");
  const [answers,setAnswers]=useState(qs.map(()=>["",""]));
  const submit=()=>{
    if(!answer.trim()) return;
    const next=answers.map((a,i)=>i===qIndex ? a.map((v,j)=>j===turn?answer.trim():v) : a); setAnswers(next); setAnswer("");
    if(turn===0){setTurn(1);return;}
    if(qIndex<qs.length-1){setQIndex(qIndex+1);setTurn(0);}else setPhase("results");
  };
  const reset=()=>{setPhase("setup");setQIndex(0);setTurn(0);setAnswer("");setAnswers(qs.map(()=>["",""]));};
  return <Modal onClose={onClose}><div className="p-7 md:p-10 bg-gradient-to-br from-rose-50 to-blue-50 min-h-[560px]">
    <div className="text-center mb-8"><Users className="w-12 h-12 mx-auto text-blue-600 mb-3"/><h2 className="text-3xl font-bold">{t.quizTitle}</h2><p className="text-gray-600 mt-2">{t.quizDesc}</p></div>
    {phase==="setup" && <div className="max-w-xl mx-auto space-y-5"><Field label={t.player1} value={p1} onChange={setP1}/><Field label={t.player2} value={p2} onChange={setP2}/><Button onClick={()=>setPhase("play")} disabled={!p1.trim()||!p2.trim()} className="w-full bg-blue-600 hover:bg-blue-700">{t.start}</Button></div>}
    {phase==="play" && <div className="max-w-2xl mx-auto"><div className="text-sm font-semibold text-blue-700 mb-2">{t.question} {qIndex+1}/{qs.length} · {turn===0?p1:p2}</div><div className="rounded-2xl bg-white shadow-sm p-7"><h3 className="text-2xl font-bold text-gray-900 mb-6">{qs[qIndex]}</h3><Field label={t.answer} value={answer} onChange={setAnswer} textarea/><Button onClick={submit} disabled={!answer.trim()} className="w-full mt-5 bg-blue-600 hover:bg-blue-700">{turn===0?t.next:(qIndex===qs.length-1?t.compare:t.next)}</Button></div></div>}
    {phase==="results" && <div className="max-w-3xl mx-auto space-y-4">{qs.map((q,i)=><div key={q} className="rounded-2xl bg-white p-5 shadow-sm"><h3 className="font-bold mb-3">{q}</h3><div className="grid md:grid-cols-2 gap-3"><div className="rounded-xl bg-pink-50 p-3"><b>{p1}</b><p>{answers[i][0]}</p></div><div className="rounded-xl bg-blue-50 p-3"><b>{p2}</b><p>{answers[i][1]}</p></div></div></div>)}<Button onClick={reset} variant="outline" className="w-full">{t.reset}</Button></div>}
  </div></Modal>;
}

function shuffled(size){
  const a=Array.from({length:size},(_,i)=>i);
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  if(a.every((v,i)=>v===i) && a.length>1) [a[0],a[1]]=[a[1],a[0]];
  return a;
}

export function PhotoPuzzleGame({ lang="en", onClose }) {
  const t=COPY[lang]||COPY.en;
  const [image,setImage]=useState(""); const [side,setSide]=useState(3); const [tiles,setTiles]=useState(()=>shuffled(9)); const [selected,setSelected]=useState(null);
  const solved=useMemo(()=>tiles.every((v,i)=>v===i),[tiles]);
  const setSize=n=>{setSide(n);setTiles(shuffled(n*n));setSelected(null)};
  const choose=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{setImage(String(r.result||""));setTiles(shuffled(side*side));setSelected(null)};r.readAsDataURL(f)};
  const tap=i=>{if(selected===null){setSelected(i);return;}const next=[...tiles];[next[selected],next[i]]=[next[i],next[selected]];setTiles(next);setSelected(null)};
  return <Modal onClose={onClose}><div className="p-7 md:p-10 bg-gradient-to-br from-amber-50 to-emerald-50 min-h-[560px]">
    <div className="text-center mb-7"><Puzzle className="w-12 h-12 mx-auto text-emerald-600 mb-3"/><h2 className="text-3xl font-bold">{t.puzzleTitle}</h2><p className="text-gray-600 mt-2">{t.puzzleDesc}</p></div>
    <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3 mb-5"><label className="inline-flex items-center gap-2 rounded-xl bg-white border px-4 py-2 cursor-pointer"><Upload className="w-4 h-4"/>{t.upload}<input type="file" accept="image/*" onChange={choose} className="hidden"/></label><select value={side} onChange={e=>setSize(Number(e.target.value))} className="rounded-xl border bg-white px-4 py-2"><option value={3}>3 × 3</option><option value={4}>4 × 4</option></select><Button variant="outline" onClick={()=>{setTiles(shuffled(side*side));setSelected(null)}}>{t.shuffle}</Button></div>
    {!image ? <div className="max-w-xl mx-auto rounded-2xl border-2 border-dashed border-gray-300 bg-white/60 p-14 text-center text-gray-500">{t.upload}</div> : <><div className="mx-auto aspect-square w-full max-w-[560px] grid gap-1 bg-gray-900 p-1 rounded-2xl overflow-hidden" style={{gridTemplateColumns:`repeat(${side}, minmax(0,1fr))`}}>{tiles.map((tile,i)=>{const row=Math.floor(tile/side),col=tile%side;return <button key={i} onClick={()=>tap(i)} className={`relative bg-no-repeat ${selected===i?"ring-4 ring-yellow-400 z-10":""}`} style={{backgroundImage:`url(${image})`,backgroundSize:`${side*100}% ${side*100}%`,backgroundPosition:`${(col/(side-1))*100}% ${(row/(side-1))*100}%`}} aria-label={`Tile ${i+1}`}/>})}</div><p className="text-center text-sm text-gray-600 mt-3">{t.puzzleHelp}</p>{solved && <div className="max-w-xl mx-auto mt-5 rounded-2xl bg-green-100 p-5 text-center text-green-800 font-bold text-xl">🎉 {t.solved}</div>}</>}
  </div></Modal>;
}

export const recoveredGameCards = (lang="en") => {
  const t=COPY[lang]||COPY.en;
  return [
    { id:"hidden_message", name:t.hiddenTitle, description:t.hiddenDesc, icon:"💌", difficulty:t.easy },
    { id:"love_quiz", name:t.quizTitle, description:t.quizDesc, icon:"❤️", difficulty:t.medium },
    { id:"photo_puzzle", name:t.puzzleTitle, description:t.puzzleDesc, icon:"🧩", difficulty:t.medium }
  ];
};

export function GameLauncher({ gameId, lang, onClose }) {
  if(gameId==="hidden_message") return <HiddenMessageGame lang={lang} onClose={onClose}/>;
  if(gameId==="love_quiz") return <LoveQuizGame lang={lang} onClose={onClose}/>;
  if(gameId==="photo_puzzle") return <PhotoPuzzleGame lang={lang} onClose={onClose}/>;
  return null;
}
