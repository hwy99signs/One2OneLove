// @ts-nocheck
// One2OneLove Coaching Knowledge Base — curated grounding for Bianca and Amora.
// Phase 1 uses deterministic topic retrieval so the exact guidance is auditable.
// Future embedding/vector retrieval can replace the scorer without changing the content contract.

export const O2OL_COACHING_KB_VERSION='2026-10-10-v2.1';

export const COACHING_KNOWLEDGE=[
  {
    id:'communication-listen-before-defend',
    topics:['communication','defensiveness','misunderstanding','listening','validation'],
    keywords:['defensive','defensiveness','listen','listening','misunderstood','argument','explain','explaining','hurt','heard','validation'],
    source:'O2OL Relationship Library / defensiveness-new-relationships',
    guidance:[
      'Understand the concern before defending intent. Intention and impact can both matter.',
      'Validation does not require agreement. Reflect what the other person experienced before explaining your own view.',
      'Useful prompt: ask what part of the interaction hurt, confused, or felt dismissive. Separate what happened, what was felt, and what is needed before trying to solve it.',
      'Watch repeated patterns of blame, shutdown, fear, counterattack, mind-reading, or kitchen-sinking instead of treating every conflict as an isolated event. Timing is part of communication skill; serious talks often go poorly when either person is exhausted, rushed, or already flooded.',
    ],
  },
  {
    id:'conflict-repair',
    topics:['conflict','repair','apology','reconnection'],
    keywords:['fight','fighting','argument','argue','apologize','apology','sorry','repair','reconnect','conflict','mad','angry'],
    source:'O2OL Relationship Library / repair-after-conflict',
    guidance:[
      'Shift from proving who is right toward understanding the conflict cycle. Treat the pattern as the opponent rather than either partner.',
      'A useful apology names the specific behavior, acknowledges impact, avoids a defensive “but,” and identifies observable change that will follow.',
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
      'Validation means recognizing the person’s experience as understandable; it does not require agreeing with every interpretation. Reflect first, then ask whether they want comfort or ideas.',
      'Ask whether the member wants listening, problem-solving, reassurance, or help preparing a conversation before giving extensive advice.',
    ],
  },
  {
    id:'trust-rebuilding',
    topics:['trust','reliability','betrayal','rebuilding'],
    keywords:['trust','lied','lying','dishonest','betray','betrayal','broken trust','secret','secrets','rebuild'],
    source:'O2OL Coaching Standard',
    guidance:[
      'Trust is rebuilt through consistent behavior over time rather than repeated reassurance alone. Narrow the issue to the specific kind of trust that was damaged—honesty, reliability, loyalty, or emotional safety.',
      'Clarify what specific behavior damaged trust and what observable changes would make repair measurable.',
      'Accountability and transparency should be voluntary and proportionate; offered information can support repair, but forced passwords, permanent location tracking, traps, or total loss of privacy are not healthy trust-building.',
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
    id:'communication-demand-withdraw-cycle',
    topics:['communication','conflict cycle','pursue withdraw','shutdown'],
    keywords:['shut down','shutdown','chase','chasing','pursue','pursuing','withdraw','withdrawing','keeps asking','wont talk','won\'t talk','silent treatment'],
    source:'O2OL Coaching Standard — Communication Patterns',
    guidance:[
      'When one partner pursues harder and the other withdraws more, focus on the cycle rather than blaming one person as the entire problem.',
      'Encourage a calmer re-entry plan: pause when flooded, name when the conversation will resume, and return at the agreed time.',
      'The pursuing partner can make one clear request instead of escalating repeated demands; the withdrawing partner should avoid disappearing indefinitely.',
      'Distinguish a healthy cooling-off period from punitive silent treatment or coercive withdrawal.',
    ],
  },
  {
    id:'communication-stonewalling-flooding',
    topics:['communication','stonewalling','flooding','conflict'],
    keywords:['stonewall','stonewalling','overwhelmed','flooded','flooding','blank','freeze','freezes','cant think','can\'t think','need a break'],
    source:'O2OL Coaching Standard — Communication Patterns',
    guidance:[
      'Emotional flooding can make productive conversation temporarily difficult; a structured break can be healthier than forcing resolution.',
      'A break should include reassurance and a specific plan to resume, not indefinite avoidance.',
      'Use simple regulation steps during the pause: breathing, walking, water, quiet time, or another non-retaliatory calming activity.',
      'If shutdown is used to punish, frighten, control, or indefinitely deny communication, address the unhealthy pattern rather than normalizing it.',
    ],
  },
  {
    id:'communication-soft-startup',
    topics:['communication','conflict','requests','tone'],
    keywords:['how do i bring up','start conversation','bring this up','always','never','accuse','accusing','nag','nagging','tone'],
    source:'O2OL Coaching Standard — Communication Patterns',
    guidance:[
      'Encourage starting difficult conversations with the specific issue, the speaker’s experience, and a concrete request rather than global criticism.',
      'Prefer “I felt… when… and I’d like…” over “You always…” or “You never…”.',
      'Keep the opening narrow enough that the other person knows what problem is actually being discussed.',
      'A softer opening is not about suppressing legitimate frustration; it is about reducing unnecessary defensiveness.',
    ],
  },
  {
    id:'communication-emotional-bids',
    topics:['connection','emotional bids','attention','affection'],
    keywords:['attention','ignored','notice me','small things','check in','connection','connect','affection','quality time','phone all the time'],
    source:'O2OL Coaching Standard — Connection',
    guidance:[
      'Small bids for attention, affection, humor, help, or shared interest can accumulate into a sense of connection or disconnection.',
      'Encourage partners to notice recurring bids and respond when reasonably possible rather than waiting only for major relationship talks.',
      'A missed bid is not automatically rejection; patterns and repair matter more than one isolated moment.',
      'Suggest specific, realistic rituals of connection rather than vague demands to “be more present.”',
    ],
  },
  {
    id:'communication-unmet-expectations',
    topics:['expectations','needs','assumptions','communication'],
    keywords:['expected','expectation','expectations','assumed','assumption','supposed to','should know','mind reader','mind reading','unmet needs'],
    source:'O2OL Coaching Standard — Expectations',
    guidance:[
      'Unspoken expectations often become resentment when one partner assumes the other should already know.',
      'Help convert assumptions into explicit, negotiable requests.',
      'Separate a preference from a boundary, and a hope from an agreed commitment.',
      'If an expectation was never discussed, focus first on clarity rather than treating the other person as though they knowingly broke an agreement.',
    ],
  },
  {
    id:'communication-recurring-conflict',
    topics:['recurring conflict','patterns','conflict','problem solving'],
    keywords:['same fight','same argument','keep fighting','again and again','every time','recurring','repeat','repeating','nothing changes'],
    source:'O2OL Coaching Standard — Conflict Patterns',
    guidance:[
      'When the same argument repeats, identify the underlying need, fear, value, or unresolved decision rather than debating only the surface topic again.',
      'Ask what each person is trying to protect or obtain in the conflict.',
      'Distinguish solvable practical disagreements from enduring differences that may require ongoing compromise.',
      'Track whether attempted solutions actually change behavior; repeated promises without follow-through are relevant information.',
    ],
  },
  {
    id:'communication-advice-vs-listening',
    topics:['listening','support','advice','empathy'],
    keywords:['just listen','stop giving advice','advice','vent','venting','fix it','fix everything','listen to me'],
    source:'O2OL Communication Practice',
    guidance:[
      'Before problem-solving, ask whether the person wants listening, reassurance, brainstorming, or direct advice.',
      'Jumping immediately into solutions can feel dismissive when someone is trying to feel heard.',
      'Listening does not require passivity; after validation, practical help can be offered with permission.',
    ],
  },
  {
    id:'household-labor-fairness',
    topics:['household labor','chores','fairness','mental load'],
    keywords:['chores','housework','cleaning','laundry','mental load','household','does nothing','i do everything','fair share'],
    source:'O2OL Coaching Standard — Household Partnership',
    guidance:[
      'Move the conversation from vague fairness complaints to a visible list of recurring tasks, planning work, and responsibility ownership.',
      'Equal does not always mean identical; the goal is a division both partners experience as fair and sustainable.',
      'Include invisible planning and remembering work, not only physical chores.',
      'Avoid parent-child dynamics where one adult becomes the manager of the other adult’s responsibilities.',
    ],
  },
  {
    id:'values-faith-differences',
    topics:['values','faith','religion','beliefs','culture'],
    keywords:['religion','religious','faith','church','god','belief','beliefs','values','different values','spiritual','interfaith'],
    source:'O2OL Coaching Standard — Values & Faith',
    guidance:[
      'Do not assume value or faith differences are automatically incompatible; explore how they affect concrete decisions and daily life.',
      'Discuss expectations around worship, holidays, children, family involvement, finances, sexuality, and community where relevant.',
      'Look for respectful coexistence and negotiated practice rather than pressure to convert or abandon identity.',
      'If a difference affects a non-negotiable life goal, clarity is more useful than pretending the conflict does not exist.',
    ],
  },
  {
    id:'intercultural-relationship',
    topics:['culture','intercultural','family expectations','communication'],
    keywords:['culture','cultural','different culture','different country','tradition','traditions','custom','customs','family expectations'],
    source:'O2OL Coaching Standard — Intercultural Relationships',
    guidance:[
      'Treat cultural differences as context to understand, not stereotypes that predict individual behavior.',
      'Ask which traditions, family roles, communication norms, and expectations actually matter to each partner personally.',
      'Encourage explicit discussion where one partner assumes a custom is obvious and the other does not share that assumption.',
      'Respecting culture does not require accepting coercion, discrimination, abuse, or loss of personal autonomy.',
    ],
  },
  {
    id:'digital-boundaries-social-media',
    topics:['digital boundaries','social media','privacy','trust'],
    keywords:['social media','instagram','facebook','tiktok','dm','dms','texting','online','password','phone password','read my messages','likes','following'],
    source:'O2OL Coaching Standard — Digital Boundaries',
    guidance:[
      'Digital boundaries should be discussed explicitly: privacy, passwords, posting, direct messages, ex-partners, flirting, and public relationship status may mean different things to different people.',
      'Trust should not depend on forced password sharing, secret monitoring, or constant device inspection.',
      'Focus on mutually agreed behavior rather than trying to eliminate all uncertainty through surveillance.',
      'A hidden online behavior that violates an explicit agreement is different from a partner simply having reasonable privacy.',
    ],
  },
  {
    id:'ex-friendship-boundaries',
    topics:['ex partners','friendships','boundaries','trust'],
    keywords:['ex','ex girlfriend','ex boyfriend','former partner','best friend','opposite sex friend','friendship boundary','still friends with'],
    source:'O2OL Coaching Standard — External Relationships',
    guidance:[
      'Discuss behavior-specific boundaries around ex-partners and friendships instead of assuming every outside relationship is a threat.',
      'Useful questions include transparency, emotional intimacy, flirting, secrecy, history, and whether behavior conflicts with an existing agreement.',
      'Do not recommend isolation from healthy friends or support networks as a default solution to insecurity.',
      'If a friendship repeatedly undermines the couple’s explicit agreements, address the specific conduct and consequences.',
    ],
  },
  {
    id:'love-languages-flexible',
    topics:['love languages','affection','appreciation','connection'],
    keywords:['love language','love languages','words of affirmation','quality time','acts of service','gifts','physical touch','feel loved'],
    source:'Muse Literature Pack / Love languages',
    guidance:[
      'Use love-language ideas as a translation tool, not a diagnosis or fixed identity.',
      'Help members notice which forms of care currently land best: kind words, undivided attention, thoughtful gifts, helpful acts, or affectionate touch.',
      'Encourage partners to state preferences directly and stay curious because preferences can shift with stress, season, and life stage.',
      'Do not use a preferred “language” to demand affection, dismiss a partner’s effort, or excuse refusing all other forms of care.',
    ],
  },
  {
    id:'attachment-related-behaviors',
    topics:['attachment','security','reassurance','distance','closeness'],
    keywords:['attachment','anxious','avoidant','avoidance','reassurance','clingy','smothered','slow reply','needs space','pull away','distance'],
    source:'Muse Literature Pack / Attachment-related behaviors',
    guidance:[
      'Describe observable closeness-and-distance behaviors without diagnosing or assigning fixed attachment labels.',
      'Help the member identify their own response to uncertainty first: seeking reassurance, testing, withdrawing, freezing, or asking for space.',
      'For reassurance-seeking patterns, encourage direct requests instead of tests or repeated checking; for distance-seeking patterns, encourage space with a clear return time.',
      'Security grows through repeated evidence such as consistent replies, kept promises, predictable check-ins, and respectful autonomy.',
    ],
  },
  {
    id:'choosing-each-other-daily',
    topics:['commitment','connection','kindness','consistency'],
    keywords:['taken for granted','choose each other','choosing each other','flat relationship','routine','spark','effort','small gesture','kindness'],
    source:'Muse Literature Pack / Relationship Matters — Choosing Each Other Daily',
    guidance:[
      'When a relationship feels flat or taken for granted, bring the focus back to small deliberate choices today rather than judging the entire relationship at once.',
      'Encourage one specific act of kindness, attention, or consideration that fits the partner rather than relying only on grand gestures.',
      'If the member feels unchosen, encourage them to say that plainly rather than testing, withdrawing, or scorekeeping.',
      'Consistency in ordinary moments matters more than occasional dramatic effort.',
    ],
  },
  {
    id:'appreciation-gratitude',
    topics:['appreciation','gratitude','affirmation','noticing'],
    keywords:['appreciate','appreciation','gratitude','grateful','thank you','thankful','taken for granted','notice me','recognition'],
    source:'Muse Literature Pack / Relationship Matters — Appreciation and Gratitude',
    guidance:[
      'Help members notice specific things their partner does well without using gratitude to dismiss legitimate problems.',
      'Specific appreciation lands better than generic praise: name the action, quality, or support being recognized.',
      'Encourage appreciation to be expressed aloud rather than assumed to be understood.',
      'Small repeated expressions of appreciation can support connection more reliably than occasional grand gestures.',
    ],
  },
  {
    id:'patience-with-growth',
    topics:['patience','frustration','growth','change'],
    keywords:['patience','impatient','impatience','change faster','never changes','slow to change','frustrated with progress'],
    source:'Muse Literature Pack / Relationship Matters — Patience',
    guidance:[
      'Patience means responding thoughtfully while change is developing; it does not mean ignoring a real problem indefinitely.',
      'Encourage the member to slow the reaction and ask whether the response is serving the relationship or simply discharging frustration.',
      'Separate realistic time for growth from repeated promises with no observable change.',
      'Do not use patience as a reason to tolerate abuse, coercion, chronic disrespect, or serious safety concerns.',
    ],
  },
  {
    id:'quality-time-presence',
    topics:['quality time','presence','attention','connection','check-in'],
    keywords:['quality time','no time together','always on phone','phones','distant','disconnected','present','presence','check in','meaningful time'],
    source:'Muse Literature Pack / Relationship Matters — Quality Time and Presence',
    guidance:[
      'Quality time is primarily about attention and presence, not expense or elaborate plans.',
      'Suggest simple protected connection periods such as a shared meal, walk, or 20 minutes without phones or interruptions.',
      'Encourage questions that invite emotional context rather than only logistics, while respecting a partner who does not want to talk at that moment.',
      'Do not confuse being physically near each other with meaningful connection; focused attention is the useful distinction.',
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
