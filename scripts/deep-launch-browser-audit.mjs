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
    await context.addInitScript(function(language) {
      try { localStorage.setItem('preferredLanguage', language); } catch {}
    }, lang);
    const page = await context.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const serverErrors = [];
    page.on('pageerror', function(err){ pageErrors.push(String(err && err.message || err)); });
    page.on('console', function(msg){ if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('response', function(res) {
      try {
        const u = new URL(res.url());
        if (u.origin === BASE && res.status() >= 500) serverErrors.push({ url: u.pathname, status: res.status() });
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
    const page = await context.newPage();
    try {
      const res = await page.goto(BASE + route, { waitUntil:'domcontentloaded', timeout:30000 });
      await page.waitForTimeout(300);
      if (!res || res.status() !== 200) add('critical','protected-route-status',{ route:route, status:res && res.status() });
      const finalPath = new URL(page.url()).pathname.toLowerCase();
      if (!['/signin','/login'].includes(finalPath)) add('critical','protected-route-guard',{ route:route, finalPath:finalPath });
    } catch (e) {
      add('critical','protected-route-navigation',{ route:route, message:String(e.message || e) });
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
      } else add('critical','language-picker-option',{ message:'Spanish option was not selectable.' });
    } else add('critical','language-picker-missing',{ message:'No language combobox was found on Home.' });
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport:{ width:390, height:844 } });
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
      mobileLoads: 5 * Object.keys(LANGS).length,
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
