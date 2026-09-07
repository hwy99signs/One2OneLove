import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/brandName.css'
import { installBrandNameNormalizer } from '@/brandName.js'

installBrandNameNormalizer()

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 
