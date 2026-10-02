
import { chromium } from 'playwright-core';

const BASE=(process.env.PREVIEW_URL||'').replace(/\/$/,'');
const CHROME=process.env.CHROME_BIN;
if(!BASE||!CHROME) throw new Error('PREVIEW_URL and CHROME_BIN are required');

const ACTIVE=[
'/','/Home','/AboutUs','/SignIn','/login','/SignUp','/signup','/AdminAccess','/Admin',
'/MemoryLane','/LoveNotes','/SendCredits','/CoupleSupport','/LoveLanguageQuiz','/DateIdeas',
'/Profile','/Invite','/PodcastsSupport','/ArticlesSupport','/RelationshipQuizzes','/AnniversaryTracker',
'/ForgotPassword','/Dashboard','/Community','/RelationshipMilestones','/RelationshipGoals',
'/CommunicationPractice','/CouplesProfile','/CoupleActivities','/CooperativeGames','/WhatShouldTheyDo',
'/Games','/ScratchGame','/LikeMinded','/SharedJournals','/CouplesDashboard','/CouplesCalendar',
'/LGBTQSupport','/HelpCenter','/ContactUs','/PrivacyPolicy','/TermsOfService','/Reviews','/LeaveReview',
'/Suggestions','/Chat','/PaymentSuccess','/payment-success','/Subscription','/VerifyPhone',
'/Professionals','/ProfessionalSignup','/TherapistSignup','/InfluencerSignup','/O2OLStudio',
'/MyMatchIQ','/MyMatchIQ/Meet','/MyMatchIQ/Assessment','/MyMatchIQ/Passport','/MyMatchIQ/Bianca',
'/MyMatchIQ/Credits','/MyMatchIQ/Actions','/MyMatchIQ/Dashboard','/MyMatchIQ/Invite',
'/MyMatchIQ/SignIn','/MyMatchIQ/SignUp','/MyMatchIQ/Subscription'
];

const PUBLIC=[
'/','/Home','/AboutUs','/SignIn','/login','/SignUp','/signup','/ForgotPassword','/Invite','/HelpCenter',
'/ContactUs','/PrivacyPolicy','/TermsOfService','/Reviews','/LeaveReview','/Suggestions','/Subscription',
'/DateIdeas','/LoveNotes','/LoveLanguageQuiz','/MemoryLane','/PodcastsSupport','/RelationshipQuizzes',
'/RelationshipMilestones','/RelationshipGoals','/CommunicationPractice','/CoupleSupport','/ArticlesSupport',
'/CoupleActivities','/CooperativeGames','/WhatShouldTheyDo','/Games','/ScratchGame','/LikeMinded',
'/SharedJournals','/CouplesCalendar','/LGBTQSupport','/Chat','/Community','/Professionals',
'/ProfessionalSignup','/TherapistSignup','/InfluencerSignup','/O2OLStudio','/MyMatchIQ',
'/MyMatchIQ/Meet','/MyMatchIQ/Assessment','/MyMatchIQ/Passport','/MyMatchIQ/Bianca',
'/MyMatchIQ/Credits','/MyMatchIQ/Actions','/MyMatchIQ/Dashboard','/MyMatchIQ/Invite',
'/MyMatchIQ/SignIn','/MyMatchIQ/SignUp','/MyMatchIQ/Subscription'
];

const DEFERRED={
'/WinACruise':'/Home','/CounselingSupport':'/CoupleSupport','/InfluencersSupport':'/CoupleSupport',
'/AIContentCreator':'/Home','/RelationshipCoach':'/CoupleSupport','/Meditation':'/CoupleSupport',
'/Developer':'/Home','/Leaderboard':'/Home','/Achievements':'/Home','/PremiumFeatures':'/Subscription',
'/FindFriends':'/Community','/FriendRequests':'/Community','/Blog':'/ArticlesSupport'
};
const KNOWN=new Set(ACTIVE.concat(Object.keys(DEFERRED)).map(x=>x.toLowerCase()));
const failures=[];
const report={anonymousDesktop:0,anonymousAndroid:0,memberDesktop:0,memberAndroid:0,deferred:0,links:0,tabs:0,tasks:[],failures};
const qaUser={id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',emailVerified:true,name:'QA Member',role:'user',phoneNumberVerified:true};
const qaProfile={id:qaUser.id,email:qaUser.email,name:'QA Member',role:'user',user_type:'regular',city:'Houston',country:'US',preferred_language:'en',subscription_plan:'Exclusive',subscription_status:'active',stripe_subscription_id:'sub_qa',phone_number_verified:true,phoneNumberVerified:true,phone_verification_required:true};

function fail(kind,details){ failures.push(Object.assign({kind},details||{})); }
function fulfill(route,status,body){ return route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)}); }

