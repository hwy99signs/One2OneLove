import { chromium } from 'playwright-core';

const BASE=String(process.env.PREVIEW_URL||'').replace(/\/$/,'');
const CHROME=process.env.CHROME_BIN;
if(!BASE||!CHROME) throw new Error('PREVIEW_URL and CHROME_BIN are required');

const failures=[];
const passed=[];
const fail=(name,details='')=>failures.push({name,details:String(details||'')});
const pass=name=>passed.push(name);
const fulfill=(route,status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});

const USERS={
  free:{id:'00000000-0000-4000-8000-000000000101',email:'free.qa@example.invalid',name:'Free QA',role:'user'},
  token:{id:'00000000-0000-4000-8000-000000000102',email:'token.qa@example.invalid',name:'Token QA',role:'user'},
  admin:{id:'00000000-0000-4000-8000-000000000103',email:'admin.qa@example.invalid',name:'Admin QA',role:'admin'},
};

async function installMocks(context,mode){
  const user=USERS[mode]||null;
  if(user){
    await context.route('**/api/auth/get-session',r=>fulfill(r,200,{user:{...user,emailVerified:true},session:{id:'qa-session-'+mode,userId:user.id}}));
    await context.route('**/api/profile',r=>fulfill(r,200,{profile:{
      ...user,user_type:'regular',is_active:true,is_verified:true,phone_number_verified:true,phoneNumberVerified:true,
      subscription_plan:'Free',subscription_status:'inactive',stripe_subscription_id:null,preferred_language:'en'
    }}));
  }
  await context.route('**/api/feature-usage',r=>fulfill(r,200,{ok:true}));
  await context.route('**/api/tokens/wallet',r=>fulfill(r,200,{ok:true,wallet:{balance:mode==='token'?50:0},featurePrices:[
    {feature_code:'bianca_response',token_cost:1},{feature_code:'amora_response',token_cost:1},
    {feature_code:'like_minded_session',token_cost:2},{feature_code:'love_note_send',token_cost:1},{feature_code:'date_idea_unlock',token_cost:1}
  ],settings:{payment_method_saved:false}}));
  await context.route('**/api/tokens/packages',r=>fulfill(r,200,{ok:true,packages:[
    {package_code:'starter',name:'Starter',price_cents:499,tokens:50,bonus_tokens:0,active:true},
    {package_code:'plus',name:'Plus',price_cents:999,tokens:110,bonus_tokens:10,active:true},
    {package_code:'max',name:'Max',price_cents:1999,tokens:250,bonus_tokens:50,active:true}
  ]}));
  await context.route('**/api/tokens/unlocks**',r=>fulfill(r,200,{ok:true,unlocks:[]}));
  await context.route('**/api/studio/episodes',r=>fulfill(r,200,{ok:true,episodes:[{
    id:'episode-1',title:'Who Should Apologize First?',canWatch:false,publicAvailable:false,memberAvailable:false,
    publicAvailableAt:'2026-10-16T12:00:00Z',mediaPath:'/studio-media/season-1-episode-1.mp4'
  }]}));
  await context.route('**/api/mymatchiq/**',r=>{
    const p=new URL(r.request().url()).pathname;
    if(p.endsWith('/bianca/profile')) return fulfill(r,200,{ok:true,profile:{interaction_count:3,conversation_count:1,common_phrases:[],context_depth_score:25}});
    if(p.endsWith('/bianca/conversations')) return fulfill(r,200,{ok:true,conversations:[]});
    if(p.endsWith('/bianca/reports')) return fulfill(r,200,{ok:true,reports:[]});
    if(p.includes('/assessment/sessions/latest')) return fulfill(r,200,{ok:true,session:null});
    if(p.includes('/members')) return fulfill(r,200,{ok:true,members:[],profile:null,invitations:[]});
    return fulfill(r,200,{ok:true});
  });
  await context.route('**/api/community-chat/rooms',r=>fulfill(r,200,{ok:true,rooms:[{
    id:'10000000-0000-4000-8000-000000000001',slug:'general-connection',name:'General Connection',description:'Relationship conversation',icon:'💬',online_count:0,message_count:0
  }]}));
  await context.route('**/api/community-chat/rooms/**',r=>fulfill(r,200,{ok:true,messages:[],topics:[]}));
  await context.route('**/api/suggestions/readiness',r=>fulfill(r,200,{ok:true,ready:true}));
  await context.route('**/api/suggestions',r=>r.request().method()==='POST'?fulfill(r,200,{ok:true}):fulfill(r,200,{ok:true}));
  if(mode==='admin'){
    await context.route('**/api/admin/mfa/status',r=>fulfill(r,200,{ok:true,verified:true}));
    await context.route('**/api/admin/mfa/touch',r=>fulfill(r,200,{ok:true,verified:true}));
    await context.route('**/api/admin/dashboard**',r=>fulfill(r,200,{
      ok:true,summary:{users:{total:4,registered_free:3,pending_verification:2,new_7d:3,email_verified:4,phone_verified:2,verified:2,signups_today:0,signups_24h:0},plans:[],applications:{pending_total:0},moderation:{pending_total:0},payments:{recorded_payments:0,payments_this_month:0},loveNotes:{}},
      members:[],applications:[],moderation:[],billing:{payments:[],changes:[]},loveNotes:{recent:[]},
      featureUsage:{features:[],liveTracking:true,trackingMessage:'Tracking active.'},clickAnalytics:{summary:{},topRoutes:[],topFeatures:[],liveTracking:true,trackingMessage:'Tracking active.'},
      topFeatureActivity:{windows:[7,14,21,30]},chatRoom:{showVoting:{},conversations:[]},system:{aiUsage30d:[],authRoles:[],migrations:[]},
      visitorRegistry:{funnel:{total_visitors:12,online_now:2,anonymous_visitors:8,registered_free:3,token_buyers:1,paid_activity_cents:1999,promo_opt_ins:1},visitors:[]},
      supportFeedback:{summary:{total:2,new_count:1,bug_count:1},recent:[{id:'1',name:'QA',email:'qa@example.invalid',suggestion_type:'bug',suggestion:'Example problem report',status:'new',created_at:new Date().toISOString()}]}
    }));
    await context.route('**/api/admin/analytics**',r=>fulfill(r,200,{ok:true}));
  }
}

