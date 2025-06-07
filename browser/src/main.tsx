import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CHANNELS } from './shared/ipcChannels';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on(CHANNELS.MAIN_PROCESS_MESSAGE, (_event, message) => {
  console.log(message)
})
