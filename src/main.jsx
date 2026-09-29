import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWithAuth from './AppWithAuth.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles/globals.css'

// Build version: 2024-12-10-v2
// The boundary sits outside StrictMode so it still catches errors thrown during
// StrictMode's second render pass in development.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <React.StrictMode>
      <AppWithAuth />
    </React.StrictMode>
  </ErrorBoundary>,
)
