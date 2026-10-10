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
  credit:{id:'00000000-0000-4000-8000-000000000102',email:'credit.qa@example.invalid',name:'Credit QA',role:'user'},
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
  await context.route('**/api/tokens/wallet',r=>fulfill(r,200,{ok:true,wallet:{balance:mode==='credit'?500:0},featurePrices:[
    {feature_code:'bianca_response',label:'Bianca reply',token_cost:29,pricing_unit:'reply',active:true},
    {feature_code:'amora_response',label:'Amora reply',token_cost:29,pricing_unit:'reply',active:true},
    {feature_code:'like_minded_session',label:'Like Minded session',token_cost:199,pricing_unit:'session',active:true},
    {feature_code:'love_note_send',label:'Love Note SMS',token_cost:29,pricing_unit:'send',active:true},
    {feature_code:'date_idea_unlock',label:'Date Idea unlock',token_cost:49,pricing_unit:'unlock',active:true},
    {feature_code:'podcast_episode_unlock',label:'Podcast episode',token_cost:99,pricing_unit:'episode',active:true}
  ],packages:[
    {code:'credit_5',label:'Add $5 Credit',tokens:500,amount_cents:500,active:true,calibration_only:false},
    {code:'credit_10',label:'Add $10 Credit',tokens:1000,amount_cents:1000,active:true,calibration_only:false},
    {code:'credit_15',label:'Add $15 Credit',tokens:1500,amount_cents:1500,active:true,calibration_only:false},
    {code:'credit_20',label:'Add $20 Credit',tokens:2000,amount_cents:2000,active:true,calibration_only:false}
  ],transactions:[],settings:{payment_method_saved:false,enabled:false,package_code:'credit_10',trigger_balance:500,monthly_cap_cents:5000,consent_at:null},credit:{currency:'Credit',unit:'USD_CENTS'}}));
  await context.route('**/api/tokens/packages',r=>fulfill(r,200,{ok:true,packages:[
    {code:'credit_5',label:'Add $5 Credit',amount_cents:500,tokens:500,active:true,calibration_only:false},
    {code:'credit_10',label:'Add $10 Credit',amount_cents:1000,tokens:1000,active:true,calibration_only:false},
    {code:'credit_15',label:'Add $15 Credit',amount_cents:1500,tokens:1500,active:true,calibration_only:false},
    {code:'credit_20',label:'Add $20 Credit',amount_cents:2000,tokens:2000,active:true,calibration_only:false}
  ]}));
  await context.route('**/api/tokens/unlocks**',r=>fulfill(r,200,{ok:true,unlocks:[]}));
  await context.route('**/api/studio/episodes',r=>fulfill(r,200,{ok:true,episodes:[
    {id:'season-1-episode-2',season:1,episode:2,title:'Who Pays for the First Date?',canWatch:false,publicAvailable:false,memberAvailable:false,publicAvailableAt:'2026-10-16T22:00:00Z',mediaPath:null,chatRoom:'studio-who-pays-for-the-first-date',posterPath:'/assets/o2ol-hero.png'},
    {id:'season-1-episode-1',season:1,episode:1,title:'Who Should Apologize First?',canWatch:true,publicAvailable:true,memberAvailable:false,publicAvailableAt:'2026-10-10T00:00:00Z',mediaPath:'/studio-media/season-1-episode-1.mp4',chatRoom:'studio-who-should-apologize-first',posterPath:'/assets/o2ol-studio-bianca-card.webp'}
  ]}));
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

