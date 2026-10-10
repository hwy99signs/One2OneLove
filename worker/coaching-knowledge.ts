// @ts-nocheck
// One2OneLove Coaching Knowledge Base — curated grounding for Bianca and Amora.
// Phase 1 uses deterministic topic retrieval so the exact guidance is auditable.
// Future embedding/vector retrieval can replace the scorer without changing the content contract.

export const O2OL_COACHING_KB_VERSION='2026-10-10-v1';

export const COACHING_KNOWLEDGE=[
  {
    id:'communication-listen-before-defend',
    topics:['communication','defensiveness','misunderstanding','listening','validation'],
    keywords:['defensive','defensiveness','listen','listening','misunderstood','argument','explain','explaining','hurt','heard','validation'],
    source:'O2OL Relationship Library / defensiveness-new-relationships',
    guidance:[
      'Understand the concern before defending intent. Intention and impact can both matter.',
      'Validation does not require agreement. Reflect what the other person experienced before explaining your own view.',
      'Useful prompt: ask what part of the interaction hurt, confused, or felt dismissive.',
      'Watch repeated patterns of blame, shutdown, fear, or counterattack instead of treating every conflict as an isolated event.',
    ],
  },
  {
    id:'conflict-repair',
    topics:['conflict','repair','apology','reconnection'],
    keywords:['fight','fighting','argument','argue','apologize','apology','sorry','repair','reconnect','conflict','mad','angry'],
    source:'O2OL Relationship Library / repair-after-conflict',
    guidance:[
      'Shift from proving who is right toward understanding what happened between the partners.',
      'A useful apology names the behavior, acknowledges impact, and identifies what will change.',
      'Do not force immediate resolution when either person is emotionally flooded; agree on when to resume the conversation.',
      'After resolution, intentional reconnection through reassurance, affection, humor, or calm shared time can help restore closeness.',
    ],
  },
  {
    id:'boundaries-vs-control',
    topics:['boundaries','trust','control','autonomy'],
    keywords:['boundary','boundaries','control','controlling','allowed','permission','phone','location','track','tracking','privacy','space'],
    source:'O2OL Relationship Library / boundaries-vs-control',
    guidance:[
      'A boundary describes what the person setting it will do to protect wellbeing; control dictates what another adult is permitted to do.',
      'Healthy boundaries are specific, proportionate, and connected to values rather than punishment or fear.',
      'A useful test is whether the other adult still has a meaningful choice, even if choices have relationship consequences.',
      'Intimidation, surveillance, humiliation, isolation, or forced access are not healthy boundary-setting.',
    ],
  },
  {
    id:'dating-clarity',
    topics:['dating','expectations','exclusivity','intentions'],
    keywords:['dating','exclusive','exclusivity','situationship','commitment','intentions','relationship status','seeing other','where is this going'],
    source:'O2OL Relationship Library / dating-expectations',
    guidance:[
      'Chemistry does not establish shared intentions; expectations need direct conversation.',
      'Useful early topics include exclusivity, communication frequency, pace, values, and deal-breakers.',
      'Seeking clarity is not the same as pressuring someone to promise a future they cannot know.',
      'Repeated mismatch between words and behavior is information that should be considered rather than endlessly decoded.',
    ],
  },
  {
    id:'marriage-under-pressure',
    topics:['marriage','stress','workload','connection'],
    keywords:['marriage','married','busy','work','chores','kids','children','stress','resentment','roommates','disconnected'],
    source:'O2OL Relationship Library / marriage-under-pressure',
    guidance:[
      'Busy seasons are normal, but temporary disconnection should not quietly become the permanent relationship pattern.',
      'Small points of connection matter: greeting, undistracted minutes, appreciation, affection, and intentional goodnight rituals.',
      'Discuss workload before resentment grows; focus on whether the arrangement feels fair and sustainable rather than scoring who does more.',
      'Protect friendship and shared enjoyment so the relationship is not reduced to logistics and problems.',
    ],
  },
  {
    id:'emotional-validation',
    topics:['emotions','validation','empathy','support'],
    keywords:['feel','feeling','feelings','emotional','validate','validation','understand','support','dismissed','ignored','unheard'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Acknowledge expressed feelings without claiming to know emotions the member did not state.',
      'Validation means recognizing the person’s experience as understandable; it does not require agreeing with every interpretation.',
      'Ask whether the member wants listening, problem-solving, reassurance, or help preparing a conversation before giving extensive advice.',
    ],
  },
  {
    id:'trust-rebuilding',
    topics:['trust','reliability','betrayal','rebuilding'],
    keywords:['trust','lied','lying','dishonest','betray','betrayal','broken trust','secret','secrets','rebuild'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Trust is rebuilt through consistent behavior over time rather than repeated reassurance alone.',
      'Clarify what specific behavior damaged trust and what observable changes would make repair measurable.',
      'Accountability and transparency should be voluntary and proportionate; avoid recommending coercive surveillance or total loss of privacy.',
      'Some breaches may require professional counseling or a decision about whether the relationship remains workable.',
    ],
  },
  {
    id:'jealousy-insecurity',
    topics:['jealousy','insecurity','reassurance','trust'],
    keywords:['jealous','jealousy','insecure','insecurity','ex','flirting','friend','attention','worried about'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Separate the feeling of jealousy from controlling behavior; a feeling can be discussed without restricting another adult.',
      'Explore the trigger, the feared outcome, and whether there is actual evidence of a trust problem.',
      'Encourage specific reassurance requests and boundary conversations rather than accusations, tests, or surveillance.',
    ],
  },
  {
    id:'money-finances',
    topics:['finances','money','budget','spending','debt'],
    keywords:['money','financial','finances','budget','spend','spending','debt','bills','income','bank','saving','savings'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Money conflict often combines practical decisions with values such as security, freedom, fairness, status, or responsibility.',
      'Encourage disclosure of relevant facts, shared priorities, and a repeatable process for decisions rather than arguing only about individual purchases.',
      'For couples, useful structures can include agreed personal spending amounts, shared obligations, savings goals, and scheduled money conversations.',
      'Do not provide individualized financial or legal advice; recommend qualified help for high-stakes financial situations.',
    ],
  },
  {
    id:'family-inlaws',
    topics:['family','in-laws','loyalty','boundaries'],
    keywords:['in-law','inlaws','mother-in-law','father-in-law','family','parents','mom','dad','sister','brother','relatives'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Frame family conflict around the couple’s shared boundaries and responsibilities rather than demanding automatic loyalty against relatives.',
      'The partner connected to the family often has an important role in communicating boundaries respectfully and clearly.',
      'Avoid asking a partner to isolate from healthy support systems; focus on behavior-specific limits.',
    ],
  },
  {
    id:'intimacy-affection',
    topics:['intimacy','affection','sex','desire','connection'],
    keywords:['intimacy','intimate','sex','sexual','desire','affection','touch','kiss','kissing','bedroom','libido'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Treat differences in desire or affection as a shared relationship issue, not proof that one partner is defective.',
      'Consent is required every time; pressure, guilt, threats, or persistence after refusal are not healthy intimacy strategies.',
      'Encourage conversations about preferences, comfort, emotional connection, frequency expectations, and nonsexual affection.',
      'Medical or persistent sexual-function concerns should be referred to qualified healthcare professionals.',
    ],
  },
  {
    id:'long-distance',
    topics:['long-distance','communication','trust','planning'],
    keywords:['long distance','long-distance','different city','different country','distance','apart','deployment','travel'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Long-distance relationships benefit from explicit expectations for communication, exclusivity, visits, privacy, and conflict repair.',
      'Quality and predictability of contact may matter more than constant messaging.',
      'A realistic plan for future proximity is important when the relationship is intended to become long-term.',
    ],
  },
  {
    id:'breakup-reconciliation',
    topics:['breakup','reconciliation','separation','moving on'],
    keywords:['break up','breakup','broke up','separate','separation','reconcile','reconciliation','get back together','ex partner','move on'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Distinguish missing someone from evidence that the relationship pattern has changed.',
      'For reconciliation, identify why the relationship ended, what has materially changed, and what boundaries or commitments would be different.',
      'Do not encourage repeated unwanted contact, pressure, or attempts to override another person’s decision to end a relationship.',
    ],
  },
  {
    id:'infidelity-recovery',
    topics:['infidelity','betrayal','repair','trust'],
    keywords:['cheat','cheated','cheating','affair','infidelity','unfaithful','other woman','other man'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Recovery after infidelity requires truthfulness, accountability, boundaries, and time; forgiveness cannot be forced or scheduled.',
      'The hurt partner may need clarity and safety without being encouraged into endless surveillance.',
      'The couple should decide whether both genuinely want repair; professional couples counseling can be useful for complex betrayal recovery.',
    ],
  },
  {
    id:'parenting-disagreement',
    topics:['parenting','children','discipline','co-parenting'],
    keywords:['parenting','parent','child','children','kids','discipline','co-parent','coparent','stepchild','stepchildren'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Separate the immediate parenting decision from the couple’s underlying values and role expectations.',
      'Avoid undermining each other in front of children when possible; revisit disagreement privately and create consistent expectations.',
      'Safety, abuse, or serious child-welfare concerns require qualified professional or local support rather than ordinary relationship coaching.',
    ],
  },
  {
    id:'apology-forgiveness',
    topics:['apology','forgiveness','accountability'],
    keywords:['apology','apologize','sorry','forgive','forgiveness','mistake','regret'],
    source:'O2OL Coaching Standard',
    guidance:[
      'A meaningful apology is specific about what happened, recognizes impact, takes appropriate responsibility, and describes repair.',
      'Forgiveness cannot be demanded as proof of love and does not automatically restore trust or remove boundaries.',
      'Changed behavior is more persuasive than repeated apologies without follow-through.',
    ],
  },
  {
    id:'healthy-red-flags',
    topics:['safety','red flags','coercion','abuse'],
    keywords:['abuse','abusive','hit','hits','hitting','threat','threaten','afraid','scared','coerce','coercion','force','forced','stalk','stalking','isolate','weapon','danger'],
    source:'O2OL Safety Standard',
    priority:100,
    guidance:[
      'Prioritize immediate physical and emotional safety over relationship preservation.',
      'Do not suggest couples communication techniques as the primary solution when there is credible abuse, coercive control, stalking, threats, or immediate danger.',
      'Encourage contact with appropriate local emergency services, domestic-violence resources, trusted support, or qualified professionals based on urgency.',
      'Avoid steps that could increase danger, such as confronting an abusive person without a safety plan.',
    ],
  },
  {
    id:'self-harm-crisis',
    topics:['safety','self-harm','suicide','crisis'],
    keywords:['suicide','suicidal','kill myself','self harm','self-harm','hurt myself','end my life','want to die'],
    source:'O2OL Safety Standard',
    priority:110,
    guidance:[
      'Treat possible self-harm or suicide risk as a safety issue, not ordinary relationship coaching.',
      'Encourage immediate contact with local emergency/crisis resources and a trusted person who can provide real-world support.',
      'Keep the response focused on immediate safety and do not leave the user with only relationship advice.',
    ],
  },
  {
    id:'professional-referral',
    topics:['professional help','therapy','counseling','high stakes'],
    keywords:['therapist','therapy','counselor','counselling','counseling','professional help','diagnose','medication','legal'],
    source:'O2OL Help Center / AI Relationship Coach limits',
    guidance:[
      'Bianca and Amora provide general reflection, communication ideas, and relationship education—not diagnosis, therapy, medical care, legal advice, or crisis services.',
      'Recommend qualified professional help when issues are persistent, high-stakes, clinical, legal, medical, or beyond general coaching.',
    ],
  },
];

