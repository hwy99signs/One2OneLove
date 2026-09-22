import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = (process.env.PREVIEW_URL || 'https://one2onelove-prelaunch.hwy99signs.workers.dev').replace(/\/$/, '');
const OUT = path.join(process.cwd(), 'audit-artifacts');
fs.mkdirSync(OUT, { recursive: true });

const LANGS = {
  en: { home: 'We Start Where Dating Sites Stop.', signIn: 'Sign In' },
  es: { home: 'Comenzamos Donde Terminan los Sitios de Citas.', signIn: 'Iniciar Sesión' },
  fr: { home: 'Nous Commençons Là Où les Sites de Rencontres S’Arrêtent.', signIn: 'Se Connecter' },
  it: { home: 'Iniziamo Dove i Siti di Incontri Si Fermano.', signIn: 'Accedi' },
  de: { home: 'Wir Beginnen, Wo Dating-Seiten Aufhören.', signIn: 'Anmelden' }
};

const PUBLIC_ROUTES = [
  '/', '/Home', '/AboutUs', '/SignIn', '/login', '/SignUp', '/signup',
  '/ForgotPassword', '/Invite', '/HelpCenter', '/ContactUs', '/PrivacyPolicy',
  '/TermsOfService', '/Reviews', '/LeaveReview', '/Suggestions'
];

const PROTECTED_ROUTES = [
  '/MemoryLane','/LoveNotes','/SendCredits','/CoupleSupport','/LoveLanguageQuiz',
  '/DateIdeas','/Profile','/PodcastsSupport','/ArticlesSupport','/RelationshipQuizzes',
  '/AnniversaryTracker','/Dashboard','/Community','/RelationshipMilestones',
  '/RelationshipGoals','/CommunicationPractice','/CouplesProfile','/CoupleActivities',
  '/SharedJournals','/CouplesDashboard','/CouplesCalendar','/LGBTQSupport','/Chat',
  '/PaymentSuccess','/Subscription','/VerifyPhone','/AdminAccess','/Admin','/Analytics'
];

const MEMBER_ROUTES = PROTECTED_ROUTES.filter(function(route) {
  return !['/AdminAccess','/Admin','/Analytics'].includes(route);
});

const findings = [];
const observations = [];
function add(severity, kind, detail) {
  findings.push({ severity: severity, kind: kind, ...detail });
}
function normalizeText(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}
async function screenshot(page, label) {
  const safe = label.replace(/[^a-z0-9_-]+/gi, '_').slice(0,120);
  const file = path.join(OUT, safe + '.png');
  try { await page.screenshot({ path: file, fullPage: true }); return path.basename(file); } catch { return null; }
}

async function installAnonymousAuth(context) {
  await context.route('**/api/auth/get-session', async function(routeHandler) {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user:null, session:null })
    });
  });
}

async function installSyntheticMemberAuth(context) {
  const user = {
    id:'launch-qa-synthetic-user',
    email:'launch-qa@example.invalid',
    emailVerified:true,
    email_verified:true,
    name:'Launch QA',
    role:'user'
  };
  const profile = {
    id:user.id,
    email:user.email,
    name:user.name,
    role:'user',
    subscription_plan:'Exclusive',
    subscription_status:'active',
    subscription_price:19.99,
    stripe_customer_id:'cus_launch_qa_synthetic',
    stripe_subscription_id:'sub_launch_qa_synthetic',
    phone_number_verified:true,
    phoneNumberVerified:true,
    phone_verification_required:true,
    preferred_language:'en'
  };
  await context.route('**/api/auth/get-session', async function(routeHandler) {
    await routeHandler.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user:user, session:{ id:'launch-qa-synthetic-session', userId:user.id } })
    });
  });
  await context.route('**/api/profile', async function(routeHandler) {
    if (routeHandler.request().method() === 'GET') {
      await routeHandler.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ profile:profile })
      });
      return;
    }
    await routeHandler.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ error:{ code:'synthetic_qa_read_only', message:'Synthetic launch QA is read-only.' } })
    });
  });
}

