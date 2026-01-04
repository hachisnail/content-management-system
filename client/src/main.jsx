import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ConfigProvider } from './context/ConfigContext.jsx' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider> {/* Wrap everything so config is available globally */}
      <App />
    </ConfigProvider>
  </StrictMode>,
)