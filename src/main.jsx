import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/hero-frame-lock.css'

// Always start a newly navigated screen at the top.
// This applies to React Router links/buttons as well as browser back/forward navigation.
const scrollToPageTop = () => {
    window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
}

const originalPushState = window.history.pushState
const originalReplaceState = window.history.replaceState

window.history.pushState = function (...args) {
    const result = originalPushState.apply(this, args)
    scrollToPageTop()
    return result
}

window.history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args)
    scrollToPageTop()
    return result
}

window.addEventListener('popstate', scrollToPageTop)

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 