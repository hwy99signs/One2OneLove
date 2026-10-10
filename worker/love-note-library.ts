// @ts-nocheck
// Server-only catalog. DO NOT import this from client components: the contents
// must never be included in the public JavaScript bundle.
import { Client } from 'pg';
import { loveNotesData } from '../src/components/lovenotes/LoveNotesData';
import { additionalLoveNotesData } from '../src/components/lovenotes/additional';
import { subjectSupplementalNotes } from '../src/components/lovenotes/additional/LoveNotesSubjectSupplemental';

const standardSubjectAssignments = [
  'romantic', 'romantic', 'romantic', 'romantic', 'romantic',
  'family', 'family', 'family', 'family', 'family',
  'casual', 'casual', 'casual', 'casual', 'casual',
];

const dominantSubjectByCategory = {
  romantic: 'romantic',
  lgbtqRomantic: 'romantic',
  family: 'family',
  friends: 'casual',
  dateIdeas: 'romantic',
};

const holidaySubjectAssignments = [
  'romantic', 'romantic', 'romantic', 'family', 'family', 'romantic', 'romantic', 'family', 'casual', 'romantic',
  'romantic', 'romantic', 'casual', 'family', 'casual', 'romantic', 'family', 'casual', 'family', 'romantic',
  'romantic', 'romantic', 'romantic', 'romantic', 'romantic',
  'family', 'family', 'family', 'family', 'family', 'family', 'family', 'family', 'family',
  'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual', 'casual',
];

const missingYouSubjectAssignments = [
  'romantic', 'romantic', 'romantic', 'romantic', 'romantic',
  'family', 'family', 'family', 'family', 'family',
  'casual', 'casual', 'casual', 'casual', 'casual',
];

const getSubjectForNote = (category, noteIndex, note) => {
  if (note?.subject && ['romantic', 'family', 'casual'].includes(note.subject)) return note.subject;
  if (category === 'holiday') return holidaySubjectAssignments[noteIndex] || standardSubjectAssignments[noteIndex % standardSubjectAssignments.length];
  if (category === 'missingYou') return missingYouSubjectAssignments[noteIndex] || standardSubjectAssignments[noteIndex % standardSubjectAssignments.length];
  if (dominantSubjectByCategory[category]) return dominantSubjectByCategory[category];
  return standardSubjectAssignments[noteIndex % standardSubjectAssignments.length];
};

export const generateNotes = (lang) => {
  const notes = [];
  let id = 1;
  const baseData = loveNotesData[lang] || loveNotesData.en;
  const addedData = additionalLoveNotesData[lang] || additionalLoveNotesData.en;
  const data = { ...baseData, ...addedData, holiday: [...(baseData.holiday || []), ...(addedData.holiday || [])] };

  const categoryOrder = [
    'romantic', 'lgbtqRomantic', 'lgbtqSupport', 'lgbtqMilestone', 'sweet', 'playful', 'deep', 'appreciation',
    'memories', 'future', 'morning', 'night', 'daily', 'special',
    'dateIdeas', 'milestone', 'justBecause', 'encouragement', 'apology',
    'family', 'friends', 'heartBroken', 'sick', 'goodLuck',
    'holiday', 'missingYou', 'religious', 'service', 'workplace'
  ];

  categoryOrder.forEach(category => {
    if (data[category] && data[category].length > 0) {
      data[category].forEach((note, noteIndex) => {
        notes.push({
          id: id++,
          ...note,
          category: category,
          subject: getSubjectForNote(category, noteIndex, note),
        });
      });
    }
  });

  const subjectSupplements = subjectSupplementalNotes[lang] || subjectSupplementalNotes.en;
  Object.entries(subjectSupplements).forEach(([category, bySubject]) => {
    Object.entries(bySubject).forEach(([subject, extraNotes]) => {
      extraNotes.forEach(note => {
        notes.push({
          id: id++,
          ...note,
          category,
          subject,
        });
      });
    });
  });

  return notes;
};


const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
async function identity(request,env) {
  const cookie=request.headers.get('cookie');
  if(!cookie)return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\\/$/,'')+'/get-session',{headers:{cookie,accept:'application/json'}});
  if(!response.ok)return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user??payload?.data?.user??null;
  return user?.id&&user?.emailVerified===true&&(payload?.session??payload?.data?.session)?user:null;
}
export async function handleLoveNoteLibraryRequest(request,env,url) {
  if(!url.pathname.startsWith('/api/love-note-library'))return null;
  if(request.method!=='GET')return json({ok:false,error:{code:'method_not_allowed',message:'Method not allowed.'}},405);
  const language=['en','es','fr','it','de'].includes(url.searchParams.get('lang'))?url.searchParams.get('lang'):'en';
  const notes=generateNotes(language);
  if(url.pathname==='/api/love-note-library') {
    // Public response includes titles, classification and tags ONLY.
    return json({ok:true,notes:notes.map(({id,title,category,subject,tags})=>({id,title,category,subject,tags}))});
  }
  if(url.pathname!=='/api/love-note-library/item')return json({ok:false},404);
  const id=Number(url.searchParams.get('id'));
  if(!Number.isSafeInteger(id)||id<1)return json({ok:false,error:{code:'invalid_note_id'}},400);
  const user=await identity(request,env);
  if(!user)return json({ok:false,error:{code:'unauthorized',message:'Verified sign-in is required to read this note.'}},401);
  const db=new Client({connectionString:env.HYPERDRIVE.connectionString});
  await db.connect();
  try {
    const member=(await db.query('SELECT COALESCE(p.is_active,true) AS active, COALESCE(u.banned,false) AS banned FROM neon_auth."user" u LEFT JOIN public.users p ON p.id=u.id WHERE u.id=$1::uuid',[user.id])).rows[0];
    if(!member||!member.active||member.banned)return json({ok:false,error:{code:'forbidden'}},403);
    const contentKey=language+':'+id;
    const owned=(await db.query(`SELECT EXISTS(SELECT 1 FROM public.o2ol_token_content_unlocks WHERE user_id=$1::uuid AND feature_code='love_note_template_unlock' AND content_key=$2) AS owned`,[user.id,contentKey])).rows[0]?.owned===true;
    if(!owned)return json({ok:false,error:{code:'content_unlock_required',message:'Unlock this Love Note for $0.49 Credit.',featureCode:'love_note_template_unlock'}},402);
    const note=notes.find(n=>n.id===id);
    if(!note)return json({ok:false,error:{code:'note_not_found'}},404);
    return json({ok:true,note});
  }finally{await db.end();}
}