const browser = await chromium.launch({ headless: true });
try {
  const api = await browser.newContext();
  const request = api.request;

  async function expectJson(route, check) {
    const response = await request.get(BASE + route, { timeout: 30000 });
    if (!response.ok()) {
      add('critical','api-status',{ route: route, status: response.status() });
      return;
    }
    let data;
    try { data = await response.json(); }
    catch {
      add('critical','api-json',{ route: route, message: 'Response was not valid JSON.' });
      return;
    }
    try { check(data); }
    catch (e) { add('critical','api-readiness',{ route: route, message: String(e.message || e) }); }
  }

  await expectJson('/api/health', function(data) {
    if (data.service !== 'one2onelove-api') throw new Error('Unexpected health service marker.');
  });
  await expectJson('/api/launch-readiness', function(data) {
    const r = data && data.readiness;
    if (!data || data.ok !== true || !r) throw new Error('Missing readiness payload.');
    if (r.database.requiredDatabaseReady !== true) throw new Error('Required database readiness is false.');
    if (r.identity.emailVerificationReady !== true) throw new Error('Email verification readiness is false.');
    if (r.identity.emailDeliveryReady !== true) throw new Error('Email delivery readiness is false.');
    if (r.identity.phoneVerificationProviderConfigured !== true) throw new Error('Twilio provider configuration is not visible to Prelaunch.');
    if (r.identity.phoneVerificationSchemaReady !== true) throw new Error('Phone verification schema readiness is false.');
    if (r.identity.phoneVerificationReady !== true) throw new Error('Phone verification readiness is false.');
    if (r.identity.requiredIdentityReady !== true) throw new Error('Required identity readiness is false.');
    if (r.billing.billingProviderReady !== true) throw new Error('Stripe billing readiness is false.');
    if (r.requiredLaunchReady !== true) throw new Error('Canonical requiredLaunchReady is false.');
  });
  await expectJson('/api/launch-signup/readiness', function(data) {
    const r = data && data.readiness;
    if (!data || data.ok !== true || !r) throw new Error('Missing signup readiness payload.');
    if (r.consentTableReady !== true) throw new Error('Signup consent storage is not ready.');
    if (r.emailVerificationReady !== true) throw new Error('Signup email verification is not ready.');
    if (r.phoneVerificationReady !== true) throw new Error('Signup phone verification is not ready.');
    if (r.publicLaunchIdentityGateReady !== true) throw new Error('Public launch identity gate is not ready.');
    if (r.billingDataReady !== true) throw new Error('Signup billing data is not ready.');
  });
  await expectJson('/api/suggestions/readiness', function(data) {
    if (!data || data.ok !== true || data.ready !== true) throw new Error('Suggestions storage is not launch-ready.');
  });
  await api.close();

  const englishMain = new Map();

  async function auditPage(route, lang, viewport, labelSuffix) {
    const context = await browser.newContext({ viewport: viewport });
    await installAnonymousAuth(context);
    await context.addInitScript(function(language) {
      try { localStorage.setItem('preferredLanguage', language); } catch {}
    }, lang);
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const clientErrors = [];
    const serverErrors = [];
    page.on('pageerror', function(err){ pageErrors.push(String(err && err.message || err)); });
    page.on('console', function(msg){ if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('response', function(res) {
      try {
        const u = new URL(res.url());
        if (u.origin === BASE && res.status() >= 400 && res.status() < 500) clientErrors.push({ url: u.pathname + u.search, status: res.status() });
        if (u.origin === BASE && res.status() >= 500) serverErrors.push({ url: u.pathname + u.search, status: res.status() });
      } catch {}
    });

    let response;
    try {
      response = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(550);
    } catch (e) {
      const shot = await screenshot(page, lang + '_' + route + '_' + labelSuffix + '_navigation');
      add('critical','navigation',{ route: route, lang: lang, viewport: labelSuffix, message: String(e.message || e), screenshot: shot });
      await context.close();
      return null;
    }

    if (!response || response.status() !== 200) add('critical','page-status',{ route: route, lang: lang, viewport: labelSuffix, status: response && response.status() });
    if (pageErrors.length) add('critical','pageerror',{ route: route, lang: lang, viewport: labelSuffix, errors: pageErrors, screenshot: await screenshot(page, lang + '_' + route + '_' + labelSuffix + '_pageerror') });
    if (clientErrors.length) add('critical','same-origin-4xx',{ route: route, lang: lang, viewport: labelSuffix, errors: clientErrors });
    if (serverErrors.length) add('critical','same-origin-5xx',{ route: route, lang: lang, viewport: labelSuffix, errors: serverErrors });
    if (consoleErrors.length) observations.push({ kind:'console-error', route:route, lang:lang, viewport:labelSuffix, messages:consoleErrors });

    const dom = await page.evaluate(function() {
      const visible = function(el) {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) !== 0 && r.width > 0 && r.height > 0;
      };
      const bodyText = (document.body && document.body.innerText || '').replace(/\s+/g,' ').trim();
      const mainText = (document.querySelector('main') && document.querySelector('main').innerText || '').replace(/\s+/g,' ').trim();
      const brokenImages = Array.from(document.images).filter(function(img){ return visible(img) && img.complete && img.naturalWidth === 0; }).map(function(img){ return img.getAttribute('src'); });
      const ids = Array.from(document.querySelectorAll('[id]')).map(function(el){ return el.id; }).filter(Boolean);
      const duplicateIds = ids.filter(function(id,i,a){ return a.indexOf(id) !== i; });
      const unnamedInteractive = Array.from(document.querySelectorAll('button,a[href]')).filter(visible).filter(function(el){
        const text=(el.innerText||'').trim();
        const aria=(el.getAttribute('aria-label')||'').trim();
        const title=(el.getAttribute('title')||'').trim();
        const alt=Array.from(el.querySelectorAll('img[alt]')).map(function(i){return i.alt;}).join(' ').trim();
        return !text && !aria && !title && !alt;
      }).length;
      const inputWithoutAccessibleName = Array.from(document.querySelectorAll('input,textarea,select')).filter(visible).filter(function(el){
        const aria=(el.getAttribute('aria-label')||'').trim();
        const labelled=el.getAttribute('aria-labelledby');
        const id=el.id;
        const associated=id && document.querySelector('label[for="' + CSS.escape(id) + '"]');
        const wrapped=el.closest('label');
        return !aria && !labelled && !associated && !wrapped;
      }).length;
      const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      const suspicious = ['undefined','[object Object]','NaN'].filter(function(x){ return bodyText.includes(x); });
      return { bodyText:bodyText, mainText:mainText, brokenImages:brokenImages, duplicateIds:Array.from(new Set(duplicateIds)), unnamedInteractive:unnamedInteractive, inputWithoutAccessibleName:inputWithoutAccessibleName, overflow:overflow, suspicious:suspicious, title:document.title };
    });

    if (dom.bodyText.length < 20) add('critical','empty-page',{ route:route, lang:lang, viewport:labelSuffix, textLength:dom.bodyText.length });
    if (dom.brokenImages.length) add('critical','broken-images',{ route:route, lang:lang, viewport:labelSuffix, images:dom.brokenImages, screenshot:await screenshot(page, lang + '_' + route + '_' + labelSuffix + '_broken_image') });
    if (dom.duplicateIds.length) add('warning','duplicate-ids',{ route:route, lang:lang, viewport:labelSuffix, ids:dom.duplicateIds });
    if (dom.unnamedInteractive) add('warning','unnamed-interactive',{ route:route, lang:lang, viewport:labelSuffix, count:dom.unnamedInteractive });
    if (dom.inputWithoutAccessibleName) add('warning','unlabelled-form-control',{ route:route, lang:lang, viewport:labelSuffix, count:dom.inputWithoutAccessibleName });
    if (dom.overflow > 4) add('critical','horizontal-overflow',{ route:route, lang:lang, viewport:labelSuffix, pixels:dom.overflow, screenshot:await screenshot(page, lang + '_' + route + '_' + labelSuffix + '_overflow') });
    if (dom.suspicious.length) add('critical','suspicious-render-text',{ route:route, lang:lang, viewport:labelSuffix, tokens:dom.suspicious });

    await context.close();
    return dom;
  }

  for (const route of PUBLIC_ROUTES) {
    const dom = await auditPage(route, 'en', { width: 1440, height: 1000 }, 'desktop');
    if (dom) englishMain.set(route, normalizeText(dom.mainText));
  }

  for (const lang of Object.keys(LANGS).filter(function(x){return x !== 'en';})) {
    for (const route of PUBLIC_ROUTES) {
      const dom = await auditPage(route, lang, { width: 1440, height: 1000 }, 'desktop');
      if (!dom) continue;
      const enText = englishMain.get(route) || '';
      const localized = normalizeText(dom.mainText);
      if (enText.length > 40 && localized === enText) add('critical','untranslated-main-content',{ route:route, lang:lang });
    }
  }

  for (const lang of Object.keys(LANGS)) {
    const context = await browser.newContext({ viewport:{ width:1440, height:1000 } });
    await installAnonymousAuth(context);
    await context.addInitScript(function(language){ localStorage.setItem('preferredLanguage', language); }, lang);
    const page = await context.newPage();
    await page.goto(BASE + '/Home', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(350);
    const text = normalizeText(await page.locator('main').innerText());
    if (!text.includes(LANGS[lang].home)) add('critical','home-language-anchor',{ lang:lang, expected:LANGS[lang].home });
    await page.goto(BASE + '/SignIn', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(250);
    const signText = normalizeText(await page.locator('main').innerText());
    if (!signText.includes(LANGS[lang].signIn)) add('critical','signin-language-anchor',{ lang:lang, expected:LANGS[lang].signIn });
    await context.close();
  }

  for (const route of PROTECTED_ROUTES) {
    const context = await browser.newContext({ viewport:{ width:1280, height:900 } });
    await context.addInitScript(function(){ localStorage.setItem('preferredLanguage','en'); });
    await installAnonymousAuth(context);
    const page = await context.newPage();
    try {
      const res = await page.goto(BASE + route, { waitUntil:'domcontentloaded', timeout:30000 });
      if (!res || res.status() !== 200) add('critical','protected-route-status',{ route:route, status:res && res.status() });
      await page.waitForURL(function(url) {
        return ['/signin','/login'].includes(url.pathname.toLowerCase());
      }, { timeout:8000 });
      const finalPath = new URL(page.url()).pathname.toLowerCase();
      if (!['/signin','/login'].includes(finalPath)) add('critical','protected-route-guard',{ route:route, finalPath:finalPath });
    } catch (e) {
      add('critical','protected-route-navigation',{ route:route, finalPath:new URL(page.url()).pathname.toLowerCase(), message:String(e.message || e) });
    }
    await context.close();
  }


  const memberRouteEnglish = new Map();
  for (const lang of Object.keys(LANGS)) {
    for (const route of MEMBER_ROUTES) {
      const context = await browser.newContext({ viewport:{ width:1366, height:900 } });
      await installSyntheticMemberAuth(context);
      await context.addInitScript(function(language){ localStorage.setItem('preferredLanguage', language); }, lang);
      const page = await context.newPage();
      const pageErrors = [];
      const serverErrors = [];
      page.on('pageerror', function(err){ pageErrors.push(String(err && err.message || err)); });
      page.on('response', function(res) {
        try {
          const u = new URL(res.url());
          if (u.origin === BASE && res.status() >= 500) serverErrors.push({ url:u.pathname, status:res.status() });
        } catch {}
      });
      try {
        const response = await page.goto(BASE + route, { waitUntil:'domcontentloaded', timeout:30000 });
        await page.waitForTimeout(800);
        if (!response || response.status() !== 200) add('critical','member-page-status',{ route:route, lang:lang, status:response && response.status() });
        const finalPath = new URL(page.url()).pathname.toLowerCase();
        const expectedRedirect = route === '/Dashboard' || route === '/VerifyPhone' ? '/profile' : null;
        if (expectedRedirect) {
          if (finalPath !== expectedRedirect) add('critical','member-route-unexpected-redirect',{ route:route, lang:lang, finalPath:finalPath, expected:expectedRedirect });
        } else if (route !== '/PaymentSuccess' && finalPath !== route.toLowerCase()) {
          add('critical','member-route-unexpected-redirect',{ route:route, lang:lang, finalPath:finalPath });
        }
        if (pageErrors.length) add('critical','member-pageerror',{ route:route, lang:lang, errors:pageErrors, screenshot:await screenshot(page, 'member_' + lang + '_' + route + '_pageerror') });
        if (serverErrors.length) add('critical','member-same-origin-5xx',{ route:route, lang:lang, errors:serverErrors });
        const dom = await page.evaluate(function() {
          const visible = function(el) {
            const s=getComputedStyle(el); const r=el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity || 1) !== 0 && r.width > 0 && r.height > 0;
          };
          const main=document.querySelector('main');
          const mainText=(main && main.innerText || '').replace(/\s+/g,' ').trim();
          const brokenImages=Array.from(document.images).filter(function(img){return visible(img) && img.complete && img.naturalWidth===0;}).map(function(img){return img.getAttribute('src');});
          const overflow=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth;
          const suspicious=['undefined','[object Object]','NaN'].filter(function(x){return mainText.includes(x);});
          return {mainText:mainText,brokenImages:brokenImages,overflow:overflow,suspicious:suspicious};
        });
        if (dom.mainText.length < 20) add('critical','member-empty-page',{ route:route, lang:lang, textLength:dom.mainText.length });
        if (/Loading your One2OneLove access/i.test(dom.mainText)) add('critical','member-auth-loading-stuck',{ route:route, lang:lang });
        if (dom.brokenImages.length) add('critical','member-broken-images',{ route:route, lang:lang, images:dom.brokenImages });
        if (dom.overflow > 4) add('critical','member-horizontal-overflow',{ route:route, lang:lang, pixels:dom.overflow, screenshot:await screenshot(page, 'member_' + lang + '_' + route + '_overflow') });
        if (dom.suspicious.length) add('critical','member-suspicious-render-text',{ route:route, lang:lang, tokens:dom.suspicious });

        // Safe interaction coverage: exercise visible tab controls without submitting forms
        // or invoking destructive/business actions.
        const tabs = page.getByRole('tab');
        const tabCount = await tabs.count();
        for (let tabIndex = 0; tabIndex < tabCount; tabIndex += 1) {
          const tab = tabs.nth(tabIndex);
          if (!(await tab.isVisible())) continue;
          const tabName = normalizeText(await tab.innerText());
          try {
            await tab.click();
            await page.waitForTimeout(100);
            const selected = await tab.getAttribute('aria-selected');
            if (selected !== null && selected !== 'true') {
              add('critical','member-tab-not-selected',{ route:route, lang:lang, tab:tabName, ariaSelected:selected });
            }
          } catch (e) {
            add('critical','member-tab-interaction',{ route:route, lang:lang, tab:tabName, message:String(e.message || e) });
          }
        }

        const normalized=normalizeText(dom.mainText);
        if (lang === 'en') memberRouteEnglish.set(route, normalized);
        else {
          const english=memberRouteEnglish.get(route) || '';
          if (english.length > 80 && normalized === english) add('critical','member-untranslated-main-content',{ route:route, lang:lang });
        }
      } catch (e) {
        add('critical','member-navigation',{ route:route, lang:lang, message:String(e.message || e) });
      }
      await context.close();
    }
  }

  // Full signed-in member mobile layout coverage (English). Five-language member
  // localization is validated above on desktop; this pass isolates responsive faults
  // across every member route without multiplying identical viewport checks.
  for (const route of MEMBER_ROUTES) {
    const context = await browser.newContext({ viewport:{ width:390, height:844 } });
    await installSyntheticMemberAuth(context);
    await context.addInitScript(function(){ localStorage.setItem('preferredLanguage','en'); });
    const page = await context.newPage();
    const pageErrors = [];
    const serverErrors = [];
    page.on('pageerror', function(err){ pageErrors.push(String(err && err.message || err)); });
    page.on('response', function(res) {
      try {
        const u = new URL(res.url());
        if (u.origin === BASE && res.status() >= 500) serverErrors.push({ url:u.pathname + u.search, status:res.status() });
      } catch {}
    });
    try {
      const response = await page.goto(BASE + route, { waitUntil:'domcontentloaded', timeout:30000 });
      await page.waitForTimeout(550);
      if (!response || response.status() !== 200) add('critical','member-mobile-status',{ route:route, status:response && response.status() });
      const finalPath = new URL(page.url()).pathname.toLowerCase();
      const expectedRedirect = route === '/Dashboard' || route === '/VerifyPhone' ? '/profile' : null;
      if (expectedRedirect ? finalPath !== expectedRedirect : (route !== '/PaymentSuccess' && finalPath !== route.toLowerCase())) {
        add('critical','member-mobile-redirect',{ route:route, finalPath:finalPath, expected:expectedRedirect || route.toLowerCase() });
      }
      if (pageErrors.length) add('critical','member-mobile-pageerror',{ route:route, errors:pageErrors });
      if (serverErrors.length) add('critical','member-mobile-5xx',{ route:route, errors:serverErrors });
      const layout = await page.evaluate(function() {
        const width=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-window.innerWidth;
        const text=(document.querySelector('main')?.innerText || '').replace(/\s+/g,' ').trim();
        const visible=function(el){const s=getComputedStyle(el);const r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
        const broken=Array.from(document.images).filter(function(img){return visible(img)&&img.complete&&img.naturalWidth===0;}).map(function(img){return img.getAttribute('src');});
        return { overflow:width, textLength:text.length, broken:broken };
      });
      if (layout.overflow > 4) add('critical','member-mobile-overflow',{ route:route, pixels:layout.overflow, screenshot:await screenshot(page,'member_mobile_' + route + '_overflow') });
      if (layout.textLength < 20 && !['/Dashboard','/VerifyPhone'].includes(route)) add('critical','member-mobile-empty',{ route:route, textLength:layout.textLength });
      if (layout.broken.length) add('critical','member-mobile-broken-images',{ route:route, images:layout.broken });
    } catch (e) {
      add('critical','member-mobile-navigation',{ route:route, message:String(e.message || e) });
    }
    await context.close();
  }

  for (const lang of Object.keys(LANGS)) {
    for (const route of ['/', '/SignIn', '/SignUp', '/HelpCenter', '/TermsOfService']) {
      await auditPage(route, lang, { width: 390, height: 844 }, 'mobile');
    }
  }

  {
    const context = await browser.newContext({ viewport:{ width:1440, height:1000 } });
    await installAnonymousAuth(context);
    const page = await context.newPage();
    await page.goto(BASE + '/Home', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(300);
    const combo = page.getByRole('combobox').first();
    if (await combo.count()) {
      await combo.click();
      await page.waitForTimeout(150);
      const options = page.getByRole('option');
      const optionTexts = await options.allTextContents();
      if (optionTexts.length !== 5) add('critical','language-picker-count',{ count:optionTexts.length, options:optionTexts });
      if (optionTexts.some(function(x){ return /Dutch|Portuguese|Nederlands|Português/i.test(x); })) add('critical','disabled-language-visible',{ options:optionTexts });
      const spanish = page.getByRole('option', { name:/Spanish|Español/i }).first();
      if (await spanish.count()) {
        await spanish.click();
        await page.waitForTimeout(250);
        const stored = await page.evaluate(function(){return localStorage.getItem('preferredLanguage');});
        const main = normalizeText(await page.locator('main').innerText());
        if (stored !== 'es' || !main.includes(LANGS.es.home)) add('critical','language-picker-persistence',{ stored:stored });
        await page.reload({ waitUntil:'domcontentloaded' });
        await page.waitForTimeout(250);
        const after = normalizeText(await page.locator('main').innerText());
        if (!after.includes(LANGS.es.home)) add('critical','language-picker-reload',{ message:'Spanish selection did not persist through reload.' });

        for (const code of ['fr','it','de','en','es']) {
          const languageNames = { fr:/French|Français/i, it:/Italian|Italiano/i, de:/German|Deutsch/i, en:/English/i, es:/Spanish|Español/i };
          const cycleCombo = page.getByRole('combobox').first();
          await cycleCombo.click();
          const option = page.getByRole('option', { name:languageNames[code] }).first();
          if (!(await option.count())) {
            add('critical','language-picker-cycle',{ code:code, message:'Language option missing during same-session cycle.' });
            continue;
          }
          await option.click();
          await page.waitForTimeout(250);
          const cycleStored = await page.evaluate(function(){ return localStorage.getItem('preferredLanguage'); });
          const cycleMain = normalizeText(await page.locator('main').innerText());
          if (cycleStored !== code || !cycleMain.includes(LANGS[code].home)) {
            add('critical','language-picker-cycle',{ code:code, stored:cycleStored, message:'Language did not switch correctly in the active session.' });
          }
        }
      } else add('critical','language-picker-option',{ message:'Spanish option was not selectable.' });
    } else add('critical','language-picker-missing',{ message:'No language combobox was found on Home.' });
    await context.close();
  }

  {
    const expectedPodcastLanguage = { en:'English', es:'Spanish', fr:'French', it:'Italian', de:'German' };
    const expectedDescriptionAnchor = {
      en:'Relationship education focused on marriage',
      es:'Conversaciones en español sobre patrones de relación',
      fr:'Une psychologue et thérapeute de couple explore',
      it:'Contenuti di terapia di coppia su tradimento',
      de:'Eine Psychologin und Paartherapeutin bietet praktische Impulse'
    };
    const expectedPodcastMarket = {
      en:'United States / English',
      es:'Hispanohablante / América Latina',
      fr:'France / Français',
      it:'Italia / Italiano',
      de:'Deutschland / Deutsch'
    };
    for (const lang of Object.keys(expectedPodcastLanguage)) {
      const context = await browser.newContext({ viewport:{ width:1366, height:900 } });
      await installSyntheticMemberAuth(context);
      await context.route('**/api/consents/adult-sensitive', async function(routeHandler) {
        await routeHandler.fulfill({
          status:200,
          contentType:'application/json',
          body:JSON.stringify({ consent:{
            consent_version:'2026-09-13-v1',
            age_18_plus:true,
            sensitive_content_acknowledged:true
          }})
        });
      });
      await context.addInitScript(function(language){ localStorage.setItem('preferredLanguage', language); }, lang);
      const page = await context.newPage();
      await page.goto(BASE + '/PodcastsSupport', { waitUntil:'domcontentloaded', timeout:30000 });
      await page.waitForTimeout(700);
      const expected = expectedPodcastLanguage[lang];
      const selectValue = await page.locator('#podcast-language').inputValue().catch(function(){ return null; });
      if (selectValue !== expected) add('critical','podcast-header-language-sync',{ lang:lang, expected:expected, actual:selectValue });
      const cards = page.locator('[data-podcast-card="true"]');
      const count = await cards.count();
      if (!count) add('critical','podcast-language-empty',{ lang:lang, expected:expected });
      for (let i=0;i<count;i+=1) {
        const actual = await cards.nth(i).getAttribute('data-podcast-language');
        if (actual !== expected) add('critical','podcast-language-mixed',{ lang:lang, expected:expected, actual:actual, index:i });
      }
      const mainText = normalizeText(await page.locator('main').last().innerText());
      if (!mainText.includes(expectedDescriptionAnchor[lang])) add('critical','podcast-card-description-language',{ lang:lang, expectedAnchor:expectedDescriptionAnchor[lang] });

      if (count) {
        await cards.first().click();
        const market = page.locator('[data-podcast-market="true"]');
        await market.waitFor({ state:'visible', timeout:5000 }).catch(function(){});
        const actualMarket = (await market.count()) ? normalizeText(await market.innerText()) : null;
        if (actualMarket !== expectedPodcastMarket[lang]) {
          add('critical','podcast-player-market-language',{ lang:lang, expected:expectedPodcastMarket[lang], actual:actualMarket });
        }
      }
      await context.close();
    }

    const context = await browser.newContext({ viewport:{ width:1366, height:900 } });
    await installSyntheticMemberAuth(context);
    await context.route('**/api/consents/adult-sensitive', async function(routeHandler) {
      await routeHandler.fulfill({
        status:200,
        contentType:'application/json',
        body:JSON.stringify({ consent:{
          consent_version:'2026-09-13-v1',
          age_18_plus:true,
          sensitive_content_acknowledged:true
        }})
      });
    });
    await context.addInitScript(function(){ localStorage.setItem('preferredLanguage','en'); });
    const page = await context.newPage();
    await page.goto(BASE + '/PodcastsSupport', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(600);
    await page.locator('#podcast-language').selectOption('Spanish');
    await page.waitForTimeout(400);
    const stored = await page.evaluate(function(){ return localStorage.getItem('preferredLanguage'); });
    const spanishCards = page.locator('[data-podcast-card="true"]');
    const spanishCount = await spanishCards.count();
    if (stored !== 'es') add('critical','podcast-selector-header-sync',{ expected:'es', actual:stored });
    for (let i=0;i<spanishCount;i+=1) {
      const actual = await spanishCards.nth(i).getAttribute('data-podcast-language');
      if (actual !== 'Spanish') add('critical','podcast-selector-language-mixed',{ expected:'Spanish', actual:actual, index:i });
    }
    await context.close();
  }


  {
    const milestoneAuditCopy = {
      en:{ add:'Add a Milestone', selectDate:'Select date', upload:'Click to upload photos', ideas:'Get Celebration Ideas', close:'Close', closeForm:'Close milestone form', gift:'Gift Suggestions', fallback:null, fallbackStart:10 },
      es:{ add:'Agregar un Hito', selectDate:'Seleccionar fecha', upload:'Haz clic para subir fotos', ideas:'Obtener Ideas de Celebración', close:'Cerrar', closeForm:'Cerrar formulario de hito', gift:'Sugerencias de Regalos', fallback:'Celebrar este hito', fallbackStart:2 },
      fr:{ add:'Ajouter un Jalon', selectDate:'Sélectionner une date', upload:'Cliquez pour téléverser des photos', ideas:'Obtenir des Idées de Célébration', close:'Fermer', closeForm:'Fermer le formulaire du jalon', gift:'Suggestions de Cadeaux', fallback:'Célébrer ce jalon', fallbackStart:1 },
      it:{ add:'Aggiungi un Traguardo', selectDate:'Seleziona una data', upload:'Fai clic per caricare le foto', ideas:'Ottieni Idee per la Celebrazione', close:'Chiudi', closeForm:'Chiudi il modulo del traguardo', gift:'Suggerimenti per Regali', fallback:'Celebrare questo traguardo', fallbackStart:1 },
      de:{ add:'Einen Meilenstein Hinzufügen', selectDate:'Datum auswählen', upload:'Klicken, um Fotos hochzuladen', ideas:'Feier-Ideen Erhalten', close:'Schließen', closeForm:'Meilensteinformular schließen', gift:'Geschenkvorschläge', fallback:'Diesen Meilenstein', fallbackStart:1 }
    };
    const milestoneTypes=['first_date','first_kiss','first_love','moving_in','engagement','wedding','anniversary','first_vacation','met_family','custom'];
    const syntheticMilestones=milestoneTypes.map(function(type,index){
      return {
        id:'launch-qa-milestone-' + index,
        milestone_type:type,
        title:'Launch QA ' + type,
        date:'2025-01-' + String(index + 1).padStart(2,'0'),
        description:'Launch QA milestone',
        location:'',
        partner_email:'',
        is_recurring:false,
        reminder_enabled:true,
        media_urls:[]
      };
    });

    for (const lang of Object.keys(milestoneAuditCopy)) {
      const copy=milestoneAuditCopy[lang];
      const context=await browser.newContext({ viewport:{ width:1366, height:900 } });
      await installSyntheticMemberAuth(context);
      const milestoneRequestUrls=[];
      await context.route('**/*', async function(routeHandler) {
        const request=routeHandler.request();
        const requestUrl=new URL(request.url());
        const isMilestoneCollection=requestUrl.pathname === '/api/milestones' || requestUrl.pathname === '/api/milestones/';
        if (isMilestoneCollection) {
          milestoneRequestUrls.push(request.method() + ' ' + requestUrl.pathname + requestUrl.search);
          if (request.method() === 'GET') {
            await routeHandler.fulfill({
              status:200,
              contentType:'application/json',
              body:JSON.stringify({ milestones:syntheticMilestones })
            });
            return;
          }
          await routeHandler.fulfill({
            status:403,
            contentType:'application/json',
            body:JSON.stringify({ error:{ code:'synthetic_qa_read_only', message:'Synthetic milestone QA is read-only.' } })
          });
          return;
        }
        await routeHandler.fallback();
      });
      await context.addInitScript(function(language){ localStorage.setItem('preferredLanguage', language); }, lang);
      const page=await context.newPage();
      const pageErrors=[];
      page.on('pageerror', function(err){ pageErrors.push(String(err && err.message || err)); });
      try {
        await page.goto(BASE + '/RelationshipMilestones', { waitUntil:'domcontentloaded', timeout:30000 });
        await page.getByText('Launch QA first_date', { exact:true }).waitFor({ state:'visible', timeout:8000 }).catch(function(){});
        const syntheticVisible = await page.getByText('Launch QA first_date', { exact:true }).count();
        if (!syntheticVisible) {
          add('critical','milestone-test-data-not-loaded',{ lang:lang, finalPath:new URL(page.url()).pathname, milestoneRequestUrls:milestoneRequestUrls });
        }

        const ideaButtons=page.getByRole('button',{ name:copy.ideas, exact:true });
        const ideaCount=await ideaButtons.count();
        if (ideaCount !== milestoneTypes.length) {
          add('critical','milestone-celebration-button-count',{ lang:lang, expected:milestoneTypes.length, actual:ideaCount });
        }

        for (let i=0;i<milestoneTypes.length;i+=1) {
          const milestoneType=milestoneTypes[i];
          const card=page.locator('[data-milestone-type="' + milestoneType + '"]').first();
          if (!(await card.count())) {
            add('critical','milestone-card-missing',{ lang:lang, milestoneType:milestoneType });
            continue;
          }
          const ideaButton=card.getByRole('button',{ name:copy.ideas, exact:true }).first();
          if (!(await ideaButton.count())) {
            add('critical','milestone-celebration-button-missing',{ lang:lang, milestoneType:milestoneType });
            continue;
          }
          await ideaButton.click();
          const dialog=page.getByRole('dialog').last();
          await dialog.waitFor({ state:'visible', timeout:5000 }).catch(function(){});
          const dialogText=(await dialog.count()) ? normalizeText(await dialog.innerText()) : '';
          if (!dialogText) {
            add('critical','milestone-celebration-dialog-missing',{ lang:lang, milestoneType:milestoneType });
            continue;
          }
          if (copy.fallback && i >= copy.fallbackStart && !dialogText.includes(copy.fallback)) {
            add('critical','milestone-celebration-fallback-language',{ lang:lang, milestoneType:milestoneType, expectedAnchor:copy.fallback });
          }
          const closeButton=dialog.getByRole('button',{ name:copy.close, exact:true }).last();
          if (!(await closeButton.count())) {
            add('critical','milestone-celebration-close-missing',{ lang:lang, milestoneType:milestoneType });
            break;
          }
          await closeButton.click();
          await dialog.waitFor({ state:'hidden', timeout:3000 }).catch(function(){});
        }

        const visibleGiftButton=page.getByRole('button').filter({ hasText:copy.gift });
        if (await visibleGiftButton.count()) {
          add('critical','milestone-deferred-gift-visible',{ lang:lang });
        }

        const addButton=page.getByRole('button',{ name:copy.add, exact:true }).first();
        if (!(await addButton.count())) {
          add('critical','milestone-form-open-missing',{ lang:lang });
        } else {
          await addButton.click();
          const formDialog=page.getByRole('dialog').last();
          await formDialog.waitFor({ state:'visible', timeout:5000 }).catch(function(){});
          const formText=(await formDialog.count()) ? normalizeText(await formDialog.innerText()) : '';
          if (!formText.includes(copy.selectDate) || !formText.includes(copy.upload)) {
            add('critical','milestone-form-localization',{ lang:lang, selectDate:copy.selectDate, upload:copy.upload });
          }
          const closeForm=formDialog.getByRole('button',{ name:copy.closeForm, exact:true }).first();
          if (!(await closeForm.count())) add('critical','milestone-form-close-accessibility',{ lang:lang });
          else await closeForm.click();
        }

        if (pageErrors.length) add('critical','milestone-interaction-pageerror',{ lang:lang, errors:pageErrors });
      } catch (e) {
        add('critical','milestone-interaction-audit',{ lang:lang, message:String(e.message || e), screenshot:await screenshot(page,'milestone_' + lang + '_interaction') });
      }
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport:{ width:1366, height:900 } });
    await installAnonymousAuth(context);
    await context.addInitScript(function(){localStorage.setItem('preferredLanguage','en');});
    const page = await context.newPage();
    await page.goto(BASE + '/Home', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(250);
    const actionButton = page.locator('button[aria-controls="desktop-action-menu"]').first();
    if (!(await actionButton.count())) {
      add('critical','desktop-action-menu-missing',{ message:'Desktop Action menu disclosure button not found.' });
    } else {
      await actionButton.focus();
      if ((await actionButton.getAttribute('aria-expanded')) !== 'false') {
        add('critical','desktop-action-menu-initial-state',{ message:'Desktop Action menu did not start collapsed.' });
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      const menu = page.locator('#desktop-action-menu');
      if (!(await menu.count()) || !(await menu.isVisible())) {
        add('critical','desktop-action-menu-keyboard-open',{ message:'Desktop Action menu did not open from keyboard activation.' });
      } else if ((await actionButton.getAttribute('aria-expanded')) !== 'true') {
        add('critical','desktop-action-menu-expanded-state',{ message:'Desktop Action menu did not expose aria-expanded=true after opening.' });
      } else {
        await page.keyboard.press('Tab');
        const firstLinkFocused = await page.evaluate(function(){
          const menuNode=document.querySelector('#desktop-action-menu');
          return !!menuNode && menuNode.querySelector('a') === document.activeElement;
        });
        if (!firstLinkFocused) {
          add('critical','desktop-action-menu-focus-order',{ message:'Keyboard focus did not move from the Action disclosure into the first menu link.' });
        }
      }
    }
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport:{ width:390, height:844 } });
    await installAnonymousAuth(context);
    await context.addInitScript(function(){localStorage.setItem('preferredLanguage','en');});
    const page = await context.newPage();
    await page.goto(BASE + '/Home', { waitUntil:'domcontentloaded', timeout:30000 });
    await page.waitForTimeout(250);
    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    if (await menuButton.count()) {
      await menuButton.click();
      await page.waitForTimeout(150);
      const text = normalizeText(await page.locator('body').innerText());
      if (!text.includes('Sign In') || !text.includes('Sign Up')) add('critical','mobile-menu-content',{ message:'Mobile navigation did not expose launch sign-in/sign-up controls.' });
    } else add('critical','mobile-menu-missing',{ message:'Mobile menu button not found.' });
    await context.close();
  }

  const criticalCount = findings.filter(function(x){return x.severity === 'critical';}).length;
  const warningCount = findings.filter(function(x){return x.severity === 'warning';}).length;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    summary: {
      publicDesktopLoads: PUBLIC_ROUTES.length * Object.keys(LANGS).length,
      protectedRouteGuardChecks: PROTECTED_ROUTES.length,
      syntheticMemberDesktopLoads: MEMBER_ROUTES.length * Object.keys(LANGS).length,
      mobileLoads: (5 * Object.keys(LANGS).length) + MEMBER_ROUTES.length,
      languages: Object.keys(LANGS),
      criticalCount: criticalCount,
      warningCount: warningCount,
      consoleObservationCount: observations.length
    },
    findings: findings,
    observations: observations
  };
  fs.writeFileSync(path.join(OUT, 'browser-audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (findings.length) console.log(JSON.stringify(findings, null, 2));
  if (criticalCount) process.exitCode = 1;
} finally {
  await browser.close();
}