async function open(browser,path,{mode=null,viewport={width:1440,height:900}}={}){
  const context=await browser.newContext({viewport});
  await context.addInitScript(()=>localStorage.setItem('preferredLanguage','en'));
  await installMocks(context,mode);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message||e)));
  const response=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(700);
  if(!response||response.status()!==200) fail('HTTP '+path,response?.status());
  if(errors.length) fail('Page error '+path,errors.join(' | '));
  return {context,page};
}

async function noOverflow(page,label){
  const amount=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
  if(amount>12) fail('Horizontal overflow '+label,amount+'px'); else pass('No horizontal overflow '+label);
}
async function noBrokenImages(page,label){
  const broken=await page.evaluate(()=>[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')));
  if(broken.length) fail('Broken images '+label,broken.join(', ')); else pass('Images render '+label);
}

const browser=await chromium.launch({executablePath:CHROME,headless:true,args:['--no-sandbox']});
try{
  // Anonymous desktop: homepage, Amora, Action menu.
  {
    const {context,page}=await open(browser,'/');
    const body=await page.locator('body').innerText();
    if(/CREDIT PER REPLY/i.test(body)) fail('Homepage Credit-era Amora copy');
    else pass('Homepage uses Token Amora copy');
    const amora=page.locator('img[src*="amora-relationship-coach-official.webp"]').first();
    if(await amora.count()){
      const size=await amora.evaluate(i=>({w:i.naturalWidth,h:i.naturalHeight}));
      if(size.w>0&&size.h>0) pass('Approved Amora portrait renders'); else fail('Approved Amora portrait broken',JSON.stringify(size));
    }else fail('Approved Amora portrait missing');
    const action=page.locator('summary[aria-controls="desktop-action-menu"]');
    await action.click();
    const desktopMenu=page.locator('#desktop-action-menu');
    if(await desktopMenu.isVisible().catch(()=>false) && await desktopMenu.getByText('Send A Love Note',{exact:true}).isVisible().catch(()=>false)) pass('Desktop Action menu opens by click'); else fail('Desktop Action menu did not open');
    await noBrokenImages(page,'home desktop');
    await noOverflow(page,'home desktop');
    await context.close();
  }

  // Real 404 and explanatory deferred route.
  {
    let x=await open(browser,'/this-page-does-not-exist');
    if((await x.page.locator('body').innerText()).includes('Page Not Found')) pass('Real 404 renders'); else fail('Real 404 missing');
    await x.context.close();
    x=await open(browser,'/WinACruise');
    if((await x.page.locator('body').innerText()).includes('This Feature Is Not Available Yet')) pass('Deferred route explains status'); else fail('Deferred route explanation missing');
    await x.context.close();
  }

  // Anonymous interactive feature must show lightweight account gate.
  {
    const {context,page}=await open(browser,'/LoveLanguageQuiz');
    await page.getByRole('heading',{name:/Create your free One2OneLove account/i}).waitFor({state:'visible',timeout:10000}).catch(()=>undefined);
    const quickControls=[
      ['Username','input[autocomplete="username"]'],
      ['Email','input[autocomplete="email"]'],
      ['Create password','input[autocomplete="new-password"]'],
    ];
    for(const [label,selector] of quickControls){
      if(await page.locator(selector).isVisible().catch(()=>false)) pass('Quick gate '+label); else fail('Quick gate missing '+label);
    }
    const promoLabel=page.locator('label').filter({hasText:/promotional emails/i}).first();
    const promoCheckbox=promoLabel.locator('input[type="checkbox"]');
    if(await promoLabel.isVisible().catch(()=>false) && await promoCheckbox.isVisible().catch(()=>false)) pass('Quick gate promotional-email choice'); else fail('Quick gate promo choice missing');
    await context.close();
  }

  // Mobile menu/action and no horizontal overflow.
  {
    const {context,page}=await open(browser,'/',{viewport:{width:390,height:844}});
    await noOverflow(page,'home mobile 390x844');
    const menu=page.getByRole('button',{name:/Open navigation menu/i}).first();
    await menu.click();
    const action=page.getByRole('button',{name:/Action/i}).last();
    await action.click();
    if(await page.getByText('Send A Love Note',{exact:true}).last().isVisible().catch(()=>false)) pass('Mobile Action menu opens'); else fail('Mobile Action menu did not open');
    await context.close();
  }

  // Registered Free user: interactive routes open with no card/subscription gate.
  for(const path of ['/LoveLanguageQuiz','/PodcastsSupport','/Amora','/DateIdeas','/LoveNotes','/LikeMinded','/MyMatchIQ/Bianca']){
    const {context,page}=await open(browser,path,{mode:'free',viewport:{width:390,height:844}});
    const body=await page.locator('body').innerText();
    if(/Create your free One2OneLove account/i.test(body)) fail('Registered Free unexpectedly gated '+path);
    else pass('Registered Free opens '+path);
    if(/\bCredit\b|\bCrédito\b|\bCrédit\b|\bCredito\b/i.test(body)) fail('Visible Credit wording '+path);
    await noOverflow(page,'Registered Free '+path);
    await context.close();
  }

  // Token member checks.
  for(const path of ['/Tokens','/Amora','/LikeMinded','/MyMatchIQ/Bianca']){
    const {context,page}=await open(browser,path,{mode:'token'});
    const body=await page.locator('body').innerText();
    if(/\bCredit\b|\bCrédito\b|\bCrédit\b|\bCredito\b/i.test(body)) fail('Token member sees Credit wording '+path);
    else pass('Token member sees Token model '+path);
    await context.close();
  }

  // Problem report is in-site and confirms receipt.
  {
    const {context,page}=await open(browser,'/Suggestions?mode=problem');
    if((await page.locator('body').innerText()).includes('Report a Problem')) pass('In-site problem report opens'); else fail('Problem report mode missing');
    await page.locator('#suggestion-name').fill('QA User');
    await page.locator('#suggestion-email').fill('qa@example.invalid');
    await page.locator('#suggestion-text').fill('QA problem report browser certification.');
    await page.getByRole('button',{name:/Submit Problem Report/i}).click();
    await page.waitForTimeout(150);
    if(await page.getByRole('status').isVisible().catch(()=>false)) pass('Problem report confirmation visible'); else fail('Problem report confirmation missing');
    await context.close();
  }

  // Admin role: MFA-protected UI, audience visibility, support queue.
  {
    const {context,page}=await open(browser,'/Admin',{mode:'admin'});
    const body=await page.locator('body').innerText();
    if(body.includes('Administrator activity is intentionally excluded')) pass('Admin exclusion rule visible'); else fail('Admin exclusion rule missing');
    const members=page.getByRole('button',{name:'Members',exact:true});
    await members.click();
    await page.waitForTimeout(100);
    const memberText=await page.locator('body').innerText();
    if(memberText.includes('On Site Now')) pass('On Site Now visible'); else fail('On Site Now missing');
    const support=page.getByRole('button',{name:/Support & Reports/i});
    await support.click();
    await page.waitForTimeout(100);
    const supportText=await page.locator('body').innerText();
    if(supportText.includes('Example problem report')) pass('Admin support report queue visible'); else fail('Admin support queue missing');
    await context.close();
  }

  // Studio source-facing UI has no staging/Credit language.
  {
    const {context,page}=await open(browser,'/O2OLStudio',{mode:'free'});
    const body=await page.locator('body').innerText();
    if(/media storage yet|staged for O2OL Studio/i.test(body)) fail('Studio staging copy visible'); else pass('Studio audience copy clean');
    if(/\bCredit\b|\bCrédito\b|\bCrédit\b|\bCredito\b/i.test(body)) fail('Studio Credit copy visible'); else pass('Studio Token wording clean');
    await noOverflow(page,'Studio mobile',{});
    await context.close();
  }
} finally {
  await browser.close();
}

const report={passed:passed.length,failed:failures.length,checks:passed,failures};
console.log(JSON.stringify(report,null,2));
if(failures.length) process.exit(1);
