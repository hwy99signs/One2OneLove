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
      en:{ add:'Add a Milestone', edit:'Edit', date:'Date', selectDate:'Select date', upload:'Click to upload photos', ideas:'Get Celebration Ideas', close:'Close', closeForm:'Close milestone form', gift:'Gift Suggestions', fallback:null, fallbackStart:10 },
      es:{ add:'Agregar un Hito', edit:'Editar', date:'Fecha', selectDate:'Seleccionar fecha', upload:'Haz clic para subir fotos', ideas:'Obtener Ideas de Celebración', close:'Cerrar', closeForm:'Cerrar formulario de hito', gift:'Sugerencias de Regalos', fallback:'Celebrar este hito', fallbackStart:2 },
      fr:{ add:'Ajouter un Jalon', edit:'Modifier', date:'Date', selectDate:'Sélectionner une date', upload:'Cliquez pour téléverser des photos', ideas:'Obtenir des Idées de Célébration', close:'Fermer', closeForm:'Fermer le formulaire du jalon', gift:'Suggestions de Cadeaux', fallback:'Célébrer ce jalon', fallbackStart:1 },
      it:{ add:'Aggiungi un Traguardo', edit:'Modifica', date:'Data', selectDate:'Seleziona una data', upload:'Fai clic per caricare le foto', ideas:'Ottieni Idee per la Celebrazione', close:'Chiudi', closeForm:'Chiudi il modulo del traguardo', gift:'Suggerimenti per Regali', fallback:'Celebrare questo traguardo', fallbackStart:1 },
      de:{ add:'Einen Meilenstein Hinzufügen', edit:'Bearbeiten', date:'Datum', selectDate:'Datum auswählen', upload:'Klicken, um Fotos hochzuladen', ideas:'Feier-Ideen Erhalten', close:'Schließen', closeForm:'Meilensteinformular schließen', gift:'Geschenkvorschläge', fallback:'Diesen Meilenstein', fallbackStart:1 }
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
      const context=await browser.newContext({ viewport:{ width:1366, height:900 }, timezoneId:'America/Chicago' });
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

        const firstMilestoneCard=page.locator('[data-milestone-type="first_date"]').first();
        const firstEditButton=firstMilestoneCard.getByRole('button').filter({hasText:copy.edit}).first();
        if(!(await firstEditButton.count())){
          add('critical','milestone-edit-button-missing',{lang:lang});
        }else{
          await firstEditButton.click();
          const editDialog=page.getByRole('dialog').last();
          await editDialog.waitFor({state:'visible',timeout:5000}).catch(function(){});
          const dateButton=editDialog.getByRole('button',{name:copy.date,exact:true}).first();
          if(!(await dateButton.count())){
            add('critical','milestone-edit-date-control-missing',{lang:lang});
          }else{
            await dateButton.click();
            const selectedDay=editDialog.locator('button[aria-selected="true"]').first();
            await selectedDay.waitFor({state:'visible',timeout:3000}).catch(function(){});
            const selectedText=(await selectedDay.count()) ? normalizeText(await selectedDay.innerText()) : '';
            if(selectedText !== '1'){
              add('critical','milestone-edit-local-date-selection',{lang:lang,expected:'1',actual:selectedText});
            }
          }
          const closeEdit=editDialog.getByRole('button',{name:copy.closeForm,exact:true}).first();
          if(await closeEdit.count()) await closeEdit.click();
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
    const goalFormCopy = {
      en:{ add:'Add New Goal', title:'Goal Title', description:'Description', targetDate:'Target Date', partnerEmail:"Partner's Email (Optional)", close:'Close goal form' },
      es:{ add:'Agregar Nueva Meta', title:'Título de la Meta', description:'Descripción', targetDate:'Fecha Objetivo', partnerEmail:'Email de Pareja (Opcional)', close:'Cerrar formulario de meta' },
      fr:{ add:'Ajouter Nouvel Objectif', title:"Titre de l'Objectif", description:'Description', targetDate:'Date Cible', partnerEmail:'Email du Partenaire (Optionnel)', close:'Fermer le formulaire d’objectif' },
      it:{ add:'Aggiungi Nuovo Obiettivo', title:"Titolo dell'Obiettivo", description:'Descrizione', targetDate:'Data Obiettivo', partnerEmail:'Email del Partner (Opzionale)', close:'Chiudi il modulo dell’obiettivo' },
      de:{ add:'Neues Ziel Hinzufügen', title:'Zieltitel', description:'Beschreibung', targetDate:'Zieldatum', partnerEmail:'Partner E-Mail (Optional)', close:'Zielformular schließen' }
    };
    for (const lang of Object.keys(goalFormCopy)) {
      const copy=goalFormCopy[lang];
      const context=await browser.newContext({ viewport:{ width:1366, height:900 }, timezoneId:'America/Chicago' });
      await installSyntheticMemberAuth(context);
      await context.route('**/api/goals**', async function(routeHandler) {
        if (routeHandler.request().method() === 'GET') {
          await routeHandler.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ goals:[] }) });
          return;
        }
        await routeHandler.fulfill({ status:403, contentType:'application/json', body:JSON.stringify({ error:{ code:'synthetic_qa_read_only', message:'Synthetic goals QA is read-only.' } }) });
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage', language);}, lang);
      const page=await context.newPage();
      try {
        await page.goto(BASE + '/RelationshipGoals', { waitUntil:'domcontentloaded', timeout:30000 });
        await page.waitForTimeout(500);
        const addButton=page.getByRole('button',{ name:copy.add, exact:true }).first();
        if (!(await addButton.count())) {
          add('critical','goal-form-open-missing',{ lang:lang });
        } else {
          await addButton.click();
          const dialog=page.getByRole('dialog').last();
          await dialog.waitFor({ state:'visible', timeout:5000 }).catch(function(){});
          const titleInput=dialog.getByLabel(copy.title,{ exact:true });
          const descriptionInput=dialog.getByLabel(copy.description,{ exact:true });
          const dateInput=dialog.getByLabel(copy.targetDate,{ exact:true });
          const partnerInput=dialog.getByLabel(copy.partnerEmail,{ exact:true });
          if (!(await titleInput.count()) || !(await descriptionInput.count()) || !(await dateInput.count()) || !(await partnerInput.count())) {
            add('critical','goal-form-label-association',{ lang:lang });
          }
          if (await dateInput.count()) {
            const expected=await page.evaluate(function(){
              const now=new Date();
              const local=new Date(now.getTime() - now.getTimezoneOffset()*60000);
              return local.toISOString().slice(0,10);
            });
            const actual=await dateInput.getAttribute('min');
            if (actual !== expected) add('critical','goal-form-local-date-min',{ lang:lang, expected:expected, actual:actual });
          }
          const closeButton=dialog.getByRole('button',{ name:copy.close, exact:true }).first();
          if (!(await closeButton.count())) add('critical','goal-form-close-accessibility',{ lang:lang });
          else await closeButton.click();
        }
      } catch (e) {
        add('critical','goal-form-interaction-audit',{ lang:lang, message:String(e.message || e), screenshot:await screenshot(page,'goal_form_' + lang) });
      }
      await context.close();
    }
  }


  {
    const loveNotesAuditCopy = {
      en:{send:'Send',sendLoveNote:'Send Love Note',phone:"Recipient's Phone Number",scheduleLater:'Schedule for Later',date:'Schedule Date',time:'Schedule Time',close:'Close send love note',personalize:'Personalize Your Notes',closePersonalization:'Close personalization',closePreview:'Close note preview',search:'Search love notes by title, content, or tags...',clear:'Clear search'},
      es:{send:'Enviar',sendLoveNote:'Enviar Nota de Amor',phone:'Número de Teléfono del Destinatario',scheduleLater:'Programar para Después',date:'Fecha de Programación',time:'Hora de Programación',close:'Cerrar envío de nota de amor',personalize:'Personaliza Tus Notas',closePersonalization:'Cerrar personalización',closePreview:'Cerrar vista previa de la nota',search:'Buscar notas de amor por título, contenido o etiquetas...',clear:'Borrar búsqueda'},
      fr:{send:'Envoyer',sendLoveNote:"Envoyer Note d'Amour",phone:'Numéro de Téléphone du Destinataire',scheduleLater:'Programmer pour Plus Tard',date:'Date de Programmation',time:'Heure de Programmation',close:"Fermer l’envoi de la note d’amour",personalize:'Personnalisez Vos Notes',closePersonalization:'Fermer la personnalisation',closePreview:"Fermer l’aperçu de la note",search:"Rechercher des notes d'amour par titre, contenu ou tags...",clear:'Effacer la recherche'},
      it:{send:'Invia',sendLoveNote:"Invia Nota d'Amore",phone:'Numero di Telefono del Destinatario',scheduleLater:'Programma per Dopo',date:'Data di Programmazione',time:'Ora di Programmazione',close:"Chiudi invio della nota d’amore",personalize:'Personalizza le Tue Note',closePersonalization:'Chiudi personalizzazione',closePreview:'Chiudi anteprima della nota',search:"Cerca note d'amore per titolo, contenuto o tag...",clear:'Cancella ricerca'},
      de:{send:'Senden',sendLoveNote:'Liebesbotschaft Senden',phone:'Telefonnummer des Empfängers',scheduleLater:'Für Später Planen',date:'Planungsdatum',time:'Planungszeit',close:'Versand der Liebesbotschaft schließen',personalize:'Personalisiere Deine Botschaften',closePersonalization:'Personalisierung schließen',closePreview:'Vorschau der Liebesbotschaft schließen',search:'Liebesbotschaften nach Titel, Inhalt oder Tags suchen...',clear:'Suche löschen'}
    };

    for (const lang of Object.keys(loveNotesAuditCopy)) {
      const copy=loveNotesAuditCopy[lang];
      const context=await browser.newContext({ viewport:{ width:1366, height:900 }, timezoneId:'America/Chicago' });
      await installSyntheticMemberAuth(context);
      await context.route('**/api/love-notes/**', async function(routeHandler) {
        const request=routeHandler.request();
        const pathname=new URL(request.url()).pathname;
        if (request.method() !== 'GET') {
          await routeHandler.fulfill({ status:403, contentType:'application/json', body:JSON.stringify({ error:{ code:'synthetic_qa_read_only', message:'Synthetic Love Notes QA is read-only.' } }) });
          return;
        }
        if (pathname.endsWith('/delivery-readiness')) {
          await routeHandler.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ delivery:{ scheduledSmsReady:true } }) });
          return;
        }
        if (pathname.endsWith('/usage')) {
          await routeHandler.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ usage:{ includedRemaining:20, monthlyLimit:20 } }) });
          return;
        }
        if (pathname.endsWith('/categories')) {
          await routeHandler.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ preference:null }) });
          return;
        }
        await routeHandler.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ notes:[] }) });
      });
      await context.route('**/api/ai/config', async function(routeHandler) {
        await routeHandler.fulfill({ status:200, contentType:'application/json', body:JSON.stringify({ configured:false, creator:{ allowed:false } }) });
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage', language);}, lang);
      const page=await context.newPage();
      const pageErrors=[];
      page.on('pageerror', function(err){pageErrors.push(String(err && err.message || err));});
      try {
        await page.goto(BASE + '/LoveNotes', { waitUntil:'domcontentloaded', timeout:30000 });
        await page.waitForTimeout(700);

        const searchInput=page.getByPlaceholder(copy.search,{ exact:true });
        if (!(await searchInput.count())) {
          add('critical','love-notes-search-input-missing',{lang:lang});
        } else {
          await searchInput.fill('launchqa');
          const clearButton=page.getByRole('button',{name:copy.clear,exact:true});
          if (!(await clearButton.count())) add('critical','love-notes-clear-search-accessibility',{lang:lang});
          else await clearButton.click();
        }

        const personalizeButton=page.getByRole('button',{name:copy.personalize,exact:true}).first();
        if (!(await personalizeButton.count())) {
          add('critical','love-notes-personalization-button-accessibility',{lang:lang});
        } else {
          await personalizeButton.click();
          const personalizeDialog=page.getByRole('dialog',{name:copy.personalize,exact:true});
          await personalizeDialog.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if (!(await personalizeDialog.count())) add('critical','love-notes-personalization-dialog-semantics',{lang:lang});
          else {
            const closePersonalize=personalizeDialog.getByRole('button',{name:copy.closePersonalization,exact:true});
            if (!(await closePersonalize.count())) add('critical','love-notes-personalization-close-accessibility',{lang:lang});
            else await closePersonalize.click();
          }
        }

        const sendButton=page.getByRole('button',{name:copy.send,exact:true}).first();
        if (!(await sendButton.count())) {
          add('critical','love-notes-send-button-missing',{lang:lang});
        } else {
          await sendButton.click();
          const sendDialog=page.getByRole('dialog',{name:copy.sendLoveNote,exact:true});
          await sendDialog.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if (!(await sendDialog.count())) {
            add('critical','love-notes-send-dialog-semantics',{lang:lang});
          } else {
            const phoneInput=sendDialog.getByLabel(copy.phone,{exact:true});
            if (!(await phoneInput.count())) add('critical','love-notes-phone-label-association',{lang:lang});
            const scheduleButton=sendDialog.getByRole('button',{name:copy.scheduleLater,exact:true});
            if (!(await scheduleButton.count())) {
              add('critical','love-notes-schedule-toggle-missing',{lang:lang});
            } else {
              await scheduleButton.click();
              const dateInput=sendDialog.getByLabel(copy.date,{exact:true});
              const timeInput=sendDialog.getByLabel(copy.time,{exact:true});
              if (!(await dateInput.count()) || !(await timeInput.count())) {
                add('critical','love-notes-schedule-label-association',{lang:lang});
              }
              if (await dateInput.count()) {
                const expected=await page.evaluate(function(){
                  const now=new Date();
                  const local=new Date(now.getTime() - now.getTimezoneOffset()*60000);
                  return local.toISOString().slice(0,10);
                });
                const actual=await dateInput.getAttribute('min');
                if (actual !== expected) add('critical','love-notes-schedule-local-date-min',{lang:lang,expected:expected,actual:actual});
              }
            }
            const closeSend=sendDialog.getByRole('button',{name:copy.close,exact:true});
            if (!(await closeSend.count())) add('critical','love-notes-send-close-accessibility',{lang:lang});
            else await closeSend.click();
          }
        }

        if (lang === 'en') {
          const noteTitle=page.locator('.font-kalam').first();
          if (await noteTitle.count()) {
            const expectedTitle=normalizeText(await noteTitle.innerText());
            await noteTitle.click();
            const previewDialog=page.getByRole('dialog',{name:expectedTitle,exact:true});
            await previewDialog.waitFor({state:'visible',timeout:5000}).catch(function(){});
            if (!(await previewDialog.count())) {
              add('critical','love-notes-preview-dialog-semantics',{lang:lang});
            } else {
              const closePreview=previewDialog.getByRole('button',{name:copy.closePreview,exact:true});
              if (!(await closePreview.count())) add('critical','love-notes-preview-close-accessibility',{lang:lang});
              else await closePreview.click();
            }
          }
        }

        if (pageErrors.length) add('critical','love-notes-interaction-pageerror',{lang:lang,errors:pageErrors});
      } catch (e) {
        add('critical','love-notes-interaction-audit',{lang:lang,message:String(e.message || e),screenshot:await screenshot(page,'love_notes_' + lang + '_interaction')});
      }
      await context.close();
    }
  }

  {
    const sendCreditsCustomCopy={en:'Other amount',es:'Otro monto',fr:'Autre montant',it:'Altro importo',de:'Anderer Betrag'};
    for (const lang of Object.keys(sendCreditsCustomCopy)) {
      const context=await browser.newContext({viewport:{width:1366,height:900}});
      await installSyntheticMemberAuth(context);
      await context.route('**/api/send-credits/balance', async function(routeHandler) {
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({wallet:{availableSends:0,purchases:[]}})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage', language);}, lang);
      const page=await context.newPage();
      try {
        await page.goto(BASE + '/SendCredits',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForTimeout(400);
        const customButton=page.getByRole('button',{name:new RegExp('^' + sendCreditsCustomCopy[lang])}).first();
        if (!(await customButton.count())) {
          add('critical','send-credits-custom-option-missing',{lang:lang});
        } else {
          await customButton.click();
          const amountInput=page.getByLabel(sendCreditsCustomCopy[lang],{exact:true});
          if (!(await amountInput.count())) add('critical','send-credits-custom-label-association',{lang:lang});
        }
      } catch (e) {
        add('critical','send-credits-interaction-audit',{lang:lang,message:String(e.message || e),screenshot:await screenshot(page,'send_credits_' + lang + '_interaction')});
      }
      await context.close();
    }
  }



  {
    const profileAuditCopy={
      en:{locale:'en-US',edit:'Edit Profile',location:'Location',bio:'Bio',status:'Relationship Status',partner:'Partner',anniversary:'Anniversary',love:'Love Language',image:'Change profile picture'},
      es:{locale:'es-ES',edit:'Editar Perfil',location:'Ubicación',bio:'Biografía',status:'Estado de Relación',partner:'Pareja',anniversary:'Aniversario',love:'Lenguaje del Amor',image:'Cambiar foto de perfil'},
      fr:{locale:'fr-FR',edit:'Modifier le Profil',location:'Localisation',bio:'Biographie',status:'Statut de Relation',partner:'Partenaire',anniversary:'Anniversaire',love:"Langage d'Amour",image:'Changer la photo de profil'},
      it:{locale:'it-IT',edit:'Modifica Profilo',location:'Posizione',bio:'Biografia',status:'Stato della Relazione',partner:'Partner',anniversary:'Anniversario',love:"Linguaggio dell'Amore",image:'Cambia foto del profilo'},
      de:{locale:'de-DE',edit:'Profil Bearbeiten',location:'Standort',bio:'Biografie',status:'Beziehungsstatus',partner:'Partner',anniversary:'Jubiläum',love:'Liebessprache',image:'Profilbild ändern'}
    };
    const couplesProfileAuditCopy={
      en:{edit:'Edit Profile',location:'Location',status:'Relationship Status',partner:'Partner Name',partnerEmail:'Partner Email',anniversary:'Anniversary',love:'Love Language'},
      es:{edit:'Editar Perfil',location:'Ubicación',status:'Estado de Relación',partner:'Nombre de la Pareja',partnerEmail:'Correo de la Pareja',anniversary:'Aniversario',love:'Lenguaje del Amor'},
      fr:{edit:'Modifier le Profil',location:'Localisation',status:'Statut de Relation',partner:'Nom du Partenaire',partnerEmail:'E-mail du Partenaire',anniversary:'Anniversaire',love:"Langage de l’Amour"},
      it:{edit:'Modifica Profilo',location:'Posizione',status:'Stato della Relazione',partner:'Nome del Partner',partnerEmail:'E-mail del Partner',anniversary:'Anniversario',love:"Linguaggio dell’Amore"},
      de:{edit:'Profil Bearbeiten',location:'Standort',status:'Beziehungsstatus',partner:'Partnername',partnerEmail:'Partner-E-Mail',anniversary:'Jahrestag',love:'Liebessprache'}
    };

    async function installProfileAuditAuth(context) {
      const user={
        id:'launch-qa-profile-user',
        email:'profile-qa@example.invalid',
        emailVerified:true,
        email_verified:true,
        name:'Profile QA',
        role:'user'
      };
      const profile={
        id:user.id,
        email:user.email,
        name:user.name,
        role:'user',
        subscription_plan:'Exclusive',
        subscription_status:'active',
        subscription_price:19.99,
        stripe_customer_id:'cus_profile_qa',
        stripe_subscription_id:'sub_profile_qa',
        phone_number_verified:true,
        phoneNumberVerified:true,
        phone_verification_required:true,
        preferred_language:'en',
        location:'Houston',
        partner_name:'Partner QA',
        partner_email:'',
        anniversary_date:'2026-09-22',
        love_language:'quality_time',
        relationship_status:'married',
        bio:'Profile QA bio',
        created_at:'2025-01-15T12:00:00Z'
      };
      await context.route('**/api/auth/get-session', async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:user,session:{id:'launch-qa-profile-session',userId:user.id}})});
      });
      await context.route('**/api/profile', async function(routeHandler){
        if(routeHandler.request().method()==='GET'){
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profile:profile})});
          return;
        }
        await routeHandler.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'synthetic_qa_read_only',message:'Synthetic profile QA is read-only.'}})});
      });
    }

    for(const lang of Object.keys(profileAuditCopy)){
      const copy=profileAuditCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'America/Chicago'});
      await installProfileAuditAuth(context);
      await context.route('**/api/memories**',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({memories:[]})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/Profile',{waitUntil:'domcontentloaded',timeout:30000});
        await page.locator('#profile-anniversary-label').first().waitFor({state:'visible',timeout:8000}).catch(function(){});
        const expectedDate=await page.evaluate(function(locale){
          return new Intl.DateTimeFormat(locale).format(new Date('2026-09-22T00:00:00'));
        },copy.locale);
        const anniversaryLabel=page.locator('#profile-anniversary-label').first();
        if(!(await anniversaryLabel.count())){
          add('critical','profile-anniversary-label-missing',{lang:lang});
        }else{
          const anniversaryGroup=anniversaryLabel.locator('..');
          if(!normalizeText(await anniversaryGroup.innerText()).includes(expectedDate)){
            add('critical','profile-anniversary-local-date',{lang:lang,expected:expectedDate});
          }
        }
        const profileImageButton=page.getByRole('button',{name:copy.image,exact:true}).first();
        if(!(await profileImageButton.count())){
          add('critical','profile-image-control-accessibility',{lang:lang});
        }
        const editButton=page.getByRole('button',{name:copy.edit,exact:true}).last();
        if(!(await editButton.count())){
          add('critical','profile-edit-accessibility',{lang:lang});
        }else{
          await editButton.click();
          const controls=[
            ['location',copy.location],['bio',copy.bio],['status',copy.status],
            ['partner',copy.partner],['anniversary',copy.anniversary],['love',copy.love]
          ];
          for(const pair of controls){
            if(!(await page.getByLabel(pair[1],{exact:true}).count())){
              add('critical','profile-edit-label-association',{lang:lang,field:pair[0]});
            }
          }
        }
      }catch(e){
        add('critical','profile-edit-interaction-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'profile_edit_'+lang)});
      }
      await context.close();
    }

    for(const lang of Object.keys(couplesProfileAuditCopy)){
      const copy=couplesProfileAuditCopy[lang];
      const locale=profileAuditCopy[lang].locale;
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'America/Chicago'});
      await installProfileAuditAuth(context);
      await context.route('**/api/memories**',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({memories:[]})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/CouplesProfile',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForTimeout(500);
        const expectedDate=await page.evaluate(function(targetLocale){
          return new Intl.DateTimeFormat(targetLocale).format(new Date('2026-09-22T00:00:00'));
        },locale);
        const anniversaryText=page.getByText(copy.anniversary,{exact:true}).first();
        if(!(await anniversaryText.count()) || !normalizeText(await anniversaryText.locator('..').innerText()).includes(expectedDate)){
          add('critical','couples-profile-anniversary-local-date',{lang:lang,expected:expectedDate});
        }
        const editButton=page.getByRole('button',{name:copy.edit,exact:true}).first();
        if(!(await editButton.count())){
          add('critical','couples-profile-edit-button-missing',{lang:lang});
        }else{
          await editButton.click();
          const controls=[
            ['location',copy.location],['status',copy.status],['partner',copy.partner],
            ['partnerEmail',copy.partnerEmail],['anniversary',copy.anniversary],['love',copy.love]
          ];
          for(const pair of controls){
            if(!(await page.getByLabel(pair[1],{exact:true}).count())){
              add('critical','couples-profile-label-association',{lang:lang,field:pair[0]});
            }
          }
        }
      }catch(e){
        add('critical','couples-profile-interaction-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'couples_profile_'+lang)});
      }
      await context.close();
    }
  }



  {
    const suggestionErrorCopy={
      en:{placeholder:'Tell us your idea in detail...',submit:'Submit Suggestion',error:'Your suggestion could not be submitted. Please try again.'},
      es:{placeholder:'Cuéntanos tu idea en detalle...',submit:'Enviar Sugerencia',error:'No se pudo enviar tu sugerencia. Inténtalo de nuevo.'},
      fr:{placeholder:'Parlez-nous de votre idée en détail...',submit:'Soumettre la Suggestion',error:'Votre suggestion n’a pas pu être envoyée. Veuillez réessayer.'},
      it:{placeholder:'Raccontaci la tua idea in dettaglio...',submit:'Invia Suggerimento',error:'Impossibile inviare il suggerimento. Riprova.'},
      de:{placeholder:'Erzählen Sie uns im Detail von Ihrer Idee...',submit:'Vorschlag Einreichen',error:'Ihr Vorschlag konnte nicht gesendet werden. Bitte versuchen Sie es erneut.'}
    };
    for(const lang of Object.keys(suggestionErrorCopy)){
      const copy=suggestionErrorCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900}});
      await installAnonymousAuth(context);
      await context.route('**/api/suggestions/readiness',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ready:true})});
      });
      await context.route('**/api/suggestions',async function(routeHandler){
        if(routeHandler.request().method()==='POST'){
          await routeHandler.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:{message:'Synthetic English server failure.'}})});
          return;
        }
        await routeHandler.fallback();
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/Suggestions',{waitUntil:'domcontentloaded',timeout:30000});
        const textarea=page.getByPlaceholder(copy.placeholder,{exact:true});
        await textarea.waitFor({state:'visible',timeout:5000}).catch(function(){});
        if(!(await textarea.count())){
          add('critical','suggestions-error-audit-form-missing',{lang:lang});
        }else{
          await textarea.fill('Launch QA suggestion content');
          await page.getByRole('button',{name:copy.submit,exact:true}).click();
          const localizedError=page.getByText(copy.error,{exact:true}).last();
          await localizedError.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if(!(await localizedError.count())) add('critical','suggestions-error-not-localized',{lang:lang});
          if(await page.getByText('Synthetic English server failure.',{exact:true}).count()) add('critical','suggestions-raw-server-error-visible',{lang:lang});
        }
      }catch(e){
        add('critical','suggestions-error-interaction-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'suggestions_error_'+lang)});
      }
      await context.close();
    }
  }

  {
    const reviewErrorCopy={
      en:{placeholder:'Tell others about your experience with One2OneLove...',submit:'Submit Review',error:'Unable to submit your review.',star:'5 stars'},
      es:{placeholder:'Cuéntales a otros sobre tu experiencia con One2OneLove...',submit:'Enviar Reseña',error:'No se pudo enviar tu reseña.',star:'5 estrellas'},
      fr:{placeholder:'Parlez aux autres de votre expérience avec One2OneLove...',submit:"Envoyer l'Avis",error:'Impossible d’envoyer votre avis.',star:'5 étoiles'},
      it:{placeholder:'Racconta agli altri la tua esperienza con One2OneLove...',submit:'Invia Recensione',error:'Impossibile inviare la recensione.',star:'5 stelle'},
      de:{placeholder:'Erzählen Sie anderen von Ihrer Erfahrung mit One2OneLove...',submit:'Bewertung Senden',error:'Ihre Bewertung konnte nicht gesendet werden.',star:'5 Sterne'}
    };
    for(const lang of Object.keys(reviewErrorCopy)){
      const copy=reviewErrorCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900}});
      const user={id:'launch-qa-review-user',email:'review-qa@example.invalid',emailVerified:true,email_verified:true,name:'Review QA',role:'user'};
      const profile={
        id:user.id,email:user.email,name:user.name,role:'user',location:'Houston',city:'Houston',country:'US',
        subscription_plan:'Exclusive',subscription_status:'active',phone_number_verified:true,phoneNumberVerified:true,phone_verification_required:true
      };
      await context.route('**/api/auth/get-session',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:user,session:{id:'launch-qa-review-session',userId:user.id}})});
      });
      await context.route('**/api/profile',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({profile:profile})});
      });
      await context.route('**/api/reviews',async function(routeHandler){
        if(routeHandler.request().method()==='POST'){
          await routeHandler.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:{message:'Synthetic English review failure.'}})});
          return;
        }
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reviews:[]})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/LeaveReview',{waitUntil:'domcontentloaded',timeout:30000});
        const textarea=page.getByPlaceholder(copy.placeholder,{exact:true});
        await textarea.waitFor({state:'visible',timeout:8000}).catch(function(){});
        if(!(await textarea.count())){
          add('critical','review-error-audit-form-missing',{lang:lang});
        }else{
          await page.getByRole('radio',{name:copy.star,exact:true}).click();
          await textarea.fill('Launch QA review text long enough.');
          await page.getByRole('button',{name:copy.submit,exact:true}).click();
          const localizedError=page.getByText(copy.error,{exact:true}).last();
          await localizedError.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if(!(await localizedError.count())) add('critical','review-error-not-localized',{lang:lang});
          if(await page.getByText('Synthetic English review failure.',{exact:true}).count()) add('critical','review-raw-server-error-visible',{lang:lang});
        }
      }catch(e){
        add('critical','review-error-interaction-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'review_error_'+lang)});
      }
      await context.close();
    }
  }


  {
    const dateIdeasAuditCopy={
      en:{create:'Create Custom Date',customTitle:'Create Custom Date Idea',title:'Date Title',description:'Description',category:'Category',budget:'Budget',location:'Location Type',occasion:'Occasion',stage:'Relationship Stage',difficulty:'Difficulty',duration:'Duration (hours)',cancel:'Cancel',firstIdea:'Stargazing Picnic',schedule:'Schedule',scheduleDate:'Date',scheduleTime:'Time'},
      es:{create:'Crear Cita Personalizada',customTitle:'Crear Idea de Cita Personalizada',title:'Título de la Cita',description:'Descripción',category:'Categoría',budget:'Presupuesto',location:'Tipo de Lugar',occasion:'Ocasión',stage:'Etapa de la Relación',difficulty:'Dificultad',duration:'Duración (horas)',cancel:'Cancelar',firstIdea:'Picnic bajo las estrellas',schedule:'Programar',scheduleDate:'Fecha',scheduleTime:'Hora'},
      fr:{create:'Créer un Rendez-vous',customTitle:'Créer une Idée de Rendez-vous Personnalisée',title:'Titre du Rendez-vous',description:'Description',category:'Catégorie',budget:'Budget',location:'Type de Lieu',occasion:'Occasion',stage:'Étape de la Relation',difficulty:'Difficulté',duration:'Durée (heures)',cancel:'Annuler',firstIdea:'Pique-nique sous les étoiles',schedule:'Planifier',scheduleDate:'Date',scheduleTime:'Heure'},
      it:{create:'Crea Appuntamento',customTitle:'Crea Idea per Appuntamento Personalizzata',title:'Titolo dell’Appuntamento',description:'Descrizione',category:'Categoria',budget:'Budget',location:'Tipo di Luogo',occasion:'Occasione',stage:'Fase della Relazione',difficulty:'Difficoltà',duration:'Durata (ore)',cancel:'Annulla',firstIdea:'Picnic sotto le stelle',schedule:'Programma',scheduleDate:'Data',scheduleTime:'Ora'},
      de:{create:'Eigenes Date Erstellen',customTitle:'Eigene Date-Idee Erstellen',title:'Date-Titel',description:'Beschreibung',category:'Kategorie',budget:'Budget',location:'Ortstyp',occasion:'Anlass',stage:'Beziehungsphase',difficulty:'Schwierigkeit',duration:'Dauer (Stunden)',cancel:'Abbrechen',firstIdea:'Sternen-Picknick',schedule:'Planen',scheduleDate:'Datum',scheduleTime:'Uhrzeit'}
    };
    for(const lang of Object.keys(dateIdeasAuditCopy)){
      const copy=dateIdeasAuditCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'America/Chicago'});
      await installSyntheticMemberAuth(context);
      await context.route('**/api/date-ideas**',async function(routeHandler){
        if(routeHandler.request().method()==='GET'){
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ideas:[]})});
          return;
        }
        await routeHandler.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'synthetic_qa_read_only',message:'Synthetic Date Ideas QA is read-only.'}})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      const pageErrors=[];
      page.on('pageerror',function(err){pageErrors.push(String(err&&err.message||err));});
      try{
        await page.goto(BASE+'/DateIdeas',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForTimeout(500);

        const createButton=page.getByRole('button',{name:copy.create,exact:true}).first();
        if(!(await createButton.count())){
          add('critical','date-ideas-custom-open-missing',{lang:lang});
        }else{
          await createButton.click();
          const customHeading=page.getByText(copy.customTitle,{exact:true}).first();
          await customHeading.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if(!(await customHeading.count())){
            add('critical','date-ideas-custom-title-localization',{lang:lang});
          }else{
            const fields=[
              ['title',copy.title + ' *'],['description',copy.description + ' *'],['category',copy.category],['budget',copy.budget],
              ['location',copy.location],['occasion',copy.occasion],['stage',copy.stage],['difficulty',copy.difficulty],['duration',copy.duration]
            ];
            for(const pair of fields){
              if(!(await page.getByLabel(pair[1],{exact:true}).count())){
                add('critical','date-ideas-custom-label-association',{lang:lang,field:pair[0],label:pair[1]});
              }
            }
            const cancelButtons=page.getByRole('button',{name:copy.cancel,exact:true});
            if(!(await cancelButtons.count())) add('critical','date-ideas-custom-close-accessibility',{lang:lang});
            else await cancelButtons.last().click();
          }
        }

        const firstIdeaButton=page.getByRole('button',{name:copy.firstIdea,exact:true}).first();
        if(!(await firstIdeaButton.count())){
          add('critical','date-ideas-first-card-missing',{lang:lang,expected:copy.firstIdea});
        }else{
          await firstIdeaButton.click();
          const dialog=page.getByRole('dialog',{name:copy.firstIdea,exact:true});
          await dialog.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if(!(await dialog.count())){
            add('critical','date-ideas-detail-dialog-semantics',{lang:lang});
          }else{
            const scheduleButton=dialog.getByRole('button',{name:copy.schedule,exact:true}).first();
            if(!(await scheduleButton.count())){
              add('critical','date-ideas-schedule-open-missing',{lang:lang});
            }else{
              await scheduleButton.click();
              const dateInput=dialog.getByLabel(copy.scheduleDate,{exact:true});
              const timeInput=dialog.getByLabel(copy.scheduleTime,{exact:true});
              if(!(await dateInput.count()) || !(await timeInput.count())){
                add('critical','date-ideas-schedule-label-association',{lang:lang});
              }
              if(await dateInput.count()){
                const expected=await page.evaluate(function(){
                  const now=new Date();
                  const local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
                  return local.toISOString().slice(0,10);
                });
                const actual=await dateInput.getAttribute('min');
                if(actual!==expected) add('critical','date-ideas-schedule-local-date-min',{lang:lang,expected:expected,actual:actual});
              }
            }
          }
        }
        if(pageErrors.length) add('critical','date-ideas-interaction-pageerror',{lang:lang,errors:pageErrors});
      }catch(e){
        add('critical','date-ideas-interaction-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'date_ideas_'+lang+'_interaction')});
      }
      await context.close();
    }
  }


  {
    const dashboardDateCopy={
      en:{locale:'en-US'},
      es:{locale:'es-ES'},
      fr:{locale:'fr-FR'},
      it:{locale:'it-IT'},
      de:{locale:'de-DE'}
    };
    for(const lang of Object.keys(dashboardDateCopy)){
      const copy=dashboardDateCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'America/Chicago'});
      await installSyntheticMemberAuth(context);
      const syntheticMilestone={
        id:'launch-qa-dashboard-milestone',
        title:'Launch QA Anniversary',
        description:'Synthetic dashboard date-only milestone',
        date:'2026-09-23',
        milestone_type:'anniversary',
        is_recurring:false,
        celebration_completed:false
      };
      await context.route('**/api/milestones**',async function(routeHandler){
        if(routeHandler.request().method()==='GET'){
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({milestones:[syntheticMilestone]})});
          return;
        }
        await routeHandler.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'synthetic_qa_read_only',message:'Synthetic dashboard QA is read-only.'}})});
      });
      await context.route('**/api/journals**',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({entries:[]})});
      });
      await context.route('**/api/goals**',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({goals:[]})});
      });
      await context.route('**/api/memories**',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({memories:[]})});
      });
      await context.route('**/api/engagement/points',async function(routeHandler){
        await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({points:[]})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      const pageErrors=[];
      page.on('pageerror',function(err){pageErrors.push(String(err&&err.message||err));});
      try{
        await page.goto(BASE+'/CouplesDashboard',{waitUntil:'domcontentloaded',timeout:30000});
        const dateNode=page.locator('[data-dashboard-milestone-date="2026-09-23"]').first();
        await dateNode.waitFor({state:'visible',timeout:8000}).catch(function(){});
        if(!(await dateNode.count())){
          add('critical','couples-dashboard-milestone-date-missing',{lang:lang});
        }else{
          const expected=await page.evaluate(function(locale){
            return new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric'}).format(new Date('2026-09-23T00:00:00'));
          },copy.locale);
          const actual=normalizeText(await dateNode.innerText());
          if(actual!==normalizeText(expected)){
            add('critical','couples-dashboard-milestone-local-date',{lang:lang,expected:expected,actual:actual});
          }
        }
        if(pageErrors.length) add('critical','couples-dashboard-date-pageerror',{lang:lang,errors:pageErrors});
      }catch(e){
        add('critical','couples-dashboard-date-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'couples_dashboard_date_'+lang)});
      }
      await context.close();
    }
  }


  {
    const journalDateCopy={
      en:{add:'Add Entry',date:'Date',mood:'Mood'},
      es:{add:'Agregar Entrada',date:'Fecha',mood:'Estado de Ánimo'},
      fr:{add:'Ajouter une Entrée',date:'Date',mood:'Humeur'},
      it:{add:'Aggiungi Voce',date:'Data',mood:'Umore'},
      de:{add:'Eintrag Hinzufügen',date:'Datum',mood:'Stimmung'}
    };
    for(const lang of Object.keys(journalDateCopy)){
      const copy=journalDateCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'America/Chicago'});
      await installSyntheticMemberAuth(context);
      await context.route('**/api/journals**',async function(routeHandler){
        if(routeHandler.request().method()==='GET'){
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({entries:[]})});
          return;
        }
        await routeHandler.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'synthetic_qa_read_only',message:'Synthetic journal QA is read-only.'}})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/SharedJournals',{waitUntil:'domcontentloaded',timeout:30000});
        const addButton=page.getByRole('button',{name:copy.add,exact:true}).first();
        if(!(await addButton.count())){
          add('critical','journal-add-entry-missing',{lang:lang});
        }else{
          await addButton.click();
          const dateInput=page.getByLabel(copy.date,{exact:true});
          const moodControl=page.getByLabel(copy.mood,{exact:true});
          if(!(await dateInput.count())) add('critical','journal-date-label-association',{lang:lang});
          if(!(await moodControl.count())) add('critical','journal-mood-label-association',{lang:lang});
          if(await dateInput.count()){
            const expected=await page.evaluate(function(){
              const now=new Date();
              return String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
            });
            const actual=await dateInput.inputValue();
            if(actual!==expected) add('critical','journal-default-local-date',{lang:lang,expected:expected,actual:actual});
          }
        }
      }catch(e){
        add('critical','journal-date-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'journal_date_'+lang)});
      }
      await context.close();
    }
  }

  {
    const memoryDateCopy={
      en:{edit:'Edit',title:'Memory Title',date:'Date',location:'Location',tags:'Tags (comma-separated)',share:'Share with Partner (Optional)',save:'Save Memory'},
      es:{edit:'Editar',title:'Título del Recuerdo',date:'Fecha',location:'Ubicación',tags:'Etiquetas (separadas por comas)',share:'Compartir con Pareja (Opcional)',save:'Guardar Recuerdo'},
      fr:{edit:'Modifier',title:'Titre du Souvenir',date:'Date',location:'Lieu',tags:'Étiquettes (séparées par des virgules)',share:'Partager avec Partenaire (Facultatif)',save:'Enregistrer le Souvenir'},
      it:{edit:'Modifica',title:'Titolo del Ricordo',date:'Data',location:'Posizione',tags:'Tag (separati da virgole)',share:'Condividi con Partner (Facoltativo)',save:'Salva Ricordo'},
      de:{edit:'Bearbeiten',title:'Erinnerungstitel',date:'Datum',location:'Ort',tags:'Tags (durch Kommas getrennt)',share:'Mit Partner Teilen (Optional)',save:'Erinnerung Speichern'}
    };
    for(const lang of Object.keys(memoryDateCopy)){
      const copy=memoryDateCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'Europe/Paris'});
      await installSyntheticMemberAuth(context);
      let submittedDate=null;
      const syntheticMemory={
        id:'launch-qa-memory-date',
        title:'Launch QA Memory',
        description:'Synthetic memory for local date preservation.',
        memory_date:'2026-09-23',
        location:'Paris',
        tags:['qa'],
        media_urls:[],
        is_favorite:false,
        partner_email:'',
        can_edit:true
      };
      await context.route('**/api/memories**',async function(routeHandler){
        const request=routeHandler.request();
        if(request.method()==='GET'){
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({memories:[syntheticMemory]})});
          return;
        }
        if(request.method()==='PATCH'){
          const payload=request.postDataJSON();
          submittedDate=payload && payload.memory_date;
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({memory:{...syntheticMemory,...payload}})});
          return;
        }
        await routeHandler.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'synthetic_qa_read_only',message:'Synthetic memory QA permits only the controlled PATCH.'}})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/MemoryLane',{waitUntil:'domcontentloaded',timeout:30000});
        await page.getByText('Launch QA Memory',{exact:true}).waitFor({state:'visible',timeout:8000}).catch(function(){});
        const editButton=page.getByRole('button',{name:copy.edit,exact:true}).first();
        if(!(await editButton.count())){
          add('critical','memory-edit-button-missing',{lang:lang});
        }else{
          await editButton.click();
          const controls=[
            ['title',copy.title],['date',copy.date],['location',copy.location],['tags',copy.tags],['share',copy.share]
          ];
          for(const pair of controls){
            if(!(await page.getByLabel(pair[1],{exact:true}).count())){
              add('critical','memory-form-label-association',{lang:lang,field:pair[0],label:pair[1]});
            }
          }
          const saveButton=page.getByRole('button',{name:copy.save,exact:true}).first();
          if(!(await saveButton.count())){
            add('critical','memory-save-button-missing',{lang:lang});
          }else{
            await saveButton.click();
            await page.waitForTimeout(300);
            if(submittedDate!=='2026-09-23'){
              add('critical','memory-local-date-serialization',{lang:lang,expected:'2026-09-23',actual:submittedDate});
            }
          }
        }
      }catch(e){
        add('critical','memory-date-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'memory_date_'+lang)});
      }
      await context.close();
    }
  }


  {
    const calendarDateCopy={
      en:{locale:'en-US',today:'Today',list:'List View'},
      es:{locale:'es-ES',today:'Hoy',list:'Vista de Lista'},
      fr:{locale:'fr-FR',today:"Aujourd'hui",list:'Vue Liste'},
      it:{locale:'it-IT',today:'Oggi',list:'Vista Elenco'},
      de:{locale:'de-DE',today:'Heute',list:'Listenansicht'}
    };
    for(const lang of Object.keys(calendarDateCopy)){
      const copy=calendarDateCopy[lang];
      const context=await browser.newContext({viewport:{width:1366,height:900},timezoneId:'America/Chicago'});
      await installSyntheticMemberAuth(context);
      const requestUrls=[];
      const syntheticEvent={
        id:'launch-qa-calendar-event',
        title:'Launch QA Calendar Event',
        description:'',
        event_date:'2026-09-22',
        event_time:'19:00',
        event_type:'date',
        location:'',
        reminder_enabled:false,
        reminder_days_before:1,
        is_recurring:false,
        recurrence_pattern:null,
        notes:'',
        color:'pink'
      };
      await context.route('**/api/calendar-events**',async function(routeHandler){
        const request=routeHandler.request();
        const url=new URL(request.url());
        requestUrls.push(url.pathname+url.search);
        if(request.method()==='GET'){
          await routeHandler.fulfill({status:200,contentType:'application/json',body:JSON.stringify({events:[syntheticEvent]})});
          return;
        }
        await routeHandler.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:{code:'synthetic_qa_read_only',message:'Synthetic calendar QA is read-only.'}})});
      });
      await context.addInitScript(function(language){localStorage.setItem('preferredLanguage',language);},lang);
      const page=await context.newPage();
      try{
        await page.goto(BASE+'/CouplesCalendar',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForTimeout(500);

        const todayButton=page.getByRole('button',{name:copy.today,exact:true}).first();
        if(!(await todayButton.count())){
          add('critical','calendar-today-filter-missing',{lang:lang});
        }else{
          requestUrls.length=0;
          await todayButton.click();
          await page.waitForTimeout(500);
          const expectedLocal=await page.evaluate(function(){
            const now=new Date();
            return String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
          });
          const todayRequest=requestUrls.map(function(value){return new URL(value,'https://qa.invalid');}).find(function(url){
            return url.pathname==='/api/calendar-events' && url.searchParams.get('startDate');
          });
          const actualStart=todayRequest ? todayRequest.searchParams.get('startDate') : null;
          const actualEnd=todayRequest ? todayRequest.searchParams.get('endDate') : null;
          if(actualStart!==expectedLocal || actualEnd!==expectedLocal){
            add('critical','calendar-today-local-query-date',{lang:lang,expected:expectedLocal,startDate:actualStart,endDate:actualEnd,requests:requestUrls});
          }
        }

        const listButton=page.getByRole('button',{name:copy.list,exact:true}).first();
        if(!(await listButton.count())){
          add('critical','calendar-list-view-missing',{lang:lang});
        }else{
          await listButton.click();
          const dateNode=page.locator('[data-calendar-event-date="2026-09-22"]').first();
          await dateNode.waitFor({state:'visible',timeout:5000}).catch(function(){});
          if(!(await dateNode.count())){
            add('critical','calendar-event-date-node-missing',{lang:lang});
          }else{
            const expected=await page.evaluate(function(locale){
              return new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',day:'numeric'}).format(new Date('2026-09-22T00:00:00'));
            },copy.locale);
            const actual=normalizeText(await dateNode.innerText());
            if(actual!==normalizeText(expected)){
              add('critical','calendar-event-local-date-display',{lang:lang,expected:expected,actual:actual});
            }
          }
        }
      }catch(e){
        add('critical','calendar-date-audit',{lang:lang,message:String(e.message||e),screenshot:await screenshot(page,'calendar_date_'+lang)});
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