async function addMemberMocks(context,writes){
  writes=writes||[];
  await context.route('**/api/auth/get-session',r=>fulfill(r,200,{user:qaUser,session:{id:'qa-session',userId:qaUser.id}}));
  await context.route('**/api/profile',r=>{
    if(r.request().method()==='PATCH'){
      const body=r.request().postDataJSON()||{};
      writes.push({path:'/api/profile',method:'PATCH',body});
      return fulfill(r,200,{profile:Object.assign({},qaProfile,body)});
    }
    return fulfill(r,200,{profile:qaProfile});
  });
  await context.route('**/api/feature-usage',r=>fulfill(r,200,{ok:true}));
  await context.route('**/api/billing/founding-offer',r=>fulfill(r,200,{ok:true,offer:{available:true,existing:false,foundingNumber:1,cohort:'first100',plan:'Exclusive',freeDays:30,recurringPriceCents:1599,regularPriceCents:1999}}));
  await context.route('**/api/billing/config',r=>fulfill(r,200,{ok:true,plans:['Premiere','Exclusive'],founding_limit:200,founding_free_days:30,regular_prices_cents:{Premiere:999,Exclusive:1999}}));
  await context.route('**/api/reviews',r=>{
    if(r.request().method()==='POST'){
      const body=r.request().postDataJSON()||{};
      writes.push({path:'/api/reviews',method:'POST',body});
      return fulfill(r,200,{ok:true,review:Object.assign({id:'review-qa'},body)});
    }
    return fulfill(r,200,{ok:true,reviews:[]});
  });
  await context.route('**/api/suggestions/readiness',r=>fulfill(r,200,{ok:true,ready:true}));
  await context.route('**/api/suggestions',r=>{
    if(r.request().method()==='POST'){
      const body=r.request().postDataJSON()||{};
      writes.push({path:'/api/suggestions',method:'POST',body});
      return fulfill(r,200,{ok:true});
    }
    return r.continue();
  });
  await context.route('**/api/mymatchiq/**',r=>{
    const p=new URL(r.request().url()).pathname;
    if(r.request().method()!=='GET'){
      writes.push({path:p,method:r.request().method(),body:r.request().postDataJSON()||null});
      return fulfill(r,200,{ok:true});
    }
    if(p.endsWith('/access')) return fulfill(r,200,{ok:true,access:{tier:'Elite',source:'qa',grandfathered:false}});
    if(p.endsWith('/bianca/profile')) return fulfill(r,200,{ok:true,profile:{interaction_count:12,conversation_count:3,common_phrases:['you know'],context_depth_score:35}});
    if(p.endsWith('/bianca/conversations')) return fulfill(r,200,{ok:true,conversations:[]});
    if(p.endsWith('/bianca/reports')) return fulfill(r,200,{ok:true,reports:[]});
    if(p.includes('/assessment/sessions/latest')) return fulfill(r,200,{ok:true,session:null});
    if(p.includes('/credits/wallet')) return fulfill(r,200,{ok:true,wallet:{balance:0,auto_replenish_enabled:false}});
    if(p.includes('/members')) return fulfill(r,200,{ok:true,members:[],profile:null,invitations:[]});
    return fulfill(r,200,{ok:true});
  });
}

async function snap(page){
  return page.evaluate(()=>({
    text:(document.body?.innerText||'').replace(/\s+/g,' ').trim(),
    path:location.pathname,
    overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
    broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src).filter(Boolean),
    links:[...document.querySelectorAll('a[href]')].filter(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';
    }).map(el=>el.getAttribute('href')),
    unlabeled:[...document.querySelectorAll('button,[role="tab"]')].filter(el=>{
      const r=el.getBoundingClientRect(),s=getComputedStyle(el);
      if(r.width<=0||r.height<=0||s.display==='none'||s.visibility==='hidden') return false;
      const label=(el.getAttribute('aria-label')||el.innerText||el.textContent||el.getAttribute('title')||'').trim();
      return !label;
    }).length
  }));
}

