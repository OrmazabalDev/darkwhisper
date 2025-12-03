import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider, CryptoProvider, ChatProvider, DMProvider } from './contexts'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <CryptoProvider>
      <ChatProvider>
        <DMProvider>
          <App />
        </DMProvider>
      </ChatProvider>
    </CryptoProvider>
  </AuthProvider>
)
