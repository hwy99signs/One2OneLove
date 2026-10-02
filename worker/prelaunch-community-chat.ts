// @ts-nocheck

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};

const ROOMS = [
  { id:'10000000-0000-4000-8000-000000000001', slug:'general-connection', name:'General Connection', description:'Open conversation about relationships, love, growth and everyday connection.', icon:'💬' },
  { id:'10000000-0000-4000-8000-000000000002', slug:'dating-new-relationships', name:'Dating & New Relationships', description:'Expectations, pacing, trust and early relationship questions.', icon:'💞' },
  { id:'10000000-0000-4000-8000-000000000003', slug:'marriage-partnership', name:'Marriage & Partnership', description:'Marriage, commitment, connection and everyday partnership.', icon:'💍' },
  { id:'10000000-0000-4000-8000-000000000004', slug:'communication-conflict', name:'Communication & Conflict', description:'Listening, disagreements, repair and healthier communication.', icon:'🗣️' },
  { id:'10000000-0000-4000-8000-000000000005', slug:'trust-boundaries-growth', name:'Trust, Boundaries & Growth', description:'Trust, boundaries, accountability and relationship security.', icon:'🛡️' },
  { id:'10000000-0000-4000-8000-000000000006', slug:'love-intimacy-connection', name:'Love, Intimacy & Connection', description:'Affection, emotional closeness, romance and intimacy.', icon:'❤️' },
  { id:'10000000-0000-4000-8000-000000000007', slug:'studio-who-should-apologize-first', name:'O2OL Studio — Who Should Apologize First?', description:'Season 1, Episode 1 discussion. Watch the episode, then share your perspective.', icon:'🎬' },
  { id:'10000000-0000-4000-8000-000000000008', slug:'lgbtq-community', name:'LGBTQ+ Community Chat', description:'A dedicated LGBTQ+ community space for support, connection and respectful conversation.', icon:'🏳️‍🌈' },
];

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:JSON_HEADERS});
}

function fail(message,status=400,code='bad_request'){
  return json({ok:false,error:{code,message}},status);
}

function roomById(id){
  return ROOMS.find(room=>room.id===id) || null;
}

function roomBySlug(slug){
  return ROOMS.find(room=>room.slug===slug) || null;
}

function safeMessage(value){
  const text=String(value||'').replace(/\r\n/g,'\n').trim();
  if(!text) throw new Error('Write a message before sending.');
  if(text.length>2000) throw new Error('Messages can be up to 2,000 characters.');
  return text;
}

function objectPrefix(room){
  return `prelaunch-chat/messages/${room.slug}/`;
}

function messageKey(room,id,createdAt){
  const stamp=new Date(createdAt).toISOString().replace(/[:.]/g,'-');
  return `${objectPrefix(room)}${stamp}-${id}.json`;
}

async function authSession(request,env){
  const cookie=request.headers.get('cookie');
  if(!cookie || !env.NEON_AUTH_BASE_URL) return null;
  const response=await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/,'')+'/get-session',{
    headers:{cookie,accept:'application/json'},
  });
  if(!response.ok) return null;
  const payload=await response.json().catch(()=>null);
  const user=payload?.user ?? payload?.data?.user ?? null;
  const session=payload?.session ?? payload?.data?.session ?? null;
  return user?.id && user?.emailVerified===true && session ? {user,session} : null;
}

async function listObjects(env,prefix,limit=1000){
  const result=await env.MEDIA.list({prefix,limit});
  return result?.objects || [];
}

async function countMessages(env,room){
  const objects=await listObjects(env,objectPrefix(room),1000);
  return objects.length;
}

async function countOnline(env,room){
  const prefix=`prelaunch-chat/presence/${room.slug}/`;
  const objects=await listObjects(env,prefix,1000);
  const cutoff=Date.now()-5*60*1000;
  let count=0;
  for(const item of objects){
    const object=await env.MEDIA.get(item.key);
    if(!object) continue;
    const payload=await object.json().catch(()=>null);
    const when=payload?.lastSeen ? new Date(payload.lastSeen).getTime() : 0;
    if(Number.isFinite(when) && when>cutoff) count+=1;
  }
  return count;
}

async function mutedUserIds(env,viewerId){
  if(!viewerId) return new Set();
  const objects=await listObjects(env,`prelaunch-chat/mutes/${viewerId}/`,1000);
  const ids=objects.map(x=>x.key.split('/').pop()).filter(Boolean);
  return new Set(ids);
}