async function crawl(browser,mode,routes,viewport,key){
  for(const route of routes){
    const context=await browser.newContext({viewport});
    await context.addInitScript(()=>localStorage.setItem('preferredLanguage','en'));
    if(mode==='member') await addMemberMocks(context,[]);
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e.message||e)));
    let response=null;
    try{
      response=await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForTimeout(700);
    }catch(e){errors.push(String(e.message||e));}
    const s=await snap(page).catch(()=>({text:'',path:'',overflow:0,broken:[],links:[],unlabeled:0}));
    if(!response||response.status()!==200) fail('route-status',{route,mode,status:response&&response.status()});
    if(s.text.length<20) fail('empty-page',{route,mode});
    if(s.overflow>12) fail('horizontal-overflow',{route,mode,pixels:s.overflow});
    if(s.broken.length) fail('broken-images',{route,mode,count:s.broken.length});
    if(errors.length) fail('pageerror',{route,mode,errors});
    if(s.unlabeled) fail('unlabeled-control',{route,mode,count:s.unlabeled});
    if(/undefined|\[object Object\]|NaN/.test(s.text)) fail('suspicious-rendered-text',{route,mode});
    if(mode==='anonymous'&&PUBLIC.includes(route)&&['/signin','/login'].includes(s.path.toLowerCase())) fail('unexpected-anonymous-gate',{route,final:s.path});
    if(mode==='member'&&!route.toLowerCase().startsWith('/admin')&&['/signin','/login'].includes(s.path.toLowerCase())) fail('unexpected-member-gate',{route,final:s.path});
    for(const href of s.links){
      let u; try{u=new URL(href,BASE);}catch{continue;}
      if(u.origin===new URL(BASE).origin&&!u.pathname.startsWith('/api/')&&!u.pathname.startsWith('/assets/')){
        report.links++;
        if(!KNOWN.has(u.pathname.toLowerCase())) fail('unknown-internal-link',{route,mode,href:u.pathname});
      }
    }
    const tabs=page.locator('[role="tab"]:visible');
    const count=await tabs.count().catch(()=>0);
    for(let i=0;i<count;i++){
      const t=tabs.nth(i); const label=(await t.getAttribute('aria-label'))||(await t.innerText().catch(()=>''))||String(i);
      try{await t.click({timeout:4000});await page.waitForTimeout(100);report.tabs++;}
      catch(e){fail('tab-click',{route,mode,label,error:String(e.message||e).slice(0,250)});}
    }
    report[key]++;
    await context.close();
  }
}

async function checkDeferred(browser){
  for(const route of Object.keys(DEFERRED)){
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(250);
    const actual=new URL(page.url()).pathname;
    if(actual.toLowerCase()!==DEFERRED[route].toLowerCase()) fail('deferred-redirect',{route,expected:DEFERRED[route],actual});
    report.deferred++;
    await context.close();
  }
}

async function taskOpenHouse(browser){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Explore Free/i}).first().click();
  await page.waitForTimeout(400);
  const visible=await page.locator('#open-house-tools').evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;});
  if(!visible) fail('task-open-house-explore');
  report.tasks.push('Open House Explore FREE');
  await context.close();
}

async function taskStudioBianca(browser){
  let context=await browser.newContext({viewport:{width:390,height:844}});
  let page=await context.newPage();
  await page.goto(BASE+'/O2OLStudio',{waitUntil:'domcontentloaded'});
  await page.getByRole('link',{name:/Enter Chat Room to Comment/i}).first().click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/chat'&&new URL(u).searchParams.get('room')==='studio-who-should-apologize-first',{timeout:8000});
  report.tasks.push('Studio to episode Chat');
  await context.close();

  context=await browser.newContext({viewport:{width:390,height:844}});
  await addMemberMocks(context,[]);
  page=await context.newPage();
  await page.goto(BASE+'/MyMatchIQ',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/CHAT with Bianca/i}).first().click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/mymatchiq/bianca',{timeout:8000});
  report.tasks.push('MyMatchIQ to Bianca');
  await context.close();
}