const STOP=new Set(['the','and','that','this','with','from','have','what','when','where','would','could','should','about','your','you','are','was','were','for','but','not','then','than','into','like','they','them','their','our','out','all','can','how','why','who']);

function normalize(text=''){
  return String(text).toLowerCase().replace(/[’']/g,"'").replace(/[^\p{L}\p{N}' -]+/gu,' ').replace(/\s+/g,' ').trim();
}
function tokens(text=''){
  return normalize(text).split(' ').filter(x=>x.length>2&&!STOP.has(x));
}

export function retrieveCoachingKnowledge(message,history=[],limit=4){
  const combined=[...(history||[]).slice(-6).map(x=>x?.content||''),message||''].join(' ');
  const norm=normalize(combined);
  const words=new Set(tokens(combined));
  const scored=COACHING_KNOWLEDGE.map(item=>{
    let score=Number(item.priority||0);
    for(const keyword of item.keywords||[]){
      const k=normalize(keyword);
      if(!k)continue;
      if(k.includes(' ')){ if(norm.includes(k))score+=8; }
      else if(words.has(k))score+=4;
    }
    for(const topic of item.topics||[]){
      const t=normalize(topic);
      if(words.has(t))score+=2;
    }
    return {item,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  return scored.slice(0,Math.max(1,limit)).map(x=>x.item);
}

export function formatCoachingGrounding(items=[]){
  if(!items.length)return 'No specific O2OL knowledge-base entry matched. Use cautious general relationship guidance and the platform safety rules.';
  return items.map((item,index)=>[
    `[${index+1}] ${item.id} | source: ${item.source}`,
    ...item.guidance.map(g=>`- ${g}`),
  ].join('\n')).join('\n\n');
}
