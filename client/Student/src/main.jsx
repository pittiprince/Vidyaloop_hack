import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import UserLoginProvider from './context/UserLogin.jsx'

createRoot(document.getElementById('root')).render(
  <UserLoginProvider>
       <App />
    </UserLoginProvider>
);