async function taskSuggestion(browser){
  const writes=[];
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('**/api/suggestions/readiness',r=>fulfill(r,200,{ok:true,ready:true}));
  await context.route('**/api/suggestions',r=>{
    if(r.request().method()==='POST'){writes.push(r.request().postDataJSON()||{});return fulfill(r,200,{ok:true});}
    return r.continue();
  });
  const page=await context.newPage();
  await page.goto(BASE+'/Suggestions',{waitUntil:'domcontentloaded'});
  await page.locator('#suggestion-name').fill('QA User');
  await page.locator('#suggestion-email').fill('qa@example.invalid');
  await page.locator('#suggestion-text').fill('QA verifies suggestion execution from form to request.');
  await page.getByRole('button',{name:/Submit Suggestion/i}).click();
  await page.waitForTimeout(200);
  if(writes.length!==1) fail('task-suggestion-submit',{writes});
  report.tasks.push('Suggestion submit');
  await context.close();
}

async function taskReview(browser){
  const writes=[];
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await addMemberMocks(context,writes);
  const page=await context.newPage();
  await page.goto(BASE+'/LeaveReview',{waitUntil:'domcontentloaded'});
  const five=page.getByRole('button',{name:'5 stars'}).first();
  await five.waitFor({state:'visible',timeout:8000});
  await five.click();
  await page.locator('#review-text').fill('QA review submission verifies task execution payload.');
  await page.getByRole('button',{name:/Submit Review/i}).click();
  await page.waitForTimeout(200);
  const hit=writes.find(x=>x.path==='/api/reviews');
  if(!hit) fail('task-review-submit',{writes});
  report.tasks.push('Review submit');
  await context.close();
}

async function taskProfile(browser){
  const writes=[];
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await addMemberMocks(context,writes);
  await context.route('**/api/memories**',r=>fulfill(r,200,{memories:[]}));
  await context.route('**/api/goals**',r=>fulfill(r,200,{goals:[]}));
  const page=await context.newPage();
  await page.goto(BASE+'/Profile',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Edit Profile/i}).first().click();
  await page.locator('[aria-labelledby="profile-location-label"]').first().fill('Houston QA');
  await page.getByRole('button',{name:/Save Changes/i}).click();
  await page.waitForTimeout(250);
  const hit=writes.find(x=>x.path==='/api/profile'&&x.method==='PATCH'&&x.body?.location==='Houston QA');
  if(!hit) fail('task-profile-save',{writes});
  report.tasks.push('Profile save');
  await context.close();
}

async function taskChat(browser){
  const writes=[];
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await addMemberMocks(context,writes);
  await context.route('**/api/community-chat/rooms',r=>fulfill(r,200,{ok:true,rooms:[{id:'10000000-0000-4000-8000-000000000007',slug:'studio-who-should-apologize-first',name:'O2OL Studio — Who Should Apologize First?',description:'Episode discussion',icon:'🎬',online_count:1,message_count:0}]}));
  await context.route('**/api/community-chat/rooms/**',r=>{
    const pth=new URL(r.request().url()).pathname;
    if(r.request().method()==='GET') return fulfill(r,200,pth.endsWith('/topics')?{ok:true,topics:[]}:{ok:true,messages:[]});
    const body=r.request().postDataJSON()||{};
    writes.push({path:pth,method:r.request().method(),body});
    return fulfill(r,200,{ok:true,message:{id:'msg-qa',content:body.content||'',authorName:'QA Member',createdAt:new Date().toISOString()}});
  });
  const page=await context.newPage();
  await page.goto(BASE+'/Chat?room=studio-who-should-apologize-first&from=studio',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(350);
  await page.locator('textarea[placeholder*="thought" i]').last().fill('QA chat post execution check');
  await page.getByRole('button',{name:/^Send$/i}).last().click();
  await page.waitForTimeout(250);
  const hit=writes.find(x=>x.method==='POST'&&x.path.endsWith('/messages')&&String(x.body?.content||'').includes('QA chat post'));
  if(!hit) fail('task-chat-post',{writes});
  report.tasks.push('Chat message post');
  await context.close();
}

async function taskMemory(browser){
  const writes=[];
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await addMemberMocks(context,writes);
  await context.route('**/api/memories**',r=>{
    const pth=new URL(r.request().url()).pathname, method=r.request().method();
    if(method==='GET') return fulfill(r,200,{memories:[]});
    const body=r.request().postDataJSON()||{};
    writes.push({path:pth,method,body});
    return fulfill(r,200,{memory:{id:'memory-qa',...body}});
  });
  const page=await context.newPage();
  await page.goto(BASE+'/MemoryLane',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Add New Memory/i}).first().click();
  await page.locator('#memory-title').fill('QA Memory');
  await page.locator('#memory-description').fill('QA validates memory creation from form to API request.');
  await page.getByRole('button',{name:/Save Memory/i}).click();
  await page.waitForTimeout(250);
  const hit=writes.find(x=>x.path==='/api/memories'&&x.method==='POST'&&x.body?.title==='QA Memory');
  if(!hit) fail('task-memory-create',{writes});
  report.tasks.push('Memory create');
  await context.close();
}