async function listMessages(env,room,viewerId=null){
  const objects=await listObjects(env,objectPrefix(room),1000);
  const muted=await mutedUserIds(env,viewerId);
  const rows=[];
  for(const item of objects){
    const object=await env.MEDIA.get(item.key);
    if(!object) continue;
    const payload=await object.json().catch(()=>null);
    if(!payload || payload.deleted===true || muted.has(String(payload.userId||''))) continue;
    rows.push(payload);
  }
  rows.sort((a,b)=>new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime());
  return rows.slice(-100);
}

async function touchPresence(env,room,userId){
  if(!userId) return;
  const key=`prelaunch-chat/presence/${room.slug}/${userId}.json`;
  await env.MEDIA.put(key,JSON.stringify({userId,lastSeen:new Date().toISOString()}),{
    httpMetadata:{contentType:'application/json'}
  });
}

async function findMessage(env,messageId){
  const index=await env.MEDIA.get(`prelaunch-chat/message-index/${messageId}.json`);
  if(!index) return null;
  const pointer=await index.json().catch(()=>null);
  if(!pointer?.key) return null;
  const object=await env.MEDIA.get(pointer.key);
  if(!object) return null;
  const message=await object.json().catch(()=>null);
  return message ? {message,key:pointer.key} : null;
}

export async function getPrelaunchChatAdminSnapshot(env){
  const conversations=await Promise.all(ROOMS.map(async room=>({
    key:`room:${room.slug}`,
    topic:room.name,
    source:'Room',
    comments:await countMessages(env,room),
    createdAt:null,
  })));
  return {
    showVoting:{
      topicSlug:'studio-who-should-apologize-first',
      topicTitle:'Who Should Apologize First?',
      responseCount:0,
      lastResponseAt:null,
      relationship100:[
        {number:1,key:'money',label:'Money',average:0},
        {number:2,key:'religion',label:'Religion',average:0},
        {number:3,key:'sex_intimacy',label:'Sex / Intimacy',average:0},
        {number:4,key:'politics',label:'Politics',average:0},
        {number:5,key:'family',label:'Family',average:0},
        {number:6,key:'communication',label:'Communication',average:0},
        {number:7,key:'looks_physical_appearance',label:'Looks / Physical appearance',average:0},
        {number:8,key:'therapy_when_needed',label:'Therapy when needed',average:0},
        {number:9,key:'help_around_home',label:'Help around the home',average:0},
      ],
      expenseSplit:{number:10,label:'Household bills / shared expenses',manAverage:0,womanAverage:0},
      demographics:{
        respondentIdentity:[
          {label:'Man',count:0,percentage:0},
          {label:'Woman',count:0,percentage:0},
          {label:'Nonbinary',count:0,percentage:0},
          {label:'Prefer not to say',count:0,percentage:0},
        ],
        partnerIdentity:[
          {label:'Man',count:0,percentage:0},
          {label:'Woman',count:0,percentage:0},
          {label:'Nonbinary',count:0,percentage:0},
          {label:'Prefer not to say',count:0,percentage:0},
          {label:'Not currently partnered',count:0,percentage:0},
        ],
      },
    },
    conversations,
  };
}

async function handleRooms(request,env,url,auth){
  const scope=url.searchParams.get('scope')==='lgbtq' ? 'lgbtq' : 'general';
  const candidates=scope==='lgbtq'
    ? ROOMS.filter(room=>room.slug==='lgbtq-community')
    : ROOMS.filter(room=>room.slug!=='lgbtq-community');

  const rooms=await Promise.all(candidates.map(async room=>({
    ...room,
    online_count:await countOnline(env,room),
    message_count:await countMessages(env,room),
  })));
  return json({ok:true,rooms});
}

