import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import RootErrorBoundary from '@/components/system/RootErrorBoundary.jsx'
import { installRuntimeLocalization } from '@/utils/runtimeLocalization'
import { installStaticUiLocalization } from '@/utils/staticUiLocalization'
import { installI18nFallbackLocalization } from '@/utils/i18nFallbackLocalization'
import '@/index.css'
import { installClickAnalytics, installPresenceHeartbeat } from '@/lib/interactionAnalytics'

// One front door (2026-10-12): session cookies are host-only, so the
// app must never RUN on www — a member signed in at the apex looked
// signed out there. The worker redirects every path it serves first;
// this guard covers the asset-served routes the worker never sees.
// It runs before anything renders.
if (window.location.hostname === 'www.one2onelove.com') {
    window.location.replace(
        'https://one2onelove.com' + window.location.pathname + window.location.search + window.location.hash
    )
}

// Deep-link aliases (owner fix, 2026-10-19): the natural short names people
// type and share - /Terms, /Privacy, /Studio - have no routes of their own,
// so they landed on the SPA "Page Not Found" even though the pages exist.
// Send them to the canonical pages before anything renders, preserving the
// query string and hash, the same way the www guard above works. Matching
// is case-insensitive and tolerates a trailing slash. The canonical paths
// themselves (/termsofservice, /privacypolicy, /o2olstudio) are NOT aliases,
// so the site's own footer routes never take an extra hop, and unknown
// routes still fall through to the SPA not-found page untouched.
const DEEP_LINK_ALIASES = {
    '/terms': '/TermsOfService',
    '/privacy': '/PrivacyPolicy',
    '/studio': '/O2OLStudio',
}
const deepLinkPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/'
if (DEEP_LINK_ALIASES[deepLinkPath]) {
    window.location.replace(
        DEEP_LINK_ALIASES[deepLinkPath] + window.location.search + window.location.hash
    )
}

installRuntimeLocalization()
installStaticUiLocalization()
installI18nFallbackLocalization()
installClickAnalytics()
installPresenceHeartbeat()

const BACK_LABELS = ['back', 'volver', 'retour', 'indietro', 'zurück', 'terug', 'voltar']

function isPlatformBackControl(control) {
    if (!control) return false
    if (control.matches('[data-back-button="true"]')) return true
    if (control.querySelector('.lucide-arrow-left')) return true

    const text = (control.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const ariaLabel = (control.getAttribute('aria-label') || '').trim().toLowerCase()

    return BACK_LABELS.some((label) =>
        text === label ||
        text.startsWith(`${label} `) ||
        ariaLabel === label ||
        ariaLabel.startsWith(`${label} `)
    )
}

function scrollPageToTop() {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
            document.documentElement.scrollTop = 0
            document.body.scrollTop = 0
        })
    })
}

if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
}

const originalPushState = window.history.pushState
const originalReplaceState = window.history.replaceState

window.history.pushState = function (...args) {
    const previousUrl = window.location.href
    const result = originalPushState.apply(window.history, args)
    if (window.location.href !== previousUrl) scrollPageToTop()
    return result
}

window.history.replaceState = function (...args) {
    const previousUrl = window.location.href
    const result = originalReplaceState.apply(window.history, args)
    if (window.location.href !== previousUrl) scrollPageToTop()
    return result
}

document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const control = target?.closest('a, button, [role="button"]')

    if (!isPlatformBackControl(control)) return

    event.preventDefault()
    event.stopPropagation()
    window.history.back()
}, true)

window.addEventListener('popstate', scrollPageToTop)

ReactDOM.createRoot(document.getElementById('root')).render(
        <RootErrorBoundary>
        <App />
    </RootErrorBoundary>
)
