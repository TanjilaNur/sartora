import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './api/tokenRefresh';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