async function taskJournal(browser){
  const writes=[];
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await addMemberMocks(context,writes);
  await context.route('**/api/journals**',r=>{
    const pth=new URL(r.request().url()).pathname, method=r.request().method();
    if(method==='GET') return fulfill(r,200,{entries:[]});
    const body=r.request().postDataJSON()||{};
    writes.push({path:pth,method,body});
    return fulfill(r,200,{entry:{id:'journal-qa',...body}});
  });
  const page=await context.newPage();
  await page.goto(BASE+'/SharedJournals',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Add Entry/i}).first().click();
  await page.locator('#journal-title').fill('QA Journal');
  await page.locator('#journal-content').fill('QA validates journal creation from form to API request.');
  await page.getByRole('button',{name:/Save Entry/i}).click();
  await page.waitForTimeout(250);
  const hit=writes.find(x=>x.path==='/api/journals'&&x.method==='POST'&&x.body?.title==='QA Journal');
  if(!hit) fail('task-journal-create',{writes});
  report.tasks.push('Journal create');
  await context.close();
}

async function taskFounding(browser){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  let signedIn=false,phoneVerified=false;
  const captured={signup:null,billing:null};
  await context.route('**/api/billing/founding-offer',r=>fulfill(r,200,{ok:true,offer:{available:true,existing:false,foundingNumber:1,cohort:'first100',plan:'Exclusive',freeDays:30,recurringPriceCents:1599,regularPriceCents:1999}}));
  await context.route('**/api/launch-signup/readiness',r=>fulfill(r,200,{ok:true,readiness:{publicLaunchIdentityGateReady:true}}));
  await context.route('**/api/launch-signup',r=>{captured.signup=r.request().postDataJSON()||{};return fulfill(r,200,{ok:true,user:{id:'qa-new'},emailVerificationRequired:true,verificationMethod:'otp',verificationEmailExpected:true,profileReady:true});});
  await context.route('**/api/launch-signup/verify',r=>fulfill(r,200,{ok:true,verified:true,profileReady:true}));
  await context.route('**/api/auth/get-session',r=>fulfill(r,200,signedIn?{user:Object.assign({},qaUser,{phoneNumberVerified:phoneVerified}),session:{id:'qa-session'}}:{user:null,session:null}));
  await context.route('**/api/auth/sign-in/email',r=>{signedIn=true;return fulfill(r,200,{user:Object.assign({},qaUser,{phoneNumberVerified:false}),session:{id:'qa-session'}});});
  await context.route('**/api/profile',r=>fulfill(r,200,{profile:Object.assign({},qaProfile,{phone_number_verified:phoneVerified,phoneNumberVerified:phoneVerified,phone_verification_required:true})}));
  await context.route('**/api/phone-verification/send',r=>fulfill(r,200,{ok:true,sent:true}));
  await context.route('**/api/phone-verification/verify',r=>{phoneVerified=true;return fulfill(r,200,{ok:true,verified:true});});
  await context.route('**/api/billing/checkout',r=>{captured.billing=r.request().postDataJSON()||{};return fulfill(r,200,{ok:true,sessionId:'qa',url:BASE+'/PaymentSuccess?session_id=qa',plan:'Exclusive',founding:{number:1,cohort:'first100',freeDays:30,recurringPriceCents:1599}});});
  await context.route('**/api/billing/subscription',r=>fulfill(r,200,{ok:true,subscription:{subscription_plan:'Exclusive',subscription_status:'trialing',subscription_price:15.99,stripe_subscription_id:'sub_qa_founding',trial_end_date:'2026-11-01T00:00:00.000Z',founding_number:1,founding_cohort:'first100',founding_status:'active',founding_badge_retained:true,founding_rate_forfeited:false}}));

  const page=await context.newPage();
  await page.goto(BASE+'/Subscription',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Activate Founding Offer/i}).click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/signup'&&new URL(u).searchParams.get('founding')==='1',{timeout:8000});
  await page.getByRole('button',{name:/Individual Member/i}).click();
  await page.waitForURL(u=>new URL(u).searchParams.get('type')==='individual'&&new URL(u).searchParams.get('founding')==='1',{timeout:5000});
  await page.locator('#signup-full-name').fill('QA Founding User');
  await page.locator('#signup-email').fill('qa-founding@example.invalid');
  await page.locator('#signup-password').fill('QaPass123!');
  await page.locator('#signup-confirm-password').fill('QaPass123!');
  await page.locator('#signup-country').selectOption('US');
  await page.locator('#signup-language').selectOption('en');
  await page.getByRole('button',{name:/Read Full Terms of Service/i}).click();
  await page.locator('div').evaluateAll(nodes=>{const el=nodes.find(n=>n.scrollHeight>n.clientHeight+100&&['auto','scroll'].includes(getComputedStyle(n).overflowY));if(el){el.scrollTop=el.scrollHeight;el.dispatchEvent(new Event('scroll',{bubbles:true}));}});
  await page.waitForTimeout(150);
  await page.getByRole('button',{name:/I Am 18\+ and Accept the Terms of Service/i}).click();
  await page.getByRole('button',{name:/Create Account/i}).click();
  await page.getByText(/Verify Your Email/i).waitFor({state:'visible',timeout:5000});
  if(captured.signup?.termsVersion!=='2026-10-02'||captured.signup?.selectedPlan!=='Exclusive') fail('task-founding-signup-payload',{payload:captured.signup});
  await page.locator('input[inputmode="numeric"]').first().fill('123456');
  await page.getByRole('button',{name:/Verify Email/i}).click();
  await page.getByText(/Email Verified/i).waitFor({state:'visible',timeout:5000});
  await page.getByRole('button',{name:/Go to Sign In/i}).click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/signin'&&new URL(u).searchParams.get('redirect')==='/Subscription?founding=1',{timeout:5000});
  await page.locator('#signin-email').fill('qa-founding@example.invalid');
  await page.locator('#signin-password').fill('QaPass123!');
  await page.getByRole('button',{name:/^Sign In$/i}).click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/verifyphone'&&new URL(u).searchParams.get('redirect')==='/Subscription?founding=1',{timeout:8000});
  await page.locator('input[type="tel"]').first().fill('+17135550123');
  await page.getByRole('button',{name:/Send.*Code|Send/i}).first().click();
  await page.locator('input[inputmode="numeric"]').first().fill('123456');
  await page.getByRole('button',{name:/Verify/i}).last().click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/subscription'&&new URL(u).searchParams.get('founding')==='1',{timeout:8000});
  await page.getByRole('button',{name:/Activate Founding Offer/i}).click();
  await page.waitForURL(u=>new URL(u).pathname.toLowerCase()==='/paymentsuccess',{timeout:8000});
  await page.getByText(/Founding Member Free Period Activated/i).waitFor({state:'visible',timeout:8000});
  if(captured.billing?.founding!==true||captured.billing?.planName!=='Exclusive') fail('task-founding-checkout-payload',{payload:captured.billing});
  report.tasks.push('Founding signup + email + phone + checkout');
  await context.close();
}

const browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox']});
try{
  await crawl(browser,'anonymous',PUBLIC,{width:1440,height:900},'anonymousDesktop');
  await crawl(browser,'anonymous',PUBLIC,{width:390,height:844},'anonymousAndroid');
  const memberRoutes=ACTIVE.filter(r=>!r.toLowerCase().startsWith('/admin'));
  await crawl(browser,'member',memberRoutes,{width:1440,height:900},'memberDesktop');
  await crawl(browser,'member',memberRoutes,{width:390,height:844},'memberAndroid');
  await checkDeferred(browser);
  await taskOpenHouse(browser);
  await taskStudioBianca(browser);
  await taskSuggestion(browser);
  await taskReview(browser);
  await taskProfile(browser);
  await taskChat(browser);
  await taskMemory(browser);
  await taskJournal(browser);
  await taskFounding(browser);
} finally { await browser.close(); }

console.log(JSON.stringify(report,null,2));
if(failures.length) process.exit(1);
console.log('O2OL_RELEASE_CANDIDATE_CERTIFICATION=PASS');