export async function handlePrelaunchCommunityChatRequest(request,env,url){
  if(!url.pathname.startsWith('/api/community-chat')) return null;
  const auth=await authSession(request,env);

  try{
    if(url.pathname==='/api/community-chat/rooms' && request.method==='GET'){
      return handleRooms(request,env,url,auth);
    }

    const messagesMatch=url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/messages$/i);
    if(messagesMatch){
      const room=roomById(messagesMatch[1]);
      if(!room) return fail('Chat room not found.',404,'not_found');

      if(request.method==='GET'){
        if(auth) await touchPresence(env,room,auth.user.id);
        return json({ok:true,messages:await listMessages(env,room,auth?.user?.id||null)});
      }

      if(request.method==='POST'){
        if(!auth) return fail('Sign in to join the conversation.',401,'unauthorized');
        const body=await request.json().catch(()=>({}));
        const content=safeMessage(body?.content);
        const id=crypto.randomUUID();
        const createdAt=new Date().toISOString();
        const message={
          id,
          roomId:room.id,
          userId:auth.user.id,
          authorName:auth.user.name || auth.user.email?.split('@')[0] || 'One2OneLove Member',
          authorAvatar:'',
          content,
          replyToId:null,
          topicId:null,
          editedAt:null,
          createdAt,
        };
        const key=messageKey(room,id,createdAt);
        await Promise.all([
          env.MEDIA.put(key,JSON.stringify(message),{httpMetadata:{contentType:'application/json'}}),
          env.MEDIA.put(`prelaunch-chat/message-index/${id}.json`,JSON.stringify({key,roomId:room.id}),{httpMetadata:{contentType:'application/json'}}),
          touchPresence(env,room,auth.user.id),
        ]);
        return json({ok:true,message},201);
      }

      return fail('Method not allowed.',405,'method_not_allowed');
    }

    const presenceMatch=url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/presence$/i);
    if(presenceMatch && request.method==='POST'){
      if(!auth) return fail('Authentication required.',401,'unauthorized');
      const room=roomById(presenceMatch[1]);
      if(!room) return fail('Chat room not found.',404,'not_found');
      await touchPresence(env,room,auth.user.id);
      return json({ok:true});
    }

    const topicsMatch=url.pathname.match(/^\/api\/community-chat\/rooms\/([0-9a-f-]{36})\/topics$/i);
    if(topicsMatch){
      const room=roomById(topicsMatch[1]);
      if(!room) return fail('Chat room not found.',404,'not_found');
      if(request.method==='GET') return json({ok:true,topics:[]});
      return fail('Topic creation is disabled in the isolated prelaunch chat.',403,'prelaunch_topics_disabled');
    }

    const deleteMatch=url.pathname.match(/^\/api\/community-chat\/messages\/([0-9a-f-]{36})$/i);
    if(deleteMatch && request.method==='DELETE'){
      if(!auth) return fail('Authentication required.',401,'unauthorized');
      const found=await findMessage(env,deleteMatch[1]);
      if(!found) return fail('Message not found.',404,'not_found');
      if(String(found.message.userId)!==String(auth.user.id)) return fail('You can only delete your own message.',403,'forbidden');
      await Promise.all([
        env.MEDIA.delete(found.key),
        env.MEDIA.delete(`prelaunch-chat/message-index/${deleteMatch[1]}.json`),
      ]);
      return json({ok:true});
    }

    const reportMatch=url.pathname.match(/^\/api\/community-chat\/messages\/([0-9a-f-]{36})\/report$/i);
    if(reportMatch && request.method==='POST'){
      if(!auth) return fail('Authentication required.',401,'unauthorized');
      const found=await findMessage(env,reportMatch[1]);
      if(!found) return fail('Message not found.',404,'not_found');
      const body=await request.json().catch(()=>({}));
      const reason=String(body?.reason||'').trim();
      if(reason.length<3) return fail('Please provide a reason for the report.');
      await env.MEDIA.put(
        `prelaunch-chat/reports/${reportMatch[1]}/${auth.user.id}.json`,
        JSON.stringify({messageId:reportMatch[1],reporterId:auth.user.id,reportedUserId:found.message.userId,reason:reason.slice(0,500),createdAt:new Date().toISOString()}),
        {httpMetadata:{contentType:'application/json'}}
      );
      return json({ok:true});
    }

    const muteMatch=url.pathname.match(/^\/api\/community-chat\/users\/([0-9a-f-]{36})\/mute$/i);
    if(muteMatch){
      if(!auth) return fail('Authentication required.',401,'unauthorized');
      const targetId=muteMatch[1];
      const key=`prelaunch-chat/mutes/${auth.user.id}/${targetId}`;
      if(request.method==='POST'){
        await env.MEDIA.put(key,'1',{httpMetadata:{contentType:'text/plain'}});
        return json({ok:true});
      }
      if(request.method==='DELETE'){
        await env.MEDIA.delete(key);
        return json({ok:true});
      }
      return fail('Method not allowed.',405,'method_not_allowed');
    }

    return fail('Community chat route not found.',404,'not_found');
  }catch(error){
    console.error('Isolated prelaunch chat error',error);
    return fail(error?.message||'Chat is temporarily unavailable.',500,'chat_error');
  }
}
