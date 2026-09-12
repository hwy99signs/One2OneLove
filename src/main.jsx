import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

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

if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
}

document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null
    const control = target?.closest('a, button, [role="button"]')

    if (!isPlatformBackControl(control)) return

    event.preventDefault()
    event.stopPropagation()
    window.history.back()
}, true)

window.addEventListener('popstate', () => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        })
    })
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 