async function open(browser,path,{mode=null,viewport={width:1440,height:900},language='en'}={}){
  const context=await browser.newContext({viewport});
  await context.addInitScript(lang=>localStorage.setItem('preferredLanguage',lang),language);
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
    if(/CREDIT PER REPLY/i.test(body)) pass('Homepage uses Credit Amora copy');
    else fail('Homepage Credit Amora copy missing');
    if(/Season 1\s*•\s*Episode 1/i.test(body)&&/Who Should Apologize First\?/i.test(body)&&/Watch Episode 1/i.test(body)) pass('Homepage Studio shows current free Episode 1');
    else fail('Homepage Studio copy is incorrect',body.slice(-2200));
    const studioVideo=page.locator('video[data-home-studio-video="season-1-episode-1"]');
    const studioVideoSrc=await studioVideo.getAttribute('src').catch(()=>null);
    if(studioVideoSrc?.includes('/studio-media/season-1-episode-1.mp4')) pass('Homepage embeds free Episode 1 video');
    else fail('Homepage Episode 1 video missing',String(studioVideoSrc));
    const studioFeature=page.locator('[data-analytics-id="home-studio-feature"]');
    const studioDestination=await studioFeature.getAttribute('data-analytics-destination').catch(()=>null);
    if(studioDestination==='/O2OLStudio?episode=season-1-episode-1') pass('Homepage Watch Episode 1 targets Episode 1');
    else fail('Homepage Watch Episode 1 target incorrect',String(studioDestination));
    const freeEntries=page.locator('#open-house-tools [data-feature-status="free"]');
    const mixedEntries=page.locator('#open-house-tools [data-feature-status="mixed"]');
    const lockedEntries=page.locator('#open-house-tools [data-feature-status="locked"]');
    if(await freeEntries.count()===5) pass('Home groups five free-at-core feature entries first'); else fail('Home FREE entry grouping mismatch',String(await freeEntries.count()));
    if(await mixedEntries.count()===4) pass('Mixed feature entries carry no FREE/lock corner status'); else fail('Home mixed entry grouping mismatch',String(await mixedEntries.count()));
    if(await lockedEntries.count()===5) pass('Priced Home entry points carry lock status'); else fail('Home locked entry marker mismatch',String(await lockedEntries.count()));
    const freeBadgeCount=await page.locator('#open-house-tools [data-feature-status="free"] span').filter({hasText:/^FREE$/}).count();
    if(freeBadgeCount===5) pass('Free Home entry points show yellow FREE badges'); else fail('FREE badge count mismatch',String(freeBadgeCount));
    const amora=page.locator('img[src*="amora-relationship-coach-official.webp"]').first();
    if(await amora.count()){
      const size=await amora.evaluate(i=>({w:i.naturalWidth,h:i.naturalHeight}));
      if(size.w>0&&size.h>0) pass('Approved Amora portrait renders'); else fail('Approved Amora portrait broken',JSON.stringify(size));
    }else fail('Approved Amora portrait missing');
    const action=page.locator('[data-desktop-action-trigger]');
    const actionDiagnostic=await page.evaluate(async()=>{
      const button=document.querySelector('[data-desktop-action-trigger]');
      const legacySummary=document.querySelector('summary[aria-controls="desktop-action-menu"]');
      const moduleScript=[...document.scripts].find(s=>s.type==='module'&&s.src);
      let bundleHasControlledMarker=null;
      try{
        if(moduleScript?.src){
          const js=await fetch(moduleScript.src,{cache:'no-store'}).then(r=>r.text());
          bundleHasControlledMarker=js.includes('data-desktop-action-trigger');
        }
      }catch{}
      return {
        controlledButtonCount:document.querySelectorAll('[data-desktop-action-trigger]').length,
        legacySummaryCount:document.querySelectorAll('summary[aria-controls="desktop-action-menu"]').length,
        scriptSrc:moduleScript?.src||null,
        controlledButtonVisible:button?Boolean(button.getClientRects().length):false,
        legacySummaryVisible:legacySummary?Boolean(legacySummary.getClientRects().length):false,
        bundleHasControlledMarker,
      };
    });
    console.log('ACTION_DIAGNOSTIC',JSON.stringify(actionDiagnostic));
    if(actionDiagnostic.controlledButtonCount){
      await action.click({timeout:8000});
      const desktopMenu=page.locator('#desktop-action-menu');
      const expanded=await action.getAttribute('aria-expanded');
      const menuVisible=await desktopMenu.isVisible().catch(()=>false);
      const loveNoteLinkVisible=await desktopMenu.getByRole('link',{name:/Send A Love Note/i}).isVisible().catch(()=>false);
      if(expanded==='true' && menuVisible && loveNoteLinkVisible) pass('Desktop Action menu opens by click'); else fail('Desktop Action menu did not open',JSON.stringify({...actionDiagnostic,expanded,menuVisible,loveNoteLinkVisible}));
    }else{
      fail('Desktop Action controlled button missing',JSON.stringify(actionDiagnostic));
    }
    await noBrokenImages(page,'home desktop');
    await noOverflow(page,'home desktop');
    await context.close();
  }

  // Real 404 and explanatory deferred route.
  {
    let x=await open(browser,'/this-page-does-not-exist');
    if((await x.page.locator('body').innerText()).includes('Page Not Found')) pass('Real 404 renders'); else fail('Real 404 missing');
    await x.context.close();
    x=await open(browser,'/Developer');
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
    if(/BUY TOKENS|O2OL Tokens|Tokens O2OL|Jetons O2OL|Token O2OL/i.test(body)) fail('Retired Token wording visible '+path);
    await noOverflow(page,'Registered Free '+path);
    await context.close();
  }

  // Credit member checks.
  for(const path of ['/Credit','/Amora','/LikeMinded','/MyMatchIQ/Bianca']){
    const {context,page}=await open(browser,path,{mode:'credit'});
    const body=await page.locator('body').innerText();
    if(/\bCredit\b|\bCrédito\b|\bCrédit\b|\bCredito\b/i.test(body)) pass('Credit member sees Credit model '+path);
    else fail('Credit wording missing '+path);
    if(/BUY TOKENS|O2OL Tokens|Tokens O2OL|Jetons O2OL|Token O2OL/i.test(body)) fail('Retired Token wording visible to Credit member '+path);
    await context.close();
  }

  // Credit purchase cards: four fixed dollar cards plus one Custom Amount card.
  {
    const {context,page}=await open(browser,'/Credit',{mode:'credit',viewport:{width:1440,height:1000}});
    const body=await page.locator('body').innerText();
    for(const amount of ['$5.00','$10.00','$15.00','$20.00']){
      if(body.includes(amount)) pass('Fixed Credit card '+amount); else fail('Fixed Credit card missing '+amount);
    }
    if(/Custom Amount/i.test(body)) pass('Custom Amount Credit card visible'); else fail('Custom Amount Credit card missing');
    const customInput=page.getByLabel('Amount ($)');
    if(await customInput.isVisible().catch(()=>false)) pass('Custom Credit amount input visible'); else fail('Custom Credit amount input missing');
    await noOverflow(page,'Credit five-card desktop');
    await context.close();
  }

  // Legacy Tokens URL is compatibility-only and must land on Credit.
  {
    const {context,page}=await open(browser,'/Tokens',{mode:'credit'});
    await page.waitForTimeout(150);
    if(new URL(page.url()).pathname==='/Credit') pass('Legacy Tokens URL redirects to Credit'); else fail('Legacy Tokens URL did not redirect',page.url());
    await context.close();
  }

  // Legal pages: all five launch languages must be 18+ and Credit-based.
  const legalLanguages=[
    ['en',/Adults 18 and Older|adults age 18 or older/i,/Credit/i,/October 9, 2026/i],
    ['es',/Adultos de 18 años o más/i,/Crédito/i,/9 de Octubre de 2026/i],
    ['fr',/Adultes de 18 ans et plus/i,/Crédit/i,/9 Octobre 2026/i],
    ['it',/Adulti di 18 anni o più/i,/Credito/i,/9 Ottobre 2026/i],
    ['de',/Erwachsene ab 18 Jahren/i,/Credit/i,/9\. Oktober 2026/i],
  ];
  for(const [language,adultPattern,creditPattern,datePattern] of legalLanguages){
    let x=await open(browser,'/TermsOfService',{language});
    let body=await x.page.locator('body').innerText();
    if(adultPattern.test(body) && creditPattern.test(body) && datePattern.test(body) && !/under 13|menores? de 13|moins de 13|minori di 13|unter 13/i.test(body)) pass('Terms 18+ Credit '+language);
    else fail('Terms legal mismatch '+language,body.slice(0,1200));
    await x.context.close();

    x=await open(browser,'/PrivacyPolicy',{language});
    body=await x.page.locator('body').innerText();
    if(/18/.test(body) && creditPattern.test(body) && /\$0\.00/.test(body) && datePattern.test(body) && !/under 13|menores? de 13|moins de 13|minori di 13|unter 13/i.test(body)) pass('Privacy 18+ Credit '+language);
    else fail('Privacy legal mismatch '+language,body.slice(0,1200));
    await x.context.close();
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
    if(memberText.includes('On Site Right Now')) pass('On Site Right Now visible'); else fail('On Site Right Now missing');
    const support=page.getByRole('button',{name:/Support & Reports/i});
    await support.click();
    await page.waitForTimeout(100);
    const supportText=await page.locator('body').innerText();
    if(supportText.includes('Example problem report')) pass('Admin support report queue visible'); else fail('Admin support queue missing');
    await context.close();
  }

  // Studio regression guard: Episode 2 is featured, Episode 1 deep-links to itself, and archive Watch actions stay episode-specific.
  {
    const {context,page}=await open(browser,'/O2OLStudio',{mode:'free'});
    const body=await page.locator('body').innerText();
    if(/media storage yet|staged for O2OL Studio/i.test(body)) fail('Studio staging copy visible'); else pass('Studio audience copy clean');
    if(/BUY TOKENS|O2OL Tokens|Tokens O2OL|Jetons O2OL|Token O2OL/i.test(body)) fail('Studio retired Token copy visible'); else pass('Studio Credit wording clean');
    if(/Who Pays for the First Date\?/i.test(body)&&/Episode 2/i.test(body)) pass('Studio Episode 2 featured'); else fail('Studio Episode 2 not featured',body.slice(0,1000));
    const archiveLink=page.getByRole('link',{name:/Previous Episodes/i});
    if(await archiveLink.isVisible().catch(()=>false)) pass('Studio Previous Episodes link visible'); else fail('Studio Previous Episodes link missing');
    await noOverflow(page,'Studio mobile',{});
    await context.close();
  }
  {
    const {context,page}=await open(browser,'/O2OLStudio?episode=season-1-episode-1',{mode:'free'});
    const body=await page.locator('body').innerText();
    if(/Who Should Apologize First\?/i.test(body)&&/Episode 1/i.test(body)&&!/Who Pays for the First Date\?/i.test(body)) pass('Episode 1 direct link stays on Episode 1');
    else fail('Episode 1 direct link routed to wrong episode',body.slice(0,1200));
    await context.close();
  }
  {
    const {context,page}=await open(browser,'/O2OLStudio/Episodes',{mode:'free'});
    const body=await page.locator('body').innerText();
    if(body.includes('Previous Episodes')&&body.includes('Who Pays for the First Date?')&&body.includes('Who Should Apologize First?')) pass('Studio archive lists Episodes 1 and 2');
    else fail('Studio archive episode list incomplete',body.slice(0,1400));
    const ep1Link=page.getByRole('link',{name:/Watch Episode 1/i}).first();
    const ep1Href=await ep1Link.getAttribute('href').catch(()=>null);
    if(ep1Href?.includes('episode=season-1-episode-1')) pass('Episode 1 archive link targets Episode 1');
    else fail('Episode 1 archive link target missing',String(ep1Href));
    await noOverflow(page,'Studio archive mobile',{});
    await context.close();
  }
} finally {
  await browser.close();
}

const report={passed:passed.length,failed:failures.length,checks:passed,failures};
console.log(JSON.stringify(report,null,2));
if(failures.length) process.exit(1);
